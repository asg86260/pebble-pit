// Heaven's gates and the cloud stair up to them, drawn (docs/mocks/act3-
// gates-2026-10-19, take A; portals.js has where they stand and how far open,
// ghosts.js the walk up the stair). The same gates at both ends: in the yard
// on a long cloud bank at the top of a stair of cloud in two flights from
// beside the ruin, seen from in front; in the afterlife standing on the cloud
// floor, seen from behind, the light coming up through the floor between
// them.
//
// Act 3's four tones (config, AFTER_TONES) for the cloud, the posts, the
// crest and the leaves; the light alone is raw white, on either page, so on
// the dark one it is the brightest thing there. On the light page raw white
// is the paper's own white, so the light is read by what bounds it: the bars
// and the posts over it, the pale rungs and edges of the light going up, the
// light spilling across the bank's pale top, and rays of pale cells fanned out
// from the gateway across the cloud behind the posts -- broken rays, a cell in
// every other, never a filled disc -- lengthening with the leaves' held steps.
//
// The yard's end is two layers: what stands behind the bodies (the light
// going up, the cloud behind the posts and its rays, the stair, the bank, the
// light in the gateway), and the gates themselves in front of them
// (`drawGatesFront`), so the two of them go up into the gateway and the light
// behind the posts and the crest rather than over them.

import { S } from '../state.js';
import { P, GREY, AFTER_TONES, ACT_GATES_LEAF, ACT_GATES_H, ACT_STAIR_TREAD, ACT_STAIR_RISE, ACT_STAIR_UP,
         ACT_STAIR_LANDING, ACT_GATES_SKY } from '../config.js';
import { ctx } from './ctx.js';
import { raw } from '../ink.js';
import { portalOpenK, portalEnd, gatesStep, GATES_OPEN } from '../portals.js';
import { afterUnder } from '../acts.js';

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
// stand on (the feet line), `k` the leaves' held step, `back` for the
// afterlife's side, where they are seen from behind, braced.
function pearl(x, y, big) {
  if (big) { fill(x, y - 1, 2, 4, T(1)); fill(x - 1, y, 4, 2, T(1)); fill(x, y, 2, 2, LIGHT); return; }
  C(x - 1, y, T(1)); C(x + 1, y, T(1)); C(x, y - 1, T(1)); C(x, y + 1, T(1)); C(x, y, LIGHT);
}
// Two leaves of GW cells, GH tall, open bars over the light, hinged at the
// posts and swinging toward the one looking in: a cell narrower a step, the
// bars closing up into one solid leaf as it turns edge-on.
function leaves(cx, ty, k, back) {
  const w = ACT_GATES_LEAF[k], top = ty - GH, bot = ty - 1, mid = ty - GH / 2;
  for (const s of [-1, 1]) {
    const col = j => (s < 0 ? cx - GW + j : cx + GW - 1 - j);
    if (w >= 4) {
      const bars = [...new Set([...Array(w).keys()].filter(j => j % 2 === 0).concat([w - 1]))];
      for (let j = 0; j < w; j++) { C(col(j), top, T(2)); C(col(j), bot, T(2)); C(col(j), mid, T(2)); }
      for (const j of bars) for (let y = top; y <= bot; y++) C(col(j), y, T(2));
      for (let y = top; y <= bot; y++) C(col(w - 1), y, T(3));          // the meeting stile, inked
      if (back) {
        // from behind: a brace up each half, the hinge's foot to the free head,
        // in the mid grey, so the shut pair's inked stiles stay one line
        for (let y = mid + 1; y < bot; y++) C(col(Math.round((bot - 1 - y) * (w - 1) / (bot - mid - 2))), y, T(2));
        for (let y = top + 1; y < mid; y++) C(col(Math.round((mid - 1 - y) * (w - 1) / (mid - top - 2))), y, T(2));
      }
      for (const j of bars) C(col(j), top - 1, LIGHT);                   // a pearl on every bar
      for (let j = 1; j < w - 1; j += 2) C(col(j), top - 1, T(1));
    } else {
      for (let j = 0; j < w; j++) for (let y = top; y <= bot; y++) C(col(j), y, j === w - 1 || y === mid ? T(3) : T(2));
      C(col(w - 1), top - 1, LIGHT);
    }
  }
}
// The posts, the scrolled crest over the leaves with the light under it and
// pearls along it, and the leaves.
function gate(cx, ty, k, back) {
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
  leaves(cx, ty, k, back);
}
// The light in the gateway, behind the leaves.
const gateway = (cx, ty) => fill(cx - GW - 1, ty - GH - 1, 2 * GW + 2, GH + 1, LIGHT);
// The light spilling out of the open gates onto what they stand on, in the
// leaves' steps.
function spill(cx, ty, k, rows) {
  if (k <= 0) return;
  const half = GW - ACT_GATES_LEAF[k];
  for (let r = 0; r < rows + k; r++) {
    const w = half + Math.floor(r * 0.7);
    for (let x = cx - w; x < cx + w; x++) if (r === 0 || bay(x, ty + r) < 0.6 - r * 0.08) C(x, ty + r, LIGHT);
  }
}
// The rays: broken lines of pale cells out from the gateway's middle across
// the cloud behind the posts, the longer the wider the leaves stand open.
const RAYS = [-0.95, -0.62, -0.3, 0.3, 0.62, 0.95];
function rays(cx, ty, k) {
  const ox = cx, oy = ty - GH / 2, len = 13 + 3 * k;
  for (const a of RAYS) {
    for (const sx of [-1, 1]) {
      for (let r = 9; r < len; r++) {
        if ((r + k) % 2) continue;
        const x = Math.floor(ox + sx * Math.cos(a) * r * 1.3), y = Math.floor(oy - Math.sin(a) * r);
        C(x, y, T(1));
      }
    }
  }
}
// The light going up out of the open gates, the camera's way to the cloud
// floor: a column with pale edges and a pale rung every third row, so it
// reads as a stair of light on either page.
function shaft(cx, y0, y1) {
  for (let y = y0; y < y1; y++) for (let x = cx - 4; x < cx + 4; x++) C(x, y, x === cx - 4 || x === cx + 3 || (y % 3 + 3) % 3 === 0 ? T(1) : LIGHT);
}

