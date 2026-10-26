# Nine Heavens — game design

Version 0.1, October 26, 2026. A new project, independently designed from the existing game.

## The promise

Start as an ordinary traveler with a weathered sword. Find a Dao through the choices you make, grow from breath to breakthrough, and leave a mark on a world of cultivators. The complete journey must remain playable offline on PC browsers, mobile browsers, and native mobile applications.

The game combines the cultivation depth, collection, crafting and idle growth of mobile cultivation RPGs with a complete personal campaign. It uses original lore, writing, art, mechanics and content. Reference features guide the breadth of systems; they do not determine copied characters or screens.

## Five pillars

1. **Preparation is power.** Combat rewards decisions about techniques, equipment, elixirs and allies.
2. **Breakthroughs change the journey.** A realm grants a new ability or system as well as stronger numbers.
3. **Absence is peaceful.** Safe work continues; essential stories and lifespan wait.
4. **Many paths connect.** Crafting, exploration, relationships and sect life feed character development.
5. **The player owns the pace.** No daily streak, server race, mandatory subscription or expiring progression reward.

## Platform and interaction

Phaser 3 renders the animated game layer. TypeScript controls deterministic gameplay. Responsive semantic HTML presents readable text, inventory, recipes and controls. Vite packages all assets. A service worker caches the browser build; Capacitor wraps the same code for Android and iOS.

Desktop uses a sidebar and pointer-friendly detail panels. Phones use a bottom navigation bar and stacked content. Both orientations should work; portrait is the primary phone interface. No mechanic depends on hover, drag-only input or a hardware keyboard. The action focus shortcut is optional.

## World and identity

The Lower Heavens are a chain of mountain sanctuaries and ruined spirit domains. An ancient ascension shattered the roads between worlds. The player follows traces of that event, then chooses whether to repair the roads, control them or walk beyond them.

The opening takes place at **Jade Peak**, a quiet refuge above the clouds. The **Azure Cloud Sect** values patient practice and personal resolve. Elder Yun offers a home after the player demonstrates courage outside the sanctuary. **Little Cloud**, a wandering cloud fox, introduces spirit companionship.

Opening regions:

| Region | Identity | Gameplay |
|---|---|---|
| Whispering Bamboo | Soft jade forest, lantern paths, forgotten shrines | Low-risk first expedition, herbs, first guardians |
| Crimson Ridge | Copper cliffs, ember beasts, ancient forges | Weapon materials, harder hitting enemies, build checks |
| Moonlit Ruins | Cool blue stone, abandoned immortal terraces | Foundation-gated challenge, spirit guardians, larger rewards |

Future sects: Red Furnace (alchemy and forging), Stillwater Court (defense and diplomacy), Hollow Moon (illusions and exploration), Iron Root (body cultivation). They must offer mechanical and narrative identities rather than identical stores with different names.

## Core loops

- **Seconds:** focus Qi or make a combat choice; receive clear visual and numerical feedback.
- **Minutes:** finish a recipe, improve a technique or sword, complete an expedition and resolve a milestone.
- **Sessions:** meet a bottleneck, prepare a breakthrough, overcome its trial and reach a new area.
- **Campaign:** deepen relationships, advance in a sect, solve the broken roads mystery and complete a first ascension.
- **Endgame:** explore higher worlds, master a Dao, lead a sect and optionally establish a reincarnation legacy.

A short visit should allow a meaningful decision. A longer visit offers combat and discovery. Production time must not be the only available activity.

## Cultivation

First chapter: Qi Condensation → Foundation Establishment → Golden Core. Each has early, middle and late stages. These data definitions can expand later without changing the interface model. The first chapter ends at late Golden Core; higher realms are separate content releases.

Current formula: base cultivation is 1.8 Qi/second, increasing by 1.4 per major realm. Each abode level adds 20% of that base. Sect membership multiplies cultivation by 1.15. Gathering assignments grant 20% of the meditation rate. Focus grants 18 Qi, plus 10 per major realm, at a twelve-second cooldown.

Each realm's Qi bottleneck is its base requirement multiplied by `1 + minorStage * 0.8`. Current realm bases are 120, 900 and 4200. Tune these after playtests. Spending several sessions at the last realm can be appropriate; no critical content should require long waits without alternative play.

