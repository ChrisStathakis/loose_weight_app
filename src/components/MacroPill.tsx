import { Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

export function MacroPill({ label, value, goal, color, bg }: { label: string; value: number; goal: number; color: string; bg: string }) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: radius.md, padding: 10 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '900', color: colors.ink, marginTop: 2 }}>
        {Math.round(value)}<Text style={{ fontSize: 11, color: colors.muted }}>/{Math.round(goal)}g</Text>
      </Text>
      <View style={{ height: 6, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 8, overflow: 'hidden' }}>
        <View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: color, borderRadius: 6 }} />
      </View>
    </View>
  );
}

export function StreakChip({ streak }: { streak: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lemonSoft, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, gap: 6 }}>
      <Text style={{ fontSize: 15 }}>🔥</Text>
      <Text style={{ fontWeight: '900', color: '#7A5200', fontSize: 14 }}>{streak}</Text>
    </View>
  );
}

export function KcalBadge({ kcal }: { kcal: number }) {
  return (
    <View style={{ backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 }}>
      <Text style={{ fontSize: 11, fontWeight: '900', color: colors.greenDeep }}>{Math.round(kcal)} kcal</Text>
    </View>
  );
}
