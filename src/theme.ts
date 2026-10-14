import { StyleSheet } from 'react-native';
import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { ThemeMode } from './types';

export type { ThemeMode };

export const normalizeTheme = (value: unknown): ThemeMode =>
  value === 'light' || value === 'dark' || value === 'system' ? value : 'system';

export const colors = {
  bg: '#FBF6EC',
  surface: '#FFFDF7',
  ink: '#21312A',
  muted: '#75807A',
  green: '#1E7A4F',
  greenDeep: '#14532D',
  greenSoft: '#DFF2E2',
  mint: '#EAF7EF',
  lemon: '#FFC93C',
  lemonSoft: '#FFF3C4',
  berry: '#E86A7C',
  berrySoft: '#FDE7EB',
  tangerine: '#FF8A3D',
  tangerineSoft: '#FFEEDD',
  sky: '#5AA9E6',
  skySoft: '#E3F2FD',
  grape: '#8E6CC8',
  grapeSoft: '#EEE8FB',
  border: '#EAE3D5',
  orange: '#E07B39',
  yellow: '#F3C969',
  red: '#C24949',
  white: '#FFFFFF',
  // Text on an ink-filled background (chips). Inverts per palette.
  onInk: '#FFFFFF',
  // Streak flame count on a lemon-soft chip.
  streakText: '#7A5200',
  // Frosted card background + loading skeleton (light values here).
  glassBg: 'rgba(255,253,247,0.72)',
  skeletonBg: '#F1E8D4',
  // Tokens that differ per palette (light values here, dark in darkColors).
  onGreen: '#FFFFFF',
  tabBarBg: 'rgba(255,253,247,0.82)',
  tabBarBorder: 'rgba(255,255,255,0.7)',
  trackBg: 'rgba(0,0,0,0.08)',
  // Premium dark + glass tokens
  inkDeep: '#0C1A13',
  pine: '#0B3B2A',
  pineLight: '#1B5C40',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.22)',
  neonLime: '#C6F135',
  goldBright: '#FFD84D',
};

export const darkColors = {
  ...colors,
  bg: '#101613',
  surface: '#18211C',
  ink: '#EDF3EE',
  muted: '#9AA8A1',
  green: '#34B06B',
  greenDeep: '#8FDAAC',
  greenSoft: '#1C3327',
  mint: '#16291E',
  lemonSoft: '#2E2A12',
  berry: '#EE7F92',
  berrySoft: '#3A1F26',
  tangerineSoft: '#33231A',
  skySoft: '#1B2A3A',
  grape: '#A78BFA',
  grapeSoft: '#262038',
  border: '#2A332E',
  red: '#E57373',
  white: '#18211C',
  onGreen: '#FFFFFF',
  onInk: '#101613',
  streakText: '#FFD84D',
  glassBg: 'rgba(24,33,28,0.72)',
  skeletonBg: '#1E2721',
  tabBarBg: 'rgba(16,22,19,0.82)',
  tabBarBorder: 'rgba(255,255,255,0.14)',
  trackBg: 'rgba(255,255,255,0.14)',
};

export type Palette = typeof colors;

export const resolvePalette = (mode: ThemeMode, systemDark: boolean): Palette =>
  (mode === 'dark' || (mode === 'system' && systemDark) ? darkColors : colors) as Palette;

export const gradients = {
  heroDark: ['#0B3B2A', '#14532D', '#1E7A4F'] as const,
  heroBerry: ['#3B1020', '#7A2340', '#E86A7C'] as const,
  heroGrape: ['#221344', '#4A2E8A', '#8E6CC8'] as const,
  heroSunset: ['#3A1C07', '#B4501A', '#FF8A3D'] as const,
  gold: ['#FFC93C', '#FFD84D', '#FFF3C4'] as const,
};

export const shadows = {
  hero: {
    shadowColor: '#0B3B2A',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    shadowColor: '#2F6B4F',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };
export const spacing = { xs: 6, sm: 10, md: 16, lg: 20, xl: 28 };

export const createStyles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  content: { padding: 20, paddingBottom: 24 },
  title: { color: c.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: c.muted, fontSize: 15, lineHeight: 21, marginTop: 6 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 14,
    shadowColor: '#2F6B4F',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  // Cheap variant for long virtualized lists (FlatList rows) — no
  // shadow/elevation so Android doesn't drop frames as rows enter.
  cardFlat: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 14,
    elevation: 0,
  },
  heroCard: {
    backgroundColor: c.greenDeep,
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 14,
    shadowColor: '#14532D',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: c.ink, marginBottom: 10 },
  button: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c.green },
  buttonText: { color: c.onGreen, fontSize: 16, fontWeight: '800' },
  outlineButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.green, backgroundColor: c.surface },
  outlineText: { color: c.green, fontSize: 15, fontWeight: '700' },
  chip: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: c.ink, borderColor: c.ink },
  chipText: { fontSize: 13, fontWeight: '800', color: c.ink },
  chipTextActive: { color: c.onInk },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: 14, color: c.ink, fontSize: 16 },
  label: { color: c.ink, fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800' },
});

// Static light fallback for contexts outside the theme provider.
export const styles = createStyles(colors);

export type AppTheme = { colors: Palette; styles: typeof styles; scheme: 'light' | 'dark' };

const ThemeContext = createContext<AppTheme>({ colors, styles, scheme: 'light' });

export function ThemeProvider({ value, children }: { value: AppTheme; children: ReactNode }) {
  return createElement(ThemeContext.Provider, { value }, children);
}

// Single hook for screens/components: same `colors`/`styles` names as before.
export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}

const stylesCache = new Map<Palette, typeof styles>();

export function themedStylesFor(palette: Palette): typeof styles {
  let s = stylesCache.get(palette);
  if (!s) {
    s = createStyles(palette);
    stylesCache.set(palette, s);
  }
  return s;
}
