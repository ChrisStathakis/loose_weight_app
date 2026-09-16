import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import { colors, radius, styles } from '@/src/theme';
import { Food, MealType } from '@/src/types';
import { parseNumber, scaleFood } from '@/src/lib/nutrition';
import { foodEmoji } from '@/src/lib/habits';
import { filterFoods, normalizeEl } from '@/src/lib/search';
import { lookupBarcode, searchFoodsOnline } from '@/src/lib/foodProviders';
import { KcalBadge } from '@/src/components/MacroPill';

const PORTION_CHIPS = [50, 100, 150, 200];

const FoodRow = memo(function FoodRow({
  food,
  name,
  active,
  onChoose,
  onToggleFav,
}: {
  food: Food;
  name: string;
  active: boolean;
  onChoose: (food: Food) => void;
  onToggleFav: (food: Food) => void;
}) {
  return (
    <View
      style={[styles.cardFlat, { marginTop: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderColor: active ? colors.green : colors.border, borderWidth: active ? 2 : 1, backgroundColor: active ? colors.mint : colors.surface }]}
    >
      <Pressable onPress={() => onChoose(food)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: active ? colors.white : colors.tangerineSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22 }}>{foodEmoji(name, food.brand)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.ink, fontWeight: '800' }} numberOfLines={1}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
            <KcalBadge kcal={food.calories_per_100g} />
            {food.brand ? <Text style={{ color: colors.muted, fontSize: 11, flexShrink: 1 }} numberOfLines={1}>{food.brand}</Text> : null}
          </View>
        </View>
      </Pressable>
      <Pressable onPress={() => onToggleFav(food)} hitSlop={10} style={{ padding: 6 }}>
        <Ionicons name={food.is_favorite ? 'star' : 'star-outline'} size={20} color={food.is_favorite ? colors.tangerine : colors.muted} />
      </Pressable>
      <Pressable onPress={() => onChoose(food)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: active ? colors.green : colors.ink, alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
        <Ionicons name={active ? 'checkmark' : 'add'} size={18} color={colors.white} />
      </Pressable>
    </View>
  );
});

const SearchHeader = memo(function SearchHeader({
  placeholder,
  onText,
}: {
  placeholder: string;
  onText: (value: string) => void;
}) {
  // Keep the native input uncontrolled so parent setFoods/query re-renders
  // never send a delayed JS `value` back into the field. That feedback can
  // make Android replay/duplicate a key during fast typing.
  return (
    <TextInput
      defaultValue=""
      onChangeText={(v) => {
        // Apply the latest value immediately. The parent debounces the
        // database search, while this memoized input remains untouched.
        onText(v);
      }}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      style={styles.input}
      autoCorrect={false}
      autoCapitalize="none"
      autoComplete="off"
      inputMode="search"
      returnKeyType="search"
      blurOnSubmit={false}
    />
  );
});

