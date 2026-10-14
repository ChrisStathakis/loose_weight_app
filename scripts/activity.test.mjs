import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { estimateCaloriesBurned, estimateForWorkout, WORKOUT_METS, WORKOUT_EMOJI, WORKOUT_TYPES } = await import('../src/lib/activity.ts');

describe('estimateCaloriesBurned', () => {
  it('applies MET * kg * hours', () => {
    assert.equal(estimateCaloriesBurned(5, 70, 60), 350);
  });

  it('returns zero for missing or non-positive inputs', () => {
    assert.equal(estimateCaloriesBurned(5, 0, 30), 0);
    assert.equal(estimateCaloriesBurned(5, 70, -10), 0);
    assert.equal(estimateCaloriesBurned(NaN, 70, 30), 0);
  });
});

describe('estimateForWorkout', () => {
  it('rounds the MET estimate for a walk', () => {
    // 3.5 * 70kg * 0.5h = 122.5 -> 123
    assert.equal(estimateForWorkout('walk', 70, 30), 123);
  });

  it('covers every workout type with a MET and emoji', () => {
    assert.equal(WORKOUT_TYPES.length, 14);
    for (const t of WORKOUT_TYPES) {
      assert.ok(WORKOUT_METS[t] > 0, t);
      assert.ok(WORKOUT_EMOJI[t], t);
    }
  });
});
