import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../i18n/index';

describe('i18n Translation Engine', () => {
  it('translates navigation keys correctly in English', () => {
    assert.equal(translate('en', 'home'), 'Home');
    assert.equal(translate('en', 'journey'), 'Journey');
    assert.equal(translate('en', 'temples'), 'Temples');
  });

  it('translates navigation keys correctly in Telugu', () => {
    assert.ok(translate('te', 'home'));
    assert.notEqual(translate('te', 'home'), 'Home');
    assert.ok(translate('te', 'journey'));
  });

  it('falls back to English when an unsupported language is provided', () => {
    // @ts-expect-error Testing invalid language fallback
    const result = translate('invalid_lang', 'home');
    assert.equal(result, 'Home');
  });
});
