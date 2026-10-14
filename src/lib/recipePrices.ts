import type { SQLiteDatabase } from 'expo-sqlite';
import type { Locale, RecipePriceOption } from '@/src/types';
import { formatPrice } from './groceries';

export function normalizeRecipePriceOption(row: any): RecipePriceOption {
  return {
    id: Number(row.id),
    recipeId: String(row.recipe_id ?? ''),
    store: String(row.store ?? ''),
    price: Number(row.price ?? 0) || 0,
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function getRecipePriceOptions(
  db: SQLiteDatabase,
  recipeId: string,
): Promise<RecipePriceOption[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT id,recipe_id,store,price,updated_at FROM recipe_price_options WHERE recipe_id=? ORDER BY updated_at DESC',
    recipeId,
  );
  return rows.map(normalizeRecipePriceOption);
}

/** Cheapest option first by price (for badges); null when none. */
export function cheapestRecipePrice(
  options: RecipePriceOption[],
): RecipePriceOption | null {
  if (!options.length) return null;
  return options.reduce((best, o) => (o.price < best.price ? o : best), options[0]);
}

export function formatCheapestRecipe(
  options: RecipePriceOption[],
  locale: Locale,
): string | null {
  const best = cheapestRecipePrice(options);
  return best ? `${formatPrice(best.price, locale)} · ${best.store}` : null;
}

/** Most recently updated option (for grocery preselect); null when none. */
export function latestRecipePrice(
  options: RecipePriceOption[],
): RecipePriceOption | null {
  if (!options.length) return null;
  return options.reduce((best, o) => (o.updatedAt > best.updatedAt ? o : best), options[0]);
}

export async function upsertRecipePriceOption(
  db: SQLiteDatabase,
  recipeId: string,
  store: string,
  price: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO recipe_price_options (recipe_id,store,price,updated_at) VALUES (?,?,?,?) ' +
      'ON CONFLICT(recipe_id,store) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at',
    recipeId,
    store.trim(),
    price,
    now,
  );
}

export async function deleteRecipePriceOption(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM recipe_price_options WHERE id=?', id);
}

/** Batch-load options for many recipes at once (for list rows). */
export async function getRecipePriceMap(
  db: SQLiteDatabase,
  recipeIds: string[],
): Promise<Record<string, RecipePriceOption[]>> {
  const map: Record<string, RecipePriceOption[]> = {};
  if (!recipeIds.length) return map;
  const placeholders = recipeIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<any>(
    `SELECT id,recipe_id,store,price,updated_at FROM recipe_price_options WHERE recipe_id IN (${placeholders}) ORDER BY updated_at DESC`,
    ...recipeIds,
  );
  for (const row of rows) {
    const opt = normalizeRecipePriceOption(row);
    (map[opt.recipeId] ??= []).push(opt);
  }
  return map;
}
