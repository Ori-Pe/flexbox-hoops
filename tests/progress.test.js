import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProgress, serializeProgress, parseProgress } from '../js/progress.js';

test('default progress has the expected shape', () => {
  assert.deepEqual(defaultProgress(), { currentLevel: 0, solved: {}, attempts: {} });
});

test('serialize then parse round-trips', () => {
  const state = { currentLevel: 3, solved: { 'baseline-drive': true }, attempts: { 'baseline-drive': 2 } };
  const roundTripped = parseProgress(serializeProgress(state));
  assert.deepEqual(roundTripped, state);
});

test('missing data falls back to default', () => {
  assert.deepEqual(parseProgress(null), defaultProgress());
  assert.deepEqual(parseProgress(''), defaultProgress());
});

test('corrupt JSON falls back to default', () => {
  assert.deepEqual(parseProgress('{not valid json'), defaultProgress());
});

test('wrong-shaped JSON falls back to default', () => {
  assert.deepEqual(parseProgress('{"currentLevel":"three"}'), defaultProgress());
});
