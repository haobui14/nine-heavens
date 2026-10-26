import { gameIcon } from './icons';
export type Treasure = 'sword' | 'lotus' | 'ember' | 'tide' | 'stone' | 'thunder' | 'manual' | 'pill' | 'crystal' | 'fox' | 'furnace' | 'recovery' | 'foundation' | 'insight';
export function treasure(key: Treasure, className = '') {
  return `<span class="treasure-art art-${key} ${className}" aria-hidden="true">${gameIcon(key)}</span>`;
}
export const pillArt = (id: string): Treasure => id === 'dew' ? 'recovery' : id === 'foundation' ? 'foundation' : 'insight';
export const skillArt: Record<string, Treasure> = { cloud: 'sword', lotus: 'lotus', ember: 'ember', tide: 'tide', stone: 'stone', thunder: 'thunder' };
export function beastArt(frame: number, className = '') {
  return `<span class="beast-art beast-frame-${frame} ${className}" aria-hidden="true"></span>`;
}
