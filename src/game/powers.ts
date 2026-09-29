import { EquippedPower, PowerCardOption, PowerId, PlayerStats } from '../types/game';
import { MAX_POWER_SLOTS } from './constants';

export interface PowerMeta {
  id: PowerId;
  name: string;
  icon: string;
  color: string;
  description: string;
  baseCooldown: number;
  baseDamage: number;
  baseRange: number;
  baseProjectiles: number;
  tierNames: string[];
}

export const ALL_POWERS_META: Record<PowerId, PowerMeta> = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    color: '#f97316',
    description: 'Launches explosive fireballs that detonate on contact with enemies, dealing area damage.',
    baseCooldown: 1.4,
    baseDamage: 45,
    baseRange: 380,
    baseProjectiles: 1,
    tierNames: ['Fireball I', 'Fireball II', 'Fireball III', 'MEGA FIREBALL'],
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Strike',
    icon: '⚡',
    color: '#eab308',
    description: 'Strikes down ferocious thunderbolts on nearest monsters, shocking adjacent foes.',
    baseCooldown: 1.8,
    baseDamage: 60,
    baseRange: 420,
    baseProjectiles: 1,
    tierNames: ['Lightning I', 'Lightning II', 'Lightning III', 'TEMPEST WRATH'],
  },
  ice_blast: {
    id: 'ice_blast',
    name: 'Ice Blast',
    icon: '❄️',
    color: '#38bdf8',
    description: 'Fires piercing frost shards that damage and slow enemy movement speed by 40%.',
    baseCooldown: 1.2,
    baseDamage: 28,
    baseRange: 340,
    baseProjectiles: 2,
    tierNames: ['Ice Blast I', 'Ice Blast II', 'Ice Blast III', 'GLACIAL STORM'],
  },
  sword_wave: {
    id: 'sword_wave',
    name: 'Sword Wave',
    icon: '🗡️',
    color: '#cbd5e1',
    description: 'Unleashes crescent blades slicing through monster ranks in your facing direction.',
    baseCooldown: 0.9,
    baseDamage: 36,
    baseRange: 280,
    baseProjectiles: 1,
    tierNames: ['Sword Wave I', 'Sword Wave II', 'Sword Wave III', 'EXCALIBUR SURGE'],
  },
  poison_cloud: {
    id: 'poison_cloud',
    name: 'Poison Cloud',
    icon: '☠️',
    color: '#22c55e',
    description: 'Drops lingering toxic mires that continuously dissolve monster health over time.',
    baseCooldown: 2.2,
    baseDamage: 16,
    baseRange: 220,
    baseProjectiles: 1,
    tierNames: ['Poison Mire I', 'Poison Mire II', 'Poison Mire III', 'PLAGUE BASTION'],
  },
  meteor: {
    id: 'meteor',
    name: 'Meteor',
    icon: '☄️',
    color: '#ef4444',
    description: 'Calls cataclysmic flaming meteors crashing down at dense enemy swarms.',
    baseCooldown: 3.2,
    baseDamage: 110,
    baseRange: 480,
    baseProjectiles: 1,
    tierNames: ['Meteor I', 'Meteor II', 'Meteor III', 'ARMAGEDDON CATACLYSM'],
  },
  energy_orb: {
    id: 'energy_orb',
    name: 'Energy Orb',
    icon: '🌀',
    color: '#a855f7',
    description: 'Summons astral energy orbs that orbit tightly around your spirit body, vaporizing nearby foes.',
    baseCooldown: 0.1,
    baseDamage: 32,
    baseRange: 50, // "Make orb closure to character" -> tight personal orbit (~50px)
    baseProjectiles: 2,
    tierNames: ['Energy Orb I', 'Energy Orb II', 'Energy Orb III', 'SINGULARITY SHIELD'],
  },
};

