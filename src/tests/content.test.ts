import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AYYAPPA_POOJA_VIDHANAM } from '../data/poojaVidhanam';
import { AYYAPPA_JOURNEY } from '../data/journeyCheckpoints';

describe('Ayyappa Pooja Vidhanam & Bilingual Content', () => {
  it('includes eating/biksha mantras, rules, sharanu gosha, naivedyam/aarti, and 8-verse harivarasanam', () => {
    const categories = new Set(AYYAPPA_POOJA_VIDHANAM.map((s) => s.category));
    assert.ok(categories.has('instructions'), 'Missing instructions section');
    assert.ok(categories.has('bhojana_mantras'), 'Missing eating/bhojana mantras section');
    assert.ok(categories.has('sharanu_gosha'), 'Missing sharanu gosha section');
    assert.ok(categories.has('naivedyam_aarti'), 'Missing naivedyam & aarti section');
    assert.ok(categories.has('harivarasanam'), 'Missing harivarasanam section');

    const harivarasanam = AYYAPPA_POOJA_VIDHANAM.find((s) => s.category === 'harivarasanam');
    assert.ok(harivarasanam && harivarasanam.mantras.length >= 8, 'Harivarasanam should have all 8 verses + closing');
  });

  it('provides both non-empty Telugu and English text for every mantra entry', () => {
    for (const section of AYYAPPA_POOJA_VIDHANAM) {
      assert.ok(section.title.trim().length > 0, `Empty title in ${section.id}`);
      assert.ok(section.titleTe.trim().length > 0, `Empty titleTe in ${section.id}`);
      for (const m of section.mantras) {
        assert.ok(m.telugu.trim().length > 0, `Empty telugu mantra in ${section.id}`);
        assert.ok(m.english.trim().length > 0, `Empty english mantra in ${section.id}`);
      }
    }
  });

  it('defines bilingual names and guides for all 15 Ayyappa journey checkpoints', () => {
    assert.equal(AYYAPPA_JOURNEY.length, 15);
    for (const cp of AYYAPPA_JOURNEY) {
      assert.ok(cp.name.trim().length > 0);
      assert.ok(cp.titleTe.trim().length > 0);
      assert.ok(cp.shortName.trim().length > 0);
      assert.ok(cp.shortNameTe.trim().length > 0);
    }
  });
});
