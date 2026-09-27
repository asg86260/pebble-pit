// Track fire of docs/wave-class-anims.md: the Sapper and the Mage, and the
// two statuses they own, Burning and Lit.
//
// Fire here has no color to lean on, so it is told by its motion and its
// shape: tongues of cells that stand up off the thing burning and flicker on
// their own quick clock, white at the root and stepping down the greys to the
// tip, with embers peeling off and going out as they rise. Nothing else on
// the bench rises and flickers at once. The abyss's power is the purple, so
// the Mage's bolts and the Lit status are purple and the Sapper's charges,
// which are powder, are not.

import {
  FLOOR, STATION_X, GREYS, PURPLES, WHITE, hash, clamp, steps,
  cell, rect, line, ring, coilY, coilTop, coilBottom, COIL_X0, COIL_X1,
  burst, chip, registerStatus, registerClass, drawBody,
} from './harness.js';

const lerp = (a, b, k) => a + (b - a) * k;
// A filled disc of cells, each handed to `fn` with its distance from the
// middle, so an explosion can shade from its heart outward.
function disc(g, cx, cy, r, fn) {
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) fn(x, y, d);
    }
}

// --- fire ---------------------------------------------------------------------------
// The flames on the coil between columns x0 and x1. The hide's top edge is
// scorched grey, which is what parts the white fire from the white body, and
// out of it stand separate tongues, one every TONGUE columns: a two-cell
// root, a white stem and a grey tip that leans and jumps on a flicker drawn
// fresh nine times a second. `level` is the stacks, 0..1: more stacks,
// taller tongues, more char, more embers.
const FLICKER = 9, TONGUE = 4;
function flames(g, t, s, level, x0 = COIL_X0, x1 = COIL_X1) {
  const f = Math.floor(t * FLICKER);
  const a = Math.max(COIL_X0, Math.round(x0)), b = Math.min(COIL_X1, Math.round(x1));
  for (let cx = a; cx <= b; cx++) {
    const top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
    cell(g, cx, top, GREYS[7]);
    // char: dark cells bitten into the hide, fixed to the body so they ride
    // the sway, more of them as the stacks climb
    for (let cy = top + 1; cy < bot; cy++)
      if (hash(cx * 31 + (cy - top) * 17 + 5) < 0.03 + 0.07 * level) cell(g, cx, cy, GREYS[6]);
  }
  for (let cx = a; cx <= b; cx++) {
    if (cx % TONGUE) continue;
    const top = coilTop(cx, t, s);
    const jump = hash(cx * 7 + f * 13);
    const h = Math.max(1, Math.round(1 + 3 * level + (jump < 0.3 ? -1 : jump > 0.8 ? 1 : 0)));
    const lean = hash(cx * 5 + f * 3) < 0.35 ? -1 : hash(cx * 5 + f * 3) > 0.7 ? 1 : 0;
    cell(g, cx, top - 1, WHITE);
    if (cx + 1 <= b) cell(g, cx + 1, top - 1, WHITE);
    if (h > 2 && cx - 1 >= a) cell(g, cx - 1, top - 1, GREYS[9]);
    for (let i = 2; i <= h; i++) cell(g, cx + (i === h ? lean : 0), top - i, i === h ? GREYS[8] : WHITE);
    // now and then a tip tears off and hangs a cell above its tongue
    if (hash(cx * 3 + f * 5) < 0.2) cell(g, cx + lean, top - h - 2, GREYS[6]);
  }
  // embers: single cells that leave the fire and go out as they rise
  const n = Math.round(3 + 7 * level);
  for (let i = 0; i < n; i++) {
    const age = (t / 1.3 + hash(i * 11 + 2)) % 1;
    const x = COIL_X0 + hash(i * 3 + 1) * (COIL_X1 - COIL_X0);
    if (x < a || x > b) continue;
    const ex = x + Math.sin(age * 5 + i) * 1.2;
    const ey = coilTop(Math.round(x), t, s) - 2 - age * 7;
    const k = steps(age, 4);
    cell(g, ex, ey, k < 0.3 ? WHITE : k < 0.6 ? GREYS[9] : k < 0.9 ? GREYS[6] : GREYS[4]);
  }
}

