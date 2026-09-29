import React, { useRef, useState, useEffect } from 'react';
import { PlayerStats, EquippedPower } from '../types/game';
import { Wind, Zap, Sword } from 'lucide-react';

interface VirtualControlsProps {
  player: PlayerStats;
  equippedPowers?: EquippedPower[];
  onJoystickMove: (x: number, y: number) => void;
  onDash: () => void;
  onSpecial: () => void;
  onAttack: () => void;
  onCastPower?: (slotIndex: number) => void;
  sensitivity: number;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({
  player,
  equippedPowers = [],
  onJoystickMove,
  onDash,
  onSpecial,
  onAttack,
  onCastPower,
  sensitivity,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  // Joystick touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!joystickBaseRef.current) return;
    const touch = e.changedTouches[0];
    activeTouchId.current = touch.identifier;
    setIsDragging(true);
    updateJoystickPos(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || activeTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        updateJoystickPos(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (activeTouchId.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === activeTouchId.current) {
        activeTouchId.current = null;
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
        break;
      }
    }
  };

  // Mouse handlers for joystick
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateJoystickPos(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && activeTouchId.current === null) {
        updateJoystickPos(e.clientX, e.clientY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging && activeTouchId.current === null) {
        setIsDragging(false);
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove(0, 0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateJoystickPos = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const targetX = Math.cos(angle) * clampedDist;
    const targetY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: targetX, y: targetY });

    const normX = (targetX / maxRadius) * sensitivity;
    const normY = (targetY / maxRadius) * sensitivity;
    onJoystickMove(normX, normY);
  };

  const dashCooldownPct = player.dashCooldown > 0 ? player.dashCooldown / player.maxDashCooldown : 0;
  const specialCooldownPct = player.specialCooldown > 0 ? player.specialCooldown / player.maxSpecialCooldown : 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none overflow-hidden">
      {/* LEFT SIDE: Virtual Touch Joystick */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-neutral-900/60 backdrop-blur-md border-2 border-neutral-700/60 shadow-2xl flex items-center justify-center touch-none cursor-pointer"
        >
          <div className="absolute inset-2 rounded-full border border-neutral-800 pointer-events-none" />

          {/* Draggable Knob */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-radial from-neutral-700 to-neutral-800 border-2 ${
              isDragging ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'border-neutral-500/80 shadow-lg'
            } flex items-center justify-center transition-transform duration-75`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-5 h-5 rounded-full bg-neutral-900/80 border border-neutral-600" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Action & Ability Buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-auto">
        {/* Quick Spell Row if multiple powers are equipped */}
        {equippedPowers.length > 1 && onCastPower && (
          <div className="flex items-center gap-2 mb-1 bg-neutral-950/70 p-1 rounded-xl backdrop-blur-xs border border-neutral-800/60 shadow-md">
            {equippedPowers.map((pow, idx) => (
              <button
                key={idx}
                onClick={() => onCastPower(idx)}
                className="w-10 h-10 rounded-lg bg-neutral-900 border border-neutral-700/80 hover:border-amber-400 text-sm flex items-center justify-center active:scale-90 transition-transform shadow cursor-pointer"
                title={`Cast ${pow.name}`}
              >
                <span>{pow.icon}</span>
              </button>
            ))}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex items-end gap-3 sm:gap-4">
          {/* Dash Button */}
          <button
            onClick={onDash}
            disabled={player.dashCooldown > 0}
            className={`relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-neutral-900/85 backdrop-blur-md border-2 ${
              player.dashCooldown <= 0
                ? 'border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.35)] active:scale-92 cursor-pointer'
                : 'border-neutral-700 opacity-60 cursor-not-allowed'
            } text-sky-400 transition-all`}
            title="Dash (Space)"
          >
            <Wind className="w-6 h-6" />
            <span className="absolute -bottom-5 text-[10px] font-bold text-neutral-400 tracking-wider">
              DASH
            </span>

            {dashCooldownPct > 0 && (
              <div
                className="absolute inset-0 rounded-full bg-neutral-950/75 flex items-center justify-center text-xs font-bold text-white tabular-nums"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    dashCooldownPct > 0.125 ? '100% 0%,' : ''
                  } ${dashCooldownPct > 0.375 ? '100% 100%,' : ''} ${
                    dashCooldownPct > 0.625 ? '0% 100%,' : ''
                  } ${dashCooldownPct > 0.875 ? '0% 0%,' : ''} 50% 0%)`,
                }}
              >
                {player.dashCooldown.toFixed(1)}s
              </div>
            )}
          </button>

          {/* Attack Button (Casts all active powers in a burst!) */}
          <button
            onClick={onAttack}
            className="relative group w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-neutral-900/85 backdrop-blur-md border-2 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-92 cursor-pointer text-emerald-400 transition-all"
            title="Cast All Powers Barrage (Click / Space)"
          >
            <Sword className="w-6 h-6" />
            <span className="absolute -bottom-5 text-[10px] font-bold text-neutral-400 tracking-wider">
              ATTACK
            </span>
          </button>

          {/* Special Ultimate Ability Button */}
          <button
            onClick={onSpecial}
            disabled={player.specialCooldown > 0}
            className={`relative group w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center bg-neutral-900/85 backdrop-blur-md border-2 ${
              player.specialCooldown <= 0
                ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse active:scale-92 cursor-pointer'
                : 'border-neutral-700 opacity-60 cursor-not-allowed'
            } text-purple-300 transition-all`}
            title="Nova Special (E / Right Click)"
          >
            <Zap className="w-7 h-7 fill-current" />
            <span className="absolute -bottom-5 text-[10px] font-bold text-neutral-400 tracking-wider">
              NOVA
            </span>

            {specialCooldownPct > 0 && (
              <div className="absolute inset-0 rounded-full bg-neutral-950/75 flex items-center justify-center text-xs font-bold text-white tabular-nums">
                {player.specialCooldown.toFixed(0)}s
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
