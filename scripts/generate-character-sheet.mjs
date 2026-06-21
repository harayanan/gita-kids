#!/usr/bin/env node
/**
 * generate-character-sheet.mjs
 *
 * Generates locked CHARACTER REFERENCE SHEETS (one figure each) used to keep
 * characters consistent across a chapter's illustrations. Candidates are written
 * to assets/character-refs/{style}/_candidates/{key}-{n}.png; the owner picks the
 * best and copies it to assets/character-refs/{style}/{key}.png.
 *
 * Usage:
 *   node scripts/generate-character-sheet.mjs --all --style madhubani --count 3
 *   node scripts/generate-character-sheet.mjs --key arjuna --style madhubani
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readApiKey, STYLE_PROMPTS, CHARACTER_REFS, buildColorPalette,
  generateImageWithRetry, saveImage,
} from './generate-illustration.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Generic warrior archetypes for the muster verses (minor named warriors).
const ARCHETYPES = {
  'warrior-pandava': 'A generic Pandava foot-warrior of ancient India: terracotta-and-gold armour over saffron cloth, a simple helm (no crown), holding a spear and a round shield, dignified and upright.',
  'warrior-kaurava': 'A generic Kaurava foot-warrior of ancient India: deep-indigo-and-gold armour over dark cloth, a simple helm (no crown), holding a spear and a round shield, stern and upright.',
};

const ALL_KEYS = [
  'dhritarashtra', 'sanjaya', 'duryodhana', 'bhishma', 'drona', 'arjuna', 'krishna',
  'warrior-pandava', 'warrior-kaurava',
];

function sheetPrompt(key, style) {
  const desc = CHARACTER_REFS[key] || ARCHETYPES[key];
  const s = STYLE_PROMPTS[style] || STYLE_PROMPTS.madhubani;
  return `Create a ${s.name} folk art CHARACTER REFERENCE SHEET for a children's Bhagavad Gita book: ONE single figure only, the definitive look for this character.

FIGURE (use these exact fixed attributes): ${desc}

${s.prompt}

${buildColorPalette(style)}

COMPOSITION: exactly one centered, full-body figure facing forward (or strict profile), filling most of the frame; plain decorative patterned background; NO other people, NO scene, NO props beyond what defines the character; NO text, NO labels, NO captions, NO color swatches.
FORMAT: square 1:1, a clean character reference.`;
}

function parseArgs(argv) {
  const a = argv.slice(2);
  const o = { all: false, key: null, style: 'madhubani', count: 3 };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--all') o.all = true;
    else if (a[i] === '--key') o.key = a[++i];
    else if (a[i] === '--style') o.style = a[++i];
    else if (a[i] === '--count') o.count = parseInt(a[++i], 10);
  }
  return o;
}

async function main() {
  const o = parseArgs(process.argv);
  const keys = o.all ? ALL_KEYS : o.key ? [o.key] : null;
  if (!keys) { console.error('Pass --all or --key <name>'); process.exit(1); }

  const apiKey = readApiKey();
  const outDir = join(ROOT, 'assets', 'character-refs', o.style, '_candidates');
  mkdirSync(outDir, { recursive: true });
  console.log(`Generating ${keys.length} characters x ${o.count} candidates (${o.style})`);

  for (const key of keys) {
    const prompt = sheetPrompt(key, o.style);
    for (let n = 1; n <= o.count; n++) {
      process.stdout.write(`  ${key} #${n} ... `);
      try {
        const { base64, mimeType } = await generateImageWithRetry([{ text: prompt }], apiKey);
        saveImage(base64, join(outDir, `${key}-${n}.png`), mimeType);
      } catch (e) {
        console.log(`FAILED: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.log(`\nDone -> ${outDir}`);
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
