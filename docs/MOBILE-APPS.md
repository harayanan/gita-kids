# Gita Kids — Mobile Apps & Build Reference

Durable reference for the iOS/Android builds. Updated 2026-06-21.

---

## Current status (2026-06-21)
- **Android**: scaffolded with Capacitor 8 as a **Remote WebView**. Debug APK builds clean (~4 MB).
- **iOS**: deferred — requires macOS/Xcode to build; the dev environment is Linux. Android builds fine on Linux.

---

## Architecture

Single source of truth is the **Astro website**. The app wraps it with Capacitor.

- **Phase 1 (now) — Remote WebView.** `capacitor.config.ts` sets `server.url = https://gitakids.com`. The app loads the live site, so **every image and verse change appears with no app rebuild**. The bundled `www/` is only a fallback loading screen shown if the site is unreachable.
  - *Why:* images and content are under heavy iteration; the decision is online-first images "for now."
- **Phase 2 (later, once images + content are finalized) — Bundled build.** Drop `server.url`, point `webDir` at the Astro `dist/`, ship assets in-app for true offline. Prerequisite: image optimization (raw illustrations are ~934 MB across 702 PNGs at ~1.36 MB each — too large to bundle as-is).
- **iOS:** add when a Mac (or Mac CI) is available.

---

## App identity
| Field | Value |
|-------|-------|
| Display name | Gita Kids |
| App / bundle id | `com.gitakids.app` |
| Android background | `#FDF6E3` (cream) |

---

## Key files
- `capacitor.config.ts` — app id/name, `server.url`, android background
- `www/index.html` — fallback loading shell (only shown if the remote site fails)
- `android/` — native Android project (committed; build artifacts gitignored)
- `.github/workflows/android.yml` — CI build + APK release

---

## Build requirements (important)
- **JDK 21.** Capacitor 8 requires it. Building with **JDK 17 fails** with `invalid source release: 21`. (Installed here: `/usr/lib/jvm/java-21-openjdk-amd64`.)
- Android SDK with **platform-36 + build-tools 36** (compileSdk/targetSdk = 36, minSdk = 24).
- Node 20+ (CI uses 20; local has 22). Capacitor 8.4.1.

