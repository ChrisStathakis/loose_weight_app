import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors, radius } from '@/src/theme';

const SIZE = 148;
const R = 60;
const C = SIZE / 2;

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

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setRenderRatio(v));
    Animated.timing(anim, { toValue: ratio, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => {
      anim.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);

  const arc = useMemo(() => {
    const p = Skia.Path.Make();
    const sweep = Math.max(0.001, Math.min(1, renderRatio) * 359.9);
    p.addArc({ x: C - R, y: C - R, width: R * 2, height: R * 2 }, -90, sweep);
    return p;
  }, [renderRatio]);

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
