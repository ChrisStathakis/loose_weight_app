import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { Locale, Settings } from '@/src/types';
import { normalizeDiet } from '@/src/lib/diets';
import { normalizeTheme, resolvePalette, darkColors, themedStylesFor, ThemeProvider } from '@/src/theme';
import { TranslationKey, tFor } from '@/src/lib/i18n';

type AppContextValue = { settings: Settings; loading: boolean; locale: Locale; t: (key: TranslationKey) => string; updateSettings: (patch: Partial<Settings>) => Promise<void>; refreshSettings: () => Promise<Settings | null> };
function deviceLocale(): Locale {
  try {
    return getLocales()[0]?.languageCode?.toLowerCase().startsWith('el') ? 'el' : 'en';
  } catch {
    return 'en';
  }
}
const defaults: Settings = { locale: deviceLocale(), calorie_goal: 2000, protein_goal: 120, carbs_goal: 220, fat_goal: 70, diet: 'balanced', excluded: [], onboarding_complete: false, height_cm: null, birth_date: '', weight_kg: null, target_weight_kg: null, theme: 'system' };
const Context = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  // Always-current copy for updateSettings merges (state alone is stale inside
  // callbacks that were created before the last render).
  const settingsRef = useRef(settings);

  const refreshSettings = useCallback(async (): Promise<Settings | null> => {
    setLoading(true);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // If the DB is still locked by the first-launch seed, fail fast and let
      // the Gate show Retry instead of spinning forever.
      const row = await Promise.race([
        db.getFirstAsync<any>('SELECT * FROM settings WHERE id = ?', 'profile'),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('settings query timed out')), 8000);
        }),
      ]);
      if (row) {
        let excluded: string[] = [];
        try {
          excluded = JSON.parse(row.excluded || '[]');
        } catch {
          excluded = [];
        }
        const parsed: Settings = { locale: row.locale === 'el' ? 'el' : 'en', calorie_goal: Number(row.calorie_goal), protein_goal: Number(row.protein_goal), carbs_goal: Number(row.carbs_goal), fat_goal: Number(row.fat_goal), diet: normalizeDiet(row.diet), excluded, onboarding_complete: Boolean(row.onboarding_complete), height_cm: row.height_cm == null ? null : Number(row.height_cm), birth_date: typeof row.birth_date === 'string' ? row.birth_date : '', weight_kg: row.weight_kg == null ? null : Number(row.weight_kg), target_weight_kg: row.target_weight_kg == null ? null : Number(row.target_weight_kg), theme: normalizeTheme(row.theme) };
        settingsRef.current = parsed;
        setSettings(parsed);
        return parsed;
      }
      return null;
    } catch (e) {
      console.error('Failed to load settings', e);
      return null;
    } finally {
      if (timer) clearTimeout(timer);
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    // Merge from the ref (not a render-closure copy) so two updates landing in
    // the same tick compose instead of clobbering each other, and update the
    // ref before awaiting so the next call merges on top of this one.
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    try {
      await db.runAsync('UPDATE settings SET locale=?, calorie_goal=?, protein_goal=?, carbs_goal=?, fat_goal=?, diet=?, excluded=?, onboarding_complete=?, height_cm=?, birth_date=?, weight_kg=?, target_weight_kg=?, theme=? WHERE id=?', next.locale, next.calorie_goal, next.protein_goal, next.carbs_goal, next.fat_goal, next.diet, JSON.stringify(next.excluded), next.onboarding_complete ? 1 : 0, next.height_cm, next.birth_date, next.weight_kg, next.target_weight_kg, next.theme, 'profile');
    } catch (e) {
      // Local state stays authoritative for this session; log instead of
      // surfacing an unhandled rejection in every caller.
      console.error('Failed to persist settings', e);
    }
  }, [db]);

  const value = useMemo(() => ({ settings, loading, locale: settings.locale, t: (key: TranslationKey) => tFor(settings.locale, key), updateSettings, refreshSettings }), [settings, loading, updateSettings, refreshSettings]);
  const systemDark = useColorScheme() === 'dark';
  const appTheme = useMemo(() => {
    const palette = resolvePalette(settings.theme, systemDark);
    return { colors: palette, styles: themedStylesFor(palette), scheme: (palette === darkColors ? 'dark' : 'light') as 'light' | 'dark' };
  }, [settings.theme, systemDark]);
  return <Context.Provider value={value}><ThemeProvider value={appTheme}>{children}</ThemeProvider></Context.Provider>;
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
