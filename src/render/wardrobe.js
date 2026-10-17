// What the two of them wear, drawn (wardrobe.js holds the items; the owner's
// vote on docs/mocks/pair-wardrobe-2026-10-16). Every draw here takes the
// context it draws on, so the yard, the deep and the picker's own canvases
// all draw the one outfit the one way.
//
// A look is `{ outfit, dir, moving, t, inks, back }`: the outfit, which way
// the body faces (1 right, -1 left), whether it is walking and the clock in
// seconds (the things that move change pose on it), the four inks, and
// whether its back is free (a carter's cart is its back). The pieces go on in
// three passes round the body's own square: what hangs behind it, what is
// marked on its middle, and what sits on its head.

import { P, WORKER, BODY_RIM, GREY, GOLD, WARD_UNIT, WARD_GRID, WARD_GREY, WARD_PALE, WARD_DEEP_GREY, WARD_DEEP_PALE,
         WARD_STEP_HZ, WARD_BOB_HZ, WARD_STILL_S, WARD_HEADS } from '../config.js';
import { itemOf } from '../wardrobe.js';
import { GREYS, seen } from './deeptones.js';
import { dressAura } from './wardaura.js';
import { HEADS } from './wardheads.js';
import { lampCone } from './lamplight.js';

// The yard's inks, and the deep's: the deep is drawn as the yard is and
// turned over after (render/deep.js), so its black and white are the yard's
// and only its greys are its own capped ramp's. The gold is the one hue,
// for what is earned (GOLD), drawn so the deep's turning over shows its own.
export const YARD_INKS = { ink: '#000', paper: '#fff', grey: GREY[WARD_GREY], pale: GREY[WARD_PALE], gold: GOLD.yard };
export const DEEP_INKS = { ink: '#000', paper: '#fff', grey: GREYS[WARD_DEEP_GREY], pale: GREYS[WARD_DEEP_PALE],
                           gold: seen(GOLD.deep) };

// A rect laid on whole device pixels, as the body's own square is
// (render/crew.js, `square`): a mark between device pixels comes out a blend
// of two inks at its edge, a grey the deep's palette does not hold. Never
// narrower than one device pixel, so a two-pixel mark at a far zoom thins
// rather than goes.
export function fill(g, x, y, w, h, tone) {
  const m = g.getTransform ? g.getTransform() : null;
  const kx = m ? m.a : 1, ky = m ? m.d : 1, e = m ? m.e : 0, f = m ? m.f : 0;
  const sx = v => (Math.round(v * kx + e) - e) / kx, sy = v => (Math.round(v * ky + f) - f) / ky;
  const x0 = sx(x), y0 = sy(y);
  const x1 = Math.max(sx(x + w), x0 + 1 / kx), y1 = Math.max(sy(y + h), y0 + 1 / ky);
  g.fillStyle = tone;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
}
const cell = (g, x, y, tone) => fill(g, x, y, P, P, tone);
const pose = (t, hz, n = 2) => Math.floor((t || 0) * hz) % n;
const widthOf = rows => Math.max(...rows.map(r => r.length));

// A drawing in WARD_UNIT marks, its characters mapped to tones, its top-left
// at (x0, y0) and mirrored in its own box for a body facing left.
export function art(g, rows, x0, y0, dir, tones) {
  const w = widthOf(rows);
  rows.forEach((r, ry) => {
    for (let c = 0; c < w; c++) {
      const ch = r[dir < 0 ? w - 1 - c : c];
      if (ch && ch !== '.' && tones[ch]) fill(g, x0 + c * WARD_UNIT, y0 + ry * WARD_UNIT, WARD_UNIT, WARD_UNIT, tones[ch]);
    }
  });
}

// The back items are drawn in WARD_UNIT marks, as the scarf's tail is (the
// owner's votes, docs/mocks/wardrobe-back-2026-10-16): a unit at (ux, uy)
// off the body's top-left facing right, negative ux behind it, mirrored round
// the body for a body facing left.
const unit = (g, x, y, l, ux, uy, tone) => fill(g, across(x, l, ux * WARD_UNIT, WARD_UNIT), y + uy * WARD_UNIT, WARD_UNIT, WARD_UNIT, tone);
// Rows of units, '#' the ink and 'w' the paper, their top-left at (ux, uy).
function units(g, x, y, l, rows, ux, uy, k) {
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') unit(g, x, y, l, ux + c, uy + r, ch === 'w' ? k.paper : k.ink);
  }));
}
const BODY_UNITS = WORKER / WARD_UNIT;

