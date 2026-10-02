import React from 'react';
import { MatchResult } from '../types/game';
import { RotateCcw, Home, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div
      className="fixed inset-0 bg-gray-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      data-testid="screen-result"
      role="region"
      aria-label="Match Results"
    >
      <div className="bg-gray-900 border-2 border-pirate-gold rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6 text-center my-8">
        <div>
          <div
            className={`text-sm font-bold tracking-widest uppercase mb-1 ${
              isVictory ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isVictory ? 'VICTORY - TIME SURVIVED' : 'SHIP SUNK'}
          </div>
          <h1 className="text-4xl font-black text-pirate-gold tracking-wider uppercase">
            MATCH RESULT
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-gray-800/80 p-5 rounded-2xl border border-gray-700">
          <div className="space-y-1">
            <div className="text-xs text-gray-400 font-semibold uppercase">Total Score</div>
            <div className="text-3xl font-black text-white" data-testid="result-score">
              {result.score} pts
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400 font-semibold uppercase">Duration</div>
            <div className="text-3xl font-black text-white" data-testid="result-duration">
              {formatTime(result.duration)}
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/60 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {result.status === 'SYNCED' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-medium">Match recorded online</span>
              </>
            ) : result.status === 'FAILED' ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">Saved locally (Pending sync)</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                <span className="text-blue-300 font-medium">Syncing match result...</span>
              </>
            )}
          </div>

          {result.status === 'FAILED' && onRetrySync && (
            <button
              onClick={onRetrySync}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors"
              data-testid="btn-retry-sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-pirate-red hover:bg-red-600 text-white font-bold py-3.5 px-6 rounded-xl border border-red-400 shadow-lg flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
            data-testid="btn-play-again"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={onMainMenu}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-pirate-gold font-bold py-3.5 px-6 rounded-xl border border-pirate-gold/40 shadow-lg flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-pirate-gold"
            data-testid="btn-main-menu"
          >
            <Home className="w-5 h-5" />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
