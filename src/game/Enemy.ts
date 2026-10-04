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
  public readyToRemove: boolean = false;

  private sprite: Sprite;
  private healthBar: HealthBar;
  private config: GameConfig;
  private shootCooldownTimer: number = 0;
  private avoidanceSide: number;
  private muzzleFlash: Sprite | null = null;
  private muzzleFlashTimer: number = 0;
  private damageSmoke: Sprite;
  private wreckCrew: { sprite: Sprite; vx: number; vy: number; spin: number }[] = [];
  private deathTimeRemaining: number = 0;
  private effectTime: number = 0;

  constructor(x: number, y: number, type: EnemyType, config: GameConfig) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.config = config;
    this.avoidanceSide = (Math.floor(x / 64) + Math.floor(y / 64)) % 2 === 0 ? 1 : -1;

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
    this.sprite.rotation = Math.PI;
    this.container.addChild(this.sprite);

    const textures = TextureManager.getInstance();
    this.damageSmoke = new Sprite(textures.getTexture('damage_smoke'));
    this.damageSmoke.anchor.set(0.5);
    this.damageSmoke.width = 20;
    this.damageSmoke.height = 24;
    this.damageSmoke.position.set(-7, -10);
    this.damageSmoke.tint = 0x737b82;
    this.damageSmoke.visible = false;
    this.container.addChild(this.damageSmoke);

    if (type === 'SHOOTER') {
      this.muzzleFlash = new Sprite(TextureManager.getInstance().getTexture('fire_effect'));
      this.muzzleFlash.anchor.set(0.5);
      this.muzzleFlash.width = 19;
      this.muzzleFlash.height = 23;
      this.muzzleFlash.position.set(0, -27);
      this.muzzleFlash.visible = false;
      this.container.addChild(this.muzzleFlash);
    }

    this.healthBar = new HealthBar(56, 14, 'enemy');
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
    if (this.deathTimeRemaining > 0) {
      this.updateWreck(dt);
      return null;
    }
    if (!this.active) return null;

    this.effectTime += dt;
    const damagePulse = 0.88 + Math.sin(this.effectTime * 12) * 0.12;
    this.damageSmoke.scale.set(damagePulse);
    if (this.muzzleFlashTimer > 0 && this.muzzleFlash) {
      this.muzzleFlashTimer = Math.max(0, this.muzzleFlashTimer - dt);
      this.muzzleFlash.visible = this.muzzleFlashTimer > 0;
      this.muzzleFlash.alpha = this.muzzleFlashTimer / 0.14;
    }

    if (this.shootCooldownTimer > 0) {
      this.shootCooldownTimer = Math.max(0, this.shootCooldownTimer - dt);
    }

    const distToPlayer = distance({ x: this.x, y: this.y }, playerPos);

    const dx = playerPos.x - this.x;
    const dy = playerPos.y - this.y;
    const targetAngle = Math.atan2(dx, -dy);

    const angleDiff = normalizeAngle(targetAngle - this.angle);
    const turnSpeed = this.type === 'CHASER' ? this.config.chaserTurnSpeed : this.config.shooterTurnSpeed;

    if (Math.abs(angleDiff) > 0.05) {
      this.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed * dt);
    }
    this.container.rotation = this.angle;
    this.healthBar.container.position.set(-Math.sin(this.angle) * 36, -Math.cos(this.angle) * 36);
    this.healthBar.container.rotation = -this.angle;

    let moveSpeed: number;
    let movementAngle = targetAngle;

    if (this.type === 'CHASER') {
      moveSpeed = this.config.chaserSpeed;
    } else if (distToPlayer > this.config.shooterAttackRange) {
      moveSpeed = this.config.shooterSpeed;
    } else if (distToPlayer < this.config.shooterAttackRange * 0.72) {
      movementAngle = targetAngle + Math.PI;
      moveSpeed = this.config.shooterSpeed * 0.75;
    } else {
      movementAngle = targetAngle + this.avoidanceSide * Math.PI / 2;
      moveSpeed = this.config.shooterSpeed * 0.35;
    }

    if (moveSpeed > 0) {
      const clearHeading = this.findClearHeading(
        movementAngle,
        moveSpeed,
        dt,
        arenaWidth,
        arenaHeight,
        islands
      );

      if (clearHeading !== null) {
        const moveX = Math.sin(clearHeading) * moveSpeed * dt;
        const moveY = -Math.cos(clearHeading) * moveSpeed * dt;

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
      this.muzzleFlashTimer = 0.14;
      if (this.muzzleFlash) {
        this.muzzleFlash.visible = true;
        this.muzzleFlash.alpha = 1;
      }

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

  private findClearHeading(
    preferredAngle: number,
    speed: number,
    dt: number,
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[]
  ): number | null {
    const offsets = [
      0,
      this.avoidanceSide * 0.45,
      -this.avoidanceSide * 0.45,
      this.avoidanceSide * 0.9,
      -this.avoidanceSide * 0.9,
      this.avoidanceSide * 1.4,
      -this.avoidanceSide * 1.4,
      Math.PI,
    ];
    const probeDistances = [
      Math.max(this.radius * 1.8, speed * dt * 2),
      Math.max(this.radius * 3.4, speed * dt * 4),
    ];
    let bestHeading: number | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const offset of offsets) {
      const heading = normalizeAngle(preferredAngle + offset);
      let isBlocked = false;

      for (const probeDistance of probeDistances) {
        const probe: Circle = {
          x: this.x + Math.sin(heading) * probeDistance,
          y: this.y - Math.cos(heading) * probeDistance,
          radius: this.radius + 4,
        };

        if (
          probe.x < this.radius ||
          probe.x > arenaWidth - this.radius ||
          probe.y < this.radius ||
          probe.y > arenaHeight - this.radius ||
          islands.some(island => circlePolygonCollision(probe, island))
        ) {
          isBlocked = true;
          break;
        }
      }

      if (isBlocked) continue;

      const sidePenalty = offset !== 0 && Math.sign(offset) !== this.avoidanceSide ? 3 : 0;
      const score = Math.abs(offset) * 100 + sidePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestHeading = heading;
      }
    }

    return bestHeading;
  }

  public takeDamage(amount: number): boolean {
    if (!this.active) return false;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.updateHealthBar();
    if (this.currentHealth <= 0) {
      this.beginDeath();
      return true;
    }
    return false;
  }

  public beginDeath(): void {
    if (!this.active) return;

    this.active = false;
    this.deathTimeRemaining = 3.0;
    this.healthBar.container.visible = false;
    this.damageSmoke.visible = false;
    if (this.muzzleFlash) this.muzzleFlash.visible = false;

    const wreckKey = this.type === 'CHASER' ? 'chaser_ship_wreck' : 'shooter_ship_wreck';
    this.sprite.texture = TextureManager.getInstance().getTexture(wreckKey);
    this.sprite.tint = 0xffffff;

    const textures = TextureManager.getInstance();
    for (let i = 0; i < 4; i++) {
      const crew = new Sprite(textures.getTexture(`crew_${i + 1}`));
      crew.anchor.set(0.5);
      crew.width = 10;
      crew.height = 10;
      crew.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 40);
      crew.rotation = Math.random() * Math.PI * 2;
      this.container.addChild(crew);

      const dir = Math.random() * Math.PI * 2;
      const speed = 14 + Math.random() * 18;
      this.wreckCrew.push({
        sprite: crew,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        spin: (Math.random() - 0.5) * 4,
      });
    }
  }

  private updateWreck(dt: number): void {
    this.effectTime += dt;
    this.deathTimeRemaining = Math.max(0, this.deathTimeRemaining - dt);
    this.y += dt * 5;
    this.angle += this.avoidanceSide * dt * 0.22;
    this.container.position.set(this.x, this.y);
    this.container.rotation = this.angle;

    for (const crew of this.wreckCrew) {
      crew.sprite.x += crew.vx * dt;
      crew.sprite.y += crew.vy * dt;
      crew.sprite.rotation += crew.spin * dt;
      crew.vx *= 1 - dt * 1.5;
      crew.vy *= 1 - dt * 1.5;
      crew.sprite.alpha = Math.min(1, this.deathTimeRemaining);
    }

    if (this.deathTimeRemaining <= 0) {
      this.readyToRemove = true;
    }
  }

  private updateDamageAppearance(): void {
    const healthRatio = this.currentHealth / this.maxHealth;
    this.damageSmoke.visible = healthRatio <= 0.65;
    this.sprite.tint = healthRatio <= 0.3 ? 0xb29a84 : healthRatio <= 0.65 ? 0xe2d1bd : 0xffffff;

    const texKey = healthRatio <= 0.65
      ? `${this.type === 'CHASER' ? 'chaser' : 'shooter'}_ship_damaged`
      : `${this.type === 'CHASER' ? 'chaser' : 'shooter'}_ship`;
    this.sprite.texture = TextureManager.getInstance().getTexture(texKey);
  }

  private updateHealthBar(): void {
    this.healthBar.update(this.currentHealth, this.maxHealth, false);
    this.updateDamageAppearance();
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
    this.deathTimeRemaining = 0;
    this.healthBar.destroy();
    if (this.container.parent) {
      this.container.parent.removeChild(this.container);
    }
    this.container.destroy({ children: true });
  }
}
