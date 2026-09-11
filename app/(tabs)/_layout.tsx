import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/src/context/AppContext';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  const { t } = useApp();
  const screenOptions = useMemo(() => ({
    headerShown: false as const,
    tabBarActiveTintColor: colors.green,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { height: 74, paddingBottom: 12, paddingTop: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' as const },
  }), []);
  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={{ title: t('today'), tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'sunny' : 'sunny-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="plan" options={{ title: t('plan'), tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="groceries" options={{ title: t('groceries'), tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'basket' : 'basket-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: t('progress'), tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={size} color={color} /> }} />
    </Tabs>
  );
}
