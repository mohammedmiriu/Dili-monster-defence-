import React from 'react';
import { GameMode, PlayerStats, EquippedPower, Monster } from '../types/game';
import { MAX_POWER_SLOTS } from '../game/constants';
import { Heart, Shield, Sparkles, Skull, Pause, Crown, Plus, Zap } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface GameHUDProps {
  mode: GameMode;
  player: PlayerStats;
  equippedPowers: EquippedPower[];
  killCount: number;
  elapsedSeconds: number;
  survivalRemainingSeconds: number;
  boss: Monster | null;
  onPause: () => void;
  onCastPower: (slotIndex: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  mode,
  player,
  equippedPowers,
  killCount,
  elapsedSeconds,
  survivalRemainingSeconds,
  boss,
  onPause,
  onCastPower,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isSurvival = mode === 'SURVIVAL';
  const displayTimer = isSurvival ? formatTime(survivalRemainingSeconds) : formatTime(elapsedSeconds);

  const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
  const xpPercent = Math.max(0, Math.min(100, (player.xp / player.xpToNext) * 100));
  const shieldPercent = player.maxShield > 0 ? Math.min(100, (player.shield / player.maxShield) * 100) : 0;

  // 4 distinct power slots
  const slots = Array.from({ length: MAX_POWER_SLOTS }).map((_, idx) => {
    return equippedPowers[idx] || null;
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-4 select-none">
      {/* Top Header Section */}
      <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto">
        {/* Boss Health Bar if Active */}
        {boss && (
          <div className="w-full bg-neutral-950/90 border border-red-800/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md animate-pulse-subtle pointer-events-auto">
            <div className="flex items-center justify-between text-xs font-fantasy font-bold text-red-400 mb-1 px-1">
              <span className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                {boss.name}
              </span>
              <span className="text-neutral-300 tabular-nums">
                {Math.max(0, Math.round(boss.hp))} / {boss.maxHp}
              </span>
            </div>
            <div className="h-3 w-full bg-neutral-900 rounded overflow-hidden border border-red-950">
              <div
                className="h-full bg-linear-to-r from-red-600 via-orange-500 to-red-600 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Stats Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-xl p-2 sm:px-4 shadow-xl">
          {/* Player Avatar & Health/Shield */}
          <div className="flex items-center gap-2.5">
            {/* Cute Bubble Character Portrait */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-linear-to-b from-sky-400 to-blue-600 p-0.5 shadow-md shadow-sky-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-sky-950 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 rounded-full border border-sky-400/80" />
                {/* Cobalt blue face */}
                <div className="w-6 h-3.5 rounded-full bg-blue-600 flex items-center justify-around px-1 shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rotate-45 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-slate-900" />
                  </div>
                  <div className="w-1.5 h-1.5 bg-white rotate-45 flex items-center justify-center">
                    <div className="w-0.5 h-0.5 bg-slate-900" />
                  </div>
                </div>
              </div>
            </div>

            {/* Health & Shield */}
            <div className="flex flex-col gap-1 w-28 sm:w-48">
              <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-3 h-3 fill-current" />
                  HP
                </span>
                <span className="tabular-nums text-[11px]">
                  {Math.ceil(player.hp)} / {player.maxHp}
                </span>
              </div>

              <div className="h-2 sm:h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-linear-to-r from-rose-600 to-red-500 transition-all duration-100"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {player.maxShield > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="w-2.5 h-2.5 text-indigo-400" />
                  <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-100"
                      style={{ width: `${shieldPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center Timer & Mode Badge */}
          <div className="flex flex-col items-center">
            <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {isSurvival ? 'SURVIVAL TIMER' : mode}
            </div>
            <div
              className={`font-fantasy text-lg sm:text-2xl font-black tabular-nums tracking-widest ${
                isSurvival && survivalRemainingSeconds <= 60
                  ? 'text-red-500 animate-pulse'
                  : 'text-amber-400'
              }`}
            >
              {displayTimer}
            </div>
          </div>

          {/* Kills & Pause Button */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-neutral-300">
              <Skull className="w-3.5 h-3.5 text-purple-400" />
              <span className="tabular-nums">{killCount}</span>
            </div>

            <button
              onClick={() => {
                soundManager.playAttack();
                onPause();
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 shadow transition-colors cursor-pointer"
              title="Pause Game (ESC / P)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* XP Bar across top under stats */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 whitespace-nowrap">
            <Sparkles className="w-3 h-3" />
            LVL {player.level}
          </div>
          <div className="h-2 w-full bg-neutral-950/80 rounded-full overflow-hidden border border-neutral-800/80 backdrop-blur-xs">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-yellow-300 transition-all duration-150"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Interactive Power Slots - Placed at Top Shelf with Direct Tap to Cast */}
        <div className="flex items-center justify-between px-1 pointer-events-auto">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 shadow-md">
            <div className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 uppercase tracking-widest pl-1 pr-1.5 border-r border-neutral-800">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>POWERS</span>
            </div>

            {slots.map((power, idx) => {
              const cooldownRatio = power && power.cooldown > 0 && power.cooldownTimer > 0
                ? Math.min(1, power.cooldownTimer / power.cooldown)
                : 0;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (power) {
                      onCastPower(idx);
                    }
                  }}
                  disabled={!power}
                  className={`relative flex flex-col items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-lg transition-all ${
                    power
                      ? 'bg-neutral-900 border border-neutral-700 hover:border-amber-400 hover:scale-105 active:scale-95 shadow-sm cursor-pointer'
                      : 'bg-neutral-950/60 border border-dashed border-neutral-800 text-neutral-600 cursor-default'
                  }`}
                  title={
                    power
                      ? `[Key ${idx + 1}] Tap to Cast ${power.name} (Lvl ${power.level}) - ${power.description}`
                      : `Slot ${idx + 1} Empty (Unlock at level-up)`
                  }
                >
                  {power ? (
                    <>
                      <span className="text-base sm:text-lg">{power.icon}</span>
                      
                      {/* Slot Hotkey badge */}
                      <span className="absolute top-0.5 left-1 text-[8px] font-mono text-neutral-400 font-bold">
                        {idx + 1}
                      </span>

                      {/* Level dots */}
                      <div className="absolute bottom-0.5 flex gap-0.5">
                        {Array.from({ length: power.level }).map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-amber-400" />
                        ))}
                      </div>

                      {/* Cooldown radial/overlay wipe */}
                      {cooldownRatio > 0 && (
                        <div
                          className="absolute inset-0 rounded-lg bg-black/60 pointer-events-none"
                          style={{
                            clipPath: `polygon(0 ${cooldownRatio * 100}%, 100% ${cooldownRatio * 100}%, 100% 100%, 0 100%)`,
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Plus className="w-3 h-3 text-neutral-600" />
                      <span className="text-[7px] font-mono text-neutral-600">SLOT {idx + 1}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick tip */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-neutral-400 bg-neutral-950/70 border border-neutral-800/60 px-2.5 py-1 rounded-lg">
            <span>Tap powers or press <strong className="text-amber-400 font-mono">1, 2, 3, 4</strong> to cast</span>
          </div>
        </div>
      </div>

      {/* Empty bottom spacer - Leaves full screen open for joystick and touch controls! */}
      <div className="pointer-events-none h-2" />
    </div>
  );
};
