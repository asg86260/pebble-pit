// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench, lab } from './state.js';
import { UPGRADES } from './upgrades.js';
import { LAB_UPGRADES } from './lab.js';
import { refresh, refreshStats } from './shop.js';

const shopEl = document.getElementById('shop');
const boardEl = document.getElementById('board');
const labShopEl = document.getElementById('labshop');
const labEl = document.getElementById('lab');

// near enough to a thing on the ground to be interested in it
const near = (r, x, y) => x > r.x - P * 8 && x < r.x + r.w + P * 8 &&
                          y > r.y - P * 8 && y < r.y + r.h + P * 4;

export const nearBench = (x, y) => near(bench, x, y);
export const nearLab = (x, y) => S.labOpen && near(lab, x, y);

// The board stands on the bench, but it is a real element on a real screen: on a
// phone the bench can be near an edge, or there can be less room above it than
// the board is tall. So it is put where the bench is and then pushed back inside
// the window rather than being allowed to hang off it.
function place(el, at) {
  el.style.top = 'auto';
  el.style.left = '0px';                             // measure it unsqueezed first
  const w = el.offsetWidth, h = el.offsetHeight;

  const want = (at.x - S.camX) * S.zoom;
  el.style.left = `${Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)))}px`;

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;
  el.style.bottom = `${Math.round(Math.max(GAP, Math.min(stands, S.H - h - GAP)))}px`;
}

const GAP = 4;                             // never flush against the edge

export function placeBoard() {
  if (S.boardOpen) place(boardEl, bench);
  if (S.labBoardOpen) place(labEl, lab);
}

// dev: seat both boards wherever they belong, open or not, so a check can look
// at where they would go without going through the whole opening dance
window.__placeBoard = () => { place(boardEl, bench); place(labEl, lab); };

export function showBoard(open) {
  if (open === S.boardOpen) return;
  S.boardOpen = open;
  boardEl.hidden = !open;
  if (open) place(boardEl, bench);
}

export function showLab(open) {
  if (open === S.labBoardOpen) return;
  S.labBoardOpen = open;
  labEl.hidden = !open;
  if (open) { refreshStats(); place(labEl, lab); }
}

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
  title === 'workers' ? S.haulers :
  title === 'miners' ? S.miners :
  title === 'the cave' ? S.spelunkers :
  title === 'the farm' ? S.farmhands : 0;

export function hud() {
  tweenCount(performance.now());
  if (S.boardOpen) refresh(shopEl, UPGRADES, headcount);
  if (S.labBoardOpen) { refresh(labShopEl, LAB_UPGRADES, null); refreshStats(); }
}

