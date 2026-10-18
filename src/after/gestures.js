// Act 3's hand work: every station worked by its own motion (the owner's
// vote on docs/mocks/act3-gestures-2026-10-18, "lets build it. we can refine
// later"). The faster the motion the faster the work, up to a cap; only two
// crits stay, both moments of timing -- the pedestal's big bubble, paying
// GESTURE_BUBBLE_CRIT lines, and the stump yanked as it wobbles, out in one
// pull.
//
//   pedestal   a click on a rising speech bubble pops it
//   tree       the two-person saw dragged back and forth: a stroke a chop
//   stump      dragged up and held there, a root a strain; yanked in the
//              wobble's window, out at once
//   saw mill   the flywheel spun: its speed feeds the log, capped
//   chipper    pressed and held: the feed ramps up over the ramp's seconds
//   paper mill the vat stirred round: its speed fills the batch, capped
//   workshop   a tap a blow, no closer than the swing
//   press      the bar dragged down: a poster at the stop
//   heap       a load dragged to the edge, or flung: the faster, the more
//
// Every motion but the pedestal's is made on the station's card (the owner's
// vote on docs/mocks/act3-handcontrol-2026-10-18, mode (b), click to open): a
// click on a station opens a paper card over it with the one part the hand
// moves drawn big, and the press, the drag and the release are made on that
// part. The station below keeps its size and moves in step, off
// `gestureView`. The pedestal has no card: its bubbles are popped where they
// rise, in the sky.
//
// The work itself is the sim's and is reached only the way the click reached
// it: `workAfter` for the stations, the grove's own chop and dig, the heap's
// tip. A member at a post works the same station alongside the hand, as with
// the click. What is kept here is the hand's own motion -- where the saw's
// handle is, how fast the wheel turns, how far the stump is up -- and which
// card is open, and it is this session's: a reload stands every station
// still with every card shut, and the ghost hand shows again until the
// motion has been done GESTURE_CUE_USES times.
//
// Time is the act's clock (`S.after.t`): the pointer only moves things, and
// `stepGestures` turns what it moved into speed a frame, so a check turns the
// clock with `run` and reads a fact about the game, not about the machine.

import { S } from '../state.js';
import { GESTURE_CUE_USES, GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_GAUGE_EASE, GESTURE_GAUGE_FADE_S,
         GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S, GESTURE_BUBBLE_CRIT, GESTURE_BUBBLE_SLACK,
         GESTURE_SAW_AMP, GESTURE_SAW_VMAX, GESTURE_SAW_FOLLOW, GESTURE_SAW_END, GESTURE_SAW_EASE,
         GESTURE_STUMP_DRAG, GESTURE_STUMP_MAX, GESTURE_STUMP_FOLLOW, GESTURE_STUMP_SINK, GESTURE_STRAIN_LIFT,
         GESTURE_STRAIN_S, GESTURE_WOBBLE_S, GESTURE_WINDOW_S, GESTURE_WOBBLE_GAP, GESTURE_YANK_LIFT, GESTURE_YANK_GAIN,
         GESTURE_WHEEL_MAX_REV, GESTURE_WHEEL_FEED, GESTURE_WHEEL_LOG, GESTURE_WHEEL_EASE, GESTURE_WHEEL_COAST,
         GESTURE_WHEEL_MIN_REV, GESTURE_FEED_SLOW, GESTURE_FEED_FAST, GESTURE_FEED_RAMP_S, GESTURE_FEED_LOG,
         GESTURE_STIR_MAX_REV, GESTURE_STIR_TURNS, GESTURE_STIR_EASE, GESTURE_STIR_COAST,
         GESTURE_SWING_S, GESTURE_SIGN_BLOWS, GESTURE_TAPS_MAX,
         GESTURE_BAR_DRAG, GESTURE_BAR_RATE, GESTURE_BAR_RETURN, GESTURE_BAR_PRINT, GESTURE_BAR_RESET, GESTURE_BAR_EASE,
         GESTURE_FLING_MIN, GESTURE_FLING_MAX, GESTURE_FLING_LOADS, GESTURE_FLING_WINDOW_S, GESTURE_FLING_GRAV,
         GESTURE_FLING_LIFT, GESTURE_LOAD_FADE_S, GESTURE_PAD_PULL, GESTURE_PAD_TURN,
         CARD_CELL, CARD_COLS, CARD_ROWS, CARD_PAD, CARD_HEAD, CARD_TAIL, CARD_GAP, CARD_ROOM, CARD_EDGE,
         CARD_IN_S, CARD_OUT_S, CARD_EASE } from '../config.js';
import { afterlifeOn } from '../acts.js';
import { secs } from './util.js';
import { built } from './levels.js';
import { stationParts, stationBox } from './place.js';
import { treeAt, stumpAt, standing, stumped, chopTree, digStump, trees } from './grove.js';
import { tipSawdust } from './mill.js';
import { pairBuilding } from './build.js';
import { workAfter } from './work.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const inBox = (x, y, b) => !!b && x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h;
const T = () => S.after.t;

