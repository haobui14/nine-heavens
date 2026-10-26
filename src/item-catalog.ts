import catalog from './game/item-catalog.json';

export const ITEMS = catalog.items;
export const ITEM_TIERS = catalog.tiers;
export type CatalogFilters = { query: string; tier: string; category: string; availability: string };
export const emptyCatalogFilters = (): CatalogFilters => ({ query: '', tier: 'all', category: 'all', availability: 'all' });
const escape = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const icon = (name: string) => `<i data-lucide="${name}" aria-hidden="true"></i>`;
const statLabels: Record<string, string> = {
  attack: 'Attack', vitality: 'Vitality', defense: 'Defense', critChance: 'Crit chance',
  cultivationRate: 'Cultivation rate', healthRestore: 'HP restored', qiGain: 'Qi granted',
  materialGrade: 'Material grade', trialAccess: 'Tribulation opened',
};
const slotIcons: Record<string, string> = {
  Sword: 'sword', Robe: 'shirt', Crown: 'crown', Ring: 'circle-dot', Talisman: 'scroll-text',
  'Healing pill': 'droplets', 'Cultivation pill': 'sparkles', 'Breakthrough pill': 'orbit', Ore: 'gem',
};
export function itemStats(item: typeof ITEMS[number]) {
  return Object.entries(item.stats).filter(([, value]) => typeof value === 'number').map(([key, value]) => {
    const percentage = key === 'critChance' || key === 'cultivationRate';
    const prefix = ['attack', 'vitality', 'defense', 'critChance', 'cultivationRate'].includes(key) ? '+' : '';
    return `${prefix}${value}${percentage ? '%' : ''} ${statLabels[key] || key}`;
  });
}
export function matchingItems(filters: CatalogFilters) {
  const query = filters.query.trim().toLowerCase();
  return ITEMS.filter(item => (filters.tier === 'all' || item.tier === filters.tier)
    && (filters.category === 'all' || item.category === filters.category)
    && (filters.availability === 'all' || item.available === (filters.availability === 'current'))
    && (!query || `${item.name} ${item.slot} ${item.effect} ${itemStats(item).join(' ')} ${item.tier}`.toLowerCase().includes(query)));
}
export function renderCatalogResults(filters: CatalogFilters) {
  const items = matchingItems(filters);
  return `<p class="catalog-count" role="status" aria-live="polite">Showing <strong>${items.length}</strong> of ${ITEMS.length} items</p>
    ${items.length ? `<div class="catalog-columns" aria-hidden="true"><span>Item / type</span><span>Tier</span><span>Item level</span><span>Base stats and effect</span></div><div class="catalog-list" role="list">${items.map(item => {
      const tier = ITEM_TIERS.find(t => t.id === item.tier)!;
      return `<article class="catalog-row" role="listitem" aria-labelledby="item-${item.id}" style="--item-tier:${tier.color}">
        <div class="catalog-name"><span class="catalog-symbol">${icon(slotIcons[item.slot] || 'package')}</span><div><h3 id="item-${item.id}">${escape(item.name)}</h3><small>${escape(item.slot)}<span class="catalog-mobile-level"> · Lv. ${item.level}</span> · ${item.available ? 'Current chapter' : 'Planned'}</small></div></div>
        <span class="catalog-tier">${tier.name}</span><span class="catalog-level">Lv. ${item.level}</span>
        <div class="catalog-stats"><div>${itemStats(item).map(stat => `<strong>${escape(stat)}</strong>`).join('')}</div><p>${escape(item.effect)}</p><small>${escape(item.source)}</small></div>
      </article>`;
    }).join('')}</div>` : '<div class="catalog-empty"><p>No items match these filters.</p><button class="button secondary" data-catalog-reset>Clear filters</button></div>'}`;
}
export function renderItemCatalog(filters: CatalogFilters) {
  const option = (value: string, label: string, selected: string) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`;
  return `<section class="item-catalog panel"><div class="catalog-heading"><div><button class="text-button" data-filter="all">${icon('arrow-left')} Back to your inventory</button><h2>Item catalog</h2><p>${ITEMS.length} items · ${ITEM_TIERS.length} tiers · Item levels 1–60</p></div><a class="button secondary catalog-download" href="./data/item-catalog.csv" download="nine-heavens-items.csv">${icon('download')} Download CSV</a></div>
    <p class="catalog-note">Five entries already exist in this chapter; the remaining items define future loot. Item levels are catalog grades. Planned items and their stats do not change your current equipment or combat.</p>
    <div class="catalog-tier-guide">${ITEM_TIERS.map(t => `<span style="--item-tier:${t.color}"><b>${t.name}</b> Lv. ${t.minLevel}–${t.maxLevel}</span>`).join('')}</div>
    <div class="catalog-controls" role="search" aria-label="Search the item catalog">
      <label for="catalog-search"><span>Find an item</span><input id="catalog-search" type="search" placeholder="Name, type or stat…" value="${escape(filters.query)}" maxlength="100" autocomplete="off" /></label>
      <label for="catalog-tier"><span>Tier</span><select id="catalog-tier">${option('all', 'All tiers', filters.tier)}${ITEM_TIERS.map(t => option(t.id, t.name, filters.tier)).join('')}</select></label>
      <label for="catalog-category"><span>Category</span><select id="catalog-category">${[['all', 'All categories'], ['equipment', 'Equipment'], ['pills', 'Pills'], ['materials', 'Materials']].map(([id, name]) => option(id, name, filters.category)).join('')}</select></label>
      <label for="catalog-availability"><span>Availability</span><select id="catalog-availability">${[['all', 'All definitions'], ['current', 'Current chapter'], ['planned', 'Planned loot']].map(([id, name]) => option(id, name, filters.availability)).join('')}</select></label>
    </div><div id="catalog-results">${renderCatalogResults(filters)}</div></section>`;
}
