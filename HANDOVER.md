# Gita Kids — Handover

## Current Status: ALL 18 CHAPTERS COMPLETE (701 verses), fully illustrated

The complete Bhagavad Gita is live at https://gitakids.com — all 18 chapters, 701 verses, ~699 folk-art illustrations across six regional styles (Madhubani, Gond, Pattachitra, Warli, Kalamkari, Pichwai), plus back matter. Every verse has Sanskrit (Devanagari + IAST), a complete word-by-word breakdown, a child-friendly meaning, a 300–500 word story, and a reflection question.

| Ch | Name | Verses | Style |
|----|------|--------|-------|
| 1 | Arjuna Vishada Yoga | 47 | Pichwai |
| 2 | Sankhya Yoga | 72 | Gond |
| 3 | Karma Yoga | 43 | Pattachitra |
| 4 | Jnana Karma Sannyasa Yoga | 42 | Warli |
| 5 | Karma Sannyasa Yoga | 29 | Kalamkari |
| 6 | Dhyana Yoga | 47 | Madhubani |
| 7 | Jnana Vijnana Yoga | 30 | Pichwai |
| 8 | Akshara Brahma Yoga | 28 | Pattachitra |
| 9 | Raja Vidya Raja Guhya Yoga | 34 | Warli |
| 10 | Vibhuti Yoga | 42 | Kalamkari |
| 11 | Vishvarupa Darshana Yoga | 55 | Madhubani |
| 12 | Bhakti Yoga | 20 | Pichwai |
| 13 | Kshetra-Kshetrajna Vibhaga Yoga | 35 | Pattachitra |
| 14 | Gunatraya Vibhaga Yoga | 27 | Warli |
| 15 | Purushottama Yoga | 20 | Kalamkari |
| 16 | Daivasura Sampad Vibhaga Yoga | 24 | Madhubani |
| 17 | Shraddhatraya Vibhaga Yoga | 28 | Pichwai |
| 18 | Moksha Sannyasa Yoga | 78 | Pattachitra |

Plus **Gitamahatmyam** (18 stories) and front/back matter. Build: 726 pages.

## What Was Done This Session (2026-06-28)

**Per-chapter thematic cover images.** Each chapter index page (`/chapters/{slug}/`) previously reused that chapter's verse-1 illustration (`001.png`) as its hero. Owner asked for a distinct image at each chapter beginning. Added a **`--cover` mode** to `scripts/generate-illustration.mjs` that builds the prompt from chapter `meta.yaml` (`name`, `sanskrit_name`, `summary`, `folk_art_style`) rather than a single verse — an emblematic, centered, frontispiece composition in the chapter's folk-art style, distinct from any verse panel. New helpers: `buildCoverPrompt()` + `generateCover()`; CLI `--cover` (one chapter) and `--cover --all` (all active chapters, 3s spacing); `resolveChapterSync` now also parses `summary`/`sanskrit_name`. Krishna-prominence + epithet character inference reused from verse pipeline.

Generated **18 covers** → `public/illustrations/{slug}/cover.png`. `src/pages/chapters/[chapter]/index.astro` now prefers `cover.png`, falling back to `001.png`. Verse pages unchanged. Build clean (744 pages); built chapter HTML confirmed referencing `cover.png`. Covers verified by eye (Ch1, Ch12) — Pichwai dark-ground jewel tones, Krishna haloed/dominant, no text. **Not yet committed/deployed.**

## What Was Done This Session (2026-06-22)

