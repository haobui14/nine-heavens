# Build verification

## Android APK — v0.3.0

October 26, 2026. Built with JDK 21.0.8, Gradle 8.14.3 and the installed Android SDK.

- `scripts/build-android.ps1` rebuilds the web game, synchronizes Capacitor, runs `:app:assembleDebug :app:lintDebug`, and verifies signing, alignment and bundled asset contents before copying the deliverable.
- Native package: `com.nineheavens.game`, version name `0.3.0`, version code `30000`, minimum Android API 24, target/compile API 36. Launcher and splash resources use the Nine Heavens jade mountain emblem instead of the default Capacitor branding.
- The final native build and Android lint complete successfully. The lint report retains template/resource and tooling warnings; these are included with the artifact for review.
- APK signature verification passes with APK Signature Scheme v2, and 16 KB page alignment validation passes. All 22 bundled game files match the production `dist/` files byte-for-byte, including all painted artwork. No remote game server URL is configured.
- All 25 existing game/save tests and the production icon/TypeScript/Vite checks pass. Native preferences remain the save backend. Export now writes a UTF-8 JSON cache file and opens the native share dialog; native settings show app-specific save guidance and immediately report offline availability.
- Installable test artifact: `artifacts/android/nine-heavens-v0.3.0-debug.apk`; SHA-256 `1ac95067a7aa51e10e15e2bf6a9db3e4cda06a3797288fd10bf2901bb1baa5fd`. The same folder contains the checksum, build log, build metadata and lint reports.
- This is a debug-signed APK for direct installation/testing. No physical Android device was connected and no emulator run was performed. Native startup, layout, save picker/share targets and lifecycle behavior still require device QA; no Play Store release is claimed.

## v0.3 — Complete icon replacement

- Replaced the outline icon library and original treasure icon sheet with 48 original painted cells and custom filled utility glyphs. The build audits all statically used icon names, required PNG sheets, and absence of the legacy renderer.
- Navigation, resources, techniques, equipment, pills, item catalog, actions, statuses, dialogs, map nodes and reward surfaces use the central renderer. Healing, cultivation and breakthrough pills have separate art.
- Icon frames and display sizes are enlarged where the old symbols were too small; labels and existing touch targets remain in place.
- All icon assets are bundled for offline caching. Gameplay and the save schema are unchanged.
- All 25 game/save tests and the strict TypeScript/Vite production build pass. The icon audit covers 77 used semantic names, 94 registered names and all 48 painted cells, with no legacy renderer.
- Inspected all seven main screens at desktop size, plus the phone sanctuary, filtered equipment catalog, expedition rewards and settings dialog. No missing-icon fallback or legacy icon nodes were found. Phone document width equals the viewport content width.
- Verified Settings & saves remains reachable through the scrolling sidebar at 1024 × 768. Browser console checks returned no warnings or errors during the final preview flow.
- Save & update activated the new offline worker while preserving the local test journey; the cache includes 17 runtime assets. Android web assets were synchronized with Capacitor after the final build.

## v0.2.2 — Item catalog

- Defined 49 unique items across six tiers, item levels 1–60, with valid tier-level ranges and positive numeric stats/effects.
- Five definitions match current chapter items; 44 are marked as planned. The catalog does not alter progression, equipment or save data.
- Search and tier/category/availability filters update the result list without recreating the input controls.
- The CSV is bundled with the offline build; simple icons reuse the existing Lucide package, with no remote art or font requests.
- TypeScript/Vite build and the existing 25 game/save tests pass. Browser checks cover combined filters, zero results and reset, the five-current-item view, level-60 material, and a CSV download matching the bundled file byte-for-byte.
- Desktop 1440 × 1000 and phone 390 × 844 layouts inspected; mobile document width matches its viewport content width.

## v0.2.1 — Label contrast and portrait correction

- Replaced the full-body avatar crop with a dedicated portrait in the profile card and character dialog.
- Shortcut labels now use opaque jade buttons and 11–12 px text. Foreground `#fff6dc` over `#18392d` measures 11.71:1 contrast.
- Profile secondary text `#5c6757` over the light `#fcf9ef` surface measures 5.64:1 contrast. Disabled standard buttons retain readable text.
- Scene titles, player captions and combat-power labels have their own backing; text no longer depends on the scenery's brightness.
- Mobile profile information stacks vertically with a full-size portrait and larger metadata.
- TypeScript/Vite production build and browser checks cover the changed presentation. Progression and save rules are unchanged; no new gameplay tests were needed for this visual correction.

## v0.2 — Spirit awakening

October 26, 2026. Visual upgrade, with the v0.1 progression rules and save schema retained.

- Production TypeScript/Vite build passes; all 13 runtime assets are included in the fingerprinted offline cache.
- The existing 25 engine/save tests pass. No dependencies were added for the graphics upgrade.
- Desktop 1440 × 1000 and mobile 390 × 844 layouts inspected in Chromium.
- Mobile sanctuary and battle document widths match the viewport content width, with no horizontal overflow.
- Detailed protagonist, portrait crop, four creature atlas frames, nine treasure atlas cells, and three distinct region backgrounds inspected.
- Learned two techniques, completed a minor breakthrough, and completed an expedition on a local test save. The illustrated reveals show the actual resulting realm/stats and the already-awarded expedition rewards.
- Manual combat updates health, cooldowns, encounter progress and action feedback with the new art. Auto combat still completes the starter expedition.
- Save & update activates the waiting offline worker and reloads while preserving the test journey.
- Browser console inspected for errors/warnings during the visual test flow.

The current local production preview is accessible and was used for gameplay QA without spending the hosted player's resources. Native SDK/device and full airplane-mode limitations below still apply. Actors use animated painted poses, not skeletal animation. The uncompressed original art totals approximately 20 MB and increases the initial download.

Screenshots: `desktop-v02.png` and `mobile-v02.png`.

## v0.1 — First Light

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
