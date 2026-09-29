import React, { useState } from 'react';
import { RunStatistics } from '../types/game';
import { RotateCcw, Home, Skull, Clock, Trophy, Zap, ShieldAlert, Check, Award } from 'lucide-react';
import { soundManager } from '../utils/audio';
import { calculateScore, saveLeaderboardEntry } from '../utils/leaderboard';

interface GameOverModalProps {
  stats: RunStatistics;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onPlayAgain,
  onMainMenu,
  onOpenLeaderboard,
}) => {
  const isHardcore = stats.mode === 'HARDCORE';
  const score = calculateScore(stats);
  const [playerName, setPlayerName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSaved) return;
    saveLeaderboardEntry(playerName || 'Heroic Spirit', stats);
    setHasSaved(true);
    soundManager.playLevelUp();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col items-center text-center my-auto">
        {/* Skull Icon */}
        <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-500 mb-3 shadow-lg shadow-red-950/50">
          <Skull className="w-7 h-7" />
        </div>

        {/* Title */}
        <h2 className="font-fantasy text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          {isHardcore ? 'HARDCORE RUN ENDED' : 'GAME OVER'}
        </h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-xs">
          {isHardcore
            ? 'The abyss claims another soul. No second chances exist.'
            : 'Overcome by the dark tide. Rise again and conquer the glade!'}
        </p>

        {/* Run Score Banner */}
        <div className="w-full mt-4 p-2.5 rounded-xl bg-neutral-950 border border-amber-500/40 flex items-center justify-between px-4">
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
            <Award className="w-4 h-4" /> Run Score
          </span>
          <span className="font-fantasy text-xl font-black text-amber-400 tabular-nums">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full my-4 text-left">
          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Final Level
            </span>
            <span className="block font-fantasy text-lg font-bold text-white mt-0.5 tabular-nums">
              Level {stats.finalLevel}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
              <Skull className="w-3.5 h-3.5 text-purple-400" /> Monsters Slain
            </span>
            <span className="block font-fantasy text-lg font-bold text-white mt-0.5 tabular-nums">
              {stats.monstersDefeated}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-400" /> Survival Time
            </span>
            <span className="block font-fantasy text-lg font-bold text-white mt-0.5 tabular-nums">
              {formatTime(stats.survivalTimeSeconds)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Bosses Slain
            </span>
            <span className="block font-fantasy text-lg font-bold text-white mt-0.5 tabular-nums">
              {stats.bossesDefeated}
            </span>
          </div>
        </div>

        {/* Powers Collected */}
        <div className="w-full mb-4 text-left">
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mb-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Powers Collected ({stats.powersCollected.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stats.powersCollected.map((power) => (
              <div
                key={power.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200"
              >
                <span>{power.icon}</span>
                <span className="font-semibold">{power.name}</span>
                <span className="text-amber-400 font-mono text-[9px]">★{power.level}</span>
              </div>
            ))}
            {stats.powersCollected.length === 0 && (
              <span className="text-xs text-neutral-500">None</span>
            )}
          </div>
        </div>

        {/* Save to Leaderboard Form */}
        <form onSubmit={handleSaveScore} className="w-full mb-4 flex gap-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={hasSaved}
            placeholder={hasSaved ? 'Recorded in Hall of Champions!' : 'Enter your champion name'}
            maxLength={18}
            className="flex-1 px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-amber-400 transition-colors disabled:opacity-75"
          />
          <button
            type="submit"
            disabled={hasSaved}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              hasSaved
                ? 'bg-emerald-950 border border-emerald-500/80 text-emerald-400'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md'
            }`}
          >
            {hasSaved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Saved
              </>
            ) : (
              'Save Score'
            )}
          </button>
        </form>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
          <button
            onClick={() => {
              soundManager.playLevelUp();
              onPlayAgain();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 active:scale-98 text-white font-fantasy font-bold text-xs tracking-wide shadow-lg shadow-red-950/60 border border-red-500/40 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>

          <button
            onClick={() => {
              soundManager.playAttack();
              onOpenLeaderboard();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:scale-98 text-amber-400 font-semibold text-xs tracking-wide border border-neutral-700 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4" /> LEADERBOARD
          </button>

          <button
            onClick={() => {
              soundManager.playAttack();
              onMainMenu();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-neutral-300 font-semibold text-xs tracking-wide border border-neutral-800 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
