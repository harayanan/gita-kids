# Illustration Style and Fidelity Spec (Reviewer Standard)

Status: authoritative review standard for all 701 verse images and 18 covers. Written 2026-09-14.
Evidence base: `docs/illustration-guidelines.md`; `STYLE_PROMPTS`, `STYLE_PALETTES`, `CHARACTER_REFS` in `scripts/generate-illustration.mjs`; both character-ref sets in `assets/character-refs/`; all 20 Chapter 12 images; 8 images from every other chapter (more in Ch10, Ch11); all 18 covers.
Image files are 1376x768 JPEG data saved as `.png`.

A reviewer answers three questions per image, in this order: (1) Is it the right style at Ch12 quality? (2) Is every clearly visible figure anatomically and canonically correct? (3) Is anything present that must never appear? Scene-to-verse relevance is reviewed separately against the verse digest, but canon and exception rules below apply to that review too.

---

## 1. Style signatures

### 1.0 What "Ch12-level" means
Chapter 12 (Pichwai) is the benchmark. Concretely, a Ch12 image has:
- A single flat dark ground (navy #0A1A3A in 19 of 20; deep green in 12.013) with no gradient, vignette or sky wash.
- A double gold-ruled border with a repeating lotus or paisley chain, fully visible on all four sides.
- Every empty area filled with small flowering shrubs, banana leaves, lotus clusters, birds; no bare patches larger than about 5% of the field.
- Crisp, even outlines; flat colour fills; textile pattern on garments (gopis' odhnis, Krishna's jama); faces in near-profile or frontal with almond eyes.
- A clear focal figure (Krishna, largest, centred or on the golden-section line) and 4 to 12 supporting figures, all at a legible size.
- A jewel palette: emerald, ruby, sapphire, gold, warm white. No neon, no pastel wash.
- No photographic shading, no airbrush glow, no depth-of-field blur, no 3D volume on faces.

The same bar applies to other styles: dense traditional fill, a complete border, crisp line, flat colour, one legible focal figure, and a palette true to the style. "Ch12-level" is a craft bar. It does not mean every chapter should look like Pichwai.

Note: Ch12 itself is not defect-free. 12.015 shows a four-armed Krishna (discus and lotus) that the verse does not call for; 12.017 adds a second small blue, haloed boy who reads as a duplicate Krishna; 12.011 puts minarets and a domed, mosque-like skyline behind Krishna; 12.016 includes a fully shaven, saffron-clad man who reads as a Buddhist monk. Review Ch12 by the same rules.

### 1.1 Pichwai (Ch 7, 12, 17 devotional; Ch 1 narrative)
| Element | Required |
|---|---|
| Ground | Flat navy, black or deep green. Never cream or white. |
| Line | Fine, even dark or gold outline; gilded detail on jewellery, canopies, chariots. |
| Fill | Dense flowering trees, banana leaves, lotus ponds, peacocks, cows with caparisons, gopis. |
| Border | Gold-ruled double frame with lotus/paisley chain, all four sides. |
| Figures | Profile or frontal; Nathdwara faces; heavy garlands; textile-patterned clothing. |
| Palette | Emerald, ruby, sapphire, gold, warm white. |
| Narrative variant (Ch1) | Same ground, border and finish, but the scene is Kurukshetra or the Hastinapura court: chariots, horses, armies, elephants, banners. Cows, gopis and lotus ponds are optional and must not intrude on battle scenes. |

Drift observed: Ch1 battlefield panels padded with cows and gopis (1.014, 1.021); Krishna smaller than Arjuna (1.027, 1.034); Sanjaya placed physically on the battlefield (1.014 on a cliff, 1.047 beside the chariot). Ch7 and Ch17 are close to the Ch12 bar. Older history: Ch12 was once rendered on cream with a Madhubani palette; any Pichwai image on a light ground is a style FAIL.

### 1.2 Gond (Ch 2)
| Element | Required |
|---|---|
| Ground | Cream or light ochre, often with concentric dot rings. |
| Line | Bold dark outline. |
| Fill | Dot-and-dash infill inside forms: figures, trees, animals, water. The infill is the signature. |
| Border | Leaf, vine or small-animal chain. |
| Figures | Flat, profile or frontal; nature anchors (trees, birds, fish, rivers) in most panels. |
| Palette | Earth brown, ochre, forest green, indigo, saffron. |

Drift observed: Gond patterning appears only on trees and ground while human figures are smooth, flat "storybook" illustration with no dot-dash infill (2.001, 2.011, 2.031). Treat figures with no infill as MINOR; a panel with no dot-dash work anywhere is a style FAIL. Also seen: text labels (2.062), Krishna in dark navy skin with saffron robe (2.072), monk-like seated Sanjaya (2.001), a duplicated Arjuna (2.021).

### 1.3 Pattachitra (Ch 3, 8, 13, 18)
| Element | Required |
|---|---|
| Ground | In this book: cream or beige field inside the frame (accepted convention). Traditional red/ochre fields also acceptable. |
| Line | Bold black outline with fine internal detailing; cross-hatch shading patterns (not tonal shading). |
| Fill | Floral scrolls, cross-hatching, geometric bands; architecture as arches and pillars. |
| Border | 3 to 4 nested frames (navy, green, rust bands with floral chain). |
| Figures | Profile or frontal, Odia faces with elongated eyes; single key scene per panel. |
| Palette | Cream, rust, indigo, green, saffron, black line. |

Drift observed: grey monochrome ink backgrounds (3.019, 18.034 cloud faces), washed-out low-contrast panels (8.009), comic-strip layout with speech text (3.025), naturalistic landscape depth (13.011). Pattachitra is the chapter family with the most text and off-tradition failures (see Section 4).

### 1.4 Warli (Ch 4, 9, 14)
| Element | Required |
|---|---|
| Ground | Flat terracotta/earth red across the whole field. |
| Line | White (occasionally cream) line only. |
| Fill | Stick figures (two triangles and a circle head), spirals, dots, simple trees, huts, animals; circular or processional groupings (tarpa dance ring). |
| Border | Simple white geometric chain. |
| Figures | Everyone except Krishna is a white stick figure. Krishna may be drawn in colour (blue, yellow, feather, halo) as the one accepted exception; a blue stick-figure Krishna (14.027, 9.029) is also acceptable. Arjuna in colour is tolerated only when paired with Krishna. |
| Palette | Terracotta and white; small blue/yellow for Krishna only. |

Drift observed: cream grounds or cream corners and sky (4.024, 4.042, 9.025, 14.001, 14.016; covers 9 and 14); coloured, painted secondary figures (9.025, 4.001 sages, 14.001); English sentences and labels on the image (4.030, 9.020, 14.008, 14.020). A main ground that is cream is a style FAIL; cream confined to corners or a small inset is MINOR.

### 1.5 Kalamkari (Ch 5, 10, 15)
| Element | Required |
|---|---|
| Ground | Cream (natural cotton). |
| Line | Fine pen outline (kalam), dark brown/black. |
| Fill | Dense botanical vines, flowers, leaves in rust, indigo, green, mustard; Tree of Life where apt. |
| Border | Scrolling vine and floral border, all four sides. |
| Figures | Profile or frontal, temple-cloth faces; textile patterning on clothes. |
| Palette | Madder red/rust, indigo, green, mustard, black on cream. |

Kalamkari chapters are the most stable. Drift observed: naturalistic battlefield with receding ground and depth (5.001); three identical Krishnas in one panel (5.009); bound codex books instead of palm-leaf manuscripts (5.005, 10.037, MINOR); modern pictograms such as a music note and wine glass in sense "windows" (15.009).

### 1.6 Madhubani (Ch 6, 11, 16)
| Element | Required |
|---|---|
| Ground | Cream, fully patterned (bharni fill). |
| Line | Double-line outlines. |
| Fill | Horror vacui: cross-hatching, concentric arcs, fish, lotus, peacock, elephant motifs. |
| Border | Dense floral/geometric border (lotus, fish, elephant chains). |
| Figures | Profile or frontal, large fish-shaped eyes. |
| Palette | Saffron, indigo, terracotta, forest green, gold on cream. |

Drift observed: rolling naturalistic hills with smooth fields and horizon lines (6.001, 16.001, 16.008); flowing abstract swirls instead of traditional motifs (6.034, 6.047, MINOR); modern icon medallions (16.001); a tiny modern man in a T-shirt and trousers (16.008); scrolls of pseudo-script (16.017, 16.024); a faceless figure (16.014).

### 1.7 Drift that applies to every style (style FAIL)
- Soft 3D or airbrushed "AI" rendering: glossy skin, rim light, volumetric clouds, bokeh.
- Photographic shading or cast shadows; naturalistic sky gradient or perspective landscape taking most of the field.
- Wrong style for the chapter (for example Madhubani double-lines in a Pichwai chapter).
- Border missing, or cut off on any side.

---

## 2. Character canon

| Character | Must show | Common errors seen | Severity if wrong on a main figure |
|---|---|---|---|
| Krishna (ordinary form) | Exactly two arms; blue skin; yellow silk; peacock feather in crown; golden halo; flute at waist optional. Largest, most prominent figure whenever Arjuna is present, including as charioteer. | Four arms without verse basis (12.015, cover 16); non-blue skin (11.051); dark navy skin with saffron robe (2.072); smaller than Arjuna (1.027, 1.034); duplicates (5.009, 12.017). | FAIL |
| Arjuna | Human warm-brown skin; black moustache; plain diadem or warrior crown; terracotta/saffron armour; Gandiva bow and quiver. No feather, no flute, no blue skin. | Blue skin (13.001); clean-shaven (8.005); duplicated (2.021). | Blue skin or feather: FAIL. Missing moustache: MINOR. |
| Sanjaya | Court minister-bard: dark hair in a topknot, short beard, indigo dhoti and shawl, bare chest or simple upper cloth; narrating gesture; seated or standing beside Dhritarashtra in the palace. | Shaven or close-cropped head, monk's robe, cross-legged meditation, halo (11.050, 11.009, 2.001, 18.078). | Monk rendering: FAIL. On battlefield: MINOR. |
| Dhritarashtra | Elderly, stout, white hair and beard, gold crown, cream/white silks, silk blindfold, seated on a throne. | Generally correct (1.001, 11.050). | Missing blindfold when focal: MINOR. |
| Duryodhana | Young, muscular, thick moustache, red-gold armour over yellow, ornate crown with red gem, proud stance, faint frown. | Generally correct (1.008). | Wrong identity cues: MINOR. |
| Bhishma | Very old, tall, silver armour, long white hair, no crown, full white beard and moustache, large bow. Never clean-shaven. | The `pichwai-narrative/bhishma.png` reference sheet is clean-shaven; do not use it as a reference. | Clean-shaven: FAIL. |
| Drona | Elderly brahmin teacher, saffron robes, long white beard, sacred thread, bow or staff, no crown. | Generally correct. | MINOR |
| Bhima | Very large, muscular, moustache, mace (gada); blows conch Paundra in 1.015. | Rarely shown. | MINOR |
| Yudhishthira | Calm crowned king, spear, blows Anantavijaya (1.016). | Rarely shown. | MINOR |
| Nakula, Sahadeva | Young twin warriors, sword and shield; conches Sughosha and Manipushpaka (1.016). | | MINOR |
| Karna (1.008, 11.026, 11.034) | Golden armour and earrings, bow. | | MINOR |
| Abhimanyu (1.006, 1.018) | Teenager, beardless, Arjuna's colouring. | | MINOR |
| Generic Pandava/Kaurava soldiers | Indian armour, spears, shields, horses, elephants, banners. No European helmets or plate armour. | | Western armour: FAIL |

Arjuna's chariot: drawn by white horses, four when all are visible (three visible through overlap is acceptable); Krishna at the front holding reins or whip; Arjuna behind; the banner shows Hanuman (Kapidhvaja), required when the flag is visible in 1.020 and strongly preferred elsewhere. A plain pennant (18.001) is MINOR except in 1.020, where it is a FAIL for scene relevance. Brown or black horses on Arjuna's chariot: MINOR; mangled horses or wheels: FAIL.

Conches (Ch1): shown as spiral conch shells held to the mouth. 1.012 Bhishma; 1.014 Krishna and Arjuna together; 1.015 Panchajanya (Krishna), Devadatta (Arjuna), Paundra (Bhima); 1.016 Anantavijaya (Yudhishthira), Sughosha and Manipushpaka (twins); 1.017-1.018 Drupada, Draupadi's sons, Abhimanyu. In 1.013 drums and cow-horn trumpets are also correct. Brass Western trumpets are a FAIL.

---

## 3. Legitimate exceptions (do not flag)

Check the verse digest before flagging any extra limbs, heads or deity. If the verse names it, it is allowed.

- **Vishvarupa, Ch11 (roughly 11.005-11.034 and covers):** many arms, heads, faces, eyes, crowns, weapons, suns and moons are correct. 11.026-11.027 (warriors entering the mouths) is allowed if rendered without blood, visible crushed heads or wounds.
- **Four-armed Vishnu form:** 11.017 and 11.046 (crown, mace, discus). 11.045 may show the cosmic form receding. Chaturbhuja figures in these verses must still be blue-skinned; the pale four-armed figure in 11.046 is a MINOR colour error.
- **Return to two arms:** 11.049-11.051 must show Krishna two-armed, blue, with feather. A four-armed Krishna there is a FAIL.
- **Ch10 vibhutis named in the verse:** Vishnu, Marichi, sun, moon (10.021); Indra (10.022); Shiva/Shankara with Rudras, Kubera, Agni, Meru (10.023); Brihaspati, Skanda (six heads acceptable), ocean (10.024); Bhrigu, Om, Himalaya (10.025); ashvattha tree, Narada, Chitraratha, Kapila (10.026); Uchchaihshravas, Airavata, a king (10.027); vajra, Kamadhenu, Vasuki (10.028); Ananta (multi-hooded), Varuna, Aryaman, Yama (10.029); Prahlada, lion, Garuda (10.030); Rama with bow, makara, Ganga (10.031); Vasudeva, Arjuna, Vyasa, Ushanas (10.037); Narada, Asita, Devala, Vyasa (10.013). Verified correct in 10.023, 10.027, 10.031.
- **Brahma:** on the lotus in 11.015; the day and night of Brahma in 8.017-8.018; as creator (Prajapati) in 3.010, with the wish-granting cow. Note that most "Brahman" verses refer to the formless Absolute; a four-headed Brahma is only legitimate where the digest names Brahma the creator.
- **Other verse-named figures:** Vivasvan (sun god), Manu, Ikshvaku (4.001); Janaka (3.020); avatars of "age after age" (4.007-4.008), including a ring of repeated Krishna forms when the composition is clearly intentional (4.007); Indra's heaven and soma (9.020); gods, ancestors and spirits (9.025, 17.004), drawn in Indian idiom (bhutas, pretas, yakshas), not Western sheet-ghosts; Rudras, Adityas, Vasus, Ashvins, Maruts (11.006, 11.022); tortoise (2.058); Vyasa (18.075).
- **Om glyph:** allowed anywhere as a decorative element, and expected in 7.008, 8.013, 10.025, 17.023-17.024. Only the Om glyph is allowed; "Tat" and "Sat" in script count as text.
- **Meditating yogis and rishis:** Ch6 (6.010-6.015 and others), 5.011, 8.023-8.028, 12.002-12.010 show seated meditators by design. They pass if they have Hindu ascetic cues (Section 5, step 6).
- **Multiple Pandava/Kaurava warriors with similar faces** in army scenes are not "duplicates"; the duplicate rule applies to named main characters.

---

## 4. Hard defects (FAIL)

1. **Wrong limb, hand or head count** on any clearly visible figure outside Section 3 (for example Krishna with three or four arms in an ordinary scene, a hand growing from a sash, six fingers on a focal hand).
2. **Fused or duplicated main figures:** two Krishnas or two Arjunas not called for by the verse (2.021, 5.009, 12.017); bodies merged at the torso; a head on the wrong body.
3. **Off-tradition figures or iconography:** Buddha or Buddha-like figures (13.020 is an explicit Buddha on a lotus throne; 8.001 has a small Buddha-like niche figure); Jain tirthankaras (nude or white-clad, frontal, rigid kayotsarga or seated, with srivatsa mark); Christian, Islamic, East Asian or Western imagery (crosses, crescent, pagodas, Western cartoon ghosts as in 9.025, European armour). A mosque-like skyline with minarets (12.011) is MINOR if background-only and FAIL if prominent.
4. **Swastika motifs** in any size or orientation, including border repeats and toran decoration (9.034 has two above Krishna).
5. **Any text:** words, letters, numerals, labels, speech captions, fake Devanagari or pseudo-script on scrolls and banners, signatures or watermarks. Seen in 2.062, 3.025, 3.043, 4.030, 8.001, 8.005 (full English caption box), 9.020, 14.008, 14.020, 16.017, 16.024. Om is the only exception. A tiny scribble that resembles a signature (11.051, bottom right) counts.
6. **Wrong canon on a main figure** per the Section 2 severity column (non-blue Krishna, blue Arjuna, feathered Arjuna, clean-shaven Bhishma, monk-like Sanjaya).
7. **Krishna not the most prominent figure** when shown with Arjuna (1.027, 1.034).
8. **Modern or anachronistic content:** jigsaw puzzles, music-note glyphs, lightbulbs, scales-of-justice icons, wine glasses, T-shirts, money-bag cartoons (13.006, 15.009, 16.001, 16.008, 3.025).
9. **Mangled horses or chariot wheels:** wrong leg counts, merged horses, wheels that are not round or have broken spokes.
10. **Malformed faces:** blank or faceless heads (16.014), melted features, misaligned eyes on a figure larger than about 60 px tall.
11. **Unsuitable content for ages 8-12:** blood, wounds, severed or crushed heads, corpses in detail; menacing monsters as a focal element (the ten-armed "Desire" rakshasa in 3.043 and the fanged demon heads in 3.037 are at this line); romantic embrace not called for by the verse (18.056).
12. **Framing:** border cut off on any side; heads, crowns or feet of main figures cut off by the frame.
13. **Image quality:** heavy blur, smeared "mush" regions, visible JPEG blocking, colour banding, watermark.
14. **Wrong style for the chapter**, or the style-level FAILs in Section 1 (Pichwai on a light ground, Warli on a cream main ground, 3D/airbrushed or photographic rendering).
15. **Politically loaded compositions:** national-flag colour banding as the dominant layout (cover 18 uses saffron, white and green bands); treat as FAIL on covers and verse images.

---

## 5. Inspection procedure (per image)

Set `S=<scratchpad>` and `IMG=public/illustrations/<slug>/<NNN>.png`.

1. **Read the verse digest entry first.** Note the speaker, named figures, and whether the verse is a Section 3 exception (Vishvarupa, chaturbhuja, vibhuti, Om).
2. **Full view (style pass).** Read the whole image. Check ground colour, border on all four sides, line type, fill density, palette against Section 1. Look for 3D/airbrush rendering, sky gradients, perspective landscapes. Decide style PASS, MINOR or FAIL.
3. **Text sweep.** Scan scrolls, banners, books, arches, sky, corners and the bottom-right corner for letters, numerals or scribbles. Zoom anything that resembles writing:
   `convert $IMG -crop 50%x50% +repage $S/crops/<name>-%d.png` (four quadrants), then Read each.
4. **Swastika and symbol sweep.** Check torans, arches, border repeats, flags, altars and garments. Crop any repeated small glyph to 3x: `convert $IMG -crop 300x200+X+Y +repage -resize 300% $S/crops/<name>-sym.png`.
5. **Figure census.** List every figure taller than about 80 px. Identify Krishna, Arjuna and any named character. Confirm Krishna is largest when Arjuna is present and that only one Krishna exists unless the verse justifies more.
6. **Limb and head count** for each main figure, on a crop around that figure (`-crop 35%x70%+X+Y`):
   - Start at the neck and find both shoulders. Count arms leaving each shoulder; there should be one per side.
   - Trace each arm to a hand. Count hands, then objects held. Four held objects (discus, conch, mace, lotus) mean four arms.
   - Do not count dupatta or sash ends, garland loops, bow limbs or flute as arms; a real arm has a bangle or elbow and ends in fingers.
   - Folk figures: in Warli, each limb is a single line from the triangle apex; in Gond and Madhubani, check the outline for a second arm hidden inside a patterned fill.
   - Count legs and feet, and heads per body. For horses, count legs per horse and verify each horse has one head.
7. **Buddha or rishi test** for any seated, cross-legged, calm figure:
   - Buddha cues (FAIL if present together): ushnisha (cranial bump) with tight snail-shell curls or shaven head; long empty earlobes; monastic robe with no jewellery; clean-shaven; dhyana or earth-touching mudra; lotus throne with halo and backrest; dark-blue or gold monochrome body.
   - Hindu rishi or yogi cues (PASS): jata topknot or long hair; beard; tilak; sacred thread or rudraksha; dhoti or deerskin; kusha grass or deerskin seat; forest or ashram setting; fire altar.
   - A shaven-headed, robed devotee in namaste with no jewellery is MINOR in a crowd and FAIL as a focal figure. Sanjaya must never pass through this test as a monk.
8. **Canon check** of each named figure against Section 2 (skin, feather, moustache, beard, blindfold, clothing, weapon).
9. **Chariot and horses** when present: horse colour and count, wheel shape and spokes, Hanuman banner, Krishna's position.
10. **Faces and hands at zoom** for any figure taller than about 150 px: eyes aligned, one mouth, five fingers where visible.
11. **Child-safety pass:** blood, wounds, crushed heads, frightening faces, romantic content.
12. **Quality pass:** zoom into two dense areas for smearing, blocking or banding.
13. **Record** the verdict: PASS, MINOR (list) or FAIL (list), with coordinates or quadrant for each defect.

---

## 6. Severity guide

| Defect | FAIL | MINOR |
|---|---|---|
| Limb/hand/head count wrong | Any main or clearly visible figure, outside exceptions | Tiny background figure (under about 40 px) with ambiguous hands |
| Duplicate named figure | Krishna or Arjuna repeated without verse basis | Look-alike devotee with similar colouring, clearly distinct role |
| Buddha / Jain / non-Indic religious figure | Any clear instance | Shaven robed devotee in a crowd; background dome/minaret skyline |
| Swastika | Any size | None |
| Text, numerals, pseudo-script, signature | Any legible or letter-like marks (Om excepted) | None |
| Krishna canon (arms, blue skin, feather) | Any error on Krishna | Missing flute; halo faint |
| Krishna prominence | Smaller than Arjuna in a shared scene | Equal height, Krishna still focal |
| Arjuna canon | Blue skin, feather, flute | No moustache; armour colour off |
| Sanjaya canon | Monk rendering (shaven, robe, meditation, halo) | Placed on battlefield; clothing colour off |
| Bhishma canon | Clean-shaven | Crown added; armour colour off |
| Dhritarashtra, Drona, Duryodhana, other Pandavas | Identity unreadable in a verse about that person | Attribute missing |
| Chariot and horses | Mangled legs or wheels | Horses not white; three visible; Hanuman flag missing (except 1.020) |
| Faces | Faceless or malformed on a main figure | Slight asymmetry on a small figure |
| Modern or anachronistic objects | Pictograms, modern clothing, puzzles, cartoons | Bound codex books in a sage scene |
| Child safety | Blood, wounds, crushed heads, focal menacing monster, unwarranted romance | Stern or angry faces kept mild |
| Style: ground | Pichwai on light ground; Warli main ground cream | Cream corners or insets |
| Style: rendering | 3D, airbrush, photographic shading, perspective landscape dominating | Small naturalistic hill or sky strip |
| Style: fill and line | Signature missing entirely (no dot-dash in Gond, no double line in Madhubani) | Signature partial (Gond infill on trees only) |
| Border | Cut off or absent | Uneven width |
| Image quality | Blur, mush, blocking, watermark | Minor softness in a small area |
| Flag-colour banding | Dominant layout | None |

Rule of decision: one FAIL fails the image. Three or more MINORs in one image also fail it. Otherwise the image passes with MINOR notes.

---

## 7. Corrections to existing reference assets
- `docs/illustration-guidelines.md` Section 2 still lists Madhubani for Ch1; Ch1 is Pichwai narrative. Section 7 states 1408x768; delivered files are 1376x768.
- `assets/character-refs/pichwai-narrative/bhishma.png` is clean-shaven and contradicts canon. Replace before using it for any regeneration.
- `CHARACTER_REFS.krishna` does not say "exactly two arms". Apart from the Sanjaya "not a Buddhist or Jain monk" line, `buildPrompt` has no general Buddha, swastika or arm-count negative constraint. Add all three to the generator.
