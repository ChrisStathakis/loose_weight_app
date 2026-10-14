import type { Diet, Food, MealType, Recipe } from '../types';
import { scaleFood } from './nutrition';

export const mealOrder = ['breakfast', 'brunch', 'snack', 'lunch', 'snack2', 'dinner', 'snack3'] as const;
export const containsExcluded = (recipe: Recipe, excluded: string[]) => {
  const haystack = `${recipe.name_en} ${recipe.name_el} ${recipe.ingredients.map((i) => `${i.name_en} ${i.name_el}`).join(' ')}`.toLowerCase();
  return excluded.some((item) => item.trim() && haystack.includes(item.trim().toLowerCase()));
};

export function eligibleRecipes(recipes: Recipe[], diet: Diet, excluded: string[]) {
  return recipes.filter((recipe) => {
    // Vegetarian/vegan stay strict; newer therapeutic styles (keto, low-carb,
    // high-protein, mediterranean, paleo, gluten-free) have no tagged recipes
    // yet, so they fall back to balanced semantics instead of empty plans.
    const dietAllowed =
      diet === 'balanced' ||
      recipe.diet === diet ||
      (diet === 'vegetarian' && recipe.diet === 'vegan') ||
      (diet !== 'vegetarian' && diet !== 'vegan');
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
    const orderWeights = slotWeights[mealOrder.length] ?? mealOrder.map(() => 1 / mealOrder.length);
    const target = calorieGoal * (orderWeights[index] ?? 1 / mealOrder.length);
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
  if (count === 4) return ['breakfast', 'lunch', 'dinner', 'snack'];
  if (count === 5) return ['breakfast', 'snack', 'lunch', 'snack2', 'dinner'];
  if (count === 6) return ['breakfast', 'snack', 'lunch', 'snack2', 'dinner', 'snack3'];
  return ['breakfast', 'brunch', 'snack', 'lunch', 'snack2', 'dinner', 'snack3'];
}

const slotWeights: Record<number, number[]> = {
  2: [0.45, 0.55],
  3: [0.3, 0.35, 0.35],
  4: [0.25, 0.3, 0.3, 0.15],
  5: [0.25, 0.1, 0.3, 0.1, 0.25],
  6: [0.25, 0.1, 0.25, 0.1, 0.25, 0.05],
  7: [0.22, 0.1, 0.08, 0.27, 0.08, 0.2, 0.05],
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
  const slots = mealSlotsForCount(Math.max(2, Math.min(7, Math.round(mealsPerDay))));
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

export type ProposalFoodItem = {
  kind: 'food';
  meal_type: MealType;
  food: Food;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ProposalRecipeItem = {
  kind: 'recipe';
  meal_type: MealType;
  recipe: Recipe;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ProposalItem = ProposalFoodItem | ProposalRecipeItem;

export type ProposalDay = {
  dateOffset: number;
  items: ProposalItem[];
  totalCalories: number;
  totalProtein: number;
  /** True when the food pool came from eating-style defaults (no liked foods). */
  usedDefaults: boolean;
};

export const containsExcludedFood = (food: Food, excluded: string[]) => {
  const haystack = `${food.name_en} ${food.name_el} ${food.brand ?? ''}`.toLowerCase();
  return excluded.some((item) => item.trim() && haystack.includes(item.trim().toLowerCase()));
};

const clampPortion = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * Mixed proposal: foods fill most slots while recipes take dinner (plus lunch
 * on 3+ meals/day), drawn from the eating-style defaults. When the user has
 * liked foods they form the food pool; otherwise the style's default foods
 * are used and `usedDefaults` is set so the UI can say so. Unknown recipe IDs
 * and excluded matches are skipped, never fatal.
 */
export function buildProposal(opts: {
  liked: Food[];
  defaultFoods: Food[];
  recipes: Recipe[];
  defaultRecipeIds: string[];
  calorieGoal: number;
  mealsPerDay: number;
  days: number;
  proteinGoal?: number | null;
  excluded?: string[];
}): ProposalDay[] {
  const { liked, defaultFoods, recipes, defaultRecipeIds, calorieGoal } = opts;
  const perDay = Math.max(2, Math.min(7, Math.round(opts.mealsPerDay)));
  const dayCount = Math.max(1, Math.min(7, Math.round(opts.days)));
  const excluded = opts.excluded ?? [];
  if (calorieGoal <= 0) return [];
  const foodPool = (liked.length ? liked : defaultFoods).filter((f) => !containsExcludedFood(f, excluded));
  if (!foodPool.length) return [];
  const usedDefaults = liked.length === 0;
  const wanted = new Set(defaultRecipeIds);
  const eligible = recipes.filter((r) => wanted.has(r.id) && !containsExcluded(r, excluded));
  const slots = mealSlotsForCount(perDay);
  const weights = slotWeights[slots.length] ?? slots.map(() => 1 / slots.length);
  // Dinner is always a recipe when any are available; lunch joins it on
  // 3+ meals/day so the proposal shows both foods and recipes to edit.
  const recipeMeals = new Set<MealType>(['dinner']);
  if (slots.length >= 3) recipeMeals.add('lunch');

  const out: ProposalDay[] = [];
  for (let day = 0; day < dayCount; day += 1) {
    const usedFood = new Set<string>();
    const usedRecipe = new Set<string>();
    const items: ProposalItem[] = slots.map((meal_type, slotIndex) => {
      const slotTarget = calorieGoal * (weights[slotIndex] ?? 1 / slots.length);
      if (recipeMeals.has(meal_type) && eligible.length) {
        const fresh = eligible.filter((r) => !usedRecipe.has(r.id));
        const pool = fresh.length ? fresh : eligible;
        // Closest calorie fit, rotated by day so multi-day plans vary.
        const sorted = [...pool].sort(
          (a, b) => Math.abs(a.calories - slotTarget) - Math.abs(b.calories - slotTarget),
        );
        const recipe = sorted[day % sorted.length];
        usedRecipe.add(recipe.id);
        const portion = Number(clampPortion(slotTarget / Math.max(recipe.calories, 1), 0.5, 2).toFixed(2));
        return {
          kind: 'recipe' as const,
          meal_type,
          recipe,
          portion,
          calories: recipe.calories * portion,
          protein: recipe.protein * portion,
          carbs: recipe.carbs * portion,
          fat: recipe.fat * portion,
        };
      }
      const candidates = foodPool.filter((f) => !usedFood.has(f.id));
      const pool = candidates.length ? candidates : foodPool;
      let best = pool[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const food of pool) {
        const kcal = (food.calories_per_100g * baseGrams(food)) / 100;
        let score = Math.abs(kcal - slotTarget);
        if (opts.proteinGoal && opts.proteinGoal > 0) {
          score -= (food.protein_per_100g / 100) * 2;
        }
        if (score < bestScore) {
          bestScore = score;
          best = food;
        }
      }
      usedFood.add(best.id);
      const base = baseGrams(best);
      const baseKcal = (best.calories_per_100g * base) / 100;
      const rawFactor = baseKcal > 0 ? slotTarget / baseKcal : 1;
      const factor = clampPortion(rawFactor, 0.5, 2.5);
      const portion_grams = Math.round(base * factor);
      const scaled = scaleFood(best, portion_grams);
      return { kind: 'food' as const, meal_type, food: best, portion_grams, ...scaled };
    });
    // Second pass: scale the whole day proportionally when clamping left it
    // short/over vs the goal. Foods scale by grams, recipes by portion.
    const dayTotal = items.reduce((sum, i) => sum + i.calories, 0);
    const dayFactor = dayTotal > 0 ? clampPortion(calorieGoal / dayTotal, 0.5, 2) : 1;
    if (Math.abs(dayFactor - 1) > 0.02) {
      for (const item of items) {
        if (item.kind === 'food') {
          item.portion_grams = Math.max(20, Math.round(item.portion_grams * dayFactor));
          const scaled = scaleFood(item.food, item.portion_grams);
          item.calories = scaled.calories;
          item.protein = scaled.protein;
          item.carbs = scaled.carbs;
          item.fat = scaled.fat;
        } else {
          item.portion = Number(clampPortion(item.portion * dayFactor, 0.5, 2).toFixed(2));
          item.calories = item.recipe.calories * item.portion;
          item.protein = item.recipe.protein * item.portion;
          item.carbs = item.recipe.carbs * item.portion;
          item.fat = item.recipe.fat * item.portion;
        }
      }
    }
    out.push({
      dateOffset: day,
      items,
      totalCalories: items.reduce((sum, i) => sum + i.calories, 0),
      totalProtein: items.reduce((sum, i) => sum + i.protein, 0),
      usedDefaults,
    });
  }
  return out;
}
