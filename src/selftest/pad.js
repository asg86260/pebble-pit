// A pad on the page (DESIGN.md, "Controller support"): the focus is real DOM
// focus on a board's rows, A is the row's own click, B puts the board away,
// LB and RB turn to the neighbor's board, Menu holds the yard, and the
// marker stands a cell clear of whatever the focus is on, in the accent.
//
// The pad is a stand-in for the browser's: `navigator.getGamepads` answers
// with a pad this file holds, and the page's own frame (main.js) reads it
// exactly as it reads a real one. Nothing here sets the focus by hand.

import { ok, raf, run, sleep, haveBench, state } from './kit.js';
import { S } from '../state.js';
import { P, PAD_PAGE_CELL } from '../config.js';

const BUTTONS = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, view: 8, menu: 9,
                  l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15 };
const fake = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard',
               buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
const own = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
function plugIn() {
  for (const b of fake.buttons) { b.pressed = false; b.value = 0; }
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
  window.__motion(true);           // the camera and the marker there at once
}
function unplug() {
  window.__pad.off();
  if (own) Object.defineProperty(navigator, 'getGamepads', own);
  else delete navigator.getGamepads;
  window.__motion(null);
}
// A press is a frame down and a frame up, each a frame the page has drawn.
const frames = async n => { for (let i = 0; i < n; i++) await raf(); };
async function press(name) {
  const b = fake.buttons[BUTTONS[name]];
  b.pressed = true; b.value = 1;
  await frames(2);
  b.pressed = false; b.value = 0;
  await frames(2);
}
// Hop along the stops until the focus is on `id`, the way a thumb does it.
async function hopTo(id) {
  for (let i = 0; i < 24 && window.__pad.focus() !== id; i++) {
    const list = window.__pad.stops();
    await press(list.indexOf(id) < list.indexOf(window.__pad.focus()) ? 'left' : 'right');
  }
  return window.__pad.focus() === id;
}

// The accent, read off the canvas: the yard's purple as painted.
const accent = ([r, g, b]) => b > 150 && r > 80 && r < 200 && g < 120;

