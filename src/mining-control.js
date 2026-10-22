const MINING_DURATIONS = Object.freeze({ grass: 0.8, dirt: 0.8, stone: 2 });

export function getMiningDuration(type) {
  return MINING_DURATIONS[type] ?? MINING_DURATIONS.dirt;
}

export function createMiningController() {
  let target = null;
  let elapsed = 0;

  return {
    update({ target: nextTarget, held, delta, type }) {
      if (!held || nextTarget == null) {
        target = null;
        elapsed = 0;
        return { target: null, progress: 0, stage: null, mined: false };
      }

      if (nextTarget !== target) {
        target = nextTarget;
        elapsed = 0;
      }

      const duration = getMiningDuration(type);
      elapsed = Math.min(elapsed + Math.max(0, delta), duration);
      const progress = elapsed / duration;
      return {
        target,
        progress,
        stage: Math.min(9, Math.floor(progress * 10)),
        mined: progress >= 1,
      };
    },
  };
}
