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

import { P, WORKER, BODY_RIM, GREY, WARD_UNIT, WARD_GRID, WARD_GREY, WARD_PALE, WARD_DEEP_GREY, WARD_DEEP_PALE,
         WARD_STEP_HZ, WARD_BOB_HZ, WARD_WAVE_HZ, WARD_STILL_S } from '../config.js';
import { itemOf } from '../wardrobe.js';
import { GREYS } from './deeptones.js';
import { dressAura } from './wardaura.js';

// The yard's inks, and the deep's: the deep is drawn as the yard is and
// turned over after (render/deep.js), so its black and white are the yard's
// and only its greys are its own capped ramp's.
export const YARD_INKS = { ink: '#000', paper: '#fff', grey: GREY[WARD_GREY], pale: GREY[WARD_PALE] };
export const DEEP_INKS = { ink: '#000', paper: '#fff', grey: GREYS[WARD_DEEP_GREY], pale: GREYS[WARD_DEEP_PALE] };

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
const pose = (t, hz) => Math.floor((t || 0) * hz) % 2;
const widthOf = rows => Math.max(...rows.map(r => r.length));

// --- behind the body -------------------------------------------------------------
// Off the side away from the way the body faces: `bx` the column just past
// its back, `d` a step further back.
const BACKS = {
  cape(g, x, y, l, k) {
    const { d, bx } = k, p = pose(l.t, WARD_STEP_HZ);
    if (l.moving) { cell(g, bx, y, k.ink); cell(g, bx + d * P, y + P, k.ink); cell(g, bx + d * P * (p ? 2 : 1), y + (p ? P : 2 * P), k.ink); cell(g, bx, y + P, k.ink); }
    else { cell(g, bx, y, k.ink); cell(g, bx, y + P, k.ink); cell(g, bx, y + 2 * P, k.ink); }
  },
  'short-cape'(g, x, y, l, k) {
    const { d, bx } = k, p = pose(l.t, WARD_STEP_HZ);
    if (l.moving) { cell(g, bx, y, k.ink); cell(g, bx + d * P, y + (p ? 0 : P), k.ink); }
    else { cell(g, bx, y, k.ink); cell(g, bx, y + P, k.ink); }
  },
  backpack(g, x, y, l, k) {
    cell(g, k.bx, y + 2, k.ink); cell(g, k.bx, y + 2 + P, k.ink);
    fill(g, k.bx + 2, y + 2 + P + 2, 2, 2, k.paper);
  },
  // on a string tied at the back of its head, bobbing
  balloon(g, x, y, l, k) {
    const bob = pose(l.t, WARD_BOB_HZ) ? -2 : 0;
    const sx = l.dir > 0 ? x + 2 : x + WORKER - 4;
    fill(g, sx, y - 3 * P + bob, 1, 3 * P - bob, k.ink);
    const bxl = sx - 5 + k.d * 4, byl = y - 3 * P - 12 + bob;
    fill(g, bxl + 2, byl, 8, 12, k.ink); fill(g, bxl, byl + 2, 12, 8, k.ink);
  },
  // on a pole up the back, waving
  flag(g, x, y, l, k) {
    const px = l.dir > 0 ? x : x + WORKER - 2;
    fill(g, px, y - 4 * P, 2, 4 * P, k.ink);
    const fx = l.dir > 0 ? px - 2 * P : px + 2, wv = pose(l.t, WARD_WAVE_HZ);
    fill(g, fx, y - 4 * P, 2 * P, P, k.ink);
    fill(g, l.dir > 0 ? fx + (wv ? 0 : P) : fx + (wv ? P : 0), y - 3 * P, P, P - 2, k.ink);
  },
};

// A scarf's tail, out the back: streaming as the body walks, hanging when it
// stands.
function scarfTail(g, kind, x, y, l, k) {
  const cells = [];
  if (l.moving) {
    const lift = pose(l.t, WARD_STEP_HZ) ? [0, 0, -1] : [0, 1, 0];
    for (let i = 0; i < 3; i++) cells.push([k.bx + k.d * i * P, y + P + lift[i] * P]);
  } else cells.push([k.bx, y + P], [k.bx, y + 2 * P]);
  cells.forEach(([cx, cy], i) => {
    cell(g, cx, cy, kind === 'check' && i % 2 ? k.grey : k.ink);
    if (kind === 'stripe') fill(g, cx + 2, cy, 2, P, k.paper);
  });
}

const sides = (x, l) => ({ d: l.dir > 0 ? -1 : 1, bx: l.dir > 0 ? x - P : x + WORKER });

export function dressBehind(g, x, y, l) {
  const o = l.outfit, k = { ...l.inks, ...sides(x, l) };
  if (l.back !== false && BACKS[o.back]) BACKS[o.back](g, x, y, l, k);
  const nk = itemOf('neck', o.neck);
  if (nk && nk.tail) scarfTail(g, nk.tail, x, y, l, k);
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
  if (neck && neck.grid) grid(g, neck.grid, ix, iy, l.dir, on, grey);
  g.restore();
}

// --- on the head ---------------------------------------------------------------------
// The chosen head item on a body whose top is `y`, in place of any station
// hat (the owner's vote: the headwear replaces the hat). True if it drew
// one: with nothing chosen the station hat is still worn.
export function dressHead(g, x, y, l) {
  const it = itemOf('head', l.outfit.head);
  if (!it || (!it.rows && !it.rects)) return false;
  const ink = l.inks.ink;
  if (it.rects) {
    for (const [rx, ry, rw, rh] of it.rects) fill(g, x + (l.dir < 0 ? WORKER - rx - rw : rx), y + ry, rw, rh, ink);
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

// How many cells over the head the chosen head item stands, for what is
// carried over it.
export function headRows(l) {
  const it = itemOf('head', l.outfit.head);
  return it && it.rows ? it.rows.length : it && it.rects ? 1 : 0;
}

// The head item on a body knocked flat (render/crew.js, `drawFloored`): laid
// on its side at the body's left end, its top pointing away.
export function dressFlat(g, left, top, l) {
  const it = itemOf('head', l.outfit.head);
  if (!it || !it.rows) return false;
  const n = it.rows.length, w = widthOf(it.rows);
  const y0 = top + P - Math.floor(w / 2) * P;
  for (let r = 0; r < n; r++) {
    const row = it.rows[r];
    for (let c = 0; c < row.length; c++) if (row[c] !== '.') cell(g, left - (n - r) * P, y0 + c * P, l.inks.ink);
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
