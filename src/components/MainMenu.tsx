import React, { useState } from 'react';
import { Play, Settings, Trophy, History, Anchor, Keyboard } from 'lucide-react';
import { RankingTab } from './RankingTab';
import { MatchHistoryTab } from './MatchHistoryTab';
import { RankingEntry, MatchResult, PaginatedResponse } from '../types/game';

interface MainMenuProps {
  playerName: string;
  onStartGame: () => void;
  onOpenOptions: () => void;

  rankingData?: PaginatedResponse<RankingEntry>;
  rankingLoading: boolean;
  rankingError: boolean;
  rankingErrorObj?: Error | null;
  rankingPage: number;
  onRankingPageChange: (p: number) => void;
  onRankingRefetch: () => void;

  historyData?: PaginatedResponse<MatchResult>;
  historyLoading: boolean;
  historyError: boolean;
  historyErrorObj?: Error | null;
  historyPage: number;
  onHistoryPageChange: (p: number) => void;
  onHistoryRefetch: () => void;

  activeScenario: string;
  onScenarioChange: (sc: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  onStartGame,
  onOpenOptions,
  rankingData,
  rankingLoading,
  rankingError,
  rankingErrorObj,
  rankingPage,
  onRankingPageChange,
  onRankingRefetch,
  historyData,
  historyLoading,
  historyError,
  historyErrorObj,
  historyPage,
  onHistoryPageChange,
  onHistoryRefetch,
  activeScenario,
  onScenarioChange,
}) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'RANKING' | 'HISTORY'>('CONTROLS');

  return (
    <div
      className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-4 md:p-8 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(10, 25, 40, 0.85), rgba(10, 25, 40, 0.95)), url('/assets/ui_scene_background.png')` }}
      data-testid="screen-main-menu"
      role="region"
      aria-label="Main Menu"
    >
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl mx-auto w-full border-b border-pirate-gold/30 pb-6">
        <div className="flex items-center gap-4">
          <Anchor className="w-10 h-10 text-pirate-gold animate-bounce" />
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-pirate-gold tracking-widest uppercase">
              PIRATE BATTLE
            </h1>
            <p className="text-xs text-gray-300 font-semibold tracking-wider">
              2D Top-Down Naval Shooter • Welcome, <span className="text-pirate-gold">{playerName}</span>!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-900/90 border border-gray-700 px-3 py-1.5 rounded-xl text-xs">
          <span className="text-gray-400 font-bold">MSW Scenario:</span>
          <select
            value={activeScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-gray-800 text-pirate-gold font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pirate-gold"
            data-testid="select-msw-scenario"
          >
            <option value="SUCCESS">Success (Default)</option>
            <option value="EMPTY">Empty Lists</option>
            <option value="DELAYED">Delayed / High Latency</option>
            <option value="TIMEOUT">Timeout / Retry Test</option>
            <option value="ERROR_500">Server Error (500)</option>
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gray-900/90 backdrop-blur-md border-2 border-pirate-gold rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={onStartGame}
              className="w-full bg-pirate-red hover:bg-red-600 text-white font-black py-5 px-8 rounded-2xl border-2 border-pirate-gold shadow-2xl flex items-center justify-center gap-3 text-2xl tracking-wider transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-pirate-gold"
              data-testid="btn-play"
            >
              <Play className="w-8 h-8 fill-current" />
              <span>PLAY MATCH</span>
            </button>

            <button
              onClick={onOpenOptions}
              className="w-full bg-gray-800 hover:bg-gray-700 text-pirate-gold font-bold py-3.5 px-6 rounded-xl border border-pirate-gold/40 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-pirate-gold"
              data-testid="btn-options"
            >
              <Settings className="w-5 h-5" />
              <span>GAME OPTIONS</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 bg-gray-900/90 backdrop-blur-md border border-pirate-gold/40 rounded-3xl p-6 shadow-2xl min-h-[420px] flex flex-col justify-between">
          <div className="flex border-b border-gray-800 pb-4 mb-4 gap-2">
            <button
              onClick={() => setActiveTab('CONTROLS')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pirate-gold ${
                activeTab === 'CONTROLS'
                  ? 'bg-pirate-gold text-gray-950 font-black shadow-md'
                  : 'text-gray-400 hover:text-white bg-gray-800/60'
              }`}
              data-testid="tab-btn-controls"
            >
              <Keyboard className="w-4 h-4" />
              <span>CONTROLS</span>
            </button>

            <button
              onClick={() => setActiveTab('RANKING')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pirate-gold ${
                activeTab === 'RANKING'
                  ? 'bg-pirate-gold text-gray-950 font-black shadow-md'
                  : 'text-gray-400 hover:text-white bg-gray-800/60'
              }`}
              data-testid="tab-btn-ranking"
            >
              <Trophy className="w-4 h-4" />
              <span>RANKING</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-pirate-gold ${
                activeTab === 'HISTORY'
                  ? 'bg-pirate-gold text-gray-950 font-black shadow-md'
                  : 'text-gray-400 hover:text-white bg-gray-800/60'
              }`}
              data-testid="tab-btn-history"
            >
              <History className="w-4 h-4" />
              <span>MATCH HISTORY</span>
            </button>
          </div>

          <div className="flex-1">
            {activeTab === 'CONTROLS' && (
              <div className="space-y-4" data-testid="tab-controls">
                <h2 className="text-lg font-black text-pirate-gold uppercase tracking-wider">
                  HOW TO PLAY & CONTROLS
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700/60 space-y-2">
                    <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                      <span>Navigation & Movement</span>
                    </h3>
                    <ul className="space-y-1 text-gray-300">
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">W</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">↑</kbd>: Forward Thrust</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">S</kbd> or <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">↓</kbd>: Reverse</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">A</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">D</kbd>: Turn Left / Right</li>
                      <li>• Touch: Virtual On-Screen Joystick</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800/60 p-4 rounded-xl border border-gray-700/60 space-y-2">
                    <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                      <span>Weapon Systems</span>
                    </h3>
                    <ul className="space-y-1 text-gray-300">
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">I</kbd>: Frontal Cannon</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">Q</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">U</kbd>: Left Broadside (3 shots)</li>
                      <li>• <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">E</kbd> / <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-pirate-gold">O</kbd>: Right Broadside (3 shots)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1">
                  <p className="font-semibold text-gray-300">Enemies & Scoring:</p>
                  <p>• <span className="text-red-400 font-bold">Chaser</span>: Pursues and explodes on impact. (0 points on self-destruct).</p>
                  <p>• <span className="text-amber-400 font-bold">Shooter</span>: Approaches and fires ranged cannonballs.</p>
                  <p>• Destroying an enemy ship with your weapons grants <span className="text-pirate-gold font-bold">1 Point</span>.</p>
                </div>
              </div>
            )}

            {activeTab === 'RANKING' && (
              <RankingTab
                data={rankingData}
                isLoading={rankingLoading}
                isError={rankingError}
                error={rankingErrorObj}
                page={rankingPage}
                onPageChange={onRankingPageChange}
                onRefetch={onRankingRefetch}
              />
            )}

            {activeTab === 'HISTORY' && (
              <MatchHistoryTab
                data={historyData}
                isLoading={historyLoading}
                isError={historyError}
                error={historyErrorObj}
                page={historyPage}
                onPageChange={onHistoryPageChange}
                onRefetch={onHistoryRefetch}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-300 max-w-6xl mx-auto w-full border-t border-gray-800 pt-4">
        Pirate Battle Naval Shooter • Built with React, TypeScript, PixiJS, TanStack Query, Axios & MSW
      </footer>
    </div>
  );
};
