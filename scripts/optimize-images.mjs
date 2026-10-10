#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Writes an .avif and a .webp next to every illustration in public/illustrations/.
 * The source .png files are never modified or removed: they stay the master copy
 * for the generator scripts and the fallback <img> for old browsers.
 * Illustration.astro serves the smaller formats through <picture>.
 *
 * Idempotent: a variant is rebuilt only when it is missing or older than its source.
 *
 * Usage:
 *   node scripts/optimize-images.mjs            # all illustrations
 *   node scripts/optimize-images.mjs --force    # rebuild every variant
 */

import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { cpus } from 'os';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'public', 'illustrations');
const FORCE = process.argv.includes('--force');

// Checked at 200% zoom against the source on Pichwai, Madhubani, Gond and Kerala mural pages.
const VARIANTS = [
  { ext: 'avif', encode: (img) => img.avif({ quality: 55, effort: 4 }) },
  { ext: 'webp', encode: (img) => img.webp({ quality: 80, effort: 5 }) },
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name.startsWith('_') ? [] : walk(full);
    return entry.name.endsWith('.png') ? [full] : [];
  });
}

function isStale(source, target) {
  return FORCE || !existsSync(target) || statSync(target).mtimeMs < statSync(source).mtimeMs;
}

const jobs = [];
for (const source of walk(ROOT)) {
  for (const variant of VARIANTS) {
    const target = source.replace(/\.png$/, `.${variant.ext}`);
    if (isStale(source, target)) jobs.push({ source, target, variant });
  }
}

console.log(`${jobs.length} variants to build`);
sharp.concurrency(1);
let done = 0;
let failed = 0;

async function worker() {
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    try {
      await job.variant.encode(sharp(job.source)).toFile(job.target);
    } catch (err) {
      failed++;
      console.error(`FAILED ${job.target}: ${err.message}`);
    }
    if (++done % 100 === 0) console.log(`  ${done} done`);
  }
}

await Promise.all(Array.from({ length: cpus().length }, worker));
console.log(`Built ${done - failed} variants, ${failed} failed`);
process.exit(failed ? 1 : 0);
