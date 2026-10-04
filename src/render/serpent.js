// The serpent: its coil in the deep, stage by stage, with the one it took
// held in its belly; and its head and neck coming up out of the drowned pit
// in the yard, for the snatch.
//
// In the deep it is drawn in the deep's inverted palette (render/deep.js,
// `seen`): white scales on the black, its wards in the abyss's purple. The
// body is laid along its curve, not down columns: a cell is the serpent's if
// its middle is within the body's half thickness of the centerline, so the
// edges run smooth and the head and tail are round. Every cell is read in
// the body's own coordinates -- how far along it, how far across -- so the
// lattice, the ward and the cracks follow the coil round a bend.
//
// The wound is read on the body: cracks out from the belly as far as it is
// deep, and the gap at the belly breaking the cage of ribs the one it took is held in (DESIGN.md, "The serpent, redrawn").
// A blow is read on it too: a bite out of the edge it came from, closing,
// the hide giving under it a beat, and a ring running over a stunned coil's
// head (DESIGN.md, "Blows land"); and what the fighters have laid on it, the
// statuses, over the whole of it (docs/wave-party.md, "The picture"); and
// its phase's mechanic, the surge's throb and the sink's fade under the
// abyss's veil (deep/phases.js).

import { now } from '../clock.js';
import { P, WORKER, COIL_SEGS, COIL_HEAD, COIL_GIRTH, WARD_MS, WARD_AT,
         WOUND_GAP, BELLY_AT, DENT_REACH, DENT_LIFT, DENT_BIG, DENT_CORE, DENT_STEPS,
         BLEED_DRIPS, BLEED_DRIP_S, HELD_EVERY, EXPOSED_EVERY, EXPOSED_LIFT_HZ,
         CRACK_REACH, COIL_STEP, SNOUT, CREST_LEN, CREST_H, BELLY_BULGE, BELLY_LEN, RIB_EVERY,
         SNATCH_HEAD_W, SNATCH_HEAD_H, SNATCH_NECK_W, SNATCH_LEAN, SNATCH_HINGE, SNATCH_GAPE, SNATCH_CREST, SNATCH_HIDE, SNATCH_RISE, CHIP_R, CHIP_HEAL_S, CHIP_RAGGED,
         STUN_RING, STUN_RING_UP, STUN_RING_BACK, STUN_RING_STEP_MS, STUN_RING_TONES,
         STUN_RING_DIM, PLATE_EVERY, PLATE_W, PLATE_TONE, PLATE_EDGE, RESIST_FLICKER_HZ, THROB_R, THROB_HZ, SINK_DIM, SINK_WARN_DIM, SINK_VEIL_EVERY,
         MEAL_SWALLOW_S, MEAL_HINGE, MEAL_SWELL_LEN, MEAL_SWELL, MEAL_AURA_S, MEAL_CROSSES, MEAL_CROSS_S, MEAL_CROSS_RISE,
         BREAK_DIVE, BREAK_BUBBLES, BREAK_BUBBLE_RISE } from '../config.js';
import { S } from '../state.js';
import { mealNow, jawOpen, jawGap } from '../deep/meals.js';
import { lengthOfKind, mealKind } from './fish.js';
import { coilLine, coilThick, mouthX, deepFloor } from '../deep/place.js';
import { woundK } from '../deep/serpent.js';
import { part, sinkK, resistNow, resistNext, breaking, breakKind, resistAt, roarGape } from '../deep/phases.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, deepWindow } from './deep.js';
import { drawBody } from './crew.js';
import { swellAt } from './cores.js';
import { cellImage } from './cellimage.js';
import { dentsNow } from './arms.js';

const coil = cellImage();

const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;
const snap = v => Math.round(v / P) * P;
// A length, as a square root: `Math.hypot` guards against overflow nothing
// here comes near, and costs several times as much, which in the coil's
// cell loop was most of the deep's frame.
const lengthOf = (dx, dy) => Math.sqrt(dx * dx + dy * dy);
const WHITE = GREYS.length - 1;

// How far the body reaches either side of its centerline at `u` segments
// from the head: the coil's own girth (`coilThick`), and the snout, run on
// past the head, tapering.
function radiusAt(u, snoutU) {
  if (u < 0) return COIL_HEAD / 2 * (1 - 0.55 * Math.min(1, -u / snoutU));
  return coilThick(u) / 2;
}

