import test from 'node:test';
import assert from 'node:assert/strict';
import { addInventoryItem, stepPickupItem } from '../src/pickup-control.js';

test('附近的掉落物開始飛向玩家', () => {
  const item = { x: 1, y: 0, z: 0, type: 'dirt', collecting: false };
  const result = stepPickupItem(item, { x: 0, y: 0, z: 0 }, 0.1);

  assert.equal(result.collected, false);
  assert.equal(result.item.collecting, true);
  assert.ok(result.item.x < item.x);
});

test('距離玩家三格的掉落物不會開始拾取', () => {
  const item = { x: 3, y: 0, z: 0, type: 'stone', collecting: false };
  const result = stepPickupItem(item, { x: 0, y: 0, z: 0 }, 0.1);

  assert.equal(result.collected, false);
  assert.equal(result.item.collecting, false);
  assert.deepEqual(result.item, item);
});

test('掉落物飛到玩家後回報種類並增加正確欄位數量', () => {
  let item = { x: 0.5, y: 0, z: 0, type: 'stone', collecting: false };
  let result;
  for (let frame = 0; frame < 20; frame += 1) {
    result = stepPickupItem(item, { x: 0, y: 0, z: 0 }, 1 / 60);
    item = result.item;
    if (result.collected) break;
  }

  assert.equal(result.collected, true);
  assert.equal(result.item.type, 'stone');
  assert.deepEqual(addInventoryItem({ grass: 2, dirt: 1, stone: 0 }, result.item.type), {
    grass: 2,
    dirt: 1,
    stone: 1,
  });
});
