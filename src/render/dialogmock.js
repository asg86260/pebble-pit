// MOCK dialog-the-look
// Throwaway review code, never merged (DESIGN.md, "A dialog system (design,
// not built)", on branch design-dialog): three looks for a line of dialog at
// act 3's meet-god beat, for the owner's vote. `globalThis.__dialogMock`
// picks the look; null is the game as it is (the beat's line in the band).
//   a  a bubble over the speaker in the world, a tail down to the head
//   b  the band's line grown into a box: the speaker's chip, the words
//   c  a line under the speaker that types in, a letter at a time, each
//      letter faded in, the whole line faded out
// The words are the game's own captions, no new ones (`SCRIPT`). A click, a
// tap, Enter or the right arrow goes on to the next line; held space ends
// them all and lets the beat go on (actbeats.js holds meet-god until then).
// The clock is the game's (`now()`), so `__still` steps it frame by frame.

import { S } from '../state.js';
import { P, CELL, ACT_CAPTION_FONT_PX } from '../config.js';
import { ctx } from './ctx.js';
import { msg, FACE } from '../lang.js';
import { raw, paper, ink } from '../ink.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { bandCells } from '../cutscene.js';
import { toScreen } from '../world.js';
import { gliding } from '../view.js';
import { pairBodies } from '../ghosts.js';
import { skipHeld } from '../skip.js';
import { reducedMotion } from '../prefs.js';
import { godHeadMock } from './aftercrowd.js';
import { WORKER } from '../config.js';

// Who says which of the game's existing captions, in order.
const SCRIPT = [
  { who: 'god', id: 'act-arrive' },
  { who: 'god', id: 'act-meet-god' },
  { who: 'pair', id: 'act-refuse' }
];
const HOLD_MS = 2600;      // a line held once in (and typed, for c)
const FADE_MS = 400;       // in and out, by opacity
const TYPE_MS = 45;        // c: a letter
const LETTER_MS = 140;     // c: a letter's own fade in
const GAP_MS = 1400;       // after the last line, before the script starts over
const FONT = ACT_CAPTION_FONT_PX;
const U = 2;               // screen px: a stroke of the bubble and the chips

let st = null; // held: the script's place { i, at, out, done, free }
held('dialog-mock', () => { globalThis.__dialogMock = null; globalThis.__dialogMockFree = false; globalThis.__dialogMockT0 = null; skipTo(false); st = null; lastCam = null; restFrames = 0; });

const look = () => (['a', 'b', 'c'].includes(globalThis.__dialogMock) ? globalThis.__dialogMock : null);
// The beat holding still on God, framed: lines run only then.
// (and the shot's pan from the arrival come to rest on him: `settled`)
let lastCam = null, restFrames = 0; // held with `st`: the camera's last spot and how many draws it has stood there
const framed = () => !!look() && S.beat && S.beat.camera === 'meet-god' && !gliding() && S.hush >= 0.99;
function settled() {
  const c = `${Math.round(S.camX)}|${Math.round(S.camY)}`;
  restFrames = c === lastCam ? restFrames + 1 : 0;
  lastCam = c;
  return restFrames >= 2;
}
const live = () => framed() && restFrames >= 2;

const holdOf = i => HOLD_MS + (look() === 'c' && !reducedMotion() ? msg(SCRIPT[i].id).length * TYPE_MS : 0);
function advance() {
  if (!st || st.done) return;
  const t = now();
  if (st.out == null) st.out = Math.max(t, st.at + FADE_MS);
}
if (typeof addEventListener === 'function') {
  addEventListener('pointerdown', () => { if (live()) advance(); });
  addEventListener('keydown', e => { if (live() && (e.key === 'Enter' || e.key === 'ArrowRight')) advance(); });
}

