import { Text, View } from 'react-native';
import { colors } from '@/src/theme';

export function NutritionBar({ label, value, goal, unit = 'g', color = colors.green }: { label: string; value: number; goal: number; unit?: string; color?: string }) {
  const ratio = goal > 0 ? Math.min(value / goal, 1) : 0;
  return <View style={{ flex: 1, marginRight: 8 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}><Text style={{ fontSize: 12, color: colors.muted, fontWeight: '700' }}>{label}</Text><Text style={{ fontSize: 12, color: colors.ink, fontWeight: '800' }}>{Math.round(value)}{unit}</Text></View><View style={{ height: 7, borderRadius: 9, backgroundColor: colors.border, overflow: 'hidden' }}><View style={{ width: `${ratio * 100}%`, height: '100%', backgroundColor: color, borderRadius: 9 }} /></View></View>;
}
