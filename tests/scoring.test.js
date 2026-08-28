import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attemptCount, recordAttempt, resetAttemptsFor } from '../js/scoring.js';

test('attemptCount defaults to 0 for an unseen level', () => {
  assert.equal(attemptCount({}, 'baseline-drive'), 0);
});

test('recordAttempt increments the given level', () => {
  const attempts = recordAttempt({ 'baseline-drive': 1 }, 'baseline-drive');
  assert.equal(attempts['baseline-drive'], 2);
});

test('recordAttempt does not mutate the input', () => {
  const original = { 'baseline-drive': 1 };
  recordAttempt(original, 'baseline-drive');
  assert.deepEqual(original, { 'baseline-drive': 1 });
});

test('recordAttempt leaves other levels untouched', () => {
  const attempts = recordAttempt({ a: 1, b: 5 }, 'a');
  assert.equal(attempts.b, 5);
});

test('resetAttemptsFor clears only the given level', () => {
  const attempts = resetAttemptsFor({ a: 3, b: 5 }, 'a');
  assert.equal(attemptCount(attempts, 'a'), 0);
  assert.equal(attempts.b, 5);
});