**Ch1 character-fidelity fixes (owner feedback).** Two corrections to the Pichwai Ch1 set:
1. **Bhishma now bearded + moustached.** Owner noted he was rendered clean-shaven; popular media always shows him with a full white beard and moustache. Updated the Bhishma character ref in `scripts/generate-illustration.mjs` (`CHARACTER_REFS.bhishma`) and `docs/illustration-guidelines.md` §1, then regenerated the images where Bhishma is prominent: **008, 010, 025**. (012 already had the beard; 011/013/032/044 only mention him in text / show him in the far background — left as-is.)
2. **Krishna now larger / more prominent than Arjuna.** In several two-shots Krishna read smaller/slighter than Arjuna — wrong, since he is Bhagavan giving the teaching. Updated `CHARACTER_REFS.krishna` ("largest, tallest, most prominent figure; radiant golden halo") and added a **COMPOSITION rule in `buildPrompt`** that fires whenever both Krishna and Arjuna are in a scene (Krishna ≥ Arjuna in height/scale, dominant, haloed, even as charioteer). Also extended `getRelevantCharacters` to detect **epithets** (Partha/Dhananjaya/Kaunteya → Arjuna; Madhava/Hrishikesha/Govinda/Keshava/etc → Krishna) so the rule fires on verses that use epithets rather than plain names (e.g. v25 "O Partha"). Regenerated the offenders: **015, 020, 024, 025, 030**.

All regenerated images verified by eye — Bhishma bearded, Krishna dominant with halo, Pichwai dark-ground jewel-tone style intact (Ch12 benchmark level). `008`/`010` also synced to the stale `content/.../illustrations/` mirror. Owner then asked to apply the Krishna-prominence fix to the four borderline two-shots too, so **014, 021, 028, 047** were also regenerated (Krishna now clearly larger/haloed in each). Total images regenerated: **008, 010, 014, 015, 020, 021, 024, 025, 028, 030, 047** (11). **Committed + deployed to production 2026-06-22** (`vercel deploy --prod` → https://www.gitakids.com, 744 pages); live images verified HTTP 200.

## What Was Done This Session (2026-06-21)

**Mobile apps (Stream A) + image-system redesign (Stream B) started.** See **`docs/MOBILE-APPS.md`** for the full, durable build reference (architecture, commands, JDK 21 requirement, delivery, phase-2 plan, image-system design, image roadmap). In short: Android app scaffolded with **Capacitor 8 as a Remote WebView** (`server.url = gitakids.com`, so content/image edits appear with no app rebuild); debug APK builds clean (~4 MB) — **requires JDK 21** (JDK 17 fails). Delivery is **GitHub Actions → `android-latest` release APK** (`.github/workflows/android.yml`). iOS deferred (needs a Mac). Image redesign built: spec (`docs/superpowers/specs/2026-06-21-gita-image-pipeline-design.md`) + plan (`docs/superpowers/plans/2026-06-21-image-pipeline-ch1.md`); pipeline modules done + tested (brief loader, scene-prompt, ref-images, QA). **47 Ch1 scene briefs** written (`content/chapters/01-arjuna-vishada-yoga/scene-briefs.yaml`, awaiting final review) and **all 9 Madhubani character model sheets locked** (`assets/character-refs/madhubani/`; generators: `scripts/generate-character-sheet.mjs`, `scripts/gen-icon.mjs`, `scripts/finalize-icon.mjs`). App polish shipped: peacock-feather **app icon** (Option 3), **favicon**, **"Gita Kids" splash**, and best-practice **edge-to-edge bars** (transparent, forced-dark icons for dark mode, subtle warm `#F0E2C0` bar-bands). Owner **LOVES the Ch12 Pichwai illustrations — the quality benchmark** (see `docs/illustration-guidelines.md` §6). **NEXT (iterate later):** build the orchestrator (plan Task 6) → generate the 5-verse Ch1 sample → approve → full 47 + QA, then roll the pipeline to all 18 chapters.

**DIRECTION CHANGE (owner, 2026-06-21 EOD):** Do **Chapter 1 in PICHWAI** style (not Madhubani) — Pichwai is the owner's favourite (Ch12 benchmark) and Ch1 is the first impression. Also wants the **home page (and front matter "etc")** to reflect Pichwai — scope TBC (Pichwai hero art vs. visual restyle; which pages). Implications: (a) Ch1 `meta.yaml` folk_art_style madhubani→pichwai once new art is ready (don't switch before, the live Madhubani images would mismatch); (b) need **Pichwai** character model sheets (the 9 just-locked Madhubani sheets are NOT wasted — they now serve the other Madhubani chapters 6/11/16); (c) the 47 Ch1 scene briefs are **style-agnostic — reusable as-is**; (d) the Pichwai STYLE_PROMPT in generate-illustration.mjs is currently devotional/Krishna-centric (cows, lotus ponds) — it must be **adapted for narrative/battlefield scenes** (keep dark-ground jewel-tone richness, drop forced devotional elements) before generating Ch1's muster/war scenes. Open question for owner: deeper home-page treatment (the hero auto-updated, but a fuller Pichwai restyle is still optional).

