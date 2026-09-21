#!/usr/bin/env node
/**
 * generate-illustration.mjs
 *
 * Generates folk art illustrations for the Gita Kids project
 * using the Gemini image generation API. Supports multiple art styles
 * (Madhubani, Pichwai, Pattachitra, Warli, Kalamkari) based on the
 * chapter's meta.yaml `folk_art_style` field.
 *
 * Usage:
 *   node scripts/generate-illustration.mjs --chapter 12 --verse 1
 *   node scripts/generate-illustration.mjs --chapter 12 --batch 1-20
 *   node scripts/generate-illustration.mjs --verse 11                  (defaults to chapter 1)
 *   node scripts/generate-illustration.mjs --verse 4 --regenerate
 *   node scripts/generate-illustration.mjs --batch 11-20 --dry-run
 *
 * API key is read from $GEMINI_API_KEY, else hdfc/apps/mutual-fund-dost/.env.local
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// The mutual-fund-dost project moved under hdfc/apps/; try known locations in order.
const API_KEY_FILES = [
  '/root/claudecode/hdfc/apps/mutual-fund-dost/.env.local',
  '/home/claude/claudecode/hdfc/apps/mutual-fund-dost/.env.local',
  '/root/claudecode/mutual-fund-dost/.env.local',
];
const CHAPTERS_DIR = join(PROJECT_ROOT, 'content', 'chapters');
const GUIDELINES_FILE = join(PROJECT_ROOT, 'docs', 'illustration-guidelines.md');

// Gemini image generation models (tried in order)
// gemini-3.1-flash-image-preview = "Nano Banana 2" (matches reference implementation)
// gemini-2.5-flash-image = "Nano Banana" (slightly older, broader availability)
const IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
  'gemini-3-flash-preview',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function readApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  const file = API_KEY_FILES.find((p) => existsSync(p));
  if (!file) {
    throw new Error(`API key file not found in any known location: ${API_KEY_FILES.join(', ')}`);
  }
  const contents = readFileSync(file, 'utf-8');
  const match = contents.match(/^GEMINI_API_KEY=(.+)$/m);
  if (!match) {
    throw new Error(`GEMINI_API_KEY not found in ${file}`);
  }
  return match[1].trim();
}

/**
 * Resolve a chapter identifier (number or slug) to { slug, versesDir, outputDir, meta }.
 */
