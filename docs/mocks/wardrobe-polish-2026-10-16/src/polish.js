// The polished draws: what the mock proposes, drawn with the game's own
// helpers (`fill`, `art`, the inks) so the only differences from "today"
// are the ones named. Everything not listed in POLISHED is handed straight to
// the game's own draw.
//
// Three changes run through all of it:
//  1. Rigid: the body's corner is put on a whole device pixel before anything
//     on it is drawn, so its two-pixel marks keep one shape while it walks
//     (today each mark rounds on its own and the 1 px / 2 px pattern crawls).
//  2. Keyline: everything worn outside the square gets one unit of paper
//     round it, drawn under the body, so a black cape or hat still reads in
//     front of the rock, a building or another body; on the bare yard it is
//     invisible.
//  3. Follow-through: a dangle reads the body's walk as a phase -- `start`
//     (one held pose lagging), `walk`, `stop` (three held poses: catching up,
//     one unit past rest, back) and `rest` -- instead of snapping from the
//     walking pose to the standing one.

import { fill, art } from '../../../../src/render/wardrobe.js';
import { dressBehind, dressOn, dressHead } from '../../../../src/render/wardrobe.js';
import { dressAura, rampOf } from '../../../../src/render/wardaura.js';
import { itemOf } from '../../../../src/wardrobe.js';
import { WORKER, BODY_RIM, P, WARD_UNIT as U, WARD_STEP_HZ, WARD_BOB_HZ, WARD_HEADS as H,
         ABYSS_MAGIC_TONES, PURPLE, WARD_AURAS } from '../../../../src/config.js';
import { seen, PURPLES, GREYS } from '../../../../src/render/deeptones.js';

export const SETTLE_S = 0.13;      // one held pose of the settle
const pose = (t, hz, n = 2) => Math.floor((t || 0) * hz) % n;

// The body's walk as a phase. `l.since` is how long `l.moving` has held.
export function phaseOf(l) {
  const n = Math.floor((l.since || 0) / SETTLE_S);
  if (l.moving) return n < 1 ? { k: 'start' } : { k: 'walk', p: pose(l.t, WARD_STEP_HZ) };
  return n < 3 ? { k: 'stop', i: n } : { k: 'rest', b: pose(l.t, WARD_BOB_HZ) };
}

const across = (x, l, rx, w) => x + (l.dir < 0 ? WORKER - rx - w : rx);
const unit = (g, x, y, l, ux, uy, tone) => fill(g, across(x, l, ux * U, U), y + uy * U, U, U, tone);
const rect = (g, x, y, l, [rx, ry, rw, rh], tone) => fill(g, across(x, l, rx, rw), y + ry, rw, rh, tone);
function units(g, x, y, l, rows, ux, uy, k) {
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') unit(g, x, y, l, ux + c, uy + r, ch === 'w' ? k.paper : ch === 'g' ? k.grey : k.ink);
  }));
}
const rowsRects = (rows, ox, oy) => {
  const out = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') out.push([(ox + c) * U, (oy + r) * U, U, U]); }));
  return out;
};
const BODY_UNITS = WORKER / U;

