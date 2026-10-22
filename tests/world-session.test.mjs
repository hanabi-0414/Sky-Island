import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldSession } from '../src/world-session.js';
import { isWorldRegenerationKey } from '../src/player-input.js';

const featureTypes = new Set(['log', 'leaves', 'brick', 'planks']);

function assertClearSpawn(session) {
  const { blocks, spawn } = session;
  const support = blocks.find((block) =>
    block.x === spawn.x && block.z === spawn.z && block.y + 0.5 === spawn.y - 2,
  );
  assert.ok(support, '出生點下方必須有方塊支撐');
  assert.ok(!featureTypes.has(support.type), '支撐出生點的方塊不能是樹木或建物');
  assert.equal(blocks.some((block) => featureTypes.has(block.type) &&
    Math.abs(block.x - spawn.x) < 0.8 &&
    Math.abs(block.z - spawn.z) < 0.8 &&
    block.y + 0.5 > spawn.y - 2 &&
    block.y - 0.5 < spawn.y), false, '玩家身體範圍內不能有樹木或建物方塊');
}

test('初始世界的出生點落在自然地表，避開樹木、樹葉、房子、磚塊和木頭', () => {
  const session = createWorldSession(1234);
  assertClearSpawn(session);
  assert.ok(session.player.y >= session.highestTerrainY + 2 + 0.1);
});

test('重新生成世界使用新種子，且重新套用安全出生點規則', () => {
  const first = createWorldSession(1234);
  const regenerated = createWorldSession(5678);
  assert.notDeepEqual(regenerated.blocks, first.blocks);
  assertClearSpawn(regenerated);
  assert.ok(regenerated.player.y >= regenerated.highestTerrainY + 2 + 0.1);
});

test('只有 R 鍵會要求重新生成世界', () => {
  assert.equal(isWorldRegenerationKey('KeyR'), true);
  assert.equal(isWorldRegenerationKey('KeyW'), false);
  assert.equal(isWorldRegenerationKey('Space'), false);
});
