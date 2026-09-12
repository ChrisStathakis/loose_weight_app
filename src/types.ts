export type Locale = 'en' | 'el';
export type Diet = 'balanced' | 'vegetarian' | 'vegan';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Food = {
  id: string;
  name_en: string;
  name_el: string;
  brand?: string | null;
  barcode?: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  serving_grams?: number | null;
  source: string;
  is_favorite?: number | null;
};

export type RecipeIngredient = {
  name_en: string;
  name_el: string;
  amount: number;
  unit: string;
};

export type Recipe = {
  id: string;
  name_en: string;
  name_el: string;
  diet: Diet;
  ingredients: RecipeIngredient[];
  instructions_en: string;
  instructions_el: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
};

export type Settings = {
  locale: Locale;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  diet: Diet;
  excluded: string[];
  onboarding_complete: boolean;
};

export type DiaryEntry = {
  id: number;
  date: string;
  meal_type: MealType;
  food_id: string;
  food_name: string;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type PlanEntry = {
  id: number;
  date: string;
  meal_type: MealType;
  recipe_id: string | null;
  portion: number;
  locked: boolean;
  recipe?: Recipe;
  kind: 'recipe' | 'food';
  food_id?: string | null;
  food_name?: string | null;
  portion_grams?: number | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  food?: Food;
};

export type GroceryItem = {
  id: number;
  ingredient: string;
  amount: number;
  unit: string;
  checked: boolean;
};

export type OpponentId = 'sugar-gremlin' | 'snack-kraken' | 'couch-sloth';

export type Opponent = {
  id: OpponentId;
  name_en: string;
  name_el: string;
  emoji: string;
  gradient: readonly [string, string, string];
  taunt_en: string;
  taunt_el: string;
  weakness_en: string;
  weakness_el: string;
};

export type BadgeId = 'streak-3' | 'goal-crusher' | 'hydrated' | 'boss-slayer' | 'planner-pro' | 'workout-warrior';

export type Badge = {
  id: BadgeId;
  emoji: string;
  name_en: string;
  name_el: string;
  desc_en: string;
  desc_el: string;
};

export type WorkoutType =
  | 'walk' | 'run' | 'cycle' | 'swim' | 'strength'
  | 'hiit' | 'yoga' | 'football' | 'basketball' | 'dance'
  | 'hike' | 'rowing' | 'elliptical' | 'other';

export type WorkoutSource = 'manual' | 'health-connect';

export type Workout = {
  id: number;
  date: string;
  type: WorkoutType;
  minutes: number;
  calories: number;
  weight_kg: number | null;
  source: WorkoutSource;
  external_id: string | null;
  note: string | null;
  steps: number | null;
  distance_m: number | null;
};
