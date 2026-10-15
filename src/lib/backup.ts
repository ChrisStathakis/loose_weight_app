import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

/**
 * Versioned JSON backup / restore. Lives here (not in the settings screen) so
 * every table that the app writes is listed in ONE place and restore stays in
 * step with the schema.
 *
 * Restored rows are column-mapped with defaults: backups taken by older
 * versions (missing columns or whole tables) still import cleanly.
 */

export const BACKUP_SCHEMA_VERSION = 1;

type Row = Record<string, unknown>;

const str = (v: unknown, dflt = ''): string => (typeof v === 'string' ? v : dflt);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown, dflt = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
};
const numOrNull = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

type TableSpec = [table: string, insertSql: string, toParams: (row: Row) => SQLiteBindValue[]];

// Insert order matters only in that every table must appear exactly once.
const TABLES: TableSpec[] = [
  ['settings', 'INSERT INTO settings (id,locale,calorie_goal,protein_goal,carbs_goal,fat_goal,diet,excluded,onboarding_complete,height_cm,birth_date,weight_kg,target_weight_kg,theme) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [str(r.id, 'profile'), str(r.locale, 'en'), num(r.calorie_goal, 2000), num(r.protein_goal, 120), num(r.carbs_goal, 220), num(r.fat_goal, 70), str(r.diet, 'balanced'), str(r.excluded, '[]'), r.onboarding_complete ? 1 : 0, numOrNull(r.height_cm), str(r.birth_date), numOrNull(r.weight_kg), numOrNull(r.target_weight_kg), str(r.theme, 'system')]],
  ['foods', 'INSERT INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source,is_favorite) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [str(r.id), str(r.name_en), str(r.name_el), strOrNull(r.brand), strOrNull(r.barcode), num(r.calories_per_100g), num(r.protein_per_100g), num(r.carbs_per_100g), num(r.fat_per_100g), numOrNull(r.serving_grams), str(r.source), num(r.is_favorite)]],
  ['recipes', 'INSERT INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [str(r.id), str(r.name_en), str(r.name_el), str(r.diet, 'balanced'), str(r.ingredients, '[]'), str(r.instructions_en), str(r.instructions_el), num(r.calories), num(r.protein), num(r.carbs), num(r.fat), num(r.servings, 1)]],
  ['diary_entries', 'INSERT INTO diary_entries (id,date,meal_type,food_id,food_name,portion_grams,calories,protein,carbs,fat,source) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), str(r.meal_type), str(r.food_id), str(r.food_name), num(r.portion_grams), num(r.calories), numOrNull(r.protein), numOrNull(r.carbs), numOrNull(r.fat), str(r.source, 'Custom')]],
  ['plans', 'INSERT INTO plans (id,date,meal_type,recipe_id,portion,locked,food_id,food_name,portion_grams,calories,protein,carbs,fat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), str(r.meal_type), strOrNull(r.recipe_id), num(r.portion, 1), num(r.locked), strOrNull(r.food_id), strOrNull(r.food_name), numOrNull(r.portion_grams), numOrNull(r.calories), numOrNull(r.protein), numOrNull(r.carbs), numOrNull(r.fat)]],
  // Price/store/category/source must survive a restore, otherwise regenerating
  // groceries reverts to preselected prices and drops manual items.
  ['groceries', 'INSERT INTO groceries (id,date,ingredient,amount,unit,checked,price,price_store,category,source) VALUES (?,?,?,?,?,?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), str(r.ingredient), num(r.amount), str(r.unit), num(r.checked), num(r.price), str(r.price_store), str(r.category, 'other'), str(r.source, 'auto')]],
  ['weights', 'INSERT INTO weights (id,date,kilograms) VALUES (?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), num(r.kilograms)]],
  ['water_entries', 'INSERT INTO water_entries (date,ml) VALUES (?,?)',
    (r) => [str(r.date), num(r.ml)]],
  ['xp_events', 'INSERT INTO xp_events (id,date,kind,points,dedupe_key) VALUES (?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), str(r.kind), num(r.points), strOrNull(r.dedupe_key)]],
  ['badges', 'INSERT INTO badges (id,unlocked_at) VALUES (?,?)',
    (r) => [str(r.id), str(r.unlocked_at, new Date().toISOString())]],
  ['opponent_progress', 'INSERT INTO opponent_progress (week,opponent_id,hp) VALUES (?,?,?)',
    (r) => [str(r.week), str(r.opponent_id), num(r.hp, 100)]],
  ['workouts', 'INSERT INTO workouts (id,date,type,minutes,calories,weight_kg,source,external_id,note,created_at,steps,distance_m) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.date), str(r.type), num(r.minutes), num(r.calories), numOrNull(r.weight_kg), str(r.source, 'manual'), strOrNull(r.external_id), strOrNull(r.note), str(r.created_at), numOrNull(r.steps), numOrNull(r.distance_m)]],
  ['sync_state', 'INSERT INTO sync_state (key,value) VALUES (?,?)',
    (r) => [str(r.key), str(r.value)]],
  ['grocery_price_options', 'INSERT INTO grocery_price_options (id,item_key,store,price,updated_at) VALUES (?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.item_key), str(r.store), num(r.price), str(r.updated_at)]],
  ['food_price_options', 'INSERT INTO food_price_options (id,food_id,store,price,updated_at) VALUES (?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.food_id), str(r.store), num(r.price), str(r.updated_at)]],
  ['recipe_price_options', 'INSERT INTO recipe_price_options (id,recipe_id,store,price,updated_at) VALUES (?,?,?,?,?)',
    (r) => [numOrNull(r.id), str(r.recipe_id), str(r.store), num(r.price), str(r.updated_at)]],
  ['food_micronutrients', 'INSERT INTO food_micronutrients (food_id,nutrient,amount,unit) VALUES (?,?,?,?)',
    (r) => [str(r.food_id), str(r.nutrient), num(r.amount), str(r.unit)]],
];

export const BACKUP_TABLES = TABLES.map(([table]) => table);

export async function buildBackup(db: SQLiteDatabase): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = { schemaVersion: BACKUP_SCHEMA_VERSION, exportedAt: new Date().toISOString() };
  for (const [table] of TABLES) {
    data[table] = await db.getAllAsync(`SELECT * FROM ${table}`);
  }
  return data;
}

export function isRestorableBackup(data: unknown): data is Record<string, unknown> {
  const d = data as Row | null;
  return !!d && d.schemaVersion === BACKUP_SCHEMA_VERSION && Array.isArray(d.foods) && Array.isArray(d.settings);
}

export async function restoreBackup(db: SQLiteDatabase, data: unknown): Promise<void> {
  if (!isRestorableBackup(data)) throw new Error('invalid-backup');
  await db.withTransactionAsync(async () => {
    // Clear every known table (including price/micro tables the diary depends
    // on) so nothing stale from the previous dataset survives the restore.
    for (const [table] of TABLES) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
    for (const [table, sql, toParams] of TABLES) {
      const rows = data[table];
      if (!Array.isArray(rows)) continue; // backup from an older version
      for (const row of rows as Row[]) {
        await db.runAsync(sql, ...toParams(row));
      }
    }
  });
}
