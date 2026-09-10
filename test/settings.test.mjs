// The player's preferences, kept apart from the run.
//
// prefs.js is two lines of store and one question (`reducedMotion`), and the
// sheet in the browser is the only thing that writes it. What can go wrong is
// on the node side of the seam: a preference that does not come back after a
// reload, or a yard with no `matchMedia` answering "less" and turning every
// existing camera check into a snap. So the store is round-tripped here
// through a second instance of the module, which is what a reload is, and the
// question is asked off a bare yard.
//
// No yard is needed -- the module reads localStorage and nothing else -- so
// this file installs the DOM shim itself rather than booting the game.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDom } from '../tools/node/dom.mjs';

installDom();
const KEY = 'boulder-clicker/prefs';

// A fresh copy of the module: a query on the specifier is a different module
// to node, evaluated again from the top, which is exactly what the page does
// on a reload.
const fresh = n => import(`../src/prefs.js?${n}`);

test('a preference set on one page load is the preference on the next', async () => {
  localStorage.removeItem(KEY);
  const first = await fresh(1);
  assert.equal(first.pref('motion'), null, 'nothing has been asked for yet');
  assert.equal(first.pref('muted'), false, 'and the mute defaults to off');

  first.setPref('motion', true);
  const stored = JSON.parse(localStorage.getItem(KEY));
  assert.equal(stored.motion, true, 'the store carries it at once');

  const second = await fresh(2);
  assert.equal(second.pref('motion'), true, 'and the next load reads it back');
  assert.equal(second.pref('muted'), false, 'without losing the defaults it did not write');

  second.setPref('motion', false);
  const third = await fresh(3);
  assert.equal(third.pref('motion'), false, 'false is a value too, not an absence');
});

test('a bad blob in the store is the defaults, not a throw', async () => {
  localStorage.setItem(KEY, '{not json');
  const m = await fresh(4);
  assert.equal(m.pref('motion'), null);
  assert.equal(m.pref('muted'), false);
  localStorage.removeItem(KEY);
});

test('with no system to ask, the answer is the full picture', async () => {
  localStorage.removeItem(KEY);
  assert.equal(typeof globalThis.matchMedia, 'undefined', 'the node yard has no matchMedia');
  const m = await fresh(5);
  assert.equal(m.reducedMotion(), false, 'so nothing asks for less');
  // and the switch on the sheet overrides the system either way
  m.setPref('motion', true);
  assert.equal(m.reducedMotion(), true);
  m.setPref('motion', null);
  assert.equal(m.reducedMotion(), false);
});
