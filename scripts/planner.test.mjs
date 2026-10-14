import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { containsExcluded, containsExcludedFood, eligibleRecipes } = await import('../src/lib/planner.ts');

const food = (over = {}) => ({
  id: 'f1',
  name_en: 'Peanut butter',
  name_el: 'Φυστικοβούτυρο',
  brand: 'Acme',
  calories_per_100g: 600,
  protein_per_100g: 25,
  carbs_per_100g: 15,
  fat_per_100g: 50,
  source: 'Custom',
  ...over,
});

const recipe = (over = {}) => ({
  id: 'r1',
  name_en: 'Mushroom risotto',
  name_el: 'Ριζότο μανιταριών',
  diet: 'vegetarian',
  ingredients: [{ name_en: 'mushrooms', name_el: 'μανιτάρια', amount: 100, unit: 'g' }],
  calories: 400,
  protein: 12,
  carbs: 60,
  fat: 10,
  servings: 1,
  ...over,
});

describe('excluded filters', () => {
  it('matches foods by name or brand, case-insensitive', () => {
    assert.equal(containsExcludedFood(food(), ['peanut']), true);
    assert.equal(containsExcludedFood(food(), ['ACME']), true);
    assert.equal(containsExcludedFood(food(), ['  ']), false);
    assert.equal(containsExcludedFood(food(), ['oats']), false);
  });

  it('matches recipes by name or ingredient', () => {
    assert.equal(containsExcluded(recipe(), ['mushroom']), true);
    assert.equal(containsExcluded(recipe(), ['μανιτάρια']), true);
    assert.equal(containsExcluded(recipe(), ['risotto']), true);
    assert.equal(containsExcluded(recipe(), ['chicken']), false);
  });

  it('eligibleRecipes drops excluded recipes but keeps diet match', () => {
    const ok = recipe({ id: 'ok' });
    const bad = recipe({ id: 'bad' });
    const out = eligibleRecipes([ok, bad], 'vegetarian', ['risotto']);
    assert.deepEqual(out.map((r) => r.id), []);
    const kept = eligibleRecipes([ok], 'vegetarian', ['chicken']);
    assert.deepEqual(kept.map((r) => r.id), ['ok']);
  });
});
