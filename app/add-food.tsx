import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { colors, styles } from '@/src/theme';
import { Food, MealType } from '@/src/types';
import { parseNumber, scaleFood } from '@/src/lib/nutrition';
import { lookupBarcode, searchFoodsOnline } from '@/src/lib/foodProviders';

export default function AddFood() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { t, locale } = useApp();
  const params = useLocalSearchParams<{ date?: string; meal?: MealType }>();
  const date = String(params.date ?? new Date().toISOString().slice(0, 10));
  const meal = (params.meal ?? 'snack') as MealType;
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [portion, setPortion] = useState('100');
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

  const localSearch = useCallback(async (value: string) => {
    const term = `%${value.trim()}%`;
    setFoods(await db.getAllAsync<Food>('SELECT * FROM foods WHERE name_en LIKE ? OR name_el LIKE ? OR brand LIKE ? ORDER BY name_en LIMIT 30', term, term, term));
  }, [db]);
  useEffect(() => { localSearch(query); }, [localSearch, query]);

  const choose = (food: Food) => { setSelected(food); setPortion(String(food.serving_grams ?? 100)); };
  const logSelected = async () => {
    if (!selected) return;
    const grams = Math.max(1, parseNumber(portion, 100));
    const values = scaleFood(selected, grams);
    await db.runAsync('INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)', date, meal, selected.id, locale === 'el' ? selected.name_el : selected.name_en, grams, values.calories, values.protein, values.carbs, values.fat, selected.source);
    router.back();
  };
  const searchOnline = async () => { if (!query.trim()) return; setOnlineLoading(true); try { const result = await searchFoodsOnline(query); setFoods(result); } catch { Alert.alert(t('searchOnline'), t('onlineAttribution')); } finally { setOnlineLoading(false); } };
  const scan = async () => { if (!permission?.granted) { const result = await requestPermission(); if (!result.granted) { Alert.alert(t('scanBarcode'), t('cameraPermission')); return; } } setScanning(true); };
  const onBarcode = async ({ data }: { data: string }) => { setScanning(false); try { const found = await lookupBarcode(data); if (!found) Alert.alert(t('scanBarcode'), t('barcodeNotFound')); else { await db.runAsync('INSERT OR REPLACE INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source) VALUES (?,?,?,?,?,?,?,?,?,?,?)', found.id, found.name_en, found.name_el, found.brand ?? null, found.barcode ?? data, found.calories_per_100g, found.protein_per_100g, found.carbs_per_100g, found.fat_per_100g, found.serving_grams ?? null, found.source); choose(found); } } catch { Alert.alert(t('scanBarcode'), t('barcodeNotFound')); } };
  const saveCustom = async () => { if (!custom.name.trim()) return; const id = `custom-${Date.now()}`; const food: Food = { id, name_en: custom.name, name_el: custom.name, calories_per_100g: parseNumber(custom.calories), protein_per_100g: parseNumber(custom.protein), carbs_per_100g: parseNumber(custom.carbs), fat_per_100g: parseNumber(custom.fat), serving_grams: 100, source: 'Custom' }; await db.runAsync('INSERT INTO foods (id,name_en,name_el,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source) VALUES (?,?,?,?,?,?,?,?,?)', food.id, food.name_en, food.name_el, food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g, 100, food.source); choose(food); setCustomOpen(false); };

  return <><Stack.Screen options={{ title: t('addFood'), presentation: 'modal', headerShown: true, headerTintColor: colors.green, headerStyle: { backgroundColor: colors.bg } }} /><KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{scanning ? <View style={{ height: 430, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' }}><CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={onBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }} /><Pressable onPress={() => setScanning(false)} style={{ position: 'absolute', top: 18, right: 18, backgroundColor: colors.white, borderRadius: 20, padding: 10 }}><Ionicons name="close" size={22} color={colors.ink} /></Pressable></View> : <><TextInput value={query} onChangeText={setQuery} placeholder={t('searchFoods')} placeholderTextColor={colors.muted} style={styles.input} autoFocus /><View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}><Pressable onPress={searchOnline} style={[styles.outlineButton, { flex: 1 }]}><Text style={styles.outlineText}>{onlineLoading ? '…' : t('searchOnline')}</Text></Pressable><Pressable onPress={scan} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}><Ionicons name="barcode-outline" size={19} color={colors.green} /><Text style={styles.outlineText}>{t('scanBarcode')}</Text></Pressable></View><Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{t('onlineAttribution')}</Text><Pressable onPress={() => setCustomOpen((value) => !value)} style={{ paddingVertical: 16 }}><Text style={{ color: colors.green, fontWeight: '800' }}>＋ {t('manualFood')}</Text></Pressable>{customOpen && <View style={styles.card}>{<Text style={styles.sectionTitle}>{t('manualFood')}</Text>}{[['name', 'Name'], ['calories', `${t('calories')} / 100g`], ['protein', `${t('protein')} / 100g`], ['carbs', `${t('carbs')} / 100g`], ['fat', `${t('fat')} / 100g`]].map(([key, label]) => <TextInput key={key} value={custom[key as keyof typeof custom]} onChangeText={(value) => setCustom((current) => ({ ...current, [key]: value }))} placeholder={label} placeholderTextColor={colors.muted} keyboardType={key === 'name' ? 'default' : 'decimal-pad'} style={[styles.input, { marginBottom: 8 }]} />)}<Pressable onPress={saveCustom} style={styles.button}><Text style={styles.buttonText}>{t('save')}</Text></Pressable></View>}<View style={{ marginTop: 2 }}>{foods.map((food) => <Pressable key={food.id} onPress={() => choose(food)} style={[styles.card, { marginTop: 8, paddingVertical: 13, flexDirection: 'row', alignItems: 'center' }]}><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '800' }}>{locale === 'el' ? food.name_el : food.name_en}</Text><Text style={{ color: colors.muted, marginTop: 3, fontSize: 12 }}>{food.brand ? `${food.brand} · ` : ''}{Math.round(food.calories_per_100g)} kcal / 100g</Text></View><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>)}</View></>}</ScrollView>{selected && !scanning && <View style={{ borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface, padding: 16, paddingBottom: 24 }}><Text style={styles.sectionTitle}>{locale === 'el' ? selected.name_el : selected.name_en}</Text><Text style={styles.label}>{t('portion')} ({t('grams')})</Text><TextInput style={styles.input} value={portion} onChangeText={setPortion} keyboardType="decimal-pad" /><View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}><Pressable onPress={() => setSelected(null)} style={[styles.outlineButton, { flex: 1 }]}><Text style={styles.outlineText}>{t('cancel')}</Text></Pressable><Pressable onPress={logSelected} style={[styles.button, { flex: 1 }]}><Text style={styles.buttonText}>{t('logFood')}</Text></Pressable></View></View>}</KeyboardAvoidingView></>;
}
