import { Container, Sprite, Graphics } from 'pixi.js';
import { Polygon, Point } from './MathUtils';
import { TextureManager } from './TextureManager';

export class Island {
  public container: Container;
  public x: number;
  public y: number;
  public radius: number;
  public polygon: Polygon;

  constructor(x: number, y: number, radius: number = 90, customPoints?: Point[]) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.container = new Container();
    this.container.position.set(x, y);

    if (customPoints) {
      this.polygon = { points: customPoints.map(p => ({ x: p.x + x, y: p.y + y })) };
    } else {
      const pts: Point[] = [];
      const numPts = 10;
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        const varRadius = radius * (0.85 + 0.3 * Math.sin(i * 3.5));
        pts.push({
          x: x + Math.cos(angle) * varRadius,
          y: y + Math.sin(angle) * varRadius,
        });
      }
      this.polygon = { points: pts };
    }

    this.renderIsland();
  }

  private renderIsland(): void {
    const g = new Graphics();
    g.fill({ color: 0xd4a373 });
    const localPts = this.polygon.points.map(p => ({ x: p.x - this.x, y: p.y - this.y }));
    g.drawPolygon(localPts.flatMap(p => [p.x, p.y]));

    g.fill({ color: 0x2a9d8f });
    const innerPts = localPts.map(p => ({ x: p.x * 0.75, y: p.y * 0.75 }));
    g.drawPolygon(innerPts.flatMap(p => [p.x, p.y]));

    this.container.addChild(g);

    try {
      const tex = TextureManager.getInstance().getTexture('island_1');
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = this.radius * 1.4;
      sprite.height = this.radius * 1.4;
      sprite.alpha = 0.8;
      this.container.addChild(sprite);
    } catch {
      // Fallback graphics drawn
    }
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
