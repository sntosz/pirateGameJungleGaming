import React, { useState } from 'react';

import { RankingTab } from './RankingTab';
import { MatchHistoryTab } from './MatchHistoryTab';
import { RankingEntry, MatchResult, PaginatedResponse } from '../types/game';
import { useFitScale } from '../hooks/useFitScale';
import { MSW_SCENARIOS, resetMswDatabase } from '../mocks/handlers';

interface MainMenuProps {
  playerName: string;
  playerId: string;
  sessionTime: number;
  enemySpawnInterval: number;
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
  playerId,
  sessionTime,
  enemySpawnInterval,
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
  const panelWidth = activeTab === 'CONTROLS' ? 800 : 1490;
  const scale = useFitScale(panelWidth + 32, 792);

  return (
    <div
      className="relative h-full overflow-hidden bg-[#dfe5d5] text-white"
      data-testid="screen-main-menu"
      role="region"
      aria-label="Main Menu"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(14, 34, 45, 0.25), rgba(14, 34, 45, 0.25)), url('/assets/ui_scene_background.png')`,
        }}
      />

      <div className="relative z-10 flex h-full items-center justify-center overflow-hidden">
        <div
          className="relative min-w-0 shrink-0"
          style={{
            width: panelWidth,
            height: 760,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className="relative mx-auto flex h-full w-full flex-col"
            style={{
              backgroundImage: `url('/assets/png/default/ui/menu/panel_menu.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              padding: activeTab === 'CONTROLS' ? '56px 38px 58px' : '48px clamp(24px, 7.5vw, 112px) 34px',
              overflow: 'hidden',
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col justify-between">
              {activeTab === 'CONTROLS' ? (
              <>
            <div className="flex justify-center">
              <img
                src="/assets/png/default/ui/menu/title_pirate_battle.png"
                alt="Pirate Battle"
                className="h-auto w-full max-w-[420px] object-contain"
              />
            </div>

            <p className="pt-3 text-center text-[15px] font-bold uppercase tracking-[0.35em] text-[#f1d8a0] opacity-90">
              Set sail. Take command.
            </p>

            <div className="flex flex-col items-center gap-2 pt-4">
              <button
                onClick={onStartGame}
                data-testid="btn-play"
                className="flex items-center justify-center gap-2 border-0 bg-transparent px-4 text-[17px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none"
                style={{
                  backgroundImage: `url('/assets/png/default/ui/menu/button_primary_normal.png')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  width: 300,
                  height: 72,
                }}
              >
                <span>Play</span>
              </button>

              <button
                onClick={onOpenOptions}
                data-testid="btn-options"
                className="flex items-center justify-center gap-2 border-0 bg-transparent px-4 text-[17px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none"
                style={{
                  backgroundImage: `url('/assets/png/default/ui/menu/button_primary_normal.png')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  width: 300,
                  height: 72,
                }}
              >
                <span>Options</span>
              </button>
            </div>

            <div className="flex justify-center pt-3">
              <img
                src="/assets/png/default/ships/ship_8.png"
                alt=""
                aria-hidden="true"
                className="h-[68px] w-[40px] object-contain"
              />
            </div>

            <p className="pt-2 text-center text-[15px] font-medium italic text-[#f1d8a0] opacity-90">
              Navigate the islands. Survive the battle.
            </p>

            <div
              className="mx-auto mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-[#e8d5a8] opacity-90"
              data-testid="controls-instructions"
            >
              <span><kbd className="rounded bg-black/40 px-1.5 py-0.5">W</kbd>/<kbd className="rounded bg-black/40 px-1.5 py-0.5">↑</kbd> Sail</span>
              <span><kbd className="rounded bg-black/40 px-1.5 py-0.5">A</kbd><kbd className="rounded bg-black/40 px-1.5 py-0.5">D</kbd> Turn</span>
              <span><kbd className="rounded bg-black/40 px-1.5 py-0.5">Space</kbd> Front cannon</span>
              <span><kbd className="rounded bg-black/40 px-1.5 py-0.5">Q</kbd>/<kbd className="rounded bg-black/40 px-1.5 py-0.5">E</kbd> Broadsides</span>
              <span className="normal-case italic opacity-80">Touch: on-screen buttons</span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                onClick={() => setActiveTab('RANKING')}
                data-testid="tab-btn-ranking"
                className="border-0 bg-transparent px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#f1d8a0]"
                style={{
                  backgroundImage: `url('/assets/png/default/ui/menu/button_secondary_normal.png')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  width: 190,
                  height: 48,
                }}
              >
                Ranking
              </button>

              <button
                onClick={() => setActiveTab('HISTORY')}
                data-testid="tab-btn-history"
                className="border-0 bg-transparent px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#f1d8a0]"
                style={{
                  backgroundImage: `url('/assets/png/default/ui/menu/button_secondary_normal.png')`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  width: 190,
                  height: 48,
                }}
              >
                Match History
              </button>
            </div>
              </>
              ) : (
              <section className="mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col" data-testid="screen-captains-log">
                <h1 className="mb-3 text-center text-3xl font-black uppercase tracking-wide text-[#f7dfaa]">
                  Captain&apos;s Log
                </h1>

                <div className="mb-4 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('RANKING')}
                    aria-pressed={activeTab === 'RANKING'}
                    data-testid="tab-btn-ranking"
                    className={`border-0 bg-transparent px-4 text-xs font-black uppercase tracking-wide ${
                      activeTab === 'RANKING' ? 'text-[#1d2d41]' : 'text-white'
                    }`}
                    style={{
                      backgroundImage: `url('/assets/png/default/ui/menu/${activeTab === 'RANKING' ? 'button_primary_normal' : 'button_secondary_normal'}.png')`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      width: 240,
                      height: 55,
                    }}
                  >
                    Ranking
                  </button>
                  <button
                    onClick={() => setActiveTab('HISTORY')}
                    aria-pressed={activeTab === 'HISTORY'}
                    data-testid="tab-btn-history"
                    className={`border-0 bg-transparent px-4 text-xs font-black uppercase tracking-wide ${
                      activeTab === 'HISTORY' ? 'text-[#1d2d41]' : 'text-white'
                    }`}
                    style={{
                      backgroundImage: `url('/assets/png/default/ui/menu/${activeTab === 'HISTORY' ? 'button_primary_normal' : 'button_secondary_normal'}.png')`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      width: 240,
                      height: 55,
                    }}
                  >
                    Match History
                  </button>
                </div>

                <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-slate-300">
                  {activeTab === 'RANKING'
                    ? `${sessionTime} second battles · ${enemySpawnInterval} second spawn interval`
                    : `${playerName} · Your recent battles`}
                </p>

                {activeTab === 'RANKING' ? (
                  <RankingTab
                    data={rankingData}
                    playerId={playerId}
                    isLoading={rankingLoading}
                    isError={rankingError}
                    error={rankingErrorObj}
                    page={rankingPage}
                    onPageChange={onRankingPageChange}
                    onRefetch={onRankingRefetch}
                  />
                ) : (
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

                <div className="mt-auto mb-5 flex justify-center pt-5">
                  <button
                    onClick={() => setActiveTab('CONTROLS')}
                    data-testid="btn-main-menu"
                    className="border-0 bg-transparent px-5 text-sm font-black uppercase tracking-wide text-[#1d2d41]"
                    style={{
                      backgroundImage: `url('/assets/png/default/ui/menu/button_primary_normal.png')`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      width: 300,
                      height: 65,
                    }}
                  >
                    Main Menu
                  </button>
                </div>
              </section>
              )}
            </div>
          </div>
        </div>
      </div>
      <img
        src="/assets/logo_jungle_gaming.svg"
        alt="Jungle Gaming"
        className="absolute bottom-5 right-8 z-20 w-20 object-contain sm:w-36"
      />

      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-md bg-black/60 px-3 py-2 backdrop-blur-sm">
        <label htmlFor="msw-scenario" className="text-[10px] font-bold uppercase tracking-wide text-[#f1d8a0]">
          Network
        </label>
        <select
          id="msw-scenario"
          data-testid="select-msw-scenario"
          value={activeScenario}
          onChange={(e) => onScenarioChange(e.target.value)}
          className="rounded border-0 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pirate-gold"
        >
          {MSW_SCENARIOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          data-testid="btn-reset-msw-db"
          onClick={() => {
            resetMswDatabase();
            onRankingRefetch();
            onHistoryRefetch();
          }}
          className="rounded bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-200 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-pirate-gold"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
