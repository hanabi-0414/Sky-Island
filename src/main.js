import * as THREE from 'three';
import { createIslandBlocks, findSpawnPoint, PLAYER_EYE_HEIGHT } from './world.js';
import { beginGame } from './start-control.js';
import { getMovementInput, shouldStartJump } from './player-input.js';
import { createMiningController } from './mining-control.js';
import { createDroppedItem, DROP_ITEM_SIZE, stepDroppedItem } from './drop-item.js';
import { addInventoryItem, stepPickupItem } from './pickup-control.js';
import {
  resolvePlayerMovement,
  createInitialPlayerState,
  findSafeSpawnPoint,
  restoreWorldIfEmpty,
  respawnIfInVoid,
  stepVerticalPhysics,
} from './world-safety.js';

const game = document.querySelector('#game');
const startButton = document.querySelector('#start');
const errorBox = document.querySelector('#error');
const fpsLabel = document.querySelector('#fps');

try {
  startGame();
} catch (error) {
  errorBox.hidden = false;
  errorBox.textContent = `遊戲載入失敗：${error.message}`;
  throw error;
}

function startGame() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe0f4');

  const blocks = createIslandBlocks();
  const spawn = findSafeSpawnPoint(blocks, findSpawnPoint());
  const initialPlayer = createInitialPlayerState(blocks, spawn, 0.1);

  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(initialPlayer.x, initialPlayer.y, initialPlayer.z);

  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  game.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xe8f6ff, 0x68604e, 2.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-8, 18, 10);
  scene.add(sun);

  const loader = new THREE.TextureLoader();
  const texture = (name) => {
    const map = loader.load(`./assets/sky-island-assets/textures/16px/${name}.png`);
    map.colorSpace = THREE.SRGBColorSpace;
    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    return map;
  };
  const grassTop = texture('grass_top');
  const grassSide = texture('grass_side');
  const dirt = texture('dirt');
  const stone = texture('stone');
  const grassMaterials = [
    new THREE.MeshLambertMaterial({ map: grassSide }),
    new THREE.MeshLambertMaterial({ map: grassSide }),
    new THREE.MeshLambertMaterial({ map: grassTop }),
    new THREE.MeshLambertMaterial({ map: dirt }),
    new THREE.MeshLambertMaterial({ map: grassSide }),
    new THREE.MeshLambertMaterial({ map: grassSide }),
  ];
  const materials = {
    grass: grassMaterials,
    dirt: new THREE.MeshLambertMaterial({ map: dirt }),
    stone: new THREE.MeshLambertMaterial({ map: stone }),
  };

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const transform = new THREE.Object3D();
  const blockMeshes = [];
  for (const type of ['grass', 'dirt', 'stone']) {
    const positions = blocks.filter((block) => block.type === type);
    const mesh = new THREE.InstancedMesh(geometry, materials[type], positions.length);
    positions.forEach((block, index) => {
      transform.position.set(block.x, block.y, block.z);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.blockPositions = positions;
    mesh.userData.blockPositionsType = type;
    blockMeshes.push(mesh);
    scene.add(mesh);
  }

  const dropGeometry = new THREE.BoxGeometry(DROP_ITEM_SIZE, DROP_ITEM_SIZE, DROP_ITEM_SIZE);
  const droppedItems = [];
  const inventoryLabels = {
    grass: document.querySelector('#count-grass'),
    dirt: document.querySelector('#count-dirt'),
    stone: document.querySelector('#count-stone'),
  };
  let inventory = { grass: 0, dirt: 0, stone: 0 };

  const crackMaterials = Array.from({ length: 10 }, (_, stage) => {
    const map = texture(`destroy_stage_${stage}`);
    return new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  });
  const crackOverlay = new THREE.Mesh(new THREE.BoxGeometry(1.006, 1.006, 1.006), crackMaterials);
  crackOverlay.visible = false;
  scene.add(crackOverlay);
  const raycaster = new THREE.Raycaster();
  const screenCenter = new THREE.Vector2(0, 0);
  const mining = createMiningController();

  const keys = new Set();
  let yaw = 0;
  let pitch = 0;
  let verticalSpeed = initialPlayer.verticalSpeed;
  let grounded = initialPlayer.grounded;
  let gameStarted = false;
  let miningHeld = false;
  let lastTime = performance.now();
  let fpsFrames = 0;
  let fpsStart = lastTime;
  const eyeHeight = PLAYER_EYE_HEIGHT;

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    keys.clear();
    miningHeld = false;
  });
  renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button === 0) miningHeld = true;
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 0) miningHeld = false;
  });

  const enterGame = () => beginGame(
    () => {
      gameStarted = true;
      startButton.hidden = true;
    },
    () => {
      if (document.pointerLockElement !== renderer.domElement) {
        return renderer.domElement.requestPointerLock?.();
      }
      return undefined;
    },
  );
  renderer.domElement.addEventListener('click', enterGame);
  startButton.addEventListener('click', enterGame);
  document.addEventListener('mousemove', (event) => {
    const isPointerLocked = document.pointerLockElement === renderer.domElement;
    if (!gameStarted || (!isPointerLocked && event.target !== renderer.domElement)) return;
    yaw -= event.movementX * 0.002;
    pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.002, -1.45, 1.45);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
  });

  function updatePlayer(delta) {
    if (shouldStartJump(keys, grounded)) {
      verticalSpeed = 7.1;
      grounded = false;
    }
    const { forward, sideways } = getMovementInput(keys);
    const length = Math.hypot(forward, sideways) || 1;
    const speed = 5.2 * delta / length;
    const nextX = camera.position.x + (sideways * Math.cos(yaw) - forward * Math.sin(yaw)) * speed;
    const nextZ = camera.position.z + (-sideways * Math.sin(yaw) - forward * Math.cos(yaw)) * speed;
    const blocks = blockMeshes.flatMap((mesh) => mesh.userData.blockPositions);
    const movement = resolvePlayerMovement({
      blocks,
      x: camera.position.x,
      z: camera.position.z,
      nextX: THREE.MathUtils.clamp(nextX, -15.5, 15.5),
      nextZ: THREE.MathUtils.clamp(nextZ, -15.5, 15.5),
      eyeY: camera.position.y,
      eyeHeight,
    });
    camera.position.x = movement.x;
    camera.position.z = movement.z;

    const physics = stepVerticalPhysics({
      blocks,
      x: camera.position.x,
      z: camera.position.z,
      eyeY: camera.position.y,
      verticalSpeed,
      delta,
      eyeHeight,
    });
    camera.position.y = physics.eyeY;
    verticalSpeed = physics.verticalSpeed;
    grounded = physics.grounded;

    const respawn = respawnIfInVoid({
      eyeY: camera.position.y,
      verticalSpeed,
      spawn,
    });
    if (respawn.respawned) {
      const safeSpawn = findSafeSpawnPoint(blocks, spawn);
      camera.position.set(safeSpawn.x, safeSpawn.y, safeSpawn.z);
      verticalSpeed = respawn.verticalSpeed;
      grounded = true;
    }
  }

  function updateDroppedItems(delta) {
    const blocks = blockMeshes.flatMap((mesh) => mesh.userData.blockPositions);
    const player = {
      x: camera.position.x,
      y: camera.position.y - eyeHeight * 0.55,
      z: camera.position.z,
    };
    for (let index = droppedItems.length - 1; index >= 0; index -= 1) {
      const item = droppedItems[index];
      const fallingState = item.state.collecting
        ? item.state
        : stepDroppedItem(item.state, blocks, delta);
      const pickup = stepPickupItem(fallingState, player, delta);
      item.state = pickup.item;

      if (pickup.collected) {
        inventory = addInventoryItem(inventory, item.state.type);
        inventoryLabels[item.state.type].textContent = String(inventory[item.state.type]);
        scene.remove(item.mesh);
        droppedItems.splice(index, 1);
        continue;
      }

      item.mesh.position.set(item.state.x, item.state.y, item.state.z);
      item.mesh.rotation.set(item.state.rotation * 0.7, item.state.rotation, 0);
    }
  }

  function updateMining(delta) {
    raycaster.setFromCamera(screenCenter, camera);
    const hit = miningHeld && gameStarted
      ? raycaster.intersectObjects(blockMeshes, false)[0]
      : null;
    const mesh = hit?.object ?? null;
    const instanceId = hit?.instanceId;
    const block = mesh && Number.isInteger(instanceId)
      ? mesh.userData.blockPositions[instanceId]
      : null;
    const result = mining.update({
      target: block ? `${block.x},${block.y},${block.z}` : null,
      held: miningHeld && gameStarted,
      delta,
      type: block?.type,
    });

    if (!block || result.stage == null) {
      crackOverlay.visible = false;
      return;
    }

    crackOverlay.position.set(block.x, block.y, block.z);
    crackOverlay.material = crackMaterials[result.stage];
    crackOverlay.visible = true;
    if (result.mined) {
      const positions = mesh.userData.blockPositions;
      const lastIndex = positions.length - 1;
      if (instanceId !== lastIndex) {
        const lastBlock = positions[lastIndex];
        transform.position.set(lastBlock.x, lastBlock.y, lastBlock.z);
        transform.updateMatrix();
        mesh.setMatrixAt(instanceId, transform.matrix);
        positions[instanceId] = lastBlock;
      }
      positions.pop();
      mesh.count = positions.length;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      crackOverlay.visible = false;
      mining.update({ target: null, held: false, delta: 0, type: block.type });
      const droppedState = createDroppedItem(block);
      const droppedMesh = new THREE.Mesh(dropGeometry, materials[block.type]);
      droppedMesh.position.set(droppedState.x, droppedState.y, droppedState.z);
      scene.add(droppedMesh);
      droppedItems.push({ state: droppedState, mesh: droppedMesh });
      if (blockMeshes.every((blockMesh) => blockMesh.userData.blockPositions.length === 0)) {
        const restored = restoreWorldIfEmpty([]);
        for (const blockMesh of blockMeshes) {
          const positions = restored.filter((restoredBlock) => restoredBlock.type === blockMesh.userData.blockPositionsType);
          blockMesh.userData.blockPositions.splice(0, blockMesh.userData.blockPositions.length, ...positions);
          positions.forEach((restoredBlock, index) => {
            transform.position.set(restoredBlock.x, restoredBlock.y, restoredBlock.z);
            transform.updateMatrix();
            blockMesh.setMatrixAt(index, transform.matrix);
          });
          blockMesh.count = positions.length;
          blockMesh.instanceMatrix.needsUpdate = true;
          blockMesh.computeBoundingSphere();
        }
        camera.position.set(spawn.x, spawn.y, spawn.z);
        verticalSpeed = 0;
        grounded = true;
      }
    }
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    updatePlayer(delta);
    updateDroppedItems(delta);
    updateMining(delta);
    renderer.render(scene, camera);
    fpsFrames += 1;
    if (now - fpsStart >= 1000) {
      fpsLabel.textContent = `${Math.round(fpsFrames * 1000 / (now - fpsStart))} FPS`;
      fpsFrames = 0;
      fpsStart = now;
    }
  }
  requestAnimationFrame(animate);

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}
