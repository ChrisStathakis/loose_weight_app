import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

const SIZE = 148;
const R = 60;
const C = SIZE / 2;

type SkiaApi = typeof import('@shopify/react-native-skia') | null;

let skiaCache: SkiaApi = null;
let skiaTried = false;
function getSkia(): SkiaApi {
  if (!skiaTried) {
    skiaTried = true;
    try {
      // Lazy so Expo Go (which lacks Skia's native module) can still load
      // this screen — the fallback ring below renders instead.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      skiaCache = require('@shopify/react-native-skia');
    } catch {
      skiaCache = null;
    }
  }
  return skiaCache;
}

export function AnimatedRing({
  value,
  goal,
  goalLabel,
}: {
  value: number;
  goal: number;
  goalLabel: string;
}) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal * 1.1;
  const ringColor = over ? colors.tangerine : colors.lemon;
  const anim = useRef(new Animated.Value(0)).current;
  const [renderRatio, setRenderRatio] = useState(0);
  const [skia] = useState<SkiaApi>(() => getSkia());

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setRenderRatio(v));
    Animated.timing(anim, { toValue: ratio, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => {
      anim.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  const arc = useMemo(() => {
    if (!skia) return null;
    const p = skia.Skia.Path.Make();
    const sweep = Math.max(0.001, Math.min(1, renderRatio) * 359.9);
    p.addArc({ x: C - R, y: C - R, width: R * 2, height: R * 2 }, -90, sweep);
    return p;
  }, [skia, renderRatio]);

  if (!skia || !arc) {
    // Expo Go fallback: same numbers + progress bar, no native Skia.
    return (
      <View style={{ width: SIZE, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.white, fontSize: 30, fontWeight: '900' }}>{Math.round(value)}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>
            / {Math.round(goal)} kcal
          </Text>
        </View>
        <View style={{ marginTop: 10, width: SIZE - 16, height: 12, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.round(Math.min(1, renderRatio) * 100)}%`, height: '100%', backgroundColor: ringColor, borderRadius: radius.pill }} />
        </View>
        {ratio >= 1 && (
          <View style={{ marginTop: 8, backgroundColor: colors.lemon, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#5b4300' }}>{goalLabel}</Text>
          </View>
        )}
      </View>
    );
  }

  const { Canvas, Circle, Path } = skia;
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ position: 'absolute', width: SIZE, height: SIZE }}>
        <Circle cx={C} cy={C} r={R} color="rgba(255,255,255,0.22)" style="stroke" strokeWidth={14} />
        <Path path={arc} color={ringColor} style="stroke" strokeWidth={14} strokeCap="round" />
      </Canvas>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.white, fontSize: 30, fontWeight: '900' }}>{Math.round(value)}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>
          / {Math.round(goal)} kcal
        </Text>
      </View>
      {ratio >= 1 && (
        <View style={{ position: 'absolute', bottom: -6, backgroundColor: colors.lemon, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#5b4300' }}>{goalLabel}</Text>
        </View>
      )}
    </View>
  );
}
