import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8');

let html = await read('index.template.html');
const styles = await read('styles.css');
const world = (await read('src/world.js')).replace(/^export\s+/gm, '');
const worldSafety = (await read('src/world-safety.js'))
  .replace(/^import\s+.*;\r?\n/gm, '')
  .replace(/^export\s+/gm, '');
const worldSession = (await read('src/world-session.js'))
  .replace(/^import\s+.*;\r?\n/gm, '')
  .replace(/^export\s+/gm, '');
const startControl = (await read('src/start-control.js')).replace(/^export\s+/gm, '');
const playerInput = (await read('src/player-input.js')).replace(/^export\s+/gm, '');
let main = (await read('src/main.js')).replace(/^import\s+[\s\S]*?;\r?\n/gm, '');

const textureNames = [
  'grass_top', 'grass_side', 'dirt', 'stone', 'sand', 'brick', 'planks', 'log_top', 'log_side', 'leaves',
  ...Array.from({ length: 10 }, (_, stage) => `destroy_stage_${stage}`),
];
const inlineTextures = {};
for (const name of textureNames) {
  const bytes = await readFile(path.join(projectRoot, `assets/sky-island-assets/textures/16px/${name}.png`));
  inlineTextures[name] = `data:image/png;base64,${bytes.toString('base64')}`;
}
const iconNames = ['grass', 'dirt', 'stone', 'sand', 'brick', 'planks', 'log', 'leaves'];
for (const name of iconNames) {
  const bytes = await readFile(path.join(projectRoot, `assets/sky-island-assets/icons/${name}.png`));
  html = html.replaceAll(
    `./assets/sky-island-assets/icons/${name}.png`,
    `data:image/png;base64,${bytes.toString('base64')}`,
  );
}

main = main.replace(
  "loader.load(`./assets/sky-island-assets/textures/16px/${name}.png`)",
  'loader.load(INLINE_TEXTURES[name])',
);
if (main.includes('./assets/') || main.includes('import ')) {
  throw new Error('遊戲程式仍有無法直接開檔使用的外部相依。');
}

const miningControl = (await read('src/mining-control.js')).replace(/^export\s+/gm, '');
const dropItem = (await read('src/drop-item.js')).replace(/^export\s+/gm, '');
const pickupControl = (await read('src/pickup-control.js')).replace(/^export\s+/gm, '');
const standaloneScript = `const INLINE_TEXTURES = ${JSON.stringify(inlineTextures)};\n${world}\n${worldSafety}\n${worldSession}\n${startControl}\n${playerInput}\n${miningControl}\n${dropItem}\n${pickupControl}\n${main}`;
const withoutModuleMap = html.replace(/\s*<script type="importmap">[\s\S]*?<\/script>/, '');
const withInlineStyles = withoutModuleMap.replace(
  '<link rel="stylesheet" href="./styles.css" />',
  `<style>\n${styles}\n</style>`,
);
const withoutModuleEntry = withInlineStyles.replace(
  '<script type="module" src="./src/main.js"></script>',
  '',
);
const standaloneHtml = withoutModuleEntry.replace(
  '</body>',
  '<script src="./vendor/three.min.js"></script>\n    <script>\n' + standaloneScript + '\n    </script>\n  </body>',
);

if (/type="module"|type="importmap"|\.\/src\/|\.\/assets\//.test(standaloneHtml)) {
  throw new Error('建立單頁 index.html 失敗，仍殘留模組或相對路徑。');
}

const cleanHtml = standaloneHtml.replace(/^[\t ]+$/gm, '');
await writeFile(path.join(projectRoot, 'index.html'), cleanHtml, 'utf8');
process.stdout.write('已生成可直接開啟的 index.html\n');
