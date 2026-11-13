export type ScreenId = 'live' | 'log' | 'analytics' | 'logbook';

export type WorkoutType =
  | 'Tempo'
  | 'Long Run'
  | 'Intervals'
  | 'Recovery'
  | 'Race'
  | 'Base';

export type TerrainType = 'Road' | 'Trail' | 'Track' | 'Treadmill';

export type HeartRateZone = 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5';

export interface SplitRecord {
  lap: number;
  distanceKm: number; // e.g., 1.0 or 0.1 for final partial km
  paceSecPerKm: number;
  elevDeltaM: number; // net elevation delta for this split
  elevProfile: number[]; // 6 points for micro-sparkline
  avgHr: number;
  cadence: number;
  zone: HeartRateZone;
}

export interface RunSession {
  id: string;
  title: string;
  dateIso: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  distanceKm: number;
  durationSec: number;
  avgPaceSecPerKm: number;
  avgHr: number;
  maxHr: number;
  avgCadence: number;
  elevationGainM: number;
  workoutType: WorkoutType;
  terrain: TerrainType;
  autoPause: boolean;
  gpsHighPrecision: boolean;
  isRaceEffort: boolean;
  includeInLoad: boolean;
  notes: string;
  splits: SplitRecord[];
}

export interface LiveSessionDraft {
  title: string;
  distanceKm: number;
  durationSec: number;
  avgHr: number;
  avgCadence: number;
  elevationGainM: number;
  terrain: TerrainType;
  workoutType: WorkoutType;
  splits: SplitRecord[];
}
