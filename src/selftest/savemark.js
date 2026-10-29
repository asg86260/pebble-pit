// The save mark (savemark.js): it fades up when a save lands and back down,
// and stands struck through while the page is not being saved -- another tab
// holding the slot, the database refusing the write -- with the game playing
// on under it. Who decides those states is checked in test/save-alarm.test.mjs;
// this is the mark on the page.

import { newRun, settle, ok, onPage } from './kit.js';
import { S } from '../state.js';
import { persist, claimSave } from '../persist.js';
import { OWNER_KEY, storeSettled } from '../save.js';
import { resetSaveMark } from '../savemark.js';
import { SAVE_MARK_SHOW_MS } from '../config.js';

const mark = () => document.getElementById('savemark');
const ink = () => +getComputedStyle(mark()).opacity;
const struck = () => mark().classList.contains('trouble');

export const TESTS = [
  ['the save mark fades up as a save lands, and back down', async () => {
    newRun();
    await settle();
    resetSaveMark();
    persist();
    const up = await onPage(() => ink() >= 0.99, 120);
    const wasStruck = struck();
    const down = await onPage(() => ink() <= 0.01, Math.ceil(SAVE_MARK_SHOW_MS / 16) + 120);
    return [
      ok(up && !wasStruck, 'a landed save brings the disk up', `opacity ${ink()}`),
      ok(down, 'and it goes again', `opacity ${ink()}`)
    ];
  }],

  ['a refused save stands the struck mark up, the game playing on, and it clears once a save lands', async () => {
    newRun();
    await settle();
    // The database refusing as a closed connection does: the write throws.
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('The database connection is closing.', 'InvalidStateError'); };
    let unsaved = false, shown = false, fatal = null, paused = true;
    try {
      persist();
      await storeSettled();
      persist();
      unsaved = S.unsaved;
      shown = await onPage(() => struck() && ink() >= 0.99, 120);
      fatal = S.fatal;
      paused = S.paused;
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    persist();
    await storeSettled();
    persist();
    const cleared = await onPage(() => !struck(), 120);
    return [
      ok(unsaved && shown, 'the struck disk stands while nothing is saved', `unsaved ${unsaved}, opacity ${ink()}`),
      ok(!fatal && !paused, 'and the game neither stops nor holds', `fatal ${fatal}, paused ${paused}`),
      ok(cleared && !S.unsaved, 'a save that lands takes it down')
    ];
  }],

  ['another tab with a newer save stands the struck mark up, and the game plays on', async () => {
    newRun();
    await settle();
    localStorage.setItem(OWNER_KEY(), 'anothertab ' + (Date.now() + 600000));
    persist();
    const yielded = S.yielded;
    const shown = await onPage(() => struck() && ink() >= 0.99, 120);
    const pressable = getComputedStyle(mark()).cursor === 'pointer';
    const paused = S.paused;
    claimSave();
    S.yielded = false;
    persist();
    const cleared = await onPage(() => !struck(), 120);
    return [
      ok(yielded && shown, 'the struck disk stands', `opacity ${ink()}`),
      ok(pressable, 'pressable, to take the save back'),
      ok(!paused, 'and the game plays on'),
      ok(cleared, 'and it clears once this page holds the save again')
    ];
  }]
];
