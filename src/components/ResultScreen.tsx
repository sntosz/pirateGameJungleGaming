import React from 'react';
import { MatchResult } from '../types/game';
import { CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFitScale } from '../hooks/useFitScale';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ResultScreenProps {
  result: MatchResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onRetrySync?: () => void;
  isSyncing?: boolean;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onPlayAgain,
  onMainMenu,
  onRetrySync,
  isSyncing = false,
}) => {
  const isVictory = result.endReason === 'TIME_EXPIRED';
  const scale = useFitScale(652, 520);
  const dialogRef = useFocusTrap<HTMLDivElement>();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const primaryButtonStyle = {
    backgroundImage: `url('/assets/png/default/ui/menu/button_primary_normal.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    width: 260,
    height: 62,
  } as const;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      data-testid="screen-result"
      role="region"
      aria-label="Match Results"
    >
      <div
        className="relative w-full flex flex-col items-center justify-center text-center"
        style={{
          backgroundImage: `url('/assets/png/default/ui/menu/frame.png')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          width: 620,
          aspectRatio: '1570 / 829',
          padding: '7% 12%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.08em] text-[#f7dfaa] drop-shadow-md">
          Battle Complete
        </h1>

        <div className="mt-2 text-6xl sm:text-7xl font-black text-pirate-gold drop-shadow-md" data-testid="result-score">
          {result.score}
        </div>

        <div className="mt-1 text-[13px] sm:text-sm font-bold uppercase tracking-[0.18em] text-[#f1d8a0] opacity-90">
          <span>Points</span>
          <span className="mx-2">·</span>
          <span data-testid="result-duration">{formatTime(result.duration)}</span>
          <span className="mx-2">·</span>
          <span>{isVictory ? 'Time Up' : 'Ship Sunk'}</span>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onPlayAgain}
            className="flex items-center justify-center border-0 bg-transparent px-4 text-[16px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-pirate-gold"
            style={primaryButtonStyle}
            data-testid="btn-play-again"
          >
            <span>Play Again</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex items-center justify-center border-0 bg-transparent px-4 text-[16px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-pirate-gold"
            style={primaryButtonStyle}
            data-testid="btn-main-menu"
          >
            <span>Main Menu</span>
          </button>
        </div>

        <div className="pointer-events-none absolute inset-x-0 -bottom-7 flex items-center justify-center gap-2 text-[11px]">
          {result.status === 'SYNCED' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-medium">Match recorded online</span>
            </>
          ) : result.status === 'FAILED' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">Saved locally (pending sync)</span>
              {onRetrySync && (
                <button
                  onClick={onRetrySync}
                  disabled={isSyncing}
                  className="pointer-events-auto ml-1 flex items-center gap-1 font-bold text-amber-200 underline underline-offset-2"
                  data-testid="btn-retry-sync"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Retry</span>
                </button>
              )}
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              <span className="text-blue-300 font-medium">Syncing match result...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