// --- the cape -------------------------------------------------------------------------
// Columns [top, bottom) in units, the one nearest the back first, hung one
// unit off the back below a clasp: the square keeps its own back edge.
const CAPE = {
  rest: [[0, 7], [1, 7], [3, 7]],
  walk: [[[0, 7], [0, 6], [0, 6], [1, 6], [1, 5], [2, 5], [3, 5]],
         [[0, 7], [-1, 6], [-1, 6], [-1, 5], [0, 5], [0, 4], [1, 4]],
         [[0, 7], [0, 7], [1, 7], [2, 7], [2, 6], [3, 6], [4, 6]]],
  start: [[0, 7], [0, 7], [1, 6], [2, 6], [3, 5]],
  stop: [[[0, 7], [0, 7], [1, 7], [2, 7], [4, 7]],      // falling back to the back
         [[0, 8], [2, 8]],                               // one past: swung in under
         [[0, 7], [1, 7], [2, 7], [5, 7]]],              // back out, then rest
};
const short = cols => cols.slice(0, 5).map(([t, b]) => [t, t + Math.max(1, Math.round((b - t) * 4 / 7))]);
function capeCols(l) {
  const ph = phaseOf(l);
  return ph.k === 'walk' ? CAPE.walk[pose(l.t, WARD_STEP_HZ, 3)] : ph.k === 'start' ? CAPE.start
    : ph.k === 'stop' ? CAPE.stop[ph.i] : CAPE.rest;
}
function cape(g, x, y, l, k, isShort, trim) {
  let cols = capeCols(l);
  if (isShort) cols = short(cols);
  const set = [];
  cols.forEach(([top, bot], i) => { for (let v = top; v < Math.min(bot, BODY_UNITS); v++) set.push([-(i + 2), v]); });
  const has = new Set(set.map(([a, b]) => a + ',' + b)), far = Math.min(...set.map(s => s[0]));
  // the clasp: the cape's top two units against the back
  unit(g, x, y, l, -1, 0, k.ink); unit(g, x, y, l, -1, 1, k.ink);
  for (const [ux, uy] of set) {
    const hem = trim && (!has.has(ux + ',' + (uy + 1)) || ux === far);
    unit(g, x, y, l, ux, uy, hem ? k.gold : k.ink);
  }
}

// --- the balloon ----------------------------------------------------------------------
const BALLOON = ['.###.', '#####', '#w###', '#####', '.###.', '..#..'];
const KNOT = { rest: [[-1, -7], [-1, -8]], walk: [[-4, -8], [-5, -7]], start: [-2, -8],
               stop: [[-3, -8], [0, -8], [-2, -7]] };
function balloon(g, x, y, l, k) {
  const ph = phaseOf(l);
  const [kx, ky] = ph.k === 'walk' ? KNOT.walk[ph.p] : ph.k === 'start' ? KNOT.start
    : ph.k === 'stop' ? KNOT.stop[ph.i] : KNOT.rest[ph.b];
  const ey = ky + 2, n = Math.max(Math.abs(kx), Math.abs(ey));
  for (let i = 0; i <= n; i++) unit(g, x, y, l, Math.round(kx * i / n), -1 + Math.round(ey * i / n), k.ink);
  units(g, x, y, l, BALLOON, kx - 2, ky - BALLOON.length + 1, k);
}

// --- the flag -------------------------------------------------------------------------
const PENNANT = [4, 4, 3, 3, 3, 2, 2, 1, 1];
const WAVE = [[0, 0, 0, 1, 1, 0, 0, -1, -1], [0, 0, 0, 0, 1, 1, 1, 0, 0]];
const DROOP = [4, 4, 3, 3, 2, 2, 1];
const POLE_TOP = -11, POLE_FOOT = 6, PT = -10;
function flag(g, x, y, l, k) {
  for (let v = POLE_TOP; v < POLE_FOOT; v++) unit(g, x, y, l, -1, v, k.ink);
  const col = (i, top, h) => { for (let r = 0; r < h; r++) unit(g, x, y, l, -2 - i, top + r, k.ink); };
  const ph = phaseOf(l);
  const droop = (sag, tip, n = DROOP.length) => DROOP.slice(0, n).forEach((h, i) => col(i, PT + Math.round(i * sag) + (i >= 5 ? tip : 0), h));
  if (ph.k === 'walk') PENNANT.forEach((h, i) => col(i, PT + Math.floor((4 - h) / 2) + WAVE[ph.p][i], h));
  else if (ph.k === 'start') PENNANT.slice(0, 8).forEach((h, i) => col(i, PT + Math.floor((4 - h) / 2) + Math.round(i * 0.6), h));
  else if (ph.k === 'stop') [() => droop(1.0, 0, 8), () => droop(1.8, 0, 6), () => droop(1.5, -1)][ph.i]();
  else droop(1.5, ph.b);
}

