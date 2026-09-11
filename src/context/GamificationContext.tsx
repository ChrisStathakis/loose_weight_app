import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { xpForEvent } from '@/src/lib/gamification';

export type Celebration = { id: number; title: string; emoji: string };

type GamificationValue = {
  xp: number;
  celebrations: Celebration[];
  addXp: (kind: string, explicitPoints?: number) => Promise<void>;
  celebrate: (title: string, emoji?: string) => void;
  unlockBadge: (id: string) => Promise<boolean>;
  badges: string[];
};

const Context = createContext<GamificationValue | null>(null);

export function GamificationProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const idRef = useRef(1);

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

  const celebrate = useCallback((title: string, emoji = '🎉') => {
    const id = idRef.current++;
    setCelebrations((c) => [...c.slice(-2), { id, title, emoji }]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      setCelebrations((c) => c.filter((x) => x.id !== id));
    }, 2400);
  }, []);

  const addXp = useCallback(
    async (kind: string, explicitPoints?: number) => {
      const points = explicitPoints ?? xpForEvent(kind);
      try {
        await db.runAsync('INSERT INTO xp_events (date, kind, points) VALUES (?,?,?)', new Date().toISOString().slice(0, 10), kind, points);
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

  const unlockBadge = useCallback(
    async (id: string) => {
      try {
        await db.runAsync('INSERT OR IGNORE INTO badges (id, unlocked_at) VALUES (?,?)', id, new Date().toISOString());
        setBadges((b) => (b.includes(id) ? b : [...b, id]));
        return true;
      } catch {
        return false;
      }
    },
    [db],
  );

  const value = useMemo(
    () => ({ xp, celebrations, addXp, celebrate, unlockBadge, badges }),
    [xp, celebrations, addXp, celebrate, unlockBadge, badges],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useGamification() {
  const v = useContext(Context);
  if (!v) throw new Error('useGamification must be used inside GamificationProvider');
  return v;
}
