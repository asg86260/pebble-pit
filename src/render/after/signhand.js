// MOCK the-sign-station-by-hand
// Throwaway review code, never merged: the hand's work at the sign station
// without a hammer (the owner, 2026-11-03: "i dont like the swinging hammer
// aspect ... lets have a new slate"). The planks still reach the bench by the
// one hand (signsmock.js: pressed off the timber pile, let go anywhere over
// the shed, caught into the dashed square), and the made flag is still taken
// by hand to the rack. Round 1 tried five ways; the owner kept C, the heave
// (2026-11-04: "lets roll with this for now. lets keep polishing it. the
// indicator to pull up and hold needs to be bigger. i kind of want to revisit
// that control scheme"). Round 2, on C:
//
//   heave  C as round 1 built it: take the square and draw it up, the
//          stump's pull (after/stump.js, `strainStep`); past the strain
//          height it holds, straining, and a row gives each strain.
//   c1     the same pull, with a big dashed arrow rising out of the square
//          through the roof to a hold line: the arrow fills as the square is
//          drawn up, and once it reaches the line the line fills with the
//          strain, a row giving each time it is full.
//   c2     the same pull, with a track down the shed's right side: a grip at
//          its foot rises with the pull to a notch, the hold line, and the
//          track over the notch fills with the strain. The track is a handle
//          too: its grip can be taken instead of the square.
//   c3     the same pull, with the ghost hand drawn twice the size acting it
//          out slowly (take the top, draw it up, hold), and three marks over
//          the roof, a row each, filling one by one as it is held.
//   c4     a different scheme: press and hold on the square, no drag. The
//          strain builds while held and a row gives each strain; c2's track,
//          the whole of it a meter, and c3's big ghost hand pressing and
//          holding.
//   c5     a different scheme: pumps. Held on the square, each short stroke
//          up lifts a row, the square riding up with the hand and locking at
//          the top of the stroke; down again and up for the next. c1's
//          arrow, filling with each stroke to its line, and the big ghost
//          hand pumping.
//
// The planks become the flag the same way in every one (`rise`): the
// square's top three rows are one block, moved whole at their true position,
// a row up a step; under it a bottom-row plank cell slides up and across into
// the pole's gap. Three steps and every cell is where the flag has it, and the
// piece fades into the flag in the sign's slate.
//
// The indicators are drawn in the ghost hand's language (render/aftercues.js):
// a mid-tone dashed line at the cue's own dot, paper under it, faint at
// GESTURE_CUE_ALPHA while the square waits and full ink while the hand is on
// it, eased in and out over GESTURE_CUE_FADE_S. `globalThis.__signHand` is the
// way; a reset puts it away.

import { S } from '../../state.js';
import { P, GESTURE_STUMP_DRAG, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S, GESTURE_CUE_ALPHA, GESTURE_CUE_FADE_S, GESTURE_CUE_DOT } from '../../config.js';
import { held } from '../../reset.js';
import { K, W, MID, clamp01 } from './kit.js';
import { goodColor } from './piles.js';
import { AP } from '../../after/place.js';
import { strainStep } from '../../after/stump.js';
import { signsM, wsFrame, HB, FLAG, flag, fillCell } from './signsmock.js';

held('sign-hand', () => { globalThis.__signHand = null; });

const ease = u => u * u * (3 - 2 * u);
const T = () => S.after.t;
// The flag fades in over the plank cells once the last step lands.
const FADE_S = 0.35;
// A row moves to where it is wanted at this rate, a second (the stump's follow).
const FOLLOW = 18;
const Z = 2;          // the bench work at twice the size (round 4's B3-big)
const STEPS_RISE = 3; // rows the block climbs

