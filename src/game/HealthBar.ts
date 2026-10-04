import { Container, Graphics, Sprite } from 'pixi.js';
import { TextureManager } from './TextureManager';

type HealthBarStyle = 'default' | 'enemy';

export class HealthBar {
  public container: Container;
  private bgGraphics: Graphics;
  private fillGraphics: Graphics;
  private enemyFill: Sprite | null = null;
  private enemyFillMask: Graphics | null = null;
  private enemyFillWidth = 0;
  private enemyFillHeight = 0;
  private enemyFillLeft = 0;
  private width: number;
  private height: number;

  constructor(width: number = 40, height: number = 6, style: HealthBarStyle = 'default') {
    this.width = width;
    this.height = height;
    this.container = new Container();

    this.bgGraphics = new Graphics();
    this.fillGraphics = new Graphics();

    if (style === 'enemy') {
      const textures = TextureManager.getInstance();
      const frame = new Sprite(textures.getTexture('health_frame'));
      frame.anchor.set(0.5);
      frame.width = width;
      frame.height = height;
      this.container.addChild(frame);

      this.enemyFill = new Sprite(textures.getTexture('enemy_health_fill_red'));
      this.enemyFill.anchor.set(0, 0.5);
      this.enemyFillLeft = -width / 2 + 7;
      this.enemyFillWidth = width - 14;
      this.enemyFillHeight = height - 8;
      const fillSpriteWidth = this.enemyFillWidth / (118 / 160);
      const fillSpriteHeight = this.enemyFillHeight / (21 / 40);
      this.enemyFill.position.set(
        this.enemyFillLeft - (fillSpriteWidth - this.enemyFillWidth) / 2,
        0
      );
      this.enemyFill.width = fillSpriteWidth;
      this.enemyFill.height = fillSpriteHeight;

      this.enemyFillMask = new Graphics();
      this.enemyFill.mask = this.enemyFillMask;
      this.container.addChild(this.enemyFill);
      this.container.addChild(this.enemyFillMask);
    } else {
      this.container.addChild(this.bgGraphics);
      this.container.addChild(this.fillGraphics);
      this.renderBg();
    }

  }

  private renderBg(): void {
    this.bgGraphics.clear();
    this.bgGraphics.fill({ color: 0x000000, alpha: 0.7 });
    this.bgGraphics.rect(-this.width / 2 - 1, -this.height / 2 - 1, this.width + 2, this.height + 2);
  }

  public update(currentHp: number, maxHp: number, isPlayer: boolean = false): void {
    const ratio = Math.max(0, Math.min(1, currentHp / maxHp));

    if (this.enemyFill && this.enemyFillMask) {
      this.enemyFillMask.clear();
      this.enemyFill.visible = ratio > 0;
      if (ratio > 0) {
        const visibleWidth = this.enemyFillWidth * ratio;
        this.enemyFillMask
          .roundRect(
            this.enemyFillLeft,
            -this.enemyFillHeight / 2,
            Math.min(this.enemyFillWidth, visibleWidth),
            this.enemyFillHeight,
            Math.min(this.enemyFillHeight / 2, visibleWidth / 2)
          )
          .fill({ color: 0xffffff });
      }
      return;
    }

    this.fillGraphics.clear();

    if (ratio <= 0) return;

    let color = 0x2ecc71;
    if (ratio < 0.3) {
      color = 0xe74c3c;
    } else if (ratio < 0.6) {
      color = 0xf1c40f;
    }

    if (isPlayer) {
      color = 0x3498db;
      if (ratio < 0.3) color = 0xe74c3c;
    }

    const fillW = this.width * ratio;
    this.fillGraphics.fill({ color });
    this.fillGraphics.rect(-this.width / 2, -this.height / 2, fillW, this.height);
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
