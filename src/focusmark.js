// The keyboard's focus (the owner, 2026-10-14, on the visual audit's DOM-02:
// "reuse the gamepad styling corner brackets"). Tab to a control and it is
// marked as the pad marks the thing it is on: four corner brackets of whole
// cells a cell clear of the box, in the accent, on a one-cell halo of the
// paper so they read over ink and paper alike. The cells are padglide.js's
// `bracketCells`, at the pad's page cell, so the two marks are one drawing.
// Settled, not glided: the pad's glide is the pad's own state, and a key
// press lands where it lands.
//
// The browser's own ring is off (style.css, `:focus-visible`). A pointer's
// focus is not marked, by the browser's own rule for `:focus-visible`; a text
// box is, as soon as it is in use, since that is where typing goes. With a pad
// in hand (`body.pad`) the pad's marker is the one drawn.

import './ink.js';   // the dark page's map, on this context as on the yard's
import { bracketCells, haloCells, breathOut } from './padglide.js';
import { PAD_ACCENT, PAD_HALO, PAD_ARM_MIN, PAD_ARM_MAX, PAD_PAGE_CELL } from './config.js';

let canvas = null, ctx = null, looping = false;
// The control the mark is on and when it got there: it breathes from rest on
// each arrival, as the pad's marker does (padglide.js, `breathOut`).
let markedEl = null, markedAt = 0;

function mount() {
  if (canvas || !document.body) return;
  canvas = document.createElement('canvas');
  canvas.id = 'focusmark';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
}

// The control the mark stands on, or null when nothing should be marked.
function target() {
  const el = document.activeElement;
  if (!el || el === document.body || document.body.classList.contains('pad')) return null;
  try { if (!el.matches(':focus-visible')) return null; } catch { return null; }
  return el;
}

function paint() {
  const el = target();
  if (!el) { wipe(); looping = false; return; }
  mount();
  const dpr = devicePixelRatio || 1;
  const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const b = el.getBoundingClientRect();
  const t = performance.now();
  if (el !== markedEl) { markedEl = el; markedAt = t; }
  if (b.width && b.height) {
    const u = PAD_PAGE_CELL;
    const cells = bracketCells({ x: b.left, y: b.top, w: b.width, h: b.height }, 1 + breathOut(t - markedAt), u, PAD_ARM_MIN, PAD_ARM_MAX);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The pad's own colors, which ink.js turns for the dark page on every
    // context, this one with them.
    ctx.fillStyle = PAD_HALO;
    // The halo stops at the control's own edge: on a sheet its border is the
    // thing being marked, and a cell of paper over it read as a broken box.
    const off = ([x, y]) => (x + 1) * u <= b.left || x * u >= b.right || (y + 1) * u <= b.top || y * u >= b.bottom;
    for (const [x, y] of haloCells(cells).filter(off)) ctx.fillRect(x * u, y * u, u, u);
    ctx.fillStyle = PAD_ACCENT;
    for (const [x, y] of cells) ctx.fillRect(x * u, y * u, u, u);
  }
  // Every frame while something is marked: a board slides, a sheet scrolls,
  // and the mark goes with the control.
  requestAnimationFrame(paint);
}

function wipe() {
  if (ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
}

function wake() {
  if (looping) return;
  looping = true;
  requestAnimationFrame(paint);
}

if (typeof document !== 'undefined' && typeof addEventListener === 'function') {
  document.addEventListener('focusin', wake);
  // a key after a click makes the focus a keyboard's
  document.addEventListener('keydown', wake);
  document.addEventListener('focusout', () => requestAnimationFrame(() => { if (!target()) { wipe(); } }));
}
