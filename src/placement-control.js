import { isWithinWorldBounds } from './world.js';

export function tryPlaceBlock({ blocks, source, normal, type, inventory }) {
  const amount = inventory[type];
  const axisValues = [normal?.x, normal?.y, normal?.z];
  const isFaceNormal = axisValues.filter((value) => value === 1 || value === -1).length === 1 &&
    axisValues.every((value) => value === 0 || value === 1 || value === -1);
  if (!Object.hasOwn(inventory, type) || amount <= 0 || !isFaceNormal) {
    return { blocks, inventory, placed: false, position: null };
  }

  const position = {
    x: source.x + normal.x,
    y: source.y + normal.y,
    z: source.z + normal.z,
  };
  if (!isWithinWorldBounds(position.x, position.y, position.z) ||
      blocks.some((block) =>
        block.x === position.x && block.y === position.y && block.z === position.z,
      )) {
    return { blocks, inventory, placed: false, position };
  }

  return {
    blocks: [...blocks, { ...position, type }],
    inventory: { ...inventory, [type]: amount - 1 },
    placed: true,
    position,
  };
}
