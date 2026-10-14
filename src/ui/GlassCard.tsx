import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius, useAppTheme } from '@/src/theme';

export function GlassCard({
  children,
  style,
  intensity = 28,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  const { colors, scheme } = useAppTheme();
  const dark = scheme === 'dark';
  return (
    <BlurView
      intensity={intensity}
      tint={dark ? 'dark' : 'light'}
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: colors.glassBg,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.65)',
          padding: 16,
          marginTop: 14,
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}
