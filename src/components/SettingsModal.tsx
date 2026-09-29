import React from 'react';
import { GameSettings } from '../types/game';
import { ArrowLeft, Volume2, VolumeX, Bell, BellOff, Sliders, Smartphone } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playAttack();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-fantasy text-xl font-bold text-white tracking-wide">
              SETTINGS
            </h2>
          </div>
        </div>

        {/* Settings Controls */}
        <div className="flex flex-col gap-4">
          {/* Music Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3">
              {settings.musicEnabled ? (
                <Volume2 className="w-5 h-5 text-amber-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-neutral-500" />
              )}
              <div>
                <span className="text-sm font-semibold text-white block">Background Music</span>
                <span className="text-xs text-neutral-400">Dark fantasy synth ambiance</span>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.musicEnabled;
                soundManager.setMusicEnabled(next);
                onUpdateSettings({ musicEnabled: next });
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* SFX Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3">
              {settings.sfxEnabled ? (
                <Bell className="w-5 h-5 text-emerald-400" />
              ) : (
                <BellOff className="w-5 h-5 text-neutral-500" />
              )}
              <div>
                <span className="text-sm font-semibold text-white block">Sound Effects</span>
                <span className="text-xs text-neutral-400">Hits, spells, roars, and XP pings</span>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.sfxEnabled;
                soundManager.setSfxEnabled(next);
                onUpdateSettings({ sfxEnabled: next });
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                settings.sfxEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {settings.sfxEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-sm font-semibold text-white block">Vibration</span>
                <span className="text-xs text-neutral-400">Haptic feedback on mobile</span>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !settings.vibrationEnabled;
                soundManager.vibrationEnabled = next;
                if (next) soundManager.triggerVibration(40);
                onUpdateSettings({ vibrationEnabled: next });
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                settings.vibrationEnabled
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
              }`}
            >
              {settings.vibrationEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Joystick Sensitivity */}
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sliders className="w-4 h-4 text-purple-400" />
                Joystick Sensitivity
              </div>
              <span className="text-xs text-purple-400 font-mono font-bold">
                {settings.joystickSensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.joystickSensitivity}
              onChange={(e) => {
                onUpdateSettings({ joystickSensitivity: parseFloat(e.target.value) });
              }}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
            />
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            soundManager.playAttack();
            onClose();
          }}
          className="w-full py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          BACK TO MAIN MENU
        </button>
      </div>
    </div>
  );
};