// Fire catching along the coil from where a blow set it: a front that runs
// both ways, flaring tall where it has just arrived, and leaving the fire of
// `level` behind it. Draws nothing before t0 or once the whole coil is
// caught -- from then on the Burning painter stands in for it.
const SPREAD = 26;  // cells a second
const spreadDone = (x0, t0) => t0 + Math.max(x0 - COIL_X0, COIL_X1 - x0) / SPREAD;
function catchFire(g, t, t0, x0, s, level) {
  const a = t - t0;
  if (a < 0 || t >= spreadDone(x0, t0)) return;
  const r = a * SPREAD;
  flames(g, t, s, level, x0 - r, x0 + r);
  // the front: a tall tongue at each end of what has caught
  for (const side of [-1, 1]) {
    const fx = Math.round(x0 + side * r);
    if (fx < COIL_X0 || fx > COIL_X1) continue;
    const top = coilTop(fx, t, s);
    const h = 3 + Math.round(2 * hash(Math.floor(t * FLICKER) + fx));
    for (let i = 1; i <= h; i++) cell(g, fx, top - i, i < h ? WHITE : GREYS[9]);
    cell(g, fx - side, top - 1, WHITE); cell(g, fx - side, top - 2, GREYS[10]);  }
}

registerStatus('burning', {
  name: 'Burning', on: 'serpent',
  serpent(g, t, s, level) { flames(g, t, s, level); },
});

// --- light ---------------------------------------------------------------------------
// Lit: the coil drawn round in the abyss's purple -- its spine turned purple
// and a dotted line of light a cell off its top and bottom that creeps along
// the body, with one brighter run going slowly head to tail. Quiet enough to
// stand under every other status, and it is the only status that outlines.
function litCells(g, t, s, x0 = COIL_X0, x1 = COIL_X1) {
  const a = Math.max(COIL_X0, Math.round(x0)), b = Math.min(COIL_X1, Math.round(x1));
  const creep = Math.floor(t * 3);
  const run = COIL_X0 + ((t * 9) % (COIL_X1 - COIL_X0 + 16)) - 8;
  for (let cx = a; cx <= b; cx++) {
    const top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
    cell(g, cx, Math.round(coilY(cx, t, s)), PURPLES[9]);
    const hot = Math.abs(cx - run) < 3;
    if (hot || (cx + creep) % 2 === 0) cell(g, cx, top - 1, hot ? PURPLES[11] : PURPLES[8]);
    if (hot || (cx + creep) % 2 === 1) cell(g, cx, bot + 1, hot ? PURPLES[11] : PURPLES[6]);
  }
}
registerStatus('lit', {
  name: 'Lit', on: 'serpent',
  serpent(g, t, s) { litCells(g, t, s); },
});

// The Arcane's light going on: the coil lit outward from column x0, both
// ways, a whole column a step, until all of it is Lit. The two columns at the
// front are drawn a tone brighter, top and bottom, so the reader sees which
// way it is going; behind them it is the painter's quiet standing state.
// Draws nothing before t0 or once the whole coil is lit.
const LIT_STEP = 22;   // columns a second
const litDone = (x0, t0) => t0 + (Math.max(x0 - COIL_X0, COIL_X1 - x0) + 1) / LIT_STEP;
function lightFrom(g, t, t0, x0, s) {
  if (t < t0 || t >= litDone(x0, t0)) return;
  const r = Math.floor((t - t0) * LIT_STEP);
  litCells(g, t, s, x0 - r, x0 + r);
  for (const fx of [x0 - r, x0 + r]) {
    if (fx < COIL_X0 || fx > COIL_X1) continue;
    cell(g, fx, coilTop(fx, t, s) - 1, PURPLES[11]);
    cell(g, fx, coilBottom(fx, t, s) + 1, PURPLES[11]);
  }
}

