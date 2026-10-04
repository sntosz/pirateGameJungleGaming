import React, { useState } from 'react';
import { GameConfig } from '../types/game';
import { Minus, Plus } from 'lucide-react';
import { useFitScale } from '../hooks/useFitScale';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface OptionsScreenProps {
  config: GameConfig;
  playerName: string;
  onSave: (newConfig: GameConfig, newName: string) => void;
  onBack: () => void;
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({
  config,
  playerName: initialName,
  onSave,
  onBack,
}) => {
  const [sessionTime, setSessionTime] = useState(config.sessionTime);
  const [spawnInterval, setSpawnInterval] = useState(config.enemySpawnInterval);
  const scale = useFitScale(792, 712);
  const dialogRef = useFocusTrap<HTMLDivElement>();
  const handleMainMenu = () => {
    const updatedConfig: GameConfig = {
      ...config,
      sessionTime,
      enemySpawnInterval: spawnInterval,
    };

    onSave(updatedConfig, initialName);
    onBack();
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/assets/ui_scene_background.png')" }}
      data-testid="screen-options"
      role="region"
      aria-label="Options Menu"
    >
      <div
        className="relative shrink-0"
        style={{
          width: 760,
          height: 680,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="relative flex h-full w-full flex-col items-center"
          style={{
            backgroundImage: "url('/assets/png/default/ui/menu/panel_menu.png')",
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            padding: '32px 64px',
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center pb-8">
            <h2 className="mb-7 text-center text-[32px] font-black uppercase tracking-[0.04em] text-[#ffe2a2]">
              Options
            </h2>

            <div className="w-full max-w-[500px] space-y-7">
            <div className="text-center">
              <p className="mb-3 text-[17px] font-semibold text-[#ead3a4]">Game session time</p>
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  onClick={() => setSessionTime(value => Math.max(60, value - 5))}
                  disabled={sessionTime <= 60}
                  aria-label="Decrease game session time"
                  data-testid="btn-session-decrease"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-center bg-contain bg-no-repeat text-[#f4d79e] disabled:opacity-40"
                  style={{ backgroundImage: "url('/assets/png/default/ui/controls/button_round_normal.png')" }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <output className="min-w-[96px] text-[24px] font-black tabular-nums text-[#f8e2b5]" data-testid="val-session-time">
                  {sessionTime} s
                </output>
                <button
                  type="button"
                  onClick={() => setSessionTime(value => Math.min(180, value + 5))}
                  disabled={sessionTime >= 180}
                  aria-label="Increase game session time"
                  data-testid="btn-session-increase"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-center bg-contain bg-no-repeat text-[#f4d79e] disabled:opacity-40"
                  style={{ backgroundImage: "url('/assets/png/default/ui/controls/button_round_normal.png')" }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-3 text-[17px] font-semibold text-[#ead3a4]">Enemy spawn time</p>
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  onClick={() => setSpawnInterval(value => Math.max(1, Math.round((value - 0.5) * 10) / 10))}
                  disabled={spawnInterval <= 1}
                  aria-label="Decrease enemy spawn interval"
                  data-testid="btn-spawn-decrease"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-center bg-contain bg-no-repeat text-[#f4d79e] disabled:opacity-40"
                  style={{ backgroundImage: "url('/assets/png/default/ui/controls/button_round_normal.png')" }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <output className="min-w-[96px] text-[24px] font-black tabular-nums text-[#f8e2b5]" data-testid="val-spawn-interval">
                  {Number.isInteger(spawnInterval) ? spawnInterval : spawnInterval.toFixed(1)} s
                </output>
                <button
                  type="button"
                  onClick={() => setSpawnInterval(value => Math.min(10, Math.round((value + 0.5) * 10) / 10))}
                  disabled={spawnInterval >= 10}
                  aria-label="Increase enemy spawn interval"
                  data-testid="btn-spawn-increase"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-center bg-contain bg-no-repeat text-[#f4d79e] disabled:opacity-40"
                  style={{ backgroundImage: "url('/assets/png/default/ui/controls/button_round_normal.png')" }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            </div>

            <button
              type="button"
              onClick={handleMainMenu}
              className="mt-8 flex items-center justify-center border-0 bg-contain bg-center bg-no-repeat text-[20px] font-black uppercase tracking-wide text-[#382713]"
              style={{
                width: 320,
                height: 70,
                backgroundImage: "url('/assets/png/default/ui/menu/button_primary_normal.png')",
              }}
              data-testid="btn-options-back"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
      <img
        src="/assets/logo_jungle_gaming.svg"
        alt="Jungle Gaming"
        className="absolute bottom-5 right-8 z-[60] w-20 object-contain sm:w-36"
      />
    </div>
  );
};
