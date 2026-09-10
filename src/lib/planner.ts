import { Diet, Recipe } from '@/src/types';

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
