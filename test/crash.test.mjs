// A yard that has thrown is not written down.
//
// The frame loop stopping on a throw is the browser's half (crash.js, and the
// wrap in main.js); this is the yard's half, which is the one that used to cost
// a run: the autosave carrying on after the throw and writing the broken state
// over the last save that was whole, once a second, until the tab closed.

import { group, ok, state, run, yard, storeChecks } from './helpers.mjs';
storeChecks();          // this file is about the store itself: no reload harness

const { persist } = await import('../src/persist.js');
const KEY = 'boulder-clicker/v4';

group('nothing is written after the game has stopped', async () => {
  window.__crew(2, 2);
  run(10);
  persist();
  const good = localStorage.getItem(KEY);
  const wasStored = state().stored;

  // The yard goes on changing after the throw -- the state is whatever it was
  // mid-frame -- and none of it may reach the save.
  yard.S.fatal = 'TypeError: something broke';
  run(10);
  yard.S.stored = wasStored + 1000;
  yard.S.dirty = true;
  persist();
  const after = localStorage.getItem(KEY);

  // and the guard is the flag, not a one-off: a second call writes no more
  // than the first
  persist();
  const again = localStorage.getItem(KEY);

  yard.S.fatal = '';
  return [
    ok(good && good.length > 0, 'the yard had been saved before it stopped'),
    ok(after === good, 'a save after the throw is the save from before it',
       after === good ? '' : 'the save changed'),
    ok(again === good, 'and stays so however many times the autosave fires'),
    ok(JSON.parse(good).stored === wasStored,
       'so what is on disk is the yard that was still standing',
       `${JSON.parse(good).stored} vs ${wasStored}`),
  ];
});
