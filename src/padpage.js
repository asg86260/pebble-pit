// A pad on the page's own rows (DESIGN.md, "Controller support", "Boards,
// sheets, cards"): the boards, the held sheet, the window, an open list and
// the corner cards are DOM, and their rows are already buttons, so the focus
// there is the page's real focus, moved by the d-pad to the nearest row in
// the pressed direction, and A is the row's own click. Nothing here buys,
// opens or closes anything a click on the same button would not.
//
// Which part of the page has the pad is asked every frame, top layer first:
// a story's sheet, the held sheet, a window, an open list, then a board or
// the corner cards when the pad has gone into one. None of them: the yard
// has it (pad.js).
//
// The marker over a row is the yard's marker, drawn in the page's pixels on
// a sheet of its own over everything (`#padmark`), since a row stands over
// the yard's canvas and a bracket drawn there would be under it.

import { PAD_ACCENT, PAD_HALO, PAD_ARM_MIN, PAD_ARM_MAX, PAD_TIP_MS, PAD_ACROSS } from './config.js';
import { S } from './state.js';
import { openBoard } from './board.js';
import { aim, markAt, bracketCells, haloCells } from './padglide.js';

// The story's sheets, which stand over the held sheet and the yard and are
// put away only by their own buttons.
const SHEETS = ['crashed', 'saved', 'demoend', 'teaseend', 'freed'];
const byId = id => document.getElementById(id);
const shown = el => !!el && !el.hidden && typeof el.getClientRects === 'function' && el.getClientRects().length > 0;

// Whether the pad has gone into the open board, or up to the corner cards.
// Both are the pad's own say: a board the mouse opened by walking up to a
// station is the mouse's until the pad presses A there.
let inBoard = false, inCorner = false;
export const enterBoard = on => { inBoard = on; if (on) inCorner = false; };
// `near`, a point on the page, puts the focus on the corner's row nearest it,
// the one over the thing the d-pad came up from.
export function enterCorner(on, near = null) {
  inCorner = on;
  if (!on) return;
  inBoard = false;
  const sc = near && scope();
  if (!sc || sc.kind !== 'corner') return;
  let best = null, d = Infinity;
  for (const el of focusables(sc)) {
    const e = center(el.getBoundingClientRect()), dd = Math.hypot(e.x - near.x, e.y - near.y);
    if (dd < d) { d = dd; best = el; }
  }
  if (best) focusEl(best);
}
export const boardEntered = () => inBoard && !!openBoard();
export const cornerEntered = () => inCorner;

// The part of the page the pad is on now, or null for the yard.
export function scope() {
  if (typeof document.querySelector !== 'function') return null;
  for (const id of SHEETS) { const el = byId(id); if (shown(el)) return { kind: 'sheet', el: [el] }; }
  if (S.paused) { const el = byId('held'); if (el) return { kind: 'held', el: [el] }; }
  const modal = byId('modal');
  if (shown(modal)) return { kind: 'modal', el: [modal] };
  const list = document.querySelector('.optspop:not([hidden])');
  if (shown(list)) return { kind: 'list', el: [list] };
  if (boardEntered()) return { kind: 'board', el: [byId('panel')] };
  if (inBoard) inBoard = false;                  // the board went away under it
  if (inCorner) return { kind: 'corner', el: ['topleft', 'corner', 'toast'].map(byId).filter(Boolean) };
  return null;
}

