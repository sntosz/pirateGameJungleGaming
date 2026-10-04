import { Container, Sprite } from 'pixi.js';
import { GameConfig } from '../types/game';
import { TextureManager } from './TextureManager';
import { HealthBar } from './HealthBar';
import { Projectile } from './Projectile';
import { SoundManager } from './SoundManager';
import { Circle, Polygon, circlePolygonCollision, clamp } from './MathUtils';

export class Player {
  public container: Container;
  public x: number;
  public y: number;
  public angle: number = 0;
  public currentHealth: number;
  public maxHealth: number;
  public radius: number = 22;

  public frontCooldownTimer: number = 0;
  public leftBroadsideCooldownTimer: number = 0;
  public rightBroadsideCooldownTimer: number = 0;

  private sprite: Sprite;
  private healthBar: HealthBar;
  private config: GameConfig;

  constructor(x: number, y: number, config: GameConfig) {
    this.x = x;
    this.y = y;
    this.config = config;
    this.maxHealth = config.playerMaxHealth;
    this.currentHealth = config.playerMaxHealth;

    this.container = new Container();
    this.container.position.set(x, y);

    const texture = TextureManager.getInstance().getTexture('player_ship');
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = 44;
    this.sprite.height = 64;
    this.sprite.rotation = Math.PI;
    this.container.addChild(this.sprite);

    this.healthBar = new HealthBar(48, 6);
    this.healthBar.container.position.set(0, -42);
    this.container.addChild(this.healthBar.container);

    this.updateHealthBar();
  }

  public update(
    dt: number,
    inputs: { thrust: number; turn: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[]
  ): void {
    if (this.frontCooldownTimer > 0) {
      this.frontCooldownTimer = Math.max(0, this.frontCooldownTimer - dt);
    }
    if (this.leftBroadsideCooldownTimer > 0) {
      this.leftBroadsideCooldownTimer = Math.max(0, this.leftBroadsideCooldownTimer - dt);
    }
    if (this.rightBroadsideCooldownTimer > 0) {
      this.rightBroadsideCooldownTimer = Math.max(0, this.rightBroadsideCooldownTimer - dt);
    }

    if (inputs.turn !== 0) {
      this.angle += inputs.turn * this.config.playerTurnSpeed * dt;
    }
    this.container.rotation = this.angle;

    if (inputs.thrust !== 0) {
      const speed = inputs.thrust * this.config.playerMoveSpeed;
      const moveX = Math.sin(this.angle) * speed * dt;
      const moveY = -Math.cos(this.angle) * speed * dt;

      const nextX = clamp(this.x + moveX, this.radius, arenaWidth - this.radius);
      const nextY = clamp(this.y + moveY, this.radius, arenaHeight - this.radius);

      const testCircle: Circle = { x: nextX, y: nextY, radius: this.radius };
      let collidesWithIsland = false;

      for (const islandPoly of islands) {
        if (circlePolygonCollision(testCircle, islandPoly)) {
          collidesWithIsland = true;
          break;
        }
      }

      if (!collidesWithIsland) {
        this.x = nextX;
        this.y = nextY;
      }
    }

    this.container.position.set(this.x, this.y);
    SoundManager.getInstance().updateSailingSound(inputs.thrust !== 0);
  }

  public fireFront(): Projectile[] | null {
    if (this.frontCooldownTimer > 0) return null;
    this.frontCooldownTimer = this.config.frontCannonCooldown;

    SoundManager.getInstance().play('cannon_fire');

    const frontDist = 28;
    const px = this.x + Math.sin(this.angle) * frontDist;
    const py = this.y - Math.cos(this.angle) * frontDist;
    const fireAngle = this.angle - Math.PI / 2;

    return [
      new Projectile(
        px,
        py,
        fireAngle,
        this.config.frontCannonSpeed,
        this.config.frontCannonDamage,
        this.config.frontCannonRange,
        'player'
      ),
    ];
  }

  public fireLeftBroadside(): Projectile[] | null {
    if (this.leftBroadsideCooldownTimer > 0) return null;
    this.leftBroadsideCooldownTimer = this.config.broadsideCooldown;

    SoundManager.getInstance().play('cannon_broadside');

    const leftAngle = this.angle - Math.PI;
    const projectList: Projectile[] = [];

    const angleOffsets = [-0.12, 0, 0.12];
    for (const spread of angleOffsets) {
      projectList.push(
        new Projectile(
          this.x,
          this.y,
          leftAngle + spread,
          this.config.broadsideSpeed,
          this.config.broadsideDamage,
          this.config.broadsideRange,
          'player'
        )
      );
    }

    return projectList;
  }

  public fireRightBroadside(): Projectile[] | null {
    if (this.rightBroadsideCooldownTimer > 0) return null;
    this.rightBroadsideCooldownTimer = this.config.broadsideCooldown;

    SoundManager.getInstance().play('cannon_broadside');

    const rightAngle = this.angle;
    const projectList: Projectile[] = [];

    const angleOffsets = [-0.12, 0, 0.12];
    for (const spread of angleOffsets) {
      projectList.push(
        new Projectile(
          this.x,
          this.y,
          rightAngle + spread,
          this.config.broadsideSpeed,
          this.config.broadsideDamage,
          this.config.broadsideRange,
          'player'
        )
      );
    }

    return projectList;
  }

  public takeDamage(amount: number): void {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();
    SoundManager.getInstance().play('wood_hit');
  }

  private updateHealthBar(): void {
    this.healthBar.update(this.currentHealth, this.maxHealth, true);

    const healthRatio = this.currentHealth / this.maxHealth;
    const texKey = healthRatio <= 0.3
      ? 'player_ship_critical'
      : healthRatio <= 0.65
        ? 'player_ship_damaged'
        : 'player_ship';
    this.sprite.texture = TextureManager.getInstance().getTexture(texKey);
    this.sprite.tint = healthRatio <= 0.3 ? 0xb29a84 : healthRatio <= 0.65 ? 0xe2d1bd : 0xffffff;
  }

  public getCircle(): Circle {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius,
    };
  }

  public destroy(): void {
    this.healthBar.destroy();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
