import type { SQLiteDatabase } from 'expo-sqlite';
import { seedFoods, seedRecipes } from '../data/seed';

/**
 * Fast, idempotent schema setup. This is the ONLY thing that runs inside
 * `SQLiteProvider onInit`, so it must never take exclusive locks for long:
 * expo-sqlite suspends the whole tree until onInit resolves, and a remount
 * with a new onInit reference closes + reopens the DB and re-runs this.
 * Keep it to CREATE TABLE / ALTER TABLE only (milliseconds).
 */
export async function migrateSchemaIfNeeded(db: SQLiteDatabase) {
  // Contention tolerance: a Metro reload during the first-launch background
  // seed (which holds an exclusive transaction) opens a second connection
  // while the old one is still alive. Without a busy timeout, SQLite fails
  // instantly with SQLITE_BUSY ("database is locked") instead of waiting.
  try {
    await db.execAsync('PRAGMA busy_timeout = 5000;');
  } catch (e) {
    console.error('Failed to set busy_timeout', e);
  }
  // WAL conversion needs exclusive access, so keep it isolated, conditional,
  // and non-fatal: after the first successful launch the DB is already WAL
  // and this is a no-op; if a seed transaction holds the lock, log and carry
  // on — the busy_timeout above lets the statements below wait it out.
  try {
    const mode = await db.getFirstAsync<{ journal_mode?: string }>('PRAGMA journal_mode');
    if (String(mode?.journal_mode ?? '').toLowerCase() !== 'wal') {
      await db.execAsync('PRAGMA journal_mode = WAL;');
    }
  } catch (e) {
    console.warn('WAL conversion deferred (lock held), continuing init', e);
  }
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en', calorie_goal REAL NOT NULL DEFAULT 2000,
      protein_goal REAL NOT NULL DEFAULT 120, carbs_goal REAL NOT NULL DEFAULT 220,
      fat_goal REAL NOT NULL DEFAULT 70, diet TEXT NOT NULL DEFAULT 'balanced',
      excluded TEXT NOT NULL DEFAULT '[]', onboarding_complete INTEGER NOT NULL DEFAULT 0,
      height_cm REAL, birth_date TEXT NOT NULL DEFAULT '', weight_kg REAL,
      target_weight_kg REAL
    );
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL, name_en TEXT NOT NULL, name_el TEXT NOT NULL,
      brand TEXT, barcode TEXT, calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL, carbs_per_100g REAL NOT NULL, fat_per_100g REAL NOT NULL,
      serving_grams REAL, source TEXT NOT NULL, is_favorite INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY NOT NULL, name_en TEXT NOT NULL, name_el TEXT NOT NULL,
      diet TEXT NOT NULL, ingredients TEXT NOT NULL, instructions_en TEXT NOT NULL,
      instructions_el TEXT NOT NULL, calories REAL NOT NULL, protein REAL NOT NULL,
      carbs REAL NOT NULL, fat REAL NOT NULL, servings REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS diary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal_type TEXT NOT NULL,
      food_id TEXT NOT NULL, food_name TEXT NOT NULL, portion_grams REAL NOT NULL,
      calories REAL NOT NULL, protein REAL, carbs REAL, fat REAL, source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS diary_date_idx ON diary_entries(date);
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal_type TEXT NOT NULL,
      recipe_id TEXT, portion REAL NOT NULL DEFAULT 1, locked INTEGER NOT NULL DEFAULT 0,
      food_id TEXT, food_name TEXT, portion_grams REAL, calories REAL, protein REAL, carbs REAL, fat REAL
    );
    CREATE INDEX IF NOT EXISTS plans_date_idx ON plans(date);
    CREATE TABLE IF NOT EXISTS groceries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, ingredient TEXT NOT NULL,
      amount REAL NOT NULL, unit TEXT NOT NULL, checked INTEGER NOT NULL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT 'other',
      source TEXT NOT NULL DEFAULT 'auto',
      UNIQUE(date, ingredient, unit)
    );
    CREATE TABLE IF NOT EXISTS weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, kilograms REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS water_entries (
      date TEXT PRIMARY KEY NOT NULL, ml REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, kind TEXT NOT NULL, points REAL NOT NULL DEFAULT 0,
      dedupe_key TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS xp_events_dedupe_idx ON xp_events(dedupe_key);
    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY NOT NULL, unlocked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS opponent_progress (
      week TEXT PRIMARY KEY NOT NULL, opponent_id TEXT NOT NULL, hp REAL NOT NULL DEFAULT 100
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, type TEXT NOT NULL,
      minutes REAL NOT NULL DEFAULT 0, calories REAL NOT NULL DEFAULT 0,
      weight_kg REAL, source TEXT NOT NULL DEFAULT 'manual',
      external_id TEXT, note TEXT, created_at TEXT NOT NULL DEFAULT '',
      steps INTEGER, distance_m REAL
    );
    CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(date);
    CREATE UNIQUE INDEX IF NOT EXISTS workouts_external_idx ON workouts(external_id);
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS grocery_price_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT, item_key TEXT NOT NULL,
      store TEXT NOT NULL, price REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      UNIQUE(item_key, store)
    );
    CREATE INDEX IF NOT EXISTS grocery_price_key_idx ON grocery_price_options(item_key);
    CREATE TABLE IF NOT EXISTS food_price_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT, food_id TEXT NOT NULL,
      store TEXT NOT NULL, price REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      UNIQUE(food_id, store)
    );
    CREATE INDEX IF NOT EXISTS food_price_food_idx ON food_price_options(food_id);
    CREATE TABLE IF NOT EXISTS recipe_price_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT, recipe_id TEXT NOT NULL,
      store TEXT NOT NULL, price REAL NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      UNIQUE(recipe_id, store)
    );
    CREATE INDEX IF NOT EXISTS recipe_price_recipe_idx ON recipe_price_options(recipe_id);
    CREATE TABLE IF NOT EXISTS food_micronutrients (
      food_id TEXT NOT NULL, nutrient TEXT NOT NULL, amount REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (food_id, nutrient)
    );
    CREATE INDEX IF NOT EXISTS food_micro_food_idx ON food_micronutrients(food_id);
  `);

  // Lightweight migration for installs created before `source` existed on diary_entries.
  try {
    const cols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(diary_entries)');
    if (cols.length > 0 && !cols.some((c) => c.name === 'source')) {
      await db.execAsync(`ALTER TABLE diary_entries ADD COLUMN source TEXT NOT NULL DEFAULT 'Custom'`);
    }
  } catch (e) {
    console.error('Failed to migrate diary_entries', e);
  }
  try {
    const foodCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(foods)');
    if (foodCols.length > 0 && !foodCols.some((c) => c.name === 'is_favorite')) {
      await db.execAsync(`ALTER TABLE foods ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`);
    }
  } catch (e) {
    console.error('Failed to migrate foods', e);
  }
  // Food-based planner: plans rows can reference a food instead of a recipe.
  try {
    const planCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plans)');
    const names = new Set(planCols.map((c) => c.name));
    const addCols: [string, string][] = [
      ['food_id', 'ALTER TABLE plans ADD COLUMN food_id TEXT'],
      ['food_name', 'ALTER TABLE plans ADD COLUMN food_name TEXT'],
      ['portion_grams', 'ALTER TABLE plans ADD COLUMN portion_grams REAL'],
      ['calories', 'ALTER TABLE plans ADD COLUMN calories REAL'],
      ['protein', 'ALTER TABLE plans ADD COLUMN protein REAL'],
      ['carbs', 'ALTER TABLE plans ADD COLUMN carbs REAL'],
      ['fat', 'ALTER TABLE plans ADD COLUMN fat REAL'],
    ];
    for (const [name, sql] of addCols) {
      if (planCols.length > 0 && !names.has(name)) {
        await db.execAsync(sql);
      }
    }
  } catch (e) {
    console.error('Failed to migrate plans', e);
  }
  // Multiple items per meal: drop UNIQUE(date, meal_type) by rebuilding the
  // table, preserving every row (ids, locks, nutrition). Runs once on old
  // installs; fresh installs already get the new shape above.
  try {
    // Crash recovery from the pre-transaction build of this migration:
    //  - killed after CREATE+INSERT but before DROP → plans_new holds a copy
    //  - killed after DROP but before RENAME → plans is empty, plans_new holds
    //    the only copy. Salvage it when plans came back empty.
    const orphan = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) as n FROM sqlite_master WHERE type='table' AND name='plans_new'",
    );
    if (Number(orphan?.n ?? 0) > 0) {
      const mainCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM plans');
      const orphanCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM plans_new');
      if (Number(mainCount?.n ?? 0) === 0 && Number(orphanCount?.n ?? 0) > 0) {
        await db.withTransactionAsync(async () => {
          await db.execAsync(`
            INSERT INTO plans (id, date, meal_type, recipe_id, portion, locked, food_id, food_name, portion_grams, calories, protein, carbs, fat)
              SELECT id, date, meal_type, recipe_id, portion, locked, food_id, food_name, portion_grams, calories, protein, carbs, fat FROM plans_new;
            DROP TABLE plans_new;
          `);
        });
        console.log('Recovered saved plans from plans_new');
      } else {
        await db.execAsync('DROP TABLE IF EXISTS plans_new');
      }
    }
  } catch (e) {
    console.error('Failed to recover interrupted plans migration', e);
  }
  try {
    const planTable = await db.getFirstAsync<{ sql?: string }>(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='plans'",
    );
    if (planTable?.sql && /UNIQUE\s*\(\s*date\s*,\s*meal_type\s*\)/i.test(planTable.sql)) {
      // All steps in ONE transaction: a kill mid-migration rolls back, so the
      // table can never be left half-renamed or with plans_new stranded.
      await db.withTransactionAsync(async () => {
        await db.execAsync(`
          DROP TABLE IF EXISTS plans_new;
          CREATE TABLE plans_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal_type TEXT NOT NULL,
            recipe_id TEXT, portion REAL NOT NULL DEFAULT 1, locked INTEGER NOT NULL DEFAULT 0,
            food_id TEXT, food_name TEXT, portion_grams REAL, calories REAL, protein REAL, carbs REAL, fat REAL
          );
          INSERT INTO plans_new (id, date, meal_type, recipe_id, portion, locked, food_id, food_name, portion_grams, calories, protein, carbs, fat)
            SELECT id, date, meal_type, recipe_id, portion, locked, food_id, food_name, portion_grams, calories, protein, carbs, fat FROM plans;
          DROP TABLE plans;
          ALTER TABLE plans_new RENAME TO plans;
          CREATE INDEX plans_date_idx ON plans(date);
        `);
      });
    } else {
      await db.execAsync('CREATE INDEX IF NOT EXISTS plans_date_idx ON plans(date);');
    }
  } catch (e) {
    console.error('Failed to migrate plans uniqueness', e);
  }
  // Health Connect spike: workouts gain steps + distance_m, plus sync_state kv.
  try {
    const workoutCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(workouts)');
    const wnames = new Set(workoutCols.map((c) => c.name));
    if (workoutCols.length > 0 && !wnames.has('steps')) {
      await db.execAsync('ALTER TABLE workouts ADD COLUMN steps INTEGER');
    }
    if (workoutCols.length > 0 && !wnames.has('distance_m')) {
      await db.execAsync('ALTER TABLE workouts ADD COLUMN distance_m REAL');
    }
  } catch (e) {
    console.error('Failed to migrate workouts', e);
  }
  // Grocery revamp: line-total price + category + source (auto vs manual).
  // Manual rows must survive plan regeneration; prices must be preserved.
  try {
    const groceryCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(groceries)');
    const gnames = new Set(groceryCols.map((c) => c.name));
    const addGroceryCols: [string, string][] = [
      ['price', 'ALTER TABLE groceries ADD COLUMN price REAL NOT NULL DEFAULT 0'],
      ['category', `ALTER TABLE groceries ADD COLUMN category TEXT NOT NULL DEFAULT 'other'`],
      ['source', `ALTER TABLE groceries ADD COLUMN source TEXT NOT NULL DEFAULT 'auto'`],
      ['price_store', `ALTER TABLE groceries ADD COLUMN price_store TEXT NOT NULL DEFAULT ''`],
    ];
    for (const [name, sql] of addGroceryCols) {
      if (groceryCols.length > 0 && !gnames.has(name)) {
        await db.execAsync(sql);
      }
    }
  } catch (e) {
    console.error('Failed to migrate groceries', e);
  }
  // Onboarding profile: height / birth date / weight. Create-if-missing so
  // pre-existing installs keep their row and fresh installs get the columns
  // from CREATE TABLE above.
  try {
    const settingsCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(settings)');
    const snames = new Set(settingsCols.map((c) => c.name));
    const addSettingsCols: [string, string][] = [
      ['height_cm', 'ALTER TABLE settings ADD COLUMN height_cm REAL'],
      ['birth_date', `ALTER TABLE settings ADD COLUMN birth_date TEXT NOT NULL DEFAULT ''`],
      ['weight_kg', 'ALTER TABLE settings ADD COLUMN weight_kg REAL'],
      ['target_weight_kg', 'ALTER TABLE settings ADD COLUMN target_weight_kg REAL'],
      ['theme', `ALTER TABLE settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'system'`],
    ];
    for (const [name, sql] of addSettingsCols) {
      if (settingsCols.length > 0 && !snames.has(name)) {
        await db.execAsync(sql);
      }
    }
  } catch (e) {
    console.error('Failed to migrate settings', e);
  }
  // Idempotent XP awards: one row per (event, day/week) via a unique key.
  try {
    const xpCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(xp_events)');
    if (xpCols.length > 0 && !xpCols.some((c) => c.name === 'dedupe_key')) {
      await db.execAsync('ALTER TABLE xp_events ADD COLUMN dedupe_key TEXT');
    }
    await db.execAsync('CREATE UNIQUE INDEX IF NOT EXISTS xp_events_dedupe_idx ON xp_events(dedupe_key);');
  } catch (e) {
    console.error('Failed to migrate xp_events', e);
  }

  await db.runAsync('INSERT OR IGNORE INTO settings (id) VALUES (?)', 'profile');
}

/**
 * Bulk food/recipe seed. Runs in the BACKGROUND after first paint (see
 * SeedRunner in app/_layout.tsx), never inside onInit: it holds an exclusive
 * transaction over hundreds of rows, which on slow emulator I/O blocked
 * startup and left the Suspense fallback spinning on every reload.
 * Safe to call repeatedly: counts are checked first and rows are
 * INSERT OR IGNORE. Seed *food* nutrition is additionally refreshed on a
 * version bump (custom rows untouched, is_favorite preserved, diary/plan
 * snapshots unaffected). Seed recipes are intentionally never refreshed:
 * saved plans reference recipes live, so rewriting them would silently
 * change totals the user already reviewed.
 */
export const SEED_VERSION = 2;

// Counts compared against the DB are UNIQUE seed ids: a duplicated id in the
// data must not make the guard unreachable (it re-ran the whole seed on every
// launch when duplicates inflated seedFoods.length).
const UNIQUE_SEED_FOOD_COUNT = new Set(seedFoods.map((f) => f.id)).size;
const UNIQUE_SEED_RECIPE_COUNT = new Set(seedRecipes.map((r) => r.id)).size;

export async function seedIfNeeded(db: SQLiteDatabase) {
  // First-launch seed: hundreds of rows. The old per-row loop issued one
  // bridge call per row and left the app on a blank screen (SQLiteProvider
  // renders null until onInit resolves). Batch into multi-row INSERTs inside
  // a single exclusive transaction and skip entirely when already seeded.
  const startedAt = Date.now();
  let needsRefresh = true;
  try {
    const foodCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM foods');
    const recipeCount = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM recipes');
    const versionRow = await db
      .getFirstAsync<{ value: string }>("SELECT value FROM sync_state WHERE key='seed_version'")
      .catch(() => null);
    needsRefresh = Number(versionRow?.value ?? 0) < SEED_VERSION;
    if (Number(foodCount?.n ?? 0) >= UNIQUE_SEED_FOOD_COUNT && Number(recipeCount?.n ?? 0) >= UNIQUE_SEED_RECIPE_COUNT && !needsRefresh) {
      return;
    }
  } catch (e) {
    console.error('Seed count check failed, seeding anyway', e);
  }
  const chunked = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };
  type Runner = { runAsync: (sql: string, params: any[]) => Promise<unknown> };
  const runSeed = async (runner: Runner) => {
    for (const group of chunked(seedFoods, 40)) {
      const placeholders = group.map(() => '(?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const params: any[] = [];
      for (const food of group) {
        params.push(
          food.id, food.name_en, food.name_el, (food as any).brand ?? null, (food as any).barcode ?? null,
          food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g,
          food.serving_grams ?? null, food.source,
        );
      }
      await runner.runAsync(
        `INSERT OR IGNORE INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source) VALUES ${placeholders}`,
        params,
      );
    }
    for (const group of chunked(seedRecipes, 30)) {
      const placeholders = group.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const params: any[] = [];
      for (const recipe of group) {
        params.push(
          recipe.id, recipe.name_en, recipe.name_el, recipe.diet, JSON.stringify(recipe.ingredients),
          recipe.instructions_en, recipe.instructions_el, recipe.calories, recipe.protein,
          recipe.carbs, recipe.fat, recipe.servings,
        );
      }
      await runner.runAsync(
        `INSERT OR IGNORE INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings) VALUES ${placeholders}`,
        params,
      );
    }
    if (needsRefresh) {
      // Nutrition/name corrections ship with the app: refresh seed-owned
      // columns only (custom rows never match a seed id; is_favorite is
      // never touched; diary/plan entries keep their snapshots).
      for (const food of seedFoods) {
        await runner.runAsync(
          'UPDATE foods SET name_en=?,name_el=?,brand=?,barcode=?,calories_per_100g=?,protein_per_100g=?,carbs_per_100g=?,fat_per_100g=?,serving_grams=?,source=? WHERE id=?',
          [
            food.name_en, food.name_el, (food as any).brand ?? null, (food as any).barcode ?? null,
            food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g,
            food.serving_grams ?? null, food.source, food.id,
          ],
        );
      }
      await runner.runAsync(`INSERT OR REPLACE INTO sync_state (key,value) VALUES ('seed_version',?)`, [String(SEED_VERSION)]);
    }
  };
  try {
    const anyDb = db as any;
    if (typeof anyDb.withExclusiveTransactionAsync === 'function') {
      await anyDb.withExclusiveTransactionAsync((txn: Runner) => runSeed(txn));
    } else {
      await db.withTransactionAsync(() => runSeed(db));
    }
    console.log(`Seeded ${seedFoods.length} foods + ${seedRecipes.length} recipes in ${Date.now() - startedAt}ms`);
  } catch (e) {
    // Don't block startup: counts are checked on next launch and seeding resumes.
    console.error('Failed to seed database (will retry next launch)', e);
  }
}

/** Legacy entry point: schema first, then seed. Prefer the split functions. */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await migrateSchemaIfNeeded(db);
  await seedIfNeeded(db);
}

export const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function dateLabel(date: string, locale: 'en' | 'el') {
  // DB or backup dates should always be valid, but one corrupt value must not
  // crash the whole screen: fall back to the raw string.
  try {
    const d = new Date(`${date}T12:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
  } catch {
    return date;
  }
}
