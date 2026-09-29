import {
  GameMode,
  GameState,
  PlayerStats,
  Monster,
  Projectile,
  XpOrb,
  Particle,
  DamageNumber,
  EquippedPower,
  PowerCardOption,
  RunStatistics,
} from '../types/game';
import { ARENA_WIDTH, ARENA_HEIGHT, BASE_PLAYER_SPEED, PLAYER_RADIUS, MAX_POWER_SLOTS, MONSTER_CONFIGS } from './constants';
import { ArenaManager } from './arena';
import { ALL_POWERS_META, generateLevelUpOptions } from './powers';
import { soundManager } from '../utils/audio';

export interface GameEngineCallbacks {
  onStateChange: (state: GameState) => void;
  onLevelUp: (options: PowerCardOption[]) => void;
  onGameOver: (stats: RunStatistics) => void;
  onVictory: (stats: RunStatistics) => void;
  onBossSpawn: (boss: Monster) => void;
  onBossDefeated: (boss: Monster) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement | null = null;
  public ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Game configuration
  public mode: GameMode = 'SURVIVAL';
  public state: GameState = 'MENU';
  public arena: ArenaManager;
  public callbacks: GameEngineCallbacks;

  // Camera
  public camera = { x: 0, y: 0, width: 800, height: 600, targetX: 0, targetY: 0 };

  // Entities
  public player: PlayerStats;
  public equippedPowers: EquippedPower[] = [];
  public monsters: Monster[] = [];
  public projectiles: Projectile[] = [];
  public xpOrbs: XpOrb[] = [];
  public particles: Particle[] = [];
  public damageNumbers: DamageNumber[] = [];
  public currentBoss: Monster | null = null;

  // Timers & Stats
  public elapsedTime: number = 0; // seconds elapsed
  public survivalRemainingTime: number = 600; // 10 minutes in survival
  public monsterKillCount: number = 0;
  public bossesDefeatedCount: number = 0;
  public spawnTimer: number = 0;
  public spawnInterval: number = 0.95; // tighter initial spawn (harder)
  public nextId: number = 1;

  // Boss wave trigger flags for survival
  public eliteIntroduced: boolean = false;
  public surgeStarted: boolean = false;
  public finalBossSpawned: boolean = false;
  public survivalBossDefeated: boolean = false;
  public playerAttackAnimTimer: number = 0;
  public lastBossLevelSpawned: number = 0;
  public bloodSplats: Array<{
    x: number;
    y: number;
    radius: number;
    color: string;
    alpha: number;
    life: number;
    drops: Array<{ dx: number; dy: number; r: number }>;
  }> = [];

  // Controls input state
  public input = {
    joystickX: 0,
    joystickY: 0,
    keys: { w: false, a: false, s: false, d: false, space: false, e: false },
    mouse: { x: 0, y: 0, isDown: false, worldX: 0, worldY: 0 },
  };

