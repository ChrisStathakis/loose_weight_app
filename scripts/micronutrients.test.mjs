import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NUTRIENTS, mapMicros, microLabel, scaleMicros } from '../src/lib/micronutrients.ts';

describe('NUTRIENTS catalog', () => {
  it('covers vitamins and minerals with units and both locales', () => {
    assert.ok(NUTRIENTS.length >= 15);
    const ids = NUTRIENTS.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const n of NUTRIENTS) {
      assert.ok(n.unit.length > 0, n.id);
      assert.ok(n.label_en.length > 0, n.id);
      assert.ok(n.label_el.length > 0, n.id);
    }
    assert.ok(ids.includes('vitamin-c'));
    assert.ok(ids.includes('iron'));
  });
});

describe('mapMicros', () => {
  it('extracts per-100g values and honors unit overrides', () => {
    const out = mapMicros({
      'vitamin-c_100g': 12,
      'vitamin-c_unit': 'mg',
      'iron_100g': '2.5',
      'energy-kcal_100g': 100,
    });
    assert.deepEqual(out, [
      { nutrient: 'vitamin-c', amount: 12, unit: 'mg' },
      { nutrient: 'iron', amount: 2.5, unit: 'mg' },
    ]);
  });

  it('skips missing, zero, and non-numeric values', () => {
    assert.deepEqual(mapMicros({}), []);
    assert.deepEqual(mapMicros(null), []);
    assert.deepEqual(mapMicros({ 'vitamin-c_100g': 0, 'zinc_100g': 'n/a' }), []);
  });
});

describe('scaleMicros', () => {
  it('scales portions linearly', () => {
    assert.deepEqual(
      scaleMicros([{ nutrient: 'iron', amount: 2, unit: 'mg' }], 50),
      [{ nutrient: 'iron', amount: 1, unit: 'mg' }],
    );
  });
});

describe('microLabel', () => {
  it('localizes known nutrients and falls back to the id', () => {
    assert.equal(microLabel('iron', 'el'), 'Σίδηρος');
    assert.equal(microLabel('nope', 'en'), 'nope');
  });
});
