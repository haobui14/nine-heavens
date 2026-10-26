import { REALMS, SKILLS, REGIONS, RECIPES, MILESTONES, type Activity } from './content';

export interface JournalEntry { id: number; title: string; text: string; kind: 'journey' | 'cultivation' | 'battle' | 'craft'; }
export interface Battle { region: string; wave: number; enemyHp: number; enemyMaxHp: number; hp: number; maxHp: number; turn: number; cooldowns: Record<string, number>; isTrial: boolean; auto: boolean; lastAction: string; }
export interface GameState {
  version: 1; name: string; realm: number; stage: number; qi: number; stones: number; herbs: number; iron: number;
  pills: Record<string, number>; activity: Activity; work: number; lastAt: number; lastFocus: number; seed: number;
  weapon: number; abode: number; skills: string[]; equipped: string[]; pet: boolean; sect: boolean;
  craft: { recipe: string; remaining: number } | null; battle: Battle | null;
  stats: { breakthroughs: number; expeditions: number; victories: number; crafted: number };
  claimed: string[]; journal: JournalEntry[]; nextLog: number;
  settings: { sound: boolean; reducedMotion: boolean; autoBattle: boolean }; campaignDay: number;
}
export type Action =
  | { type: 'focus' } | { type: 'breakthrough' } | { type: 'activity'; activity: Activity }
  | { type: 'craft'; recipe: string } | { type: 'learn'; skill: string } | { type: 'equip'; skill: string }
  | { type: 'upgrade'; target: 'weapon' | 'abode' } | { type: 'venture'; region: string }
  | { type: 'fight'; move: string } | { type: 'retreat' } | { type: 'auto'; value: boolean }
  | { type: 'pill'; pill: string } | { type: 'claim'; id: string } | { type: 'sect' } | { type: 'pet' }
  | { type: 'name'; name: string } | { type: 'setting'; key: 'sound' | 'reducedMotion'; value: boolean };
