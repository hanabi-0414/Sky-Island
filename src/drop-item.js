export const DROP_ITEM_SIZE = 0.3;
export const DROP_ITEM_HALF_SIZE = DROP_ITEM_SIZE / 2;

const DROP_GRAVITY = 19;
const DROP_SPIN_SPEED = 1.8;

export function createDroppedItem(block) {
  return {
    x: block.x,
    y: block.y + 0.5 + DROP_ITEM_HALF_SIZE,
    z: block.z,
    type: block.type,
    rotation: 0,
    verticalSpeed: 0,
    grounded: false,
  };
}

export function stepDroppedItem(item, blocks, delta) {
  const elapsed = Math.max(0, delta);
  const nextVerticalSpeed = item.verticalSpeed - DROP_GRAVITY * elapsed;
  const nextY = item.y + nextVerticalSpeed * elapsed;
  const currentBottom = item.y - DROP_ITEM_HALF_SIZE;
  const nextBottom = nextY - DROP_ITEM_HALF_SIZE;
  const rotation = (item.rotation + DROP_SPIN_SPEED * elapsed) % (Math.PI * 2);

  if (nextVerticalSpeed <= 0) {
    const landingTop = blocks.reduce((highest, block) => {
      const top = block.y + 0.5;
      const overlapsX = item.x + DROP_ITEM_HALF_SIZE > block.x - 0.5 &&
        item.x - DROP_ITEM_HALF_SIZE < block.x + 0.5;
      const overlapsZ = item.z + DROP_ITEM_HALF_SIZE > block.z - 0.5 &&
        item.z - DROP_ITEM_HALF_SIZE < block.z + 0.5;
      const crossesTop = top <= currentBottom + 1e-6 && top >= nextBottom - 1e-6;
      return overlapsX && overlapsZ && crossesTop ? Math.max(highest, top) : highest;
    }, -Infinity);

    if (Number.isFinite(landingTop)) {
      return {
        ...item,
        y: landingTop + DROP_ITEM_HALF_SIZE,
        rotation,
        verticalSpeed: 0,
        grounded: true,
      };
    }
  }

  return {
    ...item,
    y: nextY,
    rotation,
    verticalSpeed: nextVerticalSpeed,
    grounded: false,
  };
}
