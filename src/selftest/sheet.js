// The board as a sheet from the bottom (DESIGN.md, "Boards as bottom
// sheets"): under a coarse pointer the panel is the window's width with its
// top at SHEET_H, the handle drags it between its three stops, the purse
// lies inside it and the crew list opens as a page in it; and with the
// pointer fine again the desk's popover measures and seats exactly as it
// did. The pips on every board are boxes at a fixed pitch, so at a phone's
// width no two of them can land on each other.

import { sleep, state, ok, run, raf, haveBench, settle, asScreen, openCrewList, hoverStation, touch, tap } from './kit.js';
import { workOn } from '../works.js';
import { SHEET_H, SHEET_TALL, SHEET_DISMISS, SHEET_MS, SHEET_RAIL_W } from '../config.js';
import { S } from '../state.js';
import { sheetRail } from '../board.js';

// The list of rows inside the sheet, the thing that scrolls.
const list = () => panel().querySelector(':scope > .sheet:not(.flyout)');

// A finger on the list, pulled `dy` down over a few moves and lifted: the
// platform would scroll the list; the game takes the pull for the sheet only
// when the list is at its top.
async function pullList(dy) {
  const el = list();
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + 20;
  touch('touchstart', el, x, y, 6);
  let prevented = false;
  for (let i = 1; i <= 6; i++) { prevented = touch('touchmove', el, x, y + dy * i / 6, 6) || prevented; await raf(); }
  touch('touchend', el, x, y + dy, 6);
  await settled();
  return prevented;
}

const phone = on => window.__coarse(on ? true : null);
const panel = () => document.getElementById('panel');
const handle = () => document.getElementById('handle');
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const settled = async () => { await sleep(SHEET_MS + 60); await frames(2); };

// The handle in hand: a press at its middle, moved `dy` down (up when
// negative) over a few moves, and let go.
async function dragHandle(dy, el = handle()) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ev = (type, at, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: at, pointerId: 5, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
  ev('pointerdown', y);
  for (let i = 1; i <= 6; i++) { ev('pointermove', y + dy * i / 6); await raf(); }
  ev('pointerup', y + dy, 0);
  await settled();
}

// A touch that begins somewhere and ends somewhere else, through the pointer
// events a finger raises: `from` and `to` are page points, and the events go
// to whatever stands at `from` (the platform's rule for a touch).
async function stroke(from, to) {
  const el = document.elementFromPoint(from.x, from.y);
  const ev = (type, x, y, buttons = 1) => el.dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 9, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true, cancelable: true }));
  touch('touchstart', el, from.x, from.y, 9);
  ev('pointerdown', from.x, from.y);
  for (let i = 1; i <= 6; i++) { const x = from.x + (to.x - from.x) * i / 6, y = from.y + (to.y - from.y) * i / 6; touch('touchmove', el, x, y, 9); ev('pointermove', x, y); await raf(); }
  ev('pointerup', to.x, to.y, 0);
  touch('touchend', el, to.x, to.y, 9);
  await settled();
  return el;
}

const rect = () => panel().getBoundingClientRect();

