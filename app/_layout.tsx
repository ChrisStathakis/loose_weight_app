import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Stack, Redirect, useSegments } from 'expo-router';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { ActivityIndicator, AppState, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationBar } from 'expo-navigation-bar';
import { migrateSchemaIfNeeded, seedIfNeeded } from '@/src/lib/db';
import { ensureNotificationHandler } from '@/src/lib/reminders';
import { AppProvider, useApp } from '@/src/context/AppContext';
import { GamificationProvider } from '@/src/context/GamificationContext';
import { CelebrationOverlay } from '@/src/ui/CelebrationOverlay';
import { colors, useAppTheme } from '@/src/theme';

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

function useSlowHint(active: boolean, delayMs = 8000) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    setSlow(false);
    const t = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(t);
  }, [active, delayMs]);
  return slow;
}

function LoadingView({ hint, onRetry }: { hint: string; onRetry?: () => void }) {
  const { colors } = useAppTheme();
  const slow = useSlowHint(true);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator color={colors.green} size="large" />
      {slow && (
        <Text style={{ marginTop: 16, color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
          {hint}
        </Text>
      )}
      {slow && onRetry && (
        <Pressable
          onPress={onRetry}
          style={{ marginTop: 16, backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
        >
          <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

// Schema-only onInit resolves in milliseconds, so a stuck spinner past this
// timeout means the open/close chain itself is wedged — surface Retry instead
// of spinning forever. (The bulk food seed runs in the background and is NOT
// covered by this timeout on purpose.)
const DB_INIT_TIMEOUT_MS = 15000;

function withInitTimeout<T>(work: Promise<T>, ms = DB_INIT_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Database setup timed out after ${Math.round(ms / 1000)}s`)), ms);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// Module-level stable onInit. expo-sqlite caches the open promise by onInit
// REFERENCE: same reference across remounts/Fast Refresh = cache hit, no
// reopen; a new reference = close + reopen + full re-migration. An inline
// closure here would churn the DB on every refresh of this module, and a
// close queued behind a still-running exclusive seed transaction never
// resolves (the init timeout below doesn't cover expo-sqlite's internal
// close→reopen chain). So this stays a fixed module function doing
// schema-only work that resolves in milliseconds.
async function initDbSchema(db: SQLiteDatabase): Promise<void> {
  console.log('[startup] db init started');
  // A reload during the background seed can leave the new connection racing
  // the old one's exclusive transaction. busy_timeout (set in
  // migrateSchemaIfNeeded) covers most of it, but retry locked/busy failures
  // a few times before surfacing to the error boundary.
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt += 1) {
    try {
      // NOTE: on timeout the migration keeps running natively on an opened
      // connection, so close it before rethrowing — otherwise the leaked
      // handle holds its lock and every Retry opens against it forever.
      let timedOut = false;
      try {
        await withInitTimeout(migrateSchemaIfNeeded(db));
      } catch (e) {
        timedOut = e instanceof Error && e.message.startsWith('Database setup timed out');
        if (timedOut) {
          try {
            await db.closeAsync();
          } catch {
            // Best effort: the handle may already be unusable.
          }
        }
        throw e;
      }
      console.log('[startup] db init finished');
      return;
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e).toLowerCase();
      const contended = msg.includes('locked') || msg.includes('busy');
      console.error(`[startup] db init failed (attempt ${attempt}/${maxAttempts})`, e);
      if (!contended || attempt >= maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

// Bulk seed runs once per process, AFTER first paint, never inside onInit.
let seedStarted = false;
function SeedRunner() {
  const db = useSQLiteContext();
  useEffect(() => {
    if (seedStarted) return;
    seedStarted = true;
    seedIfNeeded(db).catch((e) => {
      seedStarted = false;
      console.error('Background seed failed, will retry next mount', e);
    });
  }, [db]);
  return null;
}
class DbErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Database failed to open', error);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.ink, fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
            Could not open the database.
          </Text>
          <Text style={{ marginTop: 8, color: colors.muted, fontSize: 13, textAlign: 'center' }}>
            {String(this.state.error?.message ?? this.state.error).slice(0, 300)}
          </Text>
          <Pressable
            onPress={() => {
              this.setState({ error: null });
              this.props.onRetry();
            }}
            style={{ marginTop: 16, backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function Gate() {
  const { settings, loading, refreshSettings } = useApp();
  const segments = useSegments();
  // If settings stay loading (DB locked / slow query), offer a manual retry
  // instead of spinning forever.
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    if (!loading) {
      setStuck(false);
      return;
    }
    const t = setTimeout(() => setStuck(true), 15000);
    return () => clearTimeout(t);
  }, [loading]);
  useEffect(() => {
    if (!loading) console.log('[startup] settings loaded');
  }, [loading]);
  if (loading)
    return (
      <LoadingView
        hint="Still loading the database… if this persists, tap Retry or reload Expo Go (r)."
        onRetry={stuck ? () => refreshSettings().catch(() => {}) : undefined}
      />
    );
  const inOnboarding = segments[0] === 'onboarding';
  if (!settings.onboarding_complete && !inOnboarding) return <Redirect href="/onboarding" />;
  if (settings.onboarding_complete && inOnboarding) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useImmersiveNavbar();
  // Foreground notification behavior must be registered every process start,
  // not only when the reminder toggle is flipped on.
  useEffect(() => {
    ensureNotificationHandler();
  }, []);
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [dbKey, setDbKey] = useState(0);
  // New onInit identity ONLY on manual retry: expo-sqlite reuses its cached
  // open promise while the reference is stable (normal reloads/Fast Refresh
  // = no reopen storm), and a fresh reference forces close + reopen, which is
  // exactly what Retry wants after a genuine failure.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dbKey intentionally
  // creates a fresh onInit identity on manual retry only.
  const onInitDb = useCallback((db: SQLiteDatabase) => initDbSchema(db), [dbKey]);
  useEffect(() => {
    if (fontsLoaded || fontError) return;
    const t = setTimeout(() => setFontTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);
  const fontsReady = fontsLoaded || fontError || fontTimedOut;
  useEffect(() => {
    if (fontsReady) console.log('[startup] fonts ready');
  }, [fontsReady]);
  if (!fontsReady) {
    return <LoadingView hint="Still loading fonts… if this persists, press r in the terminal to reload." />;
  }
  if (fontError) {
    console.warn('Font load failed, continuing without custom fonts', fontError);
  }
  // useSuspense + fallback: without this, SQLiteProvider renders `null` while
  // onInit runs. onInit is schema-only (milliseconds) and the bulk seed runs
  // in SeedRunner below, so the fallback only flashes briefly on reloads.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationBar hidden />
        <DbErrorBoundary onRetry={() => setDbKey((k) => k + 1)}>
          <Suspense fallback={<LoadingView hint="Setting up the database (first launch can take a few seconds)…" />}>
            <SQLiteProvider
              key={String(dbKey)}
              databaseName="daily-plate.db"
              onInit={onInitDb}
              useSuspense
            >
              <SeedRunner />
              <AppProvider>
                <GamificationProvider>
                  <Gate />
                  <CelebrationOverlay />
                </GamificationProvider>
              </AppProvider>
            </SQLiteProvider>
          </Suspense>
        </DbErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
