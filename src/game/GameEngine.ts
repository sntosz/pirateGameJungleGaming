import { Application, Container, TilingSprite } from 'pixi.js';
import { GameConfig, EndReason } from '../types/game';
import { TextureManager } from './TextureManager';
import { SoundManager } from './SoundManager';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Island } from './Island';
import { Projectile } from './Projectile';
import { EffectManager } from './EffectManager';
import { SpawnManager } from './SpawnManager';
import { circleCircleCollision, circlePolygonCollision } from './MathUtils';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: {
    score: number;
    playerHp: number;
    playerMaxHp: number;
    timeRemaining: number;
    frontCooldown: number;
    leftCooldown: number;
    rightCooldown: number;
  }) => void;
  onGameOver: (result: { score: number; duration: number; endReason: EndReason }) => void;
  onAutoPause?: () => void;
  onLoadProgress?: (progress: number) => void;
}

export class GameEngine {
  public app: Application;
  public config: GameConfig;
  public callbacks: GameEngineCallbacks;

  public arenaWidth: number = 1280;
  public arenaHeight: number = 720;

  public isRunning: boolean = false;
  public isPaused: boolean = false;
  private isDestroyed: boolean = false;
  private isInitialized: boolean = false;

  private stage: Container;
  private gameLayer: Container;
  private screenWater!: TilingSprite;

  private player!: Player;
  private islands: Island[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private effectManager!: EffectManager;
  private spawnManager!: SpawnManager;

  private score: number = 0;
  private timeRemaining: number = 0;
  private elapsedTime: number = 0;
  private shotsFired: number = 0;

  private inputState = {
    thrust: 0,
    turn: 0,
    fireFront: false,
    fireLeft: false,
    fireRight: false,
  };

  private boundKeyDown!: (e: KeyboardEvent) => void;
  private boundKeyUp!: (e: KeyboardEvent) => void;
  private boundBlur!: () => void;
  private boundVisibilityChange!: () => void;
  private boundResize!: () => void;

  constructor(config: GameConfig, callbacks: GameEngineCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
    this.timeRemaining = config.sessionTime;

    this.app = new Application();
    this.stage = this.app.stage;
    this.gameLayer = new Container();
  }

  public async init(containerElement: HTMLDivElement): Promise<void> {
    await this.app.init({
      resizeTo: containerElement,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: 0x1b4d6e,
    });

    this.isInitialized = true;
    if (this.isDestroyed) {
      this.app.destroy(true, { children: true, texture: false });
      return;
    }

    containerElement.appendChild(this.app.canvas);

    await TextureManager.getInstance().preloadAssets(this.callbacks.onLoadProgress);
    if (this.isDestroyed) return;

    this.stage.addChild(this.gameLayer);

    this.setupBackground();
    this.setupIslands();

    this.effectManager = new EffectManager();
    this.gameLayer.addChild(this.effectManager.container);

    this.spawnManager = new SpawnManager(this.config);

    this.player = new Player(this.arenaWidth / 2, this.arenaHeight / 2, this.config);
    this.gameLayer.addChild(this.player.container);

    this.setupInputs();
    this.handleResize();
    this.app.renderer.on('resize', this.handleResize, this);

    SoundManager.getInstance().startAmbience();
    SoundManager.getInstance().play('game_start');

    this.app.ticker.add(this.update, this);
    this.isRunning = true;

    // Test instrumentation hooks (read-only state + deterministic controls).
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__pirateEngine = this;
    }
  }

  /** Test/debug: snapshot of internal simulation state. */
  public debugGetState() {
    return {
      score: this.score,
      timeRemaining: this.timeRemaining,
      elapsedTime: this.elapsedTime,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      player: this.player
        ? {
            x: this.player.x,
            y: this.player.y,
            rotation: this.player.angle,
            hp: this.player.currentHealth,
            frontCooldown: this.player.frontCooldownTimer,
            leftCooldown: this.player.leftBroadsideCooldownTimer,
            rightCooldown: this.player.rightBroadsideCooldownTimer,
          }
        : null,
      enemies: this.enemies.map((e) => ({ x: e.x, y: e.y, type: e.type, hp: e.currentHealth })),
      projectileCount: this.projectiles.length,
      shotsFired: this.shotsFired,
    };
  }

