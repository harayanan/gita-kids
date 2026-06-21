// scripts/lib/build-scene-prompt.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScenePrompt } from './build-scene-prompt.mjs';

const meta = { number: 1, name: 'Arjuna Vishada Yoga', folk_art_style: 'madhubani' };

test('specific mode includes exact cast + no-extra-people clause', () => {
  const p = buildScenePrompt({ verse: 1, relevance_mode: 'specific', cast: ['dhritarashtra','sanjaya'], action: 'King asks Sanjaya', setting: 'palace', props: ['throne'], notes: '' }, meta, 'madhubani');
  assert.match(p, /King asks Sanjaya/);
  assert.match(p, /No other people|no other people/);
  assert.match(p, /NO text|no text/i);
});

test('evocative mode drops the strict-cast clause', () => {
  const p = buildScenePrompt({ verse: 9, relevance_mode: 'evocative', cast: [], action: 'the sorrow of the coming war', setting: 'battlefield at dawn', props: [], notes: '' }, meta, 'madhubani');
  assert.doesNotMatch(p, /No other people/);
  assert.match(p, /sorrow of the coming war/);
});
