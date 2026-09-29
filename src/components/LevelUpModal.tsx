import React from 'react';
import { PowerCardOption } from '../types/game';
import { Sparkles, ArrowRight, Zap, Shield, Heart, Activity } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LevelUpModalProps {
  options: PowerCardOption[];
  onSelectOption: (option: PowerCardOption) => void;
  level: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  options,
  onSelectOption,
  level,
}) => {
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'UNIQUE_HEALTH':
        return {
          badge: 'border-rose-500/60 bg-rose-950/50 text-rose-400',
          border: 'border-rose-800/60 hover:border-rose-500 hover:shadow-rose-950/60',
          button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50',
          iconBg: 'bg-rose-950/40 border-rose-500/50 text-rose-400',
        };
      case 'UNIQUE_SPEED':
        return {
          badge: 'border-cyan-500/60 bg-cyan-950/50 text-cyan-400',
          border: 'border-cyan-800/60 hover:border-cyan-500 hover:shadow-cyan-950/60',
          button: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50',
          iconBg: 'bg-cyan-950/40 border-cyan-500/50 text-cyan-400',
        };
      case 'NEW_POWER':
        return {
          badge: 'border-amber-500/60 bg-amber-950/50 text-amber-400',
          border: 'border-amber-800/60 hover:border-amber-500 hover:shadow-amber-950/60',
          button: 'bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black shadow-amber-950/50',
          iconBg: 'bg-amber-950/40 border-amber-500/50 text-amber-400',
        };
      case 'POWER_UPGRADE':
        return {
          badge: 'border-sky-500/60 bg-sky-950/50 text-sky-400',
          border: 'border-sky-800/60 hover:border-sky-500 hover:shadow-sky-950/60',
          button: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50',
          iconBg: 'bg-sky-950/40 border-sky-500/50 text-sky-400',
        };
      case 'DEFENCE_POWER':
      default:
        return {
          badge: 'border-emerald-500/60 bg-emerald-950/50 text-emerald-400',
          border: 'border-emerald-800/60 hover:border-emerald-500 hover:shadow-emerald-950/60',
          button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50',
          iconBg: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400',
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'UNIQUE_HEALTH':
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />;
      case 'UNIQUE_SPEED':
        return <Zap className="w-3.5 h-3.5 text-cyan-400 fill-current" />;
      case 'NEW_POWER':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'POWER_UPGRADE':
        return <ArrowRight className="w-3.5 h-3.5 text-sky-400" />;
      case 'DEFENCE_POWER':
      default:
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl flex flex-col items-center my-auto">
        {/* Glow Title Header */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-spin" /> REACHED LEVEL {level}
          </div>
          <h2 className="font-fantasy text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-linear-to-b from-amber-200 via-amber-400 to-amber-600 drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)] tracking-wide">
            CHOOSE YOUR BLESSING
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-md mx-auto">
            Select one power to empower your spirit for the escalating hordes.
          </p>
        </div>

        {/* PERFECTLY ALIGNED THREE CHOICES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full">
          {options.map((opt) => {
            const styles = getCategoryStyles(opt.category);
            const categoryIcon = getCategoryIcon(opt.category);

            return (
              <div
                key={opt.id}
                onClick={() => {
                  soundManager.playLevelUp();
                  onSelectOption(opt);
                }}
                className={`group relative flex flex-col rounded-2xl bg-neutral-900/95 border ${styles.border} hover:scale-[1.02] hover:bg-neutral-850 transition-all duration-200 cursor-pointer shadow-2xl overflow-hidden p-4 sm:p-5`}
              >
                {/* 1. Aligned Category Header Row */}
                <div className="h-8 flex items-center justify-between w-full mb-3">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold tracking-wider border uppercase ${styles.badge}`}>
                    {categoryIcon}
                    <span className="truncate">{opt.categoryTitle}</span>
                  </div>

                  {opt.currentLevel !== undefined && (
                    <span className="text-xs font-mono font-bold text-amber-300 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 shadow-inner">
                      Lvl {opt.currentLevel} → {opt.nextLevel}
                    </span>
                  )}
                  {opt.category === 'UNIQUE_HEALTH' && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800">
                      ONCE
                    </span>
                  )}
                  {opt.category === 'UNIQUE_SPEED' && (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800">
                      ONCE
                    </span>
                  )}
                </div>

                {/* 2. Aligned Icon Box */}
                <div className="flex items-center justify-center my-2">
                  <div
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl bg-neutral-950 border-2 shadow-inner group-hover:scale-110 transition-transform duration-200"
                    style={{ borderColor: opt.color }}
                  >
                    {opt.icon}
                  </div>
                </div>

                {/* 3. Aligned Title Box (Fixed height for perfect baseline across all 3 cards) */}
                <div className="h-12 flex items-center justify-center text-center px-1">
                  <h3 className="font-fantasy font-black text-base sm:text-lg text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                    {opt.name}
                  </h3>
                </div>

                {/* 4. Aligned Description Box (Fixed height and uniform padding) */}
                <div className="h-20 sm:h-22 flex items-center justify-center text-center px-1">
                  <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3">
                    {opt.description}
                  </p>
                </div>

                {/* 5. Aligned Status/Type Badge Row */}
                <div className="h-7 flex items-center justify-center my-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 bg-neutral-950/80 px-2.5 py-0.5 rounded-full border border-neutral-800 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-neutral-500" />
                    {opt.category === 'NEW_POWER'
                      ? 'New Weapon Slot'
                      : opt.category === 'POWER_UPGRADE'
                      ? 'Tier Upgrade'
                      : opt.category === 'UNIQUE_HEALTH'
                      ? 'Permanent Health'
                      : opt.category === 'UNIQUE_SPEED'
                      ? 'Permanent Speed'
                      : 'Combat Defense'}
                  </span>
                </div>

                {/* 6. Aligned Bottom Action Button */}
                <div className="mt-3 w-full">
                  <button
                    className={`w-full h-10 rounded-xl flex items-center justify-center gap-1.5 font-fantasy font-bold text-xs tracking-wider border border-white/20 transition-all ${styles.button} shadow-lg group-hover:brightness-110 active:scale-98`}
                  >
                    <span>SELECT BLESSING</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
