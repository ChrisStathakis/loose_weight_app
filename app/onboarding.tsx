import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { Diet, Locale } from '@/src/types';
import { parseNumber } from '@/src/lib/nutrition';
import { tFor } from '@/src/lib/i18n';
import { colors, styles } from '@/src/theme';

export default function Onboarding() {
  const router = useRouter();
  const { settings, updateSettings, t } = useApp();
  const [locale, setLocale] = useState<Locale>(settings.locale);
  const [calories, setCalories] = useState(String(settings.calorie_goal));
  const [protein, setProtein] = useState(String(settings.protein_goal));
  const [carbs, setCarbs] = useState(String(settings.carbs_goal));
  const [fat, setFat] = useState(String(settings.fat_goal));
  const [diet, setDiet] = useState<Diet>(settings.diet);
  const [excluded, setExcluded] = useState(settings.excluded.join(', '));
  const tx = (key: Parameters<typeof t>[0]) => tFor(locale, key);
  const finish = async () => { await updateSettings({ locale, calorie_goal: parseNumber(calories, 2000), protein_goal: parseNumber(protein, 120), carbs_goal: parseNumber(carbs, 220), fat_goal: parseNumber(fat, 70), diet, excluded: excluded.split(',').map((v) => v.trim()).filter(Boolean), onboarding_complete: true }); router.replace('/(tabs)'); };
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: 54 }]} keyboardShouldPersistTaps="handled"><View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: colors.green, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}><Text style={{ fontSize: 29 }}>🥗</Text></View><Text style={styles.title}>{tx('welcome')}</Text><Text style={styles.subtitle}>{tx('welcomeBody')}</Text><View style={{ flexDirection: 'row', marginTop: 24, gap: 8 }}><Pressable onPress={() => setLocale('en')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'en' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{tx('english')}</Text></Pressable><Pressable onPress={() => setLocale('el')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'el' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{tx('greek')}</Text></Pressable></View><Text style={[styles.sectionTitle, { marginTop: 28 }]}>{tx('dailyGoals')}</Text>{[[tx('calories'), calories, setCalories, 'kcal'], [tx('protein'), protein, setProtein, 'g'], [tx('carbs'), carbs, setCarbs, 'g'], [tx('fat'), fat, setFat, 'g']].map(([label, value, setter, suffix]) => <View key={label as string}><Text style={styles.label}>{label as string} ({suffix as string})</Text><TextInput style={styles.input} value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" /></View>)}<Text style={styles.label}>{tx('diet')}</Text><View style={{ flexDirection: 'row', gap: 8 }}>{(['balanced', 'vegetarian', 'vegan'] as Diet[]).map((item) => <Pressable key={item} onPress={() => setDiet(item)} style={[styles.outlineButton, { flex: 1, paddingHorizontal: 4, backgroundColor: diet === item ? colors.greenSoft : colors.surface }]}><Text style={[styles.outlineText, { fontSize: 12 }]}>{tx(item)}</Text></Pressable>)}</View><Text style={styles.label}>{tx('excluded')}</Text><TextInput style={styles.input} value={excluded} onChangeText={setExcluded} placeholder={tx('excludedHint')} placeholderTextColor={colors.muted} /><Pressable onPress={finish} style={[styles.button, { marginTop: 28, marginBottom: 20 }]}><Text style={styles.buttonText}>{tx('getStarted')}</Text></Pressable></ScrollView>;
}
