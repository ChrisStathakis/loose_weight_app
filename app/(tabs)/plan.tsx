import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { chooseFoodPlan, FoodDayPlan, mealSlotsForCount } from '@/src/lib/planner';
import { parseNumber, scaleFood, sumNutrition } from '@/src/lib/nutrition';
import { foodEmoji } from '@/src/lib/habits';
import { filterFoods, normalizeEl } from '@/src/lib/search';
import { Food, MealType, PlanEntry, Recipe } from '@/src/types';
import { colors, radius, styles } from '@/src/theme';
import { DateStepper } from '@/src/components/DateStepper';
import { EmptyState } from '@/src/components/EmptyState';
import { KcalBadge } from '@/src/components/MacroPill';

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };

const addDays = (base: string, offset: number) => {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const mealRank = (meal: string) =>
  meal === 'breakfast' ? 1 : meal === 'lunch' ? 2 : meal === 'dinner' ? 3 : 4;

const foodName = (food: Food, locale: 'en' | 'el') =>
  (locale === 'el' ? food.name_el : food.name_en) || food.name_en || food.name_el;

export default function Plan() {
  const db = useSQLiteContext();
  const { settings, locale, t } = useApp();
  const [date, setDate] = useState(dateKey());
  const [plans, setPlans] = useState<PlanEntry[]>([]);

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
  const [preview, setPreview] = useState<FoodDayPlan[] | null>(null);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const calorieGoal = Math.max(500, parseNumber(calorieInput, settings.calorie_goal) || settings.calorie_goal);

  useEffect(() => {
    setCalorieInput(String(Math.round(settings.calorie_goal)));
  }, [settings.calorie_goal]);

  const load = useCallback(async () => {
    const recipeRows = await db.getAllAsync<RecipeRow>('SELECT * FROM recipes');
    const allRecipes = recipeRows.map((row) => ({ ...row, ingredients: JSON.parse(row.ingredients) }));
    const foodRows = await db.getAllAsync<Food>('SELECT * FROM foods');
    const foodById = new Map(foodRows.map((f) => [f.id, f]));
    setFoodsCount(foodRows.length);
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
  }, [db, date]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  const generate = () => {
    if (!liked.length) {
      Alert.alert(t('plan'), t('needFoods'));
      return;
    }
    const result = chooseFoodPlan(liked, calorieGoal, mealsPerDay, days, useProtein ? settings.protein_goal : null);
    if (!result.length) {
      Alert.alert(t('plan'), t('needFoods'));
      return;
    }
    setPreview(result);
    // The proposal renders below the button — bring it into view so the
    // press visibly does something.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const save = async () => {
    if (!preview?.length || saving) return;
    setSaving(true);
    try {
      for (const day of preview) {
        const dayDate = addDays(date, day.dateOffset);
        const existing = await db.getAllAsync<any>('SELECT meal_type,locked FROM plans WHERE date=?', dayDate);
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
          if (lockedMeals.has(item.meal_type)) continue;
          const name = foodName(item.food, locale);
          await db.runAsync(
            'INSERT INTO plans (date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
            dayDate, item.meal_type, '', 1, 0,
            item.food.id, name, item.portion_grams, item.calories, item.protein, item.carbs, item.fat,
          );
        }
      }
      setPreview(null);
      await load();
      Alert.alert(t('plan'), t('planSaved'));
    } catch (e) {
      console.error('Failed to save plan', e);
      Alert.alert(t('plan'), String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async (entry: PlanEntry) => {
    await db.runAsync('UPDATE plans SET locked=? WHERE id=?', entry.locked ? 0 : 1, entry.id);
    load();
  };

  const replaceFood = async (entry: PlanEntry) => {
    if (entry.locked || entry.kind !== 'food' || !liked.length) return;
    const pool = liked.filter((f) => f.id !== entry.food_id);
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
    load();
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
    load();
  };

  const adjustRecipePortion = async (entry: PlanEntry, delta: number) => {
    if (entry.locked || entry.kind !== 'recipe') return;
    const next = Math.max(0.5, Math.min(3, Number((entry.portion + delta).toFixed(2))));
    await db.runAsync('UPDATE plans SET portion=? WHERE id=?', next, entry.id);
    load();
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
        if (!entry.recipe) return;
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
  const previewTotals = preview
    ? preview.map((d) => ({ date: addDays(date, d.dateOffset), kcal: d.totalCalories, protein: d.totalProtein }))
    : [];

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('plan')} ✨</Text>
      <Text style={styles.subtitle}>{dateLabel(date, locale)}</Text>
      <DateStepper date={date} locale={locale} onChange={(next) => { setDate(next); setPreview(null); }} />

      <View style={styles.heroCard}>
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
            <View key={m.l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 10 }}>
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
      </View>

      {/* Builder setup */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🍽️ {t('likedFoods')}</Text>
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
            <Pressable onPress={() => addLiked(food)} style={[styles.chip, { marginLeft: 8 }]}>
              <Text style={styles.chipText}>＋ {t('addLiked')}</Text>
            </Pressable>
          </View>
        ))}
        {liked.length === 0 && (
          <Text style={{ color: colors.muted, marginTop: 10, fontWeight: '600' }}>{t('pickFoods')}</Text>
        )}
        {liked.map((food) => (
          <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: colors.mint, borderRadius: radius.md, padding: 10 }}>
            <Text style={{ fontSize: 22 }}>{foodEmoji(foodName(food, locale), food.brand)}</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>{foodName(food, locale)}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                {Math.round(food.calories_per_100g)} kcal/100g · {Math.round(food.protein_per_100g)}g {t('protein')}
              </Text>
            </View>
            <Pressable onPress={() => removeLiked(food.id)} hitSlop={8} style={{ padding: 6 }}>
              <Ionicons name="close-circle-outline" size={22} color={colors.muted} />
            </Pressable>
          </View>
        ))}

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
          {[2, 3, 4].map((n) => (
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

      <Pressable onPress={generate} style={[styles.button, { flexDirection: 'row', gap: 8, marginTop: 14, opacity: liked.length ? 1 : 0.6 }]}>
        <Ionicons name="sparkles" size={20} color={colors.lemon} />
        <Text style={styles.buttonText}>{t('generateProposal')}</Text>
      </Pressable>
      {liked.length === 0 && (
        <Text style={{ color: colors.muted, marginTop: 8, fontWeight: '700', textAlign: 'center' }}>{t('needFoods')}</Text>
      )}

      {preview && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>✨ {t('proposal')}</Text>
          {preview.map((day, di) => {
            const dayDate = addDays(date, day.dateOffset);
            const info = previewTotals[di];
            return (
              <View key={dayDate} style={{ marginTop: di === 0 ? 2 : 14 }}>
                <Text style={{ color: colors.ink, fontWeight: '900' }}>{t('dayPlan')} {di + 1} · {dateLabel(dayDate, locale)}</Text>
                <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 2 }}>
                  ≈ {Math.round(info.kcal)} kcal · {Math.round(info.protein)}g {t('protein')}
                  {info.kcal < calorieGoal * 0.9 ? ` · ${t('shortfall')} ${Math.round(calorieGoal - info.kcal)} kcal` : ''}
                </Text>
                {day.items.map((item) => (
                  <View key={`${dayDate}-${item.meal_type}`} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View style={[styles.badge, { backgroundColor: colors.mint, minWidth: 86 }]}>
                      <Text style={[styles.badgeText, { color: colors.greenDeep }]}>{t(item.meal_type)}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>
                        {foodEmoji(foodName(item.food, locale))} {foodName(item.food, locale)}
                      </Text>
                      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                        {item.portion_grams}g · {Math.round(item.calories)} kcal · {Math.round(item.protein)}g {t('protein')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
          <Pressable onPress={save} disabled={saving} style={[styles.button, { marginTop: 14, opacity: saving ? 0.6 : 1 }]}>
            <Text style={styles.buttonText}>{saving ? '…' : `💾 ${t('savePlan')}`}</Text>
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{t('groceryNote')}</Text>
        </View>
      )}

      {/* Saved plan for the selected start date */}
      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>{dateLabel(date, locale)}</Text>
      {plans.length === 0 ? (
        <View style={styles.card}><EmptyState emoji="🫒" title={t('planEmpty')} body={t('planTotals')} /></View>
      ) : (
        plans.map((entry) => {
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
                <View style={[styles.badge, { backgroundColor: colors.mint }]}>
                  <Text style={[styles.badgeText, { color: colors.greenDeep }]}>{t(entry.meal_type)}</Text>
                </View>
                {entry.locked && <Ionicons name="lock-closed" color={colors.orange} size={17} />}
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
                  <Pressable onPress={() => adjustFoodGrams(entry, -25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Text style={styles.outlineText}>−25g</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustFoodGrams(entry, 25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Text style={styles.outlineText}>+25g</Text>
                  </Pressable>
                </View>
              ) : entry.recipe ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <Pressable onPress={() => adjustRecipePortion(entry, -0.25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Text style={styles.outlineText}>−</Text>
                  </Pressable>
                  <Pressable onPress={() => adjustRecipePortion(entry, 0.25)} disabled={entry.locked} style={[styles.outlineButton, { minHeight: 36, paddingHorizontal: 14, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Text style={styles.outlineText}>+</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Text style={{ color: colors.muted, fontWeight: '800' }}>
                    {Math.round((totalsFor.calories / Math.max(calorieGoal, 1)) * 100)}%
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Pressable onPress={() => toggleLock(entry)} style={[styles.chip, entry.locked && styles.chipActive, { flex: 1 }]}>
                  <Text style={[styles.chipText, entry.locked && styles.chipTextActive]}>{entry.locked ? `🔒 ${t('locked')}` : `🔓 ${t('lock')}`}</Text>
                </Pressable>
                {entry.kind === 'food' ? (
                  <Pressable onPress={() => replaceFood(entry)} style={[styles.chip, { flex: 1, opacity: entry.locked ? 0.45 : 1 }]}>
                    <Text style={styles.chipText}>🎲 {t('replace')}</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => logMeal(entry)} style={[styles.button, { flex: 1, minHeight: 42, paddingHorizontal: 5 }]}>
                  <Text style={[styles.buttonText, { fontSize: 13 }]}>{t('logMeal')}</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
