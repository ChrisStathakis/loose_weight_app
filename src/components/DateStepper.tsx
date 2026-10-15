import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/src/theme';
import { dateLabel } from '@/src/lib/db';
import { addDaysKey, localDateKey } from '@/src/lib/dates';
import { Locale } from '@/src/types';

export function DateStepper({ date, locale, onChange }: { date: string; locale: Locale; onChange: (date: string) => void }) {
  const { colors } = useAppTheme();
  const move = (amount: number) => {
    const next = new Date(`${date}T12:00:00`);
    // Corrupt state must not crash the stepper: fall back to today.
    if (Number.isNaN(next.getTime())) {
      const today = new Date();
      today.setDate(today.getDate() + amount);
      onChange(localDateKey(today));
      return;
    }
    onChange(addDaysKey(date, amount));
  };
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 4 }}><Pressable accessibilityLabel={locale === 'el' ? 'Προηγούμενη μέρα' : 'Previous day'} onPress={() => move(-1)} hitSlop={12}><Ionicons name="chevron-back" size={25} color={colors.green} /></Pressable><Text style={{ fontSize: 16, color: colors.ink, fontWeight: '800' }}>{dateLabel(date, locale)}</Text><Pressable accessibilityLabel={locale === 'el' ? 'Επόμενη μέρα' : 'Next day'} onPress={() => move(1)} hitSlop={12}><Ionicons name="chevron-forward" size={25} color={colors.green} /></Pressable></View>;
}
