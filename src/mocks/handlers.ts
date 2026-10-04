import { http, HttpResponse, delay } from 'msw';
import { MatchResult, RankingEntry, PaginatedResponse } from '../types/game';

const MOCK_STORAGE_KEY = 'pirate_battle_msw_db';

const INITIAL_FIXTURE_MATCHES: MatchResult[] = [
  {
    id: 'm-fix-1',
    playerId: 'p-101',
    playerName: 'Blackbeard',
    score: 28,
    duration: 90,
    date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    endReason: 'TIME_EXPIRED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  },
  {
    id: 'm-fix-2',
    playerId: 'p-102',
    playerName: 'Anne Bonny',
    score: 24,
    duration: 90,
    date: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    endReason: 'TIME_EXPIRED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  },
  {
    id: 'm-fix-3',
    playerId: 'p-103',
    playerName: 'Calico Jack',
    score: 20,
    duration: 85,
    date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    endReason: 'PLAYER_DIED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  },
  {
    id: 'm-fix-4',
    playerId: 'p-104',
    playerName: 'Captain Kidd',
    score: 18,
    duration: 90,
    date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    endReason: 'TIME_EXPIRED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  },
  {
    id: 'm-fix-5',
    playerId: 'p-105',
    playerName: 'Sir Francis Drake',
    score: 15,
    duration: 72,
    date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    endReason: 'PLAYER_DIED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  },
  ...[
    ['Henry Morgan', 13],
    ['Mary Read', 11],
    ['Bartholomew Roberts', 9],
    ['Charles Vane', 8],
    ['Edward Teach', 6],
    ['Stede Bonnet', 4],
    ['William Kidd', 2],
  ].map(([name, score], i): MatchResult => ({
    id: `m-fix-${6 + i}`,
    playerId: `p-1${6 + i}`,
    playerName: name as string,
    score: score as number,
    duration: 90,
    date: new Date(Date.now() - 3600000 * (12 + i)).toISOString(),
    endReason: 'TIME_EXPIRED',
    config: { sessionTime: 90, enemySpawnInterval: 3 } as any,
    status: 'SYNCED',
  })),
  // Fixtures for other common configurations so the ranking isn't empty when
  // the player changes Options (ranking only compares same-config matches).
  ...[60, 120, 150, 180].flatMap((sessionTime) =>
    [1, 2, 5, 7, 10].flatMap((enemySpawnInterval, ci) =>
      ['Anne Bonny', 'Calico Jack', 'Captain Kidd', 'Mary Read', 'Henry Morgan', 'Charles Vane', 'Stede Bonnet', 'William Kidd']
        .map((name, pi) => ({
          id: `m-fix-c${sessionTime}-${enemySpawnInterval}-${pi}`,
          playerId: `p-c${sessionTime}-${enemySpawnInterval}-${pi}`,
          playerName: name,
          score: 24 - pi * 2 - ci,
          duration: sessionTime,
          date: new Date(Date.now() - 3600000 * (30 + ci * 8 + pi)).toISOString(),
          endReason: 'TIME_EXPIRED' as const,
          config: { sessionTime, enemySpawnInterval } as any,
          status: 'SYNCED' as const,
        }))
    )
  ),
];

function getStoredMatches(): MatchResult[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as MatchResult[];
      // Merge any fixtures added after the user's DB was created.
      const missing = INITIAL_FIXTURE_MATCHES.filter(
        (f) => !stored.some((m) => m.id === f.id)
      );
      if (missing.length > 0) {
        const merged = [...stored, ...missing];
        saveStoredMatches(merged);
        return merged;
      }
      return stored;
    }
  } catch {
    // fallback
  }
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_FIXTURE_MATCHES));
  return INITIAL_FIXTURE_MATCHES;
}

function saveStoredMatches(matches: MatchResult[]) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(matches));
  } catch (err) {
    console.error('Failed to save MSW database:', err);
  }
}

export const MSW_SCENARIOS = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'EMPTY', label: 'Empty Lists' },
  { value: 'DELAYED', label: 'High Latency (1.5s)' },
  { value: 'FLAKY', label: 'Flaky / Variable Latency' },
  { value: 'TIMEOUT', label: 'Timeout (All APIs)' },
  { value: 'POST_TIMEOUT', label: 'Timeout on Match Register' },
  { value: 'ERROR_400', label: 'Client Error (400)' },
  { value: 'ERROR_500', label: 'Server Error (500)' },
  { value: 'RANKING_ERROR', label: 'Ranking API Down' },
  { value: 'HISTORY_ERROR', label: 'History API Down' },
  { value: 'ASSET_FAIL', label: 'Asset Loading Failure' },
] as const;

const SCENARIO_KEY = 'pirate_battle_msw_scenario';

let activeScenario: string = (() => {
  try {
    return localStorage.getItem(SCENARIO_KEY) || 'SUCCESS';
  } catch {
    return 'SUCCESS';
  }
})();

export function setMswScenario(scenario: string) {
  activeScenario = scenario;
  try {
    localStorage.setItem(SCENARIO_KEY, scenario);
  } catch {
    // storage unavailable
  }
}