// --- the shared shaping: the block rising, the pole growing under it ----------------------
// The square's cells by role: the block (its top three rows, all four
// columns), the pole's foot (bottom row, first column), and the three feed
// cells (the rest of the bottom row), feed j going to the pole's row 6 - j.
function cellsOf() {
  const M = signsM();
  return M.cells.map(c => ({ ...c, tone: goodColor('plank', M.laid[c.i]) }));
}
// Where feed cell j stands at `p` (0 at its start, 1 home): up its own
// column to the pole's row, then across into the pole.
function feedAt(j, p) {
  const up = ease(clamp01(p * 2)), across = ease(clamp01(p * 2 - 1));
  return { col: j - j * across, row: 6 - j * up };
}
// The piece at `rise` rows (0..3), its box's top left (bx, by) in cells.
function drawRise(d, rise, bx, by) {
  const cells = cellsOf();
  for (const c of cells) {
    if (c.row !== 6 || c.col === 0) continue;
    const f = feedAt(c.col, clamp01(rise - (c.col - 1)));
    fillCell(d, bx + f.col * Z, by + f.row * Z, Z, Z, c.tone);
  }
  for (const c of cells) {
    if (c.row === 6 && c.col === 0) fillCell(d, bx, by + 6 * Z, Z, Z, c.tone);
    else if (c.row < 6) fillCell(d, bx + c.col * Z, by + (c.row - rise) * Z, Z, Z, c.tone);
  }
}
// The made piece: the plank cells fading under the flag fading in.
function drawDone(d, plank) {
  const M = signsM(), h = M.hand.sh, b = HB(), a = clamp01((T() - h.doneAt) / FADE_S);
  if (a < 1) d.fade(1 - a, plank);
  if (a > 0) d.fade(a, () => { const p = d.world(b.x, b.y + FLAG.h * Z); flag(p.x, p.y, M.signV, Z); });
}
const finish = h => { const M = signsM(); h.doneAt = T(); M.step = 4; };
// A step locked: counted as one of the hand's motions (the ghost hand's
// retire), the moment kept for its held mark.
function lock(h) { h.locked++; h.lockAt = T(); signsM().hand.uses++; if (h.locked >= STEPS_RISE) finish(h); }
// Two ticks either side of the block's foot, faded off: the held impact.
function ticks(d, at, bx, by, row, dur = 0.25) {
  const k = (T() - at) / dur;
  if (!(k >= 0 && k < 1)) return;
  const y = (by + row * Z) * P - 2 * Z;
  d.fade(1 - k, () => { d.px((bx - 1) * P - 4, y, 3 * Z, 2 * Z, K); d.px((bx + 4 * Z + 1) * P - 2, y, 3 * Z, 2 * Z, K); });
}
// The block's box on the bench at `rise`, in the world (a cell's slack round it).
function blockBox(rise, slack = 1) {
  const b = HB(), d = wsFrame(), a = d.world(b.x - slack, b.y + (3 - rise) * Z - slack), e = d.world(b.x + 4 * Z + slack, b.y + 7 * Z + slack);
  return { x: a.x, y: a.y, w: e.x - a.x, h: e.y - a.y };
}
const inBox = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
function riseStep(h, dt) { h.rise += (h.want - h.rise) * Math.min(1, dt * FOLLOW); if (Math.abs(h.want - h.rise) < 1e-3) h.rise = h.want; }
function riseDraw(d, h) {
  const b = HB();
  if (h.doneAt != null) { drawDone(d, () => drawRise(d, STEPS_RISE, b.x, b.y)); return; }
  drawRise(d, h.rise, b.x, b.y);
  ticks(d, h.lockAt, b.x, b.y, 6 - h.locked);
}

// --- the indicators' drawing, in the cue's language ----------------------------------------
// A dashed line in frame px from (x0, y0) to (x1, y1), its dashes `th` px
// square, `acc` the dash phase carried from the last segment (returned).
const DOT = GESTURE_CUE_DOT * 2;   // the indicators' dash, twice the ghost hand's dot: read at the yard's scale
const ON = DOT * 2, PER = DOT * 4;
function dashSeg(d, x0, y0, x1, y1, tone, acc = 0) {
  const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / (DOT / 2)));
  for (let i = 0; i <= n; i++) {
    const s = acc + (len * i) / n;
    if (s % PER < ON) d.px(x0 + (x1 - x0) * i / n - DOT / 2, y0 + (y1 - y0) * i / n - DOT / 2, DOT, DOT, tone);
  }
  return acc + len;
}
function dashPath(d, pts, tone) { let acc = 0; for (let i = 1; i < pts.length; i++) acc = dashSeg(d, pts[i - 1][0] * P, pts[i - 1][1] * P, pts[i][0] * P, pts[i][1] * P, tone, acc); }
// a solid run of cells (frame cells), for the fills
const solid = (d, x, y, w, h, tone) => { if (w > 0 && h > 0) d.px(x * P, y * P, w * P, h * P, tone); };
// The indicator's ink: faint while the square waits for the hand, full while
// it is held, out once it is the flag; eased, never popped.
function inkStep(h, dt) {
  const want = h.doneAt != null || !squareFull() ? 0 : h.held ? 1 : GESTURE_CUE_ALPHA, r = dt / GESTURE_CUE_FADE_S;
  h.ia += Math.max(-r, Math.min(r, want - h.ia));
}
const squareFull = () => { const M = signsM(); return !!M.laid && M.laid.every(v => v != null); };
const CX = () => HB().x + 2 * Z;   // the square's middle across, in frame cells

