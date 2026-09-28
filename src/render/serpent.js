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
// statuses, over the whole of it (docs/wave-party.md, "The picture").

import { now } from '../clock.js';
import { P, WORKER, COIL_SEGS, COIL_HEAD, COIL_GIRTH, WARD_MS, WARD_AT,
         WOUND_GAP, BELLY_AT, DENT_S, DENT_RISE_S, DENT_DECAY, DENT_W, DENT_DEPTH,
         BLEED_DRIPS, BLEED_DRIP_S, HELD_EVERY, HELD_BRIGHT_RUNG, EXPOSED_EVERY, EXPOSED_LIFT_HZ,
         CRACK_REACH, COIL_STEP, SNOUT, CREST_LEN, CREST_H, BELLY_BULGE, BELLY_LEN, RIB_EVERY,
         SNATCH_HEAD_W, SNATCH_HEAD_H, SNATCH_NECK_W, CHIP_R, CHIP_HEAL_S, CHIP_RAGGED,
         STUN_RING, STUN_RING_UP, STUN_RING_BACK, STUN_RING_STEP_MS, STUN_RING_TONES,
         STUN_RING_DIM } from '../config.js';
import { S } from '../state.js';
import { coilLine, coilThick, mouthX, deepFloor } from '../deep/place.js';
import { woundK } from '../deep/serpent.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, deepWindow } from './deep.js';
import { drawBody } from './crew.js';
import { swellAt } from './cores.js';
import { cellImage } from './cellimage.js';
import { dentsNow, hexerRung } from './arms.js';

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

// The coil answers a blow (the kit growth page's sauce): the hide round the
// hit is pushed up a beat and springs back, over a few columns either side,
// deeper and wider for a bigger blow. It never overshoots, so nothing
// shudders, even under a stun. Cells, from the fighters' contacts
// (render/arms.js); drawing only, the sim's coil does not move.
function dentAt(cx, t, dents) {
  let off = 0;
  for (const d of dents) {
    const u = t - d.t0;
    if (u < 0 || u > DENT_S) continue;
    const w = DENT_W[0] + DENT_W[1] * d.k, fall = Math.exp(-((cx - d.x) ** 2) / (2 * w * w));
    off -= (DENT_DEPTH[0] + DENT_DEPTH[1] * d.k) * fall * (u < DENT_RISE_S ? u / DENT_RISE_S : Math.exp(-(u - DENT_RISE_S) * DENT_DECAY));
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

export function drawSerpent() {
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
  // Weakened: the hide goes dull, a tone down (the class bench's painter).
  const dull = has('weakened');
  const wardPh = t / WARD_MS * Math.PI * 2;

  // The belly swells round him while he is in it.
  if (held) for (const p of pts) {
    const d = Math.abs(p.along - bellyA);
    if (d < BELLY_LEN) p.r += BELLY_BULGE * Math.sqrt(1 - (d / BELLY_LEN) ** 2);
  }

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
    const dist = best[i], r = p.r;
    const along = p.along + dx * p.tx + dy * p.ty, across = dx * p.nx + dy * p.ny;
    const da = along - bellyA;
    if (gap && Math.abs(da) < gap / 2) continue;                 // the wound: open water
    if (dist > r) continue;
    const aI = Math.round(along / P), cI = Math.round(across / P);
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
    if (stage === 1 && Math.sin(aI * 0.45 + cI * 1.1 - wardPh) > WARD_AT) {
      ramp = PURPLES; rung = WHITE - (seeth(aI, cI) % 3);
    }
    if (dull && ramp === GREYS && rung > WHITE - 3) rung -= 2;
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
    coil.put(i, ramp[rung]);
  }
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
  ctx.fillStyle = '#000';
}

// --- the statuses on the whole serpent ------------------------------------------
// The class bench's painters (docs/mocks/classes), laid over the coil as
// drawn: Bleeding drips off the belly, Held clasps it in the circle's bands,
// Exposed lifts a scale every few columns; Weakened is the dull hide above.
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
    // the bands, each tethered to the floor by a thread of cells running down
    const bright = hexerRung() >= HELD_BRIGHT_RUNG, floor = Math.floor(deepFloor() / P);
    for (let i = 5; i < n - 2; i += HELD_EVERY) {
      if (!on(i)) continue;
      const c = hide.c0 + i, tp = hide.top[i], bt = hide.bot[i];
      for (let r = tp - 1; r <= bt + 1; r++) put(c, r, r === tp - 1 || r === bt + 1 ? (bright ? GREYS[WHITE] : PURPLES[11]) : PURPLES[9]);
      for (const d of [-1, 1]) { put(c + d, tp - 1, PURPLES[8]); put(c + d, bt + 1, PURPLES[8]); }
      for (let r = bt + 3 + Math.floor(t * 4) % 3; r < floor - 1; r += 3) put(c, r, PURPLES[6]);
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