// --- the scarf's tail -----------------------------------------------------------------
// The striped scarf's light stripes are the grey on the tail, where the
// ground shows through the paper and the tail fell apart into dashes.
const scarfTone = (kind, i, k, check) => (i % 2 ? (kind === 'check' ? check : kind === 'stripe' ? k.grey : k.ink) : k.ink);
const SCARF_WAVE = [[0, 0, 1, 1, 0, 0, -1, -1, 0], [0, 0, 0, 1, 1, 1, 0, 0, -1]];
function scarfTail(g, nk, x, y, l, k, h = WORKER) {
  const kind = nk.tail, band = nk.grid.findIndex(r => r.replace(/\./g, '')), chk = nk.tone ? k[nk.tone] : k.grey;
  const by = y + BODY_RIM + band * U + (h - WORKER) / P * U, floor = y + h, n = Math.max(0, Math.round((floor - by) / U));
  const ph = phaseOf(l), tone = i => scarfTone(kind, i, k, chk);
  const at = (ux, uy, w, hh, i) => fill(g, across(x, l, ux * U, w * U), by + uy * U, w * U, hh * U, tone(i));
  if (ph.k === 'walk') { SCARF_WAVE[ph.p].forEach((lift, i) => at(-(i + 1), lift, 1, 2, i)); return; }
  if (ph.k === 'start') { for (let i = 0; i < 8; i++) at(-(i + 1), Math.round(i * 0.7), 1, 2, i); return; }
  // hanging: a column two wide; `lean(i)` how far back row i stands, `kick` the foot
  const hang = (lean, kick) => {
    for (let i = 0; i < n; i++) at(-2 - lean(i), i, 2, 1, i);
    for (let j = 1; j <= kick; j++) at(-2 - lean(n - 1) - j, n - 1, 1, 1, n + j - 1);
  };
  if (ph.k === 'stop') [() => hang(i => Math.floor(i / 2), 0),       // falling, swung back
                        () => hang(i => (i > n / 2 ? -1 : 0), 0),     // one past: in under the body
                        () => hang(() => 0, 2)][ph.i]();              // the foot kicked back two
  else hang(() => 0, 1);
}

// --- the bow's ribbon -----------------------------------------------------------------
const BOW = [[2, -6, 4, 2], [12, -6, 4, 2], [2, -4, 2, 2], [6, -4, 6, 2], [14, -4, 2, 2], [2, -2, 4, 2], [12, -2, 4, 2]];
const RIBBON = {
  rest: rowsRects(['##', '#.', '##', '.#', '.#', '#.'], -2, -1),
  walk: [[...rowsRects(['......', '######', '......'], -6, -1), ...rowsRects(['......', '......', '######'], -6, 0)],
         [...rowsRects(['..####', '##....', '......'], -6, -1), ...rowsRects(['......', '...###', '###...'], -6, 0)]],
  start: rowsRects(['....##', '..##..', '##..##', '...#..', '..#...'], -6, 0),
  stop: [rowsRects(['..##', '.#.#', '#..#', '#..#', '.#..'], -4, -1),
         rowsRects(['.#', '##', '.#', '.#', '#.', '.#'], -2, -1),
         rowsRects(['.##', '#..', '.##', '..#', '.#.', '#..'], -3, -1)],
};
function bow(g, x, y, l) {
  const ink = l.inks.ink, ph = phaseOf(l);
  for (const r of BOW) rect(g, x, y, l, r, ink);
  const tails = ph.k === 'walk' ? RIBBON.walk[ph.p] : ph.k === 'start' ? RIBBON.start : ph.k === 'stop' ? RIBBON.stop[ph.i] : RIBBON.rest;
  for (const r of tails) rect(g, x, y, l, r, ink);
}

// --- the headband: its ends stream and hang (today they stand still) -------------------
const HB = {
  band: [0, 4, 18, 2], knot: [-2, 4, 2, 2],
  rest: [[-2, 6, 2, 6], [-4, 6, 2, 4]],
  walk: [[[-8, 2, 6, 2], [-6, 6, 4, 2]], [[-8, 4, 6, 2], [-6, 8, 4, 2], [-8, 6, 2, 2]]],
  start: [[-4, 6, 2, 2], [-6, 8, 2, 2], [-4, 8, 2, 4]],
  stop: [[[-4, 6, 2, 4], [-6, 10, 2, 2], [-4, 6, 2, 6]],
         [[0, 6, 2, 6], [-2, 6, 2, 4]],
         [[-4, 6, 2, 6], [-6, 6, 2, 4]]],
};
function headband(g, x, y, l) {
  const ink = l.inks.ink, ph = phaseOf(l);
  rect(g, x, y, l, HB.band, ink); rect(g, x, y, l, HB.knot, ink);
  const ends = ph.k === 'walk' ? HB.walk[ph.p] : ph.k === 'start' ? HB.start : ph.k === 'stop' ? HB.stop[ph.i] : HB.rest;
  for (const r of ends) rect(g, x, y, l, r, ink);
}