// --- the card's parts: where each big part stands on its card --------------------
// The mock's plaque, a grid of CARD_COLS by CARD_ROWS cells of CARD_CELL
// screen px, its part above the gauge's row; every hit and every drawing of a
// part reads it here (render/aftercard.js). In card px, off the grid's
// top-left. `box` is where a press takes hold of the part: anywhere else on
// the paper is nothing. Each table row in cells: a ring's middle and radius,
// or a box's columns and rows, both ends in.
const C = CARD_CELL;
export const CARD_W = CARD_COLS * C, CARD_H = CARD_ROWS * C;
export const CARD_FLOOR = 12 * C;            // the floor line the heap's and the stump's parts stand on
export const CARD_GAUGE_ROW = 14;            // the gauge's row of cells
const cellBox = (c0, r0, c1, r1) => ({ x: c0 * C, y: r0 * C, w: (c1 - c0 + 1) * C, h: (r1 - r0 + 1) * C });
const ringAt = (c, r, rad, reach) => ({ x: (c + 0.5) * C, y: (r + 0.5) * C, r: rad * C, reach: reach * C });
const WHEEL = ringAt(9, 6, 5.5, 8), BUTTON = ringAt(7, 6, 5, 7);
const CARD_PARTS = {
  tree:      { box: cellBox(0, 4, CARD_COLS - 1, 10), saw: { x: 6.5 * C, y: 7 * C } },
  stump:     { box: cellBox(5, 0, 17, 12), at: { x: 11.5 * C, y: CARD_FLOOR - 2 * C } },
  mill:      { box: { x: WHEEL.x - WHEEL.reach, y: WHEEL.y - WHEEL.reach, w: WHEEL.reach * 2, h: WHEEL.reach * 2 }, wheel: WHEEL },
  chipper:   { box: { x: BUTTON.x - BUTTON.reach, y: BUTTON.y - BUTTON.reach, w: BUTTON.reach * 2, h: BUTTON.reach * 2 }, button: BUTTON },
  papermill: { box: cellBox(2, 0, 26, 12), vat: { x: 14.5 * C, y: 7.5 * C, rx: 11 * C, ry: 4.5 * C } },
  workshop:  { box: cellBox(0, 0, 23, 12), nails: [6, 10, 14, 18] },
  press:     { box: cellBox(6, 0, CARD_COLS - 1, 13), bar: { x: 3.5 * C, y: 2.5 * C, len: 19 * C, a0: -0.05, a1: 0.5 } },
  heap:      { box: cellBox(0, 3, 11, 13), edge: 23 * C }
};
// A press on a ring part is a press within its reach of the middle; on the
// rest, within its box.
const ringOf = key => CARD_PARTS[key].wheel || CARD_PARTS[key].button;
function onPart(key, x, y) {
  const ring = ringOf(key);
  if (ring) return Math.hypot(x - ring.x, y - ring.y) <= ring.reach;
  return inBox(x, y, CARD_PARTS[key].box);
}

// --- where each station's parts stand: the one adapter ---------------------------
// Every hit and every cue reads a part here and nowhere else. A carded
// station's are on its card, in card px (the table above):
//   box    where a press takes hold (every key)
//   wheel  { x, y, r }       the saw mill's flywheel
//   button { x, y, r }       the chipper's feed
//   vat    { x, y, rx, ry }  the paper mill's vat
//   bar    { x, y, len }     the press's bar: its pivot, pulled down from level
//   edge   x                 the heap's tipping edge
//   saw    { x, y }          the tree's saw handle at rest
//   at     { x, y }          the stump's grip at rest
// The pedestal's are in world px, off its drawing (place.js, `stationParts`).
export const partsOf = key => (key === 'pedestal' ? stationParts('pedestal') : CARD_PARTS[key]);

// The pedestal's bubbles are the pair's speech rising (Track A, bubbles.js):
// `list()` the bubbles in the air, each { x, y, w, h, big } a world box, and
// `pop(b)` true if it took the pop (the bubble goes, its pop drawn there).
// Until they rise, none: a click on the pair is their plain line (rebel.js).
let BUBBLES = { list: () => [], pop: () => false };
export const useBubbles = api => { BUBBLES = api || { list: () => [], pop: () => false }; };
const bubbleAt = (x, y) => {
  const list = BUBBLES.list() || [], s = GESTURE_BUBBLE_SLACK;
  for (let k = list.length - 1; k >= 0; k--) {
    const b = list[k];
    if (x >= b.x - s && x < b.x + b.w + s && y >= b.y - s && y <= b.y + b.h + s) return b;
  }
  return null;
};
// The lowest bubble in the air, the one the pad pops and the hand points at.
export const lowestBubble = () => (BUBBLES.list() || []).reduce((a, b) => (!a || b.y > a.y ? b : a), null);

// --- the hand's state, a station a record ----------------------------------------------
// `uses` the motions done since the ghost hand last showed, `cueA` its ink,
// `gv` the gauge's eased speed and `gaugeA` its ink, `marks` the crits' (a
// mark on a card is in card px, `card` true; the pedestal's in the world).
const fresh = () => ({ uses: 0, lastUse: null, cueA: 1, gv: 0, gaugeA: 0, marks: [] });
function used(g) { g.uses++; g.lastUse = T(); }
function crit(g, x, y, n, card = false) { g.marks.push({ x, y, n, at: T(), card }); }

