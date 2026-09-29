import React, { useState, useEffect } from 'react';
import { Play, Settings as SettingsIcon, HelpCircle, Trophy, Sparkles, Volume2, VolumeX, Flame, Skull, ChevronRight } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { getTopScore, LeaderboardEntry } from '../utils/leaderboard';
import { GameMode } from '../types/game';

interface MainMenuProps {
  onOpenModeSelect: () => void;
  onQuickStart: (mode: GameMode) => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onOpenModeSelect,
  onQuickStart,
  onOpenLeaderboard,
  onOpenSettings,
  onOpenHowToPlay,
  isAudioMuted = false,
  onToggleAudio,
}) => {
  const [topScore, setTopScore] = useState<LeaderboardEntry | null>(null);
  const [selectedQuickMode, setSelectedQuickMode] = useState<GameMode>('SURVIVAL');

  useEffect(() => {
    setTopScore(getTopScore());
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-4 sm:p-8 bg-radial from-neutral-900 via-neutral-950 to-black select-none overflow-hidden">
      {/* Dynamic atmospheric floating particle backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Verdant green & cyan ambient glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 left-1/4 w-[400px] h-[300px] bg-sky-600/15 blur-[100px] rounded-full pointer-events-none" />

        {/* Floating magical spores & orbs */}
        <div className="absolute top-1/4 left-1/6 w-2 h-2 rounded-full bg-emerald-400/50 blur-[1px] animate-pulse" />
        <div className="absolute top-1/3 right-1/5 w-3 h-3 rounded-full bg-sky-400/40 blur-[1px] animate-bounce" />
        <div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 rounded-full bg-amber-400/40 blur-[1px] animate-pulse" />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 rounded-full bg-emerald-300/40 blur-[1px] animate-ping" />
      </div>

      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between max-w-3xl text-neutral-400 text-xs sm:text-sm font-medium z-10">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-fantasy font-bold text-emerald-400 tracking-wider">
            VERDANT ARENA
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onToggleAudio && (
            <button
              onClick={() => {
                onToggleAudio();
              }}
              className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
              title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 text-neutral-400" />
          </button>
        </div>
      </div>

      {/* Center Character Showcase & Title */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-lg w-full">
        {/* Animated Cute Bubble Mascot with Little Hands */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* Outer glowing aura ring */}
          <div className="absolute inset-0 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-sky-500/20 blur-xl animate-pulse" />

          {/* Left Little Waving Hand */}
          <div className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 animate-bounce">
            <div className="relative w-6 h-6 rounded-full bg-blue-600 border border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.6)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-1 left-1" />
              {/* Cute tiny finger nubs */}
              <div className="absolute -top-1 left-0.5 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
              <div className="absolute -top-1.5 left-2 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
              <div className="absolute -top-1 left-3.5 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
            </div>
          </div>

          {/* Right Little Hand Holding Magic Spark */}
          <div className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 animate-pulse">
            <div className="relative w-6 h-6 rounded-full bg-blue-600 border border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.6)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute top-1 left-1" />
              <div className="absolute -top-1 left-0.5 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
              <div className="absolute -top-1.5 left-2 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
              <div className="absolute -top-1 left-3.5 w-2 h-2 rounded-full bg-blue-600 border-t border-sky-400" />
              {/* Casting spark */}
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-3.5 -right-1 animate-spin" />
            </div>
          </div>

          {/* Spherical Water Bubble Body */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-radial from-sky-400/40 via-cyan-800/80 to-blue-950 p-1 shadow-[0_0_35px_rgba(56,189,248,0.6)] flex items-center justify-center border-2 border-sky-400/90">
            {/* Top-left glass specular highlight */}
            <div className="absolute top-3 left-4 w-7 h-3 rounded-full bg-white/60 -rotate-45 blur-[0.5px]" />
            <div className="absolute bottom-4 right-5 w-4 h-2 rounded-full bg-sky-300/30 rotate-30" />

            {/* Cobalt Blue Speech-Bubble Face (From Image) */}
            <div className="relative w-14 h-8 rounded-full bg-blue-600 flex items-center justify-around px-2 shadow-xl border border-blue-400/40">
              {/* Little speech tail */}
              <div className="absolute -bottom-1.5 right-3.5 w-2.5 h-2.5 bg-blue-600 rotate-45 border-r border-b border-blue-400/40" />

              {/* Stylized Diamond Eyes */}
              <div className="w-3 h-3 bg-white rotate-45 flex items-center justify-center shadow-xs">
                <div className="w-1.5 h-1.5 bg-slate-950" />
              </div>
              <div className="w-3 h-3 bg-white rotate-45 flex items-center justify-center shadow-xs">
                <div className="w-1.5 h-1.5 bg-slate-950" />
              </div>

              {/* Sweet Curved Smile */}
              <div className="absolute bottom-1 w-3.5 h-2 border-b-2 border-slate-950 rounded-full" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-fantasy text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_24px_rgba(34,197,94,0.4)]">
          MONSTER SURVIVAL
        </h1>
        <p className="mt-1.5 text-neutral-300 text-xs sm:text-sm max-w-sm">
          Master 4 elemental powers, dash across grassy rock ruins, and vanquish the Abyssal Titans!
        </p>

        {/* Hall of Champions Top Score Preview Banner */}
        {topScore && (
          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenLeaderboard();
            }}
            className="w-full max-w-xs mt-3.5 p-2 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 flex items-center justify-between px-3 text-xs transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Top Champion: {topScore.playerName}
                </div>
                <div className="text-neutral-400 text-[11px]">
                  {topScore.score.toLocaleString()} pts • Lvl {topScore.finalLevel}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Quick Mode Switcher */}
        <div className="flex items-center justify-center gap-2 mt-4 p-1 rounded-xl bg-neutral-900/90 border border-neutral-800">
          {(['SURVIVAL', 'ENDLESS', 'HARDCORE'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                soundManager.playAttack();
                setSelectedQuickMode(mode);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedQuickMode === mode
                  ? mode === 'HARDCORE'
                    ? 'bg-red-600 text-white shadow-md'
                    : mode === 'ENDLESS'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs mt-4">
          {/* Big Play Now Button */}
          <button
            onClick={() => {
              soundManager.playLevelUp();
              onQuickStart(selectedQuickMode);
            }}
            className="relative group flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 active:scale-98 text-white font-fantasy font-black text-lg tracking-wider shadow-xl shadow-emerald-950/60 border border-emerald-400/40 transition-all cursor-pointer overflow-hidden"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-in-out pointer-events-none" />
            <Play className="w-5 h-5 fill-current" />
            PLAY {selectedQuickMode}
          </button>

          {/* Mode Selector Option */}
          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenModeSelect();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 active:scale-98 text-neutral-200 font-semibold text-xs tracking-wide border border-neutral-800 transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4 text-orange-400" />
            SELECT GAME MODE & DETAILS
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenLeaderboard();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 active:scale-98 text-amber-400 font-semibold text-xs tracking-wide border border-amber-500/30 transition-all cursor-pointer shadow-sm"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            LEADERBOARD / HALL OF CHAMPIONS
          </button>

          {/* How to play & Controls */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                soundManager.playAttack();
                onOpenHowToPlay();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 active:scale-98 text-neutral-300 font-medium text-xs border border-neutral-800 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              HOW TO PLAY
            </button>

            <button
              onClick={() => {
                soundManager.playAttack();
                onOpenSettings();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 active:scale-98 text-neutral-300 font-medium text-xs border border-neutral-800 transition-all cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-neutral-400" />
              CONTROLS
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 text-center text-[11px] text-neutral-500 flex items-center gap-2">
        <Skull className="w-3.5 h-3.5 text-purple-400" />
        <span>Survive hordes • Collect 4 powers • Slay the Titans</span>
      </div>
    </div>
  );
};
