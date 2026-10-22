import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDayNightController } from '../src/day-night.js';

const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const standalone = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('N 鍵將白天切到較暗但仍有照明的夜晚，再切回完全相同的白天設定', () => {
  const controller = createDayNightController();
  const day = controller.settings;

  assert.equal(controller.isNight, false);
  assert.equal(controller.toggle(), true);
  const night = controller.settings;
  assert.notEqual(night.background, day.background);
  assert.ok(night.hemisphereIntensity > 0);
  assert.ok(night.sunIntensity > 0);
  assert.ok(night.hemisphereIntensity < day.hemisphereIntensity);
  assert.ok(night.sunIntensity < day.sunIntensity);

  assert.equal(controller.toggle(), false);
  assert.deepEqual(controller.settings, day);
});

test('N 鍵分支只切換場景光線，並在加入移動按鍵前結束處理', () => {
  for (const [name, source] of [['模組遊戲', mainSource], ['獨立 index.html', standalone]]) {
    const branch = source.match(/if \(isDayNightToggleKey\(event\.code\)\) \{[\s\S]*?\n\s*\}/)?.[0];
    assert.ok(branch, `${name} 應處理 N 鍵`);
    assert.match(branch, /toggleDayNight\(\)/);
    assert.match(branch, /return;/);
    assert.ok(source.indexOf(branch) < source.indexOf('keys.add(event.code)'), `${name} 的 N 鍵不得進入移動鍵狀態`);
  }
});