// A stump's wobbles come on a gap of their own, off a fixed sequence rather
// than the act's chance (util.js), so the hand never moves the sim's stream.
const gapAt = n => { const f = Math.sin((n + 1) * 12.9898) * 43758.5453; const [a, b] = GESTURE_WOBBLE_GAP; return a + (f - Math.floor(f)) * (b - a); };
// A load's worth of the fling's speed: a step up the gauge's thirds.
export const loadsAt = v => clamp(1 + Math.floor((v - GESTURE_FLING_MIN) / ((GESTURE_FLING_MAX - GESTURE_FLING_MIN) / GESTURE_FLING_LOADS)), 1, GESTURE_FLING_LOADS);
const feedOf = g => (g.hold ? GESTURE_FEED_SLOW + (GESTURE_FEED_FAST - GESTURE_FEED_SLOW) * Math.min(1, g.held / GESTURE_FEED_RAMP_S) : 0);
const revOf = g => Math.abs(g.w) / (2 * Math.PI);
// The heap's edge is to the right of its load on the card.
const HEAP_DIR = Math.sign(CARD_PARTS.heap.edge - CARD_PARTS.heap.box.x);
const loadFloor = () => CARD_FLOOR - C * 2;
// The heap's fling: px a second toward the edge, over the drag's last window.
function flingSpeed(g) {
  const a = g.pts[0], b = g.pts[g.pts.length - 1];
  if (!a || b.t - a.t < 1e-3 || T() - b.t > GESTURE_FLING_WINDOW_S) return 0;
  return (b.x - a.x) / (b.t - a.t) * HEAP_DIR;
}
// A load tipped through the notch, `n` of them: what went.
function tip(g, n) {
  let k = 0;
  while (k < n && tipSawdust() > 0) k++;
  if (k) used(g);
  return k;
}

