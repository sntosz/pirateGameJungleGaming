import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    const engine = new GameEngine(config, callbacks);
    engineRef.current = engine;

    engine.init(containerRef.current).then(() => {
      if (isMounted) {
        onEngineReady(engine);
      }
    });

    return () => {
      isMounted = false;
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-gray-950 flex items-center justify-center"
      data-testid="game-canvas-container"
    />
  );
};