Minor breakthroughs require a full reserve and player approval. Major breakthroughs require full Qi and a Foundation Pill, then a three-encounter trial. A failed or abandoned trial restores the preparation pill and keeps the bottleneck intact. Later versions can add graded foundation quality, heart-demon choices and distinct realm trials with recoverable consequences.

Spirit roots ultimately influence affinity, discovery and specialized builds; avoid making one creation roll a permanent handicap. The first chapter begins with a Wood root to keep onboarding focused.

## Combat and builds

The first build uses visible deterministic combat turns, animated through Phaser. Auto battle follows the equipped order, selecting the first ready art, then basic attacks. Manual mode allows attack, art, guard and elixir choices. Every combat action is resolved by the same core.

The long-term direction adds short telegraphed boss phases and optional timing inputs without compromising mobile accessibility. Prototype combat is turn based; free movement and manual dodging are future work, not current features.

Base attack = 12 + 4 per minor stage + 15 per major realm + 5 per weapon refinement + 3 from Little Cloud. Base vitality = 100 + 20 per minor stage + 55 per major realm. Damage has a narrow seeded variation and a 12% critical chance. Combat power is a comparison aid; outcomes use actual attack, health, skills and decisions.

Starting arts:

| Art | Identity | Effect |
|---|---|---|
| Cloud-Parting Sword | Metal / sword | 175% damage, two-turn cooldown |
| Verdant Lotus | Wood / sustain | 120% damage, heal 18, three-turn cooldown |
| Ninefold Ember | Fire / burst | 240% damage, three-turn cooldown |
| Stillwater Palm | Water / defense | 150% damage, halve incoming strike, two-turn cooldown |
| Mountain Heart | Earth / body | 200% damage, heal 10, three-turn cooldown |
| Heaven's Reproach | Lightning / burst | 320% damage, four-turn cooldown |

Equip up to three arts. Switching outside combat is free. Further releases add passive heart methods, elemental marks and reactions, artifact activation and companion roles. A Wood seed consumed by Fire should create a meaningful interaction rather than another generic percentage bonus.

Guard reduces damage but deals a weak strike. Healing items do not advance the enemy turn in the first chapter. Defeat safely returns the player home without deleting belongings. Expeditions have fixed encounter counts and award their completion reward once, after the guardian is defeated.

## Economy and professions

Use a small resource vocabulary: spirit stones, spirit herbs, cloud iron and cultivation Qi. No premium currency. Spirit stones come from safe passive income, expeditions and milestones. Herbs and iron come from gathering or expeditions.

Alchemy spends the full recipe cost at start, then completes one elixir after the required work time. An occupied furnace cannot start a second recipe. Later automation can repeat only while ingredients and storage permit; it must stop explicitly when blocked.

| Recipe | Cost | Time | Purpose |
|---|---|---|---|
| Jade Dew | 4 herbs + 12 stones | 12 seconds | Restore 45 vitality during combat |
| Foundation Pill | 12 herbs + 2 iron + 30 stones | 35 seconds | Begin a major-realm trial |
| Clear Insight | 6 herbs + 20 stones | 20 seconds | Add 90 Qi, capped at bottleneck |

The Cloudveil Sword refines to +8 in this chapter. Each refinement adds 5 attack; cost scales by refinement level. The spirit array has five upgrades, each improving cultivation. Little Cloud is befriended with herbs and stones and grants persistent combat support.

Full-game professions: forging and affixes, herb gardening, talisman making, formations, advanced artifact refining and recipe discovery. Give every profession a useful campaign role and an acquisition route outside random chance.

## Companions, NPCs and sects

Current chapter: Little Cloud and Azure Cloud membership with an explicit +15% cultivation benefit. Elder Yun's letter and the journey journal provide authored local narrative.

Next systems: a bounded NPC cast with stable IDs, readable personalities, cultivation paths and memories. Named rivals return in tournaments, allies unlock personal quests, and merchants have predictable trading identities. NPCs may progress when the campaign calendar advances; they should not erase quests simply because the app was closed.

