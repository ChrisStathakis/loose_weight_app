import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DIETS, normalizeDiet } from '../src/lib/diets.ts';

describe('diets', () => {
  it('lists nine eating styles', () => {
    assert.equal(DIETS.length, 9);
    assert.ok(DIETS.includes('keto'));
  });

  it('passes known diets through and falls back to balanced', () => {
    assert.equal(normalizeDiet('vegan'), 'vegan');
    assert.equal(normalizeDiet('paleo'), 'paleo');
    assert.equal(normalizeDiet('carnivore'), 'balanced');
    assert.equal(normalizeDiet(undefined), 'balanced');
    assert.equal(normalizeDiet(null), 'balanced');
  });
});
