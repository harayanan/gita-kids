# Illustration Guidelines — Gita Kids

This document defines the visual standards for all illustrations in the Gita Kids series. Every illustration prompt must reference these guidelines to maintain series cohesion.

---

## 1. Character Reference Sheet

Use these fixed visual attributes in every illustration prompt that includes the corresponding character.

| Character | Age/Build | Clothing | Crown/Headwear | Other |
|-----------|-----------|----------|----------------|-------|
| **Dhritarashtra** | Elderly, stout | White/cream royal silk robes | Gold crown | Silk blindfold over eyes; seated on throne; white hair and beard |
| **Sanjaya** | Middle-aged | Simple indigo dhoti + shawl, no armor | None (hair in a topknot) | Court advisor/bard, NOT a monk; short beard; storyteller's pose; NO shaved head, NO monk's robe, not cross-legged meditation |
| **Duryodhana** | Young warrior (25–30), strong jaw, proud bearing | Red-gold armor over yellow silk | Ornate gold crown with red gem | Thick black moustache; faint hard/angry frown (subtle, child-safe); strong muscular build |
| **Drona** | Elderly sage (60+) | Simple saffron robes | None | Long white beard; teaching staff or bow; calm authority |
| **Bhishma** | Ancient warrior (80+), towering stature | Silver armor | Flowing white hair (no crown) | Massive bow; weathered face with kind eyes |
| **Arjuna** | Young warrior (25), lean and athletic | Terracotta/saffron armor | Plain warrior's diadem/headband — NO peacock feather | Black moustache; human (warm brown) skin; holds Gandiva. Distinct from Krishna (not blue, no flute, no feather, no crown) |
| **Krishna** | Youthful, graceful | Yellow silk robes | Peacock feather in crown | Blue-tinged skin; divine smile; flute at waist |

---

## 2. Folk Art Style Constraints

Each chapter has a `folk_art_style` in its `meta.yaml`. The illustration script (`scripts/generate-illustration.mjs`) auto-selects the correct style prompt. Below are the constraints for each style.

### Madhubani (Chapters 1, 6, 11, 16)

- "Madhubani (Mithila) folk art style"
- "Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering, NO gradients"
- "Double-line outlines on all figures and objects"
- "Horror vacui — fill ALL blank spaces with traditional patterns: crosshatching, concentric circles, dots, fish motifs, lotus motifs, geometric fills"
- "Figures in strict profile OR frontal view, NEVER three-quarter view"
- "Dense floral and geometric border on all four sides"
- "No naturalistic sky, ground, or landscape — use patterned flat color fields"
- "Bharni (filled) style of Madhubani painting"

### Gond (Chapters 2)

- "Gond folk art style from Madhya Pradesh, central India"
- "Intricate dot-and-dash patterns filling all forms — every figure, tree, and animal composed of fine dots and flowing lines"
- "Organic, flowing shapes — figures emerge from nature, interconnected with trees, birds, fish"
- "Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering"
- "Bold black outlines with vibrant color fills using natural palette"
- "Horror vacui — all empty space filled with dot clusters, concentric circles, wave patterns"
- "Decorative border with repeating leaf, vine, or animal motifs"
- "Nature-centric: trees, birds, fish, rivers as compositional anchors even in narrative scenes"

### Pichwai (Chapters 7, 12, 17)

- "Traditional Nathdwara Pichwai temple painting style from Rajasthan"
- "DARK background — deep blue (#0A1A3A), black (#1A1A2E), or deep green (#0A2A1A). NEVER cream, NEVER white, NEVER light-toned backgrounds"
- "Rich, detailed, devotional composition centered on Krishna (often as Shrinathji)"
- "Flat perspective — NO shading, NO atmospheric depth, NO 3D rendering"
- "Signature Pichwai elements: lotus ponds, cows, peacocks, gopis, flowering trees"
- "Rich jewel-tone palette: emerald, sapphire, ruby, gold on dark ground — NOT the warm saffron/terracotta palette"
- "Dense floral patterns filling all empty spaces (horror vacui)"
- "Figures in strict profile OR frontal view, NEVER three-quarter view"
- "Ornate textile-like border with lotus, paisley, or floral chain on all four sides — gold on dark ground"
- "Devotional, sacred atmosphere — temple painting aesthetic"
- "NOT Madhubani — no cream backgrounds, no red/saffron dominant palette, no geometric folk patterns, no double-line outlines"

### Pattachitra (Chapters 3, 8, 13, 18)

- "Pattachitra folk art style from Odisha"
- "Bold black outlines on all figures with intricate internal detailing"
- "Horror vacui — fill ALL spaces with fine cross-hatching, floral scrolls, geometric patterns"
- "Multi-layered ornamental border (typically 3-4 nested frames)"
- "Narrative panel composition showing a single key scene"

