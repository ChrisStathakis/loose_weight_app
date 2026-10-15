import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { addDaysKey, weekKeys } from '@/src/lib/dates';
import { buildProposal, containsExcluded, containsExcludedFood, ProposalDay, ProposalItem, mealSlotsForCount } from '@/src/lib/planner';
import { parseNumber, scaleFood, sumNutrition } from '@/src/lib/nutrition';
import { foodEmoji } from '@/src/lib/habits';
import { filterFoods, normalizeEl } from '@/src/lib/search';
import { Food, MealType, PlanEntry, Recipe } from '@/src/types';
import { dietDefaults } from '@/src/data/dietDefaults';
import { gradients, radius, useAppTheme } from '@/src/theme';
import { PriceSheet } from '@/src/components/PriceSheet';
import { formatCheapest, getFoodPriceMap } from '@/src/lib/foodPrices';
import { formatCheapestRecipe, getRecipePriceMap } from '@/src/lib/recipePrices';
import type { FoodPriceOption, RecipePriceOption } from '@/src/types';
import { WeekTabs, type WeekTabMark } from '@/src/components/WeekTabs';
import { EmptyState } from '@/src/components/EmptyState';
import { KcalBadge } from '@/src/components/MacroPill';
import { GradientHero } from '@/src/ui/GradientHero';
import { PressScale } from '@/src/ui/PressScale';
import { DetailSheet, type DetailTarget } from '@/src/components/DetailSheet';

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };

// A corrupt ingredients payload must not blank the whole plan screen:
// skip the row with a warning instead of throwing inside load(). Non-array
// JSON (e.g. a string) also fails the guard: .map/.some on it would crash
// the render later.
const parseRecipeRow = (row: RecipeRow): Recipe | null => {
  try {
    const parsed = JSON.parse(row.ingredients);
    if (!Array.isArray(parsed)) throw new Error('ingredients is not an array');
    return { ...row, ingredients: parsed };
  } catch (e) {
    console.warn('Skipping recipe with corrupt ingredients', row.id, e);
    return null;
  }
};

const addDays = (base: string, offset: number) => addDaysKey(base, offset);

const mealRank = (meal: string) =>
  meal === 'breakfast' ? 1 : meal === 'brunch' ? 2 : meal === 'snack' ? 3 : meal === 'lunch' ? 4 : meal === 'snack2' ? 5 : meal === 'dinner' ? 6 : 7;

const foodName = (food: Food, locale: 'en' | 'el') =>
  (locale === 'el' ? food.name_el : food.name_en) || food.name_en || food.name_el;

function StepHeader({ n, title, open, onToggle }: { n: number; title: string; open?: boolean; onToggle?: () => void }) {
  const { colors } = useAppTheme();
  const body = (
    <>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.onInk, fontWeight: '900', fontSize: 14 }}>{n}</Text>
      </View>
      <Text style={{ flex: 1, color: colors.ink, fontWeight: '900', fontSize: 17 }}>{title}</Text>
      {onToggle ? (
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      ) : null}
    </>
  );
  if (onToggle) {
    return (
      <Pressable onPress={onToggle} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, paddingVertical: 4 }}>
        {body}
      </Pressable>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 }}>
      {body}
    </View>
  );
}

const isExcludedFood = (food: Food, excluded: string[]) => containsExcludedFood(food, excluded);
const isExcludedRecipe = (recipe: Recipe, excluded: string[]) => containsExcluded(recipe, excluded);

