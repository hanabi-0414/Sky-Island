import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlayerMovement } from '../src/world-safety.js';

const wall = { x: 1, y: 1, z: 0, type: 'stone' };

test('玩家移動時不會穿過高於腳底的方塊牆面', () => {
  const result = resolvePlayerMovement({
    blocks: [wall],
    x: 0,
    z: 0,
    nextX: 0.5,
    nextZ: 0,
    eyeY: 2.5,
    eyeHeight: 2,
  });

  assert.equal(result.x, 0);
  assert.equal(result.z, 0);
});

test('撞到牆面時仍可沿牆滑動', () => {
  const result = resolvePlayerMovement({
    blocks: [wall],
    x: 0,
    z: -0.4,
    nextX: 0.5,
    nextZ: -0.2,
    eyeY: 2.5,
    eyeHeight: 2,
  });

  assert.equal(result.x, 0);
  assert.equal(result.z, -0.2);
});

test('玩家可在地面方塊頂面正常行走', () => {
  const result = resolvePlayerMovement({
    blocks: [{ x: 0, y: 0, z: 0, type: 'grass' }],
    x: 0,
    z: 0,
    nextX: 0.4,
    nextZ: 0,
    eyeY: 2.5,
    eyeHeight: 2,
  });

  assert.equal(result.x, 0.4);
});
