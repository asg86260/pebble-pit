// Act 3's hand-work card (after/gestures.js; the owner's vote, mode (b),
// click to open, docs/mocks/act3-handcontrol-2026-10-18): a paper card over
// the station a click opened, the one part the hand moves drawn big on it,
// with the speed gauge, the ghost hand acting the motion out and a crit's
// mark. A layer in screen pixels (render.js's LAYERS), drawn only with the
// camera up there, at one size whatever the camp's zoom.
//
// Each card is drawn whole onto a sheet of its own, then laid on the frame
// at its ink, so a fading card fades as one sheet and its shadow never shows
// through its paper. Where it stands, and its ink, are the gestures' (`cardsView`);
// what the part looks like is the station's record, read the frame it is drawn.

import { S } from '../state.js';
import { msg, FACE } from '../lang.js';
import { GREY, GESTURE_CUE_ALPHA, GESTURE_CUE_DOT, GESTURE_CUE_LOOP_S, GESTURE_CUE_TAP_S, GESTURE_GAUGE_CELLS,
         GESTURE_SAW_AMP, GESTURE_STUMP_MAX, GESTURE_YANK_LIFT, GESTURE_LOAD_FADE_S,
         GESTURE_WHEEL_LOG, GESTURE_WHEEL_MAX_REV, GESTURE_FEED_LOG, GESTURE_FEED_RAMP_S, GESTURE_STIR_TURNS,
         GESTURE_STIR_MAX_REV, GESTURE_SWING_S, GESTURE_SIGN_BLOWS, TREE_CHOPS, AFTER_DIG_CLICKS, AFTER_TIP_LOAD,
         CARD_CELL, CARD_PAD, CARD_HEAD, CARD_RULE, CARD_TAIL, CARD_SHADOW, CARD_SHADOW_INK, CARD_RISE,
         CARD_TITLE_PX, CARD_TITLE_Y, CARD_TITLE_RULE_Y, CARD_LEADER_STEP } from '../config.js';
import { ctx } from './ctx.js';
import { cardsView, partsOf, stumpWobble, CARD_W, CARD_H, CARD_FULL_W, CARD_FULL_H, CARD_FLOOR, CARD_GAUGE_ROW } from '../after/gestures.js';
import { trees } from '../after/grove.js';
import { handOn, markOn } from './aftercues.js';

const P = CARD_CELL, D = GESTURE_CUE_DOT;
const clamp01 = v => Math.max(0, Math.min(1, v));
const ease = a => 1 - (1 - a) * (1 - a);
const now = () => S.after.t;
// A cell's tone off its place, so no fill is one flat tone.
const toneAt = (c, r, list) => list[((((c * 73856093) ^ (r * 19349663)) >>> 0) % 9973) % list.length];
const FLOOR_TONES = [1, 1, 2, 1, 2, 3];

// --- cells on the card's grid -------------------------------------------------------
let q = null;
const C = (c, r, t) => { q.fillStyle = GREY[t]; q.fillRect(Math.round(c) * P, Math.round(r) * P, P, P); };
const fill = (c0, r0, c1, r1, t) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) C(c, r, t); };
function box(c0, r0, c1, r1, tones = [0, 1, 1, 2]) {
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++)
    C(c, r, r === r0 || r === r1 || c === c0 || c === c1 ? 10 : toneAt(c, r, tones));
}
function line(c0, r0, c1, r1) {
  c0 = Math.round(c0); r0 = Math.round(r0); c1 = Math.round(c1); r1 = Math.round(r1);
  const out = [], dc = Math.abs(c1 - c0), dr = -Math.abs(r1 - r0), sc = c0 < c1 ? 1 : -1, sr = r0 < r1 ? 1 : -1;
  let e = dc + dr;
  for (;;) { out.push([c0, r0]); if (c0 === c1 && r0 === r1) break; const e2 = 2 * e; if (e2 >= dr) { e += dr; c0 += sc; } if (e2 <= dc) { e += dc; r0 += sr; } }
  return out;
}
function fade(a, fn) { const was = q.globalAlpha; q.globalAlpha = was * clamp01(a); fn(); q.globalAlpha = was; }
// The cue's own pixel, two a side, in a cell's middle.
const dot = (c, r, t = 5) => { q.fillStyle = GREY[t]; q.fillRect(Math.round(c) * P + 2, Math.round(r) * P + 2, D, D); };
const dots = (pts, t = 5) => { for (const [c, r] of pts) dot(c, r, t); };
function chevron(c, r, dc, dr) {
  dot(c, r);
  const pc = -dr, pr = dc;
  for (let s = 1; s <= 2; s++) { dot(c - dc * s + pc * s, r - dr * s + pr * s); dot(c - dc * s - pc * s, r - dr * s - pr * s); }
}
const ring = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, k) => [Math.round(cx + Math.cos(k / n * 2 * Math.PI) * rx), Math.round(cy + Math.sin(k / n * 2 * Math.PI) * ry)]);
// The ghost hand at a cell, as the place's (render/aftercues.js).
const hand = (c, r, pose) => handOn(q, (Math.round(c) + 0.5) * P, Math.round(r) * P + (pose === 'grab' ? P / 2 : 0), pose);
const loop = (s = GESTURE_CUE_LOOP_S) => (now() % s) / s;

