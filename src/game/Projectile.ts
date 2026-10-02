import { Container, Sprite } from 'pixi.js';
import { TextureManager } from './TextureManager';
import { Circle } from './MathUtils';

export class Projectile {
  public container: Container;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public damage: number;
  public range: number;
  public traveledDistance: number = 0;
  public owner: 'player' | 'enemy';
  public radius: number = 6;
  public active: boolean = true;

  private sprite: Sprite;

  constructor(
    x: number,
    y: number,
    angle: number,
    speed: number,
    damage: number,
    range: number,
    owner: 'player' | 'enemy'
  ) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.range = range;
    this.owner = owner;

    this.container = new Container();
    this.container.position.set(x, y);

    const texture = TextureManager.getInstance().getTexture('cannonball');
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = 12;
    this.sprite.height = 12;
    this.container.addChild(this.sprite);
  }

  public update(dt: number): void {
    if (!this.active) return;

    const dx = this.vx * dt;
    const dy = this.vy * dt;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this.x += dx;
    this.y += dy;
    this.traveledDistance += dist;

    this.container.position.set(this.x, this.y);

    if (this.traveledDistance >= this.range) {
      this.active = false;
    }
  }

  public getCircle(): Circle {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }

  public destroy(): void {
    this.active = false;
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
