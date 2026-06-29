#!/usr/bin/env node
// Retouch the app icon / favicon from the pristine feather source.
// Transform: rotate the peacock feather 45 deg clockwise, enlarge it so it
// fills the frame, and raise contrast (deeper indigo ground + brighter, more
// saturated feather) so it reads well at favicon sizes.
//
// Reads a PRISTINE upright full-bleed source (assets/_src-feather.png) so the
// script is idempotent — re-running never double-transforms. On first run it
// seeds that backup from the existing assets/icon-only.png.
//
//   node scripts/retouch-icon.mjs [scale]   # scale default 1.25
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const PUBLIC = join(ROOT, 'public');
const SCALE = Number(process.argv[2] || 2.0);

// Indigo ground — matches the native feather field so the rotation fill is seamless.
const FILL = { r: 24, g: 31, b: 84, alpha: 1 };

// 1) seed / read pristine source
const SRC = join(ASSETS, '_src-feather.png');
if (!existsSync(SRC)) {
  copyFileSync(join(ASSETS, 'icon-only.png'), SRC);
  console.log('seeded pristine source ->', SRC);
}

// 2) transformed full-bleed master (1024)
//    rotate (indigo fill) -> upscale+centre-crop to enlarge -> uniform contrast curve.
//    linear(a,b) with a>1,b<0 darkens the indigo and brightens the feather at once,
//    so contrast rises without any seam between fill and content.
const rot = await sharp(SRC).rotate(45, { background: FILL }).toBuffer();
const up = Math.round(1024 * SCALE);
const master = await sharp(rot)
  .resize(up, up, { fit: 'cover' })
  .extract({ left: Math.round((up - 1024) / 2), top: Math.round((up - 1024) / 2), width: 1024, height: 1024 })
  .modulate({ saturation: 1.5 })
  .linear(1.18, -16)
  .png()
  .toBuffer();

// deepened ground colour (sample a master corner) for solid backgrounds/padding
const { data: corner } = await sharp(master).extract({ left: 8, top: 8, width: 8, height: 8 }).raw().toBuffer({ resolveWithObject: true });
const bg = { r: corner[0], g: corner[1], b: corner[2] };
const solid = (w, h, c) => sharp({ create: { width: w, height: h, channels: 4, background: { ...c, alpha: 1 } } });

// 3) web favicons + touch icon (full-bleed master)
await sharp(master).resize(512, 512).png().toFile(join(PUBLIC, 'icon-512.png'));
await sharp(master).resize(180, 180).png().toFile(join(PUBLIC, 'apple-touch-icon.png'));
for (const s of [48, 32, 16]) {
  await sharp(master).resize(s, s).png().toFile(join(PUBLIC, `favicon-${s}x${s}.png`));
}
// multi-size .ico via ImageMagick (16/32/48)
execFileSync('convert', [
  join(PUBLIC, 'favicon-16x16.png'),
  join(PUBLIC, 'favicon-32x32.png'),
  join(PUBLIC, 'favicon-48x48.png'),
  join(PUBLIC, 'favicon.ico'),
]);

// 4) Capacitor source set
await sharp(master).toFile(join(ASSETS, 'icon-only.png'));                 // legacy / round
// Master feather now fills the frame corner-to-corner, so down-size it into the
// Android adaptive safe zone (~66% of 1024) to avoid the launcher mask clipping it.
const feather = await sharp(master).resize(660, 660, { fit: 'contain', background: bg }).png().toBuffer();
await solid(1024, 1024, bg).composite([{ input: feather, gravity: 'center' }]).png().toFile(join(ASSETS, 'icon-foreground.png'));
await solid(1024, 1024, bg).png().toFile(join(ASSETS, 'icon-background.png'));

// 5) splashes — feather tile on cream / indigo
const tile = await sharp(master).resize(900, 900, { fit: 'contain', background: bg }).png().toBuffer();
await solid(2732, 2732, { r: 253, g: 246, b: 227 }).composite([{ input: tile, gravity: 'center' }]).png().toFile(join(ASSETS, 'splash.png'));
await solid(2732, 2732, bg).composite([{ input: tile, gravity: 'center' }]).png().toFile(join(ASSETS, 'splash-dark.png'));

console.log('ground colour', bg);
console.log('wrote favicons + touch icon + Capacitor icon set + splashes (scale', SCALE + ')');
