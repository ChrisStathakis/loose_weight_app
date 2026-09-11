import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radius } from '@/src/theme';

export function ShimmerSkeleton({ height = 86 }: { height?: number }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 320 }],
    opacity: 0.55,
  }));
  return (
    <View
      style={{
        marginTop: 14,
        minHeight: height,
        borderRadius: radius.lg,
        backgroundColor: '#F1E8D4',
        overflow: 'hidden',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <View style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.08)', width: '45%' }} />
      <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.06)', width: '70%', marginTop: 8 }} />
      <Animated.View
        style={[
          { position: 'absolute', top: 0, bottom: 0, width: 120 },
          sweep,
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.75)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}
