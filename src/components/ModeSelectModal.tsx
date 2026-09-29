import React from 'react';
import { GameMode } from '../types/game';
import { ArrowLeft, Clock, Infinity as InfinityIcon, Flame, Shield, Skull, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ModeSelectModalProps {
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  onSelectMode,
  onBack,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-7 shadow-2xl flex flex-col gap-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundManager.playAttack();
                onBack();
              }}
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
              aria-label="Back to main menu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-fantasy text-xl sm:text-2xl font-bold text-white tracking-wide">
                SELECT GAME MODE
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400">
                Choose your trial. Each mode brings unique challenges.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Game Modes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. SURVIVAL */}
          <div
            onClick={() => {
              soundManager.playLevelUp();
              onSelectMode('SURVIVAL');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-lg bg-neutral-950 border border-emerald-900/40 hover:border-emerald-500/80 hover:bg-emerald-950/20 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🟢</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded">
                <Clock className="w-3 h-3" /> 10 MINUTES
              </span>
            </div>

            <div>
              <h3 className="font-fantasy text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                SURVIVAL
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Survive for exactly 10 minutes. Waves scale every minute. Elites rise at 5:00, horde surge at 8:00, and a final Abyssal Boss at 10:00!
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>Goal: 10:00 Victory</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 2. ENDLESS */}
          <div
            onClick={() => {
              soundManager.playLevelUp();
              onSelectMode('ENDLESS');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-lg bg-neutral-950 border border-indigo-900/40 hover:border-indigo-500/80 hover:bg-indigo-950/20 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">♾️</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/70 border border-indigo-800/60 px-2 py-0.5 rounded">
                <InfinityIcon className="w-3 h-3" /> NO TIME LIMIT
              </span>
            </div>

            <div>
              <h3 className="font-fantasy text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                ENDLESS
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                No time limit. Battle until you fall. Monsters continuously strengthen, spawn rates climb, and Titans appear periodically.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-indigo-400 font-semibold">
              <span>Goal: High Score</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          {/* 3. HARDCORE */}
          <div
            onClick={() => {
              soundManager.playBossWarning();
              onSelectMode('HARDCORE');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-lg bg-neutral-950 border border-red-900/50 hover:border-red-500/80 hover:bg-red-950/20 transition-all cursor-pointer shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🔥</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded">
                <Flame className="w-3 h-3" /> EXTREME
              </span>
            </div>

            <div>
              <h3 className="font-fantasy text-lg font-bold text-white group-hover:text-red-300 transition-colors">
                HARDCORE
              </h3>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                Monsters have 2.2x HP, higher speed & damage. Player starts with reduced HP. Healing is limited. No second chances.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-red-400 font-semibold">
              <span>Goal: Survival</span>
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

        {/* Quick features note */}
        <div className="bg-neutral-950/60 border border-neutral-800/60 rounded-lg p-3 text-xs text-neutral-400 flex items-center justify-around gap-2 text-center">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-attack enabled
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> 3 Power choices every level
          </span>
          <span className="flex items-center gap-1">
            <Skull className="w-3.5 h-3.5 text-purple-400" /> Bosses & Elites
          </span>
        </div>
      </div>
    </div>
  );
};
