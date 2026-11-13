import React, { useMemo } from 'react';
import {
  FastForward,
  Flag,
  MapPin,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { LiveSessionDraft, SplitRecord } from '../types/telemetry';
import {
  formatDuration,
  formatPace,
  getHrZone,
  getZoneColor,
} from '../utils/telemetryMath';
import { SplitLogTable } from './SplitLogTable';

export interface LiveRunState {
  isRunning: boolean;
  elapsedSec: number;
  distanceKm: number;
  currentPaceSecPerKm: number;
  currentHr: number;
  currentCadence: number;
  elevationGainM: number;
  gpsLocked: boolean;
  autoPause: boolean;
  splits: SplitRecord[];
  lastSplitElapsedSec: number;
  lastSplitDistKm: number;
}

interface LiveTrackScreenProps {
  liveState: LiveRunState;
  onToggleRun: () => void;
  onMarkSplit: () => void;
  onSimulateKm: () => void;
  onReset: () => void;
  onFinishToLog: (draft: LiveSessionDraft) => void;
  onToggleAutoPause: () => void;
}

const ROUTE_POINTS: [number, number][] = [
  [48, 175],
  [76, 145],
  [118, 128],
  [164, 134],
  [208, 108],
  [248, 72],
  [298, 62],
  [342, 82],
  [358, 125],
  [334, 162],
  [288, 176],
  [234, 168],
  [182, 186],
  [124, 194],
  [72, 188],
  [48, 175],
];

export const LiveTrackScreen: React.FC<LiveTrackScreenProps> = ({
  liveState,
  onToggleRun,
  onMarkSplit,
  onSimulateKm,
  onReset,
  onFinishToLog,
  onToggleAutoPause,
}) => {
  const avgPaceSec =
    liveState.distanceKm > 0.05
      ? Math.round(liveState.elapsedSec / liveState.distanceKm)
      : liveState.currentPaceSecPerKm;

  const zone = getHrZone(liveState.currentHr);
  const zoneStyle = getZoneColor(zone);

  // Compute active route progress along closed 10km loop
  const progressFraction = (liveState.distanceKm % 10) / 10;
  const { fullPath, activePath, headPoint } = useMemo(() => {
    const pts = ROUTE_POINTS;
    const full = `M ${pts.map((p) => `${p[0]},${p[1]}`).join(' L ')}`;
    const segCount = pts.length - 1;
    const exactIndex = Math.max(0.02, progressFraction) * segCount;
    const whole = Math.min(segCount - 1, Math.floor(exactIndex));
    const frac = exactIndex - whole;

    const activePts = pts.slice(0, whole + 1);
    const pA = pts[whole];
    const pB = pts[whole + 1];
    const hx = pA[0] + (pB[0] - pA[0]) * frac;
    const hy = pA[1] + (pB[1] - pA[1]) * frac;
    activePts.push([hx, hy]);

    return {
      fullPath: full,
      activePath: `M ${activePts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')}`,
      headPoint: { x: hx, y: hy },
    };
  }, [progressFraction]);

  const handleFinish = () => {
    const finalizedSplits = [...liveState.splits];
    const remainingDist = Number(
      (liveState.distanceKm - liveState.lastSplitDistKm).toFixed(2)
    );
    const remainingTime = liveState.elapsedSec - liveState.lastSplitElapsedSec;

    if (remainingDist >= 0.05 && remainingTime > 0) {
      const lapNum = finalizedSplits.length + 1;
      const splitPace = Math.round(remainingTime / remainingDist);
      finalizedSplits.push({
        lap: lapNum,
        distanceKm: remainingDist,
        paceSecPerKm: splitPace,
        elevDeltaM: Math.round(
          liveState.elevationGainM / Math.max(1, lapNum)
        ),
        elevProfile: [10, 14, 13, 17, 19, 18],
        avgHr: liveState.currentHr,
        cadence: liveState.currentCadence,
        zone: getHrZone(liveState.currentHr),
      });
    }

    onFinishToLog({
      title: 'Live Night Telemetry Session',
      distanceKm: Number(Math.max(0.5, liveState.distanceKm).toFixed(2)),
      durationSec: Math.max(60, liveState.elapsedSec),
      avgHr: liveState.currentHr,
      avgCadence: liveState.currentCadence,
      elevationGainM: liveState.elevationGainM,
      terrain: 'Road',
      workoutType: 'Tempo',
      splits: finalizedSplits,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-6 pt-5 pb-24 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Primary Telemetry Column */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Upper Route Map & Contextual Badges */}
          <section className="kp-card rounded-lg overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#10E66A]/35 bg-[#10E66A]/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#10E66A]">
                  {liveState.isRunning && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10E66A] animate-pulse" />
                  )}
                  <MapPin className="h-3 w-3" />
                  <span>{liveState.gpsLocked ? 'GPS LOCKED' : 'ACQUIRING'}</span>
                </span>

                <button
                  type="button"
                  onClick={onToggleAutoPause}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer ${
                    liveState.autoPause
                      ? 'border-[#38E1FF]/40 bg-[#38E1FF]/10 text-[#38E1FF]'
                      : 'border-white/10 bg-white/[0.03] text-[#8B949E]'
                  }`}
                >
                  AUTO-PAUSE {liveState.autoPause ? 'ON' : 'OFF'}
                </button>
              </div>

              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E] tabular-nums">
                LOOP 10.0 KM · 37.8044° N
              </span>
            </div>

            {/* SVG Night Topographic Route Viewport */}
            <div className="relative bg-[#0A0E14] px-4 py-3">
              <svg
                viewBox="0 0 400 220"
                className="w-full h-44 sm:h-52"
                role="img"
                aria-label="Live GPS route trace"
              >
                <defs>
                  <pattern
                    id="kp-grid"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <filter id="volt-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width="400" height="220" fill="url(#kp-grid)" />

                {/* Topographic contour rings */}
                <ellipse
                  cx="220"
                  cy="125"
                  rx="135"
                  ry="72"
                  fill="none"
                  stroke="rgba(56, 225, 255, 0.07)"
                  strokeDasharray="4 4"
                />
                <ellipse
                  cx="220"
                  cy="125"
                  rx="88"
                  ry="45"
                  fill="none"
                  stroke="rgba(56, 225, 255, 0.06)"
                />

                {/* Full planned track */}
                <path
                  d={fullPath}
                  fill="none"
                  stroke="#1E2638"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Traversed glowing route */}
                <path
                  d={activePath}
                  fill="none"
                  stroke="#10E66A"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#volt-glow)"
                />

                {/* Start marker */}
                <circle
                  cx={ROUTE_POINTS[0][0]}
                  cy={ROUTE_POINTS[0][1]}
                  r="4"
                  fill="#0D1117"
                  stroke="#38E1FF"
                  strokeWidth="2"
                />

                {/* Live Runner Beacon */}
                <circle
                  cx={headPoint.x}
                  cy={headPoint.y}
                  r="9"
                  fill="rgba(16, 230, 106, 0.22)"
                />
                <circle
                  cx={headPoint.x}
                  cy={headPoint.y}
                  r="4.5"
                  fill="#10E66A"
                  stroke="#0D1117"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Corner Telemetry Overlay */}
              <div className="mt-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                <span>SEAWALL CIRCUIT</span>
                <span className="tabular-nums text-[#38E1FF]">
                  ELEV +{liveState.elevationGainM} M
                </span>
              </div>
            </div>
          </section>

          {/* Primary Center Metrics: Elapsed Timer + Split Pace + Distance */}
          <section className="kp-card-active rounded-lg p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div>
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                  ELAPSED TIME
                </div>
                <div className="mt-1 font-mono text-[42px] sm:text-[56px] font-bold leading-none tracking-[-0.04em] text-white tabular-nums">
                  {formatDuration(liveState.elapsedSec)}
                </div>
              </div>

              <div className="flex items-baseline gap-6">
                <div>
                  <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                    DISTANCE
                  </div>
                  <div className="mt-1 font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
                    {liveState.distanceKm.toFixed(2)}
                    <span className="ml-1.5 text-sm font-medium text-[#8B949E]">
                      KM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Column Modular Telemetry Grid */}
            <div className="mt-5 grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded bg-[#0D1117]/70 border border-white/[0.06] p-3 sm:p-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                  CURR PACE
                </div>
                <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#10E66A] tabular-nums">
                  {formatPace(liveState.currentPaceSecPerKm)}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#8B949E] tabular-nums">
                  AVG {formatPace(avgPaceSec)} /KM
                </div>
              </div>

              <div className="rounded bg-[#0D1117]/70 border border-white/[0.06] p-3 sm:p-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                  HEART RATE
                </div>
                <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {liveState.currentHr}
                  <span className="ml-1 text-xs font-medium text-[#8B949E]">
                    BPM
                  </span>
                </div>
                <div className={`mt-1 font-mono text-[11px] font-semibold ${zoneStyle.text}`}>
                  {zoneStyle.label}
                </div>
              </div>

              <div className="rounded bg-[#0D1117]/70 border border-white/[0.06] p-3 sm:p-4">
                <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                  CADENCE
                </div>
                <div className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-[#38E1FF] tabular-nums">
                  {liveState.currentCadence}
                  <span className="ml-1 text-xs font-medium text-[#8B949E]">
                    SPM
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#8B949E] tabular-nums">
                  +{liveState.elevationGainM}M GAIN
                </div>
              </div>
            </div>

            {/* Thumb-Zone Hardware Controls */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={onToggleRun}
                className={`col-span-2 sm:col-span-1 flex min-h-[52px] items-center justify-center gap-2 rounded-lg font-display text-sm font-black uppercase tracking-[0.04em] cursor-pointer transition-all ${
                  liveState.isRunning
                    ? 'bg-[#1E2638] border border-white/20 text-white hover:bg-[#2A354C]'
                    : 'btn-volt-anchor'
                }`}
              >
                {liveState.isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>PAUSE</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>{liveState.elapsedSec > 0 ? 'RESUME' : 'START'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onMarkSplit}
                disabled={liveState.elapsedSec === 0}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded bg-[#1E2638] border border-white/12 px-3 font-display text-xs font-bold uppercase tracking-[0.05em] text-white hover:bg-[#2A354C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <Flag className="h-4 w-4 text-[#10E66A]" />
                <span>MARK SPLIT</span>
              </button>

              <button
                type="button"
                onClick={onSimulateKm}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded bg-[#1E2638] border border-white/12 px-3 font-display text-xs font-bold uppercase tracking-[0.05em] text-[#38E1FF] hover:bg-[#2A354C] cursor-pointer transition-colors"
                title="Advance live session by 1.0 km for quick split testing"
              >
                <FastForward className="h-4 w-4" />
                <span>+1 KM LAP</span>
              </button>

              <button
                type="button"
                onClick={onReset}
                disabled={liveState.elapsedSec === 0 && liveState.splits.length === 0}
                className="flex min-h-[52px] items-center justify-center gap-2 rounded border border-[#FF4D4D]/25 bg-transparent px-3 font-display text-xs font-bold uppercase tracking-[0.05em] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>RESET</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Live Split Log & Finish Action */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <section className="kp-card rounded-lg p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Live Split Feed
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                  {liveState.splits.length} RECORDED LAPS · TABULAR TELEMETRY
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#10E66A] tabular-nums">
                LAP #{liveState.splits.length + 1}
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              <SplitLogTable
                splits={liveState.splits}
                avgPaceSecPerKm={avgPaceSec}
              />
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleFinish}
                disabled={liveState.distanceKm < 0.05 && liveState.elapsedSec < 10}
                className="btn-volt-anchor w-full min-h-[56px] rounded-lg px-6 text-sm tracking-[0.06em] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                FINISH &amp; TRANSFER TO LOG RUN
              </button>
              <p className="mt-2.5 text-center font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                RECORD OR TAP +1 KM LAP TO CAPTURE SPLITS BEFORE SAVING
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
