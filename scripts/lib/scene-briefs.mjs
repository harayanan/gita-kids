// scripts/lib/scene-briefs.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

export const VALID_MODES = ['specific', 'evocative', 'devotional'];
export const VALID_CAST = [
  'dhritarashtra', 'sanjaya', 'duryodhana', 'bhishma', 'drona', 'arjuna', 'krishna',
  'warrior-pandava', 'warrior-kaurava',
];

export function validateBrief(o) {
  if (typeof o.verse !== 'number') throw new Error(`brief.verse must be a number: ${JSON.stringify(o)}`);
  if (!VALID_MODES.includes(o.relevance_mode)) throw new Error(`bad relevance_mode "${o.relevance_mode}" (verse ${o.verse})`);
  if (!Array.isArray(o.cast)) throw new Error(`brief.cast must be an array (verse ${o.verse})`);
  for (const c of o.cast) if (!VALID_CAST.includes(c)) throw new Error(`unknown cast key "${c}" (verse ${o.verse})`);
  for (const f of ['action', 'setting']) if (typeof o[f] !== 'string' || !o[f]) throw new Error(`brief.${f} required (verse ${o.verse})`);
  return { verse: o.verse, relevance_mode: o.relevance_mode, cast: o.cast,
    action: o.action, setting: o.setting, props: o.props ?? [], notes: o.notes ?? '' };
}

export function loadSceneBriefs(slug) {
  const path = slug === '__fixture__'
    ? join(__dirname, '__fixtures__', 'scene-briefs.sample.yaml')
    : join(PROJECT_ROOT, 'content', 'chapters', slug, 'scene-briefs.yaml');
  if (!existsSync(path)) throw new Error(`scene-briefs.yaml not found: ${path}`);
  const list = yaml.load(readFileSync(path, 'utf-8'));
  if (!Array.isArray(list)) throw new Error(`scene-briefs.yaml must be a list: ${path}`);
  const map = new Map();
  for (const raw of list) { const b = validateBrief(raw); map.set(b.verse, b); }
  return map;
}
