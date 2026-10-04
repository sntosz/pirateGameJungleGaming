import { GameConfig } from '../types/game';
import { Enemy, EnemyType } from './Enemy';
import { Polygon, Circle, circlePolygonCollision, distance } from './MathUtils';

export class SpawnManager {
  private readonly maxActiveEnemies = 8;
  private readonly minimumEnemySpacing = 110;
  private timer: number = 0;
  private config: GameConfig;
  private rng: () => number;

  constructor(config: GameConfig, rng?: () => number) {
    this.config = config;
    // Optional seeded RNG for reproducible tests via window.__pirateRng.
    this.rng =
      rng ??
      (typeof window !== 'undefined'
        ? ((window as unknown as Record<string, unknown>).__pirateRng as () => number)
        : undefined) ??
      Math.random;
    this.timer = config.enemySpawnInterval * 0.5;
  }

  public update(
    dt: number,
    playerPos: { x: number; y: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[],
    activeEnemies: readonly Enemy[],
    spawnEnemyCallback: (enemy: Enemy) => void
  ): void {
    this.timer += dt;

    if (this.timer < this.config.enemySpawnInterval) return;
    this.timer = 0;

    if (activeEnemies.length >= this.maxActiveEnemies) return;

    const spawnPos = this.findValidSpawnPoint(
      playerPos,
      arenaWidth,
      arenaHeight,
      islands,
      activeEnemies
    );
    if (spawnPos) {
      const isChaser = this.rng() < this.config.chaserSpawnRatio;
      const enemyType: EnemyType = isChaser ? 'CHASER' : 'SHOOTER';

      const enemy = new Enemy(spawnPos.x, spawnPos.y, enemyType, this.config);
      spawnEnemyCallback(enemy);
    }
  }

  private findValidSpawnPoint(
    playerPos: { x: number; y: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[],
    activeEnemies: readonly Enemy[]
  ): { x: number; y: number } | null {
    const margin = 50;
    const enemyRadius = 30;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rx = margin + this.rng() * (arenaWidth - margin * 2);
      const ry = margin + this.rng() * (arenaHeight - margin * 2);

      if (distance({ x: rx, y: ry }, playerPos) < this.config.spawnDistanceMin) {
        continue;
      }

      if (
        activeEnemies.some(enemy =>
          distance({ x: rx, y: ry }, enemy.getCircle()) < this.minimumEnemySpacing
        )
      ) {
        continue;
      }

      const circle: Circle = { x: rx, y: ry, radius: enemyRadius };
      let collidesWithIsland = false;
      for (const island of islands) {
        if (circlePolygonCollision(circle, island)) {
          collidesWithIsland = true;
          break;
        }
      }

      if (!collidesWithIsland) {
        return { x: rx, y: ry };
      }
    }

    return null;
  }

  public reset(): void {
    this.timer = this.config.enemySpawnInterval * 0.5;
  }
}
