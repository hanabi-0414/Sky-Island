import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BLOCK_TYPES } from '../src/world.js';

const template = await readFile(new URL('../index.template.html', import.meta.url), 'utf8');
const stylesheet = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('畫面有涵蓋所有方塊種類的物品欄，物品數量與圖示起始為空', () => {
  assert.match(template, /id="inventory"/);
  assert.equal((template.match(/class="inventory-slot"/g) ?? []).length, BLOCK_TYPES.length);
  for (const type of BLOCK_TYPES) {
    assert.match(template, new RegExp(`id="count-${type}"`));
    assert.match(template, new RegExp(`id="icon-${type}"[^>]*hidden`));
    assert.match(template, new RegExp(`id="count-${type}"[^>]*hidden`));
  }
});

test('物品欄具有清楚可見的選取狀態樣式', () => {
  assert.match(stylesheet, /\.inventory-slot\.selected/);
});