// The cape (option B, "billow"): to the knee with a smooth hem, hanging in
// three columns that step down off the back when the body stands, billowing
// out behind in three held poses as it walks -- filling, full, falling. Each
// pose is its columns' tops and lengths in units, the one against the back
// first; the short cape is the same cut to the waist, its lengths scaled by
// SHORT_CUT over its first SHORT_COLS columns.
const CAPE_TOP = [[0, 0, 0, 1, 1, 2, 3], [0, -1, -1, -1, 0, 0, 1], [0, 0, 1, 2, 2, 3, 4]];
const CAPE_LEN = [[7, 6, 6, 5, 4, 3, 2], [7, 7, 7, 6, 5, 4, 3], [7, 7, 6, 5, 4, 3, 2]];
const CAPE_HANG = { long: [[0, 7], [1, 7], [3, 7]], short: [[0, 4], [1, 4], [2, 4]] };
const SHORT_COLS = 5, SHORT_CUT = 4 / 7;
// The cape's units, [ux, uy], never below the body's foot.
function capeUnits(l, short) {
  let cols;
  if (!l.moving) cols = CAPE_HANG[short ? 'short' : 'long'];
  else {
    const p = pose(l.t, WARD_STEP_HZ, CAPE_TOP.length), len = CAPE_LEN[p];
    cols = CAPE_TOP[p].slice(0, short ? SHORT_COLS : len.length)
      .map((top, i) => [top, top + (short ? Math.max(1, Math.round(len[i] * SHORT_CUT)) : len[i])]);
  }
  const out = [];
  cols.forEach(([top, bot], i) => { for (let v = top; v < Math.min(bot, BODY_UNITS); v++) out.push([-(i + 1), v]); });
  return out;
}
// A cape's units in the ink; hemmed in gold, every unit with nothing under it
// and the column farthest out.
function drawCape(g, x, y, l, k, short, trim) {
  const set = capeUnits(l, short), has = new Set(set.map(([a, b]) => a + ',' + b));
  const far = Math.min(...set.map(s => s[0]));
  for (const [ux, uy] of set) {
    const hem = trim && (!has.has(ux + ',' + (uy + 1)) || ux === far);
    unit(g, x, y, l, ux, uy, hem ? k.gold : k.ink);
  }
}

// The balloon (option A, "lags behind"): ten by twelve with a paper
// highlight, its knot the last row, on a stepped string tied over the back
// of the head. Standing it hangs over the back and bobs; walking it lags
// back, swinging a unit further back and down on the other step. The knot's
// spot [ux, uy], a pose each.
const BALLOON = ['.###.', '#####', '#w###', '#####', '.###.', '..#..'];
const BALLOON_KNOT = 2;
const BALLOON_STAND = [[-1, -7], [-1, -8]];
const BALLOON_WALK = [[-4, -8], [-5, -7]];
function balloon(g, x, y, l, k) {
  const [kx, ky] = l.moving ? BALLOON_WALK[pose(l.t, WARD_STEP_HZ)] : BALLOON_STAND[pose(l.t, WARD_BOB_HZ)];
  // the string, stepped from the tie (0, -1) to just under the knot
  const ey = ky + 2, n = Math.max(Math.abs(kx), Math.abs(ey));
  for (let i = 0; i <= n; i++) unit(g, x, y, l, Math.round(kx * i / n), -1 + Math.round(ey * i / n), k.ink);
  units(g, x, y, l, BALLOON, kx - BALLOON_KNOT, ky - BALLOON.length + 1, k);
}

