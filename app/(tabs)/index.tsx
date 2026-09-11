import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { sumNutrition, parseNumber } from '@/src/lib/nutrition';
import { calcStreak, foodEmoji, greeting } from '@/src/lib/habits';
import { DiaryEntry, MealType } from '@/src/types';
import { colors, radius, styles } from '@/src/theme';
import { DateStepper } from '@/src/components/DateStepper';
import { CalorieRing } from '@/src/components/CalorieRing';
import { MacroPill, StreakChip } from '@/src/components/MacroPill';
import { EmptyState } from '@/src/components/EmptyState';

const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const mealEmoji: Record<MealType, string> = { breakfast: '🍳', lunch: '🥗', dinner: '🍲', snack: '🍎' };
const WATER_GOAL = 2000;

const EntryRow = memo(function EntryRow({
  entry,
  onEdit,
  onCopy,
  onRemove,
  gramsLabel,
}: {
  entry: DiaryEntry;
  onEdit: (e: DiaryEntry) => void;
  onCopy: (e: DiaryEntry) => void;
  onRemove: (id: number) => void;
  gramsLabel: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.tangerineSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>{foodEmoji(entry.food_name)}</Text>
      </View>
      <Pressable onPress={() => onEdit(entry)} style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: colors.ink, fontWeight: '800' }}>{entry.food_name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{Math.round(entry.portion_grams)}{gramsLabel} · {Math.round(entry.calories)} kcal</Text>
      </Pressable>
      <Pressable onPress={() => onCopy(entry)} hitSlop={10}><Ionicons name="copy-outline" size={19} color={colors.muted} /></Pressable>
      <Pressable onPress={() => onRemove(entry.id)} hitSlop={10} style={{ marginLeft: 12 }}><Ionicons name="trash-outline" size={19} color={colors.muted} /></Pressable>
    </View>
  );
});

