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

## What Was Done This Session (2026-06-29, version stamp on About page)

**Added a version stamp to the About page** (`src/pages/about.astro`) so you can confirm which build is on the phone. Context-aware:
- **Inside the Capacitor app** — shows the installed APK's `versionName` + `versionCode` via `App.getInfo()` (`@capacitor/app`, already bundled). Works on the *existing* installed app with no APK rebuild, since the app loads the live site and the script runs at runtime. Re-applies on Astro view transitions (`astro:page-load`).
- **On the website** — falls back to the web build's git short SHA + date, computed at build time (`VERCEL_GIT_COMMIT_SHA` on Vercel, else `git rev-parse`).

Build clean (744 pages); **committed (`4165121`) + deployed**; live About shows `Web build 4165121 · 2026-06-29`. In-app it will read e.g. `App version 1.0.6 (build 6)`.

## What Was Done This Session (2026-06-29, OTA updates — pinned key + Obtainium)

**Made Android test builds update over-the-air (owner request: "push updated APK to my phone without doing anything").** Reality check given to owner: stock Android requires a tap for any sideloaded APK (only Play Store / MDM / root install silently), so the achievable goal is "phone notices a new build and prompts with one tap." Set that up via the existing GitHub rolling release + Obtainium, rather than adding a Play/Firebase pipeline (overkill — the app is a Remote WebView, so most changes already go live with no rebuild).

Prerequisite that blocked every auto-updater: CI was signing each build with an **ephemeral debug key** (fresh per runner), so Android refused in-place updates (signature mismatch). Fixed:
- **`android/app/signing-debug.keystore`** — a fixed, checked-in debug key (debug-only creds: store/key pass `android`, alias `androiddebugkey`; SHA-256 `9c4f196df4b3b0e27ad86c32a763f0ec6e638553bf1edd65b0ffcf3c5685a030`). Not a Play release key.
- **`android/app/build.gradle`** — added a `debug` `signingConfig` pointing at it; `versionCode`/`versionName` now stamped from `APP_BUILD_NUMBER` (falls back to 1 / 1.0 locally) so each build is a strictly higher version (the release tag stays the constant `android-latest`; the version does the signalling, which is what Obtainium and in-place updates need).
- **`.github/workflows/android.yml`** — passes `APP_BUILD_NUMBER=${{ github.run_number }}` to the gradle build step.

Verified end-to-end: local build signed with the pinned key + version stamping correct; **committed (`61c947f`) + pushed**; CI run #6 succeeded and published `gita-kids-debug.apk` to `android-latest` as **versionCode 6 / versionName 1.0.6**, signature confirmed `9c4f196d…`.

**One-time action for owner:** the app currently on the phone (if any) was signed with an old throwaway key, so it must be **uninstalled once**, then install 1.0.6. From then on every build updates in place / via Obtainium with no uninstall. Obtainium setup: install Obtainium (F-Droid or github.com/ImranR98/Obtainium) → Add App → URL `https://github.com/harayanan/gita-kids` → enable **Include prereleases** → it polls in the background and notifies for one-tap updates.

## What Was Done This Session (2026-06-29, system-bar framing — Android/iOS)

**Recoloured the mobile app's status bar + navigation bar so the OS chrome no longer blends into the cream content (owner request).** Owner asked to either (a) give the top/bottom bars a distinct colour (suggested indigo) or (b) go full-screen immersive with a way to summon the nav buttons back, picking whichever gives an aligned cross-platform POV.

**Chose (a) — coloured bar bands, symmetric top + bottom, identical on Android and iOS.** Rejected immersive: it hides Android's back/home buttons (the swipe-to-reveal affordance is undiscoverable for the 8–12 audience and adds friction to a reading app), and iOS has no bottom system bar and apps don't go immersive outside games/video — so immersive Android + normal iOS would be the *opposite* of aligned. A coloured chrome band is the platform-standard, cross-platform-consistent pattern.

