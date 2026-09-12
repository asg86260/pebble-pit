// The held sheet as the settings sheet: what is on it, in what order, and
// whether each thing on it does what it says.
//
// 4 groups (wave-release, track A). Everything here needs the page -- the
// sheet is DOM, the switch is a button, the save goes through a textarea --
// which is why it is in this tier and not the node one; the preference store
// itself is checked in test/settings.test.mjs.

import { sleep, raf, newRun, settle, state, ok, run, board } from './kit.js';
import { pref, setPref, reducedMotion } from '../prefs.js';
import { disarmReset } from '../input.js';
import { S } from '../state.js';
import { version } from '../version.js';
import { persist, exportSave } from '../persist.js';

const held = () => document.getElementById('held');
// escape, and then a frame: the sheet puts itself in order when it sees itself
// come up, which is a microtask after the key, not the same tick
const press = async () => {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await raf();
};
const resume = () => document.getElementById('resume').click();
const said = () => held().querySelector('.said').textContent;
const motion = () => document.getElementById('motion');

// what a player reads, top to bottom: each child of the sheet that is showing,
// as its text with the whitespace folded
// The record's button carries a count that is the yard's doing, so it is read
// as its name: what the check is about is that the line is there, in its place.
const lines = () => [...held().children]
  .filter(el => !el.hidden && !(el.classList.contains('said') && !el.textContent))
  .map(el => el.id === 'recordbtn' ? 'the record'
                                   : el.textContent.replace(/\s+/g, ' ').trim());

export const TESTS = [
  ['the held sheet is the settings sheet', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(10);
    await press();
    const up = !held().hidden;
    const got = lines();
    const want = [
      'paused',
      'resume',
      '',                                     // the rule
      'the record',                           // the button to the page behind -- see record.js
      '',                                     // and its rule
      'motion: ' + (reducedMotion() ? 'less' : 'full'),
      'sound: on',                            // the mute, which remembers -- see audio.js
      '',                                     // the volume: a slider has no words
      'save a copy load a save',
      'reset progress',
      'esc holds · ← → look about',
      version(),
      'rocks keep coming. there is no finish line.',
    ];
    const before = state();
    resume();
    const down = held().hidden;
    run(2);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(up, 'escape puts the sheet up'),
      ok(got.join('|') === want.join('|'), 'and every line is on it, in order',
         `got ${JSON.stringify(got)}`),
      ok(down && !after.paused, 'resume takes it down', `${down}, ${after.paused}`),
      ok(after.workerPos.join() !== before.workerPos.join(), 'and the game runs on'),
    ];
  }],

  ['motion is a switch that remembers', async () => {
    newRun();
    await settle();
    setPref('motion', null);
    await press();
    const was = reducedMotion();
    const readBefore = motion().textContent;
    motion().click();
    const flipped = pref('motion');
    const readAfter = motion().textContent;
    resume();
    // a new run is the game starting over; the preference is not the game's
    newRun();
    await settle();
    await press();
    const kept = pref('motion');
    const readKept = motion().textContent;
    resume();
    setPref('motion', null);
    return [
      ok(readBefore === (was ? 'motion: less' : 'motion: full'),
         'the switch reads what is in force', readBefore),
      ok(flipped === !was, 'pressing it flips the preference', String(flipped)),
      ok(readAfter === (was ? 'motion: full' : 'motion: less'),
         'and the button says so', readAfter),
      ok(kept === !was && readKept === readAfter, 'and a new run does not unflip it',
         `${kept}, ${readKept}`),
    ];
  }],

  // The save goes out through one button and comes back in through the paste.
  // Until track C lands, `importSave` throws; the sheet catches that rather
  // than letting the game stop, and this group reports it as what it is.
  ['a save comes out and goes back in through the sheet', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    S.dirty = true;
    persist();                                  // so there is a save to copy
    await press();
    document.getElementById('savecopy').click();
    await sleep(100);
    const copied = said();
    // the blob itself, off the seam the button used: what the clipboard holds
    // is the browser's business, and headless pages do not always have one
    const blob = exportSave();

    document.getElementById('loadsave').click();
    const paste = document.getElementById('paste');
    const box = document.getElementById('pastebox');
    const opened = !paste.hidden;
    const stored = state().stored;
    box.value = 'nothing here';
    document.getElementById('loadit').click();
    const refused = said();
    if (/not built/.test(refused)) {
      resume();
      window.__crew(0, 0);
      return [ok(false, 'importSave is not built (track C)', refused)];
    }
    const stillOpen = !paste.hidden;
    const untouched = state().stored === stored;

    box.value = blob;
    document.getElementById('loadit').click();
    const loaded = said();
    const folded = paste.hidden;
    resume();
    window.__crew(0, 0);
    return [
      ok(/copied \d+kb|in window\.__save/.test(copied), 'the save comes out of the sheet', copied),
      ok(opened, 'load a save opens the paste'),
      ok(refused === 'that is not a save' && stillOpen && untouched,
         'a paste that is not a save is refused, and costs nothing',
         `${refused}, open ${stillOpen}, stored ${state().stored} vs ${stored}`),
      ok(blob.length > 0 && loaded === 'loaded' && folded,
         'and the exported blob goes back in', `${loaded}, ${blob.length} chars`),
    ];
  }],

  ['reset progress lives on the sheet and still arms', async () => {
    newRun();
    await settle();
    const onBench = board().querySelector('#reset');
    const btn = held().querySelector('#reset');
    await press();
    btn.click();
    const armed = btn.classList.contains('armed') && btn.textContent === 'erase everything?';
    const flagged = !!S.resetArmed;
    clearTimeout(S.resetArmed);
    disarmReset();
    const stoodDown = !btn.classList.contains('armed') && btn.textContent === 'reset progress'
      && !S.resetArmed;
    resume();
    return [
      ok(!onBench, 'the bench has no reset button'),
      ok(!!btn, 'the sheet has it'),
      ok(armed && flagged, 'one click arms it and it asks', `${btn.textContent}`),
      ok(stoodDown, 'and it stands down without erasing anything'),
    ];
  }],
];
