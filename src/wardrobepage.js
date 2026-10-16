// The picker: a page of the held sheet where the two of them are dressed
// (DESIGN.md, "What the two of them wear"; the mock's Part 3). The two of
// them close up at the top -- a press on either picks who is being dressed
// -- and under them the yard's own scale with a crowd walking it, so a
// choice is made for being found in the yard and not only for the close-up;
// her and him; a row a slot, each with its previous and next; a roll of the
// dice for the one being dressed.
//
// It is reached two ways: a row on the settings page, always, and once at a
// new yard before the opening walks out (`offerDress`), where the way off it
// says done and a skip puts the defaults back. Mouse and finger press its
// buttons; a pad moves between them as on every page (padpage.js), with
// left and right on a slot's row stepping its item, LB and RB for her and
// him, and Y the roll (`wardrobePad`).

import { msg } from './lang.js';
import { S } from './state.js';
import { P, WORKER, WARD_BIG, WARD_BIG_H, WARD_STRIP_H, WARD_CROWD, WARD_CROWD_PACE } from './config.js';
import { SLOTS, WHO, DEFAULTS, itemOf, outfitOf, stepItem, rollOutfit } from './wardrobe.js';
import { drawDressed, YARD_INKS } from './render/wardrobe.js';
import { HATS, drawSprite, spriteH, spriteW } from './sprites.js';

let who = 'her';
let offer = false;              // opened at the start of a yard rather than from settings
let built = null;               // the page's parts, made once into its element

const button = (text, ...cls) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.classList.add(...cls);
  b.textContent = text;
  return b;
};

function build(el) {
  el.textContent = '';
  const big = document.createElement('canvas');
  big.className = 'wardbig';
  big.addEventListener('click', e => {
    const r = big.getBoundingClientRect();
    pick(e.clientX - r.left < r.width / 2 ? 'her' : 'him');
  });
  const strip = document.createElement('canvas');
  strip.className = 'wardstrip';
  const tabs = document.createElement('div');
  tabs.classList.add('pair', 'wardwho');
  const tab = {};
  for (const k of WHO) {
    const b = button(k === 'her' ? msg('ward-her') : msg('ward-him'), 'wardtab');
    b.id = `ward${k}`;
    b.addEventListener('click', () => pick(k));
    tabs.appendChild(b);
    tab[k] = b;
  }
  const rows = SLOTS.map(s => {
    const row = document.createElement('div');
    row.className = 'wardrow';
    row.dataset.slot = s.key;
    const label = document.createElement('span');
    label.className = 'wardlabel';
    label.textContent = msg(s.name);
    const prev = button('<', 'wardarr', 'prev');
    prev.id = `ward-${s.key}-prev`;
    const val = document.createElement('span');
    val.className = 'wardval';
    const next = button('>', 'wardarr', 'next');
    next.id = `ward-${s.key}-next`;
    prev.addEventListener('click', () => { stepItem(who, s.key, -1); say(); });
    next.addEventListener('click', () => { stepItem(who, s.key, 1); say(); });
    row.append(label, prev, val, next);
    return { row, val, s };
  });
  const foot = document.createElement('div');
  foot.className = 'pair';
  const roll = button(msg('ward-randomize'), 'wardroll');
  roll.id = 'wardroll';
  roll.addEventListener('click', () => { rollOutfit(who); say(); });
  const skip = button(msg('ward-skip'), 'wardskip');
  skip.id = 'wardskip';
  skip.addEventListener('click', () => {
    S.outfits = { her: { ...DEFAULTS.her }, him: { ...DEFAULTS.him } };
    close();
  });
  foot.append(roll, skip);
  el.append(big, strip, tabs, ...rows.map(r => r.row), foot);
  built = { el, big, strip, tab, rows, skip, crowd: crowdOf() };
}

// The page brought up to the outfits and to who is being dressed.
function say() {
  if (!built) return;
  for (const k of WHO) {
    built.tab[k].classList.toggle('on', k === who);
    built.tab[k].setAttribute('aria-pressed', String(k === who));
  }
  const o = outfitOf(who);
  for (const { val, s } of built.rows) val.textContent = msg(itemOf(s.key, o[s.key])?.name || s.items[0].name);
  built.skip.hidden = !offer;
  const back = document.getElementById('wardrobeback');
  if (back) back.textContent = offer ? msg('ward-done') : msg('set-controlsback');
}

function pick(k) { who = k; say(); }

let onClose = null;
const close = () => { offer = false; onClose?.(); };

// The page turned to, into `el`: `start` true for the new yard's offer.
// `leave` is how the sheet lets the page go (settings.js).
export function showWardrobe(el, { start = false, leave = null } = {}) {
  if (!built || built.el !== el) build(el);
  offer = start;
  onClose = leave;
  if (start) who = 'her';
  say();
}
// The way off the page, the back button's own: the offer's done.
export const wardrobeOffer = () => offer;
export const leaveWardrobe = () => close();

