import React from 'react';
import { RankingEntry, PaginatedResponse } from '../types/game';
import { Star, RefreshCw, AlertCircle } from 'lucide-react';

interface RankingTabProps {
  data?: PaginatedResponse<RankingEntry>;
  playerId: string;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  page: number;
  onPageChange: (newPage: number) => void;
  onRefetch: () => void;
}

export const RankingTab: React.FC<RankingTabProps> = ({
  data,
  playerId,
  isLoading,
  isError,
  error,
  page,
  onPageChange,
  onRefetch,
}) => {
  const formatPlayedDate = (date: string): string => {
    const playedAt = new Date(date);
    if (Number.isNaN(playedAt.getTime())) return '--';

    const dateLabel = playedAt
      .toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      .replace('.', '')
      .toUpperCase();
    const timeLabel = playedAt.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return `${dateLabel} · ${timeLabel}`;
  };

  const roundButtonStyle = {
    backgroundImage: `url('/assets/png/default/ui/controls/button_round_normal.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    width: 44,
    height: 44,
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4" data-testid="tab-ranking">

      {isLoading ? (
        <div className="py-16 text-center space-y-3" data-testid="ranking-loading">
          <RefreshCw className="w-8 h-8 text-[#e8c35c] animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading global leaderboard...</p>
        </div>
      ) : isError ? (
        <div className="bg-[#141d2e]/80 border border-red-500/60 p-6 rounded-xl text-center space-y-3" data-testid="ranking-error">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-200 font-semibold text-sm">
            Failed to load ranking data: {error?.message || 'Network error'}
          </p>
          <button
            onClick={onRefetch}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="py-16 text-center" data-testid="ranking-empty">
          <p className="text-slate-400 font-medium">No ranking records found.</p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1">
            <div className="grid grid-cols-[0.6fr_1.8fr_1fr_1fr] px-5 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <span>Rank</span>
              <span>Captain</span>
              <span className="text-center">Points</span>
              <span className="text-right">Played</span>
            </div>

            <div className="space-y-2">
              {data.data.map((entry) => {
                const isCurrentPlayer = entry.playerId === playerId;

                return (
                  <div
                    key={`${entry.rank}-${entry.playerId}-${entry.score}`}
                    className={`grid grid-cols-[0.6fr_1.8fr_1fr_1fr] items-center rounded-lg px-5 py-3 text-sm font-medium ${
                      isCurrentPlayer ? 'bg-[#4a4a34]/70' : 'bg-[#141d2e]/80'
                    }`}
                  >
                    <span className="font-black text-[#e8c35c]">
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-2 font-bold text-slate-100">
                      {entry.rank === 1 && <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />}
                      {entry.playerName}
                      {isCurrentPlayer && (
                        <span className="rounded border border-amber-300/40 bg-amber-300/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-center font-black text-[#e8c35c]">{entry.score}</span>
                    <span className="text-right text-xs text-slate-300">
                      {formatPlayedDate(entry.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="flex items-center justify-center border-0 bg-transparent disabled:opacity-40 focus:outline-none"
              style={roundButtonStyle}
              aria-label="Previous Page"
              data-testid="btn-ranking-prev"
            >
              <img src="/assets/png/default/ui/controls/icon_turn_left.png" alt="previous" className="w-5 h-5 object-contain" />
            </button>
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#f1d8a0]">
              Page {data.page} of {data.totalPages || 1}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= data.totalPages}
              className="flex items-center justify-center border-0 bg-transparent disabled:opacity-40 focus:outline-none"
              style={roundButtonStyle}
              aria-label="Next Page"
              data-testid="btn-ranking-next"
            >
              <img src="/assets/png/default/ui/controls/icon_turn_right.png" alt="next" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
