import { useEffect } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { ActivityIndicator, AppState, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import { migrateDbIfNeeded } from '@/src/lib/db';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { GamificationProvider } from '@/src/context/GamificationContext';
import { CelebrationOverlay } from '@/src/ui/CelebrationOverlay';
import { colors } from '@/src/theme';

function hideSystemNavbar() {
  try {
    NavigationBar.setHidden(true);
  } catch {
    // Expo Go / iOS: no system navbar API — tab bar insets still protect layout.
  }
}

function useImmersiveNavbar() {
  useEffect(() => {
    hideSystemNavbar();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') hideSystemNavbar();
    });
    return () => sub.remove();
  }, []);
}

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
  useImmersiveNavbar();
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationBar hidden />
        <SQLiteProvider databaseName="daily-plate.db" onInit={migrateDbIfNeeded}>
          <AppProvider>
            <GamificationProvider>
              <Gate />
              <CelebrationOverlay />
            </GamificationProvider>
          </AppProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
