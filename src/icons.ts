type Sheet = 'foundations' | 'treasures' | 'activities';
type Sprite = readonly [Sheet, number];
const sprites: Record<string, Sprite> = {
  sanctuary:['foundations',0], sunrise:['foundations',0], map:['foundations',1],
  'scroll-text':['foundations',2], manual:['foundations',2], backpack:['foundations',3], package:['foundations',3],
  house:['foundations',4], 'flask-conical':['foundations',5], furnace:['foundations',5], flag:['foundations',6], cloud:['foundations',6],
  'book-open':['foundations',7], 'settings-2':['foundations',8], orbit:['foundations',9], 'circle-dot':['foundations',9],
  gem:['foundations',10], crystal:['foundations',10], sprout:['foundations',11], leaf:['foundations',11],
  hexagon:['foundations',12], ore:['foundations',12], wind:['foundations',13], heart:['foundations',14], swords:['foundations',15],
  sword:['treasures',0], shirt:['treasures',1], crown:['treasures',2], ring:['treasures',3], talisman:['treasures',4],
  pill:['treasures',5], droplet:['treasures',6], droplets:['treasures',6], recovery:['treasures',6], foundation:['treasures',7],
  formation:['treasures',8], 'flower-2':['treasures',9], lotus:['treasures',9], flame:['treasures',10], ember:['treasures',10],
  waves:['treasures',11], tide:['treasures',11], mountain:['treasures',12], stone:['treasures',12],
  zap:['treasures',13], thunder:['treasures',13], 'paw-print':['treasures',14], fox:['treasures',14], insight:['treasures',15],
  trees:['activities',0], 'mountain-snow':['activities',1], 'moon-star':['activities',2],
  shield:['activities',3], 'shield-check':['activities',3], gate:['activities',4], gift:['activities',5], trophy:['activities',5],
  hammer:['activities',6], pickaxe:['activities',7], focus:['activities',8], lightbulb:['activities',8],
  friendship:['activities',9], 'volume-2':['activities',10], feather:['activities',11], pencil:['activities',11],
  compass:['activities',12], 'clock-3':['activities',13], 'lock-keyhole':['activities',14],
  sparkles:['activities',15], sparkle:['activities',15], sun:['activities',15],
};
const arrow = 'M4 13H20L15 8L19 4L31 16L19 28L15 24L20 19H4Z';
const check = 'M4 16L9 11L14 17L24 5L29 10L14 28Z';
const utilities: Record<string, string> = {
  'map-pin':'<path d="M16 1C8 1 3 6 3 13C3 22 16 32 16 32S29 22 29 13C29 6 24 1 16 1Z"/><circle cx="16" cy="13" r="6" fill="#e9d299"/><circle cx="16" cy="13" r="3" fill="#345b42"/>',
  'arrow-right': `<path d="${arrow}"/>`,
  'arrow-left': `<path d="${arrow}" transform="rotate(180 16 16)"/>`,
  'arrow-up': `<path d="${arrow}" transform="rotate(-90 16 16)"/>`,
  'arrow-down': `<path d="${arrow}" transform="rotate(90 16 16)"/>`,
  'arrow-up-right': `<path d="${arrow}" transform="rotate(-45 16 16) scale(.82) translate(3.5 3.5)"/>`,
  'chevron-right':'<path d="M10 4L23 16L10 28L5 23L14 16L5 9Z"/>',
  'corner-up-left':'<path d="M14 4L2 14L14 25V18H20Q25 18 25 27H30Q30 12 20 12H14Z"/>',
  x:'<path d="M8 3L16 11L24 3L29 8L21 16L29 24L24 29L16 21L8 29L3 24L11 16L3 8Z"/>',
  plus:'<path d="M13 3H19V13H29V19H19V29H13V19H3V13H13Z"/>',
  menu:'<path d="M3 5H29L26 10H3ZM3 14H26L29 19H3ZM3 23H29L26 28H3Z"/><path d="M5 6H23V7H5ZM5 15H22V16H5ZM5 24H23V25H5Z" fill="#f1dca1" opacity=".65"/>',
  ellipsis:'<circle cx="6" cy="16" r="3.3"/><circle cx="16" cy="16" r="3.3"/><circle cx="26" cy="16" r="3.3"/>',
  play:'<path d="M8 3L30 16L8 29Z"/><path d="M11 8L23 16L11 23Z" fill="#f1dca1" opacity=".65"/>',
  pause:'<path d="M6 4H13V28H6ZM19 4H26V28H19Z"/>',
  check:`<path d="${check}"/>`,
  download:'<path d="M13 2H19V15L24 10L28 14L16 26L4 14L8 10L13 15Z"/><path d="M3 24H7V28H25V24H29V32H3Z"/>',
  upload:'<path d="M13 25H19V12L24 17L28 13L16 1L4 13L8 17L13 12Z"/><path d="M3 24H7V28H25V24H29V32H3Z"/>',
  expand:'<path d="M2 12V2H12V6H6V12ZM20 2H30V12H26V6H20ZM30 20V30H20V26H26V20ZM12 30H2V20H6V26H12Z"/>',
  'circle-check':`<path d="M16 1L21 5L27 5L28 12L32 16L28 21L27 27L21 28L16 32L11 28L5 27L4 21L0 16L4 11L5 5L11 4Z" fill="#ad8d4d"/><circle cx="16" cy="16" r="11.5" fill="#3c6849"/><path d="M8 16L12 12L16 17L23 9L26 12L16 25Z" fill="#fff2c5"/>`,
  'circle-dashed':'<path d="M16 2L29 9V23L16 30L3 23V9Z" fill="#c8b780"/><path d="M16 6L25 11V21L16 26L7 21V11Z" fill="#f4edd8"/><path d="M14 10H18V22H14ZM10 14H22V18H10Z" opacity=".5"/>',
  'circle-alert':'<path d="M16 1L31 16L16 31L1 16Z" fill="#b78e4c"/><path d="M16 5L27 16L16 27L5 16Z" fill="#8b4535"/><path d="M14 9H18V19H14ZM14 22H18V25H14Z" fill="#fff3cb"/>',
  refinement:'<path d="M16 1L29 9V23L16 31L3 23V9Z" fill="#9c7d3d"/><path d="M16 4L25 10L16 18L7 10Z" fill="#d6e6b3"/><path d="M7 11L15 19V27L7 21Z" fill="#69976b"/><path d="M17 19L25 11V21L17 27Z" fill="#32664c"/>',
};
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]!);
export const GAME_ICON_NAMES = [...Object.keys(sprites), ...Object.keys(utilities), 'user-round'];
export function gameIcon(name: string, className = ''): string {
  const classes = `game-icon ${className}`.trim();
  if (name === 'user-round') return `<svg class="${escape(classes)} game-icon--portrait" viewBox="0 0 64 64" width="24" height="24" aria-hidden="true" focusable="false" data-game-icon="user-round"><image href="./assets/cultivator-portrait.png" width="64" height="64" preserveAspectRatio="xMidYMid slice"/></svg>`;
  if (utilities[name]) return `<svg class="${escape(classes)} game-icon--utility" viewBox="0 0 32 32" width="20" height="20" aria-hidden="true" focusable="false" data-game-icon="${escape(name)}"><g fill="currentColor">${utilities[name]}</g></svg>`;
  const [sheet, cell] = sprites[name] || sprites.orbit;
  return `<svg class="${escape(classes)} game-icon--painted" viewBox="0 0 64 64" width="24" height="24" aria-hidden="true" focusable="false" data-game-icon="${escape(name)}" data-icon-sheet="${sheet}" data-icon-cell="${cell}"${sprites[name] ? '' : ' data-icon-fallback="true"'}><image href="./assets/icons-${sheet}.png" x="${-(cell % 4) * 64}" y="${-Math.floor(cell / 4) * 64}" width="256" height="256" preserveAspectRatio="none"/></svg>`;
}
