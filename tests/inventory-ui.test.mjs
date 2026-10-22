import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const template = await readFile(new URL('../index.template.html', import.meta.url), 'utf8');

test('畫面有草地、泥土、石頭三個可更新數量的方塊欄位', () => {
  assert.match(template, /id="inventory"/);
  for (const type of ['grass', 'dirt', 'stone']) {
    assert.match(template, new RegExp(`id="count-${type}"`));
  }
});
