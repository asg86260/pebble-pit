// The keyboard and the cursor: holding the yard still, and what a shape says a
// press will do.

import { sleep, newRun, settle, state, ok, canvas, panel, point, hoverAway, run,
         runUntil, haveBench } from './kit.js';
import { S } from '../state.js';
import { SHEET_FADE_MS, SKIP_HOLD_MS } from '../config.js';
import { fatal } from '../crash.js';

export const TESTS = [
  // Escape stops the clock itself, so nothing in the yard can tell the
  // difference.
  ['escape holds the whole yard still', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(20);
    const before = state();
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    const held = state();
    // read now, not at the end: by then the test has pressed resume
    const sheetUp = !document.getElementById('held').hidden;
    run(30);
    const still = state();
    document.getElementById('resume').click();
    await sleep(SHEET_FADE_MS + 60);            // it goes down as a fade (fade.js)
    const sheetGone = document.getElementById('held').hidden;
    run(20);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(held.paused && sheetUp,
         'escape holds it, and says so in the middle of the window',
         `${held.paused}, ${sheetUp}`),
      ok(still.workerPos.join() === held.workerPos.join(),
         'and nobody moves a pixel while it is held'),
      ok(!after.paused && sheetGone, 'and the resume button lets it go again',
         `${after.paused}, ${sheetGone}`),
      ok(after.workerPos.join() !== still.workerPos.join(),
         'and everybody carries on from exactly where they stopped')
    ];
  }],

  // Through the key itself, since the node tier can only hold it through the
  // hook.
  ['space held skips the opening, and a tap does not', async () => {
    newRun();
    window.__reset(true);                      // the opening, playing
    run(1);
    const key = type => dispatchEvent(new KeyboardEvent(type, { key: ' ', code: 'Space', bubbles: true }));
    await sleep(SHEET_FADE_MS + 60);
    const hintUp = document.getElementById('skip').classList.contains('on');
    key('keydown');
    run(SKIP_HOLD_MS / 2000);
    key('keyup');
    run(1);
    const tapped = state();
    key('keydown');
    key('keydown');                            // the browser's repeat, which must not restart the count
    run(SKIP_HOLD_MS / 1000 + 0.1);
    key('keyup');
    const cut = state();
    await sleep(SHEET_FADE_MS + 60);
    const hintDown = !document.getElementById('skip').classList.contains('on');
    window.__reset();
    return [
      ok(hintUp, 'the hint is up while the opening runs'),
      ok(tapped.intro && !tapped.introDone, 'a tap of the key changes nothing', `${tapped.intro}`),
      ok(!cut.intro && cut.introDone, 'held through, the opening is over', `${cut.intro}`),
      ok(hintDown, 'and the hint goes with it'),
    ];
  }],

  ['the achievements are a page of cards on the held sheet, read by holding', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(400);                       // the first pebble in the pit is noticed
    run(20);
    const before = state();
    dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    const btn = document.getElementById('recordbtn');
    const el = document.getElementById('record');
    const counted = btn.textContent;
    const frontFirst = !btn.hidden && el.hidden;
    btn.click();
    const turned = el.hidden === false && document.getElementById('resume').hidden;
    const cards = [...el.querySelectorAll('.card')];
    const buttons = el.querySelectorAll('button, [data-key]').length;
    const cursor = cards.length ? getComputedStyle(cards[0]).cursor : '';
    const read = state().wonUnread;
    const onBoard = [...document.getElementById('statsshop').querySelectorAll('[data-key]')]
      .some(r => r.dataset.key.startsWith('notice'));
    document.getElementById('recordback').click();
    const back = el.hidden && !document.getElementById('resume').hidden;
    document.getElementById('resume').click();
    window.__crew(0, 0);
    return [
      ok(before.wonUnread > 0, 'a notice has landed and is unread', `${before.wonUnread}`),
      ok(frontFirst && counted.startsWith(`achievements \u00b7 ${state().won} of `),
         'the sheet comes up on its front, with the count on the button', counted),
      ok(turned && cards.length === state().won,
         'the button turns the page to the cards, one a notice',
         `${cards.length} cards, ${state().won} won`),
      ok(back, 'and back is the front again'),
      ok(read === 0, 'and holding reads it', `${read} unread`),
      ok(buttons === 0 && cursor !== 'pointer', 'nothing on it is a row or a button',
         `${buttons} buttons, cursor ${cursor}`),
      ok(!onBoard, 'and the noticeboard\'s sheet no longer carries it')
    ];
  }],

  // The board stands above the station that opens it, so getting to it means
  // crossing bare canvas that is neither.
  ['the board does not shut on the way to it', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    // the dust alone only puts the call up (raise.js)
    await haveBench();
    const panel = document.getElementById('panel');
    // looking at the bench, which is where you are when you walk up to it: the
    // board is clamped inside the window and the station is not, so a station
    // scrolled off the side is a different geometry entirely
    window.__look(state().benchX - 200);
    run(0.2);
    const s = state();
    const move = (cx, cy) => { point('pointermove', cx, cy, 0); return state().boardOpen; };

    const bx = (s.benchX + 20 - s.camX) * s.zoom, by = (s.groundY - 30 - s.camY) * s.zoom;
    const opened = move(bx, by);
    const r = panel.getBoundingClientRect();

    // the whole diagonal from the station to the far bottom corner of the sheet
    const far = { x: r.x + r.width - 6, y: r.y + r.height - 6 };
    let heldOn = true;
    for (let i = 1; i <= 12; i++) {
      const k = i / 12;
      if (!move(bx + (far.x - bx) * k, by + (far.y - by) * k)) heldOn = false;
    }
    const corner = state().boardOpen;

    // and it still shuts when you walk away, after LINGER (board.js): the
    // board holds its place briefly when the pointer leaves a station, so
    // walking off is answered a moment late.
    const leave = async (cx, cy) => {
      point('pointermove', cx, cy, 0);
      await sleep(220);
      return state().boardOpen;
    };
    move(bx, by);
    const aside = await leave(r.x + r.width + 400, by);
    move(bx, by);
    // Below the *panel*, not a pinned distance below the bench: a fixed
    // distance lands on the sheet itself as the board grows rows.
    const below = await leave(bx, Math.max(by + 200, r.y + r.height + 40));
    move(s.W - 4, 4);                           // and out of the way for the next check
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(opened, 'standing at the bench opens it'),
      ok(heldOn, 'and every step of the way to its far corner keeps it open'),
      ok(corner, 'including the corner itself'),
      ok(!aside, 'well off to one side still shuts it',
         `panel ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} ` +
         `bench ${Math.round(bx)},${Math.round(by)} probe ${Math.round(r.x + r.width + 400)}`),
      ok(!below, 'and so does walking off below it')
    ];
  }],

  // The yard is one canvas, so nothing drawn in it carries a cursor of its own
  // the way a button on a page does.
  ['the cursor says what a thing will do', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    await haveBench();            // a place with a board on it has to be built first
    const canvasEl = canvas();
    const at = (wx, wy) => {
      const s = state();
      point('pointermove', (wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom, 0);
      return canvasEl.style.cursor;
    };
    const s0 = state();
    const r = s0.roster.find(x => x.job === 'rockhands');
    // Below the ground line and well clear of everything: the sky is where the
    // birds are, and a bird under the cursor is a thing you can click.
    const sky = at(s0.rockX - 900, s0.groundY + 300);
    const rock = at(s0.rockX, s0.rockY);
    const bench = at(s0.benchX + 20, s0.groundY - 30);
    const minus = at(r.less[0], r.less[1]);

    // a rock that has a core in it, which the first four do not
    window.__jump(5);
    window.__next();
    // until there is one, not for a fixed wait that lands either side of it
    runUntil(() => !!state().coreItem, 30);
    const k = state().coreItem;
    const core = k ? at(k.x + 9, k.y + 9) : null;

    // and a mark that would tell you why something has stopped
    window.__give(100000);
    run(2);
    const full = state();
    const warn = at(full.pitX - 30, full.groundY - 42);
    window.__crew(0, 0);
    newRun();
    await sleep(300);
    return [
      ok(sky === 'crosshair' && rock === 'crosshair',
         'the ground state is aiming at a rock', `${sky} / ${rock}`),
      ok(bench === 'pointer', 'a place with a board on it is a thing to open', bench),
      ok(minus === 'pointer', 'and so are the counts under a station', minus),
      // and the target is a good deal bigger than the mark you aim at: the mark
      // is a bar in a slot four cells square, and there is no box round it to
      // say where the edge is, so the edge is generous instead
      ok(r.hitW >= 36 && r.hitH >= 48, 'with a target well past the mark itself',
         `${r.hitW}x${r.hitH} for an 18x2 mark`),
      ok(at(r.less[0], r.less[1] - 16) === 'pointer' &&
         at(r.less[0] - 16, r.less[1]) === 'pointer',
         'so a near miss still lands on it'),
      ok(at((r.less[0] + r.more[0]) / 2, r.less[1]) !== 'pointer',
         'and the count between them is still not a button'),
      ok(core === 'grab', 'a loose core is a thing to pick up', `${core}`),
      // The hole cannot stop anything (the first grain it refuses tears the
      // rift), so it carries no mark and no help cursor. The stations still
      // carry their marks; the stations group hovers one for the tooltip half.
      ok(warn === 'crosshair',
         'and the hole, which cannot stop any more, is not a thing to ask', warn)
    ];
  }],

  // Handed to `fatal` rather than thrown: a real uncaught error is what the
  // suite's own listener counts as a failed run, and a throw inside a frame
  // would stop the loop for every group after this one. The autosave guard is
  // checked in the node tier (test/crash.test.mjs).
  ['a throw stops the game and offers the save', async () => {
    newRun();
    await settle();
    window.__crew(1, 1);
    run(5);
    const sheet = document.getElementById('crashed');
    const before = sheet.hidden;
    fatal(new Error('the yard fell over'));
    const up = !sheet.hidden;
    const why = sheet.querySelector('.why').textContent;
    const known = window.__state().fatal;
    document.getElementById('copysave').click();
    await sleep(100);
    const said = sheet.querySelector('.said').textContent;
    // and put back, so the groups after this one have a live page
    S.fatal = '';
    sheet.hidden = true;
    sheet.querySelector('.said').textContent = '';
    window.__crew(0, 0);
    return [
      ok(before, 'the sheet is down while the game runs'),
      ok(up, 'and up once something has thrown'),
      ok(/the yard fell over/.test(why), 'saying what, in the browser\'s words', why),
      ok(/the yard fell over/.test(known), 'and the yard knows it has stopped', known),
      ok(/copied \d+kb|in window\.__save/.test(said),
         'and the save comes out of the sheet', said),
    ];
  }],
];
