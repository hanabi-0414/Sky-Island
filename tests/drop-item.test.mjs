import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDroppedItem,
  stepDroppedItem,
  DROP_ITEM_HALF_SIZE,
} from '../src/drop-item.js';

test('挖掉方塊後在原處生成同種類的小方塊', () => {
  const item = createDroppedItem({ x: 2, y: 1, z: -3, type: 'stone' });

  assert.equal(item.type, 'stone');
  assert.equal(item.x, 2);
  assert.equal(item.z, -3);
  assert.equal(item.y, 1.5 + DROP_ITEM_HALF_SIZE);
  assert.equal(item.rotation, 0);
  assert.equal(item.grounded, false);
});

test('小方塊在空中受重力下落並持續旋轉', () => {
  const item = createDroppedItem({ x: 0, y: 2, z: 0, type: 'dirt' });
  const next = stepDroppedItem(item, [], 0.1);

  assert.ok(next.y < item.y);
  assert.ok(next.verticalSpeed < 0);
  assert.ok(next.rotation > item.rotation);
  assert.equal(next.grounded, false);
});

test('小方塊落到方塊表面後停止，不會穿過地面', () => {
  const item = createDroppedItem({ x: 0, y: 0, z: 0, type: 'grass' });
  const ground = [{ x: 0, y: -1, z: 0, type: 'dirt' }];
  const landed = stepDroppedItem(item, ground, 0.5);

  assert.equal(landed.grounded, true);
  assert.equal(landed.verticalSpeed, 0);
  assert.equal(landed.y, -0.5 + DROP_ITEM_HALF_SIZE);
});

test('腳下沒有方塊時小方塊繼續下墜', () => {
  const item = createDroppedItem({ x: 0, y: 0, z: 0, type: 'grass' });
  const next = stepDroppedItem(item, [], 0.5);

  assert.equal(next.grounded, false);
  assert.ok(next.y < item.y);
});
