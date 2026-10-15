import type { SQLiteDatabase } from 'expo-sqlite';

// Evening log reminder (local notification, no server). All native access is
// lazy + guarded (same pattern as the Skia lazy-load in AnimatedRing), so
// Expo Go or a build without the plugin degrades to 'unavailable' instead of
// crashing. Only Android is supported (see app.json platforms).

export const DAILY_REMINDER_HOUR = 20;
export const DAILY_REMINDER_MINUTE = 0;
export const REMINDER_IDENTIFIER = 'daily-log';
export const REMINDER_ON_KEY = 'reminder_on';
const REMINDER_CHANNEL = 'daily-log';

type NotificationsApi = typeof import('expo-notifications');

let apiCache: NotificationsApi | null = null;
let apiTried = false;

/**
 * expo-notifications cannot be loaded in Expo Go on Android: since SDK 53 the
 * package throws from its own module init (DevicePushTokenAutoRegistration.fx
 * calls addPushTokenListener -> warnOfExpoGoPushUsage). Metro reports that
 * throw via ErrorUtils even when the require is wrapped in try/catch
 * (guardedLoadModule reports and then resolves to undefined), so the only way
 * to keep the console clean is to not require the package in that environment
 * at all. Local reminders keep working in development/production builds.
 */
export const canUseNotifications = (platformOS: string, isExpoGo: boolean): boolean =>
  !(platformOS === 'android' && isExpoGo);

function notificationsEnvironmentAllowed(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Platform } = require('react-native');
    if (Platform.OS !== 'android') return true;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isRunningInExpoGo } = require('expo');
    const inExpoGo = typeof isRunningInExpoGo === 'function' && isRunningInExpoGo();
    return canUseNotifications(Platform.OS, inExpoGo);
  } catch {
    // Unknown environment — let the guarded require below decide.
    return true;
  }
}

function getApi(): NotificationsApi | null {
  if (!apiTried) {
    apiTried = true;
    if (!notificationsEnvironmentAllowed()) {
      apiCache = null;
      return null;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      apiCache = require('expo-notifications') ?? null;
    } catch {
      apiCache = null;
    }
  }
  return apiCache;
}

const clampInt = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.floor(Number.isFinite(n) ? n : min)));

export function dailyTrigger(hour = DAILY_REMINDER_HOUR, minute = DAILY_REMINDER_MINUTE) {
  return {
    type: 'daily' as const,
    hour: clampInt(hour, 0, 23),
    minute: clampInt(minute, 0, 59),
  };
}

export function buildReminderRequest(title: string, body: string) {
  return {
    identifier: REMINDER_IDENTIFIER,
    content: { title, body, sound: false as const },
    trigger: dailyTrigger(),
  };
}

export async function isReminderAvailable(): Promise<boolean> {
  const api = getApi();
  if (!api) return false;
  try {
    await api.getPermissionsAsync();
    return true;
  } catch {
    return false;
  }
}

export async function isReminderOn(db: SQLiteDatabase): Promise<boolean> {
  try {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key=?', REMINDER_ON_KEY);
    return row?.value === '1';
  } catch {
    return false;
  }
}

export type ReminderResult = 'scheduled' | 'denied' | 'unavailable' | 'failed';

/**
 * Registers the foreground presentation handler. Call once at app startup:
 * registering it only inside the "enable reminder" path means that after a
 * process restart with the reminder already on, foreground presentation falls
 * back to the library default.
 */
export function ensureNotificationHandler(): void {
  const api = getApi();
  if (!api) return;
  try {
    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Expo Go / missing plugin — reminders degrade to unavailable.
  }
}

export async function setEveningReminder(
  db: SQLiteDatabase,
  on: boolean,
  texts: { title: string; body: string },
): Promise<ReminderResult> {
  const api = getApi();
  if (!api) return 'unavailable';
  try {
    if (!on) {
      await api.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
      await db.runAsync(`INSERT OR REPLACE INTO sync_state (key,value) VALUES (?,?)`, REMINDER_ON_KEY, '0');
      return 'scheduled';
    }
    let status = (await api.getPermissionsAsync()).status;
    if (status !== 'granted') {
      status = (await api.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return 'denied';
    ensureNotificationHandler();
    // Android 8+ requires a channel; absence of the API means non-Android.
    try {
      await (api as unknown as {
        setNotificationChannelAsync: (id: string, channel: { name: string }) => Promise<unknown>;
      }).setNotificationChannelAsync(REMINDER_CHANNEL, { name: texts.title });
    } catch {
      // Non-Android or already configured — continue.
    }
    const request = buildReminderRequest(texts.title, texts.body);
    await api.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    await api.scheduleNotificationAsync({
      identifier: request.identifier,
      content: { title: request.content.title, body: request.content.body },
      trigger: { ...request.trigger, channelId: REMINDER_CHANNEL },
    });
    await db.runAsync(`INSERT OR REPLACE INTO sync_state (key,value) VALUES (?,?)`, REMINDER_ON_KEY, '1');
    return 'scheduled';
  } catch {
    return 'failed';
  }
}
