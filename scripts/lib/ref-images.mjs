// scripts/lib/ref-images.mjs
//
// Loads character reference-sheet PNGs as Gemini inlineData parts. For each
// cast key, if `assets/character-refs/{style}/{key}.png` exists it is read and
// returned as `{ inlineData: { mimeType: 'image/png', data: <base64> } }`.
// Missing sheets are skipped with a console.warn (so the pipeline can run
// before any sheets have been generated — it simply returns []).

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

/**
 * @param {string[]} cast   Cast keys (e.g. ['arjuna', 'warrior-pandava']).
 * @param {string}   style  Folk-art style key (e.g. 'madhubani').
 * @returns {Array<{ inlineData: { mimeType: string, data: string } }>}
 */
export function loadRefImageParts(cast, style) {
  const parts = [];
  for (const key of cast || []) {
    const path = join(PROJECT_ROOT, 'assets', 'character-refs', style, `${key}.png`);
    if (!existsSync(path)) {
      console.warn(`  ⚠ no reference sheet for "${key}" (${style}): ${path}`);
      continue;
    }
    const data = readFileSync(path).toString('base64');
    parts.push({ inlineData: { mimeType: 'image/png', data } });
  }
  return parts;
}
