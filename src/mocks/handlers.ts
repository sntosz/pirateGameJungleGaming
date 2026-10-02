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
];

function getStoredMatches(): MatchResult[] {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
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

let activeScenario: string = 'SUCCESS';

export function setMswScenario(scenario: string) {
  activeScenario = scenario;
}

export function getMswScenario(): string {
  return activeScenario;
}

export function resetMswDatabase() {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_FIXTURE_MATCHES));
}

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);

    if (activeScenario === 'DELAYED') {
      await delay(1500);
    } else if (activeScenario === 'TIMEOUT') {
      await delay(9000);
      return new HttpResponse(null, { status: 504, statusText: 'Gateway Timeout' });
    } else if (activeScenario === 'ERROR_500') {
      return new HttpResponse(JSON.stringify({ message: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    const allMatches = getStoredMatches();

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

    if (activeScenario === 'DELAYED') {
      await delay(1500);
    } else if (activeScenario === 'TIMEOUT') {
      await delay(9000);
      return new HttpResponse(null, { status: 504, statusText: 'Gateway Timeout' });
    } else if (activeScenario === 'ERROR_500') {
      return new HttpResponse(JSON.stringify({ message: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    if (activeScenario === 'DELAYED') {
      await delay(1500);
    } else if (activeScenario === 'TIMEOUT') {
      await delay(9000);
      return new HttpResponse(null, { status: 504, statusText: 'Gateway Timeout' });
    } else if (activeScenario === 'ERROR_500') {
      return new HttpResponse(JSON.stringify({ message: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
];
