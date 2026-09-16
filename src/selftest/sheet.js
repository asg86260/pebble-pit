// The board as a sheet from the bottom (DESIGN.md, "Boards as bottom
// sheets"): under a coarse pointer the panel is the window's width with its
// top at SHEET_H, the handle drags it between its three stops, the purse
// lies inside it and the crew list opens as a page in it; and with the
// pointer fine again the desk's popover measures and seats exactly as it
// did. The pips on every board are boxes at a fixed pitch, so at a phone's
// width no two of them can land on each other.

import { sleep, state, ok, run, raf, haveBench, settle, asScreen, openCrewList, hoverStation } from './kit.js';
import { SHEET_H, SHEET_TALL, SHEET_DISMISS, SHEET_MS } from '../config.js';
import { S } from '../state.js';

const phone = on => window.__coarse(on ? true : null);
const panel = () => document.getElementById('panel');
const handle = () => document.getElementById('handle');
const frames = async n => { for (let i = 0; i < n; i++) { run(1 / 60); await raf(); } };
const settled = async () => { await sleep(SHEET_MS + 60); await frames(2); };

// The handle in hand: a press at its middle, moved `dy` down (up when
// negative) over a few moves, and let go.
async function dragHandle(dy) {
  const r = handle().getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ev = (type, at, buttons = 1) => handle().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: at, pointerId: 5, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
  ev('pointerdown', y);
  for (let i = 1; i <= 6; i++) { ev('pointermove', y + dy * i / 6); await raf(); }
  ev('pointerup', y + dy, 0);
  await settled();
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
    const atSeat = Math.abs(r0.top - s.H * SHEET_H) <= 2 && Math.abs(r0.bottom - s.H) <= 1;
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
