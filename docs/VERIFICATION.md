# Initial build verification

October 26, 2026. Browser release: Nine Heavens v0.1, First Light.

## Automated

- 25 rules/save tests pass using Vitest 5.0.5.
- TypeScript strict checks and Vite production build pass.
- The production service worker includes every required local build asset.
- npm audit reports zero known vulnerabilities with the committed lockfile.
- Time tests cover interval splitting, save/reload duplication, backwards clocks, capped long absences and campaign safety.
- Progression tests cover a reachable starter expedition, a prepared major breakthrough, invalid purchases, technique cooldowns and safe defeat.
- Save tests cover round-trip validation, checksum corruption, unsupported schemas and invalid combat state.

## Browser interaction

Verified on the private deployed HTTPS build using the in-app Chromium browser:

- Desktop layout at 1440 × 1000 and phone layout at 390 × 844.
- Phone document width equals the viewport's content width: no horizontal overflow.
- Phaser renders the sanctuary particles and combat figures.
- A full Qi reserve permits a minor breakthrough, updates the stage and resets the reserve.
- Brewing spends the exact ingredients, blocks a second recipe, then adds the finished elixir to inventory.
- Learning Verdant Lotus spends 60 stones and equips the art.
- Refinement spends stones and iron and changes the sword to +1.
- The first expedition reaches its guardian and returns a completion reward and journal entry.
- The mobile More menu opens abode, alchemy, sect and settings.
- Herb gathering remains assigned through a reload; stage, equipment and inventory persist.
- Browser save export produces a JSON file.
- Offline-cache installation reports “Available offline.”
- No error or warning messages were recorded by the browser console during the tested flow.

Screenshots: `desktop-preview.png` and `mobile-preview.png`.

## Limits

The local preview's UI was blocked by browser URL policy; browser QA was performed on the authorized private HTTPS deployment. The local server's HTTP readiness check succeeded.

The offline cache is installed and the time-accounting tests pass. A complete airplane-mode playthrough on real hardware has not been performed. Browser viewport checks do not certify a physical phone, native suspension, memory use, battery consumption or platform save/export APIs.

The Android Capacitor project is generated and its assets/plugins synchronize successfully. Android SDK is absent on this machine, so no APK/AAB has been built or device-tested. iOS still requires macOS/Xcode, signing and hardware testing.

The included realms and systems are the beginning of the larger design in `GAME_DESIGN.md`. Advanced NPC simulation, story companions, auctions, sect wars, reincarnation and further worlds are roadmap items.
