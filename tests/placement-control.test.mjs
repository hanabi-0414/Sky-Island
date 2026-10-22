import test from 'node:test';
import assert from 'node:assert/strict';
import { addInventoryItem } from '../src/pickup-control.js';
import { tryPlaceBlock } from '../src/placement-control.js';

const source = { x: 0, y: 0, z: 0, type: 'stone' };
const sideNormal = { x: 1, y: 0, z: 0 };

test('有庫存時把方塊放在目標方塊相鄰空格並扣除一個', () => {
  const inventory = { stone: 2 };
  const result = tryPlaceBlock({
    blocks: [source],
    source,
    normal: sideNormal,
    type: 'stone',
    inventory,
  });

  assert.equal(result.placed, true);
  assert.deepEqual(result.blocks, [source, { x: 1, y: 0, z: 0, type: 'stone' }]);
  assert.deepEqual(result.inventory, { stone: 1 });
  assert.deepEqual(inventory, { stone: 2 });
});

test('庫存為零時不能放置方塊', () => {
  const result = tryPlaceBlock({
    blocks: [source], source, normal: sideNormal, type: 'stone', inventory: { stone: 0 },
  });

  assert.equal(result.placed, false);
  assert.deepEqual(result.blocks, [source]);
  assert.deepEqual(result.inventory, { stone: 0 });
});

test('相鄰空格已被其他方塊佔用時不覆蓋也不扣庫存', () => {
  const occupied = { x: 1, y: 0, z: 0, type: 'dirt' };
  const inventory = { stone: 1 };
  const result = tryPlaceBlock({
    blocks: [source, occupied], source, normal: sideNormal, type: 'stone', inventory,
  });

  assert.equal(result.placed, false);
  assert.deepEqual(result.blocks, [source, occupied]);
  assert.deepEqual(result.inventory, inventory);
});

test('挖掉、撿起再放回同一種類後庫存數量回復', () => {
  const inventory = addInventoryItem({ stone: 0 }, source.type);
  const result = tryPlaceBlock({
    blocks: [source], source, normal: sideNormal, type: source.type, inventory,
  });

  assert.equal(result.placed, true);
  assert.equal(result.inventory.stone, 0);
  assert.equal(result.blocks.length, 2);
});
