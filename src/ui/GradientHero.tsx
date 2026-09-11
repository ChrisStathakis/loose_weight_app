import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { radius, shadows } from '@/src/theme';

export function GradientHero({
  colors,
  children,
  style,
}: {
  colors: readonly [string, string, ...string[]];
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const gradientColors = [...colors] as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]];
  return (
    <View style={[{ borderRadius: radius.xl, marginTop: 14, overflow: 'hidden' }, shadows.hero, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}
      >
        {/* soft gloss highlight */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -70,
            right: -50,
            width: 190,
            height: 190,
            borderRadius: 95,
            backgroundColor: 'rgba(255,255,255,0.14)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -90,
            left: -40,
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: 'rgba(0,0,0,0.14)',
          }}
        />
        {children}
      </LinearGradient>
    </View>
  );
}
