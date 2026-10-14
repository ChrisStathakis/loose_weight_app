import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { levelForXp, xpForEvent } from '../src/lib/gamification.ts';

describe('xpForEvent', () => {
  it('pays known events and defaults unknowns to 5', () => {
    assert.equal(xpForEvent('log-food'), 10);
    assert.equal(xpForEvent('goal-hit'), 50);
    assert.equal(xpForEvent('boss-slay'), 120);
    assert.equal(xpForEvent('workout-log'), 15);
    assert.equal(xpForEvent('no-such-event'), 5);
  });
});

describe('levelForXp', () => {
  it('starts at level 1 and advances on square boundaries', () => {
    assert.deepEqual(levelForXp(0), { level: 1, into: 0, needed: 100 });
    assert.deepEqual(levelForXp(99), { level: 1, into: 99, needed: 100 });
    assert.deepEqual(levelForXp(100), { level: 2, into: 0, needed: 300 });
    assert.deepEqual(levelForXp(400), { level: 3, into: 0, needed: 500 });
  });

  it('clamps negative xp to zero progress', () => {
    assert.deepEqual(levelForXp(-50), { level: 1, into: 0, needed: 100 });
  });
});
