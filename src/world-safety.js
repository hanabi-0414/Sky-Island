import { createIslandBlocks, findSpawnPoint, PLAYER_EYE_HEIGHT } from './world.js';

export function stepVerticalPhysics({
  blocks,
  x,
  z,
  eyeY,
  verticalSpeed,
  delta,
  eyeHeight = PLAYER_EYE_HEIGHT,
  gravity = 19,
  radius = 0.3,
}) {
  const currentFeetY = eyeY - eyeHeight;
  const nextVerticalSpeed = verticalSpeed - gravity * delta;
  const nextEyeY = eyeY + nextVerticalSpeed * delta;
  const nextFeetY = nextEyeY - eyeHeight;

  if (nextVerticalSpeed <= 0) {
    const landingTop = blocks.reduce((highest, block) => {
      const top = block.y + 0.5;
      const overlapsX = x + radius > block.x - 0.5 && x - radius < block.x + 0.5;
      const overlapsZ = z + radius > block.z - 0.5 && z - radius < block.z + 0.5;
      const crossesTop = top <= currentFeetY + 1e-6 && top >= nextFeetY - 1e-6;
      return overlapsX && overlapsZ && crossesTop ? Math.max(highest, top) : highest;
    }, -Infinity);

    if (Number.isFinite(landingTop)) {
      return { eyeY: landingTop + eyeHeight, verticalSpeed: 0, grounded: true };
    }
  }

  return { eyeY: nextEyeY, verticalSpeed: nextVerticalSpeed, grounded: false };
}

export function resolvePlayerMovement({
  blocks,
  x,
  z,
  nextX,
  nextZ,
  eyeY,
  eyeHeight = PLAYER_EYE_HEIGHT,
  radius = 0.3,
}) {
  const feetY = eyeY - eyeHeight;
  const collides = (candidateX, candidateZ) => blocks.some((block) => {
    const blockBottom = block.y - 0.5;
    const blockTop = block.y + 0.5;
    const overlapsVertically = feetY < blockTop - 1e-6 && eyeY > blockBottom + 1e-6;
    const overlapsHorizontally =
      Math.abs(candidateX - block.x) < radius + 0.5 &&
      Math.abs(candidateZ - block.z) < radius + 0.5;
    return overlapsVertically && overlapsHorizontally;
  });

  const resolvedX = collides(nextX, z) ? x : nextX;
  const resolvedZ = collides(resolvedX, nextZ) ? z : nextZ;
  return { x: resolvedX, z: resolvedZ };
}

export function findSafeSpawnPoint(blocks, preferred = findSpawnPoint(), radius = 0.3) {
  const candidates = blocks.filter((support) => {
    const feetY = support.y + 0.5;
    const eyeY = feetY + PLAYER_EYE_HEIGHT;
    return !blocks.some((block) => {
      const overlapsHorizontally =
        Math.abs(support.x - block.x) < radius + 0.5 &&
        Math.abs(support.z - block.z) < radius + 0.5;
      const overlapsVertically =
        feetY < block.y + 0.5 - 1e-6 &&
        eyeY > block.y - 0.5 + 1e-6;
      return overlapsHorizontally && overlapsVertically;
    });
  });

  candidates.sort((a, b) => {
    const aHorizontal = (a.x - preferred.x) ** 2 + (a.z - preferred.z) ** 2;
    const bHorizontal = (b.x - preferred.x) ** 2 + (b.z - preferred.z) ** 2;
    if (aHorizontal !== bHorizontal) return aHorizontal - bHorizontal;
    const aVertical = Math.abs(a.y + 0.5 + PLAYER_EYE_HEIGHT - preferred.y);
    const bVertical = Math.abs(b.y + 0.5 + PLAYER_EYE_HEIGHT - preferred.y);
    return aVertical - bVertical;
  });

  const support = candidates[0];
  if (!support) return preferred;
  return {
    x: support.x,
    y: support.y + 0.5 + PLAYER_EYE_HEIGHT,
    z: support.z,
  };
}

export function respawnIfInVoid({ eyeY, verticalSpeed, spawn, voidY = -12 }) {
  if (eyeY >= voidY) return { eyeY, verticalSpeed, respawned: false };
  return { eyeY: spawn.y, verticalSpeed: 0, respawned: true };
}

export function restoreWorldIfEmpty(blocks) {
  return blocks.length === 0 ? createIslandBlocks() : blocks;
}