// The centerline laid out finely: where each sample is, which way the body
// runs there (t) and which way is across it (n, pointing down), how far
// along the body it is, and how thick.
function lay(t, x0, x1) {
  const segPx = coilLine(1, t).x - coilLine(0, t).x;
  const du = COIL_STEP / segPx, snoutU = SNOUT / segPx;
  const pts = [];
  let along = 0, last = null;
  for (let u = -snoutU; u <= COIL_SEGS - 1; u += du) {
    const p = coilLine(u, t), q = coilLine(u + du, t);
    if (last) along += lengthOf(p.x - last.x, p.y - last.y);
    last = p;
    const len = lengthOf(q.x - p.x, q.y - p.y) || 1;
    const tx = (q.x - p.x) / len, ty = (q.y - p.y) / len;
    const r = radiusAt(u, snoutU);
    pts.push({ u, x: p.x, y: p.y, tx, ty, nx: -ty, ny: tx, along, r, r0: r });
  }
  const alongAt = u => pts[Math.max(0, Math.min(pts.length - 1, Math.round((u + snoutU) / du)))].along;
  const reach = COIL_GIRTH * 2;
  const shown = pts.filter(p => p.x > x0 - reach && p.x < x1 + reach);
  const dents = dentsNow(t / 1000);
  if (dents.length) for (const p of shown) p.y += dentAt(p.x / P, t / 1000, dents) * P;
  return { pts: shown, alongAt };
}

// The body flinches from a blow, as a body does: the stretch of it round the
// hit is thrown up as one piece, a cell or two, held, half down, and at rest
// (DENT_STEPS) -- the middle of the stretch whole, its ends half as far. Held
// steps, whole cells, never a shudder; where two blows overlap the bigger
// lift stands. A stream's ticks (the beam) leave it be. Cells, from the
// fighters' contacts (render/arms.js); drawing only, the sim's coil does not
// move.
const stepOf = u => { for (const [until, k] of DENT_STEPS) if (u < until) return k; return 0; };
const DENT_S = DENT_STEPS[DENT_STEPS.length - 1][0];
function dentAt(cx, t, dents) {
  let off = 0;
  for (const d of dents) {
    const u = t - d.t0;
    if (d.stream || u < 0 || u >= DENT_S) continue;
    const big = d.k > DENT_BIG ? 1 : 0, reach = DENT_REACH[big], far = Math.abs(cx - d.x);
    if (far > reach) continue;
    const lift = Math.round(DENT_LIFT[big] * stepOf(u) * (far <= reach * DENT_CORE ? 1 : 0.5) + 0.01);
    off = Math.min(off, -lift);
  }
  return off;
}

// --- the hide, as drawn --------------------------------------------------------
// Each column of the coil drawn this frame, its top and bottom rows of hide
// in world cells: what a fist, a blade or an arrow is aimed at, so it meets
// the hide the picture shows, give and bites and all. A column the coil was
// not drawn over this frame is read off the centerline instead.
let hide = { c0: 0, top: new Int32Array(0), bot: new Int32Array(0) };
function laidAt(c) {
  const t = now(), x = (c + 0.5) * P;
  let best = null, bd = Infinity, bu = 0;
  for (let i = 0; i < COIL_SEGS; i++) {
    const p = coilLine(i, t), d = Math.abs(p.x - x);
    if (d < bd) { bd = d; best = p; bu = i; }
  }
  const r = coilThick(bu) / 2;
  return { top: Math.round((best.y - r) / P), bot: Math.round((best.y + r) / P) - 1 };
}
function column(c) {
  const i = c - hide.c0;
  if (i >= 0 && i < hide.top.length && hide.bot[i] >= hide.top[i]) return { top: hide.top[i], bot: hide.bot[i] };
  return laidAt(c);
}
export const hideTop = c => column(c).top;
export const hideBot = c => column(c).bot;
export const hideMid = c => { const k = column(c); return Math.round((k.top + k.bot) / 2); };
export const onHide = (cx, cy) => { const k = column(Math.round(cx)), r = Math.round(cy); return r >= k.top && r <= k.bot; };

