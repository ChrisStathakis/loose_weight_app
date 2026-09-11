import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors } from '@/src/theme';

export function AnimatedBar({
  ratio,
  color = colors.green,
  height = 6,
  delay = 0,
  track = 'rgba(0,0,0,0.08)',
}: {
  ratio: number;
  color?: string;
  height?: number;
  delay?: number;
  track?: string;
}) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, ratio)), { duration: 700 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: height }, style]} />
    </View>
  );
}
