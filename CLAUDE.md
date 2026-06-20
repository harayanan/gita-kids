# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An illustrated, interactive children's book (ages 8-12) of the Bhagavad Gita, built as an Astro static site. Each verse gets a YAML content file, a Madhubani folk art illustration, and a kid-friendly retelling. Deployed at https://gitakids.com.

## Commands

```bash
npm run dev       # Astro dev server (localhost:4321)
npm run build     # Static site build to dist/
npm run preview   # Preview built site locally
```

Illustration generation (requires GEMINI_API_KEY in `/root/claudecode/mutual-fund-dost/.env.local`):
```bash
node scripts/generate-illustration.mjs --chapter 12 --verse 1
node scripts/generate-illustration.mjs --chapter 12 --batch 1-20
node scripts/generate-illustration.mjs --chapter 12 --verse 4 --regenerate
node scripts/generate-illustration.mjs --verse 11                  # defaults to chapter 1
node scripts/generate-illustration.mjs --batch 11-20 --dry-run
```

## Architecture

**Stack:** Astro 5.7, React 19 (islands), Tailwind 3, TypeScript. No database, no API routes — pure static site generation.

### Content System (YAML-driven, not Astro Content Collections)

Content lives in `content/chapters/` and is loaded at build time via `src/lib/content.ts` using `node:fs` + `js-yaml`. This is a custom loader, not Astro's built-in content collections.

```
content/chapters/{chapter-slug}/
├── meta.yaml          # Chapter metadata (number, name, sanskrit_name, verse_count, folk_art_style, status)
├── verses/
│   ├── 001.yaml       # Verse content (chapter, verse, speaker, sanskrit, transliteration, dhatu_breakdown, meaning, story, reflection)
│   ├── 002.yaml
│   └── ...
└── illustrations/     # Source illustrations (also copied to public/)
```

- All 18 chapter `meta.yaml` files exist; only chapters with `status: active` generate pages
- Verse files are zero-padded three digits (001.yaml, not 1.yaml)
- Each verse YAML contains: sanskrit text, transliteration, dhatu_breakdown (word-by-word etymology), child-friendly meaning, a narrative story (300-500 words with named characters), and a reflection question
- `speaker` field drives page color theming (5 speakers: dhritarashtra, sanjaya, duryodhana, arjuna, krishna)

### Page Generation

Dynamic routes in `src/pages/chapters/[chapter]/`:
- `index.astro` — chapter index page (verse list with speaker tags)
- `[verse].astro` — individual verse page, uses `getStaticPaths()` to enumerate all active chapter verses

Illustrations are served from `public/illustrations/{chapter-slug}/{verse}.png` — the verse page checks for file existence at build time.

### Component Hierarchy

`ShlokaCard.astro` is the main verse page component, composing:
1. `SpeakerTag` — speaker badge
2. Illustration (full-bleed image)
3. `SanskritText` — devanagari + transliteration
4. `DhatuBreakdown` — collapsible word-by-word etymology accordion
5. `Tooltip` (React island) — glossary hover tooltips in meaning text
6. `StoryBlock` — narrative story with drop cap
7. Reflection question
8. `FolkArtBorder` — inline SVG folk art decorative borders (5 style variants)

### Design System

Tailwind custom theme in `tailwind.config.mjs`:
- **Colors:** saffron (#C75B12), indigo (#2D3A87), cream (#FDF6E3), forest (#1A6847), terracotta (#B85C3A), gold (#C4A24E)
- **Fonts:** `font-devanagari` (Noto Serif Devanagari), `font-body` (Source Serif 4), `font-ui` (Inter)
- **Layout:** `max-w-reading` (720px) content column
- **Effects:** Paper texture overlay, page vignette, scroll-reveal animations, reading progress bar, nav scroll compression — all in `BaseLayout.astro`
- Speaker-based CSS custom properties (`--speaker-accent`, `--speaker-bg`) in `global.css`

### Illustration Pipeline

`scripts/generate-illustration.mjs` calls the Gemini image generation API. Prompts are auto-constructed from verse YAML data + character reference sheet + Madhubani style constraints (all defined in `docs/illustration-guidelines.md`). The script enforces: mythological scenes only (no modern analogies), consistent character designs, 6-color palette, 16:9 landscape format.

### Glossary

`src/data/glossary.yaml` — flat list of `{term, definition}` entries. The `Tooltip` React component renders inline glossary hover definitions on verse meaning text.

## Content Authoring

When writing new verse YAML files, follow the established pattern in existing verses:
- Stories should be 300-500 words with sensory detail, varied openings, and named characters
- Stories illustrate the *mythological* scene; modern analogies are kept subtle
- `dhatu_breakdown` entries: `{word (devanagari), parts (array of "root (english)" strings), meaning}`
- Speaker must match one of: dhritarashtra, sanjaya, duryodhana, arjuna, krishna
- Each chapter has a `folk_art_style` that determines its illustration style and `FolkArtBorder` variant

## Key Documentation

- `docs/illustration-guidelines.md` — character reference sheet, Madhubani constraints, color palette, regeneration priorities
- `docs/plans/2026-03-21-gita-for-kids-design.md` — original design spec
- `HANDOVER.md` — current project status and next steps
