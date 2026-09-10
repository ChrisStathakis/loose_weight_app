import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { GroceryItem, Recipe, RecipeIngredient } from '@/src/types';
import { colors, styles } from '@/src/theme';

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };
export default function Groceries() {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const [start, setStart] = useState(dateKey());
  const [items, setItems] = useState<GroceryItem[]>([]);
  const endDate = (() => { const value = new Date(`${start}T12:00:00`); value.setDate(value.getDate() + 6); return value.toISOString().slice(0, 10); })();
  const load = useCallback(async () => setItems(await db.getAllAsync<GroceryItem>('SELECT id,ingredient,amount,unit,checked FROM groceries WHERE date=? ORDER BY checked,ingredient', start)), [db, start]);
  useEffect(() => { load(); }, [load]);
  const shift = (amount: number) => { const value = new Date(`${start}T12:00:00`); value.setDate(value.getDate() + amount); setStart(value.toISOString().slice(0, 10)); };
  const build = async () => { const rows = await db.getAllAsync<RecipeRow & { date: string; portion: number }>('SELECT p.date,p.portion,r.* FROM plans p JOIN recipes r ON r.id=p.recipe_id WHERE p.date BETWEEN ? AND ?', start, endDate); const grouped = new Map<string, { amount: number; unit: string; name: string }>(); rows.forEach((row) => { const ingredients = JSON.parse(row.ingredients) as RecipeIngredient[]; const recipeScale = Number(row.portion) / Math.max(1, Number(row.servings)); ingredients.forEach((ingredient) => { const name = locale === 'el' ? ingredient.name_el : ingredient.name_en; const key = `${name.toLowerCase()}|${ingredient.unit}`; const current = grouped.get(key) ?? { amount: 0, unit: ingredient.unit, name }; current.amount += ingredient.amount * recipeScale; grouped.set(key, current); }); }); const previous = await db.getAllAsync<any>('SELECT ingredient,unit,checked FROM groceries WHERE date=?', start); const checkedMap = new Map(previous.map((row) => [`${row.ingredient.toLowerCase()}|${row.unit}`, Number(row.checked)])); await db.runAsync('DELETE FROM groceries WHERE date=?', start); for (const item of grouped.values()) await db.runAsync('INSERT INTO groceries (date,ingredient,amount,unit,checked) VALUES (?,?,?,?,?)', start, item.name, Number(item.amount.toFixed(1)), item.unit, checkedMap.get(`${item.name.toLowerCase()}|${item.unit}`) ?? 0); load(); };
  const toggle = async (item: GroceryItem) => { await db.runAsync('UPDATE groceries SET checked=? WHERE id=?', item.checked ? 0 : 1, item.id); load(); };
  const checked = items.filter((item) => item.checked).length;
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{t('groceries')}</Text><Text style={styles.subtitle}>{dateLabel(start, locale)} – {dateLabel(endDate, locale)}</Text><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}><Pressable onPress={() => shift(-7)} style={styles.outlineButton}><Text style={styles.outlineText}>‹ 7</Text></Pressable><Text style={{ color: colors.muted, fontWeight: '700' }}>{checked}/{items.length}</Text><Pressable onPress={() => shift(7)} style={styles.outlineButton}><Text style={styles.outlineText}>7 ›</Text></Pressable></View><Pressable onPress={build} style={[styles.button, { marginTop: 14, flexDirection: 'row', gap: 8 }]}><Ionicons name="refresh-outline" color={colors.white} size={20} /><Text style={styles.buttonText}>{t('generatePlan')}</Text></Pressable>{items.length === 0 ? <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}><Text style={{ fontSize: 36 }}>🧺</Text><Text style={{ color: colors.muted, marginTop: 10, textAlign: 'center' }}>{t('groceryHint')}</Text></View> : items.map((item) => <Pressable key={item.id} onPress={() => toggle(item)} style={[styles.card, { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }]}><Ionicons name={item.checked ? 'checkbox' : 'square-outline'} size={25} color={item.checked ? colors.green : colors.muted} /><View style={{ flex: 1, marginLeft: 12 }}><Text style={{ color: item.checked ? colors.muted : colors.ink, fontWeight: '800', textDecorationLine: item.checked ? 'line-through' : 'none' }}>{item.ingredient}</Text><Text style={{ color: colors.muted, marginTop: 3 }}>{item.amount} {item.unit}</Text></View></Pressable>)}</ScrollView>;
}