export default function AddFood() {
  const db = useSQLiteContext();
  const { t, locale } = useApp();
  const { addXp } = useGamification();
  const params = useLocalSearchParams<{ date?: string; meal?: MealType }>();
  const date = String(params.date ?? new Date().toISOString().slice(0, 10));
  const meal = (params.meal ?? 'snack') as MealType;
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [recents, setRecents] = useState<Food[]>([]);
  const [favorites, setFavorites] = useState<Food[]>([]);
  const [tab, setTab] = useState<'all' | 'recents' | 'favorites'>('all');
  const [selected, setSelected] = useState<Food | null>(null);
  const [portion, setPortion] = useState('100');
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [logging, setLogging] = useState(false);
  // The memoized native input owns the keystrokes; query updates immediately,
  // while the effect below debounces only the database work.
  const pendingText = useRef('');
  const searchRequest = useRef(0);

  const localSearch = useCallback(async (value: string) => {
    const request = ++searchRequest.current;
    try {
      const candidates = await db.getAllAsync<Food>(
        // Do not cap before filtering: a valid Greek/English match may be
        // beyond the first 200 rows when custom or online foods are present.
        'SELECT * FROM foods ORDER BY is_favorite DESC, name_en COLLATE NOCASE',
      );
      if (request !== searchRequest.current) return; // stale guard
      setFoods(filterFoods(candidates, normalizeEl(value), 30));
    } catch (e) {
      if (request !== searchRequest.current) return;
      console.error('Failed to search foods', e);
    }
  }, [db]);

  const handleAppliedQuery = useCallback((value: string) => {
    pendingText.current = value;
    setQuery(value);
  }, []);

  // Applied-query search; stale responses are dropped by request id.
  useEffect(() => {
    const timer = setTimeout(() => { localSearch(query); }, query ? 120 : 0);
    return () => clearTimeout(timer);
  }, [localSearch, query]);

  const loadHelpers = useCallback(async () => {
    try {
      const recentIds = await db.getAllAsync<{ food_id: string }>('SELECT DISTINCT food_id FROM diary_entries ORDER BY id DESC LIMIT 12');
      if (recentIds.length) {
        const placeholders = recentIds.map(() => '?').join(',');
        const rows = await db.getAllAsync<Food>(`SELECT * FROM foods WHERE id IN (${placeholders})`, ...recentIds.map((r) => r.food_id));
        const order = new Map(recentIds.map((r, i) => [r.food_id, i]));
        setRecents(rows.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)));
      } else setRecents([]);
      setFavorites(await db.getAllAsync<Food>('SELECT * FROM foods WHERE is_favorite=1 ORDER BY name_en LIMIT 20'));
    } catch (e) {
      console.error('Failed to load recents', e);
    }
  }, [db]);
  useEffect(() => { loadHelpers(); }, [loadHelpers]);

  const choose = useCallback((food: Food) => { setSelected(food); setPortion(String(food.serving_grams ?? 100)); }, []);
  const toggleFav = useCallback(async (food: Food) => {
    const next = food.is_favorite ? 0 : 1;
    try {
      await db.runAsync('UPDATE foods SET is_favorite=? WHERE id=?', next, food.id);
      setFoods((list) => list.map((f) => (f.id === food.id ? { ...f, is_favorite: next } : f)));
      loadHelpers();
      setSelected((current) => (current?.id === food.id ? { ...food, is_favorite: next } : current));
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  }, [db, loadHelpers]);
  const logSelected = async () => {
    if (!selected || logging) return;
    setLogging(true);
    try {
      const grams = Math.max(1, parseNumber(portion, 100));
      const values = scaleFood(selected, grams);
      const foodName = (locale === 'el' ? selected.name_el : selected.name_en) || selected.name_en || selected.name_el || t('unknown');
      await db.runAsync('INSERT INTO diary_entries (date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?)', date, meal, selected.id, foodName, grams, values.calories, values.protein, values.carbs, values.fat, selected.source ?? 'Custom');
      addXp('log-food');
      // Keep this picker scoped to the same date/meal so another item can be
      // added immediately. The search text/results stay intact; only the
      // selected-food editor is cleared for the next item.
      setSelected(null);
      setPortion('100');
      await loadHelpers();
    } catch (e) {
      console.error('Failed to log food', e);
      Alert.alert(t('logFood'), String(e instanceof Error ? e.message : e));
    } finally {
      setLogging(false);
    }
  };
  const searchOnline = async () => { const live = (pendingText.current || query).trim(); if (!live) return; setOnlineLoading(true); try { const result = await searchFoodsOnline(live, locale); setFoods(result); } catch { Alert.alert(t('searchOnline'), t('onlineAttribution')); } finally { setOnlineLoading(false); } };
  const scan = async () => { if (!permission?.granted) { const result = await requestPermission(); if (!result.granted) { Alert.alert(t('scanBarcode'), t('cameraPermission')); return; } } setScanning(true); };
  const onBarcode = async ({ data }: { data: string }) => { setScanning(false); try { const found = await lookupBarcode(data, locale); if (!found) Alert.alert(t('scanBarcode'), t('barcodeNotFound')); else { await db.runAsync('INSERT OR REPLACE INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source) VALUES (?,?,?,?,?,?,?,?,?,?,?)', found.id, found.name_en, found.name_el, found.brand ?? null, found.barcode ?? data, found.calories_per_100g, found.protein_per_100g, found.carbs_per_100g, found.fat_per_100g, found.serving_grams ?? null, found.source); choose(found); } } catch { Alert.alert(t('scanBarcode'), t('barcodeNotFound')); } };
  const saveCustom = async () => { if (!custom.name.trim()) return; const id = `custom-${Date.now()}`; const food: Food = { id, name_en: custom.name, name_el: custom.name, calories_per_100g: parseNumber(custom.calories), protein_per_100g: parseNumber(custom.protein), carbs_per_100g: parseNumber(custom.carbs), fat_per_100g: parseNumber(custom.fat), serving_grams: 100, source: 'Custom' }; await db.runAsync('INSERT INTO foods (id,name_en,name_el,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source) VALUES (?,?,?,?,?,?,?,?,?)', food.id, food.name_en, food.name_el, food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g, 100, food.source); choose(food); setCustomOpen(false); };

  const visibleFoods = useMemo(
    () => (tab === 'recents' ? recents : tab === 'favorites' ? favorites : foods),
    [tab, recents, favorites, foods],
  );
  const previewKcal = selected ? scaleFood(selected, Math.max(1, parseNumber(portion, 100))).calories : 0;
  const selectedId = selected?.id;
  const listRef = useRef<FlatList<Food>>(null);

  // When a food is chosen, bring the in-flow editor into view with one
  // smooth scroll instead of jumping content height with a fixed footer.
  useEffect(() => {
    if (selectedId) {
      const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(t);
    }
  }, [selectedId]);

  const renderItem = useCallback(({ item }: { item: Food }) => {
    const name = (locale === 'el' ? item.name_el : item.name_en) || item.name_en;
    return <FoodRow food={item} name={name} active={selectedId === item.id} onChoose={choose} onToggleFav={toggleFav} />;
  }, [locale, selectedId, choose, toggleFav]);

  return (
    <>
      <Stack.Screen options={{ title: t('addFood'), presentation: 'modal', headerShown: true, headerTintColor: colors.green, headerStyle: { backgroundColor: colors.bg } }} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scanning ? (
          <View style={[styles.content, { flexGrow: 1 }]}>
            <View style={{ height: 430, borderRadius: 20, overflow: 'hidden', backgroundColor: '#111' }}>
              <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={onBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }} />
              <Pressable onPress={() => setScanning(false)} style={{ position: 'absolute', top: 18, right: 18, backgroundColor: colors.white, borderRadius: 20, padding: 10 }}>
                <Ionicons name="close" size={22} color={colors.ink} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={[styles.content, { paddingBottom: 8 }]}>
              <SearchHeader placeholder={t('searchFoods')} onText={handleAppliedQuery} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable onPress={searchOnline} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}>{onlineLoading ? <Text style={styles.outlineText}>…</Text> : (<><Ionicons name="globe-outline" size={18} color={colors.green} /><Text style={styles.outlineText}>{t('searchOnline')}</Text></>)}</Pressable>
                <Pressable onPress={scan} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}><Ionicons name="barcode-outline" size={19} color={colors.green} /><Text style={styles.outlineText}>{t('scanBarcode')}</Text></Pressable>
              </View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>{t('onlineAttribution')}</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                {(['all', 'recents', 'favorites'] as const).map((key) => (
                  <Pressable key={key} onPress={() => setTab(key)} style={[styles.chip, tab === key && styles.chipActive, { flex: 1 }]}>
                    <Text style={[styles.chipText, tab === key && styles.chipTextActive]}>{key === 'all' ? `🍽️ ${t('allFoods')}` : key === 'recents' ? `🕘 ${t('recents')}` : `⭐ ${t('favorites')}`}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => setCustomOpen((value) => !value)} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={customOpen ? 'chevron-up' : 'add'} size={18} color={colors.green} />
                <Text style={{ color: colors.green, fontWeight: '800' }}>{t('manualFood')}</Text>
              </Pressable>
              {customOpen && (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>{t('manualFood')}</Text>
                  {[['name', t('recipeName')], ['calories', `${t('calories')} / 100g`], ['protein', `${t('protein')} / 100g`], ['carbs', `${t('carbs')} / 100g`], ['fat', `${t('fat')} / 100g`]].map(([key, label]) => (
                    <TextInput key={key} value={custom[key as keyof typeof custom]} onChangeText={(value) => setCustom((current) => ({ ...current, [key]: value }))} placeholder={label} placeholderTextColor={colors.muted} keyboardType={key === 'name' ? 'default' : 'decimal-pad'} style={[styles.input, { marginBottom: 8 }]} />
                  ))}
                  <Pressable onPress={saveCustom} style={[styles.button, { flexDirection: 'row', gap: 6 }]}><Ionicons name="checkmark" size={18} color={colors.white} /><Text style={styles.buttonText}>{t('save')}</Text></Pressable>
                </View>
              )}
            </View>
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={visibleFoods}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={[styles.cardFlat, { alignItems: 'center', marginHorizontal: 20 }]}>
                <Text style={{ fontSize: 34 }}>{tab === 'favorites' ? '⭐' : '🔍'}</Text>
                <Text style={{ color: colors.muted, marginTop: 8 }}>{t('noEntries')}</Text>
              </View>
            }
            contentContainerStyle={[styles.content, { flexGrow: 1, paddingTop: 4 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            removeClippedSubviews={false}
            maxToRenderPerBatch={10}
            windowSize={7}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            ListFooterComponent={
              selected ? (
                <View style={[styles.card, { marginTop: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 24 }}>{foodEmoji(locale === 'el' ? selected.name_el : selected.name_en, selected.brand)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sectionTitle, { marginBottom: 0 }]} numberOfLines={1}>{locale === 'el' ? selected.name_el : selected.name_en}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 }}>≈ {Math.round(previewKcal)} kcal · {t('portion')}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    {PORTION_CHIPS.map((g) => (
                      <Pressable key={g} onPress={() => setPortion(String(g))} style={[styles.chip, portion === String(g) && styles.chipActive, { flex: 1 }]}>
                        <Text style={[styles.chipText, portion === String(g) && styles.chipTextActive]}>{g}g</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput style={[styles.input, { marginTop: 10 }]} value={portion} onChangeText={setPortion} keyboardType="decimal-pad" placeholder={`${t('grams')}`} placeholderTextColor={colors.muted} />
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable onPress={() => setSelected(null)} style={[styles.outlineButton, { flex: 1, flexDirection: 'row', gap: 6 }]}><Ionicons name="close-outline" size={17} color={colors.green} /><Text style={styles.outlineText}>{t('cancel')}</Text></Pressable>
                    <Pressable onPress={logSelected} disabled={logging} style={[styles.button, { flex: 2, opacity: logging ? 0.6 : 1, borderRadius: radius.lg, flexDirection: 'row', gap: 6 }]}>{logging ? <Text style={styles.buttonText}>…</Text> : (<><Ionicons name="book-outline" size={17} color={colors.white} /><Text style={styles.buttonText}>{`${t('logFood')} · ${Math.round(previewKcal)} kcal`}</Text></>)}</Pressable>
                  </View>
                </View>
              ) : <View style={{ height: 8 }} />
            }
          />
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
