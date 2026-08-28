const STORAGE_KEY = 'flexbox-hoops-progress';

export function defaultProgress() {
  return { currentLevel: 0, solved: {}, attempts: {} };
}

export function serializeProgress(state) {
  return JSON.stringify(state);
}

export function parseProgress(raw) {
  if (!raw) return defaultProgress();
  try {
    const parsed = JSON.parse(raw);
    const valid =
      typeof parsed === 'object' && parsed !== null &&
      typeof parsed.currentLevel === 'number' &&
      typeof parsed.solved === 'object' && parsed.solved !== null &&
      typeof parsed.attempts === 'object' && parsed.attempts !== null;
    return valid ? parsed : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export function loadProgress() {
  return parseProgress(localStorage.getItem(STORAGE_KEY));
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, serializeProgress(state));
}
