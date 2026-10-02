import React from 'react';
import { MatchResult, PaginatedResponse } from '../types/game';
import { History, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface MatchHistoryTabProps {
  data?: PaginatedResponse<MatchResult>;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  page: number;
  onPageChange: (newPage: number) => void;
  onRefetch: () => void;
}

export const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({
  data,
  isLoading,
  isError,
  error,
  page,
  onPageChange,
  onRefetch,
}) => {
  return (
    <div className="space-y-6" data-testid="tab-match-history">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-7 h-7 text-pirate-gold" />
          <h2 className="text-xl font-black text-white tracking-wider uppercase">
            MATCH HISTORY
          </h2>
        </div>
        <button
          onClick={onRefetch}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-pirate-gold rounded-xl transition-colors border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pirate-gold"
          title="Refresh Match History"
          aria-label="Refresh Match History"
          data-testid="btn-refresh-history"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center space-y-3" data-testid="history-loading">
          <RefreshCw className="w-8 h-8 text-pirate-gold animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading match history...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-950/60 border border-red-500/80 p-6 rounded-2xl text-center space-y-3" data-testid="history-error">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-200 font-semibold text-sm">
            Failed to load match history: {error?.message || 'Network error'}
          </p>
          <button
            onClick={onRefetch}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="py-16 text-center bg-gray-800/40 rounded-2xl border border-gray-800" data-testid="history-empty">
          <p className="text-gray-400 font-medium">No matches recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-800">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-800/90 uppercase text-xs text-pirate-gold font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right">Duration</th>
                  <th className="px-4 py-3">Result Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 bg-gray-900/60 font-medium">
                {data.data.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(match.date).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-pirate-gold">
                      {match.score} pts
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{match.duration}s</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          match.endReason === 'TIME_EXPIRED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : match.endReason === 'PLAYER_DIED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {match.endReason === 'TIME_EXPIRED'
                          ? 'TIME EXPIRED'
                          : match.endReason === 'PLAYER_DIED'
                          ? 'PLAYER DIED'
                          : 'ABANDONED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-400 font-medium">
              Page {data.page} of {data.totalPages || 1} ({data.total} matches)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-pirate-gold rounded-xl transition-colors border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pirate-gold"
                aria-label="Previous Page"
                data-testid="btn-history-prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= data.totalPages}
                className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-pirate-gold rounded-xl transition-colors border border-gray-700 focus:outline-none focus:ring-2 focus:ring-pirate-gold"
                aria-label="Next Page"
                data-testid="btn-history-next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
