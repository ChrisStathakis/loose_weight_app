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

function getApi(): NotificationsApi | null {
  if (!apiTried) {
    apiTried = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      apiCache = require('expo-notifications');
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
    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
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