  /** Test/debug: fast-forward the match clock. */
  public debugSetTimeRemaining(seconds: number): void {
    this.timeRemaining = Math.max(0, seconds);
  }

  private setupBackground(): void {
    const waterTex = TextureManager.getInstance().getTexture('water_tile');

    this.screenWater = new TilingSprite({
      texture: waterTex,
      width: this.app.screen.width,
      height: this.app.screen.height,
    });
    this.screenWater.alpha = 0.9;
    this.stage.addChildAt(this.screenWater, 0);

    const tilingSprite = new TilingSprite({
      texture: waterTex,
      width: this.arenaWidth,
      height: this.arenaHeight,
    });
    tilingSprite.alpha = 0.9;
    this.gameLayer.addChild(tilingSprite);
  }

  private setupIslands(): void {
    // Hand-crafted archipelago: a fortified island (NW), an island chain
    // forming a channel on the east, southern reefs and scattered islets.
    const islandLayout = [
      { x: 255, y: 170, radius: 160, v: 5 },  // Fort island
      { x: 445, y: 110, radius: 48, v: 1 },   // Fort satellite islets
      { x: 140, y: 315, radius: 42, v: 2 },
      { x: 1080, y: 125, radius: 72, v: 0 },  // Eastern island chain (NE → SE arc)
      { x: 1162, y: 252, radius: 50, v: 3 },
      { x: 1135, y: 385, radius: 62, v: 1 },
      { x: 1050, y: 512, radius: 46, v: 2 },
      { x: 250, y: 565, radius: 118, v: 3 },  // Southern island
      { x: 430, y: 625, radius: 52, v: 0 },
      { x: 660, y: 175, radius: 28, v: 4 },   // Reef rocks (navigational hazards)
      { x: 620, y: 555, radius: 32, v: 4 },
      { x: 750, y: 600, radius: 24, v: 4 },
    ];

    this.islands = islandLayout.map(({ x, y, radius, v }) =>
      new Island(x, y, radius, undefined, v)
    );
    this.islands.forEach(island => this.gameLayer.addChild(island.container));
  }

  private setupInputs(): void {
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isPaused) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.inputState.thrust = 1;
      if (code === 'KeyA' || code === 'ArrowLeft') this.inputState.turn = -1;
      if (code === 'KeyD' || code === 'ArrowRight') this.inputState.turn = 1;

      if (code === 'Space' || code === 'KeyI') {
        this.triggerFrontFire();
      }
      if (code === 'KeyQ' || code === 'KeyU') {
        this.triggerLeftBroadside();
      }
      if (code === 'KeyE' || code === 'KeyO') {
        this.triggerRightBroadside();
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if ((code === 'KeyW' || code === 'ArrowUp') && this.inputState.thrust === 1) this.inputState.thrust = 0;
      if ((code === 'KeyA' || code === 'ArrowLeft') && this.inputState.turn === -1) this.inputState.turn = 0;
      if ((code === 'KeyD' || code === 'ArrowRight') && this.inputState.turn === 1) this.inputState.turn = 0;
    };

    this.boundBlur = () => {
      if (this.isRunning && !this.isPaused) {
        this.pause();
        if (this.callbacks.onAutoPause) {
          this.callbacks.onAutoPause();
        }
      }
    };

    this.boundVisibilityChange = () => {
      if (document.hidden && this.isRunning && !this.isPaused) {
        this.pause();
        if (this.callbacks.onAutoPause) {
          this.callbacks.onAutoPause();
        }
      }
    };

    this.boundResize = () => {
      this.handleResize();
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
    document.addEventListener('visibilitychange', this.boundVisibilityChange);
    window.addEventListener('resize', this.boundResize);
  }

  public setTouchInputs(thrust: number, turn: number) {
    if (!this.isRunning || this.isPaused) return;
    this.inputState.thrust = thrust;
    this.inputState.turn = turn;
  }

