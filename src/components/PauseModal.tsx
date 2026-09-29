import React from 'react';
import { Play, Settings as SettingsIcon, Home, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface PauseModalProps {
  onResume: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center my-auto">
        <h2 className="font-fantasy text-2xl font-bold text-white tracking-wide mb-1">
          GAME PAUSED
        </h2>
        <p className="text-xs text-neutral-400 mb-6">
          The battle stands still. Catch your breath.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              soundManager.playAttack();
              onResume();
            }}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-98 text-white font-fantasy font-bold text-sm tracking-wide shadow-lg shadow-red-950/60 border border-red-500/40 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> RESUME GAME
          </button>

          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenSettings();
            }}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-98 text-neutral-200 font-semibold text-sm tracking-wide border border-neutral-700 transition-all cursor-pointer"
          >
            <SettingsIcon className="w-4 h-4 text-neutral-400" /> SETTINGS
          </button>

          <button
            onClick={() => {
              soundManager.playAttack();
              onMainMenu();
            }}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-5 rounded-lg bg-neutral-950 hover:bg-neutral-800 active:scale-98 text-neutral-400 hover:text-white font-medium text-xs tracking-wide border border-neutral-800 transition-all cursor-pointer mt-2"
          >
            <Home className="w-4 h-4" /> QUIT TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
