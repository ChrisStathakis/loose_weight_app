import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/src/context/AppContext';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
  const screenOptions = useMemo(
    () => ({
      headerShown: false as const,
      tabBarActiveTintColor: colors.greenDeep,
      tabBarInactiveTintColor: colors.muted,
      tabBarBackground: () => (
        <BlurView intensity={32} tint="light" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,253,247,0.82)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.7)' }]} />
      ),
      tabBarStyle: {
        height: 64 + bottomInset,
        paddingBottom: bottomInset,
        paddingTop: 8,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        elevation: 0,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
      tabBarIconStyle: { marginTop: 2 },
    }),
    [bottomInset],
  );
  const icon = (on: string, off: string) => ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <View
      style={{
        backgroundColor: focused ? colors.inkDeep : 'transparent',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 4,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 52,
      }}
    >
      <Ionicons name={(focused ? on : off) as keyof typeof Ionicons.glyphMap} size={size ?? 24} color={focused ? '#fff' : (color as string)} />
    </View>
  );
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: t('today'), tabBarIcon: icon('sunny', 'sunny-outline') }} />
      <Tabs.Screen name="plan" options={{ title: t('plan'), tabBarIcon: icon('calendar', 'calendar-outline') }} />
      <Tabs.Screen name="activity" options={{ title: t('activity'), tabBarIcon: icon('flame', 'flame-outline') }} />
      <Tabs.Screen name="groceries" options={{ title: t('groceries'), tabBarIcon: icon('basket', 'basket-outline') }} />
      <Tabs.Screen name="progress" options={{ title: t('progress'), tabBarIcon: icon('stats-chart', 'stats-chart-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: icon('settings', 'settings-outline') }} />
    </Tabs>
  );
}
