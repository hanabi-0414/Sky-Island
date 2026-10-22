import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_LIMIT,
  createIslandBlocks,
  findSpawnPoint,
  isWithinWorldBounds,
} from '../src/world.js';

test('小島固定在每軸 32 格以內', () => {
  const blocks = createIslandBlocks();

  assert.ok(blocks.length > 0);
  for (const block of blocks) {
    assert.ok(isWithinWorldBounds(block.x, block.y, block.z));
  }
  assert.equal(WORLD_LIMIT, 32);
});

test('玩家出生點位於小島地面上方且在世界範圍內', () => {
  const blocks = createIslandBlocks();
  const spawn = findSpawnPoint(blocks);
  const support = blocks.find(
    (block) => block.x === spawn.x && block.z === spawn.z && block.y < spawn.y,
  );

  assert.ok(spawn);
  assert.ok(isWithinWorldBounds(spawn.x, spawn.y, spawn.z));
  assert.ok(support, '出生點正下方應有可站立的方塊');
});

test('世界邊界拒絕超出 32 格世界的座標', () => {
  assert.equal(isWithinWorldBounds(15, 15, 15), true);
  assert.equal(isWithinWorldBounds(16, 0, 0), false);
  assert.equal(isWithinWorldBounds(-17, 0, 0), false);
});
