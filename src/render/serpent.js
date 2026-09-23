// The serpent: its coil in the deep, stage by stage, with the one it took
// held in its belly; and its head and neck coming up out of the drowned pit
// in the yard, for the snatch.
//
// In the deep it is drawn in the deep's inverted palette (render/deep.js,
// `seen`): white scales on the black, its wards in the abyss's purple. The
// picture is the reading: the wound is a gap in the coil at the belly that
// opens as it deepens, and he is seen through it; there is no bar.

import { now } from '../clock.js';
import { P, WORKER, COIL_SEGS, COIL_THICK, SPLIT_LENGTHS, SERPENT_WOUND,
         COIL_TAIL, HEAD_SEGS, HEAD_PLUS, WARD_MS, WARD_AT, SPLIT_GAP, SPLIT_WRITHE, SPLIT_WRITHE_MS,
         FADE_SEEN, BEAM_LIGHTS, WOUND_GAP, BOUND_BANDS, SIGIL_RX,
         SNATCH_HEAD_W, SNATCH_HEAD_H, SNATCH_NECK_W } from '../config.js';
import { S } from '../state.js';
import { coilAt, bellyAt, mouthX } from '../deep/place.js';
import { woundK } from '../deep/serpent.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, deepWindow } from './deep.js';
import { drawBody } from './crew.js';
import { swellAt } from './cores.js';

const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;
const snap = v => Math.round(v / P) * P;
const WHITE = GREYS.length - 1;

// The wound as a share of the stage's depth: the serpent's own answer.
const woundNow = woundK;

// How thick the body is at `k` of the way from head to tail: the head a
// little fuller, the tail thinning over its last stretch.
function thickAt(i, k) {
  if (i < HEAD_SEGS) return COIL_THICK + HEAD_PLUS;
  const tail = Math.max(0, (k - 0.6) / 0.4);
  return COIL_THICK * (1 - (1 - COIL_TAIL) * tail * tail);
}

// Per stage, one question a cell asks: what tone is it seen in. Everything
// else about a cell is the lattice's.
export function drawSerpent() {
  const t = now();
  const stage = S.serpentStage;
  const { x0, x1 } = deepWindow();
  const wk = stage >= 4 ? 0 : woundNow();
  const belly = bellyAt(t);
  const gap = stage >= 4 ? 0 : Math.round(wk * WOUND_GAP / P) * P;
  const gapL = snap(belly.x) - gap / 2, gapR = gapL + gap;
  // Which segments a beam is lighting: stage four's coil is seen only there.
  const lit = new Set();
  for (const b of S.beams) for (let d = -BEAM_LIGHTS; d <= BEAM_LIGHTS; d++) lit.add(b.seg + d);
  const segLen = (COIL_SEGS - 1) / SPLIT_LENGTHS;
  const wardPh = t / WARD_MS * Math.PI * 2;

  for (let i = 0; i < COIL_SEGS - 1; i++) {
    const p = coilAt(i, t), q = coilAt(i + 1, t);
    if (q.x < x0 - P * 4 || p.x > x1 + P * 4) continue;
    const run = Math.max(P, q.x - p.x);
    for (let x = p.x; x < q.x; x += P) {
      const fr = (x - p.x) / run;
      const u = i + fr, k = u / (COIL_SEGS - 1);
      let yc = p.y + (q.y - p.y) * fr;
      // Splitting: the coil in lengths with open water between them, each
      // throwing itself about on its own phase.
      if (stage === 2) {
        const L = Math.min(SPLIT_LENGTHS - 1, Math.floor(u / segLen));
        const within = u - L * segLen;
        const px = run * within, left = run * (segLen - within);
        if ((L > 0 && px < SPLIT_GAP / 2) || (L < SPLIT_LENGTHS - 1 && left < SPLIT_GAP / 2)) continue;
        yc += Math.sin(t / SPLIT_WRITHE_MS * Math.PI * 2 + L * 2.1) * Math.sin(Math.PI * within / segLen) * SPLIT_WRITHE;
      }
      // The wound: open water at the belly, as wide as it is deep.
      if (gap && x >= gapL && x < gapR) continue;
      const n = Math.max(1, Math.round(thickAt(i, k) / P));
      const top = snap(yc) - Math.floor(n / 2) * P;
      const c = x / P;
      const bound = boundBand(x);
      for (let rr = 0; rr < n; rr++) {
        const y = top + rr * P;
        let rung = rr === n - 1 ? WHITE - 1 : (c + (rr % 2) * 2) % 4 === 0 ? WHITE - 2 : WHITE;
        let ramp = GREYS;
        if (stage === 1 && Math.sin(c * 0.45 + rr * 1.1 - wardPh) > WARD_AT) {
          ramp = PURPLES; rung = WHITE - (seeth(c, rr) % 3);
        }
        if (stage === 3 && !lit.has(i)) rung = Math.max(1, Math.round(rung * FADE_SEEN));
        if (bound) { ramp = PURPLES; rung = WHITE; }
        ctx.fillStyle = ramp[rung];
        ctx.fillRect(x, y, P, P);
      }
      // a sigil's band stands a cell proud of the body on each side
      if (bound) {
        ctx.fillStyle = PURPLES[WHITE - 1];
        ctx.fillRect(x, top - P, P, P);
        ctx.fillRect(x, top + n * P, P, P);
      }
      if (i === 0 && x === p.x) drawHead(p.x, top, n);
    }
  }
  if (!S.serpentFreed && stage < 4) drawHeld(belly, wk, gapL, gap);
  ctx.fillStyle = '#000';
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

// The head, at the coil's near end: a snout of shortening columns in front
// of it, the jaw's line through the middle, and an eye.
function drawHead(x, top, n) {
  for (let s = 1; s <= 3; s++) {
    const m = Math.max(1, n - s * 2);
    const t0 = top + Math.floor((n - m) / 2) * P;
    for (let r = 0; r < m; r++) {
      ctx.fillStyle = GREYS[r === m - 1 ? WHITE - 1 : WHITE];
      ctx.fillRect(x - s * P, t0 + r * P, P, P);
    }
  }
  const mid = top + Math.floor(n / 2) * P;
  ctx.fillStyle = GREYS[0];
  ctx.fillRect(x - P * 3, mid, P * 3, P);              // the line of the jaw
  ctx.fillRect(x, top + P, P, P);                      // the eye
}

// The one it took, in its belly: a square silhouette seen through the white
// of the coil, darker the deeper the wound, and whole through the gap once
// the gap is open.
function drawHeld(belly, wk, gapL, gap) {
  const x = snap(belly.x) - WORKER / 2, y = snap(belly.y) - WORKER / 2;
  ctx.fillStyle = GREYS[Math.max(2, Math.round(8 - 6 * wk))];
  ctx.fillRect(x, y, WORKER, WORKER);
  if (!gap) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(gapL, y - P, gap, WORKER + P * 2);
  ctx.clip();
  drawBody(x, y);
  ctx.restore();
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
