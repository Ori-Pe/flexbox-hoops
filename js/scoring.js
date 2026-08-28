export function attemptCount(attempts, levelId) {
  return attempts[levelId] || 0;
}

export function recordAttempt(attempts, levelId) {
  return { ...attempts, [levelId]: attemptCount(attempts, levelId) + 1 };
}

export function resetAttemptsFor(attempts, levelId) {
  const next = { ...attempts };
  delete next[levelId];
  return next;
}
