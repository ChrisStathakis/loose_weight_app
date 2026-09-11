import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { GroceryItem, Recipe, RecipeIngredient } from '@/src/types';
import { colors, radius, styles } from '@/src/theme';
import { EmptyState } from '@/src/components/EmptyState';

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };
export default function Groceries() {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const [start, setStart] = useState(dateKey());
  const [items, setItems] = useState<GroceryItem[]>([]);
  const endDate = (() => { const value = new Date(`${start}T12:00:00`); value.setDate(value.getDate() + 6); return value.toISOString().slice(0, 10); })();
  const load = useCallback(async () => setItems(await db.getAllAsync<GroceryItem>('SELECT id,ingredient,amount,unit,checked FROM groceries WHERE date=? ORDER BY checked,ingredient', start)), [db, start]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const shift = (amount: number) => { const value = new Date(`${start}T12:00:00`); value.setDate(value.getDate() + amount); setStart(value.toISOString().slice(0, 10)); };
  const build = async () => { const rows = await db.getAllAsync<RecipeRow & { date: string; portion: number }>('SELECT p.date,p.portion,r.* FROM plans p JOIN recipes r ON r.id=p.recipe_id WHERE p.date BETWEEN ? AND ?', start, endDate); const grouped = new Map<string, { amount: number; unit: string; name: string }>(); rows.forEach((row) => { const ingredients = JSON.parse(row.ingredients) as RecipeIngredient[]; const recipeScale = Number(row.portion) / Math.max(1, Number(row.servings)); ingredients.forEach((ingredient) => { const name = locale === 'el' ? ingredient.name_el : ingredient.name_en; const key = `${name.toLowerCase()}|${ingredient.unit}`; const current = grouped.get(key) ?? { amount: 0, unit: ingredient.unit, name }; current.amount += ingredient.amount * recipeScale; grouped.set(key, current); }); }); const previous = await db.getAllAsync<any>('SELECT ingredient,unit,checked FROM groceries WHERE date=?', start); const checkedMap = new Map(previous.map((row) => [`${row.ingredient.toLowerCase()}|${row.unit}`, Number(row.checked)])); await db.runAsync('DELETE FROM groceries WHERE date=?', start); for (const item of grouped.values()) await db.runAsync('INSERT INTO groceries (date,ingredient,amount,unit,checked) VALUES (?,?,?,?,?)', start, item.name, Number(item.amount.toFixed(1)), item.unit, checkedMap.get(`${item.name.toLowerCase()}|${item.unit}`) ?? 0); load(); };
  const toggle = async (item: GroceryItem) => { await db.runAsync('UPDATE groceries SET checked=? WHERE id=?', item.checked ? 0 : 1, item.id); load(); };
  const checked = items.filter((item) => item.checked).length;
  const pct = items.length ? checked / items.length : 0;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>{t('groceries')} 🧺</Text>
      <Text style={styles.subtitle}>{dateLabel(start, locale)} – {dateLabel(endDate, locale)}</Text>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: colors.ink }}>{checked}/{items.length} {t('done')}</Text>
          <Text style={{ fontWeight: '900', color: colors.green }}>{Math.round(pct * 100)}%</Text>
        </View>
        <View style={{ height: 10, borderRadius: 10, backgroundColor: colors.border, marginTop: 10, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pct === 1 ? colors.green : colors.tangerine, borderRadius: 10 }} />
        </View>
        {pct === 1 && items.length > 0 && <Text style={{ marginTop: 8, fontWeight: '800', color: colors.green }}>🎉 {t('allDone')}</Text>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <Pressable onPress={() => shift(-7)} style={styles.outlineButton}><Text style={styles.outlineText}>‹ 7</Text></Pressable>
        <Pressable onPress={build} style={[styles.button, { flex: 1, marginHorizontal: 10, flexDirection: 'row', gap: 8 }]}><Ionicons name="refresh" color={colors.lemon} size={20} /><Text style={styles.buttonText}>{t('generatePlan')}</Text></Pressable>
        <Pressable onPress={() => shift(7)} style={styles.outlineButton}><Text style={styles.outlineText}>7 ›</Text></Pressable>
      </View>
      {items.length === 0 ? (
        <View style={styles.card}><EmptyState emoji="🧺" title={t('groceryList')} body={t('groceryHint')} /></View>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => toggle(item)} style={[styles.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, backgroundColor: item.checked ? colors.mint : colors.surface }]}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: item.checked ? colors.green : colors.surface, borderWidth: 2, borderColor: item.checked ? colors.green : colors.border, alignItems: 'center', justifyContent: 'center' }}>
              {item.checked ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: item.checked ? colors.muted : colors.ink, fontWeight: '800', textDecorationLine: item.checked ? 'line-through' : 'none' }}>{item.ingredient}</Text>
              <View style={[styles.badge, { backgroundColor: colors.bg, alignSelf: 'flex-start', marginTop: 5 }]}>
                <Text style={[styles.badgeText, { color: colors.muted }]}>{item.amount} {item.unit}</Text>
              </View>
            </View>
          </Pressable>
        ))
      )}
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}
