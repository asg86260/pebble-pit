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

// The light going on: a bright front that runs both ways from where the bolt
// landed, painting the whole column of the body as it passes, and the Lit
// outline behind it. Loud for the half second it takes; then the painter.
const LIT_RUN = 60;
const litDone = (x0, t0) => t0 + (Math.max(x0 - COIL_X0, COIL_X1 - x0) + 4) / LIT_RUN;
function lightUp(g, t, t0, x0, s) {
  const a = t - t0;
  const r = a * LIT_RUN;
  if (a < 0 || r > Math.max(x0 - COIL_X0, COIL_X1 - x0) + 4) return;
  litCells(g, t, s, x0 - r, x0 + r);
  for (const side of [-1, 1]) for (let d = 0; d < 3; d++) {
    const fx = Math.round(x0 + side * (r - d));
    if (fx < COIL_X0 || fx > COIL_X1) continue;
    const top = coilTop(fx, t, s), bot = coilBottom(fx, t, s);
    for (let cy = top - 1; cy <= bot + 1; cy++) cell(g, fx, cy, d === 0 ? WHITE : d === 1 ? PURPLES[11] : PURPLES[9]);
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

// A charge: a round of dark powder with a pale shine, a stub of fuse and a
// spark that will not sit still on it. (x, y) is its top-left cell.
function charge(g, x, y, t, n = 2) {
  x = Math.round(x); y = Math.round(y);
  rect(g, x, y, n, n, GREYS[7]);
  cell(g, x, y, WHITE);
  cell(g, x + n, y - 1, GREYS[7]);
  const f = Math.floor(t * 16);
  cell(g, x + n + (f % 2), y - 2 + (f % 3 === 0 ? 1 : 0), f % 2 ? WHITE : GREYS[10]);
}

// --- the Sapper ---------------------------------------------------------------------
// A miner's helmet with its lamp at the front, and a satchel of charges on
// the hip that every charge is drawn out of.
function sapperHat(g, cx, cy, t) {
  rect(g, cx - 1, cy - 1, 5, 1, GREYS[7]);
  rect(g, cx, cy - 2, 3, 1, GREYS[8]);
  cell(g, cx + 3, cy - 2, Math.floor(t * 3) % 5 ? WHITE : GREYS[10]);  // the lamp
}
function satchel(g, x, y) {
  rect(g, x - 1, y + 1, 1, 2, GREYS[5]);
  cell(g, x - 1, y + 1, GREYS[8]);
}

// One throw: the charge comes out of the satchel, is held, flies in an arc
// to the coil and goes off. `tT` the throw, `fl` the flight, `tx` the column
// it lands on. Returns where it landed for the scene to hang its blow on.
function throwCharge(g, t, api, { tT, fl = 0.8, tx, n = 2, r = 6, id = 0, s = api.st }) {
  const me = api.me, tL = tT + fl;
  const hand = { x: me.x + 3, y: me.y + 1 };
  const land = { x: tx, y: coilBottom(tx, tL, s) };
  const out = tT - 0.9;   // drawn from the satchel this long before the throw
  if (t >= out && t < tT) {
    const k = clamp((t - out) / 0.35, 0, 1);
    charge(g, lerp(me.x - 1, hand.x, k), lerp(me.y + 1, hand.y, k) - Math.sin(Math.PI * k) * 2, t, n);
  } else if (t >= tT && t < tL) {
    const p = (t - tT) / fl;
    const x = lerp(hand.x, land.x - n / 2, p);
    const y = lerp(hand.y, land.y + 1, p) - Math.sin(Math.PI * p) * 3;
    // the fuse sparks off a cell or two behind it as it goes
    for (let i = 1; i <= 2; i++) {
      const q = Math.max(0, p - i * 0.05);
      cell(g, lerp(hand.x, land.x, q), lerp(hand.y, land.y, q) - Math.sin(Math.PI * q) * 3 - 1, i === 1 ? GREYS[8] : GREYS[5]);
    }
    charge(g, x, y, t, n);
  }
  boom(g, t, tL, land.x, land.y, r, s, id);
  return { tL, land };
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

// The Minefield's charges, each laid at column `x` as the Sapper swims past,
// sinking to the floor as an anchor, then riding up its tether to hang where
// the coil will come down on it. Each one's height is the lowest reach of the
// coil's belly over its column while it is armed, so the sway sets it off at
// the bottom of a swing; `at` is the first frame the belly touches it.
const MINE_DUR = 11, SWIM = 9;
// A mine: a squat round of powder with two horns on top and, once it is up
// its tether and armed, a light between the horns that blinks. `x` is its
// middle column, `y` its top row below the horns.
function mine(g, x, y, t, armed) {
  x = Math.round(x); y = Math.round(y);
  rect(g, x - 1, y, 3, 2, GREYS[7]);
  cell(g, x - 1, y, WHITE);
  cell(g, x - 1, y - 1, GREYS[9]); cell(g, x + 1, y - 1, GREYS[9]);
  if (armed) cell(g, x, y - 1, Math.floor(t * 3) % 2 ? WHITE : GREYS[4]);
}
const MINE_XS = [26, 30, 36];   // chosen so the three go off apart: 8.4 s, 6.2 s, 7.3 s
const MINES = MINE_XS.map((x, i) => {
  const laid = 0.6 + (x - STATION_X) / SWIM;         // swimming out, it drops each as it passes
  const armed = laid + 0.5 + 1.2;                     // 0.5 s to sink, 1.2 s to rise
  let y = 0, at = armed;
  for (let t = armed + 0.3; t < MINE_DUR - 2; t += 1 / 60) {
    const b = coilBottom(x, t, {});
    if (b > y) { y = b; at = t; }
  }
  y += 1;
  // first frame the belly comes within a cell of it
  for (let t = armed; t < MINE_DUR - 2; t += 1 / 60) if (coilBottom(x, t, {}) >= y - 1) { at = t; break; }
  return { x, laid, armed, y, at, id: 60 + i };
});

registerClass({
  key: 'sapper', name: 'Sapper', station: 'armory', group: 'fire',
  look: 'a miner\'s helmet with its lamp lit; a satchel of charges on the hip',
  hat: sapperHat,
  scenes: [
    { name: 'Base', about: 'A charge thrown every 6 s; its burst hits every length it crosses.', dur: 4,
      draw(g, t, api) {
        satchel(g, api.me.x, api.me.y);
        const { tL, land } = throwCharge(g, t, api, { tT: 1.1, tx: 27, id: 1 });
        blows(g, t, tL, land, 0.45, [-4, 0, 4], api.st, 1);
      } },
    { name: 'Demolition', about: 'The whole burst is one blow, and it stuns.', dur: 5,
      state(t, api) { api.stun(2.2, 1.8); },
      draw(g, t, api) {
        satchel(g, api.me.x, api.me.y);
        const { tL, land } = throwCharge(g, t, api, { tT: 1.2, fl: 1.0, tx: 29, n: 3, r: 10, id: 2 });
        blows(g, t, tL, land, 0.85, [0], api.st, 2);
      } },
    { name: 'Incendiary', about: 'The burst sets every length it crosses Burning; a second charge stacks it.', dur: 8,
      state(t, api) {
        if (t >= spreadDone(27, 1.9)) api.status('burning', 0.34);
        if (t >= spreadDone(35, 5.4)) api.status('burning', 0.67);
      },
      draw(g, t, api) {
        satchel(g, api.me.x, api.me.y);
        const a = throwCharge(g, t, api, { tT: 1.1, tx: 27, r: 5, id: 3 });
        blows(g, t, a.tL, a.land, 0.35, [0], api.st, 3);
        catchFire(g, t, a.tL, 27, api.st, 0.34);
        const b = throwCharge(g, t, api, { tT: 4.6, tx: 35, r: 5, id: 4 });
        blows(g, t, b.tL, b.land, 0.35, [0], api.st, 4);
        catchFire(g, t, b.tL, 35, api.st, 0.67);
      } },
    { name: 'Minefield', about: 'Charges laid on the floor ride up their tethers; the coil sets each off as it sways down on it.', dur: MINE_DUR,
      body: false,
      draw(g, t, api) {
        // the swim: out along the mines, dropping one at each, and home
        const out = 0.6, far = MINE_XS[MINE_XS.length - 1];
        const back = out + (far - STATION_X) / SWIM;
        const home = back + 0.4 + (far - STATION_X) / SWIM;
        let bx = api.me.x;
        if (t >= out && t < back) bx = api.me.x + (t - out) * SWIM;
        else if (t >= back && t < back + 0.4) bx = api.me.x + far - STATION_X;
        else if (t >= back + 0.4 && t < home) bx = api.me.x + far - STATION_X - (t - back - 0.4) * SWIM;
        const by = api.me.y + (t > out && t < home ? Math.round(Math.sin(t * 8) * 0.5) : 0);
        drawBody(g, bx, by); sapperHat(g, bx, by, t); satchel(g, bx, by);
        for (const m of MINES) {
          if (t < m.laid) continue;
          const sink = clamp((t - m.laid) / 0.5, 0, 1);
          const floorY = FLOOR - 1;
          if (t < m.laid + 0.5) { mine(g, m.x, lerp(by + 3, floorY - 2, sink), t, false); continue; }
          // the anchor on the floor and the tether up to the charge
          rect(g, m.x - 1, floorY, 3, 1, GREYS[6]);
          const rise = clamp((t - m.laid - 0.5) / 1.2, 0, 1);
          const my = Math.round(lerp(floorY - 2, m.y, rise));
          if (t < m.at) {
            for (let y = my + 2; y < floorY; y++) if (y % 2 === 0) cell(g, m.x, y, GREYS[5]);
            mine(g, m.x, my, t, rise >= 1);
          } else {
            // the tether, cut, sinks back to the anchor
            const k = clamp((t - m.at) / 1.2, 0, 1);
            for (let y = Math.round(lerp(my + 2, floorY - 1, k)); y < floorY; y++) if (y % 2 === 0) cell(g, m.x, y, GREYS[4]);
          }
          boom(g, t, m.at, m.x, m.y, 6, api.st, m.id);
          burst(g, t, m.at, m.x, m.y - 1, 0.45, m.id);
          chip(g, t, m.at, m.x, coilBottom(m.x, t, api.st) - 1, 0.45, m.id);
        }
      } },
  ],
});

// --- the Mage ------------------------------------------------------------------------
// A pointed hat with a wide brim, in the abyss's purple,
// and a staff with a purple stone that brightens as a spell gathers.
function mageHat(g, cx, cy) {
  rect(g, cx - 1, cy - 1, 5, 1, PURPLES[8]);
  cell(g, cx + 1, cy - 2, PURPLES[10]);   // the point
}
// The staff stands a cell clear of the body and rises past the hat, so its
// stone is the highest thing on the plinth and a spell starts from it.
const tipOf = me => ({ x: me.x + 4, y: me.y - 3 });
// `glow` 0..1: how gathered the spell is.
function staff(g, me, glow) {
  const tip = tipOf(me);
  for (let y = tip.y + 1; y <= me.y + 2; y++) cell(g, tip.x, y, GREYS[7]);
  cell(g, tip.x, tip.y, glow > 0.66 ? WHITE : glow > 0.33 ? PURPLES[11] : PURPLES[9]);
  if (glow > 0.66) { cell(g, tip.x - 1, tip.y, PURPLES[10]); cell(g, tip.x + 1, tip.y, PURPLES[10]); cell(g, tip.x, tip.y - 1, PURPLES[10]); }
}
// A spell gathering at the staff's stone: a ring of cells that draws in.
function gather(g, t, t0, len, me) {
  const a = t - t0;
  if (a < 0 || a > len) return 0;
  const k = a / len, tip = tipOf(me);
  ring(g, tip.x, tip.y, 1 + 3 * (1 - k), k < 0.5 ? PURPLES[7] : PURPLES[10], 2);
  return k;
}
// A bolt of the abyss: a white head with a purple tail that ripples as it
// goes, from the staff to (tx, the coil).
function bolt(g, t, t0, fl, me, tx, s, fire = false) {
  const a = t - t0;
  if (a < 0 || a >= fl) return;
  const tip = tipOf(me), ty = coilBottom(tx, t0 + fl, s);
  const at = q => ({ x: lerp(tip.x, tx, q), y: lerp(tip.y, ty, q) + Math.sin(q * Math.PI * 4) * 0.8 });
  const p = a / fl;
  if (fire) {
    // the fire bolt: a white-hot knot whose flames trail and flicker behind
    const f = Math.floor(t * FLICKER * 2);
    for (let i = 1; i <= 5; i++) {
      const q = Math.max(0, p - i * 0.045), c = at(q);
      const j = hash(f * 3 + i) < 0.5 ? -1 : 1;
      cell(g, c.x, c.y + (i > 1 ? j : 0), i < 2 ? WHITE : i < 4 ? GREYS[10] : GREYS[7]);
    }
    const c = at(p);
    rect(g, Math.round(c.x) - 1, Math.round(c.y) - 1, 2, 2, WHITE);
    cell(g, c.x + 1, c.y - 1, PURPLES[10]);
    cell(g, c.x - 1, c.y + 1, PURPLES[10]);
    return;
  }
  const tail = [PURPLES[11], PURPLES[10], PURPLES[8], PURPLES[6], PURPLES[4]];
  tail.forEach((tone, i) => { const c = at(Math.max(0, p - (i + 1) * 0.04)); cell(g, c.x, c.y, tone); });
  const c = at(p);
  cell(g, c.x, c.y, WHITE);
  cell(g, c.x, c.y - 1, PURPLES[11]); cell(g, c.x, c.y + 1, PURPLES[11]);
}
// The ripple a spell leaves where it strikes: rings of purple going out and
// going dark, the abyss's own way of saying something landed.
function ripple(g, t, t0, cx, cy) {
  const a = t - t0;
  if (a < 0 || a > 0.8) return;
  ring(g, cx, cy, 1 + a * 8, a < 0.3 ? PURPLES[11] : a < 0.55 ? PURPLES[9] : PURPLES[6], 2);
  if (a > 0.2) ring(g, cx, cy, 1 + (a - 0.2) * 8, PURPLES[7], 3);
}
// One cast: gather for half a second, fly, land. Returns when and where it
// landed; CAST is how long after its start a cast lands.
const CAST = 0.5 + 0.55;
function cast(g, t, api, { t0, tx, fl = 0.55, fire = false, id = 0, k = 0.4 }) {
  const me = api.me, s = api.st;
  const tL = t0 + 0.5 + fl;
  bolt(g, t, t0 + 0.5, fl, me, tx, s, fire);
  const y = coilBottom(tx, tL, s);
  if (t >= tL) {
    ripple(g, t, tL, tx, y);
    burst(g, t, tL, tx, y, k, id);
    chip(g, t, tL, tx, Math.round(coilY(tx, t, s)), k, id);
  }
  return { tL, x: tx, y };
}
// The staff's glow for a frame, from the casts the scene makes: it brightens
// over each gathering and drops as the bolt leaves.
function glowAt(t, starts) {
  for (const t0 of starts) if (t >= t0 && t < t0 + 0.5) return (t - t0) / 0.5;
  return 0;
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
    const j = i === n ? 0 : (hash(seed * 17 + i * 5 + f) - 0.5) * 3.5;
    pts.push({ x: lerp(ax, bx, q) + nx * j, y: lerp(ay, by, q) + ny * j - bow * Math.sin(Math.PI * q) });
  }
  // a purple fringe a cell to the side of the white, so the bolt has the
  // abyss in it, then the white stroke over it
  for (const dx of [1, 0]) for (let i = 1; i < pts.length; i++)
    line(g, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, null, (cx, cy) =>
      cell(g, cx + dx, cy, dx ? ((i + f) % 2 ? PURPLES[10] : PURPLES[8]) : WHITE));
}

const STORM = [{ x: 24, at: 0 }, { x: 36, at: 0.12 }, { x: 48, at: 0.24 }];
const STRIKE = 1.0;   // when the first fork lands

registerClass({
  key: 'mage', name: 'Mage', station: 'spire', group: 'fire',
  look: 'a pointed purple hat with a wide brim; a staff with a purple stone',
  hat: mageHat,
  scenes: [
    { name: 'Base', about: 'A bolt every 2 s, a blow; the bolt Lights the coil where it lands.', dur: 4,
      state(t, api) { if (t >= litDone(26, 0.5 + CAST)) api.status('lit', 1); },
      draw(g, t, api) {
        const starts = [0.5, 2.5];
        staff(g, api.me, glowAt(t, starts));
        for (const t0 of starts) gather(g, t, t0, 0.5, api.me);
        const a = cast(g, t, api, { t0: 0.5, tx: 26, id: 11 });
        lightUp(g, t, a.tL, a.x, api.st);
        const b = cast(g, t, api, { t0: 2.5, tx: 38, id: 12 });
        lightUp(g, t, b.tL, b.x, api.st);
      } },
    { name: 'Pyromancy', about: 'Bolts set Burning, from where they land to the whole coil.', dur: 7,
      state(t, api) {
        if (t >= litDone(30, 0.5 + CAST)) api.status('lit', 1);
        if (t >= spreadDone(30, 0.5 + CAST)) api.status('burning', 0.34);
        if (t >= spreadDone(40, 3.5 + CAST)) api.status('burning', 0.67);
      },
      draw(g, t, api) {
        const starts = [0.5, 3.5];
        staff(g, api.me, glowAt(t, starts));
        for (const t0 of starts) gather(g, t, t0, 0.5, api.me);
        const a = cast(g, t, api, { t0: 0.5, tx: 30, fire: true, id: 13, k: 0.45 });
        lightUp(g, t, a.tL, a.x, api.st);
        catchFire(g, t, a.tL, a.x, api.st, 0.34);
        const b = cast(g, t, api, { t0: 3.5, tx: 40, fire: true, id: 14, k: 0.45 });
        catchFire(g, t, b.tL, b.x, api.st, 0.67);
      } },
    { name: 'Storm', about: 'A bolt jumps to two more lengths, each a blow.', dur: 3.5,
      // the light goes on once the forks have gone, so the two do not talk over each other
      state(t, api) { if (t >= litDone(STORM[0].x, STRIKE + 0.5)) api.status('lit', 1); },
      draw(g, t, api) {
        const me = api.me, s = api.st, tip = tipOf(me);
        staff(g, me, glowAt(t, [STRIKE - 0.5]));
        gather(g, t, STRIKE - 0.5, 0.5, me);
        let from = { x: tip.x, y: tip.y };
        STORM.forEach((j, i) => {
          // the first fork strikes the belly; each jump comes down on the back
          const at = STRIKE + j.at, y = i ? coilTop(j.x, at, s) : coilBottom(j.x, at, s);
          // a fork shows for a quarter second from the moment it lands
          if (t >= at && t < at + 0.28) fork(g, t, from.x, from.y, j.x, i ? coilTop(j.x, t, s) - 1 : y, i + 1, i ? 4 : 0);
          if (t >= at) {
            ripple(g, t, at, j.x, y);
            burst(g, t, at, j.x, y, 0.35, 20 + i);
            chip(g, t, at, j.x, Math.round(coilY(j.x, t, s)), 0.35, 20 + i);
          }
          from = { x: j.x, y: coilTop(j.x, t, s) - 1 };
        });
        lightUp(g, t, STRIKE + 0.5, STORM[0].x, s);
      } },
    { name: 'Arcane', about: 'Every 8 s the spire\'s light sweeps the whole coil, head to tail: all of it Lit.', dur: 6,
      state(t, api) { if (t >= 3.4) api.status('lit', 1); },
      draw(g, t, api) {
        const me = api.me, s = api.st, tip = tipOf(me);
        const t0 = 0.8, t1 = 1.6, t2 = 3.4;   // gather, sweep from, sweep to
        staff(g, me, t >= t0 && t < t2 ? 1 : 0);
        gather(g, t, t0, t1 - t0, me);
        if (t < t1 || t >= t2) return;
        const xs = lerp(COIL_X0, COIL_X1, (t - t1) / (t2 - t1));
        litCells(g, t, s, COIL_X0, xs);
        // the beam: a fan of runs from the stone that opens to five cells
        // where it meets the coil -- dim and broken at its edges, solid and
        // shimmering down its middle -- and a bright band where it falls
        const by = coilBottom(Math.round(xs), t, s) + 1;
        const f = Math.floor(t * 12);
        for (const dx of [-2, 2, -1, 1, 0]) line(g, tip.x, tip.y - 1, xs + dx, by, null, (x, y, i) => {
          const edge = Math.abs(dx);
          if (edge === 2 && (i + f) % 2) return;
          cell(g, x, y, edge === 2 ? PURPLES[5] : edge === 1 ? PURPLES[7] : (i + f) % 3 === 0 ? WHITE : PURPLES[10]);
        });
        for (let dx = -1; dx <= 1; dx++) {
          const cx = Math.round(xs) + dx, top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
          for (let cy = top - 1; cy <= bot + 1; cy++) cell(g, cx, cy, dx ? PURPLES[11] : WHITE);
        }
      } },
  ],
});