**Colour: brand indigo `#2D3A87` with white (light) system icons.** It's the app's primary brand colour (the peacock-feather icon is indigo), gives maximum contrast against the cream reading content, and frames the cream "page" like an indigo book binding.

Root cause of the old "blending": the bars were edge-to-edge transparent over a near-cream `#F0E2C0` band, while the StatusBar plugin was set to `Style.Dark` (= **white** icons) — white icons on cream = invisible. Fixed by painting the bands indigo and forcing white icons consistently.

Changes (kept the existing edge-to-edge architecture; lowest-risk):
- `src/layouts/BaseLayout.astro` — the `html.native-app::before/::after` safe-area bands repainted `#F0E2C0` → `#2D3A87`; StatusBar `Style.Dark` kept (now correct: white icons on indigo); comments updated.
- `android/.../res/values/styles.xml` — `statusBarColor`/`navigationBarColor` `transparent` → `#2D3A87`; `windowLightStatusBar`/`windowLightNavigationBar` `true` → `false` (white icons). Native colour matches the web band, so cold start → loaded WebView is flash-free.
- iOS: no files to change (no `ios/` dir yet); the web-layer CSS + StatusBar plugin handle it identically when iOS is added later.

Verified: Astro build clean (744 pages), indigo band present in bundled CSS (`dist/_astro/index.*.css`: `safe-area-inset-top);background:#2d3a87`), `styles.xml` valid XML. **Not yet committed/deployed.** The web band change is live-site CSS (ships on next site deploy, scoped to `html.native-app` so the website is unaffected); the Android theme change refreshes on the next APK build via the existing Android CI workflow.

## What Was Done This Session (2026-06-29, app icon / favicon)

**Reworked the peacock-feather app icon + favicon (owner request).** The old icon had a small upright feather using the space poorly (barely visible at favicon sizes) and weak contrast. Owner asked to rotate it 45° clockwise, enlarge it nearly corner-to-corner, and raise contrast (either white ground + colourful feather, or indigo ground + brighter feather).

White-ground route ruled out: the feather art has no solid fill — it's fine barb lines with **indigo gaps that are the same colour as the background**, so cutting it out onto white disintegrates it into stripes. Took the indigo route instead (keeps the feather owner already chose). Built **`scripts/retouch-icon.mjs`** (idempotent; reads pristine `assets/_src-feather.png`, seeded once from the old `icon-only.png`): rotate 45° with a matching-indigo fill (seamless corners), upscale ~2.0× + centre-crop to fill the frame, then a uniform contrast curve (`saturation 1.5`, `linear(1.18,-16)`) that deepens the indigo and brightens the feather without any seam. Android adaptive foreground down-sized to 660px to stay inside the launcher's circular safe zone.

