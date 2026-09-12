import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { dateKey, dateLabel } from '@/src/lib/db';
import { colors, gradients, radius, styles } from '@/src/theme';
import { parseNumber } from '@/src/lib/nutrition';
import { WORKOUT_EMOJI, WORKOUT_TYPES, estimateForWorkout } from '@/src/lib/activity';
import { checkHealthAvailability, getLastSync, syncHealthConnect } from '@/src/lib/healthSync';
import { Workout, WorkoutType } from '@/src/types';
import type { TranslationKey } from '@/src/lib/i18n';
import { DateStepper } from '@/src/components/DateStepper';
import { EmptyState } from '@/src/components/EmptyState';
import { GradientHero } from '@/src/ui/GradientHero';
import { GlassCard } from '@/src/ui/GlassCard';
import { PressScale } from '@/src/ui/PressScale';
import { AnimatedBar } from '@/src/ui/AnimatedBar';

export default function Activity() {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const { addXp, unlockBadge, celebrate } = useGamification();
  const [date, setDate] = useState(dateKey());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weekBurned, setWeekBurned] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  // Form state
  const [wtype, setWtype] = useState<WorkoutType>('walk');
  const [minutes, setMinutes] = useState('30');
  const [weight, setWeight] = useState('70');
  const [caloriesOverride, setCaloriesOverride] = useState('');
  const [saving, setSaving] = useState(false);

  // Health Connect sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const typeName = useCallback((ty: WorkoutType) => t(`workout_${ty}` as TranslationKey), [t]);

  const load = useCallback(async () => {
    const rows = await db.getAllAsync<Workout>(
      'SELECT id,date,type,minutes,calories,weight_kg,source,external_id,note,steps,distance_m FROM workouts WHERE date=? ORDER BY id DESC',
      date,
    );
    setWorkouts(rows);
    try {
      setLastSync(await getLastSync(db));
    } catch {
      // sync_state may not exist yet — ignore
    }
    const start = new Date(`${date}T12:00:00`);
    start.setDate(start.getDate() - 6);
    const startKey = start.toISOString().slice(0, 10);
    const week = await db.getAllAsync<{ date: string; total: number }>(
      'SELECT date, SUM(calories) as total FROM workouts WHERE date BETWEEN ? AND ? GROUP BY date',
      startKey,
      date,
    );
    setWeekBurned(week.reduce((a, r) => a + Number(r.total ?? 0), 0));
    setActiveDays(week.filter((r) => Number(r.total ?? 0) > 0).length);
  }, [db, date]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Prefill weight from the latest logged weight once.
  useEffect(() => {
    (async () => {
      try {
        const row = await db.getFirstAsync<{ kilograms: number }>('SELECT kilograms FROM weights ORDER BY date DESC LIMIT 1');
        if (row) setWeight(String(row.kilograms));
      } catch {
        // weights table may be empty — keep default
      }
    })();
  }, [db]);

  const minutesNum = Math.max(1, Math.round(parseNumber(minutes, 30)));
  const weightNum = Math.max(30, parseNumber(weight, 70));
  const estimate = estimateForWorkout(wtype, weightNum, minutesNum);
  const overrideNum = caloriesOverride.trim() ? Math.max(1, Math.round(parseNumber(caloriesOverride, estimate))) : estimate;
  const dayBurned = useMemo(() => workouts.reduce((a, w) => a + Number(w.calories ?? 0), 0), [workouts]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await db.runAsync(
        'INSERT INTO workouts (date,type,minutes,calories,weight_kg,source,created_at) VALUES (?,?,?,?,?,?,?)',
        date, wtype, minutesNum, overrideNum, weightNum, 'manual', new Date().toISOString(),
      );
      setCaloriesOverride('');
      await load();
      addXp('workout-log');
      celebrate(t('workoutLogged'), '🔥');
      // Warrior badge: 3+ active days in the last 7
      try {
        const week = await db.getAllAsync<{ date: string }>(
          'SELECT DISTINCT date FROM workouts WHERE date >= date(?, ?)',
          date,
          '-6 days',
        );
        if (week.length >= 3) unlockBadge('workout-warrior');
      } catch {
        // badge is best-effort
      }
    } catch (e) {
      console.error('Failed to save workout', e);
      Alert.alert(t('logWorkout'), String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert(t('deleteWorkout'), t('deleteWorkout'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM workouts WHERE id=?', id);
          load();
        },
      },
    ]);
  };

  const syncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const avail = await checkHealthAvailability();
      if (!avail.available) {
        setSyncMsg(t('hcNotAvailable'));
        return;
      }
      const res = await syncHealthConnect(db);
      await load();
      if (res.imported > 0) {
        // One XP award + one banner per sync, no matter how many sessions.
        await addXp('workout-log');
        celebrate(t('hcSynced').replace('{n}', String(res.imported)), '⌚');
        setSyncMsg(t('hcSynced').replace('{n}', String(res.imported)));
      } else if (res.sessions === 0) {
        setSyncMsg(t('hcNoSessions'));
      } else {
        setSyncMsg(t('hcUpToDate'));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Health Connect sync failed', e);
      if (msg === 'permission-denied') setSyncMsg(t('hcPermissionDenied'));
      else if (msg === 'not-android') setSyncMsg(t('hcNotAvailable'));
      else setSyncMsg(t('hcSyncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>{t('activity')} 🔥</Text>
      <Text style={styles.subtitle}>{dateLabel(date, locale)}</Text>
      <DateStepper date={date} locale={locale} onChange={setDate} />

      <GradientHero colors={gradients.heroSunset}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>
          🔥 {t('burnedToday')}
        </Text>
        <Text style={{ color: colors.white, fontSize: 34, fontWeight: '900', marginTop: 6 }}>
          {Math.round(dayBurned)} <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>kcal</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{t('weekBurned')}</Text>
            <Text style={{ fontWeight: '900', color: colors.white, marginTop: 2 }}>{Math.round(weekBurned)} kcal</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{t('activeDays')}</Text>
            <Text style={{ fontWeight: '900', color: colors.white, marginTop: 2 }}>{activeDays}/7</Text>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <AnimatedBar ratio={activeDays / 7} color={colors.goldBright} height={8} track="rgba(0,0,0,0.3)" />
        </View>
      </GradientHero>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>＋ {t('logWorkout')}</Text>
        <Text style={styles.label}>{t('workoutType')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {WORKOUT_TYPES.map((ty) => (
            <PressScale
              key={ty}
              onPress={() => setWtype(ty)}
              style={[styles.chip, wtype === ty && styles.chipActive]}
              haptic
            >
              <Text style={[styles.chipText, wtype === ty && styles.chipTextActive]}>
                {WORKOUT_EMOJI[ty]} {typeName(ty)}
              </Text>
            </PressScale>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('minutes')}</Text>
            <TextInput value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={styles.input} placeholder="30" placeholderTextColor={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('weightUsed')} (kg)</Text>
            <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} placeholder="70" placeholderTextColor={colors.muted} />
          </View>
        </View>
        <Text style={styles.label}>{t('caloriesBurned')} · {t('estimated')}: {estimate} kcal</Text>
        <TextInput
          value={caloriesOverride}
          onChangeText={setCaloriesOverride}
          keyboardType="numeric"
          style={styles.input}
          placeholder={`${t('estimated')}: ${estimate} kcal`}
          placeholderTextColor={colors.muted}
        />
        <PressScale
          onPress={save}
          style={[styles.button, { marginTop: 14, opacity: saving ? 0.6 : 1 }]}
          haptic
        >
          <Text style={styles.buttonText}>
            {saving ? '…' : `🔥 ${t('addWorkout')} · ${overrideNum} kcal`}
          </Text>
        </PressScale>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.card}>
          <EmptyState emoji="🏅" title={t('noWorkouts')} body={t('logFirstWorkout')} />
        </View>
      ) : (
        workouts.map((w, i) => (
          <Animated.View
            key={w.id}
            entering={FadeInUp.delay(Math.min(i, 6) * 60).duration(350)}
            layout={Layout.springify()}
            style={[styles.card, { flexDirection: 'row', alignItems: 'center' }]}
          >
            <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.tangerineSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24 }}>{WORKOUT_EMOJI[(w.type as WorkoutType) ?? 'other'] ?? '🏅'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.ink, fontWeight: '900' }} numberOfLines={1}>
                {typeName((w.type as WorkoutType) ?? 'other')}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
                {Math.round(Number(w.minutes))} {t('minutesShort')} · {Math.round(Number(w.calories))} kcal
                {w.source === 'health-connect' ? ' · ⌚' : ''}
                {w.steps != null && Number(w.steps) > 0 ? ` · ${Math.round(Number(w.steps))} ${t('stepsShort')}` : ''}
                {w.distance_m != null && Number(w.distance_m) > 0 ? ` · ${(Number(w.distance_m) / 1000).toFixed(1)} km` : ''}
              </Text>
            </View>
            <PressScale onPress={() => remove(w.id)} hitSlop={10} style={{ padding: 6 }} haptic>
              <Text style={{ fontSize: 18, color: colors.muted }}>🗑️</Text>
            </PressScale>
          </Animated.View>
        ))
      )}

      <GlassCard>
        <Text style={{ fontWeight: '900', color: colors.ink, fontSize: 15 }}>⌚ {t('connectWatch')}</Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 }}>{t('watchHint')}</Text>
        {lastSync ? (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
            {t('hcLastSync')}: {new Date(lastSync).toLocaleString(locale === 'el' ? 'el-GR' : 'en-US')}
          </Text>
        ) : null}
        {syncMsg ? (
          <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 6 }}>{syncMsg}</Text>
        ) : null}
        <PressScale
          onPress={syncNow}
          style={[styles.button, { marginTop: 12, opacity: syncing ? 0.6 : 1 }]}
          haptic
        >
          <Text style={styles.buttonText}>{syncing ? '…' : `⌚ ${t('syncNow')}`}</Text>
        </PressScale>
      </GlassCard>
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}