// --- the mortarboard: the tassel moved to the back corner, lagging -------------------
function mortarboard(g, x, y, l) {
  const c = H.mortarboard, grey = rampOf(l)(c.rung), x0 = x - 3, y0 = y - 5 * U, ph = phaseOf(l);
  art(g, ['....####....', '############', '....####....', '.##########.', '.##########.'], x0, y0, l.dir, { '#': l.inks.ink });
  // how far back of the corner the hanging part swings, a unit each
  const sw = ph.k === 'walk' ? 1 + ph.p : ph.k === 'start' ? 1 : ph.k === 'stop' ? [1, -1, 1][ph.i] : 0;
  const col = n => (l.dir < 0 ? 11 - n : n);
  fill(g, x0 + col(1) * U, y0 + U, U, U, grey);
  fill(g, x0 + col(0) * U, y0 + 2 * U, U, U, grey);
  const lift = ph.k === 'walk' && ph.p ? 1 : 0;
  fill(g, x0 + col(-sw) * U, y0 + (3 - lift) * U, U, 2 * U, grey);
  fill(g, x0 + col(-sw) * U, y0 + (5 - lift) * U, U, U, l.inks.ink);   // the knob, in the ink
}

// --- the antenna: the knob on top trails the step and settles -------------------------
function antenna(g, x, y, l) {
  const ink = l.inks.ink, ph = phaseOf(l);
  const lean = ph.k === 'walk' ? -1 - ph.p : ph.k === 'start' ? -1 : ph.k === 'stop' ? [0, 1, -1][ph.i] : 0;
  const cx = l.dir < 0 ? 3 - 1 - 0 : 0;   // ox 0, mirrored
  const cellAt = (c, r, dx) => fill(g, x + ((l.dir < 0 ? 2 - c : c)) * P + (l.dir < 0 ? -dx : dx) * U, y - (3 - r) * P, P, P, ink);
  void cx;
  cellAt(1, 2, 0); cellAt(1, 1, lean < 0 ? -1 : lean > 0 ? 0 : 0);
  cellAt(2, 0, lean);
}

// --- the flower: its head nods ----------------------------------------------------------
function flower(g, x, y, l) {
  const ink = l.inks.ink, ph = phaseOf(l);
  const nod = ph.k === 'walk' ? -ph.p : ph.k === 'start' ? -1 : ph.k === 'stop' ? [0, 1, -1][ph.i] : 0;
  const cellAt = (c, r, dx) => fill(g, x + ((l.dir < 0 ? 2 - c : c)) * P + (l.dir < 0 ? -dx : dx) * U, y - (4 - r) * P, P, P, ink);
  cellAt(1, 0, nod); cellAt(0, 1, nod); cellAt(2, 1, nod); cellAt(1, 2, nod); cellAt(1, 3, 0);
}

// --- the bird: lurches on with the stop, leans back on the start -----------------------
function hashB(i, j) { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); }
void hashB;
function bird(g, x, y, l) {
  const c = H.bird, k = l.inks, grey = rampOf(l), t = l.t || 0, ph = phaseOf(l);
  const s = t % c.every, hop = s < c.hop && !(ph.k === 'stop');
  const lift = hop ? Math.round(Math.sin(Math.PI * s / c.hop) * c.high) * U : (ph.k === 'walk' && ph.p ? U : 0);
  const lurch = ph.k === 'start' ? -1 : ph.k === 'stop' ? [1, 1, 0][ph.i] : 0;
  const tones = { '#': grey(c.rung), e: k.paper, b: k.ink, l: k.ink };
  const x0 = x + 1 + (l.dir < 0 ? -lurch : lurch) * U, y0 = y - 5 * U - lift + (ph.k === 'stop' && ph.i === 1 ? U : 0);
  art(g, ['.....##.', '....#e#b', '#######.', '.#####..', hop ? '........' : '..l..l..'], x0, y0, l.dir, tones);
  if (hop) {
    if (pose(t, c.flapHz)) art(g, ['.#......', '..##....'], x0, y0 - 2 * U, l.dir, tones);
    else art(g, ['..##....', '.#......'], x0, y0 + 4 * U, l.dir, tones);
  }
}

