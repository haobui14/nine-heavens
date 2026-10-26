export type Activity = 'cultivate' | 'herbs' | 'mine';
export const REALMS = [
  { name: 'Qi Condensation', epithet: 'Gather the breath of heaven', baseQi: 120 },
  { name: 'Foundation Establishment', epithet: 'Give the infinite a foundation', baseQi: 900 },
  { name: 'Golden Core', epithet: 'A sun within the soul', baseQi: 4200 },
] as const;
export const STAGES = ['Early stage', 'Middle stage', 'Late stage'];
export const ACTIVITIES: Record<Activity, { name: string; description: string; icon: string }> = {
  cultivate: { name: 'Meditation', description: 'Draw in the mountain’s spiritual energy.', icon: 'wind' },
  herbs: { name: 'Gather spirit herbs', description: 'One herb every 6 seconds. A little Qi, too.', icon: 'sprout' },
  mine: { name: 'Mine cloud iron', description: 'One cloud iron every 12 seconds.', icon: 'pickaxe' },
};
export const SKILLS = [
  { id: 'cloud', name: 'Cloud-Parting Sword', family: 'Sword art', element: 'Metal', icon: 'sword', description: 'A clean arc of sword Qi. Deals 175% attack damage.', effect: '175% damage', multiplier: 1.75, cost: 0, cooldown: 2 },
  { id: 'lotus', name: 'Verdant Lotus', family: 'Wood art', element: 'Wood', icon: 'flower-2', description: 'Leaves shelter the body. Deals 120% damage and restores 18 health.', effect: '120% damage · heal 18', multiplier: 1.2, cost: 60, cooldown: 3 },
  { id: 'ember', name: 'Ninefold Ember', family: 'Fire art', element: 'Fire', icon: 'flame', description: 'A spark becomes a storm. Deals 240% attack damage.', effect: '240% damage', multiplier: 2.4, cost: 100, cooldown: 3 },
  { id: 'tide', name: 'Stillwater Palm', family: 'Water art', element: 'Water', icon: 'waves', description: 'Yield, then return. Deals 150% damage and halves the next enemy strike.', effect: '150% damage · guard', multiplier: 1.5, cost: 140, cooldown: 2 },
  { id: 'stone', name: 'Mountain Heart', family: 'Body art', element: 'Earth', icon: 'mountain', description: 'Unmoving as the sacred peaks. Deals 200% damage and restores 10 health.', effect: '200% damage · heal 10', multiplier: 2, cost: 180, cooldown: 3 },
  { id: 'thunder', name: 'Heaven’s Reproach', family: 'Lightning art', element: 'Lightning', icon: 'zap', description: 'Borrow a voice from the heavens. Deals 320% attack damage.', effect: '320% damage', multiplier: 3.2, cost: 260, cooldown: 4 },
] as const;
export const RECIPES = [
  { id: 'dew', name: 'Jade Dew Pill', description: 'Restores 45 health during an expedition.', herbs: 4, iron: 0, stones: 12, seconds: 12, icon: 'droplet' },
  { id: 'foundation', name: 'Foundation Pill', description: 'Required to enter the Foundation tribulation.', herbs: 12, iron: 2, stones: 30, seconds: 35, icon: 'sparkles' },
  { id: 'insight', name: 'Pill of Clear Insight', description: 'Grants 90 Qi, up to your current bottleneck.', herbs: 6, iron: 0, stones: 20, seconds: 20, icon: 'sun' },
] as const;
export const REGIONS = [
  { id: 'bamboo', name: 'Whispering Bamboo', label: 'THE MORTAL REALM', description: 'Follow an old path through the jade forest. Spirit beasts stir beneath the leaves.', difficulty: 'Gentle', recommended: 22, realm: 0, stages: 3, stones: 38, herbs: 5, iron: 1, icon: 'trees', color: 'jade', enemy: 'Cloudtail Fox', boss: 'Bamboo Guardian', hp: 56, attack: 7 },
  { id: 'ridge', name: 'Crimson Ridge', label: 'THE SCARLET HEIGHTS', description: 'Ancient forges sleep beneath the red cliffs. A fire spirit guards their embers.', difficulty: 'Challenging', recommended: 60, realm: 0, stages: 3, stones: 75, herbs: 3, iron: 5, icon: 'mountain-snow', color: 'copper', enemy: 'Ember Wolf', boss: 'Cinderhorn', hp: 105, attack: 12 },
  { id: 'ruins', name: 'Moonlit Ruins', label: 'THE FORGOTTEN DOMAIN', description: 'An abandoned immortal’s sanctuary holds the fragment of a lost Dao.', difficulty: 'Perilous', recommended: 125, realm: 1, stages: 4, stones: 160, herbs: 10, iron: 8, icon: 'moon-star', color: 'indigo', enemy: 'Moonshade Spirit', boss: 'Keeper of the Gate', hp: 190, attack: 20 },
] as const;
export const MILESTONES = [
  { id: 'first-step', name: 'The first step', description: 'Make your first breakthrough.', goal: 'breakthroughs', target: 1, stones: 40, herbs: 3 },
  { id: 'wilds', name: 'Beyond the mountain', description: 'Complete an expedition.', goal: 'expeditions', target: 1, stones: 60, herbs: 5 },
  { id: 'alchemist', name: 'A patient flame', description: 'Finish brewing any pill.', goal: 'crafted', target: 1, stones: 35, herbs: 4 },
] as const;
