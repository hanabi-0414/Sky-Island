export const PICKUP_RADIUS = 1.5;

const PICKUP_SPEED = 5;
const PICKUP_ARRIVAL_DISTANCE = 0.12;

export function stepPickupItem(item, player, delta) {
  const dx = player.x - item.x;
  const dy = player.y - item.y;
  const dz = player.z - item.z;
  const distance = Math.hypot(dx, dy, dz);
  const collecting = item.collecting || distance <= PICKUP_RADIUS;

  if (!collecting) return { item, collected: false };
  if (distance <= Math.max(PICKUP_SPEED * Math.max(0, delta), PICKUP_ARRIVAL_DISTANCE)) {
    return {
      item: { ...item, x: player.x, y: player.y, z: player.z, collecting: true },
      collected: true,
    };
  }

  const step = PICKUP_SPEED * Math.max(0, delta);
  const ratio = step / distance;
  return {
    item: {
      ...item,
      x: item.x + dx * ratio,
      y: item.y + dy * ratio,
      z: item.z + dz * ratio,
      collecting: true,
      grounded: false,
      verticalSpeed: 0,
    },
    collected: false,
  };
}

export function addInventoryItem(inventory, type) {
  if (!Object.hasOwn(inventory, type)) return inventory;
  return { ...inventory, [type]: inventory[type] + 1 };
}