// A stunned coil holds still (deep/place.js), and this says so: a flat ring
// of cells over the head, standing straight up off its top edge whichever
// way the neck is bent, with one bright cell running round it and a tail
// fading behind. `head` is the sample at the head's segment, or none when the
// head is off the glass.
function drawStunRing(t, head) {
  if (!(S.serpentStun > 0) || !head) return;
  const cx = snap(head.x), cy = snap(head.y - head.r) - STUN_RING_UP * P;
  const n = STUN_RING.length, lead = Math.floor(t / STUN_RING_STEP_MS) % n;
  STUN_RING.forEach(([dx, dy], i) => {
    const behind = (lead - i + n) % n;
    ctx.fillStyle = GREYS[WHITE - (behind < STUN_RING_TONES.length ? STUN_RING_TONES[behind] : STUN_RING_DIM)];
    ctx.fillRect(cx + dx * P, cy + dy * P, P, P);
  });
}

// The bites still open, each where it is along the body, the edge it is on
// and how wide it still is: a blow's size gives its radius, and it closes
// over CHIP_HEAL_S, slowly at first and then all at once, so a bite is read
// as a bite for most of its life rather than as a shrinking dent.
function bites(t, alongAt) {
  const out = [];
  for (const ch of S.serpentChips) {
    const left = 1 - ((t - ch.at) / (CHIP_HEAL_S * 1000)) ** 2;
    const rad = (CHIP_R[0] + (CHIP_R[1] - CHIP_R[0]) * ch.k) * P * left;
    if (rad >= P / 2) out.push({ along: alongAt(ch.u), side: ch.side, rad, seed: Math.round(ch.at) });
  }
  return out;
}
// Whether a cell of the hide is bitten out: within a bite's radius of the
// point on its edge, less a ragged few left standing.
function bitten(list, along, across, r, aI, cI) {
  for (const b of list) {
    const da = along - b.along, dc = across - b.side * r;
    if (da * da + dc * dc < b.rad * b.rad && seeth(aI + b.seed, cI) % 100 >= CHIP_RAGGED * 100) return true;
  }
  return false;
}

