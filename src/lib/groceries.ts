import type { SQLiteDatabase } from 'expo-sqlite';
import type { GroceryCategory, GroceryItem, GroceryPriceOption, Locale } from '@/src/types';
import { normalizeEl } from './search';

export type LinkedRecipe = {
  name: string;
  date: string;
  mealType: string;
  qty: number;
  unit: string;
  recipeId: string;
};

export type GroceryGroup = {
  category: GroceryCategory;
  items: GroceryItem[];
};

export const GROCERY_CATEGORIES: GroceryCategory[] = [
  'produce',
  'dairy',
  'meat',
  'bakery',
  'pantry',
  'frozen',
  'other',
];

export const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  produce: '🥬',
  dairy: '🧀',
  meat: '🍗',
  bakery: '🍞',
  pantry: '🫙',
  frozen: '🧊',
  other: '🛒',
};

const KEYWORDS: { category: GroceryCategory; words: string[] }[] = [
  {
    category: 'produce',
    words: [
      'tomato', 'potato', 'onion', 'garlic', 'carrot', 'pepper', 'cucumber', 'lettuce',
      'spinach', 'broccoli', 'zucchini', 'eggplant', 'apple', 'banana', 'orange',
      'lemon', 'berries', 'mushroom', 'herb', 'parsley', 'basil', 'salad', 'fruit',
      'vegetable', 'avocado', 'lime', 'celery', 'cabbage', 'peas', 'beans fresh',
      'ντομάτα', 'πατάτα', 'κρεμμύδι', 'σκόρδο', 'καρότο', 'πιπεριά', 'αγγούρι',
      'μαρούλι', 'σπανάκι', 'μπρόκολο', 'κολοκύθι', 'μελιτζάνα', 'μήλο', 'μπανάνα',
      'πορτοκάλι', 'λεμόνι', 'μανιτάρι', 'μαϊνταν', 'βασιλικ', 'σαλάτα', 'φρούτ',
      'λαχανικ', 'αβοκάντο',
    ],
  },
  {
    category: 'dairy',
    words: [
      'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream', 'kefir', 'egg',
      'feta', 'parmesan', 'mozzarella',
      'γάλα', 'τυρί', 'γιαούρτι', 'βούτυρο', 'κρέμα', 'αυγό', 'αυγά', 'φέτα',
    ],
  },
  {
    category: 'meat',
    words: [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'sausage',
      'bacon', 'meat', 'mince', 'fillet', 'shrimp',
      'κοτόπουλο', 'μοσχάρι', 'χοιρινό', 'ψάρι', 'σολομ', 'τόνο', 'γαλοπούλα',
      'λουκάνικο', 'κρέας', 'κιμάς', 'φιλέτο', 'γαρίδα',
    ],
  },
  {
    category: 'bakery',
    words: [
      'bread', 'pita', 'roll', 'croissant', 'bagel', 'cake', 'pie', 'dough',
      'ψωμί', 'πίτα', 'ψωμάκι', 'κρουασάν', 'κέικ', 'ζύμη',
    ],
  },
  {
    category: 'frozen',
    words: [
      'frozen', 'ice cream',
      'κατεψυγμέν', 'παγωτό',
    ],
  },
  {
    category: 'pantry',
    words: [
      'rice', 'pasta', 'flour', 'sugar', 'salt', 'oil', 'olive', 'vinegar', 'honey',
      'oats', 'cereal', 'lentil', 'chickpea', 'bean', 'nut', 'almond', 'walnut',
      'spice', 'oregano', 'cumin', 'paprika', 'coffee', 'tea', 'chocolate', 'sauce',
      'ρύζι', 'μακαρόνι', 'ζυμαρικ', 'αλεύρι', 'ζάχαρη', 'αλάτι', 'λάδι', 'ελαιόλαδο',
      'ξύδι', 'μέλι', 'βρώμη', 'φακή', 'ρεβύθι', 'φασόλι', 'ξηροί', 'αμύγδαλο',
      'καρύδι', 'μπαχαρικ', 'ρίγανη', 'κύμινο', 'πάπρικα', 'καφές', 'τσάι',
      'σοκολάτα', 'σάλτσα',
    ],
  },
];

export function categorizeIngredient(name: string): GroceryCategory {
  // Same normalization as food search: Greek input matches regardless of
  // case, tonos, or final sigma (e.g. ΚΑΦΕΣ and καφες both hit καφές).
  const lower = normalizeEl(name);
  for (const entry of KEYWORDS) {
    if (entry.words.some((w) => {
      const needle = normalizeEl(w);
      return needle !== '' && lower.includes(needle);
    })) return entry.category;
  }
  return 'other';
}

