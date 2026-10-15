import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateGoals, parseNumber } from '../src/lib/nutrition.ts';

describe('parseNumber', () => {
  it('returns the fallback for empty or blank input (not 0)', () => {
    assert.equal(parseNumber('', 2000), 2000);
    assert.equal(parseNumber('   ', 2000), 2000);
    assert.equal(parseNumber(',', 15), 15);
  });

  it('parses plain, decimal-comma and noisy values', () => {
    assert.equal(parseNumber('1800'), 1800);
    assert.equal(parseNumber('82,4'), 82.4);
    assert.equal(parseNumber('70 g'), 70);
    assert.equal(parseNumber('-5'), -5);
  });

  it('falls back on garbage instead of NaN', () => {
    assert.equal(parseNumber('abc', 30), 30);
    assert.equal(parseNumber('12.3.4', 30), 30);
  });

  it('defaults the fallback to 0', () => {
    assert.equal(parseNumber(''), 0);
    assert.equal(parseNumber('120 kcal'), 120);
  });
});

describe('estimateGoals', () => {
  it('returns null when inputs are missing', () => {
    assert.equal(estimateGoals({ weight_kg: null, height_cm: 175, age: 30 }), null);
    assert.equal(estimateGoals({ weight_kg: 70, height_cm: null, age: 30 }), null);
    assert.equal(estimateGoals({ weight_kg: 70, height_cm: 175, age: null }), null);
  });

  it('rejects implausible inputs', () => {
    assert.equal(estimateGoals({ weight_kg: 20, height_cm: 175, age: 30 }), null);
    assert.equal(estimateGoals({ weight_kg: 70, height_cm: 100, age: 30 }), null);
    assert.equal(estimateGoals({ weight_kg: 70, height_cm: 175, age: 5 }), null);
  });

  it('suggests sane goals for a typical adult', () => {
    const goals = estimateGoals({ weight_kg: 70, height_cm: 175, age: 30 });
    assert.ok(goals);
    assert.ok(goals.calories >= 1400 && goals.calories <= 3500);
    assert.equal(goals.protein, Math.round(70 * 1.8));
    assert.ok(goals.fat > 0 && goals.carbs >= 50);
    // macro calories roughly match total (protein 4, carbs 4, fat 9)
    const macroKcal = goals.protein * 4 + goals.carbs * 4 + goals.fat * 9;
    assert.ok(Math.abs(macroKcal - goals.calories) < 60);
  });
});
