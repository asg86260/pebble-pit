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
// and a stunned coil shuddering a cell (DESIGN.md, "Blows land").

import { now } from '../clock.js';
import { P, WORKER, COIL_SEGS, COIL_HEAD, COIL_GIRTH, WARD_MS, WARD_AT,
         FADE_SEEN, BEAM_LIGHTS, WOUND_GAP, BOUND_BANDS, SIGIL_RX, BELLY_AT,
         CRACK_REACH, COIL_STEP, SNOUT, CREST_LEN, CREST_H, BELLY_BULGE, BELLY_LEN, RIB_EVERY,
         SNATCH_HEAD_W, SNATCH_HEAD_H, SNATCH_NECK_W, CHIP_R, CHIP_HEAL_S, CHIP_RAGGED,
         STUN_SHAKE, STUN_SHAKE_MS } from '../config.js';
import { S } from '../state.js';
import { coilLine, coilThick, mouthX } from '../deep/place.js';
import { woundK } from '../deep/serpent.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, deepWindow } from './deep.js';
import { drawBody } from './crew.js';
import { swellAt } from './cores.js';
import { cellImage } from './cellimage.js';

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

// A length of coil over a sigil is held: bands of the circle's purple across
// it, BOUND_BANDS of them over the sigil's width.
function boundBand(x) {
  for (const s of S.sigils) {
    const d = x - snap(s.x);
    if (Math.abs(d) > SIGIL_RX / 2) continue;
    const step = Math.max(P, Math.round(SIGIL_RX / BOUND_BANDS / P) * P);
    if (((d + SIGIL_RX) / P) % (step / P) === 0) return true;
  }
  return false;
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
  return { pts: pts.filter(p => p.x > x0 - reach && p.x < x1 + reach), alongAt };
}

// A stunned coil holds still but for this: a cell down, back, a cell up,
// back, over and over.
const SHUDDER = [0, 1, 0, -1];
const shudder = t => S.serpentStun > 0 ? SHUDDER[Math.floor(t / STUN_SHAKE_MS) % SHUDDER.length] * STUN_SHAKE : 0;

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

