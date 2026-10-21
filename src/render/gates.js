// Heaven's gates and the cloud stair up to them, drawn (docs/mocks/act3-
// gates-2026-10-19, take A; portals.js has where they stand and how far open,
// ghosts.js the walk up the stair). The same gates at both ends: in the yard
// on a long cloud bank at the top of a switchback stair of cloud at the yard's
// left end, left of the house, seen from in front; in the afterlife standing on the cloud floor,
// seen from behind. The gates are the portal and nothing stands over them:
// no light going up, none coming up through the floor (the owner,
// 2026-10-19).
//
// Act 3's four tones (config, AFTER_TONES) for the cloud, the posts, the
// crest and the leaves; the light alone is raw white, on either page, so on
// the dark one it is the brightest thing there. On the light page raw white
// is the paper's own white, so the light is read by what bounds it: the bars
// and the posts over it, the light spilling across the bank's pale top, and
// rays of pale cells fanned out
// from the gateway across the cloud behind the posts -- broken rays, a cell in
// every other, never a filled disc -- lengthening as the leaves swing open.
//
// The leaves swing by true angle (portals.js, `gatesTurn`, eased): each is
// one rigid piece, its bars and rails placed off the one foreshortening at
// whole world pixels, so the leaf narrows smoothly toward edge-on and its
// insides never shear. Shut and open, every bar is back on the cell grid.
//
// The yard's end is two layers: what stands behind the bodies (the cloud
// behind the posts and its rays, the stair, the bank, the light in the
// gateway), and the gates themselves in front of them (`drawGatesFront`), so
// the two of them walk into the gateway behind the posts and the leaves.

import { S } from '../state.js';
import { P, GREY, AFTER_TONES, ACT_GATES_LEAF, ACT_GATES_H, ACT_STAIR_TREAD, ACT_STAIR_RISE, ACT_STAIR_FLIGHTS,
         ACT_STAIR_LANDING, ACT_STAIR_SIDE, ACT_STAIR_FOOT, ACT_GATES_BANK_CELLS } from '../config.js';
import { ctx } from './ctx.js';
import { raw } from '../ink.js';
import { lerp } from '../motion.js';
import { portalOpenK, portalEnd, gatesTurn } from '../portals.js';

// The four, as the page draws them, and the light.
const TONE = [GREY[AFTER_TONES.paper], GREY[AFTER_TONES.pale], GREY[AFTER_TONES.mid], GREY[AFTER_TONES.ink]];
const T = i => TONE[i];
const LIGHT = raw('#ffffff');
const GW = ACT_GATES_LEAF[0], GH = ACT_GATES_H;

const C = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x * P, y * P, P, P); };
const fill = (x, y, w, h, tone) => { ctx.fillStyle = tone; ctx.fillRect(x * P, y * P, w * P, h * P); };
function faded(a, draw) {
  if (a <= 0) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * Math.min(1, a);
  draw();
  ctx.globalAlpha = was;
}
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => (BAYER[(x & 3) + 4 * (y & 3)] + 0.5) / 16;

// --- cloud ---------------------------------------------------------------------------
// A cloud as a set of whole cells: pale along its top so it reads on paper,
// mid along its underside, pale at its sides, paper inside with a pale fleck
// off a hash, so no cloud is a flat slab.
const mask = () => new Map();
const add = (m, x, y) => m.set(x + ',' + y, [x, y]);
const has = (m, x, y) => m.has(x + ',' + y);
function puff(m, cx, cy, r) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r * 1.4); x <= cx + r * 1.4; x++) {
      const dx = (x + 0.5 - cx) / 1.4, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy * 1.6 <= r * r) add(m, x, y);
    }
  }
}
function paint(m, seed) {
  for (const [x, y] of m.values()) {
    let tone;
    if (!has(m, x, y - 1)) tone = 1;
    else if (!has(m, x, y + 1)) tone = 2;
    else if (!has(m, x - 1, y) || !has(m, x + 1, y) || !has(m, x, y + 2)) tone = 1;
    else tone = hsh(x, y, seed) < 0.18 ? 1 : 0;
    C(x, y, T(tone));
  }
}

