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
}

export class GameEngine {
  public app: Application;
  public config: GameConfig;
  public callbacks: GameEngineCallbacks;

  public arenaWidth: number = 1280;
  public arenaHeight: number = 720;

  public isRunning: boolean = false;
  public isPaused: boolean = false;

  private stage: Container;
  private gameLayer: Container;

  private player!: Player;
  private islands: Island[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private effectManager!: EffectManager;
  private spawnManager!: SpawnManager;

  private score: number = 0;
  private timeRemaining: number = 0;
  private elapsedTime: number = 0;

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

    containerElement.appendChild(this.app.canvas);

    await TextureManager.getInstance().preloadAssets();

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

    SoundManager.getInstance().startAmbience();
    SoundManager.getInstance().play('game_start');

    this.app.ticker.add(this.update, this);
    this.isRunning = true;
  }

  private setupBackground(): void {
    const waterTex = TextureManager.getInstance().getTexture('water_tile');
    const tilingSprite = new TilingSprite({
      texture: waterTex,
      width: this.arenaWidth,
      height: this.arenaHeight,
    });
    tilingSprite.alpha = 0.9;
    this.gameLayer.addChild(tilingSprite);
  }

  private setupIslands(): void {
    const island1 = new Island(320, 240, 85);
    const island2 = new Island(960, 480, 95);

    this.islands.push(island1, island2);
    this.gameLayer.addChild(island1.container);
    this.gameLayer.addChild(island2.container);
  }

  private setupInputs(): void {
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (!this.isRunning || this.isPaused) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.inputState.thrust = 1;
      if (code === 'KeyS' || code === 'ArrowDown') this.inputState.thrust = -1;
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
      if ((code === 'KeyS' || code === 'ArrowDown') && this.inputState.thrust === -1) this.inputState.thrust = 0;
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
      projs.forEach((p) => {
        this.projectiles.push(p);
        this.gameLayer.addChild(p.container);
      });
    }
  }

  private handleResize(): void {
    if (!this.app || !this.app.renderer) return;

    const screenWidth = this.app.renderer.width / (window.devicePixelRatio || 1);
    const screenHeight = this.app.renderer.height / (window.devicePixelRatio || 1);

    const scaleX = screenWidth / this.arenaWidth;
    const scaleY = screenHeight / this.arenaHeight;
    const scale = Math.min(scaleX, scaleY);

    this.gameLayer.scale.set(scale);
    this.gameLayer.position.set(
      (screenWidth - this.arenaWidth * scale) / 2,
      (screenHeight - this.arenaHeight * scale) / 2
    );
  }

  public pause(): void {
    this.isPaused = true;
    this.inputState.thrust = 0;
    this.inputState.turn = 0;
    SoundManager.getInstance().updateSailingSound(false);
  }

  public resume(): void {
    this.isPaused = false;
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

    const islandPolys = this.islands.map((i) => i.polygon);

    this.player.update(dt, this.inputState, this.arenaWidth, this.arenaHeight, islandPolys);

    this.spawnManager.update(
      dt,
      { x: this.player.x, y: this.player.y },
      this.arenaWidth,
      this.arenaHeight,
      islandPolys,
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

          enemy.destroy();
          this.enemies.splice(i, 1);

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
              enemy.destroy();
              this.enemies.splice(eIdx, 1);
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

    if (this.app) {
      this.app.ticker.remove(this.update, this);
      this.app.destroy(true, { children: true, texture: false });
    }
  }
}
