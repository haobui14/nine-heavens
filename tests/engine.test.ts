import { describe, it, expect } from 'vitest';
import { newGame, advance, act, qiCap, MAX_OFFLINE, attack, type GameState } from '../src/game/engine';
import { exportSave, importSave } from '../src/game/save';
const NOW = 1_800_000_000_000;
const start = () => newGame(NOW);
const clone = (s: GameState) => importSave(exportSave(s));
describe('elapsed-time accounting', () => {
  it('grants identical work for one interval and many resume intervals', () => {
    const a = start(), b = start(); a.activity = b.activity = 'herbs';
    advance(a, NOW + 600_000);
    for (let i = 1; i <= 2400; i++) advance(b, NOW + i * 250);
    expect(a.herbs).toBe(b.herbs); expect(a.qi).toBeCloseTo(b.qi, 7); expect(a.stones).toBeCloseTo(b.stones, 7); expect(a.work).toBeCloseTo(b.work, 7);
  });
  it('cannot claim the same elapsed time twice, including after save/reload', () => {
    const a = start(); advance(a, NOW + 120_000); const b = clone(a);
    expect(advance(b, NOW + 120_000)).toMatchObject({ elapsed: 0, qi: 0, stones: 0, herbs: 0 }); expect(b).toEqual(a);
  });
  it('uses a high-water mark after a backwards device-clock change', () => {
    const a = start(); advance(a, NOW + 60_000); const stones = a.stones;
    advance(a, NOW - 60_000); expect(a.lastAt).toBe(NOW + 60_000);
    advance(a, NOW + 60_000); expect(a.stones).toBe(stones);
  });
  it('caps one absence at thirty days without allowing the remainder to be reclaimed', () => {
    const a = start(); a.activity = 'mine';
    const report = advance(a, NOW + 90 * 86400_000);
    expect(report.elapsed).toBe(MAX_OFFLINE); expect(report.iron).toBe(MAX_OFFLINE / 12);
    expect(advance(a, NOW + 90 * 86400_000).iron).toBe(0);
  });
  it('never spends campaign days or triggers breakthroughs while away', () => {
    const a = start(); advance(a, NOW + 30 * 86400_000);
    expect(a.qi).toBe(qiCap(a)); expect(a.realm).toBe(0); expect(a.stage).toBe(0); expect(a.campaignDay).toBe(1); expect(a.stats.breakthroughs).toBe(0);
  });
  it('keeps fractional work when the current assignment is selected again', () => {
    const a = start(); act(a, { type: 'activity', activity: 'herbs' }, NOW); advance(a, NOW + 5000);
    act(a, { type: 'activity', activity: 'herbs' }, NOW + 5000); advance(a, NOW + 6000); expect(a.herbs).toBe(9);
  });
  it('pauses an unfinished battle without simulating unattended losses', () => {
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW); const hp = a.battle!.hp;
    advance(a, NOW + 30 * 86400_000); expect(a.battle!.hp).toBe(hp); expect(a.battle!.turn).toBe(0);
  });
});
describe('crafting and resource transactions', () => {
  it('spends ingredients exactly once and finishes exactly one elixir', () => {
    const a = start(), herbs = a.herbs, stones = a.stones;
    expect(act(a, { type: 'craft', recipe: 'dew' }, NOW).ok).toBe(true); expect(a.herbs).toBe(herbs - 4); expect(a.stones).toBe(stones - 12);
    expect(act(a, { type: 'craft', recipe: 'dew' }, NOW).ok).toBe(false);
    advance(a, NOW + 12_000); expect(a.craft).toBe(null); expect(a.pills.dew).toBe(2); expect(a.stats.crafted).toBe(1);
    advance(a, NOW + 120_000); expect(a.pills.dew).toBe(2);
  });
  it('can resume a partially completed recipe without duplicating it', () => {
    const a = start(); act(a, { type: 'craft', recipe: 'dew' }, NOW); advance(a, NOW + 4_000); const b = clone(a); advance(b, NOW + 12_000); expect(b.pills.dew).toBe(2); expect(b.stats.crafted).toBe(1);
  });
  it('rejects insufficient ingredients without partially deducting resources', () => {
    const a = start(); a.herbs = 1; const before = clone(a); expect(act(a, { type: 'craft', recipe: 'foundation' }, NOW).ok).toBe(false); expect(a).toEqual(before);
  });
  it('awards a milestone only once', () => {
    const a = start(); a.stats.expeditions = 1; const stones = a.stones;
    expect(act(a, { type: 'claim', id: 'wilds' }, NOW).ok).toBe(true); expect(a.stones).toBe(stones + 60);
    expect(act(a, { type: 'claim', id: 'wilds' }, NOW).ok).toBe(false); expect(a.stones).toBe(stones + 60);
  });
  it('raises every technique’s base attack through weapon refinement', () => {
    const a = start(); const before = attack(a); expect(act(a, { type: 'upgrade', target: 'weapon' }, NOW).ok).toBe(true); expect(attack(a)).toBe(before + 5); expect(a.iron).toBe(1);
  });
});
describe('progression and combat', () => {
  it('requires a filled Qi reserve and player approval to break through', () => {
    const a = start(); expect(act(a, { type: 'breakthrough' }, NOW).ok).toBe(false); a.qi = qiCap(a); expect(act(a, { type: 'breakthrough' }, NOW).ok).toBe(true); expect(a.stage).toBe(1); expect(a.qi).toBe(0);
  });
  it('requires a pill for a major breakthrough and refunds it on withdrawal', () => {
    const a = start(); a.stage = 2; a.qi = qiCap(a);
    expect(act(a, { type: 'breakthrough' }, NOW).ok).toBe(false); a.pills.foundation = 1;
    expect(act(a, { type: 'breakthrough' }, NOW).ok).toBe(true); expect(a.pills.foundation).toBe(0); expect(a.realm).toBe(0);
    act(a, { type: 'retreat' }, NOW); expect(a.pills.foundation).toBe(1); expect(a.qi).toBe(qiCap(a));
  });
  it('has a reachable first expedition with the starter build', () => {
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW);
    let turns = 0;
    while (a.battle && turns++ < 100) act(a, { type: 'fight', move: a.battle.cooldowns.cloud > 0 ? 'basic' : 'cloud' }, NOW);
    expect(a.stats.expeditions).toBe(1); expect(a.stats.victories).toBe(3); expect(a.campaignDay).toBe(2); expect(a.battle).toBe(null);
  });
  it('allows a prepared cultivator to complete a major-realm tribulation', () => {
    const a = start(); a.stage = 2; a.qi = qiCap(a); a.weapon = 3; a.pills.foundation = 1;
    a.skills = ['cloud', 'lotus', 'ember']; a.equipped = [...a.skills];
    act(a, { type: 'breakthrough' }, NOW); let turns = 0;
    while (a.battle && turns++ < 100) act(a, { type: 'fight', move: a.equipped.find(id => !a.battle!.cooldowns[id]) || 'basic' }, NOW);
    expect(a.realm).toBe(1); expect(a.stage).toBe(0); expect(a.pills.foundation).toBe(0); expect(a.stats.breakthroughs).toBe(1);
  });
  it('makes seeded battles reproducible across a save and reload', () => {
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW); act(a, { type: 'fight', move: 'cloud' }, NOW); const b = clone(a);
    act(a, { type: 'fight', move: 'basic' }, NOW); act(b, { type: 'fight', move: 'basic' }, NOW); expect(a).toEqual(b);
  });
  it('cannot use an unlearned technique or bypass its cooldown', () => {
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW);
    expect(act(a, { type: 'fight', move: 'ember' }, NOW).ok).toBe(false); expect(a.battle!.turn).toBe(0);
    act(a, { type: 'fight', move: 'cloud' }, NOW); const turn = a.battle!.turn;
    expect(act(a, { type: 'fight', move: 'cloud' }, NOW).ok).toBe(false); expect(a.battle!.turn).toBe(turn);
  });
  it('does not permit a locked region or sect invitation before its prerequisite', () => {
    const a = start(); expect(act(a, { type: 'venture', region: 'ruins' }, NOW).ok).toBe(false); expect(act(a, { type: 'sect' }, NOW).ok).toBe(false);
    a.stats.expeditions = 1; expect(act(a, { type: 'sect' }, NOW).ok).toBe(true);
  });
  it('prevents changes to combat power while an encounter is active', () => {
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW);
    expect(act(a, { type: 'upgrade', target: 'weapon' }, NOW).ok).toBe(false); expect(act(a, { type: 'learn', skill: 'lotus' }, NOW).ok).toBe(false);
  });
  it('preserves all belongings on defeat', () => {
    const a = start(); act(a, { type: 'venture', region: 'ridge' }, NOW); a.battle!.hp = 1; const stones = a.stones;
    act(a, { type: 'fight', move: 'basic' }, NOW); expect(a.battle).toBe(null); expect(a.stones).toBe(stones); expect(a.weapon).toBe(0);
  });
});
describe('save integrity', () => {
  it('round-trips a full starter save', () => expect(importSave(exportSave(start()))).toEqual(start()));
  it('detects a truncated or corrupted save', () => {
    expect(() => importSave(exportSave(start()).slice(0, -5))).toThrow();
    const save = JSON.parse(exportSave(start())); save.payload = save.payload.replace('Wanderer', 'Imposter'); expect(() => importSave(JSON.stringify(save))).toThrow(/checksum/);
  });
  it('rejects invalid progression even if an envelope has a matching checksum', () => {
    const a = start(); a.realm = -1; expect(() => importSave(exportSave(a))).toThrow();
  });
  it('rejects future versions and invalid combat data', () => {
    const save = JSON.parse(exportSave(start())); save.schema = 99; expect(() => importSave(JSON.stringify(save))).toThrow(/supported/);
    const a = start(); act(a, { type: 'venture', region: 'bamboo' }, NOW); a.battle!.hp = -10; expect(() => importSave(exportSave(a))).toThrow(/expedition/);
  });
});
