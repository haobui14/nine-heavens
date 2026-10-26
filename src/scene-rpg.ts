import Phaser from 'phaser';
import type { GameState } from './game/engine';

class SpiritScene extends Phaser.Scene {
  private read: () => GameState;
  private hero!: Phaser.GameObjects.Image;
  private beast?: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private foeShadow?: Phaser.GameObjects.Ellipse;
  private circle!: Phaser.GameObjects.Graphics;
  private motes: Phaser.GameObjects.Arc[] = [];
  private lastKey = 'initial';
  private lastTurn = 0;
  private lastHp = 0;
  private heroY = 0;
  private beastY = 0;
  private initialized = false;

  constructor(read: () => GameState) { super('spirit-scene'); this.read = read; }
  preload() {
    this.load.image('cultivator', './assets/cultivator.png');
    this.load.spritesheet('beasts', './assets/spirit-beasts.png', { frameWidth: 627, frameHeight: 627 });
  }
  create() {
    this.circle = this.add.graphics().setDepth(0);
    this.shadow = this.add.ellipse(0, 0, 120, 18, 0x102f20, 0.25).setDepth(1);
    this.hero = this.add.image(0, 0, 'cultivator').setOrigin(0.5, 1).setDepth(3);
    for (let i = 0; i < 28; i++) this.motes.push(this.add.circle(0, 0, 0.8 + i % 3 * 0.5, i % 3 ? 0xe6db9b : 0xb4e6c3, 0.7).setDepth(4));
    this.initialized = true;
    this.scale.on('resize', this.layout, this);
    this.sync(); this.layout();
  }
  private sync() {
    const b = this.read().battle;
    const key = b ? `${b.region}-${b.wave}` : 'sanctuary';
    if (key === this.lastKey) return;
    this.lastKey = key; this.lastTurn = b?.turn || 0; this.lastHp = b?.hp || 0;
    this.tweens.killTweensOf(this.hero);
    if (this.beast) { this.tweens.killTweensOf(this.beast); this.beast.destroy(); this.beast = undefined; }
    this.foeShadow?.destroy(); this.foeShadow = undefined;
    if (b) {
      const frame = b.isTrial ? (b.wave === 2 ? 3 : 2) : b.region === 'ridge' ? 1 : b.region === 'ruins' ? 2 : 0;
      this.foeShadow = this.add.ellipse(0, 0, 150, 20, 0x102b1c, 0.3).setDepth(1);
      this.beast = this.add.image(0, 0, 'beasts', frame).setOrigin(0.5, 1).setDepth(3);
    }
    this.layout();
    if (b && !this.read().settings.reducedMotion && this.beast) {
      this.beast.setAlpha(0); this.tweens.add({ targets: this.beast, alpha: 1, duration: 350 });
    }
  }
  private layout() {
    if (!this.initialized) return;
    const w = this.scale.width, h = this.scale.height, b = this.read().battle;
    const heroHeight = b ? Math.min(h * 0.65, w * 0.48) : Math.min(h * 0.88, w * 0.78);
    this.heroY = h * (b ? 0.84 : 0.91);
    this.hero.setPosition(w * (b ? 0.25 : w < 480 ? 0.61 : 0.64), this.heroY).setDisplaySize(heroHeight, heroHeight).setAngle(0);
    this.shadow.setPosition(this.hero.x, this.heroY - 5).setDisplaySize(heroHeight * 0.55, heroHeight * 0.075);
    if (this.beast && b) {
      const foeHeight = Math.min(h * 0.66, w * 0.48) * (b.wave >= 2 ? 1.08 : 1);
      this.beastY = h * 0.84;
      this.beast.setPosition(w * 0.75, this.beastY).setDisplaySize(foeHeight, foeHeight);
      this.foeShadow?.setPosition(this.beast.x, this.beastY - 5).setDisplaySize(foeHeight * 0.65, foeHeight * 0.075);
    }
  }
  private drawCircle(time: number) {
    const w = this.scale.width, b = this.read().battle, motion = !this.read().settings.reducedMotion;
    const x = this.hero.x, y = this.heroY - 7, radius = Math.min(w * 0.2, 113);
    this.circle.clear().setPosition(x, y).setScale(1, 0.34).setAlpha(b ? 0.55 : 0.8);
    const rotation = motion ? time / 22000 : 0;
    this.circle.lineStyle(1.3, 0xe6d29a, 0.65).strokeCircle(0, 0, radius).strokeCircle(0, 0, radius * 0.78);
    this.circle.lineStyle(0.7, 0xbce5c0, 0.4).strokeCircle(0, 0, radius * 1.12);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + rotation;
      const p = (r: number, offset: number) => ({ x: Math.cos(a) * r + Math.sin(a) * offset, y: Math.sin(a) * r - Math.cos(a) * offset });
      for (let j = 0; j < 3; j++) {
        const from = p(radius * 0.84 + j * 3, -5), to = p(radius * 0.84 + j * 3, 5);
        this.circle.lineStyle(1, 0xe4d398, 0.8).lineBetween(from.x, from.y, to.x, to.y);
      }
    }
  }
  private floatingText(text: string, x: number, y: number, color: string, big = false) {
    const label = this.add.text(x, y, text, { fontFamily: 'Georgia, serif', fontSize: `${big ? 32 : 25}px`, color, stroke: '#27342a', strokeThickness: 3, shadow: { offsetX: 0, offsetY: 2, color: '#122719', blur: 5, fill: true } }).setOrigin(0.5).setDepth(10);
    if (this.read().settings.reducedMotion) { this.time.delayedCall(600, () => label.destroy()); return; }
    this.tweens.add({ targets: label, y: y - 48, alpha: 0, duration: 950, ease: 'Cubic.easeOut', onComplete: () => label.destroy() });
  }
  private strike() {
    const b = this.read().battle, foe = this.beast;
    if (!b || !foe) return;
    const reduced = this.read().settings.reducedMotion;
    const match = b.lastAction.match(/· (\d+)( critical)? damage/);
    const element = b.lastAction.includes('Ember') ? 'fire' : b.lastAction.includes('Lotus') ? 'wood' : b.lastAction.includes('Stillwater') ? 'water' : b.lastAction.includes('Mountain') ? 'earth' : b.lastAction.includes('Reproach') ? 'thunder' : 'sword';
    const color = ({ fire: 0xffb85a, wood: 0xbaf0ab, water: 0xa5e1f5, earth: 0xf1d99a, thunder: 0xd5b8ff, sword: 0xe9ebc8 })[element];
    if (match) this.floatingText(`${match[2] ? 'CRIT ' : ''}${match[1]}`, foe.x, foe.y - foe.displayHeight * 0.7, match[2] ? '#f5d57f' : '#fff4d2', !!match[2]);
    const healthChange = b.hp - this.lastHp;
    if (healthChange !== 0) this.floatingText(`${healthChange > 0 ? '+' : ''}${healthChange}`, this.hero.x, this.heroY - this.hero.displayHeight * 0.55, healthChange > 0 ? '#c7efad' : '#f0c9ad');
    if (reduced) return;
    const homeX = this.scale.width * 0.25;
    this.tweens.add({ targets: this.hero, x: homeX + Math.min(25, this.scale.width * 0.04), angle: 3, duration: 130, yoyo: true, ease: 'Sine.easeOut' });
    const cut = this.add.graphics().setPosition(foe.x, foe.y - foe.displayHeight * 0.42).setDepth(7);
    cut.lineStyle(9, color, 0.22).beginPath().arc(0, 0, 55, -1.6, 1.2, false).strokePath();
    cut.lineStyle(3, 0xfffae1, 0.95).beginPath().arc(0, 0, 52, -1.6, 1.2, false).strokePath();
    cut.setAngle(-25).setScale(0.7);
    this.tweens.add({ targets: cut, alpha: 0, scaleX: 1.6, scaleY: 1.6, angle: 55, duration: 430, onComplete: () => cut.destroy() });
    const bolt = this.add.ellipse(homeX + 30, this.heroY - this.hero.displayHeight * 0.42, element === 'fire' ? 37 : 52, element === 'fire' ? 20 : 7, color, 0.95).setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: bolt, x: foe.x, duration: 210, ease: 'Quad.easeIn', onComplete: () => {
      bolt.destroy();
      if (foe.active) this.tweens.add({ targets: foe, alpha: 0.45, x: foe.x + 7, duration: 80, yoyo: true });
    } });
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6, spark = this.add.circle(foe.x, foe.y - foe.displayHeight * 0.4, 1.5 + i % 3, color).setDepth(8);
      this.tweens.add({ targets: spark, x: spark.x + Math.cos(angle) * (35 + i * 2), y: spark.y + Math.sin(angle) * 42, alpha: 0, duration: 400 + i * 18, delay: 160, onComplete: () => spark.destroy() });
    }
    if (match?.[2]) this.cameras.main.shake(120, 0.0025);
  }
  update(time: number) {
    if (!this.initialized) return;
    this.sync(); this.drawCircle(time);
    const s = this.read(), b = s.battle, motion = !s.settings.reducedMotion;
    if (!this.tweens.isTweening(this.hero)) this.hero.y = this.heroY + (motion ? Math.sin(time / 1800) * 2 : 0);
    if (this.beast && !this.tweens.isTweening(this.beast)) this.beast.y = this.beastY + (motion ? Math.sin(time / 1350 + 1) * 3 : 0);
    this.motes.forEach((m, i) => {
      const t = motion ? time / (4300 + i * 70) : 1, phase = i * 2.399;
      m.setPosition(this.hero.x + Math.cos(t + phase) * (30 + i * 3), this.heroY - ((t * 23 + i * 13) % (this.hero.displayHeight * 0.9)));
      m.alpha = (b ? 0.2 : 0.3) + Math.sin(t + phase) ** 2 * 0.4;
    });
    if (b && b.turn !== this.lastTurn) { this.strike(); this.lastTurn = b.turn; this.lastHp = b.hp; }
  }
}
export function mountScene(host: HTMLElement, read: () => GameState): () => void {
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth || 600, height: host.clientHeight || 430, transparent: true, antialias: true, scene: new SpiritScene(read), banner: false, audio: { noAudio: true }, fps: { target: 30, forceSetTimeOut: true }, render: { powerPreference: 'low-power' } });
  const observer = new ResizeObserver(() => { if (host.clientWidth && host.clientHeight) game.scale.resize(host.clientWidth, host.clientHeight); }); observer.observe(host);
  return () => { observer.disconnect(); game.destroy(true); };
}