export const DEFENCE_OPTIONS = [
  {
    id: 'def_iron_bastion',
    name: 'Iron Bastion',
    icon: '🛡️',
    color: '#10b981',
    description: '+25% Maximum Health and immediately restores 35 HP.',
    apply: (player: PlayerStats) => {
      const boost = Math.round(player.maxHp * 0.25);
      player.maxHp += boost;
      player.hp = Math.min(player.maxHp, player.hp + 35);
    },
  },
  {
    id: 'def_arcane_aegis',
    name: 'Arcane Aegis',
    icon: '🔮',
    color: '#8b5cf6',
    description: 'Grants an arcane shield that absorbs up to 45 damage and recharges when safe.',
    apply: (player: PlayerStats) => {
      player.maxShield += 45;
      player.shield = player.maxShield;
    },
  },
  {
    id: 'def_vital_regen',
    name: 'Vital Regeneration',
    icon: '🌿',
    color: '#14b8a6',
    description: 'Regenerate +2.5 Health per second continuously.',
    apply: (player: PlayerStats) => {
      player.hpRegen += 2.5;
    },
  },
  {
    id: 'def_stone_armor',
    name: 'Stoneplate Armor',
    icon: '🪨',
    color: '#94a3b8',
    description: 'Hardens defenses to reduce all incoming damage by 15%.',
    apply: (player: PlayerStats) => {
      player.armor = Math.min(0.6, player.armor + 0.15);
    },
  },
  {
    id: 'def_slayers_ward',
    name: "Slayer's Warding",
    icon: '👑',
    color: '#f59e0b',
    description: 'Reduces all damage received from Elites and Bosses by 30%.',
    apply: (player: PlayerStats) => {
      player.bossDamageReduction = Math.min(0.65, player.bossDamageReduction + 0.3);
    },
  },
];

const COMBAT_AMPS = [
  {
    name: 'Colossal Might',
    icon: '⚔️',
    color: '#f97316',
    desc: '+25% global damage dealt by all active powers.',
    fn: (player: PlayerStats) => { player.baseDamageMultiplier += 0.25; },
  },
  {
    name: 'Arcane Cadence',
    icon: '⚡',
    color: '#eab308',
    desc: '+20% faster attack speed and ability cooldowns.',
    fn: (player: PlayerStats) => { player.attackSpeedMultiplier *= 1.2; },
  },
  {
    name: 'Precision Criticals',
    icon: '🎯',
    color: '#f43f5e',
    desc: '+15% Critical Hit chance and +50% Critical damage.',
    fn: (player: PlayerStats) => { player.critChance = Math.min(0.75, player.critChance + 0.15); player.critDamage += 0.5; },
  },
  {
    name: 'Astral Expansion',
    icon: '💥',
    color: '#a855f7',
    desc: '+25% Area of Effect explosion radius & projectile size.',
    fn: (player: PlayerStats) => { player.areaMultiplier *= 1.25; },
  },
];

