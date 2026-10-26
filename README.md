# Nine Heavens

An original single-player cultivation RPG, built from scratch for desktop and mobile browsers with a shared Android/iOS application path. No assets, source, or game data are taken from the existing Xianxia project.

The first playable chapter is **First Light**. Cultivate at Jade Peak, explore three regions, learn six techniques, refine your sword, brew elixirs, befriend Little Cloud, join Azure Cloud, and challenge major-realm tribulations.

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

## Mobile applications

The same `dist/` web bundle is packaged by Capacitor. The config is `capacitor.config.ts`.

```sh
npm run build
npx cap add android
npm run mobile:sync
npm run mobile:android
```

Build and test Android with Android Studio and the Android SDK. For iOS, use a Mac with the supported Xcode version:

```sh
npx cap add ios
npm run mobile:sync
npm run mobile:ios
```

Adding a platform is a one-time operation. Generated Android/iOS projects should be committed once created. Native packages and signing are distinct from the working browser build; only claim a native release after it builds and is tested on a device. Capacitor apps bundle their own assets and do not need a running web server.

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

Browser saves use IndexedDB with a recovery copy. Native saves use Capacitor Preferences for the small versioned save pair. A localStorage fallback is available if IndexedDB cannot open. Save export/import works between platforms. Checksums detect accidental corruption; they are not anti-cheat or signatures.

One tab holds the save writer lock where Web Locks is available. A second tab shows an explanation instead of simultaneously writing the same journey.

Work progresses for up to 30 days per absence. Qi stops at the current bottleneck. Major breakthroughs never happen without approval. No player age, lifespan, quest, or story consequence advances just because the app is closed. Combat pauses when hidden or closed. In this first chapter, meditation, gathering and brewing also pause during an expedition; resource simulation resumes upon returning.

While playing, the game saves periodically and after successful actions, including combat turns. Browser shutdown can interrupt a final write; the previous transactional save remains usable. Export important saves: clearing site data or uninstalling the app can remove local storage.

## Project map

| Path | Responsibility |
|---|---|
| `src/game/content.ts` | Realms, techniques, recipes, regions and milestones |
| `src/game/engine.ts` | All gameplay mutations, elapsed-time processing and seeded combat |
| `src/game/save.ts` | Validation, checksum envelopes, storage, backups and transfer |
| `src/scene.ts` | Phaser visual scene, particles and combat feedback |
| `src/main.ts` | Responsive UI, input, navigation, lifecycle and accessibility |
| `src/style.css` | Visual system and desktop/mobile layouts |
| `scripts/build-sw.mjs` | Fingerprinted production offline cache |
| `tests/engine.test.ts` | Progression, accounting, combat and save-integrity tests |
| `docs/GAME_DESIGN.md` | Complete product direction and staged systems |
| `docs/ARCHITECTURE.md` | Platform and engineering decisions |
| `docs/ART_DIRECTION.md` | Visual system, asset provenance and exact generation prompt |

## Scope

This is a functional beginning, not the entire long-term game. It includes three major realms with three minor stages each, three expedition destinations, six arts, three elixirs, one weapon, one pet, and one sect. Additional regions, narrative companions, NPC tournaments, auctions, sect wars, formations, reincarnation, and higher immortal worlds are designed in the roadmap and are not presented as shipped features.