export const TESTS = [
  ['on a phone a board is a sheet from the bottom, dragged between three stops', async () => {
    window.__nocine();
    await haveBench();
    phone(true);
    window.__board('bench');
    await settled();
    const s = state();
    const r0 = rect();
    const fullWidth = Math.abs(r0.width - s.W) <= 2 && r0.left <= 1;
    // the box is the tall stop's, slid down: its top at the seat, its foot below the window
    const atSeat = Math.abs(r0.top - s.H * SHEET_H) <= 2 && r0.bottom >= s.H - 1;
    const grip = handle().querySelector('.grip').getBoundingClientRect();
    const gripOnTop = Math.abs((grip.left + grip.width / 2) - s.W / 2) <= 2 && grip.top - r0.top < 12;
    const purse = document.getElementById('purse').getBoundingClientRect();
    const purseInside = purse.top >= r0.top && purse.bottom <= r0.bottom && purse.left >= r0.left && purse.right <= r0.right;
    const named = handle().querySelector('.name').textContent.trim();
    // up past the seat: tall
    await dragHandle(-120);
    const r1 = rect();
    const tall = Math.abs(r1.height - s.H * SHEET_TALL) <= 2;
    // down a little: back to the seat, not gone
    await dragHandle(r1.height * SHEET_DISMISS + 20);
    const r2 = rect();
    const backToSeat = !panel().hidden && Math.abs(r2.top - s.H * SHEET_H) <= 2;
    // and down past a third from the seat: gone
    await dragHandle(r2.height * SHEET_DISMISS + 20);
    const gone = panel().hidden;
    phone(false);
    await frames(2);
    return [
      ok(fullWidth, 'the sheet is the window\'s width', `${Math.round(r0.left)}+${Math.round(r0.width)} of ${s.W}`),
      ok(atSeat, 'with its top at SHEET_H of the window, standing on the foot', `top ${Math.round(r0.top)} vs ${Math.round(s.H * SHEET_H)}`),
      ok(gripOnTop, 'the grip centered on its top edge', `${Math.round(grip.left + grip.width / 2)} vs ${s.W / 2}`),
      ok(named === 'the bench', 'the board\'s name beside the grip', named),
      ok(purseInside, 'the purse lies inside it'),
      ok(tall, 'dragged up past its seat it is tall', `${Math.round(r1.height)} vs ${Math.round(s.H * SHEET_TALL)}`),
      ok(backToSeat, 'dragged down a third from tall it is back at the seat', `top ${Math.round(r2.top)}`),
      ok(gone, 'and down a third from the seat it is gone'),
    ];
  }],

  ['a gesture that begins on the sheet is the sheet\'s wherever it ends; a tap outside closes; a drag from the yard buys nothing', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 90000 });
    run(0.5);
    phone(true);
    window.__board('bench');
    await settled();
    const el = list();
    const r = rect();
    // a scroll of the rows that lifts 200 px above the sheet: the list has
    // scrolled and the sheet is still up
    el.scrollTop = 0;
    const from = { x: r.left + r.width / 2, y: r.top + 80 };
    const startedOn = await stroke(from, { x: from.x, y: r.top - 200 });
    el.scrollTop = 60;                              // the platform's scroll, stood in for
    await frames(2);
    const stillUp = !panel().hidden && state().boardOpen;
    // a tap outside, on the yard above it, closes it
    const sky = { x: state().W / 2, y: r.top - 120 };
    await stroke(sky, sky);
    await frames(2);
    await sleep(300);
    const closed = panel().hidden || !state().boardOpen;
    // a drag that begins on the yard and ends on a row buys nothing
    window.__board('bench');
    await settled();
    const row = document.querySelector('#shop button.tile:not(:disabled):not(.off)');
    const rr = row.getBoundingClientRect();
    const had = state().stored;
    await stroke({ x: state().W / 2, y: rect().top - 120 }, { x: rr.left + rr.width / 2, y: rr.top + rr.height / 2 });
    await frames(2);
    const bought = state().stored < had || !!workOn(row.dataset.key);
    window.__board(null);
    phone(false);
    await frames(2);
    return [
      ok(startedOn && el.contains(startedOn), 'the scroll began on the rows'),
      ok(stillUp, 'and lifting the finger over the yard leaves the sheet up, the list scrolled'),
      ok(closed, 'a tap on the yard above it puts it away'),
      ok(!bought, 'a drag from the yard that ends on a row buys nothing', `${had} -> ${state().stored}`),
    ];
  }],

  ['the settings sheet is a sheet like the boards\': the same gesture reaches the same stops', async () => {
    window.__nocine();
    await haveBench();
    phone(true);
    // the bench, dragged tall then back, and the transforms it lands on
    window.__board('bench');
    await settled();
    const tf = () => panel().style.transform;
    const seatBoard = tf();
    await dragHandle(-160);
    const tallBoard = tf();
    await dragHandle(rect().height * SHEET_DISMISS + 30);
    const backBoard = tf();
    window.__board(null);
    await settled();
    // the settings sheet, the very same gestures on its own handle
    await tap(document.getElementById('gear'));
    await frames(2); await sleep(SHEET_MS + 60);
    const held = document.getElementById('held'), hh = document.getElementById('heldhandle');
    const seatHeld = held.style.transform;
    await dragHandle(-160, hh);
    const tallHeld = held.style.transform;
    await dragHandle(held.getBoundingClientRect().height * SHEET_DISMISS + 30, hh);
    const backHeld = held.style.transform;
    // and pulled down past a third from the seat, it goes -- slid off, no fade
    await dragHandle(held.getBoundingClientRect().height * SHEET_DISMISS + 30, hh);
    const gone = held.hidden && !state().paused;
    phone(false);
    await frames(2);
    return [
      ok(seatBoard === seatHeld, 'both sheets stand at the same seat', `${seatBoard} vs ${seatHeld}`),
      ok(tallBoard === tallHeld && tallBoard !== seatBoard, 'dragged up, both reach the same tall stop', `${tallBoard} vs ${tallHeld}`),
      ok(backBoard === backHeld && backBoard === seatBoard, 'and dragged down a third, both come back to the seat', `${backBoard} vs ${backHeld}`),
      ok(gone, 'and from the seat the same pull puts the settings away'),
    ];
  }],

  ['the list pulled down from its top pulls the sheet down; scrolled, it only scrolls', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 90000 });
    run(0.5);
    phone(true);
    window.__board('shack');
    await settled();
    const el = list();
    const overflows = el.scrollHeight > el.clientHeight + 1;
    const contain = getComputedStyle(el).overscrollBehaviorY;
    // scrolled a little: a pull is the list's, and the sheet stays
    el.scrollTop = 40;
    await raf();
    const took1 = await pullList(rect().height * SHEET_DISMISS + 30);
    const stayed = !panel().hidden;
    // back at the top: the same pull is the sheet's, through its stops
    el.scrollTop = 0;
    await raf();
    const took2 = await pullList(rect().height * SHEET_DISMISS + 30);
    const gone = panel().hidden;
    phone(false);
    await frames(2);
    return [
      ok(overflows, 'the shack board has more rows than the seat shows'),
      ok(contain === 'contain', 'the list keeps its overscroll to itself', contain),
      ok(!took1 && stayed, 'pulled with the list scrolled, the sheet stays', `took ${took1}`),
      ok(took2 && gone, 'pulled from the very top, the sheet goes', `took ${took2}, hidden ${gone}`),
    ];
  }],

  ['the sheet draws its own scrollbar while the rows overflow, and none when they fit', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 90000 });
    run(0.5);
    const out = { long: null, fits: null };
    await asScreen(390, 844, 3, async () => {
      phone(true);
      window.__board('bench');
      await settled();
      const el = list();
      const rail = sheetRail();
      out.long = { over: el.scrollHeight > el.clientHeight + 1, rail, share: el.clientHeight / el.scrollHeight,
                   inside: rail && rail.track.right <= rect().right + 1 && rail.track.top >= rect().top - 1 && rail.track.bottom <= rect().bottom + 1 };
      // scrolled to the foot, the thumb is at the foot
      el.scrollTop = el.scrollHeight;
      await frames(2);
      const r2 = sheetRail();
      out.long.atFoot = r2 && Math.abs(r2.thumb.bottom - r2.track.bottom) <= 2;
      // a board that fits: the books, one ledger, at the tall stop
      window.__board('stats');
      await settled();
      await dragHandle(-200);
      const el2 = list();
      out.fits = { over: el2.scrollHeight > el2.clientHeight + 1, rail: sheetRail() };
      window.__board(null);
      phone(false);
    });
    const ratio = out.long.rail ? out.long.rail.thumb.height / out.long.rail.track.height : 0;
    return [
      ok(out.long.over && !!out.long.rail, 'the bench overflows and wears a rail', `over ${out.long.over}`),
      ok(out.long.rail && Math.abs(ratio - out.long.share) * out.long.rail.track.height <= SHEET_RAIL_W,
         'the thumb is the viewport\'s share of the rows, within a cell', `${ratio.toFixed(3)} vs ${out.long.share.toFixed(3)}`),
      ok(!!out.long.inside, 'and stands inside the sheet'),
      ok(!!out.long.atFoot, 'scrolled to the foot, the thumb is at the foot'),
      ok(out.fits && !out.fits.over && out.fits.rail === null, 'a board that fits wears none', `over ${out.fits && out.fits.over}`),
    ];
  }],

  ['the crew list opens as a page inside the sheet, never outside the window', async () => {
    window.__nocine();
    window.__crew(3, 2);
    run(0.5);
    phone(true);
    window.__board('house');
    await settled();
    const door = await openCrewList();
    await settled();
    const s = state();
    const list = document.getElementById('crewlist');
    const lr = list.getBoundingClientRect();
    const pr = rect();
    const inside = !list.hidden && lr.left >= pr.left - 1 && lr.right <= pr.right + 1 && lr.top >= pr.top - 1 && lr.bottom <= pr.bottom + 1;
    const inWindow = lr.right <= s.W + 1 && lr.bottom <= s.H + 1 && lr.left >= -1;
    const rowsHidden = getComputedStyle(panel().querySelector(':scope > .sheet:not(.flyout)')).display === 'none';
    const back = document.getElementById('listback');
    const backShown = !back.hidden;
    back.click();
    await settled();
    const closed = list.hidden;
    phone(false);
    window.__board(null);
    await frames(2);
    return [
      ok(!!door, 'the house board has its door'),
      ok(inside, 'the list opens inside the sheet', `list ${Math.round(lr.left)},${Math.round(lr.top)} ${Math.round(lr.width)}x${Math.round(lr.height)} in ${Math.round(pr.left)},${Math.round(pr.top)} ${Math.round(pr.width)}x${Math.round(pr.height)}`),
      ok(inWindow, 'and inside the window'),
      ok(rowsHidden, 'in place of the board\'s rows'),
      ok(backShown && closed, 'and the arrow beside the grip brings the rows back'),
    ];
  }],

  ['the desk\'s popover measures and seats as it did once the pointer is fine again', async () => {
    window.__nocine();
    await haveBench();
    phone(false);
    window.__board('bench');
    await settle(0.6);
    const fitBefore = window.__boardFit();
    const rBefore = rect();
    // a phone for a moment, and back
    phone(true);
    await settled();
    const asSheet = panel().classList.contains('bottom');
    phone(false);
    await settled();
    window.__placeBoard();
    await settle(0.3);
    const fitAfter = window.__boardFit();
    const rAfter = rect();
    window.__board(null);
    return [
      ok(asSheet, 'the open board became a sheet on the phone'),
      ok(!panel().classList.contains('bottom') && handle().hidden, 'and a popover again on the desk'),
      ok(fitAfter.w === fitBefore.w && fitAfter.h === fitBefore.h && fitAfter.realW === fitBefore.realW,
         'measuring the same', `${JSON.stringify(fitBefore)} vs ${JSON.stringify(fitAfter)}`),
      ok(Math.abs(rAfter.left - rBefore.left) <= 1 && Math.abs(rAfter.top - rBefore.top) <= 1,
         'and seated where it was', `${Math.round(rBefore.left)},${Math.round(rBefore.top)} vs ${Math.round(rAfter.left)},${Math.round(rAfter.top)}`),
    ];
  }],

  ['no two pips on any board land on each other at a phone\'s width', async () => {
    window.__nocine();
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9, dust: 90000 });
    window.__levels({ carryLevel: 3, speedLevel: 5, haulCarryLevel: 4, quarryPaceLevel: 5, tendLevel: 3 });
    run(0.5);
    const bad = [], seen = [];
    const meet = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
    await asScreen(390, 844, 3, async () => {
      phone(true);
      for (const which of Object.keys(state().stands)) {
        window.__board(which);
        await settled();
        for (const ladder of document.querySelectorAll('#panel .page:not([hidden]) .ladder')) {
          const groups = [...ladder.querySelectorAll('b')];
          if (!groups.length) continue;
          seen.push(which);
          const gr = groups.map(g => g.getBoundingClientRect());
          for (let i = 0; i < gr.length; i++) for (let j = i + 1; j < gr.length; j++)
            if (meet(gr[i], gr[j])) bad.push(`${which}: two bands of ${ladder.closest('button')?.dataset.key} meet`);
          const pips = [...ladder.querySelectorAll('i')].map(p => p.getBoundingClientRect());
          for (let i = 1; i < pips.length; i++)
            if (meet(pips[i - 1], pips[i])) bad.push(`${which}: pips of ${ladder.closest('button')?.dataset.key} meet`);
        }
      }
      window.__board(null);
      phone(false);
    });
    return [
      ok(seen.length > 3, 'several boards carry ladders', `${seen.length}`),
      ok(bad.length === 0, 'and on none of them do two pips or two bands meet', bad.slice(0, 4).join('; ')),
    ];
  }],
];