// c1, c5: the arrow. Its shaft rises out of the square's top, through the
// roof, to a head; over the head the hold line. `fill` how far up it is
// filled (0..1), `line` how much of the hold line is filled (0..1), `hit`
// the moment the line was last reached in full (a held mark, faded off).
const ARROW = { half: 1.5, shaftTop: -26, head: [4, 3, 2, 1], line: -31.5, lineHalf: 5 };
// The arrow drawn as the ghost hand is: a mid outline a dash thick round a
// paper middle, in dots, its head stepped on the cell grid a row a step
// narrower. Filled in full ink from the square up to `fill` of its height.
function drawArrowShape(d, cx, yb, fill) {
  const A = ARROW, tip = A.shaftTop - A.head.length, q = DOT / 2;
  const inside = (x, y) => {      // frame cells
    if (y > yb || y < tip) return false;
    if (y >= A.shaftTop) return Math.abs(x - cx) < A.half;
    return Math.abs(x - cx) < A.head[Math.min(A.head.length - 1, Math.floor(A.shaftTop - y))];
  };
  const yf = yb + (tip - yb) * fill, th = DOT / P;
  // paper, then the fill, as whole runs (a dot at a time seams at the yard's scale), then the rim in dots
  const runs = [[cx - A.half, A.shaftTop, 2 * A.half, yb - A.shaftTop], ...A.head.map((w, k) => [cx - w, A.shaftTop - k - 1, 2 * w, 1])];
  for (const [x, y, w, h] of runs) solid(d, x, y, w, h, W);
  for (const [x, y, w, h] of runs) { const top = Math.max(y, yf); solid(d, x, top, w, y + h - top, K); }   // the fill in full ink, to read in both themes
  for (let Y = tip * P; Y < yb * P; Y += q) for (let X = (cx - A.head[0]) * P; X < (cx + A.head[0]) * P; X += q) {
    const x = (X + q / 2) / P, y = (Y + q / 2) / P;
    if (!inside(x, y)) continue;
    if (!inside(x - th, y) || !inside(x + th, y) || !inside(x, y - th)) d.px(X, Y, q, q, MID);
  }
}
function drawArrow(d, h, fill, line, hit) {
  const cx = CX(), yb = HB().y + (3 - h.rise) * Z - 0.5, A = ARROW;
  d.fade(h.ia, () => {
    drawArrowShape(d, cx, yb, fill);
    // the hold line over its tip: dashed, filled solid from its middle out as the strain builds
    dashPath(d, [[cx - A.lineHalf, A.line], [cx + A.lineHalf, A.line]], MID);
    if (line > 0) solid(d, cx - A.lineHalf * line, A.line - 0.35, 2 * A.lineHalf * line, 0.7, K);
  });
  const k = (T() - hit) / 0.3;
  if (k >= 0 && k < 1) d.fade(h.ia * (1 - k), () => solid(d, cx - A.lineHalf, A.line - 0.35, 2 * A.lineHalf, 0.7, K));
}

// c2, c4: the track down the shed's right side. With a grip (c2) its foot is
// the grip's travel to the notch and the rest over it the strain's meter;
// without (c4) the whole track is the meter.
const TRACK = { x: 20, w: 2, top: -15, foot: -3, notch: -9 };
function trackBox() { const d = wsFrame(), a = d.world(TRACK.x - 1, TRACK.top - 1), e = d.world(TRACK.x + TRACK.w + 1, TRACK.foot + 1); return { x: a.x, y: a.y, w: e.x - a.x, h: e.y - a.y }; }
function drawTrack(d, h, grip, rise, meter) {
  const X = TRACK.x, W2 = TRACK.w;
  d.fade(h.ia, () => {
    const from = grip == null ? TRACK.foot : TRACK.notch, m = (from - TRACK.top) * meter;
    solid(d, X + 0.4, from - m, W2 - 0.8, m, K);
    dashPath(d, [[X, TRACK.foot], [X, TRACK.top], [X + W2, TRACK.top], [X + W2, TRACK.foot], [X, TRACK.foot]], MID);
    if (grip != null) {
      dashPath(d, [[X - 0.6, TRACK.notch], [X + W2 + 0.6, TRACK.notch]], MID);
      // the grip: a bar across the track, ridden up from its foot to the notch
      const gy = TRACK.foot - 1.5 - (TRACK.foot - 1.5 - TRACK.notch) * rise;
      solid(d, X - 0.3, gy, W2 + 0.6, 1.5, K);
    }
  });
}

