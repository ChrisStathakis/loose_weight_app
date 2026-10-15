import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_REMINDER_HOUR,
  DAILY_REMINDER_MINUTE,
  REMINDER_IDENTIFIER,
  REMINDER_ON_KEY,
  buildReminderRequest,
  canUseNotifications,
  dailyTrigger,
} from '../src/lib/reminders.ts';

describe('dailyTrigger', () => {
  it('defaults to 20:00', () => {
    assert.deepEqual(dailyTrigger(), { type: 'daily', hour: 20, minute: 0 });
    assert.equal(DAILY_REMINDER_HOUR, 20);
    assert.equal(DAILY_REMINDER_MINUTE, 0);
  });

  it('clamps out-of-range components', () => {
    assert.deepEqual(dailyTrigger(25, -5), { type: 'daily', hour: 23, minute: 0 });
    assert.deepEqual(dailyTrigger(8, 30), { type: 'daily', hour: 8, minute: 30 });
  });
});

describe('buildReminderRequest', () => {
  it('uses a stable identifier so rescheduling replaces itself', () => {
    const a = buildReminderRequest('T', 'B');
    const b = buildReminderRequest('T2', 'B2');
    assert.equal(a.identifier, b.identifier);
    assert.equal(a.identifier, REMINDER_IDENTIFIER);
    assert.equal(a.trigger.type, 'daily');
    assert.equal(REMINDER_ON_KEY, 'reminder_on');
  });
});

describe('canUseNotifications', () => {
  it('skips loading expo-notifications in Expo Go on Android', () => {
    // Loading the package there throws from module init since SDK 53, and
    // Metro reports that throw even when the require is wrapped in try/catch.
    assert.equal(canUseNotifications('android', true), false);
  });

  it('allows every other environment, including local reminders in builds', () => {
    assert.equal(canUseNotifications('android', false), true); // dev/production build
    assert.equal(canUseNotifications('ios', true), true); // Expo Go iOS loads fine
    assert.equal(canUseNotifications('ios', false), true);
    assert.equal(canUseNotifications('web', true), true);
  });
});
