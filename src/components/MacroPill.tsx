import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { radius, useAppTheme } from '@/src/theme';

export function MacroPill({ label, value, goal, color, bg, index = 0 }: { label: string; value: number; goal: number; color: string; bg: string; index?: number }) {
  const { colors } = useAppTheme();
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const w = useSharedValue(0);
  const pop = useSharedValue(1);
  const mounted = useRef(false);
  useEffect(() => {
    w.value = withDelay(Math.max(0, index) * 90, withSpring(ratio, { damping: 18, stiffness: 140 }));
  }, [ratio, w, index]);
  useEffect(() => {
    // Skip the first run: mounting with an already-met goal is not an event.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (ratio >= 1) {
      pop.value = withSpring(1.08, { damping: 8 }, () => {
        pop.value = withSpring(1, { damping: 10 });
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio >= 1]);
  const bar = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  const card = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={[{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 10 }, card]}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, marginTop: 2 }}>
        {Math.round(value)}<Text style={{ fontSize: 11, color: colors.muted }}>/{Math.round(goal)}g</Text>
      </Text>
      <View style={{ height: 6, borderRadius: 6, backgroundColor: colors.trackBg, marginTop: 8, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: 6 }, bar]} />
      </View>
    </Animated.View>
  );
}

export function StreakChip({ streak }: { streak: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lemonSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, gap: 6 }}>
      <Text style={{ fontSize: 15 }}>🔥</Text>
      <Text style={{ fontWeight: '900', color: colors.streakText, fontSize: 14 }}>{streak}</Text>
    </View>
  );
}

export function KcalBadge({ kcal }: { kcal: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: colors.greenDeep }}>{Math.round(kcal)} kcal</Text>
    </View>
  );
}
