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
import { RotateOverlay } from './components/RotateOverlay';
import { GameEngine } from './game/GameEngine';
import { SoundManager } from './game/SoundManager';

const playUi = (id: string) => SoundManager.getInstance().play(id, 0.6);

const lockLandscapeOrientation = async () => {
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
    };
    await orientation.lock?.('landscape');
  } catch {
    // Orientation lock not supported (e.g. iOS) — RotateOverlay covers that case.
  }
};

export const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [session, setSession] = useState(0);
  const [showPauseOptions, setShowPauseOptions] = useState(false);
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

  const rankingQuery = useRanking(rankingPage, {
    sessionTime: config.sessionTime,
    enemySpawnInterval: config.enemySpawnInterval,
  });
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
    playUi('ui_click');
    lockLandscapeOrientation();
    setSession(s => s + 1);
    setGameState('PLAYING');
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
    }
    setGameState('PAUSED');
  };

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: portrait)');
    const onOrientationChange = () => {
      if (mediaQuery.matches && gameState === 'PLAYING') {
        handlePause();
      }
    };
    mediaQuery.addEventListener('change', onOrientationChange);
    return () => mediaQuery.removeEventListener('change', onOrientationChange);
  }, [gameState]);

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
    }
    setShowPauseOptions(false);
    setGameState('PLAYING');
  };

  const handleAbandonMatch = () => {
    playUi('ui_back');
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setShowPauseOptions(false);
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
    <div className="w-full h-[100%] relative overflow-hidden bg-gray-950 font-sans">
      <RotateOverlay />

      {gameState === 'MENU' && (
        <MainMenu
          playerName={playerName}
          playerId={playerId}
          sessionTime={config.sessionTime}
          enemySpawnInterval={config.enemySpawnInterval}
          onStartGame={handleStartGame}
          onOpenOptions={() => {
            playUi('ui_open');
            setGameState('PAUSED');
          }}
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
          onBack={() => {
            playUi('ui_back');
            setGameState('MENU');
          }}
        />
      )}

      {(gameState === 'PLAYING' || ((gameState === 'PAUSED' || gameState === 'GAMEOVER') && engineRef.current)) && (
        <div className="w-full h-full relative">
          <GameCanvas
            key={session}
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

          {gameState !== 'GAMEOVER' && (
          <>
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
          </>
          )}

          {gameState === 'PAUSED' && !showPauseOptions && (
            <PauseModal
              onResume={handleResume}
              onAbandon={handleAbandonMatch}
              onOptions={() => {
                playUi('ui_open');
                setShowPauseOptions(true);
              }}
            />
          )}

          {gameState === 'PAUSED' && showPauseOptions && (
            <OptionsScreen
              config={config}
              playerName={playerName}
              onSave={handleSaveOptions}
              onBack={() => {
                playUi('ui_close');
                setShowPauseOptions(false);
              }}
            />
          )}
        </div>
      )}

      {gameState === 'GAMEOVER' && lastResult && (
        <ResultScreen
          result={lastResult}
          onPlayAgain={() => {
            playUi('ui_click');
            engineRef.current = null;
            setSession(s => s + 1);
            setGameState('PLAYING');
          }}
          onMainMenu={() => {
            playUi('ui_back');
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
