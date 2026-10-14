import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/lib/i18n.ts';

test('en and el share identical translation keys', () => {
  const enKeys = Object.keys(translations.en).sort();
  const elKeys = Object.keys(translations.el).sort();
  assert.deepEqual(elKeys, enKeys);
});

test('no empty translation strings', () => {
  for (const [locale, dict] of Object.entries(translations)) {
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(typeof value === 'string' && value.length > 0, `${locale}.${key} must be a non-empty string`);
    }
  }
});
