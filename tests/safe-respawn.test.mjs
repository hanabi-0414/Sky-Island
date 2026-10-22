import test from 'node:test';
import assert from 'node:assert/strict';
import { createIslandBlocks, findSpawnPoint, PLAYER_EYE_HEIGHT } from '../src/world.js';
import { findSafeSpawnPoint, stepVerticalPhysics } from '../src/world-safety.js';

test('原出生點下方被挖空時，選最近仍有支撐的下方位置回生', () => {
  const preferred = findSpawnPoint();
  const blocks = createIslandBlocks().filter(
    (block) => !(block.x === 0 && block.y === 0 && block.z === 0),
  );
  const spawn = findSafeSpawnPoint(blocks, preferred);

  assert.deepEqual(spawn, { x: 0, y: 1.5, z: 0 });
  const physics = stepVerticalPhysics({
    blocks,
    x: spawn.x,
    z: spawn.z,
    eyeY: spawn.y,
    verticalSpeed: 0,
    delta: 1 / 60,
    eyeHeight: PLAYER_EYE_HEIGHT,
  });
  assert.equal(physics.grounded, true);
  assert.equal(physics.eyeY, spawn.y);
});

test('固定出生點仍有方塊支撐時，優先保留固定出生點', () => {
  const preferred = findSpawnPoint();
  assert.deepEqual(findSafeSpawnPoint(createIslandBlocks(), preferred), preferred);
});
