#!/usr/bin/env node
/**
 * generate-chapter.mjs
 *
 * Generate a chapter's verse illustrations from its scene briefs, conditioned on
 * the locked character reference sheets (multi-part request) so characters stay
 * consistent. Writes to public/illustrations/{slug}/{verse}.png.
 *
 * Usage:
 *   node scripts/generate-chapter.mjs --chapter 01-arjuna-vishada-yoga --style pichwai-narrative --refstyle pichwai-narrative --all
 *   node scripts/generate-chapter.mjs --chapter 01-arjuna-vishada-yoga --batch 1-5
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { loadSceneBriefs } from './lib/scene-briefs.mjs';
import { buildScenePrompt } from './lib/build-scene-prompt.mjs';
import { loadRefImageParts } from './lib/ref-images.mjs';
import { readApiKey, generateImageWithRetry, saveImage } from './generate-illustration.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const a = argv.slice(2);
  const o = { chapter: '01-arjuna-vishada-yoga', style: 'pichwai-narrative', refstyle: null, batch: null, all: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--chapter') o.chapter = a[++i];
    else if (a[i] === '--style') o.style = a[++i];
    else if (a[i] === '--refstyle') o.refstyle = a[++i];
    else if (a[i] === '--batch') o.batch = a[++i];
    else if (a[i] === '--all') o.all = true;
  }
  o.refstyle = o.refstyle || o.style;
  return o;
}

function readMeta(slug) {
  const raw = readFileSync(join(ROOT, 'content', 'chapters', slug, 'meta.yaml'), 'utf-8');
  const get = (f) => (raw.match(new RegExp(`^${f}:\\s*(.+)$`, 'm')) || [])[1]?.trim();
  return { number: get('number'), name: get('name'), folk_art_style: get('folk_art_style') };
}

async function main() {
  const o = parseArgs(process.argv);
  const briefs = loadSceneBriefs(o.chapter);
  const meta = readMeta(o.chapter);
  const outDir = join(ROOT, 'public', 'illustrations', o.chapter);
  const apiKey = readApiKey();

  let verses;
  if (o.batch) {
    const m = o.batch.match(/^(\d+)-(\d+)$/);
    verses = []; for (let v = +m[1]; v <= +m[2]; v++) verses.push(v);
  } else if (o.all) {
    verses = [...briefs.keys()].sort((a, b) => a - b);
  } else { console.error('Pass --all or --batch a-b'); process.exit(1); }

  console.log(`Chapter ${o.chapter} | style ${o.style} | refs ${o.refstyle} | ${verses.length} verses`);
  const results = [];
  for (const v of verses) {
    const brief = briefs.get(v);
    if (!brief) { console.log(`  v${v}: no brief, skip`); continue; }
    const padded = String(v).padStart(3, '0');
    const prompt = buildScenePrompt(brief, meta, o.style);
    const refParts = loadRefImageParts(brief.cast, o.refstyle);
    process.stdout.write(`  v${v} [${brief.relevance_mode}] cast=${brief.cast.join(',') || '-'} refs=${refParts.length} ... `);
    try {
      const { base64, mimeType } = await generateImageWithRetry([...refParts, { text: prompt }], apiKey);
      saveImage(base64, join(outDir, `${padded}.png`), mimeType);
      results.push({ v, ok: true });
    } catch (e) { console.log(`FAILED: ${e.message}`); results.push({ v, ok: false, err: e.message }); }
    await new Promise((r) => setTimeout(r, 3000));
  }
  const ok = results.filter((r) => r.ok).length;
  console.log(`\nDone: ${ok}/${results.length} generated -> ${outDir}`);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) console.log('Failed verses:', fails.map((f) => f.v).join(', '));
}

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
