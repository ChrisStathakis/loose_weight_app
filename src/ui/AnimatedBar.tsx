import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@/src/theme';

export function AnimatedBar({
  ratio,
  color,
  height = 6,
  delay = 0,
  track,
}: {
  ratio: number;
  color?: string;
  height?: number;
  delay?: number;
  track?: string;
}) {
  const { colors } = useAppTheme();
  const barColor = color ?? colors.green;
  const trackColor = track ?? colors.trackBg;
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, Math.min(1, ratio)), { duration: 700 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: trackColor, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: barColor, borderRadius: height }, style]} />
    </View>
  );
}
