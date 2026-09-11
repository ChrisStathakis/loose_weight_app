import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEl, matchesFood, filterFoods, debounceSearch } from '../src/lib/search.ts';

const feta = {
  id: 'feta', name_en: 'Feta cheese', name_el: 'Φέτα', brand: null,
  calories_per_100g: 264, protein_per_100g: 14, carbs_per_100g: 4, fat_per_100g: 21, source: 'seed',
};
const yogurt = {
  id: 'yogurt', name_en: 'Greek yogurt 2%', name_el: 'Γιαούρτι 2%', brand: null,
  calories_per_100g: 73, protein_per_100g: 10, carbs_per_100g: 4, fat_per_100g: 2, source: 'seed',
};

test('normalizeEl strips accents and final sigma', () => {
  assert.equal(normalizeEl('Φέτα'), 'φετα');
  assert.equal(normalizeEl('ΦΕΤΑ'), 'φετα');
  assert.equal(normalizeEl('Γιαούρτι'), 'γιαουρτι');
  assert.equal(normalizeEl('Οδυσσέας ς'), 'οδυσσεασ σ');
  assert.equal(normalizeEl('  Feta  '), 'feta');
});

test('matchesFood is accent/case-insensitive EL + EN', () => {
  assert.equal(matchesFood(feta, 'φετα'), true);
  assert.equal(matchesFood(feta, 'ΦΕΤΑ'), true);
  assert.equal(matchesFood(feta, 'Φέτα'), true);
  assert.equal(matchesFood(feta, 'feta'), true);
  assert.equal(matchesFood(feta, 'FETA'), true);
  assert.equal(matchesFood(yogurt, 'γιαουρτι'), true);
  assert.equal(matchesFood(yogurt, 'yogurt'), true);
  assert.equal(matchesFood(feta, 'yogurt'), false);
  assert.equal(matchesFood(yogurt, 'GREEK YOGURT'), true);
  assert.equal(matchesFood(yogurt, 'γιαούρτι 2%'), true);
  assert.equal(matchesFood(yogurt, 'ΓΙΑΟΥΡΤΙ'), true);
});

test('filterFoods respects limit and empty query', () => {
  const all = [feta, yogurt];
  assert.deepEqual(filterFoods(all, '', 30).map((f) => f.id), ['feta', 'yogurt']);
  assert.deepEqual(filterFoods(all, 'φετα', 30).map((f) => f.id), ['feta']);
  assert.deepEqual(filterFoods(all, 'γιαουρτι', 1).map((f) => f.id), ['yogurt']);
});

test('debounceSearch only fires last value', async () => {
  const calls = [];
  const d = debounceSearch((v) => calls.push(v), 30);
  d.call('f');
  d.call('fe');
  d.call('feta');
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(calls, ['feta']);
  d.cancel();
});

test('stale request guard drops older SQLite response', async () => {
  // mirrors add-food localSearch request-id guard
  let applied = null;
  let req = 0;
  const run = async (value, delay) => {
    const mine = ++req;
    await new Promise((r) => setTimeout(r, delay));
    if (mine !== req) return; // stale
    applied = value;
  };
  const slow = run('', 40); // unfiltered initial fetch, slow
  const fast = run('feta', 5); // user typing, fast
  await Promise.all([slow, fast]);
  assert.equal(applied, 'feta');
});

test('isolated header: rapid keys -> single applied full word, never repeated first char', async () => {
  // Simulates memo SearchHeader: internal setText per key (no parent render),
  // single debounced onText to parent. Typing "feta" must apply ["feta"],
  // never ["f","ff","ffff"] / ["d","dd","dddd"].
  const parentApplied = [];
  const d = debounceSearch((v) => parentApplied.push(v), 30);
  let headerText = '';
  for (const ch of ['f', 'e', 't', 'a']) {
    headerText += ch; // header-local only
    d.call(headerText);
  }
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(parentApplied, ['feta']);
  assert.equal(headerText, 'feta');
  d.cancel();
});

test('isolated header Greek: rapid keys keep full word', async () => {
  const parentApplied = [];
  const d = debounceSearch((v) => parentApplied.push(v), 30);
  let headerText = '';
  for (const ch of ['φ', 'ε', 'τ', 'α']) {
    headerText += ch;
    d.call(headerText);
  }
  await new Promise((r) => setTimeout(r, 60));
  assert.deepEqual(parentApplied, ['φετα']);
  assert.ok(matchesFood(feta, parentApplied[0]));
  d.cancel();
});
