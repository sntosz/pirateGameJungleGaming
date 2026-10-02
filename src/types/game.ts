export interface GameConfig {
  sessionTime: number; // Duration in seconds (60 to 180)
  enemySpawnInterval: number; // Spawn interval in seconds (positive)

  playerMaxHealth: number;
  playerMoveSpeed: number;
  playerTurnSpeed: number;

  frontCannonCooldown: number;
  frontCannonDamage: number;
  frontCannonSpeed: number;
  frontCannonRange: number;

  broadsideCooldown: number;
  broadsideDamage: number;
  broadsideSpeed: number;
  broadsideRange: number;

  chaserHealth: number;
  chaserSpeed: number;
  chaserTurnSpeed: number;
  chaserDamage: number;

  shooterHealth: number;
  shooterSpeed: number;
  shooterTurnSpeed: number;
  shooterAttackRange: number;
  shooterCooldown: number;
  shooterDamage: number;
  shooterProjectileSpeed: number;

  spawnDistanceMin: number;
  chaserSpawnRatio: number;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  sessionTime: 90,
  enemySpawnInterval: 3,

  playerMaxHealth: 100,
  playerMoveSpeed: 180,
  playerTurnSpeed: 2.2,

  frontCannonCooldown: 0.5,
  frontCannonDamage: 25,
  frontCannonSpeed: 400,
  frontCannonRange: 550,

  broadsideCooldown: 1.5,
  broadsideDamage: 20,
  broadsideSpeed: 350,
  broadsideRange: 450,

  chaserHealth: 30,
  chaserSpeed: 150,
  chaserTurnSpeed: 2.5,
  chaserDamage: 30,

  shooterHealth: 40,
  shooterSpeed: 110,
  shooterTurnSpeed: 1.8,
  shooterAttackRange: 320,
  shooterCooldown: 2.0,
  shooterDamage: 15,
  shooterProjectileSpeed: 300,

  spawnDistanceMin: 350,
  chaserSpawnRatio: 0.5,
};

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type EndReason = 'TIME_EXPIRED' | 'PLAYER_DIED' | 'ABANDONED';

export interface MatchResult {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  duration: number;
  date: string;
  endReason: EndReason;
  config: GameConfig;
  status?: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface RankingEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  duration: number;
  date: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
