import { Container, Sprite, Graphics, TilingSprite } from 'pixi.js';
import { Polygon, Point } from './MathUtils';
import { TextureManager } from './TextureManager';

export class Island {
  public container: Container;
  public x: number;
  public y: number;
  public radius: number;
  public polygon: Polygon;
  private variant: number;

  constructor(x: number, y: number, radius: number = 90, customPoints?: Point[], variant: number = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.variant = variant;
    this.container = new Container();
    this.container.position.set(x, y);

    if (customPoints) {
      this.polygon = { points: customPoints.map(p => ({ x: p.x + x, y: p.y + y })) };
    } else {
      const pts: Point[] = [];
      const numPts = 36;
      const islandShapes = [
        { x: 1.18, y: 0.86 },
        { x: 0.86, y: 1.16 },
        { x: 1.12, y: 0.9 },
        { x: 0.92, y: 1.1 },
      ];
      const shape = islandShapes[this.variant % islandShapes.length];
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        const broadCurve = Math.sin(angle * 2 + this.variant * 1.35) * 0.12;
        const smallCurve = Math.cos(angle * 3 - this.variant * 0.8) * 0.05;
        const cove = Math.sin(angle * 5 + this.variant) * 0.03;
        const varRadius = radius * (0.94 + broadCurve + smallCurve + cove);
        pts.push({
          x: x + Math.cos(angle) * varRadius * shape.x,
          y: y + Math.sin(angle) * varRadius * shape.y,
        });
      }
      this.polygon = { points: pts };
    }

    this.renderIsland();
  }

  private renderIsland(): void {
    const localPts = this.polygon.points.map(p => ({ x: p.x - this.x, y: p.y - this.y }));
    const polygonCoords = localPts.flatMap(p => [p.x, p.y]);

    if (this.variant >= 4) {
      const reefShadow = new Graphics()
        .ellipse(0, 7, this.radius * 1.1, this.radius * 0.7)
        .fill({ color: 0x062b3b, alpha: 0.3 });
      this.container.addChild(reefShadow);

      const reefRocks = [
        { x: -0.35, y: 0.05, scale: 1.5 },
        { x: 0.18, y: -0.12, scale: 1.1 },
        { x: 0.55, y: 0.18, scale: 0.82 },
      ];
      for (const rock of reefRocks) {
        const sprite = new Sprite(TextureManager.getInstance().getTexture('rock_small'));
        sprite.anchor.set(0.5);
        sprite.width = this.radius * rock.scale;
        sprite.height = this.radius * rock.scale * 0.78;
        sprite.position.set(this.radius * rock.x, this.radius * rock.y);
        this.container.addChild(sprite);
      }
      return;
    }

    const shadow = new Graphics()
      .poly(localPts.flatMap(p => [p.x, p.y + 6]))
      .fill({ color: 0x062b3b, alpha: 0.24 });
    this.container.addChild(shadow);

    const shoreline = new Graphics().poly(polygonCoords).fill({ color: 0xffffff });
    const sand = new TilingSprite({
      texture: TextureManager.getInstance().getTexture('island_sand'),
      width: this.radius * 2.4,
      height: this.radius * 2.4,
    });
    sand.position.set(-this.radius * 1.2, -this.radius * 1.2);
    sand.tileScale.set(0.7);
    sand.mask = shoreline;
    this.container.addChild(shoreline, sand);

    const grassPoints = localPts.map(p => ({ x: p.x * 0.68, y: p.y * 0.68 }));
    const grassBase = new Graphics()
      .poly(grassPoints.flatMap(p => [p.x, p.y]))
      .fill({ color: 0x4c8b36 });
    this.container.addChild(grassBase);

    const decorations = [
      [
        { key: 'foliage_large', x: -0.34, y: -0.18, size: 60 },
        { key: 'foliage_large', x: 0.3, y: 0.16, size: 46 },
        { key: 'foliage_small', x: 0.1, y: -0.42, size: 32 },
        { key: 'foliage_bush', x: -0.18, y: 0.32, size: 38 },
        { key: 'rock_small', x: -0.42, y: 0.34, size: 28 },
        { key: 'foliage_small', x: 0.4, y: -0.1, size: 24 },
      ],
      [
        { key: 'foliage_large', x: 0.25, y: -0.28, size: 56 },
        { key: 'foliage_bush', x: -0.28, y: -0.25, size: 42 },
        { key: 'foliage_small', x: 0.32, y: 0.28, size: 32 },
        { key: 'foliage_bush', x: 0, y: 0.25, size: 32 },
        { key: 'rock_small', x: 0.52, y: 0, size: 24 },
      ],
      [
        { key: 'foliage_large', x: 0.35, y: -0.22, size: 55 },
        { key: 'foliage_small', x: -0.22, y: -0.36, size: 33 },
        { key: 'foliage_bush', x: -0.32, y: 0.18, size: 44 },
        { key: 'rock_large', x: 0.25, y: 0.42, size: 30 },
        { key: 'foliage_small', x: -0.2, y: 0.35, size: 28 },
      ],
      [
        { key: 'foliage_bush', x: 0.28, y: -0.3, size: 40 },
        { key: 'foliage_large', x: -0.25, y: -0.05, size: 55 },
        { key: 'foliage_small', x: 0.32, y: 0.34, size: 34 },
        { key: 'rock_small', x: -0.45, y: 0.32, size: 30 },
        { key: 'foliage_large', x: 0.18, y: 0.2, size: 42 },
      ],
    ];

    for (const decoration of decorations[this.variant % decorations.length]) {
      const sprite = new Sprite(TextureManager.getInstance().getTexture(decoration.key));
      sprite.anchor.set(0.5);
      sprite.width = decoration.size;
      sprite.height = decoration.size;
      sprite.position.set(this.radius * decoration.x, this.radius * decoration.y);
      this.container.addChild(sprite);
    }
  }

  public destroy(): void {
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
