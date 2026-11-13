import React, { useMemo, useState } from 'react';
import {
  Download,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { HeartRateZone, RunSession } from '../types/telemetry';
import {
  BASELINE_PACE_SEC,
  exportRunToCsv,
  formatDuration,
  formatPace,
  formatPaceDelta,
  getZoneColor,
} from '../utils/telemetryMath';
import { SplitLogTable } from './SplitLogTable';

interface SplitAnalyticsScreenProps {
  runs: RunSession[];
  selectedRunId: string;
  onSelectRun: (id: string) => void;
  onDeleteRun: (id: string) => void;
  onNavigateToLog: () => void;
}

export const SplitAnalyticsScreen: React.FC<SplitAnalyticsScreenProps> = ({
  runs,
  selectedRunId,
  onSelectRun,
  onDeleteRun,
  onNavigateToLog,
}) => {
  const [hoveredLap, setHoveredLap] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const run = useMemo(
    () => runs.find((r) => r.id === selectedRunId) ?? runs[0],
    [runs, selectedRunId]
  );

  if (!run) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-white">
          No Runs Recorded
        </h2>
        <p className="mt-2 text-sm text-[#8B949E]">
          Log a training session or run a live track session to inspect split telemetry.
        </p>
        <button
          type="button"
          onClick={onNavigateToLog}
          className="btn-volt-anchor mt-6 min-h-[48px] rounded-lg px-6 text-sm cursor-pointer"
        >
          LOG FIRST RUN
        </button>
      </div>
    );
  }

  const paceDelta = formatPaceDelta(run.avgPaceSecPerKm, BASELINE_PACE_SEC);
  const fastestSplit = run.splits.reduce(
    (best, cur) => (cur.paceSecPerKm < best.paceSecPerKm ? cur : best),
    run.splits[0]
  );

  const strideLengthM = useMemo(() => {
    if (run.avgPaceSecPerKm <= 0 || run.avgCadence <= 0) return 0;
    const speedMetersPerMin = 1000 / (run.avgPaceSecPerKm / 60);
    return Number((speedMetersPerMin / run.avgCadence).toFixed(2));
  }, [run.avgPaceSecPerKm, run.avgCadence]);

  const zoneDistribution = useMemo(() => {
    const counts: Record<HeartRateZone, number> = {
      Z1: 0,
      Z2: 0,
      Z3: 0,
      Z4: 0,
      Z5: 0,
    };
    run.splits.forEach((s) => {
      counts[s.zone] += 1;
    });
    const total = Math.max(1, run.splits.length);
    return (['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] as HeartRateZone[]).map((z) => ({
      zone: z,
      count: counts[z],
      pct: Math.round((counts[z] / total) * 100),
      style: getZoneColor(z),
    }));
  }, [run.splits]);

  // Dual-axis Pace & Elevation SVG Chart calculations
  const chartData = useMemo(() => {
    const splits = run.splits;
    const width = 760;
    const height = 220;
    const padX = 24;
    const padY = 22;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;

    const paces = splits.map((s) => s.paceSecPerKm);
    const minPace = Math.min(...paces) - 10;
    const maxPace = Math.max(...paces) + 10;
    const paceRange = Math.max(10, maxPace - minPace);

    // Build cumulative elevation profile
    let cumElev = 20;
    const elevValues = splits.map((s) => {
      cumElev += s.elevDeltaM;
      return cumElev;
    });
    const minElev = Math.min(...elevValues, 0);
    const maxElev = Math.max(...elevValues, 40);
    const elevRange = Math.max(10, maxElev - minElev);

    const points = splits.map((s, idx) => {
      const x =
        splits.length === 1
          ? width / 2
          : padX + (idx / (splits.length - 1)) * innerW;
      // Faster pace (lower sec/km) plotted HIGHER on chart
      const paceY =
        padY + ((s.paceSecPerKm - minPace) / paceRange) * innerH;
      const elevY =
        padY + innerH - ((elevValues[idx] - minElev) / elevRange) * (innerH * 0.65);

      return {
        split: s,
        x,
        paceY,
        elevY,
        elevM: elevValues[idx],
      };
    });

    const paceLine = `M ${points.map((p) => `${p.x.toFixed(1)},${p.paceY.toFixed(1)}`).join(' L ')}`;
    const elevLine = `M ${points.map((p) => `${p.x.toFixed(1)},${p.elevY.toFixed(1)}`).join(' L ')}`;
    const elevArea = `${elevLine} L ${points[points.length - 1].x.toFixed(1)},${height - padY} L ${points[0].x.toFixed(1)},${height - padY} Z`;

    return { width, height, padX, padY, points, paceLine, elevLine, elevArea };
  }, [run.splits]);

  const activePoint =
    chartData.points.find((p) => p.split.lap === hoveredLap) ??
    chartData.points[chartData.points.length - 1];

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-6 pt-5 pb-24 md:pb-14">
      {/* Header & Run Switcher */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.06em] text-[#8B949E]">
            <span>{run.terrain}</span>
            <span aria-hidden="true">·</span>
            <span>{run.workoutType}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{run.dateIso}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{run.startTime}</span>
          </div>
          <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            {run.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Select logged run"
            value={run.id}
            onChange={(e) => {
              setConfirmDelete(false);
              setHoveredLap(null);
              onSelectRun(e.target.value);
            }}
            className="h-10 rounded border border-white/12 bg-[#1E2638] px-3 font-mono text-xs text-white focus:border-[#10E66A] focus:outline-none cursor-pointer"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.dateIso} — {r.title} ({r.distanceKm.toFixed(1)} km)
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => exportRunToCsv(run)}
            className="inline-flex h-10 items-center gap-1.5 rounded border border-white/12 bg-[#1E2638] px-3.5 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-white hover:bg-[#2A354C] cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#10E66A]" />
            <span>CSV</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete run"
              className="inline-flex h-10 items-center gap-1.5 rounded border border-[#FF4D4D]/25 bg-transparent px-3 font-mono text-xs font-semibold uppercase tracking-[0.05em] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>DELETE</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onDeleteRun(run.id);
                  setConfirmDelete(false);
                }}
                className="h-10 rounded bg-[#FF4D4D] px-3 font-mono text-xs font-bold uppercase text-[#0D1117] cursor-pointer"
              >
                CONFIRM
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-10 rounded border border-white/15 px-3 font-mono text-xs uppercase text-[#8B949E] hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modular 3-Column Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        <div className="kp-card-active rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            AVG PACE
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-[#10E66A] tabular-nums leading-tight">
            {formatPace(run.avgPaceSecPerKm)}
            <span className="ml-1 text-xs font-medium text-[#8B949E]">/KM</span>
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[11px] font-semibold tabular-nums">
            {paceDelta.isFaster ? (
              <TrendingUp className="h-3 w-3 text-[#10E66A]" />
            ) : (
              <TrendingDown className="h-3 w-3 text-[#FF5C5C]" />
            )}
            <span
              className={
                paceDelta.isFaster ? 'text-[#10E66A]' : 'text-[#FF5C5C]'
              }
            >
              {paceDelta.label} vs avg
            </span>
          </div>
        </div>

        <div className="kp-card rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            DISTANCE
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-tight">
            {run.distanceKm.toFixed(1)}
            <span className="ml-1 text-xs font-medium text-[#8B949E]">KM</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#8B949E] tabular-nums">
            {run.splits.length} SPLITS
          </div>
        </div>

        <div className="kp-card rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            DURATION
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-tight">
            {formatDuration(run.durationSec)}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#8B949E]">
            {run.autoPause ? 'MOVING TIME' : 'ELAPSED'}
          </div>
        </div>

        <div className="kp-card rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            HEART RATE
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-white tabular-nums leading-tight">
            {run.avgHr}
            <span className="ml-1 text-xs font-medium text-[#8B949E]">BPM</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#FF5C5C] tabular-nums">
            PEAK {run.maxHr} BPM
          </div>
        </div>

        <div className="kp-card rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            CADENCE
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-[#38E1FF] tabular-nums leading-tight">
            {run.avgCadence}
            <span className="ml-1 text-xs font-medium text-[#8B949E]">SPM</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#8B949E] tabular-nums">
            STRIDE {strideLengthM} M
          </div>
        </div>

        <div className="kp-card rounded-lg p-4">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
            ELEV GAIN
          </div>
          <div className="mt-1 font-mono text-2xl sm:text-[28px] font-bold text-[#38E1FF] tabular-nums leading-tight">
            +{run.elevationGainM}
            <span className="ml-1 text-xs font-medium text-[#8B949E]">M</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#10E66A] tabular-nums">
            BEST KM {formatPace(fastestSplit.paceSecPerKm)}
          </div>
        </div>
      </div>

      {/* Chart + HR Zones Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Pace & Elevation Telemetry Chart */}
        <section className="lg:col-span-8 kp-card rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Pace &amp; Elevation Telemetry
              </h2>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
                HOVER OR TAP ANY SPLIT POINT TO INSPECT LAP TELEMETRY
              </p>
            </div>

            {activePoint && (
              <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                <span className="text-white font-bold">
                  KM {activePoint.split.lap}
                </span>
                <span className="text-[#10E66A] font-semibold">
                  {formatPace(activePoint.split.paceSecPerKm)} /KM
                </span>
                <span className="text-[#38E1FF]">
                  {activePoint.split.elevDeltaM >= 0
                    ? `+${activePoint.split.elevDeltaM}M`
                    : `${activePoint.split.elevDeltaM}M`}
                </span>
                <span className="text-[#dfe2eb]">
                  {activePoint.split.avgHr} BPM
                </span>
              </div>
            )}
          </div>

          <div className="rounded bg-[#0A0E14] border border-white/[0.06] p-3">
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-48 sm:h-56 overflow-visible"
              role="img"
              aria-label="Pace and elevation chart across kilometer splits"
            >
              {/* Horizontal grid lines */}
              {[0.2, 0.5, 0.8].map((ratio) => {
                const y = chartData.padY + ratio * (chartData.height - chartData.padY * 2);
                return (
                  <line
                    key={ratio}
                    x1={chartData.padX}
                    y1={y}
                    x2={chartData.width - chartData.padX}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="3 4"
                  />
                );
              })}

              {/* Elevation area & curve (#38E1FF) */}
              <path d={chartData.elevArea} fill="rgba(56, 225, 255, 0.1)" />
              <path
                d={chartData.elevLine}
                fill="none"
                stroke="#38E1FF"
                strokeWidth="1.75"
                strokeOpacity="0.85"
              />

              {/* Pace line (#10E66A) */}
              <path
                d={chartData.paceLine}
                fill="none"
                stroke="#10E66A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive split nodes */}
              {chartData.points.map((pt) => {
                const isActive = activePoint?.split.lap === pt.split.lap;
                return (
                  <g
                    key={pt.split.lap}
                    onMouseEnter={() => setHoveredLap(pt.split.lap)}
                    onClick={() => setHoveredLap(pt.split.lap)}
                    className="cursor-pointer"
                  >
                    {isActive && (
                      <line
                        x1={pt.x}
                        y1={chartData.padY}
                        x2={pt.x}
                        y2={chartData.height - chartData.padY}
                        stroke="rgba(16, 230, 106, 0.4)"
                        strokeDasharray="2 3"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.paceY}
                      r={isActive ? 5.5 : 3}
                      fill={isActive ? '#10E66A' : '#0D1117'}
                      stroke="#10E66A"
                      strokeWidth="2"
                    />
                    {/* Invisible wide hit target */}
                    <rect
                      x={pt.x - 14}
                      y={0}
                      width={28}
                      height={chartData.height}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </svg>

            <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.06em] text-[#8B949E]">
              <span>KM 01</span>
              <div className="flex items-center gap-4">
                <span className="text-[#10E66A]">━ PACE (/KM)</span>
                <span className="text-[#38E1FF]">━ ELEV PROFILE</span>
              </div>
              <span>KM {run.splits.length.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </section>

        {/* Heart Rate Zone Breakdown & Notes */}
        <section className="lg:col-span-4 kp-card rounded-lg p-5 flex flex-col justify-between gap-5">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Heart Rate Zones
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E] mb-4">
              DISTRIBUTION ACROSS {run.splits.length} LAPS
            </p>

            <div className="flex flex-col gap-3">
              {zoneDistribution.map((item) => (
                <div key={item.zone}>
                  <div className="flex items-center justify-between font-mono text-xs mb-1 tabular-nums">
                    <span className={`font-semibold ${item.style.text}`}>
                      {item.style.label}
                    </span>
                    <span className="text-[#dfe2eb]">
                      {item.pct}%{' '}
                      <span className="text-[#8B949E]">({item.count})</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#1E2638]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.zone === 'Z1'
                          ? 'bg-[#8B949E]'
                          : item.zone === 'Z2'
                          ? 'bg-[#38E1FF]'
                          : item.zone === 'Z3'
                          ? 'bg-[#10E66A]'
                          : item.zone === 'Z4'
                          ? 'bg-[#FFB020]'
                          : 'bg-[#FF5C5C]'
                      }`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] mb-1.5">
              SESSION NOTES
            </div>
            <p className="text-sm text-[#dfe2eb] leading-relaxed">
              {run.notes || 'No tactical notes logged for this session.'}
            </p>
          </div>
        </section>
      </div>

      {/* Full Split Logs Table (20+ alternating rows) */}
      <section className="kp-card rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Kilometer Split Logs
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#8B949E]">
              ALTERNATING PRECISION ROWS · FASTEST SPLIT HIGHLIGHTED
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.06em] text-[#10E66A] tabular-nums">
            {run.splits.length} TOTAL SEGMENTS
          </span>
        </div>

        <SplitLogTable
          splits={run.splits}
          avgPaceSecPerKm={run.avgPaceSecPerKm}
          selectedLap={hoveredLap}
          onSelectLap={(lap) => setHoveredLap(lap)}
        />
      </section>
    </div>
  );
};
