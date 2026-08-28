import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeclarations } from '../js/parser.js';

test('parses a single declaration', () => {
  assert.deepEqual(parseDeclarations('justify-content: flex-end;'), { justifyContent: 'flex-end' });
});

test('parses multiple declarations separated by newlines', () => {
  const text = 'justify-content: center;\nalign-items: center;';
  assert.deepEqual(parseDeclarations(text), { justifyContent: 'center', alignItems: 'center' });
});

test('parses declarations separated only by semicolons on one line', () => {
  const text = 'justify-content: center; align-items: center;';
  assert.deepEqual(parseDeclarations(text), { justifyContent: 'center', alignItems: 'center' });
});

test('is case-insensitive on the property name', () => {
  assert.deepEqual(parseDeclarations('JUSTIFY-CONTENT: center;'), { justifyContent: 'center' });
});

test('drops properties not on the whitelist', () => {
  assert.deepEqual(parseDeclarations('color: red; justify-content: center;'), { justifyContent: 'center' });
});

test('drops malformed lines with no colon', () => {
  assert.deepEqual(parseDeclarations('justify-content center; align-items: center;'), { alignItems: 'center' });
});

test('parses order as an integer', () => {
  assert.deepEqual(parseDeclarations('order: 2;'), { order: 2 });
});

test('empty or missing input returns an empty object', () => {
  assert.deepEqual(parseDeclarations(''), {});
  assert.deepEqual(parseDeclarations(undefined), {});
});
