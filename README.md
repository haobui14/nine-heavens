# Nine Heavens

An original single-player cultivation RPG, built from scratch for desktop and mobile browsers with a shared Android/iOS application path. No assets, source, or game data are taken from the existing Xianxia project.

The first playable chapter is **First Light**. Cultivate at Jade Peak, explore three regions, learn six techniques, refine your sword, brew elixirs, befriend Little Cloud, join Azure Cloud, and challenge major-realm tribulations.

**v0.2 — Spirit awakening** adds original painted character and creature art, three distinct expedition environments, illustrated techniques and treasures, jade-and-gold interface details, elemental combat effects, and breakthrough/victory reveals. The progression rules and save schema remain compatible with v0.1.

## Run

Requires Node.js 22.12+ (tested locally with Node 24).

```sh
npm install
npm run dev
```

Open the Local URL printed by Vite. For the production build, including the offline service worker:

```sh
npm test
npm run build
npm run preview
```

The dev server intentionally does not install a service worker. Load the production build once over HTTPS or localhost, wait for “Available offline,” then it can reopen without a connection. A browser needs an initial download. Private hosting may require the owner's sign-in to access the initial download; the game itself has no account or backend.

When a downloaded update is ready, **Save & update** writes the current journey before activating the new offline cache and reloading. If the save fails, the game leaves the current session open.

## Mobile applications

The same `dist/` web bundle is packaged by Capacitor. The config is `capacitor.config.ts`. The Android source project is already included; synchronize it before opening Android Studio.

```sh
npm run build
npx cap sync android
npm run mobile:android
```

Build and test Android with Android Studio and the Android SDK. For iOS, use a Mac with the supported Xcode version:

```sh
npx cap add ios
npm run mobile:sync
npm run mobile:ios
```

Adding a platform is a one-time operation. The Android project is committed; add the iOS project on a Mac. Native packages and signing are distinct from the working browser build; only claim a native release after it builds and is tested on a device. Capacitor apps bundle their own assets and do not need a running web server. This machine has no Android SDK, so no APK/AAB is certified by this initial build session.

## Play

- Cultivation runs automatically at the sanctuary. **Focus your Qi** (or `F`) provides an additional pulse every twelve seconds.
- Fill your Qi reserve, then select **Attempt breakthrough**. Minor stages advance immediately; major realms require a Foundation Pill and a three-part trial.
- Open **World**, choose an expedition, and use auto battle or choose your own techniques. Guard halves the next enemy strike. Jade Dew restores health.
- **Techniques** lets you learn and freely equip up to three arts between expeditions.
- **Spirit Abode** controls your offline assignment, the spirit-gathering array and Little Cloud.
- **Alchemy** spends ingredients up front and completes one queued elixir while you play or are away.
- **Inventory** includes sword refinement and pills. **Sect** unlocks membership after your first expedition.
- **Settings & saves** controls optional synthesized sound, reduced motion, and save export/import.

## Save and offline rules

Browser saves use IndexedDB with a recovery copy. Native saves use Capacitor Preferences for the small versioned save pair. A localStorage fallback is available if IndexedDB cannot open. The save-file format is portable between platforms; browser export is verified, while native file-picker/share behavior still needs device testing. Checksums detect accidental corruption; they are not anti-cheat or signatures.

One tab holds the save writer lock where Web Locks is available. A second tab shows an explanation instead of simultaneously writing the same journey.

Work progresses for up to 30 days per absence. Qi stops at the current bottleneck. Major breakthroughs never happen without approval. No player age, lifespan, quest, or story consequence advances just because the app is closed. Combat pauses when hidden or closed. In this first chapter, meditation, gathering and brewing also pause during an expedition; resource simulation resumes upon returning.

While playing, the game saves periodically and after successful actions, including combat turns. Browser shutdown can interrupt a final write; the previous transactional save remains usable. Export important saves: clearing site data or uninstalling the app can remove local storage.

## Project map

| Path | Responsibility |
|---|---|
| `src/game/content.ts` | Realms, techniques, recipes, regions and milestones |
| `src/game/engine.ts` | All gameplay mutations, elapsed-time processing and seeded combat |
| `src/game/save.ts` | Validation, checksum envelopes, storage, backups and transfer |
| `src/scene-rpg.ts` | Illustrated Phaser actors, particles, elemental impacts and damage feedback |
| `src/presentation.ts` | Game screens and illustrated cards |
| `src/art.ts` | Local treasure and spirit-beast atlas mappings |
| `src/main.ts` | Responsive UI, input, navigation, lifecycle and accessibility |
| `src/style.css`, `src/touch.css`, `src/rpg.css` | Base layout, touch targets and the v0.2 visual system |
| `scripts/build-sw.mjs` | Fingerprinted production offline cache |
| `tests/engine.test.ts` | Progression, accounting, combat and save-integrity tests |
| `docs/GAME_DESIGN.md` | Complete product direction and staged systems |
| `docs/ARCHITECTURE.md` | Platform and engineering decisions |
| `docs/ART_DIRECTION.md` | Visual system, asset provenance and exact generation prompt |
| `docs/visual-assets-v02.json` | Exact prompts for every new v0.2 generated asset |

## Scope

This is a functional beginning, not the entire long-term game. It includes three major realms with three minor stages each, three expedition destinations, six arts, three elixirs, one weapon, one pet, and one sect. Additional regions, narrative companions, NPC tournaments, auctions, sect wars, formations, reincarnation, and higher immortal worlds are designed in the roadmap and are not presented as shipped features.
