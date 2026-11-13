import {
  HeartRateZone,
  RunSession,
  SplitRecord,
  TerrainType,
  WorkoutType,
} from '../types/telemetry';

export const BASELINE_PACE_SEC = 268; // 4:28 /km 30-day athlete baseline

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

export function formatDurationHms(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safe = Math.max(0, Math.round(totalSeconds));
  return {
    hours: Math.floor(safe / 3600),
    minutes: Math.floor((safe % 3600) / 60),
    seconds: safe % 60,
  };
}

export function formatPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '0:00';
  const rounded = Math.round(secPerKm);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPaceDelta(
  splitPaceSec: number,
  referencePaceSec: number
): { label: string; isFaster: boolean; isNeutral: boolean } {
  const diff = Math.round(splitPaceSec - referencePaceSec);
  if (diff === 0) {
    return { label: '0s', isFaster: false, isNeutral: true };
  }
  const abs = Math.abs(diff);
  const sign = diff < 0 ? '-' : '+';
  return {
    label: `${sign}${abs}s`,
    isFaster: diff < 0,
    isNeutral: false,
  };
}

export function getHrZone(hr: number): HeartRateZone {
  if (hr < 132) return 'Z1';
  if (hr < 150) return 'Z2';
  if (hr < 165) return 'Z3';
  if (hr < 178) return 'Z4';
  return 'Z5';
}

