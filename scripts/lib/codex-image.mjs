/**
 * Codex image provider — alternative to the Gemini API.
 *
 * Runs `codex exec` (ChatGPT login, no API key) and has Codex call its built-in
 * image generation tool. Takes the same `parts` array the Gemini path uses
 * ({ text } and { inlineData } reference images) so prompts stay identical.
 *
 * Enable with IMAGE_PROVIDER=codex. The untouched hi-res original is kept in
 * CODEX_HIRES_DIR (if set); the returned image is resized to the site's 1408×768.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import sharp from 'sharp';

const TARGET_W = 1408;
const TARGET_H = 768;
const TIMEOUT_MS = 9 * 60 * 1000;

function runCodex(args, stdin, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('codex', args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('codex exec timed out')); }, TIMEOUT_MS);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => { clearTimeout(timer); resolve({ code, out }); });
    child.stdin.end(stdin);
  });
}

// Codex stores each session's tool output in ~/.codex/generated_images/<session id>/.
// Read the image from there, never from a file the agent saved itself: on 2026-09-21 an
// agent saved an unrelated site image as its output.
function generatedImageForSession(output) {
  const id = output.match(/session id:\s*([0-9a-f-]{36})/i)?.[1];
  if (!id) return null;
  const dir = join(homedir(), '.codex', 'generated_images', id);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).map((f) => join(dir, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] ?? null;
}

export async function generateImageViaCodex(parts, { label = 'image' } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'codex-img-'));
  const prompt = parts.filter((p) => p.text).map((p) => p.text).join('\n\n');

  const refFiles = [];
  parts.filter((p) => p.inlineData?.data).forEach((p, i) => {
    const ext = (p.inlineData.mimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png';
    const file = join(work, `ref-${i + 1}.${ext}`);
    writeFileSync(file, Buffer.from(p.inlineData.data, 'base64'));
    refFiles.push(file);
  });

  const refNote = refFiles.length
    ? `The ${refFiles.length} attached image(s) are character reference sheets. Pass them to the image tool as reference inputs and keep every character's face, skin tone, costume and ornaments consistent with them. They are references only: do not reproduce the sheet layout.`
    : '';

  const task = [
    'Use your built-in image generation tool to generate exactly ONE image from the prompt below, landscape 16:9 (the widest landscape size available).',
    'Do not rewrite, summarise or shorten the prompt.',
    refNote,
    'Generate the image, then reply with the single word DONE. Do not copy, move, edit or search for any files.',
    '',
    'PROMPT:',
    prompt,
    '',
    // Observed Codex failure modes (2026-09-21 inspection): letter-like filigree on small bands, extra hands, five horses.
    'ADDITIONAL HARD RULES:',
    '- Every small ornamental band (door lintels, pillar capitals and bases, urn rims, crown bands, garment hems and sash trims, throne rails) is filled ONLY with plain round dots, lotus petals or one simple repeating zigzag. Never fill a band with rows of small irregular strokes, ticks or glyph-like marks.',
    '- Count limbs before finishing: every human figure has exactly two arms and two hands, each hand attached to a visible arm (only exception: a many-armed cosmic form where the prompt explicitly asks for one). No detached hands, no floating weapons.',
    '- A chariot team is exactly four white horses: four heads, sixteen legs.',
    '- The decorative border is one continuous unbroken band on all four sides; no figure, halo or crown interrupts it, and main figures are shown full length with feet above the bottom border.',
    '- Flat folk-art colour only: no airbrushed glow, no tonal shading, no heart symbols or modern pictograms.',
  ].filter((l) => l !== '').join('\n');

  const args = ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', '-C', work];
  for (const f of refFiles) args.push('-i', f);
  args.push('-');

  const started = Date.now();
  const { code, out } = await runCodex(args, task, work);

  const src = generatedImageForSession(out);
  if (!src) {
    throw new Error(`Codex produced no image (exit ${code}): ${out.slice(-400)}`);
  }

  if (process.env.CODEX_HIRES_DIR) {
    mkdirSync(process.env.CODEX_HIRES_DIR, { recursive: true });
    copyFileSync(src, join(process.env.CODEX_HIRES_DIR, `${label}-${started}.png`));
  }

  const buffer = await sharp(readFileSync(src))
    .resize(TARGET_W, TARGET_H, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  rmSync(work, { recursive: true, force: true });
  return { base64: buffer.toString('base64'), mimeType: 'image/jpeg', model: 'codex-image-generation' };
}
