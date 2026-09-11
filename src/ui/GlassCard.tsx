import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '@/src/theme';

export function GlassCard({
  children,
  style,
  intensity = 28,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <BlurView
      intensity={intensity}
      tint="light"
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          backgroundColor: 'rgba(255,253,247,0.72)',
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

export function glassDark() {
  return {
    backgroundColor: 'rgba(12,26,19,0.55)',
    borderColor: colors.glassBorder,
  };
}
