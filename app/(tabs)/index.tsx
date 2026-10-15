import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { addDaysKey, weekKeys } from '@/src/lib/dates';
import { sumNutrition, parseNumber } from '@/src/lib/nutrition';
import { calcStreak, foodEmoji, greeting } from '@/src/lib/habits';
import { computeBossHp } from '@/src/lib/opponents';
import { opponentForWeek } from '@/src/data/opponents';
import { DiaryEntry, MealType } from '@/src/types';
import { gradients, radius, useAppTheme } from '@/src/theme';
import { WeekTabs, type WeekTabMark } from '@/src/components/WeekTabs';
import { AnimatedRing } from '@/src/ui/AnimatedRing';
import { GradientHero } from '@/src/ui/GradientHero';
import { ShimmerSkeleton } from '@/src/ui/ShimmerSkeleton';
import { PressScale } from '@/src/ui/PressScale';
import { OpponentCard } from '@/src/ui/OpponentCard';
import { XPBadge } from '@/src/ui/XPBadge';
import { MacroPill, StreakChip } from '@/src/components/MacroPill';
import { EmptyState } from '@/src/components/EmptyState';
import { DetailSheet, type DetailTarget } from '@/src/components/DetailSheet';

const mealTypes: MealType[] = ['breakfast', 'brunch', 'snack', 'lunch', 'snack2', 'dinner', 'snack3'];
const mealEmoji: Record<MealType, string> = { breakfast: '🍳', brunch: '🥐', snack: '🍎', lunch: '🥗', snack2: '🍌', dinner: '🍲', snack3: '🌙' };
const WATER_GOAL = 2000;

const EntryRow = memo(function EntryRow({
  entry,
  onEdit,
  onCopy,
  onRemove,
  onDetail,
  gramsLabel,
  index,
}: {
  entry: DiaryEntry;
  onEdit: (e: DiaryEntry) => void;
  onCopy: (e: DiaryEntry) => void;
  onRemove: (id: number) => void;
  onDetail: (e: DiaryEntry) => void;
  gramsLabel: string;
  index: number;
}) {
  const { colors, styles } = useAppTheme();
  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index, 6) * 60).duration(350)} layout={Layout.springify()} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 10 }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.tangerineSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 18 }}>{foodEmoji(entry.food_name)}</Text>
      </View>
      <Pressable onPress={() => onEdit(entry)} style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ color: colors.ink, fontWeight: '800' }}>{entry.food_name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{Math.round(entry.portion_grams)}{gramsLabel} · {Math.round(entry.calories)} kcal</Text>
      </Pressable>
      <Pressable onPress={() => onDetail(entry)} hitSlop={10} accessibilityLabel={`${entry.food_name} details`} accessibilityRole="button"><Ionicons name="information-circle-outline" size={19} color={colors.muted} /></Pressable>
      <Pressable onPress={() => onCopy(entry)} hitSlop={10} accessibilityLabel={`${entry.food_name} copy`} accessibilityRole="button"><Ionicons name="copy-outline" size={19} color={colors.muted} /></Pressable>
      <Pressable onPress={() => onRemove(entry.id)} hitSlop={10} style={{ marginLeft: 12 }} accessibilityLabel={`${entry.food_name} delete`} accessibilityRole="button"><Ionicons name="trash-outline" size={19} color={colors.muted} /></Pressable>
    </Animated.View>
  );
});