// The flag (option B, "pennant"): a pole up the back and a pennant tapering
// to a point off its top, streaming straight back in a two-pose wave as the
// body walks, drooping a column at a time with its tip swaying as it stands.
const PENNANT = [4, 4, 3, 3, 3, 2, 2, 1, 1];
const PENNANT_WAVE = [[0, 0, 0, 1, 1, 0, 0, -1, -1], [0, 0, 0, 0, 1, 1, 1, 0, 0]];
const PENNANT_DROOP = [4, 4, 3, 3, 2, 2, 1];
const POLE_TOP = -11, POLE_FOOT = 6, PENNANT_TOP = -10, DROOP_SAG = 1.5, TIP_FROM = 5;
function flag(g, x, y, l, k) {
  for (let v = POLE_TOP; v < POLE_FOOT; v++) unit(g, x, y, l, -1, v, k.ink);
  const col = (i, top, h) => { for (let r = 0; r < h; r++) unit(g, x, y, l, -2 - i, top + r, k.ink); };
  if (l.moving) {
    const wave = PENNANT_WAVE[pose(l.t, WARD_STEP_HZ)], tall = PENNANT[0];
    PENNANT.forEach((h, i) => col(i, PENNANT_TOP + Math.floor((tall - h) / 2) + wave[i], h));
  } else {
    const s = pose(l.t, WARD_BOB_HZ);
    PENNANT_DROOP.forEach((h, i) => col(i, PENNANT_TOP + Math.round(i * DROOP_SAG) + (i >= TIP_FROM ? s : 0), h));
  }
}

// The backpack, in units: a flap line and a buckle in the paper. Still.
const BACKPACK = ['.##', '###', 'www', '###', '#w#', '###', '###'];

// A sack tied at the neck, a paper pebble on it, bouncing a unit with the step.
const MONEYBAG = ['.#..#.', '..##..', '.####.', '##ee##', '##ee##', '.####.'];
// --- behind the body -------------------------------------------------------------
// Off the side away from the way the body faces.
const BACKS = {
  cape: (g, x, y, l, k) => drawCape(g, x, y, l, k, false, false),
  'short-cape': (g, x, y, l, k) => drawCape(g, x, y, l, k, true, false),
  'gold-cape': (g, x, y, l, k) => drawCape(g, x, y, l, k, false, true),
  moneybag(g, x, y, l, k) {
    const U = WARD_UNIT, w = MONEYBAG[0].length * U, bounce = l.moving && pose(l.t, WARD_STEP_HZ) ? U : 0;
    art(g, MONEYBAG, l.dir > 0 ? x - w : x + WORKER, y + WORKER - w - bounce, l.dir, { '#': k.ink, e: k.paper });
  },
  backpack: (g, x, y, l, k) => units(g, x, y, l, BACKPACK, -BACKPACK[0].length, 1, k),
  balloon,
  flag,
};

// A mark `rx` world pixels in from the body's left facing right, `w` wide,
// read the other way round the body for a body facing left.
const across = (x, l, rx, w) => x + (l.dir < 0 ? WORKER - rx - w : rx);

// Rows of WARD_UNIT marks off a body facing right, its top-left (ox, oy) in
// units from the body's, mirrored for a body facing left; as [x, y, w, h]
// world pixels off the body's top-left, facing right.
function unitRects(rows, ox, oy) {
  const out = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== '.') out.push([(ox + c) * WARD_UNIT, (oy + r) * WARD_UNIT, WARD_UNIT, WARD_UNIT]);
  }));
  return out;
}

// The scarf's tone a unit along it, from the band out; `check` the tone of
// its checks (the gold scarf's gold).
const scarfTone = (kind, i, k, check = k.grey) => i % 2 ? (kind === 'check' ? check : kind === 'stripe' ? k.paper : k.ink) : k.ink;
// How far each unit of a scarf's streaming tail lifts, a pose each.
const SCARF_WAVE = [[0, 0, 1, 1, 0, 0, -1, -1, 0], [0, 0, 0, 1, 1, 1, 0, 0, -1]];

// How far the neck's marks ride up on a body squashed below its height (the
// crouch), a unit for every cell, so the band stays on the squashed middle
// rather than being clipped off it.
const neckSink = h => (h - WORKER) / P * WARD_UNIT;

// A scarf's tail, out the back from the band: two units wide, hanging to the
// floor with its end kicked back when the body stands; a unit wide, streaming
// in a wave as the body walks.
function scarfTail(g, nk, x, y, l, k, h) {
  const kind = nk.tail, band = nk.grid.findIndex(r => r.replace(/\./g, '')), chk = nk.tone ? k[nk.tone] : k.grey;
  const U = WARD_UNIT, by = y + BODY_RIM + band * U + neckSink(h), floor = y + h;
  if (l.moving) {
    const wave = SCARF_WAVE[pose(l.t, WARD_STEP_HZ)];
    wave.forEach((lift, i) => fill(g, across(x, l, -(i + 1) * U, U), by + lift * U, U, 2 * U, scarfTone(kind, i, k, chk)));
    return;
  }
  const n = Math.max(0, (floor - by) / U);
  for (let i = 0; i < n; i++) fill(g, across(x, l, -2 * U, 2 * U), by + i * U, 2 * U, U, scarfTone(kind, i, k, chk));
  fill(g, across(x, l, -3 * U, U), floor - U, U, U, scarfTone(kind, n, k, chk));
}

