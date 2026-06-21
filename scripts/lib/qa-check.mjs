// scripts/lib/qa-check.mjs
//
// Vision QA module for the image generation pipeline.
//
// - `parseVerdict(text)` is a pure function: it extracts the first JSON object
//   from a (possibly noisy / fenced) model response, treats any boolean field
//   that is `false` as a failed check (collected into `issues`), and computes
//   `overall_pass = issues.length === 0`.
// - `qaCheck(imagePath, brief, apiKey)` reads an image, POSTs it as inlineData
//   plus a mode-aware structured question to a Gemini multimodal model via
//   fetch, and returns `parseVerdict(responseText)`.
//
// The fetch / error / model-fallback style matches scripts/generate-illustration.mjs.

import { readFileSync } from 'node:fs';

// Multimodal (text + vision) models, tried in order.
const QA_MODELS = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
];

// Mode-aware question sets. Each key maps to a list of boolean fields the model
// must return. `specific` checks exact cast + action + cleanliness; the looser
// modes only check theme connection, style, and absence of text.
const QUESTION_SETS = {
  specific: ['cast_correct', 'action_present', 'no_extra_people', 'no_text', 'style_ok'],
  evocative: ['connected_to_theme', 'style_ok', 'no_text'],
  devotional: ['connected_to_theme', 'style_ok', 'no_text'],
};

/**
 * Extract the first JSON object from a text blob and verdict it.
 *
 * Any boolean field whose value is `false` is treated as a failed check and its
 * key is collected into `issues`. `overall_pass` is true iff there are no issues.
 *
 * @param {string} text
 * @returns {{ overall_pass: boolean, issues: string[], raw: object }}
 */
export function parseVerdict(text) {
  const str = String(text ?? '');
  const start = str.indexOf('{');
  if (start === -1) {
    throw new Error(`No JSON object found in QA response: ${str.slice(0, 200)}`);
  }

  // Walk forward, tracking string literals and brace depth, to find the
  // matching close brace for the first `{`.
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;
  for (let i = start; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error(`No complete JSON object found in QA response: ${str.slice(0, 200)}`);
  }

  let raw;
  try {
    raw = JSON.parse(str.slice(start, end + 1));
  } catch (err) {
    throw new Error(`Failed to parse QA verdict JSON: ${err.message}`);
  }

  const issues = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value === false) issues.push(key);
  }

  return { overall_pass: issues.length === 0, issues, raw };
}

/**
 * Build the mode-aware QA question for a brief.
 *
 * @param {{ relevance_mode?: string, cast?: string[], action?: string }} brief
 * @returns {string}
 */
function buildQaQuestion(brief) {
  const mode = brief?.relevance_mode || 'specific';
  const fields = QUESTION_SETS[mode] || QUESTION_SETS.specific;
  const cast = Array.isArray(brief?.cast) ? brief.cast.join(', ') : '';
  const action = brief?.action || '';

  const fieldDescriptions = {
    cast_correct: `cast_correct: does the image depict exactly these figures and only these figures: ${cast || '(none specified)'}`,
    action_present: `action_present: does the image clearly show this action/moment: "${action}"`,
    no_extra_people: 'no_extra_people: are there NO additional people beyond the specified cast',
    no_text: 'no_text: is the image FREE of any words, letters, labels, captions, or numbers',
    style_ok: 'style_ok: is the image in the correct Indian folk-art style (flat, patterned, decorative border, no 3D shading)',
    connected_to_theme: `connected_to_theme: does the image clearly connect to this theme/mood: "${action}"`,
  };

  const lines = fields.map((f) => `- ${fieldDescriptions[f] || f}`).join('\n');

  return `You are a strict visual QA reviewer for an illustrated children's book of the Bhagavad Gita.
Relevance mode: ${mode}.
Examine the attached image and answer each check with a boolean (true = passes, false = fails):
${lines}

Respond with ONLY a single JSON object whose keys are exactly: ${fields.join(', ')}.
Each value must be a boolean. Do not include any commentary outside the JSON object.`;
}

/**
 * Run a vision QA check on an image against its scene brief.
 *
 * Reads the image, POSTs it as inlineData plus a mode-aware structured question
 * to a Gemini multimodal model, and returns the parsed verdict.
 *
 * @param {string} imagePath - path to the image file (PNG/JPEG)
 * @param {{ relevance_mode?: string, cast?: string[], action?: string }} brief
 * @param {string} apiKey
 * @param {number} [maxRetries=3]
 * @returns {Promise<{ overall_pass: boolean, issues: string[], raw: object }>}
 */
export async function qaCheck(imagePath, brief, apiKey, maxRetries = 3) {
  const buffer = readFileSync(imagePath);
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const mimeType = isJpeg ? 'image/jpeg' : 'image/png';
  const base64 = buffer.toString('base64');

  const question = buildQaQuestion(brief);

  for (const model of QA_MODELS) {
    console.log(`  QA — trying model: ${model}`);
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body = {
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: question },
            ],
          }],
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
            console.warn(`  QA model ${model} not found (404), trying fallback...`);
            break; // break inner retry loop, try next model
          }
          // Rate limit — back off and retry
          if (response.status === 429) {
            const delay = Math.pow(2, attempt) * 2000;
            console.warn(`  QA rate limited. Retrying in ${delay / 1000}s...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts ?? [];
        const responseText = parts.filter(p => p.text).map(p => p.text).join(' ');
        if (!responseText) {
          throw new Error('No text in QA response');
        }

        return parseVerdict(responseText);

      } catch (err) {
        if (attempt < maxRetries - 1 && !err.message.includes('API error')) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`  QA attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }
  }

  throw new Error('All QA models and retries exhausted');
}
