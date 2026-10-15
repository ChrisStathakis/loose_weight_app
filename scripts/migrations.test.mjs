import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { migrateSchemaIfNeeded } = await import('../src/lib/db.ts');

// Minimal expo-sqlite-shaped async adapter over node:sqlite so schema
// migrations can be replayed against a real SQLite engine. This is what the
// JS test runner could not do before, which is how the dedupe_key ordering bug
// (an index on a column that only exists after ALTER) reached a real install.
const shim = (db) => ({
  execAsync: async (sql) => { db.exec(sql); },
  getAllAsync: async (sql, ...params) => db.prepare(sql).all(...params),
  getFirstAsync: async (sql, ...params) => db.prepare(sql).all(...params)[0] ?? null,
  runAsync: async (sql, ...params) => {
    const result = db.prepare(sql).run(...params);
    return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
  },
  withTransactionAsync: async (task) => {
    db.exec('BEGIN');
    try {
      await task();
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  },
});

const all = (db, sql, ...params) => db.prepare(sql).all(...params);
const one = (db, sql, ...params) => all(db, sql, ...params)[0];
const tableColumns = (db, table) => all(db, `PRAGMA table_info(${table})`).map((c) => c.name);
// node:sqlite rows have a null prototype; deepEqual compares prototypes.
const plain = (rows) => rows.map((row) => ({ ...row }));

// Shape of an install from before dedupe_key, food-based plans, steps, theme.
const legacyDb = () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE settings (
      id TEXT PRIMARY KEY NOT NULL, locale TEXT NOT NULL DEFAULT 'en', calorie_goal REAL NOT NULL DEFAULT 2000,
      protein_goal REAL NOT NULL DEFAULT 120, carbs_goal REAL NOT NULL DEFAULT 220,
      fat_goal REAL NOT NULL DEFAULT 70, diet TEXT NOT NULL DEFAULT 'balanced',
      excluded TEXT NOT NULL DEFAULT '[]', onboarding_complete INTEGER NOT NULL DEFAULT 0
    );
    INSERT INTO settings (id, locale, calorie_goal) VALUES ('profile', 'el', 1800);
    CREATE TABLE foods (
      id TEXT PRIMARY KEY NOT NULL, name_en TEXT NOT NULL, name_el TEXT NOT NULL,
      brand TEXT, barcode TEXT, calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL, carbs_per_100g REAL NOT NULL, fat_per_100g REAL NOT NULL,
      serving_grams REAL, source TEXT NOT NULL
    );
    CREATE TABLE diary_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal_type TEXT NOT NULL,
      food_id TEXT NOT NULL, food_name TEXT NOT NULL, portion_grams REAL NOT NULL,
      calories REAL NOT NULL, protein REAL, carbs REAL, fat REAL
    );
    INSERT INTO diary_entries (date, meal_type, food_id, food_name, portion_grams, calories, protein, carbs, fat)
      VALUES ('2026-10-14', 'lunch', 'oats', 'Rolled oats', 100, 389, 16.9, 66.3, 6.9);
    CREATE TABLE plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, meal_type TEXT NOT NULL,
      recipe_id TEXT, portion REAL NOT NULL DEFAULT 1, locked INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, meal_type)
    );
    INSERT INTO plans (date, meal_type, recipe_id, portion, locked) VALUES ('2026-10-14', 'lunch', 'r1', 1, 0);
    CREATE TABLE xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, kind TEXT NOT NULL, points REAL NOT NULL DEFAULT 0
    );
    INSERT INTO xp_events (date, kind, points) VALUES ('2026-10-14', 'log-food', 5);
    CREATE TABLE workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, type TEXT NOT NULL,
      minutes REAL NOT NULL DEFAULT 0, calories REAL NOT NULL DEFAULT 0,
      weight_kg REAL, source TEXT NOT NULL DEFAULT 'manual',
      external_id TEXT, note TEXT, created_at TEXT NOT NULL DEFAULT ''
    );
  `);
  return db;
};

describe('migrateSchemaIfNeeded', () => {
  it('upgrades a legacy install without aborting on the dedupe index (regression)', async () => {
    const db = legacyDb();
    // Before the fix this threw "no such column: dedupe_key": SCHEMA_SQL
    // created the index before the ALTER added the column on old installs.
    await migrateSchemaIfNeeded(shim(db));

    assert.ok(tableColumns(db, 'xp_events').includes('dedupe_key'));
    assert.equal(one(db, "SELECT COUNT(*) as n FROM sqlite_master WHERE type='index' AND name='xp_events_dedupe_idx'").n, 1);
    // The legacy row survived and has no dedupe key.
    assert.deepEqual(plain(all(db, "SELECT kind, dedupe_key FROM xp_events WHERE date='2026-10-14'")), [
      { kind: 'log-food', dedupe_key: null },
    ]);
  });

  it('dedupes one award per key while allowing many NULL keys', async () => {
    const db = legacyDb();
    await migrateSchemaIfNeeded(shim(db));

    db.exec("INSERT INTO xp_events (date, kind, points, dedupe_key) VALUES ('2026-10-15','goal-hit',10,'goal-hit-2026-10-15')");
    db.exec("INSERT OR IGNORE INTO xp_events (date, kind, points, dedupe_key) VALUES ('2026-10-15','goal-hit',10,'goal-hit-2026-10-15')");
    assert.equal(one(db, "SELECT COUNT(*) as n FROM xp_events WHERE dedupe_key='goal-hit-2026-10-15'").n, 1);

    // NULL keys stay distinct: legacy rows (1) + two new keyless rows.
    db.exec("INSERT INTO xp_events (date, kind, points) VALUES ('2026-10-16','log-food',5)");
    db.exec("INSERT INTO xp_events (date, kind, points) VALUES ('2026-10-17','log-food',5)");
    assert.equal(one(db, 'SELECT COUNT(*) as n FROM xp_events WHERE dedupe_key IS NULL').n, 3);
  });

  it('keeps the surrounding migrations working on the same pass', async () => {
    const db = legacyDb();
    await migrateSchemaIfNeeded(shim(db));

    // plans: legacy row preserved, UNIQUE(date, meal_type) rebuild done, no leftovers.
    assert.equal(one(db, 'SELECT COUNT(*) as n FROM plans').n, 1);
    db.exec("INSERT INTO plans (date, meal_type, recipe_id, portion, locked) VALUES ('2026-10-14','lunch','r2',1,0)");
    assert.equal(one(db, "SELECT COUNT(*) as n FROM plans WHERE date='2026-10-14' AND meal_type='lunch'").n, 2);
    assert.equal(one(db, "SELECT COUNT(*) as n FROM sqlite_master WHERE type='table' AND name='plans_new'").n, 0);

    // diary source backfilled; settings row kept and new columns appended.
    assert.deepEqual(plain(all(db, "SELECT source FROM diary_entries WHERE food_id='oats'")), [{ source: 'Custom' }]);
    assert.deepEqual(plain(all(db, "SELECT locale, calorie_goal FROM settings WHERE id='profile'")), [{ locale: 'el', calorie_goal: 1800 }]);
    assert.ok(tableColumns(db, 'settings').includes('theme'));

    // workouts gain steps + distance_m; foods gain is_favorite.
    assert.ok(tableColumns(db, 'workouts').includes('steps'));
    assert.ok(tableColumns(db, 'workouts').includes('distance_m'));
    assert.ok(tableColumns(db, 'foods').includes('is_favorite'));

    // plans gain the food-based columns.
    const planCols = tableColumns(db, 'plans');
    for (const col of ['food_id', 'food_name', 'portion_grams', 'calories', 'protein', 'carbs', 'fat']) {
      assert.ok(planCols.includes(col), `plans.${col} missing`);
    }
  });

  it('is idempotent and safe to run again', async () => {
    const db = legacyDb();
    await migrateSchemaIfNeeded(shim(db));
    await migrateSchemaIfNeeded(shim(db));

    assert.equal(one(db, 'SELECT COUNT(*) as n FROM plans').n, 1);
    assert.equal(one(db, "SELECT COUNT(*) as n FROM xp_events WHERE date='2026-10-14'").n, 1);
    assert.equal(one(db, "SELECT COUNT(*) as n FROM sqlite_master WHERE type='index' AND name='xp_events_dedupe_idx'").n, 1);
  });

  it('sets up a fresh install in one pass', async () => {
    const db = new DatabaseSync(':memory:');
    await migrateSchemaIfNeeded(shim(db));

    assert.ok(tableColumns(db, 'xp_events').includes('dedupe_key'));
    assert.equal(one(db, "SELECT COUNT(*) as n FROM sqlite_master WHERE type='index' AND name='xp_events_dedupe_idx'").n, 1);
    assert.equal(one(db, "SELECT COUNT(*) as n FROM settings WHERE id='profile'").n, 1);
  });
});
