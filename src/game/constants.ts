export const ARENA_WIDTH = 3200;
export const ARENA_HEIGHT = 3200;

export const BASE_PLAYER_SPEED = 295; // pixels per second (Increased character speed)
export const PLAYER_RADIUS = 22;
export const MAX_POWER_SLOTS = 4; // Exactly 4 weapon power slots

export const MONSTER_CONFIGS = {
  NORMAL: {
    name: 'Grave Creeper',
    radius: 18,
    baseHp: 52,
    speed: 98, // Significantly reduced initial speed (was 155), scales up with player level
    damage: 14,
    xpValue: 14,
    color: '#84cc16', // acidic lime
    accentColor: '#365314',
    attackCooldown: 0.7,
  },
  FAST: {
    name: 'Hellhound',
    radius: 16,
    baseHp: 32,
    speed: 152, // Significantly reduced initial speed (was 245), scales up with player level
    damage: 12,
    xpValue: 18,
    color: '#f97316', // flaming orange
    accentColor: '#7c2d12',
    attackCooldown: 0.55,
  },
  TANK: {
    name: 'Obsidian Golem',
    radius: 30,
    baseHp: 190,
    speed: 68, // Reduced initial speed (was 105), scales up with player level
    damage: 26,
    xpValue: 48,
    color: '#475569', // dark stone
    accentColor: '#0f172a',
    attackCooldown: 1.0,
  },
  RANGED: {
    name: 'Cultist Shaman',
    radius: 19,
    baseHp: 44,
    speed: 82, // Reduced initial speed (was 120), scales up with player level
    damage: 16,
    xpValue: 28,
    color: '#a855f7', // mystical purple
    accentColor: '#581c87',
    attackCooldown: 1.6,
    preferredDistance: 250,
  },
  ELITE: {
    name: 'Blood Champion',
    radius: 28,
    baseHp: 440,
    speed: 115, // Reduced initial speed (was 165), scales up with player level
    damage: 34,
    xpValue: 140,
    color: '#ef4444', // crimson blood
    accentColor: '#7f1d1d',
    attackCooldown: 0.85,
  },
  BOSS: {
    name: 'The Abyssal Overlord',
    radius: 48,
    baseHp: 2400,
    speed: 78, // Reduced initial speed (was 108), scales up with player level
    damage: 48,
    xpValue: 600,
    color: '#dc2626', // dark red with hellish core
    accentColor: '#450a0a',
    attackCooldown: 1.25,
  },
};
