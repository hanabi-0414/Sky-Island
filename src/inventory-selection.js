export function stepInventorySelection(currentIndex, direction, slotCount) {
  if (!Number.isInteger(slotCount) || slotCount < 1) return 0;
  const current = Number.isInteger(currentIndex)
    ? ((currentIndex % slotCount) + slotCount) % slotCount
    : 0;
  const step = Math.sign(direction);
  return (current + step + slotCount) % slotCount;
}

export function getInventoryIndexFromKey(code, slotCount) {
  const match = /^(?:Digit|Numpad)([1-9])$/.exec(code);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index < slotCount ? index : null;
}
