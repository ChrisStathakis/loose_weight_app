import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { xpForEvent } from '@/src/lib/gamification';
import { localDateKey } from '@/src/lib/dates';

export type Celebration = { id: number; title: string; emoji: string };

type GamificationValue = {
  xp: number;
  celebrations: Celebration[];
  addXp: (kind: string, explicitPoints?: number) => Promise<void>;
  /** Idempotent award: inserts at most once per dedupeKey (UNIQUE index). */
  awardOnce: (kind: string, dedupeKey: string, explicitPoints?: number) => Promise<boolean>;
  celebrate: (title: string, emoji?: string) => void;
  unlockBadge: (id: string) => Promise<boolean>;
  unlockWithFanfare: (id: string, xpKind: string, title: string, emoji?: string) => Promise<void>;
  badges: string[];
  refresh: () => Promise<void>;
};

const Context = createContext<GamificationValue | null>(null);

export function GamificationProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const idRef = useRef(1);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const refresh = useCallback(async () => {
    try {
      const row = await db.getFirstAsync<{ total: number }>('SELECT COALESCE(SUM(points),0) as total FROM xp_events');
      setXp(Number(row?.total ?? 0));
      const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM badges');
      setBadges(rows.map((r) => r.id));
    } catch {
      // tables may not exist yet on very first launch before migration
    }
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cancel pending celebration timers on unmount so they cannot setState on a
  // dead provider (aborted navigation during the 2.4s window).
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  const celebrate = useCallback((title: string, emoji = '🎉') => {
    const id = idRef.current++;
    setCelebrations((c) => [...c.slice(-2), { id, title, emoji }]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      setCelebrations((c) => c.filter((x) => x.id !== id));
    }, 2400);
    timersRef.current.add(timer);
  }, []);

  const addXp = useCallback(
    async (kind: string, explicitPoints?: number) => {
      const points = explicitPoints ?? xpForEvent(kind);
      try {
        await db.runAsync('INSERT INTO xp_events (date, kind, points) VALUES (?,?,?)', localDateKey(), kind, points);
      } catch {
        return;
      }
      setXp((v) => v + points);
      if (kind === 'goal-hit' || kind === 'boss-slay') {
        celebrate(kind === 'boss-slay' ? 'Boss defeated!' : 'Daily goal crushed!', kind === 'boss-slay' ? '⚔️' : '🎉');
      }
    },
    [db, celebrate],
  );

  const awardOnce = useCallback(
    async (kind: string, dedupeKey: string, explicitPoints?: number): Promise<boolean> => {
      const points = explicitPoints ?? xpForEvent(kind);
      let inserted = false;
      try {
        const res = await db.runAsync(
          'INSERT OR IGNORE INTO xp_events (date, kind, points, dedupe_key) VALUES (?,?,?,?)',
          localDateKey(), kind, points, dedupeKey,
        );
        inserted = res.changes > 0;
      } catch {
        return false;
      }
      if (!inserted) return false;
      setXp((v) => v + points);
      if (kind === 'goal-hit' || kind === 'boss-slay') {
        celebrate(kind === 'boss-slay' ? 'Boss defeated!' : 'Daily goal crushed!', kind === 'boss-slay' ? '⚔️' : '🎉');
      }
      return true;
    },
    [db, celebrate],
  );

  const unlockBadge = useCallback(
    async (id: string) => {
      try {
        const res = await db.runAsync('INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?,?)', id, new Date().toISOString());
        setBadges((b) => (b.includes(id) ? b : [...b, id]));
        // False when the badge already existed — callers use this to skip
        // duplicate fanfares/XP.
        return res.changes > 0;
      } catch {
        return false;
      }
    },
    [db],
  );

  const badgesRef = useRef<string[]>([]);
  badgesRef.current = badges;

  const unlockWithFanfare = useCallback(
    async (id: string, xpKind: string, title: string, emoji = '🏅') => {
      if (badgesRef.current.includes(id)) return;
      try {
        const res = await db.runAsync('INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?,?)', id, new Date().toISOString());
        // INSERT OR IGNORE is the source of truth: changes === 0 means the
        // badge already exists (restored backup, concurrent call). Sync state
        // and award nothing — never double-pay XP or replay the fanfare.
        setBadges((b) => (b.includes(id) ? b : [...b, id]));
        if (res.changes === 0) return;
      } catch {
        return;
      }
      const points = xpForEvent(xpKind);
      try {
        await db.runAsync('INSERT INTO xp_events (date, kind, points) VALUES (?,?,?)', localDateKey(), xpKind, points);
      } catch {
        // XP is best-effort; badge is already unlocked
      }
      setXp((v) => v + points);
      celebrate(title, emoji);
    },
    [db, celebrate],
  );

  const value = useMemo(
    () => ({ xp, celebrations, addXp, awardOnce, celebrate, unlockBadge, unlockWithFanfare, badges, refresh }),
    [xp, celebrations, addXp, awardOnce, celebrate, unlockBadge, unlockWithFanfare, badges, refresh],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useGamification() {
  const v = useContext(Context);
  if (!v) throw new Error('useGamification must be used inside GamificationProvider');
  return v;
}
