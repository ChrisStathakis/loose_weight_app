import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { calcStreak, foodEmoji, greeting } = await import('../src/lib/habits.ts');

describe('calcStreak', () => {
  it('counts consecutive days including today', () => {
    assert.deepEqual(calcStreak(['2026-01-03', '2026-01-04', '2026-01-05'], '2026-01-05'), { current: 3, best: 3 });
  });

  it('stays alive when today is missing but yesterday is logged', () => {
    assert.deepEqual(calcStreak(['2026-01-04'], '2026-01-05'), { current: 1, best: 1 });
  });

  it('breaks on gaps and reports the longest run as best', () => {
    assert.deepEqual(calcStreak(['2026-01-01', '2026-01-02', '2026-01-05'], '2026-01-05'), { current: 1, best: 2 });
  });

  it('returns zeros for no history', () => {
    assert.deepEqual(calcStreak([], '2026-01-05'), { current: 0, best: 0 });
  });
});

describe('greeting', () => {
  it('switches by hour in both locales', () => {
    assert.equal(greeting(10, 'en'), 'Good morning');
    assert.equal(greeting(11, 'en'), 'Good afternoon');
    assert.equal(greeting(17, 'en'), 'Good evening');
    assert.ok(greeting(9, 'el').length > 0);
  });
});

describe('foodEmoji', () => {
  it('matches known foods and stays stable on unknowns', () => {
    assert.equal(foodEmoji('Banana'), '🍌');
    assert.equal(foodEmoji('Egg'), '🍳');
    assert.equal(foodEmoji('Banana', 'Chiquita'), '🍌');
    const a = foodEmoji('mystery xyz food');
    assert.equal(foodEmoji('mystery xyz food'), a);
  });
});
