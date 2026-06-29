# UI Refresh — Direction & Backlog (2026-06-29)

Visual-only refresh of gitakids.com. Goal: a beautiful, distinctive, fast site worthy of the content. **Do not change text, images (art), or flow** — presentation only. Image *files* may be optimized (format/size) but the artwork and the originals are preserved.

Live previews built this session (unlinked, `noindex`):
- Sample home (re-rooted identity): https://www.gitakids.com/preview/home
- Typography options (BG 2.47 in 4 systems): https://www.gitakids.com/preview/type
- Source: `src/pages/preview/home.astro`, `src/pages/preview/type.astro`

## Owner decisions so far
- **Images:** keep them as-is. Back up all final art at full resolution FIRST, then compress copies. See memory `preserve-hires-images-before-compression`.
- **Typography:** undecided — chose to compare options on `/preview/type` before committing.
- **Motion:** signature moments only (hero/illustration morph + restrained micro-interactions). No heavy ambient animation.

## Current-state findings
Three things hold the live site back:
1. **Aesthetic is near the generic AI-design default** (warm cream + high-contrast serif + terracotta accent). Pleasant but not specific to the Gita.
2. **Type is safe-but-generic** (Noto Serif Devanagari + Source Serif 4 + Inter); Devanagari and the IAST transliteration come from different families.
3. **Payload is heavy:** `public/illustrations/` ≈ 967 MB of baseline JPEGs saved as `.png` (1376×768, ~1.2 MB each), no AVIF/WebP, no `srcset`, no `width/height`; hero is the LCP element shipped raw.

Polish / a11y gaps: no `:focus-visible` states (WCAG fail); reduced-motion delay bug (inline `transition-delay` still fires); images cause CLS (no dimensions); paper texture at 0.03 opacity is invisible; speaker color-tint at 4% is imperceptible; drop-cap color hardcoded; tooltip repositions after it appears (flicker); mobile Sanskrit hierarchy inverts; FolkArtBorder has no fallback.

## Direction (thesis)
**Classical Indian book-making: an illuminated manuscript meets a folk-art gallery.** Warm, but every choice traces to the subject, not to editorial templates.
- The art is the only saturated thing on screen; quiet the chrome; frame each illustration as a museum "plate."
- Type from the world of classical Sanskrit publishing (Tiro Devanagari Sanskrit carries Devanagari + IAST in one family) + one literary display face.
- Ornament from the subject's geometry: one lightweight kolam/lotus SVG motif (≈1–2 KB, `currentColor`) for dividers, the Om mark, loaders, card corners.
- Per-chapter color identity from the six folk-art styles → the 18-chapter index reads as a shelf of distinct objects.
- **Signature element:** the illustration morphs from its index thumbnail into the full-bleed verse plate (shared-element View Transition — already ~90% wired; index just needs a matching `transition:name`).

### Proposed tokens
- Color: keep the six folk-art colors; gold restricted to hairlines + small caps (never fills); chrome quieter; jewel tones inside generous cream space; optional dark immersive hero.
- Type (sample uses): Tiro Devanagari Sanskrit + Fraunces (display) + Source Serif 4 (body) + Inter (UI). Alternatives on the type preview: Playfair Display, Spectral, Marcellus, Baloo 2.
- Measure/rhythm: reading column ~65ch, line-height 1.7, uniform vertical spacing.

## Backlog (sequence A → B → C → D)

**A. Foundation / speed (do regardless):**
- Convert illustrations to AVIF+WebP via `astro:assets` `<Picture>` with `widths`/`sizes` (≈967 MB → ~300 MB; ~60% lighter LCP). Back up originals first.
- Add `width/height` (16:9) to kill CLS; hero `fetchpriority=high` + preload, drop hero lazy-load.
- Self-host + subset Noto/Tiro Devanagari; preload critical weights.

**B. Identity:** Tiro + display face; per-chapter color; plate-framed illustrations; kolam ornament; quieter chrome; drop cap in display face with small-caps lead words.

**C. Delight (signature-only):** index→verse illustration morph; tuned View Transition curves (`cubic-bezier(0.22,1,0.36,1)`, ~0.45s); micro-interactions with easing tokens (nav underline-grow, ≤4px card lift, `:active` scale 0.97, tooltip enter-delay); optional per-speaker faint radial wash.

**D. Hygiene:** `:focus-visible` everywhere; fix reduced-motion delay; tooltip pre-positioning; tokenize hardcoded colors; make texture/speaker-tint perceptible; `content-visibility` on long lists.

## Key references (landscape research)
- Reading/literary: Stripe Press, The Pudding, Guardian Long Read, Gwern (sidenotes), Aeon, Tufte CSS, Typewolf, Klim, Pangram Pangram (PP Editorial New).
- Type/Devanagari: Tiro Devanagari Sanskrit (Murty Classical Library), Noto Serif pairing, Ek Type (Mukta/Baloo 2).
- Cultural/sacred/kids: Rijksstudio, Google Arts & Culture, Sefaria, MAP Academy, Public Domain Review, Pok Pok Playroom, Tinybop, Nosy Crow, Khan Academy Kids, Flying Eye Books, MeMeraki, kolam/rangoli generative geometry.
- Perf/motion: CSS scroll-driven animations (`animation-timeline`), View Transitions API (Astro ClientRouter), `content-visibility`, AVIF/WebP via `astro:assets`, easing tokens.

## Open tasks
1. Back up hi-res originals, then run the AVIF/WebP + responsive compression pass (item A1).
2. Owner picks a type system from `/preview/type`.
3. Owner reacts to `/preview/home`; decide how far to roll the identity into the real pages.