// Each station's motion: `down` taking it ('tap' when nothing is held after),
// `move`, `up`, `step(g, dt)` a frame, `speed(g)` the gauge's share, and
// `open()` whether it can be worked now at all. Every point is on the card,
// in card px, but the pedestal's, which are in the world.
const DEFS = {
  pedestal: {
    init: () => ({}),
    open: () => built('pedestal') && !pairBuilding(),
    down(g, h) {
      if (!BUBBLES.pop(h.b)) return 'tap';
      const n = h.b.big ? GESTURE_BUBBLE_CRIT : 1;
      if (workAfter('pedestal', n, true, { x: h.b.x + h.b.w / 2, y: h.b.y + h.b.h / 2 })) {
        used(g);
        if (h.b.big) crit(g, h.b.x + h.b.w / 2, h.b.y + h.b.h / 2, n);
      }
      return 'tap';
    }
  },
  tree: {
    init: () => ({ i: null, s: 0, target: 0, s0: 0, gx: 0, from: 0, v: 0, grab: false }),
    open: () => !!S.after.axe && trees().some(standing),
    down(g, h, x) {
      if (g.i !== h.i) Object.assign(g, { i: h.i, s: 0, target: 0, from: 0 });
      g.grab = true; g.gx = x; g.s0 = g.target;
      return true;
    },
    move(g, x) { g.target = clamp(g.s0 + (x - g.gx), -GESTURE_SAW_AMP, GESTURE_SAW_AMP); },
    up(g) { g.grab = false; },
    step(g, dt) {
      const p = g.i != null && trees()[g.i];
      if (!p || !standing(p)) { g.v *= Math.exp(-6 * dt); g.from = 0; return; }
      const prev = g.s;
      g.s += clamp((g.target - g.s) * Math.min(1, dt * GESTURE_SAW_FOLLOW), -GESTURE_SAW_VMAX * dt, GESTURE_SAW_VMAX * dt);
      g.v += (Math.abs(g.s - prev) / dt - g.v) * Math.min(1, dt * GESTURE_SAW_EASE);
      const end = g.s <= -GESTURE_SAW_END * GESTURE_SAW_AMP ? -1 : g.s >= GESTURE_SAW_END * GESTURE_SAW_AMP ? 1 : 0;
      // A stroke is end to end: the first end reached only sets the saw going.
      if (end && end !== g.from) { if (g.from && chopTree(g.i, true)) used(g); g.from = end; }
    },
    speed: g => g.v / GESTURE_SAW_VMAX
  },
  stump: {
    init: () => ({ i: null, lift: 0, target: 0, y0: 0, grab: false, strain: 0, wob: -1e9, next: null, n: 0, winLift: 0 }),
    open: () => trees().some(stumped),
    down(g, h, x, y) {
      if (g.i !== h.i) Object.assign(g, { i: h.i, lift: 0, target: 0, strain: 0, wob: -1e9, next: null });
      g.grab = true; g.y0 = y + g.lift / GESTURE_STUMP_DRAG;
      return true;
    },
    move(g, x, y) { g.target = clamp((g.y0 - y) * GESTURE_STUMP_DRAG, 0, GESTURE_STUMP_MAX); },
    up(g) { g.grab = false; },
    step(g, dt) {
      const p = g.i != null && trees()[g.i];
      if (!p || !stumped(p)) { g.lift = Math.max(0, g.lift - GESTURE_STUMP_SINK * dt); g.grab = false; return; }
      if (g.grab) g.lift += (g.target - g.lift) * Math.min(1, dt * GESTURE_STUMP_FOLLOW);
      else g.lift = Math.max(0, g.lift - GESTURE_STUMP_SINK * dt);
      const t = T();
      if (g.next == null) g.next = t + gapAt(g.n++);
      if (t >= g.next) { g.wob = t; g.winLift = g.lift; g.next = t + gapAt(g.n++); }
      if (g.grab && t - g.wob < GESTURE_WINDOW_S && g.lift >= GESTURE_YANK_LIFT && g.lift - g.winLift >= GESTURE_YANK_GAIN) {
        // The yank as the roots give: every root left at once.
        let n = 0;
        while (stumped(p) && digStump(g.i, true)) n++;
        const at = CARD_PARTS.stump.at;
        used(g); crit(g, at.x, at.y - C * 4, n, true);
        g.grab = false; g.wob = -1e9;
      } else if (g.grab && g.lift >= GESTURE_STRAIN_LIFT) {
        g.strain += dt;
        if (g.strain >= GESTURE_STRAIN_S) { g.strain = 0; if (digStump(g.i, true)) used(g); }
      } else g.strain = 0;
    }
    // No gauge: the stump is not a speed but a moment (its wobble, drawn).
  },
  mill: {
    init: () => ({ ang: 0, w: 0, grab: false, pa: 0, acc: 0, prog: 0 }),
    open: () => built('mill'),
    down(g, h, x, y) { const c = WHEEL; g.grab = true; g.pa = Math.atan2(y - c.y, x - c.x); return true; },
    move(g, x, y) {
      const c = WHEEL, na = Math.atan2(y - c.y, x - c.x), d = wrap(na - g.pa);
      g.ang += d; g.acc += d; g.pa = na;
    },
    up(g) { g.grab = false; },
    step(g, dt) {
      if (g.grab) { g.w += (g.acc / dt - g.w) * Math.min(1, dt * GESTURE_WHEEL_EASE); g.acc = 0; }
      else { g.w *= Math.exp(-GESTURE_WHEEL_COAST * dt); g.ang += g.w * dt; }
      const r = Math.min(revOf(g), GESTURE_WHEEL_MAX_REV);
      if (r <= GESTURE_WHEEL_MIN_REV) return;
      // Fed to the end of the log, it is cut when there is a log to cut; with
      // none on the pile (or the heap full) the blade runs on, waiting.
      g.prog = Math.min(GESTURE_WHEEL_LOG, g.prog + GESTURE_WHEEL_FEED * r * dt);
      if (g.prog >= GESTURE_WHEEL_LOG && workAfter('mill', 1, true)) { g.prog = 0; used(g); }
    },
    speed: g => revOf(g) / GESTURE_WHEEL_MAX_REV
  },
  chipper: {
    init: () => ({ hold: false, held: 0, prog: 0 }),
    open: () => built('chipper'),
    down(g) { g.hold = true; g.held = 0; return true; },
    up(g) { g.hold = false; g.held = 0; },
    step(g, dt) {
      if (!g.hold) return;
      g.held += dt;
      g.prog = Math.min(GESTURE_FEED_LOG, g.prog + feedOf(g) * dt);
      if (g.prog >= GESTURE_FEED_LOG && workAfter('chipper', 1, true)) { g.prog = 0; used(g); }
    },
    speed: g => feedOf(g) / GESTURE_FEED_FAST
  },
  papermill: {
    init: () => ({ ang: 0, w: 0, grab: false, pa: 0, acc: 0, prog: 0 }),
    open: () => built('papermill'),
    angle(x, y) { const v = CARD_PARTS.papermill.vat; return Math.atan2((y - v.y) / v.ry, (x - v.x) / v.rx); },
    down(g, h, x, y) { g.grab = true; g.pa = this.angle(x, y); return true; },
    move(g, x, y) { const na = this.angle(x, y), d = wrap(na - g.pa); g.ang += d; g.acc += d; g.pa = na; },
    up(g) { g.grab = false; },
    step(g, dt) {
      if (g.grab) { g.w += (g.acc / dt - g.w) * Math.min(1, dt * GESTURE_STIR_EASE); g.acc = 0; }
      else { g.w *= Math.exp(-GESTURE_STIR_COAST * dt); g.ang += g.w * dt; return; }
      g.prog = Math.min(GESTURE_STIR_TURNS, g.prog + Math.min(revOf(g), GESTURE_STIR_MAX_REV) * dt);
      if (g.prog >= GESTURE_STIR_TURNS && workAfter('papermill', 1, true)) { g.prog = 0; used(g); }
    },
    speed: g => revOf(g) / GESTURE_STIR_MAX_REV
  },
  workshop: {
    init: () => ({ strike: -1e9, blows: 0, taps: [] }),
    open: () => built('workshop'),
    down(g) {
      const t = T();
      if (t - g.strike < GESTURE_SWING_S) return 'tap';
      g.strike = t; g.taps.push(t);
      g.blows = Math.min(GESTURE_SIGN_BLOWS, g.blows + 1);
      used(g);
      if (g.blows >= GESTURE_SIGN_BLOWS && workAfter('workshop', 1, true)) g.blows = 0;
      return 'tap';
    },
    step(g) { const t = T(); g.taps = g.taps.filter(s => t - s < 1); },
    speed: g => g.taps.length / GESTURE_TAPS_MAX
  },
  press: {
    init: () => ({ k: 0, want: 0, grab: false, gy: 0, k0: 0, printed: false, w: 0 }),
    open: () => built('press'),
    down(g, h, x, y) { g.grab = true; g.gy = y; g.k0 = g.k; g.want = g.k; return true; },
    move(g, x, y) { g.want = clamp(g.k0 + (y - g.gy) / GESTURE_BAR_DRAG, 0, 1); },
    up(g) { g.grab = false; },
    step(g, dt) {
      const before = g.k;
      if (g.grab) g.k += clamp(g.want - g.k, -GESTURE_BAR_RATE * dt, GESTURE_BAR_RATE * dt);
      else g.k = Math.max(0, g.k - GESTURE_BAR_RETURN * dt);
      g.w += (Math.max(0, g.k - before) / dt - g.w) * Math.min(1, dt * GESTURE_BAR_EASE);
      if (g.k < GESTURE_BAR_RESET) g.printed = false;
      if (g.k >= GESTURE_BAR_PRINT && !g.printed) { g.printed = true; if (workAfter('press', 1, true)) used(g); }
    },
    speed: g => g.w / GESTURE_BAR_RATE
  },
  heap: {
    init: () => ({ grab: false, pts: [], v: 0, load: null }),
    open: () => !built('papermill') && S.after.stock.sawdust > 0,
    down(g, h, x, y) {
      if (g.load && g.load.mode !== 'gone') return 'tap';
      g.grab = true; g.pts = [{ t: T(), x }];
      g.load = { mode: 'held', x, x0: x, y: Math.min(y, loadFloor()), n: 1, at: T() };
      return true;
    },
    move(g, x, y) {
      const t = T();
      g.pts.push({ t, x });
      while (g.pts.length > 2 && t - g.pts[0].t > GESTURE_FLING_WINDOW_S) g.pts.shift();
      if (g.load) { g.load.x = x; g.load.y = Math.min(y, loadFloor()); }
    },
    up(g) {
      g.grab = false;
      const ld = g.load, v = flingSpeed(g), edge = CARD_PARTS.heap.edge;
      if (!ld) return;
      if (v >= GESTURE_FLING_MIN) {
        Object.assign(ld, { mode: 'fling', n: loadsAt(v), vx: HEAP_DIR * Math.max(v, GESTURE_FLING_MIN * 1.5), vy: -GESTURE_FLING_LIFT, at: T() });
      } else if (ld.x >= edge) { tip(g, 1); Object.assign(ld, { mode: 'gone', at: T() }); }
      else Object.assign(ld, { mode: 'back', at: T() });
    },
    step(g, dt) {
      g.v = g.grab ? flingSpeed(g) : g.v * Math.exp(-3 * dt);
      const ld = g.load;
      if (!ld) return;
      if (ld.mode === 'fling') {
        ld.vy += GESTURE_FLING_GRAV * dt;
        ld.x += ld.vx * dt;
        ld.y = Math.min(ld.y + ld.vy * dt, loadFloor());
        // Over the edge, it tips there: the loads go through the notch.
        if (ld.x * HEAP_DIR >= CARD_PARTS.heap.edge * HEAP_DIR) { tip(g, ld.n); Object.assign(ld, { mode: 'gone', at: T() }); }
      } else if (ld.mode !== 'held' && T() - ld.at > GESTURE_LOAD_FADE_S) g.load = null;
    },
    speed: g => Math.max(0, g.v) / GESTURE_FLING_MAX
  }
};
export const GESTURE_KEYS = Object.keys(DEFS);
// Every station but the pedestal is worked on a card.
export const CARD_KEYS = GESTURE_KEYS.filter(k => k !== 'pedestal');

