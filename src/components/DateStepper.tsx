import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import { dateLabel } from '@/src/lib/db';
import { Locale } from '@/src/types';

export function DateStepper({ date, locale, onChange }: { date: string; locale: Locale; onChange: (date: string) => void }) {
  const move = (amount: number) => { const next = new Date(`${date}T12:00:00`); next.setDate(next.getDate() + amount); onChange(next.toISOString().slice(0, 10)); };
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 }}><Pressable accessibilityLabel={locale === 'el' ? 'Προηγούμενη μέρα' : 'Previous day'} onPress={() => move(-1)} hitSlop={12}><Ionicons name="chevron-back" size={25} color={colors.green} /></Pressable><Text style={{ fontSize: 16, color: colors.ink, fontWeight: '800' }}>{dateLabel(date, locale)}</Text><Pressable accessibilityLabel={locale === 'el' ? 'Επόμενη μέρα' : 'Next day'} onPress={() => move(1)} hitSlop={12}><Ionicons name="chevron-forward" size={25} color={colors.green} /></Pressable></View>;
}
