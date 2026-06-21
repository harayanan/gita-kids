// scripts/lib/ref-images.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRefImageParts } from './ref-images.mjs';
test('returns inlineData parts only for cast keys with existing sheets', () => {
  const parts = loadRefImageParts(['arjuna','warrior-pandava'], 'madhubani');
  assert.ok(Array.isArray(parts));
  for (const p of parts) assert.ok(p.inlineData && p.inlineData.data);
});
