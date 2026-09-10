import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/src/context/AppContext';
import { colors } from '@/src/theme';

export default function TabsLayout() {
  const { t } = useApp();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.green, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 74, paddingBottom: 12, paddingTop: 8, backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}><Tabs.Screen name="index" options={{ title: t('today'), tabBarIcon: ({ color, size }) => <Ionicons name="sunny-outline" size={size} color={color} /> }} /><Tabs.Screen name="plan" options={{ title: t('plan'), tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} /><Tabs.Screen name="groceries" options={{ title: t('groceries'), tabBarIcon: ({ color, size }) => <Ionicons name="basket-outline" size={size} color={color} /> }} /><Tabs.Screen name="progress" options={{ title: t('progress'), tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} /><Tabs.Screen name="settings" options={{ title: t('settings'), tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} /></Tabs>;
}
