import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { newGame, qiCap, type GameState } from './engine';
import { SKILLS, REGIONS, RECIPES } from './content';

interface Envelope { format: 'nine-heavens'; schema: 1; checksum: string; payload: string; }
interface SavePair { primary?: string; backup?: string; }
const KEY = 'nine-heavens-save-v1';
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16); };
const num = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const int = (v: unknown, min: number, max: number): v is number => num(v, min, max) && Number.isInteger(v);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function exportSave(state: GameState): string {
  const payload = JSON.stringify(state);
  return JSON.stringify({ format: 'nine-heavens', schema: 1, checksum: hash(payload), payload } satisfies Envelope, null, 2);
}
export function importSave(text: string): GameState {
  if (text.length > 300_000) throw new Error('This save file is too large.');
  const envelope = JSON.parse(text) as Envelope;
  if (envelope.format !== 'nine-heavens' || envelope.schema !== 1 || typeof envelope.payload !== 'string') throw new Error('This is not a supported Nine Heavens save.');
  if (hash(envelope.payload) !== envelope.checksum) throw new Error('The save checksum does not match. Your current journey has been kept.');
  const raw: unknown = JSON.parse(envelope.payload);
  if (!obj(raw) || raw.version !== 1) throw new Error('Unsupported save version.');
  const s = raw as unknown as GameState;
  if (typeof s.name !== 'string' || !s.name.trim() || s.name.length > 24 || !int(s.realm, 0, 2) || !int(s.stage, 0, 2)) throw new Error('The cultivator data is invalid.');
  for (const key of ['stones', 'herbs', 'iron', 'qi', 'work', 'lastAt', 'lastFocus'] as const) if (!num(s[key], 0, 1e16)) throw new Error(`Invalid ${key} value.`);
  if (s.qi > qiCap(s) + 1e-6 || !int(s.weapon, 0, 8) || !int(s.abode, 0, 5) || !int(s.seed, 1, 4294967295) || !int(s.campaignDay, 1, 1e9)) throw new Error('The progression data is invalid.');
  if (!['cultivate', 'herbs', 'mine'].includes(s.activity) || typeof s.pet !== 'boolean' || typeof s.sect !== 'boolean') throw new Error('The assignment data is invalid.');
  if (!Array.isArray(s.skills) || s.skills.length > SKILLS.length || new Set(s.skills).size !== s.skills.length || s.skills.some(id => !SKILLS.some(k => k.id === id))) throw new Error('Invalid technique library.');
  if (!Array.isArray(s.equipped) || s.equipped.length < 1 || s.equipped.length > 3 || new Set(s.equipped).size !== s.equipped.length || s.equipped.some(id => !s.skills.includes(id))) throw new Error('Invalid technique loadout.');
  if (!obj(s.pills) || RECIPES.some(r => !int(s.pills[r.id], 0, 1e9))) throw new Error('Invalid pills.');
  if (!obj(s.stats) || ['breakthroughs', 'expeditions', 'victories', 'crafted'].some(k => !int(s.stats[k as keyof typeof s.stats], 0, 1e9))) throw new Error('Invalid journey statistics.');
  if (!obj(s.settings) || ['sound', 'reducedMotion', 'autoBattle'].some(k => typeof s.settings[k as keyof typeof s.settings] !== 'boolean')) throw new Error('Invalid settings.');
  if (!Array.isArray(s.claimed) || s.claimed.length > 3 || s.claimed.some(k => !['first-step', 'wilds', 'alchemist'].includes(k)) || new Set(s.claimed).size !== s.claimed.length) throw new Error('Invalid milestones.');
  if (!Array.isArray(s.journal) || s.journal.length > 60 || !int(s.nextLog, 1, 1e12) || s.journal.some(e => !obj(e) || !int(e.id, 1, 1e12) || typeof e.title !== 'string' || e.title.length > 200 || typeof e.text !== 'string' || e.text.length > 2000 || !['journey', 'cultivation', 'battle', 'craft'].includes(e.kind))) throw new Error('Invalid journal.');
  if (s.craft !== null && (!obj(s.craft) || !RECIPES.some(r => r.id === s.craft!.recipe) || !num(s.craft.remaining, 0, 100))) throw new Error('Invalid crafting queue.');
  if (s.battle !== null) {
    const b = s.battle;
    if (!obj(b) || typeof b.isTrial !== 'boolean' || typeof b.auto !== 'boolean' || typeof b.lastAction !== 'string' || b.lastAction.length > 500 || !int(b.wave, 0, 3) || !int(b.turn, 0, 1e9) || !num(b.hp, 1, 1e6) || !num(b.maxHp, b.hp, 1e6) || !num(b.enemyHp, 1, 1e6) || !num(b.enemyMaxHp, b.enemyHp, 1e6) || !obj(b.cooldowns) || Object.entries(b.cooldowns).some(([k, v]) => !SKILLS.some(a => a.id === k) || !int(v, 0, 10)) || (b.isTrial ? b.region !== 'trial' || b.wave > 2 : !REGIONS.some(r => r.id === b.region && b.wave < r.stages))) throw new Error('Invalid expedition state.');
  }
  // Copy only the established shape; drop unexpected top-level keys from imported files.
  const clean = newGame(s.lastAt);
  for (const key of Object.keys(clean) as (keyof GameState)[]) (clean as unknown as Record<string, unknown>)[key] = s[key];
  return clean;
}
let database: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  return database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('nine-heavens', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('saves');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => reject(new Error('Close another outdated game tab to open your save.'));
  });
}
async function readPair(): Promise<SavePair> {
  if (Capacitor.isNativePlatform()) return JSON.parse((await Preferences.get({ key: KEY })).value || '{}');
  // If an earlier write fell back after an IndexedDB error, that copy is the newest one.
  try { const fallback = localStorage.getItem(KEY); if (fallback) return JSON.parse(fallback); } catch { /* IndexedDB may still be available. */ }
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const t = d.transaction('saves', 'readonly'); const r = t.objectStore('saves').get(KEY);
      r.onsuccess = () => resolve(r.result || {}); r.onerror = () => reject(r.error);
    });
  } catch { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
}
async function writePair(pair: SavePair): Promise<void> {
  if (Capacitor.isNativePlatform()) { await Preferences.set({ key: KEY, value: JSON.stringify(pair) }); return; }
  try {
    const d = await db();
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction('saves', 'readwrite'); t.objectStore('saves').put(pair, KEY);
      t.oncomplete = () => resolve(); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
    });
    try { localStorage.removeItem(KEY); } catch { /* A committed IndexedDB record is sufficient. */ }
  } catch { localStorage.setItem(KEY, JSON.stringify(pair)); }
}
let chain = Promise.resolve();
export function saveGame(s: GameState): Promise<void> {
  const payload = exportSave(s);
  const task = chain.catch(() => undefined).then(async () => {
    const pair = await readPair();
    let backup = pair.backup;
    try { if (pair.primary) { importSave(pair.primary); backup = pair.primary; } } catch { /* Keep the last known-good backup. */ }
    await writePair({ primary: payload, backup });
  });
  chain = task; return task;
}
export async function loadGame(): Promise<{ state: GameState; message?: string }> {
  let pair: SavePair;
  try { pair = await readPair(); } catch { return { state: newGame(), message: 'Device storage is unavailable. Export your save before closing.' }; }
  for (const key of ['primary', 'backup'] as const) {
    if (!pair[key]) continue;
    try { return { state: importSave(pair[key]), message: key === 'backup' ? 'Your previous healthy save was restored.' : undefined }; } catch { /* Try the backup without overwriting either copy. */ }
  }
  if (pair.primary || pair.backup) throw new Error('Your local saves could not be read. They have been preserved. Restore an exported save to continue.');
  return { state: newGame() };
}
