import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { colors, styles } from '@/src/theme';
import { parseNumber } from '@/src/lib/nutrition';

type Day = { date: string; calories: number; protein: number };
export default function Progress() {
  const db = useSQLiteContext();
  const { settings, locale, t } = useApp();
  const [days, setDays] = useState<Day[]>([]);
  const [weights, setWeights] = useState<{ date: string; kilograms: number }[]>([]);
  const [weight, setWeight] = useState('');
  const today = dateKey();
  const load = useCallback(async () => { const start = new Date(`${today}T12:00:00`); start.setDate(start.getDate() - 6); const startKey = start.toISOString().slice(0, 10); const entries = await db.getAllAsync<any>('SELECT date, SUM(calories) calories, SUM(protein) protein FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date', startKey, today); const map = new Map(entries.map((row) => [row.date, row])); const list: Day[] = []; for (let i = 0; i < 7; i += 1) { const day = new Date(start); day.setDate(start.getDate() + i); const key = day.toISOString().slice(0, 10); list.push({ date: key, calories: Number(map.get(key)?.calories ?? 0), protein: Number(map.get(key)?.protein ?? 0) }); } setDays(list); setWeights(await db.getAllAsync('SELECT date,kilograms FROM weights ORDER BY date DESC LIMIT 30')); }, [db, today]);
  useEffect(() => { load(); }, [load]);
  const maxCalories = Math.max(settings.calorie_goal, ...days.map((day) => day.calories), 1);
  const latestWeight = weights[0];
  const saveWeight = async () => { const value = parseNumber(weight); if (!value) return; await db.runAsync('INSERT OR REPLACE INTO weights (date,kilograms) VALUES (?,?)', today, value); setWeight(''); load(); };
  const average = useMemo(() => days.filter((d) => d.calories > 0).reduce((sum, d) => sum + d.calories, 0) / Math.max(1, days.filter((d) => d.calories > 0).length), [days]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.title}>{t('progress')}</Text><Text style={styles.subtitle}>{t('progressTitle')}</Text><View style={styles.card}><Text style={styles.sectionTitle}>{t('calories')}</Text><View style={{ height: 170, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7 }}>{days.map((day) => <View key={day.date} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}><View style={{ width: '70%', minHeight: day.calories ? 8 : 3, height: `${Math.max(day.calories / maxCalories, 0.02) * 100}%`, backgroundColor: day.calories > settings.calorie_goal * 1.1 ? colors.orange : colors.green, borderRadius: 8 }} /><Text style={{ fontSize: 10, color: colors.muted, marginTop: 7 }}>{new Date(`${day.date}T12:00:00`).toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' }).slice(0, 3)}</Text></View>)}</View><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}><Text style={{ color: colors.muted }}>{t('consumed')} avg.</Text><Text style={{ color: colors.ink, fontWeight: '900' }}>{Math.round(average)} kcal</Text></View></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('weight')}</Text><Text style={{ color: colors.muted }}>{latestWeight ? `${latestWeight.kilograms} ${t('kilograms')} · ${dateLabel(latestWeight.date, locale)}` : t('noEntries')}</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder={t('kilograms')} placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} /><Pressable onPress={saveWeight} style={[styles.button, { minHeight: 50 }]}><Text style={styles.buttonText}>{t('addWeight')}</Text></Pressable></View></View></ScrollView>;
}