export function getMswScenario(): string {
  return activeScenario;
}

export function resetMswDatabase() {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_FIXTURE_MATCHES));
}

// Test/demo hooks: allow Playwright and QA to switch scenarios and reset the
// mock database directly from the page context.
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  w.__setMswScenario = setMswScenario;
  w.__resetMswDatabase = resetMswDatabase;
}

/** Applies scenario behavior before handling an endpoint. Returns a Response if the request was handled by the scenario. */
async function applyScenario(endpoint: 'ranking' | 'history' | 'matches'): Promise<Response | null> {
  switch (activeScenario) {
    case 'DELAYED':
      await delay(1500);
      return null;
    case 'FLAKY':
      // Variable latency; occasionally out-of-order-ish timing for parallel calls.
      await delay(200 + Math.random() * 1800);
      return null;
    case 'TIMEOUT':
      await delay(9000);
      return new HttpResponse(null, { status: 504, statusText: 'Gateway Timeout' });
    case 'POST_TIMEOUT':
      if (endpoint === 'matches') {
        await delay(9000);
        return new HttpResponse(null, { status: 504, statusText: 'Gateway Timeout' });
      }
      return null;
    case 'ERROR_400':
      return HttpResponse.json({ message: 'Bad Request' }, { status: 400 });
    case 'ERROR_500':
      return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    case 'RANKING_ERROR':
      if (endpoint === 'ranking') {
        return HttpResponse.json({ message: 'Ranking service unavailable' }, { status: 503 });
      }
      return null;
    case 'HISTORY_ERROR':
      if (endpoint === 'history') {
        return HttpResponse.json({ message: 'History service unavailable' }, { status: 503 });
      }
      return null;
    default:
      return null;
  }
}

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const sessionTime = url.searchParams.get('sessionTime');
    const spawnInterval = url.searchParams.get('enemySpawnInterval');

    const scenarioResponse = await applyScenario('ranking');
    if (scenarioResponse) return scenarioResponse;

    if (activeScenario === 'EMPTY') {
      const emptyRes: PaginatedResponse<RankingEntry> = {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
      return HttpResponse.json(emptyRes);
    }

    let allMatches = getStoredMatches();

    // Only compare matches played under the same gameplay configuration.
    if (sessionTime !== null && spawnInterval !== null) {
      allMatches = allMatches.filter(
        (m) =>
          m.config?.sessionTime === Number(sessionTime) &&
          m.config?.enemySpawnInterval === Number(spawnInterval)
      );
    }

    const sorted = [...allMatches].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.duration !== b.duration) return a.duration - b.duration;
      if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
      return a.playerId.localeCompare(b.playerId);
    });

    const rankingEntries: RankingEntry[] = sorted.map((m, idx) => ({
      rank: idx + 1,
      playerId: m.playerId,
      playerName: m.playerName,
      score: m.score,
      duration: m.duration,
      date: m.date,
    }));

    const startIndex = (page - 1) * pageSize;
    const paginatedData = rankingEntries.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(rankingEntries.length / pageSize) || 1;

    const response: PaginatedResponse<RankingEntry> = {
      data: paginatedData,
      total: rankingEntries.length,
      page,
      pageSize,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  http.get('/api/history', async ({ request }) => {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

    const scenarioResponse = await applyScenario('history');
    if (scenarioResponse) return scenarioResponse;

    if (activeScenario === 'EMPTY') {
      const emptyRes: PaginatedResponse<MatchResult> = {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
      return HttpResponse.json(emptyRes);
    }

    const allMatches = getStoredMatches();
    const playerMatches = playerId
      ? allMatches.filter((m) => m.playerId === playerId)
      : allMatches;

    playerMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const startIndex = (page - 1) * pageSize;
    const paginatedData = playerMatches.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(playerMatches.length / pageSize) || 1;

    const response: PaginatedResponse<MatchResult> = {
      data: paginatedData,
      total: playerMatches.length,
      page,
      pageSize,
      totalPages,
    };

    return HttpResponse.json(response);
  }),

  http.post('/api/matches', async ({ request }) => {
    const scenarioResponse = await applyScenario('matches');
    if (scenarioResponse) return scenarioResponse;

    const newMatch = (await request.json()) as MatchResult;
    const allMatches = getStoredMatches();

    const existingIndex = allMatches.findIndex((m) => m.id === newMatch.id);
    if (existingIndex !== -1) {
      return HttpResponse.json({ ...allMatches[existingIndex], status: 'SYNCED' });
    }

    const confirmedMatch: MatchResult = {
      ...newMatch,
      status: 'SYNCED',
    };

    allMatches.push(confirmedMatch);
    saveStoredMatches(allMatches);

    return HttpResponse.json(confirmedMatch, { status: 201 });
  }),

  // ASSET_FAIL scenario: forces game asset requests to fail so asset
  // loading error/retry handling can be exercised reproducibly.
  http.get('/assets/png/*', async () => {
    if (activeScenario === 'ASSET_FAIL') {
      return new HttpResponse(null, { status: 500, statusText: 'Simulated Asset Failure' });
    }
    return;
  }),
];
