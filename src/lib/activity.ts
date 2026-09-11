import { WorkoutType } from '@/src/types';

export const WORKOUT_METS: Record<WorkoutType, number> = {
  walk: 3.5,
  run: 9.8,
  cycle: 7.5,
  swim: 8.0,
  strength: 6.0,
  hiit: 10.0,
  yoga: 3.0,
  football: 8.0,
  basketball: 7.5,
  dance: 6.5,
  hike: 6.0,
  rowing: 7.0,
  elliptical: 6.5,
  other: 5.0,
};

export const WORKOUT_EMOJI: Record<WorkoutType, string> = {
  walk: '🚶',
  run: '🏃',
  cycle: '🚴',
  swim: '🏊',
  strength: '🏋️',
  hiit: '🔥',
  yoga: '🧘',
  football: '⚽',
  basketball: '🏀',
  dance: '💃',
  hike: '🥾',
  rowing: '🚣',
  elliptical: '🏃',
  other: '🏅',
};

export const WORKOUT_TYPES: WorkoutType[] = [
  'walk', 'run', 'cycle', 'swim', 'strength', 'hiit',
  'yoga', 'football', 'basketball', 'dance', 'hike',
  'rowing', 'elliptical', 'other',
];

export function estimateCaloriesBurned(met: number, weightKg: number, minutes: number): number {
  if (!Number.isFinite(met) || !Number.isFinite(weightKg) || !Number.isFinite(minutes)) return 0;
  if (weightKg <= 0 || minutes <= 0) return 0;
  return met * weightKg * (minutes / 60);
}

export function estimateForWorkout(type: WorkoutType, weightKg: number, minutes: number): number {
  return Math.round(estimateCaloriesBurned(WORKOUT_METS[type] ?? 5, weightKg, minutes));
}
