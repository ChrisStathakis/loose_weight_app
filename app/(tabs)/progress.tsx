import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { gradients, radius, useAppTheme } from '@/src/theme';
import { parseNumber } from '@/src/lib/nutrition';
import { EmptyState } from '@/src/components/EmptyState';
import { GradientHero } from '@/src/ui/GradientHero';
import { AnimatedBar } from '@/src/ui/AnimatedBar';
import { XPBadge } from '@/src/ui/XPBadge';
import { DetailSheet, type DetailTarget } from '@/src/components/DetailSheet';
import { GlassCard } from '@/src/ui/GlassCard';
import { PressScale } from '@/src/ui/PressScale';
import { BADGES } from '@/src/data/opponents';
import type { MealType } from '@/src/types';

type Day = { date: string; calories: number; protein: number; carbs: number; fat: number; burned: number };
type Bucket = Day & { count: number };
type Mode = '7' | '30' | 'year' | 'custom';
type TopRow = { food_id: string; food_name: string; times: number; kcal: number; grams: number };
type TopMap = Record<MealType, TopRow[]>;

const MEAL_ORDER: MealType[] = ['breakfast', 'brunch', 'snack', 'lunch', 'snack2', 'dinner', 'snack3'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMPTY_TOPS: TopMap = { breakfast: [], brunch: [], snack: [], lunch: [], snack2: [], dinner: [], snack3: [] };

function shiftKey(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function parseKey(key: string): Date | null {
  if (!DATE_RE.test(key)) return null;
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (d.toISOString().slice(0, 10) !== key) return null;
  return d;
}

function diffDaysInclusive(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000) + 1;
}

function BadgeShelf() {
  const { colors } = useAppTheme();
  const { badges } = useGamification();
  const { locale } = useApp();
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {BADGES.map((b) => {
        const unlocked = badges.includes(b.id);
        return (
          <View
            key={b.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: unlocked ? colors.inkDeep : colors.bg,
              borderRadius: radius.pill,
              paddingHorizontal: 12,
              paddingVertical: 8,
              opacity: unlocked ? 1 : 0.55,
              borderWidth: 1,
              borderColor: unlocked ? colors.neonLime : colors.border,
            }}
          >
            <Text style={{ fontSize: 16 }}>{unlocked ? b.emoji : '🔒'}</Text>
            <Text style={{ fontWeight: '800', fontSize: 12, color: unlocked ? '#fff' : colors.muted }}>
              {locale === 'el' ? b.name_el : b.name_en}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function Progress() {
  const db = useSQLiteContext();
  const { settings, locale, t } = useApp();
  const { colors, styles } = useAppTheme();
  const { unlockWithFanfare } = useGamification();
  const [days, setDays] = useState<Day[]>([]);
  const [weights, setWeights] = useState<{ date: string; kilograms: number }[]>([]);
  const [weight, setWeight] = useState('');
  const [mode, setMode] = useState<Mode>('7');
  const [years, setYears] = useState<string[]>([]);
  const today = dateKey();
  const currentYear = today.slice(0, 4);
  const [year, setYear] = useState(currentYear);
  const [startInput, setStartInput] = useState(shiftKey(today, -6));
  const [endInput, setEndInput] = useState(today);
  const [appliedCustom, setAppliedCustom] = useState({ start: shiftKey(today, -6), end: today });
  const [rangeError, setRangeError] = useState('');
  const [topFoods, setTopFoods] = useState<TopMap>(EMPTY_TOPS);
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const interval = useMemo(() => {
    if (mode === '7') return { startKey: shiftKey(today, -6), endKey: today, totalDays: 7 };
    if (mode === '30') return { startKey: shiftKey(today, -29), endKey: today, totalDays: 30 };
    if (mode === 'year') {
      const startKey = `${year}-01-01`;
      const rawEnd = `${year}-12-31`;
      const endKey = rawEnd > today ? today : rawEnd;
      if (startKey > endKey) return { startKey, endKey: startKey, totalDays: 0 };
      return { startKey, endKey, totalDays: diffDaysInclusive(startKey, endKey) };
    }
    let { start, end } = appliedCustom;
    if (end > today) end = today;
    let startKey = start;
    if (diffDaysInclusive(startKey, end) > 366) startKey = shiftKey(end, -365);
    return { startKey, endKey: end, totalDays: diffDaysInclusive(startKey, end) };
  }, [mode, today, year, appliedCustom]);

  const load = useCallback(async () => {
    const { startKey, endKey, totalDays } = interval;
    if (!totalDays || totalDays <= 0 || startKey > endKey) {
      setDays([]);
      setTopFoods(EMPTY_TOPS);
      setWeights([]);
      return;
    }
    const safeTotal = Math.min(totalDays, 366);
    const entries = await db.getAllAsync<any>('SELECT date, SUM(calories) calories, SUM(protein) protein, SUM(carbs) carbs, SUM(fat) fat FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date', startKey, endKey);
    const burns = await db.getAllAsync<{ date: string; total: number }>('SELECT date, SUM(calories) as total FROM workouts WHERE date BETWEEN ? AND ? GROUP BY date', startKey, endKey).catch(() => []);
    const map = new Map(entries.map((row) => [row.date, row]));
    const burnMap = new Map((burns ?? []).map((row) => [row.date, Number(row.total ?? 0)]));
    const list: Day[] = [];
    for (let i = 0; i < safeTotal; i += 1) {
      const day = new Date(`${startKey}T12:00:00`);
      day.setDate(day.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      if (key > endKey) break;
      const row = map.get(key);
      list.push({ date: key, calories: Number(row?.calories ?? 0), protein: Number(row?.protein ?? 0), carbs: Number(row?.carbs ?? 0), fat: Number(row?.fat ?? 0), burned: burnMap.get(key) ?? 0 });
    }
    setDays(list);
    try {
      const rows = await db.getAllAsync<{ meal_type: string; food_id: string; food_name: string; times: number; kcal: number; grams: number }>(
        'SELECT meal_type, food_id, food_name, COUNT(*) AS times, SUM(calories) AS kcal, SUM(portion_grams) AS grams FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY meal_type, food_id, food_name ORDER BY meal_type, times DESC',
        startKey,
        endKey,
      );
      const grouped: TopMap = { breakfast: [], brunch: [], snack: [], lunch: [], snack2: [], dinner: [], snack3: [] };
      for (const r of rows ?? []) {
        const meal = String(r.meal_type) as MealType;
        if (!MEAL_ORDER.includes(meal)) continue;
        if (grouped[meal].length >= 3) continue;
        grouped[meal].push({ food_id: String(r.food_id ?? ''), food_name: String(r.food_name ?? ''), times: Number(r.times ?? 0), kcal: Number(r.kcal ?? 0), grams: Number(r.grams ?? 0) });
      }
      setTopFoods(grouped);
    } catch {
      setTopFoods(EMPTY_TOPS);
    }
    try {
      const ws = await db.getAllAsync<{ date: string; kilograms: number }>('SELECT date,kilograms FROM weights WHERE date BETWEEN ? AND ? ORDER BY date DESC LIMIT 60', startKey, endKey);
      setWeights(ws ?? []);
    } catch {
      setWeights([]);
    }
    try {
      const ys = await db.getAllAsync<{ y: string }>("SELECT DISTINCT substr(date,1,4) AS y FROM diary_entries WHERE date GLOB '[0-9][0-9][0-9][0-9]-*' ORDER BY y DESC");
      const set = new Set((ys ?? []).map((r) => String(r.y)).filter((y) => DATE_RE.test(`${y}-01-01`)));
      set.add(currentYear);
      setYears([...set].sort().reverse());
    } catch {
      setYears([currentYear]);
    }
  }, [db, interval, currentYear]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const applyCustom = useCallback(() => {
    const s = startInput.trim();
    const e = endInput.trim();
    const sd = parseKey(s);
    const ed = parseKey(e);
    if (!sd || !ed || s > e) {
      setRangeError(t('invalidRange'));
      return;
    }
    const clampedEnd = e > today ? today : e;
    if (s > clampedEnd) {
      setRangeError(t('invalidRange'));
      return;
    }
    setRangeError('');
    let startKey = s;
    if (diffDaysInclusive(s, clampedEnd) > 366) startKey = shiftKey(clampedEnd, -365);
    setAppliedCustom({ start: startKey, end: clampedEnd });
  }, [startInput, endInput, today, t]);

  const netOf = (day: Day) => Math.max(0, day.calories - day.burned);
  const stats = useMemo(() => {
    const active = days.filter((d) => d.calories > 0);
    const avg = (f: (d: Day) => number) => (active.length ? active.reduce((a, d) => a + f(d), 0) / active.length : 0);
    return { active: active.length, total: days.length, avgCal: avg((d) => d.calories), avgP: avg((d) => d.protein), avgC: avg((d) => d.carbs), avgF: avg((d) => d.fat), avgBurn: avg((d) => d.burned), totalBurn: days.reduce((a, d) => a + d.burned, 0) };
  }, [days]);

  const buckets: Bucket[] = useMemo(() => {
    if (days.length <= 31) return days.map((d) => ({ ...d, count: 1 }));
    if (mode === 'year') {
      const groups = new Map<string, Day[]>();
      for (const d of days) {
        const k = d.date.slice(0, 7);
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(d);
      }
      return [...groups.entries()]
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([k, arr]) => {
          const n = arr.length || 1;
          const sum = (f: (d: Day) => number) => arr.reduce((a, d) => a + f(d), 0);
          return { date: `${k}-01`, calories: sum((d) => d.calories) / n, protein: sum((d) => d.protein) / n, carbs: sum((d) => d.carbs) / n, fat: sum((d) => d.fat) / n, burned: sum((d) => d.burned) / n, count: n };
        });
    }
    const out: Bucket[] = [];
    for (let i = 0; i < days.length; i += 7) {
      const chunk = days.slice(i, i + 7);
      const n = chunk.length || 1;
      const sum = (f: (d: Day) => number) => chunk.reduce((a, d) => a + f(d), 0);
      out.push({ date: chunk[0].date, calories: sum((d) => d.calories) / n, protein: sum((d) => d.protein) / n, carbs: sum((d) => d.carbs) / n, fat: sum((d) => d.fat) / n, burned: sum((d) => d.burned) / n, count: n });
    }
    return out;
  }, [days, mode]);

  const barData = days.length === 30 ? buckets.filter((_, i) => i % 2 === 0) : buckets;
  const maxCalories = Math.max(settings.calorie_goal, ...barData.map(netOf), 1);
  const latestWeight = weights[0];
  const firstWeight = weights[weights.length - 1];
  const delta = latestWeight && firstWeight ? latestWeight.kilograms - firstWeight.kilograms : 0;
  const weightAsc = [...weights].reverse();
  const last7 = weightAsc.slice(-7);
  const avg7 = last7.length ? last7.reduce((a, w) => a + w.kilograms, 0) / last7.length : 0;
  const spanDays = (() => {
    if (weightAsc.length < 2) return 0;
    const a = new Date(`${weightAsc[0].date}T12:00:00`).getTime();
    const b = new Date(`${weightAsc[weightAsc.length - 1].date}T12:00:00`).getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  })();
  const weeklyRate = spanDays >= 2 ? (delta / spanDays) * 7 : 0;
  const trendKey = weeklyRate < -0.1 ? 'trendDown' : weeklyRate > 0.1 ? 'trendUp' : 'trendFlat';
  const goalKg = settings.target_weight_kg;
  const currentKg = latestWeight?.kilograms ?? 0;
  const startKg = firstWeight?.kilograms ?? currentKg;
  const goalRemaining = goalKg != null ? goalKg - currentKg : 0;
  const goalDone = goalKg != null && Math.abs(goalRemaining) < 0.05;
  const goalProgress = goalKg != null && startKg !== goalKg
    ? Math.min(1, Math.max(0, (startKg - currentKg) / (startKg - goalKg)))
    : 0;
  const saveWeight = async () => { const value = parseNumber(weight); if (!value) return; await db.runAsync('INSERT OR REPLACE INTO weights (date,kilograms) VALUES (?,?)', today, value); setWeight(''); load(); try { const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM weights WHERE date >= date(?, ?)', today, '-29 days'); if (Number(row?.n ?? 0) >= 3) unlockWithFanfare('scale-buddy', 'badge-weight', locale === 'el' ? 'Φίλος Ζυγαριάς!' : 'Scale Buddy!', '⚖️'); } catch { /* badge is best-effort */ } };

  const barLabel = (date: string) => {
    const d = new Date(`${date}T12:00:00`);
    if (mode === 'year' && days.length > 31) {
      return d.toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { month: 'short' }).slice(0, 3);
    }
    if (days.length > 31) {
      return `${d.getDate()}/${d.getMonth() + 1}`;
    }
    return d.toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' }).slice(0, 2);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>{t('progress')} 📈</Text>
      <Text style={styles.subtitle}>{t('progressTitle')}</Text>

      <View style={{ marginTop: 14 }}>
        <XPBadge />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {(['7', '30', 'year', 'custom'] as const).map((m) => (
          <PressScale key={m} onPress={() => setMode(m)} style={[styles.chip, mode === m && styles.chipActive, { flex: 1 }]} haptic>
            <Text style={[styles.chipText, mode === m && styles.chipTextActive]}>
              {m === '7' ? t('days7') : m === '30' ? t('days30') : m === 'year' ? t('year') : t('custom')}
            </Text>
          </PressScale>
        ))}
      </View>

      {mode === 'year' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {(years.length ? years : [currentYear]).map((y) => (
            <PressScale key={y} onPress={() => setYear(y)} style={[styles.chip, year === y && styles.chipActive]} haptic>
              <Text style={[styles.chipText, year === y && styles.chipTextActive]}>{y}</Text>
            </PressScale>
          ))}
        </ScrollView>
      )}

      {mode === 'custom' && (
        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('startDate')}</Text>
              <TextInput value={startInput} onChangeText={setStartInput} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{t('endDate')}</Text>
              <TextInput value={endInput} onChangeText={setEndInput} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" style={styles.input} />
            </View>
          </View>
          {!!rangeError && <Text style={{ color: colors.berry, fontSize: 12, fontWeight: '700', marginTop: 6 }}>{rangeError}</Text>}
          <Pressable onPress={applyCustom} style={[styles.button, { minHeight: 46, marginTop: 10 }]}>
            <Text style={styles.buttonText}>{t('apply')}</Text>
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            {interval.startKey} → {interval.endKey}
          </Text>
        </View>
      )}

      <GradientHero colors={gradients.heroGrape}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>🔥 {t('calories')}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{stats.active}/{stats.total} {t('logged')}</Text>
          </View>
        </View>
        {barData.length === 0 ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700' }}>{t('noDataInRange')}</Text>
          </View>
        ) : (
          <View style={{ height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 5, marginTop: 12 }}>
            {barData.map((day, i) => {
              const isToday = day.date === today;
              const net = netOf(day);
              const over = net > settings.calorie_goal * 1.1;
              return (
                <Animated.View key={day.date} entering={FadeInUp.delay(Math.min(i, 10) * 40).duration(400)} layout={Layout.springify()} style={{ flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <View
                    style={{
                      width: '72%',
                      minHeight: net ? 10 : 4,
                      height: `${Math.max(net / maxCalories, 0.03) * 100}%`,
                      backgroundColor: net === 0 ? 'rgba(255,255,255,0.25)' : over ? colors.berry : isToday ? colors.goldBright : colors.neonLime,
                      borderRadius: 8,
                      borderWidth: isToday && net > 0 ? 2 : 0,
                      borderColor: '#fff',
                    }}
                  />
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: isToday ? '900' : '400', marginTop: 6 }}>
                    {barLabel(day.date)}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        )}
        {/* ghost rival: goal line */}
        <View style={{ marginTop: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radius.md, padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800' }}>{t('consumed')} {t('avgDay')}</Text><Text style={{ fontWeight: '900', color: '#fff', fontSize: 17 }}>{Math.round(stats.avgCal)} kcal</Text></View>
          <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800' }}>🔥 {t('burned')} {t('avgDay')}</Text><Text style={{ fontWeight: '900', color: colors.goldBright, fontSize: 17 }}>{Math.round(stats.avgBurn)} kcal</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '800' }}>👻 Rival · 🎯 {t('dailyGoals')}</Text><Text style={{ fontWeight: '900', color: '#fff', fontSize: 17 }}>{Math.round(settings.calorie_goal)} kcal</Text></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          {[
            { l: t('protein'), v: stats.avgP, g: settings.protein_goal, c: colors.neonLime },
            { l: t('carbs'), v: stats.avgC, g: settings.carbs_goal, c: colors.tangerine },
            { l: t('fat'), v: stats.avgF, g: settings.fat_goal, c: colors.goldBright },
          ].map((m, i) => (
            <View key={m.l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{m.l}</Text>
              <Text style={{ fontWeight: '900', color: '#fff' }}>{Math.round(m.v)}g</Text>
              <View style={{ marginTop: 6 }}>
                <AnimatedBar ratio={m.v / Math.max(m.g, 1)} color={m.c} height={5} delay={i * 120} track="rgba(0,0,0,0.3)" />
              </View>
            </View>
          ))}
        </View>
      </GradientHero>

      <GlassCard>
        <Text style={styles.sectionTitle}>🍽️ {t('topFoods')}</Text>
        {MEAL_ORDER.every((m) => topFoods[m].length === 0) ? (
          <EmptyState emoji="🍽️" title={t('noDataInRange')} />
        ) : (
          <View style={{ gap: 12 }}>
            {MEAL_ORDER.map((meal) => (
              <View key={meal}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: 6 }}>{t(meal)}</Text>
                {topFoods[meal].length === 0 ? (
                  <Text style={{ fontSize: 12, color: colors.muted }}>{t('noDataInRange')}</Text>
                ) : (
                  <View style={{ gap: 6 }}>
                    {topFoods[meal].map((row, idx) => (
                      <View key={`${meal}-${row.food_id}-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={{ fontWeight: '900', fontSize: 13, color: colors.ink, width: 18 }}>{idx + 1}.</Text>
                        <Text style={{ flex: 1, fontWeight: '700', fontSize: 13, color: colors.ink }} numberOfLines={1}>{row.food_name}</Text>
                        {row.food_id ? (
                          <Pressable onPress={() => setDetail({ kind: 'food', foodId: row.food_id, portionGrams: 100 })} hitSlop={8} style={{ padding: 2 }} accessibilityLabel={`${row.food_name} details`} accessibilityRole="button">
                            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
                          </Pressable>
                        ) : null}
                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.muted }}>×{row.times} {t('times')}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: colors.greenDeep }}>{Math.round(row.kcal)} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>🏅 Badges</Text>
        <BadgeShelf />
      </GlassCard>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚖️ {t('weight')}</Text>
        {weights.length === 0 ? (
          <EmptyState emoji="⚖️" title={t('noEntries')} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: colors.ink }}>{latestWeight?.kilograms} <Text style={{ fontSize: 14, color: colors.muted }}>{t('kilograms')}</Text></Text>
              {weights.length > 1 && (
                <View style={[styles.badge, { backgroundColor: delta <= 0 ? colors.mint : colors.berrySoft }]}>
                  <Text style={[styles.badgeText, { color: delta <= 0 ? colors.greenDeep : colors.berry }]}>{delta <= 0 ? '🎉' : '📌'} {delta > 0 ? '+' : ''}{delta.toFixed(1)} kg</Text>
                </View>
              )}
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{latestWeight ? dateLabel(latestWeight.date, locale) : ''}</Text>
            {weights.length > 1 ? (
              <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 8 }}>
                {t('avg7d')}: {avg7.toFixed(1)} kg · {weeklyRate > 0 ? '+' : ''}{weeklyRate.toFixed(2)} kg{t('perWeek')} · {t(trendKey)}
              </Text>
            ) : null}
            {goalKg != null && latestWeight ? (
              <View style={{ marginTop: 8, backgroundColor: colors.bg, borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                {goalDone ? (
                  <Text style={{ color: colors.greenDeep, fontWeight: '900' }}>🎉 {t('goalReached')}</Text>
                ) : (
                  <>
                    <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800' }}>
                      🎯 {t('targetWeight')}: {goalKg} kg · {Math.abs(goalRemaining).toFixed(1)} kg {t('toGo')}
                    </Text>
                    <View style={{ height: 8, borderRadius: 8, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden' }}>
                      <View style={{ width: `${goalProgress * 100}%`, height: '100%', backgroundColor: colors.green, borderRadius: 8 }} />
                    </View>
                  </>
                )}
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64, marginTop: 14 }}>
              {[...weights].reverse().slice(-14).map((w, i, arr) => {
                const vals = arr.map((x) => x.kilograms);
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                const span = Math.max(max - min, 0.5);
                const h = 14 + ((w.kilograms - min) / span) * 46;
                return <View key={`${w.date}-${i}`} style={{ flex: 1, height: h, backgroundColor: i === arr.length - 1 ? colors.ink : colors.sky, borderRadius: 5, opacity: i === arr.length - 1 ? 1 : 0.65 }} />;
              })}
            </View>
          </>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder={t('kilograms')} placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
          <Pressable onPress={saveWeight} style={[styles.button, { minHeight: 50, paddingHorizontal: 20, flexDirection: 'row', gap: 6 }]}><Ionicons name="add" size={18} color={colors.onGreen} /><Text style={styles.buttonText}>{t('addWeight')}</Text></Pressable>
        </View>
      </View>
      <DetailSheet visible={detail != null} target={detail} onClose={() => setDetail(null)} />
    </ScrollView>
  );
}
