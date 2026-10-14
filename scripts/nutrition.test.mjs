import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateGoals } from '../src/lib/nutrition.ts';

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
