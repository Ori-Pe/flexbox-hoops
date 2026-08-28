import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAligned } from '../js/geometry.js';

test('identical rects are aligned', () => {
  const rect = { left: 10, right: 50, top: 10, bottom: 50 };
  assert.equal(isAligned(rect, rect), true);
});

test('rects within tolerance are aligned', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 14, right: 54, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b, 6), true);
});

test('rects just outside tolerance are not aligned', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 17, right: 57, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b, 6), false);
});

test('vertical misalignment fails even when horizontal matches', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 10, right: 50, top: 30, bottom: 70 };
  assert.equal(isAligned(a, b, 6), false);
});

test('default tolerance is 6px', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 15, right: 55, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b), true);
});
