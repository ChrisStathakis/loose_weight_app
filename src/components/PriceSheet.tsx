import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { useApp } from '@/src/context/AppContext';
import { radius, useAppTheme } from '@/src/theme';
import { PressScale } from '@/src/ui/PressScale';
import {
  deletePriceOption,
  formatPrice,
  getPriceOptions,
  parsePriceInput,
  upsertPriceOption,
} from '@/src/lib/groceries';
import {
  deleteFoodPriceOption,
  findFoodsForIngredient,
  getFoodPriceMap,
  getFoodPriceOptions,
  upsertFoodPriceOption,
} from '@/src/lib/foodPrices';
import {
  deleteRecipePriceOption,
  getRecipePriceOptions,
  upsertRecipePriceOption,
} from '@/src/lib/recipePrices';
import type { Food, Locale } from '@/src/types';

export type PriceSheetTarget =
  | { kind: 'food'; foodId: string }
  | { kind: 'recipe'; recipeId: string }
  | { kind: 'grocery'; ingredient: string; unit: string };

export type SheetOption = {
  key: string;
  store: string;
  price: number;
  origin: 'catalog' | 'list' | 'recipe';
  foodId?: string;
  foodName?: string;
  refId: number;
};

type CatalogGroup = { food: Food; options: SheetOption[] };

/**
 * Shared store-price sheet. Food mode manages one food's catalog options.
 * Grocery mode merges the row-local options with catalog options of matching
 * foods (tagged), and reports taps so the parent can set the active price.
 */
