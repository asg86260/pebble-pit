// The held sheet as the settings sheet: what is on it, in what order, and
// whether each thing on it does what it says.
//
// 4 groups (wave-release, track A). Everything here needs the page -- the
// sheet is DOM, the switch is a button, the save goes through a textarea --
// which is why it is in this tier and not the node one; the preference store
// itself is checked in test/settings.test.mjs.

import { sleep, raf, newRun, settle, state, ok, run, runUntil, board, haveRock,
         boulderWorld, onScreen, point } from './kit.js';
import { pref, setPref, reducedMotion } from '../prefs.js';
import { disarmReset } from '../input.js';
import { S } from '../state.js';
import { version } from '../version.js';
import { persist, exportSave } from '../persist.js';
import { earn, noticeFor } from '../notices.js';
import { toastUp, toastWaiting } from '../toast.js';
import { TOAST_MS, TOAST_GAP_MS } from '../config.js';

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
  .map(el => el.id === 'recordbtn' ? 'achievements'
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
      'achievements',                         // the button to the page behind -- see record.js
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

  // --- the toast (DESIGN.md, "a toast when one lands") -------------------------
  // The card is DOM and is stepped by the frame, not the sim: `run` turns the
  // game's clock and one `raf` is the frame that reads it.

  // The first notice, the way a player gets it: the rock clicked, the chips
  // hauled into the hole. The crew and their pace are setup; the earning is
  // the click and the walk.
  ['a notice landing is said out loud, in the record\'s words', async () => {
    newRun();
    await settle();
    haveRock();
    window.__levels({ haulPaceLevel: 20, haulCarryLevel: 4 });
    window.__crew(0, 3);
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    for (let i = 0; i < 12; i++) { point('pointerdown', x, y); point('pointerup', x, y); run(0.05); }
    runUntil(() => state().chips === 0, 20);
    const chipped = state().floor;
    const banked = runUntil(() => S.banked > 0, 120);
    run(1);                                     // the sampler asks twice a second
    await raf();
    const card = toastUp();
    // The opening lands a notice or two of its own before the grain (the
    // core the door throws, the first hire), so what is up is whichever
    // landed first, and the grain's turn comes in the line.
    const first = Object.entries(S.wonAt).sort((a, b) => a[1] - b[1])[0]?.[0];
    const said = first && noticeFor(first);
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    const gone = toastUp();
    let grain = null;
    for (let i = 0; i < 6 && !grain; i++) {
      run(TOAST_GAP_MS / 1000 + 0.1);           // the next goes up
      await raf();
      if (toastUp()?.key === 'firstgrain') grain = toastUp();
      run(TOAST_MS / 1000 + 0.1);               // and comes down
      await raf();
    }
    const want = noticeFor('firstgrain');
    window.__crew(0, 0);
    return [
      ok(banked, 'a pebble reaches the hole', `floor ${chipped}, stored ${state().stored}, won ${S.won}`),
      ok(!!card && !!said && card.key === first && card.name === said.name && card.note === said.note,
         'and the card says the first to land, name and note', `${JSON.stringify(card)} vs ${first}`),
      ok(!gone, 'and it is gone after its time', JSON.stringify(gone)),
      ok(!!grain && grain.name === want.name && grain.note === want.note,
         'and the grain gets its turn, in the record\'s words', JSON.stringify(grain)),
    ];
  }],

  ['several landing at once are said one at a time', async () => {
    newRun();
    await settle();
    // three in one frame, the way a rock coming off lands three
    earn('rock0'); earn('ownhand'); earn('underminute');
    run(TOAST_GAP_MS / 1000 + 0.1);             // a new run starts the clock over; no gap is owed
    await raf();
    const one = toastUp();
    const waiting = toastWaiting();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    const between = toastUp();
    run(TOAST_GAP_MS / 1000 + 0.1);
    await raf();
    const two = toastUp();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    run(TOAST_GAP_MS / 1000 + 0.1);
    await raf();
    const three = toastUp();
    run(TOAST_MS / 1000 + 0.1);                 // and off, so the next group starts clean
    await raf();
    return [
      ok(!!one && one.name === noticeFor('rock0').name, 'the first goes up first', JSON.stringify(one)),
      ok(waiting === 2, 'and the other two wait', String(waiting)),
      ok(!between, 'there is a gap between two', JSON.stringify(between)),
      ok(!!two && two.name === noticeFor('ownhand').name, 'then the second', JSON.stringify(two)),
      ok(!!three && three.name === noticeFor('underminute').name, 'then the third', JSON.stringify(three)),
    ];
  }],

  ['pressing the card holds the game on the achievements page', async () => {
    newRun();
    await settle();
    earn('rock0');
    await raf();
    document.getElementById('toast').click();
    await raf();
    const up = !held().hidden && S.paused;
    const page = !document.getElementById('record').hidden
      && document.getElementById('recordbtn').hidden;
    const named = [...document.getElementById('record').querySelectorAll('.name')]
      .some(n => n.textContent === noticeFor('rock0').name);
    document.getElementById('recordback').click();
    resume();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    return [
      ok(up, 'the sheet comes up and the game is held'),
      ok(page, 'turned to the achievements page', String(page)),
      ok(named, 'with the notice on it'),
    ];
  }],

  // What was earned before this sitting is on the sheet, not in the air: a
  // veteran save's catch-up and a save coming back both say nothing.
  ['a record that was already written is not said again', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    S.dirty = true;
    persist();
    earn('rock0', true);                       // the catch-up's quiet pass
    await raf();
    const quiet = toastUp();
    // the save out and back in, through the sheet, with a notice on it
    await press();
    const blob = exportSave();
    resume();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    newRun();
    await settle();
    await press();
    document.getElementById('loadsave').click();
    document.getElementById('pastebox').value = blob;
    document.getElementById('loadit').click();
    await sleep(100);
    const loaded = said();
    resume();
    run(1);
    await raf();
    const back = toastUp();
    const kept = S.won.includes('rock0');
    window.__crew(0, 0);
    return [
      ok(!quiet, 'a quiet earn puts no card up', JSON.stringify(quiet)),
      ok(kept, 'the save comes back with the notice on it', `${loaded}; ${S.won.join(',')}`),
      ok(!back, 'and says nothing about it', JSON.stringify(back)),
    ];
  }],
];