// --- the blast --------------------------------------------------------------------
// A charge going off at (cx, cy), `r` cells across at its widest: a white
// heart for a blink, a ring of cells thrown out and stepping down the greys,
// a knot of flame at the middle that shrinks, then smoke that rises and goes
// out. Powder, so grey and white; the purple is the Mage's.
function boom(g, t, t0, cx, cy, r, s, id = 0) {
  const a = t - t0;
  if (a < 0 || a > 2.2) return;
  const px = (x, y, k) => flash(g, t, s, x, y, k);
  // smoke first, so the fire is drawn over it
  if (a > 0.2) for (let i = 0; i < 7; i++) {
    const sx = cx + (hash(id * 7 + i) - 0.5) * r * 1.4;
    const sy = cy - 1 - (a - 0.2) * (2 + 3 * hash(id + i * 5)) - hash(i + id) * 2;
    const k = (a - 0.2) / 2;
    if (k < 0.85) rect(g, sx, sy, 2, 2, GREYS[k < 0.3 ? 7 : k < 0.6 ? 5 : 3]);
  }
  if (a < 0.1) disc(g, cx, cy, Math.max(1.5, r * 0.5), (x, y) => px(x, y, 1));
  if (a < 0.55) {
    const rr = 1 + (r - 1) * Math.sqrt(a / 0.55);
    ringOf(cx, cy, rr, a < 0.3 ? 1 : 2, (x, y) => px(x, y, a < 0.2 ? 1 : a < 0.38 ? 0.7 : 0.4));
  }
  if (a < 0.9) {
    const f = Math.floor(t * FLICKER * 1.5);
    disc(g, cx, cy, Math.max(1, r * 0.4 * (1 - a / 0.9)), (x, y, d) => {
      if (hash(x * 13 + y * 7 + f) < 0.75) px(x, y, d < 1 ? 1 : hash(x + y + f) < 0.5 ? 0.85 : 0.6);
    });
  }
}

// A cell of light that stays readable on whatever it lands on: bright on the
// dark water, and turned dark where it falls on the white hide -- a flash
// drawn white over a white body would simply not be there. `k` 0..1 is how
// bright.
function onCoil(x, y, t, s) {
  x = Math.round(x); y = Math.round(y);
  return x >= COIL_X0 && x <= COIL_X1 && y >= coilTop(x, t, s) && y <= coilBottom(x, t, s);
}
function flash(g, t, s, x, y, k) {
  const q = steps(k, 6);
  cell(g, x, y, onCoil(x, y, t, s) ? GREYS[Math.round(6 * (1 - q))] : GREYS[Math.round(5 + 6 * q)]);
}
// The cells of a ring, laid as the harness's `ring` lays them, each handed
// to `fn` so it can be drawn with `flash`.
function ringOf(cx, cy, r, every, fn) {
  const n = Math.max(8, Math.ceil(Math.PI * 2 * r)), seen = new Set();
  for (let k = 0; k < n; k += every) {
    const a = k / n * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
    if (seen.has(x + ',' + y)) continue;
    seen.add(x + ',' + y); fn(x, y);
  }
}

// --- the Sapper ---------------------------------------------------------------------
// His kit is the looks page's (docs/mocks/classes/looks-2026-09-27.html): a
// bundle of three charges under his arm, a cell clear of the body -- three
// sticks of powder three cells tall, the middle one paler, bound by a dark
// band across their middle -- with the fuse standing off the middle stick and
// its spark hopping along the tops. Every charge he throws or lays is a stick
// out of that bundle, so the bundle is short a stick while it is gone, and a
// fresh one is slid out from behind him to fill the gap before the next.
// Because the bundle changes through a scene, every Sapper scene draws its
// own body and kit (`body: false`); the `hat` is the full bundle at rest.
const STICKS = [4, 5, 6];            // the sticks' columns, off the body's left edge
const FULL = [1, 1, 1];
const SPARK_SEQ = [0, 1, 0, 2, 1];   // the looks page's hop, six a second
// One stick, its top at (x, y): pale powder with the band across its middle.
function stick(g, x, y, middle = false) {
  x = Math.round(x); y = Math.round(y);
  cell(g, x, y, middle ? GREYS[10] : GREYS[9]);
  cell(g, x, y + 1, GREYS[6]);
  cell(g, x, y + 2, middle ? GREYS[10] : GREYS[9]);
}
// A lit fuse's spark at (x, y): a cell that will not sit still in its tone.
// `hot` is the Incendiary's, a two-cell tongue.
function sparkAt(g, x, y, t, hot = false) {
  const f = Math.floor(t * 16);
  cell(g, x, y, f % 2 ? WHITE : GREYS[10]);
  if (hot) cell(g, x + (f % 3 === 0 ? 1 : 0), y - 1, f % 2 ? GREYS[9] : GREYS[7]);
}
// The bundle at the body whose top-left is (bx, by): the sticks it still
// holds (`have`, left to right), and the fuse and its hopping spark while the
// middle stick, which carries the fuse, is in it.
function bundle(g, bx, by, t, have = FULL) {
  STICKS.forEach((c, i) => { if (have[i]) stick(g, bx + c, by, i === 1); });
  if (!have[1]) return;
  cell(g, bx + STICKS[1], by - 1, GREYS[6]);
  const k = SPARK_SEQ[Math.floor(t * 6) % SPARK_SEQ.length];
  cell(g, bx + STICKS[k], by - 2, k === 1 ? GREYS[9] : WHITE);
}
function sapperKit(g, cx, cy, t) { bundle(g, cx, cy, t); }

