const DAY_SETTINGS = Object.freeze({
  background: '#bfe0f4',
  hemisphereIntensity: 2,
  sunIntensity: 2.2,
});

const NIGHT_SETTINGS = Object.freeze({
  background: '#17283e',
  hemisphereIntensity: 1.05,
  sunIntensity: 0.85,
});

export function isDayNightToggleKey(code) {
  return code === 'KeyN';
}

export function createDayNightController() {
  let isNight = false;

  return {
    get isNight() {
      return isNight;
    },
    get settings() {
      return { ...(isNight ? NIGHT_SETTINGS : DAY_SETTINGS) };
    },
    toggle() {
      isNight = !isNight;
      return isNight;
    },
  };
}
