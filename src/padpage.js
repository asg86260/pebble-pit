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

import { PAD_ACCENT, PAD_HALO, PAD_ARM_MIN, PAD_ARM_MAX, PAD_TIP_MS } from './config.js';
import { S } from './state.js';
import { openBoard } from './board.js';
import { aim, markAt, bracketCells, haloCells, aimedSpace } from './padglide.js';

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
export const enterCorner = on => { inCorner = on; if (on) inBoard = false; };
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
// sliders that can be seen. A text box is skipped (the design: a keyboard is
// needed for those), and so is a button inside a closed part.
const CAN = 'button, a[href], input[type="range"]';
export function focusables(sc) {
  const out = [];
  for (const root of sc.el) {
    for (const el of root.querySelectorAll(CAN)) {
      if (!shown(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      out.push(el);
    }
  }
  return out;
}

// --- the focus ----------------------------------------------------------------
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
  on = null; onKey = null; asked = false;
  if (aimedSpace() === 'page') aim(null);
}

// Keep the focus on something that is there: the same row after a rebuild
// (a purchase rebuilds the board), or the nearest one to where it stood.
export function keepFocus(sc, t) {
  const list = focusables(sc);
  if (!list.length) { if (on) dropFocus(); return null; }
  if (on && list.includes(on)) return on;
  const same = onKey && list.find(el => keyOf(el) === onKey);
  if (same) { focusEl(same, t); return same; }
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

// The nearest row in a direction: ahead of this one that way, scored by how
// far ahead plus twice how far off the line, so a row straight below beats
// one nearer but off to the side.
const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
export function move(sc, dir) {
  const list = focusables(sc);
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
  const [dx, dy] = DIRS[dir];
  const a = on.getBoundingClientRect(), c = center(a);
  // Ahead within a cone first (more that way than off to the side); only up
  // and down fall back to anything below or above, since a sheet is a column
  // and its last button may stand off to one side of the row over it.
  const pick = cone => {
    let best = null, score = Infinity;
    for (const el of list) {
      if (el === on) continue;
      const e = center(el.getBoundingClientRect());
      const ahead = (e.x - c.x) * dx + (e.y - c.y) * dy;
      if (ahead <= 1) continue;
      const off = Math.abs((e.x - c.x) * dy) + Math.abs((e.y - c.y) * dx);
      if (cone && off > ahead * 2) continue;
      const s = ahead + off * 2;
      if (s < score) { score = s; best = el; }
    }
    return best;
  };
  const best = pick(true) || (dy ? pick(false) : null);
  if (!best) return false;
  focusEl(best);
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
// Y: hand back the newest copy still waiting -- the card's refund half, or
// a line on the queue card, whose click is the hand-back.
export function pressY() {
  if (!on) return false;
  const back = on.querySelector?.('.strip:not([hidden]) .refund');
  if (back) { back.click(); return true; }
  if (on.closest?.('#queue')) { on.click(); return true; }
  return false;
}
// X: a card's second thing, where it has one: the list a dial opens.
export function pressX() {
  if (!on) return false;
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
  sheetCtx.fillStyle = PAD_HALO;
  for (const [x, y] of haloCells(cells)) sheetCtx.fillRect(x * u, y * u, u, u);
  sheetCtx.fillStyle = PAD_ACCENT;
  for (const [x, y] of cells) sheetCtx.fillRect(x * u, y * u, u, u);
  wiped = false;
  if (!asked && m.landed && t - since >= PAD_TIP_MS) { asked = true; hover(on, 'in'); }
}