// --- the moneybag and the backpack: a beat of weight -----------------------------------
const MONEYBAG = ['.#..#.', '..##..', '.####.', '##ee##', '##ee##', '.####.'];
function moneybag(g, x, y, l, k) {
  const ph = phaseOf(l), w = MONEYBAG[0].length * U;
  const up = ph.k === 'walk' ? ph.p : ph.k === 'stop' ? [0, 1, 0][ph.i] : 0;
  art(g, MONEYBAG, l.dir > 0 ? x - w : x + WORKER, y + WORKER - w - up * U, l.dir, { '#': k.ink, e: k.paper });
}
const BACKPACK = ['.##', '###', 'www', '###', '#w#', '###', '###'];
function backpack(g, x, y, l, k) {
  const ph = phaseOf(l);
  const dn = ph.k === 'walk' ? ph.p : ph.k === 'stop' ? [1, 0, 0][ph.i] : 0;
  units(g, x, y, l, BACKPACK, -3, 1 + dn, k);
}

// --- the serpent's comb, and its idle light (the owner's addition) ---------------------
// Three ways for it to light as the serpent's own crest does before its
// constrict (render/serpent.js, `combLit`), picked by `l.comb`:
//  A "climb":  every COMB_A.every seconds the light climbs the spikes from
//              the back to the front, a held step a spike, each spike's
//              light fading in by opacity; it holds, then fades out whole.
//  B "tell":   now and then the serpent's own warning, exactly: lit head
//              first over the warn, the tip in the white and the spike's
//              body in the two top purples on the crest's flicker, then
//              going dark tail first.
//  C "breathe": the whole comb breathing one rung up the purple and back,
//              by opacity, always.
export const COMB_A = { every: 4, step: 0.12, fadeIn: 0.1, hold: 0.5, fadeOut: 0.5 };
export const COMB_B = { every: 5.5, warn: 0.9, hold: 0.35, dark: 0.45 };
export const COMB_C = { hz: 0.33, rise: 0.85 };
const spikes = c => {
  const n = c.top + c.down, out = [];
  for (let i = 0; i < n; i++) {
    const left = 1 - i / n, tall = Math.max(1, Math.round((i % 2 ? c.tall - 1 : c.tall) * Math.min(1, left * 1.6)));
    out.push({ i, tall, top: i < c.top });
  }
  return out;
};
function spikeRect(x, y, l, c, s, m) {     // unit m (0 the root) of spike s, as a rect
  if (s.top) {
    const col = 2 * s.i * U;
    return [l.dir > 0 ? x + WORKER - col - U : x + col, y - (m + 1) * U, U, U];
  }
  const row = 2 * (s.i - c.top + 1) * U;
  return [l.dir > 0 ? x - (m + 1) * U : x + WORKER + m * U, y + row, U, U];
}
const withAlpha = (g, a, f) => { if (a <= 0.02) return; const was = g.globalAlpha; g.globalAlpha = was * Math.min(1, a); f(); g.globalAlpha = was; };
function comb(g, x, y, l) {
  const c = H['serpent-comb'], t = l.t || 0, list = spikes(c), n = list.length;
  const tone = r => (l.deep ? seen(ABYSS_MAGIC_TONES[r]) : ABYSS_MAGIC_TONES[r]);
  // lit: the deep's own lit crest (white tip, top purples); in the yard the
  // top purples drawn on the paper read as fading, so the light is the tip
  // in the brightest purple and a pale purple keyline round the lit spike
  const litTip = l.deep ? GREYS[GREYS.length - 1] : PURPLE[12];
  const litBody = f => (l.deep ? PURPLES[PURPLES.length - 1 - (f ? 0 : 1)] : PURPLE[f ? 11 : 10]);
  const glow = l.deep ? null : PURPLE[13];
  const base = s => { for (let m = 0; m < s.tall; m++) fill(g, ...spikeRect(x, y, l, c, s, m), tone(c.rung)); };
  const lit = (s, a, f) => withAlpha(g, a, () => {
    // the glow: a unit of pale purple either side of the tip and one past it
    if (glow) {
      const [rx, ry] = spikeRect(x, y, l, c, s, s.tall - 1), [ox, oy] = spikeRect(x, y, l, c, s, s.tall);
      if (s.top) { fill(g, rx - U, ry, U, U, glow); fill(g, rx + U, ry, U, U, glow); } else { fill(g, rx, ry - U, U, U, glow); fill(g, rx, ry + U, U, U, glow); }
      fill(g, ox, oy, U, U, glow);
    }
    for (let m = 0; m < s.tall; m++) fill(g, ...spikeRect(x, y, l, c, s, m), m === s.tall - 1 ? litTip : litBody(f));
  });
  // the glow under first, so the spikes stand on it
  const mode = l.comb || 'today';
  if (mode === 'today') { list.forEach(base); return; }
  if (mode === 'A') {
    const q = (t + (l.seed || 0) * 1.3) % COMB_A.every, climb = n * COMB_A.step, end = climb + COMB_A.fadeIn + COMB_A.hold;
    list.forEach(base);
    // back to front: the last spike first
    list.forEach(s => {
      const order = n - 1 - s.i, on = q - order * COMB_A.step;
      const a = on < 0 ? 0 : q < end ? Math.min(1, on / COMB_A.fadeIn) : Math.max(0, 1 - (q - end) / COMB_A.fadeOut);
      lit(s, a, true);
    });
    return;
  }
  if (mode === 'B') {
    const q = (t + (l.seed || 0) * 1.7) % COMB_B.every, { warn, hold, dark } = COMB_B;
    list.forEach(base);
    // lit share, head first, as `combLit` gives it: 0..1 over the warn, held, then off tail first
    let litTo = 0, offFrom = 1;
    if (q < warn) litTo = q / warn;
    else if (q < warn + hold) litTo = 1;
    else if (q < warn + hold + dark) { litTo = 1; offFrom = 1 - (q - warn - hold) / dark; }
    list.forEach(s => {
      const along = s.i / n;              // 0 the front
      if (along < litTo && along < offFrom) {
        const f = Math.floor(t * 12 + s.i * 2) % 4 < 2;      // the crest's own flicker
        lit(s, 1, f);
      }
    });
    return;
  }
  if (mode === 'C') {
    const a = COMB_C.rise * (0.5 - 0.5 * Math.cos(2 * Math.PI * COMB_C.hz * t + (l.seed || 0)));
    list.forEach(base);
    withAlpha(g, a, () => list.forEach(s => { for (let m = 0; m < s.tall; m++) fill(g, ...spikeRect(x, y, l, c, s, m), tone(Math.min(11, c.rung + 1))); }));
    // in the yard one rung up is lighter; there the breath is the glow alone
    if (glow) withAlpha(g, a * 0.6, () => list.forEach(s => {
      const [rx, ry] = spikeRect(x, y, l, c, s, s.tall - 1), [ox, oy] = spikeRect(x, y, l, c, s, s.tall);
      if (s.top) { fill(g, rx - U, ry, U, U, glow); fill(g, rx + U, ry, U, U, glow); } else { fill(g, rx, ry - U, U, U, glow); fill(g, rx, ry + U, U, U, glow); }
      fill(g, ox, oy, U, U, glow);
    }));
  }
}

