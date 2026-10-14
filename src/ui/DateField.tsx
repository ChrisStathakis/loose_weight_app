import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { Locale } from '@/src/types';
import { isValidBirthDate } from '@/src/lib/nutrition';
import { useAppTheme } from '@/src/theme';

const isoToDate = (iso: string): Date | null => {
  if (!isValidBirthDate(iso)) return null;
  const [y, m, d] = iso.trim().split('-').map(Number);
  // Local noon avoids DST/timezone off-by-one when round-tripping.
  return new Date(y, m - 1, d, 12, 0, 0);
};

export const dateToIso = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

type Props = {
  value: string;
  onChange: (iso: string) => void;
  locale: Locale;
  placeholder: string;
  maximumDate?: Date;
  minimumDate?: Date;
};

export function DateField({ value, onChange, locale, placeholder, maximumDate, minimumDate }: Props) {
  const { colors, styles } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);
  const today = useMemo(() => new Date(), []);
  const maxDate = maximumDate ?? today;
  const parsed = isoToDate(value);
  const display = parsed
    ? new Intl.DateTimeFormat(locale === 'el' ? 'el-GR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(parsed)
    : placeholder;

  const openPicker = () => {
    setDraft(parsed ?? new Date(1990, 0, 1, 12, 0, 0));
    setOpen(true);
  };
  const closePicker = () => {
    setOpen(false);
    setDraft(null);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      closePicker();
      return;
    }
    if (Platform.OS === 'ios') {
      // iOS spinner reports live; stage it until the user confirms.
      if (selected) setDraft(selected);
      return;
    }
    // Android dialog: OK commits, Cancel arrives as 'dismissed' above.
    if (selected) onChange(dateToIso(selected));
    closePicker();
  };

  const confirmIos = () => {
    if (draft) onChange(dateToIso(draft));
    closePicker();
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Pressable
          onPress={openPicker}
          style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <Text style={{ color: parsed ? colors.ink : colors.muted, fontSize: 16 }}>{display}</Text>
          <Ionicons name="calendar-outline" size={20} color={colors.green} />
        </Pressable>
        {parsed ? (
          <Pressable
            onPress={() => onChange('')}
            style={[styles.outlineButton, { minHeight: 50, paddingHorizontal: 12 }]}
            accessibilityLabel="Clear date"
          >
            <Ionicons name="close" size={20} color={colors.green} />
          </Pressable>
        ) : null}
      </View>
      <Modal visible={open} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 }}>
          <View style={[styles.card, { marginTop: 0 }]}>
            <DateTimePicker
              value={draft ?? pickerFallback}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              maximumDate={maxDate}
              minimumDate={minimumDate}
              locale={locale === 'el' ? 'el-GR' : 'en-US'}
              style={Platform.OS === 'ios' ? { height: 180 } : undefined}
            />
            {Platform.OS === 'ios' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Pressable onPress={closePicker} style={[styles.outlineButton, { flex: 1 }]}>
                  <Text style={styles.outlineText}>{locale === 'el' ? 'Άκυρο' : 'Cancel'}</Text>
                </Pressable>
                <Pressable onPress={confirmIos} style={[styles.button, { flex: 1 }]}>
                  <Text style={styles.buttonText}>OK</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const pickerFallback = new Date(1990, 0, 1, 12, 0, 0);
