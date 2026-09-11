import { Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

const SIZE = 148;
const TRACK = 14;

export function CalorieRing({ value, goal, goalLabel }: { value: number; goal: number; goalLabel: string }) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = goal > 0 && value > goal * 1.1;
  const ringColor = over ? colors.tangerine : colors.lemon;
  const deg = Math.round(ratio * 360);
  // Fake conic ring with two half overlays: simple approach using border segments.
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: TRACK,
          borderColor: 'rgba(255,255,255,0.22)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: TRACK,
          borderColor: 'transparent',
          borderTopColor: deg > 0 ? ringColor : 'transparent',
          borderRightColor: deg > 90 ? ringColor : 'transparent',
          borderBottomColor: deg > 180 ? ringColor : 'transparent',
          borderLeftColor: deg > 270 ? ringColor : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.white, fontSize: 30, fontWeight: '900' }}>{Math.round(value)}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' }}>/ {Math.round(goal)} kcal</Text>
      </View>
      {ratio >= 1 && (
        <View style={{ position: 'absolute', bottom: -6, backgroundColor: colors.lemon, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
          <Text style={{ fontSize: 11, fontWeight: '900', color: '#5b4300' }}>{goalLabel}</Text>
        </View>
      )}
    </View>
  );
}
