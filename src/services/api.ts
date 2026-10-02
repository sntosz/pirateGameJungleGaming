import axios from 'axios';
import { MatchResult, RankingEntry, PaginatedResponse } from '../types/game';

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  getRanking: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<RankingEntry>> => {
    const res = await apiClient.get<PaginatedResponse<RankingEntry>>('/ranking', {
      params: { page, pageSize },
    });
    return res.data;
  },

  getMatchHistory: async (
    playerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<MatchResult>> => {
    const res = await apiClient.get<PaginatedResponse<MatchResult>>('/history', {
      params: { playerId, page, pageSize },
    });
    return res.data;
  },

  registerMatch: async (match: MatchResult): Promise<MatchResult> => {
    const res = await apiClient.post<MatchResult>('/matches', match);
    return res.data;
  },
};
