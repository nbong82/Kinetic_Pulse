import React from 'react';
import { SplitRecord } from '../types/telemetry';
import {
  formatPace,
  formatPaceDelta,
  getZoneColor,
} from '../utils/telemetryMath';

interface SplitLogTableProps {
  splits: SplitRecord[];
  avgPaceSecPerKm: number;
  maxRows?: number;
  selectedLap?: number | null;
  onSelectLap?: (lap: number) => void;
}

const ElevationSparkline: React.FC<{ points: number[]; elevDelta: number }> = ({
  points,
  elevDelta,
}) => {
  const width = 68;
  const height = 22;
  const safePts = points.length >= 2 ? points : [12, 12];
  const minVal = Math.min(...safePts);
  const maxVal = Math.max(...safePts);
  const range = Math.max(1, maxVal - minVal);

  const coords = safePts.map((pt, idx) => {
    const x = (idx / (safePts.length - 1)) * width;
    const y = height - 3 - ((pt - minVal) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="flex items-center gap-2">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible shrink-0"
        aria-hidden="true"
      >
        <path d={areaD} fill="rgba(56, 225, 255, 0.12)" />
        <path
          d={pathD}
          fill="none"
          stroke="#38E1FF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`font-mono text-[11px] tabular-nums w-10 text-right ${
          elevDelta > 0
            ? 'text-[#38E1FF]'
            : elevDelta < 0
            ? 'text-[#8B949E]'
            : 'text-[#8B949E]'
        }`}
      >
        {elevDelta > 0 ? `+${elevDelta}m` : `${elevDelta}m`}
      </span>
    </div>
  );
};

export const SplitLogTable: React.FC<SplitLogTableProps> = ({
  splits,
  avgPaceSecPerKm,
  maxRows,
  selectedLap,
  onSelectLap,
}) => {
  if (splits.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#161B26] p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#8B949E]">
          NO SPLIT SEGMENTS RECORDED YET
        </p>
      </div>
    );
  }

  // Find fastest full-distance split (or fastest overall if all < 1km)
  const fullSplits = splits.filter((s) => s.distanceKm >= 0.9);
  const pool = fullSplits.length > 0 ? fullSplits : splits;
  const bestPace = Math.min(...pool.map((s) => s.paceSecPerKm));
  const bestLap = pool.find((s) => s.paceSecPerKm === bestPace)?.lap ?? -1;

  const visibleSplits = maxRows ? splits.slice(0, maxRows) : splits;

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-white/[0.08] bg-[#0D1117]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.08] bg-[#161B26]">
            <th className="py-2.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] w-20">
              LAP
            </th>
            <th className="py-2.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
              SPLIT PACE
            </th>
            <th className="py-2.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] hidden sm:table-cell">
              DELTA
            </th>
            <th className="py-2.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E]">
              ELEVATION
            </th>
            <th className="py-2.5 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B949E] text-right">
              HR ZONE
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleSplits.map((split, idx) => {
            const isBest = split.lap === bestLap;
            const isSelected = selectedLap === split.lap;
            const delta = formatPaceDelta(split.paceSecPerKm, avgPaceSecPerKm);
            const zoneStyle = getZoneColor(split.zone);

            const rowBg = isSelected
              ? 'bg-[#1F2636]'
              : isBest
              ? 'bg-[#10E66A]/[0.06]'
              : idx % 2 === 0
              ? 'bg-[#0D1117]'
              : 'bg-[#111620]';

            return (
              <tr
                key={split.lap}
                onClick={() => onSelectLap?.(split.lap)}
                className={`${rowBg} ${
                  onSelectLap ? 'cursor-pointer hover:bg-[#1E2638]/70' : ''
                } transition-colors border-b border-white/[0.04] last:border-b-0`}
              >
                <td className="py-2.5 px-3 font-mono text-sm font-bold tabular-nums text-white whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-4 w-[2px] rounded-full ${
                        isBest ? 'bg-[#10E66A]' : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      {split.lap.toString().padStart(2, '0')}
                    </span>
                    {split.distanceKm < 0.99 && (
                      <span className="text-[10px] font-normal text-[#8B949E]">
                        ({split.distanceKm.toFixed(1)})
                      </span>
                    )}
                    {isBest && (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#10E66A]">
                        BEST
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-3 font-mono text-sm font-semibold tabular-nums text-white whitespace-nowrap">
                  <span className={isBest ? 'text-[#10E66A]' : 'text-white'}>
                    {formatPace(split.paceSecPerKm)}
                  </span>
                  <span className="text-[11px] font-normal text-[#8B949E] ml-1">
                    /KM
                  </span>
                </td>

                <td className="py-2.5 px-3 font-mono text-xs font-semibold tabular-nums whitespace-nowrap hidden sm:table-cell">
                  <span
                    className={
                      delta.isNeutral
                        ? 'text-[#8B949E]'
                        : delta.isFaster
                        ? 'text-[#10E66A]'
                        : 'text-[#FF5C5C]'
                    }
                  >
                    {delta.label}
                  </span>
                </td>

                <td className="py-2.5 px-3 whitespace-nowrap">
                  <ElevationSparkline
                    points={split.elevProfile}
                    elevDelta={split.elevDeltaM}
                  />
                </td>

                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] tabular-nums ${zoneStyle.bg} ${zoneStyle.border} ${zoneStyle.text}`}
                  >
                    <span>{split.avgHr}</span>
                    <span className="opacity-70">{split.zone}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
