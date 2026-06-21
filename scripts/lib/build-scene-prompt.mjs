// scripts/lib/build-scene-prompt.mjs
//
// Assembles the image-generation text prompt for a single verse from its
// scene BRIEF (action / setting / props), the chapter's folk-art style block,
// the shared colour palette, the NO-TEXT block, and a 16:9 format line.
//
// For `relevance_mode === 'specific'` the prompt names the exact cast and
// forbids any other people. For `evocative` / `devotional` it omits the
// strict-cast line and adds a one-line mood cue instead.

import { STYLE_PROMPTS, buildColorPalette } from '../generate-illustration.mjs';

const NO_TEXT_BLOCK = `CRITICAL — NO TEXT IN THE IMAGE:
- Do NOT include any words, letters, labels, captions, titles, chapter numbers, or color swatches
- Do NOT render any text overlays, legends, or annotations
- The image must contain ONLY the illustration — pure artwork with no text whatsoever`;

const FORMAT_BLOCK = `FORMAT: Landscape orientation 16:9 aspect ratio (1408×768 px), suitable for full-width web display in a children's book.`;

/**
 * Build the scene prompt for one verse.
 *
 * @param {object} brief        A validated Brief (see scene-briefs.mjs).
 * @param {object} chapterMeta  { number, name, folk_art_style }.
 * @param {string} style        Folk-art style key (e.g. 'madhubani').
 * @returns {string}
 */
export function buildScenePrompt(brief, chapterMeta, style) {
  const styleConfig = STYLE_PROMPTS[style] || STYLE_PROMPTS.madhubani;
  const chapterName = chapterMeta?.name || '';
  const chapterNum = chapterMeta?.number ?? '?';

  const props = Array.isArray(brief.props) ? brief.props.filter(Boolean) : [];
  const propsLine = props.length > 0 ? `\nProps: ${props.join(', ')}.` : '';

  // SCENE block draws from the BRIEF (action/setting/props), not the abstract meaning.
  const sceneBlock = `SCENE:
Chapter ${chapterNum} (${chapterName}), Verse ${brief.verse} of the Bhagavad Gita.
Action: ${brief.action}
Setting: ${brief.setting}.${propsLine}

Illustrate the MYTHOLOGICAL scene — divine figures, ancient India settings, sacred landscapes. Do NOT illustrate any modern analogy or contemporary scene.`;

  // Cast / mood block depends on relevance_mode.
  let relevanceBlock;
  if (brief.relevance_mode === 'specific') {
    const names = Array.isArray(brief.cast) ? brief.cast.join(', ') : '';
    relevanceBlock = `CAST: depict exactly these figures: ${names}. No other people.`;
  } else {
    relevanceBlock = `MOOD: an evocative, on-theme image that connects to "${brief.action}" — beautiful and atmospheric rather than literal.`;
  }

  const notesBlock = brief.notes ? `\nNOTES: ${brief.notes}` : '';

  return `Create a ${styleConfig.name} folk art style illustration for a children's book about the Bhagavad Gita.

${sceneBlock}

${relevanceBlock}${notesBlock}

${styleConfig.prompt}

${buildColorPalette(style)}

${NO_TEXT_BLOCK}

${FORMAT_BLOCK}`.trim();
}
