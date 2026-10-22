import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA_VIEW_OFFSET, PLAYER_EYE_HEIGHT, findSpawnPoint } from '../src/world.js';

test('攝影機視角略低於角色碰撞高度，出生高度仍按完整角色高度計算', () => {
  const spawn = findSpawnPoint();

  assert.equal(PLAYER_EYE_HEIGHT, 2);
  assert.equal(CAMERA_VIEW_OFFSET, 0.15);
  assert.equal(PLAYER_EYE_HEIGHT - CAMERA_VIEW_OFFSET, 1.85);
  assert.equal(spawn.y, 0.5 + PLAYER_EYE_HEIGHT);
});