export default function Plan() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings, locale, t } = useApp();
  const { colors, styles } = useAppTheme();
  const { addXp, unlockBadge, celebrate } = useGamification();
  const [date, setDate] = useState(dateKey());
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [weekPlanInfo, setWeekPlanInfo] = useState<Record<string, WeekTabMark>>({});

  // Builder state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foodsCount, setFoodsCount] = useState<number | null>(null);
  const [liked, setLiked] = useState<Food[]>([]);
  const [days, setDays] = useState(3);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [calorieInput, setCalorieInput] = useState('');
  const [useProtein, setUseProtein] = useState(false);
  const [preview, setPreview] = useState<ProposalDay[] | null>(null);
  const [previewDay, setPreviewDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [defaultFoods, setDefaultFoods] = useState<Food[]>([]);
  const [defaultRecipes, setDefaultRecipes] = useState<Recipe[]>([]);
  const [likedPrices, setLikedPrices] = useState<Record<string, FoodPriceOption[]>>({});
  const [priceFood, setPriceFood] = useState<Food | null>(null);
  const [recipePrices, setRecipePrices] = useState<Record<string, RecipePriceOption[]>>({});
  const [priceRecipe, setPriceRecipe] = useState<Recipe | null>(null);
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [builderOpen, setBuilderOpen] = useState(true);
  // Null = the picker adds to the saved plan; a day index = it edits that
  // proposal-preview day in memory instead of touching the DB.
  const [addPreviewDay, setAddPreviewDay] = useState<number | null>(null);
  const [addTab, setAddTab] = useState<'food' | 'recipe'>('food');
  const [addQuery, setAddQuery] = useState('');
  const [addFoodResults, setAddFoodResults] = useState<Food[]>([]);
  const [addRecipeResults, setAddRecipeResults] = useState<Recipe[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  // Scroll preservation: mutated lists (add/remove/replace) reload from the
  // DB and re-render, which can throw the viewport elsewhere. We remember the
  // offset before reloading and restore it right after the new render lands.
  const scrollOffset = useRef(0);
  const restoreOffset = useRef<number | null>(null);

  const calorieGoal = Math.max(500, parseNumber(calorieInput, settings.calorie_goal) || settings.calorie_goal);

  useEffect(() => {
    setCalorieInput(String(Math.round(settings.calorie_goal)));
  }, [settings.calorie_goal]);

  const load = useCallback(async () => {
    try {
    const recipeRows = await db.getAllAsync<RecipeRow>('SELECT * FROM recipes');
    const allRecipes = recipeRows.map(parseRecipeRow).filter((r): r is Recipe => r != null);
    const foodRows = await db.getAllAsync<Food>('SELECT * FROM foods');
    const foodById = new Map(foodRows.map((f) => [f.id, f]));
    setFoodsCount(foodRows.length);
    setAllFoods(foodRows);
    setAllRecipes(allRecipes);
    const entries = await db.getAllAsync<any>('SELECT * FROM plans WHERE date=?', date);
    entries.sort((a, b) => mealRank(String(a.meal_type)) - mealRank(String(b.meal_type)));
    setPlans(
      entries.map((entry) => {
        const isFood = entry.food_id != null && String(entry.food_id) !== '';
        const recipe = !isFood ? allRecipes.find((r) => r.id === entry.recipe_id) : undefined;
        const food = isFood ? foodById.get(String(entry.food_id)) : undefined;
        return {
          id: entry.id,
          date: entry.date,
          meal_type: entry.meal_type as MealType,
          recipe_id: entry.recipe_id ?? null,
          portion: Number(entry.portion ?? 1),
          locked: Boolean(entry.locked),
          recipe,
          kind: isFood ? ('food' as const) : ('recipe' as const),
          food_id: entry.food_id ?? null,
          food_name: entry.food_name ?? null,
          portion_grams: entry.portion_grams != null ? Number(entry.portion_grams) : null,
          calories: entry.calories != null ? Number(entry.calories) : null,
          protein: entry.protein != null ? Number(entry.protein) : null,
          carbs: entry.carbs != null ? Number(entry.carbs) : null,
          fat: entry.fat != null ? Number(entry.fat) : null,
          food,
        } as PlanEntry;
      }),
    );
    // Week strip marks: which days of the visible week have saved plan rows.
    const week = weekKeys(date);
    const weekRows = await db.getAllAsync<{ date: string; n: number }>(
      'SELECT date, COUNT(*) as n FROM plans WHERE date BETWEEN ? AND ? GROUP BY date',
      week[0], week[6],
    );
    const weekMarks: Record<string, WeekTabMark> = {};
    for (const row of weekRows) if (Number(row.n) > 0) weekMarks[row.date] = 'has-data';
    setWeekPlanInfo(weekMarks);
    } catch (e) {
      console.error('Failed to load plan', e);
    }
  }, [db, date]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const reloadPreservingScroll = useCallback(async () => {
    restoreOffset.current = scrollOffset.current;
    await load();
  }, [load]);

  // Runs after every plans/preview render; restores only when a mutation
  // asked for it, so focus reloads and saves keep their natural behavior.
  useEffect(() => {
    if (restoreOffset.current == null) return;
    const y = restoreOffset.current;
    restoreOffset.current = null;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y, animated: false });
    });
  }, [plans, preview]);

  // Liked-food search against the existing foods DB. With a blank query we
  // show favorites first, then everything else, so the list never starts
  // empty on a seeded database.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const candidates = await db.getAllAsync<Food>(
          'SELECT * FROM foods ORDER BY is_favorite DESC, name_en COLLATE NOCASE',
        );
        if (!cancelled) { setSearchResults(filterFoods(candidates, normalizeEl(query), 8)); setSearchError(null); }
      } catch (e) {
        console.error('Failed to search plan foods', e);
        if (!cancelled) setSearchError(String(e instanceof Error ? e.message : e));
      }
    };
    const timer = setTimeout(run, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [db, query]);

  const addLiked = (food: Food) => {
    setLiked((current) => (current.some((f) => f.id === food.id) ? current : [...current, food]));
    setPreview(null);
  };
  const removeLiked = (id: string) => {
    setLiked((current) => current.filter((f) => f.id !== id));
    setPreview(null);
  };

  // "Add to meal" picker search: foods reuse the app-wide fuzzy filter,
  // recipes match on either locale name. Runs only while the modal is open.
  useEffect(() => {
    if (!addMeal) return;
    const timer = setTimeout(() => {
      if (addTab === 'food') {
        setAddFoodResults(filterFoods(allFoods, normalizeEl(addQuery), 8));
      } else {
        const q = normalizeEl(addQuery);
        const matches = !q
          ? allRecipes.slice(0, 8)
          : allRecipes.filter((r) =>
              normalizeEl(`${r.name_en} ${r.name_el}`).includes(q),
            ).slice(0, 8);
        setAddRecipeResults(matches);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [addMeal, addTab, addQuery, allFoods, allRecipes]);

  const refreshLikedPrices = useCallback(async () => {
    try {
      setLikedPrices(await getFoodPriceMap(db, liked.map((f) => f.id)));
    } catch {
      // prices are best-effort
    }
  }, [db, liked]);

  useEffect(() => { refreshLikedPrices(); }, [refreshLikedPrices]);

  const refreshRecipePrices = useCallback(async () => {
    try {
      const ids = [...new Set(plans.flatMap((p) => (p.recipe ? [p.recipe.id] : [])))];
      setRecipePrices(await getRecipePriceMap(db, ids));
    } catch {
      // prices are best-effort
    }
  }, [db, plans]);

  useEffect(() => { refreshRecipePrices(); }, [refreshRecipePrices]);

  // Eating-style defaults for the proposal: resolved from the seeded library
  // so Generate plan works with zero liked foods. Unknown IDs are skipped.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const ids = dietDefaults[settings.diet];
        const foodRows = ids.foods.length
          ? await db.getAllAsync<Food>(
              `SELECT * FROM foods WHERE id IN (${ids.foods.map(() => '?').join(',')})`,
              ...ids.foods,
            )
          : [];
        const recipeRows = ids.recipes.length
          ? await db.getAllAsync<RecipeRow>(
              `SELECT * FROM recipes WHERE id IN (${ids.recipes.map(() => '?').join(',')})`,
              ...ids.recipes,
            )
          : [];
        if (cancelled) return;
        setDefaultFoods(foodRows);
        setDefaultRecipes(recipeRows.map(parseRecipeRow).filter((r): r is Recipe => r != null));
      } catch (e) {
        console.error('Failed to load style defaults', e);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [db, settings.diet]);

  const generate = () => {
    const pool = liked.length ? liked : defaultFoods;
    if (!pool.length) {
      Alert.alert(t('plan'), t('needFoods'));
      return;
    }
    const result = buildProposal({
      liked,
      defaultFoods,
      recipes: defaultRecipes,
      defaultRecipeIds: dietDefaults[settings.diet].recipes,
      calorieGoal,
      mealsPerDay,
      days,
      proteinGoal: useProtein ? settings.protein_goal : null,
      excluded: settings.excluded,
    });
    if (!result.length) {
      Alert.alert(t('plan'), t('needFoods'));
      return;
    }
    setPreview(result);
    setPreviewDay(0);
    setAddMeal(null);
    setAddPreviewDay(null);
    // The proposal renders below the button — bring it into view so the
    // press visibly does something.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const save = async () => {
    if (!preview?.length || saving) return;
    setSaving(true);
    try {
      // Save every preview day to consecutive dates starting from `date`.
      // Locked meals on Day 1 survive; future days are overwritten.
      let skippedLocked = 0;
      for (let di = 0; di < preview.length; di += 1) {
        const day = preview[di];
        const dayDate = addDays(date, day.dateOffset);
        const existing = di === 0
          ? await db.getAllAsync<any>('SELECT meal_type,locked FROM plans WHERE date=?', dayDate)
          : [];
        const lockedMeals = new Set(existing.filter((r) => Number(r.locked) === 1).map((r) => String(r.meal_type)));
        // Only clear unlocked slots so locked meals survive regeneration.
        if (lockedMeals.size) {
          const placeholders = [...lockedMeals].map(() => '?').join(',');
          await db.runAsync(
            `DELETE FROM plans WHERE date=? AND meal_type NOT IN (${placeholders})`,
            dayDate, ...[...lockedMeals],
          );
        } else {
          await db.runAsync('DELETE FROM plans WHERE date=?', dayDate);
        }
        for (const item of day.items) {
          if (lockedMeals.has(item.meal_type)) {
            skippedLocked += 1;
            continue;
          }
          if (item.kind === 'recipe') {
            await db.runAsync(
              'INSERT INTO plans (date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
              dayDate, item.meal_type, item.recipe.id, item.portion, 0,
              null, null, null, null, null, null, null,
            );
            continue;
          }
          const name = foodName(item.food, locale);
          await db.runAsync(
            'INSERT INTO plans (date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            dayDate, item.meal_type, '', 1, 0,
            item.food.id, name, item.portion_grams, item.calories, item.protein, item.carbs, item.fat,
          );
        }
      }
      setPreview(null);
      setBuilderOpen(false);
      await load();
      addXp('plan-saved');
      unlockBadge('planner-pro');
      Alert.alert(t('plan'), skippedLocked > 0 ? `${t('planSaved')} ${t('lockedKept')}` : t('planSaved'));
    } catch (e) {
      console.error('Failed to save plan', e);
      Alert.alert(t('plan'), String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (entry: PlanEntry) => {
    await db.runAsync('UPDATE plans SET locked=? WHERE id=?', entry.locked ? 0 : 1, entry.id);
    reloadPreservingScroll();
  };

  const customRecipes = allRecipes.filter((r) => r.id.startsWith('custom-recipe-'));
  const removeRecipe = (id: string) => {
    Alert.alert(t('remove'), t('deleteRecipeConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          // Plans store only recipe_id: deleting the recipe without its plan
          // rows would leave entries that log 0 kcal and can never be logged.
          try {
            await db.withTransactionAsync(async () => {
              await db.runAsync('DELETE FROM plans WHERE recipe_id=?', id);
              await db.runAsync('DELETE FROM recipes WHERE id=?', id);
            });
          } catch (e) {
            console.error('Failed to delete recipe', e);
          }
          reloadPreservingScroll();
        },
      },
    ]);
  };

  const replaceFood = async (entry: PlanEntry) => {
    if (entry.locked || entry.kind !== 'food') return;
    const base = [...liked, ...defaultFoods.filter((f) => !liked.some((l) => l.id === f.id))].filter(
      (f) => f.id !== entry.food_id,
    );
    const allowed = base.filter((f) => !isExcludedFood(f, settings.excluded));
    const pool = allowed.length ? allowed : base;
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    const oldKcal = Number(entry.calories ?? 0) || 300;
    const per100 = Number(next.calories_per_100g) || 1;
    const grams = Math.max(20, Math.min(600, Math.round((oldKcal / per100) * 100)));
    const scaled = scaleFood(next, grams);
    const name = foodName(next, locale);
    await db.runAsync(
      'UPDATE plans SET food_id=?, food_name=?, portion_grams=?, calories=?, protein=?, carbs=?, fat=? WHERE id=?',
      next.id, name, grams, scaled.calories, scaled.protein, scaled.carbs, scaled.fat, entry.id,
    );
    reloadPreservingScroll();
  };

  const replaceRecipe = async (entry: PlanEntry) => {
    if (entry.locked || entry.kind !== 'recipe') return;
    const base = defaultRecipes.filter((r) => r.id !== entry.recipe_id);
    const allowedBase = base.filter((r) => !isExcludedRecipe(r, settings.excluded));
    const fresh = allowedBase.length ? allowedBase : base;
    const allowedAll = defaultRecipes.filter((r) => !isExcludedRecipe(r, settings.excluded));
    const pool = fresh.length ? fresh : allowedAll.length ? allowedAll : defaultRecipes;
    if (!pool.length) return;
    const next = pool[Math.floor(Math.random() * pool.length)];
    const oldKcal = (entry.recipe?.calories ?? 0) * entry.portion || 400;
    const portion = Number(Math.max(0.5, Math.min(2, oldKcal / Math.max(next.calories, 1))).toFixed(2));
    await db.runAsync('UPDATE plans SET recipe_id=?, portion=? WHERE id=?', next.id, portion, entry.id);
    reloadPreservingScroll();
  };

  const adjustFoodGrams = async (entry: PlanEntry, delta: number) => {
    if (entry.locked || entry.kind !== 'food') return;
    const foodRow = await db.getFirstAsync<Food>('SELECT * FROM foods WHERE id=?', String(entry.food_id ?? ''));
    if (!foodRow) return;
    const grams = Math.max(20, Math.min(800, Math.round(Number(entry.portion_grams ?? 100) + delta)));
    const scaled = scaleFood(foodRow, grams);
    await db.runAsync(
      'UPDATE plans SET portion_grams=?, calories=?, protein=?, carbs=?, fat=? WHERE id=?',
      grams, scaled.calories, scaled.protein, scaled.carbs, scaled.fat, entry.id,
    );
    reloadPreservingScroll();
  };

  const adjustRecipePortion = async (entry: PlanEntry, delta: number) => {
    if (entry.locked || entry.kind !== 'recipe') return;
    const next = Math.max(0.5, Math.min(3, Number((entry.portion + delta).toFixed(2))));
    await db.runAsync('UPDATE plans SET portion=? WHERE id=?', next, entry.id);
    reloadPreservingScroll();
  };

  const removeEntry = (entry: PlanEntry) => {
    if (entry.locked) return;
    Alert.alert(t('removePlanTitle'), t('removePlanConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM plans WHERE id=?', entry.id);
          reloadPreservingScroll();
        },
      },
    ]);
  };

  const addFoodToMeal = async (food: Food, meal: MealType) => {
    const grams = Math.max(20, Math.round(Number(food.serving_grams) || 100));
    const scaled = scaleFood(food, grams);
    await db.runAsync(
      'INSERT INTO plans (date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      date, meal, '', 1, 0,
      food.id, foodName(food, locale), grams, scaled.calories, scaled.protein, scaled.carbs, scaled.fat,
    );
    setAddMeal(null);
    reloadPreservingScroll();
  };

  const addRecipeToMeal = async (recipe: Recipe, meal: MealType) => {
    await db.runAsync(
      'INSERT INTO plans (date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      date, meal, recipe.id, 1, 0,
      null, null, null, null, null, null, null,
    );
    setAddMeal(null);
    reloadPreservingScroll();
  };

  // ---- Proposal-preview editing (in-memory, applied on Save) ----
  const retotalPreviewDay = (day: ProposalDay): ProposalDay => ({
    ...day,
    totalCalories: day.items.reduce((s, i) => s + i.calories, 0),
    totalProtein: day.items.reduce((s, i) => s + i.protein, 0),
  });

  const patchPreviewDay = (di: number, fn: (items: ProposalItem[]) => ProposalItem[]) => {
    setPreview((prev) => (prev ? prev.map((d, i) => (i === di ? retotalPreviewDay({ ...d, items: fn(d.items) }) : d)) : prev));
  };

  const replacePreviewItem = (di: number, idx: number) => {
    const item = preview?.[di]?.items[idx];
    if (!item) return;
    if (item.kind === 'food') {
      const base = [...liked, ...defaultFoods.filter((f) => !liked.some((l) => l.id === f.id))].filter(
        (f) => f.id !== item.food.id,
      );
      const allowed = base.filter((f) => !isExcludedFood(f, settings.excluded));
      const pool = allowed.length ? allowed : base;
      if (!pool.length) return;
      const next = pool[Math.floor(Math.random() * pool.length)];
      const per100 = Number(next.calories_per_100g) || 1;
      const grams = Math.max(20, Math.min(600, Math.round((item.calories / per100) * 100)));
      const scaled = scaleFood(next, grams);
      patchPreviewDay(di, (items) =>
        items.map((it, i) => (i === idx ? { kind: 'food' as const, meal_type: it.meal_type, food: next, portion_grams: grams, ...scaled } : it)),
      );
    } else {
      const base = defaultRecipes.filter((r) => r.id !== item.recipe.id);
      const allowedBase = base.filter((r) => !isExcludedRecipe(r, settings.excluded));
      const fresh = allowedBase.length ? allowedBase : base;
      const allowedAll = defaultRecipes.filter((r) => !isExcludedRecipe(r, settings.excluded));
      const pool = fresh.length ? fresh : allowedAll.length ? allowedAll : defaultRecipes;
      if (!pool.length) return;
      const next = pool[Math.floor(Math.random() * pool.length)];
      const portion = Number(Math.max(0.5, Math.min(2, item.calories / Math.max(next.calories, 1))).toFixed(2));
      patchPreviewDay(di, (items) =>
        items.map((it, i) => (i === idx ? {
          kind: 'recipe' as const, meal_type: it.meal_type, recipe: next, portion,
          calories: next.calories * portion, protein: next.protein * portion,
          carbs: next.carbs * portion, fat: next.fat * portion,
        } : it)),
      );
    }
  };

  const removePreviewItem = (di: number, idx: number) => {
    Alert.alert(t('removePlanTitle'), t('removePlanConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('remove'),
        style: 'destructive',
        onPress: () => patchPreviewDay(di, (items) => items.filter((_, i) => i !== idx)),
      },
    ]);
  };

  const adjustPreviewFood = (di: number, idx: number, delta: number) => {
    const item = preview?.[di]?.items[idx];
    if (!item || item.kind !== 'food') return;
    const grams = Math.max(20, Math.min(800, Math.round(item.portion_grams + delta)));
    const scaled = scaleFood(item.food, grams);
    patchPreviewDay(di, (items) =>
      items.map((it, i) => (i === idx && it.kind === 'food' ? { ...it, portion_grams: grams, ...scaled } : it)),
    );
  };

  const adjustPreviewRecipe = (di: number, idx: number, delta: number) => {
    const item = preview?.[di]?.items[idx];
    if (!item || item.kind !== 'recipe') return;
    const portion = Math.max(0.5, Math.min(3, Number((item.portion + delta).toFixed(2))));
    patchPreviewDay(di, (items) =>
      items.map((it, i) => (i === idx && it.kind === 'recipe' ? {
        ...it, portion,
        calories: it.recipe.calories * portion, protein: it.recipe.protein * portion,
        carbs: it.recipe.carbs * portion, fat: it.recipe.fat * portion,
      } : it)),
    );
  };

  const addFoodToPreview = (di: number, meal: MealType, food: Food) => {
    const grams = Math.max(20, Math.round(Number(food.serving_grams) || 100));
    const scaled = scaleFood(food, grams);
    const entry: ProposalItem = { kind: 'food', meal_type: meal, food, portion_grams: grams, ...scaled };
    patchPreviewDay(di, (items) => [...items, entry].sort((a, b) => mealRank(a.meal_type) - mealRank(b.meal_type)));
    setAddMeal(null);
    setAddPreviewDay(null);
    celebrate(`${t('addedToPlan')} · ${t('dayPlan')} ${di + 1} · ${t(meal)}`, '✅');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const addRecipeToPreview = (di: number, meal: MealType, recipe: Recipe) => {
    const entry: ProposalItem = {
      kind: 'recipe', meal_type: meal, recipe, portion: 1,
      calories: recipe.calories, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat,
    };
    patchPreviewDay(di, (items) => [...items, entry].sort((a, b) => mealRank(a.meal_type) - mealRank(b.meal_type)));
    setAddMeal(null);
    setAddPreviewDay(null);
    celebrate(`${t('addedToPlan')} · ${t('dayPlan')} ${di + 1} · ${t(meal)}`, '✅');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const logMeal = async (entry: PlanEntry) => {
    try {
      if (entry.kind === 'food') {
        await db.runAsync(
          'INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)',
          entry.date, entry.meal_type, String(entry.food_id ?? 'custom'),
          String(entry.food_name ?? t('unknown')),
          Number(entry.portion_grams ?? 100), Number(entry.calories ?? 0),
          Number(entry.protein ?? 0), Number(entry.carbs ?? 0), Number(entry.fat ?? 0),
          'Planner',
        );
      } else {
        if (!entry.recipe) {
          // Orphaned plan row (recipe deleted by an older build): explain
          // instead of silently doing nothing.
          Alert.alert(t('logMeal'), t('recipeMissing'));
          return;
        }
        await db.runAsync(
          'INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)',
          entry.date, entry.meal_type, entry.recipe.id,
          locale === 'el' ? entry.recipe.name_el : entry.recipe.name_en,
          entry.portion, entry.recipe.calories * entry.portion,
          entry.recipe.protein * entry.portion, entry.recipe.carbs * entry.portion,
          entry.recipe.fat * entry.portion, 'Daily Plate recipe',
        );
      }
      Alert.alert(t('logMeal'), t('saved'));
    } catch (e) {
      console.error('Failed to log meal', e);
    }
  };

  const entryTotals = (entry: PlanEntry) =>
    entry.kind === 'food'
      ? { calories: Number(entry.calories ?? 0), protein: Number(entry.protein ?? 0), carbs: Number(entry.carbs ?? 0), fat: Number(entry.fat ?? 0) }
      : {
          calories: (entry.recipe?.calories ?? 0) * entry.portion,
          protein: (entry.recipe?.protein ?? 0) * entry.portion,
          carbs: (entry.recipe?.carbs ?? 0) * entry.portion,
          fat: (entry.recipe?.fat ?? 0) * entry.portion,
        };

  const totals = sumNutrition(plans.map(entryTotals));
  const slots = mealSlotsForCount(mealsPerDay);
  // Saved-plan sections: current slots ∪ any category with saved rows, in
  // chronological order. Multiple items per category are allowed.
  const sections: MealType[] = (() => {
    const list: MealType[] = [...slots];
    for (const p of plans) {
      if (!list.includes(p.meal_type)) list.push(p.meal_type);
    }
    list.sort((a, b) => mealRank(a) - mealRank(b));
    return list;
  })();
  const previewTotals = preview
    ? preview.map((d) => ({ date: addDays(date, d.dateOffset), kcal: d.totalCalories, protein: d.totalProtein }))
    : [];
  // Clamped so a stale index (e.g. a shorter regenerated proposal) can't blank the preview.
  const activePreviewDay = preview ? Math.min(previewDay, preview.length - 1) : 0;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
    >
      <Text style={styles.title}>{t('plan')} ✨</Text>
      <Text style={styles.subtitle}>{dateLabel(date, locale)}</Text>
      <WeekTabs date={date} locale={locale} marks={weekPlanInfo} onSelect={(next) => { setDate(next); setPreview(null); }} />

      <GradientHero colors={gradients.heroDark}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>✨ {t('planTotals')}</Text>
        <Text style={{ color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 6 }}>
          {Math.round(totals.calories)} <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>/ {Math.round(calorieGoal)} kcal</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {[
            { l: t('protein'), v: totals.protein },
            { l: t('carbs'), v: totals.carbs },
            { l: t('fat'), v: totals.fat },
          ].map((m) => (
            <View key={m.l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{m.l}</Text>
              <Text style={{ fontWeight: '900', color: colors.white, marginTop: 2 }}>{Math.round(m.v)}g</Text>
            </View>
          ))}
        </View>
        {totals.calories < calorieGoal * 0.9 && plans.length > 0 && (
          <Text style={{ color: colors.lemon, marginTop: 10, fontWeight: '800' }}>
            {t('shortfall')} {Math.round(calorieGoal - totals.calories)} kcal.
          </Text>
        )}
      </GradientHero>

      {/* Builder setup */}
      <StepHeader n={1} title={`🍽️ ${t('likedFoods')}`} open={builderOpen} onToggle={() => setBuilderOpen((v) => !v)} />
      {builderOpen && (
        <>
      <View style={styles.card}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('searchFoods')}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        {searchError && (
          <Text style={{ color: colors.red, marginTop: 8, fontWeight: '700' }}>⚠️ {t('searchFailed')}: {searchError}</Text>
        )}
        {!searchError && searchResults.filter((f) => !liked.some((l) => l.id === f.id)).length === 0 && (
          <Text style={{ color: colors.muted, marginTop: 8, fontWeight: '600' }}>
            {foodsCount === 0 ? t('noFoodsDb') : query.trim() ? t('noFoodMatch') : t('pickFoods')}
          </Text>
        )}
        {searchResults.filter((f) => !liked.some((l) => l.id === f.id)).slice(0, 5).map((food) => (
          <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 20 }}>{foodEmoji(foodName(food, locale), food.brand)}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>{foodName(food, locale)}</Text>
              <View style={{ marginTop: 3 }}><KcalBadge kcal={Math.round((food.calories_per_100g * (food.serving_grams ?? 100)) / 100)} /></View>
            </View>
            <Pressable onPress={() => setDetail({ kind: 'food', foodId: food.id, portionGrams: food.serving_grams ?? 100 })} hitSlop={8} style={{ padding: 6, marginLeft: 8 }} accessibilityLabel={t('showDetails')} accessibilityRole="button">
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => addLiked(food)} style={[styles.chip, { marginLeft: 8, flexDirection: 'row', gap: 6 }]}>
              <Ionicons name="add" size={16} color={colors.ink} />
              <Text style={styles.chipText}>{t('addLiked')}</Text>
            </Pressable>
          </View>
        ))}
        {liked.length === 0 && (
          <Text style={{ color: colors.muted, marginTop: 10, fontWeight: '600' }}>{t('pickFoods')}</Text>
        )}
        {liked.map((food) => {
          const cheapest = formatCheapest(likedPrices[food.id] ?? [], locale);
          return (
          <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: colors.mint, borderRadius: radius.md, padding: 10 }}>
            <Text style={{ fontSize: 22 }}>{foodEmoji(foodName(food, locale), food.brand)}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>{foodName(food, locale)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                {Math.round(food.calories_per_100g)} kcal/100g · {Math.round(food.protein_per_100g)}g {t('protein')}
              </Text>
            </View>
            <Pressable onPress={() => setPriceFood(food)} hitSlop={8} style={{ paddingHorizontal: 8, paddingVertical: 6, backgroundColor: colors.surface, borderRadius: radius.pill, marginRight: 2 }}>
              <Text style={{ color: colors.greenDeep, fontSize: 12, fontWeight: '900' }}>{cheapest ?? '+ €'}</Text>
            </Pressable>
            <Pressable onPress={() => removeLiked(food.id)} hitSlop={8} style={{ padding: 6 }}>
              <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
            </Pressable>
          </View>
          );
        })}
      </View>

      <StepHeader n={2} title={`⚙️ ${t('planSetup')}`} />
      <View style={styles.card}>
        <Text style={styles.label}>{t('daysToPlan')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 5, 7].map((d) => (
            <Pressable key={d} onPress={() => { setDays(d); setPreview(null); }} style={[styles.chip, days === d && styles.chipActive, { flex: 1 }]}>
              <Text style={[styles.chipText, days === d && styles.chipTextActive]}>{d}d</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('mealsPerDay')} ({slots.map((s) => t(s as 'breakfast')).join(' · ')})</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <Pressable key={n} onPress={() => { setMealsPerDay(n); setPreview(null); }} style={[styles.chip, mealsPerDay === n && styles.chipActive, { flex: 1 }]}>
              <Text style={[styles.chipText, mealsPerDay === n && styles.chipTextActive]}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{t('dailyCalories')}</Text>
        <TextInput
          value={calorieInput}
          onChangeText={(v) => { setCalorieInput(v); setPreview(null); }}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={colors.muted}
          placeholder={String(Math.round(settings.calorie_goal))}
        />

        <Pressable onPress={() => { setUseProtein((v) => !v); setPreview(null); }} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
          <Ionicons name={useProtein ? 'checkbox' : 'square-outline'} size={22} color={colors.green} />
          <Text style={{ color: colors.ink, fontWeight: '700' }}>{t('useProteinGoal')} ({Math.round(settings.protein_goal)}g)</Text>
        </Pressable>
      </View>

      <PressScale onPress={generate} style={[styles.button, { flexDirection: 'row', gap: 8, marginTop: 14 }]} haptic>
        <Ionicons name="sparkles" size={20} color={colors.lemon} />
        <Text style={styles.buttonText}>{t('generateProposal')}</Text>
      </PressScale>
      {liked.length === 0 && (
        <Text style={{ color: colors.muted, marginTop: 8, fontWeight: '700', textAlign: 'center' }}>{t('styleDefaults')}</Text>
      )}
        </>
      )}

      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionTitle}>🍳 {t('myRecipes')} ({customRecipes.length})</Text>
          <Pressable onPress={() => router.push('/recipe-editor')} style={[styles.chip, { flexDirection: 'row', gap: 4 }]}>
            <Ionicons name="add" size={16} color={colors.ink} />
            <Text style={styles.chipText}>{t('createRecipeCta')}</Text>
          </Pressable>
        </View>
        {customRecipes.length === 0 ? (
          <Text style={{ color: colors.muted, fontWeight: '600' }}>{t('noCustomRecipes')}</Text>
        ) : (
          customRecipes.slice(0, 5).map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ flex: 1, color: colors.ink, fontWeight: '700' }} numberOfLines={1}>
                {foodEmoji(r.name_en)} {(locale === 'el' ? r.name_el : r.name_en) || r.name_en} · {Math.round(r.calories)} kcal
              </Text>
              <Pressable onPress={() => setDetail({ kind: 'recipe', recipeId: r.id, portion: 1 })} hitSlop={8} style={{ padding: 6 }} accessibilityLabel={t('showDetails')} accessibilityRole="button">
                <Ionicons name="information-circle-outline" size={17} color={colors.muted} />
              </Pressable>
              <Pressable onPress={() => removeRecipe(r.id)} hitSlop={8} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={17} color={colors.muted} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      {preview && (
        <>
        <StepHeader n={3} title={`✨ ${t('proposal')}`} />
        <View style={styles.card}>
          <View style={[styles.badge, { backgroundColor: colors.tangerineSoft, alignSelf: 'flex-start', marginBottom: 8 }]}>
            <Text style={[styles.badgeText, { color: colors.orange }]}>⚠️ {t('unsaved')}</Text>
          </View>
          {preview[0]?.usedDefaults ? (
            <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 4 }}>{t('styleDefaults')}</Text>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2, marginTop: 10 }}>
            {preview.map((day, di) => {
              const dayDate = addDays(date, day.dateOffset);
              const selected = di === activePreviewDay;
              return (
                <Pressable
                  key={dayDate}
                  onPress={() => setPreviewDay(di)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${t('dayPlan')} ${di + 1} · ${dateLabel(dayDate, locale)}`}
                  style={{
                    minWidth: 76,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radius.md,
                    borderWidth: 1.5,
                    alignItems: 'center',
                    backgroundColor: selected ? colors.green : colors.surface,
                    borderColor: selected ? colors.green : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: selected ? colors.onGreen : colors.ink }}>
                    {t('dayPlan')} {di + 1}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', marginTop: 1, color: selected ? 'rgba(255,255,255,0.85)' : colors.muted }}>
                    {dayDate.slice(8, 10)}/{dayDate.slice(5, 7)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {preview.map((day, di) => {
            if (di !== activePreviewDay) return null;
            const dayDate = addDays(date, day.dateOffset);
            const info = previewTotals[di];
            const dayMeals = [...new Set(day.items.map((i) => i.meal_type))].sort((a, b) => mealRank(a) - mealRank(b));
            return (
              <View key={dayDate} style={{ marginTop: 10, backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>
                  ≈ {Math.round(info.kcal)} kcal · {Math.round(info.protein)}g {t('protein')}
                  {info.kcal < calorieGoal * 0.9 ? ` · ${t('shortfall')} ${Math.round(calorieGoal - info.kcal)} kcal` : ''}
                </Text>
                {dayMeals.map((meal) => (
                  <View key={meal} style={{ marginTop: 8 }}>
                    <View style={[styles.badge, { backgroundColor: colors.mint, minWidth: 86, alignSelf: 'flex-start' }]}>
                      <Text style={[styles.badgeText, { color: colors.greenDeep }]}>{t(meal)}</Text>
                    </View>
                    {day.items.map((item, ii) => item.meal_type !== meal ? null : (
                      <View key={`${dayDate}-${ii}`} style={{ marginTop: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ flex: 1 }}>
                            {item.kind === 'food' ? (
                              <><Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>
                                {foodEmoji(foodName(item.food, locale))} {foodName(item.food, locale)}
                              </Text>
                              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                                {item.portion_grams}g · {Math.round(item.calories)} kcal · {Math.round(item.protein)}g {t('protein')}
                              </Text></>
                            ) : (
                              <><Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>
                                {foodEmoji(item.recipe.name_en)} {(locale === 'el' ? item.recipe.name_el : item.recipe.name_en) || item.recipe.name_en} 🍳
                              </Text>
                              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                                × {item.portion.toFixed(2)} · {Math.round(item.calories)} kcal · {Math.round(item.protein)}g {t('protein')}
                              </Text></>
                            )}
                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          {item.kind === 'food' ? (
                            <>
                              <Pressable onPress={() => adjustPreviewFood(di, ii, -25)} accessibilityLabel="−25g" style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                                <Ionicons name="remove" size={14} color={colors.green} />
                              </Pressable>
                              <Pressable onPress={() => adjustPreviewFood(di, ii, 25)} accessibilityLabel="+25g" style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                                <Ionicons name="add" size={14} color={colors.green} />
                              </Pressable>
                            </>
                          ) : (
                            <>
                              <Pressable onPress={() => adjustPreviewRecipe(di, ii, -0.25)} accessibilityLabel="−" style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                                <Ionicons name="remove" size={14} color={colors.green} />
                              </Pressable>
                              <Pressable onPress={() => adjustPreviewRecipe(di, ii, 0.25)} accessibilityLabel="+" style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                                <Ionicons name="add" size={14} color={colors.green} />
                              </Pressable>
                            </>
                          )}
                          <Pressable onPress={() => setDetail(item.kind === 'food' ? { kind: 'food', foodId: item.food.id, portionGrams: item.portion_grams } : { kind: 'recipe', recipeId: item.recipe.id, portion: item.portion })} accessibilityLabel={t('showDetails')} style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
                          </Pressable>
                          <Pressable onPress={() => replacePreviewItem(di, ii)} accessibilityLabel={t('replace')} style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                            <Ionicons name="shuffle" size={14} color={colors.ink} />
                          </Pressable>
                          <Pressable onPress={() => removePreviewItem(di, ii)} accessibilityLabel={t('remove')} style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}>
                            <Ionicons name="trash-outline" size={14} color={colors.red} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    <Pressable
                      onPress={() => { setAddMeal(meal); setAddPreviewDay(di); setAddTab('food'); setAddQuery(''); }}
                      style={[styles.outlineButton, { marginTop: 8, flexDirection: 'row', gap: 6, alignSelf: 'flex-start', minHeight: 36, paddingHorizontal: 12 }]}
                    >
                      <Ionicons name="add" size={16} color={colors.green} />
                      <Text style={[styles.outlineText, { fontSize: 13 }]}>{t('addToMeal')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })}
          {(() => {
            const kcal = preview.reduce((s, d) => s + d.totalCalories, 0);
            const protein = preview.reduce((s, d) => s + d.totalProtein, 0);
            return (
              <Text style={{ color: colors.ink, fontWeight: '800', marginTop: 12 }}>
                {t('planTotals')}: {preview.length}d · ≈ {Math.round(kcal)} kcal · {Math.round(protein)}g {t('protein')}
              </Text>
            );
          })()}
          <Pressable onPress={save} disabled={saving} style={[styles.button, { marginTop: 14, opacity: saving ? 0.6 : 1, flexDirection: 'row', gap: 8 }]}>
            {saving ? <Text style={styles.buttonText}>…</Text> : (<><Ionicons name="save-outline" size={18} color={colors.onGreen} /><Text style={styles.buttonText}>{t('savePlan')} · {preview.length}d · {dateLabel(date, locale)}</Text></>)}
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{t('saveDayOnly')}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{t('groceryNote')}</Text>
        </View>
        </>
      )}

      {/* Saved plan for the selected start date */}
      <StepHeader n={4} title={dateLabel(date, locale)} />
      {plans.length === 0 ? (
        <View style={styles.card}><EmptyState emoji="🫒" title={t('planEmpty')} body={t('planEmptyHint')} /></View>
      ) : (
        sections.map((meal, si) => {
          const items = plans.filter((p) => p.meal_type === meal);
          const sectionTotals = sumNutrition(items.map(entryTotals));
          return (
            <View key={meal} style={{ marginTop: 12, borderTopWidth: si > 0 ? 1 : 0, borderTopColor: colors.border, paddingTop: si > 0 ? 12 : 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={[styles.badge, { backgroundColor: colors.mint }]}>
                  <Text style={[styles.badgeText, { color: colors.greenDeep }]}>{t(meal)}</Text>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>
                  {Math.round(sectionTotals.calories)} kcal · {Math.round(sectionTotals.protein)}g {t('protein')}
                </Text>
              </View>
              {items.map((entry) => {
          const totalsFor = entryTotals(entry);
          const title = entry.kind === 'food'
            ? String(entry.food_name ?? entry.food?.name_en ?? t('unknown'))
            : entry.recipe
              ? (locale === 'el' ? entry.recipe.name_el : entry.recipe.name_en)
              : t('unknown');
          const emoji = entry.kind === 'food'
            ? foodEmoji(String(entry.food_name ?? ''), entry.food?.brand)
            : foodEmoji(entry.recipe?.name_en ?? '');
          return (
            <View key={entry.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable
                  onPress={() => {
                    if (entry.kind === 'food' && entry.food_id) setDetail({ kind: 'food', foodId: String(entry.food_id), portionGrams: Number(entry.portion_grams ?? 100) });
                    else if (entry.kind === 'recipe' && entry.recipe) setDetail({ kind: 'recipe', recipeId: entry.recipe.id, portion: entry.portion });
                  }}
                  hitSlop={8}
                  style={{ padding: 4 }}
                  accessibilityLabel={t('showDetails')}
                  accessibilityRole="button"
                >
                  <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
                </Pressable>
                {entry.locked ? <Ionicons name="lock-closed" color={colors.orange} size={17} /> : <View style={{ width: 17 }} />}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' }}>
                <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.lemonSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '900' }} numberOfLines={1}>{title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
                    {entry.kind === 'food'
                      ? `${entry.portion_grams}g · ${Math.round(totalsFor.calories)} kcal`
                      : `× ${entry.portion.toFixed(2)} · ${Math.round(totalsFor.calories)} kcal`}
                    {' · '}{Math.round(totalsFor.protein)}g {t('protein')}
                  </Text>
                </View>
              </View>
              {entry.kind === 'food' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => adjustFoodGrams(entry, -25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1, flexDirection: 'row', gap: 4 }]}>
                    <Ionicons name="remove" size={16} color={colors.green} />
                    <Text style={styles.outlineText}>25g</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustFoodGrams(entry, 25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1, flexDirection: 'row', gap: 4 }]}>
                    <Ionicons name="add" size={16} color={colors.green} />
                    <Text style={styles.outlineText}>25g</Text>
                  </Pressable>
                </View>
              ) : entry.recipe ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => adjustRecipePortion(entry, -0.25)} disabled={entry.locked} accessibilityLabel="−" style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Ionicons name="remove" size={18} color={colors.green} />
                  </Pressable>
                  <Pressable onPress={() => adjustRecipePortion(entry, 0.25)} disabled={entry.locked} accessibilityLabel="+" style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Ionicons name="add" size={18} color={colors.green} />
                  </Pressable>
                  <Pressable
                    onPress={() => entry.recipe && setPriceRecipe(entry.recipe)}
                    hitSlop={8}
                    style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.lemonSoft, borderRadius: radius.pill }}
                  >
                    <Text style={{ color: colors.greenDeep, fontSize: 12, fontWeight: '900' }}>
                      {formatCheapestRecipe(recipePrices[entry.recipe.id] ?? [], locale) ?? '+ €'}
                    </Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: colors.muted, fontWeight: '800' }}>
                    {Math.round((totalsFor.calories / Math.max(calorieGoal, 1)) * 100)}%
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable onPress={() => toggleLock(entry)} style={[styles.chip, entry.locked && styles.chipActive, { flex: 1, flexDirection: 'row', gap: 6 }]}>
                  <Ionicons name={entry.locked ? 'lock-closed-outline' : 'lock-open-outline'} size={16} color={entry.locked ? colors.onInk : colors.ink} />
                  <Text style={[styles.chipText, entry.locked && styles.chipTextActive]}>{entry.locked ? t('locked') : t('lock')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => (entry.kind === 'food' ? replaceFood(entry) : replaceRecipe(entry))}
                  style={[styles.chip, { flex: 1, opacity: entry.locked ? 0.45 : 1, flexDirection: 'row', gap: 6 }]}
                >
                  <Ionicons name="shuffle" size={16} color={colors.ink} />
                  <Text style={styles.chipText}>{t('replace')}</Text>
                </Pressable>
                <Pressable onPress={() => removeEntry(entry)} disabled={entry.locked} accessibilityLabel={t('remove')} style={[styles.chip, { opacity: entry.locked ? 0.45 : 1, paddingHorizontal: 12, flexDirection: 'row' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.red} />
                </Pressable>
              </View>
              <Pressable onPress={() => logMeal(entry)} style={[styles.button, { marginTop: 8, minHeight: 46, flexDirection: 'row', gap: 8 }]}>
                <Ionicons name="restaurant-outline" size={18} color={colors.onGreen} />
                <Text style={styles.buttonText}>{t('logMeal')}</Text>
              </Pressable>
            </View>
          );
              })}
              <Pressable
                onPress={() => { setAddMeal(meal); setAddPreviewDay(null); setAddTab('food'); setAddQuery(''); }}
                style={[styles.outlineButton, { marginTop: 10, flexDirection: 'row', gap: 6, alignSelf: 'flex-start' }]}
              >
                <Ionicons name="add" size={18} color={colors.green} />
                <Text style={styles.outlineText}>{t('addToMeal')}</Text>
              </Pressable>
            </View>
          );
        })
      )}
      <Modal visible={addMeal != null} transparent animationType="fade" onRequestClose={() => { setAddMeal(null); setAddPreviewDay(null); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(12,26,19,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>{t('addToMeal')}{addMeal ? ` · ${t(addMeal)}` : ''}</Text>
              <Pressable onPress={() => { setAddMeal(null); setAddPreviewDay(null); }} hitSlop={10} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setAddTab('food')} style={[styles.chip, addTab === 'food' && styles.chipActive, { flex: 1, alignItems: 'center' }]}>
                <Text style={[styles.chipText, addTab === 'food' && styles.chipTextActive]}>{t('foodsTab')}</Text>
              </Pressable>
              <Pressable onPress={() => setAddTab('recipe')} style={[styles.chip, addTab === 'recipe' && styles.chipActive, { flex: 1, alignItems: 'center' }]}>
                <Text style={[styles.chipText, addTab === 'recipe' && styles.chipTextActive]}>{t('recipesTab')}</Text>
              </Pressable>
            </View>
            <TextInput
              value={addQuery}
              onChangeText={setAddQuery}
              placeholder={addTab === 'food' ? t('searchFoods') : t('searchRecipes')}
              placeholderTextColor={colors.muted}
              style={[styles.input, { marginTop: 12 }]}
            />
            <ScrollView style={{ marginTop: 4, maxHeight: 320 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {addTab === 'food' ? (
                addFoodResults.length === 0 ? (
                  <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '600' }}>
                    {allFoods.length === 0 ? t('noFoodsDb') : t('noFoodMatch')}
                  </Text>
                ) : (
                  addFoodResults.map((food) => (
                    <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      <Text style={{ flex: 1, color: colors.ink, fontWeight: '700' }} numberOfLines={1}>
                        {foodEmoji(foodName(food, locale))} {foodName(food, locale)}
                      </Text>
                      <Pressable
                        onPress={() => setDetail({ kind: 'food', foodId: food.id, portionGrams: food.serving_grams ?? 100 })}
                        accessibilityLabel={t('showDetails')}
                        hitSlop={8}
                        style={{ padding: 6 }}
                      >
                        <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
                      </Pressable>
                      <Pressable
                        onPress={() => addMeal && (addPreviewDay != null ? addFoodToPreview(addPreviewDay, addMeal, food) : addFoodToMeal(food, addMeal))}
                        accessibilityLabel={t('addToMeal')}
                        hitSlop={8}
                        style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, flexDirection: 'row', gap: 4 }]}
                      >
                        <Ionicons name="add" size={18} color={colors.green} />
                      </Pressable>
                    </View>
                  ))
                )
              ) : addRecipeResults.length === 0 ? (
                <Text style={{ color: colors.muted, marginTop: 12, fontWeight: '600' }}>{t('noFoodMatch')}</Text>
              ) : (
                addRecipeResults.map((recipe) => (
                  <View key={recipe.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.ink, fontWeight: '700' }} numberOfLines={1}>
                        {foodEmoji(recipe.name_en)} {(locale === 'el' ? recipe.name_el : recipe.name_en) || recipe.name_en}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                        {Math.round(recipe.calories)} kcal · {Math.round(recipe.protein)}g {t('protein')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setDetail({ kind: 'recipe', recipeId: recipe.id, portion: 1 })}
                      accessibilityLabel={t('showDetails')}
                      hitSlop={8}
                      style={{ padding: 6 }}
                    >
                      <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable
                      onPress={() => addMeal && (addPreviewDay != null ? addRecipeToPreview(addPreviewDay, addMeal, recipe) : addRecipeToMeal(recipe, addMeal))}
                      accessibilityLabel={t('addToMeal')}
                      hitSlop={8}
                      style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, flexDirection: 'row', gap: 4 }]}
                    >
                      <Ionicons name="add" size={18} color={colors.green} />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <DetailSheet visible={detail != null} target={detail} onClose={() => setDetail(null)} />
      <PriceSheet
        visible={priceFood != null}
        target={priceFood ? { kind: 'food', foodId: priceFood.id } : null}
        title={priceFood ? foodName(priceFood, locale) : ''}
        subtitle={priceFood?.brand ?? undefined}
        selectable={false}
        onSelect={() => {}}
        onChanged={refreshLikedPrices}
        onClose={() => setPriceFood(null)}
      />
      <PriceSheet
        visible={priceRecipe != null}
        target={priceRecipe ? { kind: 'recipe', recipeId: priceRecipe.id } : null}
        title={priceRecipe ? ((locale === 'el' ? priceRecipe.name_el : priceRecipe.name_en) || priceRecipe.name_en) : ''}
        selectable={false}
        onSelect={() => {}}
        onChanged={refreshRecipePrices}
        onClose={() => setPriceRecipe(null)}
      />
    </ScrollView>
  );
}
