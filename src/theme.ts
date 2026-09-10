import { StyleSheet } from 'react-native';

export const colors = { bg: '#F7F3EC', surface: '#FFFDF9', ink: '#1D2A23', muted: '#6E786F', green: '#2F6B4F', greenSoft: '#DCEBDD', border: '#E6E1D8', orange: '#C96F3D', yellow: '#F3C969', red: '#B64B4B', white: '#FFFFFF' };

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 110 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: 6 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 10 },
  button: { minHeight: 50, borderRadius: 15, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  outlineButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green },
  outlineText: { color: colors.green, fontSize: 15, fontWeight: '700' },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, color: colors.ink, fontSize: 16 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 12 },
});
