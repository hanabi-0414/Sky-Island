import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createWorldSession } from '../src/world-session.js';
import { findNaturalSpawnPoint } from '../src/world-safety.js';
import { isWorldRegenerationKey } from '../src/player-input.js';

const standalone = await readFile(new URL('../index.html', import.meta.url), 'utf8');

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

test('出生點正下方與玩家上方有樹木或建物時，改選沒有這些方塊的位置', () => {
  const blocks = [
    { x: 0, y: 0, z: 0, type: 'grass' },
    { x: 0, y: -1, z: 0, type: 'log' },
    { x: 0, y: 3, z: 0, type: 'planks' },
    { x: 3, y: 0, z: 0, type: 'grass' },
  ];

  assert.deepEqual(
    findNaturalSpawnPoint(blocks, { x: 0, y: 2.5, z: 0 }),
    { x: 3, y: 2.5, z: 0 },
  );
});

test('只有 R 鍵會要求重新生成世界', () => {
  assert.equal(isWorldRegenerationKey('KeyR'), true);
  assert.equal(isWorldRegenerationKey('KeyW'), false);
  assert.equal(isWorldRegenerationKey('Space'), false);
});

test('獨立 index.html 按 R 會以新種子重建地形並重新選擇安全出生點', () => {
  assert.match(standalone, /if \(isWorldRegenerationKey\(event\.code\)\) \{\s*event\.preventDefault\(\);\s*regenerateWorld\(\);/);
  assert.match(standalone, /function regenerateWorld\(\) \{[\s\S]*?worldSession = createWorldSession\(nextSeed\);[\s\S]*?worldSeed = worldSession\.seed;[\s\S]*?spawn = worldSession\.spawn;/);
});
