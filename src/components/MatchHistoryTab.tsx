import React from 'react';
import { MatchResult, PaginatedResponse } from '../types/game';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface MatchHistoryTabProps {
  data?: PaginatedResponse<MatchResult>;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  page: number;
  onPageChange: (newPage: number) => void;
  onRefetch: () => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} · ${time}`;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const resultLabel = (match: MatchResult) =>
  match.endReason === 'TIME_EXPIRED'
    ? { text: 'TIME UP', className: 'text-[#e8c35c]' }
    : match.endReason === 'PLAYER_DIED'
    ? { text: 'DEFEATED', className: 'text-[#e0655a]' }
    : { text: 'ABANDONED', className: 'text-slate-400' };

export const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({
  data,
  isLoading,
  isError,
  error,
  page,
  onPageChange,
  onRefetch,
}) => {
  const roundButtonStyle = {
    backgroundImage: `url('/assets/png/default/ui/controls/button_round_normal.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    width: 44,
    height: 44,
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col space-y-4" data-testid="tab-match-history">

      {isLoading ? (
        <div className="py-16 text-center space-y-3" data-testid="history-loading">
          <RefreshCw className="w-8 h-8 text-[#e8c35c] animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading match history...</p>
        </div>
      ) : isError ? (
        <div className="bg-[#141d2e]/80 border border-red-500/60 p-6 rounded-xl text-center space-y-3" data-testid="history-error">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-200 font-semibold text-sm">
            Failed to load match history: {error?.message || 'Network error'}
          </p>
          <button
            onClick={onRefetch}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : !data || data.data.length === 0 ? (
        <div className="py-16 text-center" data-testid="history-empty">
          <p className="text-slate-400 font-medium">No matches recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] px-5 pb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <span>Date</span>
              <span className="text-center">Points</span>
              <span className="text-center">Duration</span>
              <span className="text-center">Result</span>
            </div>

            <div className="space-y-2">
              {data.data.map((match, idx) => {
                const result = resultLabel(match);
                return (
                  <div
                    key={match.id}
                    className={`grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center rounded-lg px-5 py-3 text-sm font-medium ${
                      idx === 0 ? 'bg-[#4a4a34]/70' : 'bg-[#141d2e]/80'
                    }`}
                  >
                    <span className="text-slate-200">{formatDate(match.date)}</span>
                    <span className="text-center font-black text-[#e8c35c]">{match.score}</span>
                    <span className="text-center text-slate-200">{formatDuration(match.duration)}</span>
                    <span className={`text-center font-bold uppercase tracking-wider ${result.className}`}>
                      {result.text}
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
              data-testid="btn-history-prev"
            >
              <img src="/assets/png/default/ui/controls/icon_turn_left.png" alt="Previous Page" className="w-5 h-5 object-contain" />
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
              data-testid="btn-history-next"
            >
              <img src="/assets/png/default/ui/controls/icon_turn_right.png" alt="Next Page" className="w-5 h-5 object-contain" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
