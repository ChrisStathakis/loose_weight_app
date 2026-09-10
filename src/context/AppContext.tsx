import { createContext, useCallback, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { Locale, Settings, Diet } from '@/src/types';
import { TranslationKey, tFor } from '@/src/lib/i18n';

type AppContextValue = { settings: Settings; loading: boolean; locale: Locale; t: (key: TranslationKey) => string; updateSettings: (patch: Partial<Settings>) => Promise<void>; refreshSettings: () => Promise<void> };
const defaultLocale: Locale = getLocales()[0]?.languageCode?.toLowerCase().startsWith('el') ? 'el' : 'en';
const defaults: Settings = { locale: defaultLocale, calorie_goal: 2000, protein_goal: 120, carbs_goal: 220, fat_goal: 70, diet: 'balanced', excluded: [], onboarding_complete: false };
const Context = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    const row = await db.getFirstAsync<any>('SELECT * FROM settings WHERE id = ?', 'profile');
    if (row) setSettings({ locale: row.locale === 'el' ? 'el' : 'en', calorie_goal: Number(row.calorie_goal), protein_goal: Number(row.protein_goal), carbs_goal: Number(row.carbs_goal), fat_goal: Number(row.fat_goal), diet: (row.diet || 'balanced') as Diet, excluded: JSON.parse(row.excluded || '[]'), onboarding_complete: Boolean(row.onboarding_complete) });
    setLoading(false);
  }, [db]);

  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    await db.runAsync('UPDATE settings SET locale=?, calorie_goal=?, protein_goal=?, carbs_goal=?, fat_goal=?, diet=?, excluded=?, onboarding_complete=? WHERE id=?', next.locale, next.calorie_goal, next.protein_goal, next.carbs_goal, next.fat_goal, next.diet, JSON.stringify(next.excluded), next.onboarding_complete ? 1 : 0, 'profile');
    setSettings(next);
  }, [db, settings]);

  const value = useMemo(() => ({ settings, loading, locale: settings.locale, t: (key: TranslationKey) => tFor(settings.locale, key), updateSettings, refreshSettings }), [settings, loading, updateSettings, refreshSettings]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
