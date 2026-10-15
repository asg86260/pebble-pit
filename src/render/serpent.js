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
// its phase's mechanic, the lash and the sink's fade under the
// abyss's veil (deep/phases.js).

import { now } from '../clock.js';
import { P, WORKER, COIL_SEGS, COIL_HEAD, COIL_GIRTH, WARD_MS, WARD_AT,
         WOUND_GAP, BELLY_AT, DENT_REACH, DENT_LIFT, DENT_BIG, DENT_CORE, DENT_STEPS,
         BLEED_DRIPS, BLEED_DRIP_S, HELD_EVERY, EXPOSED_EVERY, EXPOSED_LIFT_HZ,
         CRACK_REACH, COIL_STEP, SNOUT, CREST_LEN, CREST_H, BELLY_BULGE, BELLY_LEN, RIB_EVERY,
         SNATCH_HEAD_W, SNATCH_HEAD_H, SNATCH_NECK_W, SNATCH_HINGE, SNATCH_GAPE, SNATCH_CREST, SNATCH_HIDE, SNATCH_RISE, SNATCH_HEAVE_MS, SNATCH_HEAVE_STEPS, CHIP_R, CHIP_HEAL_S, CHIP_RAGGED,
         STUN_RING, STUN_RING_UP, STUN_RING_BACK, STUN_RING_STEP_MS, STUN_RING_TONES,
         STUN_RING_DIM, PLATE_EVERY, PLATE_W, PLATE_TONE, PLATE_EDGE, RESIST_FLICKER_HZ, THROB_HZ, SINK_DIM, SINK_WARN_DIM, SINK_VEIL_EVERY,
         MEAL_SWALLOW_S, MEAL_HINGE, MEAL_SWELL_LEN, MEAL_SWELL, MEAL_AURA_S, MEAL_CROSSES, MEAL_CROSS_S, MEAL_CROSS_RISE,
         BREAK_DIVE, BREAK_BUBBLES, BREAK_BUBBLE_RISE, KILL, KILL_MOTE_S, KILL_MOTE_RISE, KILL_DROP_S, KILL_DROP_STEPS,
         SERPENT_PHASES, ORB_BOLT_S, ORB_BOLTS, ORB_R, ORB_BURST_S, ORB_ARROW_S, ORB_ARROW_UP, ORB_STEP, ORB_GHOSTS,
         BARRIER_GAP, BARRIER_EVERY, BARRIER_FLARE_MS, BARRIER_FLARE_W,
         NEARDEATH, POWERUP, DEEP_MOTE_TINTS, DEEP_H, COIL_Y, SERPENT_EYE_HOLD } from '../config.js';