  public triggerFrontFire() {
    if (!this.isRunning || this.isPaused) return;
    const projs = this.player.fireFront();
    if (projs) {
      this.shotsFired += projs.length;
      projs.forEach((p) => {
        this.projectiles.push(p);
        this.gameLayer.addChild(p.container);
      });
    }
  }

  public triggerLeftBroadside() {
    if (!this.isRunning || this.isPaused) return;
    const projs = this.player.fireLeftBroadside();
    if (projs) {
      this.shotsFired += projs.length;
      projs.forEach((p) => {
        this.projectiles.push(p);
        this.gameLayer.addChild(p.container);
      });
    }
  }

  public triggerRightBroadside() {
    if (!this.isRunning || this.isPaused) return;
    const projs = this.player.fireRightBroadside();
    if (projs) {
      this.shotsFired += projs.length;
      projs.forEach((p) => {
        this.projectiles.push(p);
        this.gameLayer.addChild(p.container);
      });
    }
  }

  private handleResize(): void {
    if (!this.app || !this.app.renderer) return;

    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;

    if (this.screenWater) {
      this.screenWater.width = screenWidth;
      this.screenWater.height = screenHeight;
    }

    const scaleX = screenWidth / this.arenaWidth;
    const scaleY = screenHeight / this.arenaHeight;
    const scale = Math.min(scaleX, scaleY);

    this.gameLayer.scale.set(scale);
    this.gameLayer.position.set(
      (screenWidth - this.arenaWidth * scale) / 2,
      (screenHeight - this.arenaHeight * scale) / 2
    );
  }

  private timeWarningPlayed: boolean = false;
  private healthWarningPlayed: boolean = false;

  public pause(): void {
    this.isPaused = true;
    this.inputState.thrust = 0;
    this.inputState.turn = 0;
    SoundManager.getInstance().updateSailingSound(false);
    SoundManager.getInstance().play('game_pause', 0.7);
  }

  public resume(): void {
    this.isPaused = false;
    SoundManager.getInstance().play('game_resume', 0.7);
  }

  private update(): void {
    if (!this.isRunning || this.isPaused) return;

    const dt = Math.min(this.app.ticker.deltaMS / 1000, 0.1);

    this.elapsedTime += dt;
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);

    if (this.timeRemaining <= 0) {
      this.endGame('TIME_EXPIRED');
      return;
    }

    if (this.timeRemaining <= 10 && !this.timeWarningPlayed) {
      this.timeWarningPlayed = true;
      SoundManager.getInstance().play('time_warning');
    }

    const hpRatio = this.player.currentHealth / this.player.maxHealth;
    if (hpRatio <= 0.3 && !this.healthWarningPlayed) {
      this.healthWarningPlayed = true;
      SoundManager.getInstance().play('health_low');
    } else if (hpRatio > 0.3) {
      this.healthWarningPlayed = false;
    }

    const islandPolys = this.islands.map((i) => i.polygon);

    this.player.update(dt, this.inputState, this.arenaWidth, this.arenaHeight, islandPolys);

    this.spawnManager.update(
      dt,
      { x: this.player.x, y: this.player.y },
      this.arenaWidth,
      this.arenaHeight,
      islandPolys,
      this.enemies,
      (enemy) => {
        this.enemies.push(enemy);
        this.gameLayer.addChild(enemy.container);
      }
    );

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const shooterProj = enemy.update(
        dt,
        { x: this.player.x, y: this.player.y },
        this.arenaWidth,
        this.arenaHeight,
        islandPolys
      );

      if (enemy.readyToRemove) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      if (shooterProj) {
        this.projectiles.push(shooterProj);
        this.gameLayer.addChild(shooterProj.container);
        SoundManager.getInstance().play('cannon_fire', 0.6);
      }

