# Image Generation Pipeline (Chapter 1 Pilot) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regenerate Chapter 1's 47 illustrations with consistent, distinct characters and verse-relevant scenes, via a reusable reference-image + scene-brief + QA pipeline.

**Architecture:** A small set of Node ESM modules under `scripts/`: a scene-brief schema/loader, a character-model-sheet generator, a brief-driven image generator that conditions Gemini on reference images (multi-part request), and a vision QA module that verdicts each image and triggers regeneration. Human approval gates between stages. Deterministic logic is unit-tested with Node's built-in test runner (`node --test`); generative/approval steps are procedural.

**Tech Stack:** Node 20+ ESM, `node:test` + `node:assert`, `js-yaml`, Gemini image model (`gemini-2.5-flash-image` / `gemini-3.1-flash-image-preview`) and a multimodal model for QA, all via `fetch` (matching the existing `scripts/generate-illustration.mjs`).

## Global Constraints

- **Pilot scope:** Chapter 1 only (`01-arjuna-vishada-yoga`), 47 verses, **Madhubani** style. Regenerate all 47.
- **Roster:** model sheets for the **core 7** only — `dhritarashtra, sanjaya, duryodhana, bhishma, drona, arjuna, krishna`. Minor named figures use **archetype** refs (`warrior-pandava`, `warrior-kaurava`).
- **Relevance principle — "specificity on demand":** each verse brief has `relevance_mode ∈ {specific, evocative, devotional}`. `specific` must depict the named moment + exact cast; `evocative` must connect to the theme (no total disconnect); `devotional` = beautiful on-theme image, cast-loose.
- **No text in images.** **No extra people** beyond the brief's cast (for `specific`).
- **Styling unchanged** — reuse the Madhubani style block + 6-colour palette from `scripts/generate-illustration.mjs` / `docs/illustration-guidelines.md`.
- **Character attributes** are fixed by `docs/illustration-guidelines.md` §1 (mirrored in `CHARACTER_REFS` in the existing script).
- **API key** resolution reuses `readApiKey()` from the existing script (env `GEMINI_API_KEY` or the known `.env.local` paths).
- **Reference images** live under `assets/character-refs/{style}/` (source inputs, NOT served from `public/`).
- **Approval gates** (human, the project owner): (1) the 47 briefs, (2) the model-sheet set, (3) a 5-verse sample, (4) the full chapter QA report. Do not proceed past a gate without sign-off.

---

### Task 1: Scene-brief schema + loader (with validation)

**Files:**
- Create: `scripts/lib/scene-briefs.mjs`
- Test: `scripts/lib/scene-briefs.test.mjs`
- Create (fixture): `scripts/lib/__fixtures__/scene-briefs.sample.yaml`

**Interfaces:**
- Produces: `loadSceneBriefs(slug: string) -> Map<number, Brief>` and `validateBrief(obj) -> Brief` (throws `Error` on invalid). `Brief = { verse:number, relevance_mode:'specific'|'evocative'|'devotional', cast:string[], action:string, setting:string, props:string[], notes:string }`. Valid cast keys: the core 7 plus `warrior-pandava`, `warrior-kaurava`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/lib/scene-briefs.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBrief, loadSceneBriefs, VALID_CAST, VALID_MODES } from './scene-briefs.mjs';

test('validateBrief accepts a well-formed specific brief', () => {
  const b = validateBrief({ verse: 1, relevance_mode: 'specific',
    cast: ['dhritarashtra', 'sanjaya'], action: 'King asks Sanjaya', setting: 'palace', props: [], notes: '' });
  assert.equal(b.verse, 1);
  assert.deepEqual(b.cast, ['dhritarashtra', 'sanjaya']);
});

test('validateBrief rejects an unknown relevance_mode', () => {
  assert.throws(() => validateBrief({ verse: 1, relevance_mode: 'fancy', cast: [], action: 'x', setting: 'y', props: [], notes: '' }), /relevance_mode/);
});

test('validateBrief rejects an unknown cast key', () => {
  assert.throws(() => validateBrief({ verse: 1, relevance_mode: 'specific', cast: ['gandalf'], action: 'x', setting: 'y', props: [], notes: '' }), /cast/);
});

