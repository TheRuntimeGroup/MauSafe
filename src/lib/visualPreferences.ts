const MONOCHROME_KEY = "mausafe.accessibility.monochrome";
const REDUCED_MOTION_KEY = "mausafe.accessibility.reducedMotion";

export function applyVisualSupport(enabled: boolean) {
  document.documentElement.classList.toggle("accessibility-monochrome", enabled);
  document.documentElement.classList.toggle("accessibility-reduced-motion", enabled);

  try {
    localStorage.setItem(MONOCHROME_KEY, String(enabled));
    localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
  } catch {
    // Preferences still apply for this session when storage is unavailable.
  }
}

export function restoreVisualPreferences() {
  let monochrome = false;
  let reducedMotion = false;
  try {
    monochrome = localStorage.getItem(MONOCHROME_KEY) === "true";
    reducedMotion = localStorage.getItem(REDUCED_MOTION_KEY) === "true";
  } catch {
    // Defaults keep the normal animated, full-colour experience.
  }
  document.documentElement.classList.toggle("accessibility-monochrome", monochrome);
  document.documentElement.classList.toggle("accessibility-reduced-motion", reducedMotion);
}
