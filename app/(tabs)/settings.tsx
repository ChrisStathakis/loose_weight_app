import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useAppTheme } from '@/src/theme';
import { Locale, ThemeMode } from '@/src/types';
import { DIETS, normalizeDiet } from '@/src/lib/diets';
import { calcAge, estimateGoals, isValidBirthDate, parseNumber, parseOptionalNumber } from '@/src/lib/nutrition';
import { isReminderOn, setEveningReminder } from '@/src/lib/reminders';
import { dateKey } from '@/src/lib/db';
import { DateField } from '@/src/ui/DateField';

const tables = ['settings', 'foods', 'recipes', 'diary_entries', 'plans', 'groceries', 'weights', 'water_entries', 'xp_events', 'badges', 'opponent_progress', 'workouts', 'sync_state'];
export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { settings, locale, t, updateSettings, refreshSettings } = useApp();
  const { colors, styles } = useAppTheme();
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
  useEffect(() => {
    setCalories(String(settings.calorie_goal));
    setProtein(String(settings.protein_goal));
    setCarbs(String(settings.carbs_goal));
    setFat(String(settings.fat_goal));
    setExcluded(settings.excluded.join(', '));
    setHeight(settings.height_cm != null ? String(settings.height_cm) : '');
    setWeight(settings.weight_kg != null ? String(settings.weight_kg) : '');
    setTargetWeight(settings.target_weight_kg != null ? String(settings.target_weight_kg) : '');
    setBirthDate(settings.birth_date ?? '');
  }, [settings]);
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
  const exportData = async () => { const data: Record<string, unknown> = { schemaVersion: 1, exportedAt: new Date().toISOString() }; for (const table of tables) data[table] = await db.getAllAsync(`SELECT * FROM ${table}`); const uri = `${FileSystem.documentDirectory}daily-plate-backup-${Date.now()}.json`; await FileSystem.writeAsStringAsync(uri, JSON.stringify(data, null, 2)); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: t('exportData') }); };
  const importData = async () => { const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true }); if (picked.canceled || !picked.assets?.[0]) return; Alert.alert(t('importData'), t('restoreWarning'), [{ text: t('cancel'), style: 'cancel' }, { text: t('importData'), style: 'destructive', onPress: async () => { try { const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri); const data = JSON.parse(raw); if (data.schemaVersion !== 1 || !Array.isArray(data.foods) || !Array.isArray(data.settings)) throw new Error('invalid'); await db.withTransactionAsync(async () => { for (const table of tables) await db.runAsync(`DELETE FROM ${table}`); for (const row of data.settings) await db.runAsync('INSERT INTO settings (id,locale,calorie_goal,protein_goal,carbs_goal,fat_goal,diet,excluded,onboarding_complete,height_cm,birth_date,weight_kg,target_weight_kg,theme) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', row.id, row.locale, row.calorie_goal, row.protein_goal, row.carbs_goal, row.fat_goal, normalizeDiet(row.diet), row.excluded, row.onboarding_complete, row.height_cm ?? null, typeof row.birth_date === 'string' ? row.birth_date : '', row.weight_kg ?? null, row.target_weight_kg ?? null, typeof row.theme === 'string' ? row.theme : 'system'); for (const row of data.foods) await db.runAsync('INSERT INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source,is_favorite) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', row.id, row.name_en, row.name_el, row.brand, row.barcode, row.calories_per_100g, row.protein_per_100g, row.carbs_per_100g, row.fat_per_100g, row.serving_grams, row.source, row.is_favorite ?? 0); for (const row of data.recipes ?? []) await db.runAsync('INSERT INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', row.id, row.name_en, row.name_el, row.diet, row.ingredients, row.instructions_en, row.instructions_el, row.calories, row.protein, row.carbs, row.fat, row.servings); for (const row of data.diary_entries ?? []) await db.runAsync('INSERT INTO diary_entries (id,date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs, fat,source) VALUES (?,?,?,?,?,?,?,?,?,?,?)', row.id, row.date, row.meal_type, row.food_id, row.food_name, row.portion_grams, row.calories, row.protein, row.carbs, row.fat, row.source); for (const row of data.plans ?? []) await db.runAsync('INSERT INTO plans (id,date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', row.id, row.date, row.meal_type, row.recipe_id ?? null, row.portion, row.locked, row.food_id ?? null, row.food_name ?? null, row.portion_grams ?? null, row.calories ?? null, row.protein ?? null, row.carbs ?? null, row.fat ?? null); for (const row of data.groceries ?? []) await db.runAsync('INSERT INTO groceries (id,date,ingredient,amount,unit,checked) VALUES (?,?,?,?,?,?)', row.id, row.date, row.ingredient, row.amount, row.unit, row.checked); for (const row of data.weights ?? []) await db.runAsync('INSERT INTO weights (id,date,kilograms) VALUES (?,?,?)', row.id, row.date, row.kilograms); for (const row of data.water_entries ?? []) await db.runAsync('INSERT INTO water_entries (date,ml) VALUES (?,?)', row.date, row.ml); for (const row of data.workouts ?? []) await db.runAsync('INSERT INTO workouts (id,date,type,minutes,calories,weight_kg,source,external_id,note,created_at,steps,distance_m) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', row.id, row.date, row.type, row.minutes, row.calories, row.weight_kg ?? null, row.source ?? 'manual', row.external_id ?? null, row.note ?? null, row.created_at ?? '', row.steps ?? null, row.distance_m ?? null); for (const row of data.sync_state ?? []) await db.runAsync('INSERT OR REPLACE INTO sync_state (key,value) VALUES (?,?)', row.key, row.value); for (const row of data.xp_events ?? []) await db.runAsync('INSERT INTO xp_events (id,date,kind,points) VALUES (?,?,?,?)', row.id, row.date, row.kind, row.points); for (const row of data.badges ?? []) await db.runAsync('INSERT OR IGNORE INTO badges (id,unlocked_at) VALUES (?,?)', row.id, row.unlocked_at); for (const row of data.opponent_progress ?? []) await db.runAsync('INSERT OR REPLACE INTO opponent_progress (week,opponent_id,hp) VALUES (?,?,?)', row.week, row.opponent_id, row.hp); }); await refreshSettings(); Alert.alert(t('importData'), t('saved')); } catch { Alert.alert(t('importData'), t('unknown')); } } }]); };
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><Text style={styles.title}>{t('settings')} ⚙️</Text><Text style={styles.subtitle}>✨ {t('appName')} · {t('privateOnDevice')}</Text><View style={styles.card}><Text style={styles.sectionTitle}>{t('language')}</Text><View style={{ flexDirection: 'row', gap: 8 }}><Pressable onPress={() => changeLocale('en')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'en' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{t('english')}</Text></Pressable><Pressable onPress={() => changeLocale('el')} style={[styles.outlineButton, { flex: 1, backgroundColor: locale === 'el' ? colors.greenSoft : colors.surface }]}><Text style={styles.outlineText}>{t('greek')}</Text></Pressable></View><Text style={[styles.label, { marginBottom: 7 }]}>{t('appearance')}</Text><View style={{ flexDirection: 'row', gap: 8 }}>{(['system', 'light', 'dark'] as ThemeMode[]).map((m) => <Pressable key={m} onPress={() => updateSettings({ theme: m })} style={[styles.chip, settings.theme === m && styles.chipActive, { flex: 1 }]}><Text style={[styles.chipText, settings.theme === m && styles.chipTextActive]}>{m === 'system' ? t('systemTheme') : m === 'light' ? t('lightTheme') : t('darkTheme')}</Text></Pressable>)}</View></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('aboutYou')}</Text><Text style={styles.label}>{t('height')} (cm)</Text><TextInput value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={styles.input} placeholder="175" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('weight')} (kg)</Text><TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} placeholder="70" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('targetWeight')} (kg)</Text><TextInput value={targetWeight} onChangeText={setTargetWeight} keyboardType="decimal-pad" style={styles.input} placeholder="65" placeholderTextColor={colors.muted} /><Text style={styles.label}>{t('birthDate')}{age != null ? ` · ${t('age')}: ${age}` : ''}</Text><DateField value={birthDate} onChange={setBirthDate} locale={locale} placeholder={t('birthDateHint')} maximumDate={new Date()} /></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('dailyGoals')}</Text>{suggested ? (<View style={{ backgroundColor: colors.mint, borderRadius: 14, padding: 12, marginBottom: 4 }}><Text style={{ color: colors.greenDeep, fontWeight: '800', fontSize: 13 }}>✨ {t('suggestedGoals')}</Text><Text style={{ color: colors.ink, fontWeight: '700', marginTop: 6 }}>{suggested.calories} kcal · P {suggested.protein}g · C {suggested.carbs}g · F {suggested.fat}g</Text><Pressable onPress={applySuggested} style={[styles.chip, { marginTop: 10, alignSelf: 'flex-start' }]}><Text style={styles.chipText}>{t('useSuggested')}</Text></Pressable></View>) : null}{[[t('calories'), calories, setCalories, 'kcal'], [t('protein'), protein, setProtein, 'g'], [t('carbs'), carbs, setCarbs, 'g'], [t('fat'), fat, setFat, 'g']].map(([label, value, setter, suffix]) => <View key={label as string}><Text style={styles.label}>{label as string} ({suffix as string})</Text><TextInput value={value as string} onChangeText={setter as (value: string) => void} keyboardType="decimal-pad" style={styles.input} /></View>)}<Text style={styles.label}>{t('diet')}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DIETS.map((item) => <Pressable key={item} onPress={() => updateSettings({ diet: item })} style={[styles.outlineButton, { width: '31%', paddingHorizontal: 3, minHeight: 44, backgroundColor: settings.diet === item ? colors.greenSoft : colors.surface }]}><Text style={[styles.outlineText, { fontSize: 12 }]}>{t(item)}</Text></Pressable>)}</View><Text style={styles.label}>{t('excluded')}</Text><TextInput value={excluded} onChangeText={setExcluded} style={styles.input} placeholder={t('excludedHint')} placeholderTextColor={colors.muted} /><Pressable onPress={save} style={[styles.button, { marginTop: 16, flexDirection: 'row', gap: 6 }]}><Ionicons name="checkmark" size={18} color={colors.onGreen} /><Text style={styles.buttonText}>{t('save')}</Text></Pressable></View><View style={styles.card}><Text style={styles.sectionTitle}>{t('reminders')}</Text><Pressable onPress={() => toggleReminder(!reminderOn)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name={reminderOn ? 'checkbox' : 'square-outline'} size={22} color={colors.green} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '700' }}>{t('eveningReminder')}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{t('eveningReminderHint')}</Text></View></Pressable>{reminderNote ? <Text style={{ color: colors.berry, fontSize: 12, fontWeight: '700', marginTop: 8 }}>{reminderNote}</Text> : null}</View><View style={styles.card}><Text style={styles.sectionTitle}>{t('dataTools')}</Text><Pressable onPress={exportData} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}><Ionicons name="download-outline" size={22} color={colors.green} /><Text style={{ color: colors.ink, fontWeight: '800', marginLeft: 10 }}>{t('exportData')}</Text></Pressable><Pressable onPress={importData} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}><Ionicons name="cloud-upload-outline" size={22} color={colors.green} /><Text style={{ color: colors.ink, fontWeight: '800', marginLeft: 10 }}>{t('importData')}</Text></Pressable></View></ScrollView>;
}