  // Screen shake
  public screenShake = { intensity: 0, duration: 0 };

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    this.arena = new ArenaManager();
    this.player = this.createDefaultPlayer();
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.resizeCanvas();
  }

  public resizeCanvas() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (this.canvas.width !== w * dpr || this.canvas.height !== h * dpr) {
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
    }

    this.camera.width = w;
    this.camera.height = h;
  }

  private createDefaultPlayer(): PlayerStats {
    const isHardcore = this.mode === 'HARDCORE';
    return {
      x: ARENA_WIDTH / 2,
      y: ARENA_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: PLAYER_RADIUS,
      facingAngle: 0,
      maxHp: isHardcore ? 60 : 100,
      hp: isHardcore ? 60 : 100,
      shield: 0,
      maxShield: 0,
      speed: BASE_PLAYER_SPEED,
      level: 1,
      xp: 0,
      xpToNext: 35,
      totalXp: 0,
      hasTakenHealthPower: false,
      hasTakenSpeedPower: false,

      baseDamageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0,
      attackRange: 320,
      critChance: 0.08,
      critDamage: 1.5,
      armor: 0,
      hpRegen: isHardcore ? 0.3 : 0.8,
      bossDamageReduction: 0,
      areaMultiplier: 1.0,

      dashCooldown: 0,
      maxDashCooldown: 2.8,
      dashTimer: 0,
      isDashing: false,
      dashDuration: 0.22,
      dashSpeed: 680,

      specialCooldown: 0,
      maxSpecialCooldown: 12.0,
      specialTimer: 0,

      invulnerableTimer: 0,
    };
  }

  public startRun(mode: GameMode) {
    this.mode = mode;
    this.arena = new ArenaManager();
    this.player = this.createDefaultPlayer();
    this.equippedPowers = [];
    this.monsters = [];
    this.projectiles = [];
    this.xpOrbs = [];
    this.particles = [];
    this.damageNumbers = [];
    this.bloodSplats = [];
    this.currentBoss = null;
    this.playerAttackAnimTimer = 0;
    this.lastBossLevelSpawned = 0;

    this.elapsedTime = 0;
    this.survivalRemainingTime = 600; // 10:00
    this.monsterKillCount = 0;
    this.bossesDefeatedCount = 0;
    this.spawnTimer = 0;
    this.spawnInterval = mode === 'HARDCORE' ? 0.65 : 0.95; // Harder spawn timing

    this.eliteIntroduced = false;
    this.surgeStarted = false;
    this.finalBossSpawned = false;
    this.survivalBossDefeated = false;

    // Give default starter power: Fireball (Slot 1)
    const starterMeta = ALL_POWERS_META.fireball;
    this.equippedPowers.push({
      id: 'fireball',
      name: starterMeta.tierNames[0],
      level: 1,
      maxLevel: 4,
      cooldownTimer: 0,
      cooldown: starterMeta.baseCooldown,
      damage: starterMeta.baseDamage,
      range: starterMeta.baseRange,
      projectiles: starterMeta.baseProjectiles,
      icon: starterMeta.icon,
      description: starterMeta.description,
      color: starterMeta.color,
    });

    // Center camera
    this.camera.x = this.player.x - this.camera.width / 2;
    this.camera.y = this.player.y - this.camera.height / 2;

    this.setState('PLAYING');
    soundManager.startMusic();
    this.startLoop();
  }

  public setState(newState: GameState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.setState('PAUSED');
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.setState('PLAYING');
      this.lastTime = performance.now();
    }
  }

  public selectPower(option: PowerCardOption) {
    option.apply();
    soundManager.playPowerSelected();
    this.setState('PLAYING');
    this.lastTime = performance.now();
  }

  public triggerDash(): boolean {
    if (this.player.dashCooldown <= 0 && !this.player.isDashing) {
      this.player.isDashing = true;
      this.player.dashTimer = this.player.dashDuration;
      this.player.dashCooldown = this.player.maxDashCooldown;
      this.player.invulnerableTimer = this.player.dashDuration;

      let dirX = this.input.joystickX;
      let dirY = this.input.joystickY;
      if (Math.hypot(dirX, dirY) < 0.1) {
        dirX = Math.cos(this.player.facingAngle);
        dirY = Math.sin(this.player.facingAngle);
      }
      const len = Math.hypot(dirX, dirY) || 1;
      this.player.vx = (dirX / len) * this.player.dashSpeed;
      this.player.vy = (dirY / len) * this.player.dashSpeed;

      soundManager.playDash();

      // Translucent cyan bubble ghost particles
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: this.player.x + (Math.random() - 0.5) * 16,
          y: this.player.y + (Math.random() - 0.5) * 16,
          vx: -this.player.vx * 0.2 + (Math.random() - 0.5) * 40,
          vy: -this.player.vy * 0.2 + (Math.random() - 0.5) * 40,
          radius: 14,
          color: '#38bdf8',
          alpha: 0.75,
          life: 0.25,
          maxLife: 0.25,
          shape: 'smoke',
        });
      }
      return true;
    }
    return false;
  }

  public triggerSpecial(): boolean {
    if (this.player.specialCooldown <= 0) {
      this.player.specialCooldown = this.player.maxSpecialCooldown;
      soundManager.playSpecial();
      this.screenShake = { intensity: 16, duration: 0.35 };

      // Annihilating Arcane Nova burst
      const shockwaveRadius = 380 * this.player.areaMultiplier;
      const damage = Math.round(180 * this.player.baseDamageMultiplier);

      // Destroy all enemy projectiles on screen
      this.projectiles = this.projectiles.filter(p => p.owner === 'PLAYER');

      // Damage all monsters within nova range with heavy knockback
      for (const m of this.monsters) {
        const dx = m.x - this.player.x;
        const dy = m.y - this.player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= shockwaveRadius) {
          const factor = 1 - dist / shockwaveRadius;
          const dealt = Math.round(damage * (0.6 + 0.4 * factor));
          this.applyDamageToMonster(m, dealt, true, '#c084fc');

          // Knockback
          const pushLen = dist || 1;
          m.x += (dx / pushLen) * 90;
          m.y += (dy / pushLen) * 90;
        }
      }

      // Nova particle ring
      for (let i = 0; i < 36; i++) {
        const angle = (i / 36) * Math.PI * 2;
        const speed = shockwaveRadius / 0.3;
        this.particles.push({
          x: this.player.x,
          y: this.player.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 14,
          color: '#38bdf8',
          alpha: 0.9,
          life: 0.35,
          maxLife: 0.35,
          shape: 'spark',
        });
      }

      return true;
    }
    return false;
  }

  public triggerCastPower(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.equippedPowers.length) return false;
    const power = this.equippedPowers[slotIndex];
    this.playerAttackAnimTimer = 0.25;
    const fired = this.castPower(power, true);
    if (fired) {
      power.cooldownTimer = power.cooldown;
    }
    return fired;
  }

  public triggerManualAttack() {
    this.playerAttackAnimTimer = 0.25;
    let anyFired = false;
    for (const p of this.equippedPowers) {
      const fired = this.castPower(p, true);
      if (fired) {
        p.cooldownTimer = p.cooldown;
        anyFired = true;
      }
    }
    if (!anyFired && this.equippedPowers.length > 0) {
      this.castPower(this.equippedPowers[0], true);
      this.equippedPowers[0].cooldownTimer = this.equippedPowers[0].cooldown;
    }
  }

  // --- Main Loop ---

  public startLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      if (this.state === 'PLAYING') {
        this.update(dt);
      }
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stopLoop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundManager.stopMusic();
  }

  // --- Update Logic ---

  private update(dt: number) {
    this.elapsedTime += dt;

    if (this.playerAttackAnimTimer > 0) {
      this.playerAttackAnimTimer = Math.max(0, this.playerAttackAnimTimer - dt);
    }

    // Difficulty according to levels: Boss Spawns every 10 levels (Level 10, 20, 30...)
    const bossLevelThreshold = Math.floor(this.player.level / 10);
    if (bossLevelThreshold > this.lastBossLevelSpawned && this.currentBoss === null && this.player.level >= 10) {
      this.lastBossLevelSpawned = bossLevelThreshold;
      this.spawnBossMonster(`Level ${this.player.level} Titan Overlord`);
    }

    if (this.mode === 'SURVIVAL') {
      this.survivalRemainingTime = Math.max(0, 600 - this.elapsedTime);

      if (this.elapsedTime >= 300 && !this.eliteIntroduced) {
        this.eliteIntroduced = true;
        this.spawnEliteWave();
      }

      if (this.elapsedTime >= 480 && !this.surgeStarted) {
        this.surgeStarted = true;
        this.spawnInterval = 0.45; // Intensive swarm
      }

      if (this.elapsedTime >= 600 && !this.finalBossSpawned) {
        this.finalBossSpawned = true;
        this.spawnBossMonster('The Abyssal Overlord (Final)');
      }

      if (this.elapsedTime >= 600 && this.survivalBossDefeated) {
        this.triggerVictory();
        return;
      }
    } else if (this.mode === 'ENDLESS') {
      if (
        this.currentBoss === null &&
        ((Math.floor(this.elapsedTime / 180) > this.bossesDefeatedCount) ||
         (Math.floor(this.player.level / 10) > this.bossesDefeatedCount))
      ) {
        this.spawnBossMonster();
      }
    } else if (this.mode === 'HARDCORE') {
      if (this.currentBoss === null && Math.floor(this.elapsedTime / 130) > this.bossesDefeatedCount) {
        this.spawnBossMonster('Dread Hell Titan');
      }
    }

    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= dt;
      if (this.screenShake.duration <= 0) {
        this.screenShake.intensity = 0;
      }
    }

    this.updatePlayer(dt);
    this.updatePowers(dt);
    this.updateProjectiles(dt);
    this.updateSpawner(dt);
    this.updateMonsters(dt);
    this.updateXpOrbs(dt);
    this.updateParticles(dt);
    this.updateBloodSplats(dt);
    this.updateDamageNumbers(dt);
    this.updateCamera(dt);
  }

  private updateBloodSplats(dt: number) {
    for (let i = this.bloodSplats.length - 1; i >= 0; i--) {
      const b = this.bloodSplats[i];
      b.life -= dt;
      if (b.life < 10) {
        b.alpha = Math.max(0, (b.life / 10) * 0.78);
      }
      if (b.life <= 0) {
        this.bloodSplats.splice(i, 1);
      }
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    if (p.dashCooldown > 0) p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    if (p.specialCooldown > 0) p.specialCooldown = Math.max(0, p.specialCooldown - dt);
    if (p.invulnerableTimer > 0) p.invulnerableTimer = Math.max(0, p.invulnerableTimer - dt);

    if (p.hpRegen > 0 && p.hp < p.maxHp) {
      p.hp = Math.min(p.maxHp, p.hp + p.hpRegen * dt);
    }

    if (p.maxShield > 0 && p.shield < p.maxShield) {
      p.shield = Math.min(p.maxShield, p.shield + 4 * dt);
    }

    let inputX = this.input.joystickX;
    let inputY = this.input.joystickY;

    if (this.input.keys.w) inputY -= 1;
    if (this.input.keys.s) inputY += 1;
    if (this.input.keys.a) inputX -= 1;
    if (this.input.keys.d) inputX += 1;

    const mag = Math.hypot(inputX, inputY);
    if (mag > 1) {
      inputX /= mag;
      inputY /= mag;
    }

    if (p.isDashing) {
      p.dashTimer -= dt;
      if (p.dashTimer <= 0) {
        p.isDashing = false;
        p.vx = 0;
        p.vy = 0;
      }
    } else {
      if (mag > 0.05) {
        p.vx = inputX * p.speed;
        p.vy = inputY * p.speed;
        p.facingAngle = Math.atan2(inputY, inputX);
      } else {
        p.vx *= 0.75;
        p.vy *= 0.75;
      }
    }

    const nextX = p.x + p.vx * dt;
    const nextY = p.y + p.vy * dt;
    const resolved = this.arena.resolveCollision(nextX, nextY, p.radius);
    p.x = resolved.x;
    p.y = resolved.y;
  }

  private updatePowers(dt: number) {
    const p = this.player;

    for (const power of this.equippedPowers) {
      power.cooldownTimer -= dt * p.attackSpeedMultiplier;

      if (power.id === 'energy_orb') {
        const orbCount = power.projectiles;
        // Keep energy orb closely orbiting the character
        const orbitRadius = Math.min(62, Math.max(44, power.range * p.areaMultiplier));

        const existingOrbs = this.projectiles.filter(proj => proj.type === 'energy_orb');
        if (existingOrbs.length < orbCount) {
          for (let i = existingOrbs.length; i < orbCount; i++) {
            this.projectiles.push({
              id: this.nextId++,
              x: p.x,
              y: p.y,
              vx: 0,
              vy: 0,
              radius: 12 * p.areaMultiplier,
              damage: Math.round(power.damage * p.baseDamageMultiplier),
              life: 999999,
              maxLife: 999999,
              pierces: 999999,
              color: '#38bdf8',
              trailColor: '#bae6fd',
              owner: 'PLAYER',
              type: 'energy_orb',
              extra: { orbitDistance: orbitRadius, orbitAngle: (i / orbCount) * Math.PI * 2 },
            });
          }
        }
        continue;
      }

      if (power.cooldownTimer <= 0) {
        const fired = this.castPower(power);
        if (fired) {
          power.cooldownTimer = power.cooldown;
        }
      }
    }
  }

  private castPower(power: EquippedPower, _manual: boolean = false): boolean {
    const p = this.player;
    if (this.monsters.length === 0) return false;

    const targets = this.findNearestMonsters(p.x, p.y, power.range + 80, power.projectiles);
    if (targets.length === 0 && power.id !== 'sword_wave') return false;

    const baseDmg = Math.round(power.damage * p.baseDamageMultiplier);
    const isCrit = Math.random() < p.critChance;
    const finalDmg = isCrit ? Math.round(baseDmg * p.critDamage) : baseDmg;

    switch (power.id) {
      case 'fireball': {
        const target = targets[0];
        const targetX = target ? target.x : p.x + Math.cos(p.facingAngle) * 200;
        const targetY = target ? target.y : p.y + Math.sin(p.facingAngle) * 200;
        const angle = Math.atan2(targetY - p.y, targetX - p.x);
        const speed = 440;

        for (let i = 0; i < power.projectiles; i++) {
          const spread = (i - (power.projectiles - 1) / 2) * 0.18;
          const a = angle + spread;
          this.projectiles.push({
            id: this.nextId++,
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 9 * p.areaMultiplier,
            damage: finalDmg,
            life: 1.2,
            maxLife: 1.2,
            pierces: 0,
            color: '#f97316',
            trailColor: '#ffedd5',
            owner: 'PLAYER',
            type: 'fireball',
            extra: { explosionRadius: 75 * p.areaMultiplier, isCrit },
          });
        }
        soundManager.playFireball();
        return true;
      }

      case 'lightning': {
        for (let i = 0; i < Math.min(power.projectiles, targets.length); i++) {
          const target = targets[i];
          this.applyDamageToMonster(target, finalDmg, isCrit, '#eab308');

          for (let j = 0; j < 8; j++) {
            this.particles.push({
              x: target.x + (Math.random() - 0.5) * 30,
              y: target.y + (Math.random() - 0.5) * 30,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              radius: 6,
              color: '#fef08a',
              alpha: 1,
              life: 0.18,
              maxLife: 0.18,
              shape: 'spark',
            });
          }
        }
        soundManager.playLightning();
        return true;
      }

      case 'ice_blast': {
        const target = targets[0];
        const angle = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.facingAngle;
        const speed = 490;

        for (let i = 0; i < power.projectiles; i++) {
          const spread = (i - (power.projectiles - 1) / 2) * 0.22;
          const a = angle + spread;
          this.projectiles.push({
            id: this.nextId++,
            x: p.x,
            y: p.y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 8 * p.areaMultiplier,
            damage: finalDmg,
            life: 0.85,
            maxLife: 0.85,
            pierces: 2,
            color: '#38bdf8',
            trailColor: '#e0f2fe',
            owner: 'PLAYER',
            type: 'ice_blast',
            extra: { slowEffect: 0.45, isCrit },
          });
        }
        soundManager.playIce();
        return true;
      }

      case 'sword_wave': {
        const angle = p.facingAngle;
        const speed = 540;

        for (let i = 0; i < power.projectiles; i++) {
          const spread = (i - (power.projectiles - 1) / 2) * 0.25;
          const a = angle + spread;
          this.projectiles.push({
            id: this.nextId++,
            x: p.x + Math.cos(a) * 20,
            y: p.y + Math.sin(a) * 20,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            radius: 18 * p.areaMultiplier,
            damage: finalDmg,
            life: 0.55,
            maxLife: 0.55,
            pierces: 4,
            color: '#f8fafc',
            trailColor: '#94a3b8',
            owner: 'PLAYER',
            type: 'sword_wave',
            extra: { isCrit },
          });
        }
        soundManager.playAttack();
        return true;
      }

      case 'poison_cloud': {
        const target = targets[0] || { x: p.x, y: p.y };
        this.projectiles.push({
          id: this.nextId++,
          x: target.x + (Math.random() - 0.5) * 40,
          y: target.y + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          radius: 80 * p.areaMultiplier,
          damage: finalDmg,
          life: 3.5,
          maxLife: 3.5,
          pierces: 9999,
          color: '#22c55e',
          trailColor: '#86efac',
          owner: 'PLAYER',
          type: 'poison_cloud',
          extra: { poisonDuration: 3.5 },
        });
        return true;
      }

      case 'meteor': {
        const target = targets[0];
        if (!target) return false;
        const targetX = target.x;
        const targetY = target.y;

        const spawnDist = 450;
        const spawnX = targetX + spawnDist * 0.6;
        const spawnY = targetY - spawnDist;
        const angle = Math.atan2(targetY - spawnY, targetX - spawnX);
        const speed = 620;

        this.projectiles.push({
          id: this.nextId++,
          x: spawnX,
          y: spawnY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 16 * p.areaMultiplier,
          damage: finalDmg,
          life: Math.hypot(targetX - spawnX, targetY - spawnY) / speed,
          maxLife: Math.hypot(targetX - spawnX, targetY - spawnY) / speed,
          pierces: 0,
          color: '#ef4444',
          trailColor: '#fdba74',
          owner: 'PLAYER',
          type: 'meteor',
          extra: { explosionRadius: 130 * p.areaMultiplier, isCrit },
        });
        return true;
      }
    }
    return false;
  }

  private updateProjectiles(dt: number) {
    const p = this.player;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      if (proj.type === 'energy_orb' && proj.extra) {
        // Tight personal orbit around spirit body
        const orbitRadius = Math.min(62, Math.max(44, (proj.extra.orbitDistance || 50)));
        const speed = 3.6;
        proj.extra.orbitAngle = ((proj.extra.orbitAngle || 0) + speed * dt) % (Math.PI * 2);
        proj.x = p.x + Math.cos(proj.extra.orbitAngle) * orbitRadius;
        proj.y = p.y + Math.sin(proj.extra.orbitAngle) * orbitRadius;

        for (const m of this.monsters) {
          const dist = Math.hypot(m.x - proj.x, m.y - proj.y);
          if (dist < m.radius + proj.radius && m.hitFlashTimer <= 0) {
            this.applyDamageToMonster(m, proj.damage, false, '#38bdf8');
          }
        }
        continue;
      }

      if (proj.type === 'poison_cloud') {
        proj.life -= dt;
        if (proj.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }

        if (Math.floor(proj.life * 4) !== Math.floor((proj.life + dt) * 4)) {
          for (const m of this.monsters) {
            const dist = Math.hypot(m.x - proj.x, m.y - proj.y);
            if (dist <= proj.radius + m.radius) {
              this.applyDamageToMonster(m, proj.damage, false, '#22c55e');
            }
          }
        }
        continue;
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;

      if (Math.random() < 0.4) {
        this.particles.push({
          x: proj.x + (Math.random() - 0.5) * 6,
          y: proj.y + (Math.random() - 0.5) * 6,
          vx: -proj.vx * 0.1,
          vy: -proj.vy * 0.1,
          radius: proj.radius * 0.6,
          color: proj.trailColor,
          alpha: 0.6,
          life: 0.15,
          maxLife: 0.15,
          shape: 'smoke',
        });
      }

      if (
        proj.life <= 0 ||
        proj.x < 0 ||
        proj.x > ARENA_WIDTH ||
        proj.y < 0 ||
        proj.y > ARENA_HEIGHT
      ) {
        if (proj.extra?.explosionRadius) {
          this.explodeProjectile(proj);
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (proj.owner === 'PLAYER') {
        for (const m of this.monsters) {
          const dist = Math.hypot(m.x - proj.x, m.y - proj.y);
          if (dist < m.radius + proj.radius) {
            this.applyDamageToMonster(m, proj.damage, !!proj.extra?.isCrit, proj.color);

            if (proj.extra?.slowEffect) {
              m.speed *= 1 - proj.extra.slowEffect;
            }

            if (proj.extra?.explosionRadius) {
              this.explodeProjectile(proj);
              this.projectiles.splice(i, 1);
              break;
            }

            if (proj.pierces > 0) {
              proj.pierces--;
            } else {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else if (proj.owner === 'ENEMY') {
        const distToPlayer = Math.hypot(p.x - proj.x, p.y - proj.y);
        if (distToPlayer < p.radius + proj.radius) {
          this.applyDamageToPlayer(proj.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private explodeProjectile(proj: Projectile) {
    const radius = proj.extra?.explosionRadius || 80;
    this.screenShake = { intensity: 6, duration: 0.18 };

    for (const m of this.monsters) {
      const dist = Math.hypot(m.x - proj.x, m.y - proj.y);
      if (dist <= radius + m.radius) {
        const falloff = 1 - dist / (radius + m.radius);
        const damage = Math.round(proj.damage * (0.5 + 0.5 * falloff));
        this.applyDamageToMonster(m, damage, !!proj.extra?.isCrit, proj.color);
      }
    }

    for (let j = 0; j < 18; j++) {
      const angle = (j / 18) * Math.PI * 2;
      const spd = (radius / 0.25) * (0.6 + Math.random() * 0.4);
      this.particles.push({
        x: proj.x,
        y: proj.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 8 + Math.random() * 6,
        color: proj.color,
        alpha: 0.9,
        life: 0.28,
        maxLife: 0.28,
        shape: 'spark',
      });
    }
  }

  private updateSpawner(dt: number) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;

      // Make monsters harder: scale max active monsters and spawn batch size
      const maxActive = Math.min(220, 30 + Math.floor(this.elapsedTime / 10) + this.player.level * 4);
      if (this.monsters.length < maxActive) {
        const batchSize = this.mode === 'HARDCORE' ? 4 : (this.surgeStarted ? 5 : 3);
        for (let i = 0; i < batchSize; i++) {
          this.spawnMonster();
        }
      }
    }
  }

  private spawnMonster() {
    const p = this.player;

    let type: 'NORMAL' | 'FAST' | 'TANK' | 'RANGED' | 'ELITE' = 'NORMAL';
    const roll = Math.random();

    if (this.mode === 'HARDCORE') {
      if (roll < 0.30) type = 'NORMAL';
      else if (roll < 0.55) type = 'FAST';
      else if (roll < 0.75) type = 'TANK';
      else if (roll < 0.90) type = 'RANGED';
      else type = 'ELITE';
    } else {
      const minutes = this.elapsedTime / 60;
      if (minutes < 1) {
        type = roll < 0.7 ? 'NORMAL' : 'FAST';
      } else if (minutes < 3) {
        if (roll < 0.45) type = 'NORMAL';
        else if (roll < 0.80) type = 'FAST';
        else type = 'TANK';
      } else if (minutes < 5) {
        if (roll < 0.35) type = 'NORMAL';
        else if (roll < 0.60) type = 'FAST';
        else if (roll < 0.80) type = 'TANK';
        else type = 'RANGED';
      } else {
        if (roll < 0.25) type = 'NORMAL';
        else if (roll < 0.50) type = 'FAST';
        else if (roll < 0.70) type = 'TANK';
        else if (roll < 0.88) type = 'RANGED';
        else type = 'ELITE';
      }
    }

    const cfg = MONSTER_CONFIGS[type];

    // Difficulty scaling (monster speed less initially, increasing with levels)
    const timeScale = 1 + (this.elapsedTime / 60) * 0.22;
    const levelScale = 1 + (this.player.level - 1) * 0.10;
    const levelSpeedScale = 1 + (this.player.level - 1) * 0.045; // Speed scaled by player levels!
    const levelDmgScale = 1 + (this.player.level - 1) * 0.04; // Damage slowly increases according to levels!
    const modeHpMult = this.mode === 'HARDCORE' ? 2.4 : 1.0;
    const modeDmgMult = this.mode === 'HARDCORE' ? 1.8 : 1.0;
    const modeSpdMult = this.mode === 'HARDCORE' ? 1.25 : 1.0;

    const hp = Math.round(cfg.baseHp * timeScale * levelScale * modeHpMult);
    const damage = Math.round(cfg.damage * timeScale * modeDmgMult * levelDmgScale);
    const speed = cfg.speed * modeSpdMult * levelSpeedScale;

    const angle = Math.random() * Math.PI * 2;
    const dist = 520 + Math.random() * 260;
    let sx = p.x + Math.cos(angle) * dist;
    let sy = p.y + Math.sin(angle) * dist;

    sx = Math.max(80, Math.min(ARENA_WIDTH - 80, sx));
    sy = Math.max(80, Math.min(ARENA_HEIGHT - 80, sy));

    this.monsters.push({
      id: this.nextId++,
      type,
      name: cfg.name,
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      radius: cfg.radius,
      hp,
      maxHp: hp,
      speed,
      damage,
      xpValue: cfg.xpValue * (this.mode === 'HARDCORE' ? 1.5 : 1),
      color: cfg.color,
      accentColor: cfg.accentColor,
      hitFlashTimer: 0,
      attackCooldown: cfg.attackCooldown,
      attackTimer: 0,
      isElite: type === 'ELITE',
      isBoss: false,
    });
  }

  public spawnEliteWave() {
    soundManager.playBossWarning();
    this.screenShake = { intensity: 8, duration: 0.4 };

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dist = 600;
      const sx = Math.max(100, Math.min(ARENA_WIDTH - 100, this.player.x + Math.cos(angle) * dist));
      const sy = Math.max(100, Math.min(ARENA_HEIGHT - 100, this.player.y + Math.sin(angle) * dist));

      const cfg = MONSTER_CONFIGS.ELITE;
      const hp = Math.round(cfg.baseHp * 2.2);
      const levelSpeedScale = 1 + (this.player.level - 1) * 0.045;
      const levelDmgScale = 1 + (this.player.level - 1) * 0.04;

      this.monsters.push({
        id: this.nextId++,
        type: 'ELITE',
        name: 'Dread Blood Champion',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        radius: cfg.radius,
        hp,
        maxHp: hp,
        speed: cfg.speed * 1.15 * levelSpeedScale,
        damage: Math.round(cfg.damage * 1.4 * levelDmgScale),
        xpValue: cfg.xpValue * 2,
        color: cfg.color,
        accentColor: cfg.accentColor,
        hitFlashTimer: 0,
        attackCooldown: cfg.attackCooldown,
        attackTimer: 0,
        isElite: true,
        isBoss: false,
      });
    }
  }

  public spawnBossMonster(customName?: string) {
    const cfg = MONSTER_CONFIGS.BOSS;
    soundManager.playBossWarning();
    this.screenShake = { intensity: 14, duration: 0.6 };

    const timeScale = 1 + (this.elapsedTime / 60) * 0.25;
    const modeHpMult = this.mode === 'HARDCORE' ? 2.5 : 1.0;
    const levelSpeedScale = 1 + (this.player.level - 1) * 0.045;
    const levelDmgScale = 1 + (this.player.level - 1) * 0.04;
    const hp = Math.round(cfg.baseHp * timeScale * modeHpMult);

    const angle = Math.random() * Math.PI * 2;
    const dist = 580;
    const sx = Math.max(120, Math.min(ARENA_WIDTH - 120, this.player.x + Math.cos(angle) * dist));
    const sy = Math.max(120, Math.min(ARENA_HEIGHT - 120, this.player.y + Math.sin(angle) * dist));

    const boss: Monster = {
      id: this.nextId++,
      type: 'BOSS',
      name: customName || (this.mode === 'HARDCORE' ? 'Infernal Bone Titan' : 'The Abyssal Overlord'),
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      radius: cfg.radius,
      hp,
      maxHp: hp,
      speed: cfg.speed * (this.mode === 'HARDCORE' ? 1.25 : 1.05) * levelSpeedScale,
      damage: Math.round(cfg.damage * (this.mode === 'HARDCORE' ? 1.5 : 1.1) * levelDmgScale),
      xpValue: cfg.xpValue * 3,
      color: cfg.color,
      accentColor: cfg.accentColor,
      hitFlashTimer: 0,
      attackCooldown: 1.5,
      attackTimer: 0,
      isElite: true,
      isBoss: true,
      specialAttackTimer: 3.0,
      attackPhase: 0,
    };

    this.monsters.push(boss);
    this.currentBoss = boss;
    this.callbacks.onBossSpawn(boss);
  }

  private updateMonsters(dt: number) {
    const p = this.player;

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const m = this.monsters[i];

      if (m.hitFlashTimer > 0) {
        m.hitFlashTimer = Math.max(0, m.hitFlashTimer - dt);
      }

      if (m.attackTimer > 0) {
        m.attackTimer -= dt;
      }

      const dx = p.x - m.x;
      const dy = p.y - m.y;
      const dist = Math.hypot(dx, dy) || 1;

      if (m.isBoss) {
        m.specialAttackTimer = (m.specialAttackTimer || 3.0) - dt;
        if (m.specialAttackTimer <= 0) {
          m.specialAttackTimer = this.mode === 'HARDCORE' ? 2.2 : 3.5;
          this.executeBossAttack(m);
        }
      }

      if (m.type === 'RANGED') {
        const preferredDist = 240;
        if (dist < preferredDist - 30) {
          m.vx = (-dx / dist) * m.speed;
          m.vy = (-dy / dist) * m.speed;
        } else if (dist > preferredDist + 50) {
          m.vx = (dx / dist) * m.speed;
          m.vy = (dy / dist) * m.speed;
        } else {
          m.vx = (-dy / dist) * (m.speed * 0.7);
          m.vy = (dx / dist) * (m.speed * 0.7);
        }

        if (m.attackTimer <= 0 && dist < 450) {
          m.attackTimer = m.attackCooldown;
          const projSpeed = 280;
          this.projectiles.push({
            id: this.nextId++,
            x: m.x,
            y: m.y,
            vx: (dx / dist) * projSpeed,
            vy: (dy / dist) * projSpeed,
            radius: 8,
            damage: m.damage,
            life: 2.2,
            maxLife: 2.2,
            pierces: 0,
            color: '#a855f7',
            trailColor: '#581c87',
            owner: 'ENEMY',
            type: 'dark_orb',
          });
        }
      } else {
        m.vx = (dx / dist) * m.speed;
        m.vy = (dy / dist) * m.speed;
      }

      const nextX = m.x + m.vx * dt;
      const nextY = m.y + m.vy * dt;
      const resolved = this.arena.resolveCollision(nextX, nextY, m.radius);
      m.x = resolved.x;
      m.y = resolved.y;

      if (dist <= m.radius + p.radius) {
        if (m.attackTimer <= 0) {
          m.attackTimer = m.attackCooldown;
          this.applyDamageToPlayer(m.damage, m.isBoss || m.isElite);
        }
      }
    }
  }

  private executeBossAttack(boss: Monster) {
    soundManager.playBossWarning();
    this.screenShake = { intensity: 10, duration: 0.35 };

    const p = this.player;
    const phase = (boss.attackPhase || 0) % 3;
    boss.attackPhase = phase + 1;

    if (phase === 0) {
      const bullets = this.mode === 'HARDCORE' ? 18 : 14;
      for (let i = 0; i < bullets; i++) {
        const angle = (i / bullets) * Math.PI * 2;
        const spd = 280;
        this.projectiles.push({
          id: this.nextId++,
          x: boss.x,
          y: boss.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          radius: 11,
          damage: Math.round(boss.damage * 0.9),
          life: 2.8,
          maxLife: 2.8,
          pierces: 0,
          color: '#ef4444',
          trailColor: '#b91c1c',
          owner: 'ENEMY',
          type: 'boss_fireball',
        });
      }
    } else if (phase === 1) {
      const dx = p.x - boss.x;
      const dy = p.y - boss.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = 420;

      [-0.35, 0, 0.35].forEach(offset => {
        const a = Math.atan2(dy, dx) + offset;
        this.projectiles.push({
          id: this.nextId++,
          x: boss.x,
          y: boss.y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: 18,
          damage: Math.round(boss.damage * 1.25),
          life: 1.6,
          maxLife: 1.6,
          pierces: 0,
          color: '#f97316',
          trailColor: '#7c2d12',
          owner: 'ENEMY',
          type: 'boss_slam',
        });
      });
    } else {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        this.monsters.push({
          id: this.nextId++,
          type: 'FAST',
          name: 'Abyssal Swarmer',
          x: boss.x + Math.cos(angle) * 70,
          y: boss.y + Math.sin(angle) * 70,
          vx: 0,
          vy: 0,
          radius: 14,
          hp: 45,
          maxHp: 45,
          speed: 235,
          damage: 14,
          xpValue: 18,
          color: '#f97316',
          accentColor: '#7c2d12',
          hitFlashTimer: 0,
          attackCooldown: 0.5,
          attackTimer: 0,
          isElite: false,
          isBoss: false,
        });
      }
    }
  }

  public applyDamageToMonster(monster: Monster, damage: number, isCrit: boolean, color: string) {
    monster.hp -= damage;
    monster.hitFlashTimer = 0.12;
    soundManager.playHit();

    this.damageNumbers.push({
      id: this.nextId++,
      x: monster.x + (Math.random() - 0.5) * 20,
      y: monster.y - monster.radius - 8,
      value: damage,
      isCrit,
      color: isCrit ? '#facc15' : color,
      alpha: 1.0,
      life: 0.75,
    });

    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  private killMonster(monster: Monster) {
    const idx = this.monsters.indexOf(monster);
    if (idx !== -1) {
      this.monsters.splice(idx, 1);
    }

    this.monsterKillCount++;
    soundManager.playMonsterDeath();

    // Spawn blood splatter effects on ground and spray particles
    const splatRadius = monster.isBoss ? 34 : (monster.isElite ? 22 : 14);
    const dropCount = monster.isBoss ? 12 : (monster.isElite ? 7 : 4);
    const drops: Array<{ dx: number; dy: number; r: number }> = [];
    for (let d = 0; d < dropCount; d++) {
      const dAngle = Math.random() * Math.PI * 2;
      const dDist = splatRadius * (0.6 + Math.random() * 1.5);
      drops.push({
        dx: Math.cos(dAngle) * dDist,
        dy: Math.sin(dAngle) * dDist,
        r: 1.8 + Math.random() * 3.8,
      });
    }

    if (this.bloodSplats.length > 75) {
      this.bloodSplats.shift();
    }
    this.bloodSplats.push({
      x: monster.x,
      y: monster.y,
      radius: splatRadius,
      color: monster.isBoss ? '#7f1d1d' : (monster.isElite ? '#991b1b' : '#881337'),
      alpha: 0.78,
      life: 50,
      drops,
    });

    // Dark crimson blood spray particles
    const bloodParticleCount = monster.isBoss ? 28 : (monster.isElite ? 18 : 10);
    for (let i = 0; i < bloodParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * (monster.isBoss ? 260 : 160);
      this.particles.push({
        x: monster.x,
        y: monster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2.5 + Math.random() * 4,
        color: '#991b1b',
        alpha: 0.9,
        life: 0.28 + Math.random() * 0.25,
        maxLife: 0.55,
        shape: 'circle',
      });
    }

    const particleCount = monster.isBoss ? 45 : (monster.isElite ? 22 : 12);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (monster.isBoss ? 240 : 120);
      this.particles.push({
        x: monster.x,
        y: monster.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 6,
        color: monster.color,
        alpha: 1,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        shape: 'smoke',
      });
    }

    const orbCount = monster.isBoss ? 15 : (monster.isElite ? 6 : 1);
    const valuePerOrb = Math.ceil(monster.xpValue / orbCount);

    for (let i = 0; i < orbCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (monster.radius + 15);
      this.xpOrbs.push({
        id: this.nextId++,
        x: monster.x + Math.cos(angle) * dist,
        y: monster.y + Math.sin(angle) * dist,
        value: valuePerOrb,
        radius: monster.isBoss ? 8 : (monster.isElite ? 6 : 5),
        color: monster.isBoss ? '#c084fc' : (monster.isElite ? '#38bdf8' : '#4ade80'),
        life: 180,
      });
    }

    if (monster.isBoss) {
      this.bossesDefeatedCount++;
      this.currentBoss = null;
      this.callbacks.onBossDefeated(monster);

      if (this.mode === 'SURVIVAL' && this.finalBossSpawned) {
        this.survivalBossDefeated = true;
        this.triggerVictory();
      }
    }
  }

  public applyDamageToPlayer(rawDamage: number, isBossOrElite: boolean = false) {
    const p = this.player;
    if (p.invulnerableTimer > 0) return;

    let effectiveDamage = rawDamage * (1 - p.armor);

    if (isBossOrElite && p.bossDamageReduction > 0) {
      effectiveDamage *= (1 - p.bossDamageReduction);
    }

    effectiveDamage = Math.max(1, Math.round(effectiveDamage));

    if (p.shield > 0) {
      const absorbed = Math.min(p.shield, effectiveDamage);
      p.shield -= absorbed;
      effectiveDamage -= absorbed;
    }

    if (effectiveDamage > 0) {
      p.hp -= effectiveDamage;
      p.invulnerableTimer = 0.2;
      soundManager.triggerVibration(40);
      this.screenShake = { intensity: 10, duration: 0.25 };
    }

    if (p.hp <= 0) {
      p.hp = 0;
      this.triggerGameOver();
    }
  }

  private updateXpOrbs(dt: number) {
    const p = this.player;
    const pickupRadius = 200; // Increased pickup radius to pull orbs closer into character

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      orb.life -= dt;
      if (orb.life <= 0) {
        this.xpOrbs.splice(i, 1);
        continue;
      }

      const dx = p.x - orb.x;
      const dy = p.y - orb.y;
      const dist = Math.hypot(dx, dy);

      if (dist < pickupRadius) {
        const speed = 540 + (1 - dist / pickupRadius) * 420;
        orb.x += (dx / dist) * speed * dt;
        orb.y += (dy / dist) * speed * dt;

        if (dist < p.radius + orb.radius + 6) {
          this.collectXpOrb(orb);
          this.xpOrbs.splice(i, 1);
        }
      }
    }
  }

  private collectXpOrb(orb: XpOrb) {
    const p = this.player;
    p.xp += orb.value;
    p.totalXp += orb.value;
    soundManager.playXpOrb();

    if (p.xp >= p.xpToNext) {
      p.xp -= p.xpToNext;
      p.level++;
      p.xpToNext = Math.round(p.xpToNext * 1.25 + 10);

      // Increase speed and slowly increase damage of all existing alive monsters as player levels up!
      const levelSpeedMult = 1.045;
      const levelDamageMult = 1.04; // Slowly increase damage with levels!
      for (const m of this.monsters) {
        m.speed *= levelSpeedMult;
        m.damage = Math.max(1, Math.round(m.damage * levelDamageMult));
      }

      this.triggerLevelUp();
    }
  }

  private triggerLevelUp() {
    this.setState('LEVEL_UP');
    soundManager.playLevelUp();

    const options = generateLevelUpOptions(this.player, this.equippedPowers, (option) => {
      this.selectPower(option);
    });

    this.callbacks.onLevelUp(options);
  }

  private triggerGameOver() {
    this.setState('GAME_OVER');
    soundManager.playGameOver();
    soundManager.stopMusic();

    const stats: RunStatistics = {
      mode: this.mode,
      finalLevel: this.player.level,
      monstersDefeated: this.monsterKillCount,
      survivalTimeSeconds: Math.floor(this.elapsedTime),
      bossesDefeated: this.bossesDefeatedCount,
      powersCollected: this.equippedPowers.map(p => ({
        id: p.id,
        name: p.name,
        level: p.level,
        icon: p.icon,
      })),
    };

    this.callbacks.onGameOver(stats);
  }

  private triggerVictory() {
    this.setState('VICTORY');
    soundManager.playVictory();
    soundManager.stopMusic();

    const stats: RunStatistics = {
      mode: this.mode,
      finalLevel: this.player.level,
      monstersDefeated: this.monsterKillCount,
      survivalTimeSeconds: 600,
      bossesDefeated: Math.max(1, this.bossesDefeatedCount),
      powersCollected: this.equippedPowers.map(p => ({
        id: p.id,
        name: p.name,
        level: p.level,
        icon: p.icon,
      })),
    };

    this.callbacks.onVictory(stats);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.life -= dt;
      part.alpha = Math.max(0, part.life / part.maxLife);

      if (part.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateDamageNumbers(dt: number) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y -= 45 * dt;
      dn.life -= dt;
      dn.alpha = Math.max(0, dn.life / 0.75);

      if (dn.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  private updateCamera(dt: number) {
    const p = this.player;
    this.camera.targetX = p.x - this.camera.width / 2;
    this.camera.targetY = p.y - this.camera.height / 2;

    this.camera.x += (this.camera.targetX - this.camera.x) * 8 * dt;
    this.camera.y += (this.camera.targetY - this.camera.y) * 8 * dt;

    this.camera.x = Math.max(0, Math.min(ARENA_WIDTH - this.camera.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(ARENA_HEIGHT - this.camera.height, this.camera.y));
  }

  private findNearestMonsters(x: number, y: number, maxDist: number, count: number): Monster[] {
    const sorted = [...this.monsters]
      .map(m => ({ m, dist: Math.hypot(m.x - x, m.y - y) }))
      .filter(item => item.dist <= maxDist)
      .sort((a, b) => a.dist - b.dist);

    return sorted.slice(0, count).map(item => item.m);
  }

  // --- Rendering ---

  public render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.camera.width;
    const h = this.camera.height;

    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake.duration > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
      shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
    }

    ctx.save();
    ctx.scale(this.canvas.width / w, this.canvas.height / h);

    // Deep forest clearing background
    ctx.fillStyle = '#14381b';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(-Math.round(this.camera.x + shakeX), -Math.round(this.camera.y + shakeY));

    // 1. Render Green Grassy Ground
    this.renderGround(ctx);

    // 2. Render Obstacles
    this.renderObstacles(ctx);

    // 3. Render XP Orbs
    this.renderXpOrbs(ctx);

    // 4. Render Projectiles
    this.renderProjectiles(ctx);

    // 5. Render Realistic Monsters
    this.renderMonsters(ctx);

    // 6. Render Cute Bubble Spirit Player (Image reference)
    this.renderPlayer(ctx);

    // 7. Render Particles
    this.renderParticles(ctx);

    // 8. Render Floating Damage Numbers
    this.renderDamageNumbers(ctx);

    ctx.restore();
    ctx.restore();
  }

  /**
   * "Make player ground green grassy"
   * Lush emerald & forest green turf with grass tufts, clovers, and mossy stepping stones.
   */
  private renderGround(ctx: CanvasRenderingContext2D) {
    const camX = this.camera.x;
    const camY = this.camera.y;
    const camW = this.camera.width;
    const camH = this.camera.height;

    const tileSize = 140;
    const startCol = Math.max(0, Math.floor(camX / tileSize));
    const endCol = Math.min(Math.ceil(ARENA_WIDTH / tileSize), Math.ceil((camX + camW) / tileSize));
    const startRow = Math.max(0, Math.floor(camY / tileSize));
    const endRow = Math.min(Math.ceil(ARENA_HEIGHT / tileSize), Math.ceil((camY + camH) / tileSize));

    for (let c = startCol; c < endCol; c++) {
      for (let r = startRow; r < endRow; r++) {
        const x = c * tileSize;
        const y = r * tileSize;

        // Alternating grassy meadow patches
        const noise = (c * 17 + r * 31) % 4;
        if (noise === 0) ctx.fillStyle = '#1a4722';
        else if (noise === 1) ctx.fillStyle = '#163f1e';
        else if (noise === 2) ctx.fillStyle = '#1e5228';
        else ctx.fillStyle = '#184420';

        ctx.fillRect(x, y, tileSize, tileSize);

        // Subtle organic grass seams
        ctx.strokeStyle = '#123318';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, tileSize, tileSize);

        // Procedural grass blade clumps
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        // Clump 1
        ctx.moveTo(x + 35, y + 50);
        ctx.lineTo(x + 32, y + 36);
        ctx.lineTo(x + 38, y + 42);
        ctx.lineTo(x + 42, y + 34);
        ctx.lineTo(x + 44, y + 50);
        // Clump 2
        ctx.moveTo(x + 95, y + 105);
        ctx.lineTo(x + 92, y + 92);
        ctx.lineTo(x + 98, y + 97);
        ctx.lineTo(x + 103, y + 90);
        ctx.lineTo(x + 106, y + 105);
        ctx.fill();

        // Tiny meadow flowers / clovers on alternate patches
        if ((c + r) % 3 === 0) {
          ctx.fillStyle = '#fef08a'; // yellow daisy
          ctx.beginPath();
          ctx.arc(x + 70, y + 70, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if ((c * r) % 5 === 0) {
          ctx.fillStyle = '#ffffff'; // white blossom
          ctx.beginPath();
          ctx.arc(x + 115, y + 45, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Outer boundary hedge & mossy stone border
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, ARENA_WIDTH - 80, ARENA_HEIGHT - 80);

    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 3;
    ctx.strokeRect(45, 45, ARENA_WIDTH - 90, ARENA_HEIGHT - 90);

    // Central Ancient Glade Meadow Circle
    ctx.save();
    ctx.translate(ARENA_WIDTH / 2, ARENA_HEIGHT / 2);
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(0, 0, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Render Ruin Walls with moss coverage
    for (const wall of this.arena.walls) {
      if (
        wall.x + wall.width < camX ||
        wall.x > camX + camW ||
        wall.y + wall.height < camY ||
        wall.y > camY + camH
      ) {
        continue;
      }

      // Stone base
      ctx.fillStyle = '#334155';
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Overgrown moss layer
      ctx.fillStyle = '#166534';
      ctx.fillRect(wall.x, wall.y, wall.width, 6);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Render scattered walkable grass rocks
    for (const s of this.arena.groundStones) {
      if (
        s.x + s.radius < camX ||
        s.x - s.radius > camX + camW ||
        s.y + s.radius < camY ||
        s.y - s.radius > camY + camH
      ) {
        continue;
      }
      ctx.fillStyle = 'rgba(10, 30, 15, 0.45)';
      ctx.beginPath();
      ctx.ellipse(s.x + 1, s.y + 2, s.radius * 1.1, s.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e'; // Green grass & moss
      ctx.beginPath();
      ctx.arc(s.x - s.radius * 0.25, s.y - s.radius * 0.25, s.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Blood Splatters on the green grassy ground
    for (const splat of this.bloodSplats) {
      if (
        splat.x + splat.radius * 2 < camX ||
        splat.x - splat.radius * 2 > camX + camW ||
        splat.y + splat.radius * 2 < camY ||
        splat.y - splat.radius * 2 > camY + camH
      ) {
        continue;
      }

      ctx.save();
      ctx.globalAlpha = splat.alpha;
      ctx.fillStyle = splat.color;
      ctx.beginPath();
      ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
      ctx.fill();

      for (const d of splat.drops) {
        ctx.beginPath();
        ctx.arc(splat.x + d.dx, splat.y + d.dy, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D) {
    const camX = this.camera.x;
    const camY = this.camera.y;
    const camW = this.camera.width;
    const camH = this.camera.height;

    for (const obs of this.arena.obstacles) {
      if (
        obs.x + obs.radius < camX ||
        obs.x - obs.radius > camX + camW ||
        obs.y + obs.radius < camY ||
        obs.y - obs.radius > camY + camH
      ) {
        continue;
      }

      // Grass drop shadow
      ctx.fillStyle = 'rgba(10, 35, 15, 0.55)';
      ctx.beginPath();
      ctx.ellipse(obs.x + 4, obs.y + 8, obs.radius * 1.1, obs.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (obs.type === 'TREE') {
        // Lush leafy tree canopy
        ctx.fillStyle = '#14532d'; // Dark outer leaves
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a'; // Vibrant inner foliage puff
        ctx.beginPath();
        ctx.arc(obs.x - obs.radius * 0.2, obs.y - obs.radius * 0.2, obs.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e'; // Highlight top leaves
        ctx.beginPath();
        ctx.arc(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'ROCK') {
        // Weathered mossy Grass Rock boulder
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        // Lush green grass patch across the top
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(obs.x - obs.radius * 0.2, obs.y - obs.radius * 0.25, obs.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e'; // Bright grass blades
        ctx.beginPath();
        ctx.arc(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Little grass tuft sprouts on the rock
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.moveTo(obs.x - 4, obs.y - obs.radius + 4);
        ctx.lineTo(obs.x - 7, obs.y - obs.radius - 6);
        ctx.lineTo(obs.x, obs.y - obs.radius - 2);
        ctx.lineTo(obs.x + 5, obs.y - obs.radius - 7);
        ctx.lineTo(obs.x + 3, obs.y - obs.radius + 4);
        ctx.fill();
      } else {
        // Pillar / Ruins
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = obs.detailColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
  }

  private renderXpOrbs(ctx: CanvasRenderingContext2D) {
    for (const orb of this.xpOrbs) {
      ctx.save();
      ctx.fillStyle = orb.color;
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D) {
    for (const proj of this.projectiles) {
      ctx.save();
      ctx.fillStyle = proj.color;
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 12;

      if (proj.type === 'sword_wave') {
        ctx.translate(proj.x, proj.y);
        ctx.rotate(Math.atan2(proj.vy, proj.vx));
        ctx.beginPath();
        ctx.arc(0, 0, proj.radius, -Math.PI / 2.5, Math.PI / 2.5);
        ctx.lineWidth = 6;
        ctx.strokeStyle = proj.color;
        ctx.stroke();
      } else if (proj.type === 'poison_cloud') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /**
   * "Make moster realistic"
   * Detailed anatomical features: articulated crawling legs, snapping fangs,
   * glowing eyes, spiky carapaces, horn ridges, and molten stone cracks.
   */
  private renderMonsters(ctx: CanvasRenderingContext2D) {
    const time = this.elapsedTime;

    for (const m of this.monsters) {
      // Ground shadow
      ctx.fillStyle = 'rgba(10, 30, 15, 0.55)';
      ctx.beginPath();
      ctx.ellipse(m.x, m.y + m.radius * 0.75, m.radius * 1.1, m.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      const faceAngle = Math.atan2(this.player.y - m.y, this.player.x - m.x);
      ctx.translate(m.x, m.y);
      ctx.rotate(faceAngle);

      // Hit flashing
      if (m.hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // 1. NORMAL: Chitin Stalker / Arachnid Fiend with articulated twitching legs
      if (m.type === 'NORMAL') {
        // 6 Spider Legs (twitching with walking cadence)
        const walkCycle = Math.sin(time * 16 + m.id);
        ctx.strokeStyle = '#1e3810';
        ctx.lineWidth = 3;
        for (let side = -1; side <= 1; side += 2) {
          for (let leg = -1; leg <= 1; leg++) {
            const legAngle = side * (Math.PI / 2 + leg * 0.4) + walkCycle * 0.25 * leg;
            const reach = m.radius * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, side * (m.radius * 0.4));
            const midX = Math.cos(legAngle) * (reach * 0.6);
            const midY = Math.sin(legAngle) * (reach * 0.6);
            const tipX = Math.cos(legAngle) * reach;
            const tipY = Math.sin(legAngle) * reach + side * 4;
            ctx.quadraticCurveTo(midX, midY, tipX, tipY);
            ctx.stroke();
          }
        }

        // Armored Thorax & Abdomen
        ctx.fillStyle = '#2d5a1b';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius, m.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chitin dorsal ridge plates
        ctx.fillStyle = '#4d8c28';
        ctx.beginPath();
        ctx.ellipse(-m.radius * 0.2, 0, m.radius * 0.5, m.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sharp Mandibles in front
        ctx.strokeStyle = '#14290a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.7, -4);
        ctx.lineTo(m.radius * 1.2, -1);
        ctx.moveTo(m.radius * 0.7, 4);
        ctx.lineTo(m.radius * 1.2, 1);
        ctx.stroke();

        // Multiple glowing ruby arachnid eyes
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(m.radius * 0.6, -3.5, 2, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.6, 3.5, 2, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.45, -6, 1.5, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.45, 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. FAST: Hellhound / Shadow Wolf with fangs and hellfire mane
      else if (m.type === 'FAST') {
        // Quadruped paws / sprint blur
        ctx.fillStyle = '#7c2d12';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius * 1.15, m.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hellfire mane / fur spikes
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.8, -m.radius * 0.6);
        ctx.lineTo(-m.radius * 0.3, -m.radius * 0.9);
        ctx.lineTo(m.radius * 0.2, -m.radius * 0.6);
        ctx.lineTo(m.radius * 0.7, 0);
        ctx.lineTo(m.radius * 0.2, m.radius * 0.6);
        ctx.lineTo(-m.radius * 0.3, m.radius * 0.9);
        ctx.lineTo(-m.radius * 0.8, m.radius * 0.6);
        ctx.fill();

        // Snout with sharp white fangs
        ctx.fillStyle = '#431407';
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.5, -4);
        ctx.lineTo(m.radius * 1.3, 0);
        ctx.lineTo(m.radius * 0.5, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.9, -2);
        ctx.lineTo(m.radius * 1.1, -4);
        ctx.lineTo(m.radius * 1.0, 0);
        ctx.moveTo(m.radius * 0.9, 2);
        ctx.lineTo(m.radius * 1.1, 4);
        ctx.lineTo(m.radius * 1.0, 0);
        ctx.fill();

        // Glowing predatory amber slit eyes
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(m.radius * 0.6, -3, 2, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.6, 3, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. TANK: Obsidian Stone Golem with molten magma fissures
      else if (m.type === 'TANK') {
        // Craggy angular boulders
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-m.radius, -m.radius * 0.7);
        ctx.lineTo(0, -m.radius);
        ctx.lineTo(m.radius, -m.radius * 0.6);
        ctx.lineTo(m.radius * 1.1, 0);
        ctx.lineTo(m.radius, m.radius * 0.6);
        ctx.lineTo(0, m.radius);
        ctx.lineTo(-m.radius, m.radius * 0.7);
        ctx.closePath();
        ctx.fill();

        // Molten Magma glowing cracks
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.6, -m.radius * 0.3);
        ctx.lineTo(0, 0);
        ctx.lineTo(m.radius * 0.6, -m.radius * 0.4);
        ctx.moveTo(0, 0);
        ctx.lineTo(m.radius * 0.5, m.radius * 0.5);
        ctx.stroke();

        // Molten core
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 4. RANGED: Cultist Lich / Shadow Shaman with skull & dark spell orb
      else if (m.type === 'RANGED') {
        // Flowing dark cowl / cloak
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.9, -m.radius * 0.8);
        ctx.lineTo(m.radius * 0.4, -m.radius * 0.6);
        ctx.lineTo(m.radius * 0.8, 0);
        ctx.lineTo(m.radius * 0.4, m.radius * 0.6);
        ctx.lineTo(-m.radius * 0.9, m.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Hood interior & pale skull visage
        ctx.fillStyle = '#0f051d';
        ctx.beginPath();
        ctx.ellipse(0, 0, m.radius * 0.6, m.radius * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(m.radius * 0.1, 0, m.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Dark eye sockets
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(m.radius * 0.2, -3, 1.8, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.2, 3, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Floating Dark Arcane Orb in front
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(m.radius * 1.3, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. ELITE: Blood Champion Demon with flaming horns
      else if (m.type === 'ELITE') {
        // Flaming red demonic aura
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 18;

        // Armored torso
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // Large curved horns
        ctx.strokeStyle = '#fee2e2';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.2, -m.radius * 0.7);
        ctx.quadraticCurveTo(m.radius * 0.8, -m.radius * 1.3, m.radius * 1.2, -m.radius * 0.8);
        ctx.moveTo(m.radius * 0.2, m.radius * 0.7);
        ctx.quadraticCurveTo(m.radius * 0.8, m.radius * 1.3, m.radius * 1.2, m.radius * 0.8);
        ctx.stroke();

        // Spiked pauldrons
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.moveTo(-m.radius * 0.8, -m.radius * 0.8);
        ctx.lineTo(-m.radius * 0.2, -m.radius * 1.1);
        ctx.lineTo(m.radius * 0.2, -m.radius * 0.7);
        ctx.fill();

        // Glowing red visor / eye slits
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.ellipse(m.radius * 0.4, 0, 3, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 6. BOSS: The Colossal Abyssal Overlord
      else if (m.type === 'BOSS') {
        ctx.shadowColor = '#dc2626';
        ctx.shadowBlur = 28;

        // Demon Titan Carapace
        ctx.fillStyle = '#450a0a';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
        ctx.fill();

        // Massive Curved Hell Horns
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(m.radius * 0.3, -m.radius * 0.8);
        ctx.quadraticCurveTo(m.radius * 1.2, -m.radius * 1.6, m.radius * 1.8, -m.radius * 0.9);
        ctx.moveTo(m.radius * 0.3, m.radius * 0.8);
        ctx.quadraticCurveTo(m.radius * 1.2, m.radius * 1.6, m.radius * 1.8, m.radius * 0.9);
        ctx.stroke();

        // Pulsating Abyssal Core Vortex
        const pulse = 0.8 + Math.sin(time * 6) * 0.2;
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.arc(0, 0, m.radius * 0.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Multi-eye demon cluster
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(m.radius * 0.5, -7, 3, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.5, 7, 3, 0, Math.PI * 2);
        ctx.arc(m.radius * 0.7, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Health bar overhead if damaged or special
      if (m.hp < m.maxHp || m.isElite || m.isBoss) {
        const barW = m.radius * 2.2;
        const barH = 5;
        const barX = m.x - barW / 2;
        const barY = m.y - m.radius - 12;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        const healthPct = Math.max(0, m.hp / m.maxHp);
        ctx.fillStyle = m.isBoss ? '#dc2626' : (m.isElite ? '#f97316' : '#22c55e');
        ctx.fillRect(barX, barY, barW * healthPct, barH);
      }
    }
  }

  /**
   * "Make character as i like the image i gave you"
   * The user provided a stunning image of an adorable glossy blue bubble character:
   * 1. Spherical translucent glowing cyan/aqua water plasma orb with caustic reflections.
   * 2. Cobalt blue speech-bubble/pill head with tiny bottom tail.
   * 3. Diamond-shaped cute stylized eyes (angled white chevron & black diamond pupils).
   * 4. Sweet curved happy smile.
   */
  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    const time = this.elapsedTime;
    const bob = Math.sin(time * 8) * 2.5;

    // Grass shadow underneath
    ctx.fillStyle = 'rgba(10, 35, 15, 0.45)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.radius * 0.85, p.radius * 1.1, p.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invulnerability blink
    if (p.invulnerableTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y + bob);

    // Subtle tilt towards moving direction
    const tilt = p.vx !== 0 ? (p.vx > 0 ? 0.08 : -0.08) : 0;
    ctx.rotate(tilt);

    // 1. OUTER SPHERICAL TRANSLUCENT WATER/PLASMA ORB (From reference image)
    const orbRadius = p.radius + 6;

    // Soft outer cyan glow halo
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Translucent swirling deep-blue aquatic sphere interior
    const waterGrad = ctx.createRadialGradient(-orbRadius * 0.3, -orbRadius * 0.3, 2, 0, 0, orbRadius);
    waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    waterGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.55)');
    waterGrad.addColorStop(0.85, 'rgba(3, 105, 161, 0.7)');
    waterGrad.addColorStop(1, 'rgba(56, 189, 248, 0.85)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.arc(0, 0, orbRadius, 0, Math.PI * 2);
    ctx.fill();

    // Caustic light ripple webbing inside the bubble
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-orbRadius * 0.2, -orbRadius * 0.1, orbRadius * 0.6, 0.2, Math.PI * 0.9);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(orbRadius * 0.1, orbRadius * 0.2, orbRadius * 0.5, Math.PI, Math.PI * 1.8);
    ctx.stroke();

    // Specular top-left bright glass shine reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-orbRadius * 0.45, -orbRadius * 0.45, orbRadius * 0.28, orbRadius * 0.14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. INNER COBALT BLUE PILL / SPEECH-BUBBLE FACE (Exact from image)
    const pillW = 26;
    const pillH = 15;
    const pillRadius = 7.5;

    ctx.save();
    // Pill drop shadow inside the orb
    ctx.shadowColor = 'rgba(2, 6, 23, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#2563eb'; // Glossy royal cobalt blue
    ctx.beginPath();
    ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillRadius);
    ctx.fill();

    // The little speech-bubble bottom tail
    ctx.beginPath();
    ctx.moveTo(2, pillH / 2 - 1);
    ctx.lineTo(5, pillH / 2 + 5);
    ctx.lineTo(8, pillH / 2 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Top 3D glossy highlight on the pill face
    ctx.fillStyle = 'rgba(147, 197, 253, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-pillW / 2 + 2, -pillH / 2 + 1.5, pillW - 4, 3, 2);
    ctx.fill();

    // 3. CUTE DIAMOND-SHAPED EYES (Exact from image: angled brackets & black diamond pupils)
    // Left Eye
    this.renderDiamondEye(ctx, -7, -1);
    // Right Eye
    this.renderDiamondEye(ctx, 7, -1);

    // 4. SWEET CURVED SMILE (Exact from image)
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 1.5, 3.5, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // 5. ANIMATED LITTLE HANDS ("Make character lil hand and give animation to it")
    const walkBob = Math.sin(time * 10);
    const isAttacking = this.playerAttackAnimTimer > 0;
    const isDashing = p.isDashing;

    let leftHandX = -orbRadius - 1;
    let leftHandY = 4 + walkBob * 3;
    let rightHandX = orbRadius + 1;
    let rightHandY = 4 - walkBob * 3;

    if (isDashing) {
      leftHandX = -orbRadius * 0.5;
      leftHandY = orbRadius * 0.7;
      rightHandX = orbRadius * 0.5;
      rightHandY = orbRadius * 0.7;
    } else if (isAttacking) {
      const fx = Math.cos(p.facingAngle);
      const fy = Math.sin(p.facingAngle);
      leftHandX += fx * 6;
      leftHandY += fy * 6 - 3;
      rightHandX += fx * 10;
      rightHandY += fy * 10 - 3;
    }

    this.renderLittleHand(ctx, leftHandX, leftHandY, -1, isAttacking);
    this.renderLittleHand(ctx, rightHandX, rightHandY, 1, isAttacking);

    // Extra Shield Ring if Arcane Shield active
    if (p.shield > 0) {
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, orbRadius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Renders the exact diamond eye with outer angled white corner and inner dark tilted diamond
  private renderDiamondEye(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    ctx.translate(x, y);

    // Outer white rotated diamond/brackets
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(4.5, 0);
    ctx.lineTo(0, 4.5);
    ctx.lineTo(-4.5, 0);
    ctx.closePath();
    ctx.fill();

    // Inner glossy black tilted pupil
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, -2.5);
    ctx.lineTo(2.5, 0);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-2.5, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // Renders animated little bubble hand with tiny finger nubs and casting sparks
  private renderLittleHand(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, isAttacking: boolean) {
    ctx.save();
    ctx.translate(x, y);

    // Soft cyan glow
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;

    // Little palm
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // 3 Cute tiny rounded fingers / nubs
    for (let f = -1; f <= 1; f++) {
      const fingerAngle = (side * 0.3) + f * 0.55;
      const fx = Math.cos(fingerAngle) * 4.5;
      const fy = Math.sin(fingerAngle) * 4.5;
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cyan highlight rim
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Specular shine dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(-1.2, -1.2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Magic spark when attacking
    if (isAttacking) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(side * 4, -3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const part of this.particles) {
      ctx.save();
      ctx.globalAlpha = part.alpha;
      ctx.fillStyle = part.color;

      ctx.beginPath();
      ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderDamageNumbers(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const dn of this.damageNumbers) {
      ctx.globalAlpha = dn.alpha;
      ctx.font = dn.isCrit ? 'bold 16px "Cinzel", sans-serif' : 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = dn.color;
      ctx.textAlign = 'center';

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(dn.isCrit ? `⚡${dn.value}!` : `${dn.value}`, dn.x, dn.y);
      ctx.fillText(dn.isCrit ? `⚡${dn.value}!` : `${dn.value}`, dn.x, dn.y);
    }
    ctx.restore();
  }
}