export function drawSerpent() {
  const t = now();
  const stage = S.serpentStage;
  const { x0, x1 } = deepWindow();
  const held = !S.serpentFreed && stage < 4;
  const wk = stage >= 4 ? 0 : woundK();
  const { pts, alongAt } = lay(t, x0, x1);
  if (!pts.length) return;
  ctx.save();
  ctx.translate(0, shudder(t));
  const bit = bites(t, alongAt);
  const bellyA = alongAt(BELLY_AT * (COIL_SEGS - 1)), headA = alongAt(0);
  const gap = held ? Math.round(wk * WOUND_GAP / P) * P : 0;
  const reach = wk * CRACK_REACH;
  // Which segments a beam is lighting: stage four's coil is seen only there.
  const lit = new Set();
  for (const b of S.beams) for (let d = -BEAM_LIGHTS; d <= BEAM_LIGHTS; d++) lit.add(b.seg + d);
  const wardPh = t / WARD_MS * Math.PI * 2;

  // The belly swells round him while he is in it.
  if (held) for (const p of pts) {
    const d = Math.abs(p.along - bellyA);
    if (d < BELLY_LEN) p.r += BELLY_BULGE * Math.sqrt(1 - (d / BELLY_LEN) ** 2);
  }

  // Each cell takes the sample nearest it. A cell a cell proud of the body
  // is kept too, for a sigil's band. On flat arrays over the coil's box, and
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
  for (let i = 0; i < own.length; i++) {
    if (own[i] < 0) continue;
    const p = pts[own[i]];
    const x = minX + (i % cols) * P, y = minY + Math.floor(i / cols) * P;
    const dx = x + P / 2 - p.x, dy = y + P / 2 - p.y;
    const dist = best[i], r = p.r;
    const along = p.along + dx * p.tx + dy * p.ty, across = dx * p.nx + dy * p.ny;
    const da = along - bellyA;
    if (gap && Math.abs(da) < gap / 2) continue;                 // the wound: open water
    if (dist > r) {
      // a sigil's band stands a cell proud of the body on each side
      if (boundBand(x)) coil.put(i, PURPLES[WHITE - 1]);
      continue;
    }
    const aI = Math.round(along / P), cI = Math.round(across / P);
    if (bit.length && bitten(bit, along, across, r, aI, cI)) continue;   // a bite: open water
    // The cage: inside the swell, pale, crossed by dark ribs he is seen
    // between. Pale because a body in the deep is dark with a light edge,
    // and on a dark inside he was a hole in a hole.
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
    if (stage === 1 && Math.sin(aI * 0.45 + cI * 1.1 - wardPh) > WARD_AT) {
      ramp = PURPLES; rung = WHITE - (seeth(aI, cI) % 3);
    }
    if (stage === 3 && !lit.has(Math.round(p.u))) rung = Math.max(1, Math.round(rung * FADE_SEEN));
    // The cracks: two, wandering across the body, out from the belly as far
    // as the wound is deep; near black at the wound, greyer at their tips.
    if (reach > 0 && Math.abs(da) < reach) {
      const w1 = Math.sin(along / (P * 2.3)) * r * 0.5;
      const w2 = Math.sin(along / (P * 3.1) + 2) * r * 0.55;
      if (Math.abs(across - w1) < P * 0.6 || (Math.abs(across - w2) < P * 0.6 && seeth(aI, 7) % 3)) {
        ramp = GREYS; rung = 1 + Math.round(3 * Math.abs(da) / reach);
      }
    }
    // The snout's jaw, a line through it, and the eye behind it.
    if (along < headA && Math.abs(across) < P / 2) { ramp = GREYS; rung = 0; }
    if (Math.abs(along - headA - P) < P / 2 && Math.abs(across + r - P * 2) < P / 2) { ramp = GREYS; rung = 0; }
    if (boundBand(x)) { ramp = PURPLES; rung = WHITE; }
    coil.put(i, ramp[rung]);
  }
  coil.draw(ctx, minX, minY);
  // The crest: a fin of the abyss's purple standing up off the head and
  // running back along the neck, spikes a cell apart, every other one a cell
  // taller, shortening to nothing at its end. Stood on the body's top edge
  // across the body, so it rides the bends with the rest.
  const crestFrom = headA - SNOUT / 2, crestTo = headA + CREST_LEN;
  const lit3 = !(stage === 3);
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
      ctx.fillStyle = PURPLES[Math.max(1, (lit3 || lit.has(Math.round(p.u)) ? WHITE - 1 - (j % 2) : Math.round((WHITE - 1) * FADE_SEEN)))];
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
  ctx.restore();
  ctx.fillStyle = '#000';
}

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
  // the scales of it, in the yard's greys: the same lattice the coil wears
  const scale = (c, r) => ((c + (r % 2) * 2) % 4 === 0 ? '#3a3a3a' : '#000');
  const sway = Math.round(Math.sin(t / 700)) * P;
  const cols = SNATCH_HEAD_W / P, rows = SNATCH_HEAD_H / P, mid = Math.floor(rows / 2);
  // The head stands on the neck and reaches out over the plank, toward
  // whoever is at the edge of it.
  const nx = snap(mx - SNATCH_NECK_W / 2) + sway;
  const hx = nx + SNATCH_NECK_W - SNATCH_HEAD_W, hy = snap(sn.headY);
  ctx.save();
  ctx.beginPath();
  ctx.rect(hx - WORKER * 2, hy - WORKER * 2, SNATCH_HEAD_W + WORKER * 4, surface - hy + WORKER * 2);
  ctx.clip();
  for (let y = hy + SNATCH_HEAD_H; y < surface + P; y += P) {
    for (let x = nx; x < nx + SNATCH_NECK_W; x += P) {
      ctx.fillStyle = scale(x / P, y / P);
      ctx.fillRect(x, y, P, P);
    }
  }
  // The jaws: a wedge open at the snout, running back into the head, shut
  // to a line round him once it has him.
  const open = sn.carried ? 0.5 : 2.5, depth = cols * 0.55;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c < depth && Math.abs(r - mid) < open * (1 - c / depth) + 0.5) continue;
      if ((r === 0 || r === rows - 1) && (c === 0 || c === cols - 1)) continue;   // rounded
      ctx.fillStyle = scale(c, r);
      ctx.fillRect(hx + c * P, hy + r * P, P, P);
    }
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(hx + Math.round(cols * 0.62) * P, hy + P * 2, P, P);          // the eye
  if (!sn.carried) {
    ctx.fillRect(hx + P, hy + (mid - 2) * P, P, P);                          // and its fangs
    ctx.fillRect(hx + P, hy + (mid + 2) * P, P, P);
  }
  if (sn.carried) drawBody(hx - WORKER / 2, hy + mid * P + P / 2 - WORKER / 2);
  ctx.restore();
  // the surface broken either side of the neck
  ctx.fillStyle = '#fff';
  ctx.fillRect(nx - P * 2, surface, P, P);
  ctx.fillRect(nx + SNATCH_NECK_W + P, surface, P, P);
  ctx.fillStyle = '#000';
}