### Warli (Chapters 4, 9, 14)

- "Warli tribal folk art style from Maharashtra"
- "Simple white stick figures and geometric shapes on terracotta/earth-tone background"
- "Figures made from basic geometric shapes (triangles for bodies, circles for heads)"
- "Scenes composed in circular or processional arrangements"
- "Minimalist aesthetic — beauty in simplicity and rhythm"

### Kalamkari (Chapters 5, 10, 15)

- "Kalamkari painting style from Andhra Pradesh"
- "Fine pen-drawn outlines with natural dye color fills"
- "Elaborate scrolling vine and floral borders on all four sides"
- "Tree of Life motif where compositionally appropriate"
- "Narrative mythological scenes with rich textile-like patterning"

---

## 3. Color Palette

Specify all of the following in every prompt:

| Color | Hex |
|-------|-----|
| Saffron | `#C75B12` |
| Indigo | `#2D3A87` |
| Terracotta | `#B85C3A` |
| Forest Green | `#1A6847` |
| Gold | `#C4A24E` |
| Cream (background) | `#FDF6E3` |

Also include this negative constraint in every prompt:

> "NO bright green grass, NO blue sky, NO purple, NO neon colors, NO black backgrounds"

**Exception — Pichwai style:** Pichwai paintings use dark backgrounds (deep blue, black, deep green) with jewel-tone colors. For Pichwai chapters, replace the cream background and "NO black backgrounds" constraint with dark background colors and a jewel-tone palette (see Pichwai section above).

---

## 4. Art Direction Rule

> "Always illustrate the verse/mythological scene, NOT the modern story analogy. Let the text handle modern connections; let the art stay in the mythological world."

The modern analogies (cricket, sports, school) exist only in the narrative text. The illustrations must depict the Mahabharata scene described by the verse — chariots, warriors, bows, the Kurukshetra battlefield, palaces, and mythological settings.

---

## 5. Images Requiring Regeneration (Priority Order)

**Completed:** `004.png` and `007.png` were regenerated on 2026-03-22 (modern scenes → mythological Madhubani).

### Ch1 Madhubani style polish

| Priority | Image | Current Issue | Replacement Scene |
|----------|-------|---------------|-------------------|
| HIGH | `001.png` | Rajput miniature style, lacks Madhubani | Dhritarashtra on throne, Sanjaya kneeling, battlefield visible through arch — in flat Madhubani style |
| HIGH | `002.png` | Naturalistic tree/landscape | Duryodhana approaching Drona under Madhubani Tree of Life with patterned leaves |
| HIGH | `008.png` | Naturalistic sunset | Bhishma towering figure with bow, Madhubani patterned background, smaller Devavrata vow scene inset |
| HIGH | `009.png` | Naturalistic cliff landscape | Servant carrying king up stylized patterned cliff, Madhubani flat rendering |
| LOW | `003.png` | Already good — minor refinements | Add more Madhubani fill patterns to warriors' clothing |
| LOW | `006.png` | Already good — minor refinements | Ensure Abhimanyu's design connects to Arjuna's |
| LOW | `005.png` | Good — minor refinements | Strengthen warrior connection in medallions |
| LOW | `010.png` | Good — minor refinements | Push soldiers further into flat Madhubani profile |

### Ch12 Pichwai style refresh

All 20 Ch12 illustrations need regeneration — current images look too similar to Madhubani (cream backgrounds, warm saffron palette, geometric patterns). Must be regenerated with proper Pichwai characteristics: dark backgrounds, jewel tones, temple painting aesthetic.

| Priority | Images | Current Issue | Target |
|----------|--------|---------------|--------|
| MEDIUM | `001.png` – `020.png` (all 20) | Cream backgrounds, warm palette, looks like Madhubani | Dark backgrounds (deep blue/black/green), jewel-tone palette, Nathdwara temple painting style, lotus ponds, cows, peacocks |

Regenerate with: `node scripts/generate-illustration.mjs --chapter 12 --batch 1-20 --regenerate`

---

## 6. Series Cohesion Rules

- Use image `003.png` (Drona between armies) as the **stylistic North Star** for all new and regenerated images.
- Border style must match across all images — use `003.png`'s dense floral border as the template.
- Character designs must be consistent across all illustrations — reference the character sheet in Section 1 in every prompt.
- When multiple images share a character, verify the design matches before finalizing.

---

## 7. Technical Specs

| Use | Dimensions | Format |
|-----|-----------|--------|
| Web | 1408 × 768 px | PNG |
| Print-ready | 2816 × 1536 px (2× for A4 book) | PNG |

- **File naming:** `{verse_number}.png` — zero-padded two digits (e.g., `001.png`, `010.png`)
- **Location:** `public/illustrations/{chapter-slug}/`
  - Example: `public/illustrations/01-arjuna-vishada-yoga/001.png`