export default function Today() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings, locale, t } = useApp();
  const [date, setDate] = useState(dateKey());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [editPortion, setEditPortion] = useState('');
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [water, setWater] = useState(0);
  const [weekAvg, setWeekAvg] = useState(0);
  const [weekDays, setWeekDays] = useState(0);
  const [ready, setReady] = useState(false);
  // Signature of last applied data — focus reloads skip setState when nothing changed.
  const appliedSig = useRef<string | null>(null);
  const loadedDate = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const start = new Date(`${date}T12:00:00`);
      start.setDate(start.getDate() - 6);
      const startKey = start.toISOString().slice(0, 10);
      const [rows, dateRows, w, week] = await Promise.all([
        db.getAllAsync<DiaryEntry>('SELECT id,date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat FROM diary_entries WHERE date=? ORDER BY id DESC', date),
        db.getAllAsync<{ date: string }>('SELECT DISTINCT date FROM diary_entries WHERE calories > 0 ORDER BY date DESC LIMIT 120'),
        db.getFirstAsync<{ ml: number }>('SELECT ml FROM water_entries WHERE date=?', date),
        db.getAllAsync<{ date: string; calories: number }>('SELECT date, SUM(calories) as calories FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date', startKey, date),
      ]);
      const s = calcStreak(dateRows.map((r) => r.date), dateKey());
      const ml = Number(w?.ml ?? 0);
      const active = week.filter((d) => Number(d.calories) > 0);
      const days = active.length;
      const avg = days ? active.reduce((a, d) => a + Number(d.calories), 0) / days : 0;
      // One signature comparison → a single batched update, or no update at all.
      const sig = JSON.stringify([date, rows.map((r) => [r.id, r.portion_grams, Math.round(r.calories * 100)]), ml, s.current, s.best, days, Math.round(avg)]);
      if (sig === appliedSig.current && loadedDate.current === date) return;
      appliedSig.current = sig;
      loadedDate.current = date;
      setEntries(rows);
      setStreak(s.current);
      setBest(s.best);
      setWater(ml);
      setWeekDays(days);
      setWeekAvg(avg);
      setReady(true);
    } catch (e) {
      console.error('Failed to load diary entries', e);
      setReady(true);
    }
  }, [db, date]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => sumNutrition(entries), [entries]);
  const grouped = useMemo(() => {
    const map = new Map<MealType, DiaryEntry[]>();
    for (const m of mealTypes) map.set(m, []);
    for (const e of entries) map.get(e.meal_type)?.push(e);
    return map;
  }, [entries]);
  const remaining = Math.max(0, Math.round(settings.calorie_goal - totals.calories));
  const mood = totals.calories >= settings.calorie_goal ? t('goalHit') : totals.calories >= settings.calorie_goal * 0.5 ? t('almostThere') : t('freshStart');

  const remove = useCallback((id: number) => Alert.alert(t('delete'), t('delete'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: async () => { await db.runAsync('DELETE FROM diary_entries WHERE id=?', id); load(); } }]), [db, load, t]);
  const copyEntry = useCallback(async (entry: DiaryEntry) => { await db.runAsync('INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)', date, entry.meal_type, entry.food_id, entry.food_name, entry.portion_grams, entry.calories, entry.protein, entry.carbs, entry.fat, 'Copied diary entry'); load(); }, [db, date, load]);
  const startEdit = useCallback((entry: DiaryEntry) => { setEditing(entry); setEditPortion(String(entry.portion_grams)); }, []);
  const saveEdit = async () => { if (!editing) return; const nextPortion = Math.max(1, parseNumber(editPortion, editing.portion_grams)); const factor = editing.portion_grams > 0 ? nextPortion / editing.portion_grams : 1; await db.runAsync('UPDATE diary_entries SET portion_grams=?,calories=?,protein=?,carbs=?,fat=? WHERE id=?', nextPortion, editing.calories * factor, editing.protein * factor, editing.carbs * factor, editing.fat * factor, editing.id); setEditing(null); load(); };
  const addWater = async (ml: number) => {
    const next = Math.max(0, water + ml);
    await db.runAsync('INSERT INTO water_entries (date, ml) VALUES (?,?) ON CONFLICT(date) DO UPDATE SET ml=excluded.ml', date, next);
    setWater(next);
    appliedSig.current = null; // force next focus load to pick up the change
  };
  const openAdd = useCallback((meal: MealType) => router.push({ pathname: '/add-food', params: { date, meal } }), [router, date]);
  const gramsLabel = t('grams');

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.muted, fontWeight: '800', fontSize: 13 }}>{greeting(new Date().getHours(), locale)} 👋</Text>
            <Text style={styles.title}>{t('today')}</Text>
            <Text style={styles.subtitle}>{dateLabel(date, locale)}</Text>
          </View>
          <View style={{ minWidth: 76, alignItems: 'flex-end' }}>
            <StreakChip streak={streak} />
          </View>
        </View>

        <DateStepper date={date} locale={locale} onChange={setDate} />

        <View style={styles.heroCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <CalorieRing value={totals.calories} goal={settings.calorie_goal} goalLabel={t('goalBadge')} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>{t('consumed')}</Text>
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{mood}</Text>
              <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>{remaining} {t('remaining')}</Text>
              </View>
              {best > 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 8, fontWeight: '700' }}>{t('bestStreak')}: {best} 🔥</Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <MacroPill label={t('protein')} value={totals.protein} goal={settings.protein_goal} color={colors.green} bg={colors.white} />
            <MacroPill label={t('carbs')} value={totals.carbs} goal={settings.carbs_goal} color={colors.tangerine} bg={colors.white} />
            <MacroPill label={t('fat')} value={totals.fat} goal={settings.fat_goal} color={colors.grape} bg={colors.white} />
          </View>
        </View>

        {!ready ? (
          <View style={[styles.card, { backgroundColor: colors.lemonSoft, borderColor: colors.lemonSoft, minHeight: 86, justifyContent: 'center' }]}>
            <View style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.08)', width: '45%' }} />
            <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.06)', width: '70%', marginTop: 8 }} />
          </View>
        ) : weekDays > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.lemonSoft, borderColor: colors.lemonSoft, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 86 }]}>
            <Text style={{ fontSize: 26 }}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '900', color: colors.ink, fontSize: 13 }}>{t('weekInsight')}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{weekDays}/7 {t('loggedDays')} · {Math.round(weekAvg)} {t('avgDay')}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>💧 {t('water')}</Text>
            <Text style={{ fontWeight: '900', color: colors.ink }}>{Math.round(water)}/{WATER_GOAL} ml</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 10, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(Math.max((water - i * 250) / 250, 0), 1) * 100}%`, height: '100%', backgroundColor: colors.sky, borderRadius: 6 }} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable onPress={() => addWater(250)} style={[styles.chip, { flex: 1 }]}><Text style={styles.chipText}>+250 💧</Text></Pressable>
            <Pressable onPress={() => addWater(500)} style={[styles.chip, { flex: 1 }]}><Text style={styles.chipText}>+500 🚰</Text></Pressable>
            <Pressable onPress={() => addWater(-250)} style={[styles.chip, { flex: 1 }]}><Text style={styles.chipText}>−250</Text></Pressable>
          </View>
        </View>

        {mealTypes.map((meal) => {
          const mealEntries = grouped.get(meal) ?? [];
          const mealKcal = Math.round(mealEntries.reduce((a, e) => a + e.calories, 0));
          return (
            <View key={meal} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20 }}>{mealEmoji[meal]}</Text>
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t(meal)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{mealKcal} kcal · {mealEntries.length}</Text>
                  </View>
                </View>
                <Pressable onPress={() => openAdd(meal)} accessibilityLabel={`${t('addFood')} ${t(meal)}`} hitSlop={10}>
                  <Ionicons name="add-circle" size={30} color={colors.green} />
                </Pressable>
              </View>
              {mealEntries.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 14, marginTop: 10 }}>{t('noEntries')}</Text>
              ) : (
                mealEntries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onEdit={startEdit} onCopy={copyEntry} onRemove={remove} gramsLabel={gramsLabel} />
                ))
              )}
            </View>
          );
        })}

        {ready && entries.length === 0 && (
          <View style={styles.card}>
            <EmptyState emoji="🍋" title={t('noEntries')} body={t('logFirst')} />
          </View>
        )}

        <Pressable onPress={() => openAdd('snack')} style={[styles.button, { flexDirection: 'row', gap: 8, marginTop: 16, backgroundColor: colors.ink }]}>
          <Ionicons name="add" color={colors.white} size={20} />
          <Text style={styles.buttonText}>{t('addFood')} ✨</Text>
        </Pressable>

        {editing && (
          <View style={[styles.card, { borderColor: colors.green, borderWidth: 2 }]}>
            <Text style={styles.sectionTitle}>{editing.food_name}</Text>
            <Text style={styles.label}>{t('portion')} ({t('grams')})</Text>
            <TextInput style={styles.input} value={editPortion} onChangeText={setEditPortion} keyboardType="decimal-pad" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Pressable onPress={() => setEditing(null)} style={[styles.outlineButton, { flex: 1 }]}><Text style={styles.outlineText}>{t('cancel')}</Text></Pressable>
              <Pressable onPress={saveEdit} style={[styles.button, { flex: 1 }]}><Text style={styles.buttonText}>{t('save')}</Text></Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
