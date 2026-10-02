import React from 'react';
import { Play, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onAbandon: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onAbandon }) => {
  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      data-testid="modal-pause"
    >
      <div className="bg-gray-900 border-2 border-pirate-gold rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 className="text-3xl font-black text-pirate-gold tracking-widest uppercase">
          GAME PAUSED
        </h2>
        <p className="text-gray-300 text-sm">
          Simulation and timer suspended. Click Resume to continue fighting!
        </p>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={onResume}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl border border-emerald-400 shadow-lg flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            data-testid="btn-resume"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>RESUME MATCH</span>
          </button>

          <button
            onClick={onAbandon}
            className="w-full bg-gray-800 hover:bg-red-950/80 text-gray-300 hover:text-red-300 font-semibold py-3 px-6 rounded-xl border border-gray-700 hover:border-red-500 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-400"
            data-testid="btn-abandon"
          >
            <Home className="w-5 h-5" />
            <span>ABANDON MATCH</span>
          </button>
        </div>
      </div>
    </div>
  );
};
