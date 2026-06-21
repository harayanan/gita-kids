// scripts/lib/qa-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVerdict } from './qa-check.mjs';

test('parses a fenced JSON verdict and computes overall_pass', () => {
  const v = parseVerdict('noise ```json\n{"cast_correct":true,"action_present":true,"no_extra_people":true,"no_text":true,"style_ok":true}\n``` trailing');
  assert.equal(v.overall_pass, true);
  assert.deepEqual(v.issues, []);
});

test('overall_pass=false collects failing keys as issues', () => {
  const v = parseVerdict('{"cast_correct":false,"action_present":true,"no_extra_people":false,"no_text":true,"style_ok":true}');
  assert.equal(v.overall_pass, false);
  assert.deepEqual(v.issues.sort(), ['cast_correct','no_extra_people']);
});