// The speed gauge along the card's foot: fills left to right with how fast
// the hand goes, darker as it fills, the cap a tick at its end.
function gauge(v) {
  const n = GESTURE_GAUGE_CELLS, k = Math.round(clamp01(v) * n), r = CARD_GAUGE_ROW;
  for (let i = 0; i < n; i++) C(1 + i, r, i < k ? 4 + Math.round(i / (n - 1) * 6) : 2);
  for (let j = -1; j <= 1; j++) C(n + 1, r + j, 10);
}
// A dial standing up, 0 at its foot: the band where a pull counts darker
// while its window is open, the needle a cell beside it.
function vgauge(c, r0, r1, v, vmax, lo, hi, bandA) {
  const n = r1 - r0 + 1;
  for (let k = 0; k < n; k++) {
    const x = (k + 0.5) / n * vmax, r = r1 - k;
    C(c, r, 2);
    if (x >= lo && x <= hi) fade(bandA, () => C(c, r, 6));
  }
  const nk = Math.max(0, Math.min(n - 1, Math.floor(v / vmax * n)));
  C(c - 1, r1 - nk, 10); C(c, r1 - nk, 10);
}

// --- the parts, a station a drawing -----------------------------------------------------
// Each draws its part off the station's record `h` (after/gestures.js), and
// `cue` the ghost hand acting its motion out.
const PARTS = {
  mill: {
    draw(h) {
      const w = partsOf('mill').wheel, cx = Math.floor(w.x / P), cy = Math.floor(w.y / P), R = w.r / P;
      const step = 2 * Math.PI / 16, aq = Math.round(h.ang / step) * step, rev = Math.abs(h.w) / (2 * Math.PI);
      for (let r = cy - R - 1; r <= cy + R + 1; r++) for (let c = cx - R - 1; c <= cx + R + 1; c++) {
        const d = Math.hypot(c - cx, r - cy);
        if (d >= R - 0.6 && d <= R + 0.45) C(c, r, 10);
      }
      const spokes = (a, t) => { for (let k = 0; k < 4; k++) { const s = a + k * Math.PI / 2; for (let d = 1; d < R; d++) C(cx + Math.round(Math.cos(s) * d), cy + Math.round(Math.sin(s) * d), t); } };
      if (rev > GESTURE_WHEEL_MAX_REV / 4) spokes(aq - step * Math.sign(h.w), 3);
      if (rev > GESTURE_WHEEL_MAX_REV / 2) spokes(aq - 2 * step * Math.sign(h.w), 2);
      spokes(aq, 8);
      C(cx, cy, 10);
      C(cx + Math.round(Math.cos(aq) * (R + 0.6)), cy + Math.round(Math.sin(aq) * (R + 0.6)), 6);   // the knob
      // The frame saw it drives, small: the blade riding with the knob, the
      // log through it, and the log's cut so far.
      const drop = Math.round(1 + Math.sin(aq)), fed = (h.prog || 0) / GESTURE_WHEEL_LOG;
      fill(17, 0, 26, 0, 10);
      for (let r = 1; r <= 8; r++) { C(17, r, 10); C(26, r, 10); }
      const head = Math.round(18 + fed * 9 + 3);
      for (let c = Math.max(18, head - 7); c <= Math.min(25, head); c++) { C(c, 5, 8); C(c, 6, c < 22 ? (c % 3 ? 2 : 6) : 3); }
      for (let r = 1 + drop; r <= 4 + drop; r++) C(21, r, 10);
      fill(19, drop, 23, drop, 10);
      fill(17, 8, 26, 8, 10);
      for (let k = 0; k < 4; k++) fill(18 + k * 2, 10, 19 + k * 2, 11, k < Math.floor(fed * 4) ? 10 : 2);
    },
    cue() {
      const w = partsOf('mill').wheel, cx = Math.floor(w.x / P), cy = Math.floor(w.y / P), R = w.r / P;
      dots(ring(cx, cy, R + 2, R + 2, 20)); chevron(cx, cy + R + 2.5, -1, 0);
      const a = loop() * 2 * Math.PI;
      hand(cx + Math.round(Math.cos(a) * R), cy + Math.round(Math.sin(a) * R), 'grab');
    }
  },
  papermill: {
    draw(h) {
      const v = partsOf('papermill').vat, cx = Math.floor(v.x / P), cy = Math.floor(v.y / P), rx = v.rx / P, ry = v.ry / P;
      const step = 2 * Math.PI / 16, aq = Math.round(h.ang / step) * step, rev = Math.abs(h.w) / (2 * Math.PI);
      for (let r = cy; r <= 12; r++) for (let c = cx - rx; c <= cx + rx; c++)
        C(c, r, c === cx - rx || c === cx + rx || r === 12 ? 10 : toneAt(c, r, [2, 3, 2]));
      for (let r = cy - ry; r <= cy + ry; r++) for (let c = cx - rx; c <= cx + rx; c++) {
        const d = ((c - cx) / rx) ** 2 + ((r - cy) / ry) ** 2;
        if (d <= 0.72) C(c, r, toneAt(c, r, [1, 2, 1])); else if (d <= 1.2) C(c, r, 10);
      }
      if (rev > 0.1) {
        const trail = Math.round(2 + clamp01(rev / GESTURE_STIR_MAX_REV) * 5);
        for (let k = 1; k <= trail; k++) {
          const s = aq - Math.sign(h.w || 1) * k * 0.35;
          C(cx + Math.round(Math.cos(s) * (rx - 4)), cy + Math.round(Math.sin(s) * (ry - 1.5)), k < 3 ? 5 : 4);
        }
      }
      // The paddle, two cells thick, set off the pulp and the rim by a cell
      // of paper either side so it reads wherever it is round the vat.
      const pc = cx + Math.round(Math.cos(aq) * (rx - 4)), pr = cy + Math.round(Math.sin(aq) * (ry - 1.5)), top = Math.max(1, pr - 5);
      for (let r = top; r <= pr + 1; r++) { C(pc - 1, r, 0); C(pc + 2, r, 0); }
      fill(pc - 2, top - 1, pc + 3, top - 1, 0);
      for (let r = top; r <= pr; r++) { C(pc, r, 10); C(pc + 1, r, 8); }
      fill(pc - 1, top, pc + 2, top, 10);
      fill(pc, pr + 1, pc + 1, pr + 1, 10);
      for (let k = 0; k < GESTURE_STIR_TURNS; k++) { C(2 + k * 2, 13, 2); fade(clamp01((h.prog || 0) - k), () => C(2 + k * 2, 13, 10)); }
    },
    cue() {
      const v = partsOf('papermill').vat, cx = Math.floor(v.x / P), cy = Math.floor(v.y / P), rx = v.rx / P, ry = v.ry / P;
      dots(ring(cx, cy, rx + 1, ry + 2, 24)); chevron(cx, cy + ry + 2, -1, 0);
      const a = loop() * 2 * Math.PI;
      hand(cx + Math.round(Math.cos(a) * (rx - 4)), Math.max(1, cy + Math.round(Math.sin(a) * (ry - 1.5)) - 4), 'grab');
    }
  },
  chipper: {
    draw(h) {
      const b = partsOf('chipper').button, bx = Math.floor(b.x / P), by = Math.floor(b.y / P), br = b.r / P, sink = h.hold ? 1 : 0;
      // The button: an ink rim standing a cell proud, its face pressed in while held.
      for (let r = by - br - 1; r <= by + br + 2; r++) for (let c = bx - br - 1; c <= bx + br + 1; c++) {
        const d0 = Math.hypot(c - bx, r - by - 1), d1 = Math.hypot(c - bx, r - by - sink);
        if (d1 <= br - 0.6) C(c, r, h.hold ? 6 : 1);
        else if (d1 <= br + 0.45) C(c, r, 10);
        else if (!sink && d0 <= br + 0.45 && r > by) C(c, r, 10);
      }
      // A log on its face, pointing in.
      for (let c = bx - 2; c <= bx + 1; c++) { C(c, by + sink - 1, 10); C(c, by + sink, h.hold ? 4 : 3); }
      C(bx + 2, by + sink - 2, 10); C(bx + 3, by + sink - 1, 10); C(bx + 3, by + sink, 10); C(bx + 2, by + sink + 1, 10);
      // The hold filling round it.
      const k = h.hold ? clamp01(h.held / GESTURE_FEED_RAMP_S) : 0;
      dots(ring(bx, by, br + 2, br + 2, 24).slice(0, Math.ceil(k * 24)), 8);
      // The table, the log on it going into the jaws.
      fill(14, 10, 21, 10, 10);
      box(22, 3, 26, 11, [1, 2]); fill(22, 7, 22, 9, 0);
      const jaw = h.hold ? Math.floor(now() * 10) % 2 : 0;
      fill(23, 6 + jaw, 25, 6 + jaw, 10);
      fill(24, 1, 26, 2, 10);
      const head = Math.round(15 + (h.prog || 0) / GESTURE_FEED_LOG * 13), tail = head - 5;
      for (let c = Math.max(14, tail); c <= Math.min(head, 21); c++) { C(c, 8, 8); C(c, 9, c === tail ? 6 : 2); }
    },
    cue() {
      const b = partsOf('chipper').button, bx = Math.floor(b.x / P), by = Math.floor(b.y / P), br = b.r / P;
      const ph = loop(GESTURE_CUE_LOOP_S * 1.7), pressing = ph < 0.75;
      hand(bx, by + (pressing ? 1 : -1), 'point');
      dots(ring(bx, by, br + 2, br + 2, 24).slice(0, pressing ? Math.ceil(ph / 0.65 * 24) : 0));
    }
  },
  workshop: {
    draw(h) {
      const nails = partsOf('workshop').nails, t = now();
      // The pad: a dashed rule round the whole place a tap lands.
      for (let c = 1; c <= 22; c += 2) { dot(c, 0, 4); dot(c, 12, 4); }
      for (let r = 2; r <= 10; r += 2) { dot(0, r, 4); dot(23, r, 4); }
      fill(2, 12, 21, 12, 10);
      box(3, 9, 21, 11, [0, 1]);
      const per = GESTURE_SIGN_BLOWS / nails.length;
      nails.forEach((c, i) => {
        const driven = Math.max(0, Math.min(per, h.blows - i * per)) / per * 2, top = 7 + Math.round(driven);
        for (let r = top; r <= 8; r++) C(c, r, r === top ? 10 : 7);
        if (driven >= 2) C(c, 9, 9);
      });
      const down = t - h.strike < GESTURE_SWING_S;
      const n = Math.min(nails.length - 1, Math.floor(Math.max(0, h.blows - (down ? 1 : 0)) / per)), hx = nails[n];
      if (down) {
        const top = 7 + Math.round(Math.max(0, Math.min(per, h.blows - n * per)) / per * 2) - 2;
        fill(hx - 1, top, hx + 1, top + 1, 10);
        for (let c = hx + 2; c <= hx + 6; c++) C(c, top, 6);
      } else {
        fill(hx - 1, 2, hx + 1, 3, 10);
        line(hx + 2, 3, hx + 5, 0).forEach(([c, r]) => C(c, r, 6));
      }
    },
    cue(h) {
      const nails = partsOf('workshop').nails, per = GESTURE_SIGN_BLOWS / nails.length;
      const hx = nails[Math.min(nails.length - 1, Math.floor(h.blows / per))];
      hand(hx + 4, (now() % GESTURE_CUE_TAP_S) < GESTURE_CUE_TAP_S * 0.4 ? 5 : 3, 'point');
    }
  },
  press: {
    draw(h) {
      const bar = partsOf('press').bar, pc = Math.floor(bar.x / P), pr = Math.floor(bar.y / P), L = bar.len / P;
      const end = k => { const th = bar.a0 + (bar.a1 - bar.a0) * k; return { c: pc + Math.cos(th) * L, r: pr + Math.sin(th) * L }; };
      // The post the bar turns on, the stop under the handle's end.
      for (let r = pr; r <= 12; r++) C(pc, r, 10);
      fill(pc - 1, 12, pc + 1, 12, 10);
      const e = end(1);
      fill(Math.round(e.c) - 1, Math.round(e.r) + 2, Math.round(e.c) + 2, Math.round(e.r) + 2, 10);
      for (let r = Math.round(e.r) + 3; r <= 12; r++) C(Math.round(e.c), r, 10);
      // The bar's smear while it moves fast, then the bar and its handle.
      if (h.w > 1) { const h2 = end(Math.max(0, h.k - 0.12)); line(pc, pr, h2.c, h2.r).forEach(([c, r]) => C(c, r, 3)); }
      const k = end(h.k);
      line(pc, pr, k.c, k.r).forEach(([c, r]) => C(c, r, 10));
      fill(Math.round(k.c) - 1, Math.round(k.r), Math.round(k.c) + 1, Math.round(k.r) + 1, 10);
      C(Math.round(k.c), Math.round(k.r), 1);
      C(pc, pr, 6);
    },
    cue() {
      const bar = partsOf('press').bar, pc = Math.floor(bar.x / P), pr = Math.floor(bar.y / P), L = bar.len / P;
      const at = (k, out) => { const th = bar.a0 + (bar.a1 - bar.a0) * k; return [Math.round(pc + Math.cos(th) * (L + out)), Math.round(pr + Math.sin(th) * (L + out))]; };
      const pts = []; for (let k = 0; k <= 1.001; k += 0.1) pts.push(at(k, 2));
      dots(pts);
      const last = pts[pts.length - 1]; chevron(last[0], last[1] + 1, 0, 1);
      const ph = loop(GESTURE_CUE_LOOP_S * 0.93), k = ph < 0.25 ? ph / 0.25 : ph < 0.45 ? 1 : 1 - (ph - 0.45) / 0.55;
      const [c, r] = at(k, 0);
      hand(c, r, 'grab');
    }
  },
  tree: {
    draw(h, card) {
      const p = trees()[card.i], felled = !p || p.fall != null;
      const kerf = p ? Math.floor((p.chops || 0) / TREE_CHOPS * 5) : 0;
      // The trunk in section, the kerf opened from the hand's side.
      fade(felled ? 0.25 : 1, () => { for (let r = 0; r <= 12; r++) for (let c = 12; c <= 16; c++) {
        if (r === 7 && c - 12 < kerf) continue;
        C(c, r, c === 12 || c === 16 ? 10 : toneAt(c, r, [1, 2, 3]));
      } });
      const off = Math.round((h.s || 0) / P), hidden = c => !felled && c >= 12 + kerf && c <= 16;
      for (let c = 8 + off; c <= 20 + off; c++) {
        if (!hidden(c)) C(c, 7, 8);
        if ((c - off) % 2 === 0 && !(!felled && c >= 12 && c <= 16)) C(c, 8, 8);
      }
      fill(6 + off, 5, 7 + off, 9, 10); C(6 + off, 6, 1); C(6 + off, 8, 1);   // the hand's handle
      fill(21 + off, 6, 21 + off, 8, 6);                                     // the partner's, grey
      for (let k = 0; k < TREE_CHOPS; k++) C(3 + k * 2, 0, p && k < p.chops ? 10 : 2);
    },
    cue() {
      const s = partsOf('tree').saw, c0 = Math.floor(s.x / P), r = Math.floor(s.y / P), amp = GESTURE_SAW_AMP / P;
      const pts = []; for (let c = c0 - amp; c <= c0 + amp; c++) pts.push([c, 3]);
      dots(pts); chevron(c0 - amp - 1, 3, -1, 0); chevron(c0 + amp + 1, 3, 1, 0);
      hand(c0 + Math.round(amp * Math.sin(2 * Math.PI * loop())), r, 'grab');
    }
  },
  stump: {
    draw(h, card) {
      const p = trees()[card.i], roots = p && p.stump ? AFTER_DIG_CLICKS - (p.dug || 0) : 0, w = stumpWobble();
      const wob = w && w.i === card.i && w.wobbling, win = w && w.i === card.i && w.open;
      for (let r = 10; r <= 12; r++) for (let c = 1; c <= 20; c++) C(c, r, toneAt(c, r, FLOOR_TONES));
      // Pulled out, the block stands clear of the floor while the card is still up.
      const out = !p || !p.stump;
      const up = out ? 4 : Math.round(h.lift / P), give = out ? 4 : Math.round(h.lift / P * 0.45);
      const dx = wob ? [-1, 1, -1][Math.floor((now() - h.wob) / 0.09)] || 0 : 0;
      const c0 = 9 + dx, top = 8 - give, at = Math.floor(partsOf('stump').at.x / P);
      for (let i = 0; i < AFTER_DIG_CLICKS; i++) {
        const ac = at - AFTER_DIG_CLICKS + 1 + i * 2, oc = c0 + 1 + i;
        if (i < roots) line(oc, top + 2, ac, 12).forEach(([c, r]) => C(c, r, 8));
      }
      box(c0, top, c0 + 4, top + 1, [2, 3, 2]); C(c0 + 2, top, 2);
      if (wob) { C(c0 - 2, top + 1, 6); C(c0 + 6, top + 1, 6); }
      // The rope up to the grip, and the grip: a bar across, two cells deep.
      const gr = Math.max(0, top - 2 - (up - give));
      for (let r = gr + 2; r < top; r++) C(c0 + 2, r, 8);
      fill(c0 - 1, gr, c0 + 5, gr + 1, 10); C(c0 + 2, gr, 1);
      vgauge(24, 1, 12, h.lift, GESTURE_STUMP_MAX, GESTURE_YANK_LIFT, GESTURE_STUMP_MAX, win ? 1 : 0);
      for (let k = 0; k < AFTER_DIG_CLICKS; k++) C(2 + k * 2, CARD_GAUGE_ROW, k < roots ? 8 : 2);
    },
    cue() {
      const a = partsOf('stump').at, c = Math.floor(a.x / P), r = Math.floor(a.y / P), max = Math.round(GESTURE_STUMP_MAX / P);
      const up = Math.round(Math.min(1, loop() * 1.6) * max);
      const pts = []; for (let k = r; k >= r - max - 2; k--) pts.push([c + 7, k]);
      dots(pts); chevron(c + 7, r - max - 3, 0, -1);
      hand(c, r - 2 - up, 'grab');
    }
  },
  heap: {
    draw(h) {
      const edge = Math.round(partsOf('heap').edge / P), floor = Math.round(CARD_FLOOR / P), t = now();
      for (let c = 0; c < edge; c++) C(c, floor, toneAt(c, floor, FLOOR_TONES));
      for (let r = 2; r <= floor - 1; r += 2) C(edge, r, 5);                 // the edge, dashed
      C(edge, floor, 3);
      fill(3, 0, 5, 0, 10);                                                  // the chute
      // The mound: a load a few cells, at most five loads' worth shown.
      const loads = Math.min(5, Math.ceil((S.after.stock.sawdust || 0) / AFTER_TIP_LOAD));
      const mound = [];
      [[1, 8], [2, 7], [3, 6], [4, 5], [4, 5]].forEach(([a, b], j) => { for (let c = a; c <= b; c++) mound.push([c, floor - 1 - j]); });
      mound.slice(0, loads * 4).forEach(([c, r], k) => C(c, r, toneAt(k, 3, [4, 5, 4])));
      const ld = h.load;
      if (ld) {
        const a = ld.mode === 'held' || ld.mode === 'fling' ? 1 : clamp01(1 - (t - ld.at) / GESTURE_LOAD_FADE_S);
        const c = Math.round(ld.x / P), r = Math.round(ld.y / P), w = 2 + ld.n, hh = 1 + ld.n;
        fade(a, () => { for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) C(c - 1 + i, r - j + 1, toneAt(i, j, [4, 5])); });
      }
    },
    cue() {
      const edge = Math.round(partsOf('heap').edge / P);
      const pts = []; for (let c = 8; c <= edge - 1; c++) pts.push([c, 5]);
      dots(pts); chevron(edge - 1, 5, 1, 0);
      const k = Math.min(1, loop(GESTURE_CUE_LOOP_S * 1.3) / 0.6);
      hand(5 + Math.round(k * k * (edge - 6)), 8, 'grab');
    }
  }
};
const TITLE = { tree: 'after-hand-tree', stump: 'after-hand-stump', heap: 'after-hand-heap', mill: 'after-build-mill',
                chipper: 'after-build-chipper', papermill: 'after-build-papermill', workshop: 'after-build-workshop',
                press: 'after-build-press' };

