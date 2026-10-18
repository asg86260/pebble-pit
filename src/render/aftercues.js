// Act 3's hand work, cued (after/gestures.js): the ghost hand acting each
// station's motion out, the speed gauge over a station being worked, and a
// crit's held star and figure. One layer of render.js's LAYERS, over the
// place, drawn only with the camera up there.
//
// The hand and its path are drawn at their own pixel, finer than a cell
// (GESTURE_CUE_DOT): they are a pointer over the place, not more of its
// material, as the mock drew them. The gauge is cells on the grid; a mark is
// the fight numbers' register, a figure over the picture. Everything fades
// by opacity, nothing flashes and nothing shakes; the crit is a held star.

import { S } from '../state.js';
import { P, GREY, GESTURE_CUE_ALPHA, GESTURE_CUE_DOT, GESTURE_CUE_LOOP_S, GESTURE_CUE_TAP_S, GESTURE_GAUGE_CELLS,
         GESTURE_GAUGE_RISE, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S, GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S,
         GESTURE_SAW_AMP, GESTURE_STUMP_MAX, GESTURE_BAR_DRAG, GESTURE_LOAD_FADE_S } from '../config.js';
import { ctx } from './ctx.js';
import { gestureView, partsOf, lowestBubble, stumpWobble } from '../after/gestures.js';
import { trees, standing, stumped } from '../after/grove.js';

const D = GESTURE_CUE_DOT;
const snap = v => Math.round(v / P) * P;
const dsnap = v => Math.round(v / D) * D;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(snap(x), snap(y), P, P); };
const dot = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(dsnap(x) - D / 2, dsnap(y) - D / 2, D, D); };
const inView = (x, w) => x + w >= S.camX && x <= S.camX + S.viewW;
const now = () => S.after.t;

// The ghost hand: a pointing mitten (its point the fingertip) and a fist (its
// point the middle of the grip). '#' its outline, 'o' its fill.
const HAND = {
  point: { at: [3.5, 0], m: ['...##.....', '..#oo#....', '..#oo#....', '..#oo#....', '..#oo####.', '.##oooooo#',
                             '#o#oooooo#', '#oooooooo#', '.#ooooooo#', '..#oooooo#', '...######.'] },
  grab:  { at: [5, 3.5], m: ['.##.##.##.', '#oo#oo#oo#', '#oooooooo#', '#oooooooo#', '#oooooooo#', '.#ooooooo#', '..#######.'] }
};
function hand(x, y, pose) {
  const h = HAND[pose], x0 = dsnap(x - h.at[0] * D), y0 = dsnap(y - h.at[1] * D);
  for (let j = 0; j < h.m.length; j++) for (let i = 0; i < h.m[j].length; i++) {
    const ch = h.m[j][i];
    if (ch === '.') continue;
    ctx.fillStyle = GREY[ch === '#' ? 8 : 1];
    ctx.fillRect(x0 + i * D, y0 + j * D, D, D);
  }
}
// The motion's path: a dot a cell, and a chevron for its way.
const dots = pts => { for (const [x, y] of pts) dot(x, y, 5); };
function chevron(x, y, dx, dy) {
  dot(x, y, 5);
  for (let s = 1; s <= 2; s++) {
    dot(x - (dx + dy) * s * D, y - (dy - dx) * s * D, 5);
    dot(x - (dx - dy) * s * D, y - (dy + dx) * s * D, 5);
  }
}
const ring = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, k) => [cx + Math.cos(k / n * 2 * Math.PI) * rx, cy + Math.sin(k / n * 2 * Math.PI) * ry]);
const loop = () => (now() % GESTURE_CUE_LOOP_S) / GESTURE_CUE_LOOP_S;
const tapDown = () => (now() % GESTURE_CUE_TAP_S) < GESTURE_CUE_TAP_S * 0.4;

