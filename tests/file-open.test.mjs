import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('index.html 不依賴 ES 模組或 import map', () => {
  assert.doesNotMatch(html, /type=["']module["']|type=["']importmap["']/i);
});

test('index.html 不必透過相對路徑載入遊戲程式或素材', () => {
  assert.doesNotMatch(html, /(?:src|href)=["']\.\/(?:src|assets)\//i);
  assert.match(html, /data:image\/png;base64,/i);
});

test('index.html 以本機傳統 script 載入 three.js', () => {
  assert.match(html, /<script\s+src=["']\.\/vendor\/three\.min\.js["']/i);
});

test('index.html 內含建立世界會話所需的函式', () => {
  assert.match(html, /function createWorldSession\(seed/);
});

test('遊戲 script 在頁面控制項建立後才執行', () => {
  assert.ok(html.indexOf('<script src="./vendor/three.min.js">') > html.indexOf('</main>'));
});
