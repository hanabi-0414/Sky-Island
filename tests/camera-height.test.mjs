import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_EYE_HEIGHT, findSpawnPoint } from '../src/world.js';

test('角色視線高度略低於兩格，出生視線仍由方塊頂面與眼高計算', () => {
  const spawn = findSpawnPoint();

  assert.equal(PLAYER_EYE_HEIGHT, 1.85);
  assert.equal(spawn.y, 0.5 + PLAYER_EYE_HEIGHT);
});