// Each station's motion acted out: where the hand is now and the path it
// follows. Null where there is nothing to show it on.
const CUES = {
  pedestal() {
    const b = lowestBubble();
    if (b) return () => { hand(b.x + b.w / 2, b.y + b.h + (tapDown() ? D * 2 : 0), 'point'); };
    const box = partsOf('pedestal').box;
    return () => { hand(box.x + box.w / 2, box.y + P + (tapDown() ? D * 2 : 0), 'point'); };
  },
  tree(r) {
    const i = r.i != null && standing(trees()[r.i]) ? r.i : trees().findIndex(standing);
    if (i < 0) return null;
    const s = partsOf('tree', i).saw;
    return () => {
      const pts = [];
      for (let x = -GESTURE_SAW_AMP; x <= GESTURE_SAW_AMP; x += P) pts.push([s.x + x, s.y + P]);
      dots(pts);
      chevron(s.x + GESTURE_SAW_AMP + P, s.y + P, 1, 0);
      chevron(s.x - GESTURE_SAW_AMP - P, s.y + P, -1, 0);
      hand(snap(s.x + Math.sin(loop() * 2 * Math.PI) * GESTURE_SAW_AMP), s.y, 'grab');
    };
  },
  stump(r) {
    const i = r.i != null && stumped(trees()[r.i]) ? r.i : trees().findIndex(stumped);
    if (i < 0) return null;
    const a = partsOf('stump', i).at;
    return () => {
      const k = loop(), up = (k < 0.6 ? k / 0.6 : 1) * GESTURE_STUMP_MAX;
      const pts = [];
      for (let y = 0; y <= GESTURE_STUMP_MAX; y += P) pts.push([a.x + P * 2, a.y - y]);
      dots(pts);
      chevron(a.x + P * 2, a.y - GESTURE_STUMP_MAX - P, 0, -1);
      hand(a.x, snap(a.y - up), 'grab');
    };
  },
  mill() {
    const w = partsOf('mill').wheel;
    return () => {
      dots(ring(w.x, w.y, w.r + P, w.r + P, 16));
      const a = loop() * 2 * Math.PI;
      hand(w.x + Math.cos(a) * (w.r + P), w.y + Math.sin(a) * (w.r + P), 'grab');
    };
  },
  chipper() {
    const b = partsOf('chipper').box;
    // Pressed and held: down, held there most of the loop, up.
    return () => { const k = loop(); hand(b.x + b.w / 2, b.y + P + (k > 0.15 && k < 0.85 ? D * 2 : 0), 'point'); };
  },
  papermill() {
    const v = partsOf('papermill').vat;
    return () => {
      dots(ring(v.x, v.y, v.rx, v.ry, 18));
      const a = loop() * 2 * Math.PI;
      hand(v.x + Math.cos(a) * v.rx, v.y + Math.sin(a) * v.ry, 'grab');
    };
  },
  workshop() {
    const b = partsOf('workshop').box;
    return () => { hand(b.x + b.w / 2, b.y + P + (tapDown() ? D * 2 : 0), 'point'); };
  },
  press() {
    const bar = partsOf('press').bar, x = bar.x + bar.len;
    return () => {
      const pts = [];
      for (let y = 0; y <= GESTURE_BAR_DRAG; y += P) pts.push([x + P, bar.y + y]);
      dots(pts);
      chevron(x + P, bar.y + GESTURE_BAR_DRAG + P, 0, 1);
      const k = loop();
      hand(x, snap(bar.y + Math.min(1, k / 0.6) * GESTURE_BAR_DRAG), 'grab');
    };
  },
  heap() {
    const p = partsOf('heap'), y = p.box.y + p.box.h - P * 2, x0 = p.box.x + P;
    return () => {
      const pts = [];
      for (let x = x0; x < p.edge; x += P) pts.push([x, y + P]);
      dots(pts);
      chevron(p.edge + P, y + P, 1, 0);
      hand(snap(x0 + Math.min(1, loop() / 0.7) * (p.edge - x0)), y, 'grab');
    };
  }
};
// Where a station's gauge stands: its left end and its row, over the roof.
function gaugeAt(r) {
  const half = GESTURE_GAUGE_CELLS * P / 2;
  if (r.key === 'tree') { const i = r.i != null ? r.i : trees().findIndex(standing); if (i < 0) return null; const b = partsOf('tree', i).box; return { x: snap(b.x + b.w / 2 - half), y: b.y - P * 2 }; }
  const b = partsOf(r.key).box;
  return { x: snap(b.x + b.w / 2 - half), y: b.y - P * (GESTURE_GAUGE_RISE + 2) };
}
// The gauge: cells that fill left to right with the speed, darker as they
// fill, the cap a tick at the end. No band and no target.
function gauge(x, y, v) {
  const n = GESTURE_GAUGE_CELLS, k = Math.round(Math.max(0, Math.min(1, v)) * n);
  for (let i = 0; i < n; i++) cell(x + i * P, y, i < k ? 4 + Math.round(i / (n - 1) * 6) : 2);
  for (let j = -1; j <= 1; j++) cell(x + n * P, y + j * P, 10);
}

