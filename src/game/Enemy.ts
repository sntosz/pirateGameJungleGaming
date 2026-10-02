import { Container, Sprite } from 'pixi.js';
import { GameConfig } from '../types/game';
import { TextureManager } from './TextureManager';
import { HealthBar } from './HealthBar';
import { Projectile } from './Projectile';
import { Circle, Polygon, circlePolygonCollision, normalizeAngle, distance, clamp } from './MathUtils';

export type EnemyType = 'CHASER' | 'SHOOTER';

export class Enemy {
  public container: Container;
  public x: number;
  public y: number;
  public angle: number = 0;
  public type: EnemyType;
  public currentHealth: number;
  public maxHealth: number;
  public radius: number = 20;
  public active: boolean = true;

  private sprite: Sprite;
  private healthBar: HealthBar;
  private config: GameConfig;
  private shootCooldownTimer: number = 0;

  constructor(x: number, y: number, type: EnemyType, config: GameConfig) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = config;

    if (type === 'CHASER') {
      this.maxHealth = config.chaserHealth;
    } else {
      this.maxHealth = config.shooterHealth;
    }
    this.currentHealth = this.maxHealth;

    this.container = new Container();
    this.container.position.set(x, y);

    const texKey = type === 'CHASER' ? 'chaser_ship' : 'shooter_ship';
    const texture = TextureManager.getInstance().getTexture(texKey);
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = 40;
    this.sprite.height = 56;
    this.container.addChild(this.sprite);

    this.healthBar = new HealthBar(36, 5);
    this.healthBar.container.position.set(0, -36);
    this.container.addChild(this.healthBar.container);

    this.updateHealthBar();
  }

  public update(
    dt: number,
    playerPos: { x: number; y: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[]
  ): Projectile | null {
    if (!this.active) return null;

    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer = Math.max(0, this.shootCooldownTimer - dt);
    }

    const distToPlayer = distance({ x: this.x, y: this.y }, playerPos);

    const dx = playerPos.x - this.x;
    const dy = playerPos.y - this.y;
    const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;

    const angleDiff = normalizeAngle(targetAngle - this.angle);
    const turnSpeed = this.type === 'CHASER' ? this.config.chaserTurnSpeed : this.config.shooterTurnSpeed;

    if (Math.abs(angleDiff) > 0.05) {
      this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);
    }
    this.container.rotation = this.angle;

    let moveSpeed = 0;

    if (this.type === 'CHASER') {
      moveSpeed = this.config.chaserSpeed;
    } else {
      if (distToPlayer > this.config.shooterAttackRange) {
        moveSpeed = this.config.shooterSpeed;
      } else {
        moveSpeed = this.config.shooterSpeed * 0.2;
      }
    }

    if (moveSpeed > 0) {
      const moveX = Math.sin(this.angle) * moveSpeed * dt;
      const moveY = -Math.cos(this.angle) * moveSpeed * dt;

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

    let firedProjectile: Projectile | null = null;
    if (
      this.type === 'SHOOTER' &&
      distToPlayer <= this.config.shooterAttackRange + 50 &&
      Math.abs(angleDiff) < 0.3 &&
      this.shootCooldownTimer <= 0
    ) {
      this.shootCooldownTimer = this.config.shooterCooldown;

      const frontDist = 24;
      const px = this.x + Math.sin(this.angle) * frontDist;
      const py = this.y - Math.cos(this.angle) * frontDist;
      const fireAngle = this.angle - Math.PI / 2;

      firedProjectile = new Projectile(
        px,
        py,
        fireAngle,
        this.config.shooterProjectileSpeed,
        this.config.shooterDamage,
        this.config.shooterAttackRange + 100,
        'enemy'
      );
    }

    return firedProjectile;
  }

  public takeDamage(amount: number): boolean {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();
    if (this.currentHealth <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  private updateHealthBar(): void {
    this.healthBar.update(this.currentHealth, this.maxHealth, false);
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
    this.healthBar.destroy();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
