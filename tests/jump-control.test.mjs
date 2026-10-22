import test from 'node:test';
import assert from 'node:assert/strict';
import { getMovementInput, shouldStartJump } from '../src/player-input.js';

test('空白鍵持續按住且同時按方向鍵時，落地後仍會再起跳', () => {
  const heldKeys = new Set(['Space', 'ArrowRight']);

  assert.equal(shouldStartJump(heldKeys, true), true);
});

test('空白鍵放開或玩家尚未落地時不會重新起跳', () => {
  assert.equal(shouldStartJump(new Set(['ArrowRight']), true), false);
  assert.equal(shouldStartJump(new Set(['Space']), false), false);
});

test('方向鍵和 WASD 都能提供移動方向', () => {
  assert.deepEqual(getMovementInput(new Set(['ArrowUp', 'ArrowRight'])), { forward: 1, sideways: 1 });
  assert.deepEqual(getMovementInput(new Set(['KeyS', 'KeyA'])), { forward: -1, sideways: -1 });
});
