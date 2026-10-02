import React from 'react';
import { Pause, Shield, Flame, Crosshair } from 'lucide-react';

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
  frontCooldown,
  frontMaxCooldown,
  leftCooldown,
  rightCooldown,
  broadsideMaxCooldown,
  onPause,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((playerHp / playerMaxHp) * 100)));

  const frontProgress = Math.max(0, Math.min(100, 100 - (frontCooldown / frontMaxCooldown) * 100));
  const leftProgress = Math.max(0, Math.min(100, 100 - (leftCooldown / broadsideMaxCooldown) * 100));
  const rightProgress = Math.max(0, Math.min(100, 100 - (rightCooldown / broadsideMaxCooldown) * 100));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none z-10"
      aria-label="Game HUD"
      role="region"
    >
      <div className="flex items-start justify-between w-full">
        <div className="pointer-events-auto bg-gray-900/80 backdrop-blur border border-pirate-gold/40 rounded-xl p-3 shadow-lg flex items-center gap-3 w-64">
          <Shield className="w-7 h-7 text-emerald-400 shrink-0" />
          <div className="w-full">
            <div className="flex justify-between text-xs font-bold text-gray-200 mb-1">
              <span>HEALTH</span>
              <span>{hpPercent}%</span>
            </div>
            <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden border border-gray-600">
              <div
                className={`h-full transition-all duration-200 ${
                  hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-auto bg-gray-900/80 backdrop-blur border border-pirate-gold/40 rounded-xl px-6 py-2 shadow-lg flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-pirate-gold uppercase tracking-wider font-semibold">Score</div>
            <div className="text-2xl font-black text-white" data-testid="hud-score">
              {score}
            </div>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <div className="text-center">
            <div className="text-xs text-pirate-gold uppercase tracking-wider font-semibold">Time Remaining</div>
            <div
              className={`text-2xl font-black ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}
              data-testid="hud-timer"
            >
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        <button
          onClick={onPause}
          className="pointer-events-auto bg-gray-900/80 hover:bg-gray-800 backdrop-blur border border-pirate-gold/40 p-3 rounded-xl shadow-lg transition-colors text-pirate-gold hover:text-white focus:outline-none focus:ring-2 focus:ring-pirate-gold"
          aria-label="Pause Game"
          data-testid="btn-pause"
        >
          <Pause className="w-6 h-6" />
        </button>
      </div>

      <div className="flex justify-center w-full mb-2">
        <div className="pointer-events-auto bg-gray-900/80 backdrop-blur border border-pirate-gold/40 rounded-xl px-4 py-2 shadow-lg flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-300 font-bold uppercase">Left Cannon [Q]</span>
            <div className="relative w-12 h-12 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden">
              <Crosshair className="w-6 h-6 text-amber-400 z-10" />
              <div
                className="absolute bottom-0 left-0 right-0 bg-amber-500/40 transition-all duration-75"
                style={{ height: `${leftProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-300 font-bold uppercase">Front Cannon [Space]</span>
            <div className="relative w-14 h-14 rounded-lg bg-gray-800 border-2 border-pirate-gold flex items-center justify-center overflow-hidden">
              <Flame className="w-7 h-7 text-pirate-gold z-10" />
              <div
                className="absolute bottom-0 left-0 right-0 bg-pirate-gold/40 transition-all duration-75"
                style={{ height: `${frontProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-300 font-bold uppercase">Right Cannon [E]</span>
            <div className="relative w-12 h-12 rounded-lg bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden">
              <Crosshair className="w-6 h-6 text-amber-400 z-10" />
              <div
                className="absolute bottom-0 left-0 right-0 bg-amber-500/40 transition-all duration-75"
                style={{ height: `${rightProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
