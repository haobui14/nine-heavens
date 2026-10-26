import './style.css';
import './touch.css';
import { createIcons, icons } from 'lucide';
import { Capacitor } from '@capacitor/core';
import { ACTIVITIES, REALMS, STAGES, SKILLS, RECIPES, REGIONS, MILESTONES, type Activity } from './game/content';
import { advance, act, qiCap, qiRate, power, attack, health, enemy, weaponCost, abodeCost, type GameState, type Action, type OfflineReport } from './game/engine';
import { loadGame, saveGame, exportSave, importSave } from './game/save';
import { mountScene } from './scene';
import { chime } from './audio';

type Page = 'sanctuary' | 'world' | 'techniques' | 'inventory' | 'abode' | 'alchemy' | 'sect';
let state: GameState;
let page: Page = 'sanctuary';
let inventoryFilter = 'all';
let disposeScene: (() => void) | undefined;
let saveStatus = 'Saving your journey';
let offlineReady = false;
let lastBattleTick = 0;
let lastSave = 0;
let toastTimer: ReturnType<typeof setTimeout>;
const app = document.querySelector<HTMLDivElement>('#app')!;
const escape = (v: unknown) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const icon = (name: string, cls = '') => `<i data-lucide="${name}"${cls ? ` class="${cls}"` : ''} aria-hidden="true"></i>`;
const fmt = (n: number) => Math.floor(n).toLocaleString('en-US');
const percent = (n: number, max: number) => Math.min(100, Math.max(0, n / max * 100));
const disabled = (condition: boolean) => condition ? 'disabled' : '';
const nav = [
  { id: 'sanctuary', name: 'Sanctuary', icon: 'sunrise', subtitle: 'Your cultivation' },
  { id: 'world', name: 'World', icon: 'map', subtitle: 'Beyond the mountain' },
  { id: 'techniques', name: 'Techniques', icon: 'scroll-text', subtitle: 'Find your own Dao' },
  { id: 'inventory', name: 'Inventory', icon: 'backpack', subtitle: 'Treasures of the journey' },
  { id: 'abode', name: 'Spirit Abode', icon: 'house', subtitle: 'A place to return to' },
  { id: 'alchemy', name: 'Alchemy', icon: 'flask-conical', subtitle: 'A patient flame' },
  { id: 'sect', name: 'Sect', icon: 'flag', subtitle: 'A path walked together' },
] as const;
const brand = `<span class="brand-mark">${icon('mountain')}</span><span class="brand-words"><strong>NINE HEAVENS</strong><small>A CULTIVATOR’S JOURNEY</small></span>`;
function navButton(item: typeof nav[number], mobile = false) {
  return `<button class="nav-item ${page === item.id ? 'active' : ''} ${mobile ? 'mobile-nav-item' : ''}" data-page="${item.id}" ${page === item.id ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${item.name}</span>${!mobile && page === item.id ? '<span class="nav-dot"></span>' : ''}</button>`;
}
function render() {
  const oldHost = document.getElementById('realm-canvas');
  document.body.classList.toggle('reduced-motion', state.settings.reducedMotion);
  app.innerHTML = `
    <header class="topbar"><button class="brand" data-page="sanctuary" aria-label="Nine Heavens sanctuary">${brand}</button>
      <div class="topbar-right"><span class="single-player">${icon('circle-dot')} Single player</span><div class="resource-pills">
        <button class="resource" data-resource="stones" title="Spirit stones — earned through cultivation and expeditions">${icon('gem')}<span data-value="stones">${fmt(state.stones)}</span><span class="resource-label">Spirit stones</span></button>
        <button class="resource herbs" data-resource="herbs" title="Spirit herbs — gather in your abode or on expeditions">${icon('sprout')}<span data-value="herbs">${fmt(state.herbs)}</span><span class="resource-label">Spirit herbs</span></button>
        <button class="resource iron" data-resource="iron" title="Cloud iron — refine your equipment">${icon('hexagon')}<span data-value="iron">${fmt(state.iron)}</span><span class="resource-label">Cloud iron</span></button>
      </div><button class="avatar" data-modal="character" aria-label="View your cultivator">${icon('user-round')}</button></div>
    </header>
    <aside class="sidebar"><div class="sidebar-group"><span class="eyebrow">YOUR JOURNEY</span>${nav.slice(0, 4).map(n => navButton(n)).join('')}</div>
      <div class="sidebar-group"><span class="eyebrow">THE INNER WORLD</span>${nav.slice(4).map(n => navButton(n)).join('')}</div>
      <div class="sidebar-bottom"><div class="chapter-note"><span class="chapter-symbol">${icon('mountain-snow')}</span><span>CHAPTER ONE<strong>Where clouds begin</strong></span></div>
      <button class="nav-item" data-modal="journal">${icon('book-open')}<span>Journey journal</span><span class="journal-count">${state.journal.length}</span></button>
      <button class="nav-item" data-modal="settings">${icon('settings-2')}<span>Settings & saves</span></button><div class="build-note">NINE HEAVENS <span>v0.1 · First light</span></div></div>
    </aside>
    <main class="main"><div class="page-heading"><div><div class="breadcrumb">YOUR JOURNEY <span>/</span> ${nav.find(n => n.id === page)!.name.toUpperCase()}</div><h1>${page === 'sanctuary' ? 'The path to immortality' : nav.find(n => n.id === page)!.subtitle}</h1><p>${pageDescription()}</p></div><div class="world-time">${icon('sun')}<span>YEAR 1 <b>·</b> EARLY SPRING<small>Day ${state.campaignDay} · Jade Peak</small></span></div></div>
    ${pageContent()}
    <footer class="page-footer"><span>${icon('shield-check')} <span id="save-status" role="status">${escape(saveStatus)}</span></span><span id="offline-status">${offlineReady ? 'Available offline' : 'Your progress stays on this device'} <span class="footer-dot">·</span> No account needed</span></footer>
    </main>
    <nav class="mobile-nav" aria-label="Main navigation">${nav.slice(0, 4).map(n => navButton(n, true)).join('')}<button class="nav-item mobile-nav-item ${['abode', 'alchemy', 'sect'].includes(page) ? 'active' : ''}" data-modal="more">${icon('menu')}<span>More</span></button></nav>
  `;
  let host = document.getElementById('realm-canvas');
  if (host && oldHost) { host.replaceWith(oldHost); host = oldHost; }
  else if (host) disposeScene = mountScene(host, () => state);
  else { disposeScene?.(); disposeScene = undefined; }
  createIcons({ icons, attrs: { 'stroke-width': 1.65 } }); updateDynamic();
}
function pageDescription() {
  return ({ sanctuary: 'A thousand realms await. Begin with a single breath.', world: 'Every mountain hides a story. Every journey changes you.', techniques: 'The strongest path is the one you make your own.', inventory: 'A weathered sword today. A legend in the making.', abode: 'Even an immortal needs somewhere to call home.', alchemy: 'Gather the gifts of the earth. Refine them with intention.', sect: 'Among the clouds, a thousand paths become one.' })[page];
}
function pageContent(): string {
  if (state.battle && page === 'sanctuary') return battlePage();
  switch (page) {
    case 'sanctuary': return sanctuaryPage();
    case 'world': return worldPage();
    case 'techniques': return techniquesPage();
    case 'inventory': return inventoryPage();
    case 'abode': return abodePage();
    case 'alchemy': return alchemyPage();
    case 'sect': return sectPage();
  }
}
function sanctuaryPage() {
  return `<div class="sanctuary-grid"><section class="landscape-card"><div class="landscape"><div id="realm-canvas" aria-hidden="true"></div><div class="location-badge">${icon('map-pin')} JADE PEAK <span>·</span> SPIRIT SANCTUARY</div><button class="landscape-expand round-button" data-page="world" aria-label="Explore the world map">${icon('expand')}</button><div class="landscape-copy"><span class="eyebrow">YOUR JOURNEY BEGINS WITHIN</span><h2>A quiet mind.<br>An endless path.</h2><p>Above the clouds, the Dao is listening.</p></div><div class="landscape-caption"><span class="breathing-dot"></span> A PLACE BETWEEN EARTH & HEAVEN</div></div>
      <div class="meditation-bar"><div class="meditation-status"><span class="meditation-icon">${icon(ACTIVITIES[state.activity].icon)}</span><div><strong>${ACTIVITIES[state.activity].name}</strong><span>${state.activity === 'cultivate' ? 'Drawing in the spiritual energy around you' : ACTIVITIES[state.activity].description}</span></div></div><button class="button primary focus-button" data-action="focus">${icon('sparkles')}<span class="focus-label">Focus your Qi</span><span class="button-shortcut">F</span></button></div>
    </section>${cultivatorCard()}</div>
    <div class="next-step"><span class="next-icon">${icon('compass')}</span><div><span class="eyebrow">YOUR NEXT STEP</span><strong>${state.stats.breakthroughs === 0 ? 'Every immortal was once a mortal.' : state.stats.expeditions === 0 ? 'The mountain has taught you. Let the world teach you next.' : !state.sect ? 'A letter from the Azure Cloud Sect awaits.' : 'There is always another horizon.'}</strong><span>${state.stats.expeditions === 0 ? 'Explore the bamboo forest for herbs, spirit stones, and a little perspective.' : !state.sect ? 'Your deeds in the wilds have earned you an invitation.' : 'Refine your techniques, cultivate your foundation, and follow your own Dao.'}</span></div><button class="text-button" data-page="${state.stats.expeditions > 0 && !state.sect ? 'sect' : 'world'}">${state.stats.expeditions > 0 && !state.sect ? 'Visit the sect' : 'Venture beyond'} ${icon('arrow-right')}</button></div>
    <div class="lower-grid"><section><div class="section-heading"><div><span class="eyebrow">BEYOND THE SANCTUARY</span><h2>The world is waiting</h2></div><button class="text-button muted" data-page="world">View world ${icon('arrow-up-right')}</button></div><div class="region-grid">${REGIONS.map(r => regionCard(r)).join('')}</div></section>
    <section class="journal-preview"><div class="section-heading"><div><span class="eyebrow">SMALL STEPS, GREAT DISTANCES</span><h2>On the path</h2></div><button class="round-button" data-modal="journal" aria-label="Read your journey journal">${icon('arrow-up-right')}</button></div><div class="journal-entries">${state.journal.slice(0, 3).map((e, i) => `<div class="journal-entry"><span class="journal-line-icon ${i === 0 ? 'fresh' : ''}">${icon(e.kind === 'cultivation' ? 'sparkles' : e.kind === 'battle' ? 'swords' : e.kind === 'craft' ? 'flask-conical' : 'wind')}</span><div><strong>${escape(e.title)}</strong><p>${escape(e.text)}</p><span>${i === 0 ? 'Latest chapter' : 'Earlier on your journey'}</span></div></div>`).join('')}</div><div class="journal-quote">“The journey of a thousand realms<br>begins beneath your feet.”</div></section></div>
    <section class="milestone-section"><div class="section-heading compact"><h2>Little milestones</h2><span class="subtle">A journey worth remembering</span></div><div class="milestone-grid">${MILESTONES.map(m => { const done = state.stats[m.goal] >= m.target, claimed = state.claimed.includes(m.id); return `<div class="milestone ${claimed ? 'claimed' : ''}"><span class="milestone-icon">${icon(claimed ? 'circle-check' : done ? 'gift' : 'circle-dashed')}</span><div><strong>${m.name}</strong><span>${m.description}</span></div><button class="${done && !claimed ? 'small-button' : 'milestone-state'}" data-action="claim" data-id="${m.id}" ${disabled(!done || claimed)}>${claimed ? 'Completed' : done ? 'Collect' : `${state.stats[m.goal]} / ${m.target}`}</button></div>`; }).join('')}</div></section>`;
}
function cultivatorCard() {
  const cap = qiCap(state), rate = qiRate(state);
  return `<section class="cultivator-card panel"><div class="cultivator-heading"><span class="eyebrow">THE CULTIVATOR</span><button class="round-button" data-modal="character" aria-label="Your character details">${icon('ellipsis')}</button></div><div class="cultivator-identity"><div class="cultivator-portrait"><span class="portrait-sun"></span>${icon('user-round')}</div><div><button class="name-button" data-modal="name">${escape(state.name)} ${icon('pencil')}</button><span>Seeker of the Dao</span><div class="root-tag">${icon('leaf')} Wood spirit root</div></div></div><div class="realm-info"><span class="realm-emblem">${icon('orbit')}</span><div><h2>${REALMS[state.realm].name}</h2><span>${STAGES[state.stage]} <b>·</b> Realm ${state.realm + 1}</span></div></div><div class="qi-heading"><span>Cultivation progress</span><span><b data-value="qi">${fmt(state.qi)}</b> / <span data-value="cap">${fmt(cap)}</span> Qi</span></div><div class="progress-track"><span data-progress="qi" style="width:${percent(state.qi, cap)}%"></span></div><div class="qi-rate"><span><span class="breathing-dot"></span><b data-value="rate">+${rate.toFixed(1)}</b> Qi / second</span><span data-value="qiPercent">${Math.floor(percent(state.qi, cap))}%</span></div><button class="button breakthrough-button" data-action="breakthrough" ${disabled(state.qi < cap)}>${icon('sparkles')}<span>Attempt breakthrough</span>${icon('arrow-up')}</button><div class="cultivator-stats"><div>${icon('swords')}<strong>${power(state)}</strong><span>Combat power</span></div><div>${icon('heart')}<strong>${health(state)}</strong><span>Vitality</span></div><div>${icon('sword')}<strong>${attack(state)}</strong><span>Attack</span></div></div></section>`;
}
function regionCard(r: typeof REGIONS[number]) {
  const locked = state.realm < r.realm;
  return `<button class="region-card ${r.color} ${locked ? 'locked' : ''}" data-region="${r.id}"><div class="region-art"><span class="region-difficulty">${icon(locked ? 'lock-keyhole' : 'circle-dot')}${locked ? 'Foundation realm' : r.difficulty}</span><span class="region-illustration">${icon(r.icon)}</span><span class="region-art-label">${r.label}</span></div><div class="region-card-body"><h3>${r.name}${icon('arrow-up-right')}</h3><div class="region-rewards"><span>${icon('gem')}${r.stones}</span><span>${icon('sprout')}${r.herbs}</span><span>${icon('hexagon')}${r.iron}</span></div></div></button>`;
}
function worldPage() {
  return `<section class="world-map panel"><div class="map-intro"><span class="eyebrow">THE LOWER HEAVENS</span><h2>A world beyond the mist</h2><p>Follow the old roads.<br>See what the clouds have kept.</p></div><svg class="map-paths" viewBox="0 0 1000 400" aria-hidden="true"><path d="M200 295 Q320 330 410 220 T650 170 T840 90"/><path d="M410 220 Q450 100 570 80"/></svg><button class="map-node home-node" style="--x:20%;--y:73%" data-page="sanctuary"><span>${icon('house')}</span><strong>Jade Peak</strong><small>Your sanctuary</small></button>${REGIONS.map((r, i) => `<button class="map-node ${state.realm < r.realm ? 'locked' : ''}" style="--x:${[43, 65, 84][i]}%;--y:${[55, 43, 24][i]}%" data-region="${r.id}"><span>${icon(state.realm < r.realm ? 'lock-keyhole' : r.icon)}</span><strong>${r.name}</strong><small>${state.realm < r.realm ? 'Foundation required' : `Power ${r.recommended} recommended`}</small></button>`).join('')}<div class="map-caption">${icon('compass')} The world unfolds with your cultivation.</div></section><div class="section-heading"><h2>Choose your next journey</h2><span class="subtle">Your combat power <b>${power(state)}</b></span></div><div class="world-region-grid">${REGIONS.map(r => `<div class="world-region">${regionCard(r)}<p>${r.description}</p><button class="button secondary full-width" data-region="${r.id}">${state.realm < r.realm ? 'Discover this region' : 'Prepare expedition'} ${icon('arrow-right')}</button></div>`).join('')}</div><div class="notice">${icon('shield-check')} Exploration is safe to leave. Expeditions pause when you close the game, and defeat never takes your possessions.</div>`;
}
function techniquesPage() {
  return `<div class="loadout-banner"><span class="large-icon">${icon('scroll-text')}</span><div><span class="eyebrow">YOUR DAO, YOUR WAY</span><h2>A thousand arts. One unique path.</h2><p>Equip up to three techniques. Change your build freely between expeditions.</p></div><span class="loadout-count">${state.equipped.length} / 3 <small>equipped</small></span></div><div class="section-heading"><h2>Your technique library</h2><span class="subtle">${state.skills.length} of ${SKILLS.length} comprehended</span></div><div class="technique-grid">${SKILLS.map(k => { const learned = state.skills.includes(k.id), equipped = state.equipped.includes(k.id); return `<article class="technique-card panel ${k.element.toLowerCase()} ${equipped ? 'equipped' : ''}"><div class="technique-top"><span class="technique-icon">${icon(k.icon)}</span><span class="element-tag">${k.element}</span></div><span class="eyebrow">${k.family.toUpperCase()}</span><h2>${k.name}</h2><p>${k.description}</p><div class="technique-effect">${icon('sparkles')}${k.effect}<span>${k.cooldown}-turn cooldown</span></div><button class="button ${equipped ? 'equipped-button' : learned ? 'secondary' : 'primary'} full-width" data-action="${learned ? 'equip' : 'learn'}" data-skill="${k.id}" ${disabled(!learned && state.stones < k.cost)}>${icon(equipped ? 'check' : learned ? 'plus' : 'book-open')}${equipped ? 'Equipped · remove' : learned ? 'Equip technique' : `Comprehend · ${k.cost} stones`}</button></article>`; }).join('')}</div>`;
}
function inventoryPage() {
  const c = weaponCost(state);
  return `<div class="inventory-heading"><div class="tab-row" role="group" aria-label="Inventory filter">${[['all', 'All treasures'], ['equipment', 'Equipment'], ['materials', 'Materials'], ['pills', 'Pills']].map(([id, label]) => `<button data-filter="${id}" class="filter-tab ${inventoryFilter === id ? 'active' : ''}" aria-pressed="${inventoryFilter === id}">${label}</button>`).join('')}</div><span class="subtle">Everything you carry has a story.</span></div><div class="inventory-grid">${['all', 'equipment'].includes(inventoryFilter) ? `<article class="item-card panel weapon-card"><div class="item-art sword-art">${icon('sword')}<span>BOUND EQUIPMENT</span></div><div class="item-content"><span class="eyebrow">SPIRIT WEAPON · EQUIPPED</span><h2>Cloudveil Sword <em>+${state.weapon}</em></h2><p>A simple sword from your first teacher. Something in its steel remembers the sky.</p><div class="item-stat">${icon('swords')} +${state.weapon * 5 + 12} base attack</div><button class="button primary" data-action="upgrade" data-target="weapon" ${disabled(state.weapon >= 8 || state.stones < c.stones || state.iron < c.iron)}>${icon('hammer')} Refine sword <small>${c.stones} stones · ${c.iron} iron</small></button></div></article>` : ''}
    ${['all', 'materials'].includes(inventoryFilter) ? `<article class="panel material-card"><h2>Gifts of the earth</h2>${[['gem', 'Spirit stones', state.stones, 'Trade, learn, and refine.'], ['sprout', 'Spirit herbs', state.herbs, 'Gather from the wilds. Brew in the pavilion.'], ['hexagon', 'Cloud iron', state.iron, 'A patient smith sees the sword within.']].map(([i, name, count, text]) => `<div class="material-row"><span class="material-icon">${icon(String(i))}</span><div><strong>${name}</strong><span>${text}</span></div><b>${fmt(Number(count))}</b></div>`).join('')}<button class="text-button" data-page="abode">Assign a gathering task ${icon('arrow-right')}</button></article>` : ''}
    ${['all', 'pills'].includes(inventoryFilter) ? RECIPES.map(r => `<article class="pill-card panel"><span class="pill-icon ${r.id}">${icon(r.icon)}</span><div><span class="eyebrow">REFINED ELIXIR</span><h2>${r.name}</h2><p>${r.description}</p><strong class="owned-count">${state.pills[r.id]} in your pouch</strong></div>${r.id === 'foundation' ? `<button class="button secondary" data-page="sanctuary">Prepare breakthrough</button>` : `<button class="button secondary" data-action="pill" data-pill="${r.id}" ${disabled(!state.pills[r.id])}>${r.id === 'dew' ? 'Restore health' : 'Take pill'}</button>`}</article>`).join('') : ''}</div>`;
}
function abodePage() {
  const cost = abodeCost(state);
  return `<div class="abode-hero panel"><div><span class="eyebrow">A SANCTUARY OF YOUR OWN</span><h2>The world can wait<br>for one more breath.</h2><p>Your assignments continue while you are away.<br>Choose what this quiet time will become.</p></div><span class="abode-hero-icon">${icon('house')}</span></div><div class="section-heading"><h2>A little work, a little wonder</h2><span class="subtle">One active assignment</span></div><div class="assignment-grid">${(Object.entries(ACTIVITIES) as [Activity, typeof ACTIVITIES[Activity]][]).map(([id, a]) => `<button class="assignment-card panel ${state.activity === id ? 'selected' : ''}" data-action="activity" data-activity="${id}"><span class="assignment-icon">${icon(a.icon)}</span><h2>${a.name}</h2><p>${a.description}</p><span class="assignment-status">${icon(state.activity === id ? 'circle-check' : 'arrow-right')}${state.activity === id ? 'Currently assigned' : 'Begin assignment'}</span></button>`).join('')}</div><div class="abode-lower"><article class="panel upgrade-card"><span class="eyebrow">SPIRIT-GATHERING ARRAY</span><h2>A better place to breathe</h2><p>A circle of carved jade gathers the mountain’s Qi. Each improvement adds 20% to your base cultivation rate.</p><div class="upgrade-level">${Array.from({ length: 5 }, (_, i) => `<span class="${i < state.abode ? 'filled' : ''}">${icon('sparkle')}</span>`).join('')}<b>Level ${state.abode} / 5</b></div><button class="button primary" data-action="upgrade" data-target="abode" ${disabled(state.abode >= 5 || state.stones < cost.stones || state.herbs < cost.herbs)}>Improve array <small>${cost.stones} stones · ${cost.herbs} herbs</small></button></article><article class="panel pet-card"><span class="pet-portrait">${icon('cat')}</span><div><span class="eyebrow">A SMALL COMPANION</span><h2>Little Cloud</h2><p>${state.pet ? 'Your cloud fox curls up beside the meditation mat. On expeditions, its spirit adds 3 to your attack.' : 'A curious cloud fox has been watching from the bamboo. Perhaps a small offering will win its trust.'}</p><button class="button ${state.pet ? 'equipped-button' : 'secondary'}" data-action="pet" ${disabled(state.pet || state.herbs < 10 || state.stones < 60)}>${icon(state.pet ? 'heart' : 'paw-print')}${state.pet ? 'By your side · +3 attack' : 'Befriend · 60 stones + 10 herbs'}</button></div></article></div>`;
}
function alchemyPage() {
  const recipe = state.craft ? RECIPES.find(r => r.id === state.craft!.recipe)! : null;
  return `<section class="furnace-banner"><span class="furnace-illustration">${icon('flask-conical')}</span><div><span class="eyebrow">THE ALCHEMY PAVILION</span><h2>${recipe ? 'Let the flame do its work.' : 'Good things cannot be hurried.'}</h2><p>${recipe ? `Your ${recipe.name} is brewing. Ingredients have been committed; the work continues offline.` : 'Choose a recipe. Add a little patience. The furnace will take care of the rest.'}</p>${recipe ? `<div class="craft-progress"><span data-value="craftName">${recipe.name}</span><b data-value="craftRemaining">${Math.ceil(state.craft!.remaining)}s remaining</b><div class="progress-track"><span data-progress="craft" style="width:${100 - percent(state.craft!.remaining, recipe.seconds)}%"></span></div></div>` : '<span class="furnace-idle"><span class="breathing-dot"></span> Furnace ready</span>'}</div></section><div class="section-heading"><h2>Recipes from the old masters</h2><span class="subtle">Ingredients are spent when brewing begins</span></div><div class="recipe-grid">${RECIPES.map(r => `<article class="recipe-card panel"><div class="recipe-heading"><span class="pill-icon ${r.id}">${icon(r.icon)}</span><span class="recipe-time">${icon('clock-3')}${r.seconds}s</span></div><span class="eyebrow">${r.id === 'foundation' ? 'BREAKTHROUGH ELIXIR' : r.id === 'dew' ? 'RECOVERY ELIXIR' : 'CULTIVATION ELIXIR'}</span><h2>${r.name}</h2><p>${r.description}</p><div class="ingredient-list"><span class="${state.herbs < r.herbs ? 'insufficient' : ''}">${icon('sprout')}${r.herbs} spirit herbs</span>${r.iron ? `<span class="${state.iron < r.iron ? 'insufficient' : ''}">${icon('hexagon')}${r.iron} cloud iron</span>` : ''}<span class="${state.stones < r.stones ? 'insufficient' : ''}">${icon('gem')}${r.stones} spirit stones</span></div><button class="button primary full-width" data-action="craft" data-recipe="${r.id}" ${disabled(!!state.craft || state.herbs < r.herbs || state.stones < r.stones || state.iron < r.iron)}>${icon('flame')}${state.craft?.recipe === r.id ? 'Brewing…' : 'Begin brewing'}</button><span class="recipe-owned">${state.pills[r.id]} already in your pouch</span></article>`).join('')}</div><div class="notice">${icon('lightbulb')} A Foundation Pill opens the trial at the end of a realm. Prepare your sword and techniques before challenging the heavens.</div>`;
}
function sectPage() {
  return `<section class="sect-hero"><div><span class="eyebrow">ESTABLISHED IN THE AGE OF CLOUDS</span><h2>Azure Cloud Sect</h2><p>“The sky belongs to no one.<br>The path is open to all who dare to walk it.”</p><span class="sect-location">${icon('map-pin')} Eastern peak · The Lower Heavens</span></div><span class="sect-seal">${icon('cloud')}<span>AZURE<br>CLOUD</span></span></section><div class="sect-content"><article class="panel elder-card"><span class="eyebrow">A LETTER FROM ELDER YUN</span><h2>${state.sect ? 'Welcome home, disciple.' : 'A place among the clouds.'}</h2><p>${state.sect ? `${escape(state.name)}, the Dao does not reveal itself to those who only wait. Study our arts, brave the wilds, and remember that even the greatest master was once where you stand.` : 'I have watched your first steps from this mountain. Talent opens the door; resolve carries you through it. Return from an expedition, and there will be a place for you here.'}</p><div class="elder-signature"><span>Yun</span>Elder of the Azure Cloud Sect</div><button class="button primary" data-action="sect" ${disabled(state.sect || state.stats.expeditions < 1)}>${icon(state.sect ? 'circle-check' : 'flag')}${state.sect ? 'Outer disciple of Azure Cloud' : state.stats.expeditions < 1 ? 'Complete an expedition to join' : 'Accept the invitation'}</button></article><article class="panel sect-benefits"><h2>A shared path</h2><div>${icon('wind')}<span><strong>Spirit-gathering grounds</strong><small>+15% cultivation rate as a disciple</small></span></div><div>${icon('scroll-text')}<span><strong>Walk your own Dao</strong><small>Your techniques remain yours to choose</small></span></div><div>${icon('shield-check')}<span><strong>A home, without obligations</strong><small>Your place is kept while you are away</small></span></div><p class="development-note">This first chapter introduces sect membership. Disciple missions, rival sects, and leadership are planned for later chapters.</p></article></div>`;
}
function battlePage() {
  const b = state.battle!, foe = enemy(state), r = REGIONS.find(r => r.id === b.region);
  return `<div class="battle-topline"><span class="eyebrow">${b.isTrial ? 'THE HEAVENS ARE WATCHING' : 'EXPEDITION IN PROGRESS'}</span><button class="text-button" data-action="retreat">${icon('corner-up-left')} Return safely</button></div><section class="battle-panel panel"><div class="battle-title"><div><h2>${b.isTrial ? 'The Foundation Tribulation' : r!.name}</h2><span>${b.isTrial ? 'Trial' : 'Encounter'} ${b.wave + 1} of ${b.isTrial ? 3 : r!.stages} ${foe.boss ? '· Guardian' : ''}</span></div><button class="toggle-auto ${b.auto ? 'on' : ''}" data-action="auto" aria-pressed="${b.auto}">${icon(b.auto ? 'pause' : 'play')} Auto battle ${b.auto ? 'on' : 'off'}</button></div><div class="battle-arena ${b.region === 'ridge' ? 'fire-arena' : ''} ${b.isTrial ? 'trial-arena' : ''}"><div class="battle-nameplate player-nameplate"><strong>${escape(state.name)}</strong><div class="health-track"><span style="width:${percent(b.hp, b.maxHp)}%"></span></div><span>${b.hp} / ${b.maxHp} vitality</span></div><div class="battle-nameplate enemy-nameplate"><strong>${foe.name}</strong><div class="health-track enemy-health"><span style="width:${percent(b.enemyHp, b.enemyMaxHp)}%"></span></div><span>${b.enemyHp} / ${b.enemyMaxHp} vitality</span></div><div id="realm-canvas" aria-hidden="true"></div><span class="battle-versus">${icon('swords')}</span><div class="battle-message" role="status">${escape(b.lastAction)}</div></div><div class="battle-controls"><button class="battle-skill basic" data-action="fight" data-move="basic">${icon('sword')}<strong>Sword strike</strong><span>Basic attack</span></button>${state.equipped.map(id => { const skill = SKILLS.find(k => k.id === id)!, cooldown = b.cooldowns[id] || 0; return `<button class="battle-skill ${skill.element.toLowerCase()}" data-action="fight" data-move="${id}" ${disabled(cooldown > 0)}>${icon(skill.icon)}<strong>${skill.name}</strong><span>${cooldown ? `${cooldown} turns to ready` : skill.effect}</span></button>`; }).join('')}<button class="battle-skill" data-action="fight" data-move="guard">${icon('shield')}<strong>Guard</strong><span>Halve incoming damage</span></button><button class="battle-skill" data-action="pill" data-pill="dew" ${disabled(!state.pills.dew || b.hp >= b.maxHp)}>${icon('droplet')}<strong>Jade Dew</strong><span>Heal 45 · ${state.pills.dew} left</span></button></div></section><div class="notice">${icon('lightbulb')} Techniques recover as turns pass. Little Cloud adds attack; refining your sword improves every art. You can return safely at any time.</div>`;
}
function updateDynamic() {
  if (!state) return;
  const values: Record<string, string> = { stones: fmt(state.stones), herbs: fmt(state.herbs), iron: fmt(state.iron), qi: fmt(state.qi), cap: fmt(qiCap(state)), rate: `+${qiRate(state).toFixed(1)}`, qiPercent: `${Math.floor(percent(state.qi, qiCap(state)))}%`, craftRemaining: state.craft ? `${Math.ceil(state.craft.remaining)}s remaining` : '' };
  document.querySelectorAll<HTMLElement>('[data-value]').forEach(e => { const v = values[e.dataset.value!]; if (v !== undefined && e.textContent !== v) e.textContent = v; });
  document.querySelectorAll<HTMLElement>('[data-progress="qi"]').forEach(e => e.style.width = `${percent(state.qi, qiCap(state))}%`);
  if (state.craft) { const recipe = RECIPES.find(r => r.id === state.craft!.recipe)!; document.querySelectorAll<HTMLElement>('[data-progress="craft"]').forEach(e => e.style.width = `${100 - percent(state.craft!.remaining, recipe.seconds)}%`); }
  document.querySelectorAll<HTMLButtonElement>('[data-action="breakthrough"]').forEach(e => e.disabled = state.qi + 1e-6 < qiCap(state));
  document.querySelectorAll<HTMLButtonElement>('[data-action="learn"]').forEach(e => { const skill = SKILLS.find(k => k.id === e.dataset.skill); if (skill) e.disabled = state.stones < skill.cost || !!state.battle; });
  document.querySelectorAll<HTMLButtonElement>('[data-action="craft"]').forEach(e => { const recipe = RECIPES.find(r => r.id === e.dataset.recipe); if (recipe) e.disabled = !!state.craft || !!state.battle || state.herbs < recipe.herbs || state.iron < recipe.iron || state.stones < recipe.stones; });
  document.querySelectorAll<HTMLButtonElement>('[data-action="upgrade"]').forEach(e => { if (e.dataset.target === 'weapon') { const c = weaponCost(state); e.disabled = state.weapon >= 8 || !!state.battle || state.stones < c.stones || state.iron < c.iron; } else { const c = abodeCost(state); e.disabled = state.abode >= 5 || !!state.battle || state.stones < c.stones || state.herbs < c.herbs; } });
  document.querySelectorAll<HTMLButtonElement>('.focus-button').forEach(e => { const wait = Math.max(0, Math.ceil((state.lastFocus + 12000 - Date.now()) / 1000)); e.disabled = wait > 0 || state.qi >= qiCap(state); const label = e.querySelector('.focus-label'); if (label) label.textContent = state.qi >= qiCap(state) ? 'Bottleneck reached' : wait > 0 ? `Breathe… ${wait}s` : 'Focus your Qi'; });
}
function toast(message: string, error = false) {
  document.getElementById('toast')?.remove(); clearTimeout(toastTimer);
  const el = document.createElement('div'); el.id = 'toast'; el.className = `toast ${error ? 'error' : ''}`; el.setAttribute('role', 'status'); el.innerHTML = `${icon(error ? 'circle-alert' : 'sparkles')}<span>${escape(message)}</span><button aria-label="Dismiss notification">${icon('x')}</button>`; el.querySelector('button')!.onclick = () => el.remove(); document.body.appendChild(el); createIcons({ icons, attrs: { 'stroke-width': 1.65 } }); toastTimer = setTimeout(() => el.remove(), 5500);
}
async function persist() {
  try { await saveGame(state); saveStatus = 'Journey saved on this device'; }
  catch { saveStatus = 'Storage unavailable — export your save'; }
  const el = document.getElementById('save-status'); if (el) el.textContent = saveStatus;
}
function dispatch(action: Action, silent = false) {
  const result = act(state, action);
  if ((action.type === 'venture' && result.ok) || (action.type === 'breakthrough' && state.battle)) page = 'sanctuary';
  if (result.ok) { chime(result.kind === 'ascend' ? 'ascend' : result.kind === 'win' ? 'win' : result.kind === 'hit' ? 'hit' : 'tap', state.settings.sound); render(); void persist(); }
  if (!silent || !result.ok || ['win', 'loss', 'ascend'].includes(result.kind || '')) toast(result.message, !result.ok);
}
function navigate(next: Page) {
  page = next; render(); window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? 'instant' : 'smooth' });
}
function modal(title: string, body: string, className = '') {
  document.querySelector('dialog')?.remove(); const d = document.createElement('dialog'); d.className = `game-dialog ${className}`;
  d.innerHTML = `<div class="dialog-heading"><h2>${title}</h2><button class="round-button" data-close aria-label="Close dialog">${icon('x')}</button></div>${body}`;
  document.body.appendChild(d); d.querySelector('[data-close]')!.addEventListener('click', () => d.close());
  d.addEventListener('click', e => { if (e.target === d) { const rect = d.getBoundingClientRect(); const mouse = e as MouseEvent; if (mouse.clientX < rect.left || mouse.clientX > rect.right || mouse.clientY < rect.top || mouse.clientY > rect.bottom) d.close(); } });
  d.addEventListener('close', () => d.remove()); createIcons({ icons, attrs: { 'stroke-width': 1.65 } }); d.showModal(); return d;
}
function regionModal(id: string) {
  const r = REGIONS.find(r => r.id === id)!; const locked = state.realm < r.realm;
  const d = modal(r.name, `<div class="region-modal-art ${r.color}">${icon(r.icon)}</div><p>${r.description}</p><div class="region-detail-stats"><span>Encounters<strong>${r.stages}</strong></span><span>Recommended power<strong>${r.recommended}</strong></span><span>Your power<strong>${power(state)}</strong></span></div><div class="reward-preview"><span class="eyebrow">EXPEDITION REWARDS</span><div><span>${icon('gem')}${r.stones} stones</span><span>${icon('sprout')}${r.herbs} herbs</span><span>${icon('hexagon')}${r.iron} iron</span></div></div>${locked ? '<p class="notice">Reach Foundation Establishment to enter this domain.</p>' : ''}<button class="button primary full-width" id="begin-expedition" ${disabled(locked || !!state.battle)}>${icon('compass')}${state.battle ? 'An expedition is already in progress' : locked ? 'Foundation required' : 'Begin expedition'}</button><p class="dialog-footnote">No entry cost. Your possessions are safe if you withdraw.</p>`);
  d.querySelector('#begin-expedition')!.addEventListener('click', () => { d.close(); dispatch({ type: 'venture', region: r.id }); });
}
function showOffline(report: OfflineReport) {
  if (report.elapsed < 60 || state.battle) return;
  const hours = Math.floor(report.elapsed / 3600), mins = Math.floor(report.elapsed / 60) % 60;
  const d = modal('The mountain kept your place.', `<div class="offline-symbol">${icon('sunrise')}</div><p>Welcome back, ${escape(state.name)}. While you were away for ${hours ? `${hours}h ` : ''}${mins}m, your quiet work continued.</p><div class="offline-rewards"><span>${icon('wind')}<strong>+${fmt(report.qi)}</strong><small>Cultivation Qi</small></span><span>${icon('gem')}<strong>+${fmt(report.stones)}</strong><small>Spirit stones</small></span><span>${icon('sprout')}<strong>+${report.herbs}</strong><small>Spirit herbs</small></span><span>${icon('hexagon')}<strong>+${report.iron}</strong><small>Cloud iron</small></span></div>${report.crafted ? '<p class="notice">Your elixir is ready in the alchemy pavilion.</p>' : ''}<p class="dialog-footnote">Already added to your journey. Your lifespan and story have waited for you.</p><button class="button primary full-width" id="continue-journey">Continue your journey ${icon('arrow-right')}</button>`);
  d.querySelector('#continue-journey')!.addEventListener('click', () => d.close());
}
function openSettings() {
  const d = modal('A little peace of mind', `<p class="dialog-intro">Your journey belongs to you. Keep a copy somewhere safe.</p><div class="settings-row"><span>${icon('volume-2')}<span><strong>Gentle sound effects</strong><small>Plucked notes for actions and breakthroughs</small></span></span><button class="switch ${state.settings.sound ? 'on' : ''}" role="switch" aria-label="Sound effects" aria-checked="${state.settings.sound}" data-pref="sound"><span></span></button></div><div class="settings-row"><span>${icon('wind')}<span><strong>Reduced motion</strong><small>Still the particles and soften transitions</small></span></span><button class="switch ${state.settings.reducedMotion ? 'on' : ''}" role="switch" aria-label="Reduced motion" aria-checked="${state.settings.reducedMotion}" data-pref="reducedMotion"><span></span></button></div><div class="save-tools"><button class="button secondary" id="export-save">${icon('download')} Export save</button><button class="button secondary" id="import-save">${icon('upload')} Import save</button></div><input id="save-file" type="file" accept=".json,application/json" hidden><button class="text-button" id="protect-save">${icon('shield-check')} Request persistent browser storage</button><p class="dialog-footnote">Browser saves are local to this browser and address. Clearing site data can remove them. Export to transfer your journey between PC and mobile.</p><div class="about-build"><strong>NINE HEAVENS</strong><span>v0.1 · First light</span><p>Built for single-player, offline cultivation. This chapter includes three realms, three regions, six arts, alchemy, a spirit companion, and Azure Cloud membership.</p></div>`);
  d.querySelectorAll<HTMLButtonElement>('[data-pref]').forEach(button => button.onclick = () => {
    const key = button.dataset.pref as 'sound' | 'reducedMotion'; dispatch({ type: 'setting', key, value: !state.settings[key] }, true); button.classList.toggle('on', state.settings[key]); button.setAttribute('aria-checked', String(state.settings[key]));
  });
  d.querySelector('#export-save')!.addEventListener('click', () => {
    advance(state, Date.now()); const a = document.createElement('a'); const url = URL.createObjectURL(new Blob([exportSave(state)], { type: 'application/json' })); a.href = url; a.download = `nine-heavens-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('A copy of your journey has been exported.');
  });
  const input = d.querySelector<HTMLInputElement>('#save-file')!;
  d.querySelector('#import-save')!.addEventListener('click', () => input.click());
  input.onchange = async () => {
    const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > 300_000) throw new Error('This save file is too large.');
      const imported = importSave(await file.text());
      const preview = modal('Continue this journey?', `<p>Restore <strong>${escape(imported.name)}</strong>, ${REALMS[imported.realm].name}, ${STAGES[imported.stage].toLowerCase()}?</p><p class="dialog-footnote">Your current journey will become the recovery backup. Export it first if you want a separate copy.</p><button class="button primary full-width" id="confirm-import">Restore this save</button>`);
      preview.querySelector('#confirm-import')!.addEventListener('click', async () => { state = imported; const report = advance(state, Date.now()); await persist(); preview.close(); page = 'sanctuary'; render(); toast('Your journey has been restored.'); showOffline(report); });
    } catch (error) { toast(error instanceof Error ? error.message : 'This save could not be read.', true); }
  };
  d.querySelector('#protect-save')!.addEventListener('click', async () => { const granted = await navigator.storage?.persist?.().catch(() => false); toast(granted ? 'The browser has granted persistent storage.' : 'The browser did not grant persistent storage. Keep an exported backup.'); });
}
function openModal(name: string) {
  if (name === 'settings') return openSettings();
  if (name === 'journal') return modal('The story so far', `<p class="dialog-intro">Small moments on a long road.</p><div class="full-journal">${state.journal.map(e => `<article><span class="eyebrow">${e.kind.toUpperCase()} · ENTRY ${e.id}</span><h3>${escape(e.title)}</h3><p>${escape(e.text)}</p></article>`).join('')}</div>`, 'journal-dialog');
  if (name === 'more') { const d = modal('The inner world', `<div class="more-nav">${nav.slice(4).map(n => `<button class="nav-item" data-modal-page="${n.id}">${icon(n.icon)}<span>${n.name}</span>${icon('chevron-right')}</button>`).join('')}<button class="nav-item" id="mobile-journal">${icon('book-open')}<span>Journey journal</span></button><button class="nav-item" id="mobile-settings">${icon('settings-2')}<span>Settings & saves</span></button></div>`); d.querySelectorAll<HTMLButtonElement>('[data-modal-page]').forEach(b => b.onclick = () => { d.close(); navigate(b.dataset.modalPage as Page); }); d.querySelector('#mobile-settings')!.addEventListener('click', openSettings); d.querySelector('#mobile-journal')!.addEventListener('click', () => openModal('journal')); return; }
  if (name === 'name') { const d = modal('What shall the world call you?', `<form id="name-form"><label class="input-label" for="cultivator-name">Cultivator’s name</label><input id="cultivator-name" name="name" class="name-input" value="${escape(state.name)}" maxlength="24" required autocomplete="off"><button class="button primary full-width" type="submit">Write your name ${icon('feather')}</button></form>`); d.querySelector('form')!.onsubmit = e => { e.preventDefault(); dispatch({ type: 'name', name: d.querySelector<HTMLInputElement>('input')!.value }); d.close(); }; return; }
  if (name === 'character') modal('A seeker of the Dao', `<div class="character-summary"><div class="cultivator-portrait">${icon('user-round')}</div><h2>${escape(state.name)}</h2><span class="root-tag">${icon('leaf')} Wood spirit root</span><p>${REALMS[state.realm].name} · ${STAGES[state.stage]}</p></div><div class="character-stats">${[['Combat power', power(state)], ['Vitality', health(state)], ['Attack', attack(state)], ['Breakthroughs', state.stats.breakthroughs], ['Expeditions', state.stats.expeditions], ['Victories', state.stats.victories]].map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><p class="dialog-footnote">Increase attack with your sword, techniques, and Little Cloud. Improve your spirit array and join Azure Cloud to cultivate faster.</p>`);
}
document.addEventListener('click', e => {
  const button = (e.target as Element).closest<HTMLElement>('button'); if (!button || button.hasAttribute('disabled')) return;
  if (button.dataset.page) return navigate(button.dataset.page as Page);
  if (button.dataset.modal) return void openModal(button.dataset.modal);
  if (button.dataset.region) return regionModal(button.dataset.region);
  if (button.dataset.resource) { inventoryFilter = 'materials'; return navigate('inventory'); }
  if (button.dataset.filter) { inventoryFilter = button.dataset.filter; return render(); }
  const action = button.dataset.action;
  if (!action) return;
  switch (action) {
    case 'focus': return dispatch({ type: 'focus' }, true);
    case 'breakthrough': return dispatch({ type: 'breakthrough' });
    case 'activity': return dispatch({ type: 'activity', activity: button.dataset.activity as Activity });
    case 'craft': return dispatch({ type: 'craft', recipe: button.dataset.recipe! });
    case 'learn': return dispatch({ type: 'learn', skill: button.dataset.skill! });
    case 'equip': return dispatch({ type: 'equip', skill: button.dataset.skill! });
    case 'upgrade': return dispatch({ type: 'upgrade', target: button.dataset.target as 'weapon' | 'abode' });
    case 'fight': return dispatch({ type: 'fight', move: button.dataset.move! }, true);
    case 'retreat': return dispatch({ type: 'retreat' });
    case 'auto': return dispatch({ type: 'auto', value: !state.battle?.auto });
    case 'pill': return dispatch({ type: 'pill', pill: button.dataset.pill! });
    case 'claim': return dispatch({ type: 'claim', id: button.dataset.id! });
    case 'sect': return dispatch({ type: 'sect' });
    case 'pet': return dispatch({ type: 'pet' });
  }
});
document.addEventListener('keydown', e => { if (!state || document.querySelector('dialog[open]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element).tagName) || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key.toLowerCase() === 'f' && page === 'sanctuary' && !state.battle) { e.preventDefault(); dispatch({ type: 'focus' }, true); } });

async function boot() {
  app.innerHTML = `<div class="boot-screen"><div class="brand">${brand}</div><p>The mountain is waking…</p><span class="loading-line"></span></div>`; createIcons({ icons });
  if ('locks' in navigator) {
    const acquired = await new Promise<boolean>(resolve => {
      void navigator.locks.request('nine-heavens-active-journey', { ifAvailable: true }, lock => {
        resolve(!!lock); return lock ? new Promise<void>(() => {}) : Promise.resolve();
      });
    });
    if (!acquired) { app.innerHTML = `<div class="boot-screen"><div class="brand">${brand}</div><h1>Your journey is open in another tab.</h1><p>Close the other Nine Heavens tab to keep one consistent save.</p><button class="button primary" id="retry-lock">Continue here</button></div>`; document.getElementById('retry-lock')!.onclick = () => location.reload(); createIcons({ icons }); return; }
  }
  try {
    const loaded = await loadGame(); state = loaded.state; const report = advance(state, Date.now()); render(); await persist(); if (loaded.message) toast(loaded.message); showOffline(report);
  } catch (error) {
    app.innerHTML = `<div class="boot-screen"><div class="brand">${brand}</div><h1>Your journey is safe to recover.</h1><p>${escape(error instanceof Error ? error.message : 'The save could not be opened.')}</p><label class="button primary" for="recover-file">Restore an exported save</label><input id="recover-file" type="file" accept=".json" hidden></div>`; createIcons({ icons });
    document.querySelector<HTMLInputElement>('#recover-file')!.onchange = async e => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; try { state = importSave(await file.text()); await saveGame(state); location.reload(); } catch (err) { toast(String(err), true); } }; return;
  }
  setInterval(() => {
    if (document.hidden) return;
    const now = Date.now(), wasCrafting = !!state.craft; advance(state, now);
    if (wasCrafting && !state.craft) { render(); toast('Your elixir is ready in the alchemy pavilion.'); void persist(); } else updateDynamic();
    if (state.battle?.auto && now - lastBattleTick > 1300 && !document.querySelector('dialog[open]')) {
      lastBattleTick = now; const ready = state.equipped.find(id => !(state.battle!.cooldowns[id] > 0)); dispatch({ type: 'fight', move: ready || 'basic' }, true);
    }
    if (now - lastSave > 5000) { lastSave = now; void persist(); }
  }, 250);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { advance(state, Date.now()); void persist(); }
    else { const report = advance(state, Date.now()); render(); void persist(); showOffline(report); }
  });
  if ('serviceWorker' in navigator && !Capacitor.isNativePlatform() && import.meta.env.PROD) {
    navigator.serviceWorker.register('./sw.js').then(async registration => {
      await navigator.serviceWorker.ready; offlineReady = true;
      const el = document.getElementById('offline-status'); if (el) el.textContent = 'Available offline · No account needed';
      registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) toast('A new chapter is ready. Close and reopen the game to update.'); }); });
    }).catch(() => toast('Offline installation could not finish. Your local save still works; reconnect and reopen to retry.', true));
  }
}
void boot();