Refreshed **everywhere**: web favicons (`public/` 16/32/48 + `.ico` via ImageMagick, `apple-touch-icon`, `icon-512`), Capacitor source set (`assets/`), and Android `res/` launcher icons + splashes (`npx @capacitor/assets generate --android`, 74 files). No web manifest / PWA icons exist; `www/` shell is index-only. **Committed (`2e8e610`) + deployed to production 2026-06-29** (`vercel deploy --prod` → https://www.gitakids.com, 744 pages). Live `favicon-32x32.png` verified byte-identical to the new asset; `icon-512.png` HTTP 200. Android launcher icon will refresh on the next APK build (the committed `res/` assets feed the existing Android CI workflow); the live site favicon is already updated. Re-run the script with a different size via `node scripts/retouch-icon.mjs 1.8`.

## What Was Done This Session (2026-06-28, latest)

**Jingocheck — conservative AI-tell reduction across all 701 verse stories (owner request).** Owner: "run jingocheck across all the stories... reduce hyperbole, emdashes etc." Note: the `jingocheck` skill is built for analytical writing and explicitly does NOT apply to long-form storytelling (rhythm is part of the craft); confirmed with owner that a **targeted, conservative** pass was wanted, not the full analyst-copy homogenization that would flatten the children's-story voice.

Scope decision (flagged to owner): treated "the stories" as the **prose fields only** — `meaning`, `story.body`, `reflection` — leaving Sanskrit, transliteration, dhatu_breakdown, titles, and all structure untouched. **Reduce, not eliminate** em-dashes: keep the ones doing genuine literary pacing, convert the appositive/AI-tell ones to commas/colons/periods (never to hyphens).

Executed via **18 parallel subagents** (one per chapter), each with the same conservative brief. Results: **576 verse files edited**; em-dashes **5,451 → 4,264** (~22% net reduction); ~140 empty intensifiers / rhetorical flips cut ("It isn't X, it's Y" flips, "not just X — Y" ladders, filler "truly/very/deeply"); meaning-bearing words ("greatest archer", cosmic "boundless"/"vast" in Ch11) preserved. Verified: **only prose fields changed** (0 structural-field lines in diff), **0 hyphen-as-dash substitutions**, build clean (744 pages). Each agent returned a list of borderline "left as-is" cases (load-bearing teaching flips, in-character dialogue, climactic beats) — those were deliberately kept per the conservative brief; available in the session transcript if owner wants to review specific verses.

**Committed + deployed** (see git log for hashes); site redeployed to https://www.gitakids.com. No app rebuild needed (Remote WebView auto-serves the updated site; content changes don't trigger the Android workflow).

## What Was Done This Session (2026-06-28, later)

**Home-page hero + cover text cleanup (owner feedback).**
1. **New home-page hero.** The home page (`src/pages/index.astro`) background was the Ch1 verse-1 image (`001.png`). Replaced with a purpose-made showpiece: **Krishna teaching Arjuna** in Chapter 1's **Pichwai** style — the iconic image of the Gita. New script **`scripts/generate-home-hero.mjs`** (reuses the exported helpers from `generate-illustration.mjs`) → `public/illustrations/home-hero.png`. `index.astro` now points at it. Verified by eye: Krishna haloed/dominant, Arjuna kneeling with bow, dark jewel-tone ground, no text.
2. **Removed text from covers.** Owner: "no cover image should have text" (flagged the Ch4 Warli cover specifically). Strengthened the **NO TEXT** block in `buildCoverPrompt` (forbids all script — Latin/Sanskrit/Devanagari — and stray labels). Regenerated the offenders: **Ch4** (Warli — had "The Yoga of Knowledge and Action", then "Karma/Jnana" wheel labels; took 2 passes, now clean), **Ch9** (Warli — "patram pushpam phalam toyam" labels removed), **Ch16** (Madhubani — "देवासम्पद्/असुरसम्पद्" labels → scales-of-justice motif). All other covers (1–3, 5–8, 10–13) were already text-free.
3. **Om (ॐ) kept.** Covers **15, 17, 18** carry a decorative ॐ glyph. Owner chose to **keep** it (sacred symbol, not treated as text). Left as-is.

Build clean (744 pages); home page confirmed referencing `home-hero.png`. **Committed (`ce2425d`) + deployed to production 2026-06-28** (`vercel deploy --prod` → https://www.gitakids.com); live hero + covers verified HTTP 200, home page references `home-hero.png`.

**Android CI wired up + app rebuilt.** Owner granted `workflow` token scope, so the Android APK workflow commit (`e6882ee`, `.github/workflows/android.yml`) was pushed — the **Build Android APK** workflow is now registered/active on GitHub (previously only a `docs/ci/` reference copy existed; no workflow ran and the APK was published manually). First runs **failed** (`npx cap sync android`: Capacitor CLI requires Node ≥22, workflow pinned Node 20); fixed by bumping to Node 22 (`183dc46`). Re-run **succeeded** — fresh **`gita-kids-debug.apk`** (~12 MB) published to the `android-latest` rolling release, downloadable (valid APK header). The app is a Remote WebView of gitakids.com, so the new hero/covers already show in the existing app without this rebuild; the rebuild just refreshes the published APK.

## What Was Done This Session (2026-06-28)

**Per-chapter thematic cover images.** Each chapter index page (`/chapters/{slug}/`) previously reused that chapter's verse-1 illustration (`001.png`) as its hero. Owner asked for a distinct image at each chapter beginning. Added a **`--cover` mode** to `scripts/generate-illustration.mjs` that builds the prompt from chapter `meta.yaml` (`name`, `sanskrit_name`, `summary`, `folk_art_style`) rather than a single verse — an emblematic, centered, frontispiece composition in the chapter's folk-art style, distinct from any verse panel. New helpers: `buildCoverPrompt()` + `generateCover()`; CLI `--cover` (one chapter) and `--cover --all` (all active chapters, 3s spacing); `resolveChapterSync` now also parses `summary`/`sanskrit_name`. Krishna-prominence + epithet character inference reused from verse pipeline.

Generated **18 covers** → `public/illustrations/{slug}/cover.png`. `src/pages/chapters/[chapter]/index.astro` now prefers `cover.png`, falling back to `001.png`. Verse pages unchanged. Build clean (744 pages); built chapter HTML confirmed referencing `cover.png`. Covers verified by eye (Ch1, Ch12) — Pichwai dark-ground jewel tones, Krishna haloed/dominant, no text. **Committed (`71590ff`) + deployed to production 2026-06-28** (`vercel deploy --prod` → https://www.gitakids.com, 744 pages); live covers verified HTTP 200. (The stray `.github/workflows/android.yml` was deliberately left untracked, not bundled into this image commit.)

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

### Content
All 18 chapters (701 verses) + front/back matter are authored and illustrated — book content is **complete** (see Current Status). No remaining authoring work; the only open content items are the print-quality image regenerations under "Still Pending (for print publication)" above.

### Front & Back Matter
1. ~~Characters page + Pronunciation guide~~ — done ✓
2. Print layout CSS (`@page` rules) — basic rules added, needs testing with actual print

### Mobile App (Android live; iOS deferred)
Current state after 2026-06-29 session:
- **Android**: Capacitor 8 Remote WebView of gitakids.com. Built by GitHub Actions CI (`.github/workflows/android.yml`) on pushes touching `android/`, `www/`, `capacitor.config.ts`, `package.json`. APK published to the `android-latest` rolling release.
- **OTA / testing**: signed with a pinned debug keystore (`android/app/signing-debug.keystore`), version stamped from the CI run number — so builds update in place. Owner uses **Obtainium** pointed at the GitHub repo (Include prereleases on) for one-tap update notifications. About page shows the running version. Note: stock Android still needs one tap per sideloaded install (truly silent updates require Play Store).
- **System bars**: brand-indigo (#2D3A87) status + nav bands, white icons, symmetric top/bottom (Android theme + `html.native-app` CSS in BaseLayout). Mode-independent.

Open next steps:
1. **iOS build** — deferred; needs macOS/Xcode (dev env is Linux). The web layer (system-bar bands, version stamp) is already iOS-ready; only the native shell + CI runner are missing.
2. **Phase 2 bundled build** — when images are finalized/optimized, drop `server.url` and point `webDir` at the Astro `dist/` so the app ships content instead of loading the live site.
3. **Optional: Google Play internal testing** — only path to truly hands-free background updates; needs a Play Console account + release-signed AAB.

## Key Files
- CLAUDE.md: project architecture and dev commands
- Illustration guidelines: `docs/illustration-guidelines.md`
- Alt text data: `src/data/illustration-alt-text.yaml`
- Chapter outlines: `docs/chapter-{02,03,06,12,15}-outline.md`
- Gitamahatmyam content: `content/gitamahatmyam.yaml`
- Android CI: `.github/workflows/android.yml` → publishes APK to `android-latest` release
- Android signing/version: `android/app/build.gradle` (debug `signingConfig`, version from `APP_BUILD_NUMBER`) + `android/app/signing-debug.keystore`
- Native app shell (system bars, status bar, back button): `<script>`/`<style>` blocks in `src/layouts/BaseLayout.astro`

Last reviewed: 2026-06-29
