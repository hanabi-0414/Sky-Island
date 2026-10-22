import test from 'node:test';
import assert from 'node:assert/strict';
import { createIslandBlocks, isWithinWorldBounds, WORLD_LIMIT } from '../src/world.js';

const coordinateKey = (x, y, z) => `${x},${y},${z}`;

test('地形可依種子重現，不同種子會生成不同地貌', () => {
  const first = createIslandBlocks(1234);
  const repeated = createIslandBlocks(1234);
  const other = createIslandBlocks(5678);

  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first, other);
});

test('隨機地形、樹木與建物均在 32 格世界範圍內', () => {
  const blocks = createIslandBlocks(1234);
  assert.ok(blocks.length > 500);
  assert.equal(WORLD_LIMIT, 32);
  assert.ok(blocks.every((block) => isWithinWorldBounds(block.x, block.y, block.z)));
});

test('世界最低一層全是石頭，並生成地表、樹木與成群的磚木建物', () => {
  const blocks = createIslandBlocks(1234);
  const lowestY = Math.min(...blocks.map((block) => block.y));
  const bottom = blocks.filter((block) => block.y === lowestY);
  const types = new Set(blocks.map((block) => block.type));
  const blockMap = new Map(blocks.map((block) => [coordinateKey(block.x, block.y, block.z), block.type]));
  const treeTrunks = blocks.filter((block) => block.type === 'log');
  const brickFoundation = blocks.filter((block) => block.type === 'brick');
  const planks = blocks.filter((block) => block.type === 'planks');

  assert.ok(bottom.length > 0);
  assert.ok(bottom.every((block) => block.type === 'stone'));
  for (const type of ['grass', 'dirt', 'stone', 'sand', 'brick', 'planks', 'log', 'leaves']) {
    assert.ok(types.has(type), `世界應包含 ${type}`);
  }
  assert.ok(treeTrunks.length >= 8);
  assert.ok(brickFoundation.length >= 9);
  assert.ok(planks.length >= 12);
  assert.ok(treeTrunks.some((trunk) =>
    blockMap.get(coordinateKey(trunk.x, trunk.y + 2, trunk.z)) === 'log' &&
    blocks.some((block) => block.type === 'leaves' &&
      Math.abs(block.x - trunk.x) <= 2 &&
      Math.abs(block.z - trunk.z) <= 2 &&
      block.y >= trunk.y + 2),
  ));
  assert.ok(brickFoundation.some((brick) =>
    blocks.some((plank) => plank.type === 'planks' &&
      Math.abs(plank.x - brick.x) <= 2 &&
      Math.abs(plank.z - brick.z) <= 2 &&
      plank.y > brick.y),
  ));
});