function resolveChapterSync(chapterArg) {
  const entries = readdirSync(CHAPTERS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let slug;
  if (/^\d+$/.test(chapterArg)) {
    // Numeric: find directory starting with zero-padded number
    const padded = String(chapterArg).padStart(2, '0');
    slug = entries.find(e => e.startsWith(padded + '-'));
    if (!slug) throw new Error(`No chapter directory found for number ${chapterArg}`);
  } else {
    slug = entries.find(e => e === chapterArg);
    if (!slug) throw new Error(`Chapter directory not found: ${chapterArg}`);
  }

  const metaPath = join(CHAPTERS_DIR, slug, 'meta.yaml');
  if (!existsSync(metaPath)) {
    throw new Error(`meta.yaml not found: ${metaPath}`);
  }
  const metaRaw = readFileSync(metaPath, 'utf-8');
  const meta = {};
  for (const field of ['number', 'slug', 'name', 'sanskrit_name', 'transliterated_name', 'folk_art_style', 'verse_count']) {
    const m = metaRaw.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (m) meta[field] = m[1].trim();
  }

  // `summary` is a `>` block scalar — gather the indented continuation lines.
  const summaryMatch = metaRaw.match(/^summary:\s*>\s*\n((?:[ \t]+.+\n?)+)/m);
  if (summaryMatch) {
    meta.summary = summaryMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join(' ');
  }

  // Optional `cover_brief` — concrete art direction for the chapter cover.
  const coverBriefMatch = metaRaw.match(/^cover_brief:\s*[>|][-+]?\s*\n((?:[ \t]+.+\n?)+)/m);
  if (coverBriefMatch) {
    meta.cover_brief = coverBriefMatch[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
  }

  return {
    slug,
    versesDir: join(CHAPTERS_DIR, slug, 'verses'),
    outputDir: join(PROJECT_ROOT, 'public', 'illustrations', slug),
    meta,
  };
}

// ---------------------------------------------------------------------------
// Folk art style prompt blocks
// ---------------------------------------------------------------------------

export const STYLE_PROMPTS = {
  madhubani: {
    name: 'Madhubani (Mithila)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Madhubani (Mithila) folk art style
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering, NO gradients
- Double-line outlines on all figures and objects
- Horror vacui — fill ALL blank spaces with traditional patterns: crosshatching, concentric circles, dots, fish motifs, lotus motifs, geometric fills
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Dense floral and geometric border on all four sides
- No naturalistic sky, ground, or landscape — use patterned flat color fields
- Bharni (filled) style of Madhubani painting
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  pichwai: {
    name: 'Pichwai (Nathdwara)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- In the style of traditional Nathdwara Pichwai temple paintings from Rajasthan
- DARK BACKGROUND (MANDATORY): deep blue (#0A1A3A), black (#1A1A2E), or deep green (#0A2A1A) — NEVER cream, NEVER white, NEVER light backgrounds
- Rich, detailed, devotional composition; Krishna as Shrinathji ONLY if the scene asks for it
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Pichwai motifs (lotus ponds, cows, peacocks, gopis, flowering trees) ONLY where the scene calls for them — the SCENE's own subject must fill the panel; never pad a battlefield, hermitage or village scene with cows and gopis
- Rich jewel-tone palette: emerald, sapphire, ruby, gold on dark ground — NOT warm saffron/terracotta
- Dense floral patterns filling all empty spaces (horror vacui)
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Ornate textile-like border with lotus, paisley, or floral chain — gold on dark ground
- Devotional, sacred atmosphere — temple painting aesthetic
- NOT Madhubani — avoid cream backgrounds, geometric folk patterns, double-line outlines, and red/saffron dominant palette
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  'pichwai-narrative': {
    name: 'Pichwai (Nathdwara) narrative',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- In the style of traditional Nathdwara Pichwai temple paintings from Rajasthan — opulent, sacred, richly detailed
- DARK BACKGROUND (MANDATORY): deep blue (#0A1A3A), black (#1A1A2E), or deep green (#0A2A1A) — NEVER cream, NEVER white, NEVER light backgrounds
- Rich jewel-tone palette: emerald, sapphire, ruby, gold on dark ground; fine gold linework and gilded highlights
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Dense ornate floral and foliate patterns filling all empty space (horror vacui)
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Ornate textile-like border with lotus, paisley, or floral chain on all four sides — gold on dark ground
- Render the ACTUAL scene of this verse — the Mahabharata battlefield world: warriors, chariots, horses, bows, conches, kings, palaces — in this opulent Pichwai manner. This is a NARRATIVE Pichwai panel: it need NOT be centered on Krishna and need NOT include cows, gopis, or lotus ponds unless the scene itself calls for them.
- NOT Madhubani — no cream backgrounds, no double-line folk outlines, no geometric folk fills
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  pattachitra: {
    name: 'Pattachitra (Odisha)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Pattachitra folk art style from Odisha
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Bold black outlines on all figures with intricate internal detailing
- Horror vacui — fill ALL spaces with fine cross-hatching, floral scrolls, geometric patterns
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Multi-layered ornamental border (typically 3-4 nested frames)
- No naturalistic sky or landscape — use patterned flat color fields
- Narrative panel composition showing a single key scene
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  warli: {
    name: 'Warli (Maharashtra)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Warli tribal folk art style from Maharashtra
- Simple white stick figures and geometric shapes on a terracotta/earth-tone background
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Figures made from basic geometric shapes (triangles for bodies, circles for heads)
- Scenes composed in circular or processional arrangements
- Decorative border of simple geometric chain patterns
- Minimalist aesthetic — the beauty is in simplicity and rhythm
- Fill spaces with small dots, spirals, and simple plant motifs
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  kalamkari: {
    name: 'Kalamkari (Andhra Pradesh)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Kalamkari painting style from Andhra Pradesh (Srikalahasti or Machilipatnam school)
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Fine pen-drawn outlines with natural dye color fills
- Elaborate scrolling vine and floral borders on all four sides
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Dense botanical patterns (flowers, leaves, vines) filling all empty spaces
- Tree of Life motif where compositionally appropriate
- Narrative mythological scenes with rich textile-like patterning
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  gond: {
    name: 'Gond (Madhya Pradesh)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Gond folk art style from Madhya Pradesh, central India
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Intricate dot-and-dash patterns filling ALL forms — every figure, tree, animal, and object composed of fine dots and flowing lines
- Organic, flowing shapes — figures emerge from nature, interconnected with trees, birds, fish
- Bold black outlines with vibrant color fills using the specified palette
- Horror vacui — all empty space filled with dot clusters, concentric circles, wave patterns
- Figures in strict profile OR frontal view, NEVER three-quarter view
- Decorative border with repeating leaf, vine, or animal motifs
- Nature-centric: trees, birds, fish, rivers as compositional anchors even in narrative scenes
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },

  // ---- Diversification styles (added 2026-06-29) to break up repeated forms ----
  'kerala-mural': {
    name: 'Kerala Mural',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Kerala temple mural style (as in Guruvayur, Mattancherry, and Pundarikapuram murals)
- Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering
- Figures with rounded faces, large lotus-petal eyes, tall elaborate crowns and heavy ornaments
- Bold black outlines; rich panchavarna (five-colour) fills — ochre-yellow, red, green, white, black
- Stylised curling foliage, lotus, and creeper motifs filling the background (horror vacui)
- Figures in profile OR frontal view — ornate, stately, sacred
- Foliate scrollwork border on all four sides
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  tanjore: {
    name: 'Tanjore (Thanjavur)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Thanjavur (Tanjore) painting style from Tamil Nadu — regal, devotional, opulent
- Central figures framed under an ornamental arch (prabhavali / pillared torana)
- Abundant gold-leaf gilding on crowns, jewellery, arch and borders — raised gold-relief look
- Vivid flat jewel colours: deep red, emerald green, royal blue; NO 3D modelling
- Rounded faces, large eyes, heavy gold jewellery and pearl strings
- Symmetrical, iconic, frontal devotional composition
- TWO distinct frames: (1) an OUTER rectangular gilded border enclosing all four sides of the painting, including a full bottom band of equal weight to the top; (2) an INNER ornamental arch (prabhavali) arching over the figures
- The COMPLETE outer rectangle must be visible inside the image with a small margin of background beyond it on every side — do NOT zoom in, do NOT crop or run any element off the top, bottom, left or right edge
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  mysore: {
    name: 'Mysore',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Mysore painting style from Karnataka — graceful, serene, refined
- Slender, delicate figures with gentle serene expressions
- Restrained gesso gold-leaf detailing on crowns, jewellery and thrones (subtler than Tanjore)
- Soft muted palette — gentle greens, soft blues, warm ochres, cream
- Fine intricate linework; flat colour with only the faintest tonal grading on faces
- Ornate thrones, arches, and lotus pedestals
- Delicate floral border on all four sides
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  phad: {
    name: 'Phad Scroll',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Phad scroll painting style from Shahpura, Rajasthan — narrative epic scroll
- Processional composition — many figures packed across the panel in scene-blocks, NO single vanishing point, NO empty centre
- Flat bright colour with predominant red and orange grounds, plus green, yellow, indigo
- Figures in profile with large fish-shaped eyes, compact and repeated
- Bold outlines; figures grouped by episode, facing one another
- Festive, busy, decorative; simple running border
- Flat perspective — NO shading, NO 3D rendering
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  pahari: {
    name: 'Pahari (Kangra)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Pahari (Kangra) miniature painting style from the Himalayan foothills — lyrical, tender, refined
- Slender graceful figures with delicate fine faces and gentle expressions
- Soft naturalistic flowering landscape — delicate trees, blossoms, gentle hills and streams (flat decorative depth, not photographic)
- Soft refined palette — tender greens, pale sky blue, rose pink, cream, soft gold accents
- Fine delicate linework; only very subtle modelling
- Narrow floral creeper border
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  mewar: {
    name: 'Mewar (Rajput)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Mewar (Rajput) miniature painting style from Rajasthan — bold, courtly, vigorous
- Bold flat planes of saturated colour, often a single dominant ground (hot red or ochre)
- Scene divided into registers / colour bands; flat decorative architecture, pavilions, horses, chariots
- Figures in profile with large eyes, lively and animated
- Well suited to battlefield and court scenes — warriors, bows, chariots rendered flat and patterned
- Bold outlines, minimal modelling; simple banded border
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  cheriyal: {
    name: 'Cheriyal Scroll',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Cheriyal scroll painting style from Telangana — lively folk narrative
- Signature vivid red background; bold rounded folk figures with large eyes
- Figures grouped in animated action, warm and lively
- Flat vibrant primary colours — red, yellow, green, blue, white — with black outlines
- Simple floral or dotted border bands
- Flat perspective — NO shading, NO 3D rendering
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  kalighat: {
    name: 'Kalighat',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Kalighat painting style from 19th-century Bengal — bold, fluid, economical
- One or a few large figures with confident sweeping brush outlines
- Rounded, volumetric forms suggested by smooth graded watercolour wash (gentle shading allowed — this style is the exception to the flat rule)
- Minimal, mostly plain or lightly-washed background — generous open space, NOT horror vacui
- Limited earthy palette with bright accents — indian red, ochre, blue-grey — on a cream/plain ground
- Expressive watercolour feel; little or no border, or a thin plain rule
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  sanjhi: {
    name: 'Sanjhi Paper-cut',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Sanjhi paper-cut (stencil) art from Mathura / Braj — delicate devotional filigree
- The whole image reads as intricate symmetrical lace-like paper cutwork
- Braj / Krishna devotional motifs — cows, peacocks, kadamba trees, lotus, the Yamuna river
- Cutwork rendered as a single light colour (cream/white) silhouetted against a flat contrasting deep ground (indigo, deep blue, or black)
- Highly symmetrical, filigree detailing, fine perforated patterns
- Flat — NO shading, NO 3D rendering
- Decorative cut-paper border on all four sides
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  'tholu-bommalata': {
    name: 'Tholu Bommalata (Shadow Puppet)',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Tholu Bommalata leather shadow-puppet style from Andhra Pradesh — theatrical and luminous
- Figures rendered as ornate translucent leather puppets in strong profile, with jointed limbs and tall elaborate crowns
- Intricate perforated / punched lace-like patterns within every figure and costume
- Glowing, back-lit translucent jewel colours (red, orange, green, gold) against a DARK ground, as if lit from behind on a screen
- Bold dark outlines; dramatic silhouettes
- Decorative punched border
- Flat — NO 3D modelling
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  saura: {
    name: 'Saura',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Saura (Soura) tribal painting style from Odisha — ritual, rhythmic, geometric
- White / cream stick-and-geometric figures on a deep maroon / red-brown earth ground
- Drawn border-inward in the signature fishnet manner; figures arranged in rows — dancers, horses, tree of life
- Stylised figures built from simple triangles and lines, arms linked, processional rhythm
- Flat perspective — NO shading, NO 3D rendering
- Geometric icon-house (ikon) frame border
- Fill space with small trees, birds, sun/moon and dot motifs
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
  basohli: {
    name: 'Basohli',
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- Basohli miniature painting style (early Pahari school) — bold, intense, vivid
- Hot saturated grounds, especially brilliant red and deep yellow
- Figures with large lotus-petal eyes and strong profiles, vigorous and expressive
- Beetle-wing iridescent emerald green for jewellery highlights; rich gold detailing
- Flat geometric architecture and bold colour planes
- Strong patterned border on all four sides
- Flat perspective — NO shading, NO 3D rendering
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },

  // Fine-art realism (NOT folk) — deliberately breaks the flat-folk constraints.
  tomassetti: {
    name: 'Giampaolo Tomassetti (classical realism)',
    fineArt: true,
    prompt: `STYLE REQUIREMENTS (CRITICAL — follow every rule exactly):
- In the style of Italian painter Giampaolo Tomassetti's Mahabharata oil paintings — classical European realism applied to Vedic India
- Naturalistic, anatomically accurate figures with realistic proportions and lifelike, expressive faces
- Oil-painting finish — soft chiaroscuro modelling, three-dimensional form, real atmospheric depth and perspective
- Warm cinematic lighting, glowing skin, luminous golden-hour or dramatic sky
- Richly detailed costumes, jewellery, armour, chariots and landscape rendered realistically
- Devotional grandeur and epic, theatrical composition — Renaissance-influenced but faithfully Indian
- This is FINE-ART REALISM, NOT flat folk art: shading, depth, volume and naturalism are REQUIRED
- Always illustrate the verse/mythological scene, NOT any modern story analogy`,
  },
};

/**
 * Minimal YAML parser — handles only the simple key: value and block-scalar
 * formats used in the verse files. Not a general-purpose parser.
 */
function parseVerseYaml(raw) {
  const result = {};

  // Extract `meaning` block scalar (> style)
  const meaningMatch = raw.match(/^meaning:\s*>\s*\n((?:[ \t]+.+\n?)+)/m);
  if (meaningMatch) {
    result.meaning = meaningMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join(' ');
  }

  // Extract `story.title`
  const storyTitleMatch = raw.match(/^\s+title:\s*"(.+?)"/m);
  if (storyTitleMatch) {
    result.story_title = storyTitleMatch[1];
  }

  // Extract optional `illustration_brief` — an art-director's CONCRETE visual
  // scene direction (what to literally depict). Supports a folded/literal block
  // (`>`/`|`) or a quoted/plain scalar. When present it drives the image scene
  // instead of the abstract `meaning`, so philosophical verses get a real scene.
  const briefBlock = raw.match(/^illustration_brief:\s*[>|][-+]?\s*\n((?:[ \t]+.+\n?)+)/m);
  if (briefBlock) {
    result.illustration_brief = briefBlock[1]
      .split('\n').map(l => l.trim()).filter(Boolean).join(' ');
  } else {
    const briefScalar = raw.match(/^illustration_brief:\s*(?:"([^"]*)"|'([^']*)'|(.+))\s*$/m);
    if (briefScalar) {
      result.illustration_brief = (briefScalar[1] || briefScalar[2] || briefScalar[3] || '').trim();
    }
  }

  // Simple scalar fields
  const scalarFields = ['chapter', 'verse', 'speaker'];
  for (const field of scalarFields) {
    const m = raw.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
    if (m) result[field] = m[1].trim();
  }

  return result;
}

function readVerseData(verseNum, versesDir) {
  const paddedNum = String(verseNum).padStart(3, '0');
  const yamlPath = join(versesDir, `${paddedNum}.yaml`);
  if (!existsSync(yamlPath)) {
    throw new Error(`Verse YAML not found: ${yamlPath}`);
  }
  const raw = readFileSync(yamlPath, 'utf-8');
  const data = parseVerseYaml(raw);
  data.verse_number = verseNum;
  data.padded_number = paddedNum;
  return data;
}

// ---------------------------------------------------------------------------
// Character reference sheet (from illustration-guidelines.md)
// ---------------------------------------------------------------------------

export const CHARACTER_REFS = {
  dhritarashtra: `Dhritarashtra: Elderly stout king, white/cream royal silk robes, gold crown, silk blindfold over eyes, seated on throne, white hair and beard.`,
  sanjaya: `Sanjaya: Middle-aged royal court advisor and bard (King Dhritarashtra's charioteer-narrator), dark hair tied in a topknot and a short neat beard, a simple indigo dhoti and shawl (no armor, no crown), an alert storyteller's expression as if recounting events. He is a Hindu court minister — NOT a Buddhist or Jain monk: NO shaved or bald head, NO monk's robe over one shoulder, NOT in a cross-legged meditation pose.`,
  duryodhana: `Duryodhana: Young warrior (25-30), strong jaw, proud bearing, with a thick black moustache and a faint hard, angry frown that subtly hints at his darker nature (kept gentle and not scary for children), red-gold armor over yellow silk, ornate gold crown with a red gem, strong muscular build.`,
  drona: `Drona: Elderly sage (60+), simple saffron robes, no crown, long white beard, teaching staff or bow, calm authority.`,
  bhishma: `Bhishma: Ancient warrior (80+), towering stature, silver armor, flowing white hair (no crown), a FULL flowing white beard and a thick white moustache (always shown bearded and moustached, as in popular depictions — NEVER clean-shaven), massive bow, weathered face with kind eyes.`,
  arjuna: `Arjuna: Young warrior (25), lean and athletic, with a neat black moustache and ordinary human (warm brown) skin, terracotta and saffron armor, a plain warrior's diadem/headband — NO peacock feather (the peacock feather belongs ONLY to Krishna), holds the divine bow Gandiva. Clearly DISTINCT from Krishna: not blue-skinned, no flute, no peacock feather, no crown.`,
  krishna: `Krishna: Youthful graceful figure, yellow silk robes, peacock feather in crown, blue-tinged skin, divine smile, flute at waist, EXACTLY TWO ARMS (his ordinary human form — no discus, conch or extra arms unless the scene explicitly asks for his four-armed Vishnu form). Draw him ONCE only — no second blue-skinned, crowned or yellow-clad look-alike anywhere in the image. He is the Lord (Bhagavan), the divine teacher of the Gita — render him as the largest, tallest, most prominent human figure in any scene, with a radiant golden halo.`,
};

// Hard fidelity rules shared by verse, cover and Ch1 scene prompts. Derived from
// the 2026-09-14 audit (docs/illustration-style-fidelity-spec.md §4).
export const FIDELITY_BLOCK = `FIDELITY RULES (CRITICAL — violations make the image unusable):
- Anatomy: every human figure has exactly ONE head, TWO arms, TWO hands and TWO legs. No extra, floating or merged hands or limbs. Multi-armed or multi-headed forms ONLY where the SCENE explicitly names such a divine form (e.g. the cosmic Vishvarupa, four-armed Vishnu, four-headed Brahma).
- Animals are whole natural animals with the correct number of legs; no animal heads on human bodies. Horses and chariot wheels drawn correctly.
- One of each named character: never duplicate Krishna or Arjuna, and no look-alike figures.
- Hindu tradition only: NO Buddha or Buddha-like figures (no cranial bump, no snail-shell curls, no robe over one shoulder, no shaven-headed monks), no Jain tirthankaras, no Christian, Islamic, Chinese, Japanese or Western imagery, no mosque domes or minarets. Meditating sages are Hindu rishis with a matted hair bun, beard, rudraksha beads and sacred thread.
- NO swastika motifs anywhere, including borders and decorations.
- Ancient India only: no globes, maps, clocks, icons, pictograms, charts, scales-of-justice symbols, music-note symbols, framed pictures, modern clothes or modern buildings.
- Child-safe for ages 8-12: no blood, wounds, gore or frightening monsters.
- Complete border on all four sides; no figure's head or crown cut off by the frame.`;

export const NO_TEXT_BLOCK = `CRITICAL — NO TEXT IN THE IMAGE:
- Do NOT include any words, letters, numerals, labels, captions, titles, speech bubbles, signatures or colour swatches
- No pseudo-script or letter-like marks: books, scrolls, palm leaves, banners and tablets must be blank or decorated with plain pattern only
- Do NOT render any text overlays, legends, or annotations
- The image must contain ONLY the illustration — pure artwork with no text whatsoever`;

// Map speaker field values to character keys
const SPEAKER_MAP = {
  dhritarashtra: 'dhritarashtra',
  sanjaya: 'sanjaya',
  duryodhana: 'duryodhana',
  drona: 'drona',
  bhishma: 'bhishma',
  arjuna: 'arjuna',
  krishna: 'krishna',
};

/**
 * Determine which characters are relevant for a given verse.
 * Always includes the speaker. Attempts to infer others from the meaning text.
 */
function getRelevantCharacters(verseData) {
  const characters = new Set();

  // Always include the speaker
  const speakerKey = SPEAKER_MAP[verseData.speaker?.toLowerCase()];
  if (speakerKey) characters.add(speakerKey);

  // Infer additional characters from meaning text. Match common epithets too,
  // since the Gita rarely uses the plain names (e.g. "Partha" = Arjuna,
  // "Madhava"/"Hrishikesha" = Krishna).
  const meaning = (verseData.meaning || '').toLowerCase();
  const has = (...terms) => terms.some(t => meaning.includes(t));
  if (has('bhishma', 'grandsire')) characters.add('bhishma');
  if (has('drona', 'teacher')) characters.add('drona');
  if (has('arjuna', 'partha', 'dhananjaya', 'gudakesha', 'gudakesa', 'savyasachi', 'kaunteya')) characters.add('arjuna');
  if (has('krishna', 'madhava', 'hrishikesha', 'hrishikesa', 'govinda', 'keshava', 'kesava', 'madhusudana', 'janardana', 'achyuta', 'varshneya')) characters.add('krishna');
  if (has('duryodhana')) characters.add('duryodhana');
  if (has('sanjaya')) characters.add('sanjaya');
  if (has('dhritarashtra', 'blind king')) characters.add('dhritarashtra');

  return Array.from(characters).map(k => CHARACTER_REFS[k]).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Prompt construction
// ---------------------------------------------------------------------------

function buildSceneDescription(verseData, chapterMeta) {
  const { verse_number, speaker, meaning, story_title, illustration_brief } = verseData;
  const chapterNum = chapterMeta.number || '?';
  const chapterName = chapterMeta.name || '';
  const speakerName = speaker
    ? speaker.charAt(0).toUpperCase() + speaker.slice(1)
    : 'Unknown';

  // Prefer a concrete art-director brief (what to literally depict). Fall back to
  // the abstract meaning only when no brief is authored.
  const sceneLine = illustration_brief && illustration_brief.length
    ? illustration_brief
    : meaning;
  const contextLine = illustration_brief && illustration_brief.length
    ? `Teaching this illustrates: ${meaning}`
    : '';

  return `Chapter ${chapterNum} (${chapterName}), Verse ${verse_number} of the Bhagavad Gita.
Speaker: ${speakerName}.
Scene to depict (draw this literally and specifically): ${sceneLine}
${contextLine}
Story theme: "${story_title || 'N/A'}"

Illustrate the MYTHOLOGICAL scene — divine figures, ancient India settings, sacred landscapes. Make the illustration SPECIFIC to this verse's scene above, not a generic teaching tableau. Do NOT illustrate any modern analogy or contemporary scene.`;
}

/**
 * Per-style colour palettes for the diversification styles. Each has its own
 * ground and palette logic — gold-dominant (Tanjore), dark-ground (Tholu
 * Bommalata, Sanjhi), maroon-ground (Saura), etc. — so they do NOT use the
 * default cream six-colour block.
 */
export const STYLE_PALETTES = {
  'kerala-mural': `COLOR PALETTE (Kerala mural panchavarna — five colours):
- Ochre-yellow: #C98A1B
- Indian red: #9E2B25
- Forest green: #1A6847
- White: #F5E6D3
- Black outlines
- Gold accents: #C4A24E
- Earthy mural tones — NO blue sky, NO neon colors`,
  tanjore: `COLOR PALETTE (Tanjore — gold-rich jewel tones):
- Gold leaf (dominant): #C4A24E
- Deep red: #8B1A1A
- Emerald green: #0D6B3F
- Royal blue: #1A3A8A
- White / pearl highlights: #F5E6D3
- Abundant gold gilding; NO neon colors`,
  mysore: `COLOR PALETTE (Mysore — soft muted with gold):
- Soft gold: #C4A24E
- Muted green: #4E7A5A
- Soft blue: #5A7AA8
- Warm ochre: #C98A4B
- Cream: #FDF6E3
- Gentle, restrained tones; NO neon colors`,
  phad: `COLOR PALETTE (Phad — flat brights on red/orange):
- Phad red (ground): #B83227
- Orange: #C75B12
- Yellow ochre: #D9A441
- Green: #1A6847
- Indigo: #2D3A87
- White accents; NO neon colors`,
  pahari: `COLOR PALETTE (Pahari — soft naturalistic):
- Tender green: #6E9B5A
- Pale sky blue: #A8C6DE
- Rose pink: #D49AA0
- Cream: #FDF6E3
- Soft gold: #C4A24E
- Gentle refined tones; NO neon colors`,
  mewar: `COLOR PALETTE (Mewar — bold saturated Rajput):
- Hot red (ground): #B0231F
- Ochre: #C98A1B
- Indigo: #2D3A87
- Green: #1A6847
- White: #F5E6D3
- Gold: #C4A24E
- Bold flat planes; NO neon colors`,
  cheriyal: `COLOR PALETTE (Cheriyal — vivid folk on red):
- Cheriyal red (ground): #C0392B
- Yellow: #E0A93B
- Green: #1A6847
- Blue: #2D3A87
- White and black outlines
- Vibrant primaries; NO neon colors`,
  kalighat: `COLOR PALETTE (Kalighat — earthy watercolour washes):
- Indian red: #9E2B25
- Ochre: #C98A1B
- Blue-grey: #6E7E8A
- Cream / plain ground: #FDF6E3
- Soft graded washes; NO neon colors`,
  sanjhi: `COLOR PALETTE (Sanjhi — light cutwork on deep ground):
- Cutwork in cream / white: #F5E6D3
- Deep flat ground: indigo #1A2A5A, deep blue #0A1A3A, or black #1A1A2E
- Optional gold accents: #C4A24E
- The GROUND is deep/dark and the cutwork is light — NO cream background fields`,
  'tholu-bommalata': `COLOR PALETTE (Tholu Bommalata — back-lit translucent on dark):
- Dark ground: black #1A1A2E or deep brown #2A1A10
- Glowing translucent red: #C0392B
- Glowing orange: #D9701F
- Glowing green: #0D6B3F
- Gold: #C4A24E
- Luminous back-lit feel; NO light-toned backgrounds`,
  saura: `COLOR PALETTE (Saura — white figures on maroon):
- Maroon / red-brown ground: #6B1E1E
- White / cream figures: #F5E6D3
- Sparse accents of ochre #C98A1B and green #1A6847
- The GROUND is deep maroon — NO cream background`,
  basohli: `COLOR PALETTE (Basohli — hot saturated):
- Brilliant red (ground): #C01818
- Deep yellow: #E0A521
- Beetle-wing emerald: #0D6B3F
- Blue: #2D3A87
- White and gold: #C4A24E
- Intense saturated planes; NO neon colors`,
  tomassetti: `COLOR PALETTE (Tomassetti — naturalistic oil painting):
- Rich naturalistic colour with a full tonal range and soft gradients
- Warm golds and saffrons, deep reds, royal blues, earthy greens
- Realistic skin tones; Krishna's skin a soft luminous blue
- Atmospheric sky and natural light are WELCOME (this fine-art style is EXEMPT from the flat-folk 'no sky' rule)
- Cinematic chiaroscuro lighting; no neon colours`,
};

/**
 * Build the color-palette block for a given art style. Pichwai uses a dark
 * background with jewel tones; the diversification styles use their own
 * palettes; all other styles use the standard cream palette.
 */
export function buildColorPalette(artStyle) {
  if (STYLE_PALETTES[artStyle]) return STYLE_PALETTES[artStyle];
  const isPichwai = artStyle.startsWith('pichwai');
  return isPichwai
    ? `COLOR PALETTE (Pichwai jewel tones on dark ground):
- Dark background: deep blue #0A1A3A, black #1A1A2E, or deep green #0A2A1A
- Emerald green: #0D6B3F
- Sapphire blue: #1A3A8A
- Ruby red: #8B1A1A
- Gold/amber: #C4A24E
- Warm white for highlights: #F5E6D3
- NO cream backgrounds, NO bright saffron, NO neon colors, NO light-toned backgrounds`
    : `COLOR PALETTE (use ONLY these six colors):
- Saffron/orange: #C75B12
- Deep indigo/blue: #2D3A87
- Terracotta/brown: #B85C3A
- Forest green: #1A6847
- Gold/amber: #C4A24E
- Cream background: #FDF6E3
- NO bright green grass, NO blue sky, NO purple, NO neon colors, NO black backgrounds`;
}

function buildPrompt(verseData, chapterMeta) {
  const characters = getRelevantCharacters(verseData);
  const scene = buildSceneDescription(verseData, chapterMeta);
  const artStyle = chapterMeta.folk_art_style || 'madhubani';
  const styleConfig = STYLE_PROMPTS[artStyle] || STYLE_PROMPTS.madhubani;

  const characterBlock = characters.length > 0
    ? `\nCHARACTERS (use these exact visual attributes):\n${characters.map(c => `- ${c}`).join('\n')}\n`
    : '';

  // When Krishna and Arjuna share a scene, Krishna (Bhagavan, the divine
  // teacher) must always read as the larger, more prominent figure — even
  // when he is the charioteer and Arjuna the seated warrior.
  const charText = characters.join(' ').toLowerCase();
  const krishnaProminence = (charText.includes('krishna') && charText.includes('arjuna'))
    ? `\nCOMPOSITION (CRITICAL — Krishna's prominence):
- Krishna is the Lord (Bhagavan) giving the teaching; he MUST be the visually dominant figure.
- Render Krishna at least as tall as — and ideally taller and larger than — Arjuna, never smaller or slighter.
- This holds even when Krishna stands as the charioteer and Arjuna is seated: scale Krishna up so he is clearly the more prominent, commanding presence.
- Give Krishna a radiant golden halo and place him so the eye is drawn to him first.
`
    : '';

  const colorPalette = buildColorPalette(artStyle);
  const medium = styleConfig.fineArt ? 'classical oil-painting style' : 'folk art style';
  const borderLine = styleConfig.fineArt
    ? '- Composition is a borderless cinematic canvas — NO decorative frame or folk border'
    : '- Border must be dense with traditional motifs matching the series style';

  return `Create a ${styleConfig.name} ${medium} illustration for a children's book about the Bhagavad Gita.

SCENE:
${scene}
${characterBlock}${krishnaProminence}
${styleConfig.prompt}

${colorPalette}

${NO_TEXT_BLOCK}

${FIDELITY_BLOCK}

SERIES COHESION:
- Use the style of classic ${styleConfig.name} paintings as your reference
${borderLine}

FORMAT: Landscape orientation 16:9 aspect ratio (1408×768 px), suitable for full-width web display in a children's book.`.trim();
}

/**
 * Build a CHAPTER COVER prompt — an emblematic title-page illustration that
 * captures the whole chapter's theme (from meta.summary), NOT a single verse.
 * Distinct from every verse panel: centered, iconic, frontispiece composition.
 */
function buildCoverPrompt(chapterMeta) {
  const artStyle = chapterMeta.folk_art_style || 'madhubani';
  const styleConfig = STYLE_PROMPTS[artStyle] || STYLE_PROMPTS.madhubani;
  const chapterNum = chapterMeta.number || '?';
  const chapterName = chapterMeta.name || '';
  const sanskritName = chapterMeta.sanskrit_name || chapterMeta.transliterated_name || '';
  const summary = chapterMeta.summary || '';

  // Infer characters from the chapter summary. The Gita is Krishna teaching
  // Arjuna, so include both as the framing figures unless the summary clearly
  // centres on the Kurukshetra court (Chapter 1).
  const inferred = getRelevantCharacters({ speaker: 'krishna', meaning: summary });
  const charText = inferred.map(c => c.toLowerCase()).join(' ');
  const courtChapter = /dhritarashtra|duryodhana|sanjaya|blind king|battlefield is set/.test(summary.toLowerCase());
  if (!courtChapter) {
    for (const key of ['krishna', 'arjuna']) {
      if (!charText.includes(key)) inferred.push(CHARACTER_REFS[key]);
    }
  }

  const characterBlock = inferred.length > 0
    ? `\nCHARACTERS (use these exact visual attributes):\n${inferred.map(c => `- ${c}`).join('\n')}\n`
    : '';

  const allChars = inferred.join(' ').toLowerCase();
  const krishnaProminence = (allChars.includes('krishna') && allChars.includes('arjuna'))
    ? `\nCOMPOSITION (CRITICAL — Krishna's prominence):
- Krishna is the Lord (Bhagavan) giving the teaching; he MUST be the visually dominant figure, with a radiant golden halo, drawing the eye first.
- Render Krishna at least as tall as — and ideally taller and larger than — Arjuna.
`
    : '';

  const colorPalette = buildColorPalette(artStyle);
  const medium = styleConfig.fineArt ? 'classical oil-painting style' : 'folk art style';

  return `Create a ${styleConfig.name} ${medium} CHAPTER-COVER illustration for the opening page of Chapter ${chapterNum} of a children's book about the Bhagavad Gita.

This is a TITLE-PAGE / FRONTISPIECE artwork — a single emblematic, symmetrical, devotional composition that captures the WHOLE chapter's theme. It is NOT a depiction of one specific verse; it is the iconic image that opens the chapter.

CHAPTER ${chapterNum}: ${chapterName} (${sanskritName})
CHAPTER THEME (illustrate this overarching idea, emblematically):
${summary}
${chapterMeta.cover_brief ? `\nCOVER ART DIRECTION (draw this literally): ${chapterMeta.cover_brief}\n` : ''}${characterBlock}${krishnaProminence}
COVER COMPOSITION:
- Centered, balanced and iconic — a frontispiece, not a busy narrative panel
- Weave in emblematic symbols that evoke this chapter's theme
- A richer, more ornamental border than a standard verse panel — this is the chapter's showpiece
- Distinct from a single-moment scene: aim for timeless and emblematic, like a temple banner for the chapter

${styleConfig.prompt}

${colorPalette}

ABSOLUTELY NO TEXT — THIS IS THE SINGLE MOST IMPORTANT RULE:
- The image MUST NOT contain ANY text or writing of ANY kind. Zero words. Zero letters.
- Forbidden: the chapter name or theme written out, captions, titles, labels naming figures or objects, chapter numbers, signatures, color swatches, and ANY script — English/Latin letters, Sanskrit, Devanagari, or Om (ॐ) rendered as a written glyph.
- Do NOT label the two sides of the scene, do NOT spell out any words from the theme, do NOT inscribe anything on banners, scrolls, books, or borders.
- If you are ever about to draw a letter or word, draw a decorative folk-art motif (flower, dot pattern, vine) in its place instead.
- The finished image is PURE ARTWORK ONLY — completely free of text.

${FIDELITY_BLOCK}

SERIES COHESION:
- Use the style of classic ${styleConfig.name} paintings as your reference
- Border must be dense with traditional motifs matching the series style

FORMAT: Landscape orientation 16:9 aspect ratio (1408×768 px), suitable for full-width web display in a children's book.`.trim();
}

async function generateCover(chapter, options = {}) {
  const { regenerate = false, dryRun = false } = options;

  console.log(`\n=== Chapter ${chapter.meta.number} COVER — ${chapter.meta.name} ===`);
  console.log(`  Art style: ${chapter.meta.folk_art_style}`);

  const outputPath = join(chapter.outputDir, 'cover.png');

  if (existsSync(outputPath) && !regenerate) {
    console.log(`  Skipping (already exists). Use --regenerate to overwrite.`);
    return { skipped: true, path: outputPath };
  }

  const prompt = buildCoverPrompt(chapter.meta);

  console.log('\n--- COVER PROMPT ---');
  console.log(prompt);
  console.log('--- END PROMPT ---\n');

  if (dryRun) {
    console.log('  [dry-run] Skipping API call.');
    return { dryRun: true, prompt };
  }

  const apiKey = readApiKey();
  console.log('  Calling Gemini API...');
  const startTime = Date.now();
  const { base64, mimeType, model } = await generateImageWithRetry([{ text: prompt }], apiKey);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Success via ${model} in ${elapsed}s (mimeType: ${mimeType})`);

  saveImage(base64, outputPath, mimeType);
  return { success: true, path: outputPath, model, elapsed };
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

export async function generateImageWithRetry(parts, apiKey, maxRetries = 3) {
  // IMAGE_PROVIDER=codex routes generation through `codex exec` (ChatGPT login) instead of Gemini.
  if (process.env.IMAGE_PROVIDER === 'codex') {
    const { generateImageViaCodex } = await import('./lib/codex-image.mjs');
    console.log('  Provider: codex');
    return generateImageViaCodex(parts, { label: process.env.CODEX_LABEL || 'image' });
  }

  const models = IMAGE_MODELS;

  for (const model of models) {
    console.log(`  Trying model: ${model}`);
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body = {
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // If model not found, try the next model immediately
          if (response.status === 404) {
            console.warn(`  Model ${model} not found (404), trying fallback...`);
            break; // break inner retry loop, try next model
          }
          // Rate limit — back off and retry
          if (response.status === 429) {
            const delay = Math.pow(2, attempt) * 2000;
            console.warn(`  Rate limited. Retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        // Extract base64 image from response parts
        const respParts = data?.candidates?.[0]?.content?.parts ?? [];
        for (const part of respParts) {
          if (part?.inlineData?.data) {
            return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png', model };
          }
        }

        // If we got a response but no image data, log the text response
        const textParts = respParts.filter(p => p.text).map(p => p.text).join(' ');
        if (textParts) {
          console.warn(`  Model returned text instead of image: ${textParts.slice(0, 200)}`);
        }
        throw new Error('No image data in response');

      } catch (err) {
        if (attempt < maxRetries - 1 && !err.message.includes('API error')) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`  Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
  }

  throw new Error('All models and retries exhausted');
}

// ---------------------------------------------------------------------------
// Save image
// ---------------------------------------------------------------------------

export function saveImage(base64Data, outputPath, mimeType = 'image/png') {
  mkdirSync(dirname(outputPath), { recursive: true });
  const buffer = Buffer.from(base64Data, 'base64');

  // If API returns JPEG but we want PNG, convert via sharp or warn
  const isJpeg = mimeType === 'image/jpeg' || buffer[0] === 0xFF && buffer[1] === 0xD8;
  if (isJpeg && outputPath.endsWith('.png')) {
    console.warn(`  ⚠ API returned JPEG data — saving as .png (browser-compatible, not true PNG)`);
  }

  writeFileSync(outputPath, buffer);
  const kb = (buffer.length / 1024).toFixed(1);
  console.log(`  Saved: ${outputPath} (${kb} KB, ${isJpeg ? 'JPEG' : 'PNG'} data)`);
}

// ---------------------------------------------------------------------------
// Core: generate one verse illustration
// ---------------------------------------------------------------------------

async function generateIllustration(verseNum, chapter, options = {}) {
  const { regenerate = false, dryRun = false } = options;

  console.log(`\n=== Chapter ${chapter.meta.number}, Verse ${verseNum} ===`);

  const verseData = readVerseData(verseNum, chapter.versesDir);
  console.log(`  Speaker: ${verseData.speaker}`);
  console.log(`  Story: "${verseData.story_title}"`);
  console.log(`  Art style: ${chapter.meta.folk_art_style}`);

  const outputPath = join(chapter.outputDir, `${verseData.padded_number}.png`);

  // Check if already exists (skip unless --regenerate)
  if (existsSync(outputPath) && !regenerate) {
    console.log(`  Skipping (already exists). Use --regenerate to overwrite.`);
    return { skipped: true, path: outputPath };
  }

  const prompt = buildPrompt(verseData, chapter.meta);

  console.log('\n--- PROMPT ---');
  console.log(prompt);
  console.log('--- END PROMPT ---\n');

  if (dryRun) {
    console.log('  [dry-run] Skipping API call.');
    return { dryRun: true, prompt };
  }

  const apiKey = readApiKey();

  console.log('  Calling Gemini API...');
  const startTime = Date.now();

  const { base64, mimeType, model } = await generateImageWithRetry([{ text: prompt }], apiKey);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  Success via ${model} in ${elapsed}s (mimeType: ${mimeType})`);

  saveImage(base64, outputPath, mimeType);
  return { success: true, path: outputPath, model, elapsed };
}

// ---------------------------------------------------------------------------
// Batch mode
// ---------------------------------------------------------------------------

async function generateBatch(rangeStr, chapter, options = {}) {
  const match = rangeStr.match(/^(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid batch range: "${rangeStr}". Use format like "11-20".`);
  }
  const from = parseInt(match[1], 10);
  const to = parseInt(match[2], 10);

  if (from > to) throw new Error('Batch range start must be <= end.');

  console.log(`\nBatch mode: Chapter ${chapter.meta.number}, verses ${from} to ${to} (${chapter.meta.folk_art_style} style)`);
  const results = [];

  for (let v = from; v <= to; v++) {
    try {
      const result = await generateIllustration(v, chapter, options);
      results.push({ verse: v, ...result });
    } catch (err) {
      console.error(`  ERROR for verse ${v}: ${err.message}`);
      results.push({ verse: v, error: err.message });
    }

    // Polite delay between API calls to avoid rate limits
    if (v < to) {
      console.log('  Waiting 3s before next request...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n=== Batch Summary ===');
  for (const r of results) {
    if (r.error) {
      console.log(`  Verse ${r.verse}: ERROR — ${r.error}`);
    } else if (r.skipped) {
      console.log(`  Verse ${r.verse}: skipped (already exists)`);
    } else if (r.dryRun) {
      console.log(`  Verse ${r.verse}: dry-run`);
    } else {
      console.log(`  Verse ${r.verse}: OK — ${r.path}`);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    chapter: null,
    verse: null,
    batch: null,
    cover: false,
    allChapters: false,
    regenerate: false,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--chapter':
        opts.chapter = args[++i];
        break;
      case '--cover':
        opts.cover = true;
        break;
      case '--all':
        opts.allChapters = true;
        break;
      case '--verse':
        opts.verse = parseInt(args[++i], 10);
        break;
      case '--batch':
        opts.batch = args[++i];
        break;
      case '--regenerate':
        opts.regenerate = true;
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      default:
        console.warn(`Unknown argument: ${args[i]}`);
    }
  }

  return opts;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/generate-illustration.mjs --chapter <N|slug> --verse <N>
  node scripts/generate-illustration.mjs --chapter <N|slug> --batch <from>-<to>
  node scripts/generate-illustration.mjs --chapter <N|slug> --cover  (thematic chapter cover)
  node scripts/generate-illustration.mjs --cover --all              (covers for all active chapters)
  node scripts/generate-illustration.mjs --verse <N>                (defaults to chapter 1)
  node scripts/generate-illustration.mjs --verse <N> --regenerate
  node scripts/generate-illustration.mjs --batch <from>-<to> --dry-run

Examples:
  node scripts/generate-illustration.mjs --chapter 12 --verse 1
  node scripts/generate-illustration.mjs --chapter 12 --batch 1-20
  node scripts/generate-illustration.mjs --verse 11
  node scripts/generate-illustration.mjs --verse 4 --regenerate
  node scripts/generate-illustration.mjs --batch 11-20
`.trim());
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.verse && !opts.batch && !opts.cover) {
    printUsage();
    process.exit(1);
  }

  // Cover mode: generate one chapter-cover, or all active chapters' covers.
  if (opts.cover) {
    const coverOpts = { regenerate: opts.regenerate, dryRun: opts.dryRun };

    if (opts.allChapters || (!opts.chapter)) {
      // All active chapters
      const entries = readdirSync(CHAPTERS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort();
      const active = entries.filter(slug => {
        const metaPath = join(CHAPTERS_DIR, slug, 'meta.yaml');
        return existsSync(metaPath) && /^status:\s*active\s*$/m.test(readFileSync(metaPath, 'utf-8'));
      });
      console.log(`Cover batch: ${active.length} active chapters`);
      const results = [];
      for (let i = 0; i < active.length; i++) {
        const chapter = resolveChapterSync(active[i]);
        try {
          results.push({ slug: active[i], ...(await generateCover(chapter, coverOpts)) });
        } catch (err) {
          console.error(`  ERROR for ${active[i]}: ${err.message}`);
          results.push({ slug: active[i], error: err.message });
        }
        if (i < active.length - 1 && !opts.dryRun) {
          console.log('  Waiting 3s before next request...');
          await new Promise(r => setTimeout(r, 3000));
        }
      }
      console.log('\n=== Cover Batch Summary ===');
      for (const r of results) {
        if (r.error) console.log(`  ${r.slug}: ERROR — ${r.error}`);
        else if (r.skipped) console.log(`  ${r.slug}: skipped (exists)`);
        else if (r.dryRun) console.log(`  ${r.slug}: dry-run`);
        else console.log(`  ${r.slug}: OK — ${r.path}`);
      }
      return;
    }

    const chapter = resolveChapterSync(opts.chapter);
    console.log(`Chapter: ${chapter.meta.number} — ${chapter.meta.name} (${chapter.slug})`);
    await generateCover(chapter, coverOpts);
    return;
  }

  // Resolve chapter (default to 1 for backward compatibility)
  const chapterArg = opts.chapter || '1';
  const chapter = resolveChapterSync(chapterArg);
  console.log(`Chapter: ${chapter.meta.number} — ${chapter.meta.name} (${chapter.slug})`);
  console.log(`Art style: ${chapter.meta.folk_art_style}`);

  if (opts.verse) {
    if (isNaN(opts.verse) || opts.verse < 1) {
      console.error('Error: --verse must be a positive integer.');
      process.exit(1);
    }
    await generateIllustration(opts.verse, chapter, { regenerate: opts.regenerate, dryRun: opts.dryRun });
  } else if (opts.batch) {
    await generateBatch(opts.batch, chapter, { regenerate: opts.regenerate, dryRun: opts.dryRun });
  }
}

// Only run the CLI when this file is executed directly, not when imported
// (Tasks 3/4/6 import the exported helpers from this module).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error('\nFatal error:', err.message);
    process.exit(1);
  });
}
