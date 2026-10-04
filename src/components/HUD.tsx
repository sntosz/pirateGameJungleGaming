import React from 'react';
import { useFitScale } from '../hooks/useFitScale';

interface HUDProps {
  score: number;
  playerHp: number;
  playerMaxHp: number;
  timeRemaining: number;
  frontCooldown: number;
  frontMaxCooldown: number;
  leftCooldown: number;
  rightCooldown: number;
  broadsideMaxCooldown: number;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  playerHp,
  playerMaxHp,
  timeRemaining,
  onPause,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));
  const scale = useFitScale(700, 90);

  const fillClass =
    hpPercent > 50
      ? 'bg-gradient-to-b from-[#7ed957] to-[#3d9b2f]'
      : hpPercent > 25
        ? 'bg-gradient-to-b from-[#f7c85f] to-[#d89736]'
        : 'bg-gradient-to-b from-[#e0655a] to-[#a83228]';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const counterPanelStyle = {
    backgroundImage: `url('/assets/png/default/ui/hud/counter_panel.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    height: 52,
  } as const;

  return (
    <div
      className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none z-10"
      aria-label="Game HUD"
      role="region"
    >
      <div className="flex items-start justify-between w-full">
        <div
          className="pointer-events-auto flex items-center gap-1.5"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <img
            src="/assets/png/default/ui/hud/icon_heart.png"
            alt="Health"
            className="w-9 h-9 object-contain drop-shadow-md"
          />
          <div
            className="relative flex items-center"
            style={{
              backgroundImage: `url('/assets/png/default/ui/hud/health_frame.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              width: 240,
              height: 44,
            }}
          >
            <div className="absolute left-[11.3%] right-[11.3%] top-1/2 -translate-y-1/2 h-[52%] overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full transition-all duration-200 ${fillClass}`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-[#f7dfaa] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {Math.max(0, playerHp)}/{playerMaxHp}
            </span>
          </div>
        </div>

        <div
          className="pointer-events-auto flex items-center gap-2.5"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}
        >
          <div
            className="flex items-center justify-center gap-2 px-5"
            style={{ ...counterPanelStyle, minWidth: 120 }}
          >
            <img src="/assets/png/default/ui/hud/icon_score.png" alt="Score" className="w-6 h-6 object-contain" />
            <span className="text-xl font-black text-[#f7dfaa] drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" data-testid="hud-score">
              {score}
            </span>
          </div>

          <div
            className="flex items-center justify-center gap-2 px-5"
            style={{ ...counterPanelStyle, minWidth: 140 }}
          >
            <img src="/assets/png/default/ui/hud/icon_time.png" alt="Time" className="w-6 h-6 object-contain" />
            <span
              className={`text-xl font-black drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${
                timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-[#f7dfaa]'
              }`}
              data-testid="hud-timer"
            >
              {formatTime(timeRemaining)}
            </span>
          </div>

          <button
            onClick={onPause}
            className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform hover:scale-105 focus:outline-none"
            style={{
              backgroundImage: `url('/assets/png/default/ui/controls/button_round_normal.png')`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              width: 52,
              height: 52,
            }}
            aria-label="Pause Game"
            data-testid="btn-pause"
          >
            <img src="/assets/png/default/ui/controls/icon_pause.png" alt="Pause" className="w-6 h-6 object-contain" />
          </button>
        </div>
      </div>

      <div aria-live="polite" role="status" className="sr-only" data-testid="hud-live-region">
        Score {score}. Health {Math.max(0, playerHp)} of {playerMaxHp}. {formatTime(timeRemaining)} remaining.
      </div>
    </div>
  );
};