export const TESTS = [
  ['pad: A on a station opens its board, the d-pad walks its rows, B puts it away', async () => {
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    run(1);
    plugIn();
    try {
      await press('b');                               // wakes the pad
      const reached = await hopTo('st:farm');
      const shutOnArrival = !S.farmBoardOpen;
      await press('a');
      const opened = S.farmBoardOpen;
      await frames(3);
      // The pad's row, which is the page's focus too wherever the row can
      // hold one (a greyed card is disabled and cannot).
      const first = window.__pad.page();
      const inBoard = !!first && document.getElementById('panel').contains(first) && first.tagName === 'BUTTON';
      const real = first && (first.disabled || document.activeElement === first);
      await press('down');
      const second = window.__pad.page();
      const moved = second !== first && document.getElementById('panel').contains(second);
      await press('b');
      await frames(2);
      return [
        ok(reached, 'the d-pad got the focus to the farm', window.__pad.focus()),
        ok(shutOnArrival, 'arriving there opened nothing'),
        ok(opened, 'A opened the farm board'),
        ok(inBoard, "and the focus went to a row on it", first && (first.dataset.key || first.id)),
        ok(real, "which holds the page's own focus unless it is greyed", document.activeElement && document.activeElement.tagName),
        ok(moved, 'down moved it to another row', second && (second.dataset.key || second.id)),
        ok(!S.farmBoardOpen && window.__pad.focus() === 'st:farm', 'B put the board away and the focus is the farm again'),
      ];
    } finally { unplug(); }
  }],

  // Buy it like a player: from the yard to a bought row, pad presses alone.
  ['pad: a purchase made with the pad alone', async () => {
    await haveBench();
    window.__give(5000);
    run(0.5);
    plugIn();
    try {
      await press('b');
      const reached = await hopTo('st:bench');
      await press('a');
      await frames(3);
      // Walk the bench's rows until the focus is on one that can be bought.
      const buyable = el => el && el.dataset?.key && !el.disabled && !el.classList.contains('stat') &&
                            document.getElementById('shop').contains(el);
      for (let i = 0; i < 30 && !buyable(window.__pad.page()); i++) await press(i % 6 < 5 ? 'right' : 'down');
      const row = window.__pad.page();
      const key = row?.dataset?.key;
      const before = S.stored;
      await press('a');
      window.__finish();
      await sleep(100);
      const spent = S.stored < before;
      await press('b');
      return [
        ok(reached && S.boardOpen === false, 'the bench was reached and is put away again', window.__pad.focus()),
        ok(buyable(row), 'the d-pad found a row the purse covers', key),
        ok(spent, 'and A on it bought it', `${Math.round(before)} -> ${Math.round(S.stored)}`),
      ];
    } finally { unplug(); }
  }],

  ['pad: the marker stands a cell clear of the focus, in the accent', async () => {
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    run(1);
    plugIn();
    try {
      await press('b');
      await hopTo('st:quarry');
      await frames(4);
      const box = window.__pad.box();
      const s = state();
      const dpr = devicePixelRatio || 1;
      const g = document.getElementById('c').getContext('2d');
      // The middle of a cell, in device pixels, from its world corner.
      const at = (wx, wy) => g.getImageData(Math.round((wx + P / 2 - s.camX) * s.zoom * dpr),
                                            Math.round((wy + P / 2 - s.camY) * s.zoom * dpr), 1, 1).data;
      const x0 = Math.floor(box.x / P) * P, y0 = Math.floor(box.y / P) * P;
      const x1 = Math.ceil((box.x + box.w) / P) * P - P, y1 = Math.ceil((box.y + box.h) / P) * P - P;
      const corners = [at(x0 - P, y0 - P), at(x1 + P, y0 - P), at(x0 - P, y1 + P), at(x1 + P, y1 + P)];
      const inside = at(x0, y0);
      const halo = at(x0 - 2 * P, y0 - 2 * P);
      return [
        ok(corners.every(c => accent(c)), 'each corner cell a cell out is the accent', corners.map(c => [...c].slice(0, 3).join(',')).join(' | ')),
        ok(!accent(inside), "and the box's own corner is not", [...inside].slice(0, 3).join(',')),
        ok(halo[0] > 240 && halo[1] > 240 && halo[2] > 240, 'a cell further out is the paper halo', [...halo].slice(0, 3).join(',')),
      ];
    } finally { unplug(); }
  }],

  ['pad: on a board the marker is drawn over the row with the focus', async () => {
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    run(1);
    plugIn();
    try {
      await press('b');
      await hopTo('st:farm');
      await press('a');
      await frames(6);
      const row = window.__pad.page();
      const r = row.getBoundingClientRect();
      const sheet = document.getElementById('padmark');
      const dpr = devicePixelRatio || 1, u = PAD_PAGE_CELL;
      const g = sheet.getContext('2d');
      const cx = (Math.floor(r.left / u) - 1) * u + u / 2, cy = (Math.floor(r.top / u) - 1) * u + u / 2;
      const px = g.getImageData(Math.round(cx * dpr), Math.round(cy * dpr), 1, 1).data;
      const mid = g.getImageData(Math.round((r.left + r.width / 2) * dpr), Math.round((r.top + r.height / 2) * dpr), 1, 1).data;
      await press('b');
      return [
        ok(!!sheet && getComputedStyle(sheet).pointerEvents === 'none', 'the marker sheet is over the page and takes no press'),
        ok(accent(px) && px[3] === 255, "the top-left bracket stands a cell out from the row", [...px].join(',')),
        ok(mid[3] === 0, "and the row itself is not covered", [...mid].join(',')),
      ];
    } finally { unplug(); }
  }],

  ['pad: LB and RB turn to the neighbor station\'s board', async () => {
    window.__crew(3, 3, 5, 7);
    window.__fullSites();
    run(1);
    plugIn();
    try {
      await press('b');
      await hopTo('st:farm');
      await press('a');
      const was = window.__pad.focus();
      await press('rb');
      const now = window.__pad.focus();
      const open = Object.keys(S).filter(k => /BoardOpen$|^boardOpen$/.test(k) && S[k]);
      await press('b');
      return [
        ok(was === 'st:farm' && now !== was && now.startsWith('st:'), 'RB moved to the next station', `${was} -> ${now}`),
        ok(open.length === 1 && !S.farmBoardOpen, 'and its board is the one open', open.join(' ')),
      ];
    } finally { unplug(); }
  }],

  ['pad: Menu holds the yard, the sheet is walked, B lets it go', async () => {
    run(0.5);
    plugIn();
    try {
      await press('b');
      await press('menu');
      const held = S.paused;
      await frames(3);
      const first = window.__pad.page();
      await press('down');
      const second = window.__pad.page();
      const sheet = document.getElementById('held');
      await press('b');
      return [
        ok(held, 'Menu held the yard'),
        ok(sheet.contains(first) && sheet.contains(second) && first !== second, "the d-pad walks the sheet's buttons",
           `${first && first.id} -> ${second && second.id}`),
        ok(!S.paused, 'B let the yard go'),
      ];
    } finally { unplug(); }
  }],

  ['pad: View lifts the focus to the corner cards, and back', async () => {
    window.__crew(3, 3);
    run(1);
    plugIn();
    try {
      await press('b');
      const was = window.__pad.focus();
      await press('view');
      const scope = window.__pad.scope();
      const el = window.__pad.page();
      const inCorner = ['topleft', 'corner', 'toast'].some(id => document.getElementById(id)?.contains(el));
      await press('view');
      return [
        ok(scope === 'corner' && inCorner, 'View took the focus to the corner cards', `${scope} ${el && el.id}`),
        ok(window.__pad.scope() === null && window.__pad.focus() === was, 'and View again put it back where it was', window.__pad.focus()),
      ];
    } finally { unplug(); }
  }],

  ['pad: the skip hint wears the pad\'s A while a pad was last touched', async () => {
    window.__reset(true);
    run(0.5);
    plugIn();
    try {
      const space = document.querySelector('#skip .say')?.textContent;
      fake.buttons[BUTTONS.b].pressed = true;    // B means nothing in a scene: it only wakes the pad
      await frames(3);
      fake.buttons[BUTTONS.b].pressed = false;
      await frames(3);
      const glyph = document.querySelector('#skip .say .g');
      return [
        ok(/space/.test(space || ''), 'with the keyboard, the hint names the space bar', space),
        ok(!!glyph && glyph.textContent === 'A', 'with the pad, it wears the A', document.querySelector('#skip .say')?.textContent),
      ];
    } finally { unplug(); window.__skipIntro?.(); }
  }],
];
