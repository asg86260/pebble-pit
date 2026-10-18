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
// The work itself is the sim's and is reached only the way the click reached
// it: `workAfter` for the stations, the grove's own chop and dig, the heap's
// tip. A member at a post works the same station alongside the hand, as with
// the click. What is kept here is the hand's own motion -- where the saw's
// handle is, how fast the wheel turns, how far the stump is up -- and it is
// this session's: a reload stands every station still, and the ghost hand
// shows again until the motion has been done GESTURE_CUE_USES times.
//
// Time is the act's clock (`S.after.t`): the pointer only moves things, and
// `stepGestures` turns what it moved into speed a frame, so a check turns the
// clock with `run` and reads a fact about the game, not about the machine.

import { S } from '../state.js';
import { P, GESTURE_CUE_USES, GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_GAUGE_EASE, GESTURE_GAUGE_FADE_S,
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
         GESTURE_FLING_LIFT, GESTURE_LOAD_FADE_S, GESTURE_PAD_PULL, GESTURE_PAD_TURN } from '../config.js';
import { afterlifeOn } from '../acts.js';
import { secs } from './util.js';
import { built } from './levels.js';
import { afterFloor, heapX, notchX, stationParts } from './place.js';
import { treeAt, stumpAt, standing, stumped, chopTree, digStump, trees } from './grove.js';
import { tipSawdust } from './mill.js';
import { pairBuilding } from './build.js';
import { workAfter } from './work.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const inBox = (x, y, b) => !!b && x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h;
const T = () => S.after.t;

// --- where each station's parts stand: the one adapter ---------------------------
// Every hit and every cue reads a station's parts here and nowhere else, off
// the drawings themselves (place.js, `stationParts`). Each answer, in world
// pixels:
//   box    the worked box (every key)
//   wheel  { x, y, r }       the saw mill's flywheel
//   vat    { x, y, rx, ry }  the paper mill's vat
//   bar    { x, y, len }     the press's bar: its pivot, pulled down from level
//   edge   x                 the heap's tipping edge (the notch)
//   saw    { x, y }          a tree's saw: the middle of its cut (with `i`)
//   at     { x, y }          a stump's foot (with `i`)
export const partsOf = (key, i = 0) => stationParts(key, i);

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
// `gv` the gauge's eased speed and `gaugeA` its ink, `marks` the crits'.
const fresh = () => ({ uses: 0, lastUse: null, cueA: 1, gv: 0, gaugeA: 0, marks: [] });
function used(g) { g.uses++; g.lastUse = T(); }
function crit(g, x, y, n) { g.marks.push({ x, y, n, at: T() }); }

// A stump's wobbles come on a gap of their own, off a fixed sequence rather
// than the act's chance (util.js), so the hand never moves the sim's stream.
const gapAt = n => { const f = Math.sin((n + 1) * 12.9898) * 43758.5453; const [a, b] = GESTURE_WOBBLE_GAP; return a + (f - Math.floor(f)) * (b - a); };
// A load's worth of the fling's speed: a step up the gauge's thirds.
export const loadsAt = v => clamp(1 + Math.floor((v - GESTURE_FLING_MIN) / ((GESTURE_FLING_MAX - GESTURE_FLING_MIN) / GESTURE_FLING_LOADS)), 1, GESTURE_FLING_LOADS);
const feedOf = g => (g.hold ? GESTURE_FEED_SLOW + (GESTURE_FEED_FAST - GESTURE_FEED_SLOW) * Math.min(1, g.held / GESTURE_FEED_RAMP_S) : 0);
const revOf = g => Math.abs(g.w) / (2 * Math.PI);
// The heap's fling: px a second toward the edge, over the drag's last window.
function flingSpeed(g) {
  const a = g.pts[0], b = g.pts[g.pts.length - 1];
  if (!a || b.t - a.t < 1e-3 || T() - b.t > GESTURE_FLING_WINDOW_S) return 0;
  return (b.x - a.x) / (b.t - a.t) * Math.sign(notchX() - heapX() || 1);
}
// A load tipped through the notch, `n` of them: what went.
function tip(g, n) {
  let k = 0;
  while (k < n && tipSawdust() > 0) k++;
  if (k) used(g);
  return k;
}

