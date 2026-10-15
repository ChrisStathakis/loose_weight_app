import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { buildBackup, restoreBackup } from '@/src/lib/backup';
import { useAppTheme } from '@/src/theme';
import { Locale, Settings, ThemeMode } from '@/src/types';
import { DIETS } from '@/src/lib/diets';
import { calcAge, estimateGoals, isValidBirthDate, parseNumber, parseOptionalNumber } from '@/src/lib/nutrition';
import { isReminderOn, setEveningReminder } from '@/src/lib/reminders';
import { dateKey } from '@/src/lib/db';
import { DateField } from '@/src/ui/DateField';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, locale, t, updateSettings, refreshSettings } = useApp();
  const { colors, styles } = useAppTheme();
  const { refresh: refreshGamification } = useGamification();
  const [calories, setCalories] = useState(String(settings.calorie_goal));
  const [protein, setProtein] = useState(String(settings.protein_goal));
  const [carbs, setCarbs] = useState(String(settings.carbs_goal));
  const [fat, setFat] = useState(String(settings.fat_goal));
  const [excluded, setExcluded] = useState(settings.excluded.join(', '));
  const [height, setHeight] = useState(settings.height_cm != null ? String(settings.height_cm) : '');
  const [weight, setWeight] = useState(settings.weight_kg != null ? String(settings.weight_kg) : '');
  const [targetWeight, setTargetWeight] = useState(settings.target_weight_kg != null ? String(settings.target_weight_kg) : '');
  const [birthDate, setBirthDate] = useState(settings.birth_date ?? '');
  const age = calcAge(birthDate);
  const suggested = estimateGoals({ weight_kg: parseOptionalNumber(weight), height_cm: parseOptionalNumber(height), age });
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  useEffect(() => { isReminderOn(db).then(setReminderOn).catch(() => {}); }, [db]);
  const toggleReminder = async (next: boolean) => {
    setReminderNote('');
    const res = await setEveningReminder(db, next, { title: t('appName'), body: t('eveningReminderHint') });
    if (res === 'scheduled') {
      setReminderOn(next);
      return;
    }
    setReminderOn(false);
    setReminderNote(res === 'denied' ? t('reminderDenied') : t('reminderUnavailable'));
  };
  const applySuggested = () => { if (!suggested) return; setCalories(String(suggested.calories)); setProtein(String(suggested.protein)); setCarbs(String(suggested.carbs)); setFat(String(suggested.fat)); };
  // Reset the form fields from a Settings snapshot (mount initializers cover
  // the initial load; this runs after a backup restore). Deliberately NOT an
  // effect on [settings]: flipping a theme/language chip must not wipe
  // unsaved goal edits.
  const syncFields = (s: Settings) => {
    setCalories(String(s.calorie_goal));
    setProtein(String(s.protein_goal));
    setCarbs(String(s.carbs_goal));
    setFat(String(s.fat_goal));
    setExcluded(s.excluded.join(', '));
    setHeight(s.height_cm != null ? String(s.height_cm) : '');
    setWeight(s.weight_kg != null ? String(s.weight_kg) : '');
    setTargetWeight(s.target_weight_kg != null ? String(s.target_weight_kg) : '');
    setBirthDate(s.birth_date ?? '');
  };
  const save = async () => {
    const height_cm = parseOptionalNumber(height);
    const weight_kg = parseOptionalNumber(weight);
    const target_weight_kg = parseOptionalNumber(targetWeight);
    const cleanBirth = birthDate.trim();
    const birth_date = isValidBirthDate(cleanBirth) ? cleanBirth : '';
    await updateSettings({ calorie_goal: parseNumber(calories, 2000), protein_goal: parseNumber(protein, 120), carbs_goal: parseNumber(carbs, 220), fat_goal: parseNumber(fat, 70), excluded: excluded.split(',').map((v) => v.trim()).filter(Boolean), height_cm, birth_date, weight_kg, target_weight_kg });
    if (weight_kg != null) {
      try {
        await db.runAsync('INSERT OR REPLACE INTO weights (date, kilograms) VALUES (?, ?)', dateKey(), weight_kg);
      } catch (e) {
        console.error('Failed to sync weight history', e);
      }
    }
    Alert.alert(t('settings'), t('saved'));
  };
  const changeLocale = async (value: Locale) => updateSettings({ locale: value });
  const exportData = async () => { try { const data = await buildBackup(db); const uri = `${FileSystem.documentDirectory}daily-plate-backup-${Date.now()}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2)); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: t('exportData') }); } catch (e) { console.error('Export failed', e); Alert.alert(t('exportData'), t('exportFailed')); } };
  const importData = async () => { try { const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (picked.canceled || !picked.assets?.[0]) return; Alert.alert(t('importData'), t('restoreWarning'), [{ text: t('cancel'), style: 'cancel' }, { text: t('importData'), style: 'destructive', onPress: async () => { try { const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri); await restoreBackup(db, JSON.parse(raw)); const fresh = await refreshSettings(); if (fresh) syncFields(fresh); await refreshGamification(); Alert.alert(t('importData'), t('restoreComplete')); } catch (e) { console.error('Restore failed', e); Alert.alert(t('importData'), t('restoreFailed')); } } }]); } catch (e) { console.error('Import failed', e); Alert.alert(t('importData'), t('restoreFailed')); } };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><Text style={styles.title}>{t('settings')} ⚙️</Text><Text style={styles.subtitle}>✨ {t('appName')} · {t('privateOnDevice')}</Text><View style={styles.card}><Text style={styles.sectionTitle}>{t('language')}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={() => changeLocale('en')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'en' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{t('english')}</Text></Pressable><Pressable onPress={() => changeLocale('el')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'el' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{t('greek')}</Text></Pressable></View><Text style={[styles.label, { marginBottom: 7 }]}>{t('appearance')}</Text><View style={{ flexDirection: 'row', gap: 8 }}>{(['system', 'light', 'dark'] as ThemeMode[]).map((m) => <Pressable key={m} onPress={() => updateSettings({ theme: m })} style={[styles.chip, settings.theme === m && styles.chipActive, { flex: 1 }]}><Text style={[styles.chipText, settings.theme === m && styles.chipTextActive]}>{m === 'system' ? t('systemTheme') : m === 'light' ? t('lightTheme') : t('darkTheme')}</Text></Pressable>)}</View></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('aboutYou')}</Text><Text style={styles.label}>{t('height')} (cm)</Text><TextInput value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={styles.input} placeholder="175" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('weight')} (kg)</Text><TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} placeholder="70" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('targetWeight')} (kg)</Text><TextInput value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" style={styles.input} placeholder="65" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('birthDate')}{age != null ? ` · ${t('age')}: ${age}` : ''}</Text><DateField value={birthDate} onChange={setBirthDate} locale={locale} placeholder={t('birthDateHint')} maximumDate={new Date()} /></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('dailyGoals')}</Text>{suggested ? (<View style={{ backgroundColor: colors.mint, borderRadius: 14, padding: 12, marginBottom: 4 }}><Text style={{ color: colors.greenDeep, fontWeight: '800', fontSize: 13 }}>✨ {t('suggestedGoals')}</Text><Text style={{ color: colors.ink, fontWeight: '700', marginTop: 6 }}>{suggested.calories} kcal · P {suggested.protein}g · C {suggested.carbs}g · F {suggested.fat}g</Text><Pressable onPress={applySuggested} style={[styles.chip, { marginTop: 10, alignSelf: 'flex-start' }]}><Text style={styles.chipText}>{t('useSuggested')}</Text></Pressable></View>) : null}{[[t('calories'), calories, setCalories, 'kcal'], [t('protein'), protein, setProtein, 'g'], [t('carbs'), carbs, setCarbs, 'g'], [t('fat'), fat, setFat, 'g']].map(([label, value, setter, suffix]) => <View key={label as string}><Text style={styles.label}>{label as string} ({suffix as string})</Text><TextInput value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" style={styles.input} /></View>)}<Text style={styles.label}>{t('diet')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DIETS.map((item) => <Pressable key={item} onPress={() => updateSettings({ diet: item })} style={[styles.outlineButton, { width: '31%', paddingHorizontal: 3, minHeight: 44, backgroundColor: settings.diet === item ? colors.greenSoft : colors.surface }]}><Text style={[styles.outlineText, { fontSize: 12 }]}>{t(item)}</Text></Pressable>)}</View><Text style={styles.label}>{t('excluded')}</Text><TextInput value={excluded} onChangeText={setExcluded} style={styles.input} placeholder={t('excludedHint')} placeholderTextColor={colors.muted} /><Pressable onPress={save} style={[styles.button, { marginTop: 16, flexDirection: 'row', gap: 6 }]}><Ionicons name="checkmark" size={18} color={colors.onGreen} /><Text style={styles.buttonText}>{t('save')}</Text></Pressable></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('reminders')}</Text><Pressable onPress={() => toggleReminder(!reminderOn)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name={reminderOn ? 'checkbox' : 'square-outline'} size={22} color={colors.green} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '700' }}>{t('eveningReminder')}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{t('eveningReminderHint')}</Text></View></Pressable>{reminderNote ? <Text style={{ color: colors.berry, fontSize: 12, fontWeight: '700', marginTop: 8 }}>{reminderNote}</Text> : null}</View><View style={styles.card}><Text style={styles.sectionTitle}>{t('dataTools')}</Text><Pressable onPress={exportData} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}><Ionicons name="download-outline" size={22} color={colors.green} /><Text style={{ color: colors.ink, fontWeight: '800', marginLeft: 10 }}>{t('exportData')}</Text></Pressable><Pressable onPress={importData} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}><Ionicons name="cloud-upload-outline" size={22} color={colors.green} /><Text style={{ color: colors.ink, fontWeight: '800', marginLeft: 10 }}>{t('importData')}</Text></Pressable></View></ScrollView>;
}