// c3: three marks over the roof, a row each: given ones solid, the one being
// strained filling with the strain; outlined dashed.
const MARKS = { y: -29, w: 3, gap: 1 };
function drawMarks(d, h, n, part) {
  const cx = CX(), x0 = cx - (3 * MARKS.w + 2 * MARKS.gap) / 2;
  d.fade(h.ia, () => {
    for (let k = 0; k < 3; k++) {
      const x = x0 + k * (MARKS.w + MARKS.gap), f = k < n ? 1 : k === n ? part : 0;
      solid(d, x, MARKS.y, MARKS.w, MARKS.w, W);   // paper under it, so it reads over the sky
      if (f > 0) solid(d, x + 0.4, MARKS.y + 0.4 + (MARKS.w - 0.8) * (1 - f), MARKS.w - 0.8, (MARKS.w - 0.8) * f, K);
      dashPath(d, [[x, MARKS.y], [x + MARKS.w, MARKS.y], [x + MARKS.w, MARKS.y + MARKS.w], [x, MARKS.y + MARKS.w], [x, MARKS.y]], MID);
    }
  });
}

// --- the big ghost hand's acting, on its own slow loop -------------------------------------
// (render/aftercues.js draws it, at twice its dot, where `cue` puts it)
const GHOST = { z: GESTURE_CUE_DOT * 2, loop: 2.8 };
const gu = () => (T() % GHOST.loop) / GHOST.loop;
// The phases of c3's and c4's loop: taken (0..take), drawn up (..lift),
// held (..hold), and the marks filling a third of the hold each.
const PH = { take: 0.12, lift: 0.32, hold: 0.92 };
const holdPart = u => clamp01((u - PH.lift) / (PH.hold - PH.lift));

