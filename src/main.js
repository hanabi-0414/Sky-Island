import * as THREE from 'three';
import { createIslandBlocks, findSpawnPoint } from './world.js';

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

  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 100);
  const spawn = findSpawnPoint();
  camera.position.set(spawn.x, spawn.y, spawn.z);

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

  const blocks = createIslandBlocks();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const transform = new THREE.Object3D();
  for (const type of ['grass', 'dirt', 'stone']) {
    const positions = blocks.filter((block) => block.type === type);
    const mesh = new THREE.InstancedMesh(geometry, materials[type], positions.length);
    positions.forEach((block, index) => {
      transform.position.set(block.x, block.y, block.z);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
  }

  const keys = new Set();
  let yaw = 0;
  let pitch = 0;
  let verticalSpeed = 0;
  let grounded = true;
  let lastTime = performance.now();
  let fpsFrames = 0;
  let fpsStart = lastTime;
  const eyeHeight = 1.7;
  const islandTop = 0.5;
  const groundEyeY = islandTop + eyeHeight;

  window.addEventListener('keydown', (event) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === 'Space' && grounded) {
      verticalSpeed = 7.1;
      grounded = false;
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => keys.clear());

  renderer.domElement.addEventListener('click', () => {
    if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock();
  });
  startButton.addEventListener('click', () => renderer.domElement.requestPointerLock());
  document.addEventListener('pointerlockchange', () => {
    startButton.hidden = document.pointerLockElement === renderer.domElement;
  });
  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    yaw -= event.movementX * 0.002;
    pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.002, -1.45, 1.45);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitch, yaw, 0);
  });

  function updatePlayer(delta) {
    const forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
    const sideways = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
    const length = Math.hypot(forward, sideways) || 1;
    const speed = 5.2 * delta / length;
    const nextX = camera.position.x + (sideways * Math.cos(yaw) - forward * Math.sin(yaw)) * speed;
    const nextZ = camera.position.z + (-sideways * Math.sin(yaw) - forward * Math.cos(yaw)) * speed;
    camera.position.x = THREE.MathUtils.clamp(nextX, -7.25, 6.25);
    camera.position.z = THREE.MathUtils.clamp(nextZ, -7.25, 6.25);

    verticalSpeed -= 19 * delta;
    camera.position.y += verticalSpeed * delta;
    if (camera.position.y <= groundEyeY) {
      camera.position.y = groundEyeY;
      verticalSpeed = 0;
      grounded = true;
    }
  }

  function animate(now) {
    requestAnimationFrame(animate);
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    updatePlayer(delta);
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
