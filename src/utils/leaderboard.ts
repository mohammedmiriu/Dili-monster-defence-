import { GameMode, RunStatistics } from '../types/game';

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  mode: GameMode;
  score: number;
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
  date: string;
}

const STORAGE_KEY = 'monster_survival_leaderboard_v1';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'Glade Archmage',
    mode: 'SURVIVAL',
    score: 34250,
    finalLevel: 22,
    monstersDefeated: 580,
    survivalTimeSeconds: 600,
    bossesDefeated: 3,
    powersCollected: [
      { id: 'fireball', name: 'MEGA FIREBALL', level: 4, icon: '🔥' },
      { id: 'lightning', name: 'TEMPEST WRATH', level: 4, icon: '⚡' },
      { id: 'ice_blast', name: 'Ice Blast III', level: 3, icon: '❄️' },
      { id: 'energy_orb', name: 'Energy Orb II', level: 2, icon: '🌀' },
    ],
    date: '2026-09-28',
  },
  {
    id: 'seed-2',
    playerName: 'Shadow Slayer',
    mode: 'ENDLESS',
    score: 28900,
    finalLevel: 19,
    monstersDefeated: 490,
    survivalTimeSeconds: 520,
    bossesDefeated: 2,
    powersCollected: [
      { id: 'meteor', name: 'ARMAGEDDON CATACLYSM', level: 4, icon: '☄️' },
      { id: 'sword_wave', name: 'Sword Wave III', level: 3, icon: '🗡️' },
      { id: 'poison_cloud', name: 'Poison Mire II', level: 2, icon: '☠️' },
    ],
    date: '2026-09-27',
  },
  {
    id: 'seed-3',
    playerName: 'Titan Bane',
    mode: 'HARDCORE',
    score: 24600,
    finalLevel: 16,
    monstersDefeated: 395,
    survivalTimeSeconds: 410,
    bossesDefeated: 2,
    powersCollected: [
      { id: 'lightning', name: 'Lightning III', level: 3, icon: '⚡' },
      { id: 'fireball', name: 'Fireball III', level: 3, icon: '🔥' },
      { id: 'energy_orb', name: 'Energy Orb II', level: 2, icon: '🌀' },
    ],
    date: '2026-09-26',
  },
  {
    id: 'seed-4',
    playerName: 'Emerald Warden',
    mode: 'SURVIVAL',
    score: 19800,
    finalLevel: 14,
    monstersDefeated: 320,
    survivalTimeSeconds: 450,
    bossesDefeated: 1,
    powersCollected: [
      { id: 'ice_blast', name: 'GLACIAL STORM', level: 4, icon: '❄️' },
      { id: 'sword_wave', name: 'Sword Wave II', level: 2, icon: '🗡️' },
    ],
    date: '2026-09-25',
  },
];

export function calculateScore(stats: RunStatistics): number {
  const killScore = stats.monstersDefeated * 25;
  const levelScore = stats.finalLevel * 150;
  const bossScore = stats.bossesDefeated * 1200;
  const timeScore = Math.floor(stats.survivalTimeSeconds * 5);
  const modeMultiplier = stats.mode === 'HARDCORE' ? 1.5 : (stats.mode === 'ENDLESS' ? 1.2 : 1.0);
  return Math.round((killScore + levelScore + bossScore + timeScore) * modeMultiplier);
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.score - a.score);
      }
    }
  } catch (err) {
    console.error('Failed to load leaderboard from storage', err);
  }
  return [...DEFAULT_LEADERBOARD].sort((a, b) => b.score - a.score);
}

export function saveLeaderboardEntry(
  playerName: string,
  stats: RunStatistics
): LeaderboardEntry {
  const current = getLeaderboard();
  const score = calculateScore(stats);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const newEntry: LeaderboardEntry = {
    id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    playerName: (playerName.trim() || 'Heroic Spirit').slice(0, 18),
    mode: stats.mode,
    score,
    finalLevel: stats.finalLevel,
    monstersDefeated: stats.monstersDefeated,
    survivalTimeSeconds: stats.survivalTimeSeconds,
    bossesDefeated: stats.bossesDefeated,
    powersCollected: stats.powersCollected,
    date: dateStr,
  };

  const updated = [...current, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50); // Keep top 50

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save leaderboard', err);
  }

  return newEntry;
}

export function getTopScore(): LeaderboardEntry | null {
  const list = getLeaderboard();
  return list.length > 0 ? list[0] : null;
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
