import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { colors, gradients, radius, styles } from '@/src/theme';
import { parseNumber } from '@/src/lib/nutrition';
import { EmptyState } from '@/src/components/EmptyState';
import { GradientHero } from '@/src/ui/GradientHero';
import { AnimatedBar } from '@/src/ui/AnimatedBar';
import { XPBadge } from '@/src/ui/XPBadge';
import { GlassCard } from '@/src/ui/GlassCard';
import { PressScale } from '@/src/ui/PressScale';
import { BADGES } from '@/src/data/opponents';

type Day = { date: string; calories: number; protein: number; carbs: number; fat: number; burned: number };

function BadgeShelf() {
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
  const [days, setDays] = useState<Day[]>([]);
  const [weights, setWeights] = useState<{ date: string; kilograms: number }[]>([]);
  const [weight, setWeight] = useState('');
  const [range, setRange] = useState<7 | 30>(7);
  const today = dateKey();

  const load = useCallback(async () => {
    const start = new Date(`${today}T12:00:00`);
    start.setDate(start.getDate() - (range - 1));
    const startKey = start.toISOString().slice(0, 10);
    const entries = await db.getAllAsync<any>('SELECT date, SUM(calories) calories, SUM(protein) protein, SUM(carbs) carbs, SUM(fat) fat FROM diary_entries WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date', startKey, today);
    const burns = await db.getAllAsync<{ date: string; total: number }>('SELECT date, SUM(calories) as total FROM workouts WHERE date BETWEEN ? AND ? GROUP BY date', startKey, today).catch(() => []);
    const map = new Map(entries.map((row) => [row.date, row]));
    const burnMap = new Map((burns ?? []).map((row) => [row.date, Number(row.total ?? 0)]));
    const list: Day[] = [];
    for (let i = 0; i < range; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      const row = map.get(key);
      list.push({ date: key, calories: Number(row?.calories ?? 0), protein: Number(row?.protein ?? 0), carbs: Number(row?.carbs ?? 0), fat: Number(row?.fat ?? 0), burned: burnMap.get(key) ?? 0 });
    }
    setDays(list);
    setWeights(await db.getAllAsync('SELECT date,kilograms FROM weights ORDER BY date DESC LIMIT 30'));
  }, [db, today, range]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const netOf = (day: Day) => Math.max(0, day.calories - day.burned);
  const maxCalories = Math.max(settings.calorie_goal, ...days.map(netOf), 1);
  const latestWeight = weights[0];
  const firstWeight = weights[weights.length - 1];
  const delta = latestWeight && firstWeight ? latestWeight.kilograms - firstWeight.kilograms : 0;
  const saveWeight = async () => { const value = parseNumber(weight); if (!value) return; await db.runAsync('INSERT OR REPLACE INTO weights (date,kilograms) VALUES (?,?)', today, value); setWeight(''); load(); };
  const stats = useMemo(() => {
    const active = days.filter((d) => d.calories > 0);
    const avg = (f: (d: Day) => number) => (active.length ? active.reduce((a, d) => a + f(d), 0) / active.length : 0);
    return { active: active.length, avgCal: avg((d) => d.calories), avgP: avg((d) => d.protein), avgC: avg((d) => d.carbs), avgF: avg((d) => d.fat), avgBurn: avg((d) => d.burned), totalBurn: days.reduce((a, d) => a + d.burned, 0) };
  }, [days]);

  const barData = range === 30 ? days.filter((_, i) => i % 2 === 0) : days;

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
        {([7, 30] as const).map((r) => (
          <PressScale key={r} onPress={() => setRange(r)} style={[styles.chip, range === r && styles.chipActive, { flex: 1 }]} haptic>
            <Text style={[styles.chipText, range === r && styles.chipTextActive]}>{r === 7 ? t('days7') : t('days30')}</Text>
          </PressScale>
        ))}
      </View>

      <GradientHero colors={gradients.heroGrape}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>🔥 {t('calories')}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>{stats.active}/{range} {t('logged')}</Text>
          </View>
        </View>
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
                  {new Date(`${day.date}T12:00:00`).toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' }).slice(0, 2)}
                </Text>
              </Animated.View>
            );
          })}
        </View>
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
          <Pressable onPress={saveWeight} style={[styles.button, { minHeight: 50, paddingHorizontal: 20 }]}><Text style={styles.buttonText}>+ {t('addWeight')}</Text></Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