// --- the card -------------------------------------------------------------------------
let sheet = null;
function drawCard(card) {
  const r = card.rect, dpr = S.dpr || 1, part = PARTS[card.key];
  const cw = CARD_FULL_W + CARD_SHADOW, ch = CARD_FULL_H + CARD_SHADOW + CARD_TAIL + CARD_RULE;
  sheet = sheet || document.createElement('canvas');
  sheet.width = Math.ceil(cw * dpr); sheet.height = Math.ceil(ch * dpr);
  q = sheet.getContext('2d');
  q.setTransform(dpr, 0, 0, dpr, 0, 0);
  q.imageSmoothingEnabled = false;
  q.globalAlpha = CARD_SHADOW_INK; q.fillStyle = GREY[10]; q.fillRect(CARD_SHADOW, CARD_SHADOW, CARD_FULL_W, CARD_FULL_H); q.globalAlpha = 1;
  q.fillStyle = GREY[0]; q.fillRect(0, 0, CARD_FULL_W, CARD_FULL_H);
  q.fillStyle = GREY[10];
  q.fillRect(0, 0, CARD_FULL_W, CARD_RULE); q.fillRect(0, CARD_FULL_H - CARD_RULE, CARD_FULL_W, CARD_RULE);
  q.fillRect(0, 0, CARD_RULE, CARD_FULL_H); q.fillRect(CARD_FULL_W - CARD_RULE, 0, CARD_RULE, CARD_FULL_H);
  // The tail, pointing down at its station's part.
  const tx = Math.round(Math.max(CARD_PAD * 2, Math.min(CARD_FULL_W - CARD_PAD * 2, r.sx - r.x)));
  for (let i = 0; i < CARD_TAIL; i++) {
    q.fillStyle = GREY[10]; q.fillRect(tx - (CARD_TAIL - i), CARD_FULL_H - CARD_RULE + i, 2 * (CARD_TAIL - i), 1);
    if (i < CARD_TAIL - CARD_RULE) { q.fillStyle = GREY[0]; q.fillRect(tx - (CARD_TAIL - i) + CARD_RULE, CARD_FULL_H - CARD_RULE + i, 2 * (CARD_TAIL - i - CARD_RULE), 1); }
  }
  // Its name, as a board's title: capitals, a rule under.
  q.font = `${CARD_TITLE_PX}px ${FACE}`; q.fillStyle = GREY[10]; q.textBaseline = 'alphabetic'; q.textAlign = 'left';
  q.fillText(msg(TITLE[card.key]).toLocaleUpperCase(), CARD_PAD + CARD_RULE, CARD_TITLE_Y);
  q.fillRect(CARD_PAD, CARD_TITLE_RULE_Y, CARD_FULL_W - CARD_PAD * 2, CARD_RULE);
  q.save();
  q.translate(CARD_PAD, CARD_HEAD);
  q.beginPath(); q.rect(0, 0, CARD_W, CARD_H); q.clip();
  part.draw(card, card);
  if (card.gauge) gauge(card.gv);
  for (const m of card.marks) if (m.card) markOn(q, m, now(), P);
  q.globalAlpha = 1;
  if (card.open && card.cueA > 0.01) { q.globalAlpha = card.cueA * GESTURE_CUE_ALPHA; part.cue(card, card); q.globalAlpha = 1; }
  q.restore();
  // Laid down whole at its ink, rising into place as it comes in.
  const y = Math.round(r.y + (1 - ease(card.a)) * CARD_RISE);
  ctx.save();
  ctx.globalAlpha = card.a;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, r.x, y, cw, ch);
  // The leader: a dotted line down from the tail to its station's top.
  ctx.fillStyle = GREY[5];
  for (let yy = y + CARD_FULL_H + CARD_TAIL + CARD_RULE; yy < r.top - 3; yy += CARD_LEADER_STEP) ctx.fillRect(Math.round(r.sx) - 1, yy, 2, 2);
  ctx.restore();
}

export function drawAfterCard() {
  if (S.view !== 'after' || !S.after) return;
  for (const card of cardsView()) drawCard(card);
}