export function isGroceryCategory(value: string): value is GroceryCategory {
  return (GROCERY_CATEGORIES as string[]).includes(value);
}

export function normalizeGroceryRow(row: any): GroceryItem {
  const category = isGroceryCategory(String(row.category ?? '')) ? String(row.category) as GroceryCategory : undefined;
  return {
    id: Number(row.id),
    ingredient: String(row.ingredient ?? ''),
    amount: Number(row.amount ?? 0),
    unit: String(row.unit ?? ''),
    checked: Boolean(Number(row.checked ?? 0)),
    price: Number(row.price ?? 0) || 0,
    priceStore: String(row.price_store ?? row.priceStore ?? ''),
    category: category ?? categorizeIngredient(String(row.ingredient ?? '')),
    source: row.source === 'manual' ? 'manual' : 'auto',
  };
}

export function groupGroceries(items: GroceryItem[]): GroceryGroup[] {
  const groups = new Map<GroceryCategory, GroceryItem[]>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return GROCERY_CATEGORIES.filter((c) => groups.has(c)).map((c) => ({
    category: c,
    items: (groups.get(c) ?? []).sort((a, b) =>
      Number(a.checked) - Number(b.checked) || a.ingredient.localeCompare(b.ingredient),
    ),
  }));
}

export function groceryTotals(items: GroceryItem[]) {
  const total = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const remaining = items.filter((i) => !i.checked).reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const checkedCount = items.filter((i) => i.checked).length;
  return { total, remaining, checkedCount, count: items.length };
}

export function formatPrice(value: number, locale: Locale) {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat(locale === 'el' ? 'el-GR' : 'en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(n);
  } catch {
    return `€${n.toFixed(2)}`;
  }
}

export function groceryShareText(
  items: GroceryItem[],
  rangeLabel: string,
  totalLabel: string,
): string {
  const groups = groupGroceries(items);
  const lines: string[] = [`🧺 ${rangeLabel}`];
  for (const group of groups) {
    lines.push(`\n${CATEGORY_EMOJI[group.category]} ${group.category.toUpperCase()}`);
    for (const item of group.items) {
      const box = item.checked ? '[x]' : '[ ]';
      const price = item.price > 0
        ? ` — €${item.price.toFixed(2)}${item.priceStore ? ` @ ${item.priceStore}` : ''}`
        : '';
      lines.push(`${box} ${item.ingredient} — ${item.amount} ${item.unit}${price}`);
    }
  }
  const { total } = groceryTotals(items);
  lines.push(`\n${totalLabel}: €${total.toFixed(2)}`);
  return lines.join('\n');
}

export function parsePriceInput(raw: string): number {
  if (raw.trim().startsWith('-')) return 0;
  const normalized = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100) / 100;
}

// --- Store price options (memory across weeks) ---------------------------
// Options are keyed by lowercased "ingredient|unit" so they survive weekly
// regeneration and apply to both auto and manual rows with the same key.

export function priceOptionKey(ingredient: string, unit: string): string {
  return `${ingredient.trim().toLowerCase()}|${unit.trim().toLowerCase()}`;
}

export function normalizePriceOption(row: any): GroceryPriceOption {
  return {
    id: Number(row.id),
    itemKey: String(row.item_key ?? ''),
    store: String(row.store ?? ''),
    price: Number(row.price ?? 0) || 0,
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function getPriceOptions(
  db: SQLiteDatabase,
  ingredient: string,
  unit: string,
): Promise<GroceryPriceOption[]> {
  const rows = await db.getAllAsync<any>(
    'SELECT id,item_key,store,price,updated_at FROM grocery_price_options WHERE item_key=? ORDER BY updated_at DESC',
    priceOptionKey(ingredient, unit),
  );
  return rows.map(normalizePriceOption);
}

export async function upsertPriceOption(
  db: SQLiteDatabase,
  ingredient: string,
  unit: string,
  store: string,
  price: number,
): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO grocery_price_options (item_key,store,price,updated_at) VALUES (?,?,?,?) ' +
      'ON CONFLICT(item_key,store) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at',
    priceOptionKey(ingredient, unit),
    store.trim(),
    price,
    now,
  );
}

export async function deletePriceOption(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM grocery_price_options WHERE id=?', id);
}

/** Set the active price on a weekly grocery row and remember it in one call. */
export async function setActiveGroceryPrice(
  db: SQLiteDatabase,
  groceryId: number,
  ingredient: string,
  unit: string,
  store: string,
  price: number,
): Promise<void> {
  await db.runAsync('UPDATE groceries SET price=?,price_store=? WHERE id=?', price, store.trim(), groceryId);
  if (store.trim()) {
    await upsertPriceOption(db, ingredient, unit, store, price);
  }
}
