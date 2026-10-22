import { createIslandBlocks, PLAYER_EYE_HEIGHT } from './world.js';

export function stepVerticalPhysics({
  blocks,
  x,
  z,
  eyeY,
  verticalSpeed,
  delta,
  eyeHeight = PLAYER_EYE_HEIGHT,
  gravity = 19,
}) {
  const currentFeetY = eyeY - eyeHeight;
  const nextVerticalSpeed = verticalSpeed - gravity * delta;
  const nextEyeY = eyeY + nextVerticalSpeed * delta;
  const nextFeetY = nextEyeY - eyeHeight;

  if (nextVerticalSpeed <= 0) {
    const landingTop = blocks.reduce((highest, block) => {
      const top = block.y + 0.5;
      const overlapsX = x >= block.x - 0.5 && x <= block.x + 0.5;
      const overlapsZ = z >= block.z - 0.5 && z <= block.z + 0.5;
      const crossesTop = top <= currentFeetY + 1e-6 && top >= nextFeetY - 1e-6;
      return overlapsX && overlapsZ && crossesTop ? Math.max(highest, top) : highest;
    }, -Infinity);

    if (Number.isFinite(landingTop)) {
      return { eyeY: landingTop + eyeHeight, verticalSpeed: 0, grounded: true };
    }
  }

  return { eyeY: nextEyeY, verticalSpeed: nextVerticalSpeed, grounded: false };
}

export function respawnIfInVoid({ eyeY, verticalSpeed, spawn, voidY = -12 }) {
  if (eyeY >= voidY) return { eyeY, verticalSpeed, respawned: false };
  return { eyeY: spawn.y, verticalSpeed: 0, respawned: true };
}

export function restoreWorldIfEmpty(blocks) {
  return blocks.length === 0 ? createIslandBlocks() : blocks;
}
