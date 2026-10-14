import { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/src/context/AppContext';
import { useGamification } from '@/src/context/GamificationContext';
import * as Haptics from 'expo-haptics';
import { dateKey, dateLabel } from '@/src/lib/db';
import { GroceryItem, GroceryCategory, GroceryPriceOption, Locale, Recipe, RecipeIngredient } from '@/src/types';
import { gradients, radius, useAppTheme } from '@/src/theme';
import { EmptyState } from '@/src/components/EmptyState';
import { GradientHero } from '@/src/ui/GradientHero';
import { PressScale } from '@/src/ui/PressScale';
import {
  CATEGORY_EMOJI,
  GROCERY_CATEGORIES,
  LinkedRecipe,
  categorizeIngredient,
  formatPrice,
  getPriceOptions,
  groceryShareText,
  groceryTotals,
  groupGroceries,
  normalizeGroceryRow,
  parsePriceInput,
  upsertPriceOption,
} from '@/src/lib/groceries';
import { findFoodsForIngredient, getFoodPriceMap } from '@/src/lib/foodPrices';
import { getRecipePriceMap, latestRecipePrice } from '@/src/lib/recipePrices';
import { PriceSheet, SheetOption } from '@/src/components/PriceSheet';
import { DetailSheet, type DetailTarget } from '@/src/components/DetailSheet';

type RecipeRow = Omit<Recipe, 'ingredients'> & { ingredients: string };
type PlanRow = RecipeRow & { date: string; portion: number; meal_type: string; recipe_id: string | null };

const fmtAmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export default function Groceries() {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const { colors, styles } = useAppTheme();
  const { celebrate } = useGamification();
  const [start, setStart] = useState(dateKey());
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [linked, setLinked] = useState<Record<string, LinkedRecipe[]>>({});
  const [query, setQuery] = useState('');
  const [hideChecked, setHideChecked] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Add / edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fName, setFName] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fUnit, setFUnit] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fCategory, setFCategory] = useState<GroceryCategory>('other');

  // Price sheet (store prices) state — data lives in the shared sheet.
  const [sheetItem, setSheetItem] = useState<GroceryItem | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);

  const endDate = useMemo(() => {
    const value = new Date(`${start}T12:00:00`);
    value.setDate(value.getDate() + 6);
    return value.toISOString().slice(0, 10);
  }, [start]);

  const load = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<any>(
        'SELECT id,ingredient,amount,unit,checked,price,price_store,category,source FROM groceries WHERE date=? ORDER BY ingredient COLLATE NOCASE',
        start,
      );
      setItems(rows.map(normalizeGroceryRow));
    } catch (e) {
      console.error('Failed to load groceries', e);
      // Fallback for DBs created before the grocery revamp migration.
      try {
        const rows = await db.getAllAsync<any>(
          'SELECT id,ingredient,amount,unit,checked FROM groceries WHERE date=? ORDER BY ingredient COLLATE NOCASE',
          start,
        );
        setItems(rows.map(normalizeGroceryRow));
      } catch {
        setItems([]);
      }
    }
    // Recompute recipe provenance from the week's plan (not persisted).
    try {
      const plans = await db.getAllAsync<PlanRow>(
        'SELECT p.date,p.portion,p.meal_type,p.recipe_id,r.* FROM plans p JOIN recipes r ON r.id=p.recipe_id WHERE p.date BETWEEN ? AND ?',
        start,
        endDate,
      );
      const map: Record<string, LinkedRecipe[]> = {};
      plans.forEach((row) => {
        if (!row.recipe_id) return;
        let ingredients: RecipeIngredient[] = [];
        try {
          ingredients = JSON.parse(row.ingredients) as RecipeIngredient[];
        } catch {
          return;
        }
        const scale = Number(row.portion) / Math.max(1, Number(row.servings));
        const recipeName = locale === 'el' ? row.name_el : row.name_en;
        ingredients.forEach((ingredient) => {
          const name = locale === 'el' ? ingredient.name_el : ingredient.name_en;
          const key = `${name.toLowerCase()}|${ingredient.unit}`;
          const list = map[key] ?? [];
          list.push({
            name: recipeName,
            date: row.date,
            mealType: row.meal_type,
            qty: ingredient.amount * scale,
            unit: ingredient.unit,
            recipeId: String(row.recipe_id ?? ''),
          });
          map[key] = list;
        });
      });
      setLinked(map);
    } catch {
      setLinked({});
    }
  }, [db, start, endDate, locale]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shift = (amount: number) => {
    const value = new Date(`${start}T12:00:00`);
    value.setDate(value.getDate() + amount);
    setStart(value.toISOString().slice(0, 10));
  };
  const snapToWeek = () => {
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    setStart(monday.toISOString().slice(0, 10));
  };

  const build = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const rows = await db.getAllAsync<PlanRow>(
        'SELECT p.date,p.portion,p.recipe_id,r.* FROM plans p JOIN recipes r ON r.id=p.recipe_id WHERE p.date BETWEEN ? AND ?',
        start,
        endDate,
      );
      const grouped = new Map<string, { amount: number; unit: string; name: string; recipeIds: string[] }>();
      rows.forEach((row) => {
        if (!row.recipe_id) return;
        let ingredients: RecipeIngredient[] = [];
        try {
          ingredients = JSON.parse(row.ingredients) as RecipeIngredient[];
        } catch {
          return;
        }
        const recipeScale = Number(row.portion) / Math.max(1, Number(row.servings));
        ingredients.forEach((ingredient) => {
          const name = locale === 'el' ? ingredient.name_el : ingredient.name_en;
          const key = `${name.toLowerCase()}|${ingredient.unit}`;
          const current = grouped.get(key) ?? { amount: 0, unit: ingredient.unit, name, recipeIds: [] as string[] };
          current.amount += ingredient.amount * recipeScale;
          if (row.recipe_id && !current.recipeIds.includes(row.recipe_id)) current.recipeIds.push(row.recipe_id);
          grouped.set(key, current);
        });
      });
      const previous = await db.getAllAsync<any>(
        'SELECT ingredient,unit,checked,price,price_store,category FROM groceries WHERE date=?',
        start,
      );
      if (grouped.size === 0) {
        Alert.alert(t('groceryList'), t('noPlanForGroceries'));
        return;
      }
      const prevMap = new Map(
        previous.map((row) => [
          `${String(row.ingredient).toLowerCase()}|${String(row.unit)}`,
          {
            checked: Number(row.checked) || 0,
            price: Number(row.price) || 0,
            priceStore: String(row.price_store ?? ''),
            category: String(row.category ?? ''),
          },
        ]),
      );
      // Manual items + prices survive regeneration.
      await db.runAsync("DELETE FROM groceries WHERE date=? AND (source IS NULL OR source='auto')", start);
      for (const item of grouped.values()) {
        const key = `${item.name.toLowerCase()}|${item.unit}`;
        const prev = prevMap.get(key);
        const category = prev?.category
          ? (prev.category as GroceryCategory)
          : categorizeIngredient(item.name);
        let price = prev?.price ?? 0;
        let priceStore = prev?.priceStore ?? '';
        // No preserved price: preselect most recently used store price —
        // row-local memory first, then contributing recipes' store prices,
        // then catalog prices of matching foods.
        if (!price) {
          const remembered = await getPriceOptions(db, item.name, item.unit);
          if (remembered.length > 0) {
            price = remembered[0].price;
            priceStore = remembered[0].store;
          } else {
            try {
              const recipeMap = await getRecipePriceMap(db, item.recipeIds);
              const latest = latestRecipePrice(item.recipeIds.flatMap((id) => recipeMap[id] ?? []));
              if (latest) {
                price = latest.price;
                priceStore = latest.store;
              }
            } catch {
              // recipe preselect is best-effort
            }
          }
          if (!price) {
            try {
              const foods = await findFoodsForIngredient(db, item.name);
              if (foods.length > 0) {
                const catalog = await getFoodPriceMap(db, foods.map((f) => f.id));
                let best: { price: number; store: string; updatedAt: string } | null = null;
                for (const f of foods) {
                  for (const o of catalog[f.id] ?? []) {
                    if (!best || o.updatedAt > best.updatedAt) {
                      best = { price: o.price, store: o.store, updatedAt: o.updatedAt };
                    }
                  }
                }
                if (best) {
                  price = best.price;
                  priceStore = best.store;
                }
              }
            } catch {
              // catalog preselect is best-effort
            }
          }
        }
        await db.runAsync(
          'INSERT INTO groceries (date,ingredient,amount,unit,checked,price,price_store,category,source) VALUES (?,?,?,?,?,?,?,?,?) ' +
            'ON CONFLICT(date,ingredient,unit) DO UPDATE SET amount=excluded.amount',
          start,
          item.name,
          Number(item.amount.toFixed(1)),
          item.unit,
          prev?.checked ?? 0,
          price,
          priceStore,
          category,
          'auto',
        );
      }
      await load();
    } catch (e) {
      console.error('Failed to build groceries', e);
      Alert.alert(t('groceryList'), t('buildFailed'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: GroceryItem) => {
    setItems((cur) => cur.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)));
    await db.runAsync('UPDATE groceries SET checked=? WHERE id=?', item.checked ? 0 : 1, item.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nextChecked = items.filter((i) => (i.id === item.id ? !i.checked : i.checked)).length;
    if (items.length > 0 && nextChecked === items.length) {
      celebrate(locale === 'el' ? 'Όλα τα ψώνια!' : 'Groceries done!', '🧺');
    }
    load();
  };

  const setCategoryChecked = async (cat: GroceryCategory, check: boolean) => {
    const ids = items.filter((i) => i.category === cat && Boolean(i.checked) !== check).map((i) => i.id);
    if (!ids.length) return;
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(`UPDATE groceries SET checked=? WHERE id IN (${placeholders})`, check ? 1 : 0, ...ids);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    load();
  };

  const clearChecked = () => {
    Alert.alert(t('clearCheckedTitle'), t('clearCheckedConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM groceries WHERE date=? AND checked=1', start);
          load();
        },
      },
    ]);
  };

  const uncheckAll = async () => {
    await db.runAsync('UPDATE groceries SET checked=0 WHERE date=?', start);
    load();
  };

  const openAdd = () => {
    setEditingId(null);
    setFName('');
    setFAmount('1');
    setFUnit('');
    setFPrice('');
    setFCategory('other');
    setModalOpen(true);
  };

  const openEdit = (item: GroceryItem) => {
    setEditingId(item.id);
    setFName(item.ingredient);
    setFAmount(fmtAmt(item.amount));
    setFUnit(item.unit);
    setFPrice(item.price > 0 ? String(item.price) : '');
    setFCategory(item.category);
    setModalOpen(true);
  };

  const saveModal = async () => {
    const name = fName.trim();
    if (!name) return;
    const amount = Math.max(0, Number(String(fAmount).replace(',', '.')) || 0) || 1;
    const unit = fUnit.trim() || t('unitPiece');
    const price = parsePriceInput(fPrice);
    if (editingId == null) {
      // New item without a price: preselect the most recently used store price.
      let finalPrice = price;
      let finalStore = '';
      if (finalPrice === 0) {
        try {
          const remembered = await getPriceOptions(db, name, unit);
          if (remembered.length > 0) {
            finalPrice = remembered[0].price;
            finalStore = remembered[0].store;
          }
        } catch {
          // memory lookup is best-effort
        }
      }
      const existing = await db.getFirstAsync<any>(
        'SELECT id,amount,price FROM groceries WHERE date=? AND ingredient=? AND unit=?',
        start,
        name,
        unit,
      );
      if (existing) {
        await db.runAsync('UPDATE groceries SET amount=?,price=?,price_store=?,category=?,source=? WHERE id=?', amount, finalPrice || price, finalStore, fCategory, 'manual', existing.id);
      } else {
        await db.runAsync(
          'INSERT INTO groceries (date,ingredient,amount,unit,checked,price,price_store,category,source) VALUES (?,?,?,?,0,?,?,?,?)',
          start,
          name,
          Math.round(amount * 10) / 10,
          unit,
          finalPrice,
          finalStore,
          fCategory,
          'manual',
        );
      }
    } else {
      await db.runAsync('UPDATE groceries SET ingredient=?,amount=?,unit=?,price=?,category=? WHERE id=?', name, Math.round(amount * 10) / 10, unit, price, fCategory, editingId);
    }
    setModalOpen(false);
    load();
  };

  const askDelete = (item: GroceryItem) => {
    Alert.alert(t('deleteItemTitle'), `${item.ingredient}\n${t('deleteItemConfirm')}`, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await db.runAsync('DELETE FROM groceries WHERE id=?', item.id);
          load();
        },
      },
    ]);
  };

  const share = async () => {
    const range = `${dateLabel(start, locale)} – ${dateLabel(endDate, locale)}`;
    const message = groceryShareText(filtered, range, t('totalCost'));
    try {
      await Share.share({ message });
    } catch {
      // user dismissed — no-op
    }
  };

  // --- Store price sheet (shared component does data + memory) -----------
  const selectSheetOption = async (opt: SheetOption) => {
    if (!sheetItem) return;
    // Row takes the price; memory already holds it (catalog or list).
    // Re-upsert list-origin picks so recency ordering stays meaningful.
    if (opt.origin === 'list') {
      await upsertPriceOption(db, sheetItem.ingredient, sheetItem.unit, opt.store, opt.price);
    }
    await db.runAsync('UPDATE groceries SET price=?,price_store=? WHERE id=?', opt.price, opt.store, sheetItem.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSheetItem((cur) => (cur && cur.id === sheetItem.id ? { ...cur, price: opt.price, priceStore: opt.store } : cur));
    load();
  };

  const handleSheetOptionDeleted = async (opt: SheetOption) => {
    // Dropped the row's active store: keep the number, clear the label.
    if (sheetItem && sheetItem.priceStore === opt.store) {
      await db.runAsync('UPDATE groceries SET price_store=? WHERE id=?', '', sheetItem.id);
      setSheetItem((cur) => (cur && cur.id === sheetItem.id ? { ...cur, priceStore: '' } : cur));
      load();
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = items;
    if (q) list = list.filter((i) => i.ingredient.toLowerCase().includes(q));
    if (hideChecked) list = list.filter((i) => !i.checked);
    return list;
  }, [items, q, hideChecked]);

  const groups = useMemo(() => groupGroceries(filtered), [filtered]);
  const totals = groceryTotals(items);
  const pct = items.length ? totals.checkedCount / items.length : 0;
  const linkKey = (item: GroceryItem) => `${item.ingredient.toLowerCase()}|${item.unit}`;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={styles.title}>{t('groceries')} 🧺</Text>
      <Text style={styles.subtitle}>{dateLabel(start, locale)} – {dateLabel(endDate, locale)}</Text>

      <GradientHero colors={gradients.heroDark}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '800', fontSize: 12 }}>
          🧺 {t('groceryList').toUpperCase()}
        </Text>
        <Text style={{ color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 6 }}>
          {totals.checkedCount}
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}> / {totals.count} {t('done')}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}> · {Math.round(pct * 100)}%</Text>
        </Text>
        <View style={{ height: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.22)', marginTop: 10, overflow: 'hidden' }}>
          <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: pct === 1 ? colors.neonLime : colors.lemon, borderRadius: 10 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{t('totalCost')}</Text>
            <Text style={{ fontWeight: '900', color: colors.white, marginTop: 2 }}>{formatPrice(totals.total, locale as Locale)}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.75)' }}>{t('remainingCost')}</Text>
            <Text style={{ fontWeight: '900', color: colors.white, marginTop: 2 }}>{formatPrice(totals.remaining, locale as Locale)}</Text>
          </View>
        </View>
        {pct === 1 && items.length > 0 && (
          <Text style={{ marginTop: 10, fontWeight: '800', color: colors.neonLime }}>🎉 {t('allDone')}</Text>
        )}
      </GradientHero>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <Pressable onPress={() => shift(-7)} accessibilityLabel="−7" style={[styles.outlineButton, { flexDirection: 'row', gap: 4 }]}>
          <Ionicons name="chevron-back" size={17} color={colors.green} />
          <Text style={styles.outlineText}>7</Text>
        </Pressable>
        <PressScale onPress={build} haptic style={[styles.button, { flex: 1, marginHorizontal: 10, flexDirection: 'row', gap: 8, opacity: saving ? 0.6 : 1 }]}>
          <Ionicons name="refresh" color={colors.lemon} size={20} />
          <Text style={styles.buttonText}>{t('generatePlan')}</Text>
        </PressScale>
        <Pressable onPress={() => shift(7)} accessibilityLabel="+7" style={[styles.outlineButton, { flexDirection: 'row', gap: 4 }]}>
          <Text style={styles.outlineText}>7</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.green} />
        </Pressable>
      </View>
      <Pressable onPress={snapToWeek} style={[styles.chip, { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', gap: 6 }]}>
        <Ionicons name="calendar-outline" size={15} color={colors.ink} />
        <Text style={styles.chipText}>{t('thisWeek')}</Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46 }]}>
          <Ionicons name="search" size={17} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchGroceries')}
            placeholderTextColor={colors.muted}
            style={{ flex: 1, color: colors.ink, fontSize: 15 }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={openAdd} accessibilityLabel={t('addItem')} style={[styles.button, { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', gap: 6 }]}>
          <Ionicons name="add" size={20} color={colors.onGreen} />
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <Pressable onPress={() => setHideChecked((v) => !v)} style={[styles.chip, hideChecked && styles.chipActive, { flexDirection: 'row', gap: 6 }]}>
          <Ionicons name={hideChecked ? 'eye-off-outline' : 'eye-outline'} size={15} color={hideChecked ? colors.onInk : colors.ink} />
          <Text style={[styles.chipText, hideChecked && styles.chipTextActive]}>{hideChecked ? t('showChecked') : t('hideChecked')}</Text>
        </Pressable>
        <Pressable onPress={uncheckAll} style={[styles.chip, { flexDirection: 'row', gap: 6 }]}>
          <Ionicons name="arrow-undo-outline" size={15} color={colors.ink} />
          <Text style={styles.chipText}>{t('uncheckAll')}</Text>
        </Pressable>
        <Pressable onPress={share} style={[styles.chip, { flexDirection: 'row', gap: 6 }]}>
          <Ionicons name="share-social-outline" size={15} color={colors.ink} />
          <Text style={styles.chipText}>{t('shareList')}</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={styles.card}>
          <EmptyState emoji="🧺" title={t('groceryList')} body={`${t('groceryHint')} ${t('regensKeepManual')}`} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.card}>
          <EmptyState emoji="🔍" title={t('noGroceryResults')} />
        </View>
      ) : (
        groups.map((group) => {
          const done = group.items.filter((i) => i.checked).length;
          const isCollapsed = collapsed[group.category] ?? false;
          return (
            <View key={group.category} style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable onPress={() => setCollapsed((c) => ({ ...c, [group.category]: !isCollapsed }))} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[group.category]}</Text>
                  <Text style={{ color: colors.ink, fontWeight: '900', fontSize: 16, textTransform: 'capitalize' }}>{group.category}</Text>
                  <View style={[styles.badge, { backgroundColor: done === group.items.length && group.items.length > 0 ? colors.greenSoft : colors.bg }]}>
                    <Text style={[styles.badgeText, { color: done === group.items.length && group.items.length > 0 ? colors.greenDeep : colors.muted }]}>
                      {done}/{group.items.length}
                    </Text>
                  </View>
                  <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={17} color={colors.muted} />
                </Pressable>
                <Pressable
                  onPress={() => setCategoryChecked(group.category, done !== group.items.length)}
                  accessibilityLabel={t('checkCategory')}
                  style={[styles.chip, { paddingHorizontal: 10, paddingVertical: 6 }]}
                >
                  <Text style={[styles.chipText, { fontSize: 12 }]}>
                    {done === group.items.length ? '✓' : t('checkCategory')}
                  </Text>
                </Pressable>
              </View>
              {!isCollapsed && group.items.map((item) => {
                const recipes = linked[linkKey(item)] ?? [];
                const expanded = expandedId === item.id;
                return (
                  <View key={item.id} style={[styles.cardFlat, { marginTop: 8, paddingVertical: 12, backgroundColor: item.checked ? colors.mint : colors.surface }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable onPress={() => toggle(item)} hitSlop={6} accessibilityLabel={item.ingredient}>
                        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: item.checked ? colors.green : colors.surface, borderWidth: 2, borderColor: item.checked ? colors.green : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                          {item.checked ? <Ionicons name="checkmark" size={18} color={colors.onGreen} /> : null}
                        </View>
                      </Pressable>
                      <Pressable onPress={() => toggle(item)} style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: item.checked ? colors.muted : colors.ink, fontWeight: '800', textDecorationLine: item.checked ? 'line-through' : 'none', flexShrink: 1 }}>
                            {item.ingredient}
                          </Text>
                          {item.source === 'manual' && (
                            <View style={[styles.badge, { backgroundColor: colors.grapeSoft, paddingHorizontal: 7, paddingVertical: 2 }]}>
                              <Text style={[styles.badgeText, { color: colors.grape, fontSize: 10 }]}>{t('manualBadge')}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
                          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                            <Text style={[styles.badgeText, { color: colors.muted }]}>{fmtAmt(item.amount)} {item.unit}</Text>
                          </View>
                          {item.price > 0 ? (
                            <Pressable onPress={() => setSheetItem(item)} hitSlop={8} style={[styles.badge, { backgroundColor: colors.lemonSoft }]}>
                              <Text style={[styles.badgeText, { color: colors.ink }]}>
                                {formatPrice(item.price, locale as Locale)}{item.priceStore ? ` · ${item.priceStore}` : ''}
                              </Text>
                            </Pressable>
                          ) : (
                            <Pressable onPress={() => setSheetItem(item)} hitSlop={8}>
                              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>+ €</Text>
                            </Pressable>
                          )}
                        </View>
                      </Pressable>
                      {recipes.length > 0 && (
                        <Pressable onPress={() => setExpandedId(expanded ? null : item.id)} hitSlop={8} style={{ padding: 6 }} accessibilityLabel={`${item.ingredient} details`} accessibilityRole="button">
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={colors.muted} />
                        </Pressable>
                      )}
                      <Pressable onPress={() => openEdit(item)} hitSlop={8} style={{ padding: 6 }} accessibilityLabel={`${item.ingredient} edit`} accessibilityRole="button">
                        <Ionicons name="pencil-outline" size={17} color={colors.muted} />
                      </Pressable>
                    </View>
                    {expanded && recipes.length > 0 && (
                      <View style={{ marginTop: 10, marginLeft: 46, backgroundColor: colors.bg, borderRadius: radius.md, padding: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: colors.muted }}>{t('usedIn').toUpperCase()}</Text>
                        {recipes.map((r, idx) => (
                          <Pressable key={idx} onPress={() => r.recipeId && setDetail({ kind: 'recipe', recipeId: r.recipeId, portion: 1 })} style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ flex: 1, color: colors.ink, fontSize: 13, fontWeight: '700' }}>
                              • {r.name} <Text style={{ color: colors.muted }}>×{fmtAmt(r.qty)}{r.unit} · {dateLabel(r.date, locale)}</Text>
                            </Text>
                            <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })
      )}

      {items.length > 0 && (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', color: colors.ink }}>{t('totalCost')}</Text>
            <Text style={{ fontWeight: '900', color: colors.green, fontSize: 17 }}>{formatPrice(totals.total, locale as Locale)}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            {t('remainingCost')}: {formatPrice(totals.remaining, locale as Locale)}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{t('regensKeepManual')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Pressable onPress={share} style={[styles.chip, { flex: 1, flexDirection: 'row', gap: 6 }]}>
              <Ionicons name="share-social-outline" size={16} color={colors.ink} />
              <Text style={styles.chipText}>{t('shareList')}</Text>
            </Pressable>
            <Pressable onPress={clearChecked} style={[styles.chip, { flex: 1, flexDirection: 'row', gap: 6 }]}>
              <Ionicons name="trash-outline" size={16} color={colors.ink} />
              <Text style={styles.chipText}>{t('clearChecked')}</Text>
            </Pressable>
          </View>
        </View>
      )}
      <View style={{ height: 8 }} />

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(12,26,19,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>{editingId == null ? t('addItem') : t('editItem')}</Text>
              <Pressable onPress={() => setModalOpen(false)} hitSlop={10} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.label}>{t('itemName')}</Text>
            <TextInput value={fName} onChangeText={setFName} placeholder={t('itemName')} placeholderTextColor={colors.muted} style={styles.input} autoFocus={editingId == null} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('amountLabel')}</Text>
                <TextInput value={fAmount} onChangeText={setFAmount} keyboardType="decimal-pad" style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('unitLabel')}</Text>
                <TextInput value={fUnit} onChangeText={setFUnit} placeholder={t('unitPiece')} placeholderTextColor={colors.muted} style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('priceLabel')}</Text>
                <TextInput value={fPrice} onChangeText={setFPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={styles.input} />
              </View>
            </View>
            <Text style={styles.label}>{t('categoryLabel')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {GROCERY_CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setFCategory(c)} style={[styles.chip, fCategory === c && styles.chipActive, { flexDirection: 'row', gap: 4 }]}>
                  <Text style={{ fontSize: 13 }}>{CATEGORY_EMOJI[c]}</Text>
                  <Text style={[styles.chipText, fCategory === c && styles.chipTextActive, { textTransform: 'capitalize' }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <PressScale onPress={saveModal} haptic style={[styles.button, { marginTop: 16, flexDirection: 'row', gap: 8, opacity: fName.trim() ? 1 : 0.5 }]}>
              <Ionicons name="checkmark" size={20} color={colors.onGreen} />
              <Text style={styles.buttonText}>{t('save')}</Text>
            </PressScale>
            {editingId != null && (
              <Pressable
                onPress={() => {
                  const item = items.find((i) => i.id === editingId);
                  setModalOpen(false);
                  if (item) askDelete(item);
                }}
                style={{ marginTop: 10, alignItems: 'center', padding: 10 }}
              >
                <Text style={{ color: colors.red, fontWeight: '800' }}>{t('delete')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <DetailSheet visible={detail != null} target={detail} onClose={() => setDetail(null)} />
      <PriceSheet
        visible={sheetItem != null}
        target={sheetItem ? { kind: 'grocery', ingredient: sheetItem.ingredient, unit: sheetItem.unit } : null}
        title={sheetItem ? `${sheetItem.ingredient} · ${fmtAmt(sheetItem.amount)} ${sheetItem.unit}` : ''}
        activeStore={sheetItem?.priceStore}
        activePrice={sheetItem?.price}
        selectable
        onSelect={selectSheetOption}
        onChanged={load}
        onOptionDeleted={handleSheetOptionDeleted}
        onClose={() => setSheetItem(null)}
      />
    </ScrollView>
  );
}