import { S } from '../state.js';
import { mealNow, jawOpen, jawGap, jawPose } from '../deep/meals.js';
import { lengthOfKind, mealKind } from './fish.js';
import { coilLine, coilThick, mouthX, deepFloor, bellyAt, deepTop, deepX0, deepX1, coilEnds } from '../deep/place.js';
import { woundK } from '../deep/serpent.js';
import { part, sinkK, resistNow, resistNext, breaking, breakKind, resistAt, roarGape, apartK, reformK, killA, cradled, bellyWhole, caged, killFreeA, orbOn, orbMiddle, orbAge, orbRising, orbSinking, orbLift, recoilGape, recoilPose, powerMotes } from '../deep/phases.js';
import { freedBody, jawAt, headLeft } from '../snatch.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, deepWindow } from './deep.js';
import { barZone, barShown } from './serpentbar.js';
import { drawBody, drawSaying } from './crew.js';
import { hisHop, hisSay } from '../abyssintro.js';
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
  // A sample's next point is the one after it: asked once, not twice.
  let p = coilLine(-snoutU, t);
  for (let u = -snoutU; u <= COIL_SEGS - 1; u += du) {
    const q = coilLine(u + du, t);
    if (last) along += lengthOf(p.x - last.x, p.y - last.y);
    last = p;
    const len = lengthOf(q.x - p.x, q.y - p.y) || 1;
    const tx = (q.x - p.x) / len, ty = (q.y - p.y) / len;
    const r = radiusAt(u, snoutU);
    pts.push({ u, x: p.x, y: p.y, tx, ty, nx: -ty, ny: tx, along, r, r0: r });
    p = q;
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
// The eye's cell off the snout's tip, held between frames (`drawCoil`).
let eyeHeld = null;
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
  // The belly is whole until the kill's coming apart reaches it; its cage of
  // ribs, and the wound's gap in it, only on the story's serpent.
  const whole = bellyWhole(), cage = caged(), held = cradled();
  const wk = stage >= SERPENT_PHASES ? 0 : woundK();
  const { pts: laid, alongAt } = lay(t, x0, x1);
  hide = { c0: 0, top: new Int32Array(0), bot: new Int32Array(0) };
  // Down after the kill he comes apart tail first, and gathers again head
  // first (deep/phases.js): only what is whole is drawn; the rest is motes.
  const pts = laid.filter(wholeAt);
  drawKillMotes(t, laid);
  if (!pts.length) return;
  const bit = bites(t, alongAt);
  const bellyA = alongAt(BELLY_AT * (COIL_SEGS - 1)), headA = alongAt(0);
  const gap = cage ? Math.round(wk * WOUND_GAP / P) * P : 0;
  // A level's bar emptied (deep/phases.js, `recoilPose`): the cracks run over
  // the whole body, a third line with them, and fill with light out from the
  // belly, sealing from their tips as the deep pours in.
  const pose = recoilPose(), posed = !!pose && pose.reach != null;
  const reach = posed ? pose.reach : wk * CRACK_REACH;
  const light = pose ? pose.lit : null, seal = !!pose && pose.seal;
  const wardPh = t / WARD_MS * Math.PI * 2;
  // The resist up shows on the hide: the ward's purple shimmer for magic,
  // plates for physical; the coming one flickers in before the fading's
  // switch (deep/phases.js).
  const coming = resistNext();
  // A break shows the old hide where it has not yet been renewed (deep/phases.js).
  const shownNow = coming && Math.floor(t / 1000 * RESIST_FLICKER_HZ * 2) % 2 ? coming : resistNow();
  const renewing = breaking();

  // The belly swells round its cage.
  if (cage) for (const p of pts) {
    const d = Math.abs(p.along - bellyA);
    if (d < BELLY_LEN) p.r += BELLY_BULGE * Math.sqrt(1 - (d / BELLY_LEN) ** 2);
  }
  // A meal (the owner's A, docs/mocks/heal-eat-2026-09-30.html): the jaws
  // swing apart from their hinge for the creature and shut on it, and its
  // swallow is a lump that runs from the head to the belly, fatter for a
  // longer one, the creature dark through the hide. The jaws are the head
  // drawn wider by the gap (`jawGap`), each half pushed off the mouth's line.
  const meal = whole && S.view === 'deep' ? mealNow() : null;
  const open = Math.max(meal ? jawOpen(meal.toLand) : 0, roarGape(), recoilGape());   // and a break's roar, a recoil's cry
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
  // The snout's jaw line and the eye behind it, laid once off the snout's tip
  // rather than asked of each cell: picked cell by cell off the curve, the
  // line broke into steps and the eye hopped about the head as it turned.
  // The jaw is one unbroken run of cells from the tip back to the head's
  // line; the eye keeps its offset from the tip's cell, so the two move
  // together, a whole cell at a time.
  const marks = new Set();
  {
    const at = (want, off) => {
      let e = pts[0];
      for (const q of pts) if (Math.abs(q.along - want) < Math.abs(e.along - want)) e = q;
      const da = want - e.along;
      return { x: e.x + e.tx * da + e.nx * off, y: e.y + e.ty * da + e.ny * off, r: e.r };
    };
    const cellOf = q => [Math.floor((q.x - minX) / P), Math.floor((q.y - minY) / P)];
    const put = (c, rr) => { if (c >= 0 && c < cols && rr >= 0 && rr < rows) marks.add(rr * cols + c); };
    const tipP = at(pts[0].along + P / 2, 0), [tc, tr] = cellOf(tipP);
    const [hc, hr] = cellOf(at(headA, 0));
    if (!open) {
      const n = Math.max(Math.abs(hc - tc), Math.abs(hr - tr));
      for (let k = 0; k <= n; k++) put(tc + Math.round((hc - tc) * k / (n || 1)), tr + Math.round((hr - tr) * k / (n || 1)));
    }
    // Its offset is held until the true one is most of a cell off it: rounded
    // fresh each frame, an offset near a half flipped between two cells.
    const head = at(headA + P, 0), eye = at(headA + P, -(head.r - P * 2));
    const ox = (eye.x - tipP.x) / P, oy = (eye.y - tipP.y) / P;
    if (!eyeHeld || Math.abs(ox - eyeHeld[0]) > SERPENT_EYE_HOLD || Math.abs(oy - eyeHeld[1]) > SERPENT_EYE_HOLD)
      eyeHeld = [Math.round(ox), Math.round(oy)];
    put(tc + eyeHeld[0], tr + eyeHeld[1]);
  }
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
    if (cage && Math.abs(da) < BELLY_LEN && dist < r - P && r > p.r0 + P / 2) {
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
      const w3 = posed ? Math.sin(along / (P * 1.7) + 4) * r * 0.6 : 0;
      if (Math.abs(across - w1) < P * 0.6 || (Math.abs(across - w2) < P * 0.6 && seeth(aI, 7) % 3)
          || (posed && Math.abs(across - w3) < P * 0.5 && seeth(aI, 3) % 2)) {
        const d = Math.abs(da);
        if (light != null && d <= light) {
          // the light's front bright as it runs out, and the sealing edge
          ramp = PURPLES;
          rung = (light < NEARDEATH.full && d > light - POWERUP.seam) || (seal && d > reach - POWERUP.seal) ? WHITE : WHITE - 1 - (seeth(aI, cI) % 2);
        } else { ramp = GREYS; rung = 1 + Math.round(3 * d / reach); }
      }
    }
    // Teeth along the open jaws' edges, and the lump dark through the hide.
    if (tooth && (aI & 1) === 0 && along < (MEAL_HINGE - 1) * P) { ramp = GREYS; rung = WHITE; }
    if (lumpAt != null && Math.abs(along - lumpAt) < lumpLen * 0.6 && Math.abs(across) < P * 1.6) { ramp = GREYS; rung = 2; }
    // The snout's jaw line and the eye (`marks`, laid above).
    if (marks.has(i)) { ramp = GREYS; rung = 0; }
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
  // Through the constrict's warning it lights up head first, and holds lit
  // while the bolts leave it (`drawOrb`), which start from its tips.
  const crestFrom = headA - SNOUT / 2, crestTo = headA + CREST_LEN;
  const spiked = new Set(), lit = combLit(t);
  crestTips = [];
  for (const p of pts) {
    if (p.along < crestFrom || p.along > crestTo) continue;
    const j = Math.round((p.along - crestFrom) / P);
    if (spiked.has(j) || j % 2) continue;       // a spike, then a cell of water
    spiked.add(j);
    const left = 1 - (p.along - crestFrom) / (crestTo - crestFrom);
    const tall = Math.max(1, Math.round((j % 4 === 0 ? CREST_H : CREST_H - 1) * Math.min(1, left * 1.6)));
    const on = 1 - left < lit, flick = Math.floor(t / 1000 * 12 + j) % 4 < 2;
    for (let m = 1; m <= tall; m++) {
      const d = p.r - P / 2 + m * P;
      ctx.fillStyle = on ? (m === tall ? GREYS[WHITE] : flick ? PURPLES[WHITE] : PURPLES[WHITE - 1]) : PURPLES[WHITE - 1 - (j % 2)];
      ctx.fillRect(snap(p.x - p.nx * d - P / 2), snap(p.y - p.ny * d - P / 2), P, P);
    }
    if (on) crestTips.push({ x: p.x - p.nx * (p.r + tall * P), y: p.y - p.ny * (p.r + tall * P) });
  }
  // Him, whole in the cage, and the ribs over him: the wound's gap has
  // already taken the ribs it crossed.
  if (cage) {
    let b = pts[0];
    for (const p of pts) if (Math.abs(p.along - bellyA) < Math.abs(b.along - bellyA)) b = p;
    // The first trip down has him hop against the ribs and call over the
    // hide, a stand clear of it (abyssintro.js).
    const near = held && Math.abs(b.along - bellyA) < BELLY_LEN;
    if (near) drawBody(snap(b.x) - WORKER / 2, snap(b.y) - WORKER / 2 - hisHop(t));
    ctx.fillStyle = GREYS[2];
    for (const c of ribs) ctx.fillRect(c.x, c.y, P, P);
    const say = near && hisSay(t);
    if (say) drawSaying(snap(b.x) - WORKER / 2, snap(b.y - Math.abs(b.ny) * b.r) - P * 2, say);
  }
  const ringA = headA + STUN_RING_BACK * P;
  let head = null;
  for (const p of pts) if (Math.abs(p.along - ringA) < P && (!head || Math.abs(p.along - ringA) < Math.abs(head.along - ringA))) head = p;
  drawStatuses(t / 1000);
  drawStunRing(t, head);
  if (pose && pose.ps != null) drawPowerMotes(pose.ps, pts);
  if (whole) drawMealCrosses(t, pts, bellyA);
  ctx.globalAlpha = 1;
  drawVeil(t, pts);
  drawBubbles(pts);
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

// --- the power-up and the brink, as drawn ---------------------------------------
// The motes (deep/phases.js, `powerMotes`): out of the water round the body,
// two cells square so a mote reads at the deep's scale, each crossing to its
// place on the hide in held steps with a dim smear a step behind and a cell
// of it halfway, then a spark there, ringed on its first frames. Purple, and
// every third the water's own grey flecks.
const FLECKS = DEEP_MOTE_TINTS.fleck.tones.map(i => GREYS[i]);
const BLOB = [[0, 0], [1, 0], [0, 1], [1, 1]];
const MOTE_OFF = 1 / COIL_SEGS;
const RING = [[2, 0], [-1, 0], [0, 2], [0, -1], [3, 1], [-2, 1], [1, 3], [1, -2]];
function drawPowerMotes(ps, pts) {
  const PU = POWERUP, cells = (x, y, tone, at) => {
    ctx.fillStyle = tone;
    for (const [ox, oy] of at) ctx.fillRect(snap(x) + ox * P, snap(y) + oy * P, P, P);
  };
  for (const q of powerMotes) {
    const a = ps - q.launch;
    if (a < 0 || a >= PU.cross + PU.spark) continue;
    let p = pts[0];
    for (const s of pts) if (Math.abs(kOf(s) - q.k) < Math.abs(kOf(p) - q.k)) p = s;
    if (Math.abs(kOf(p) - q.k) > MOTE_OFF) continue;       // its place on the hide is off the glass
    if (a >= PU.cross) {
      cells(p.x, p.y, PURPLES[WHITE], BLOB);
      if (a < PU.cross + PU.ring) cells(p.x, p.y, PURPLES[WHITE - 1], RING);
      continue;
    }
    const step = Math.floor(a / (PU.cross / PU.crossSteps)), f = step / PU.crossSteps, f0 = Math.max(0, step - 1) / PU.crossSteps;
    const at = g => ({ x: p.x + q.dx * P * (1 - g), y: p.y + q.dy * P * (1 - g) });
    if (step > 0) {
      const b = at(f0), h = at((f + f0) / 2);
      cells(b.x, b.y, PURPLES[5], BLOB);
      cells(h.x, h.y, PURPLES[7], BLOB);
    }
    const c = at(f);
    cells(c.x, c.y, q.grey ? FLECKS[q.i % FLECKS.length] : PURPLES[WHITE - (q.i % 2)], BLOB);
  }
}

// The brink's focus lines: rays in the water toward the coil, each
// starting a ragged way in from the glass's edge (1, measured to each edge
// on its own side, so a coil off the middle of the glass closes in evenly),
// closing in as `rIn` drops (deep/phases.js). Behind the floor, the stations
// and everything in front of them, and never over the serpent's bar.
export function drawFocusLines() {
  if (S.view !== 'deep') return;
  const pose = recoilPose(), L = pose && pose.lines;
  if (!L) return;
  const ND = NEARDEATH, { x0, y0, x1, y1 } = deepWindow();
  const left = Math.max(x0, deepX0()), right = Math.min(x1, deepX1()), bottom = Math.min(y1, deepFloor());
  // toward the middle of the stretch of coil on the glass, so a narrow glass
  // still closes in round it
  const ends = coilEnds(), a = Math.max(x0, ends.x0), b = Math.min(x1, ends.x1);
  const cx = Math.max(x0 + P, Math.min(x1 - P, b > a ? (a + b) / 2 : (x0 + x1) / 2));
  const cy = Math.max(y0 + P, Math.min(y1 - P, deepTop() + COIL_Y * DEEP_H));
  const z = barShown() ? barZone() : null;
  const zx0 = z ? S.camX + z.x / S.zoom : 0, zx1 = z ? S.camX + (z.x + z.w) / S.zoom : 0;
  const zy0 = z ? S.camY + z.y / S.zoom : 0, zy1 = z ? S.camY + (z.y + z.h) / S.zoom : 0;
  const ramp = L.purple ? PURPLES : GREYS, N = ND.lineRays;
  const lit = [[], []];
  for (let y = y0; y < bottom; y += P) {
    const my = y + P / 2, ny = (my - cy) / (my >= cy ? y1 - cy : cy - y0);
    for (let x = left; x < right; x += P) {
      if (z && x + P > zx0 && x < zx1 && y + P > zy0 && y < zy1) continue;
      const mx = x + P / 2, nx = (mx - cx) / (mx >= cx ? x1 - cx : cx - x0);
      const rr = Math.sqrt(nx * nx + ny * ny);
      if (rr < L.rIn) continue;
      const slot = (Math.atan2(ny, nx) / (2 * Math.PI) + 1) * N, idx = Math.floor(slot) % N;
      if (rr < L.rIn + unit(idx + 9) * ND.lineRagged) continue;
      if (slot - Math.floor(slot) < ND.lineW + ND.lineWRand * unit(idx)) lit[idx % 2].push(x, y);
    }
  }
  for (let k = 0; k < 2; k++) {
    ctx.fillStyle = ramp[L.tones[k]];
    const c = lit[k];
    for (let i = 0; i < c.length; i += 2) ctx.fillRect(c[i], c[i + 1], P, P);
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
// --- the constrict's orb --------------------------------------------------------------
// How much of the comb is lit, head first, 0..1: through the orb's warning,
// and held while the bolts fly.
let crestTips = [];
function combLit(t) {
  const p = part();
  if (p.m?.kind !== 'orb' || S.mechSkip && !orbOn()) return 0;
  if (p.part === 'warn') return p.k;
  return orbAge() < ORB_BOLT_S ? 1 : 0;
}
// A ring of the orb's dots round (x, y), every `every`th one drawn.
function orbRing(x, y, r, t, ink, every = 1) {
  const turn = Math.floor(t / 1000 * 8) / 8 * 0.6;
  const dots = Math.max(16, Math.round(r * 2 * Math.PI / P));
  for (let n = 0; n < dots; n += every) {
    const th = n / dots * Math.PI * 2 + turn;
    ctx.fillStyle = ink(n);
    ctx.fillRect(snap(x + Math.cos(th) * r - P / 2), snap(y + Math.sin(th) * r * 0.9 - P / 2), P, P);
  }
}
// The explosive resist's barrier: a row of floating cells under the coil's
// underside, following it, a column of cells to each cell of the deep it
// spans; the coming resist flickers it in before the fading's switch, as the
// hide's looks do. A bomb it soaked up flares the cells under it.
export function drawBarrier() {
  if (S.view !== 'deep' || !S.snatched || S.serpentFreed || breaking()) return;
  const t = now(), coming = resistNext();
  const shown = coming && Math.floor(t / 1000 * RESIST_FLICKER_HZ * 2) % 2 ? coming : resistNow();
  if (shown !== 'explosive') return;
  // the underside, lowest at each column of cells
  const under = new Map();
  for (let u = 0; u <= COIL_SEGS - 1; u += 0.25) {
    const p = coilLine(u, t), cx = Math.round(p.x / P), y = p.y + coilThick(u) / 2;
    if (!(under.get(cx) >= y)) under.set(cx, y);
  }
  for (const [cx, y] of under) {
    const k = ((cx % BARRIER_EVERY) + BARRIER_EVERY) % BARRIER_EVERY;
    if (k === BARRIER_EVERY - 1) continue;
    let ink = k === 1 ? PURPLES[WHITE] : PURPLES[WHITE - 2];
    for (const h of S.barrierHits) {
      const age = t - h.at;
      if (age < 0 || age >= BARRIER_FLARE_MS || Math.abs(Math.round(h.x / P) - cx) > BARRIER_FLARE_W) continue;
      ink = age < BARRIER_FLARE_MS * 0.4 ? GREYS[WHITE] : PURPLES[WHITE - 1];
    }
    ctx.fillStyle = ink;
    const by = snap(y) + BARRIER_GAP * P;
    ctx.fillRect(cx * P, by, P, P);
    if (k === 1) { ctx.fillRect(cx * P, by - P, P, P); ctx.fillRect(cx * P, by + P, P, P); }
  }
}

// The bolts off the lit comb to it, held two frames a shape; the orb turning
// round it, with what is left of it over its head; and its burst when it goes.
export function drawOrb() {
  if (S.view !== 'deep') return;
  const t = now(), o = orbOn();
  if (o) {
    const c = orbMiddle(o.st);
    if (!c) return;
    const age = orbAge(), st = S.stations.find(s => s.id === o.st);
    if (age < ORB_BOLT_S && crestTips.length) {
      const shape = Math.floor(age * 6);
      for (let n = 0; n < ORB_BOLTS; n++) {
        const from = crestTips[(n * 5 + shape * 3) % crestTips.length];
        let x = from.x, y = from.y;
        for (let s = 1; s <= 14; s++) {
          const u = s / 14;
          const nx = from.x + (c.x - from.x) * u + (unit(n * 31 + s + shape * 7) - 0.5) * P * 4 * (1 - u);
          const ny = from.y + (c.y - from.y) * u;
          ctx.fillStyle = s % 3 ? PURPLES[WHITE] : GREYS[WHITE];
          for (let q = 0; q <= 2; q++) ctx.fillRect(snap(x + (nx - x) * q / 2), snap(y + (ny - y) * q / 2), P, P);
          x = nx; y = ny;
        }
      }
    }
    // the orb, closing over the first beat of it, turning; while it rises
    // fast, fainter rings trailing a step apart under it
    const r = Math.min(ORB_R, 1 + age * 20) * P;
    if (orbRising(st)) {
      for (let g = ORB_GHOSTS; g >= 1; g--) orbRing(c.x, c.y + g * ORB_STEP * P, r, t, () => PURPLES[WHITE - 3 - 2 * g], 2);
    }
    orbRing(c.x, c.y, r, t, n => (n % 4 === 0 ? PURPLES[WHITE] : PURPLES[WHITE - 2]));
    // what is left of it, over its head
    const bw = ORB_R * 2 + 2, by = snap(c.y - r - P * 3), bx = snap(c.x) - Math.floor(bw / 2) * P;
    for (let i = 0; i < bw; i++) {
      ctx.fillStyle = i < Math.round(bw * o.hp / o.max) ? PURPLES[WHITE - 1] : PURPLES[WHITE - 7];
      ctx.fillRect(bx + i * P, by, P, P);
    }
    // and an arrow over that, bobbing, pointing at it: it can be clicked
    const bob = Math.floor(t / 1000 / ORB_ARROW_S) % 2 ? ORB_ARROW_UP : 0, ay = by - (5 + bob) * P, ax = snap(c.x) - 2 * P;
    ctx.fillStyle = GREYS[WHITE];
    for (const [dx, dy] of [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [3, 1], [2, 2]]) ctx.fillRect(ax + dx * P, ay + dy * P, P, P);
  }
  const b = S.orbBurst;
  if (!b) return;
  const st = S.stations.find(s => s.id === b.st), w = orbMiddle(b.st);
  if (!w) return;
  // the burst where the orb let go, not on the fighter sinking out of it
  if (t - b.at < ORB_BURST_S * 1000) {
    const c = { x: w.x, y: w.y - ((b.from || 0) - orbLift(st)) * P };
    const k = (t - b.at) / 1000 / ORB_BURST_S, r = (ORB_R + Math.floor(k * 6) * 1.5) * P;
    for (let n = 0; n < 16; n++) {
      const th = n / 16 * Math.PI * 2;
      ctx.fillStyle = PURPLES[WHITE - 1 - Math.min(6, Math.floor(k * 7))];
      ctx.fillRect(snap(c.x + Math.cos(th) * r - P / 2), snap(c.y + Math.sin(th) * r * 0.9 - P / 2), P, P);
    }
  }
  // sinking home fast: lines trailing over its head
  if (orbSinking(st)) {
    const top = snap(w.y - WORKER / 2);
    ctx.fillStyle = GREYS[WHITE - 4];
    for (const dx of [-WORKER / 2, 0, WORKER / 2 - P]) {
      const len = dx ? 2 : 3;
      for (let i = 1; i <= len; i++) ctx.fillRect(snap(w.x + dx), top - (i + 1) * P, P, P);
    }
  }
}

// --- the kill ---------------------------------------------------------------------
// Whether the hide at a laid point is whole: not yet come apart (the tail goes
// first), or gathered again (the head comes first).
// The snout's points lie before the head's first segment: they count as the head.
const kOf = p => Math.max(0, p.u / (COIL_SEGS - 1));
function wholeAt(p) {
  const back = reformK();
  if (back != null) return kOf(p) < back || back >= 1;
  const apart = apartK();
  return apart <= 0 || (apart < 1 && kOf(p) < 1 - apart);
}
// The motes: off the hide as it comes apart, up and dimming; and drawing in
// over where it is about to gather.
function drawKillMotes(t, laid) {
  const back = reformK(), apart = apartK();
  if (back == null && !(apart > 0)) return;
  for (let i = 0; i < laid.length; i += 3) {
    const p = laid[i], k = kOf(p), seed = Math.round(p.along / P);
    if (back != null) {
      const near = (k - back) / 0.3;
      if (back >= 1 || near < 0 || near > 1) continue;
      const x = snap(p.x + (unit(seed) - 0.5) * P * 10 * near), y = snap(p.y - p.r - near * P * 8);
      ctx.fillStyle = PURPLES[WHITE - 1 - Math.floor(near * 3)];
      ctx.fillRect(x, y, P, P);
      continue;
    }
    // on the kill's own clock, so they run out after the coming apart has
    const age = killA() - (KILL.last + KILL.limp + (1 - k) * KILL.apart);
    if (age < 0 || age > KILL_MOTE_S) continue;
    const up = Math.floor(age * KILL_MOTE_RISE);
    for (let n = 0; n < 2; n++) {
      const x = snap(p.x + (unit(seed * 3 + n) - 0.5) * P * 6 * (age + 0.3));
      const y = snap(p.y - p.r * unit(seed + n)) - (up + n * 2) * P;
      ctx.fillStyle = PURPLES[WHITE - 1 - Math.min(6, Math.floor(age / KILL_MOTE_S * 7))];
      ctx.fillRect(x, y, P, P);
    }
  }
}
// Him, let go where the belly was and dropping to the floor, then out and
// walking to her, and hopping when he gets there.
export function drawFreed() {
  if (S.view !== 'deep') return;
  const b = freedBody();
  if (b) { drawBody(snap(b.x), snap(b.y)); return; }
  const a = killA(), free = killFreeA();
  if (a == null || a < free) return;
  const at = bellyAt(now()), floor = deepFloor() - WORKER;
  const k = Math.min(1, Math.ceil((a - free) / KILL_DROP_S * KILL_DROP_STEPS) / KILL_DROP_STEPS);
  drawBody(snap(at.x) - WORKER / 2, snap(at.y - WORKER / 2 + (floor - at.y + WORKER / 2) * k));
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
  // The neck comes up at the head's far end (below), so that is where the
  // surface heaves and breaks.
  const neckX = headLeft() + SNATCH_HEAD_W - SNATCH_NECK_W;
  const mx = neckX + SNATCH_NECK_W / 2;
  const surface = snap(abyssLine() + swellAt(Math.round(mx / P), t));
  const [EDGE, HIDE, LATTICE, BROW] = SNATCH_HIDE;
  // Before it breaks the surface, the surface heaves over it: a hump of its
  // hide a neck wide, up a cell and back in held steps.
  if (sn.phase === 'heave') {
    const k = Math.min(SNATCH_HEAVE_STEPS - 1, Math.floor((t - sn.at) * sn.hurry / SNATCH_HEAVE_MS * SNATCH_HEAVE_STEPS));
    const up = 1 + (k % 2);
    const x0 = neckX - P * 2, cols = SNATCH_NECK_W / P + 4;
    for (let c = 0; c < cols; c++) {
      const h = c === 0 || c === cols - 1 ? up - 1 : up;
      for (let r = 1; r <= h; r++) {
        ctx.fillStyle = r === h ? EDGE : HIDE;
        ctx.fillRect(x0 + c * P, surface - r * P, P, P);
      }
    }
    ctx.fillStyle = '#000';
    return;
  }
  if (sn.headY >= surface) return;
  const k = Math.max(0, Math.min(1, (surface - sn.headY) / SNATCH_RISE));   // how far up
  // It comes straight up under him, snout toward the plank, its mouth's
  // middle on the take (snatch.js, `headLeft`, `jawAt`) and the neck at the
  // head's far end; the jaws part as it reaches him and shut on him. Before
  // it has him it sways; with him, it holds still, so he is where the take
  // left him.
  const open = sn.carried ? 0 : jawPose(k * 1.6 - 0.6);
  const sway = sn.carried ? 0 : Math.round(Math.sin(t / 700)) * P;
  const cols = SNATCH_HEAD_W / P, rows = SNATCH_HEAD_H / P, mid = Math.floor(rows / 2), neckC = SNATCH_NECK_W / P;
  const hy = snap(sn.headY), neckTop = hy + (mid + 1) * P;
  const hx = headLeft() + sway;
  const baseX = hx + SNATCH_HEAD_W - SNATCH_NECK_W;
  const cell = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); };
  ctx.save();
  ctx.beginPath();
  ctx.rect(hx - WORKER * 2, hy - P * 8, SNATCH_HEAD_W + WORKER * 4, surface - hy + P * 8);
  ctx.clip();
  // The neck, row by row, the crest down its back.
  for (let y = neckTop; y < surface + P; y += P) {
    const x0 = baseX;
    for (let c = 0; c < neckC; c++)
      cell(x0 + c * P, y, c === 0 || c === neckC - 1 ? EDGE : ((c + y / P) % 3 ? HIDE : LATTICE));
    if ((y / P) % 2 === 0) cell(x0 + neckC * P, y, SNATCH_CREST[(y / P) % 4 ? 0 : 1]);
  }
  // The head: a snout toward the plank, the jaws hinged behind the eye, each
  // half pushed off the mouth's line by the gap, teeth on their edges.
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
  if (sn.carried) { const j = jawAt(sn.headY); drawBody(j.x, j.y); }
  ctx.restore();
  // the surface broken either side of the neck
  ctx.fillStyle = '#fff';
  ctx.fillRect(baseX - P * 2, surface, P, P);
  ctx.fillRect(baseX + SNATCH_NECK_W + P, surface, P, P);
  ctx.fillStyle = '#000';
}
