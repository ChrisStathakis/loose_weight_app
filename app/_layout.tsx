import { Stack, Redirect, useSegments } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { migrateDbIfNeeded } from '@/src/lib/db';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { GamificationProvider } from '@/src/context/GamificationContext';
import { CelebrationOverlay } from '@/src/ui/CelebrationOverlay';
import { colors } from '@/src/theme';

function Gate() {
  const { settings, loading } = useApp();
  const segments = useSegments();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.green} size="large" /></View>;
  const inOnboarding = segments[0] === 'onboarding';
  if (!settings.onboarding_complete && !inOnboarding) return <Redirect href="/onboarding" />;
  if (settings.onboarding_complete && inOnboarding) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="daily-plate.db" onInit={migrateDbIfNeeded}>
        <AppProvider>
          <GamificationProvider>
            <Gate />
            <CelebrationOverlay />
          </GamificationProvider>
        </AppProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
