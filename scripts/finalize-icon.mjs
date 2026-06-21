#!/usr/bin/env node
// Turn a chosen icon candidate into the @capacitor/assets source set.
// Candidates come pre-styled as rounded tiles, so: (1) crop the tile border to a
// full-bleed indigo field, (2) use that for the legacy icon, (3) pad the feather
// into the adaptive safe zone over the SAME field colour (no seam).
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
const chosen = join(OUT, '_icon-candidates', process.argv[2] || 'icon-2.png');

const meta = await sharp(chosen).metadata();
const W = meta.width, H = meta.height;

// 1) crop inner 86% to drop the rounded-tile border, re-square to 1024 (full-bleed)
const inset = 0.07;
const full = await sharp(chosen)
  .extract({ left: Math.round(W * inset), top: Math.round(H * inset), width: Math.round(W * (1 - 2 * inset)), height: Math.round(H * (1 - 2 * inset)) })
  .resize(1024, 1024, { fit: 'cover' })
  .png().toBuffer();

// 2) field colour = darkest of several samples on the cropped image (the indigo ground)
let bg = { r: 31, g: 42, b: 94 };
{
  const pts = [[12, 12], [1012, 12], [12, 1012], [1012, 1012], [12, 512]];
  let best = 1e9;
  for (const [x, y] of pts) {
    const { data } = await sharp(full).extract({ left: Math.min(x, 1018), top: Math.min(y, 1018), width: 6, height: 6 }).raw().toBuffer({ resolveWithObject: true });
    const sum = data[0] + data[1] + data[2];
    if (sum < best) { best = sum; bg = { r: data[0], g: data[1], b: data[2] }; }
  }
}
console.log('field colour', bg);

const solid = (w, h, c) => sharp({ create: { width: w, height: h, channels: 4, background: { ...c, alpha: 1 } } });

// legacy / round icon: full-bleed
await sharp(full).toFile(join(OUT, 'icon-only.png'));

// adaptive foreground: feather padded to ~68% over the matching field; background solid
const feather700 = await sharp(full).resize(700, 700, { fit: 'contain', background: bg }).png().toBuffer();
await solid(1024, 1024, bg).composite([{ input: feather700, gravity: 'center' }]).png().toFile(join(OUT, 'icon-foreground.png'));
await solid(1024, 1024, bg).png().toFile(join(OUT, 'icon-background.png'));

// splashes: feather tile centred on cream / indigo
const feather820 = await sharp(full).resize(820, 820, { fit: 'contain', background: bg }).png().toBuffer();
await solid(2732, 2732, { r: 253, g: 246, b: 227 }).composite([{ input: feather820, gravity: 'center' }]).png().toFile(join(OUT, 'splash.png'));
await solid(2732, 2732, bg).composite([{ input: feather820, gravity: 'center' }]).png().toFile(join(OUT, 'splash-dark.png'));

console.log('wrote icon set + splash');
