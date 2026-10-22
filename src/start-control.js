export function beginGame(onStart, requestPointerLock) {
  onStart();

  try {
    const result = requestPointerLock?.();
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {
    // 指標鎖定只是視角控制的輔助；瀏覽器拒絕時仍可開始遊戲。
  }
}
