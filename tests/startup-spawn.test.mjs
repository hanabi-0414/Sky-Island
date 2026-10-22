import test from 'node:test';
import assert from 'node:assert/strict';
import { createIslandBlocks, findSpawnPoint, PLAYER_EYE_HEIGHT } from '../src/world.js';
import { createInitialPlayerState } from '../src/world-safety.js';

test('初始出生會依方塊實際位置站穩，且角色身體不埋入方塊', () => {
  const blocks = createIslandBlocks();
  const preferredSpawn = findSpawnPoint();
  const player = createInitialPlayerState(blocks, preferredSpawn);
  const feetY = player.y - PLAYER_EYE_HEIGHT;

  assert.equal(player.grounded, true);
  assert.equal(player.verticalSpeed, 0);
  assert.equal(feetY, 0.5);

  const bodyOverlapsBlock = blocks.some((block) => {
    const overlapsHorizontally =
      Math.abs(player.x - block.x) < 0.3 + 0.5 &&
      Math.abs(player.z - block.z) < 0.3 + 0.5;
    const overlapsVertically =
      feetY < block.y + 0.5 - 1e-6 &&
      player.y > block.y - 0.5 + 1e-6;
    return overlapsHorizontally && overlapsVertically;
  });

  assert.equal(bodyOverlapsBlock, false);
  assert.deepEqual(
    { x: player.x, y: player.y, z: player.z },
    preferredSpawn,
  );
});
