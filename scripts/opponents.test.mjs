import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeBossHp } from '../src/lib/opponents.ts';

describe('computeBossHp', () => {
  it('leaves a fresh week at full HP', () => {
    assert.deepEqual(
      computeBossHp({ loggedDays: 0, goalHits: 0, proteinHits: 0, waterGoalHits: 0, streak: 0 }),
      { hp: 100, maxHp: 100, damageDealt: 0, defeated: false },
    );
  });

  it('caps each damage source', () => {
    // 10 logged days would deal 80 uncapped; cap holds it at 40.
    const capped = computeBossHp({ loggedDays: 10, goalHits: 0, proteinHits: 0, waterGoalHits: 0, streak: 0 });
    assert.equal(capped.damageDealt, 40);
    assert.equal(capped.hp, 60);
  });

  it('defeats the boss on a perfect week without going negative', () => {
    const boss = computeBossHp({ loggedDays: 7, goalHits: 7, proteinHits: 7, waterGoalHits: 7, streak: 7 });
    assert.equal(boss.defeated, true);
    assert.equal(boss.hp, 0);
  });
});
