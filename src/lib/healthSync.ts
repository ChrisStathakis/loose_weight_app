import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { estimateForWorkout } from '@/src/lib/activity';
import type { WorkoutType } from '@/src/types';

export type HealthAvailability =
  | { available: true }
  | { available: false; reason: 'not-android' | 'sdk-unavailable' | 'not-installed' | 'unknown'; status?: number | null };

export type SyncResult = {
  imported: number;
  skipped: number;
  sessions: number;
  syncedAt: string;
};

const SYNC_DAYS_BACK = 30;
const LAST_SYNC_KEY = 'health-connect-last-sync';

function loadLib() {
  // Static import would crash in Expo Go before native rebuild; lazy-require keeps
  // manual logging usable everywhere and surfaces a catchable error on sync.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('react-native-health-connect') as typeof import('react-native-health-connect');
}

export function mapExerciseTypeToWorkoutType(exerciseType: number): WorkoutType {
  switch (exerciseType) {
    case 79: // WALKING
      return 'walk';
    case 56: // RUNNING
    case 57: // RUNNING_TREADMILL
      return 'run';
    case 8: // BIKING
    case 9: // BIKING_STATIONARY
      return 'cycle';
    case 73: // SWIMMING_OPEN_WATER
    case 74: // SWIMMING_POOL
      return 'swim';
    case 70: // STRENGTH_TRAINING
    case 81: // WEIGHTLIFTING
    case 6: // BENCH_PRESS
    case 17: // DEADLIFT
    case 67: // SQUAT
      return 'strength';
    case 36: // HIGH_INTENSITY_INTERVAL_TRAINING
    case 10: // BOOT_CAMP
    case 11: // BOXING
      return 'hiit';
    case 83: // YOGA
    case 48: // PILATES
    case 33: // GUIDED_BREATHING
      return 'yoga';
    case 64: // SOCCER
      return 'football';
    case 5: // BASKETBALL
      return 'basketball';
    case 16: // DANCING
      return 'dance';
    case 37: // HIKING
      return 'hike';
    case 53: // ROWING
    case 54: // ROWING_MACHINE
    case 46: // PADDLING
      return 'rowing';
    case 25: // ELLIPTICAL
    case 68: // STAIR_CLIMBING
    case 69: // STAIR_CLIMBING_MACHINE
      return 'elliptical';
    default:
      return 'other';
  }
}

export async function checkHealthAvailability(): Promise<HealthAvailability> {
  if (Platform.OS !== 'android') return { available: false, reason: 'not-android' };
  try {
    const lib = loadLib();
    const status: number = await lib.getSdkStatus();
    const { SdkAvailabilityStatus } = lib;
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return { available: true };
    return { available: false, reason: 'sdk-unavailable', status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/linked|Expo Go|not using Expo Go/i.test(msg)) {
      return { available: false, reason: 'not-installed' };
    }
    return { available: false, reason: 'unknown' };
  }
}

async function ensurePermissions(): Promise<void> {
  const lib = loadLib();
  await lib.initialize();
  const granted = await lib.requestPermission([
    { accessType: 'read', recordType: 'ExerciseSession' },
    { accessType: 'read', recordType: 'TotalCaloriesBurned' },
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'Distance' },
  ]);
  const need = new Set(['ExerciseSession', 'TotalCaloriesBurned', 'Steps', 'Distance']);
  for (const p of granted) {
    if ('recordType' in p && need.has((p as { recordType: string }).recordType)) {
      need.delete((p as { recordType: string }).recordType);
    }
  }
  // ExerciseSession is mandatory; calories/steps/distance degrade gracefully.
  if (need.has('ExerciseSession')) {
    throw new Error('permission-denied');
  }
}

async function aggregateWindow(startTime: string, endTime: string) {
  const lib = loadLib();
  const filter = { operator: 'between' as const, startTime, endTime };
  let calories: number | null = null;
  let steps: number | null = null;
  let distanceM: number | null = null;
  try {
    const r = await lib.aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter: filter });
    const kcal = (r as { ENERGY_TOTAL?: { inKilocalories?: number } }).ENERGY_TOTAL?.inKilocalories;
    if (typeof kcal === 'number' && Number.isFinite(kcal) && kcal > 0) calories = Math.round(kcal);
  } catch {
    // optional — falls back to MET estimate
  }
  try {
    const r = await lib.aggregateRecord({ recordType: 'Steps', timeRangeFilter: filter });
    const count = (r as { COUNT_TOTAL?: number }).COUNT_TOTAL;
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) steps = Math.round(count);
  } catch {
    // optional
  }
  try {
    const r = await lib.aggregateRecord({ recordType: 'Distance', timeRangeFilter: filter });
    const meters = (r as { DISTANCE?: { inMeters?: number } }).DISTANCE?.inMeters;
    if (typeof meters === 'number' && Number.isFinite(meters) && meters > 0) distanceM = Math.round(meters * 10) / 10;
  } catch {
    // optional
  }
  return { calories, steps, distanceM };
}

export async function getLastSync(db: SQLiteDatabase): Promise<string | null> {
  try {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key=?', LAST_SYNC_KEY);
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function setLastSync(db: SQLiteDatabase, iso: string) {
  try {
    await db.runAsync('INSERT OR REPLACE INTO sync_state (key, value) VALUES (?,?)', LAST_SYNC_KEY, iso);
  } catch {
    // best-effort
  }
}

const toDateKey = (iso: string) => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export async function syncHealthConnect(db: SQLiteDatabase, opts?: { daysBack?: number }): Promise<SyncResult> {
  if (Platform.OS !== 'android') throw new Error('not-android');
  const daysBack = opts?.daysBack ?? SYNC_DAYS_BACK;
  await ensurePermissions();
  const lib = loadLib();

  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const { records } = await lib.readRecords('ExerciseSession', {
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
  });

  let weightKg = 70;
  try {
    const row = await db.getFirstAsync<{ kilograms: number }>('SELECT kilograms FROM weights ORDER BY date DESC LIMIT 1');
    if (row && Number.isFinite(Number(row.kilograms))) weightKg = Number(row.kilograms);
  } catch {
    // keep default
  }

  let imported = 0;
  let skipped = 0;
  for (const s of records) {
    const startTime = s.startTime;
    const endTime = s.endTime;
    if (!startTime || !endTime) {
      skipped += 1;
      continue;
    }
    const minutes = Math.max(1, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000));
    const type = mapExerciseTypeToWorkoutType(s.exerciseType ?? 0);
    const agg = await aggregateWindow(startTime, endTime);
    const calories = agg.calories ?? estimateForWorkout(type, weightKg, minutes);
    const externalId = s.metadata?.id ? `hc:${s.metadata.id}` : `hc:${startTime}:${endTime}:${s.exerciseType ?? 0}`;
    const date = toDateKey(startTime);
    const note = s.title ?? s.notes ?? null;
    try {
      const res = await db.runAsync(
        `INSERT OR IGNORE INTO workouts
         (date,type,minutes,calories,weight_kg,source,external_id,note,created_at,steps,distance_m)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        date, type, minutes, calories, weightKg, 'health-connect', externalId, note,
        new Date().toISOString(), agg.steps, agg.distanceM,
      );
      if ((res.changes ?? 0) > 0) imported += 1;
      else skipped += 1;
    } catch {
      skipped += 1;
    }
  }

  const syncedAt = new Date().toISOString();
  await setLastSync(db, syncedAt);
  return { imported, skipped, sessions: records.length, syncedAt };
}