// --- the stair -----------------------------------------------------------------------------
// Its treads in cells, [left column, top row] each, three cells of cloud deep:
// the cells under the walk (ghosts.js, `stairWalk`) from the foot under the
// gates, away from the ruin, across the landing and back.
function stairTreads(foot, g) {
  const out = [];
  let x = foot, y = g;
  for (let k = 1; k <= ACT_STAIR_UP; k++) out.push([x + ACT_STAIR_TREAD * k, y - ACT_STAIR_RISE * k]);
  x += ACT_STAIR_TREAD * ACT_STAIR_UP + ACT_STAIR_LANDING; y -= ACT_STAIR_RISE * ACT_STAIR_UP;
  const landing = [x - ACT_STAIR_LANDING, y];
  const back = ACT_GATES_SKY / P / ACT_STAIR_RISE - ACT_STAIR_UP;
  for (let k = 1; k <= back; k++) out.push([x - ACT_STAIR_TREAD * k, y - ACT_STAIR_RISE * k]);
  return { treads: out, landing };
}

// --- in the yard -----------------------------------------------------------------------------
const yardEnd = () => portalEnd('heaven', 'yard');
// How far in it is: the stair let down a tread at a time from the foot up,
// each fading in, and the bank and the gates faded in after it.
const treadIn = (k, i, n) => Math.max(0, Math.min(1, k * n * 1.6 - i));
const gatesIn = k => Math.max(0, Math.min(1, (k - 0.5) / 0.5));

