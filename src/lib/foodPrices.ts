import type { SQLiteDatabase } from 'expo-sqlite';
import type { Food, FoodPriceOption, Locale } from '@/src/types';
import { normalizeEl } from './search';
import { formatPrice } from './groceries';

export function normalizeFoodPriceOption(row: any): FoodPriceOption {
  return {
    id: Number(row.id),
    foodId: String(row.food_id ?? ''),
    store: String(row.store ?? ''),
    price: Number(row.price ?? 0) || 0,
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function getFoodPriceOptions(
  db: SQLiteDatabase,
  foodId: string,
): Promise<FoodPriceOption[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT id,food_id,store,price,updated_at FROM food_price_options WHERE food_id=? ORDER BY updated_at DESC',
    foodId,
  );
  return rows.map(normalizeFoodPriceOption);
}

/** Cheapest option first by price (for badges); null when none. */
export function cheapestFoodPrice(
  options: FoodPriceOption[],
): FoodPriceOption | null {
  if (!options.length) return null;
  return options.reduce((best, o) => (o.price < best.price ? o : best), options[0]);
}

export function formatCheapest(
  options: FoodPriceOption[],
  locale: Locale,
): string | null {
  const best = cheapestFoodPrice(options);
  return best ? `${formatPrice(best.price, locale)} · ${best.store}` : null;
}

export async function upsertFoodPriceOption(
  db: SQLiteDatabase,
  foodId: string,
  store: string,
  price: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO food_price_options (food_id,store,price,updated_at) VALUES (?,?,?,?) ' +
      'ON CONFLICT(food_id,store) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at',
    foodId,
    store.trim(),
    price,
    now,
  );
}

export async function deleteFoodPriceOption(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM food_price_options WHERE id=?', id);
}

/** Batch-load options for many foods at once (for list rows). */
export async function getFoodPriceMap(
  db: SQLiteDatabase,
  foodIds: string[],
): Promise<Record<string, FoodPriceOption[]>> {
  const map: Record<string, FoodPriceOption[]> = {};
  if (!foodIds.length) return map;
  const placeholders = foodIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<any>(
    `SELECT id,food_id,store,price,updated_at FROM food_price_options WHERE food_id IN (${placeholders}) ORDER BY updated_at DESC`,
    ...foodIds,
  );
  for (const row of rows) {
    const opt = normalizeFoodPriceOption(row);
    (map[opt.foodId] ??= []).push(opt);
  }
  return map;
}

// --- Bridge: grocery ingredient text -> catalog foods --------------------
// Matches accent-insensitively against both names. Exact normalized-name
// matches rank first so "souvlaki" doesn't bury behind partial hits.

export async function findFoodsForIngredient(
  db: SQLiteDatabase,
  ingredient: string,
  limit = 6,
): Promise<Food[]> {
  const needle = normalizeEl(ingredient);
  if (!needle) return [];
  const candidates = await db.getAllAsync<Food>(
    'SELECT * FROM foods ORDER BY is_favorite DESC, name_en COLLATE NOCASE',
  );
  const exact: Food[] = [];
  const partial: Food[] = [];
  for (const food of candidates) {
    const en = normalizeEl(food.name_en ?? '');
    const el = normalizeEl(food.name_el ?? '');
    if ((en && en === needle) || (el && el === needle)) exact.push(food);
    else if (
      (en && (en.includes(needle) || needle.includes(en))) ||
      (el && (el.includes(needle) || needle.includes(el)))
    ) {
      partial.push(food);
    }
    if (exact.length + partial.length >= limit) break;
  }
  return [...exact, ...partial].slice(0, limit);
}