// --- which pieces are polished ----------------------------------------------------------
export const BACKS = {
  cape: (g, x, y, l, k) => cape(g, x, y, l, k, false, false),
  'short-cape': (g, x, y, l, k) => cape(g, x, y, l, k, true, false),
  'gold-cape': (g, x, y, l, k) => cape(g, x, y, l, k, false, true),
  balloon, flag, moneybag, backpack,
};
export const HEADS = { bow, headband, mortarboard, antenna, flower, bird, 'serpent-comb': comb };
export const NECK_TAIL = true;

// --- the whole body -------------------------------------------------------------------
// The square as render/crew.js draws it.
export function square(g, x, y, w = WORKER, h = WORKER) {
  const m = g.getTransform(), k = m.a, e = m.e, f = m.f;
  const sx = v => (Math.round(v * k + e) - e) / k, sy = v => (Math.round(v * k + f) - f) / k;
  const x0 = sx(x), y0 = sy(y), x1 = sx(x + w), y1 = sy(y + h);
  const rim = Math.max(1, Math.round(BODY_RIM * k)) / k;
  g.fillStyle = '#000';
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = '#fff';
  g.fillRect(x0 + rim, y0 + rim, x1 - x0 - 2 * rim, y1 - y0 - 2 * rim);
}

// Today's body, every call the game's own.
export function drawToday(g, x, y, l) {
  dressAura(g, x, y, l, 'back');
  dressBehind(g, x, y, l);
  square(g, x, y);
  dressOn(g, x, y, l);
  dressHead(g, x, y, l);
  dressAura(g, x, y, l, 'front');
}

