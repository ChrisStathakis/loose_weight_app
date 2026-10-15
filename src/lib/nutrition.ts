import type { Food } from '../types';

export const scaleFood = (food: Food, grams: number) => {
  const factor = grams / 100;
  return { calories: food.calories_per_100g * factor, protein: food.protein_per_100g * factor, carbs: food.carbs_per_100g * factor, fat: food.fat_per_100g * factor };
};

export const sumNutrition = <T extends { calories: number; protein?: number | null; carbs?: number | null; fat?: number | null }>(items: T[]) => items.reduce((a, item) => ({ calories: a.calories + item.calories, protein: a.protein + (item.protein ?? 0), carbs: a.carbs + (item.carbs ?? 0), fat: a.fat + (item.fat ?? 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
export const parseNumber = (value: string, fallback = 0) => {
  const trimmed = value.trim();
  // Empty input must return the fallback: Number('') is 0 (finite), so
  // falling through would silently turn a cleared field into 0.
  if (!trimmed) return fallback;
  const stripped = trimmed.replace(',', '.').replace(/[^0-9.\-]/g, '');
  if (!stripped) return fallback;
  const parsed = Number(stripped);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const isValidBirthDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  return dt.getTime() <= Date.now();
};

export const calcAge = (birthDate: string, today = new Date()): number | null => {
  if (!isValidBirthDate(birthDate)) return null;
  const [ys, ms, ds] = birthDate.trim().split('-').map(Number);
  let age = today.getFullYear() - ys;
  const monthDiff = today.getMonth() + 1 - ms;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < ds)) age -= 1;
  return age >= 0 && age < 130 ? age : null;
};

// Rough maintenance estimate when sex + activity are unknown: average the
// Mifflin-St Jeor male (+5) / female (-161) constants (-78), assume light
// activity (x1.375), then apply a moderate -400 kcal deficit for gradual loss.
// Returns null when inputs are missing so callers can hide the suggestion.
export function estimateGoals(input: { weight_kg: number | null; height_cm: number | null; age: number | null }): { calories: number; protein: number; carbs: number; fat: number } | null {
  const { weight_kg, height_cm, age } = input;
  if (weight_kg == null || height_cm == null || age == null) return null;
  if (!(weight_kg > 30 && weight_kg < 300) || !(height_cm > 120 && height_cm < 230) || !(age >= 10 && age < 100)) return null;
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 78;
  const maintenance = bmr * 1.375;
  const calories = Math.round(Math.min(3500, Math.max(1400, maintenance - 400)) / 10) * 10;
  const protein = Math.round(weight_kg * 1.8);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(50, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}
