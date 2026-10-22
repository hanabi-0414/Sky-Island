import test from 'node:test';
import assert from 'node:assert/strict';
import { getInventoryIndexFromKey, stepInventorySelection } from '../src/inventory-selection.js';

test('滑鼠滾輪可在方塊欄兩端循環切換', () => {
  assert.equal(stepInventorySelection(7, 1, 8), 0);
  assert.equal(stepInventorySelection(0, -1, 8), 7);
  assert.equal(stepInventorySelection(3, 0, 8), 3);
});

test('數字鍵依方塊欄由左至右選取，其他按鍵不改變選取', () => {
  for (let index = 0; index < 8; index += 1) {
    assert.equal(getInventoryIndexFromKey(`Digit${index + 1}`, 8), index);
  }
  assert.equal(getInventoryIndexFromKey('Numpad1', 8), 0);
  assert.equal(getInventoryIndexFromKey('KeyW', 8), null);
  assert.equal(getInventoryIndexFromKey('Digit9', 8), null);
});
