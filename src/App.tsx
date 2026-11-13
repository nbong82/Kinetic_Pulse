import { useEffect, useState } from 'react';
import { LiveTrackScreen, LiveRunState } from './components/LiveTrackScreen';
import { LogRunScreen } from './components/LogRunScreen';
import { SplitAnalyticsScreen } from './components/SplitAnalyticsScreen';
import { TopNav } from './components/TopNav';
import { TrainingLogScreen } from './components/TrainingLogScreen';
import {
  LiveSessionDraft,
  RunSession,
  ScreenId,
  SplitRecord,
} from './types/telemetry';
import { createSeedRuns, getHrZone } from './utils/telemetryMath';

const STORAGE_KEY = 'kinetic_pulse_runs_v1';

const INITIAL_LIVE_STATE: LiveRunState = {
  isRunning: false,
  elapsedSec: 0,
  distanceKm: 0,
  currentPaceSecPerKm: 256, // 4:16 /km
  currentHr: 156,
  currentCadence: 180,
  elevationGainM: 0,
  gpsLocked: true,
  autoPause: true,
  splits: [],
  lastSplitElapsedSec: 0,
  lastSplitDistKm: 0,
};

function loadInitialRuns(): RunSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RunSession[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seeded endurance sessions
  }
  return createSeedRuns();
}