// The outside pieces, polished where listed and the game's own elsewhere.
function behind(g, x, y, l) {
  const o = l.outfit, k = l.inks, nk = itemOf('neck', o.neck);
  const pb = BACKS[o.back], pt = nk && nk.tail;
  // the game's own for the rest (its lamp cone too), with the polished ones taken out
  dressBehind(g, x, y, { ...l, outfit: { ...o, back: pb ? 'none' : o.back, neck: pt ? 'none' : o.neck } });
  if (pb && l.back !== false) pb(g, x, y, l, k);
  if (pt) scarfTail(g, nk, x, y, l, k);
}
function head(g, x, y, l) {
  const ph = HEADS[l.outfit.head];
  if (ph) { ph(g, x, y, l); return true; }
  return dressHead(g, x, y, l);
}

// Scratch canvases for the keyline, reused.
let A = null, B = null;
const scratch = (c, w, h) => { if (!c) c = document.createElement('canvas'); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c; };

// The palest auras two rungs darker, so they are not lost among the sky's
// own motes (the deep reads a yard rung turned over, so there they brighten).
export const AURA_RUNG = { 'dust-motes': 6, bubbles: 8, 'falling-petals': 7, stink: 8, 'speed-lines': 8 };
function aura(g, x, y, l, pass) {
  const key = l.outfit.aura, c = WARD_AURAS[key], r = AURA_RUNG[key];
  if (!c || r == null) return dressAura(g, x, y, l, pass);
  const was = c.rung, ink = c.ink;
  c.rung = r; if (key === 'speed-lines') c.ink = 1;
  try { dressAura(g, x, y, l, pass); } finally { c.rung = was; c.ink = ink; }
}

export function drawPolished(g, x, y, l, { keyline = true, rigid = true } = {}) {
  g.save();
  if (rigid) {
    const m = g.getTransform();
    const dx = Math.round(x * m.a + m.e) - (x * m.a + m.e), dy = Math.round(y * m.d + m.f) - (y * m.d + m.f);
    g.translate(dx / m.a, dy / m.d);
  }
  aura(g, x, y, l, 'back');
  if (keyline) {
    // the outside pieces drawn alone, their shape grown a unit, laid in the paper
    const W = g.canvas.width, Hh = g.canvas.height, m = g.getTransform();
    A = scratch(A, W, Hh); B = scratch(B, W, Hh);
    const a = A.getContext('2d'), b = B.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, Hh); a.setTransform(m);
    a.imageSmoothingEnabled = false;
    behind(a, x, y, { ...l, aura: false });
    head(a, x, y, { ...l, aura: false });
    const d = Math.max(1, Math.round(U * m.a));
    b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, Hh);
    for (let i = -d; i <= d; i++) b.drawImage(A, i, 0);
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, Hh);
    for (let j = -d; j <= d; j++) a.drawImage(B, 0, j);
    a.globalCompositeOperation = 'source-in';
    a.fillStyle = l.inks.paper; a.fillRect(0, 0, W, Hh);
    a.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(A, 0, 0); g.restore();
  }
  behind(g, x, y, l);
  square(g, x, y);
  dressOn(g, x, y, l);
  head(g, x, y, l);
  aura(g, x, y, l, 'front');
  g.restore();
}