// A fresh stick for slot `i`, slid out from behind the body a row high and
// dropped into its place over RESTOCK seconds from t0. Drawn before the body,
// so it comes out from behind him; `restocked` says when it is back.
const RESTOCK = 0.5;
function restock(g, t, t0, bx, by, i) {
  const a = t - t0;
  if (a < 0 || a >= RESTOCK) return;
  const k = a / RESTOCK;
  const x = lerp(bx + 1, bx + STICKS[i], clamp(k / 0.75, 0, 1));
  stick(g, x, by - (k < 0.75 ? 1 : 0), i === 1);
}
const restocked = (t, t0) => t >= t0 + RESTOCK;

// A charge in the air, its middle at (x, y), turning end over end a quarter
// every eighth of a second with its lit end going round: up, right, down, left.
function tumbling(g, x, y, t, a, hot) {
  x = Math.round(x); y = Math.round(y);
  const q = Math.floor(a * 8) % 4;
  if (q % 2 === 0) { stick(g, x, y - 1); sparkAt(g, x, q === 0 ? y - 2 : y + 2, t, hot && q === 0); }
  else {
    cell(g, x - 1, y, GREYS[9]); cell(g, x, y, GREYS[6]); cell(g, x + 1, y, GREYS[9]);
    sparkAt(g, q === 1 ? x + 2 : x - 2, y, t);
  }
}

// One throw: stick `slot` is drawn up out of the bundle past the fuse, which
// lights it, then thrown end over end in an arc to the coil, where it goes
// off. `tT` the throw, `fl` the flight, `tx` the column it lands on. Returns
// when the stick left the bundle and where it landed, for the scene to hang
// its blow and its restock on.
const LIFT = 0.6;   // how long before the throw the stick starts up out of the bundle
function throwStick(g, t, api, { tT, fl = 0.8, tx, slot = 2, r = 6, id = 0, hot = false, blow = true, s = api.st }) {
  const me = api.me, tL = tT + fl, left = tT - LIFT;
  const sx = me.x + STICKS[slot];
  const land = { x: tx, y: coilBottom(tx, tL, s) };
  if (t >= left && t < tT) {
    // up out of the bundle, three cells, and lit at the top as it clears the fuse
    const k = clamp((t - left) / 0.3, 0, 1);
    const y = Math.round(lerp(me.y, me.y - 3, k));
    stick(g, sx, y, slot === 1);
    if (k >= 1) sparkAt(g, sx, y - 1, t, hot);
  } else if (t >= tT && t < tL) {
    const p = (t - tT) / fl;
    const arc = q => ({ x: lerp(sx, land.x, q), y: lerp(me.y - 2, land.y + 2, q) - Math.sin(Math.PI * q) * 3 });
    // the fuse's sparks hang a cell or two behind it as it goes
    for (let i = 1; i <= 2; i++) {
      const c = arc(Math.max(0, p - i * 0.06));
      cell(g, c.x, c.y - 1, i === 1 ? GREYS[8] : GREYS[5]);
    }
    const c = arc(p);
    tumbling(g, c.x, c.y, t, t - tT, hot);
  }
  if (blow) boom(g, t, tL, land.x, land.y, r, s, id);
  return { left, tL, land };
}

// A landed charge's blow, on every length the blast crosses: the burst at the
// heart and a bite either side, riding the coil as it sways.
function blows(g, t, tL, land, k, spread, s, id) {
  burst(g, t, tL, land.x, land.y, k, id);
  for (const dx of spread) {
    const x = land.x + dx;
    chip(g, t, tL, x, Math.round(coilY(x, t, s)), dx ? k * 0.6 : k, id + dx);
  }
}