export default function App() {
  const [runs, setRuns] = useState<RunSession[]>(loadInitialRuns);
  const [activeScreen, setActiveScreen] = useState<ScreenId>('log');
  const [selectedRunId, setSelectedRunId] = useState<string>(
    () => loadInitialRuns()[0]?.id ?? ''
  );
  const [liveDraft, setLiveDraft] = useState<LiveSessionDraft | null>(null);
  const [liveState, setLiveState] = useState<LiveRunState>(INITIAL_LIVE_STATE);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
    } catch {
      // Ignore storage quota errors
    }
  }, [runs]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // 1Hz real-time GPS & stopwatch simulator when live session is active
  useEffect(() => {
    if (!liveState.isRunning) return;
    const interval = window.setInterval(() => {
      setLiveState((prev) => {
        if (!prev.isRunning) return prev;
        const nextElapsed = prev.elapsedSec + 1;
        // Realistic pace oscillation around ~4:15/km
        const wave = Math.round(Math.sin(nextElapsed * 0.25) * 6);
        const paceSec = 255 + wave;
        const kmPerSec = 1 / paceSec;
        const nextDist = prev.distanceKm + kmPerSec;

        const nextHr = Math.max(
          135,
          Math.min(
            188,
            Math.round(156 + Math.min(18, nextElapsed / 35) + Math.sin(nextElapsed * 0.2) * 3)
          )
        );
        const nextCadence = 180 + Math.round(Math.cos(nextElapsed * 0.3) * 2);
        const nextElev =
          prev.elevationGainM + (nextElapsed % 12 === 0 ? 1 : 0);

        const nextSplits = [...prev.splits];
        let lastSplitElapsed = prev.lastSplitElapsedSec;
        let lastSplitDist = prev.lastSplitDistKm;

        // Auto-record 1.00 km split
        if (nextDist - lastSplitDist >= 1.0) {
          const lapNum = nextSplits.length + 1;
          const lapDuration = nextElapsed - lastSplitElapsed;
          const elevDelta = 4 + ((lapNum * 3) % 11);
          const newSplit: SplitRecord = {
            lap: lapNum,
            distanceKm: 1.0,
            paceSecPerKm: Math.max(170, lapDuration),
            elevDeltaM: elevDelta,
            elevProfile: [10, 12, 15, 14, 18, 17],
            avgHr: nextHr,
            cadence: nextCadence,
            zone: getHrZone(nextHr),
          };
          nextSplits.push(newSplit);
          lastSplitElapsed = nextElapsed;
          lastSplitDist = Number(nextDist.toFixed(2));
        }

        return {
          ...prev,
          elapsedSec: nextElapsed,
          distanceKm: nextDist,
          currentPaceSecPerKm: paceSec,
          currentHr: nextHr,
          currentCadence: nextCadence,
          elevationGainM: nextElev,
          splits: nextSplits,
          lastSplitElapsedSec: lastSplitElapsed,
          lastSplitDistKm: lastSplitDist,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [liveState.isRunning]);

  const handleMarkSplit = () => {
    setLiveState((prev) => {
      const distDelta = Math.max(
        0.1,
        Number((prev.distanceKm - prev.lastSplitDistKm).toFixed(2))
      );
      const timeDelta = Math.max(1, prev.elapsedSec - prev.lastSplitElapsedSec);
      const pace = Math.round(timeDelta / distDelta);
      const lapNum = prev.splits.length + 1;
      const newSplit: SplitRecord = {
        lap: lapNum,
        distanceKm: distDelta,
        paceSecPerKm: Math.max(165, Math.min(480, pace)),
        elevDeltaM: 5,
        elevProfile: [9, 13, 12, 16, 15, 18],
        avgHr: prev.currentHr,
        cadence: prev.currentCadence,
        zone: getHrZone(prev.currentHr),
      };
      return {
        ...prev,
        splits: [...prev.splits, newSplit],
        lastSplitElapsedSec: prev.elapsedSec,
        lastSplitDistKm: Number(prev.distanceKm.toFixed(2)),
      };
    });
  };

  const handleSimulateKm = () => {
    setLiveState((prev) => {
      const lapNum = prev.splits.length + 1;
      const simulatedPace = 248 + ((lapNum * 7) % 19) - 6; // ~4:02 - 4:21 /km
      const elevDelta = ((lapNum * 5) % 16) - 3;
      const lapHr = Math.min(186, 156 + lapNum * 2);
      const lapCadence = 181 + (lapNum % 4);
      const nextDist = Number((prev.distanceKm + 1.0).toFixed(2));
      const nextElapsed = prev.elapsedSec + simulatedPace;
      const newSplit: SplitRecord = {
        lap: lapNum,
        distanceKm: 1.0,
        paceSecPerKm: simulatedPace,
        elevDeltaM: elevDelta,
        elevProfile: [10, 14, 12, 17, 19, 16],
        avgHr: lapHr,
        cadence: lapCadence,
        zone: getHrZone(lapHr),
      };
      return {
        ...prev,
        elapsedSec: nextElapsed,
        distanceKm: nextDist,
        currentPaceSecPerKm: simulatedPace,
        currentHr: lapHr,
        currentCadence: lapCadence,
        elevationGainM: prev.elevationGainM + Math.max(0, elevDelta),
        splits: [...prev.splits, newSplit],
        lastSplitElapsedSec: nextElapsed,
        lastSplitDistKm: nextDist,
      };
    });
  };

  const handleFinishLiveToLog = (draft: LiveSessionDraft) => {
    setLiveState(INITIAL_LIVE_STATE);
    setLiveDraft(draft);
    setActiveScreen('log');
    setToastMessage('Live telemetry transferred to Log Run.');
  };

  const handleSaveRun = (newRun: RunSession) => {
    setRuns((prev) => [newRun, ...prev]);
    setSelectedRunId(newRun.id);
    setLiveDraft(null);
    setActiveScreen('analytics');
    setToastMessage(`Saved "${newRun.title}" (${newRun.distanceKm.toFixed(1)} km).`);
  };

  const handleDeleteRun = (runId: string) => {
    setRuns((prev) => {
      const next = prev.filter((r) => r.id !== runId);
      if (selectedRunId === runId) {
        setSelectedRunId(next[0]?.id ?? '');
      }
      return next;
    });
    setToastMessage('Run removed from training log.');
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <TopNav
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        isLiveRunning={liveState.isRunning}
      />

      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 right-5 z-50 rounded-lg border border-[#10E66A]/40 bg-[#1F2636] px-4 py-2.5 font-mono text-xs uppercase tracking-[0.06em] text-[#10E66A] shadow-[0_0_24px_-4px_rgba(16,230,106,0.25)]"
        >
          {toastMessage}
        </div>
      )}

      <main>
        {activeScreen === 'live' && (
          <LiveTrackScreen
            liveState={liveState}
            onToggleRun={() =>
              setLiveState((prev) => ({ ...prev, isRunning: !prev.isRunning }))
            }
            onMarkSplit={handleMarkSplit}
            onSimulateKm={handleSimulateKm}
            onReset={() => setLiveState(INITIAL_LIVE_STATE)}
            onFinishToLog={handleFinishLiveToLog}
            onToggleAutoPause={() =>
              setLiveState((prev) => ({ ...prev, autoPause: !prev.autoPause }))
            }
          />
        )}

        {activeScreen === 'log' && (
          <LogRunScreen
            draft={liveDraft}
            onSaveRun={handleSaveRun}
            onDiscardDraft={() => {
              setLiveDraft(null);
              setToastMessage('Session inputs reset.');
            }}
          />
        )}

        {activeScreen === 'analytics' && (
          <SplitAnalyticsScreen
            runs={runs}
            selectedRunId={selectedRunId}
            onSelectRun={setSelectedRunId}
            onDeleteRun={handleDeleteRun}
            onNavigateToLog={() => setActiveScreen('log')}
          />
        )}

        {activeScreen === 'logbook' && (
          <TrainingLogScreen
            runs={runs}
            onInspectRun={(id) => {
              setSelectedRunId(id);
              setActiveScreen('analytics');
            }}
            onNavigateToLog={() => setActiveScreen('log')}
          />
        )}
      </main>
    </div>
  );
}
