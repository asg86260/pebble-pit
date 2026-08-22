// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench, lab } from './state.js';
import { UPGRADES, markSectionsSeen } from './upgrades.js';
import { LAB_UPGRADES } from './lab.js';
import { refresh } from './shop.js';
import { now } from './clock.js';

const shopEl = document.getElementById('shop');
const labShopEl = document.getElementById('labshop');
const panelEl = document.getElementById('panel');
const pages = { bench: document.getElementById('board'), lab: document.getElementById('lab') };
const standAt = { bench, lab };

// near enough to a thing on the ground to be interested in it
const near = (r, x, y) => x > r.x - P * 8 && x < r.x + r.w + P * 8 &&
                          y > r.y - P * 8 && y < r.y + r.h + P * 4;

export const nearBench = (x, y) => S.seenBench && near(bench, x, y);
export const nearLab = (x, y) => S.labOpen && near(lab, x, y);

// The board stands on the bench, but it is a real element on a real screen: on a
// phone the bench can be near an edge, or there can be less room above it than
// the board is tall. So it is put where the bench is and then pushed back inside
// the window rather than being allowed to hang off it.
// Moved with a transform rather than with `left` and `bottom`. Those are layout:
// animating them makes the browser lay the page out again every frame of the
// slide, which is exactly what a menu sliding along in steps looks like. A
// transform is handed to the compositor and moves smoothly.
// Measured when it opens, when it changes page and when the window changes --
// not every frame. Reading `offsetWidth` forces the browser to lay the page out,
// and doing that sixty times a second for a menu whose size did not change is
// work for nothing.
let sized = { w: 0, h: 0 };
export function remeasure() {
  sized = { w: panelEl.offsetWidth, h: panelEl.offsetHeight };
}

// And it is only written when it actually moves. Assigning the same transform
// every frame invalidates the layer the menu is drawn on, sixty times a second,
// over a canvas that is also repainting -- which is a good way to make a menu
// flicker for no reason anybody can see in the code.
let put = '';

function place(el, at) {
  const w = sized.w || el.offsetWidth, h = sized.h || el.offsetHeight;
  const want = (at.x - S.camX) * S.zoom;
  const x = Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)));

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;
  const bottom = Math.round(Math.max(GAP, Math.min(stands, S.H - h - GAP)));
  const y = Math.round(S.H - bottom - h);

  const to = `translate3d(${x}px, ${y}px, 0)`;
  if (to !== put) { el.style.transform = to; put = to; }
}

const GAP = 4;                             // never flush against the edge

export function placeBoard() {
  if (at) place(panelEl, standAt[at]);
}

// dev: seat both boards wherever they belong, open or not, so a check can look
// at where they would go without going through the whole opening dance
window.__placeBoard = () => place(panelEl, standAt[at] || bench);

// The one bit of writing in the yard. Everything else here is a mark you learn,
// but a station that has stopped needs to say why in words the first time, and a
// tooltip is the only place words are cheap: it is not on screen until asked for.
const tipEl = document.getElementById('tip');
let tipFor = null;

export function showTip(text, at) {
  if (!text) {
    if (tipFor !== null) { tipEl.hidden = true; tipFor = null; }
    return;
  }
  if (text !== tipFor) { tipEl.textContent = text; tipEl.hidden = false; tipFor = text; }
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  const x = (at.x - S.camX) * S.zoom - w / 2;
  const y = (at.y - S.camY) * S.zoom + P * 4;
  tipEl.style.left = `${Math.round(Math.max(GAP, Math.min(x, S.W - w - GAP)))}px`;
  tipEl.style.top = `${Math.round(Math.max(GAP, Math.min(y, S.H - h - GAP)))}px`;
}

// One menu for both stations. It is a thing standing in the yard rather than two
// things blinking on and off: it fades up where you are, and when you walk from
// the bench to the lab it walks with you.
//
// The slide is only switched on while it is actually moving between stations.
// The menu is re-seated every frame -- it has to be, or scrolling would leave it
// behind -- and a transition on `left` would turn every one of those into a
// two-hundred-millisecond lag behind the yard.
let at = null;
let slide = 0;
let closing = 0;

export function showPanel(want) {
  if (want === at) return;
  const wasAt = at;
  at = want;
  S.boardOpen = want === 'bench';
  S.labBoardOpen = want === 'lab';

  if (!want) {                                   // fade out where it stands
    panelEl.classList.remove('open');
    clearTimeout(closing);
    closing = setTimeout(() => {
      if (at) return;                            // opened again on the way out
      panelEl.hidden = true;
      for (const k of Object.keys(pages)) pages[k].hidden = true;
    }, 140);
    return;
  }

  clearTimeout(closing);
  for (const k of Object.keys(pages)) pages[k].hidden = k !== want;
  // opening the bench reads every heading on it, the same as it always did
  if (want === 'bench') markSectionsSeen();
  panelEl.hidden = false;
  remeasure();

  if (wasAt) {                                   // walking from one to the other
    panelEl.classList.add('sliding');
    clearTimeout(slide);
    slide = setTimeout(() => panelEl.classList.remove('sliding'), 240);
  }
  place(panelEl, standAt[want]);
  requestAnimationFrame(() => panelEl.classList.add('open'));
}

// what the rest of the game still asks for, in the words it already used
export const showBoard = open => showPanel(open ? 'bench' : at === 'bench' ? null : at);
export const showLab = open => showPanel(open ? 'lab' : at === 'lab' ? null : at);

export const fmt = n => n.toLocaleString('en-US');

// the count runs to its new value and eases in at the end, taking longer for a
// bigger jump so a purchase reads as a real withdrawal
export function tweenCount(now) {
  if (S.stored !== S.tweenTo) {
    S.tweenFrom = S.shownStored;
    S.tweenTo = S.stored;
    S.tweenAt = now;
    S.tweenMs = Math.max(220, Math.min(900, 180 + Math.abs(S.tweenTo - S.tweenFrom) * 1.6));
  }
  const t = Math.max(0, Math.min(1, (now - S.tweenAt) / S.tweenMs));
  const ease = 1 - Math.pow(1 - t, 3);                  // out-cubic
  S.shownStored = S.tweenFrom + (S.tweenTo - S.tweenFrom) * ease;
}

// how many bodies a section has, so a heading can say so
const headcount = title =>
  title === 'the crew' ? S.crew :
  title === 'the rock' ? S.miners :
  title === 'the quarry' ? S.quarriers :
  title === 'the farm' ? S.farmhands : 0;

export function hud() {
  tweenCount(now());
  if (S.boardOpen) refresh(shopEl, UPGRADES, headcount);
  if (S.labBoardOpen) refresh(labShopEl, LAB_UPGRADES, null);
  // A board is placed when it opens, and it is empty at that moment: its rows
  // are filled on the next frame, and a board that grew a row after being
  // seated could end up hanging off the top of a short window. Seating it every
  // frame is a couple of style writes and it can never be wrong.
  placeBoard();
}