export function drawGatesBehind() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = yardEnd(), cx = Math.round(e.x / P), ty = Math.round(e.feet / P), g = Math.round(S.groundY / P);
  const step = gatesStep(), a = gatesIn(k);
  // the light going up, from the crest to the cloud floor's underside
  if (step > 0) faded(a * step / GATES_OPEN, () => shaft(cx, Math.max(Math.floor(S.camY / P), Math.ceil(afterUnder() / P)), ty - GH - 1));
  faded(a, () => {
    const m = mask();
    puff(m, cx - 10, ty - 4, 2.8); puff(m, cx + 12, ty - 4, 5); puff(m, cx + 18, ty - 1, 3.5);
    puff(m, cx - 9, ty - 9, 3); puff(m, cx + 9, ty - 9, 3.2);
    paint(m, 21);
    rays(cx, ty, step);
  });
  // the stair, from the foot under the gates (a body's left, ghosts.js)
  const foot = Math.round(e.x / P - 1.5), { treads, landing } = stairTreads(foot, g);
  treads.forEach(([c, r], i) => faded(treadIn(k, i, treads.length + 1), () => {
    const m = mask();
    for (let x = c; x < c + ACT_STAIR_TREAD; x++) for (let y = r; y < r + 3; y++) add(m, x, y);
    if (hsh(c, r, 4) < 0.7) add(m, c + Math.floor(hsh(c, r, 5) * ACT_STAIR_TREAD), r + 3);
    paint(m, 31);
  }));
  faded(treadIn(k, ACT_STAIR_UP, treads.length + 1), () => {
    const m = mask();
    for (let x = landing[0] - 1; x < landing[0] + ACT_STAIR_LANDING + ACT_STAIR_TREAD + 1; x++) for (let y = landing[1]; y < landing[1] + 3; y++) add(m, x, y);
    puff(m, landing[0] + 3, landing[1] + 3, 2.2);
    paint(m, 33);
  });
  // the bank they stand in, longer on the stair's side, and the light in the gateway
  faded(a, () => {
    const m = mask();
    for (let x = cx - 11; x <= cx + 20; x++) { add(m, x, ty); add(m, x, ty + 1); if (x > cx - 9 && x < cx + 17) add(m, x, ty + 2); }
    puff(m, cx - 8, ty + 2, 2.6); puff(m, cx + 13, ty + 2.5, 3.5); puff(m, cx - 1, ty + 3, 3);
    paint(m, 41);
    gateway(cx, ty);
    spill(cx, ty, step, 3);
  });
}
export function drawGatesFront() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = yardEnd();
  faded(gatesIn(k), () => gate(Math.round(e.x / P), Math.round(e.feet / P), gatesStep(), false));
}

// --- in the afterlife -----------------------------------------------------------------------
// The same gates from behind, on the cloud floor: the light coming up through
// a gap in the floor between them, thinning with depth, and the floor heaped
// either side of their feet.
export function drawGatesAfter() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = portalEnd('heaven', 'after'), cx = Math.round(e.x / P), fy = Math.round(e.feet / P);
  const bottom = Math.ceil((S.camY + S.viewH) / P) + 1;
  faded(k, () => {
    fill(cx - 4, fy, 8, bottom - fy, T(0));
    for (let y = fy; y < bottom; y++) {
      const keep = 1 - (y - fy) / Math.max(1, bottom - fy);
      for (let x = cx - 4; x < cx + 4; x++) {
        if (bay(x, y) > keep + 0.15) continue;
        C(x, y, x === cx - 4 || x === cx + 3 || (y % 3 + 3) % 3 === 0 ? T(1) : LIGHT);
      }
    }
    gateway(cx, fy);
    rays(cx, fy, gatesStep());
    gate(cx, fy, gatesStep(), true);
    const m = mask();
    for (let x = cx - 18; x <= cx + 18; x++) { add(m, x, fy); add(m, x, fy + 1); }
    puff(m, cx - 12, fy - 2, 4); puff(m, cx + 12, fy - 2, 4); puff(m, cx - 17, fy, 3); puff(m, cx + 17, fy, 3);
    for (const [key, [x]] of [...m.entries()]) if (x >= cx - 5 && x <= cx + 4) m.delete(key);
    paint(m, 51);
    for (const x of [cx - 5, cx + 4]) { C(x, fy, T(2)); C(x, fy + 1, T(1)); }
  });
}
