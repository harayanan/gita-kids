// scripts/lib/scene-briefs.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBrief, loadSceneBriefs, VALID_CAST, VALID_MODES } from './scene-briefs.mjs';

test('validateBrief accepts a well-formed specific brief', () => {
  const b = validateBrief({ verse: 1, relevance_mode: 'specific',
    cast: ['dhritarashtra', 'sanjaya'], action: 'King asks Sanjaya', setting: 'palace', props: [], notes: '' });
  assert.equal(b.verse, 1);
  assert.deepEqual(b.cast, ['dhritarashtra', 'sanjaya']);
});

test('validateBrief rejects an unknown relevance_mode', () => {
  assert.throws(() => validateBrief({ verse: 1, relevance_mode: 'fancy', cast: [], action: 'x', setting: 'y', props: [], notes: '' }), /relevance_mode/);
});

test('validateBrief rejects an unknown cast key', () => {
  assert.throws(() => validateBrief({ verse: 1, relevance_mode: 'specific', cast: ['gandalf'], action: 'x', setting: 'y', props: [], notes: '' }), /cast/);
});

test('loadSceneBriefs returns a Map keyed by verse', () => {
  const m = loadSceneBriefs('__fixture__');
  assert.ok(m instanceof Map);
  assert.equal(m.get(1).action, 'King asks Sanjaya what happened');
});

test('VALID_CAST contains the core 7 plus two archetypes', () => {
  assert.equal(VALID_CAST.length, 9);
  assert.ok(VALID_CAST.includes('krishna') && VALID_CAST.includes('warrior-kaurava'));
});