// The line on now: its index, its words, its opacity, how far typed.
function lineNow() {
  const t = now();
  if (!st) st = { i: 0, at: Math.min(t, globalThis.__dialogMockT0 ?? t), out: null, done: false };
  if (st.done) return null;
  // held space: every line ended, the beat let go
  if (skipHeld() >= 0.95) { st.done = true; globalThis.__dialogMockFree = true; return null; }
  let outAt = st.out ?? st.at + holdOf(st.i);
  if (t >= outAt + FADE_MS) {
    st.i++;
    st.out = null;
    st.at = outAt + FADE_MS + (st.i >= SCRIPT.length ? GAP_MS : 0);
    if (st.i >= SCRIPT.length) st.i = 0;
    outAt = st.at + holdOf(st.i);
  }
  if (t < st.at) return null;
  const a = Math.max(0, Math.min(1, (t - st.at) / FADE_MS, (outAt + FADE_MS - t) / FADE_MS));
  return { ...SCRIPT[st.i], text: msg(SCRIPT[st.i].id), a, u: t - st.at };
}

// The speaker's head on screen: its middle across, its top and its bottom.
function speakerAt(who) {
  if (who === 'god') {
    const g = godHeadMock();
    if (!g) return null;
    const a = toScreen(g.x, g.top), b = toScreen(g.x, g.bottom), f = toScreen(g.x, g.foot);
    return { x: a.x, top: a.y, bottom: b.y, foot: f.y };
  }
  const two = pairBodies();
  if (!two) return null;
  const mid = (two[0].x + two[1].x) / 2 + WORKER / 2, top = Math.min(two[0].y, two[1].y);
  const a = toScreen(mid, top), b = toScreen(mid, top + WORKER);
  return { x: a.x, top: a.y, bottom: b.y, foot: b.y };
}

const band = () => Math.round(S.hush * bandCells()) * CELL;
function wrap(text, max) {
  const words = text.split(' '), out = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && ctx.measureText(next).width > max) { out.push(cur); cur = w; } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}
const clampX = (x, w) => Math.max(CELL * 2, Math.min(S.W - CELL * 2 - w, x));

// --- a: the bubble --------------------------------------------------------------------------------
function drawBubble(l, sp) {
  const pad = CELL * 2, lh = FONT + 3;
  const lines = wrap(l.text, Math.min(S.W - CELL * 8, 260));
  const w = Math.ceil(Math.max(...lines.map(s => ctx.measureText(s).width))) + pad * 2 + U * 6;
  const h = lines.length * lh + pad * 2 - 3;
  const tail = CELL * 3, lo = band() + CELL, hi = S.H - band() - CELL - h;
  const vy = v => Math.round(Math.max(lo, Math.min(hi, v)));
  // over the head if there is room under the top band, else beside it; a
  // speaker past the window's edge speaks from that edge, the tail at it
  let x, y, dir;
  if (sp.x < 0) { dir = 'left'; x = CELL * 2 + tail; y = vy(sp.top - h / 2); }
  else if (sp.x > S.W) { dir = 'right'; x = S.W - CELL * 2 - tail - w; y = vy(sp.top - h / 2); }
  else if (sp.top - CELL - tail - h >= lo) { dir = 'down'; x = Math.round(clampX(sp.x - w / 2, w)); y = Math.round(sp.top - CELL - tail - h); }
  else { dir = 'left'; x = Math.round(clampX(sp.x + (sp.bottom - sp.top) / 2 + tail + CELL, w)); y = vy(sp.top); }
  const PAPER = raw(paper), INK = raw(ink);
  ctx.fillStyle = INK;
  // the box, its corners notched a stroke, the stroke U thick
  ctx.fillRect(x + U, y, w - U * 2, h);
  ctx.fillRect(x, y + U, w, h - U * 2);
  ctx.fillStyle = PAPER;
  ctx.fillRect(x + U * 2, y + U, w - U * 4, h - U * 2);
  ctx.fillRect(x + U, y + U * 2, w - U * 2, h - U * 4);
  // the tail: a stepped wedge out of the box toward the head, a stroke of
  // ink round its paper, a stroke narrower each step; its paper opens the
  // box's own stroke where the two meet
  // Each step is one stroke deep: ink a stroke past both its edges, paper
  // between; the first step's paper also lies over the box's own stroke.
  const steps = Math.round(tail / U), base = Math.round(tail * 0.8 / U) * U;
  const lenAt = k => Math.max(0, Math.round((base - k * base / steps) / U) * U);   // narrowing to the tip
  const ex = Math.round(Math.max(x + CELL * 2, Math.min(x + w - CELL * 2 - base, sp.x - U * 2)));   // 'down': the wedge's left edge
  const ty = y + CELL;                                                                                // a side's: its top edge
  // the step k strokes out of the box (k = -1 is the box's own stroke)
  const stepRect = (k, len, grow) => dir === 'down'
    ? [ex - grow, y + h - U + (k + 1) * U, len + grow * 2, U]
    : [dir === 'left' ? x - (k + 1) * U : x + w - U + (k + 1) * U, ty - grow, U, len + grow * 2];
  ctx.fillStyle = INK;
  for (let k = 0; k < steps; k++) { const len = lenAt(k); if (len > 0) ctx.fillRect(...stepRect(k, len, U)); }
  ctx.fillStyle = PAPER;
  for (let k = -1; k < steps; k++) { const len = lenAt(Math.max(0, k)); if (len > 0) ctx.fillRect(...stepRect(k, len, 0)); }
  ctx.fillStyle = INK;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  lines.forEach((s, k) => ctx.fillText?.(s, x + pad, y + pad + k * lh));
  more(x + w - pad / 2 - U * 5, y + h - pad / 2 - U * 3, INK);
}

