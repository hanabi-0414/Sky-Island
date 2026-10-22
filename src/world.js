export const WORLD_LIMIT = 32;
export const PLAYER_EYE_HEIGHT = 2;
export const BLOCK_TYPES = Object.freeze([
  'grass', 'dirt', 'stone', 'sand', 'brick', 'planks', 'log', 'leaves',
]);

const DEFAULT_WORLD_SEED = 0x51a17;
const WORLD_BOTTOM = -10;

export function isWithinWorldBounds(x, y, z) {
  const half = WORLD_LIMIT / 2;
  return [x, y, z].every((value) => Number.isFinite(value) && value >= -half && value < half);
}

function hashNoise(x, z, seed, salt = 0) {
  let value = Math.imul(x + salt, 0x1f123bb5) ^ Math.imul(z - salt, 0x5f356495) ^ seed;
  value = Math.imul(value ^ (value >>> 15), 0x2c1b3c6d);
  value = Math.imul(value ^ (value >>> 12), 0x297a2d39);
  return ((value ^ (value >>> 15)) >>> 0) / 0xffffffff;
}

function smoothNoise(x, z, seed, salt = 0) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;
  const smoothX = tx * tx * (3 - 2 * tx);
  const smoothZ = tz * tz * (3 - 2 * tz);
  const top = hashNoise(x0, z0, seed, salt) * (1 - smoothX) +
    hashNoise(x0 + 1, z0, seed, salt) * smoothX;
  const bottom = hashNoise(x0, z0 + 1, seed, salt) * (1 - smoothX) +
    hashNoise(x0 + 1, z0 + 1, seed, salt) * smoothX;
  return top * (1 - smoothZ) + bottom * smoothZ;
}

function terrainHeight(x, z, seed) {
  if (Math.abs(x) <= 2 && Math.abs(z) <= 2) return 0;
  const broad = smoothNoise(x / 4, z / 4, seed, 17) - 0.5;
  const detail = smoothNoise(x / 1.8, z / 1.8, seed, 43) - 0.5;
  const edge = Math.max(Math.abs(x), Math.abs(z));
  return Math.round(1 + broad * 6 + detail * 2 - edge * 0.15);
}

export function createIslandBlocks(seed = DEFAULT_WORLD_SEED) {
  const worldSeed = Number.isFinite(seed) ? seed >>> 0 : DEFAULT_WORLD_SEED;
  const blocks = [];
  const occupied = new Map();
  const surfaces = new Map();
  const columnKey = (x, z) => `${x},${z}`;
  const blockKey = (x, y, z) => `${x},${y},${z}`;
  const addBlock = (x, y, z, type) => {
    if (!isWithinWorldBounds(x, y, z)) return false;
    const key = blockKey(x, y, z);
    if (occupied.has(key)) return false;
    const block = { x, y, z, type };
    blocks.push(block);
    occupied.set(key, type);
    return true;
  };

  for (let x = -10; x <= 10; x += 1) {
    for (let z = -10; z <= 10; z += 1) {
      const edge = Math.max(Math.abs(x), Math.abs(z));
      const edgeLimit = 7 + smoothNoise(x / 2.7, z / 2.7, worldSeed, 71) * 2;
      if (edge > edgeLimit) continue;

      const topY = terrainHeight(x, z, worldSeed);
      surfaces.set(columnKey(x, z), topY);
      const shore = edge >= 6 && topY <= 1 && hashNoise(x, z, worldSeed, 101) > 0.28;
      const rockyOutcrop = hashNoise(x, z, worldSeed, 131) > 0.975;

      for (let y = WORLD_BOTTOM; y <= topY; y += 1) {
        let type;
        if (y === WORLD_BOTTOM || y <= topY - 4 || (y === topY - 2 && hashNoise(x, z, worldSeed, y) > 0.96)) {
          type = 'stone';
        } else if (y === topY) {
          type = rockyOutcrop ? 'stone' : shore ? 'sand' : 'grass';
        } else if (shore && y >= topY - 1) {
          type = 'sand';
        } else {
          type = 'dirt';
        }
        addBlock(x, y, z, type);
      }
    }
  }

  const buildingCenter = { x: -4, z: 4 };
  const treeCandidates = [];
  for (const [key, topY] of surfaces) {
    const [x, z] = key.split(',').map(Number);
    if (Math.abs(x) <= 3 && Math.abs(z) <= 3) continue;
    if (Math.abs(x - buildingCenter.x) <= 3 && Math.abs(z - buildingCenter.z) <= 3) continue;
    if (occupied.get(blockKey(x, topY, z)) !== 'grass') continue;
    const neighbors = [
      surfaces.get(columnKey(x + 1, z)), surfaces.get(columnKey(x - 1, z)),
      surfaces.get(columnKey(x, z + 1)), surfaces.get(columnKey(x, z - 1)),
    ];
    if (neighbors.every((height) => height != null && Math.abs(height - topY) <= 1)) {
      treeCandidates.push({ x, z, topY, rank: hashNoise(x, z, worldSeed, 157) });
    }
  }
  treeCandidates.sort((a, b) => a.rank - b.rank);
  const trees = [];
  for (const candidate of treeCandidates) {
    if (trees.some((tree) => Math.hypot(tree.x - candidate.x, tree.z - candidate.z) < 5)) continue;
    trees.push(candidate);
    if (trees.length === 4) break;
  }

  for (const tree of trees) {
    const trunkHeight = 3 + Math.floor(hashNoise(tree.x, tree.z, worldSeed, 181) * 2);
    for (let dy = 1; dy <= trunkHeight; dy += 1) {
      addBlock(tree.x, tree.topY + dy, tree.z, 'log');
    }
    for (let dy = trunkHeight - 1; dy <= trunkHeight + 1; dy += 1) {
      const radius = dy === trunkHeight + 1 ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx += 1) {
        for (let dz = -radius; dz <= radius; dz += 1) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && radius === 2) continue;
          addBlock(tree.x + dx, tree.topY + dy, tree.z + dz, 'leaves');
        }
      }
    }
  }

  const footprint = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      const x = buildingCenter.x + dx;
      const z = buildingCenter.z + dz;
      footprint.push({ x, z, topY: surfaces.get(columnKey(x, z)) });
    }
  }
  const floorY = Math.max(...footprint.map((cell) => cell.topY ?? WORLD_BOTTOM)) + 1;
  for (const cell of footprint) {
    if (cell.topY == null) continue;
    for (let y = cell.topY + 1; y <= floorY; y += 1) addBlock(cell.x, y, cell.z, 'brick');
  }
  for (let y = floorY + 1; y <= floorY + 2; y += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        const isWall = Math.abs(dx) === 1 || Math.abs(dz) === 1;
        const doorway = dz === 1 && dx === 0;
        if (isWall && !doorway) addBlock(buildingCenter.x + dx, y, buildingCenter.z + dz, 'planks');
      }
    }
  }
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      addBlock(buildingCenter.x + dx, floorY + 3, buildingCenter.z + dz, 'planks');
    }
  }

  return blocks;
}

export function findSpawnPoint() {
  return { x: 0, y: 0.5 + PLAYER_EYE_HEIGHT, z: 0 };
}