// In front of the stations, but diving behind them (`drawSerpentDiving`,
// earlier in the layers) and under the deep's floor: everything of him below
// it is cut.
export function drawSerpent() { if (breakKind() !== 'dive') drawCoil(); }
export function drawSerpentDiving() {
  if (breakKind() !== 'dive') return;
  ctx.save(); ctx.beginPath(); ctx.rect(-1e6, -1e6, 2e6, deepFloor() + 1e6); ctx.clip();
  drawCoil();
  ctx.restore();
}
function drawCoil() {
  const t = now();
  const stage = S.serpentStage;
  const { x0, x1 } = deepWindow();
  const held = !S.serpentFreed && stage < 4;
  const wk = stage >= 4 ? 0 : woundK();
  const { pts, alongAt } = lay(t, x0, x1);
  hide = { c0: 0, top: new Int32Array(0), bot: new Int32Array(0) };
  if (!pts.length) return;
  const bit = bites(t, alongAt);
  const bellyA = alongAt(BELLY_AT * (COIL_SEGS - 1)), headA = alongAt(0);
  const gap = held ? Math.round(wk * WOUND_GAP / P) * P : 0;
  const reach = wk * CRACK_REACH;
  const wardPh = t / WARD_MS * Math.PI * 2;
  // The resist up shows on the hide: the ward's purple shimmer for magic,
  // plates for physical; the coming one flickers in before the fading's
  // switch (deep/phases.js).
  const coming = resistNext();
  // A break shows the old hide where it has not yet been renewed (deep/phases.js).
  const shownNow = coming && Math.floor(t / 1000 * RESIST_FLICKER_HZ * 2) % 2 ? coming : resistNow();
  const renewing = breaking();

  // The belly swells round him while he is in it.
  if (held) for (const p of pts) {
    const d = Math.abs(p.along - bellyA);
    if (d < BELLY_LEN) p.r += BELLY_BULGE * Math.sqrt(1 - (d / BELLY_LEN) ** 2);
  }
  // A meal (the owner's A, docs/mocks/heal-eat-2026-09-30.html): the jaws
  // swing apart from their hinge for the creature and shut on it, and its
  // swallow is a lump that runs from the head to the belly, fatter for a
  // longer one, the creature dark through the hide. The jaws are the head
  // drawn wider by the gap (`jawGap`), each half pushed off the mouth's line.
  const meal = held && S.view === 'deep' ? mealNow() : null;
  const open = Math.max(meal ? jawOpen(meal.toLand) : 0, roarGape());   // and a break's roar
  let lumpAt = null, lumpLen = 0;
  if (meal && meal.toLand >= 0 && meal.toLand < MEAL_SWALLOW_S) {
    const a = 1 - meal.toLand / MEAL_SWALLOW_S;
    lumpAt = headA + (a * a * (3 - 2 * a)) * (bellyA - headA);
    lumpLen = MEAL_SWELL_LEN * P * (0.7 + lengthOfKind(mealKind(meal.n)) / 30);
    const swell = MEAL_SWELL * P * (0.5 + lengthOfKind(mealKind(meal.n)) / 24);
    for (const p of pts) {
      const d = Math.abs(p.along - lumpAt);
      if (d < lumpLen) p.r += swell * Math.sqrt(1 - (d / lumpLen) ** 2);
    }
  }
  if (open > 0) for (const p of pts) p.r += jawGap(p.along / P, open) * P;

  // Each cell takes the sample nearest it. On flat arrays over the coil's box, and
  // painted into one image (`coil`): a map of cell objects and a fillRect a
  // cell was the deep's whole frame on a large screen.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    const R = p.r + P * 2;
    if (p.x - R < minX) minX = p.x - R;
    if (p.x + R > maxX) maxX = p.x + R;
    if (p.y - R < minY) minY = p.y - R;
    if (p.y + R > maxY) maxY = p.y + R;
  }
  minX = snap(minX) - P; minY = snap(minY) - P;
  const cols = Math.ceil((maxX - minX) / P) + 2, rows = Math.ceil((maxY - minY) / P) + 2;
  const best = new Float32Array(cols * rows).fill(Infinity);
  const own = new Int32Array(cols * rows).fill(-1);
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k], R = p.r + P;
    for (let cy = snap(p.y - R) - P; cy <= p.y + R; cy += P) {
      const row = (cy - minY) / P;
      for (let cx = snap(p.x - R) - P; cx <= p.x + R; cx += P) {
        const dx = cx + P / 2 - p.x, dy = cy + P / 2 - p.y;
        const dist = lengthOf(dx, dy);
        if (dist > R) continue;
        const i = row * cols + (cx - minX) / P;
        if (dist >= best[i]) continue;
        best[i] = dist; own[i] = k;
      }
    }
  }

  coil.begin(cols, rows);
  const ribs = [];
  // the hide's columns as drawn, for everything aimed at it
  const c0 = minX / P, r0 = minY / P;
  const top = new Int32Array(cols).fill(1 << 30), bot = new Int32Array(cols).fill(-(1 << 30));
  const mark = i => {
    const c = i % cols, r = r0 + Math.floor(i / cols);
    if (r < top[c]) top[c] = r;
    if (r > bot[c]) bot[c] = r;
  };
  for (let i = 0; i < own.length; i++) {
    if (own[i] < 0) continue;
    const p = pts[own[i]];
    const x = minX + (i % cols) * P, y = minY + Math.floor(i / cols) * P;
    const dx = x + P / 2 - p.x, dy = y + P / 2 - p.y;
    const dist = best[i];
    let r = p.r;
    const along = p.along + dx * p.tx + dy * p.ty;
    let across = dx * p.nx + dy * p.ny;
    const da = along - bellyA;
    if (gap && Math.abs(da) < gap / 2) continue;                 // the wound: open water
    if (dist > r) continue;
    // The jaws apart: between them open water, where the creature going in
    // shows; outside, each half of the head as it was, pushed off the line.
    const g = open > 0 ? jawGap(along / P, open) * P : 0;
    let tooth = false;
    if (g > 0) {
      if (Math.abs(across) < g) continue;
      tooth = Math.abs(across) - g < P;
      across -= Math.sign(across) * g;
      r -= g;
      if (Math.abs(across) > r) continue;
    }
    const aI = Math.round(along / P), cI = Math.round(across / P);
    const shown = renewing ? resistAt(p.u / (COIL_SEGS - 1)) : shownNow;
    if (bit.length && bitten(bit, along, across, r, aI, cI)) continue;   // a bite: open water
    // The cage: inside the swell, pale, crossed by dark ribs he is seen
    // between. Pale because a body in the deep is dark with a light edge,
    // and on a dark inside he was a hole in a hole.
    mark(i);
    if (held && Math.abs(da) < BELLY_LEN && dist < r - P && r > p.r0 + P / 2) {
      if (((aI % RIB_EVERY) + RIB_EVERY) % RIB_EVERY === 0) ribs.push({ x, y });
      else coil.put(i, GREYS[WHITE - 4 - (seeth(aI, cI) % 2)]);
      continue;
    }
    let ramp = GREYS;
    // The hide: a spine down the middle and a shaded belly, plain white
    // between. Lines that follow the curve only step with it; a lattice of
    // dots read off the body's coordinates popped in and out as it bent, and
    // plain white is what the cracks show up on.
    let rung = across > r - P ? WHITE - 3
             : Math.abs(across) < P / 2 ? WHITE - 2
             : across > P * 0.9 ? WHITE - 1
             : WHITE;
    if (shown === 'magic' && Math.sin(aI * 0.45 + cI * 1.1 - wardPh) > WARD_AT) {
      ramp = PURPLES; rung = WHITE - (seeth(aI, cI) % 3);
    }
    if (shown === 'physical' && ((aI % PLATE_EVERY) + PLATE_EVERY) % PLATE_EVERY < PLATE_W)
      rung = across < -r + P ? WHITE - PLATE_EDGE : WHITE - PLATE_TONE;
    // The cracks: two, wandering across the body, out from the belly as far
    // as the wound is deep; near black at the wound, greyer at their tips.
    if (reach > 0 && Math.abs(da) < reach) {
      const w1 = Math.sin(along / (P * 2.3)) * r * 0.5;
      const w2 = Math.sin(along / (P * 3.1) + 2) * r * 0.55;
      if (Math.abs(across - w1) < P * 0.6 || (Math.abs(across - w2) < P * 0.6 && seeth(aI, 7) % 3)) {
        ramp = GREYS; rung = 1 + Math.round(3 * Math.abs(da) / reach);
      }
    }
    // Teeth along the open jaws' edges, and the lump dark through the hide.
    if (tooth && (aI & 1) === 0 && along < (MEAL_HINGE - 1) * P) { ramp = GREYS; rung = WHITE; }
    if (lumpAt != null && Math.abs(along - lumpAt) < lumpLen * 0.6 && Math.abs(across) < P * 1.6) { ramp = GREYS; rung = 2; }
    // The snout's jaw, a line through it, and the eye behind it.
    if (!g && along < headA && Math.abs(across) < P / 2) { ramp = GREYS; rung = 0; }
    if (Math.abs(along - headA - P) < P / 2 && Math.abs(across + r - P * 2) < P / 2) { ramp = GREYS; rung = 0; }
    coil.put(i, ramp[rung]);
  }
  // Sinking into the abyss the whole of him dims, and flickers dim in the
  // warning (deep/phases.js).
  ctx.globalAlpha = 1 - dimOf(t);
  coil.draw(ctx, minX, minY);
  hide = { c0, top, bot };
  // The crest: a fin of the abyss's purple standing up off the head and
  // running back along the neck, spikes a cell apart, every other one a cell
  // taller, shortening to nothing at its end. Stood on the body's top edge
  // across the body, so it rides the bends with the rest.
  const crestFrom = headA - SNOUT / 2, crestTo = headA + CREST_LEN;
  const spiked = new Set();
  for (const p of pts) {
    if (p.along < crestFrom || p.along > crestTo) continue;
    const j = Math.round((p.along - crestFrom) / P);
    if (spiked.has(j) || j % 2) continue;       // a spike, then a cell of water
    spiked.add(j);
    const left = 1 - (p.along - crestFrom) / (crestTo - crestFrom);
    const tall = Math.max(1, Math.round((j % 4 === 0 ? CREST_H : CREST_H - 1) * Math.min(1, left * 1.6)));
    for (let m = 1; m <= tall; m++) {
      const d = p.r - P / 2 + m * P;
      ctx.fillStyle = PURPLES[WHITE - 1 - (j % 2)];
      ctx.fillRect(snap(p.x - p.nx * d - P / 2), snap(p.y - p.ny * d - P / 2), P, P);
    }
  }
  // Him, whole in the cage, and the ribs over him: the wound's gap has
  // already taken the ribs it crossed.
  if (held) {
    let b = pts[0];
    for (const p of pts) if (Math.abs(p.along - bellyA) < Math.abs(b.along - bellyA)) b = p;
    if (Math.abs(b.along - bellyA) < BELLY_LEN) drawBody(snap(b.x) - WORKER / 2, snap(b.y) - WORKER / 2);
    ctx.fillStyle = GREYS[2];
    for (const c of ribs) ctx.fillRect(c.x, c.y, P, P);
  }
  const ringA = headA + STUN_RING_BACK * P;
  let head = null;
  for (const p of pts) if (Math.abs(p.along - ringA) < P && (!head || Math.abs(p.along - ringA) < Math.abs(head.along - ringA))) head = p;
  drawStatuses(t / 1000);
  drawStunRing(t, head);
  if (held) drawMealCrosses(t, pts, bellyA);
  ctx.globalAlpha = 1;
  drawVeil(t, pts);
  drawBubbles(pts);
  let belly = pts[0];
  for (const p of pts) if (Math.abs(p.along - bellyA) < Math.abs(belly.along - bellyA)) belly = p;
  if (Math.abs(belly.along - bellyA) < BELLY_LEN) drawThrob(t, belly);
  ctx.fillStyle = '#000';
}