// The go-on mark: a small wedge pointing down, still (never blinking).
// Its top-left at x, y: three rows, five strokes wide to one.
function more(x, y, tone) {
  ctx.fillStyle = tone;
  for (let r = 0; r < 3; r++) ctx.fillRect(Math.round(x) + r * U, Math.round(y) + r * U, (5 - 2 * r) * U, U);
}

// --- b: the band's box ----------------------------------------------------------------------------
// The speaker drawn small: God a square under a three-point crown, the pair
// two squares side by side. In the band's own white, past the page's map.
function chip(who, x, y, s) {
  // on a five-by-five grid of s: God's crown's three points over its band
  // and his square; the pair two squares a cell apart, standing on its foot
  const on = (c, r, w = 1, h = 1) => ctx.fillRect(x + c * s, y + r * s, w * s, h * s);
  ctx.fillStyle = raw('#fff');
  if (who === 'god') { on(0, 0); on(2, 0); on(4, 0); on(0, 1, 5, 1); on(0, 2, 5, 3); ctx.fillStyle = raw('#000'); on(1, 3); on(3, 3); }
  else { on(0, 3, 2, 2); on(3, 3, 2, 2); }
}
function drawBox(l) {
  const b = band();
  if (b < FONT) return;
  const top = S.H - b;
  const inset = CELL * 2, s = Math.max(2, Math.round(b / 14));
  const cw = s * 5, max = Math.min(S.W - inset * 4 - cw - CELL * 6, 520);
  const lines = wrap(l.text, max);
  const lh = FONT + 2;
  const textW = Math.ceil(Math.max(...lines.map(q => ctx.measureText(q).width)));
  // the box: a grey rule inside the band, as wide as its words and chip
  const w = Math.min(S.W - inset * 2, Math.max(textW + cw + CELL * 8, Math.min(S.W - inset * 2, 360)));
  const x = Math.round((S.W - w) / 2), y = top + CELL, h = b - CELL * 2;
  ctx.fillStyle = raw('#8a8a8a');
  ctx.fillRect(x, y, w, U); ctx.fillRect(x, y + h - U, w, U);
  ctx.fillRect(x, y, U, h); ctx.fillRect(x + w - U, y, U, h);
  chip(l.who, x + CELL * 2, Math.round(y + h / 2 - s * 2.5), s);
  ctx.fillStyle = raw('#efefef');
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const tx = x + CELL * 4 + cw, mid = y + h / 2;
  lines.forEach((q, k) => ctx.fillText?.(q, tx, Math.round(mid + (k - (lines.length - 1) / 2) * lh)));
  more(x + w - CELL * 2 - U * 5, y + h - CELL * 2 - U * 3, raw('#bdbdbd'));
}

