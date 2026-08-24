// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench, lab, school, casino } from './state.js';
import { UPGRADES, markSectionsSeen } from './upgrades.js';
import { LAB_UPGRADES, markLabSeen } from './lab.js';
import { SCHOOL_UPGRADES } from './school.js';
import { CASINO_UPGRADES } from './casino.js';
import { refresh } from './shop.js';
import { now } from './clock.js';

const shopEl = document.getElementById('shop');
const labShopEl = document.getElementById('labshop');
const schoolShopEl = document.getElementById('schoolshop');
const casinoShopEl = document.getElementById('casinoshop');
const panelEl = document.getElementById('panel');
const purseEl = document.getElementById('purse');
const pages = { bench: document.getElementById('board'), lab: document.getElementById('lab'),
                school: document.getElementById('school'), casino: document.getElementById('casino') };
const standAt = { bench, lab, school, casino };

// near enough to a thing on the ground to be interested in it
const near = (r, x, y) => x > r.x - P * 8 && x < r.x + r.w + P * 8 &&
                          y > r.y - P * 8 && y < r.y + r.h + P * 4;

export const nearBench = (x, y) => S.seenBench && near(bench, x, y);
export const nearLab = (x, y) => S.labOpen && near(lab, x, y);
export const nearSchool = (x, y) => S.schoolOpen && near(school, x, y);
export const nearCasino = (x, y) => S.casinoOpen && near(casino, x, y);

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
let putX = null, putY = null;

function place(el, at) {
  const w = sized.w || el.offsetWidth, h = sized.h || el.offsetHeight;
  const want = (at.x - S.camX) * S.zoom;
  const x = Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)));

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;
  const bottom = Math.round(Math.max(GAP, Math.min(stands, S.H - h - GAP)));
  const y = Math.round(S.H - bottom - h);

  if (x === putX && y === putY) return;         // it has not moved: leave the layer alone
  putX = x;
  putY = y;
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
  S.schoolBoardOpen = want === 'school';
  S.casinoBoardOpen = want === 'casino';

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
  // Fill it before measuring it. The rows are written by `refresh`, which runs
  // in the frame loop -- so a board that was measured the moment it opened was
  // measured with every row still blank, came out shorter than it would be, and
  // was seated by that height for as long as it stayed open. It only looked
  // wrong the first time: the next open measured a board that already had its
  // words in. Which is why it read as a bug that fixed itself.
  fill(want);
  fillPurse();
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

// The numbers on whichever board is open. Pulled out of `hud` so that opening a
// board can fill it before it is measured, rather than a frame after.
function fill(which) {
  if (which === 'bench') refresh(shopEl, UPGRADES, headcount);
  // the lab board being open is what reads its news, whether it was already
  // open when the work finished or you walked over because of the mark
  if (which === 'lab') { markLabSeen(); refresh(labShopEl, LAB_UPGRADES, null); }
  if (which === 'school') refresh(schoolShopEl, SCHOOL_UPGRADES, null);
  if (which === 'casino') refresh(casinoShopEl, CASINO_UPGRADES, null);
}

// What you have to spend, beside the board that is asking for it. Every price on
// these boards is a mark and a number, and the only place you could see what you
// *had* of that mark was the counter over the pit -- the other end of the yard,
// in the corner of the window, and as often as not behind the board itself.
//
// A currency appears the first time you have seen one, which is the same rule
// the counter over the pit goes by: nothing in this game names a thing you have
// not met.
const PURSE = [
  ['dust', () => true, () => S.stored],
  ['core', () => S.seenCore, () => S.cores],
  ['shard', () => S.seenShard, () => S.shards],
  ['spore', () => S.seenSpore, () => S.spores]
];

// Written only when it changes. This runs every frame a board is open, and
// `innerHTML` is a parse: re-parsing four rows sixty times a second for a number
// that moves when a worker tips a load in is the same waste the shop rows were
// careful about.
let purseWas = null;
function fillPurse() {
  let html = '';
  for (const [mark, seen, count] of PURSE) {
    if (!seen()) continue;
    html += `<div class="coin"><i class="${mark}"></i><b>${fmt(count())}</b></div>`;
  }
  if (html === purseWas) return;
  // A row appearing or going makes the panel a different size, and the panel is
  // seated by the size it was measured at. A digit does not: the count sits in a
  // slot of its own width so the board cannot twitch as the dust comes in.
  const resized = purseWas === null || purseWas.length !== html.length;
  purseWas = html;
  purseEl.innerHTML = html;
  if (resized) remeasure();
}

export function hud() {
  tweenCount(now());
  fillPurse();
  fill(at);
  // A board is placed when it opens, and it is empty at that moment: its rows
  // are filled on the next frame, and a board that grew a row after being
  // seated could end up hanging off the top of a short window. Seating it every
  // frame is a couple of style writes and it can never be wrong.
  placeBoard();
}