export interface Outcome { ok: boolean; message: string; kind?: 'win' | 'loss' | 'hit' | 'ascend'; }
export interface OfflineReport { elapsed: number; qi: number; stones: number; herbs: number; iron: number; crafted: number; }
export const MAX_OFFLINE = 30 * 24 * 60 * 60;
export const qiCap = (s: GameState) => REALMS[s.realm].baseQi * (1 + s.stage * 0.8);
export const qiRate = (s: GameState) => (1.8 + s.realm * 1.4) * (1 + s.abode * 0.2) * (s.sect ? 1.15 : 1) * (s.activity === 'cultivate' ? 1 : 0.2);
export const attack = (s: GameState) => Math.round(12 + s.stage * 4 + s.realm * 15 + s.weapon * 5 + (s.pet ? 3 : 0));
export const health = (s: GameState) => 100 + s.stage * 20 + s.realm * 55;
export const power = (s: GameState) => attack(s) * 2 + s.realm * 15 + s.skills.length * 3 + (s.pet ? 8 : 0);
export const weaponCost = (s: GameState) => ({ stones: 45 * (s.weapon + 1), iron: 3 * (s.weapon + 1) });
export const abodeCost = (s: GameState) => ({ stones: 65 * (s.abode + 1), herbs: 5 * (s.abode + 1) });
const ok = (message: string, kind?: Outcome['kind']): Outcome => ({ ok: true, message, kind });
const no = (message: string): Outcome => ({ ok: false, message });
export function log(s: GameState, title: string, text: string, kind: JournalEntry['kind'] = 'journey') {
  s.journal.unshift({ id: s.nextLog++, title, text, kind }); s.journal = s.journal.slice(0, 60);
}
export function newGame(now = Date.now()): GameState {
  const s: GameState = {
    version: 1, name: 'Wanderer', realm: 0, stage: 0, qi: 28, stones: 120, herbs: 8, iron: 4,
    pills: { dew: 1, foundation: 0, insight: 0 }, activity: 'cultivate', work: 0,
    lastAt: now, lastFocus: 0, seed: 19260817, weapon: 0, abode: 0,
    skills: ['cloud'], equipped: ['cloud'], pet: false, sect: false, craft: null, battle: null,
    stats: { breakthroughs: 0, expeditions: 0, victories: 0, crafted: 0 }, claimed: [], nextLog: 1,
    journal: [], settings: { sound: false, reducedMotion: false, autoBattle: true }, campaignDay: 1,
  };
  log(s, 'A thousand paths. One first step.', 'You arrive at Jade Peak with a weathered sword and a letter from the Azure Cloud Sect. The mountain is quiet. Your story is unwritten.');
  log(s, 'The first breath', 'A Wood spirit root awakens within you. Begin cultivating, or follow the path into the bamboo forest.', 'cultivation');
  return s;
}
export function advance(s: GameState, now: number): OfflineReport {
  // A backwards clock does not move the high-water mark or create duplicate elapsed time.
  const elapsed = Math.min(MAX_OFFLINE, Math.max(0, (now - s.lastAt) / 1000));
  const before = { qi: s.qi, stones: s.stones, herbs: s.herbs, iron: s.iron, crafted: s.stats.crafted };
  if (now > s.lastAt) s.lastAt = now;
  if (s.battle) return { elapsed, qi: 0, stones: 0, herbs: 0, iron: 0, crafted: 0 };
  s.qi = Math.min(qiCap(s), s.qi + elapsed * qiRate(s));
  s.stones += elapsed * 0.06;
  if (s.activity !== 'cultivate') {
    s.work += elapsed;
    const seconds = s.activity === 'herbs' ? 6 : 12;
    const amount = Math.floor((s.work + 1e-8) / seconds);
    s.work = Math.max(0, s.work - amount * seconds);
    if (s.activity === 'herbs') s.herbs += amount; else s.iron += amount;
  }
  if (s.craft) {
    s.craft.remaining -= elapsed;
    if (s.craft.remaining <= 0) {
      const recipe = RECIPES.find(r => r.id === s.craft!.recipe)!;
      s.pills[recipe.id] = (s.pills[recipe.id] || 0) + 1; s.stats.crafted++;
      log(s, 'A patient flame', `${recipe.name} is ready. The furnace cools as a last thread of incense rises.`, 'craft');
      s.craft = null;
    }
  }
  return { elapsed, qi: s.qi - before.qi, stones: s.stones - before.stones, herbs: s.herbs - before.herbs, iron: s.iron - before.iron, crafted: s.stats.crafted - before.crafted };
}
function rng(s: GameState): number {
  let x = s.seed | 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; s.seed = x >>> 0; return s.seed / 4294967296;
}
export function enemy(s: GameState) {
  const b = s.battle!;
  if (b.isTrial) return { name: b.wave === 2 ? 'Heavenly Thunder' : 'Heart Demon', attack: 10 + b.wave * 3, boss: b.wave === 2 };
  const r = REGIONS.find(r => r.id === b.region)!;
  return { name: b.wave === r.stages - 1 ? r.boss : r.enemy, attack: r.attack + b.wave * 2, boss: b.wave === r.stages - 1 };
}
function setWave(s: GameState) {
  const b = s.battle!;
  const r = REGIONS.find(r => r.id === b.region);
  b.enemyMaxHp = b.isTrial ? 70 + b.wave * 30 : Math.round(r!.hp * (b.wave === r!.stages - 1 ? 1.55 : 1 + b.wave * 0.18));
  b.enemyHp = b.enemyMaxHp;
}
function ascend(s: GameState) {
  s.qi = 0; s.stage++;
  if (s.stage >= 3) { s.stage = 0; s.realm++; }
  s.stats.breakthroughs++;
  log(s, 'Beyond the bottleneck', `You reach ${REALMS[s.realm].name}, ${['early', 'middle', 'late'][s.stage]} stage. The world feels a little wider.`, 'cultivation');
}
export function act(s: GameState, action: Action, now = Date.now()): Outcome {
  advance(s, now);
  if (s.battle && !['fight', 'retreat', 'auto', 'pill', 'setting', 'name'].includes(action.type)) return no('Finish your expedition or return to the sanctuary first.');
  switch (action.type) {
    case 'focus': {
      if (now - s.lastFocus < 12000) return no('Let your breath settle before focusing again.');
      if (s.qi >= qiCap(s)) return no('Your Qi is full. Prepare your breakthrough.');
      s.lastFocus = now; s.qi = Math.min(qiCap(s), s.qi + 18 + s.realm * 10); return ok('Your breath steadies. Spiritual energy gathers.');
    }
    case 'activity':
      if (!['cultivate', 'herbs', 'mine'].includes(action.activity)) return no('Unknown assignment.');
      if (s.activity === action.activity) return no('This is already your active assignment.');
      s.activity = action.activity; s.work = 0; return ok(action.activity === 'cultivate' ? 'You settle into meditation.' : 'Your new assignment will continue while you are away.');
    case 'breakthrough': {
      if (s.qi + 1e-6 < qiCap(s)) return no('Gather more Qi before attempting a breakthrough.');
      if (s.stage === 2) {
        if (s.realm >= REALMS.length - 1) return no('You have reached the edge of this first chapter. More heavens await in a future build.');
        if (!(s.pills.foundation > 0)) return no('Brew a Foundation Pill in the alchemy pavilion first.');
        s.pills.foundation--; s.battle = { region: 'trial', wave: 0, hp: health(s), maxHp: health(s), enemyHp: 0, enemyMaxHp: 0, turn: 0, cooldowns: {}, isTrial: true, auto: false, lastAction: 'The heavens answer your challenge.' }; setWave(s);
        return ok('Your tribulation begins. Face your heart demons, then the heavenly thunder.');
      }
      ascend(s); return ok('Breakthrough! A new stage of cultivation opens before you.', 'ascend');
    }
    case 'craft': {
      if (s.craft) return no('Your furnace is already at work.');
      const r = RECIPES.find(r => r.id === action.recipe);
      if (!r) return no('Unknown recipe.');
      if (s.herbs < r.herbs || s.iron < r.iron || s.stones < r.stones) return no('You need more ingredients for this recipe.');
      s.herbs -= r.herbs; s.iron -= r.iron; s.stones -= r.stones; s.craft = { recipe: r.id, remaining: r.seconds };
      return ok(`Brewing ${r.name}. The furnace will work while you are away.`);
    }
    case 'learn': {
      const skill = SKILLS.find(k => k.id === action.skill);
      if (!skill || s.skills.includes(skill.id)) return no('You already understand this technique.');
      if (s.stones < skill.cost) return no('Not enough spirit stones.');
      s.stones -= skill.cost; s.skills.push(skill.id); if (s.equipped.length < 3) s.equipped.push(skill.id);
      log(s, 'A new understanding', `You comprehend ${skill.name}. Practice gives shape to the Dao.`, 'cultivation');
      return ok(`${skill.name} learned${s.equipped.includes(skill.id) ? ' and equipped' : ''}.`);
    }
    case 'equip':
      if (!s.skills.includes(action.skill)) return no('Learn this technique first.');
      if (s.equipped.includes(action.skill)) {
        if (s.equipped.length === 1) return no('Keep at least one technique equipped.');
        s.equipped = s.equipped.filter(id => id !== action.skill); return ok('Technique returned to your library.');
      }
      if (s.equipped.length >= 3) return no('Three techniques are equipped. Remove one to make room.');
      s.equipped.push(action.skill); return ok('Technique equipped.');
    case 'upgrade': {
      if (action.target === 'weapon') {
        if (s.weapon >= 8) return no('Your sword is fully refined for this chapter.');
        const c = weaponCost(s); if (s.stones < c.stones || s.iron < c.iron) return no('Gather more spirit stones and cloud iron.');
        s.stones -= c.stones; s.iron -= c.iron; s.weapon++; return ok(`Cloudveil Sword refined to +${s.weapon}.`);
      }
      if (s.abode >= 5) return no('Your abode has reached its present potential.');
      const c = abodeCost(s); if (s.stones < c.stones || s.herbs < c.herbs) return no('Gather more spirit stones and herbs.');
      s.stones -= c.stones; s.herbs -= c.herbs; s.abode++; return ok('Spirit-gathering array improved. Cultivation is faster.');
    }
    case 'venture': {
      const r = REGIONS.find(r => r.id === action.region);
      if (!r || s.realm < r.realm) return no('Reach Foundation Establishment to enter these ruins.');
      s.battle = { region: r.id, wave: 0, enemyHp: 0, enemyMaxHp: 0, hp: health(s), maxHp: health(s), turn: 0, cooldowns: {}, isTrial: false, auto: s.settings.autoBattle, lastAction: 'The path opens before you.' }; setWave(s);
      return ok(`You enter ${r.name}.`);
    }
    case 'fight': {
      const b = s.battle; if (!b) return no('There is no enemy before you.');
      const skill = SKILLS.find(k => k.id === action.move);
      if (skill && (!s.equipped.includes(skill.id) || (b.cooldowns[skill.id] || 0) > 0)) return no('That technique is not ready.');
      if (!skill && !['basic', 'guard'].includes(action.move)) return no('Unknown combat action.');
      const foe = enemy(s); b.turn++;
      for (const key in b.cooldowns) b.cooldowns[key] = Math.max(0, b.cooldowns[key] - 1);
      let damage = Math.round(attack(s) * (skill?.multiplier || (action.move === 'guard' ? 0.45 : 1)) * (0.92 + rng(s) * 0.16));
      const critical = rng(s) < 0.12; if (critical) damage = Math.round(damage * 1.5);
      b.enemyHp = Math.max(0, b.enemyHp - damage);
      if (skill) b.cooldowns[skill.id] = skill.cooldown;
      if (action.move === 'lotus') b.hp = Math.min(b.maxHp, b.hp + 18);
      if (action.move === 'stone') b.hp = Math.min(b.maxHp, b.hp + 10);
      b.lastAction = `${skill?.name || (action.move === 'guard' ? 'Guarded strike' : 'Sword strike')} · ${damage}${critical ? ' critical' : ''} damage`;
      if (b.enemyHp <= 0) {
        s.stats.victories++; const total = b.isTrial ? 3 : REGIONS.find(r => r.id === b.region)!.stages;
        if (b.wave + 1 >= total) {
          if (b.isTrial) { s.battle = null; ascend(s); return ok('Tribulation overcome. Your foundation is established!', 'ascend'); }
          const r = REGIONS.find(r => r.id === b.region)!;
          s.stones += r.stones; s.herbs += r.herbs; s.iron += r.iron; s.stats.expeditions++; s.campaignDay++; s.battle = null;
          log(s, `${r.name}: path cleared`, `You return with ${r.stones} spirit stones, ${r.herbs} spirit herbs and ${r.iron} cloud iron.`, 'battle');
          return ok(`Expedition complete! +${r.stones} stones · +${r.herbs} herbs · +${r.iron} iron`, 'win');
        }
        b.wave++; setWave(s); b.hp = Math.min(b.maxHp, b.hp + 12); b.cooldowns = {}; b.lastAction = `${foe.name} defeated. A new presence approaches.`;
        return ok(b.lastAction, 'hit');
      }
      const incoming = Math.max(1, Math.round(foe.attack * (0.9 + rng(s) * 0.2) * (['guard', 'tide'].includes(action.move) ? 0.5 : 1)));
      b.hp = Math.max(0, b.hp - incoming);
      if (b.hp <= 0) {
        const trial = b.isTrial; s.battle = null;
        if (trial) s.pills.foundation++; // Failed trials preserve the preparation item; retry after improving the build.
        log(s, 'Live to walk another path', 'You withdraw to Jade Peak. Your possessions are safe. Refine your sword, learn an art, and try again.', 'battle');
        return ok('You return safely to Jade Peak. Improve your build and try again.', 'loss');
      }
      return ok(b.lastAction, 'hit');
    }
    case 'retreat':
      if (!s.battle) return no('You are already at the sanctuary.');
      if (s.battle.isTrial) s.pills.foundation++;
      s.battle = null; return ok('You return to Jade Peak. There is wisdom in knowing when to rest.');
    case 'auto':
      s.settings.autoBattle = action.value; if (s.battle) s.battle.auto = action.value; return ok(action.value ? 'Your techniques flow automatically.' : 'You take control of the battle.');
    case 'pill': {
      if (!(s.pills[action.pill] > 0)) return no('You do not have that pill.');
      if (action.pill === 'dew') {
        if (!s.battle) return no('Use Jade Dew during an expedition to restore health.');
        if (s.battle.hp >= s.battle.maxHp) return no('Your health is already full.');
        s.pills.dew--; s.battle.hp = Math.min(s.battle.maxHp, s.battle.hp + 45); return ok('Jade Dew restores 45 health.');
      }
      if (action.pill === 'insight') {
        if (s.battle) return no('Return to the sanctuary before using an insight pill.');
        if (s.qi >= qiCap(s)) return no('Your Qi is full.');
        s.pills.insight--; s.qi = Math.min(qiCap(s), s.qi + 90); return ok('Your thoughts clear. +90 Qi.');
      }
      return no('Foundation Pills are used when beginning a major tribulation.');
    }
    case 'claim': {
      const m = MILESTONES.find(m => m.id === action.id);
      if (!m || s.claimed.includes(m.id) || s.stats[m.goal] < m.target) return no('Complete this milestone first.');
      s.claimed.push(m.id); s.stones += m.stones; s.herbs += m.herbs; return ok(`Milestone rewarded: +${m.stones} stones and +${m.herbs} herbs.`);
    }
    case 'sect':
      if (s.sect) return no('You are already a disciple of Azure Cloud.');
      if (s.stats.expeditions < 1) return no('Complete an expedition to prove your resolve.');
      s.sect = true; log(s, 'A place among the clouds', 'Elder Yun accepts you as an outer disciple of the Azure Cloud Sect. Your cultivation rate increases by 15%.'); return ok('Welcome to Azure Cloud. Your path is no longer a lonely one.');
    case 'pet':
      if (s.pet) return no('Little Cloud is already by your side.');
      if (s.herbs < 10 || s.stones < 60) return no('Bring 10 spirit herbs and 60 spirit stones to befriend Little Cloud.');
      s.herbs -= 10; s.stones -= 60; s.pet = true; log(s, 'A small companion', 'The cloud fox accepts your offering and follows you home. Little Cloud adds 3 attack to your adventures.'); return ok('Little Cloud joins your journey. +3 attack.');
    case 'name': {
      const name = action.name.trim().slice(0, 24); if (!name) return no('Choose a name for your journey.'); s.name = name; return ok('A new name, an unwritten destiny.');
    }
    case 'setting': s.settings[action.key] = action.value; return ok('Preference saved.');
  }
}
