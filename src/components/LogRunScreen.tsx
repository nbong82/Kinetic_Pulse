import React, { useEffect, useMemo, useState } from 'react';
import {
  Minus,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  LiveSessionDraft,
  RunSession,
  SplitRecord,
  TerrainType,
  WorkoutType,
} from '../types/telemetry';
import {
  BASELINE_PACE_SEC,
  formatDurationHms,
  formatPace,
  formatPaceDelta,
  generateSplitsForRun,
} from '../utils/telemetryMath';
import {
  HardwareCheckbox,
  HardwareToggle,
  SelectorChip,
} from './HardwareControls';
import { SplitLogTable } from './SplitLogTable';

interface LogRunScreenProps {
  draft?: LiveSessionDraft | null;
  onSaveRun: (run: RunSession) => void;
  onDiscardDraft: () => void;
}

const WORKOUT_TYPES: WorkoutType[] = [
  'Tempo',
  'Long Run',
  'Intervals',
  'Recovery',
  'Race',
  'Base',
];

const TERRAINS: TerrainType[] = ['Road', 'Trail', 'Track', 'Treadmill'];

export const LogRunScreen: React.FC<LogRunScreenProps> = ({
  draft,
  onSaveRun,
  onDiscardDraft,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(draft?.title ?? 'Morning Threshold Run');
  const [dateIso, setDateIso] = useState(todayIso);
  const [startTime, setStartTime] = useState('06:15');

  const [distanceKm, setDistanceKm] = useState<number>(draft?.distanceKm ?? 10.0);
  const initialHms = formatDurationHms(draft?.durationSec ?? 2640); // 44:00 default
  const [hours, setHours] = useState<number>(initialHms.hours);
  const [minutes, setMinutes] = useState<number>(initialHms.minutes);
  const [seconds, setSeconds] = useState<number>(initialHms.seconds);

  const [avgHr, setAvgHr] = useState<number>(draft?.avgHr ?? 162);
  const [avgCadence, setAvgCadence] = useState<number>(draft?.avgCadence ?? 180);
  const [elevationGainM, setElevationGainM] = useState<number>(
    draft?.elevationGainM ?? 85
  );

  const [workoutType, setWorkoutType] = useState<WorkoutType>(
    draft?.workoutType ?? 'Tempo'
  );
  const [terrain, setTerrain] = useState<TerrainType>(draft?.terrain ?? 'Road');

  const [autoPause, setAutoPause] = useState(true);
  const [gpsHighPrecision, setGpsHighPrecision] = useState(true);
  const [isRaceEffort, setIsRaceEffort] = useState(false);
  const [includeInLoad, setIncludeInLoad] = useState(true);
  const [notes, setNotes] = useState('');

  const [seedOffset, setSeedOffset] = useState(14);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when incoming live draft changes
  useEffect(() => {
    if (!draft) return;
    setTitle(draft.title);
    setDistanceKm(draft.distanceKm);
    const hms = formatDurationHms(draft.durationSec);
    setHours(hms.hours);
    setMinutes(hms.minutes);
    setSeconds(hms.seconds);
    setAvgHr(draft.avgHr);
    setAvgCadence(draft.avgCadence);
    setElevationGainM(draft.elevationGainM);
    setTerrain(draft.terrain);
    setWorkoutType(draft.workoutType);
  }, [draft]);

  const totalDurationSec = useMemo(
    () => Math.max(1, hours * 3600 + minutes * 60 + seconds),
    [hours, minutes, seconds]
  );

  const avgPaceSecPerKm = useMemo(() => {
    if (distanceKm <= 0) return 0;
    return Math.round(totalDurationSec / distanceKm);
  }, [totalDurationSec, distanceKm]);

  const baselineDelta = useMemo(
    () => formatPaceDelta(avgPaceSecPerKm, BASELINE_PACE_SEC),
    [avgPaceSecPerKm]
  );

  const previewSplits: SplitRecord[] = useMemo(() => {
    if (draft?.splits && draft.splits.length > 0 && Math.abs(draft.distanceKm - distanceKm) < 0.05) {
      return draft.splits;
    }
    return generateSplitsForRun({
      distanceKm: Math.max(0.5, distanceKm),
      durationSec: totalDurationSec,
      avgHr,
      avgCadence,
      elevationGainM,
      terrain,
      workoutType,
      seedOffset,
    });
  }, [
    draft,
    distanceKm,
    totalDurationSec,
    avgHr,
    avgCadence,
    elevationGainM,
    terrain,
    workoutType,
    seedOffset,
  ]);

  const stepDistance = (delta: number) => {
    setErrorMsg(null);
    setDistanceKm((prev) =>
      Math.max(0.5, Math.min(200, Number((prev + delta).toFixed(1))))
    );
  };

  const stepDurationPart = (
    part: 'hr' | 'min' | 'sec',
    delta: number
  ) => {
    setErrorMsg(null);
    if (part === 'hr') {
      setHours((h) => Math.max(0, Math.min(24, h + delta)));
    } else if (part === 'min') {
      setMinutes((m) => {
        const next = m + delta;
        if (next >= 60) {
          setHours((h) => Math.min(24, h + 1));
          return next - 60;
        }
        if (next < 0) {
          if (hours > 0) {
            setHours((h) => h - 1);
            return 60 + next;
          }
          return 0;
        }
        return next;
      });
    } else {
      setSeconds((s) => {
        const next = s + delta;
        if (next >= 60) {
          setMinutes((m) => Math.min(59, m + 1));
          return next - 60;
        }
        if (next < 0) {
          if (minutes > 0) {
            setMinutes((m) => m - 1);
            return 60 + next;
          }
          return 0;
        }
        return next;
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (distanceKm <= 0) {
      setErrorMsg('Distance must be greater than 0.0 km.');
      return;
    }
    if (totalDurationSec < 30) {
      setErrorMsg('Duration must be at least 30 seconds.');
      return;
    }

    const cleanTitle = title.trim() || `${workoutType} ${distanceKm.toFixed(1)}K`;
    const maxHr = Math.max(
      avgHr + 8,
      ...previewSplits.map((s) => s.avgHr)
    );

    const newRun: RunSession = {
      id: `run-${Date.now()}`,
      title: cleanTitle,
      dateIso,
      startTime,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationSec: totalDurationSec,
      avgPaceSecPerKm,
      avgHr,
      maxHr: Math.min(210, maxHr),
      avgCadence,
      elevationGainM,
      workoutType,
      terrain,
      autoPause,
      gpsHighPrecision,
      isRaceEffort,
      includeInLoad,
      notes: notes.trim(),
      splits: previewSplits,
    };

    onSaveRun(newRun);
  };

  const handleDiscard = () => {
    setTitle('Morning Threshold Run');
    setDistanceKm(10.0);
    setHours(0);
    setMinutes(44);
    setSeconds(0);
    setAvgHr(162);
    setAvgCadence(180);
    setElevationGainM(85);
    setNotes('');
    setErrorMsg(null);
    onDiscardDraft();
  };

  return (
    <form
      onSubmit={handleSave}
      className="mx-auto max-w-7xl px-5 md:px-6 pt-5 pb-28 md:pb-14"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Log Run Telemetry
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.06em] text-[#8B949E]">
            MECHANICAL DIAL ENTRY · AUTO-COMPUTED PACE &amp; SPLIT MATRIX
          </p>
        </div>

        {/* Quick Distance Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: '5K', km: 5.0, sec: 1260 },
            { label: '10K', km: 10.0, sec: 2640 },
            { label: '21.1K', km: 21.1, sec: 5580 },
            { label: '42.2K', km: 42.2, sec: 11700 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setDistanceKm(preset.km);
                const hms = formatDurationHms(preset.sec);
                setHours(hms.hours);
                setMinutes(hms.minutes);
                setSeconds(hms.seconds);
              }}
              className="rounded border border-white/10 bg-[#1E2638] px-3 py-1.5 font-mono text-xs font-semibold text-[#dfe2eb] hover:border-[#10E66A]/60 hover:text-[#10E66A] transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-[#FF4D4D]/40 bg-[#FF4D4D]/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.06em] text-[#ffb4ab]"
        >
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Mechanical Segmented Dials & Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Distance & Calculated Pace Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Mechanical Distance Dial */}
            <div
              className={`sm:col-span-7 rounded-lg bg-[#161B26] p-4 transition-colors ${
                focusedField === 'distance'
                  ? 'border border-[#10E66A] shadow-[inset_0_0_0_1px_rgba(16,230,106,0.2)]'
                  : 'border border-[#242D3D]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="distance-input"
                  className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]"
                >
                  DISTANCE DIAL
                </label>
                <span className="font-mono text-[11px] font-semibold text-[#8B949E]">
                  KM
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => stepDistance(-0.5)}
                  aria-label="Decrease distance by 0.5 km"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#1E2638] border border-white/12 text-white hover:bg-[#2A354C] active:translate-y-[1px] cursor-pointer transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>

                <div className="flex items-baseline justify-center flex-1 min-w-0">
                  <input
                    id="distance-input"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="250"
                    value={distanceKm}
                    onFocus={() => setFocusedField('distance')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!Number.isNaN(val)) {
                        setDistanceKm(Math.max(0, Math.min(250, val)));
                      }
                    }}
                    className="w-28 bg-transparent text-center font-mono text-[32px] sm:text-[36px] font-bold leading-none text-white tabular-nums focus:outline-none"
                  />
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-[#8B949E]">
                    KM
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => stepDistance(0.5)}
                  aria-label="Increase distance by 0.5 km"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#1E2638] border border-white/12 text-white hover:bg-[#2A354C] active:translate-y-[1px] cursor-pointer transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Auto-Computed Active Pace Tile (Level 2 Active Surface) */}
            <div className="sm:col-span-5 kp-card-active rounded-lg p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                  AVG PACE
                </span>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#10E66A]">
                  LIVE CALC
                </span>
              </div>

              <div className="my-2 flex items-baseline gap-1.5">
                <span className="font-mono text-[34px] font-bold leading-none text-[#10E66A] tabular-nums">
                  {formatPace(avgPaceSecPerKm)}
                </span>
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-[#8B949E]">
                  /KM
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-xs font-semibold tabular-nums">
                {baselineDelta.isFaster ? (
                  <TrendingUp className="h-3.5 w-3.5 text-[#10E66A]" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-[#FF5C5C]" />
                )}
                <span
                  className={
                    baselineDelta.isNeutral
                      ? 'text-[#8B949E]'
                      : baselineDelta.isFaster
                      ? 'text-[#10E66A]'
                      : 'text-[#FF5C5C]'
                  }
                >
                  {baselineDelta.label}/km vs 30d avg (4:28)
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Cell Mechanical Segmented Duration Dial */}
          <div className="rounded-lg border border-[#242D3D] bg-[#161B26] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                DURATION SEGMENTED DIAL
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                HR : MIN : SEC
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  key: 'hr' as const,
                  label: 'HR',
                  value: hours,
                  max: 24,
                  step: 1,
                },
                {
                  key: 'min' as const,
                  label: 'MIN',
                  value: minutes,
                  max: 59,
                  step: 1,
                },
                {
                  key: 'sec' as const,
                  label: 'SEC',
                  value: seconds,
                  max: 59,
                  step: 5,
                },
              ].map((cell) => (
                <div
                  key={cell.key}
                  className={`rounded bg-[#0D1117] p-3 transition-colors ${
                    focusedField === cell.key
                      ? 'border border-[#10E66A]'
                      : 'border border-[#242D3D]'
                  }`}
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <input
                      type="number"
                      min={0}
                      max={cell.max}
                      value={cell.value.toString().padStart(2, '0')}
                      onFocus={() => setFocusedField(cell.key)}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(cell.max, parseInt(e.target.value || '0', 10))
                        );
                        if (cell.key === 'hr') setHours(val);
                        if (cell.key === 'min') setMinutes(val);
                        if (cell.key === 'sec') setSeconds(val);
                      }}
                      className="w-16 bg-transparent font-mono text-[28px] sm:text-[34px] font-bold leading-none text-white tabular-nums focus:outline-none"
                    />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8B949E]">
                      {cell.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => stepDurationPart(cell.key, -cell.step)}
                      aria-label={`Decrease ${cell.label}`}
                      className="flex h-11 items-center justify-center rounded bg-[#1E2638] border border-white/10 text-white hover:bg-[#2A354C] cursor-pointer transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepDurationPart(cell.key, cell.step)}
                      aria-label={`Increase ${cell.label}`}
                      className="flex h-11 items-center justify-center rounded bg-[#1E2638] border border-white/10 text-white hover:bg-[#2A354C] cursor-pointer transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Telemetry Steppers (BPM, Cadence, Elevation) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'HEART RATE',
                unit: 'BPM',
                value: avgHr,
                accent: 'text-white',
                onDec: () => setAvgHr((v) => Math.max(95, v - 2)),
                onInc: () => setAvgHr((v) => Math.min(205, v + 2)),
              },
              {
                label: 'CADENCE',
                unit: 'SPM',
                value: avgCadence,
                accent: 'text-[#38E1FF]',
                onDec: () => setAvgCadence((v) => Math.max(140, v - 2)),
                onInc: () => setAvgCadence((v) => Math.min(210, v + 2)),
              },
              {
                label: 'ELEV GAIN',
                unit: 'M',
                value: elevationGainM,
                accent: 'text-[#38E1FF]',
                onDec: () => setElevationGainM((v) => Math.max(0, v - 15)),
                onInc: () => setElevationGainM((v) => Math.min(4000, v + 15)),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[#242D3D] bg-[#161B26] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
                    {item.label}
                  </span>
                  <span className="font-mono text-[10px] font-semibold text-[#8B949E]">
                    {item.unit}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={item.onDec}
                    aria-label={`Decrease ${item.label}`}
                    className="flex h-11 w-11 items-center justify-center rounded bg-[#1E2638] border border-white/10 text-white hover:bg-[#2A354C] cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span
                    className={`font-mono text-2xl font-bold tabular-nums ${item.accent}`}
                  >
                    {item.value}
                  </span>
                  <button
                    type="button"
                    onClick={item.onInc}
                    aria-label={`Increase ${item.label}`}
                    className="flex h-11 w-11 items-center justify-center rounded bg-[#1E2638] border border-white/10 text-white hover:bg-[#2A354C] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Session Metadata, Selector Chips, Hardware Toggles & Checkboxes */}
          <div className="kp-card rounded-lg p-5 flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="run-title"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-1.5"
                >
                  SESSION TITLE
                </label>
                <input
                  id="run-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Dawn Threshold Loop"
                  className="w-full h-11 rounded border border-[#242D3D] bg-[#0D1117] px-3 text-sm font-medium text-white placeholder-[#8B949E]/60 focus:border-[#10E66A] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="run-date"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-1.5"
                >
                  DATE
                </label>
                <input
                  id="run-date"
                  type="date"
                  value={dateIso}
                  onChange={(e) => setDateIso(e.target.value)}
                  className="w-full h-11 rounded border border-[#242D3D] bg-[#0D1117] px-3 font-mono text-xs text-white focus:border-[#10E66A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-2">
                WORKOUT CLASSIFICATION
              </div>
              <div className="flex flex-wrap gap-2">
                {WORKOUT_TYPES.map((type) => (
                  <SelectorChip
                    key={type}
                    label={type}
                    selected={workoutType === type}
                    onClick={() => setWorkoutType(type)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-2">
                SURFACE TERRAIN
              </div>
              <div className="flex flex-wrap gap-2">
                {TERRAINS.map((t) => (
                  <SelectorChip
                    key={t}
                    label={t}
                    selected={terrain === t}
                    onClick={() => setTerrain(t)}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <HardwareToggle
                id="toggle-autopause"
                label="Auto-Pause Detection"
                description="TRIM ZERO-VELOCITY STOPS"
                checked={autoPause}
                onChange={setAutoPause}
              />
              <HardwareToggle
                id="toggle-gps"
                label="Dual-Band GPS Lock"
                description="1HZ TELEMETRY INTERPOLATION"
                checked={gpsHighPrecision}
                onChange={setGpsHighPrecision}
              />
              <HardwareCheckbox
                id="check-race"
                label="Mark as Race / Peak Effort"
                checked={isRaceEffort}
                onChange={setIsRaceEffort}
              />
              <HardwareCheckbox
                id="check-load"
                label="Include in Weekly Volume Target"
                checked={includeInLoad}
                onChange={setIncludeInLoad}
              />
            </div>

            <div>
              <label
                htmlFor="run-notes"
                className="block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-1.5"
              >
                SESSION NOTES
              </label>
              <textarea
                id="run-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pacing discipline, wind conditions, perceived threshold..."
                className="w-full rounded border border-[#242D3D] bg-[#0D1117] px-3 py-2 text-sm text-white placeholder-[#8B949E]/60 focus:border-[#10E66A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Split Preview & Physical Save Run Anchor */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-20">
          <section className="kp-card rounded-lg p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Split Matrix Preview
                </h2>
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                  {previewSplits.length} SEGMENTS · AUTO-GENERATED
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSeedOffset((s) => s + 17)}
                className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1E2638] border border-white/12 px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-[#dfe2eb] hover:bg-[#2A354C] cursor-pointer transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#38E1FF]" />
                <span>RESAMPLE</span>
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              <SplitLogTable
                splits={previewSplits}
                avgPaceSecPerKm={avgPaceSecPerKm}
              />
            </div>

            {/* Physical Anchor Action Buttons */}
            <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col gap-3">
              <button
                type="submit"
                className="btn-volt-anchor w-full min-h-[56px] rounded-lg px-6 text-base tracking-[0.05em] cursor-pointer"
              >
                SAVE RUN
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                className="w-full min-h-[44px] rounded border border-[#FF4D4D]/25 bg-transparent px-4 font-display text-xs font-bold uppercase tracking-[0.06em] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 cursor-pointer transition-colors"
              >
                DISCARD SESSION
              </button>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
};
