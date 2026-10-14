import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const {
  categorizeIngredient,
  formatPrice,
  groceryShareText,
  groceryTotals,
  groupGroceries,
  normalizeGroceryRow,
  parsePriceInput,
  priceOptionKey,
} = await import('../src/lib/groceries.ts');

const row = (over = {}) => ({
  id: 1,
  ingredient: 'Tomato',
  amount: 2,
  unit: 'pcs',
  checked: 0,
  price: 1.5,
  price_store: 'Market',
  category: 'produce',
  source: 'auto',
  ...over,
});

describe('categorizeIngredient', () => {
  it('matches keywords and falls back to other', () => {
    assert.equal(categorizeIngredient('fresh milk'), 'dairy');
    assert.equal(categorizeIngredient('ΚΑΦΕΣ espresso'), 'pantry');
    assert.equal(categorizeIngredient('mystery xyz item'), 'other');
  });
});

describe('normalizeGroceryRow', () => {
  it('coerces legacy rows and recovers categories', () => {
    const item = normalizeGroceryRow({ id: '7', ingredient: 'Milk', checked: '1' });
    assert.equal(item.id, 7);
    assert.equal(item.checked, true);
    assert.equal(item.category, 'dairy');
    assert.equal(item.priceStore, '');
    assert.equal(item.source, 'auto');
  });

  it('keeps valid categories and manual source', () => {
    const item = normalizeGroceryRow(row({ category: 'bakery', source: 'manual' }));
    assert.equal(item.category, 'bakery');
    assert.equal(item.source, 'manual');
  });
});

describe('groupGroceries', () => {
  it('groups in category order with unchecked first', () => {
    const groups = groupGroceries([
      normalizeGroceryRow(row({ id: 1, ingredient: 'Milk', category: 'dairy', checked: 1 })),
      normalizeGroceryRow(row({ id: 2, ingredient: 'Tomato', category: 'produce', checked: 0 })),
      normalizeGroceryRow(row({ id: 3, ingredient: 'Cheese', category: 'dairy', checked: 0 })),
    ]);
    assert.deepEqual(groups.map((g) => g.category), ['produce', 'dairy']);
    assert.deepEqual(groups[1].items.map((i) => i.ingredient), ['Cheese', 'Milk']);
  });
});

describe('groceryTotals', () => {
  it('sums totals, remaining, and checked counts', () => {
    const totals = groceryTotals([
      normalizeGroceryRow(row({ price: 2, checked: 1 })),
      normalizeGroceryRow(row({ price: 3, checked: 0 })),
    ]);
    assert.deepEqual(totals, { total: 5, remaining: 3, checkedCount: 1, count: 2 });
  });
});

describe('formatPrice', () => {
  it('formats euros in both locales', () => {
    assert.ok(formatPrice(2.5, 'en').includes('2.50'));
    assert.ok(formatPrice(2.5, 'el').includes('2,50'));
  });
});

describe('groceryShareText', () => {
  it('renders checkboxes, prices, and totals', () => {
    const text = groceryShareText(
      [normalizeGroceryRow(row({ checked: 1 }))],
      'Jan 5 – Jan 11',
      'Total',
    );
    assert.ok(text.includes('[x] Tomato'));
    assert.ok(text.includes('@ Market'));
    assert.ok(text.includes('Total: €1.50'));
  });
});

describe('parsePriceInput', () => {
  it('parses decimals, rejects negatives and garbage', () => {
    assert.equal(parsePriceInput('2,50'), 2.5);
    assert.equal(parsePriceInput('€ 3.456'), 3.46);
    assert.equal(parsePriceInput('-5'), 0);
    assert.equal(parsePriceInput('abc'), 0);
  });
});

describe('priceOptionKey', () => {
  it('lowercases and trims both parts', () => {
    assert.equal(priceOptionKey('  Tomato ', 'PCS'), 'tomato|pcs');
  });
});
