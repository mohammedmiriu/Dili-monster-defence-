export type GameMode = 'SURVIVAL' | 'ENDLESS' | 'HARDCORE';

export type GameState = 
  | 'MENU' 
  | 'MODE_SELECT' 
  | 'PLAYING' 
  | 'PAUSED' 
  | 'LEVEL_UP' 
  | 'GAME_OVER' 
  | 'VICTORY';

export type MonsterType = 
  | 'NORMAL' 
  | 'FAST' 
  | 'TANK' 
  | 'RANGED' 
  | 'ELITE' 
  | 'BOSS';

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facingAngle: number;
  maxHp: number;
  hp: number;
  shield: number;
  maxShield: number;
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  
  // Combat stats
  baseDamageMultiplier: number;
  attackSpeedMultiplier: number;
  attackRange: number;
  critChance: number;
  critDamage: number;
  armor: number; // percentage damage reduction
  hpRegen: number; // hp per second
  bossDamageReduction: number;
  areaMultiplier: number;

  // Abilities
  dashCooldown: number;
  maxDashCooldown: number;
  dashTimer: number;
  isDashing: boolean;
  dashDuration: number;
  dashSpeed: number;

  specialCooldown: number;
  maxSpecialCooldown: number;
  specialTimer: number;

  // Invisibility / invulnerability frames
  invulnerableTimer: number;

  // One-time power flags
  hasTakenHealthPower?: boolean;
  hasTakenSpeedPower?: boolean;
}

export type PowerCategory = 'NEW_POWER' | 'POWER_UPGRADE' | 'DEFENCE_POWER' | 'UNIQUE_HEALTH' | 'UNIQUE_SPEED';

export type PowerId = 
  | 'fireball'
  | 'lightning'
  | 'ice_blast'
  | 'sword_wave'
  | 'poison_cloud'
  | 'meteor'
  | 'energy_orb';

export interface EquippedPower {
  id: PowerId;
  name: string;
  level: number;
  maxLevel: number;
  cooldownTimer: number;
  cooldown: number;
  damage: number;
  range: number;
  projectiles: number;
  icon: string;
  description: string;
  color: string;
  subType?: string;
}

export interface PowerCardOption {
  category: PowerCategory;
  categoryTitle: string;
  id: string;
  name: string;
  icon: string;
  description: string;
  currentLevel?: number;
  nextLevel?: number;
  color: string;
  apply: () => void;
}

export interface Monster {
  id: number;
  type: MonsterType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  color: string;
  accentColor: string;
  hitFlashTimer: number;
  attackCooldown: number;
  attackTimer: number;
  isElite: boolean;
  isBoss: boolean;
  // Boss/Elite special attack data
  specialAttackTimer?: number;
  attackPhase?: number;
  telegraphTimer?: number;
  telegraphAngle?: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  life: number;
  maxLife: number;
  pierces: number;
  color: string;
  trailColor: string;
  owner: 'PLAYER' | 'ENEMY';
  type: string;
  extra?: {
    explosionRadius?: number;
    slowEffect?: number;
    poisonDuration?: number;
    orbitDistance?: number;
    orbitAngle?: number;
    isCrit?: boolean;
  };
}

export interface XpOrb {
  id: number;
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'ring';
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  color: string;
  alpha: number;
  life: number;
}

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'ROCK' | 'TREE' | 'RUINS' | 'PILLAR';
  color: string;
  detailColor: string;
}

export interface GameSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  vibrationEnabled: boolean;
  joystickSensitivity: number; // 0.5 to 1.5
}

export interface RunStatistics {
  mode: GameMode;
  finalLevel: number;
  monstersDefeated: number;
  survivalTimeSeconds: number;
  bossesDefeated: number;
  powersCollected: Array<{
    id: string;
    name: string;
    level: number;
    icon: string;
  }>;
}
