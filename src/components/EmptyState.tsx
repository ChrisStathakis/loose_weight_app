import { Text, View } from 'react-native';
import { colors, radius } from '@/src/theme';

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 26, paddingHorizontal: 12 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 36 }}>{emoji}</Text>
      </View>
      <Text style={{ marginTop: 12, fontWeight: '900', color: colors.ink, fontSize: 16, textAlign: 'center' }}>{title}</Text>
      {body ? <Text style={{ marginTop: 6, color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>{body}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
        {['#FFC93C', '#FF8A3D', '#E86A7C'].map((c) => (
          <View key={c} style={{ width: 22, height: 6, borderRadius: radius.pill, backgroundColor: c, opacity: 0.85 }} />
        ))}
      </View>
    </View>
  );
}