// `h` the body's height, short of WORKER when it is squashed (the crouch).
export function dressBehind(g, x, y, l, h = WORKER) {
  const o = l.outfit, k = l.inks;
  // a lamp on the head lights the way ahead, behind everything it wears
  const hd = itemOf('head', o.head);
  lampCone(g, x, y + h - WORKER, l.dir, { on: !!(hd && hd.lamp), key: l.key, t: l.t, deep: l.deep, src: 'head' });
  if (l.back !== false && BACKS[o.back]) BACKS[o.back](g, x, y, l, k);
  const nk = itemOf('neck', o.neck);
  if (nk && nk.tail) scarfTail(g, nk, x, y, l, k, h);
}

// --- on the body's middle ------------------------------------------------------------
// A grid of marks, a unit each, from the middle's top-left, facing right and
// read the other way for a body facing left.
function grid(g, rows, x0, y0, dir, ink, grey) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r].padEnd(WARD_GRID, '.');
    for (let c = 0; c < WARD_GRID; c++) {
      const ch = row[dir < 0 ? WARD_GRID - 1 - c : c];
      if (ch === '.') continue;
      fill(g, x0 + c * WARD_UNIT, y0 + r * WARD_UNIT, WARD_UNIT, WARD_UNIT, ch === 'g' ? grey : ink);
    }
  }
}

// The pattern, the face and the neck's marks, inside the square's middle: a
// body of (w, h) with its top-left at (x, y), the rim BODY_RIM all round. A
// squashed body (a crouch, sat down) shows as much of them as its middle
// has room for.
export function dressOn(g, x, y, l, w = WORKER, h = WORKER) {
  const o = l.outfit, k = l.inks;
  const pat = itemOf('pattern', o.pattern), face = itemOf('face', o.face), neck = itemOf('neck', o.neck);
  if (!(pat && pat.rects) && !(face && face.grid) && !(neck && neck.grid)) return;
  const ix = x + BODY_RIM, iy = y + BODY_RIM, iw = w - 2 * BODY_RIM, ih = h - 2 * BODY_RIM;
  g.save();
  g.beginPath();
  g.rect(ix, iy, iw, ih);
  g.clip();
  if (pat && pat.rects) {
    for (const [rx, ry, rw, rh] of pat.rects) fill(g, ix + (l.dir < 0 ? iw - rx - rw : rx), iy + ry, rw, rh, k.ink);
  }
  // On a dark fill the marks are drawn in the paper, and the grey in the pale.
  const on = pat && pat.dark ? k.paper : k.ink, grey = pat && pat.dark ? k.pale : k.grey;
  if (face && face.grid) grid(g, face.grid, ix, iy, l.dir, on, grey);
  if (neck && neck.grid) grid(g, neck.grid, ix, iy + neckSink(h), l.dir, on, neck.tone ? k[neck.tone] : grey);
  g.restore();
}

// --- on the head ---------------------------------------------------------------------
// The chosen head item on a body whose top is `y`, in place of any station
// hat (the owner's vote: the headwear replaces the hat). True if it drew
// one: with nothing chosen the station hat is still worn.
export function dressHead(g, x, y, l) {
  const it = itemOf('head', l.outfit.head);
  if (it && it.draw && HEADS[it.key]) { HEADS[it.key](g, x, y, l); return true; }
  if (!it || (!it.rows && !it.rects)) return false;
  const ink = it.tone ? l.inks[it.tone] : l.inks.ink;
  if (it.rects) {
    for (const [rx, ry, rw, rh] of it.rects) fill(g, across(x, l, rx, rw), y + ry, rw, rh, ink);
    if (it.ribbon) for (const [rx, ry, rw, rh] of ribbonTails(l)) fill(g, across(x, l, rx, rw), y + ry, rw, rh, ink);
    return true;
  }
  const w = widthOf(it.rows);
  let ox = it.ox ?? (3 - w) / 2;
  if (l.dir < 0) ox = 3 - ox - w;
  const top = y - it.rows.length * P;
  for (let r = 0; r < it.rows.length; r++) {
    const row = it.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[l.dir < 0 ? w - 1 - c : c];
      if (ch && ch !== '.') cell(g, x + (ox + c) * P, top + r * P, ink);
    }
  }
  return true;
}

