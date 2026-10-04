import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameEngineCallbacks } from '../game/GameEngine';
import { GameConfig } from '../types/game';

interface GameCanvasProps {
  config: GameConfig;
  callbacks: GameEngineCallbacks;
  onEngineReady: (engine: GameEngine) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ config, callbacks, onEngineReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    setLoadError(null);
    setLoadProgress(0);

    const engine = new GameEngine(config, {
      ...callbacks,
      onLoadProgress: (p) => {
        if (isMounted) setLoadProgress(p);
      },
    });
    engineRef.current = engine;

    engine.init(containerRef.current).then(() => {
      if (isMounted) {
        onEngineReady(engine);
      }
    }).catch((err: unknown) => {
      if (isMounted) {
        console.error('Failed to initialize game engine:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load game assets.');
      }
    });

    return () => {
      isMounted = false;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [retryCount]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-gray-950 flex items-center justify-center"
      data-testid="game-canvas-container"
    >
      {loadError ? (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-gray-950/90 p-6 text-center"
          data-testid="asset-load-error"
          role="alert"
        >
          <p className="text-xl font-black uppercase tracking-wide text-pirate-red">
            Failed to load game assets
          </p>
          <p className="max-w-md text-sm text-gray-300">{loadError}</p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            data-testid="btn-retry-assets"
            className="rounded bg-pirate-gold px-6 py-2 text-sm font-black uppercase tracking-wide text-gray-950 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Retry
          </button>
        </div>
      ) : loadProgress < 1 ? (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-gray-950/80 p-6"
          data-testid="asset-loading"
          role="status"
          aria-label="Loading game assets"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#f1d8a0]">
            Loading assets…
          </p>
          <div className="h-3 w-56 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-pirate-gold transition-all duration-150"
              style={{ width: `${Math.round(loadProgress * 100)}%` }}
            />
          </div>
          <p className="text-xs tabular-nums text-gray-400">{Math.round(loadProgress * 100)}%</p>
        </div>
      ) : null}
    </div>
  );
};
