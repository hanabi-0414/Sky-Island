import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiningController, getMiningDuration } from '../src/mining-control.js';

test('泥土不到一秒挖除，石頭約需兩秒', () => {
  assert.ok(getMiningDuration('dirt') < 1);
  assert.ok(getMiningDuration('grass') < 1);
  assert.equal(getMiningDuration('stone'), 2);
});

test('短點左鍵只顯示裂痕，不會挖掉方塊', () => {
  const mining = createMiningController();
  const result = mining.update({ target: 'block-a', held: true, delta: 0.1, type: 'dirt' });

  assert.equal(result.mined, false);
  assert.ok(result.stage >= 0);
});

test('放開左鍵後裂痕與挖掘進度重置', () => {
  const mining = createMiningController();
  mining.update({ target: 'block-a', held: true, delta: 0.4, type: 'dirt' });
  const result = mining.update({ target: 'block-a', held: false, delta: 0.1, type: 'dirt' });

  assert.equal(result.stage, null);
  assert.equal(result.progress, 0);
  assert.equal(result.mined, false);
});

test('切換目標方塊會從頭計算，持續挖掘則依材質時間完成', () => {
  const mining = createMiningController();
  mining.update({ target: 'block-a', held: true, delta: 0.7, type: 'dirt' });
  const switched = mining.update({ target: 'block-b', held: true, delta: 0.1, type: 'stone' });
  const finished = mining.update({ target: 'block-b', held: true, delta: 1.9, type: 'stone' });

  assert.equal(switched.mined, false);
  assert.equal(finished.mined, true);
  assert.equal(finished.stage, 9);
});
