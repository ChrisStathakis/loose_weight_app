import { Diet, Food, MealType, Recipe } from '@/src/types';
import { scaleFood } from '@/src/lib/nutrition';

export const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const containsExcluded = (recipe: Recipe, excluded: string[]) => {
  const haystack = `${recipe.name_en} ${recipe.name_el} ${recipe.ingredients.map((i) => `${i.name_en} ${i.name_el}`).join(' ')}`.toLowerCase();
  return excluded.some((item) => item.trim() && haystack.includes(item.trim().toLowerCase()));
};

export function eligibleRecipes(recipes: Recipe[], diet: Diet, excluded: string[]) {
  return recipes.filter((recipe) => {
    const dietAllowed = diet === 'balanced' || recipe.diet === diet || (diet === 'vegetarian' && recipe.diet === 'vegan');
    return dietAllowed && !containsExcluded(recipe, excluded);
  });
}

export function choosePlan(recipes: Recipe[], calorieGoal: number, diet: Diet, excluded: string[], locked: Record<string, Recipe | undefined>) {
  const eligible = eligibleRecipes(recipes, diet, excluded);
  if (!eligible.length) return [];
  const result: { meal_type: typeof mealOrder[number]; recipe: Recipe; portion: number }[] = [];
  const used = new Set<string>();
  for (let index = 0; index < mealOrder.length; index += 1) {
    const meal = mealOrder[index];
    const lockedRecipe = locked[meal];
    if (lockedRecipe && eligible.some((candidate) => candidate.id === lockedRecipe.id)) { result.push({ meal_type: meal, recipe: lockedRecipe, portion: 1 }); used.add(lockedRecipe.id); continue; }
    const candidates = eligible.filter((r) => !used.has(r.id));
    const pool = candidates.length ? candidates : eligible;
    const target = calorieGoal * [0.25, 0.3, 0.3, 0.15][index];
    const recipe = pool.reduce((best, current) => Math.abs(current.calories - target) < Math.abs(best.calories - target) ? current : best, pool[0]);
    result.push({ meal_type: meal, recipe, portion: 1 });
    used.add(recipe.id);
  }
  const total = result.reduce((sum, item) => sum + item.recipe.calories * item.portion, 0);
  const factor = total > 0 ? Math.max(0.5, Math.min(2, calorieGoal / total)) : 1;
  return result.map((item) => ({ ...item, portion: Number(factor.toFixed(2)) }));
}

export function mealSlotsForCount(count: number): MealType[] {
  if (count <= 2) return ['lunch', 'dinner'];
  if (count === 3) return ['breakfast', 'lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner', 'snack'];
}

const slotWeights: Record<number, number[]> = {
  2: [0.45, 0.55],
  3: [0.3, 0.35, 0.35],
  4: [0.25, 0.3, 0.3, 0.15],
};

export type FoodPlanItem = {
  meal_type: MealType;
  food: Food;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type FoodDayPlan = {
  dateOffset: number;
  items: FoodPlanItem[];
  totalCalories: number;
  totalProtein: number;
};

const baseGrams = (food: Food) => Math.max(1, Number(food.serving_grams ?? 100) || 100);

export function chooseFoodPlan(
  liked: Food[],
  calorieGoal: number,
  mealsPerDay: number,
  days: number,
  proteinGoal?: number | null,
): FoodDayPlan[] {
  if (!liked.length || days < 1 || calorieGoal <= 0) return [];
  const slots = mealSlotsForCount(Math.max(2, Math.min(4, Math.round(mealsPerDay))));
  const weights = slotWeights[slots.length] ?? slots.map(() => 1 / slots.length);
  const safeDays = Math.max(1, Math.min(7, Math.round(days)));
  const plans: FoodDayPlan[] = [];
  for (let day = 0; day < safeDays; day += 1) {
    const used = new Set<string>();
    const items: FoodPlanItem[] = slots.map((meal_type, slotIndex) => {
      const slotTarget = calorieGoal * (weights[slotIndex] ?? 1 / slots.length);
      const candidates = liked.filter((f) => !used.has(f.id));
      const pool = candidates.length ? candidates : liked;
      // Pick the liked food closest to the slot target; tie-break toward
      // higher protein density when a protein goal is set.
      let best = pool[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const food of pool) {
        const kcal = (food.calories_per_100g * baseGrams(food)) / 100;
        let score = Math.abs(kcal - slotTarget);
        if (proteinGoal && proteinGoal > 0) {
          score -= (food.protein_per_100g / 100) * 2;
        }
        if (score < bestScore) {
          bestScore = score;
          best = food;
        }
      }
      used.add(best.id);
      // Gap-fill by scaling portions: stretch/shrink grams so this slot
      // lands on its calorie share, clamped to 0.5x–2.5x of a serving.
      const base = baseGrams(best);
      const baseKcal = (best.calories_per_100g * base) / 100;
      const rawFactor = baseKcal > 0 ? slotTarget / baseKcal : 1;
      const factor = Math.max(0.5, Math.min(2.5, rawFactor));
      const portion_grams = Math.round(base * factor);
      const scaled = scaleFood(best, portion_grams);
      return { meal_type, food: best, portion_grams, ...scaled };
    });
    // Second pass: scale the whole day proportionally if clamping left the
    // day short/over vs the goal (same idea as choosePlan's 0.5–2x factor).
    const dayTotal = items.reduce((sum, i) => sum + i.calories, 0);
    const dayFactor = dayTotal > 0 ? Math.max(0.5, Math.min(2, calorieGoal / dayTotal)) : 1;
    if (Math.abs(dayFactor - 1) > 0.02) {
      for (const item of items) {
        item.portion_grams = Math.max(20, Math.round(item.portion_grams * dayFactor));
        const scaled = scaleFood(item.food, item.portion_grams);
        item.calories = scaled.calories;
        item.protein = scaled.protein;
        item.carbs = scaled.carbs;
        item.fat = scaled.fat;
      }
    }
    plans.push({
      dateOffset: day,
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalProtein: items.reduce((sum, i) => sum + i.protein, 0),
    });
  }
  return plans;
}
