import { GameConfig } from '../types/game';
import { Enemy, EnemyType } from './Enemy';
import { Polygon, Circle, circlePolygonCollision, distance } from './MathUtils';

export class SpawnManager {
  private timer: number = 0;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.timer = config.enemySpawnInterval * 0.5;
  }

  public update(
    dt: number,
    playerPos: { x: number; y: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[],
    spawnEnemyCallback: (enemy: Enemy) => void
  ): void {
    this.timer += dt;

    if (this.timer >= this.config.enemySpawnInterval) {
      this.timer = 0;

      const spawnPos = this.findValidSpawnPoint(playerPos, arenaWidth, arenaHeight, islands);
      if (spawnPos) {
        const isChaser = Math.random() < this.config.chaserSpawnRatio;
        const enemyType: EnemyType = isChaser ? 'CHASER' : 'SHOOTER';

        const enemy = new Enemy(spawnPos.x, spawnPos.y, enemyType, this.config);
        spawnEnemyCallback(enemy);
      }
    }
  }

  private findValidSpawnPoint(
    playerPos: { x: number; y: number },
    arenaWidth: number,
    arenaHeight: number,
    islands: Polygon[]
  ): { x: number; y: number } | null {
    const margin = 50;
    const enemyRadius = 30;
    const maxAttempts = 30;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rx = margin + Math.random() * (arenaWidth - margin * 2);
      const ry = margin + Math.random() * (arenaHeight - margin * 2);

      if (distance({ x: rx, y: ry }, playerPos) < this.config.spawnDistanceMin) {
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