// The records, for this `S.after`: a new game or a read save stands them all
// still, nothing held and every card shut.
let G = null, seen = null, held = null, CARDS = [], open = null, opened = null, lastPress = null;
function recs() {
  if (seen !== S.after) {
    seen = S.after; held = null; CARDS = []; open = null; opened = null; lastPress = null;
    G = Object.fromEntries(GESTURE_KEYS.map(k => [k, { ...fresh(), ...DEFS[k].init() }]));
  }
  return G;
}
const live = () => afterlifeOn() && !!S.after;

// --- the cards ---------------------------------------------------------------------------
// A card is { key, i, a, want, wx, y }: its station (and plot, for the
// grove's), its ink, whether it is the one open, its left edge in the world
// (so a pan carries it rigidly with its station) and its top on the glass.
// One is open at a time; a swap fades one out as the other comes in, and the
// two make room for each other while both are up.
export const CARD_FULL_W = CARD_W + CARD_PAD * 2, CARD_FULL_H = CARD_H + CARD_HEAD + CARD_PAD;
const glassW = () => S.viewW * S.zoom;
const toSx = wx => (wx - S.camX) * S.zoom;
const toSy = wy => (wy - S.camY) * S.zoom;
const toWx = sx => sx / S.zoom + S.camX;
const toWy = sy => sy / S.zoom + S.camY;

