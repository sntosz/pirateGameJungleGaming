import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { MatchResult } from '../types/game';
import { loadPendingMatches, savePendingMatches } from '../services/storage';
import { useEffect, useState } from 'react';

export const QUERY_KEYS = {
  ranking: (page: number) => ['ranking', page],
  history: (playerId: string, page: number) => ['history', playerId, page],
};

export function useRanking(page: number = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.ranking(page),
    queryFn: () => apiService.getRanking(page, 10),
    staleTime: 5000,
  });
}

export function useMatchHistory(playerId: string, page: number = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.history(playerId, page),
    queryFn: () => apiService.getMatchHistory(playerId, page, 10),
    staleTime: 5000,
  });
}

export function useRegisterMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (match: MatchResult) => apiService.registerMatch(match),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);

  const syncPending = async () => {
    const pending = loadPendingMatches();
    if (pending.length === 0) {
      setPendingCount(0);
      return;
    }

    setPendingCount(pending.length);
    const remaining: MatchResult[] = [];

    for (const match of pending) {
      try {
        await apiService.registerMatch(match);
      } catch (err) {
        console.warn(`Failed to sync pending match ${match.id}:`, err);
        remaining.push(match);
      }
    }

    savePendingMatches(remaining);
    setPendingCount(remaining.length);

    if (remaining.length < pending.length) {
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  };

  useEffect(() => {
    syncPending();
    const handleOnline = () => syncPending();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return { syncPending, pendingCount };
}