// A crit's figure, 3 by 5 dots on a paper patch: 'x' and the count.
const FIG = {
  x: ['...', '#.#', '.#.', '#.#', '...'], 0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'],
  2: ['###', '..#', '###', '#..', '###'], 3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'],
  5: ['###', '#..', '###', '..#', '###'], 6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '..#', '..#', '..#'],
  8: ['###', '#.#', '###', '#.#', '###'], 9: ['###', '#.#', '###', '..#', '###']
};
function figure(x, y, n) {
  const chars = ['x', ...String(n)], w = (chars.length * 4 - 1) * D;
  x = dsnap(x); y = dsnap(y);
  ctx.fillStyle = GREY[0];
  ctx.fillRect(x - D, y - D, w + D * 2, 5 * D + D * 2);
  ctx.fillStyle = GREY[10];
  chars.forEach((ch, k) => { const f = FIG[ch]; for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (f[j][i] === '#') ctx.fillRect(x + (k * 4 + i) * D, y + j * D, D, D); });
}
// The impact star: eight thin rays round the struck point.
function star(x, y) {
  ctx.fillStyle = GREY[10];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const n = dx && dy ? 4 : 6, k = dx && dy ? 0.75 : 1;
    for (let s = 0; s < n; s++) { const d = (4 + s) * D; ctx.fillRect(dsnap(x + dx * d * k) - D / 2, dsnap(y + dy * d * k) - D / 2, D, D); }
  }
}
const held = (age, hold, fade) => (age < hold ? 1 : Math.max(0, 1 - (age - hold) / fade));

export function drawAfterCues() {
  const view = gestureView();
  if (!view) return;
  const t = now();
  for (const r of view) {
    if (!r.open && !r.marks.length && !r.load) continue;
    if (r.open && r.cueA > 0.01) {
      const draw = CUES[r.key](r);
      if (draw) { ctx.globalAlpha = r.cueA * GESTURE_CUE_ALPHA; draw(); }
    }
    if (r.gauge && r.gaugeA > 0.01) {
      const at = gaugeAt(r);
      if (at && inView(at.x, GESTURE_GAUGE_CELLS * P)) { ctx.globalAlpha = r.gaugeA; gauge(at.x, at.y, r.gv); }
    }
    for (const m of r.marks) {
      const age = t - m.at;
      ctx.globalAlpha = held(age, GESTURE_STAR_HOLD_S, GESTURE_STAR_FADE_S);
      star(m.x, m.y);
      ctx.globalAlpha = held(age, GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S);
      figure(m.x + P * 3, m.y - P * 4, m.n);
    }
    // The heap's load in the hand or in the air, and fading back if let go short.
    const ld = r.load;
    if (ld && ld.mode !== 'gone') {
      ctx.globalAlpha = ld.mode === 'back' ? Math.max(0, 1 - (t - ld.at) / GESTURE_LOAD_FADE_S) : 1;
      for (let k = 0; k < Math.min(4, ld.n * 2); k++) cell(ld.x + (k % 2) * P, ld.y - Math.floor(k / 2) * P, k % 3 ? 4 : 5);
    }
  }
  // The stump's wobble: a tick each side while it gives, the moment to yank.
  const w = stumpWobble();
  if (w && w.wobbling) {
    const a = partsOf('stump', w.i).at;
    ctx.globalAlpha = 1;
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) dot(a.x + s * P * 3, a.y - P * 2 - j * D * 2 - w.lift, 8);
  }
  ctx.globalAlpha = 1;
}
