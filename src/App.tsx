import React, { useState } from 'react';
import { GameConfig, GameState, MatchResult, EndReason } from './types/game';
import {
  loadGameConfig,
  saveGameConfig,
  loadPlayerName,
  savePlayerName,
  saveLastMatchResult,
  loadLastMatchResult,
  loadPendingMatches,
  savePendingMatches,
} from './services/storage';
import { useRanking, useMatchHistory, useRegisterMatch, useOfflineSync } from './hooks/useGameQueries';
import { setMswScenario, getMswScenario } from './mocks/handlers';
import { MainMenu } from './components/MainMenu';
import { OptionsScreen } from './components/OptionsScreen';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TouchControls } from './components/TouchControls';
import { PauseModal } from './components/PauseModal';
import { ResultScreen } from './components/ResultScreen';
import { GameEngine } from './game/GameEngine';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [config, setConfig] = useState<GameConfig>(loadGameConfig());
  const [playerName, setPlayerName] = useState<string>(loadPlayerName());
  const [playerId] = useState<string>('p-user-local');

  const [activeScenario, setActiveScenario] = useState<string>(getMswScenario());

  const [rankingPage, setRankingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const [hudStats, setHudStats] = useState({
    score: 0,
    playerHp: config.playerMaxHealth,
    playerMaxHp: config.playerMaxHealth,
    timeRemaining: config.sessionTime,
    frontCooldown: 0,
    leftCooldown: 0,
    rightCooldown: 0,
  });

  const [lastResult, setLastResult] = useState<MatchResult | null>(loadLastMatchResult());

  const engineRef = React.useRef<GameEngine | null>(null);

  const rankingQuery = useRanking(rankingPage);
  const historyQuery = useMatchHistory(playerId, historyPage);
  const registerMutation = useRegisterMatch();
  useOfflineSync();

  const handleScenarioChange = (scenario: string) => {
    setActiveScenario(scenario);
    setMswScenario(scenario);
    rankingQuery.refetch();
    historyQuery.refetch();
  };

  const handleSaveOptions = (newConfig: GameConfig, newName: string) => {
    setConfig(newConfig);
    setPlayerName(newName);
    saveGameConfig(newConfig);
    savePlayerName(newName);
  };

  const handleStartGame = () => {
    setGameState('PLAYING');
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('PAUSED');
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setGameState('PLAYING');
  };

  const handleAbandonMatch = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setGameState('MENU');
  };

  const submitMatchResult = (match: MatchResult) => {
    saveLastMatchResult(match);
    setLastResult(match);

    registerMutation.mutate(match, {
      onSuccess: (confirmed) => {
        saveLastMatchResult(confirmed);
        setLastResult(confirmed);
      },
      onError: () => {
        const matchFailed: MatchResult = { ...match, status: 'FAILED' };
        saveLastMatchResult(matchFailed);
        setLastResult(matchFailed);

        const pending = loadPendingMatches();
        if (!pending.some((m) => m.id === match.id)) {
          pending.push(matchFailed);
          savePendingMatches(pending);
        }
      },
    });
  };

  const handleGameOver = (data: { score: number; duration: number; endReason: EndReason }) => {
    const newMatch: MatchResult = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      playerId,
      playerName,
      score: data.score,
      duration: data.duration,
      date: new Date().toISOString(),
      endReason: data.endReason,
      config: { ...config },
      status: 'PENDING',
    };

    setGameState('GAMEOVER');
    submitMatchResult(newMatch);
  };

  const handleRetrySync = () => {
    if (lastResult) {
      submitMatchResult({ ...lastResult, status: 'PENDING' });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-950 font-sans">
      {gameState === 'MENU' && (
        <MainMenu
          playerName={playerName}
          onStartGame={handleStartGame}
          onOpenOptions={() => setGameState('PAUSED')}
          rankingData={rankingQuery.data}
          rankingLoading={rankingQuery.isLoading}
          rankingError={rankingQuery.isError}
          rankingErrorObj={rankingQuery.error}
          rankingPage={rankingPage}
          onRankingPageChange={setRankingPage}
          onRankingRefetch={() => rankingQuery.refetch()}
          historyData={historyQuery.data}
          historyLoading={historyQuery.isLoading}
          historyError={historyQuery.isError}
          historyErrorObj={historyQuery.error}
          historyPage={historyPage}
          onHistoryPageChange={setHistoryPage}
          onHistoryRefetch={() => historyQuery.refetch()}
          activeScenario={activeScenario}
          onScenarioChange={handleScenarioChange}
        />
      )}

      {gameState === 'PAUSED' && !engineRef.current && (
        <OptionsScreen
          config={config}
          playerName={playerName}
          onSave={handleSaveOptions}
          onBack={() => setGameState('MENU')}
        />
      )}

      {(gameState === 'PLAYING' || (gameState === 'PAUSED' && engineRef.current)) && (
        <div className="w-full h-full relative">
          <GameCanvas
            config={config}
            callbacks={{
              onStatsUpdate: setHudStats,
              onGameOver: handleGameOver,
              onAutoPause: handlePause,
            }}
            onEngineReady={(engine) => {
              engineRef.current = engine;
            }}
          />

          <HUD
            score={hudStats.score}
            playerHp={hudStats.playerHp}
            playerMaxHp={hudStats.playerMaxHp}
            timeRemaining={hudStats.timeRemaining}
            frontCooldown={hudStats.frontCooldown}
            frontMaxCooldown={config.frontCannonCooldown}
            leftCooldown={hudStats.leftCooldown}
            rightCooldown={hudStats.rightCooldown}
            broadsideMaxCooldown={config.broadsideCooldown}
            onPause={handlePause}
          />

          <TouchControls
            onMoveChange={(thrust, turn) => {
              if (engineRef.current) engineRef.current.setTouchInputs(thrust, turn);
            }}
            onFrontFire={() => {
              if (engineRef.current) engineRef.current.triggerFrontFire();
            }}
            onLeftFire={() => {
              if (engineRef.current) engineRef.current.triggerLeftBroadside();
            }}
            onRightFire={() => {
              if (engineRef.current) engineRef.current.triggerRightBroadside();
            }}
          />

          {gameState === 'PAUSED' && (
            <PauseModal onResume={handleResume} onAbandon={handleAbandonMatch} />
          )}
        </div>
      )}

      {gameState === 'GAMEOVER' && lastResult && (
        <ResultScreen
          result={lastResult}
          onPlayAgain={() => {
            engineRef.current = null;
            setGameState('PLAYING');
          }}
          onMainMenu={() => {
            engineRef.current = null;
            setGameState('MENU');
          }}
          onRetrySync={handleRetrySync}
          isSyncing={registerMutation.isPending}
        />
      )}
    </div>
  );
};
