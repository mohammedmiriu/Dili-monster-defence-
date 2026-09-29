import React from 'react';
import { ArrowLeft, Gamepad2, Zap, Shield, Skull, Sparkles, Navigation } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-xl p-5 sm:p-7 shadow-2xl flex flex-col gap-5 my-auto max-h-[90vh] overflow-y-auto">
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
              HOW TO PLAY
            </h2>
          </div>
        </div>

        {/* Content sections */}
        <div className="flex flex-col gap-4 text-xs sm:text-sm text-neutral-300">
          {/* Controls */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <h3 className="font-fantasy font-bold text-amber-400 flex items-center gap-2 mb-2 text-sm">
              <Gamepad2 className="w-4 h-4" /> CONTROLS
            </h3>
            <ul className="space-y-1.5 text-neutral-400">
              <li>
                <strong className="text-white">Movement:</strong> Drag the virtual joystick (bottom-left) or use <span className="text-amber-400 font-mono">W / A / S / D</span> on desktop.
              </li>
              <li>
                <strong className="text-white">Auto-Attack:</strong> Your active spells automatically unleash upon foes entering attack range.
              </li>
              <li>
                <strong className="text-white">Dash (💨):</strong> Tap Dash or press <span className="text-amber-400 font-mono">Space</span> to dodge through enemy attacks with temporary invulnerability.
              </li>
              <li>
                <strong className="text-white">Nova Special (💥):</strong> Tap Nova or press <span className="text-amber-400 font-mono">E</span> to vaporize enemy projectiles and trigger a massive arcane burst.
              </li>
            </ul>
          </div>

          {/* Level-Up & Powers */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <h3 className="font-fantasy font-bold text-sky-400 flex items-center gap-2 mb-2 text-sm">
              <Sparkles className="w-4 h-4" /> 3 POWER SELECTION SYSTEM
            </h3>
            <p className="text-neutral-400 mb-2">
              Collect glowing XP orbs dropped by monsters to fill your progress bar. When it fills, time freezes and you are granted exactly 3 choices:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2 rounded bg-neutral-900 border border-amber-900/40 text-xs">
                <span className="font-bold text-amber-400 block mb-1">🆕 NEW POWER</span>
                Unlock abilities like Fireball, Lightning, Ice Blast, or Orbiting Orbs.
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-sky-900/40 text-xs">
                <span className="font-bold text-sky-400 block mb-1">⬆️ UPGRADE</span>
                Enhance damage, projectile count, attack speed, and critical strikes.
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-emerald-900/40 text-xs">
                <span className="font-bold text-emerald-400 block mb-1">🛡️ DEFENCE</span>
                Boost Max HP, shields, health regeneration, and armor plating.
              </div>
            </div>
          </div>

          {/* Monsters & Bosses */}
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800">
            <h3 className="font-fantasy font-bold text-purple-400 flex items-center gap-2 mb-2 text-sm">
              <Skull className="w-4 h-4" /> MONSTERS & TITAN BOSSES
            </h3>
            <p className="text-neutral-400 mb-2">
              Learn enemy behaviors to survive the arena:
            </p>
            <ul className="space-y-1 text-neutral-400">
              <li>• <strong className="text-lime-400">Normal Creepers:</strong> Balanced packs that swarm together.</li>
              <li>• <strong className="text-orange-400">Hellhounds:</strong> Rapid sprinters that dash directly at you.</li>
              <li>• <strong className="text-slate-400">Stone Golems:</strong> Imposing, high-HP tanks that block movement.</li>
              <li>• <strong className="text-purple-400">Cultist Shamans:</strong> Keep distance and shoot dark magic orbs.</li>
              <li>• <strong className="text-red-400">Blood Champions (Elite):</strong> Glowing aura mini-bosses with extra health.</li>
              <li>• <strong className="text-red-500 font-bold">Abyssal Overlord (Boss):</strong> Massive health bar, bullet hell projectile rings, and minion summons.</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playAttack();
            onClose();
          }}
          className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 active:scale-98 text-white font-fantasy font-bold text-sm tracking-wide transition-all cursor-pointer"
        >
          READY FOR BATTLE
        </button>
      </div>
    </div>
  );
};
