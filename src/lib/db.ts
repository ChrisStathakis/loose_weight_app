import type { SQLiteDatabase } from 'expo-sqlite';
import { seedFoods, seedRecipes } from '@/src/data/seed';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en', calorie_goal REAL NOT NULL DEFAULT 2000,
      protein_goal REAL NOT NULL DEFAULT 120, carbs_goal REAL NOT NULL DEFAULT 220,
      fat_goal REAL NOT NULL DEFAULT 70, diet TEXT NOT NULL DEFAULT 'balanced',
      excluded TEXT NOT NULL DEFAULT '[]', onboarding_complete INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY NOT NULL, name_en TEXT NOT NULL, name_el TEXT NOT NULL,
      brand TEXT, barcode TEXT, calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL, carbs_per_100g REAL NOT NULL, fat_per_100g REAL NOT NULL,
      serving_grams REAL, source TEXT NOT NULL
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
      recipe_id TEXT NOT NULL, portion REAL NOT NULL DEFAULT 1, locked INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, meal_type)
    );
    CREATE TABLE IF NOT EXISTS groceries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, ingredient TEXT NOT NULL,
      amount REAL NOT NULL, unit TEXT NOT NULL, checked INTEGER NOT NULL DEFAULT 0,
      UNIQUE(date, ingredient, unit)
    );
    CREATE TABLE IF NOT EXISTS weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL UNIQUE, kilograms REAL NOT NULL
    );
  `);

  await db.runAsync('INSERT OR IGNORE INTO settings (id) VALUES (?)', 'profile');
  for (const food of seedFoods) {
    await db.runAsync(
      `INSERT OR IGNORE INTO foods (id,name_en,name_el,brand,barcode,calories_per_100g,protein_per_100g,carbs_per_100g,fat_per_100g,serving_grams,source)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      food.id, food.name_en, food.name_el, food.brand ?? null, food.barcode ?? null,
      food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g,
      food.serving_grams ?? null, food.source,
    );
  }
  for (const recipe of seedRecipes) {
    await db.runAsync(
      `INSERT OR IGNORE INTO recipes (id,name_en,name_el,diet,ingredients,instructions_en,instructions_el,calories,protein,carbs,fat,servings)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      recipe.id, recipe.name_en, recipe.name_el, recipe.diet, JSON.stringify(recipe.ingredients),
      recipe.instructions_en, recipe.instructions_el, recipe.calories, recipe.protein,
      recipe.carbs, recipe.fat, recipe.servings,
    );
  }
}

export const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function dateLabel(date: string, locale: 'en' | 'el') {
  return new Intl.DateTimeFormat(locale === 'el' ? 'el-GR' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
}
