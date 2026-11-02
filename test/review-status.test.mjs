import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewState } from '../tools/review-state.mjs';

const t = m => new Date(Date.UTC(2026, 10, 1, 12, m)).toISOString();
const keep = { at: t(10), verdict: 'keep', say: 'bigger' };

test('a keep note with no later change is iterating', () => {
  const r = reviewState({ notes: [keep], changes: [{ at: t(5) }] });
  assert.equal(r.state, 'iterating');
  assert.equal(r.what, 'bigger');
});
test('a keep note then a later changed line is waiting on you', () => {
  assert.equal(reviewState({ notes: [keep], changes: [{ at: t(20), text: 'bigger' }] }).state, 'waiting');
});
test('a keep note then a newer fingerprint is waiting on you', () => {
  assert.equal(reviewState({ notes: [keep], printSince: t(20) }).state, 'waiting');
});
test('a written building status wins over a later change', () => {
  assert.equal(reviewState({ entry: { state: 'building', what: 'x', since: t(25) }, notes: [keep], changes: [{ at: t(20) }], now: Date.parse(t(26)) }).state, 'building');
});
test('a stop is signed off, even with a later change', () => {
  assert.equal(reviewState({ notes: [{ at: t(10), verdict: 'stop' }], changes: [{ at: t(20) }] }).state, 'signed');
});
test('no note is waiting', () => {
  assert.equal(reviewState({}).state, 'waiting');
});