// Each station's motion: `hit(x, y)` what a press there takes hold of (null
// if nothing), `down` taking it ('tap' when nothing is held after), `move`,
// `up`, `step(g, dt)` a frame, `speed(g)` the gauge's share, and `open()`
// whether it can be worked now at all.
const DEFS = {
  pedestal: {
    init: () => ({}),
    open: () => built('pedestal') && !pairBuilding(),
    hit(x, y) { const b = bubbleAt(x, y); return b ? { b } : null; },
    down(g, h) {
      if (!BUBBLES.pop(h.b)) return 'tap';
      const n = h.b.big ? GESTURE_BUBBLE_CRIT : 1;
      if (workAfter('pedestal', n, true)) {
        used(g);
        if (h.b.big) crit(g, h.b.x + h.b.w / 2, h.b.y + h.b.h / 2, n);
      }
      return 'tap';
    }
  },
  tree: {
    init: () => ({ i: null, s: 0, target: 0, s0: 0, gx: 0, from: 0, v: 0, grab: false }),
    open: () => !!S.after.axe && trees().some(standing),
    hit(x, y) { const i = treeAt(x, y); return i == null ? null : { i }; },
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
    hit(x, y) { const i = stumpAt(x, y); return i == null ? null : { i }; },
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
        const at = partsOf('stump', g.i).at;
        used(g); crit(g, at.x, at.y - P * 4, n);
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
    hit(x, y) { return inBox(x, y, partsOf('mill').box) ? {} : null; },
    down(g, h, x, y) { const c = partsOf('mill').wheel; g.grab = true; g.pa = Math.atan2(y - c.y, x - c.x); return true; },
    move(g, x, y) {
      const c = partsOf('mill').wheel, na = Math.atan2(y - c.y, x - c.x), d = wrap(na - g.pa);
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
    hit(x, y) { return inBox(x, y, partsOf('chipper').box) ? {} : null; },
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
    hit(x, y) { return inBox(x, y, partsOf('papermill').box) ? {} : null; },
    angle(x, y) { const v = partsOf('papermill').vat; return Math.atan2((y - v.y) / v.ry, (x - v.x) / v.rx); },
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
    hit(x, y) { return inBox(x, y, partsOf('workshop').box) ? {} : null; },
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
    hit(x, y) { return inBox(x, y, partsOf('press').box) ? {} : null; },
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
    hit(x, y) { return inBox(x, y, partsOf('heap').box) ? {} : null; },
    down(g, h, x, y) {
      if (g.load && g.load.mode !== 'gone') return 'tap';
      g.grab = true; g.pts = [{ t: T(), x }];
      g.load = { mode: 'held', x, y: Math.min(y, afterFloor() - P * 2), n: 1, at: T() };
      return true;
    },
    move(g, x, y) {
      const t = T();
      g.pts.push({ t, x });
      while (g.pts.length > 2 && t - g.pts[0].t > GESTURE_FLING_WINDOW_S) g.pts.shift();
      if (g.load) { g.load.x = x; g.load.y = Math.min(y, afterFloor() - P * 2); }
    },
    up(g) {
      g.grab = false;
      const ld = g.load, v = flingSpeed(g), edge = partsOf('heap').edge;
      if (!ld) return;
      if (v >= GESTURE_FLING_MIN) {
        const dir = Math.sign(edge - heapX() || 1);
        Object.assign(ld, { mode: 'fling', n: loadsAt(v), vx: dir * Math.max(v, GESTURE_FLING_MIN * 1.5), vy: -GESTURE_FLING_LIFT, at: T() });
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
        ld.y = Math.min(ld.y + ld.vy * dt, afterFloor() - P * 2);
        // Over the edge, it tips there: the loads go through the notch.
        if ((ld.vx > 0 && ld.x >= notchX()) || (ld.vx < 0 && ld.x <= notchX())) { tip(g, ld.n); Object.assign(ld, { mode: 'gone', at: T() }); }
      } else if (ld.mode !== 'held' && T() - ld.at > GESTURE_LOAD_FADE_S) g.load = null;
    },
    speed: g => Math.max(0, g.v) / GESTURE_FLING_MAX
  }
};
export const GESTURE_KEYS = Object.keys(DEFS);

// The records, for this `S.after`: a new game or a read save stands them all
// still, nothing held.
let G = null, seen = null, held = null;
function recs() {
  if (seen !== S.after) {
    seen = S.after; held = null;
    G = Object.fromEntries(GESTURE_KEYS.map(k => [k, { ...fresh(), ...DEFS[k].init() }]));
  }
  return G;
}
const live = () => afterlifeOn() && !!S.after;

// --- the pointer -----------------------------------------------------------------------
// A press on the place: true if a station's motion took it. input.js tries
// this before `clickAfter`, so a press on nothing worked by a motion is still
// a click (a card's roof, the pair with no bubble up).
export function gestureDown(x, y) {
  if (!live()) return false;
  const g = recs();
  held = null;
  for (const key of GESTURE_KEYS) {
    const d = DEFS[key];
    if (!d.open()) continue;
    const h = d.hit(x, y);
    if (!h) continue;
    const took = d.down(g[key], h, x, y);
    if (took === true) held = key;
    return true;
  }
  return false;
}
// Whether a press at a world point would be a station's motion, asked
// without pressing: a finger landing there is the game's, never a scroll.
export function gestureUnder(x, y) {
  if (!live()) return false;
  recs();
  return GESTURE_KEYS.some(key => DEFS[key].open() && !!DEFS[key].hit(x, y));
}
export function gestureMove(x, y) {
  if (!live() || !held) return;
  const d = DEFS[held];
  if (d.move) d.move(recs()[held], x, y);
}
export function gestureUp(x, y) {
  if (!held || !S.after) { held = null; return; }
  const d = DEFS[held];
  if (d.up) d.up(recs()[held], x, y);
  held = null;
}
// The station a press is holding now, or null.
export const gestureHeld = () => (S.after && seen === S.after ? held : null);

// --- a frame ---------------------------------------------------------------------------
// Every station's motion one frame along, then its cue's inks: the ghost hand
// out after GESTURE_CUE_USES motions and back after GESTURE_CUE_IDLE_S idle, the
// gauge in while it moves, the crits' marks held and gone.
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
}

