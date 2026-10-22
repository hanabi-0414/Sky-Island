import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_EYE_HEIGHT, findSpawnPoint } from '../src/world.js';

test('出生與回生視線比方塊頂面高兩格', () => {
  const spawn = findSpawnPoint();

  assert.equal(PLAYER_EYE_HEIGHT, 2);
  assert.equal(spawn.y, 0.5 + PLAYER_EYE_HEIGHT);
});