export function PriceSheet({
  visible,
  target,
  title,
  subtitle,
  activeStore,
  activePrice,
  selectable,
  onSelect,
  onChanged,
  onOptionDeleted,
  onClose,
}: {
  visible: boolean;
  target: PriceSheetTarget | null;
  title: string;
  subtitle?: string;
  activeStore?: string;
  activePrice?: number;
  selectable: boolean;
  onSelect: (opt: SheetOption) => void;
  onChanged: () => void;
  onOptionDeleted?: (opt: SheetOption) => void;
  onClose: () => void;
}) {
  const db = useSQLiteContext();
  const { locale, t } = useApp();
  const { colors, styles } = useAppTheme();
  const [catalogGroups, setCatalogGroups] = useState<CatalogGroup[]>([]);
  const [listOptions, setListOptions] = useState<SheetOption[]>([]);
  const [matchedFoodName, setMatchedFoodName] = useState<string | null>(null);
  const [singleFoodId, setSingleFoodId] = useState<string | null>(null);
  const [newStore, setNewStore] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const targetKey = target
    ? target.kind === 'food'
      ? `food:${target.foodId}`
      : target.kind === 'recipe'
        ? `recipe:${target.recipeId}`
        : `grocery:${target.ingredient}|${target.unit}`
    : '';

  const reload = useCallback(async () => {
    if (!target) return;
    try {
      if (target.kind === 'food') {
        const opts = await getFoodPriceOptions(db, target.foodId);
        setCatalogGroups([]);
        setListOptions(
          opts.map((o) => ({ key: `f${o.id}`, store: o.store, price: o.price, origin: 'catalog' as const, refId: o.id })),
        );
        setMatchedFoodName(null);
        setSingleFoodId(target.foodId);
      } else if (target.kind === 'recipe') {
        const opts = await getRecipePriceOptions(db, target.recipeId);
        setCatalogGroups([]);
        setListOptions(
          opts.map((o) => ({ key: `r${o.id}`, store: o.store, price: o.price, origin: 'recipe' as const, refId: o.id })),
        );
        setMatchedFoodName(null);
        setSingleFoodId(null);
      } else {
        const local = await getPriceOptions(db, target.ingredient, target.unit);
        setListOptions(
          local.map((o) => ({ key: `l${o.id}`, store: o.store, price: o.price, origin: 'list' as const, refId: o.id })),
        );
        const foods = await findFoodsForIngredient(db, target.ingredient);
        const map = await getFoodPriceMap(
          db,
          foods.map((f) => f.id),
        );
        const foodName = (f: Food) => (locale === 'el' ? f.name_el : f.name_en) || f.name_en;
        setCatalogGroups(
          foods
            .filter((f) => (map[f.id] ?? []).length > 0)
            .map((f) => ({
              food: f,
              options: (map[f.id] ?? []).map((o) => ({
                key: `c${o.id}`,
                store: o.store,
                price: o.price,
                origin: 'catalog' as const,
                foodId: f.id,
                foodName: foodName(f),
                refId: o.id,
              })),
            })),
        );
        setMatchedFoodName(foods.length === 1 ? foodName(foods[0]) : null);
        setSingleFoodId(foods.length === 1 ? foods[0].id : null);
      }
    } catch {
      setCatalogGroups([]);
      setListOptions([]);
    }
  }, [db, targetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible && target) {
      setNewStore('');
      setNewPrice('');
      reload();
    }
  }, [visible, reload]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async () => {
    if (!target || !newStore.trim()) return;
    const price = parsePriceInput(newPrice);
    if (price <= 0) return;
    const store = newStore.trim();
    try {
    if (target.kind === 'food') {
      await upsertFoodPriceOption(db, target.foodId, store, price);
      onChanged();
      reload();
    } else if (target.kind === 'recipe') {
      await upsertRecipePriceOption(db, target.recipeId, store, price);
      onChanged();
      reload();
    } else if (singleFoodId) {
      await upsertFoodPriceOption(db, singleFoodId, store, price);
      onSelect({ key: `new`, store, price, origin: 'catalog', foodId: singleFoodId, refId: 0 });
      onChanged();
      reload();
    } else {
      await upsertPriceOption(db, target.ingredient, target.unit, store, price);
      onSelect({ key: `new`, store, price, origin: 'list', refId: 0 });
      onChanged();
      reload();
    }
    setNewStore('');
    setNewPrice('');
    } catch (e) {
      // Keep the typed store/price so the user can retry.
      console.error('Failed to save store price', e);
    }
  };

  const askDelete = (opt: SheetOption) => {
    Alert.alert(opt.store, t('deletePriceConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
          if (opt.origin === 'catalog') await deleteFoodPriceOption(db, opt.refId);
          else if (opt.origin === 'recipe') await deleteRecipePriceOption(db, opt.refId);
          else await deletePriceOption(db, opt.refId);
          onOptionDeleted?.(opt);
          onChanged();
          reload();
          } catch (e) {
            console.error('Failed to delete store price', e);
          }
        },
      },
    ]);
  };

  const renderOption = (opt: SheetOption) => {
    const isActive =
      selectable && activeStore === opt.store && (activePrice ?? 0) === opt.price;
    const row = (
      <View
        key={opt.key}
        style={{
          flexDirection: 'row', alignItems: 'center', marginTop: 8,
          backgroundColor: isActive ? colors.mint : colors.bg,
          borderRadius: radius.md, padding: 10,
          borderWidth: isActive ? 1.5 : 0, borderColor: colors.green,
        }}
      >
        <Pressable
          onPress={selectable ? () => onSelect(opt) : undefined}
          accessibilityLabel={selectable ? `${opt.store} ${opt.price}` : undefined}
          accessibilityRole={selectable ? 'button' : undefined}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {selectable && (
            <Ionicons
              name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={isActive ? colors.green : colors.muted}
            />
          )}
          <Text style={{ color: colors.ink, fontWeight: '800', flex: 1 }} numberOfLines={1}>
            {opt.store}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.badgeText, { color: colors.muted, fontSize: 10 }]}>
              {opt.origin === 'catalog' ? t('catalogPrice') : opt.origin === 'recipe' ? t('recipePrice') : t('listPrice')}
            </Text>
          </View>
          <Text style={{ color: colors.greenDeep, fontWeight: '900' }}>
            {formatPrice(opt.price, locale as Locale)}
          </Text>
        </Pressable>
        <Pressable onPress={() => askDelete(opt)} hitSlop={8} style={{ padding: 6 }} accessibilityLabel={`${opt.store} ${t('delete')}`} accessibilityRole="button">
          <Ionicons name="trash-outline" size={17} color={colors.muted} />
        </Pressable>
      </View>
    );
    return row;
  };

  const empty = catalogGroups.length === 0 && listOptions.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(12,26,19,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{t('priceSources')}</Text>
              <Text style={{ color: colors.muted, fontWeight: '700', marginTop: -6 }}>{title}</Text>
              {subtitle ? <Text style={{ color: colors.muted, fontSize: 12 }}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }} accessibilityLabel={t('close')} accessibilityRole="button">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>
          {empty ? (
            <Text style={{ color: colors.muted, marginTop: 10, fontWeight: '600' }}>{t('noStorePrices')}</Text>
          ) : (
            <>
              {selectable && (
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 10 }}>
                  {t('tapToSelectPrice')}
                </Text>
              )}
              {catalogGroups.length > 0 && (
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', marginTop: 10 }}>
                  {t('matchedFoods').toUpperCase()}
                </Text>
              )}
              {catalogGroups.map((g) => (
                <View key={g.food.id}>
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 8 }}>
                    {(locale === 'el' ? g.food.name_el : g.food.name_en) || g.food.name_en}
                  </Text>
                  {g.options.map(renderOption)}
                </View>
              ))}
              {listOptions.length > 0 && target?.kind === 'grocery' && catalogGroups.length > 0 && (
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '900', marginTop: 10 }}>
                  {t('listPrice').toUpperCase()}
                </Text>
              )}
              {listOptions.map(renderOption)}
            </>
          )}
          <Text style={styles.label}>{t('addStorePrice')}</Text>
          {target?.kind === 'grocery' && (
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 6 }}>
              {singleFoodId && matchedFoodName
                ? `→ ${matchedFoodName} (${t('catalogPrice')})`
                : `→ ${t('listPrice')}`}
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1.4 }}>
              <TextInput value={newStore} onChangeText={setNewStore} placeholder={t('storeName')} placeholderTextColor={colors.muted} style={styles.input} />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput value={newPrice} onChangeText={setNewPrice} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={styles.input} />
            </View>
            <PressScale onPress={add} haptic style={[styles.button, { minHeight: 50, paddingHorizontal: 16, opacity: newStore.trim() && parsePriceInput(newPrice) > 0 ? 1 : 0.5 }]}>
              <Ionicons name="add" size={22} color={colors.white} />
            </PressScale>
          </View>
          <View style={{ height: 6 }} />
        </View>
      </View>
    </Modal>
  );
}