// --- the pad ---------------------------------------------------------------------------
// The mock's pad lines, a frame of the pad on the station under its focus:
// `{ a, pressed, released, lx, ly }`, A down, pressed and let go this frame,
// and the left stick. Each is turned into the motion the pointer makes there.
let flick = 0;
export function padGesture(key, p) {
  if (!live() || !DEFS[key] || !DEFS[key].open()) return;
  const g = recs(), r = g[key], d = DEFS[key];
  if (key === 'pedestal') {                   // A pops the lowest bubble
    const b = p.pressed && lowestBubble();
    if (b) d.down(r, { b });
  } else if (key === 'tree') {                // the stick side to side saws; faster saws faster
    const i = trees().findIndex(standing);
    if (i < 0) return;
    if (r.i !== i) Object.assign(r, { i, s: 0, target: 0, from: 0 });
    r.grab = true;
    r.target = clamp(p.lx, -1, 1) * GESTURE_SAW_AMP;
  } else if (key === 'stump') {               // mash A pulls; a press as it wobbles yanks it out
    const i = trees().findIndex(stumped);
    if (i < 0) return;
    if (r.i !== i) Object.assign(r, { i, lift: 0, target: 0, strain: 0, wob: -1e9, next: null });
    if (p.pressed) { r.grab = true; r.target = Math.min(GESTURE_STUMP_MAX, Math.max(r.target, r.lift) + GESTURE_PAD_PULL); }
    else if (!p.a) { r.grab = false; r.target = 0; }
  } else if (key === 'mill' || key === 'papermill') {   // the stick's turn spins the wheel, stirs the vat
    const m = Math.hypot(p.lx, p.ly);
    if (m < GESTURE_PAD_TURN) { if (held === key) gestureUp(); else r.grab = false; return; }
    const pt = key === 'mill' ? partsOf('mill').wheel : partsOf('papermill').vat;
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
    const dir = Math.sign(notchX() - heapX() || 1), push = p.lx * dir;
    if (push > flick) flick = push;
    if (push <= 0 && flick > 0) {
      const v = flick * GESTURE_FLING_MAX;
      flick = 0;
      if (v >= GESTURE_FLING_MIN && !(r.load && r.load.mode !== 'gone')) {
        const b = partsOf('heap').box;
        r.load = { mode: 'fling', x: b.x + P, y: afterFloor() - P * 3, n: loadsAt(v), vx: dir * Math.max(v, GESTURE_FLING_MIN * 1.5),
                   vy: -GESTURE_FLING_LIFT, at: T() };
        r.v = v;
      }
    }
  }
}

// The stations a pad's focus can stand on up here: every one open now, by
// its worked box, left to right (stops.js).
export function gestureStops() {
  if (!live()) return [];
  const out = [];
  for (const key of GESTURE_KEYS) {
    if (!DEFS[key].open()) continue;
    if (key === 'tree' || key === 'stump') {
      const i = trees().findIndex(key === 'tree' ? standing : stumped);
      if (i >= 0) out.push({ key, r: partsOf(key, i).box });
    } else out.push({ key, r: partsOf(key).box });
  }
  return out;
}

// --- for the drawing (render/aftercues.js) ---------------------------------------------
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