// The heal landing (the owner's pick): purple crosses lift off the length of
// the body, the nearest the belly first, each rising and fading.
const unit = k => { const x = Math.sin(k * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
function drawMealCrosses(t, pts, bellyA) {
  const a = (t - S.mealLandedAt) / 1000;
  if (!(S.mealLandedAt > 0) || a < 0 || a >= MEAL_AURA_S || !pts.length) return;
  const first = pts[0].along, span = pts[pts.length - 1].along - first, seed = Math.round(S.mealLandedAt);
  for (let k = 0; k < MEAL_CROSSES; k++) {
    const along = first + unit(seed + k * 3) * span;
    const delay = unit(seed + k * 5) * 0.4 + Math.abs(along - bellyA) / (span || 1) * (MEAL_AURA_S - MEAL_CROSS_S - 0.4);
    const b = (a - delay) / MEAL_CROSS_S;
    if (b < 0 || b >= 1) continue;
    let p = pts[0];
    for (const q of pts) if (Math.abs(q.along - along) < Math.abs(p.along - along)) p = q;
    const x = snap(p.x - p.nx * p.r), y = snap(p.y - p.ny * p.r) - (2 + Math.floor(b * MEAL_CROSS_RISE)) * P;
    ctx.fillStyle = PURPLES[Math.max(2, WHITE - Math.floor(b * 7))];
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillRect(x + dx * P, y + dy * P, P, P);
  }
}

// --- a phase's mechanic, as drawn ----------------------------------------------
// The sink's dimming: how far under he is, and in its warning a flicker.
function dimOf(t) {
  const p = part();
  if (p.m?.kind !== 'sink' || S.mechSkip) return 0;
  if (p.part === 'warn') return SINK_WARN_DIM * (0.5 + 0.5 * Math.sin(t / 1000 * Math.PI * 2 * THROB_HZ));
  return sinkK() * SINK_DIM;
}
// The abyss's veil flowing over him while he is under: purple cells along
// the body, wandering across it, as bright as he is gone.
function drawVeil(t, pts) {
  const k = sinkK();
  if (!(k > 0)) return;
  ctx.globalAlpha = k;
  let last = -Infinity;
  for (const p of pts) {
    if (p.along - last < P * SINK_VEIL_EVERY) continue;
    last = p.along;
    const i = Math.round(p.along / P);
    const across = Math.sin(p.along / (P * 2.5) + t / 400) * p.r;
    ctx.fillStyle = PURPLES[WHITE - 1 - (i % 3)];
    ctx.fillRect(snap(p.x + p.nx * across - P / 2), snap(p.y + p.ny * across - P / 2), P, P);
  }
  ctx.globalAlpha = 1;
}
// The dive's bubbles: up off the floor where he went under, while he is
// under, climbing a held cell at a time and gone at BREAK_BUBBLE_RISE.
function drawBubbles(pts) {
  if (breakKind() !== 'dive' || !pts.length) return;
  const b = BREAK_DIVE, from = b.in / 2, over = b.under + b.in / 2;
  ctx.fillStyle = GREYS[WHITE - 2];
  for (let n = 0; n < BREAK_BUBBLES; n++) {
    const age = S.breakT - (from + n / BREAK_BUBBLES * over);
    const up = Math.floor(age * BREAK_BUBBLE_RISE / (over / 2));
    if (age < 0 || up >= BREAK_BUBBLE_RISE) continue;
    const p = pts[Math.floor(unit(n * 7 + 1) * (pts.length - 1))];
    const drift = Math.round(Math.sin(up * 0.9 + n) * 0.6);
    ctx.fillRect(snap(p.x) + drift * P, snap(Math.min(p.y - p.r, deepFloor())) - (up + 1) * P, P, P);
  }
}
// The surge's throb: a ring of the abyss's purple round the belly, beating
// in the warning and held while it heals.
function drawThrob(t, b) {
  const p = part();
  if (p.m?.kind !== 'surge' || S.mechSkip || p.part === 'calm') return;
  const beat = p.part === 'warn' ? 0.5 + 0.5 * Math.sin(t / 1000 * Math.PI * 2 * THROB_HZ) : 1;
  const r = b.r + (THROB_R - 1 + beat) * P;
  const n = Math.max(12, Math.round(r * 2 * Math.PI / P));
  ctx.globalAlpha = 0.4 + 0.6 * beat;
  ctx.fillStyle = PURPLES[WHITE - 1];
  const seen = new Set();
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    const x = snap(b.x + Math.cos(a) * r * 1.4 - P / 2), y = snap(b.y + Math.sin(a) * r - P / 2);
    if (seen.has(x * 1e5 + y)) continue;
    seen.add(x * 1e5 + y);
    ctx.fillRect(x, y, P, P);
  }
  ctx.globalAlpha = 1;
}

// --- the statuses on the whole serpent ------------------------------------------
// The class bench's painters (docs/mocks/classes), laid over the coil as
// drawn: Bleeding drips off the belly, Held clasps it in the circle's bands,
// Exposed lifts a scale every few columns.
// A stunned coil only holds still under its ring. Read off `S.statuses`,
// which the fight keeps (deep/statuses.js).
const has = key => { const s = S.statuses?.[key]; return !!s && s.until > now(); };
const put = (c, r, tone) => { ctx.fillStyle = tone; ctx.fillRect(c * P, r * P, P, P); };
function drawStatuses(t) {
  const n = hide.top.length;
  if (!n) return;
  const on = i => hide.bot[i] >= hide.top[i];
  if (has('bleed')) {
    // drops off the belly at a scatter of columns, falling and darkening
    for (let k = 0; k < BLEED_DRIPS; k++) {
      const i = 4 + Math.floor(hashOf(k * 7 + 1) * Math.max(1, n - 8));
      if (!on(i)) continue;
      const c = hide.c0 + i, b = hide.bot[i];
      put(c, b, GREYS[5]);
      const a = (t / BLEED_DRIP_S + hashOf(k * 3)) % 1;
      put(c, b + 1 + Math.floor(a * 4), GREYS[[9, 8, 6, 4][Math.floor(a * 4)]]);
    }
  }
  if (has('held')) {
    // the bands round the hide, riding it as it sways: its healing is bound,
    // not its body (the owner's A, docs/mocks/held-2026-09-28.html)
    for (let i = 5; i < n - 2; i += HELD_EVERY) {
      if (!on(i)) continue;
      const c = hide.c0 + i, tp = hide.top[i], bt = hide.bot[i];
      for (let r = tp - 1; r <= bt + 1; r++) put(c, r, r === tp - 1 || r === bt + 1 ? PURPLES[11] : PURPLES[9]);
      for (const d of [-1, 1]) { put(c + d, tp - 1, PURPLES[8]); put(c + d, bt + 1, PURPLES[8]); }
    }
  }
  if (has('exposed')) {
    // a notch of black in the edge and the scale standing a cell or two off it
    for (let i = 2; i < n - 1; i += EXPOSED_EVERY) {
      if (!on(i)) continue;
      const c = hide.c0 + i, up = hashOf(c * 7 + Math.floor(t * EXPOSED_LIFT_HZ + hashOf(c) * 3)) < 0.5 ? 1 : 2;
      put(c, hide.top[i], GREYS[0]);
      put(c, hide.top[i] - up, GREYS[9]);
      if (i + 2 < n && on(i + 2)) put(c + 2, hide.bot[i + 2], GREYS[0]);
    }
  }
}
const hashOf = k => { const x = Math.sin(k * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

// --- the snatch, in the yard --------------------------------------------------
// The head and neck rising out of the drowned pit at the shaft (`S.snatch`,
// snatch.js). In the yard's own palette: black on the white, scales in grey.
// Everything under the surface is cut away, so it comes up out of the liquid
// a row at a time and goes back down the same way; the one it takes is in
// its jaws once `carried`.
export function drawSnatch() {
  const sn = S.snatch;
  if (!sn || sn.headY == null) return;
  const t = now();
  const mx = mouthX();
  const surface = snap(abyssLine() + swellAt(Math.round(mx / P), t));
  if (sn.headY >= surface) return;
  const [EDGE, HIDE, LATTICE, BROW] = SNATCH_HIDE;
  const k = Math.max(0, Math.min(1, (surface - sn.headY) / SNATCH_RISE));   // how far up
  const ease = x => x * x * (3 - 2 * x);
  // It leans out toward the plank as it comes up and draws back with him; the
  // jaws part as it reaches the top and shut on him.
  const lean = (sn.carried ? 0.35 : 1) * ease(k);
  const open = sn.carried ? 0 : ease(Math.max(0, Math.min(1, k * 1.6 - 0.6)));
  const sway = Math.round(Math.sin(t / 700)) * P;
  const cols = SNATCH_HEAD_W / P, rows = SNATCH_HEAD_H / P, mid = Math.floor(rows / 2), neckC = SNATCH_NECK_W / P;
  const hy = snap(sn.headY), neckTop = hy + (mid + 1) * P;
  const baseX = snap(mx - SNATCH_NECK_W / 2) + sway;
  const nxAt = y => baseX - snap(lean * SNATCH_LEAN * Math.sin(Math.max(0, Math.min(1, (surface - y) / Math.max(P, surface - neckTop))) * Math.PI / 2));
  const cell = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); };
  ctx.save();
  ctx.beginPath();
  ctx.rect(baseX - SNATCH_LEAN - SNATCH_HEAD_W - WORKER * 2, hy - P * 8, SNATCH_LEAN + SNATCH_HEAD_W + SNATCH_NECK_W + WORKER * 4, surface - hy + P * 8);
  ctx.clip();
  // The neck, row by row up the curve, the crest down its back.
  for (let y = neckTop; y < surface + P; y += P) {
    const x0 = nxAt(y);
    for (let c = 0; c < neckC; c++)
      cell(x0 + c * P, y, c === 0 || c === neckC - 1 ? EDGE : ((c + y / P) % 3 ? HIDE : LATTICE));
    if ((y / P) % 2 === 0) cell(x0 + neckC * P, y, SNATCH_CREST[(y / P) % 4 ? 0 : 1]);
  }
  // The head: a snout reaching toward the plank, the jaws hinged behind the
  // eye, each half pushed off the mouth's line by the gap, teeth on their edges.
  const hx = nxAt(neckTop) + SNATCH_NECK_W - SNATCH_HEAD_W;
  const gapAt = c => (c < SNATCH_HINGE ? Math.round(open * SNATCH_GAPE * (1 - c / SNATCH_HINGE)) : 0);
  for (let c = 0; c < cols; c++) {
    const half = Math.round(2 + (c / (cols - 1)) * (mid - 2)), gap = gapAt(c);
    for (let r = -half; r <= half; r++) {
      if (open > 0 && r === 0 && c < SNATCH_HINGE) continue;
      const shift = r < 0 ? -gap : r > 0 ? gap : 0;
      let tone = Math.abs(r) === half ? EDGE : r === -half + 1 ? BROW : ((c + r) % 3 ? HIDE : LATTICE);
      if (open > 0.2 && c < SNATCH_HINGE - 1 && c % 2 === 0 && Math.abs(r) === 1) tone = '#fff';
      if (!open && r === 0 && c < 6) tone = EDGE;
      cell(hx + c * P, hy + (mid + r + shift) * P, tone);
    }
    if (c > 5 && c % 2 === 0) {
      const tall = c % 4 ? 2 : 3;
      for (let j = 1; j <= tall; j++) cell(hx + c * P, hy + (mid - half - gap - j) * P, SNATCH_CREST[c % 4 ? 0 : 1]);
    }
  }
  const eyeC = Math.round(cols * 0.62);
  cell(hx + eyeC * P, hy + (mid - 2 - gapAt(eyeC)) * P, '#fff');
  if (sn.carried) drawBody(hx - WORKER / 2, hy + mid * P + P / 2 - WORKER / 2);
  ctx.restore();
  // the surface broken either side of the neck
  ctx.fillStyle = '#fff';
  ctx.fillRect(baseX - P * 2, surface, P, P);
  ctx.fillRect(baseX + SNATCH_NECK_W + P, surface, P, P);
  ctx.fillStyle = '#000';
}
