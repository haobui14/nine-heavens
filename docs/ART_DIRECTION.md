# Art direction and asset provenance

**Direction:** painted mountain fantasy with warm parchment interfaces, ink-blue distance, muted jade actions and copper accents. Quiet sophistication at the sanctuary; clear silhouettes and stronger elemental feedback in combat.

The interface uses system sans-serif for small controls and Georgia for expressive titles. No runtime font download is required. Icons are from the Lucide package (ISC license). Original painted art is generated with the built-in ImageGen tool. Phaser animates the illustrated actors and renders particles, sword arcs, elemental impacts, and damage text.

Saved generated asset: `public/assets/jade-peak.png`. The exact source image is copied into the project; the game does not reference a tool output directory or a remote image URL. Generation used the built-in tool, not a CLI or a runtime image-generation API.

## Exact image prompt

Use case: stylized-concept. Asset type: wide landscape illustration for the playable sanctuary of an original cultivation RPG called Nine Heavens. Primary request: a beautiful panoramic Chinese fantasy mountain sanctuary in refined painted ink-wash and gouache, high-end 2D game background, quiet and inviting. Scene: endless layered blue-green misty karst mountains, a small ancient temple with warm lanterns on a distant cliff at upper right, a pale hazy sun, pine branches framing the left edge, waterfalls and drifting white clouds. Foreground: a weathered circular stone meditation platform on a rocky ledge occupies the lower center-right, a small lone white-robed dark-haired cultivator seated on it seen from behind, small jade qi light around their hands. Composition: 16:9 wide landscape, generous airy sky and subdued empty mist on the left third for a modest text overlay; distant architecture and central platform readable at small size. Color palette: pale warm ivory sky, desaturated jade and slate-teal mountains, subtle copper lantern light, soft whites. Style: sophisticated hand-painted fantasy environment, fine ink outlines, atmospheric perspective, delicate paper grain, lush painterly detail, calm natural daylight. Constraints: no text, no logos, no UI, no borders, no watermarks, no photographic realism, no large close-up people.

## Interaction language

Buttons subtly scale to 0.96 on press, with explicit color/opacity transitions. The layout uses paper surfaces, fine divisions, tabular resource numbers and large touch-friendly navigation. Motion reduction stills the scene and suppresses UI transitions. Sound is optional and synthesized locally with Web Audio.

## v0.2 — Spirit awakening

The reference games informed the large central cultivator, ornate item frames, illustrated techniques, realm reveal, and compact mobile navigation. Overmortal was the primary visual reference. Reference imagery was viewed for direction only; no reference-game image, icon, logo, UI screenshot, or code is included in the game.

All six new assets below were generated with the built-in ImageGen tool, visually inspected, and copied into `public/assets/`. The exact prompts are preserved in `visual-assets-v02.json`.

| Asset | Use |
|---|---|
| `cultivator.png` | Full-body protagonist, portrait, and breakthrough reveal |
| `spirit-beasts.png` | Transparent 2×2 atlas: cloud fox, ember wolf, moon spirit, heart demon |
| `bamboo-forest.png` | Whispering Bamboo destination card and battle arena |
| `crimson-ridge.png` | Crimson Ridge destination card and battle arena |
| `moonlit-ruins.png` | Moonlit Ruins destination card and battle arena |
| `treasures.png` | Transparent 3×3 atlas: six elemental arts, scroll, pill bottle, jade crystal |

The illustrated actors have floating idle motion, attack movement, arrival fades, and effects. They use a single painted pose per actor, rather than skeletal or frame-by-frame character animation. Reduced motion stops scene drift, impacts and camera shake while retaining static damage feedback. All artwork is bundled and cached locally for offline use; the complete original PNG art collection is approximately 20 MB.

## Future asset priorities

1. Skeletal character animation and additional weapon/robe appearances.
2. Companion portraits, named guardians and realm-specific trial environments.
3. Original event illustrations, commissioned music and more distinctive effects for each technique.
