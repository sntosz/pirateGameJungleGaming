import { Container, Graphics } from 'pixi.js';

export class HealthBar {
  public container: Container;
  private bgGraphics: Graphics;
  private fillGraphics: Graphics;
  private width: number;
  private height: number;

  constructor(width: number = 40, height: number = 6) {
    this.width = width;
    this.height = height;
    this.container = new Container();

    this.bgGraphics = new Graphics();
    this.fillGraphics = new Graphics();

    this.container.addChild(this.bgGraphics);
    this.container.addChild(this.fillGraphics);

    this.renderBg();
  }

  private renderBg(): void {
    this.bgGraphics.clear();
    this.bgGraphics.fill({ color: 0x000000, alpha: 0.7 });
    this.bgGraphics.rect(-this.width / 2 - 1, -this.height / 2 - 1, this.width + 2, this.height + 2);
  }

  public update(currentHp: number, maxHp: number, isPlayer: boolean = false): void {
    const ratio = Math.max(0, Math.min(1, currentHp / maxHp));
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
