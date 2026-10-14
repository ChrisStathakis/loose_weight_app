import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { radius, useAppTheme } from '@/src/theme';
import { foodEmoji } from '@/src/lib/habits';
import { scaleFood } from '@/src/lib/nutrition';
import { microLabel, scaleMicros, type MicroValue } from '@/src/lib/micronutrients';
import type { Food, Recipe } from '@/src/types';

export type DetailTarget =
  | { kind: 'food'; foodId: string; portionGrams?: number }
  | { kind: 'recipe'; recipeId: string; portion?: number };

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export function DetailSheet({
  visible,
  target,
  onClose,
}: {
  visible: boolean;
  target: DetailTarget | null;
  onClose: () => void;
}) {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const { colors, styles } = useAppTheme();
  const [food, setFood] = useState<Food | null>(null);
  const [micros, setMicros] = useState<MicroValue[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [failed, setFailed] = useState(false);

  const key = target ? (target.kind === 'food' ? `f:${target.foodId}` : `r:${target.recipeId}`) : '';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFood(null);
      setRecipe(null);
      setMicros([]);
      setFailed(false);
      if (!target) return;
      try {
        if (target.kind === 'food') {
          const row = await db.getFirstAsync<Food>('SELECT * FROM foods WHERE id=?', target.foodId);
          if (!row) {
            if (!cancelled) setFailed(true);
            return;
          }
          const ms = await db.getAllAsync<MicroValue>(
            'SELECT nutrient,amount,unit FROM food_micronutrients WHERE food_id=?',
            target.foodId,
          );
          if (cancelled) return;
          setFood(row);
          setMicros(ms ?? []);
        } else {
          const row = await db.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id=?', target.recipeId);
          if (!row) {
            if (!cancelled) setFailed(true);
            return;
          }
          let ingredients: Recipe['ingredients'] = [];
          try {
            ingredients = JSON.parse(row.ingredients) as Recipe['ingredients'];
          } catch {
            ingredients = [];
          }
          if (!cancelled) setRecipe({ ...row, ingredients });
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const foodName = food ? (locale === 'el' ? food.name_el : food.name_en) || food.name_en : '';
  const grams = target?.kind === 'food' ? Math.max(1, Math.round(target.portionGrams ?? 100)) : 100;
  const scaled = food ? scaleFood(food, grams) : null;
  const scaledMicros = scaleMicros(micros, grams);
  const portion = target?.kind === 'recipe' ? Math.max(0.25, target.portion ?? 1) : 1;
  const recipeName = recipe ? (locale === 'el' ? recipe.name_el : recipe.name_en) || recipe.name_en : '';
  const instructions = recipe ? (locale === 'el' ? recipe.instructions_el : recipe.instructions_en) || recipe.instructions_en : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(12,26,19,0.5)', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 }}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
            maxHeight: '100%',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 52, height: 52, borderRadius: 17, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28 }}>
                {food ? foodEmoji(foodName, food.brand) : recipe ? foodEmoji(recipeName) : '🍽️'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]} numberOfLines={2}>
                {food ? foodName : recipe ? recipeName : t('details')}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 }} numberOfLines={1}>
                {food
                  ? [food.brand, food.source].filter(Boolean).join(' · ')
                  : recipe
                    ? `${t(recipe.diet)} · ${recipe.servings} × ${t('servings')}`
                    : ''}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }} accessibilityLabel={t('close')} accessibilityRole="button">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView style={{ marginTop: 12, maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {failed ? (
              <Text style={{ color: colors.muted, fontWeight: '700' }}>{t('noFoodMatch')}</Text>
            ) : food && scaled ? (
              <>
                <Text style={{ color: colors.ink, fontSize: 26, fontWeight: '900' }}>
                  {Math.round(scaled.calories)} <Text style={{ fontSize: 13, color: colors.muted }}>kcal · {grams}g</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[
                    { l: t('protein'), v: scaled.protein },
                    { l: t('carbs'), v: scaled.carbs },
                    { l: t('fat'), v: scaled.fat },
                  ].map((m) => (
                    <View key={m.l} style={{ flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>{m.l}</Text>
                      <Text style={{ fontWeight: '900', color: colors.ink, marginTop: 2 }}>{fmt(m.v)}g</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.label, { marginTop: 14 }]}>{t('micronutrients')}</Text>
                {scaledMicros.length > 0 ? (
                  scaledMicros.map((m) => (
                    <View key={m.nutrient} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text style={{ color: colors.ink, fontWeight: '700' }}>{microLabel(m.nutrient, locale)}</Text>
                      <Text style={{ color: colors.muted, fontWeight: '800' }}>{fmt(m.amount)}{m.unit}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: colors.muted, fontWeight: '600' }}>{t('noMicros')}</Text>
                )}
              </>
            ) : recipe ? (
              <>
                <Text style={{ color: colors.ink, fontSize: 26, fontWeight: '900' }}>
                  {Math.round(recipe.calories * portion)} <Text style={{ fontSize: 13, color: colors.muted }}>kcal · × {portion.toFixed(2)} {t('perServing')}</Text>
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[
                    { l: t('protein'), v: recipe.protein * portion },
                    { l: t('carbs'), v: recipe.carbs * portion },
                    { l: t('fat'), v: recipe.fat * portion },
                  ].map((m) => (
                    <View key={m.l} style={{ flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>{m.l}</Text>
                      <Text style={{ fontWeight: '900', color: colors.ink, marginTop: 2 }}>{fmt(m.v)}g</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.label, { marginTop: 14 }]}>{t('ingredientsTitle')}</Text>
                {recipe.ingredients.length > 0 ? (
                  recipe.ingredients.map((ing, i) => (
                    <Text key={i} style={{ color: colors.ink, fontWeight: '600', marginTop: 4 }}>
                      • {fmt(ing.amount)}{ing.unit} {(locale === 'el' ? ing.name_el : ing.name_en) || ing.name_en}
                    </Text>
                  ))
                ) : (
                  <Text style={{ color: colors.muted, fontWeight: '600' }}>—</Text>
                )}
                {instructions ? (
                  <>
                    <Text style={[styles.label, { marginTop: 14 }]}>{t('recipeInstructions')}</Text>
                    <Text style={{ color: colors.ink, lineHeight: 20 }}>{instructions}</Text>
                  </>
                ) : null}
              </>
            ) : null}
            <View style={{ height: 8 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