export function generateLevelUpOptions(
  player: PlayerStats,
  equippedPowers: EquippedPower[],
  onSelect: (option: PowerCardOption) => void
): PowerCardOption[] {
  const result: PowerCardOption[] = [];
  const equippedIds = new Set(equippedPowers.map(p => p.id));
  const hasFreeSlot = equippedPowers.length < MAX_POWER_SLOTS;
  const availableNewPowers = Object.values(ALL_POWERS_META).filter(p => !equippedIds.has(p.id));

  // 1. ONE-TIME SPECIAL POWERS ("Add health power only one", "Add speed power only one")
  // Check if eligible to offer unique health or unique speed power
  const canOfferHealth = !player.hasTakenHealthPower;
  const canOfferSpeed = !player.hasTakenSpeedPower;

  // Decide if we should offer one of the one-time powers this level
  if (canOfferHealth && (player.level === 2 || player.level === 5 || Math.random() < 0.35)) {
    result.push({
      category: 'UNIQUE_HEALTH',
      categoryTitle: '❤️ HEALTH SURGE [ONE-TIME]',
      id: 'unique_health_surge',
      name: 'Divine Vitality',
      icon: '❤️‍🔥',
      color: '#f43f5e',
      description: '+100 Max Health, instantly restores 100% full HP, and grants +2.5 HP/sec permanent regeneration.',
      apply: () => {
        player.hasTakenHealthPower = true;
        player.maxHp += 100;
        player.hp = player.maxHp;
        player.hpRegen += 2.5;
      },
    });
  } else if (canOfferSpeed && (player.level === 3 || player.level === 6 || Math.random() < 0.35)) {
    result.push({
      category: 'UNIQUE_SPEED',
      categoryTitle: '⚡ SPEED SURGE [ONE-TIME]',
      id: 'unique_speed_surge',
      name: 'Celestial Godspeed',
      icon: '👟',
      color: '#06b6d4',
      description: '+30% Movement Speed permanently and cuts Dash Cooldown by 35% for hyper-agility.',
      apply: () => {
        player.hasTakenSpeedPower = true;
        player.speed = Math.round(player.speed * 1.30);
        player.maxDashCooldown = Math.max(1.0, player.maxDashCooldown * 0.65);
      },
    });
  }

  // 2. NEW POWER (comes sometimes, e.g. ~28% chance or at milestone levels if slot free)
  const isMilestone = player.level === 4 || player.level === 8 || player.level === 12;
  const rollChance = Math.random() < 0.28;
  const shouldOfferNewPower = hasFreeSlot && availableNewPowers.length > 0 && (isMilestone || rollChance);

  if (shouldOfferNewPower && result.length < 3) {
    const pickedMeta = availableNewPowers[Math.floor(Math.random() * availableNewPowers.length)];
    result.push({
      category: 'NEW_POWER',
      categoryTitle: `🆕 NEW POWER (${equippedPowers.length + 1}/${MAX_POWER_SLOTS})`,
      id: `new_${pickedMeta.id}`,
      name: pickedMeta.tierNames[0],
      icon: pickedMeta.icon,
      color: pickedMeta.color,
      description: `Unlock ${pickedMeta.name}: ${pickedMeta.description}`,
      currentLevel: 0,
      nextLevel: 1,
      apply: () => {
        equippedPowers.push({
          id: pickedMeta.id,
          name: pickedMeta.tierNames[0],
          level: 1,
          maxLevel: 4,
          cooldownTimer: 0,
          cooldown: pickedMeta.baseCooldown,
          damage: pickedMeta.baseDamage,
          range: pickedMeta.baseRange,
          projectiles: pickedMeta.baseProjectiles,
          icon: pickedMeta.icon,
          description: pickedMeta.description,
          color: pickedMeta.color,
        });
      },
    });
  }

  // 3. Power Upgrades for existing equipped powers
  const upgradeablePowers = equippedPowers.filter(p => p.level < p.maxLevel);
  const shuffledUpgradeable = [...upgradeablePowers].sort(() => Math.random() - 0.5);

  for (const target of shuffledUpgradeable) {
    if (result.length >= 3) break;
    const meta = ALL_POWERS_META[target.id];
    const nextLevel = target.level + 1;
    const nextName = meta.tierNames[nextLevel - 1] || `${target.name} ${nextLevel}`;

    result.push({
      category: 'POWER_UPGRADE',
      categoryTitle: '⬆️ POWER UPGRADE',
      id: `upgrade_${target.id}_${nextLevel}`,
      name: nextName,
      icon: target.icon,
      color: target.color,
      currentLevel: target.level,
      nextLevel: nextLevel,
      description: `Upgrade ${target.name} to ${nextName}: +30% damage, -15% cooldown, and +1 projectile!`,
      apply: () => {
        target.level = nextLevel;
        target.name = nextName;
        target.damage = Math.round(target.damage * 1.3);
        target.cooldown = Math.max(0.2, target.cooldown * 0.85);
        target.projectiles += 1;
      },
    });
  }

  // 4. If still slot left and speed or health not offered yet, give it another chance
  if (result.length < 3 && canOfferSpeed && !result.some(r => r.id === 'unique_speed_surge')) {
    result.push({
      category: 'UNIQUE_SPEED',
      categoryTitle: '⚡ SPEED SURGE [ONE-TIME]',
      id: 'unique_speed_surge',
      name: 'Celestial Godspeed',
      icon: '👟',
      color: '#06b6d4',
      description: '+30% Movement Speed permanently and cuts Dash Cooldown by 35% for hyper-agility.',
      apply: () => {
        player.hasTakenSpeedPower = true;
        player.speed = Math.round(player.speed * 1.30);
        player.maxDashCooldown = Math.max(1.0, player.maxDashCooldown * 0.65);
      },
    });
  }

  // 5. Defence Power options
  const shuffledDef = [...DEFENCE_OPTIONS].sort(() => Math.random() - 0.5);
  for (const defPick of shuffledDef) {
    if (result.length >= 3) break;
    result.push({
      category: 'DEFENCE_POWER',
      categoryTitle: '🛡️ DEFENCE POWER',
      id: defPick.id,
      name: defPick.name,
      icon: defPick.icon,
      color: defPick.color,
      description: defPick.description,
      apply: () => defPick.apply(player),
    });
  }

  // 6. Fill up to 3 cards with combat surge amplifiers
  const shuffledAmps = [...COMBAT_AMPS].sort(() => Math.random() - 0.5);
  for (const pick of shuffledAmps) {
    if (result.length >= 3) break;
    result.push({
      category: 'POWER_UPGRADE',
      categoryTitle: '⚡ COMBAT SURGE',
      id: `amp_${pick.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: pick.name,
      icon: pick.icon,
      color: pick.color,
      description: pick.desc,
      apply: () => pick.fn(player),
    });
  }

  return result.slice(0, 3);
}
