import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { mapProduct, searchFoodsOnline, lookupBarcode, OffError } = await import('../src/lib/foodProviders.ts');

const realFetch = globalThis.fetch;

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('mapProduct joins brands arrays (Search-a-licious shape)', () => {
  const food = mapProduct(
    {
      code: '5201704054183',
      product_name: 'Feta',
      brands: ['Kolios', 'Extra'],
      nutriments: { 'energy-kcal_100g': 275, proteins_100g: 16, carbohydrates_100g: 1, fat_100g: 23 },
    },
    0,
    'en',
  );
  assert.ok(food);
  assert.equal(food.id, 'off-5201704054183');
  assert.equal(food.brand, 'Kolios, Extra');
  assert.equal(food.barcode, '5201704054183');
  assert.equal(food.calories_per_100g, 275);
});

test('mapProduct keeps string brands and Greek fallback', () => {
  const food = mapProduct(
    {
      code: '123',
      product_name: 'Queso feta',
      product_name_en: 'FETA',
      product_name_el: 'Φέτα',
      brands: 'Hacendado',
      nutriments: {},
    },
    0,
    'el',
  );
  assert.ok(food);
  assert.equal(food.brand, 'Hacendado');
  assert.equal(food.name_el, 'Φέτα');
  assert.equal(food.name_en, 'FETA');
});

test('mapProduct returns null without any name', () => {
  assert.equal(mapProduct({ code: '1', brands: 'x', nutriments: {} }, 0, 'en'), null);
  assert.equal(mapProduct(null, 0, 'en'), null);
});

test('searchFoodsOnline merges both endpoints and dedupes by barcode', async () => {
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('search.openfoodfacts.org')) {
      return jsonResponse({
        hits: [
          { code: 'A', product_name: 'Feta', brands: ['Kolios'], nutriments: { 'energy-kcal_100g': 200 } },
          { code: 'B', product_name: 'Feta light', brands: 'BrandB', nutriments: {} },
        ],
      });
    }
    return jsonResponse({
      products: [
        { code: 'B', product_name: 'Feta light', brands: 'BrandB', nutriments: {} },
        { code: 'C', product_name: 'Feta PDO', brands: 'BrandC', nutriments: {} },
      ],
    });
  };
  try {
    const foods = await searchFoodsOnline('feta', 'en');
    assert.deepEqual(foods.map((f) => f.barcode), ['A', 'B', 'C']);
    assert.equal(foods[0].brand, 'Kolios');
    assert.ok(calls.some((u) => u.includes('search.openfoodfacts.org')));
    assert.ok(calls.some((u) => u.includes('cgi/search.pl')));
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('searchFoodsOnline survives one endpoint failing', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('search.openfoodfacts.org')) throw new Error('down');
    return jsonResponse({ products: [{ code: 'C', product_name: 'Feta PDO', brands: 'BrandC', nutriments: {} }] });
  };
  try {
    const foods = await searchFoodsOnline('feta', 'el');
    assert.deepEqual(foods.map((f) => f.barcode), ['C']);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('searchFoodsOnline throws typed error when both endpoints fail', async () => {
  globalThis.fetch = async () => new Response('limited', { status: 429 });
  try {
    await assert.rejects(() => searchFoodsOnline('feta', 'en'), (e) => e instanceof OffError && e.code === 'OFF_RATE_LIMITED');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('searchFoodsOnline empty query never hits network', async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    throw new Error('should not fetch');
  };
  try {
    assert.deepEqual(await searchFoodsOnline('   ', 'en'), []);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('lookupBarcode maps product, null on unknown, typed error on 429', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('111')) return jsonResponse({ status: 1, product: { code: '111', product_name: 'Milk', brands: 'B', nutriments: {} } });
    if (String(url).includes('222')) return jsonResponse({ status: 0 });
    return new Response('limited', { status: 429 });
  };
  try {
    const found = await lookupBarcode('111', 'en');
    assert.ok(found);
    assert.equal(found.barcode, '111');
    assert.equal(await lookupBarcode('222', 'en'), null);
    await assert.rejects(() => lookupBarcode('333', 'en'), (e) => e instanceof OffError && e.code === 'OFF_RATE_LIMITED');
  } finally {
    globalThis.fetch = realFetch;
  }
});
