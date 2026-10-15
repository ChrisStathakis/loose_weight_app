import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { addDaysKey, localDateKey, startOfWeekKey, weekKeys } from '../src/lib/dates.ts';

describe('localDateKey', () => {
  it('formats a local date as YYYY-MM-DD without UTC shifting', () => {
    assert.equal(localDateKey(new Date(2026, 0, 5)), '2026-01-05');
    assert.equal(localDateKey(new Date(2026, 9, 15)), '2026-10-15');
    assert.match(localDateKey(), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('addDaysKey', () => {
  it('crosses month, year and leap boundaries', () => {
    assert.equal(addDaysKey('2026-01-31', 1), '2026-02-01');
    assert.equal(addDaysKey('2025-12-31', 1), '2026-01-01');
    assert.equal(addDaysKey('2026-03-01', -1), '2026-02-28');
    assert.equal(addDaysKey('2024-02-28', 1), '2024-02-29');
    assert.equal(addDaysKey('2026-10-15', 0), '2026-10-15');
  });
});

describe('startOfWeekKey', () => {
  it('snaps to Monday for every weekday', () => {
    assert.equal(startOfWeekKey('2026-10-12'), '2026-10-12'); // Monday stays
    assert.equal(startOfWeekKey('2026-10-15'), '2026-10-12'); // Thursday
    assert.equal(startOfWeekKey('2026-10-18'), '2026-10-12'); // Sunday → previous Monday
  });

  it('crosses year boundaries', () => {
    assert.equal(startOfWeekKey('2026-01-01'), '2025-12-29');
  });
});

describe('weekKeys', () => {
  it('returns seven consecutive Monday → Sunday keys', () => {
    assert.deepEqual(weekKeys('2026-10-15'), [
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ]);
  });

  it('wraps over month and year boundaries', () => {
    assert.deepEqual(weekKeys('2026-01-01'), [
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ]);
  });

  it('always starts on a Monday and ends on a Sunday', () => {
    for (const key of ['2026-02-28', '2026-06-07', '2026-12-31']) {
      const days = weekKeys(key);
      assert.equal(days.length, 7);
      assert.equal(new Date(`${days[0]}T12:00:00`).getDay(), 1);
      assert.equal(new Date(`${days[6]}T12:00:00`).getDay(), 0);
    }
  });
});
