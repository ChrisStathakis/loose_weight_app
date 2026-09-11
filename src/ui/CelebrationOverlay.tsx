import { useEffect, useMemo } from 'react';
import { Dimensions, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGamification } from '@/src/context/GamificationContext';
import { colors, radius } from '@/src/theme';

const W = Dimensions.get('window').width;
const COLORS = ['#FFC93C', '#E86A7C', '#5AA9E6', '#8E6CC8', '#1E7A4F', '#FF8A3D', '#C6F135'];

function Piece({ index, go }: { index: number; go: number }) {
  const y = useSharedValue(-60);
  const rot = useSharedValue(0);
  const seed = useMemo(() => {
    let h = index * 2654435761;
    h ^= h >> 13;
    return (h >>> 0) / 4294967295;
  }, [index]);
  const x = useMemo(() => seed * (W - 24), [seed]);
  const color = COLORS[index % COLORS.length];
  const delay = (seed * 350) | 0;
  const size = 7 + (seed * 8) | 0;

  useEffect(() => {
    if (!go) return;
    y.value = withDelay(delay, withTiming(560, { duration: 1600 + seed * 900, easing: Easing.out(Easing.quad) }));
    rot.value = withDelay(delay, withTiming(360 + seed * 540, { duration: 1800 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
    opacity: y.value > 480 ? 0 : 1,
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: x, width: size, height: size * 0.62, borderRadius: 2, backgroundColor: color }, style]}
    />
  );
}

export function CelebrationOverlay() {
  const { celebrations } = useGamification();
  const top = celebrations[celebrations.length - 1];
  const go = top?.id ?? 0;
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (top) {
      opacity.value = withTiming(1, { duration: 250 });
      const t = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 });
      }, 1900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [go]);

  const banner = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: 0.9 + opacity.value * 0.1 }] }));
  if (!top) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <Piece key={`${go}-${i}`} index={i} go={go} />
      ))}
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 110 }}>
        <Animated.View style={banner}>
          <LinearGradient
            colors={[colors.inkDeep, colors.pine]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <Text style={{ fontSize: 22 }}>{top.emoji}</Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{top.title}</Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </View>
  );
}
