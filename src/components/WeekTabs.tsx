import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { dateLabel } from '@/src/lib/db';
import { addDaysKey, localDateKey, weekKeys } from '@/src/lib/dates';
import { radius, useAppTheme } from '@/src/theme';
import { Locale } from '@/src/types';

/** Per-day indicator shown under the day number:
 *  'has-data' = muted dot (plan rows / logged calories), 'goal-hit' = green dot. */
export type WeekTabMark = 'has-data' | 'goal-hit';

export function WeekTabs({
  date,
  locale,
  onSelect,
  marks,
}: {
  date: string;
  locale: Locale;
  onSelect: (date: string) => void;
  marks?: Record<string, WeekTabMark>;
}) {
  const { colors } = useAppTheme();
  // Corrupt state must not crash the strip: fall back to today.
  const base = Number.isNaN(new Date(`${date}T12:00:00`).getTime()) ? localDateKey() : date;
  const days = weekKeys(base);
  const today = localDateKey();
  const weekdayFmt = useMemo(
    () => new Intl.DateTimeFormat(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short' }),
    [locale],
  );

  const arrow = (name: 'chevron-back' | 'chevron-forward', amount: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onSelect(addDaysKey(base, amount))}
      hitSlop={10}
      style={{ width: 26, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name={name} size={20} color={colors.green} />
    </Pressable>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 2 }}>
      {arrow('chevron-back', -7, locale === 'el' ? 'Προηγούμενη εβδομάδα' : 'Previous week')}
      <View style={{ flex: 1, flexDirection: 'row', gap: 4, marginHorizontal: 4 }}>
        {days.map((key) => {
          const selected = key === base;
          const isToday = key === today;
          const mark = marks?.[key];
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={dateLabel(key, locale)}
              onPress={() => onSelect(key)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 6,
                borderRadius: radius.md,
                borderWidth: 1.5,
                backgroundColor: selected ? colors.green : colors.surface,
                borderColor: selected || isToday ? colors.green : colors.border,
              }}
            >
              <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '800', color: selected ? colors.onGreen : colors.muted }}>
                {weekdayFmt.format(new Date(`${key}T12:00:00`))}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '900', color: selected ? colors.onGreen : colors.ink, marginTop: 1 }}>
                {Number(key.slice(8, 10))}
              </Text>
              <View style={{ height: 5, marginTop: 2 }}>
                {mark ? (
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: selected ? colors.onGreen : mark === 'goal-hit' ? colors.green : colors.muted,
                    }}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      {arrow('chevron-forward', 7, locale === 'el' ? 'Επόμενη εβδομάδα' : 'Next week')}
    </View>
  );
}