// The Demolition's throw: not a stick but the whole bundle, lifted over the
// shoulder, fuse sparking, and lobbed without a turn -- it is heavy -- to go
// off as one blow. Returns when it left and where it landed.
function throwBundle(g, t, api, { tT, fl = 1.0, tx, r = 10, id = 0, s = api.st }) {
  const me = api.me, tL = tT + fl, left = tT - LIFT;
  const land = { x: tx, y: coilBottom(tx, tL, s) };
  // the bundle's own drawing, moved so its left stick sits at (x, y)
  const at = (x, y) => bundle(g, Math.round(x) - STICKS[0], Math.round(y), t);
  if (t >= left && t < tT) {
    const k = clamp((t - left) / 0.35, 0, 1);
    at(me.x + STICKS[0] - k, lerp(me.y, me.y - 4, k));   // up over the shoulder
  } else if (t >= tT && t < tL) {
    const p = (t - tT) / fl;
    const x0 = me.x + STICKS[0] - 1, y0 = me.y - 4;
    at(lerp(x0, land.x - 1, p), lerp(y0, land.y + 3, p) - Math.sin(Math.PI * p) * 4);
  }
  boom(g, t, tL, land.x, land.y, r, s, id);
  return { left, tL, land };
}

// A Sapper scene's own fighter at the station: the fresh sticks coming out
// from behind him, then the body, then the bundle as it stands at `t`.
// `gone` is, for each slot, when its stick left and when its restock starts.
function sapperAt(g, t, me, gone) {
  const have = [1, 1, 1];
  for (const [i, left, back] of gone) {
    restock(g, t, back, me.x, me.y, i);
    if (t >= left && !restocked(t, back)) have[i] = 0;
  }
  drawBody(g, me.x, me.y);
  bundle(g, me.x, me.y, t, have);
}

// The Sticky Charge: one stick thrown up to the coil's underside, where it
// sticks and hangs, riding the sway with the body. Its fuse hangs below it
// and burns up toward it, three cells to none, the spark on its end blinking
// faster as it goes; when the fuse is gone it blows as one big blow and
// stuns. A charge left longer is a bigger blow, so the mock gives it the
// whole count.
const STICK = { tT: 1.1, fl: 0.7, tx: 28, blow: 5.0, stun: 1.6, id: 5 };
const STUCK = STICK.tT + STICK.fl;
const FUSE = 3;
function stuckCharge(g, t, s) {
  if (t < STUCK || t >= STICK.blow) return;
  const x = STICK.tx, y = coilBottom(x, t, s) + 1;   // its top, just under the hide
  stick(g, x, y);
  // the hide gripping it: a dark cell either side of its top
  cell(g, x - 1, y, GREYS[6]); cell(g, x + 1, y, GREYS[6]);
  const k = (t - STUCK) / (STICK.blow - STUCK);
  const len = Math.ceil(FUSE * (1 - k));
  for (let i = 0; i < len; i++) cell(g, x, y + 3 + i, GREYS[6]);
  // the blink quickens: the count of blinks goes with the square of the time,
  // so each comes sooner than the last
  const on = Math.floor(k * k * 18) % 2 === 0;
  cell(g, x, y + 3 + len, on ? WHITE : GREYS[4]);
}

