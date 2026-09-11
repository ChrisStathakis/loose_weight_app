import { StyleSheet } from 'react-native';

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
  // Premium dark + glass tokens
  inkDeep: '#0C1A13',
  pine: '#0B3B2A',
  pineLight: '#1B5C40',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.22)',
  neonLime: '#C6F135',
  goldBright: '#FFD84D',
};

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

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 24 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 6 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    elevation: 0,
  },
  heroCard: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.xl,
    padding: 18,
    marginTop: 14,
    shadowColor: '#14532D',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  button: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  outlineButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.green, backgroundColor: colors.surface },
  outlineText: { color: colors.green, fontSize: 15, fontWeight: '700' },
  chip: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '800', color: colors.ink },
  chipTextActive: { color: colors.white },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.ink, fontSize: 16 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 12 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