export default function Today() {
  const { colors, styles } = useAppTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const { settings, locale, t } = useApp();
  const [date, setDate] = useState(dateKey());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const [editPortion, setEditPortion] = useState('');
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [water, setWater] = useState(0);
  const [burned, setBurned] = useState(0);
  const [weekAvg, setWeekAvg] = useState(0);
  const [weekDays, setWeekDays] = useState(0);
  const [weekMarks, setWeekMarks] = useState<Record<string, WeekTabMark>>({});
  const [ready, setReady] = useState(false);
  const [showAllMeals, setShowAllMeals] = useState(false);
  // Signature of last applied data — focus reloads skip setState when nothing changed.
  const appliedSig = useRef<string | null>(null);
  const loadedDate = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const startKey = addDaysKey(date, -6);
      const calWeek = weekKeys(date);
      const [rows, dateRows, w, week, burnRow, weekCalRows] = await Promise.all([
        db.getAllAsync<DiaryEntry>('SELECT id,date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat FROM diary_entries WHERE date=? ORDER BY id DESC', date),
        db.getAllAsync<{ date: string }>('SELECT DISTINCT date FROM diary_entries WHERE calories > 0 ORDER BY date DESC LIMIT 120'),
        db.getFirstAsync<{ ml: number }>('SELECT ml FROM water_entries WHERE date=?', date),
        db.getAllAsync<{ date: string; calories: number }>('SELECT date, SUM(calories) as calories FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date', startKey, date),
        db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(calories),0) as total FROM workouts WHERE date=?', date).catch(() => ({ total: 0 })),
        // Calendar week (Mon–Sun) for the week strip marks, unlike the rolling
        // 7-day window above which feeds the streak/average stats.
        db.getAllAsync<{ date: string; calories: number }>('SELECT date, SUM(calories) as calories FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date', calWeek[0], calWeek[6]),
      ]);
      const s = calcStreak(dateRows.map((r) => r.date), dateKey());
      const ml = Number(w?.ml ?? 0);
      const burn = Number(burnRow?.total ?? 0);
      const active = week.filter((d) => Number(d.calories) > 0);
      const days = active.length;
      const avg = days ? active.reduce((a, d) => a + Number(d.calories), 0) / days : 0;
      // Week strip: any logged calories = dot, ≥90% of the goal = green dot.
      const marks: Record<string, WeekTabMark> = {};
      for (const r of weekCalRows) {
        const kcal = Number(r.calories);
        if (kcal > 0) marks[r.date] = kcal >= settings.calorie_goal * 0.9 ? 'goal-hit' : 'has-data';
      }
      // One signature comparison → a single batched update, or no update at all.
      const sig = JSON.stringify([date, rows.map((r) => [r.id, r.portion_grams, Math.round(r.calories * 100)]), ml, Math.round(burn), s.current, s.best, days, Math.round(avg), calWeek.map((k) => [k, marks[k] ?? ''])]);
      if (sig === appliedSig.current && loadedDate.current === date) return;
      appliedSig.current = sig;
      loadedDate.current = date;
      setEntries(rows);
      setStreak(s.current);
      setBest(s.best);
      setWater(ml);
      setBurned(burn);
      setWeekDays(days);
      setWeekAvg(avg);
      setWeekMarks(marks);
      setReady(true);
    } catch (e) {
      console.error('Failed to load diary entries', e);
      setReady(true);
    }
  }, [db, date, settings.calorie_goal]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totals = useMemo(() => sumNutrition(entries), [entries]);
  const grouped = useMemo(() => {
    const map = new Map<MealType, DiaryEntry[]>();
    for (const m of mealTypes) map.set(m, []);
    for (const e of entries) map.get(e.meal_type)?.push(e);
    return map;
  }, [entries]);
  // Net mode: workouts add room — ring, remaining and goal-hit all use net.
  const netCalories = Math.max(0, totals.calories - burned);
  const remaining = Math.max(0, Math.round(settings.calorie_goal - netCalories));
  const mood = netCalories >= settings.calorie_goal ? t('goalHit') : netCalories >= settings.calorie_goal * 0.5 ? t('almostThere') : t('freshStart');
  const { addXp, awardOnce, unlockBadge, unlockWithFanfare, celebrate } = useGamification();

  const opponent = useMemo(() => opponentForWeek(date), [date]);
  const boss = useMemo(
    () =>
      computeBossHp({
        loggedDays: weekDays,
        goalHits: netCalories >= settings.calorie_goal ? 1 : 0,
        proteinHits: totals.protein >= settings.protein_goal ? 1 : 0,
        waterGoalHits: water >= WATER_GOAL ? 1 : 0,
        streak,
      }),
    [weekDays, netCalories, totals, settings, water, streak],
  );

  useEffect(() => {
    // awardOnce is keyed by the diary date, so re-opening the app on a day
    // that already hit the goal never double-pays (+50) or replays the
    // celebration.
    const hit = netCalories >= settings.calorie_goal && totals.calories > 0;
    if (hit) {
      void awardOnce('goal-hit', `goal-hit:${date}`);
      void unlockBadge('goal-crusher');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [netCalories, date]);

  // Streak badges (also fixes dead 'streak-3' which was never unlocked).
  useEffect(() => {
    if (streak >= 3) unlockWithFanfare('streak-3', 'badge-streak', locale === 'el' ? 'Φωτιά! Σερί 3 ημερών' : 'On Fire! 3-day streak', '🔥');
    if (streak >= 7) unlockWithFanfare('streak-7', 'badge-streak', locale === 'el' ? 'Φωτιά Εβδομάδας! Σερί 7 ημερών' : 'Week on Fire! 7-day streak', '📆');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  // Nutrition mastery badges.
  useEffect(() => {
    if (totals.calories <= 0) return;
    const proteinHit = totals.protein >= settings.protein_goal && settings.protein_goal > 0;
    if (proteinHit) unlockWithFanfare('protein-pro', 'badge-protein', locale === 'el' ? 'Πρωτεΐνη Pro!' : 'Protein Pro!', '🥩');
    const macroHit =
      proteinHit &&
      totals.carbs >= settings.carbs_goal && settings.carbs_goal > 0 &&
      totals.fat >= settings.fat_goal && settings.fat_goal > 0;
    if (macroHit) unlockWithFanfare('macro-master', 'badge-macro', locale === 'el' ? 'Πλήρες Πιάτο!' : 'Full Plate!', '🍱');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals, settings]);

  const remove = useCallback((id: number) => Alert.alert(t('deleteEntryTitle'), t('deleteEntryConfirm'), [{ text: t('cancel'), style: 'cancel' }, { text: t('delete'), style: 'destructive', onPress: async () => { await db.runAsync('DELETE FROM diary_entries WHERE id=?', id); load(); } }]), [db, load, t]);
  const copyEntry = useCallback(async (entry: DiaryEntry) => { await db.runAsync('INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)', date, entry.meal_type, entry.food_id, entry.food_name, entry.portion_grams, entry.calories, entry.protein, entry.carbs, entry.fat, 'Copied diary entry'); addXp('log-food'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); load(); }, [db, date, load, addXp]);
  const startEdit = useCallback((entry: DiaryEntry) => { setEditing(entry); setEditPortion(String(entry.portion_grams)); }, []);
  const saveEdit = async () => { if (!editing) return; const nextPortion = Math.max(1, parseNumber(editPortion, editing.portion_grams)); const factor = editing.portion_grams > 0 ? nextPortion / editing.portion_grams : 1; await db.runAsync('UPDATE diary_entries SET portion_grams=?,calories=?,protein=?,carbs=?,fat=? WHERE id=?', nextPortion, editing.calories * factor, editing.protein * factor, editing.carbs * factor, editing.fat * factor, editing.id); setEditing(null); addXp('log-food'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); load(); };
  const addWater = async (ml: number) => {
    const next = Math.max(0, water + ml);
    await db.runAsync('INSERT INTO water_entries (date, ml) VALUES (?,?) ON CONFLICT(date) DO UPDATE SET ml=excluded.ml', date, next);
    setWater(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (next >= WATER_GOAL) {
      // Same idempotence: crossing the goal up and down within one day, or
      // reopening the app, awards at most once per date.
      void awardOnce('water-goal', `water-goal:${date}`);
      void unlockBadge('hydrated');
    }
    // Aqua Trio: water goal on 3 distinct days in the last 7.
    try {
      const row = await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(DISTINCT date) as n FROM water_entries WHERE ml >= ? AND date >= date(?, ?)',
        WATER_GOAL, date, '-6 days',
      );
      if (Number(row?.n ?? 0) >= 3) unlockWithFanfare('aqua-trio', 'badge-water', locale === 'el' ? 'Τριάδα Νερού!' : 'Aqua Trio!', '🌊');
    } catch {
      // badge is best-effort
    }
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
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <StreakChip streak={streak} />
            <XPBadge compact />
          </View>
        </View>

        <WeekTabs date={date} locale={locale} marks={weekMarks} onSelect={setDate} />

        <GradientHero colors={gradients.heroDark}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <AnimatedRing value={netCalories} goal={settings.calorie_goal} goalLabel={t('goalBadge')} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>{t('netCalories')}</Text>
              <Text style={{ color: colors.white, fontSize: 15, fontWeight: '800', marginTop: 4 }}>{mood}</Text>
              <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>{remaining} {t('remaining')}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 8, fontWeight: '700' }}>
                {Math.round(totals.calories)} {t('consumed').toLowerCase()} · 🔥 {Math.round(burned)} {t('burned').toLowerCase()}
              </Text>
              {best > 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4, fontWeight: '700' }}>{t('bestStreak')}: {best} 🔥</Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <MacroPill label={t('protein')} value={totals.protein} goal={settings.protein_goal} color={colors.green} bg={colors.white} index={0} />
            <MacroPill label={t('carbs')} value={totals.carbs} goal={settings.carbs_goal} color={colors.tangerine} bg={colors.white} index={1} />
            <MacroPill label={t('fat')} value={totals.fat} goal={settings.fat_goal} color={colors.grape} bg={colors.white} index={2} />
          </View>
        </GradientHero>

        <OpponentCard
          opponent={opponent}
          hp={boss.hp}
          maxHp={boss.maxHp}
          taunt={locale === 'el' ? opponent.taunt_el : opponent.taunt_en}
          defeated={boss.defeated}
          onPress={() => {
            if (boss.defeated) {
              // One victory per opponent per calendar month (opponentForWeek
              // rotates by month hash); the unique key blocks tap farming.
              void awardOnce('boss-slay', `boss-slay:${date.slice(0, 7)}:${opponent.id}`);
              void unlockBadge('boss-slayer');
            } else {
              celebrate(locale === 'el' ? opponent.weakness_el : opponent.weakness_en, '⚔️');
            }
          }}
        />

        {!ready ? (
          <ShimmerSkeleton height={86} />
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
            <PressScale onPress={() => addWater(250)} style={[styles.chip, { flex: 1 }]} haptic><Text style={styles.chipText}>+250 💧</Text></PressScale>
            <PressScale onPress={() => addWater(500)} style={[styles.chip, { flex: 1 }]} haptic><Text style={styles.chipText}>+500 🚰</Text></PressScale>
            <PressScale onPress={() => addWater(-250)} style={[styles.chip, { flex: 1 }]} haptic><Text style={styles.chipText}>−250</Text></PressScale>
          </View>
        </View>

        {(() => {
          const primary: MealType[] = ['breakfast', 'lunch', 'dinner'];
          // "Collapsed" set is stable regardless of the toggle, so HiddenCount
          // stays meaningful and "Show less" can render after expanding.
          const collapsed = mealTypes.filter((m) => primary.includes(m) || (grouped.get(m)?.length ?? 0) > 0);
          const visible = showAllMeals ? mealTypes : collapsed;
          const hiddenCount = mealTypes.length - collapsed.length;
          return (
            <>
              {visible.map((meal) => {
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
                mealEntries.map((entry, i) => (
                  <EntryRow key={entry.id} entry={entry} onEdit={startEdit} onCopy={copyEntry} onRemove={remove} onDetail={(e) => setDetail({ kind: 'food', foodId: e.food_id, portionGrams: e.portion_grams })} gramsLabel={gramsLabel} index={i} />
                ))
              )}
            </View>
          );
        })}
              {hiddenCount > 0 ? (
                <Pressable
                  onPress={() => setShowAllMeals((v) => !v)}
                  accessibilityRole="button"
                  style={[styles.outlineButton, { marginTop: 12, flexDirection: 'row', gap: 6 }]}
                >
                  <Ionicons name={showAllMeals ? 'chevron-up' : 'chevron-down'} size={17} color={colors.green} />
                  <Text style={styles.outlineText}>
                    {showAllMeals ? t('showLessMeals') : `${t('showAllMeals')} (${hiddenCount})`}
                  </Text>
                </Pressable>
              ) : null}
            </>
          );
        })()}

        {ready && entries.length === 0 && (
          <View style={styles.card}>
            <EmptyState emoji="🍋" title={t('noEntries')} body={t('logFirst')} />
          </View>
        )}

        <PressScale onPress={() => openAdd('snack')} style={[styles.button, { flexDirection: 'row', gap: 8, marginTop: 16, backgroundColor: colors.ink }]} haptic>
          <Ionicons name="add" color={colors.onInk} size={20} />
          <Text style={styles.buttonText}>{t('addFood')} ✨</Text>
        </PressScale>
      </ScrollView>
      <DetailSheet visible={detail != null} target={detail} onClose={() => setDetail(null)} />
      <Modal visible={editing != null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(12,26,19,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text style={styles.sectionTitle} numberOfLines={1}>{editing?.food_name ?? ''}</Text>
            {editing ? (
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
                ≈ {Math.round(editing.calories * (Math.max(1, parseNumber(editPortion, editing.portion_grams)) / Math.max(1, editing.portion_grams)))} kcal · {editing.meal_type ? t(editing.meal_type) : ''}
              </Text>
            ) : null}
            <Text style={styles.label}>{t('portion')} ({t('grams')})</Text>
            <TextInput style={styles.input} value={editPortion} onChangeText={setEditPortion} keyboardType="decimal-pad" />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Pressable onPress={() => setEditing(null)} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}><Ionicons name="close-outline" size={17} color={colors.green} /><Text style={styles.outlineText}>{t('cancel')}</Text></Pressable>
              <Pressable onPress={saveEdit} style={[styles.button, { flex: 1, flexDirection: 'row', gap: 6 }]}><Ionicons name="checkmark" size={17} color={colors.onGreen} /><Text style={styles.buttonText}>{t('save')}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
