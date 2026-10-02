import React, { useState } from 'react';
import { GameConfig } from '../types/game';
import { Save, Volume2, VolumeX, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { SoundManager } from '../game/SoundManager';

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
  const [playerName, setPlayerName] = useState(initialName);
  const [volume, setVolume] = useState(Math.round(SoundManager.getInstance().getVolume() * 100));
  const [muted, setMuted] = useState(SoundManager.getInstance().isMuted());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    SoundManager.getInstance().setVolume(v / 100);
  };

  const handleMuteToggle = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    SoundManager.getInstance().setMuted(nextMuted);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (sessionTime < 60 || sessionTime > 180) {
      setErrorMsg('Game session time must be between 60 and 180 seconds.');
      return;
    }
    if (spawnInterval < 1 || spawnInterval > 10) {
      setErrorMsg('Enemy spawn interval must be between 1 and 10 seconds.');
      return;
    }
    if (!playerName.trim()) {
      setErrorMsg('Player name cannot be empty.');
      return;
    }

    const updatedConfig: GameConfig = {
      ...config,
      sessionTime,
      enemySpawnInterval: spawnInterval,
    };

    onSave(updatedConfig, playerName.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center p-4 overflow-y-auto"
      data-testid="screen-options"
      role="region"
      aria-label="Options Menu"
    >
      <div className="bg-gray-900 border-2 border-pirate-gold rounded-3xl p-8 max-w-xl w-full shadow-2xl space-y-6 my-8">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-pirate-gold rounded-lg p-1"
            data-testid="btn-options-back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Menu</span>
          </button>
          <h2 className="text-2xl font-black text-pirate-gold uppercase tracking-wider">
            GAME OPTIONS
          </h2>
          <div className="w-16" />
        </div>

        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/80 rounded-xl p-3 flex items-center gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-200 uppercase tracking-wide">
              Captain Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pirate-gold focus:ring-1 focus:ring-pirate-gold font-medium"
              placeholder="Enter captain name..."
              data-testid="input-player-name"
            />
          </div>

          <div className="space-y-4 bg-gray-800/50 p-4 rounded-2xl border border-gray-800">
            <h3 className="text-xs font-bold text-pirate-gold uppercase tracking-widest">
              Match Balance Parameters
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-300">Session Time (60s - 180s)</span>
                <span className="font-bold text-pirate-gold" data-testid="val-session-time">
                  {sessionTime}s
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={180}
                step={5}
                value={sessionTime}
                onChange={(e) => setSessionTime(Number(e.target.value))}
                className="w-full accent-pirate-gold cursor-pointer"
                data-testid="input-session-time"
              />
              <p className="text-xs text-gray-400">
                Duration of active combat match in seconds.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-300">Enemy Spawn Interval (1s - 10s)</span>
                <span className="font-bold text-pirate-gold" data-testid="val-spawn-interval">
                  {spawnInterval}s
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={spawnInterval}
                onChange={(e) => setSpawnInterval(Number(e.target.value))}
                className="w-full accent-pirate-gold cursor-pointer"
                data-testid="input-spawn-interval"
              />
              <p className="text-xs text-gray-400">
                Time delay between successive enemy spawns.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-gray-800/50 p-4 rounded-2xl border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-300">Audio Settings</span>
              <button
                type="button"
                onClick={handleMuteToggle}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-pirate-gold transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                disabled={muted}
                className="w-full accent-pirate-gold cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs font-bold text-gray-300 w-10 text-right">
                {muted ? '0%' : `${volume}%`}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl border border-emerald-400 shadow-lg flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
              data-testid="btn-save-options"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>SAVED!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>SAVE OPTIONS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
