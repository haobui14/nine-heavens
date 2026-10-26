import Phaser from 'phaser';
import type { GameState } from './game/engine';

class CultivationScene extends Phaser.Scene {
  private read: () => GameState;
  private motes: Phaser.GameObjects.Arc[] = [];
  private aura!: Phaser.GameObjects.Graphics;
  private hero?: Phaser.GameObjects.Container;
  private beast?: Phaser.GameObjects.Container;
  private lastTurn = -1;
  private battleKey = '';
  constructor(read: () => GameState) { super('cultivation'); this.read = read; }
  create() {
    this.aura = this.add.graphics();
    for (let i = 0; i < 26; i++) this.motes.push(this.add.circle(0, 0, 1 + (i % 3) * 0.45, i % 2 ? 0xe3efb8 : 0xaee5d4, 0.6));
    this.scale.on('resize', this.layout, this); this.layout();
  }
  private makeHero() {
    const g = this.add.graphics();
    g.fillStyle(0x203f45, 0.13).fillEllipse(0, 9, 72, 18);
    g.fillStyle(0x41635d, 0.9).fillTriangle(-12, -45, -35, 4, 24, 4);
    g.fillStyle(0xf6f1df).fillTriangle(-4, -48, -22, 3, 34, 3);
    g.fillStyle(0xc3d8cd).fillTriangle(-5, -38, 3, 3, 17, 3);
    g.lineStyle(3, 0x2b514b).lineBetween(-15, -30, 17, -24);
    g.fillStyle(0xe6cead).fillCircle(1, -57, 10);
    g.fillStyle(0x243c3b).fillEllipse(0, -66, 23, 12).fillCircle(-4, -73, 5);
    g.lineStyle(4, 0x365454).lineBetween(15, -31, 54, -56);
    g.lineStyle(2, 0xe2d6ae).lineBetween(38, -55, 46, -45);
    return this.add.container(0, 0, [g]);
  }
  private makeBeast() {
    const g = this.add.graphics(); const isFire = this.read().battle?.region === 'ridge';
    const color = isFire ? 0xb9764b : this.read().battle?.isTrial ? 0x8277aa : 0x7ca99b;
    g.fillStyle(0x223e3b, 0.12).fillEllipse(0, 10, 110, 24);
    g.fillStyle(color, 0.55).fillTriangle(-20, -10, -80, -52, -55, 8);
    g.fillStyle(color).fillEllipse(0, -15, 78, 52).fillTriangle(-27, -30, -35, -66, -8, -37).fillTriangle(4, -37, 25, -68, 34, -24);
    g.fillStyle(0xe9ede2).fillEllipse(-3, -21, 49, 30).fillTriangle(-21, -16, -43, -8, -20, 0);
    g.fillStyle(0x1a4440).fillEllipse(-15, -25, 5, 8).fillEllipse(13, -25, 5, 8).fillTriangle(-4, -13, 2, -13, -1, -9);
    g.lineStyle(2, 0xe3c78e).strokeCircle(0, -33, 4);
    return this.add.container(0, 0, [g]);
  }
  private layout() {
    if (this.hero) this.hero.setPosition(this.scale.width * 0.27, this.scale.height * 0.74);
    if (this.beast) this.beast.setPosition(this.scale.width * 0.73, this.scale.height * 0.74);
  }
  update(time: number) {
    if (!this.aura) return;
    const s = this.read(), b = s.battle, w = this.scale.width, h = this.scale.height;
    const key = b ? `${b.region}-${b.wave}` : '';
    if (key !== this.battleKey) {
      this.battleKey = key; this.hero?.destroy(true); this.beast?.destroy(true); this.hero = undefined; this.beast = undefined;
      if (b) { this.hero = this.makeHero(); this.beast = this.makeBeast(); this.layout(); }
      this.lastTurn = b?.turn || 0;
    }
    const motion = !s.settings.reducedMotion;
    this.aura.clear();
    const cx = b ? w * 0.27 : w * 0.71, cy = b ? h * 0.75 : h * 0.77;
    if (!b) {
      const breathe = motion ? Math.sin(time / 1800) * 0.12 : 0;
      this.aura.lineStyle(1, 0xbedbaf, 0.4 + breathe).strokeEllipse(cx, cy, 112, 34);
      this.aura.lineStyle(1, 0xe7dcaf, 0.28).strokeEllipse(cx, cy, 135, 43);
    }
    this.motes.forEach((m, i) => {
      const t = motion ? time / (4300 + i * 70) : 1;
      const phase = i * 2.399;
      m.x = cx + Math.cos(t + phase) * (32 + i * 2.8);
      m.y = cy - ((t * 25 + i * 13) % 100);
      m.alpha = b ? 0.25 : 0.2 + Math.sin(t + phase) ** 2 * 0.45;
    });
    if (b && b.turn !== this.lastTurn) {
      this.lastTurn = b.turn;
      if (!motion) return;
      if (this.hero) this.tweens.add({ targets: this.hero, x: w * 0.34, duration: 130, yoyo: true, ease: 'Sine.easeOut' });
      const bolt = this.add.ellipse(w * 0.32, h * 0.59, 45, 8, b.lastAction.includes('Ember') ? 0xe5a573 : 0xc5e5cb, 0.95);
      this.tweens.add({ targets: bolt, x: w * 0.73, alpha: 0.1, duration: 280, onComplete: () => { bolt.destroy(); if (this.beast) this.tweens.add({ targets: this.beast, alpha: 0.35, duration: 90, yoyo: true }); } });
    }
  }
}
export function mountScene(host: HTMLElement, read: () => GameState): () => void {
  const game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth || 600, height: host.clientHeight || 340, transparent: true, antialias: true, scene: new CultivationScene(read), banner: false, audio: { noAudio: true }, fps: { target: 30, forceSetTimeOut: true }, render: { powerPreference: 'low-power' } });
  const observer = new ResizeObserver(() => { if (host.clientWidth && host.clientHeight) game.scale.resize(host.clientWidth, host.clientHeight); }); observer.observe(host);
  return () => { observer.disconnect(); game.destroy(true); };
}
