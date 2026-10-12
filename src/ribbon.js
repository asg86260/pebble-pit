// The goal card's sign: a swallowtail ribbon wrapped round the card's top-left
// corner, drawn on a small canvas so its free end can flap like the yard's
// flags. The wrapped end is fixed; each column further out is lifted by the
// flags' own wave (flagwave.js), growing toward the tip, and held to whole
// 6px cells so the text rides in cell-wide slices and stays readable.
//
// One loop serves every card on screen, and none runs when none is: a card
// reports whether it is visible, and with motion off the cloth is drawn once
// at rest (and again when the theme turns) instead of every frame.

import {
  P, RIBBON_AMP, RIBBON_MS, RIBBON_WAVES, RIBBON_GROWTH, RIBBON_SEED, RIBBON_CLAMP, RIBBON_FIXED,
  RIBBON_PAD_L, RIBBON_PAD_R, RIBBON_FONT_PX, RIBBON_LETTER, RIBBON_BASE,
} from './config.js';
import { flagRip } from './flagwave.js';

const cards = new Set();
let raf = 0;

const token = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const still = () => document.body.classList.contains('still');

// The lift of every column at time t, in whole cells.
export function lifts(n, t) {
  const dy = [];
  for (let c = 0; c < n; c++) {
    const u = c / (n - 1);
    const rip = flagRip(t, u, RIBBON_SEED, RIBBON_MS, RIBBON_WAVES) * Math.pow(u, RIBBON_GROWTH) * RIBBON_AMP;
    dy.push(c < RIBBON_FIXED ? 0 : Math.round(Math.max(-RIBBON_CLAMP, Math.min(RIBBON_CLAMP, rip))));
  }
  return dy;
}

function make(card, text) {
  const cv = document.createElement('canvas');
  cv.className = 'ribbon';
  cv.setAttribute('aria-hidden', 'true');
  const ctx = cv.getContext('2d');
  const sign = text.toUpperCase();
  const me = { cv, seen: true, dirty: true, font: '' };
  let n = 0, W = 0, H = 0, dpr = 1, off = null, baked = '';

  function size() {
    dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    me.font = `bold ${RIBBON_FONT_PX}px ${getComputedStyle(card).fontFamily}`;
    const m = document.createElement('canvas').getContext('2d');
    m.font = me.font; m.letterSpacing = `${RIBBON_LETTER}px`;
    n = Math.ceil((RIBBON_PAD_L + m.measureText(sign).width + RIBBON_PAD_R) / P);
    W = n * P; H = 5 * P;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = `${W}px`; cv.style.height = `${H}px`;
    off = document.createElement('canvas');
    off.width = W * dpr; off.height = 3 * P * dpr;
    baked = '';
    me.dirty = true;
  }

  // The cloth with its text, re-inked whenever the theme's tokens change.
  function bake() {
    const k = token('--ink') + token('--paper');
    if (k === baked) return;
    baked = k;
    const oc = off.getContext('2d');
    oc.setTransform(dpr, 0, 0, dpr, 0, 0);
    oc.clearRect(0, 0, W, 3 * P);
    oc.fillStyle = token('--ink'); oc.fillRect(0, 0, W, 3 * P);
    oc.fillStyle = token('--paper');
    oc.font = me.font; oc.letterSpacing = `${RIBBON_LETTER}px`;
    oc.fillText(sign, RIBBON_PAD_L, RIBBON_BASE);
  }

  me.size = size;
  me.draw = t => {
    bake();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dy = lifts(n, t), base = P;
    for (let c = 0; c < n - 2; c++)
      ctx.drawImage(off, c * P * dpr, 0, P * dpr, 3 * P * dpr, c * P, base + dy[c] * P, P, 3 * P);
    // The tail's roots: the cloth's middle cell, then the two ink points cut
    // above and below it.
    ctx.drawImage(off, (n - 2) * P * dpr, P * dpr, P * dpr, P * dpr, (n - 2) * P, base + P + dy[n - 2] * P, P, P);
    ctx.fillStyle = token('--ink');
    for (const c of [n - 2, n - 1]) {
      ctx.fillRect(c * P, base + dy[c] * P, P, P);
      ctx.fillRect(c * P, base + 2 * P + dy[c] * P, P, P);
    }
    // The fold where it wraps the frame.
    ctx.fillStyle = token('--ink-4'); ctx.fillRect(0, base + 3 * P, P, P);
    me.dirty = false;
  };
  size();
  card.appendChild(cv);
  return me;
}

const visible = me => me.cv.isConnected && me.seen && me.cv.offsetParent !== null;

function tick(now) {
  raf = 0;
  let any = false;
  for (const me of cards) {
    if (!me.cv.isConnected) { cards.delete(me); io?.unobserve(me.cv); continue; }
    if (!visible(me)) continue;
    any = true;
    if (!still()) me.draw(now);
    else if (me.dirty) me.draw(0);
  }
  if (any && !still()) raf = requestAnimationFrame(tick);
}

function kick() {
  if (!raf && cards.size) raf = requestAnimationFrame(tick);
}

const io = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver(es => {
    for (const e of es) for (const me of cards) if (me.cv === e.target) me.seen = e.isIntersecting;
    kick();
  })
  : null;

// A theme turning (html.dark) or motion being switched (body.still) re-inks
// and restarts or parks the loop.
if (typeof MutationObserver === 'function' && typeof document !== 'undefined') {
  const mo = new MutationObserver(() => { for (const me of cards) me.dirty = true; kick(); });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
  if (document.body) mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}
if (typeof document !== 'undefined' && document.fonts?.ready) {
  document.fonts.ready.then(() => { for (const me of cards) me.size(); kick(); });
}

// Hangs a ribbon reading `text` on `card`; returns its canvas.
export function hangRibbon(card, text) {
  const me = make(card, text);
  cards.add(me);
  io?.observe(me.cv);
  kick();
  return me.cv;
}