// What the d-pad can stand on in a part of the page: the buttons, links and
// sliders that can be seen, and not in an inert part (a settings tab not in
// force, which keeps its place in the layout). A text box is skipped (the design: a keyboard is
// needed for those), and so is a button inside a closed part.
const CAN = 'button, a[href], input[type="range"]';
export function focusables(sc) {
  const out = [];
  for (const root of sc.el) {
    for (const el of root.querySelectorAll(CAN)) {
      if (!shown(el) || el.closest('[inert]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out.push(el);
    }
  }
  return out;
}

// --- the focus ----------------------------------------------------------------
// The pad's focus on a row is the page's focus wherever the row can hold it.
// A greyed card is a disabled button and cannot, so the pad keeps its own
// note of the row (`on`), the marker stands on it, and A on it does what a
// click on it does, which is nothing.
let on = null;          // the row with the focus
let onKey = null;       // and what it was, to find it again after a rebuild
let onRect = null;
let since = 0;          // when it arrived, for the tip
let asked = false;      // whether its hover has been raised yet

const keyOf = el => el && (el.id ? `#${el.id}` : el.dataset?.key ? `k:${el.dataset.key}`
  : el.dataset?.opt ? `o:${el.dataset.opt}` : null);
const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

// A pointer's hover, raised on the row and taken off it: the words a row
// says under the cursor are the words it says under the focus, and nothing
// new is written (DESIGN.md, "The tip").
function hover(el, type) {
  if (!el || typeof PointerEvent === 'undefined') return;
  const c = center(el.getBoundingClientRect());
  for (const t of type === 'in' ? ['pointerenter', 'pointermove'] : ['pointerleave'])
    el.dispatchEvent(new PointerEvent(t, { pointerType: 'mouse', clientX: c.x, clientY: c.y, bubbles: t === 'pointermove' }));
}

export function focusEl(el, t = performance.now()) {
  if (el === on) return;
  if (on && asked) hover(on, 'out');
  on = el;
  onKey = keyOf(el);
  onRect = el ? el.getBoundingClientRect() : null;
  since = t;
  asked = false;
  if (!el) return;
  try { el.focus({ preventScroll: true }); } catch {}
  el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}
export const focused = () => on;
export function dropFocus() {
  if (on && asked) hover(on, 'out');
  on = null; onKey = null; onRect = null; asked = false;
}

// Keep the focus on something that is there: the same row after a rebuild
// (a purchase rebuilds the board), or the nearest one to where it stood.
export function keepFocus(sc, t) {
  const list = focusables(sc);
  if (!list.length) { if (on) dropFocus(); return null; }
  if (on && list.includes(on)) {
    // A row on a board still fading in will not take the page's focus the
    // frame it is asked; asked again until it has.
    if (document.activeElement !== on) try { on.focus({ preventScroll: true }); } catch {}
    return on;
  }
  const same = onKey && list.find(el => keyOf(el) === onKey);
  if (same) { focusEl(same, t); return same; }
  // A page that put the focus somewhere as it turned (settings, on its
  // first row) has it there.
  const put = document.activeElement;
  if (put && list.includes(put)) { focusEl(put, t); return put; }
  let best = list[0];
  if (onRect) {
    const c = center(onRect);
    let d = Infinity;
    for (const el of list) {
      const e = center(el.getBoundingClientRect());
      const dd = Math.hypot(e.x - c.x, e.y - c.y);
      if (dd < d) { d = dd; best = el; }
    }
  }
  focusEl(best, t);
  return best;
}

// The one rule for every d-pad press, on a page's rows, the yard's stops, the
// coil and the bodies alike (the owner, 2026-10-15: "things should just jump
// to the nearest thing that direction"): of the things whose middle stands
// past the edge of `from` that way, the least of how far past plus
// PAD_ACROSS times how far off its middle line, so a thing straight below
// beats one nearer but off to the side. Past the edge, not the middle: a
// thing standing over this one is up from it, never left for being a few
// pixels that side. No cone: anything in that part of the glass can be the
// answer, so nothing that stands is left with no way to it. `from` is a box
// ({ x, y, w, h }, top-left; a point has no w and h); `items` are { x, y }
// middles, with whatever else the caller wants back.
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
export function pickToward(from, dir, items) {
  const [dx, dy] = DIRS[dir];
  const hw = (from.w || 0) / 2, hh = (from.h || 0) / 2;
  const cx = from.x + hw, cy = from.y + hh;
  let best = null, score = Infinity;
  for (const it of items) {
    const ex = it.x - cx, ey = it.y - cy;
    const ahead = ex * dx + ey * dy - (dx ? hw : hh);
    if (ahead <= 1) continue;
    const s = ahead + PAD_ACROSS * Math.abs(ex * dy + ey * dx);
    if (s < score) { score = s; best = it; }
  }
  return best;
}

export function move(sc, dir) {
  const list = focusables(sc);
  if (!list.length) return false;
  if (!on || !list.includes(on)) { keepFocus(sc); return true; }
  // A slider takes left and right as its own.
  if (on.type === 'range' && (dir === 'left' || dir === 'right')) {
    const step = Number(on.step) || 0.1;
    const v = Math.max(Number(on.min) || 0, Math.min(Number(on.max) || 1, Number(on.value) + (dir === 'right' ? step : -step)));
    on.value = String(v);
    on.dispatchEvent(new Event('input', { bubbles: true }));
    on.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  const a = on.getBoundingClientRect();
  const best = pickToward({ x: a.left, y: a.top, w: a.width, h: a.height }, dir, list.filter(el => el !== on).map(el => ({ ...center(el.getBoundingClientRect()), el })));
  if (!best) return false;
  focusEl(best.el);
  return true;
}

// --- the presses --------------------------------------------------------------
// A: the row's own click. A card whose strip stands takes presses only on
// its halves (DESIGN.md, "Refund and another"), so A is the buy half there.
export function pressA() {
  if (!on) return false;
  if (on.type === 'range') return true;
  const another = on.classList.contains('stripped') && on.querySelector('.strip:not([hidden]) .another');
  (another || on).click();
  return true;
}
// X (the owner, 2026-10-15: X cancels, not Y): hand back the newest copy
// still waiting -- the card's refund half, the barrier card's cancel, or a
// line on the queue card, whose click is the hand-back. On a card with none,
// its second thing where it has one: the list a dial opens.
export function pressX() {
  if (!on) return false;
  const back = on.querySelector?.('.strip:not([hidden]) .refund')
    || on.closest?.('.track, [data-mode="build"]')?.querySelector('.cancel');
  if (back && back !== on) { back.click(); return true; }
  if (on.closest?.('#queue')) { on.click(); return true; }
  const list = on.closest?.('.pickrow')?.querySelector('.chosen');
  if (list && list !== on) { list.click(); return true; }
  return false;
}

// --- the marker over a row, and its tip ---------------------------------------
let sheet = null, sheetCtx = null;
function mount() {
  if (sheet || typeof document.createElement !== 'function' || !document.body?.appendChild) return;
  sheet = document.createElement('canvas');
  sheet.id = 'padmark';
  sheet.setAttribute?.('aria-hidden', 'true');
  document.body.appendChild(sheet);
  sheetCtx = sheet.getContext('2d');
}

let wiped = true;
// Once a frame: aim the marker at the row with the focus, paint it, and once
// it has landed raise the row's hover for its words.
export function paintPage(t, live) {
  mount();
  if (!sheet || !sheetCtx) return;
  const dpr = devicePixelRatio || 1;
  const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
  if (sheet.width !== W || sheet.height !== H) { sheet.width = W; sheet.height = H; wiped = true; }
  if (!wiped) { sheetCtx.setTransform(1, 0, 0, 1, 0, 0); sheetCtx.clearRect(0, 0, W, H); wiped = true; }
  if (!live || !on) return;
  const b = on.getBoundingClientRect();
  if (!b.width) return;
  onRect = b;
  aim(`page:${onKey || ''}`, { x: b.left, y: b.top, w: b.width, h: b.height }, 'page', t);
  const m = markAt(t);
  if (!m || m.space !== 'page') return;
  const u = m.unit;
  const cells = bracketCells(m.r, m.out, u, PAD_ARM_MIN, PAD_ARM_MAX);
  sheetCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sheetCtx.globalAlpha = m.alpha;
  sheetCtx.fillStyle = PAD_HALO;
  for (const [x, y] of haloCells(cells)) sheetCtx.fillRect(x * u, y * u, u, u);
  sheetCtx.fillStyle = PAD_ACCENT;
  for (const [x, y] of cells) sheetCtx.fillRect(x * u, y * u, u, u);
  sheetCtx.globalAlpha = 1;
  wiped = false;
  if (!asked && m.landed && t - since >= PAD_TIP_MS) { asked = true; hover(on, 'in'); }
}
