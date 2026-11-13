import React, { useMemo, useState } from 'react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { RunSession, WorkoutType } from '../types/telemetry';
import { formatDuration, formatPace } from '../utils/telemetryMath';
import { SelectorChip } from './HardwareControls';

interface TrainingLogScreenProps {
  runs: RunSession[];
  onInspectRun: (runId: string) => void;
  onNavigateToLog: () => void;
}

const FILTER_TYPES: ('All' | WorkoutType)[] = [
  'All',
  'Race',
  'Tempo',
  'Long Run',
  'Intervals',
  'Recovery',
  'Base',
];

const WEEKDAYS = [
  { key: 'all', short: 'ALL', num: '' },
  { key: '1', short: 'M', num: '09' },
  { key: '2', short: 'T', num: '10' },
  { key: '3', short: 'W', num: '11' },
  { key: '4', short: 'T', num: '12' },
  { key: '5', short: 'F', num: '13' },
  { key: '6', short: 'S', num: '14' },
  { key: '0', short: 'S', num: '15' },
];

export const TrainingLogScreen: React.FC<TrainingLogScreenProps> = ({
  runs,
  onInspectRun,
  onNavigateToLog,
}) => {
  const [weeklyTargetKm, setWeeklyTargetKm] = useState<number>(80);
  const [activeFilter, setActiveFilter] = useState<'All' | WorkoutType>('All');
  const [selectedDayKey, setSelectedDayKey] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRuns = useMemo(
    () => runs.filter((r) => r.includeInLoad),
    [runs]
  );

  const totals = useMemo(() => {
    const dist = loadRuns.reduce((sum, r) => sum + r.distanceKm, 0);
    const dur = loadRuns.reduce((sum, r) => sum + r.durationSec, 0);
    const elev = loadRuns.reduce((sum, r) => sum + r.elevationGainM, 0);
    const avgPace = dist > 0 ? Math.round(dur / dist) : 0;
    return { dist, dur, elev, avgPace };
  }, [loadRuns]);

  const progressPct = Math.min(
    100,
    Math.round((totals.dist / Math.max(1, weeklyTargetKm)) * 100)
  );

  // SVG Ring geometry
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (progressPct / 100) * ringCircumference;

  // 8-week historical volume series anchored to current live total
  const weeklyBars = useMemo(
    () => [
      { label: 'W-7', km: 52.4 },
      { label: 'W-6', km: 58.0 },
      { label: 'W-5', km: 64.2 },
      { label: 'W-4', km: 49.5 },
      { label: 'W-3', km: 71.0 },
      { label: 'W-2', km: 76.8 },
      { label: 'W-1', km: 68.4 },
      { label: 'NOW', km: Number(totals.dist.toFixed(1)) },
    ],
    [totals.dist]
  );

  const maxWeekKm = Math.max(weeklyTargetKm, ...weeklyBars.map((w) => w.km), 10);

  const filteredRuns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return runs.filter((run) => {
      if (activeFilter !== 'All' && run.workoutType !== activeFilter) {
        return false;
      }
      if (selectedDayKey !== 'all') {
        const day = new Date(`${run.dateIso}T12:00:00`).getDay().toString();
        if (day !== selectedDayKey) return false;
      }
      if (q) {
        const hay = `${run.title} ${run.terrain} ${run.workoutType} ${run.notes}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [runs, activeFilter, selectedDayKey, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-6 pt-5 pb-24 md:pb-14">
      {/* Top Row: Weekly Volume Ring + 8-Week Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Weekly Target Ring Card */}
        <section className="lg:col-span-5 kp-card-active rounded-lg p-5 flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white">
                Training Load
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                CURRENT BLOCK VOLUME &amp; INTENSITY
              </p>
            </div>

            <div className="flex items-center gap-1 rounded bg-[#0D1117] p-1 border border-white/10">
              {[60, 80, 100].map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => setWeeklyTargetKm(target)}
                  className={`rounded px-2 py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                    weeklyTargetKm === target
                      ? 'bg-[#10E66A] text-[#0D1117]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  {target}K
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
              <svg
                className="h-32 w-32 -rotate-90"
                viewBox="0 0 128 128"
                aria-label={`Weekly target progress ${progressPct}%`}
              >
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke="#1E2638"
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke="#10E66A"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {progressPct}%
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                  TARGET
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 flex-1 min-w-0">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                  DISTANCE
                </div>
                <div className="font-mono text-xl font-bold text-white tabular-nums">
                  {totals.dist.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-[#8B949E]">
                    /{weeklyTargetKm}K
                  </span>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                  AVG PACE
                </div>
                <div className="font-mono text-xl font-bold text-[#10E66A] tabular-nums">
                  {formatPace(totals.avgPace)}
                  <span className="ml-1 text-xs font-normal text-[#8B949E]">
                    /KM
                  </span>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                  ELEV GAIN
                </div>
                <div className="font-mono text-xl font-bold text-[#38E1FF] tabular-nums">
                  +{totals.elev}
                  <span className="ml-1 text-xs font-normal text-[#8B949E]">
                    M
                  </span>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#8B949E]">
                  TIME
                </div>
                <div className="font-mono text-xl font-bold text-white tabular-nums">
                  {formatDuration(totals.dur)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8-Week Volume Bar Telemetry */}
        <section className="lg:col-span-7 kp-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                8-Week Volume Progression
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                TARGET LINE {weeklyTargetKm} KM · CURRENT BLOCK HIGHLIGHTED
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToLog}
              className="inline-flex h-10 items-center gap-1.5 rounded bg-[#10E66A] px-3.5 font-display text-xs font-black uppercase tracking-[0.04em] text-[#0D1117] hover:bg-[#2df37f] cursor-pointer transition-colors shrink-0"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>NEW RUN</span>
            </button>
          </div>

          <div className="relative rounded bg-[#0A0E14] border border-white/[0.06] px-4 pt-6 pb-3">
            {/* Target threshold hairline */}
            <div
              className="pointer-events-none absolute inset-x-4 border-t border-dashed border-[#38E1FF]/40"
              style={{
                bottom: `${36 + (weeklyTargetKm / maxWeekKm) * 110}px`,
              }}
            />

            <div className="grid grid-cols-8 items-end gap-2 sm:gap-3 h-36">
              {weeklyBars.map((bar) => {
                const isCurrent = bar.label === 'NOW';
                const heightPx = Math.max(
                  10,
                  Math.round((bar.km / maxWeekKm) * 110)
                );
                return (
                  <div
                    key={bar.label}
                    className="flex flex-col items-center justify-end h-full"
                  >
                    <span
                      className={`mb-1 font-mono text-[10px] tabular-nums ${
                        isCurrent ? 'text-[#10E66A] font-bold' : 'text-[#8B949E]'
                      }`}
                    >
                      {bar.km.toFixed(0)}
                    </span>
                    <div
                      className={`w-full max-w-[34px] rounded-t transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#10E66A] shadow-[0_0_16px_rgba(16,230,106,0.3)]'
                          : 'bg-[#1E2638] border border-white/[0.08]'
                      }`}
                      style={{ height: `${heightPx}px` }}
                    />
                    <span
                      className={`mt-2 font-mono text-[10px] uppercase tracking-[0.06em] ${
                        isCurrent ? 'text-white font-semibold' : 'text-[#8B949E]'
                      }`}
                    >
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Horizontal Day Scroller + Filter Chips + Run History List */}
      <section className="kp-card rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          {/* Horizontal Date / Weekday Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {WEEKDAYS.map((day) => {
              const selected = selectedDayKey === day.key;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDayKey(day.key)}
                  className={`flex h-11 min-w-[44px] flex-col items-center justify-center rounded-full px-3 font-mono text-xs transition-colors cursor-pointer shrink-0 ${
                    selected
                      ? 'bg-[#10E66A] text-[#0D1117] font-bold'
                      : 'bg-[#1E2638] text-[#8B949E] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  <span className="text-[10px] leading-none">{day.short}</span>
                  {day.num && (
                    <span className="text-[11px] leading-tight mt-0.5 tabular-nums">
                      {day.num}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B949E]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sessions by title or terrain..."
              className="w-full h-11 rounded border border-[#242D3D] bg-[#0D1117] pl-9 pr-3 text-sm text-white placeholder-[#8B949E]/70 focus:border-[#10E66A] focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 py-4">
          {FILTER_TYPES.map((type) => (
            <SelectorChip
              key={type}
              label={type}
              selected={activeFilter === type}
              onClick={() => setActiveFilter(type)}
            />
          ))}
        </div>

        {/* Interactive Run Rows */}
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.08]">
          {filteredRuns.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#8B949E]">
                NO MATCHING SESSIONS FOR CURRENT FILTERS
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('All');
                  setSelectedDayKey('all');
                  setSearchQuery('');
                }}
                className="mt-3 rounded border border-white/15 px-4 py-2 font-mono text-xs uppercase text-white hover:border-[#10E66A] hover:text-[#10E66A] cursor-pointer"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            filteredRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => onInspectRun(run.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-2 hover:bg-[#1E2638]/40 transition-colors text-left cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                    <span className="tabular-nums">{run.dateIso}</span>
                    <span aria-hidden="true">·</span>
                    <span>{run.terrain}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        run.isRaceEffort ? 'text-[#10E66A] font-semibold' : ''
                      }
                    >
                      {run.workoutType}
                    </span>
                  </div>
                  <div className="mt-1 font-display text-base sm:text-lg font-bold text-white group-hover:text-[#10E66A] transition-colors truncate">
                    {run.title}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-7 shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-base font-bold text-white tabular-nums">
                      {run.distanceKm.toFixed(1)} KM
                    </div>
                    <div className="font-mono text-[11px] text-[#8B949E] tabular-nums">
                      {formatDuration(run.durationSec)}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="font-mono text-base font-bold text-[#10E66A] tabular-nums">
                      {formatPace(run.avgPaceSecPerKm)} /KM
                    </div>
                    <div className="font-mono text-[11px] text-[#38E1FF] tabular-nums">
                      {run.avgHr} BPM · +{run.elevationGainM}M
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-[#8B949E] group-hover:text-[#10E66A] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