      if (enemy.type === 'CHASER' && enemy.active) {
        if (circleCircleCollision(this.player.getCircle(), enemy.getCircle())) {
          this.player.takeDamage(this.config.chaserDamage);
          this.effectManager.createExplosion(enemy.x, enemy.y, 1.2);
          SoundManager.getInstance().play('explosion');
          SoundManager.getInstance().play('ship_collision');

          enemy.beginDeath();

          if (this.player.currentHealth <= 0) {
            this.endGame('PLAYER_DIED');
            return;
          }
        }
      }
    }

    for (let pIdx = this.projectiles.length - 1; pIdx >= 0; pIdx--) {
      const proj = this.projectiles[pIdx];
      proj.update(dt);

      if (!proj.active) {
        proj.destroy();
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      if (
        proj.x < 0 ||
        proj.x > this.arenaWidth ||
        proj.y < 0 ||
        proj.y > this.arenaHeight
      ) {
        this.effectManager.createWaterHit(proj.x, proj.y);
        SoundManager.getInstance().play('water_hit', 0.4);
        proj.destroy();
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      let hitIsland = false;
      for (const islandPoly of islandPolys) {
        if (circlePolygonCollision(proj.getCircle(), islandPoly)) {
          hitIsland = true;
          break;
        }
      }
      if (hitIsland) {
        this.effectManager.createWaterHit(proj.x, proj.y);
        SoundManager.getInstance().play('water_hit', 0.5);
        proj.destroy();
        this.projectiles.splice(pIdx, 1);
        continue;
      }

      if (proj.owner === 'player') {
        for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
          const enemy = this.enemies[eIdx];
          if (enemy.active && circleCircleCollision(proj.getCircle(), enemy.getCircle())) {
            const destroyed = enemy.takeDamage(proj.damage);
            this.effectManager.createExplosion(proj.x, proj.y, 0.6);

            if (destroyed) {
              this.score += 1;
              SoundManager.getInstance().play('score_point');
              SoundManager.getInstance().play('explosion');
              this.effectManager.createExplosion(enemy.x, enemy.y, 1.0);
            }

            proj.destroy();
            this.projectiles.splice(pIdx, 1);
            break;
          }
        }
      } else if (proj.owner === 'enemy') {
        if (circleCircleCollision(proj.getCircle(), this.player.getCircle())) {
          this.player.takeDamage(proj.damage);
          this.effectManager.createExplosion(proj.x, proj.y, 0.6);

          proj.destroy();
          this.projectiles.splice(pIdx, 1);

          if (this.player.currentHealth <= 0) {
            this.endGame('PLAYER_DIED');
            return;
          }
        }
      }
    }

    this.effectManager.update(dt);

    this.callbacks.onStatsUpdate({
      score: this.score,
      playerHp: this.player.currentHealth,
      playerMaxHp: this.player.maxHealth,
      timeRemaining: Math.ceil(this.timeRemaining),
      frontCooldown: this.player.frontCooldownTimer,
      leftCooldown: this.player.leftBroadsideCooldownTimer,
      rightCooldown: this.player.rightBroadsideCooldownTimer,
    });
  }

  public endGame(endReason: EndReason): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    SoundManager.getInstance().updateSailingSound(false);

    if (endReason === 'PLAYER_DIED') {
      SoundManager.getInstance().play('ship_sinking');
      SoundManager.getInstance().play('game_over');
    } else {
      SoundManager.getInstance().play('game_complete');
    }

    this.callbacks.onGameOver({
      score: this.score,
      duration: Math.round(this.elapsedTime),
      endReason,
    });
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isRunning = false;

    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
    window.removeEventListener('resize', this.boundResize);

    SoundManager.getInstance().stopAmbience();

    if (this.player) this.player.destroy();
    this.enemies.forEach((e) => e.destroy());
    this.islands.forEach((i) => i.destroy());
    this.projectiles.forEach((p) => p.destroy());
    if (this.effectManager) this.effectManager.clear();

    this.enemies = [];
    this.islands = [];
    this.projectiles = [];

    if (this.isInitialized) {
      this.app.renderer.off('resize', this.handleResize, this);
      this.app.ticker.remove(this.update, this);
      this.app.destroy(true, { children: true, texture: false });
    }
  }
}