registerClass({
  key: 'sapper', name: 'Sapper', station: 'circle', group: 'fire',
  look: 'a bundle of three charges under his arm, the fuse lit and sparking',
  hat: sapperKit,
  scenes: [
    { name: 'Base', about: 'A charge thrown every 6 s; its burst hits every length it crosses.', dur: 4,
      body: false,
      draw(g, t, api) {
        const tT = 1.1;
        sapperAt(g, t, api.me, [[2, tT - LIFT, 2.8]]);
        const { tL, land } = throwStick(g, t, api, { tT, tx: 27, slot: 2, id: 1 });
        blows(g, t, tL, land, 0.45, [-4, 0, 4], api.st, 1);
      } },
    { name: 'Demolition', about: 'The whole burst is one blow, and it stuns.', dur: 5,
      body: false,
      state(t, api) { api.stun(2.2, 1.8); },
      draw(g, t, api) {
        const tT = 1.2, left = tT - LIFT;
        sapperAt(g, t, api.me, [[0, left, 3.0], [1, left, 3.5], [2, left, 4.0]]);
        const { tL, land } = throwBundle(g, t, api, { tT, fl: 1.0, tx: 29, r: 10, id: 2 });
        blows(g, t, tL, land, 0.85, [0], api.st, 2);
      } },
    { name: 'Incendiary', about: 'The burst sets every length it crosses Burning; a second charge stacks it.', dur: 8,
      body: false,
      state(t, api) {
        if (t >= spreadDone(27, 1.9)) api.status('burning', 0.34);
        if (t >= spreadDone(35, 5.4)) api.status('burning', 0.67);
      },
      draw(g, t, api) {
        sapperAt(g, t, api.me, [[2, 1.1 - LIFT, 6.4], [0, 4.6 - LIFT, 6.9]]);
        const a = throwStick(g, t, api, { tT: 1.1, tx: 27, slot: 2, r: 5, id: 3, hot: true });
        blows(g, t, a.tL, a.land, 0.35, [0], api.st, 3);
        catchFire(g, t, a.tL, 27, api.st, 0.34);
        const b = throwStick(g, t, api, { tT: 4.6, tx: 35, slot: 0, r: 5, id: 4, hot: true });
        blows(g, t, b.tL, b.land, 0.35, [0], api.st, 4);
        catchFire(g, t, b.tL, 35, api.st, 0.67);
      } },
    { name: 'Sticky Charge', about: 'A charge is stuck to the hide and ticks down; it blows as one blow, bigger the longer it was left, and stuns.', dur: 7,
      body: false,
      state(t, api) { api.stun(STICK.blow, STICK.stun); },
      draw(g, t, api) {
        const s = api.st;
        sapperAt(g, t, api.me, [[2, STICK.tT - LIFT, STUCK + 0.6]]);
        throwStick(g, t, api, { tT: STICK.tT, fl: STICK.fl, tx: STICK.tx, slot: 2, blow: false });
        stuckCharge(g, t, s);
        const y = coilBottom(STICK.tx, STICK.blow, s);
        boom(g, t, STICK.blow, STICK.tx, y, 10, s, STICK.id);
        blows(g, t, STICK.blow, { x: STICK.tx, y }, 0.8, [0], s, STICK.id);
      } },
  ],
});

// --- the Mage ------------------------------------------------------------------------
// Her kit is the looks page's (docs/mocks/classes/looks-2026-09-27.html): a
// staff taller than she is, stood against her left side, with a purple stone
// held in its claws at the top -- a bright cell over a dimmer one. To cast she
// lifts it a cell and the stone brightens; every spell leaves from the stone.
// The casts are kept small on purpose (the owner, 2026-09-27: the first base
// attack was "a bit too much"): a lift, a brightening, one small bolt, the
// ordinary burst. Because the staff moves, every Mage scene draws its own body
// and kit (`body: false`); the `hat` is the staff at rest.
//
// The stone's top cell with the staff lifted: where every spell leaves from.
const tipOf = me => ({ x: me.x - 1, y: me.y - 4 });
// The staff beside the body whose top-left is (me.x, me.y). `up` lifts it a
// cell for the cast; `glow` 0..1 is how bright the stone has come, and at the
// full its top goes white. `stone` false leaves the claws empty, while the
// Arcane's stone is away over the coil.
function staff(g, me, up = false, glow = 0, stone = true) {
  const x = me.x - 1, top = me.y - 3 - (up ? 1 : 0);
  for (let y = top + 2; y <= me.y + 2 - (up ? 1 : 0); y++) cell(g, x, y, GREYS[8]);
  cell(g, x - 1, top + 1, GREYS[8]); cell(g, x + 1, top + 1, GREYS[8]);   // the claws
  if (!stone) return;
  cell(g, x, top + 1, up ? PURPLES[11] : PURPLES[9]);
  cell(g, x, top, glow > 0.66 ? WHITE : PURPLES[11]);
}
function mageKit(g, cx, cy) { staff(g, { x: cx, y: cy }); }
// A Mage scene's own fighter: the body and the staff, lifted or not.
function mageAt(g, me, up, glow, stone) { drawBody(g, me.x, me.y); staff(g, me, up, glow, stone); }

