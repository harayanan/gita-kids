#!/usr/bin/env node
/**
 * generate-samples.mjs
 *
 * Generates ONE sample illustration for each diversification art style,
 * all from the SAME canonical scene (Krishna teaching Arjuna in the chariot
 * between the two armies) so the comparison is style-only, not subject.
 *
 * Output: public/illustrations/_samples/<style>.png  +  an index.html contact sheet.
 *
 * Usage:
 *   node scripts/generate-samples.mjs               # all new styles
 *   node scripts/generate-samples.mjs --only phad,tanjore
 *   node scripts/generate-samples.mjs --dry-run
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  STYLE_PROMPTS,
  CHARACTER_REFS,
  buildColorPalette,
  generateImageWithRetry,
  saveImage,
  readApiKey,
} from './generate-illustration.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUT_DIR = join(PROJECT_ROOT, 'public', 'illustrations', '_samples');

// The diversification styles (everything beyond the original six).
const NEW_STYLES = [
  'kerala-mural', 'tanjore', 'mysore', 'phad', 'pahari', 'mewar',
  'cheriyal', 'kalighat', 'sanjhi', 'tholu-bommalata', 'saura', 'basohli',
  'tomassetti',
];

// One canonical scene for every sample — both protagonists present so their
// rendering can be judged across styles.
const SCENE = `Chapter 2 (The Yoga of Wisdom) of the Bhagavad Gita.
Speaker: Krishna.
Scene: On the Kurukshetra battlefield, between the two great gathered armies, Lord Krishna stands at the front of the chariot as Arjuna's charioteer and turns back to teach the seated warrior Arjuna, who has lowered his bow in doubt. War conches, banners, horses, and ranks of warriors fill the field behind them.
Story theme: "Krishna lifts Arjuna's despair with the first teaching"

Illustrate the MYTHOLOGICAL scene — divine figures, ancient India setting, the chariot on the sacred battlefield. Do NOT illustrate any modern analogy or contemporary scene.`;

function buildSamplePrompt(styleKey) {
  const styleConfig = STYLE_PROMPTS[styleKey];
  if (!styleConfig) throw new Error(`Unknown style: ${styleKey}`);

  const characterBlock = `\nCHARACTERS (use these exact visual attributes):\n- ${CHARACTER_REFS.krishna}\n- ${CHARACTER_REFS.arjuna}\n`;

  const krishnaProminence = `\nCOMPOSITION (CRITICAL — Krishna's prominence):
- Krishna is the Lord (Bhagavan) giving the teaching; he MUST be the visually dominant figure.
- Render Krishna at least as tall as — and ideally taller and larger than — Arjuna, never smaller.
- This holds even though Krishna stands as the charioteer and Arjuna is seated: scale Krishna up so he is clearly the commanding presence, with a radiant golden halo, drawing the eye first.
`;

  const colorPalette = buildColorPalette(styleKey);
  const medium = styleConfig.fineArt ? 'classical oil-painting style' : 'folk art style';
  const borderLine = styleConfig.fineArt
    ? '- Composition is a borderless cinematic canvas — NO decorative frame or folk border'
    : '- Border must be dense with traditional motifs matching this style';

  return `Create a ${styleConfig.name} ${medium} illustration for a children's book about the Bhagavad Gita.

SCENE:
${SCENE}
${characterBlock}${krishnaProminence}
${styleConfig.prompt}

${colorPalette}

CRITICAL — NO TEXT IN THE IMAGE:
- Do NOT include any words, letters, labels, captions, titles, chapter numbers, or color swatches
- The image must contain ONLY the illustration — pure artwork with no text whatsoever

SERIES COHESION:
- Use the style of classic ${styleConfig.name} paintings as your reference
${borderLine}

FORMAT: Landscape orientation 16:9 aspect ratio (1408×768 px), suitable for full-width web display in a children's book.`.trim();
}

function writeContactSheet(styles) {
  const cards = styles.map(s => {
    const cfg = STYLE_PROMPTS[s];
    return `      <figure>
        <img src="./${s}.png" alt="${cfg?.name || s}" loading="lazy" />
        <figcaption><strong>${cfg?.name || s}</strong><br><code>${s}</code></figcaption>
      </figure>`;
  }).join('\n');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Gita Kids — new art style samples</title>
<style>
  body { font-family: system-ui, sans-serif; background:#FDF6E3; color:#2b2b2b; margin:0; padding:2rem; }
  h1 { font-size:1.5rem; }
  p.note { color:#6b6b6b; max-width:60ch; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(420px, 1fr)); gap:1.5rem; margin-top:1.5rem; }
  figure { margin:0; background:#fff; border:1px solid #e6dcc4; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.06); }
  figure img { display:block; width:100%; aspect-ratio:16/9; object-fit:cover; background:#eee; }
  figcaption { padding:.6rem .8rem; font-size:.9rem; }
  figcaption code { color:#888; font-size:.8rem; }
</style></head><body>
  <h1>New Indian art styles — one sample each</h1>
  <p class="note">Same canonical scene (Krishna teaching Arjuna on the chariot) rendered in each candidate style, so you are comparing the style and not the subject. Pick which forms to bring into the book.</p>
  <div class="grid">
${cards}
  </div>
</body></html>`;
  const p = join(OUT_DIR, 'index.html');
  writeFileSync(p, html);
  console.log(`\nContact sheet: ${p}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const onlyArg = args.find(a => a.startsWith('--only'));
  let styles = NEW_STYLES;
  if (onlyArg) {
    const val = onlyArg.includes('=') ? onlyArg.split('=')[1] : args[args.indexOf(onlyArg) + 1];
    styles = val.split(',').map(s => s.trim()).filter(Boolean);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const apiKey = dryRun ? null : readApiKey();

  const results = [];
  for (const style of styles) {
    const outputPath = join(OUT_DIR, `${style}.png`);
    console.log(`\n=== Sample: ${style} (${STYLE_PROMPTS[style]?.name}) ===`);
    const prompt = buildSamplePrompt(style);

    if (dryRun) {
      console.log(prompt);
      results.push({ style, dryRun: true });
      continue;
    }
    try {
      const start = Date.now();
      const { base64, mimeType, model } = await generateImageWithRetry([{ text: prompt }], apiKey);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      saveImage(base64, outputPath, mimeType);
      console.log(`  ✓ ${style} via ${model} in ${elapsed}s`);
      results.push({ style, ok: true });
    } catch (err) {
      console.error(`  ✗ ${style} FAILED: ${err.message}`);
      results.push({ style, ok: false, error: err.message });
    }
  }

  // Always rebuild the contact sheet from every sample present on disk, so a
  // partial --only run does not drop the other styles from the index.
  if (!dryRun) {
    const present = NEW_STYLES.filter(s => existsSync(join(OUT_DIR, `${s}.png`)));
    writeContactSheet(present);
  }

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`  ${r.ok ? '✓' : r.dryRun ? '·' : '✗'} ${r.style}${r.error ? ' — ' + r.error : ''}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
