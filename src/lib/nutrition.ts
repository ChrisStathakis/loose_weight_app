import { Food } from '@/src/types';

export const scaleFood = (food: Food, grams: number) => {
  const factor = grams / 100;
  return { calories: food.calories_per_100g * factor, protein: food.protein_per_100g * factor, carbs: food.carbs_per_100g * factor, fat: food.fat_per_100g * factor };
};

export const sumNutrition = <T extends { calories: number; protein?: number | null; carbs?: number | null; fat?: number | null }>(items: T[]) => items.reduce((a, item) => ({ calories: a.calories + item.calories, protein: a.protein + (item.protein ?? 0), carbs: a.carbs + (item.carbs ?? 0), fat: a.fat + (item.fat ?? 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
export const parseNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};
