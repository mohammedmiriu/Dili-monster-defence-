import React, { useState, useEffect } from 'react';
import { GameMode } from '../types/game';
import { getLeaderboard, LeaderboardEntry } from '../utils/leaderboard';
import { Trophy, Crown, Skull, Sparkles, Clock, X, Flame } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightEntryId?: string | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highlightEntryId,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | GameMode>('ALL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(getLeaderboard());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEntries = selectedFilter === 'ALL'
    ? entries
    : entries.filter((e) => e.mode === selectedFilter);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-linear-to-b from-amber-300 to-amber-500 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/30">
          <Crown className="w-4 h-4 fill-current" />
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-linear-to-b from-slate-200 to-slate-400 text-neutral-950 font-black text-xs shadow-md">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-linear-to-b from-amber-600 to-amber-800 text-amber-100 font-black text-xs shadow-md">
          3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 text-neutral-400 font-bold text-xs font-mono">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-neutral-950/95 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative px-6 py-5 border-b border-neutral-800/80 bg-linear-to-r from-amber-950/40 via-neutral-950 to-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center gap-2">
                HALL OF CHAMPIONS
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400">
                Top recorded survival scores across the dark glade
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playAttack();
              onClose();
            }}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-900 bg-neutral-950/60 overflow-x-auto">
          {(['ALL', 'SURVIVAL', 'ENDLESS', 'HARDCORE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                soundManager.playAttack();
                setSelectedFilter(tab);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer ${
                selectedFilter === tab
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 font-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {tab === 'ALL' ? 'ALL MODES' : tab}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-2.5 flex-1">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No runs recorded in this mode yet. Play a run to cement your name!
            </div>
          ) : (
            filteredEntries.map((entry, index) => {
              const isHighlighted = entry.id === highlightEntryId;

              return (
                <div
                  key={entry.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 rounded-xl border transition-all ${
                    isHighlighted
                      ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-500/10'
                      : index < 3
                      ? 'bg-neutral-900/80 border-neutral-700/80 hover:border-neutral-600'
                      : 'bg-neutral-950/80 border-neutral-800/60 hover:border-neutral-700'
                  }`}
                >
                  {/* Left: Rank, Player Name, Mode Badge, Date */}
                  <div className="flex items-center gap-3">
                    {getRankBadge(index)}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-fantasy font-bold text-white text-base">
                          {entry.playerName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                            entry.mode === 'HARDCORE'
                              ? 'bg-red-950/60 border-red-800/80 text-red-400'
                              : entry.mode === 'ENDLESS'
                              ? 'bg-purple-950/60 border-purple-800/80 text-purple-400'
                              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
                          }`}
                        >
                          {entry.mode}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Lvl {entry.finalLevel}
                        </span>
                        <span className="flex items-center gap-1">
                          <Skull className="w-3 h-3 text-rose-400" />
                          {entry.monstersDefeated} kills
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          {formatTime(entry.survivalTimeSeconds)}
                        </span>
                        {entry.bossesDefeated > 0 && (
                          <span className="flex items-center gap-1 text-red-400 font-bold">
                            <Flame className="w-3 h-3 text-red-500 fill-current" />
                            {entry.bossesDefeated} {entry.bossesDefeated === 1 ? 'Boss' : 'Bosses'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Powers Used */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                    {/* Powers Icons */}
                    <div className="flex items-center gap-1">
                      {entry.powersCollected.map((pow, pIdx) => (
                        <span
                          key={pIdx}
                          className="w-6 h-6 rounded bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center text-xs"
                          title={`${pow.name} (Lvl ${pow.level})`}
                        >
                          {pow.icon}
                        </span>
                      ))}
                    </div>

                    {/* Total Score */}
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold">
                        Score
                      </div>
                      <div className="font-fantasy font-black text-amber-400 text-lg tabular-nums">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-900 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-500">
          <span>High scores update automatically upon run completion</span>
          <button
            onClick={() => {
              soundManager.playAttack();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
