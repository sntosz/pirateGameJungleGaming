import { GameConfig, DEFAULT_GAME_CONFIG, MatchResult } from '../types/game';

const CONFIG_KEY = 'pirate_battle_config';
const PLAYER_NAME_KEY = 'pirate_battle_player_name';
const LAST_RESULT_KEY = 'pirate_battle_last_result';
const PENDING_MATCHES_KEY = 'pirate_battle_pending_matches';

export function loadGameConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GAME_CONFIG,
        ...parsed,
        sessionTime: Math.max(60, Math.min(180, parsed.sessionTime || DEFAULT_GAME_CONFIG.sessionTime)),
        enemySpawnInterval: Math.max(1, Math.min(20, parsed.enemySpawnInterval || DEFAULT_GAME_CONFIG.enemySpawnInterval)),
      };
    }
  } catch (err) {
    console.error('Failed to load game config from localStorage:', err);
  }
  return { ...DEFAULT_GAME_CONFIG };
}

export function saveGameConfig(config: GameConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save game config to localStorage:', err);
  }
}

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY) || 'Captain Jack';
  } catch {
    return 'Captain Jack';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_KEY, name.trim() || 'Captain Jack');
  } catch (err) {
    console.error('Failed to save player name:', err);
  }
}

export function loadLastMatchResult(): MatchResult | null {
  try {
    const raw = localStorage.getItem(LAST_RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastMatchResult(result: MatchResult): void {
  try {
    localStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));
  } catch (err) {
    console.error('Failed to save last result:', err);
  }
}

export function loadPendingMatches(): MatchResult[] {
  try {
    const raw = localStorage.getItem(PENDING_MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingMatches(matches: MatchResult[]): void {
  try {
    localStorage.setItem(PENDING_MATCHES_KEY, JSON.stringify(matches));
  } catch (err) {
    console.error('Failed to save pending matches:', err);
  }
}
