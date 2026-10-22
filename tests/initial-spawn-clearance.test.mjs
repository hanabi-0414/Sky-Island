import test from 'node:test';
import assert from 'node:assert/strict';
import { createIslandBlocks, PLAYER_EYE_HEIGHT } from '../src/world.js';
import { createInitialPlayerState, stepVerticalPhysics } from '../src/world-safety.js';

test('遊戲出生時攝影機高於島面兩格，角色下落後停在方塊頂面', () => {
  const blocks = createIslandBlocks();
  const player = createInitialPlayerState(blocks, undefined, 0.1);
  const topSurface = Math.max(...blocks.map((block) => block.y + 0.5));

  assert.equal(player.grounded, false);
  assert.ok(player.y >= topSurface + PLAYER_EYE_HEIGHT + 0.1);
  assert.ok(player.y - PLAYER_EYE_HEIGHT > topSurface);

  let state = player;
  for (let frame = 0; frame < 60 && !state.grounded; frame += 1) {
    const physics = stepVerticalPhysics({
      blocks,
      x: state.x,
      z: state.z,
      eyeY: state.y,
      verticalSpeed: state.verticalSpeed,
      delta: 1 / 60,
    });
    state = { ...state, y: physics.eyeY, verticalSpeed: physics.verticalSpeed, grounded: physics.grounded };
  }

  assert.equal(state.grounded, true);
  assert.equal(state.y - PLAYER_EYE_HEIGHT, topSurface);
  const bodyOverlapsBlock = blocks.some((block) => {
    const overlapsHorizontally =
      Math.abs(state.x - block.x) < 0.3 + 0.5 &&
      Math.abs(state.z - block.z) < 0.3 + 0.5;
    const overlapsVertically =
      state.y - PLAYER_EYE_HEIGHT < block.y + 0.5 - 1e-6 &&
      state.y > block.y - 0.5 + 1e-6;
    return overlapsHorizontally && overlapsVertically;
  });
  assert.equal(bodyOverlapsBlock, false);
});