test('loadSceneBriefs returns a Map keyed by verse', () => {
  const m = loadSceneBriefs('__fixture__');
  assert.ok(m instanceof Map);
  assert.equal(m.get(1).action, 'King asks Sanjaya what happened');
});

test('VALID_CAST contains the core 7 plus two archetypes', () => {
  assert.equal(VALID_CAST.length, 9);
  assert.ok(VALID_CAST.includes('krishna') && VALID_CAST.includes('warrior-kaurava'));
});
```

- [ ] **Step 2: Add the fixture**

```yaml
# scripts/lib/__fixtures__/scene-briefs.sample.yaml
- verse: 1
  relevance_mode: specific
  cast: [dhritarashtra, sanjaya]
  action: "King asks Sanjaya what happened"
  setting: "Hastinapura palace hall"
  props: ["throne", "blindfold"]
  notes: ""
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test scripts/lib/scene-briefs.test.mjs`
Expected: FAIL — `Cannot find module './scene-briefs.mjs'`.

- [ ] **Step 4: Implement the module**

```js
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test scripts/lib/scene-briefs.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/scene-briefs.mjs scripts/lib/scene-briefs.test.mjs scripts/lib/__fixtures__/scene-briefs.sample.yaml
git commit -m "feat(images): scene-brief schema + validated loader"
```

---

### Task 2: Author Chapter 1 scene briefs (generative + APPROVAL GATE)

**Files:**
- Create: `content/chapters/01-arjuna-vishada-yoga/scene-briefs.yaml`

**Interfaces:**
- Consumes: `validateBrief` (Task 1) for verification.
- Produces: a 47-entry `scene-briefs.yaml` consumed by Tasks 4 & 6.

- [ ] **Step 1: Draft briefs from the verses.** For each verse `001.yaml`–`047.yaml`, read `meaning` + `story` and write one brief entry. Choose `relevance_mode`: most of Ch 1 is `specific` (the muster — named warriors, conches, Arjuna's collapse); a few framing/abstract verses may be `evocative`. Use only `VALID_CAST` keys; for minor named warriors use `warrior-pandava` / `warrior-kaurava`. (Dispatch parallel authoring agents, ~10 verses each, to keep briefs concrete.)

- [ ] **Step 2: Validate the file parses and every entry is valid**

Run:
```bash
node -e "import('./scripts/lib/scene-briefs.mjs').then(m=>{const x=m.loadSceneBriefs('01-arjuna-vishada-yoga');console.log('briefs:',x.size);})"
```
Expected: `briefs: 47` with no validation error.

- [ ] **Step 3: Commit**

```bash
git add content/chapters/01-arjuna-vishada-yoga/scene-briefs.yaml
git commit -m "content(images): Chapter 1 scene briefs (47)"
```

- [ ] **Step 4: APPROVAL GATE.** Present the 47 briefs to the owner for review/edits. Do not start image work until approved. Apply requested edits and re-run Step 2.

---

### Task 3: Character model sheets — core 7 + archetypes (generative + APPROVAL GATE)

**Files:**
- Create: `scripts/generate-character-sheet.mjs`
- Create (outputs): `assets/character-refs/madhubani/{key}.png` (9 files)
- Modify: `.gitignore` (allow `assets/character-refs/**`, ignore `assets/character-refs/**/_candidates/`)

**Interfaces:**
- Consumes: `readApiKey`, `STYLE_PROMPTS`, `CHARACTER_REFS`, `generateImageWithRetry`, `saveImage` — export these from `scripts/generate-illustration.mjs` (add `export` keywords; no behavior change).
- Produces: locked reference PNGs at `assets/character-refs/madhubani/<key>.png` for the 9 cast keys, consumed by Task 4.

- [ ] **Step 1: Export reusable helpers + generalize the API call to accept image parts.** In `scripts/generate-illustration.mjs`:
  - Add `export` to `readApiKey`, `STYLE_PROMPTS`, `CHARACTER_REFS`, `saveImage`.
  - Extract the Pichwai-aware palette into `export function buildColorPalette(artStyle)` and use it in `buildPrompt`.
  - **Change `generateImageWithRetry` to take a `parts` array instead of a text string:** `export async function generateImageWithRetry(parts, apiKey, maxRetries = 3)`, and build the body as `{ contents: [{ parts }], generationConfig: { responseModalities: ['TEXT','IMAGE'] } }`. Update its existing caller in `generateIllustration` to pass `[{ text: prompt }]`. (This lets Tasks 3 & 6 pass `[...refImageParts, { text: prompt }]`.)
  Run the existing dry-run to confirm no regression:

Run: `node scripts/generate-illustration.mjs --chapter 1 --verse 1 --dry-run`
Expected: prints a prompt, exits 0. Then a live single image still works: `node scripts/generate-illustration.mjs --chapter 1 --verse 3 --regenerate` writes a PNG (verifies the `parts`-array refactor).

- [ ] **Step 2: Write the sheet generator.** `scripts/generate-character-sheet.mjs` builds a single-figure portrait prompt per key: the style block + that character's `CHARACTER_REFS` text (or an archetype description for `warrior-pandava`/`warrior-kaurava`) + palette + "single figure, centered, plain patterned background, full body, no text, no other people." Write 3 candidates per key to `assets/character-refs/{style}/_candidates/{key}-{n}.png`.

```js
// scripts/generate-character-sheet.mjs  (core shape)
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readApiKey, STYLE_PROMPTS, CHARACTER_REFS, buildColorPalette, generateImageWithRetry, saveImage } from './generate-illustration.mjs';

