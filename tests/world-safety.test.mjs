import test from 'node:test';
import assert from 'node:assert/strict';
import {
  restoreWorldIfEmpty,
  respawnIfInVoid,
  stepVerticalPhysics,
} from '../src/world-safety.js';
import { createIslandBlocks, findSpawnPoint } from '../src/world.js';

test('玩家只有在腳下有方塊時才能站立，離開支撐後會下墜', () => {
  const blocks = [{ x: 0, y: 0, z: 0, type: 'grass' }];
  const supported = stepVerticalPhysics({ blocks, x: 0, z: 0, eyeY: 2.5, verticalSpeed: 0, delta: 1 / 60, eyeHeight: 2 });
  const unsupported = stepVerticalPhysics({ blocks, x: 2, z: 0, eyeY: 2.5, verticalSpeed: 0, delta: 1 / 60, eyeHeight: 2 });

  assert.equal(supported.grounded, true);
  assert.equal(supported.eyeY, 2.5);
  assert.equal(unsupported.grounded, false);
  assert.ok(unsupported.eyeY < 2.5);
});

test('下落中的玩家碰到方塊頂面會停在方塊上', () => {
  const result = stepVerticalPhysics({
    blocks: [{ x: 0, y: -1, z: 0, type: 'dirt' }],
    x: 0,
    z: 0,
    eyeY: 2,
    verticalSpeed: -8,
    delta: 0.1,
    eyeHeight: 2,
  });

  assert.equal(result.grounded, true);
  assert.equal(result.eyeY, 1.5);
  assert.equal(result.verticalSpeed, 0);
});

test('掉出世界下方時會回到出生點並停止下墜', () => {
  const spawn = findSpawnPoint();
  const result = respawnIfInVoid({ eyeY: -13, verticalSpeed: -20, spawn });

  assert.deepEqual(result, { eyeY: spawn.y, verticalSpeed: 0, respawned: true });
  assert.equal(respawnIfInVoid({ eyeY: 0, verticalSpeed: 0, spawn }).respawned, false);
});

test('小島方塊全部挖完時會重建固定小島，否則保留現有方塊', () => {
  const restored = restoreWorldIfEmpty([]);
  const existing = [{ x: 1, y: 0, z: 0, type: 'grass' }];

  assert.equal(restored.length, createIslandBlocks().length);
  assert.deepEqual(restored, createIslandBlocks());
  assert.equal(restoreWorldIfEmpty(existing), existing);
});