// A ribbon's two tails off the back of the head: hanging down the body's back
// when it stands, streaming out behind the head as it walks.
const RIBBON_HANG = unitRects(['##', '#.', '##', '.#', '.#', '#.'], -2, -1);
const RIBBON_STREAM = [
  [...unitRects(['......', '######', '......'], -6, -1), ...unitRects(['......', '......', '######'], -6, 0)],
  [...unitRects(['..####', '##....', '......'], -6, -1), ...unitRects(['......', '...###', '###...'], -6, 0)],
];
const ribbonTails = l => l.moving ? RIBBON_STREAM[pose(l.t, WARD_STEP_HZ)] : RIBBON_HANG;

// How many cells over the head the chosen head item stands, for what is
// carried over it.
export function headRows(l) {
  const it = itemOf('head', l.outfit.head);
  return it && it.draw ? Math.ceil(WARD_HEADS[it.key].h / P) : it && it.rows ? it.rows.length : it && it.rects ? 1 : 0;
}
// And how tall in world pixels, for what floats over it (an aura over the
// head): a piece drawn in units stands its own height, not whole cells.
export function headHeight(l) {
  const it = itemOf('head', l.outfit.head);
  return it && it.draw ? WARD_HEADS[it.key].h : headRows(l) * P;
}
// Whether the look's head item is drawn, in place of any station hat.
export function wearsHead(l) {
  const it = l && itemOf('head', l.outfit.head);
  return !!(it && (it.rows || it.rects || it.draw));
}

// The head item on a body knocked flat (render/crew.js, `drawFloored`): laid
// on its side at the body's left end, its top pointing away.
export function dressFlat(g, left, top, l) {
  const it = itemOf('head', l.outfit.head);
  if (it && it.rects) {
    // Turned a quarter, up the body left along the ground and across it down:
    // what stands over the head, and a ribbon's tails.
    const laid = [...it.rects.filter(r => r[1] < 0), ...(it.ribbon ? RIBBON_HANG : [])];
    for (const [rx, ry, rw, rh] of laid) fill(g, left + ry, top + rx, rh, rw, l.inks.ink);
    return laid.length > 0;
  }
  if (!it || !it.rows) return false;
  const n = it.rows.length, w = widthOf(it.rows);
  const y0 = top + P - Math.floor(w / 2) * P;
  for (let r = 0; r < n; r++) {
    const row = it.rows[r];
    for (let c = 0; c < row.length; c++) if (row[c] !== '.') cell(g, left - (n - r) * P, y0 + c * P, it.tone ? l.inks[it.tone] : l.inks.ink);
  }
  return true;
}

// The whole of it: behind, the square, on it, and the head. For a body drawn
// nowhere but here (the picker).
export function drawDressed(g, x, y, l, hat = null) {
  dressAura(g, x, y, l, 'back');
  dressBehind(g, x, y, l);
  fill(g, x, y, WORKER, WORKER, l.inks.ink);
  fill(g, x + BODY_RIM, y + BODY_RIM, WORKER - 2 * BODY_RIM, WORKER - 2 * BODY_RIM, l.inks.paper);
  dressOn(g, x, y, l);
  if (!dressHead(g, x, y, l) && hat) hat(g, x, y);
  dressAura(g, x, y, l, 'front');
}

// Whether a body is walking, and which way, read off where it is drawn from
// one frame to the next: the bodies the two of them are drawn as (the crew's,
// the opening's, the snatch's, the finale's) each move by their own rules,
// and none of them says "walking" the same way. Still for a moment between
// two steps is still walking (WARD_STILL_S), so a slow walk does not flick
// its cape between poses.
const SEEN = new WeakMap();
export function motionOf(key, x, t, face = null) {
  let m = SEEN.get(key);
  if (!m) SEEN.set(key, m = { x, at: -1e9, dir: face || 1 });
  if (Math.abs(x - m.x) >= 0.5) { m.dir = x > m.x ? 1 : -1; m.at = t; m.x = x; }
  return { moving: t - m.at < WARD_STILL_S, dir: face || m.dir };
}
