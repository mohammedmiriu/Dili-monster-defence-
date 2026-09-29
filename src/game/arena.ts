import { ARENA_WIDTH, ARENA_HEIGHT } from './constants';
import { Obstacle } from '../types/game';

export interface ArenaWall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroundStone {
  x: number;
  y: number;
  radius: number;
  mossAngle: number;
}

export class ArenaManager {
  public obstacles: Obstacle[] = [];
  public walls: ArenaWall[] = [];
  public groundStones: GroundStone[] = [];

  constructor() {
    this.generateArenaLayout();
  }

  public generateArenaLayout() {
    this.obstacles = [];
    this.walls = [];
    this.groundStones = [];

    // Outer boundary walls (thickness 40)
    const t = 40;
    this.walls.push({ x: 0, y: 0, width: ARENA_WIDTH, height: t }); // top
    this.walls.push({ x: 0, y: ARENA_HEIGHT - t, width: ARENA_WIDTH, height: t }); // bottom
    this.walls.push({ x: 0, y: 0, width: t, height: ARENA_HEIGHT }); // left
    this.walls.push({ x: ARENA_WIDTH - t, y: 0, width: t, height: ARENA_HEIGHT }); // right

    // Interior overgrown mossy ruin walls
    const ruinWalls: ArenaWall[] = [
      { x: 500, y: 600, width: 220, height: 35 },
      { x: 500, y: 600, width: 35, height: 180 },
      { x: 2300, y: 550, width: 260, height: 35 },
      { x: 2525, y: 550, width: 35, height: 220 },
      { x: 650, y: 2200, width: 35, height: 260 },
      { x: 650, y: 2425, width: 220, height: 35 },
      { x: 2200, y: 2300, width: 240, height: 35 },
      { x: 2200, y: 2100, width: 35, height: 200 },
      { x: 1100, y: 1100, width: 140, height: 30 },
      { x: 1960, y: 1100, width: 140, height: 30 },
      { x: 1100, y: 2050, width: 140, height: 30 },
      { x: 1960, y: 2050, width: 140, height: 30 },
    ];
    this.walls.push(...ruinWalls);

    // Natural obstacles: GRASS ROCKS (Mossy Boulders), Lush Foliage Trees, Monoliths
    // Give higher frequency to grass rocks as requested by user ("Make grass rocks")
    const obstacleTypes: Array<'ROCK' | 'ROCK' | 'TREE' | 'RUINS' | 'PILLAR'> = ['ROCK', 'ROCK', 'TREE', 'RUINS', 'PILLAR'];

    const gridCols = 10;
    const gridRows = 10;
    const cellW = ARENA_WIDTH / gridCols;
    const cellH = ARENA_HEIGHT / gridRows;

    for (let c = 1; c < gridCols - 1; c++) {
      for (let r = 1; r < gridRows - 1; r++) {
        const cx = (c + 0.5) * cellW;
        const cy = (r + 0.5) * cellH;
        const distFromCenter = Math.hypot(cx - ARENA_WIDTH / 2, cy - ARENA_HEIGHT / 2);
        if (distFromCenter < 340) continue; // Clear central glade

        if (Math.random() < 0.75) {
          const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
          const ox = cx + (Math.random() - 0.5) * (cellW * 0.65);
          const oy = cy + (Math.random() - 0.5) * (cellH * 0.65);

          let radius = 28;
          let color = '#475569';
          let detailColor = '#15803d';

          if (type === 'ROCK') {
            // Mossy Grass Rock Boulders
            radius = 26 + Math.random() * 16;
            color = '#334155'; // Dark granite core
            detailColor = '#22c55e'; // Vibrant green grass & moss cover
          } else if (type === 'TREE') {
            radius = 24 + Math.random() * 12;
            color = '#15803d';
            detailColor = '#14532d';
          } else if (type === 'PILLAR') {
            radius = 20 + Math.random() * 8;
            color = '#64748b';
            detailColor = '#34d399';
          } else if (type === 'RUINS') {
            radius = 32 + Math.random() * 12;
            color = '#334155';
            detailColor = '#166534';
          }

          this.obstacles.push({
            x: ox,
            y: oy,
            radius,
            type,
            color,
            detailColor,
          });
        }
      }
    }

    // Generate smaller scattered ground grass-rocks across the arena (walkable/decorative terrain stones)
    for (let i = 0; i < 90; i++) {
      this.groundStones.push({
        x: 80 + Math.random() * (ARENA_WIDTH - 160),
        y: 80 + Math.random() * (ARENA_HEIGHT - 160),
        radius: 6 + Math.random() * 9,
        mossAngle: Math.random() * Math.PI * 2,
      });
    }
  }

  public resolveCollision(x: number, y: number, radius: number): { x: number; y: number; collided: boolean } {
    let resolvedX = x;
    let resolvedY = y;
    let collided = false;

    // Boundary walls
    const t = 40;
    if (resolvedX - radius < t) {
      resolvedX = t + radius;
      collided = true;
    }
    if (resolvedX + radius > ARENA_WIDTH - t) {
      resolvedX = ARENA_WIDTH - t - radius;
      collided = true;
    }
    if (resolvedY - radius < t) {
      resolvedY = t + radius;
      collided = true;
    }
    if (resolvedY + radius > ARENA_HEIGHT - t) {
      resolvedY = ARENA_HEIGHT - t - radius;
      collided = true;
    }

    // Interior walls (AABB vs Circle)
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(resolvedX, wall.x + wall.width));
      const closestY = Math.max(wall.y, Math.min(resolvedY, wall.y + wall.height));
      const distX = resolvedX - closestX;
      const distY = resolvedY - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq < radius * radius && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = radius - dist;
        resolvedX += (distX / dist) * overlap;
        resolvedY += (distY / dist) * overlap;
        collided = true;
      }
    }

    // Circular obstacles
    for (const obs of this.obstacles) {
      const dx = resolvedX - obs.x;
      const dy = resolvedY - obs.y;
      const distSq = dx * dx + dy * dy;
      const minDist = radius + obs.radius;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = minDist - dist;
        resolvedX += (dx / dist) * overlap;
        resolvedY += (dy / dist) * overlap;
        collided = true;
      }
    }

    return { x: resolvedX, y: resolvedY, collided };
  }
}
