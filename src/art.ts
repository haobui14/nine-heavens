export type Treasure = 'sword' | 'lotus' | 'ember' | 'tide' | 'stone' | 'thunder' | 'manual' | 'pill' | 'crystal';
export function treasure(key: Treasure, className = '') {
  return `<span class="treasure-art art-${key} ${className}" aria-hidden="true"></span>`;
}
export const skillArt: Record<string, Treasure> = { cloud: 'sword', lotus: 'lotus', ember: 'ember', tide: 'tide', stone: 'stone', thunder: 'thunder' };
export function beastArt(frame: number, className = '') {
  return `<span class="beast-art beast-frame-${frame} ${className}" aria-hidden="true"></span>`;
}