// --- the gates ---------------------------------------------------------------------------
// In cells: `cx` the column line down the gates' middle, `ty` the row they
// stand on (the feet line), `t` the leaves' turn (0 shut, 1 edge-on), `back`
// for the afterlife's side, where they are seen from behind, braced.
function pearl(x, y, big) {
  if (big) { fill(x, y - 1, 2, 4, T(1)); fill(x - 1, y, 4, 2, T(1)); fill(x, y, 2, 2, LIGHT); return; }
  C(x - 1, y, T(1)); C(x + 1, y, T(1)); C(x, y - 1, T(1)); C(x, y + 1, T(1)); C(x, y, LIGHT);
}
// A run of cells `h` tall from row `y`, a cell wide, its left edge at world
// pixel `px` (whole pixels: the leaf's own grid, foreshortened).
const strip = (px, y, h, tone) => { ctx.fillStyle = tone; ctx.fillRect(px, y * P, P, h * P); };
// Two leaves of GW cells, GH tall, open bars over the light, hinged at the
// posts and swinging toward the one looking in. A leaf turned by `t` is seen
// foreshortened by the cosine of its angle: bar `j` stands `j` cells out
// from the hinge times that, down to ACT_GATES_LEAF[1] cells across edge-on,
// the bars closing up into one solid leaf as they come together.
const EDGE = (ACT_GATES_LEAF[1] - 1) / (GW - 1);
function leaves(cx, ty, t, back) {
  const top = ty - GH, bot = ty - 1, mid = ty - GH / 2;
  const k = lerp(EDGE, 1, Math.cos(t * Math.PI / 2));
  const bars = [...new Set([...Array(GW).keys()].filter(j => j % 2 === 0).concat([GW - 1]))];
  for (const s of [-1, 1]) {
    // the hinge cell's left edge, and the left edge of the cell `j` out from it
    const hinge = (s < 0 ? cx - GW : cx + GW - 1) * P;
    const at = j => Math.round(hinge - s * j * P * k);
    const x0 = Math.min(at(0), at(GW - 1)), x1 = Math.max(at(0), at(GW - 1)) + P;
    const rail = y => { ctx.fillStyle = T(2); ctx.fillRect(x0, y * P, x1 - x0, P); };
    rail(top); rail(bot); rail(mid);
    for (const j of bars) strip(at(j), top, GH, T(2));
    if (back) {
      // from behind: a brace up each half, the hinge's foot to the free head,
      // in the mid grey, so the shut pair's inked stiles stay one line
      for (let y = mid + 1; y < bot; y++) strip(at(Math.round((bot - 1 - y) * (GW - 1) / (bot - mid - 2))), y, 1, T(2));
      for (let y = top + 1; y < mid; y++) strip(at(Math.round((mid - 1 - y) * (GW - 1) / (mid - top - 2))), y, 1, T(2));
    }
    strip(at(GW - 1), top, GH, T(3));                                   // the meeting stile, inked
    for (let j = 1; j < GW - 1; j += 2) strip(at(j), top - 1, 1, T(1));
    for (const j of bars) strip(at(j), top - 1, 1, LIGHT);              // a pearl on every bar
  }
}
// The posts, the scrolled crest over the leaves with the light under it and
// pearls along it, and the leaves.
function gate(cx, ty, t, back) {
  const base = ty - GH - 2, arcY = x => base - Math.round(6 * (1 - Math.pow((x + 0.5 - cx) / 7.5, 2)));
  for (let x = cx - 7; x < cx + 7; x++) {
    const a = arcY(x);
    for (let y = a + 1; y < base; y++) C(x, y, (x - cx) % 2 === 0 && y > a + 1 ? T(2) : LIGHT);
    C(x, a, T(2));
  }
  for (let x = cx - 7; x < cx + 7; x++) C(x, base, T(2));
  for (const x of [cx - 6, cx - 3, cx + 2, cx + 5]) pearl(x, arcY(x) - 1, false);
  pearl(cx - 1, arcY(cx) - 3, true);
  for (const [x, d] of [[cx - 9, -1], [cx + 8, 1]]) { C(x, base - 1, T(2)); C(x + d, base - 2, T(2)); C(x + 2 * d, base - 1, T(2)); C(x + d, base, T(2)); }
  for (const x0 of [cx - 8, cx + 6]) {
    const outer = x0 < cx ? x0 : x0 + 1;
    for (let y = ty - GH - 3; y < ty; y++) { C(x0, y, x0 === outer ? T(3) : T(2)); C(x0 + 1, y, x0 + 1 === outer ? T(3) : T(2)); }
    fill(x0, ty - GH - 3, 2, 1, T(3));
    pearl(x0, ty - GH - 6, true);
  }
  leaves(cx, ty, t, back);
}
// The light in the gateway, behind the leaves.
const gateway = (cx, ty) => fill(cx - GW - 1, ty - GH - 1, 2 * GW + 2, GH + 1, LIGHT);
// The light spilling out of the open gates onto what they stand on, coming
// up as the leaves swing open.
const OPEN_ROWS = GW - ACT_GATES_LEAF[1];
function spill(cx, ty, t, rows) {
  if (t <= 0) return;
  faded(t, () => {
    for (let r = 0; r < rows + OPEN_ROWS; r++) {
      const w = OPEN_ROWS + Math.floor(r * 0.7);
      for (let x = cx - w; x < cx + w; x++) if (r === 0 || bay(x, ty + r) < 0.6 - r * 0.08) C(x, ty + r, LIGHT);
    }
  });
}
// The rays: broken lines of pale cells out from the gateway's middle across
// the cloud behind the posts, the longer the wider the leaves stand open, the
// cell at a ray's growing tip faded in by how far it has come.
const RAYS = [-0.95, -0.62, -0.3, 0.3, 0.62, 0.95];
function rays(cx, ty, t) {
  const ox = cx, oy = ty - GH / 2, len = 13 + 3 * OPEN_ROWS * t;
  for (const a of RAYS) {
    for (const sx of [-1, 1]) {
      for (let r = 9; r < Math.ceil(len); r++) {
        if (r % 2) continue;
        const x = Math.floor(ox + sx * Math.cos(a) * r * 1.3), y = Math.floor(oy - Math.sin(a) * r);
        faded(Math.min(1, len - r), () => C(x, y, T(1)));
      }
    }
  }
}
// --- the stair -----------------------------------------------------------------------------
// Its pieces in walk order, in cells, three cells of cloud deep: each tread
// [left column, right column, top row], and each landing the same with
// `landing` set -- the cells under the walk (ghosts.js, `stairWalk`) from the
// foot under the gates (`cx` their middle column), away from the house
// (ACT_STAIR_SIDE), across a landing and back, flight by flight.
export function stairPieces(cx, g) {
  const out = [];
  let x = cx + ACT_STAIR_FOOT, y = g;
  ACT_STAIR_FLIGHTS.forEach((n, i) => {
    const d = ACT_STAIR_SIDE * (i % 2 ? -1 : 1);
    for (let k = 1; k <= n; k++) {
      const c = x + d * ACT_STAIR_TREAD * k;
      out.push({ x0: c, x1: c + ACT_STAIR_TREAD - 1, r: y - ACT_STAIR_RISE * k });
    }
    x += d * ACT_STAIR_TREAD * n; y -= ACT_STAIR_RISE * n;
    if (i < ACT_STAIR_FLIGHTS.length - 1) {
      const to = x + d * ACT_STAIR_LANDING;
      out.push({ x0: Math.min(x, to), x1: Math.max(x, to) + ACT_STAIR_TREAD - 1, r: y, landing: true });
      x = to;
    }
  });
  return out;
}

