# Architecture decisions

## Chosen platform

**TypeScript + Phaser 3 + Vite + responsive HTML/CSS, with PWA caching and Capacitor 8.**

The browser is a first-class target. Phaser provides a proven 2D rendering and animation layer; TypeScript lets the same engine-free rules run in browser, tests and native WebViews. HTML handles dense RPG interfaces accessibly. Capacitor bundles the web output into mobile apps without a required runtime server.

We deliberately begin with deterministic turn combat and a rich idle interface. A high-fidelity 3D open world would sharply increase production cost and weaken the small-team cross-platform target. Additional action mechanics can be evaluated on real phones after the first loop is proven.

Primary documentation: [Phaser](https://docs.phaser.io/phaser/getting-started/installation), [Capacitor](https://capacitorjs.com/docs/getting-started), [native environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup), [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API).

## State authority

`engine.ts` owns all gameplay mutations. UI code submits typed actions. The core checks ownership, prerequisites, costs and encounter state before changes. A single seeded xorshift stream resolves combat variance and is stored with the save. Phaser's decorative randomness does not decide rewards.

`advance()` processes real elapsed seconds mathematically. It preserves fractional gathering progress, clamps Qi at the current bottleneck, finishes a single prepaid recipe and uses a timestamp high-water mark. It has constant work per update rather than replaying offline frames. Numeric comparisons use a small tolerance at interval boundaries.

The game currently keeps a mutable state in one owning UI controller. At this size, that is simpler than introducing a state framework. Future systems should remain commands on the same core; move presentation into smaller components when complexity warrants it. Do not let scene callbacks edit currency or stats directly.

## Storage

The save is small JSON with a schema version, format marker, checksum and validated payload. The browser writes its primary and backup as one IndexedDB record. Native Preferences writes the pair as one string value. The promise queue serializes writes in a tab. Web Locks prevents two cooperating tabs from writing the same local save simultaneously.

Checksums detect accidental damage; offline saves are player-owned and editable. They do not need an online anti-cheat service. Future schema changes must introduce an explicit migration rather than silently treating an older journey as a new game.

LocalStorage is a degraded fallback only; exported JSON is the portable backup. Browser storage can be removed by user action or eviction. Settings offers a persistent-storage request without promising the browser will grant it. There is no cloud sync in this build.

## Lifecycle

Boot: acquire writer lock → read and validate primary/backup → process eligible elapsed time → render → persist → show an informational return report.

While visible: process time every 250 ms, update counters, save every five seconds, and save successful commands. Auto battle resolves at most one action per 1.3 seconds while visible and no modal is open. Hidden: stop simulating fights and commit the current time/state. Visible again: catch up safe work, render and show the report if the absence was meaningful.

A browser may terminate before its last asynchronous write finishes. Previous successful IndexedDB transactions remain valid. Native app lifecycle and termination behavior require device testing before release.

## Offline assets and updates

The production build emits a fingerprinted service worker cache containing the complete app and original artwork. Install succeeds only when every required asset is cached. Updates wait for existing clients to close; the new worker cleans old caches only on activation. This prevents an active session unexpectedly mixing versions.

No remote fonts, images, analytics, APIs or runtime CDN dependencies are required. The initial download uses HTTPS or localhost. Browser private modes and hosting headers can restrict service workers; failed installation is reported without pretending the game is ready offline. Native builds use bundled assets and do not register this worker.

## Native release boundary

The repository includes Capacitor dependencies and app configuration. Producing a signed APK/AAB needs Android Studio/SDK and signing setup. Producing an iOS app needs macOS, Xcode and Apple signing. Keep those outputs distinct from a browser deployment. No native device certification is implied by successful TypeScript or browser tests.

## Next engineering work

1. Real-device lifecycle suite and native storage checks.
2. Save migration fixtures when introducing schema 2.
3. Extract localized text and split the growing UI module by destination.
4. Content validation and economy simulation as the roster expands.
5. Performance profiling before adding more effects or richer battle scenes.
