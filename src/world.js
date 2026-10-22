export const WORLD_LIMIT = 32;

export function isWithinWorldBounds(x, y, z) {
  const half = WORLD_LIMIT / 2;
  return [x, y, z].every((value) => Number.isFinite(value) && value >= -half && value < half);
}

export function createIslandBlocks() {
  const blocks = [];
  const layers = [
    { y: 0, width: 16, type: 'grass' },
    { y: -1, width: 12, type: 'dirt' },
    { y: -2, width: 8, type: 'dirt' },
    { y: -3, width: 4, type: 'stone' },
  ];

  for (const { y, width, type } of layers) {
    const start = -width / 2;
    for (let x = start; x < start + width; x += 1) {
      for (let z = start; z < start + width; z += 1) {
        blocks.push({ x, y, z, type });
      }
    }
  }

  return blocks;
}

export function findSpawnPoint() {
  return { x: 0, y: 2.2, z: 0 };
}