## Build the APK locally (Linux)
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=/opt/android-sdk ANDROID_SDK_ROOT=/opt/android-sdk
npm ci
npx cap sync android
cd android && ./gradlew assembleDebug --no-daemon
# -> android/app/build/outputs/apk/debug/app-debug.apk  (~4 MB)
```

---

## Delivery — how to get the APK

**Now (manual, works today):** the debug APK is published to the **`android-latest`** GitHub prerelease.
- Download: repo → **Releases** → "Gita Kids — latest Android APK" → `gita-kids-debug.apk`.
- Re-publish after a rebuild:
  ```bash
  cp android/app/build/outputs/apk/debug/app-debug.apk gita-kids-debug.apk
  gh release upload android-latest gita-kids-debug.apk --clobber
  ```

**Automated CI (needs a one-time enable):** a ready workflow is saved at **`docs/ci/android.yml`**. It could not be committed to `.github/workflows/` because the current GitHub token lacks the **`workflow`** OAuth scope. To turn on auto-builds, either:
- (a) grant the token the `workflow` scope, then move the file to `.github/workflows/android.yml` and push; or
- (b) paste its contents into a new `.github/workflows/android.yml` via the GitHub web UI.

Once enabled, every push touching the native shell rebuilds the APK and refreshes the `android-latest` release; it's also uploaded as a per-run workflow artifact.

## Install on an Android phone
1. Download `gita-kids-debug.apk` from the release.
2. Open it; allow **"Install unknown apps"** for your browser/file manager when prompted.
3. Debug build — fine for sideloading/testing; **not** Play-Store-ready (unsigned).

---

## Native app feel (implemented 2026-06-21)
Plugins: `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor/app`.
- **Edge-to-edge fullscreen** — status bar overlays the WebView (content goes under it), dark icons on cream, safe-area padding so the nav clears the notch/clock.
- **Splash screen** (cream bg), hidden by the site once loaded.
- **Android back button** → navigates WebView history, exits at root.
- **Webpage tells removed** — no text-selection, long-press callout, tap highlight, or overscroll glow.
- All of the above is gated to `html.native-app` (set when `window.Capacitor` is present) in `src/layouts/BaseLayout.astro`, so the **website is unaffected**. The CSS-level polish ships with the site (live on any installed APK); the native bars/splash/back-button need the rebuilt APK.
- **Still to do (native feel):** custom app launcher icon (default Capacitor icon today; `sharp` + `@capacitor/assets` available), keep-screen-awake while reading, haptics on tap.

## Phase 2 (bundled, offline) — checklist for later
- [ ] Finalize images + content.
- [ ] Image-optimization pipeline (PNG → WebP/AVIF; ~934 MB → ~150 MB target).
- [ ] Decide bundle-all vs on-demand-per-chapter download + local cache.
- [ ] `capacitor.config.ts`: remove the `server` block; set `webDir: 'dist'`.
- [ ] `npm run build` → `npx cap sync android` → rebuild.
- [ ] Add release signing (keystore) → signed **AAB** for Play Store.

## iOS (future)
- Needs **macOS + Xcode** (cannot build on Linux). `npx cap add ios`, open `ios/App` in Xcode, set signing team, build. Or use Mac CI (Codemagic / Ionic Appflow / GitHub macOS runners).
- Apple Developer account ($99/yr). For a remote-WebView app, add native features (TTS, bookmarks) to satisfy App Store guideline 4.2 "minimum functionality".

---

# Image System (redesign — direction agreed 2026-06-21; spec pending)

## Problem (diagnosed from `scripts/generate-illustration.mjs`)
- **Relevance:** generator feeds only the abstract verse `meaning` as the scene → loose/off-topic images.
- **Consistency:** characters pinned by **text only**; **no reference image** is sent, so the model redraws each character differently every time.
- **Extra/wrong characters:** cast guessed by keyword matching on the meaning; horror-vacui invites extra figures.
- **Look-alikes:** overlapping text descriptions + flat folk style, no visual anchor.
- **No QA:** images saved without any check that they match the verse.

## Governing principle: specificity on demand (user, 2026-06-21)
- **Specific** verse (concrete, depictable moment) → accurate, specific image.
- **Evocative** (abstract verse) → symbolic image that *connects* to the theme; some creative liberty OK; **total disconnect is not**.
- **Devotional** chapters (e.g. Bhakti Yoga) → beautiful on-theme images of Krishna/gopis are fine without line-specificity.
- Summary: "where something specific needs to be said, be specific; otherwise generic also works."

## Designed pipeline (pilot = Chapter 1, then template to all 18)
1. **Per-verse scene briefs** — `{ cast (exact), action, setting/props, relevance_mode }` authored from verse + story; **user approves the brief list before any image is generated**.
2. **Character model sheets** — one locked reference portrait per character per folk style; fed as **input images** to every scene (consistency + distinctiveness).
3. **Generation** — brief + relevant ref images (multi-part) + "only these figures, no extra people, no text".
4. **QA loop** — vision-check each image vs its brief (cast / action / extras / text / style) → regenerate failures (~3 tries).
5. **Scope & staging** — regenerate **all of Chapter 1**; approval gates: briefs → model sheets → 5-verse sample → full chapter.
6. **Scaling** — one model sheet per character **per folk style**; the brief + QA system is style-agnostic and reused across all 18 chapters.

## Open decision
- Ch 1 roster: full named cast (~15–18, incl. the conch-blowing warriors) vs core 7 + a few distinct "warrior archetypes". *Leaning: full named cast.*

## Image roadmap (user's plan, beyond the app)
1. **Polish/redo** many images (many don't match the verse).
2. Store all **high-resolution originals** separately (database/storage) — for prints & other products.
3. Generate **optimized low-resolution** variants for the app + website.
