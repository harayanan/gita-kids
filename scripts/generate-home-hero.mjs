#!/usr/bin/env node
/**
 * generate-home-hero.mjs
 *
 * Generates the home-page hero background — the single most iconic image of the
 * Gita: Krishna teaching Arjuna, rendered in Chapter 1's Pichwai temple style.
 * Output: public/illustrations/home-hero.png
 *
 * Usage:
 *   node scripts/generate-home-hero.mjs
 *   node scripts/generate-home-hero.mjs --dry-run
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  readApiKey,
  STYLE_PROMPTS,
  CHARACTER_REFS,
  buildColorPalette,
  generateImageWithRetry,
  saveImage,
} from './generate-illustration.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(PROJECT_ROOT, 'public', 'illustrations', 'home-hero.png');

const style = STYLE_PROMPTS.pichwai; // Chapter 1's style
const palette = buildColorPalette('pichwai');

const prompt = `Create a ${style.name} folk art style HERO ILLUSTRATION for the home page of a children's book about the Bhagavad Gita. This is the single most iconic, beautiful image of the entire Gita — a sweeping, opulent, devotional showpiece.

SCENE — Krishna teaching Arjuna (the heart of the Bhagavad Gita):
On the battlefield of Kurukshetra, the Lord Krishna gives his divine teaching to the warrior Arjuna. Krishna stands as the radiant divine teacher (Bhagavan), one hand raised in the gesture of teaching; Arjuna stands or kneels before him in devotion, his great bow lowered, listening with reverence. This is the timeless moment when the Gita's wisdom is revealed. Make it majestic and serene.

CHARACTERS (use these exact visual attributes):
- ${CHARACTER_REFS.krishna}
- ${CHARACTER_REFS.arjuna}

COMPOSITION (CRITICAL — Krishna's prominence):
- Krishna is the Lord (Bhagavan) giving the teaching; he MUST be the visually dominant figure, with a radiant golden halo, drawing the eye first.
- Render Krishna clearly taller and larger than Arjuna.
- Centered, balanced and majestic — composed as a WIDE hero banner with the two figures roughly centered, so it reads well behind a website headline and when cropped to a wide strip.

${style.prompt}

${palette}

ABSOLUTELY NO TEXT — THIS IS THE SINGLE MOST IMPORTANT RULE:
- The image MUST NOT contain ANY text or writing of ANY kind. Zero words. Zero letters.
- Forbidden: titles, captions, labels, signatures, color swatches, and ANY script — English/Latin letters, Sanskrit, Devanagari, or Om (ॐ) rendered as a written glyph.
- If you are ever about to draw a letter or word, draw a decorative folk-art motif (flower, dot pattern, vine) in its place instead.
- The finished image is PURE ARTWORK ONLY — completely free of text.

FORMAT: Wide landscape orientation, 16:9 aspect ratio (1408×768 px), suitable for a full-width website hero background.`;

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  console.log('=== Home-page hero — Krishna teaching Arjuna (Pichwai) ===');
  console.log('\n--- PROMPT ---');
  console.log(prompt);
  console.log('--- END PROMPT ---\n');

  if (dryRun) {
    console.log('[dry-run] Skipping API call.');
    return;
  }

  const apiKey = readApiKey();
  console.log('Calling Gemini API...');
  const startTime = Date.now();
  const { base64, mimeType, model } = await generateImageWithRetry([{ text: prompt }], apiKey);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Success via ${model} in ${elapsed}s (mimeType: ${mimeType})`);

  saveImage(base64, OUTPUT_PATH, mimeType);
  console.log(`\nDone → ${OUTPUT_PATH}`);
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
