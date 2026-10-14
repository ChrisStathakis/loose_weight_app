import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./ts-hook.mjs', import.meta.url);
const { dateKey, dateLabel } = await import('../src/lib/db.ts');

describe('dateKey', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
    assert.match(dateKey(), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('dateLabel', () => {
  it('labels valid dates with weekday and month', () => {
    const label = dateLabel('2026-01-05', 'en');
    assert.ok(label.includes('Jan') && label.includes('5'));
    assert.ok(dateLabel('2026-01-05', 'el').length > 0);
  });

  it('falls back to the raw string for corrupt dates instead of throwing', () => {
    assert.equal(dateLabel('not-a-date', 'en'), 'not-a-date');
    assert.equal(dateLabel('', 'el'), '');
  });
});
