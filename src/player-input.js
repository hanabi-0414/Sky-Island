export function shouldStartJump(keys, grounded) {
  return grounded && keys.has('Space');
}

export function getMovementInput(keys) {
  return {
    forward: Number(keys.has('KeyW') || keys.has('ArrowUp')) -
      Number(keys.has('KeyS') || keys.has('ArrowDown')),
    sideways: Number(keys.has('KeyD') || keys.has('ArrowRight')) -
      Number(keys.has('KeyA') || keys.has('ArrowLeft')),
  };
}