export function getZoneColor(zone: HeartRateZone): {
  text: string;
  bg: string;
  border: string;
  label: string;
} {
  switch (zone) {
    case 'Z1':
      return {
        text: 'text-[#8B949E]',
        bg: 'bg-[#8B949E]/10',
        border: 'border-[#8B949E]/25',
        label: 'Z1 REC',
      };
    case 'Z2':
      return {
        text: 'text-[#38E1FF]',
        bg: 'bg-[#38E1FF]/10',
        border: 'border-[#38E1FF]/30',
        label: 'Z2 AERO',
      };
    case 'Z3':
      return {
        text: 'text-[#10E66A]',
        bg: 'bg-[#10E66A]/10',
        border: 'border-[#10E66A]/30',
        label: 'Z3 TEMPO',
      };
    case 'Z4':
      return {
        text: 'text-[#FFB020]',
        bg: 'bg-[#FFB020]/10',
        border: 'border-[#FFB020]/30',
        label: 'Z4 THRES',
      };
    case 'Z5':
      return {
        text: 'text-[#FF5C5C]',
        bg: 'bg-[#FF5C5C]/10',
        border: 'border-[#FF5C5C]/30',
        label: 'Z5 VO2',
      };
  }
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function generateSplitsForRun(params: {
  distanceKm: number;
  durationSec: number;
  avgHr: number;
  avgCadence: number;
  elevationGainM: number;
  terrain: TerrainType;
  workoutType: WorkoutType;
  seedOffset?: number;
}): SplitRecord[] {
  const {
    distanceKm,
    durationSec,
    avgHr,
    avgCadence,
    elevationGainM,
    terrain,
    workoutType,
    seedOffset = 7,
  } = params;

  const safeDist = Math.max(0.5, distanceKm);
  const fullLaps = Math.floor(safeDist);
  const remainder = Number((safeDist - fullLaps).toFixed(2));
  const totalLaps = remainder >= 0.05 ? fullLaps + 1 : Math.max(1, fullLaps);

  const avgPace = durationSec / safeDist;
  const splits: SplitRecord[] = [];

  for (let i = 0; i < totalLaps; i++) {
    const lapNum = i + 1;
    const isLastPartial = i === totalLaps - 1 && remainder >= 0.05 && fullLaps >= 1;
    const lapDist = isLastPartial ? remainder : fullLaps === 0 ? safeDist : 1.0;

    const r1 = pseudoRandom(lapNum * 13 + seedOffset);
    const r2 = pseudoRandom(lapNum * 29 + seedOffset * 3);

    // Terrain & workout pacing curve
    let variance = (r1 - 0.5) * 14;
    if (workoutType === 'Intervals') {
      variance = lapNum % 2 === 1 ? -18 + r1 * 6 : 16 + r1 * 8;
    } else if (workoutType === 'Tempo' || workoutType === 'Race') {
      // Negative split finish kick
      const progress = i / Math.max(1, totalLaps - 1);
      variance = 6 - progress * 14 + (r1 - 0.5) * 5;
    } else if (terrain === 'Trail') {
      variance = (r1 - 0.45) * 28;
    }

    const paceSecPerKm = Math.max(165, Math.round(avgPace + variance));

    // Elevation profile per split
    const avgElevPerKm = elevationGainM / safeDist;
    const elevWave =
      terrain === 'Track' || terrain === 'Treadmill'
        ? Math.round((r2 - 0.5) * 2)
        : Math.round(avgElevPerKm * (0.4 + r2 * 1.2) * (r1 > 0.28 ? 1 : -0.45));

    const elevProfile: number[] = [];
    let currentPt = 10;
    for (let p = 0; p < 6; p++) {
      const step =
        (elevWave / 5) +
        (pseudoRandom(lapNum * 7 + p * 11 + seedOffset) - 0.5) *
          (terrain === 'Trail' ? 8 : 3);
      currentPt = Math.max(2, Math.min(34, currentPt + step));
      elevProfile.push(Math.round(currentPt));
    }

    // Heart rate drifts slightly upward over run duration
    const drift = Math.round((i / Math.max(1, totalLaps)) * 9 - 3 + (r1 - 0.5) * 6);
    const lapHr = Math.max(110, Math.min(202, Math.round(avgHr + drift)));
    const lapCadence = Math.max(
      152,
      Math.min(204, Math.round(avgCadence + (avgPace - paceSecPerKm) * 0.25))
    );

    splits.push({
      lap: lapNum,
      distanceKm: lapDist,
      paceSecPerKm,
      elevDeltaM: elevWave,
      elevProfile,
      avgHr: lapHr,
      cadence: lapCadence,
      zone: getHrZone(lapHr),
    });
  }

  return splits;
}

export function createSeedRuns(): RunSession[] {
  const halfMarathonSplits = generateSplitsForRun({
    distanceKm: 21.1,
    durationSec: 5317, // 1:28:37 -> 4:12/km
    avgHr: 166,
    avgCadence: 181,
    elevationGainM: 184,
    terrain: 'Road',
    workoutType: 'Race',
    seedOffset: 42,
  });

  const nightTrailSplits = generateSplitsForRun({
    distanceKm: 14.6,
    durationSec: 4438, // 1:13:58 -> 5:04/km
    avgHr: 158,
    avgCadence: 172,
    elevationGainM: 465,
    terrain: 'Trail',
    workoutType: 'Long Run',
    seedOffset: 19,
  });

  const trackSplits = generateSplitsForRun({
    distanceKm: 10.0,
    durationSec: 2350, // 39:10 -> 3:55/km
    avgHr: 172,
    avgCadence: 188,
    elevationGainM: 12,
    terrain: 'Track',
    workoutType: 'Intervals',
    seedOffset: 88,
  });

  const dawnTempoSplits = generateSplitsForRun({
    distanceKm: 12.4,
    durationSec: 3186, // 53:06 -> 4:17/km
    avgHr: 163,
    avgCadence: 179,
    elevationGainM: 96,
    terrain: 'Road',
    workoutType: 'Tempo',
    seedOffset: 11,
  });

  const recoverySplits = generateSplitsForRun({
    distanceKm: 7.2,
    durationSec: 2218, // 36:58 -> 5:08/km
    avgHr: 138,
    avgCadence: 168,
    elevationGainM: 42,
    terrain: 'Road',
    workoutType: 'Recovery',
    seedOffset: 5,
  });

  return [
    {
      id: 'run-hm-01',
      title: 'Harbor Waterfront Half Marathon',
      dateIso: '2026-11-12',
      startTime: '06:05',
      distanceKm: 21.1,
      durationSec: 5317,
      avgPaceSecPerKm: Math.round(5317 / 21.1),
      avgHr: 166,
      maxHr: 184,
      avgCadence: 181,
      elevationGainM: 184,
      workoutType: 'Race',
      terrain: 'Road',
      autoPause: false,
      gpsHighPrecision: true,
      isRaceEffort: true,
      includeInLoad: true,
      notes: 'Negative split executed cleanly after km 14. Strong final 3k kick along seawall.',
      splits: halfMarathonSplits,
    },
    {
      id: 'run-trail-02',
      title: 'Skyline Ridge Night Trail',
      dateIso: '2026-11-10',
      startTime: '20:15',
      distanceKm: 14.6,
      durationSec: 4438,
      avgPaceSecPerKm: Math.round(4438 / 14.6),
      avgHr: 158,
      maxHr: 176,
      avgCadence: 172,
      elevationGainM: 465,
      workoutType: 'Long Run',
      terrain: 'Trail',
      autoPause: true,
      gpsHighPrecision: true,
      isRaceEffort: false,
      includeInLoad: true,
      notes: 'Headlamp session on loose granite switchbacks. Controlled climbs in Z3.',
      splits: nightTrailSplits,
    },
    {
      id: 'run-track-03',
      title: '400m / 1K Threshold Pyramid',
      dateIso: '2026-11-08',
      startTime: '05:40',
      distanceKm: 10.0,
      durationSec: 2350,
      avgPaceSecPerKm: 235,
      avgHr: 172,
      maxHr: 189,
      avgCadence: 188,
      elevationGainM: 12,
      workoutType: 'Intervals',
      terrain: 'Track',
      autoPause: false,
      gpsHighPrecision: true,
      isRaceEffort: false,
      includeInLoad: true,
      notes: 'Wet lane 1 conditions, locked 3:42/km on work reps with 90s float.',
      splits: trackSplits,
    },
    {
      id: 'run-tempo-04',
      title: 'Dawn Bridge Loop Tempo',
      dateIso: '2026-11-06',
      startTime: '05:50',
      distanceKm: 12.4,
      durationSec: 3186,
      avgPaceSecPerKm: Math.round(3186 / 12.4),
      avgHr: 163,
      maxHr: 174,
      avgCadence: 179,
      elevationGainM: 96,
      workoutType: 'Tempo',
      terrain: 'Road',
      autoPause: true,
      gpsHighPrecision: true,
      isRaceEffort: false,
      includeInLoad: true,
      notes: 'Steady threshold lock across eastbound span despite 18 km/h crosswind.',
      splits: dawnTempoSplits,
    },
    {
      id: 'run-rec-05',
      title: 'Evening Shakeout Flush',
      dateIso: '2026-11-04',
      startTime: '19:30',
      distanceKm: 7.2,
      durationSec: 2218,
      avgPaceSecPerKm: Math.round(2218 / 7.2),
      avgHr: 138,
      maxHr: 147,
      avgCadence: 168,
      elevationGainM: 42,
      workoutType: 'Recovery',
      terrain: 'Road',
      autoPause: true,
      gpsHighPrecision: false,
      isRaceEffort: false,
      includeInLoad: true,
      notes: 'Aerobic flush kept strictly below 145 bpm.',
      splits: recoverySplits,
    },
  ];
}

export function exportRunToCsv(run: RunSession): void {
  const header = [
    'Lap',
    'Distance_KM',
    'Split_Pace',
    'Pace_Sec_Per_KM',
    'Elev_Delta_M',
    'Avg_HR_BPM',
    'Cadence_SPM',
    'HR_Zone',
  ].join(',');

  const rows = run.splits.map((s) =>
    [
      s.lap,
      s.distanceKm.toFixed(2),
      formatPace(s.paceSecPerKm),
      s.paceSecPerKm,
      s.elevDeltaM,
      s.avgHr,
      s.cadence,
      s.zone,
    ].join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${run.dateIso}-${run.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-splits.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