Relationships include friendship, rivalry, master–disciple ties and optional Dao partnership. Joint cultivation and Qi/body dual cultivation are distinct systems and should have distinct names. Relationship progress must involve choices and stories rather than only gifts.

Sect progression: visitor → outer disciple → inner disciple → core disciple → elder. Membership grants facilities and exclusive study. A later leadership release adds recruitment, disciples, halls, resource sites and territorial strategy.

## Offline conversions

| Familiar online feature | Local equivalent |
|---|---|
| PvP rankings | Clearly labeled NPC tournament ladder |
| Guild wars | Campaign conflicts among simulated sects |
| Cooperative raid | Player with companions and a spirit beast |
| World boss | Regional crisis with bounded NPC contributions |
| Trading | NPC auction, merchants, scarcity and resource sinks |
| Chat | Letters, conversations and rumor journal |
| Event season | Included quest arc unlocked by campaign progress |
| Login streak | Permanent journey milestones |
| Summoning banner | Recruitment discoveries, earned draws and guaranteed selection |
| Battle pass | Permanent achievement chapters |

No feature requires a server or live generative model. Authored local text and controlled procedural selection provide content. Any optional future online extension must remain outside the required gameplay path.

## Time and saves

Real time advances safe assignments for at most thirty days per absence. Campaign time advances from completed expeditions and future story decisions. Combat time advances from player or auto actions while visible. Keep those clocks separate.

Qi cannot pass a bottleneck unattended. No lifespan, essential quest, relationship opportunity or war outcome is lost by closing the app. Combat and safe production pause together while an expedition is active in v0.1. That deliberate initial rule avoids maintaining two simultaneous simulations; revisit with explicit lifecycle tests if parallel production is added.

Use checksummed, versioned save envelopes and retain a healthy recovery copy. Validate imported data before applying it. Save state and its processed timestamp in one transaction or one native value. Never attach a second reward claim to the offline report; it only explains work already committed.

## Interface and accessibility

Destinations: Sanctuary, World, Techniques, Inventory, Spirit Abode, Alchemy and Sect. Settings and Journal remain accessible on desktop and in mobile More. Each item explains its effect and cost. A disabled action should have nearby requirements explaining how to make it available.

Readable text takes priority over decorative authenticity. English is the opening language. Localization should eventually separate text keys from logic; the current authored strings need extraction before a second language ships. Use elemental icons as well as color. Provide reduced motion, optional sound, native modal focus handling, visible keyboard focus and touch targets.

## Delivery roadmap

| Release | Intended result | Acceptance |
|---|---|---|
| 0.1 First Light | Playable offline browser loop and shared mobile configuration | Save/reload, expedition, crafting, techniques and breakthrough work together |
| 0.2 Roots & Reactions | Passive methods, elemental reactions, root choices, first authored companion | Three builds solve enemies in distinct ways; avoid one dominant loadout |
| 0.3 A Living Mountain | NPC roster, relationship events, rumors, NPC tournament and auctions | NPCs have persistent identities and bounded progress |
| 0.4 Houses of the Dao | Sect missions, ranks, halls, competing sects and profession depth | Resources and faction choices form a coherent economy |
| 0.5 Beyond the Gate | Roguelike secret realms, artifact spirit, more trials and regions | A complete first-ascension campaign has an ending |
| 1.0 | Balanced complete campaign, production assets, device-tested Android/iOS apps | Airplane-mode campaign and save recovery pass on supported devices |
| Expansions | Sect leadership/wars, disciples/Dao partners, higher worlds, reincarnation | Each adds meaningful decisions and migrates earlier saves |

Feature counts are content budgets to refine after playtesting. A single build session establishes the foundation; it does not claim the full commercial product is finished.

## Quality gates

Time partitioning must not change resource outcomes. Reopening cannot duplicate elapsed work or reroll seeded combat. Invalid actions cannot partly spend ingredients. The starter build must complete its first expedition. Save corruption must be detected before replacing a valid journey. Safe absence must not advance the campaign. Every included technique, region and reward must be reachable through ordinary play.

Real-device gates still required: midrange Android frame rate and memory, small-phone hit targets, touch scrolling, iOS safe areas, app suspension/kill/relaunch, native save retention, release signing and final installability. Browser emulation alone does not certify those targets.