// --- in the yard -----------------------------------------------------------------------------
const yardEnd = () => portalEnd('heaven', 'yard');
// How far in it is: the stair let down a tread at a time from the foot up,
// each fading in, and the bank and the gates faded in after it.
const treadIn = (k, i, n) => Math.max(0, Math.min(1, k * n * 1.6 - i));
const gatesIn = k => Math.max(0, Math.min(1, (k - 0.5) / 0.5));

// The cloud round the gates is laid out with the stair's side to the right
// and turned to whichever side ACT_STAIR_SIDE puts the stair: `on(d)` is the
// column `d` cells toward the stair from the gates' middle line.
export function drawGatesBehind() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = yardEnd(), cx = Math.round(e.x / P), ty = Math.round(e.feet / P), g = Math.round(S.groundY / P);
  const on = d => cx + ACT_STAIR_SIDE * d;
  const turn = gatesTurn(), a = gatesIn(k);
  faded(a, () => {
    const m = mask();
    puff(m, on(-10), ty - 4, 2.8); puff(m, on(12), ty - 4, 5); puff(m, on(18), ty - 1, 3.5);
    puff(m, on(-9), ty - 9, 3); puff(m, on(9), ty - 9, 3.2);
    paint(m, 21);
    rays(cx, ty, turn);
  });
  // the stair, from the foot under the gates (a body's left, ghosts.js)
  const pieces = stairPieces(cx, g);
  pieces.forEach(({ x0, x1, r, landing }, i) => faded(treadIn(k, i, pieces.length), () => {
    const m = mask();
    for (let x = x0 - (landing ? 1 : 0); x <= x1 + (landing ? 1 : 0); x++) for (let y = r; y < r + 3; y++) add(m, x, y);
    if (landing) puff(m, (x0 + x1 + 1) / 2, r + 3, 2.2);
    else if (hsh(x0, r, 4) < 0.7) add(m, x0 + Math.floor(hsh(x0, r, 5) * ACT_STAIR_TREAD), r + 3);
    paint(m, landing ? 33 : 31);
  }));
  // the bank they stand in, longer on the stair's side, and the light in the gateway
  faded(a, () => {
    const m = mask(), b = ACT_GATES_BANK_CELLS;
    for (let x = cx + b.lo; x <= cx + b.hi; x++) {
      const d = (x - cx) * ACT_STAIR_SIDE;
      add(m, x, ty); add(m, x, ty + 1); if (d > -9 && d < 17) add(m, x, ty + 2);
    }
    puff(m, on(-8), ty + 2, 2.6); puff(m, on(13), ty + 2.5, 3.5); puff(m, on(-1), ty + 3, 3);
    paint(m, 41);
    gateway(cx, ty);
    spill(cx, ty, turn, 3);
  });
}
export function drawGatesFront() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = yardEnd();
  faded(gatesIn(k), () => gate(Math.round(e.x / P), Math.round(e.feet / P), gatesTurn(), false));
}

// --- in the afterlife -----------------------------------------------------------------------
// The same gates from behind, standing on the cloud floor, the floor heaped
// either side of their feet.
export function drawGatesAfter() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = portalEnd('heaven', 'after'), cx = Math.round(e.x / P), fy = Math.round(e.feet / P);
  faded(k, () => {
    gateway(cx, fy);
    rays(cx, fy, gatesTurn());
    gate(cx, fy, gatesTurn(), true);
    const m = mask();
    for (let x = cx - 18; x <= cx + 18; x++) { add(m, x, fy); add(m, x, fy + 1); }
    puff(m, cx - 12, fy - 2, 4); puff(m, cx + 12, fy - 2, 4); puff(m, cx - 17, fy, 3); puff(m, cx + 17, fy, 3);
    paint(m, 51);
  });
}
