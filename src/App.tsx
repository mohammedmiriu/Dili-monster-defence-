import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GameMode, GameState, PowerCardOption, RunStatistics, GameSettings, Monster } from './types/game';
import { GameEngine } from './game/GameEngine';
import { MainMenu } from './components/MainMenu';
import { ModeSelectModal } from './components/ModeSelectModal';
import { GameHUD } from './components/GameHUD';
import { VirtualControls } from './components/VirtualControls';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverModal } from './components/GameOverModal';
import { SurvivalVictoryModal } from './components/SurvivalVictoryModal';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { soundManager } from './utils/audio';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // App UI States
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [activeMode, setActiveMode] = useState<GameMode>('SURVIVAL');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Level Up options
  const [levelUpOptions, setLevelUpOptions] = useState<PowerCardOption[]>([]);
  // Run outcome statistics
  const [runStats, setRunStats] = useState<RunStatistics | null>(null);

  // Synced HUD stats
  const [hudData, setHudData] = useState({
    player: {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20,
      facingAngle: 0,
      maxHp: 100,
      hp: 100,
      shield: 0,
      maxShield: 0,
      speed: 295,
      level: 1,
      xp: 0,
      xpToNext: 35,
      totalXp: 0,
      baseDamageMultiplier: 1,
      attackSpeedMultiplier: 1,
      attackRange: 320,
      critChance: 0.08,
      critDamage: 1.5,
      armor: 0,
      hpRegen: 1,
      bossDamageReduction: 0,
      areaMultiplier: 1,
      dashCooldown: 0,
      maxDashCooldown: 3.0,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0.22,
      dashSpeed: 680,
      specialCooldown: 0,
      maxSpecialCooldown: 12.0,
      specialTimer: 0,
      invulnerableTimer: 0,
    },
    equippedPowers: [] as any[],
    killCount: 0,
    elapsedSeconds: 0,
    survivalRemainingSeconds: 600,
    boss: null as Monster | null,
  });

  // Settings state with LocalStorage persistence
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('monster_survival_settings');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      musicEnabled: true,
      sfxEnabled: true,
      vibrationEnabled: true,
      joystickSensitivity: 1.0,
    };
  });

  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('monster_survival_settings', JSON.stringify(updated));
      } catch {
        // Fallback
      }
      return updated;
    });
  };

  const handleToggleAudio = () => {
    setIsAudioMuted((prev) => {
      const next = !prev;
      handleUpdateSettings({ musicEnabled: !next, sfxEnabled: !next });
      return next;
    });
  };

  // Initialize GameEngine once
  useEffect(() => {
    const engine = new GameEngine({
      onStateChange: (state) => {
        setGameState(state);
      },
      onLevelUp: (options) => {
        setLevelUpOptions(options);
        setGameState('LEVEL_UP');
      },
      onGameOver: (stats) => {
        setRunStats(stats);
        setGameState('GAME_OVER');
      },
      onVictory: (stats) => {
        setRunStats(stats);
        setGameState('VICTORY');
      },
      onBossSpawn: (boss) => {
        setHudData((prev) => ({ ...prev, boss }));
      },
      onBossDefeated: () => {
        setHudData((prev) => ({ ...prev, boss: null }));
      },
    });

    engineRef.current = engine;

    if (canvasRef.current) {
      engine.setCanvas(canvasRef.current);
    }

    return () => {
      engine.stopLoop();
    };
  }, []);

  // Update canvas on resize
  useEffect(() => {
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        engineRef.current.resizeCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync HUD state during gameplay (every ~50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (engine && engine.state !== 'MENU') {
        setHudData({
          player: { ...engine.player },
          equippedPowers: [...engine.equippedPowers],
          killCount: engine.monsterKillCount,
          elapsedSeconds: Math.floor(engine.elapsedTime),
          survivalRemainingSeconds: Math.floor(engine.survivalRemainingTime),
          boss: engine.currentBoss,
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Keyboard controls & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const key = e.key.toLowerCase();

      if (key === 'escape' || key === 'p') {
        if (engine.state === 'PLAYING') {
          engine.pauseGame();
        } else if (engine.state === 'PAUSED') {
          engine.resumeGame();
        }
        return;
      }

      if (engine.state !== 'PLAYING') return;

      if (key === 'w' || key === 'arrowup') engine.input.keys.w = true;
      if (key === 's' || key === 'arrowdown') engine.input.keys.s = true;
      if (key === 'a' || key === 'arrowleft') engine.input.keys.a = true;
      if (key === 'd' || key === 'arrowright') engine.input.keys.d = true;

      // Number keys for casting powers 1, 2, 3, 4
      if (key === '1') engine.triggerCastPower(0);
      if (key === '2') engine.triggerCastPower(1);
      if (key === '3') engine.triggerCastPower(2);
      if (key === '4') engine.triggerCastPower(3);

      if (key === ' ') {
        e.preventDefault();
        engine.triggerDash();
      }

      if (key === 'e' || key === 'q' || key === 'f') {
        engine.triggerSpecial();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') engine.input.keys.w = false;
      if (key === 's' || key === 'arrowdown') engine.input.keys.s = false;
      if (key === 'a' || key === 'arrowleft') engine.input.keys.a = false;
      if (key === 'd' || key === 'arrowright') engine.input.keys.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Start a new run
  const handleStartRun = useCallback((mode: GameMode) => {
    setActiveMode(mode);
    setIsSettingsOpen(false);
    setIsHowToPlayOpen(false);
    setIsLeaderboardOpen(false);
    if (engineRef.current && canvasRef.current) {
      engineRef.current.setCanvas(canvasRef.current);
      engineRef.current.startRun(mode);
    }
  }, []);

  // Virtual Controls callbacks
  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.input.joystickX = x;
      engineRef.current.input.joystickY = y;
    }
  }, []);

  const handleDash = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerDash();
    }
  }, []);

  const handleSpecial = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerSpecial();
    }
  }, []);

  const handleAttack = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerManualAttack();
    }
  }, []);

  const handleCastPower = useCallback((slotIndex: number) => {
    if (engineRef.current) {
      engineRef.current.triggerCastPower(slotIndex);
    }
  }, []);

  // Level Up Select
  const handleSelectPower = useCallback((option: PowerCardOption) => {
    if (engineRef.current) {
      engineRef.current.selectPower(option);
    }
  }, []);

  const isPlayingOrPaused =
    gameState === 'PLAYING' ||
    gameState === 'PAUSED' ||
    gameState === 'LEVEL_UP';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* 2D Canvas for game rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block touch-none"
      />

      {/* Main Menu View */}
      {gameState === 'MENU' && (
        <MainMenu
          onOpenModeSelect={() => setGameState('MODE_SELECT')}
          onQuickStart={handleStartRun}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {/* Game Mode Selection Modal */}
      {gameState === 'MODE_SELECT' && (
        <ModeSelectModal
          onSelectMode={handleStartRun}
          onBack={() => setGameState('MENU')}
        />
      )}

      {/* HUD during active game states */}
      {isPlayingOrPaused && (
        <GameHUD
          mode={activeMode}
          player={hudData.player}
          equippedPowers={hudData.equippedPowers}
          killCount={hudData.killCount}
          elapsedSeconds={hudData.elapsedSeconds}
          survivalRemainingSeconds={hudData.survivalRemainingSeconds}
          boss={hudData.boss}
          onPause={() => {
            if (engineRef.current) engineRef.current.pauseGame();
          }}
          onCastPower={handleCastPower}
        />
      )}

      {/* Touch Virtual Controls */}
      {isPlayingOrPaused && gameState === 'PLAYING' && (
        <VirtualControls
          player={hudData.player}
          equippedPowers={hudData.equippedPowers}
          onJoystickMove={handleJoystickMove}
          onDash={handleDash}
          onSpecial={handleSpecial}
          onAttack={handleAttack}
          onCastPower={handleCastPower}
          sensitivity={settings.joystickSensitivity}
        />
      )}

      {/* Level-Up Modal */}
      {gameState === 'LEVEL_UP' && (
        <LevelUpModal
          options={levelUpOptions}
          onSelectOption={handleSelectPower}
          level={hudData.player.level}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && runStats && (
        <GameOverModal
          stats={runStats}
          onPlayAgain={() => handleStartRun(activeMode)}
          onMainMenu={() => {
            if (engineRef.current) engineRef.current.stopLoop();
            setGameState('MENU');
          }}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* Survival Victory Modal */}
      {gameState === 'VICTORY' && runStats && (
        <SurvivalVictoryModal
          stats={runStats}
          onPlayAgain={() => handleStartRun(activeMode)}
          onMainMenu={() => {
            if (engineRef.current) engineRef.current.stopLoop();
            setGameState('MENU');
          }}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={() => {
            if (engineRef.current) engineRef.current.resumeGame();
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onMainMenu={() => {
            if (engineRef.current) engineRef.current.stopLoop();
            setGameState('MENU');
          }}
        />
      )}

      {/* Hall of Champions Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Settings Modal (accessible anywhere) */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* How To Play Modal */}
      {isHowToPlayOpen && (
        <HowToPlayModal onClose={() => setIsHowToPlayOpen(false)} />
      )}
    </div>
  );
}