// --- c: the typed line ----------------------------------------------------------------------------
function drawTyped(l, sp) {
  const lines = wrap(l.text, Math.min(S.W - CELL * 8, 320));
  const lh = FONT + 3;
  const widest = Math.ceil(Math.max(...lines.map(q => ctx.measureText(q).width)));
  // under the speaker, clear of the foot band; a speaker past the window's
  // edge speaks from that edge, a wedge before the words pointing at it
  const off = sp.x < 0 ? -1 : sp.x > S.W ? 1 : 0, aw = U * 4;
  const x0 = Math.round(off < 0 ? CELL * 2 + aw + CELL : off > 0 ? S.W - CELL * 3 - aw - widest : clampX(sp.x - widest / 2, widest));
  const y0 = Math.round(Math.max(band() + CELL, Math.min(sp.foot + CELL, S.H - band() - CELL - lines.length * lh)));
  if (off) {
    ctx.fillStyle = raw(ink);
    const ax = off < 0 ? CELL * 2 : S.W - CELL * 2 - aw, my = y0 + Math.round(FONT / 2);
    for (let c = 0; c < 4; c++) { const hgt = (off < 0 ? c : 3 - c) * U * 2 + U; ctx.fillRect(ax + c * U, my - Math.round(hgt / 2), U, hgt); }
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.lineJoin = 'round'; ctx.lineWidth = 4;
  const was = ctx.globalAlpha;
  let n = 0;
  for (const [k, q] of lines.entries()) {
    let x = x0 + Math.round((widest - ctx.measureText(q).width) / 2);
    for (const ch of q) {
      const born = reducedMotion() ? 0 : n * TYPE_MS;
      const a = Math.max(0, Math.min(1, (l.u - born) / (reducedMotion() ? 1 : LETTER_MS)));
      if (a > 0) {
        ctx.globalAlpha = was * a;
        ctx.strokeStyle = raw(paper);
        ctx.strokeText?.(ch, x, y0 + k * lh);
        ctx.fillStyle = raw(ink);
        ctx.fillText?.(ch, x, y0 + k * lh);
      }
      x += ctx.measureText(ch).width;
      n++;
    }
    n++;
  }
  ctx.globalAlpha = was;
}

// B has the foot band, where the skip hint stands: the hint goes up into
// the top band while B's box is up, and back after.
let hintUp = false; // held: whether the skip hint is moved into the top band
function skipTo(up) {
  if (up === hintUp || typeof document === 'undefined') return;
  const el = document.getElementById('skip');
  if (!el) return;
  hintUp = up;
  el.style.top = up ? `${Math.round((band() - el.offsetHeight) / 2)}px` : '';
  el.style.bottom = up ? 'auto' : '';
}

// Over the bands, in screen px (render.js's GLASS, beside the band's line).
// True when it drew, so the band's own line stands aside.
export function drawDialogMock() {
  skipTo(framed() && look() === 'b');
  if (!framed()) { st = null; restFrames = 0; lastCam = null; return false; }
  if (!settled()) return false;
  const l = lineNow();
  if (!l) return true;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.globalAlpha = l.a;
  ctx.font = `${FONT}px ${FACE}`;
  const o = look();
  if (o === 'b') drawBox(l);
  else {
    const sp = speakerAt(l.who);
    if (sp) (o === 'a' ? drawBubble : drawTyped)(l, sp);
  }
  ctx.restore();
  ctx.fillStyle = '#000';
  return true;
}
// Whether the mock has the band: the beat's own line stands aside.
export const dialogMockOn = () => live() && !(st && st.done);