// A station's box in the world, and the point on it the card's tail is
// aimed at: the part that moves with the hand.
function siteBox(key, i) {
  if (key === 'tree') return stationParts('tree', i).box;
  if (key === 'stump') return stationParts('stump', i).stump;
  if (key === 'heap') return stationParts('heap').heap;
  return stationBox(key);
}
function aimX(key, i) {
  const p = stationParts(key, i), mid = b => b.x + b.w / 2;
  if (key === 'tree') return p.saw.x;
  if (key === 'stump') return p.at.x;
  if (key === 'heap') return mid(p.heap);
  if (key === 'mill') return p.wheel.x;
  if (key === 'papermill') return p.vat.x;
  if (key === 'chipper') return mid(p.mouth);
  if (key === 'workshop') return mid(p.hammer);
  if (key === 'press') return mid(p.knob);
  return mid(siteBox(key, i));
}
// Everything standing on the floor a card could hang over: the stations up,
// and the grove's trees and stumps.
function standingBoxes() {
  const out = [];
  for (const key of ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal']) {
    const b = built(key) && stationBox(key);
    if (b) out.push(b);
  }
  trees().forEach((p, i) => { if (standing(p)) out.push(stationParts('tree', i).box); else if (stumped(p)) out.push(stationParts('stump', i).stump); });
  if (built('mill')) out.push(stationParts('heap').heap);
  return out;
}
// Where a card wants to stand, on the glass: over its part, kept on the
// glass, its tail's tip CARD_GAP over the tallest thing under its width.
function idealAt(key, i, boxes) {
  const sx = toSx(aimX(key, i)), own = toSy(siteBox(key, i).y);
  const x = clamp(sx - CARD_FULL_W / 2, CARD_EDGE, Math.max(CARD_EDGE, glassW() - CARD_FULL_W - CARD_EDGE));
  let top = own;
  for (const b of boxes) {
    const bx0 = toSx(b.x), bx1 = toSx(b.x + b.w);
    if (bx1 > x && bx0 < x + CARD_FULL_W) top = Math.min(top, toSy(b.y));
  }
  return { x, y: Math.max(CARD_EDGE, top - CARD_GAP - CARD_TAIL - CARD_FULL_H), sx, top: own };
}
// The cards on the glass with where each wants to be: an arriving card takes
// its place over its station, a leaving one slides aside by the overlap; two
// held together each move half of it.
function layout() {
  const boxes = standingBoxes();
  const L = CARDS.map(c => ({ c, ...idealAt(c.key, c.i, boxes) })).sort((a, b) => a.sx - b.sx);
  const W = glassW();
  for (let k = 0; k + 1 < L.length; k++) {
    const a = L[k], b = L[k + 1], over = a.x + CARD_FULL_W + CARD_ROOM - b.x;
    if (over <= 0) continue;
    if (a.c.want && b.c.want) { a.x -= over / 2; b.x += over / 2; }
    else if (a.c.want) b.x += over; else a.x -= over;
    if (a.c.want && a.x < CARD_EDGE) { b.x += CARD_EDGE - a.x; a.x = CARD_EDGE; }
    if (b.c.want && b.x > W - CARD_FULL_W - CARD_EDGE) { a.x -= b.x - (W - CARD_FULL_W - CARD_EDGE); b.x = W - CARD_FULL_W - CARD_EDGE; }
  }
  return L;
}
// A card's rectangle on the glass now: the card, the grid's top-left inside
// it (`ix`, `iy`), its tail's column and the station's top it points down at.
function rectOf(c) {
  const x = Math.round(toSx(c.wx)), y = Math.round(c.y);
  return { x, y, w: CARD_FULL_W, h: CARD_FULL_H, ix: x + CARD_PAD, iy: y + CARD_HEAD,
           sx: toSx(aimX(c.key, c.i)), top: toSy(siteBox(c.key, c.i).y) };
}
const onCard = (r, sx, sy) => sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h + CARD_TAIL;
// The card a press lands on: the open one, once it is mostly in.
const shownCard = () => CARDS.find(c => c.want && c.a > 0.5) || null;

// A station a click can open a card on, under a world point: { key, i }.
function siteAt(x, y) {
  if (DEFS.tree.open()) { const i = treeAt(x, y); if (i != null) return { key: 'tree', i }; }
  if (DEFS.stump.open()) { const i = stumpAt(x, y); if (i != null) return { key: 'stump', i }; }
  for (const key of CARD_KEYS) {
    if (key === 'tree' || key === 'stump' || !DEFS[key].open()) continue;
    const b = key === 'heap' ? stationParts('heap').box : stationBox(key);
    if (inBox(x, y, b)) return { key, i: 0 };
  }
  return null;
}
// The plot a pad's card on the grove stands on: the first that can be worked.
const plotOf = key => (key === 'tree' ? trees().findIndex(standing) : key === 'stump' ? trees().findIndex(stumped) : 0);

// Open station `key`'s card (plot `i` for the grove's), shutting any other;
// `touch` when a finger opened it, so it shuts once its station is off the
// glass. True if it is open now.
export function openCard(key, i = plotOf(key), touch = false) {
  if (!live() || !CARD_KEYS.includes(key) || i < 0) return false;
  recs();
  if (held && held !== key) gestureUp();
  open = { key, i }; opened = { touch };
  for (const c of CARDS) c.want = c.key === key && c.i === i;
  if (!CARDS.some(c => c.want)) CARDS.push({ key, i, a: 0, want: true, wx: null, y: null });
  return true;
}
export function closeCard() {
  if (!S.after || seen !== S.after) return;
  if (held && held !== 'pedestal') gestureUp();
  open = null;
  for (const c of CARDS) c.want = false;
}
// The card open now, { key, i }, or null.
export const cardOpen = () => (live() && seen === S.after && open ? { ...open } : null);
// The open card stepped to the neighboring station along the camp (the pad's
// LB and RB): the stop it now stands on, or null at the end.
export function stepCard(dir) {
  const list = gestureStops().filter(s => s.key !== 'pedestal').sort((a, b) => (a.r.x + a.r.w / 2) - (b.r.x + b.r.w / 2));
  const from = open ? list.findIndex(s => s.key === open.key) : -1;
  const next = from >= 0 ? list[from + dir] : null;
  if (!next || !openCard(next.key)) return null;
  return `ag:${next.key}`;
}
// Whether a card's station still stands to be worked: the tree's card turns
// to its stump's once it is down, and a station that cannot be worked again
// shuts its card.
function settleOpen() {
  if (!open) return;
  const p = trees()[open.i];
  if (open.key === 'tree' && !(p && standing(p))) {
    if (p && p.fall != null) return;          // still falling
    if (p && stumped(p)) openCard('stump', open.i, opened.touch); else closeCard();
    return;
  }
  // Pulled out, the stump's card stays while the yank's mark is on it.
  if (open.key === 'stump' && !(p && stumped(p))) { if (!G.stump.marks.length) closeCard(); return; }
  if (open.key === 'heap' ? built('papermill') || !built('mill') : !DEFS[open.key].open()) { closeCard(); return; }
  // On a phone the card shuts once its station is off the glass.
  if (opened.touch) {
    const b = siteBox(open.key, open.i), x0 = toSx(b.x), x1 = toSx(b.x + b.w);
    if (x1 < 0 || x0 > glassW()) closeCard();
  }
}
function stepCards(dt) {
  settleOpen();
  for (const c of CARDS) c.a = clamp(c.a + (c.want ? dt / CARD_IN_S : -dt / CARD_OUT_S), 0, 1);
  CARDS = CARDS.filter(c => c.want || c.a > 0);
  // Each eases to where it stands, in the world's px along and the glass's
  // up, so a card that has to make room slides there and a pan carries it.
  const f = Math.min(1, dt * CARD_EASE);
  for (const L of layout()) {
    const c = L.c, wx = toWx(L.x);
    if (c.wx == null) { c.wx = wx; c.y = L.y; continue; }
    c.wx += (wx - c.wx) * f; c.y += (L.y - c.y) * f;
  }
}
// The cards for the drawing (render/aftercard.js): each with its rectangle
// on the glass, its ink and its station's record, the open one last.
export function cardsView() {
  if (!live()) return [];
  const g = recs();
  return CARDS.filter(c => c.wx != null && c.a > 0)
    .sort((a, b) => (a.want ? 1 : 0) - (b.want ? 1 : 0))
    .map(c => ({ ...g[c.key], key: c.key, i: c.i, a: c.a, want: c.want, rect: rectOf(c), held: held === c.key,
                 gauge: !!DEFS[c.key].speed, open: DEFS[c.key].open() }));
}
// A point on the open card's grid, in card px, as a world point the pointer
// would give: for the checks, and for the scenes that work a card.
export function cardToWorld(x, y) {
  const c = live() && shownCard();
  if (!c) return null;
  const r = rectOf(c);
  return { x: toWx(r.ix + x), y: toWy(r.iy + y) };
}