**DONE (autonomous, 2026-06-21 night):** Chapter 1 fully **regenerated in Pichwai (47/47)** via the new pipeline. Added a `pichwai-narrative` style (Nathdwara dark jewel-tone richness adapted for battlefield/narrative — not forced devotional); generated + locked **9 Pichwai character sheets** (`assets/character-refs/pichwai-narrative/`); built **`scripts/generate-chapter.mjs`** (orchestrator: briefs + ref images → scene → save); switched Ch1 `meta.yaml` to `pichwai`; deployed. **Home-page hero auto-updated** (it points at Ch1 v1). Quality is Ch12-level; characters consistent (Krishna blue/peacock, Arjuna human+moustache, Sanjaya court-bard). **No automated QA loop** was run (first pass — for owner iteration). Note: `content/chapters/01-arjuna-vishada-yoga/illustrations/` still holds the OLD Madhubani source copies (stale; **`public/illustrations/` is authoritative** and drives the site) — minor cleanup. **NEXT iterate:** review the 47, regenerate any misses with `node scripts/generate-chapter.mjs --chapter 01-arjuna-vishada-yoga --batch N-N`; optionally a deeper home-page Pichwai restyle; then roll the pipeline to the other chapters (each needs its own per-style character sheets + briefs).

**Advaita Vedanta pass.** Audited all 701 verses (translations + stories) against the Śaṅkara / Madhusūdana Sarasvatī non-dual reading via 9 parallel agents. Finding: the book was already strongly Advaita-aligned (waves/ocean, one-fire-many-lamps, moon-in-pots imagery throughout; Ch 13 exemplary) and had **no mythological/factual errors**. Reworded **29 verses** in two passes to let the non-dual reading read through without stripping the devotional warmth (Madhusūdana keeps bhakti as culminating in non-difference):
- *Pass 1 (16 verses, conflicts + MEDIUMs):* Ch 18 carama-śloka cluster (18.61/62/65/66 — "Me/Lord" = the supreme Self / one's own deepest nature, surrender = dropping ego-doership; 18.61 recovers the māyā clause), mokṣa as becoming-not-relocating (8.5/8.15/8.21, 14.26/27), Ch 12 saguṇa→nirguṇa gradation (12.2/4), karma-purifies-toward-jñāna (3.19/20, 4.33), plus 2.61 and 11.54.
- *Pass 2 (13 verses, LOW polish):* non-dual undertone on the bhakti verses (3.4, 3.30, 4.37, 5.29, 6.30, 7.17, 7.18, 9.22, 9.34, 11.55, 18.54), plus 13.13 (Self is actionless; senses borrowed through bodies) and 15.7 ("never actually split into parts" — forecloses the literal-fragment reading).

Stories (Gajendra, kite/storm, Hanuman temple) kept; only their framing now points inward. Built clean (744 pages), deployed.
- *Pass 3 (second-audit refinements, 14 verses):* an independent strict re-audit (9 agents) confirmed the doctrine holds across 16/18 chapters and caught three genuine items + over-explained inserts. Doctrinal: 15.7 (story image moved from broken-shard/"little pieces of God" to the reflection model — one undivided Self in each whole mirror), 3.3 (karma subordinated to jñāna, not co-equal), 8.21 story (wakes to being the Imperishable, not a traveller arriving at an abode). Readability/style: tightened grafted glosses and removed "not X, but Y" / em-dash sentence-flips per the writing guide on 2.61, 5.29, 6.30, 7.18, 8.5, 8.15, 9.22, 9.34, 13.14, 18.62, 18.66.

**Two side items checked:** (1) The Saraswati river in the 12.2 story is *correct* — Indore sits at the Saraswati/Khan confluence (Indreshwar temple). (2) Ch 13 uses the 35-verse recension that counts Arjuna's opening question ("prakṛtiṁ puruṣaṁ caiva", file 001, speaker arjuna) as 13.1 — this is why the book totals 701, not the canonical 700. Internally consistent, not a bug. **Decided (HN, 2026-06-21): keep the 35-verse numbering** — it is a legitimate recension, internally consistent, and the URLs/illustrations are already live. No conversion to the canonical 700-count.

Added a per-chapter **verse summary page** at `/chapters/{slug}/summary` (`src/pages/chapters/[chapter]/summary.astro`). Each page shows one hero illustration (verse 1) and a two-column table of every verse: Sanskrit (Devanagari + IAST transliteration) on the left, English meaning + speaker tag on the right. The table is responsive — below the `md` breakpoint the header hides and each row collapses to a stacked card so it reads on mobile. Each chapter index page now links to its summary. Live and verified on all 18 chapters (e.g. https://gitakids.com/chapters/02-sankhya-yoga/summary/). Build: 744 pages.

## What Was Done This Session (2026-06-20)

Prioritized at user's request: complete chapters 3, 5, 10, 13 before others. Chapters 3 and 5 were already complete; authored and illustrated **Chapter 10** and **Chapter 13**. Then rebranded to **Gita Kids** (see below), ran a **word-by-word completeness pass**, authored + illustrated **Chapter 7**, and then **authored + illustrated all 7 remaining chapters (8, 9, 11, 14, 16, 17, 18)** — completing the entire Gita.

### Remaining chapters authored + illustrated this session — book COMPLETE
- **Ch8** (28, Pattachitra), **Ch9** (34, Warli), **Ch11** (55, Madhubani — full arjuna/krishna/sanjaya cosmic-vision speaker map), **Ch14** (27, Warli), **Ch16** (24, Madhubani — demonic content kept child-safe), **Ch17** (28, Pichwai), **Ch18** (78, Pattachitra — arjuna 1 & 73, krishna 2–72, sanjaya 74–78).
- Each: outline (`docs/chapter-NN-outline.md`) → 5–12 parallel authoring agents (complete dhatu_breakdown baked in) → independent Sanskrit audit → illustrations → shipped staging BOTH `content/chapters/<slug>` AND `public/illustrations/<slug>`.
- All Sanskrit audits 0 critical / 0 high; minor dhatu fixes applied (Ch17 v6 root, Ch18 v8/v65/v68). Speaker maps verified programmatically per chapter.
- New recurring modern characters by style: **Kiran/Thatha** (Kalamkari/Andhra), **Jeeva/Aaji** (Warli/Maharashtra), **Meera/Dadaji/Dadi** (Pichwai/Nathdwara), reusing **Ravi/Nani** (Madhubani/Mithila) and **Aarav/Dadu/Hari Uncle** (Pattachitra/Odisha).
- Pichwai illustration spot-checks confirmed correct dark-ground temple style; all chapters verified live (HTTP 200) on gitakids.com.

### Next steps (book content done)
- **TODO (HN requested 2026-06-21): read-aloud rhythm pass.** Doctrine is settled (3 Advaita passes done). This is a separate *spoken-cadence* polish — read each story aloud (or TTS) and fix only the stumbles: stacked clauses/tongue-twisters, sentence-length monotony, weak trailing words, hard-to-say name clusters, dialogue that doesn't sound like a real grandparent speaking. Touches nothing doctrinal/Sanskrit. Small output (a few word-swaps/sentence-splits per chapter). Start with Ch 2 as a sample.
- **Naming cleanup — DONE (2026-06-21):** Vercel project renamed `gita-for-kids` → `gita-kids` via API (project ID unchanged, so GitHub auto-deploy stays linked and gitakids.com is unaffected; default deploy URLs are now `gita-kids-*.vercel.app`). Removed the `for-shakti/gita-for-kids` symlink (single entry — `/home/claude/claudecode` and `/root/claudecode` share one filesystem, inode 8661438). Updated the two `claudecode/CLAUDE.md` references (parent dir is not a git repo; on-disk only). Left `docs/plans/2026-03-21-gita-for-kids-design.md` + its repo-CLAUDE.md mention as a dated historical record.
- Optional polish: image-optimization pipeline (WebP variants — images are still ~1.4MB JPEG-as-PNG) + PWA, as prerequisites for the iOS/Android apps (Capacitor) the user asked about.
- Vercel dashboard (still pending from rebrand): make `gitakids.com` apex primary; redirect `gitakids.org` → `gitakids.com`.

### Chapter 7 (Jnana Vijnana Yoga) authored + illustrated — NEW, complete
- **All 30 verses written** (Pichwai, all speaker=krishna) by 5 parallel agents per `docs/chapter-07-outline.md`. dhatu_breakdown authored COMPLETE (every particle/pronoun) from the start — no later completeness pass needed.
- **Sanskrit audited clean**: 0 critical, 0 high (1 optional stylistic gloss note on प्रणवः). dhatu completeness verified.
- **30 Pichwai illustrations generated**, zero failures. Spot-checked v8 (taste-in-water / sun+moon / Om) — correct Nathdwara Pichwai (dark ground, jewel tones, consistent Krishna). Live & verified (pages + images HTTP 200 on gitakids.com).
- **LESSON:** illustrations live in `public/illustrations/<slug>/`, NOT under `content/chapters/`. Must `git add` BOTH when shipping a chapter — the first Ch7 commit staged only `content/`, so images 404'd in prod until a follow-up commit added `public/illustrations/07-*`. For future chapters, stage both paths.

### Word-by-word (`dhatu_breakdown`) completeness pass — all chapters
The dhatu breakdowns were missing many words systemically — especially particles (च, तु, हि, एव, अपि, इति, न), pronouns (माम्, मे, यः, ये, तम्…), and sandhi-merged words (even the Ch12 reference verse omitted एवं/ये/त्वां/च/अपि/तेषां/के). Fixed via 17 Sanskrit-literate agents (one pilot on Ch12, then 16 across the rest):
- **2,976 word entries added across 242 verse files; pure additions (0 deletions)** — existing entries and all other fields (sanskrit, transliteration, meaning, story, reflection) untouched.
- Chapters **6, 13, and most of 10** were already complete (authored with full coverage); chapters 1–5, 12, 15 received the bulk of additions.
- Verified: all 397 verse YAMLs valid, all 9 fields present, every dhatu entry well-formed; heuristic gap-scan dropped 761→292 with the residual confirmed (by direct inspection) to be sandhi/anusvara false positives, not real gaps. Build passes; new chips render on verse pages.

### Chapter 10 (Vibhuti Yoga) authored + illustrated — NEW, complete
- **All 42 verses written** (Kalamkari) by 6 parallel agents against a shared outline spec (`docs/chapter-10-outline.md`). Speaker map: 12–18 = arjuna (Arjuna's hymn of praise + request), rest = krishna. Status flipped `coming_soon` → `active`.
- **Sanskrit audited** by an independent read-only agent: 0 critical, 0 high. 1 low orthographic fix applied (v41 `तेजोंऽश` → `तेजोंश` / `tejoṁ'śa` → `tejoṁśa`, normalising the avagraha to the Gita Press form). All vibhuti proper names verified in both scripts.
- **All 42 Kalamkari illustrations generated** via `node scripts/generate-illustration.mjs --chapter 10 --batch 1-42` — zero failures. Spot-checked v21 (sun/moon, Krishna among the Adityas) — correct Kalamkari style, consistent character designs. Same JPEG-data-as-.png caveat (1376×768).

### Chapter 13 (Kshetra-Kshetrajna Vibhaga Yoga) authored + illustrated — NEW, complete
- **All 35 verses written** (Pattachitra) by 5 parallel agents against `docs/chapter-13-outline.md`. Uses the **35-verse recension** (Arjuna's question as verse 1; v2 = `idaṁ śarīraṁ`). Speaker map: v1 = arjuna, 2–35 = krishna. Status flipped `coming_soon` → `active`.
- **Sanskrit audited clean** by an independent read-only agent: 0 critical, 0 high, 0 low across all 35 verses. Recension numbering verified (no off-by-one).
- **All 35 Pattachitra illustrations generated** via `node scripts/generate-illustration.mjs --chapter 13 --batch 1-35` — zero failures. Spot-checked v23 (two-birds-on-one-tree, Mundaka image) — correct Pattachitra style. Same JPEG-data-as-.png caveat (1376×768).

### Build & verification
- Build passes (414 pages). All 77 new verse pages reference and ship their images; dist contains 42 + 35 PNGs.

### Rebrand "Gita for Kids" → "Gita Kids" — DONE (this session)
Canonical domain **https://gitakids.com** (user's message said "gitakds.com" — typo; Vercel account owns `gitakids.com` + `gitakids.org`, so corrected to `gitakids.com`).
- **Display name** "Gita for Kids" → "Gita Kids" across all layouts/pages (titles, footer, og:title). Verified live: home `<title>` = "Gita Kids — Learn the Bhagavad Gita".
- **Slug/package** `gita-for-kids` → `gita-kids` (package.json + lock); `astro.config` site → `https://gitakids.com`; CLAUDE.md/HANDOVER URLs updated. (Dated archival plan docs under `docs/plans/`, `docs/superpowers/plans/` left as historical snapshots.)
- **Project folder** renamed `…/for-shakti/gita-for-kids` → `…/for-shakti/gita-kids`. A compatibility symlink `gita-for-kids → gita-kids` was left in `for-shakti/` so the live session (anchored to the old path) keeps working — **safe to delete**; update your Claude Code working-dir to the new path. Added git `safe.directory` for the new path.
- **GitHub repo** renamed `harayanan/gita-for-kids` → `harayanan/gita-kids` (`gh repo rename`); local remote updated; GitHub auto-redirects the old URL.
- **Deployed + verified live**: push to `main` auto-deployed to production (Vercel Git integration survived the GitHub rename — keys off repo ID). Home, Ch10/Ch13 indexes, verse pages, and images all HTTP 200.

### Domains — LIVE
DNS is pointed (name.com nameservers → Vercel A record 216.198.79.1). Both `gitakids.com` and `gitakids.org` serve the site (HTTP 200). Vercel **project name left as `gita-for-kids`** per user (deploys key off the stable projectId, so this is cosmetic only).

Canonical decided: **apex `https://gitakids.com`** (user's "gitakds.com" was a typo). Implemented in code:
- `<link rel="canonical">` + `og:url` on every page → `https://gitakids.com/<path>` (in `BaseLayout.astro`, via `Astro.site`). Regardless of which domain/www served the request, search engines see the apex as canonical.
- Hero `ॐ` divider: replaced the stylised hand-drawn Om SVG with the real ॐ glyph (Noto Serif Devanagari, gold, fade/scale-in, reduced-motion safe).

#### Remaining Vercel dashboard steps (domain-level; CLI 50.10.1 can't set redirects/primary)
Currently `gitakids.com` 308-redirects to `www.gitakids.com`, and `gitakids.org` serves a duplicate. To match the canonical:
1. **Make apex primary**: Project → Settings → Domains → set `gitakids.com` as the primary/production domain (so `www.gitakids.com` redirects to `gitakids.com`, not the reverse).
2. **Redirect .org → .com**: set `gitakids.org` (and `www.gitakids.org`) to **Redirect** to `gitakids.com` (301), instead of serving.
The canonical tag already protects SEO in the meantime, but the redirect removes the duplicate entirely.

## What Was Done This Session (2026-06-17)

**Deployed to production 2026-06-17** — Ch5 (commit `9ce1964`) and Ch6 text+illustrations, all verified live (HTTP 200).

### Chapter 6 (Dhyana Yoga) authored + illustrated — NEW, complete
- **All 47 verses written** (Madhubani) by 6 parallel agents against a shared outline spec (`docs/chapter-06-outline.md`). Speaker map: 33,34,37,38,39 = arjuna, rest = krishna. Status flipped `coming_soon` → `active`.
- **Sanskrit audited clean** by two independent read-only agents: 0 critical, 0 high across all 47 verses (canonical Devanagari + IAST char-for-char). 2 low-priority dhatu etymology fixes applied (6.22 `yam`→`yad`, 6.23 viyoga notation).
- **All 47 Madhubani illustrations generated** via `node scripts/generate-illustration.mjs --chapter 6 --batch 1-47` — zero failures. Spot-checked v19 (windless-lamp simile), v34 (Arjuna's restless-wind mind), v47 (devoted yogi) — correct Madhubani style and consistent character designs. Same JPEG-data-as-.png caveat.
- Build passes (335 pages); all 47 verse pages reference and ship their images.

### Chapter 5 illustrations generated (Kalamkari)
- Generated all 29 Chapter 5 (Karma Sannyasa Yoga) illustrations via `node scripts/generate-illustration.mjs --chapter 5 --batch 1-29`. Verse 12 hit a transient 503 mid-batch and was regenerated individually. All 29 verified present (1376×768, JPEG-data-as-.png — the known print-pipeline caveat).
- Spot-checked v1/v12/v29 visually: correct Kalamkari style (dense floral borders, flat profile figures, 6-color palette, consistent Krishna/Arjuna character designs).
- Build passes (287 pages); all 29 Ch5 verse pages reference and ship their images.
- Chapter 5 is now fully complete (text + illustrations). **All 7 active chapters are now fully illustrated.**

## What Was Done This Session (2026-06-14)

**Deployed to production 2026-06-14** (commit `b888381`) → https://gita-for-kids.vercel.app — Ch4 index/verses, Ch5 verses, and Ch4 illustrations all verified live (HTTP 200).

### Chapter 4 authored + Chapter 5 authored + Word-by-Word UI redesign + Ch1 translation fixes
- **Chapter 5 (Karma Sannyasa Yoga), all 29 verses written** (Kalamkari) by 4 parallel agents; verse 1 = arjuna, 2–29 = krishna. Status `active`. **TODO: generate 29 Kalamkari illustrations.**
- **Chapter 4 illustrations generated** — all 42 Warli images via the fixed `generate-illustration.mjs` (note: still JPEG-data-as-.png, the known print-pipeline caveat).
- **Chapter 4 (Jnana Karma Sannyasa Yoga), all 42 verses written** by 6 parallel agents against a shared authoring spec (Sanskrit, IAST transliteration, fully-glossed dhatu breakdown, child-friendly meaning, 300–500 word story, reflection). Status flipped `coming_soon` → `active`. Full build passes (257 pages). **TODO: generate 42 Warli illustrations** via `node scripts/generate-illustration.mjs --chapter 4 --batch 1-42`.
- **Word-by-Word (DhatuBreakdown) UI redesigned** — was a collapsed `<details>` accordion, now an always-visible card grid (`src/components/DhatuBreakdown.astro`). Each root renders as a chip with its English gloss split out from the root. Visible by default, no click required.
- **Chapter 1 translation audit (read-only agent) → 4 fixes applied:**
  - v47 `meaning`: removed false "I will not fight" quote (that line is BG 2.9; it contradicted the verse's own `tasthau` = "he remained" gloss)
  - v13 `transliteration`: `paṇavānakagomukhaḥ` → `paṇavānakagomukhāḥ` (plural long-ā, matches Devanagari)
  - v24 dhatu: `īśa (conqueror)` → `īśa (lord, master)` (morpheme is "lord"; "conqueror of sleep" kept as whole-word meaning)
  - v2 dhatu: added missing words `राजा` (the king) and `तदा` (then)
  - Audit also flagged low-severity systemic items NOT yet actioned: unglossed `च` conjunctions across several verses; Devanagari `word` citation/pausa forms differing from inflected sandhi in the `sanskrit` line (editorial convention — needs a decision).

## What Was Done This Session (2026-04-04)

### Comprehensive Publication Readiness QA + Fixes (4 commits)

Ran 5 parallel quality audit agents, then systematically addressed all 38 findings.

#### Commit 1 — Accessibility, Navigation, Mobile UX (23 files)
- `lang="sa"` on all Devanagari text (12+ files)
- ChapterNav filters to active chapters (no 404s)
- Top + bottom verse navigation
- End-of-chapter CTA ("Continue to Chapter X")
- Mobile hamburger menu
- Tooltip tap-to-toggle for touch devices
- Skip-to-content link
- FolkArtBorder on verse meaning section
- Glossary Sanskrit field displayed
- Ch3 v1/v35 transliteration fixes
- `prefers-reduced-motion` CSS
- Scroll-reveal delay capped at 1s
- 9 new glossary terms + maya

#### Commit 2 — Alt Text, Ch1 v4, Bhagavan (6 files)
- 202 descriptive illustration alt texts (new YAML data file + template integration)
- Ch1 v4 story rewrite (166→407 words, "Counting Shadows")
- Standardized "The Blessed Lord" across all chapters

#### Commit 3 — Advaita Vedanta Alignment + Ch1 Story Variety (14 files)
- Ch15 v7/v17/v18 reframed through non-dual lens (amsha as reflection, Purushottama as Brahman)
- Glossary: atman=Brahman, moksha as realization, new maya entry
- Ch1 vv.28-45: 5 modern stories → mythological (Yayati, Amba, Ashwatthama, Dwaraka, dice game)
- Theological refinements: Ch3 v4 naishkarmya, Ch2 v42 Vedas clarification, Ch2 v50 "skill in action", Ch3 v15 karma→Vedas→Akshara chain, Ch3 v27 purusha/prakriti

#### Commit 4 — Ch2 Story Diversity + Remaining Polish (33 files)
- 15 Nandu/Baa stories replaced with diverse characters and sources:
  - Mythological: Prahlada, Nachiketa, Yayati, Shvetaketu (Tat tvam asi), Jadabharata
  - Modern: swimmer in Odisha, tabla student in Varanasi, chess in Chennai, dance in Thanjavur, boatman on Ganga
  - Settings: Bishnoi village, Maiti movement, Khurja pottery, Vipassana Igatpuri, Kochi spice market
- WCAG AA color contrast (text-gray-400 eliminated from cream backgrounds)
- Krishna's sternness restored in Ch2 v2-3
- 3 reflection questions made standalone
- Ch3 v7 Satyajit flagged as imagined
- Ch2 v22 dhatu breakdown expanded (7→13 words)

### Philosophical Orientation
All content follows **Advaita Vedanta** (Shankaracharya's non-dualism). Atman is Brahman; liberation through jnana; maya as the power of appearance; Krishna speaks as Brahman itself.

## Remaining Items

### Resolved This Session
- ~~4 Ch1 illustrations not Madhubani~~ → Regenerated v1, v2, v8, v9 ✓
- ~~Pichwai too similar to Madhubani~~ → All 20 Ch12 images regenerated with dark backgrounds ✓
- ~~Front matter pages~~ → Characters + Pronunciation guide created ✓

### Still Pending (for print publication)
1. **All images are JPEG data saved as .png** (~320 now) — browsers handle it, print pipelines will not. Need format conversion or true PNG regeneration.
2. **Images web-resolution only** (1376×768) — print requires 2816×1536 minimum. Requires higher-res regeneration (Gemini API may not support this natively).

## Next Steps

### Chapter Order
1. ~~Chapter 4 — Jnana Karma Sannyasa Yoga (Warli)~~ — text + illustrations done ✓
2. ~~Chapter 5 — Karma Sannyasa Yoga (Kalamkari)~~ — text + illustrations done ✓
3. ~~Chapter 6 — Dhyana Yoga (Madhubani)~~ — text + illustrations done ✓
4. Next text chapter: **Chapter 7 — Jnana Vijnana Yoga** (Pichwai, 30 verses) — `status: coming_soon`, needs an outline (`docs/chapter-07-outline.md`), then verses authored and illustrated. Follow the Ch6 process: write spec → 6 parallel authoring agents → Sanskrit audit agents → generate illustrations.

### Front & Back Matter
1. ~~Characters page + Pronunciation guide~~ — done ✓
2. Print layout CSS (`@page` rules) — basic rules added, needs testing with actual print

## Key Files
- CLAUDE.md: project architecture and dev commands
- Illustration guidelines: `docs/illustration-guidelines.md`
- Alt text data: `src/data/illustration-alt-text.yaml`
- Chapter outlines: `docs/chapter-{02,03,06,12,15}-outline.md`
- Gitamahatmyam content: `content/gitamahatmyam.yaml`

Last reviewed: 2026-06-28