// --- the pad ----------------------------------------------------------------------
// Up and down are the page's own moves between its buttons. On a slot's row
// left and right step its item rather than move off it, and LB, RB and Y
// are her, him and the roll. Answers the directions it left for the page.
export function wardrobePad(dirs, pressed) {
  if (!built || !shown(built.el)) return dirs;
  if (pressed('lb')) pick('her');
  if (pressed('rb')) pick('him');
  if (pressed('y')) { rollOutfit(who); say(); }
  const row = document.activeElement?.closest?.('.wardrow');
  if (!row) return dirs;
  return dirs.filter(d => {
    if (d !== 'left' && d !== 'right') return true;
    stepItem(who, row.dataset.slot, d === 'right' ? 1 : -1);
    say();
    return false;
  });
}
const shown = el => !!el && !el.hidden && el.getClientRects().length > 0;

// --- the pictures ------------------------------------------------------------------
// A canvas sized to the box it is laid in, in device pixels, `k` screen
// pixels a world pixel; the context back with its transform set.
function fit(c, k, h) {
  const d = devicePixelRatio || 1, w = c.clientWidth || 1;
  const W = Math.round(w * d), H = Math.round(h * d);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  c.style.height = `${h}px`;
  const g = c.getContext('2d');
  g.setTransform(k * d, 0, 0, k * d, 0, 0);
  g.imageSmoothingEnabled = false;
  return { g, w: w / k, h: h / k };
}

// The crowd the strip's two walk among: crew in station hats, each pacing a
// stretch of it, some standing. Made once, in shares of the strip's width.
const KITS = [null, 'helmet', 'lamp', 'brim', 'point', 'cap'];
function crowdOf() {
  let s = 7;
  const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const [lo, hi] = WARD_CROWD_PACE;
  const out = [];
  for (let i = 0; i < WARD_CROWD; i++) {
    const a = r() * 0.8, span = 0.1 + r() * 0.5;
    out.push({ a, b: Math.min(0.95, a + span), v: r() < 0.2 ? 0 : lo + r() * (hi - lo), ph: r() * 10, kit: KITS[Math.floor(r() * KITS.length)] });
  }
  // and the two of them, always walking
  out.push({ a: 0.1, b: 0.8, v: hi * 0.6, ph: 0.3, who: 'her' }, { a: 0.2, b: 0.9, v: hi * 0.8, ph: 0.7, who: 'him' });
  return out;
}
// Where a pacer is at `t` along a strip `w` wide: out, a pause, back, a pause.
function pace(p, t, w) {
  const a = p.a * w, b = p.b * w;
  if (!p.v) return { x: a, dir: 1, moving: false };
  const T = (b - a) / p.v, u = (t + p.ph * T) % (2 * T + 2);
  if (u < T) return { x: a + u * p.v, dir: 1, moving: true };
  if (u < T + 1) return { x: b, dir: 1, moving: false };
  if (u < 2 * T + 1) return { x: b - (u - T - 1) * p.v, dir: -1, moving: true };
  return { x: a, dir: -1, moving: false };
}
const hatOn = kit => kit && ((g, x, y) => drawSprite(g, HATS[kit], x + (WORKER - spriteW(HATS[kit]) * P) / 2, y - spriteH(HATS[kit]) * P));
const plainLook = { outfit: { head: 'none', face: 'none', neck: 'none', back: 'none', pattern: 'plain' }, inks: YARD_INKS };

// Once a frame while the page is up: the close-up and the strip, walking on
// the page's own clock (the yard is held under the sheet).
export function paintWardrobe(t = performance.now()) {
  if (!built || !shown(built.el)) return;
  const s = t / 1000;
  {
    const { g, w, h } = fit(built.big, WARD_BIG, WARD_BIG_H * WARD_BIG);
    g.fillStyle = YARD_INKS.paper;
    g.fillRect(0, 0, w, h);
    const ground = Math.round(h - P);
    g.fillStyle = YARD_INKS.ink;
    g.fillRect(0, ground, w, 1);
    // a turn now and then, so the things that hang off the back are seen moving
    const moving = s % 6 >= 4;
    WHO.forEach((k, i) => {
      const x = Math.round(w * (i ? 0.66 : 0.34) - WORKER / 2);
      drawDressed(g, x, ground - WORKER, { outfit: outfitOf(k), dir: i ? -1 : 1, moving, t: s, inks: YARD_INKS });
      // the one being dressed: a bar under its feet
      if (k === who) { g.fillStyle = YARD_INKS.ink; g.fillRect(x - 2, ground + 3, WORKER + 4, 2); }
    });
  }
  {
    const { g, w, h } = fit(built.strip, 1, WARD_STRIP_H);
    g.fillStyle = YARD_INKS.paper;
    g.fillRect(0, 0, w, h);
    const ground = h - P;
    g.fillStyle = YARD_INKS.ink;
    g.fillRect(0, ground, w, 1);
    for (const p of built.crowd) {
      const at = pace(p, s, w - WORKER), x = Math.round(at.x);
      const look = p.who ? { outfit: outfitOf(p.who), dir: at.dir, moving: at.moving, t: s, inks: YARD_INKS }
                         : { ...plainLook, dir: at.dir };
      drawDressed(g, x, ground - WORKER, look, hatOn(p.kit));
    }
  }
}
