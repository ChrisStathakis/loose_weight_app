import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGamification } from '@/src/context/GamificationContext';
import { levelForXp } from '@/src/lib/gamification';
import { colors, radius } from '@/src/theme';
import { AnimatedBar } from '@/src/ui/AnimatedBar';

export function XPBadge({ compact = false }: { compact?: boolean }) {
  const { xp } = useGamification();
  const { level, into, needed } = levelForXp(xp);
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inkDeep, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
        <Text style={{ fontSize: 14 }}>⚡</Text>
        <Text style={{ fontWeight: '900', color: '#fff', fontSize: 13 }}>Lv {level}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>{xp} XP</Text>
      </View>
    );
  }
  return (
    <LinearGradient
      colors={[colors.inkDeep, colors.pine]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>⚡ Level {level}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>{xp} XP</Text>
      </View>
      <View style={{ marginTop: 10 }}>
        <AnimatedBar ratio={into / needed} color={colors.neonLime} height={8} track="rgba(255,255,255,0.18)" />
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 6, fontWeight: '700' }}>
        {needed - into} XP to Level {level + 1}
      </Text>
    </LinearGradient>
  );
}