// --- the heave and its five round-two shapes -----------------------------------------------
// `control` how the hand works it: 'drag' (round 1's: press, draw up past the
// strain height, hold), 'hold' (press and hold where it is), 'pump' (strokes
// up); `ind` the indicator; `ghost` the ghost hand's acting.
const PUMP_PX = AP * 7;   // a stroke, world px: the pointer's travel up for a row
function heaveOf({ control = 'drag', ind = null, ghost = 'small' }) {
  const H = () => signsM().hand.sh;
  return {
    init: () => ({ locked: 0, rise: 0, want: 0, lockAt: -9, doneAt: null, held: false, y0: 0, py: 0, lift: 0, strain: 0, armed: true, ia: 0, hitAt: -9 }),
    // the square, a cell and a half round it; c2's track and grip too
    grab(x, y) {
      const h = H();
      if (inBox(x, y, blockBox(h.rise, 1.5))) return 'block';
      return ind === 'track' && inBox(x, y, trackBox()) ? 'track' : null;
    },
    down(what, x, y) { Object.assign(H(), { held: true, y0: y, py: y, lift: 0, strain: 0, armed: true }); return true; },
    move(x, y) { const h = H(); h.py = y; if (control === 'drag') h.lift = Math.max(0, (h.y0 - y) * GESTURE_STUMP_DRAG); },
    up() { Object.assign(H(), { held: false, lift: 0, strain: 0 }); },
    step(dt) {
      const h = H();
      if (h.doneAt == null) {
        if (control === 'pump') {
          // a stroke up to its top locks the row; the next wants the hand back down first
          const k = h.held ? clamp01((h.y0 - h.py) / PUMP_PX) : 0;
          if (!h.armed && k <= 0.25) h.armed = true;
          if (h.armed && h.held && k >= 1) { h.armed = false; h.hitAt = T(); lock(h); }
          h.want = h.doneAt != null ? STEPS_RISE : h.locked + (h.armed && h.held ? k : 0);
        } else {
          if (control === 'hold') h.lift = h.held ? GESTURE_STRAIN_LIFT : 0;
          if (strainStep(h, dt, h.held, h.lift)) { h.hitAt = T(); lock(h); }
          h.want = h.doneAt != null ? STEPS_RISE : h.locked + (h.held ? 0.5 * clamp01(h.lift / GESTURE_STRAIN_LIFT) : 0);
        }
      }
      riseStep(h, dt);
      inkStep(h, dt);
    },
    draw(d) {
      const h = H(), b = HB();
      riseDraw(d, h);
      // straining: two marks at the block's foot coming in as the strain builds
      if (control !== 'pump' && h.doneAt == null && h.held && h.lift >= GESTURE_STRAIN_LIFT) {
        const k = clamp01(h.strain / GESTURE_STRAIN_S), y = (b.y + (6 - h.locked) * Z) * P;
        d.fade(0.25 + 0.75 * k, () => { for (const s of [-1, 1]) d.px((b.x + (s < 0 ? -1 : 4 * Z)) * P + (s < 0 ? 0 : 2), y - Z * P / 2, P - 2, 2, MID); });
      }
    },
    drawTop() {
      const h = H();
      if (!ind || h.ia <= 0.01) return;
      const d = wsFrame(), strained = h.held && h.lift >= GESTURE_STRAIN_LIFT, part = strained ? clamp01(h.strain / GESTURE_STRAIN_S) : 0;
      const pull = clamp01(h.lift / GESTURE_STRAIN_LIFT);
      if (ind === 'arrow' && control === 'pump') {
        // the fill is where the hand is in its stroke, up and back down
        drawArrow(d, h, h.held ? clamp01((h.y0 - h.py) / PUMP_PX) : 0, 0, h.hitAt);
      } else if (ind === 'arrow') drawArrow(d, h, h.held ? pull : 0, part, h.hitAt);
      else if (ind === 'track') drawTrack(d, h, control === 'drag' ? 0 : null, h.held ? pull : 0, part);
      else if (ind === 'marks') {
        // while the square waits, the marks act out the ghost hand's hold
        if (h.held) drawMarks(d, h, h.locked, part);
        else { const p = holdPart(gu()) * 3; drawMarks(d, h, h.locked + Math.floor(p), p % 1); }
      }
    },
    cue(u) {
      const h = H(), r = blockBox(h.rise, 0), x = r.x + r.w / 2, y = r.y + AP * Z;
      if (ghost === 'small') {
        const k = u < 0.15 ? 0 : u < 0.55 ? ease((u - 0.15) / 0.4) : 1;
        return { x, y: y - k * AP * 5, pose: 'grab' };
      }
      const v = gu();
      if (ghost === 'pump') {
        // two strokes up a loop, each a quick lift and a let-down
        const s = (v * 2) % 1, k = s < 0.15 ? 0 : s < 0.5 ? ease((s - 0.15) / 0.35) : s < 0.65 ? 1 : 1 - ease((s - 0.65) / 0.35);
        return { x, y: y - k * PUMP_PX, pose: 'grab', z: GHOST.z };
      }
      // c3 lifts and holds; c4 only presses and holds
      const lift = ghost === 'lift' ? AP * 6 : 0;
      const k = v < PH.take ? 0 : v < PH.lift ? ease((v - PH.take) / (PH.lift - PH.take)) : v < PH.hold ? 1 : 1 - ease((v - PH.hold) / (1 - PH.hold));
      return { x, y: y - k * lift, pose: v < PH.take * 0.5 ? 'point' : 'grab', z: GHOST.z };
    },
    at(what) {
      const h = H(), r = blockBox(h.rise, 0);
      if (what === 'track') { const b = trackBox(); return { x: b.x + b.w / 2, y: b.y + b.h - AP * 2.5 }; }
      return { x: r.x + r.w / 2, y: r.y + AP * Z };
    },
    busy: () => H().held
  };
}

export const SHAPERS = {
  heave: heaveOf({}),
  c1: heaveOf({ ind: 'arrow' }),
  c2: heaveOf({ ind: 'track' }),
  c3: heaveOf({ ind: 'marks', ghost: 'lift' }),
  c4: heaveOf({ control: 'hold', ind: 'track', ghost: 'hold' }),
  c5: heaveOf({ control: 'pump', ind: 'arrow', ghost: 'pump' })
};
// The way up now, while the hand mock stands at its twice-size bench.
export const shaper = () => (globalThis.__signsMock === 'b4' && SHAPERS[globalThis.__signHand]) || null;
