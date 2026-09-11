import { ReactNode } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressScale({
  children,
  haptic = false,
  ...rest
}: PressableProps & { children: ReactNode; haptic?: boolean }) {
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      style={[rest.style as object, style]}
      onPressIn={(e) => {
        s.value = withSpring(0.96, { damping: 12, stiffness: 400 });
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 12, stiffness: 400 });
        rest.onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