const ARCHETYPES = {
  'warrior-pandava': 'A generic Pandava foot-warrior: terracotta-and-gold armour, simple helm, spear and round shield, no crown, dignified.',
  'warrior-kaurava': 'A generic Kaurava foot-warrior: deep-indigo-and-gold armour, simple helm, spear and round shield, no crown, stern.',
};

function sheetPrompt(key, style) {
  const desc = CHARACTER_REFS[key] || ARCHETYPES[key];
  const s = STYLE_PROMPTS[style];
  return `Create a ${s.name} folk art CHARACTER REFERENCE SHEET: one single figure only.
FIGURE: ${desc}
${s.prompt}
${buildColorPalette(style)}
COMPOSITION: one centered full-body figure, plain patterned background, NO other people, NO text, NO labels.
FORMAT: square, suitable as a character reference.`;
}
// ...arg parse (key, --style, --count), loop candidates -> saveImage(_candidates/key-n.png)
```

- [ ] **Step 3: Generate candidates for all 9 keys** (Madhubani):

Run: `node scripts/generate-character-sheet.mjs --all --style madhubani --count 3`
Expected: 27 candidate PNGs under `assets/character-refs/madhubani/_candidates/`.

- [ ] **Step 4: APPROVAL GATE — owner picks the canonical sheet per key.** For each of the 9 keys, the owner picks the best candidate; copy it to `assets/character-refs/madhubani/{key}.png`. Verify 9 final files exist:

Run: `ls assets/character-refs/madhubani/*.png | wc -l`
Expected: `9`.

- [ ] **Step 5: Commit** (final sheets only; candidates stay gitignored)

```bash
git add scripts/generate-character-sheet.mjs scripts/generate-illustration.mjs .gitignore assets/character-refs/madhubani/*.png
git commit -m "feat(images): character model sheets (core 7 + archetypes, Madhubani)"
```

---

### Task 4: Brief-driven generator conditioned on reference images

**Files:**
- Create: `scripts/lib/build-scene-prompt.mjs`
- Test: `scripts/lib/build-scene-prompt.test.mjs`
- Create: `scripts/lib/ref-images.mjs`
- Test: `scripts/lib/ref-images.test.mjs`

**Interfaces:**
- Consumes: `Brief` (Task 1), `STYLE_PROMPTS`/`buildColorPalette` (Task 3 exports), ref PNGs (Task 3).
- Produces: `buildScenePrompt(brief, chapterMeta, style) -> string` and `loadRefImageParts(cast, style) -> Array<{inlineData:{mimeType,data}}>` for later orchestration (Task 6).

- [ ] **Step 1: Write failing tests for the prompt builder**

```js
// scripts/lib/build-scene-prompt.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildScenePrompt } from './build-scene-prompt.mjs';

const meta = { number: 1, name: 'Arjuna Vishada Yoga', folk_art_style: 'madhubani' };

test('specific mode includes exact cast + no-extra-people clause', () => {
  const p = buildScenePrompt({ verse: 1, relevance_mode: 'specific', cast: ['dhritarashtra','sanjaya'], action: 'King asks Sanjaya', setting: 'palace', props: ['throne'], notes: '' }, meta, 'madhubani');
  assert.match(p, /King asks Sanjaya/);
  assert.match(p, /No other people|no other people/);
  assert.match(p, /NO text|no text/i);
});

test('evocative mode drops the strict-cast clause', () => {
  const p = buildScenePrompt({ verse: 9, relevance_mode: 'evocative', cast: [], action: 'the sorrow of the coming war', setting: 'battlefield at dawn', props: [], notes: '' }, meta, 'madhubani');
  assert.doesNotMatch(p, /No other people/);
  assert.match(p, /sorrow of the coming war/);
});
```

- [ ] **Step 2: Run → FAIL.** `node --test scripts/lib/build-scene-prompt.test.mjs` → cannot find module.

- [ ] **Step 3: Implement `build-scene-prompt.mjs`** — assemble: `${style.name}` intro + SCENE (action, setting, props from the **brief**, not the abstract meaning) + (for `specific`) `CAST: depict exactly these figures: <names>. No other people.` + style block + palette + the existing NO-TEXT block + 16:9 format. For `evocative`/`devotional`, omit the strict-cast line and add a mood line.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Write failing test for ref-image loading** (uses a tiny temp PNG fixture):

```js
// scripts/lib/ref-images.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRefImageParts } from './ref-images.mjs';
test('returns inlineData parts only for cast keys with existing sheets', () => {
  const parts = loadRefImageParts(['arjuna','warrior-pandava'], 'madhubani');
  assert.ok(Array.isArray(parts));
  for (const p of parts) assert.ok(p.inlineData && p.inlineData.data);
});
```

- [ ] **Step 6: Implement `ref-images.mjs`** — for each cast key, if `assets/character-refs/{style}/{key}.png` exists, read it and return `{ inlineData: { mimeType: 'image/png', data: <base64> } }`; skip missing with a `console.warn`.

- [ ] **Step 7: Run → PASS.**

- [ ] **Step 8: Commit**

```bash
git add scripts/lib/build-scene-prompt.mjs scripts/lib/build-scene-prompt.test.mjs scripts/lib/ref-images.mjs scripts/lib/ref-images.test.mjs
git commit -m "feat(images): brief-driven scene prompt + reference-image loader"
```

---

### Task 5: Vision QA module

**Files:**
- Create: `scripts/lib/qa-check.mjs`
- Test: `scripts/lib/qa-check.test.mjs`

**Interfaces:**
- Produces: `parseVerdict(text) -> Verdict` and `qaCheck(imagePath, brief, apiKey) -> Verdict`. `Verdict = { overall_pass:boolean, issues:string[], raw:object }`. For `specific`: checks cast_correct, action_present, no_extra_people, no_text, style_ok. For `evocative`/`devotional`: connected_to_theme, style_ok, no_text.

- [ ] **Step 1: Write failing test for the verdict parser** (pure function, no network):

```js
// scripts/lib/qa-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVerdict } from './qa-check.mjs';

test('parses a fenced JSON verdict and computes overall_pass', () => {
  const v = parseVerdict('noise ```json\n{"cast_correct":true,"action_present":true,"no_extra_people":true,"no_text":true,"style_ok":true}\n``` trailing');
  assert.equal(v.overall_pass, true);
  assert.deepEqual(v.issues, []);
});

test('overall_pass=false collects failing keys as issues', () => {
  const v = parseVerdict('{"cast_correct":false,"action_present":true,"no_extra_people":false,"no_text":true,"style_ok":true}');
  assert.equal(v.overall_pass, false);
  assert.deepEqual(v.issues.sort(), ['cast_correct','no_extra_people']);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `parseVerdict`** (extract first `{...}` JSON, treat any `false` boolean as a failed check → `issues`, `overall_pass = issues.length === 0`) and `qaCheck` (POST the image inlineData + a structured question to the multimodal model; mode-aware question set; return `parseVerdict(responseText)`).

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/qa-check.mjs scripts/lib/qa-check.test.mjs
git commit -m "feat(images): vision QA verdict parser + checker"
```

---

### Task 6: Chapter orchestrator (generate → QA → regenerate → report)

**Files:**
- Create: `scripts/generate-chapter.mjs`

**Interfaces:**
- Consumes: `loadSceneBriefs`, `buildScenePrompt`, `loadRefImageParts`, `generateImageWithRetry`, `saveImage`, `qaCheck`, `readApiKey`.
- Produces: regenerated `public/illustrations/{slug}/{verse}.png` + a report `docs/illustration-qa/{slug}.md`.

- [ ] **Step 1: Implement the orchestrator.** For verses in `--batch from-to` (or `--all`): build prompt + ref parts → `generateImageWithRetry([...refParts, { text: prompt }], apiKey)` → save to a temp path → `qaCheck` → if fail and attempts < 3, append `issues` to the prompt as "FIX: …" and retry → on pass (or after 3) write to `public/illustrations/{slug}/{padded}.png` and record the verdict. Write a Markdown report table (verse, mode, attempts, pass/fail, issues) to `docs/illustration-qa/{slug}.md`. Support `--dry-run` (skip API, print prompt + ref count).

- [ ] **Step 2: Dry-run smoke test**

Run: `node scripts/generate-chapter.mjs --chapter 1 --batch 1-3 --dry-run`
Expected: prints 3 prompts, each showing the brief's action and a non-zero ref-image count; exits 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-chapter.mjs
git commit -m "feat(images): chapter orchestrator with QA-driven regeneration"
```

- [ ] **Step 4: Generate the 5-verse SAMPLE + APPROVAL GATE**

Run: `node scripts/generate-chapter.mjs --chapter 1 --batch 1-5`
Then present the 5 images + their QA verdicts to the owner. Do not proceed until approved. If rejected, adjust prompt/brief/sheets and re-run.

- [ ] **Step 5: Generate the FULL chapter**

Run: `node scripts/generate-chapter.mjs --chapter 1 --all`
Expected: 47 images written; `docs/illustration-qa/01-arjuna-vishada-yoga.md` shows all-pass or manually-flagged rows.

- [ ] **Step 6: Commit the regenerated chapter**

```bash
git add public/illustrations/01-arjuna-vishada-yoga docs/illustration-qa/01-arjuna-vishada-yoga.md
git commit -m "content(images): regenerate Chapter 1 via reference + brief + QA pipeline"
```

- [ ] **Step 7: FINAL APPROVAL GATE.** Owner reviews the 47 images (live on the site — the Remote WebView app reflects them automatically). Re-run individual verses with `--batch N-N` as needed.

---

### Task 7: Update docs

**Files:**
- Modify: `docs/illustration-guidelines.md` (add a "Pipeline v2" section: briefs + sheets + QA, commands), `docs/MOBILE-APPS.md` (mark image-system "spec → implemented for Ch 1").

- [ ] **Step 1: Document the new commands** (`generate-character-sheet.mjs`, `generate-chapter.mjs`, where briefs and sheets live) and the per-chapter rollout recipe (author briefs → generate sheets in that style → run orchestrator).

- [ ] **Step 2: Commit**

```bash
git add docs/illustration-guidelines.md docs/MOBILE-APPS.md
git commit -m "docs(images): document the v2 reference+brief+QA pipeline"
```

---

## Rollout to chapters 2–18 (after pilot sign-off)
Per chapter: author `scene-briefs.yaml` → `generate-character-sheet.mjs --all --style <chapter style>` for the appearing core-7 members → owner approves sheets → `generate-chapter.mjs --chapter N --all` → review QA report. The brief/QA modules are unchanged; only the style and briefs differ.
