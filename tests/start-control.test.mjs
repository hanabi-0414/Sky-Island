import test from 'node:test';
import assert from 'node:assert/strict';
import { beginGame } from '../src/start-control.js';

test('開始遊戲不會卡在指標鎖定被同步拒絕時', () => {
  let started = false;

  beginGame(() => { started = true; }, () => { throw new Error('pointer lock unavailable'); });

  assert.equal(started, true);
});

test('開始遊戲不會卡在指標鎖定 Promise 被拒絕時', async () => {
  let started = false;

  beginGame(() => { started = true; }, () => Promise.reject(new Error('pointer lock denied')));
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(started, true);
});