// One cast, from `t0`: the staff goes up and the stone brightens over BRIGHT,
// the bolt leaves the stone at LEAVE and flies FLY, and the staff comes down
// a beat after it lands. CAST is when it lands, after its start.
const BRIGHT = 0.3, LEAVE = 0.35, FLY = 0.45, CAST = LEAVE + FLY, DOWN = CAST + 0.1;
const upAt = (t, starts) => starts.some(t0 => t >= t0 && t < t0 + DOWN);
const glowAt = (t, starts) => {
  for (const t0 of starts) if (t >= t0 && t < t0 + DOWN) return clamp((t - t0) / BRIGHT, 0, 1);
  return 0;
};
// A small bolt from the stone to (tx, the coil's underside): a bright head and
// a two-cell tail, in a straight run. `fire` is the Pyromancy's: the tail is
// flame, grey and flickering a cell up or down, where the plain one is purple.
function bolt(g, t, t0, me, tx, s, fire = false) {
  const a = t - t0;
  if (a < 0 || a >= FLY) return;
  const tip = tipOf(me), ty = coilBottom(tx, t0 + FLY, s) + 1;
  const at = q => ({ x: lerp(tip.x, tx, q), y: lerp(tip.y - 1, ty, q) });
  const p = a / FLY, f = Math.floor(t * FLICKER * 2);
  const tail = fire ? [GREYS[10], GREYS[7]] : [PURPLES[10], PURPLES[7]];
  tail.forEach((tone, i) => {
    const c = at(Math.max(0, p - (i + 1) * 0.07));
    const j = fire && i ? (hash(f * 3 + i) < 0.5 ? -1 : 1) : 0;
    cell(g, c.x, c.y + j, tone);
  });
  const c = at(p);
  cell(g, c.x, c.y, WHITE);
}
// One cast: the bolt, then where it lands the ordinary burst and chip.
function cast(g, t, api, { t0, tx, fire = false, id = 0, k = 0.35 }) {
  const me = api.me, s = api.st, tL = t0 + CAST;
  bolt(g, t, t0 + LEAVE, me, tx, s, fire);
  const y = coilBottom(tx, tL, s);
  burst(g, t, tL, tx, y, k, id);
  chip(g, t, tL, tx, Math.round(coilY(tx, t, s)), k, id);
  return { tL, x: tx, y };
}

// The Storm's forks: jagged runs of cells between two points, redrawn in a
// new zigzag every flicker so the lightning crawls rather than holds a shape.
// `bow` lifts the middle of the run, so a jump from one length to the next
// arcs over the coil's back instead of running along it.
function fork(g, t, ax, ay, bx, by, seed, bow = 0) {
  const f = Math.floor(t * 24);
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.max(2, Math.round(len / 2.5));
  const nx = -(by - ay) / len, ny = (bx - ax) / len;   // across the run
  const pts = [{ x: ax, y: ay }];
  for (let i = 1; i <= n; i++) {
    const q = i / n;
    const j = i === n ? 0 : (hash(seed * 17 + i * 5 + f) - 0.5) * 2.5;
    pts.push({ x: lerp(ax, bx, q) + nx * j, y: lerp(ay, by, q) + ny * j - bow * Math.sin(Math.PI * q) });
  }
  // one white run with the abyss's purple at every other cell, so the fork
  // is the same weight as the bolt it stands in for
  for (let i = 1; i < pts.length; i++)
    line(g, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, null, (cx, cy, k) =>
      cell(g, cx, cy, (k + i + f) % 2 ? PURPLES[10] : WHITE));
}
const STORM = [{ x: 24, at: 0 }, { x: 36, at: 0.12 }, { x: 48, at: 0.24 }];
const STRIKE = 1.0;   // when the first fork lands; the staff goes up LEAVE before

// The Arcane's lantern: the stone lifts off the staff and hangs over the coil
// at column LANTERN_X, four clear rows over its back, riding its sway -- a purple
// cell at the middle of a small ring -- and the coil is lit outward from
// under it. The stone's path there and back is eased, so it drifts rather
// than darts.
const LANTERN_X = 24;
const ARC = { lift: 0.4, off: 0.8, there: 1.8, light: 2.2, close: 4.4, back: 4.7, home: 5.7, down: 5.9 };
const lanternY = (t, s) => Math.max(2, coilTop(LANTERN_X, t, s) - 5);
// The lantern's ring, laid by hand so it is round at this size: four cells
// as it opens, then twelve.
const RING1 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const RING2 = [[2, 0], [-2, 0], [0, 2], [0, -2], [1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]];
const ease = k => k * k * (3 - 2 * k);
function lantern(g, t, me, s) {
  const tip = tipOf(me);
  let k = 0;
  if (t >= ARC.off && t < ARC.there) k = ease((t - ARC.off) / (ARC.there - ARC.off));
  else if (t >= ARC.there && t < ARC.back) k = 1;
  else if (t >= ARC.back && t < ARC.home) k = 1 - ease((t - ARC.back) / (ARC.home - ARC.back));
  else return;
  const x = Math.round(lerp(tip.x, LANTERN_X, k)), y = Math.round(lerp(tip.y, lanternY(t, s), k));
  // the ring opens once it is there and closes before it goes back
  const open = t >= ARC.there && t < ARC.back
    ? Math.min(clamp((t - ARC.there) / 0.3, 0, 1), clamp((ARC.back - t) / 0.3, 0, 1)) : 0;
  if (open > 0) for (const [dx, dy] of open < 0.5 ? RING1 : RING2) cell(g, x + dx, y + dy, open < 0.5 ? PURPLES[7] : PURPLES[9]);
  // the stone on its way, drawn as it sits in the claws: purple, so it still
  // shows as it crosses the white of the coil
  if (k < 1) { cell(g, x, y, PURPLES[11]); cell(g, x, y + 1, PURPLES[9]); }
  else cell(g, x, y, PURPLES[11]);
}