// --- the pointer -----------------------------------------------------------------------
// A press on the place, in world px: true if the hand work took it. On the
// open card it is the card's, worked on its part and nothing anywhere else on
// its paper; on a bubble the bubble's; on a station it opens that station's
// card. A press on anything else shuts the card and is still the place's
// click (input.js tries this before `clickAfter`). A finger (`touch`) only
// takes a station or the floor at its release (`gestureTap`), since a press
// there may be the start of a swipe.
export function gestureDown(x, y, touch = false) {
  if (!live()) return false;
  const g = recs();
  held = null;
  const c = shownCard();
  if (c) {
    const r = rectOf(c), sx = toSx(x), sy = toSy(y);
    if (onCard(r, sx, sy)) {
      lastPress = 'card';
      const lx = sx - r.ix, ly = sy - r.iy, d = DEFS[c.key];
      if (ly >= 0 && d.open() && onPart(c.key, lx, ly) && d.down(g[c.key], { i: c.i }, lx, ly) === true) held = c.key;
      return true;
    }
  }
  if (DEFS.pedestal.open()) {
    const b = bubbleAt(x, y);
    if (b) { lastPress = 'bubble'; DEFS.pedestal.down(g.pedestal, { b }); return true; }
  }
  const site = siteAt(x, y);
  lastPress = site ? 'site' : 'floor';
  if (touch) return !!site;
  return gestureTap(x, y);
}
// A tap's release: on a station, its card opened (or kept, if it is the one
// open), true; anywhere else the card shut and false, so the tap is still
// whatever else it is. A press that began on a card or a bubble is not a tap
// of this kind.
export function gestureTap(x, y, touch = false) {
  if (!live() || lastPress === 'card' || lastPress === 'bubble') return false;
  recs();
  const site = siteAt(x, y);
  if (site) { if (!open || open.key !== site.key || open.i !== site.i) openCard(site.key, site.i, touch); return true; }
  closeCard();
  return false;
}
// Whether a press at a world point would be the hand work's, asked without
// pressing: a finger landing there is the game's, never a scroll. The open
// card's paper is the game's whole, so a slip on it never pans.
export function gestureUnder(x, y) {
  if (!live()) return false;
  recs();
  const c = shownCard();
  if (c && onCard(rectOf(c), toSx(x), toSy(y))) return true;
  return DEFS.pedestal.open() && !!bubbleAt(x, y);
}
// The held card's point under a world point, in its card px.
function local(x, y) {
  const c = CARDS.find(k => k.key === held && k.want) || CARDS.find(k => k.key === held);
  if (!c || c.wx == null) return null;
  const r = rectOf(c);
  return { x: toSx(x) - r.ix, y: toSy(y) - r.iy };
}
export function gestureMove(x, y) {
  if (!live() || !held) return;
  const d = DEFS[held], p = local(x, y);
  if (d.move && p) d.move(recs()[held], p.x, p.y);
}
export function gestureUp(x, y) {
  if (!held || !S.after) { held = null; return; }
  const d = DEFS[held], p = x == null ? null : local(x, y);
  if (d.up) d.up(recs()[held], p && p.x, p && p.y);
  held = null;
}
// The station a press is holding now, or null.
export const gestureHeld = () => (S.after && seen === S.after ? held : null);

// --- a frame ---------------------------------------------------------------------------
// Every station's motion one frame along, then its cue's inks: the ghost hand
// out after GESTURE_CUE_USES motions and back after GESTURE_CUE_IDLE_S idle, the
// gauge in while it moves, the crits' marks held and gone; then the cards.
export function stepGestures(c) {
  if (!live()) return;
  const g = recs(), dt = secs(c);
  if (dt <= 0) return;
  const t = T();
  for (const key of GESTURE_KEYS) {
    const d = DEFS[key], r = g[key];
    if (d.step) d.step(r, dt);
    if (r.lastUse != null && r.uses >= GESTURE_CUE_USES && t - r.lastUse >= GESTURE_CUE_IDLE_S) r.uses = 0;
    const want = r.uses < GESTURE_CUE_USES ? 1 : 0;
    r.cueA = clamp(r.cueA + clamp(want - r.cueA, -dt / GESTURE_CUE_FADE_S, dt / GESTURE_CUE_FADE_S), 0, 1);
    if (d.speed) {
      r.gv += (clamp(d.speed(r), 0, 1) - r.gv) * Math.min(1, dt * GESTURE_GAUGE_EASE);
      const on = held === key || r.gv > 0.02 ? 1 : 0;
      r.gaugeA = clamp(r.gaugeA + clamp(on - r.gaugeA, -dt / GESTURE_GAUGE_FADE_S, dt / GESTURE_GAUGE_FADE_S), 0, 1);
    }
    if (r.marks.length) r.marks = r.marks.filter(m => t - m.at < GESTURE_MARK_HOLD_S + GESTURE_MARK_FADE_S);
  }
  stepCards(dt);
}

