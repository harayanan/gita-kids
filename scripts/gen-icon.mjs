#!/usr/bin/env node
// Generate app-icon candidates with Gemini, square-cropped to 1024.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readApiKey, generateImageWithRetry } from './generate-illustration.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', '_icon-candidates');
mkdirSync(OUT, { recursive: true });

const PROMPT = `A polished, iconic mobile app icon — a single square 1:1 composition, centered with clean margins.
SUBJECT: one ornate peacock feather (the emblem of Krishna), shown upright and symmetric, its eye (ocellus) prominent and jewel-like, with soft fanning barbs below.
STYLE: Indian folk art — Madhubani/Pichwai sensibility, flat, with fine decorative line detailing and tiny dot patterns; elegant and modern, not busy.
PALETTE: deep indigo background (#1A2A5E to #2D3A87 radial glow); the feather in emerald green, sapphire blue, rich gold, and a glowing saffron-orange center; small cream highlights.
FULL-BLEED (critical): the deep-indigo background fills the ENTIRE square edge to edge. Absolutely NO rounded corners, NO app-icon tile or card, NO white/light backdrop or surface, NO drop shadow, NO border or frame, NO mockup — just the artwork filling the whole square. The feather is centered with generous empty indigo margin around it, occupying about the middle 60% so nothing is ever cut off.
RULES: perfectly centered, balanced, instantly readable at small sizes; NO text, NO letters, NO words; pure artwork. Square aspect ratio.`;

const apiKey = readApiKey();
const n = Number(process.argv[2] || 3);
for (let i = 1; i <= n; i++) {
  process.stdout.write(`candidate ${i}... `);
  try {
    const { base64 } = await generateImageWithRetry([{ text: PROMPT }], apiKey);
    const buf = Buffer.from(base64, 'base64');
    await sharp(buf).resize(1024, 1024, { fit: 'cover' }).png().toFile(join(OUT, `icon-${i}.png`));
    console.log('saved');
  } catch (e) { console.log('FAILED:', e.message); }
  if (i < n) await new Promise((r) => setTimeout(r, 3000));
}
console.log('done ->', OUT);