registerClass({
  key: 'mage', name: 'Mage', station: 'spire', group: 'fire',
  look: 'a staff taller than her, a purple stone held in its claws',
  hat: mageKit,
  scenes: [
    { name: 'Base', about: 'A bolt every 2 s, a blow; the bolt Lights the coil where it lands.', dur: 4,
      body: false,
      state(t, api) { if (t >= 0.5 + CAST) api.status('lit', 1); },
      draw(g, t, api) {
        const starts = [0.5, 2.5];
        mageAt(g, api.me, upAt(t, starts), glowAt(t, starts));
        cast(g, t, api, { t0: 0.5, tx: 26, id: 11 });
        cast(g, t, api, { t0: 2.5, tx: 38, id: 12 });
      } },
    { name: 'Pyromancy', about: 'Bolts set Burning, from where they land to the whole coil.', dur: 7,
      body: false,
      state(t, api) {
        if (t >= 0.5 + CAST) api.status('lit', 1);
        if (t >= spreadDone(30, 0.5 + CAST)) api.status('burning', 0.34);
        if (t >= spreadDone(40, 3.5 + CAST)) api.status('burning', 0.67);
      },
      draw(g, t, api) {
        const starts = [0.5, 3.5];
        mageAt(g, api.me, upAt(t, starts), glowAt(t, starts));
        const a = cast(g, t, api, { t0: 0.5, tx: 30, fire: true, id: 13 });
        catchFire(g, t, a.tL, a.x, api.st, 0.34);
        const b = cast(g, t, api, { t0: 3.5, tx: 40, fire: true, id: 14 });
        catchFire(g, t, b.tL, b.x, api.st, 0.67);
      } },
    { name: 'Storm', about: 'A bolt jumps to two more lengths, each a blow.', dur: 3.5,
      body: false,
      state(t, api) { if (t >= STRIKE) api.status('lit', 1); },
      draw(g, t, api) {
        const me = api.me, s = api.st, tip = tipOf(me), t0 = STRIKE - LEAVE;
        mageAt(g, me, t >= t0 && t < STRIKE + 0.4, glowAt(t, [t0]));
        let from = { x: tip.x, y: tip.y - 1 };
        STORM.forEach((j, i) => {
          // the first fork strikes the belly; each jump comes down on the back
          const at = STRIKE + j.at, y = i ? coilTop(j.x, at, s) : coilBottom(j.x, at, s);
          // a fork shows for a fifth of a second from the moment it lands
          if (t >= at && t < at + 0.2) fork(g, t, from.x, from.y, j.x, i ? coilTop(j.x, t, s) - 1 : y + 1, i + 1, i ? 4 : 0);
          burst(g, t, at, j.x, y, 0.35, 20 + i);
          chip(g, t, at, j.x, Math.round(coilY(j.x, t, s)), 0.35, 20 + i);
          from = { x: j.x, y: coilTop(j.x, t, s) - 1 };
        });
      } },
    { name: 'Arcane', about: 'Every 8 s the stone leaves the staff and hangs over the coil like a lantern; the coil lights outward from under it until all of it is Lit (the answer to fading).', dur: 7,
      body: false,
      state(t, api) { if (t >= litDone(LANTERN_X, ARC.light)) api.status('lit', 1); },
      draw(g, t, api) {
        const me = api.me, s = api.st;
        const up = t >= ARC.lift && t < ARC.down;
        const away = t >= ARC.off && t < ARC.home;
        mageAt(g, me, up, up ? clamp((t - ARC.lift) / BRIGHT, 0, 1) : 0, !away);
        lightFrom(g, t, ARC.light, LANTERN_X, s);
        lantern(g, t, me, s);
      } },
  ],
});
