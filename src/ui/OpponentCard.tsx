import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Opponent } from '@/src/types';
import { colors, radius } from '@/src/theme';
import { AnimatedBar } from '@/src/ui/AnimatedBar';
import { PressScale } from '@/src/ui/PressScale';

export function OpponentCard({
  opponent,
  hp,
  maxHp,
  taunt,
  defeated,
  onPress,
}: {
  opponent: Opponent;
  hp: number;
  maxHp: number;
  taunt: string;
  defeated: boolean;
  onPress?: () => void;
}) {
  const shake = useSharedValue(0);
  useEffect(() => {
    shake.value = withSpring(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hp]);
  const wobble = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  return (
    <PressScale onPress={onPress} haptic>
      <View style={{ borderRadius: radius.xl, marginTop: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}>
        <LinearGradient colors={[...opponent.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Animated.View style={[{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }, wobble]}>
              <Text style={{ fontSize: 30 }}>{defeated ? '🏆' : opponent.emoji}</Text>
            </Animated.View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                  {defeated ? `${opponent.name_en} defeated!` : `VS ${opponent.name_en}`}
                </Text>
                <View style={{ backgroundColor: defeated ? colors.neonLime : 'rgba(255,255,255,0.2)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900', color: defeated ? colors.inkDeep : '#fff' }}>
                    {defeated ? 'SLAYED ⚔️' : `HP ${hp}/${maxHp}`}
                  </Text>
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 3, fontWeight: '600' }} numberOfLines={2}>
                {defeated ? 'Legendary. A new rival arrives next week.' : `“${taunt}”`}
              </Text>
              <View style={{ marginTop: 8 }}>
                <AnimatedBar ratio={hp / Math.max(1, maxHp)} color={defeated ? colors.neonLime : colors.goldBright} height={8} track="rgba(0,0,0,0.3)" />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </PressScale>
  );
}
