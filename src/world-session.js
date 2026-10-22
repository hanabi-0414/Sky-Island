import { createIslandBlocks, findSpawnPoint, PLAYER_EYE_HEIGHT } from './world.js';
import { findNaturalSpawnPoint } from './world-safety.js';

export function createWorldSession(seed, clearance = 0.1) {
  const blocks = createIslandBlocks(seed);
  const spawn = findNaturalSpawnPoint(blocks, findSpawnPoint());
  const highestTerrainY = Math.max(...blocks
    .filter((block) => ['grass', 'dirt', 'stone', 'sand'].includes(block.type))
    .map((block) => block.y + 0.5));

  return {
    seed: seed >>> 0,
    blocks,
    spawn,
    highestTerrainY,
    player: {
      x: spawn.x,
      y: Math.max(spawn.y + clearance, highestTerrainY + PLAYER_EYE_HEIGHT + clearance),
      z: spawn.z,
      verticalSpeed: 0,
      grounded: false,
    },
  };
}