// --- the pad ---------------------------------------------------------------------------
// The mock's pad lines, a frame of the pad on the station under its focus:
// `{ a, pressed, released, lx, ly }`, A down, pressed and let go this frame,
// and the left stick. Each is turned into the motion the pointer makes on the
// card's part; a carded station is worked only with its card open (pad.js
// opens it on A).
let flick = 0;
export function padGesture(key, p) {
  if (!live() || !DEFS[key] || !DEFS[key].open()) return;
  if (key !== 'pedestal' && !(open && open.key === key)) return;
  const g = recs(), r = g[key], d = DEFS[key];
  if (key === 'pedestal') {                   // A pops the lowest bubble
    const b = p.pressed && lowestBubble();
    if (b) d.down(r, { b });
  } else if (key === 'tree') {                // the stick side to side saws; faster saws faster
    const i = open.i;
    if (!trees()[i] || !standing(trees()[i])) return;
    if (r.i !== i) Object.assign(r, { i, s: 0, target: 0, from: 0 });
    r.grab = true;
    r.target = clamp(p.lx, -1, 1) * GESTURE_SAW_AMP;
  } else if (key === 'stump') {               // mash A pulls; a press as it wobbles yanks it out
    const i = open.i;
    if (!trees()[i] || !stumped(trees()[i])) return;
    if (r.i !== i) Object.assign(r, { i, lift: 0, target: 0, strain: 0, wob: -1e9, next: null });
    if (p.pressed) { r.grab = true; r.target = Math.min(GESTURE_STUMP_MAX, Math.max(r.target, r.lift) + GESTURE_PAD_PULL); }
    else if (!p.a) { r.grab = false; r.target = 0; }
  } else if (key === 'mill' || key === 'papermill') {   // the stick's turn spins the wheel, stirs the vat
    const m = Math.hypot(p.lx, p.ly);
    if (m < GESTURE_PAD_TURN) { if (held === key) gestureUp(); else r.grab = false; return; }
    const pt = key === 'mill' ? WHEEL : CARD_PARTS.papermill.vat;
    const x = pt.x + p.lx / m * (pt.r || pt.rx), y = pt.y + p.ly / m * (pt.r || pt.ry);
    if (!r.grab) { d.down(r, {}, x, y); held = key; } else d.move(r, x, y);
  } else if (key === 'chipper') {             // hold A feeds; the longer, the faster
    if (p.pressed) { d.down(r); held = key; }
    if (p.released) gestureUp();
  } else if (key === 'workshop') {            // mash A; faster builds faster
    if (p.pressed) d.down(r);
  } else if (key === 'press') {               // the stick down pulls the bar
    r.grab = p.ly > 0;
    r.want = clamp(p.ly, 0, 1);
  } else if (key === 'heap') {                // a flick toward the edge; harder tips more
    const push = p.lx * HEAP_DIR;
    if (push > flick) flick = push;
    if (push <= 0 && flick > 0) {
      const v = flick * GESTURE_FLING_MAX;
      flick = 0;
      if (v >= GESTURE_FLING_MIN && !(r.load && r.load.mode !== 'gone')) {
        const b = CARD_PARTS.heap.box;
        r.load = { mode: 'fling', x: b.x + C, x0: b.x + C, y: CARD_FLOOR - C * 3, n: loadsAt(v), vx: HEAP_DIR * Math.max(v, GESTURE_FLING_MIN * 1.5),
                   vy: -GESTURE_FLING_LIFT, at: T() };
        r.v = v;
      }
    }
  }
}

// The stations a pad's focus can stand on up here: every one open now, by
// its station's box in the world, left to right (stops.js).
export function gestureStops() {
  if (!live()) return [];
  const out = [];
  for (const key of GESTURE_KEYS) {
    if (!DEFS[key].open()) continue;
    if (key === 'tree' || key === 'stump') {
      const i = trees().findIndex(key === 'tree' ? standing : stumped);
      if (i >= 0) out.push({ key, r: stationParts(key, i).box });
    } else out.push({ key, r: stationParts(key).box });
  }
  return out;
}

// --- for the drawing (render/after/stations.js, render/aftercues.js) -------------------
// Each station's record and whether it can be worked now, read, never kept.
export function gestureView() {
  if (!live()) return null;
  const g = recs();
  return GESTURE_KEYS.map(key => ({ key, open: DEFS[key].open(), held: held === key, gauge: !!DEFS[key].speed, ...g[key] }));
}
// A stump's wobble now, and its window still open (the drawing shakes it).
export function stumpWobble() {
  if (!live()) return null;
  const r = recs().stump, t = T();
  return r.i == null ? null : { i: r.i, wobbling: t - r.wob < GESTURE_WOBBLE_S, open: t - r.wob < GESTURE_WINDOW_S, lift: r.lift };
}
