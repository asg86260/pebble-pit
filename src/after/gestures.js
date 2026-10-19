// Act 3's hand work, in the world (docs/wave-act3-build.md, track A; the
// owner, 2026-10-18): every station is worked by dragging its own moving
// part where it stands, and a plain click on a station opens its board
// (track C's `openAfterBoard`). The faster the motion the faster the work,
// up to a cap; one crit stays, a moment of timing -- the pedestal's big
// bubble, paying GESTURE_BUBBLE_CRIT lines.
//
//   pedestal   a click on a rising speech bubble pops it
//   tree       the saw icon over a grown tree clicked puts the handsaw on its
//              trunk; dragged back and forth, a stroke a chop
//   stump      the shovel icon shows it can be dug; dragged up out of the
//              ground and held there, a root a strain
//   saw mill   the flywheel spun: its speed feeds the log, capped
//   chipper    a log dragged off the pile into the jaws, then the arm pulled
//              down and held: a steady feed while it is held
//   paper mill the vat stirred round: its speed fills the batch, capped
//   workshop   a tap on a nail a blow: two drive it, four nail a sign
//   press      the bar dragged down: a poster at the stop
//   heap       a load dragged to the notch, or flung: the faster, the more
//
// The parts stand where the drawing draws them (place.js, `stationParts`),
// and every grab zone is a cell or two wider than the part, so a part is
// easy to take hold of at the yard's scale.
//
// The work itself is the sim's and is reached only the way the click reached
// it: `workAfter` for the stations, the grove's own chop and dig, the heap's
// tip. A member at a post works the same station alongside the hand. What is
// kept here is the hand's own motion -- where the saw is, how fast the wheel
// turns, how far the stump is up -- and it is this session's: a reload
// stands every station still, and the ghost hand shows again until the
// motion has been done GESTURE_CUE_USES times.
//
// Time is the act's clock (`S.after.t`): the pointer only moves things, and
// `stepGestures` turns what it moved into speed a frame, so a check turns the
// clock with `run` and reads a fact about the game, not about the machine.

import { S } from '../state.js';
import { P, AFTER_SIGN_TIMBER, AFTER_SIGN_S, GESTURE_CUE_USES, GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S,
         GESTURE_BUBBLE_CRIT, GESTURE_BUBBLE_SLACK, GESTURE_GRAB_SLACK,
         GESTURE_SAW_AMP, GESTURE_SAW_VMAX, GESTURE_SAW_FOLLOW, GESTURE_SAW_END, GESTURE_SAW_EASE,
         GESTURE_STUMP_DRAG, GESTURE_STUMP_MAX, GESTURE_STUMP_FOLLOW, GESTURE_STUMP_SINK, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S,
         GESTURE_WHEEL_MAX_REV, GESTURE_WHEEL_FEED, GESTURE_WHEEL_LOG, GESTURE_WHEEL_EASE, GESTURE_WHEEL_COAST, GESTURE_WHEEL_MIN_REV,
         GESTURE_ARM_FEED, GESTURE_ARM_LOG, GESTURE_ARM_PULL, GESTURE_ARM_HOLD, GESTURE_ARM_POSES, GESTURE_ARM_SPRING_S,
         GESTURE_STIR_MAX_REV, GESTURE_STIR_TURNS, GESTURE_STIR_EASE, GESTURE_STIR_COAST,
         GESTURE_NAILS, GESTURE_NAIL_TAPS, GESTURE_SWING_S, GESTURE_JOINER_WAIT_S,
         GESTURE_BAR_DRAG, GESTURE_BAR_RATE, GESTURE_BAR_RETURN, GESTURE_BAR_PRINT, GESTURE_BAR_RESET, GESTURE_BAR_EASE,
         GESTURE_FLING_MIN, GESTURE_FLING_MAX, GESTURE_FLING_LOADS, GESTURE_FLING_WINDOW_S, GESTURE_FLING_GRAV,
         GESTURE_FLING_LIFT, GESTURE_LOAD_FADE_S, GESTURE_PAD_PULL, GESTURE_PAD_TURN } from '../config.js';
import { afterlifeOn } from '../acts.js';
import { secs } from './util.js';
import { built } from './levels.js';
import { stationParts, stationBox, plotX, afterFloor } from './place.js';
import { godCampAt } from './sky.js';
import { standing, stumped, chopTree, digStump, trees } from './grove.js';
import { tipSawdust } from './mill.js';
import { pairBuilding } from './build.js';
import { workAfter } from './work.js';
import { openAfterBoard } from './rows.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const inBox = (x, y, b, s = 0) => !!b && x >= b.x - s && x < b.x + b.w + s && y >= b.y - s && y <= b.y + b.h + s;
const T = () => S.after.t;
const G_S = GESTURE_GRAB_SLACK;

// The pedestal's bubbles are the pair's speech rising (bubbles.js): `list()`
// the bubbles in the air, each { x, y, w, h, big } a world box, and `pop(b)`
// true if it took the pop. Until they rise, none.
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
// `marks` the crit's (in the world).
const fresh = () => ({ uses: 0, lastUse: null, cueA: 1, marks: [] });
function used(g) { g.uses++; g.lastUse = T(); }
function crit(g, x, y, n) { g.marks.push({ x, y, n, at: T() }); }

export const loadsAt = v => clamp(1 + Math.floor((v - GESTURE_FLING_MIN) / ((GESTURE_FLING_MAX - GESTURE_FLING_MIN) / GESTURE_FLING_LOADS)), 1, GESTURE_FLING_LOADS);
const revOf = g => Math.abs(g.w) / (2 * Math.PI);
// A load tipped through the notch, `n` of them: what went.
function tip(g, n) {
  let k = 0;
  while (k < n && tipSawdust() > 0) k++;
  if (k) used(g);
  return k;
}
function flingSpeed(g) {
  const a = g.pts[0], b = g.pts[g.pts.length - 1];
  if (!a || b.t - a.t < 1e-3 || T() - b.t > GESTURE_FLING_WINDOW_S) return 0;
  return (b.x - a.x) / (b.t - a.t);
}
// The arm's pose off its pull: a whole step of GESTURE_ARM_POSES.
const armPose = k => Math.round(clamp(k, 0, 1) * (GESTURE_ARM_POSES - 1));

// The saw on plot i's trunk, drawn at offset `s` px along: the box a press
// takes it by.
const sawBox = (i, s) => { const b = stationParts('tree', i).sawBox; return { ...b, x: b.x + s }; };

// Each station's motion: `grab(g, x, y)` the part under a world point, if
// any; `down` taking it ('tap' when nothing is held after), `move`, `up`,
// `step(g, dt)` a frame, `speed(g)` how fast it goes as a share of its cap,
// and `open()` whether it can be worked now at all.
const DEFS = {
  pedestal: {
    init: () => ({}),
    open: () => built('pedestal') && !pairBuilding(),
    grab: (g, x, y) => bubbleAt(x, y),
    down(g, b) {
      if (!BUBBLES.pop(b)) return 'tap';
      const n = b.big ? GESTURE_BUBBLE_CRIT : 1;
      if (workAfter('pedestal', n, true, { x: b.x + b.w / 2, y: b.y + b.h / 2 })) {
        used(g);
        if (b.big) crit(g, b.x + b.w / 2, b.y + b.h / 2, n);
      }
      return 'tap';
    }
  },
  tree: {
    // `i` the tree the saw is on (its icon clicked), null with the saw put up.
    init: () => ({ i: null, s: 0, target: 0, s0: 0, gx: 0, from: 0, v: 0, grab: false }),
    open: () => !!S.after.axe && trees().some(standing),
    grab(g, x, y) { const p = g.i != null && trees()[g.i]; return p && standing(p) && inBox(x, y, sawBox(g.i, g.s), G_S) ? g.i : null; },
    down(g, i, x) { g.grab = true; g.gx = x; g.s0 = g.target; return true; },
    move(g, x) { g.target = clamp(g.s0 + (x - g.gx), -GESTURE_SAW_AMP, GESTURE_SAW_AMP); },
    up(g) { g.grab = false; },
    step(g, dt) {
      const p = g.i != null && trees()[g.i];
      if (!p || !standing(p)) { g.v *= Math.exp(-6 * dt); g.from = 0; if (!(p && p.fall != null)) g.i = null; g.grab = false; return; }
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
    init: () => ({ i: null, lift: 0, target: 0, y0: 0, grab: false, strain: 0 }),
    open: () => trees().some(stumped),
    grab(g, x, y) {
      const list = trees();
      for (let i = 0; i < list.length; i++) if (stumped(list[i]) && inBox(x, y, stationParts('stump', i).grip, G_S)) return i;
      return null;
    },
    down(g, i, x, y) {
      if (g.i !== i) Object.assign(g, { i, lift: 0, target: 0, strain: 0 });
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
      // Held up past the strain height, a root gives every GESTURE_STRAIN_S;
      // the last one and it is out, a sapling set in its place.
      if (g.grab && g.lift >= GESTURE_STRAIN_LIFT) {
        g.strain += dt;
        if (g.strain >= GESTURE_STRAIN_S) { g.strain = 0; if (digStump(g.i, true)) used(g); }
      } else g.strain = 0;
    },
    speed: g => g.lift / GESTURE_STUMP_MAX
  },
  mill: {
    init: () => ({ ang: 0, w: 0, grab: false, pa: 0, acc: 0, prog: 0 }),
    open: () => built('mill'),
    grab(g, x, y) { const c = stationParts('mill').wheel; return Math.hypot(x - c.x, y - c.y) <= c.r + G_S * 2 ? true : null; },
    down(g, h, x, y) { const c = stationParts('mill').wheel; g.grab = true; g.pa = Math.atan2(y - c.y, x - c.x); return true; },
    move(g, x, y) {
      const c = stationParts('mill').wheel, na = Math.atan2(y - c.y, x - c.x), d = wrap(na - g.pa);
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
    // `log` the log in hand: null, 'held' (dragged from the pile, at x, y)
    // or 'in' (laid in the jaws); `k` the arm's pull, `hold` whether the
    // arm is held down, `prog` the log fed through, `spring` when the arm
    // was let go (it comes back a pose at a time).
    init: () => ({ log: null, lx: 0, ly: 0, k: 0, kw: 0, ky: 0, k0: 0, arm: false, hold: false, prog: 0, spring: null }),
    open: () => built('chipper'),
    grab(g, x, y) {
      const p = stationParts('chipper');
      if (inBox(x, y, p.arm, G_S)) return 'arm';
      if (g.log !== 'in' && S.after.stock.chiplogs > 0 && inBox(x, y, p.pile, G_S)) return 'log';
      return null;
    },
    down(g, what, x, y) {
      if (what === 'arm') { g.arm = true; g.ky = y; g.k0 = g.k; g.spring = null; return true; }
      g.log = 'held'; g.lx = x; g.ly = y; return true;
    },
    move(g, x, y) {
      if (g.arm) g.kw = clamp(g.k0 + (y - g.ky) / GESTURE_ARM_PULL, 0, 1);
      else if (g.log === 'held') { g.lx = x; g.ly = y; }
    },
    up(g) {
      if (g.arm) { g.arm = false; g.spring = T(); return; }
      // Let go over the jaws, the log is laid in them; anywhere else it goes
      // back onto the pile.
      if (g.log === 'held') g.log = inBox(g.lx, g.ly, stationParts('chipper').mouth, G_S) ? 'in' : null;
    },
    step(g, dt) {
      // Held, the arm follows the hand; let go, it springs back a held pose at a time.
      if (g.arm) g.k = g.kw;
      else if (g.spring != null) {
        const n = Math.floor((T() - g.spring) / GESTURE_ARM_SPRING_S);
        g.k = Math.max(0, g.kw - n / (GESTURE_ARM_POSES - 1));
        if (g.k <= 0) { g.spring = null; g.kw = 0; }
      }
      g.hold = g.arm && g.k >= GESTURE_ARM_HOLD;
      if (!g.hold || g.log !== 'in') return;
      // Down and held with a log in the jaws: the feed at its one steady speed.
      g.prog = Math.min(GESTURE_ARM_LOG, g.prog + GESTURE_ARM_FEED * dt);
      if (g.prog >= GESTURE_ARM_LOG) {
        g.prog = 0;
        if (workAfter('chipper', 1, true)) { used(g); g.log = null; }
      }
    },
    speed: g => (g.hold ? 1 : 0)
  },
  papermill: {
    init: () => ({ ang: 0, w: 0, grab: false, pa: 0, acc: 0, prog: 0 }),
    open: () => built('papermill'),
    angle(x, y) { const v = stationParts('papermill').vat; return Math.atan2((y - v.y) / v.ry, (x - v.x) / v.rx); },
    grab(g, x, y) {
      const v = stationParts('papermill').vat, dx = (x - v.x) / (v.rx + G_S * 2), dy = (y - v.y) / (v.ry + G_S * 2);
      return dx * dx + dy * dy <= 1 ? true : null;
    },
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
    // `nails` the taps each nail of the sign on the bench has taken (two
    // drive it: half, then flush); `strike` the last blow, `hit` which nail.
    init: () => ({ nails: new Array(GESTURE_NAILS).fill(0), strike: -1e9, hit: null, last: -1e9, auto: -1e9 }),
    open: () => built('workshop'),
    grab(g, x, y) {
      const p = stationParts('workshop');
      for (let k = 0; k < p.nails.length; k++) if (inBox(x, y, p.nails[k]) && g.nails[k] < GESTURE_NAIL_TAPS) return k;
      return inBox(x, y, p.sign, G_S) ? -1 : null;
    },
    down(g, k) {
      const t = T();
      // A tap off a nail, or a nail already flush, is a miss: nothing.
      if (k == null || k < 0 || t - g.strike < GESTURE_SWING_S) return 'tap';
      if (S.after.stock.timber < AFTER_SIGN_TIMBER && g.nails.every(n => n === 0)) return 'tap';   // no blank without timber
      g.strike = t; g.hit = k; g.last = t;
      g.nails[k] += 1;
      used(g);
      settleSign(g);
      return 'tap';
    },
    step(g) {
      // The joiner at the bench taps on its own once the hand has stopped, a
      // blow every AFTER_SIGN_S shared over a sign's taps; a fresh blank
      // only with the timber for it.
      const t = T(), joiner = S.after.bodies.some(b => b.at === 'workshop');
      const every = AFTER_SIGN_S / (GESTURE_NAILS * GESTURE_NAIL_TAPS);
      if (!joiner || t - g.last < GESTURE_JOINER_WAIT_S || t - g.auto < every) return;
      if (g.nails.every(n => n === 0) && S.after.stock.timber < AFTER_SIGN_TIMBER) return;
      const k = g.nails.findIndex(n => n < GESTURE_NAIL_TAPS);
      g.auto = t; g.strike = t; g.hit = k; g.nails[k] += 1;
      settleSign(g);
    },
    speed: g => g.nails.reduce((a, n) => a + n, 0) / (GESTURE_NAILS * GESTURE_NAIL_TAPS)
  },
  press: {
    init: () => ({ k: 0, want: 0, grab: false, gy: 0, k0: 0, printed: false, w: 0 }),
    open: () => built('press'),
    grab(g, x, y) { const p = stationParts('press'); return inBox(x, y, p.handle, G_S) ? true : null; },
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
    // A load off the heap: { mode: 'held' | 'fling' | 'gone' | 'back', x, y, n, at }.
    init: () => ({ grab: false, pts: [], v: 0, load: null }),
    open: () => built('mill') && !built('papermill') && S.after.stock.sawdust > 0,
    grab(g, x, y) { return g.load && g.load.mode !== 'gone' ? null : inBox(x, y, stationParts('heap').heap, G_S) ? true : null; },
    down(g, h, x, y) {
      g.grab = true; g.pts = [{ t: T(), x }];
      g.load = { mode: 'held', x, x0: x, y: Math.min(y, afterFloor() - P), n: 1, at: T() };
      return true;
    },
    move(g, x, y) {
      const t = T();
      g.pts.push({ t, x });
      while (g.pts.length > 2 && t - g.pts[0].t > GESTURE_FLING_WINDOW_S) g.pts.shift();
      if (g.load) { g.load.x = x; g.load.y = Math.min(y, afterFloor() - P); }
    },
    up(g) {
      g.grab = false;
      const ld = g.load, v = flingSpeed(g), edge = stationParts('heap').edge;
      if (!ld) return;
      if (v >= GESTURE_FLING_MIN) Object.assign(ld, { mode: 'fling', n: loadsAt(v), vx: Math.max(v, GESTURE_FLING_MIN * 1.5), vy: -GESTURE_FLING_LIFT, at: T() });
      else if (ld.x >= edge) { tip(g, 1); Object.assign(ld, { mode: 'gone', at: T() }); }
      else Object.assign(ld, { mode: 'back', at: T() });
    },
    step(g, dt) {
      g.v = g.grab ? flingSpeed(g) : g.v * Math.exp(-3 * dt);
      const ld = g.load;
      if (!ld) return;
      if (ld.mode === 'fling') {
        ld.vy += GESTURE_FLING_GRAV * dt;
        ld.x += ld.vx * dt;
        ld.y = Math.min(ld.y + ld.vy * dt, afterFloor() - P);
        // Over the notch, it tips there: the loads go through.
        if (ld.x >= stationParts('heap').edge) { tip(g, ld.n); Object.assign(ld, { mode: 'gone', at: T() }); }
      } else if (ld.mode !== 'held' && T() - ld.at > GESTURE_LOAD_FADE_S) g.load = null;
    },
    speed: g => Math.max(0, g.v) / GESTURE_FLING_MAX
  }
};
// Four nails driven flush: the sign is done, joined off the timber, and a new
// blank stood in the bench.
function settleSign(g) {
  if (g.nails.some(n => n < GESTURE_NAIL_TAPS)) return;
  workAfter('workshop', 1, g.auto !== g.strike);
  g.nails.fill(0);
}
export const GESTURE_KEYS = Object.keys(DEFS);

// The records, for this act: a new one stands them all still, nothing
// held. An act is known by the seed it began with (`S.after.begun`), carried
// in its save, so the session's motion is kept across the act's state being
// read back (a reload of the page starts the session itself afresh).
let G = null, seen = null, held = null, heldWhat = null, lastPress = null, pressAt = null, asked = null;
const actId = () => (S.after ? S.after.begun : null);
// An act begun afresh in the same session (a new game) may share a seed with
// the last, but its clock starts again: that stands everything still too.
let lastT = 0;
function recs() {
  const back = S.after && S.after.t < lastT;
  lastT = S.after ? S.after.t : 0;
  if (seen !== actId() || back) {
    seen = actId(); held = null; heldWhat = null; lastPress = null; pressAt = null; asked = null;
    G = Object.fromEntries(GESTURE_KEYS.map(k => [k, { ...fresh(), ...DEFS[k].init() }]));
  }
  return G;
}
const live = () => afterlifeOn() && !!S.after;

// --- the icons over the grove ----------------------------------------------------------
// The saw icon over each grown tree the saw is not on, while the axe is in
// hand; the shovel over each stump. Where each is and whether it shows: read
// by the drawing (render/after/pine.js) and the click alike.
export function groveIcons() {
  if (!live()) return [];
  const g = recs(), out = [];
  trees().forEach((p, i) => {
    if (standing(p) && S.after.axe && g.tree.i !== i) out.push({ kind: 'saw', i, ...stationParts('tree', i).icon });
    if (stumped(p)) out.push({ kind: 'shovel', i, held: g.stump.i === i && g.stump.grab, ...stationParts('stump', i).icon });
  });
  return out;
}
const iconAt = (x, y) => groveIcons().find(c => c.kind === 'saw' && inBox(x, y, c.box, G_S)) || null;

// --- what a plain click opens ----------------------------------------------------------
// The board a world point opens on a plain click: a standing station's
// drawing; the grove's trees, stumps and soil; the heap, the saw mill's;
// God's camp as drawn, his crowd's status board (track C's 'crowd').
function boardAt(x, y) {
  for (const key of ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal']) {
    if (!built(key)) continue;
    const b = key === 'pedestal' ? stationParts('pedestal').top : stationBox(key);
    if (inBox(x, y, b)) return key;
  }
  if (built('mill') && inBox(x, y, stationParts('heap').heap)) return 'mill';
  const fl = afterFloor();
  for (let i = 0; i < trees().length; i++) {
    const p = trees()[i], bx = plotX(i);
    if (x < bx - P * 5 || x > bx + P * 6 || y > fl + P) continue;
    const top = standing(p) ? stationParts('tree', i).box.y : fl - P * 6;
    if (y >= top) return 'grove';
  }
  if (godCampAt(x, y, S.camX + S.viewW / 2)) return 'crowd';
  return null;
}
function askBoard(key, x, y) { asked = { key, at: T() }; openAfterBoard(key, { x, y }); }
// The last board a plain click asked for, { key, at }: for the checks, which
// have no page for the board to open on.
export const boardAsked = () => (live() && seen === actId() ? asked : null);

// The moving part under a world point: { key, what } for a station that can
// be worked now.
function partAt(x, y) {
  const g = recs();
  for (const key of GESTURE_KEYS) {
    if (key === 'pedestal' || !DEFS[key].open()) continue;
    const what = DEFS[key].grab(g[key], x, y);
    if (what != null) return { key, what };
  }
  return null;
}

// --- the pointer -----------------------------------------------------------------------
// A press on the place, in world px: true if the hand work took it. On a
// bubble, the bubble's; on the saw icon, the saw put on that tree; on a
// moving part, the part held until the release; on a station, its board
// opened. A press on anything else is still the place's click (input.js tries
// this before `clickAfter`). A finger (`touch`) opens a board only at its
// release (`gestureTap`), since a press there may be the start of a swipe.
export function gestureDown(x, y, touch = false) {
  if (!live()) return false;
  const g = recs();
  held = null; heldWhat = null; pressAt = { x, y };
  if (DEFS.pedestal.open()) {
    const b = bubbleAt(x, y);
    if (b) { lastPress = 'bubble'; DEFS.pedestal.down(g.pedestal, b); return true; }
  }
  const icon = iconAt(x, y);
  if (icon) {
    lastPress = 'icon';
    Object.assign(g.tree, { i: icon.i, s: 0, target: 0, from: 0, v: 0, grab: false });
    used(g.tree);
    return true;
  }
  const part = partAt(x, y);
  if (part) {
    lastPress = 'part';
    if (DEFS[part.key].down(g[part.key], part.what, x, y) === true) { held = part.key; heldWhat = part.what; }
    return true;
  }
  const key = boardAt(x, y);
  lastPress = key ? 'site' : 'floor';
  if (!key) return false;
  if (!touch) askBoard(key, x, y);
  return true;
}
// A finger's tap released: on a station, its board opened, true; anything
// else false. A press that took a part, a bubble or an icon is not a tap.
export function gestureTap(x, y, touch = true) {
  if (!live() || lastPress !== 'site') return false;
  recs();
  const key = boardAt(x, y);
  if (key && touch) askBoard(key, x, y);
  return !!key;
}
// Whether a press at a world point would be the hand work's, asked without
// pressing: a finger landing on a part, a bubble or an icon is the game's,
// never a scroll.
export function gestureUnder(x, y) {
  if (!live()) return false;
  recs();
  return (DEFS.pedestal.open() && !!bubbleAt(x, y)) || !!iconAt(x, y) || !!partAt(x, y);
}
export function gestureMove(x, y) {
  if (!live()) return;
  const g = recs();
  if (held && DEFS[held].move) DEFS[held].move(g[held], x, y);
}
export function gestureUp(x, y) {
  if (!S.after) { held = null; return; }
  const g = recs();
  if (!held) return;
  const d = DEFS[held];
  if (d.up) d.up(g[held], x, y);
  held = null; heldWhat = null;
}
// The station a press is holding now, or null.
export const gestureHeld = () => (S.after && seen === actId() ? held : null);

// --- a frame ---------------------------------------------------------------------------
// Every station's motion one frame along, then its cue's ink: the ghost hand
// out after GESTURE_CUE_USES motions and back after GESTURE_CUE_IDLE_S idle,
// the crit's marks held and gone.
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
    if (r.marks.length) r.marks = r.marks.filter(m => t - m.at < GESTURE_MARK_HOLD_S + GESTURE_MARK_FADE_S);
  }
}

// --- the pad ---------------------------------------------------------------------------
// A frame of the pad on the station under its focus: `{ a, pressed,
// released, lx, ly }`, A down, pressed and let go this frame, and the left
// stick, each turned into the motion the pointer makes on the part.
let flick = 0;
export function padGesture(key, p) {
  if (!live() || !DEFS[key] || !DEFS[key].open()) return;
  const g = recs(), r = g[key], d = DEFS[key];
  if (key === 'pedestal') {                   // A pops the lowest bubble
    const b = p.pressed && lowestBubble();
    if (b) d.down(r, b);
  } else if (key === 'tree') {                // A puts the saw on; the stick side to side saws
    const i = trees().findIndex(standing);
    if (i < 0) return;
    if (r.i !== i) { if (p.pressed) Object.assign(r, { i, s: 0, target: 0, from: 0 }); return; }
    r.grab = true;
    r.target = clamp(p.lx, -1, 1) * GESTURE_SAW_AMP;
  } else if (key === 'stump') {               // mash A pulls it up
    const i = trees().findIndex(stumped);
    if (i < 0) return;
    if (r.i !== i) Object.assign(r, { i, lift: 0, target: 0, strain: 0 });
    if (p.a) { r.grab = true; if (p.pressed) r.target = Math.min(GESTURE_STUMP_MAX, Math.max(r.target, r.lift) + GESTURE_PAD_PULL); }
    else { r.grab = false; r.target = 0; }
  } else if (key === 'mill' || key === 'papermill') {   // the stick's turn spins the wheel, stirs the vat
    const m = Math.hypot(p.lx, p.ly);
    if (m < GESTURE_PAD_TURN) { if (held === key) gestureUp(); else r.grab = false; return; }
    const pt = key === 'mill' ? stationParts('mill').wheel : stationParts('papermill').vat;
    const x = pt.x + p.lx / m * (pt.r || pt.rx), y = pt.y + p.ly / m * (pt.r || pt.ry);
    if (!r.grab) { d.down(r, true, x, y); held = key; } else d.move(r, x, y);
  } else if (key === 'chipper') {             // A lays a log in, then held pulls the arm down
    if (p.pressed && r.log !== 'in' && S.after.stock.chiplogs > 0) { r.log = 'in'; return; }
    if (p.pressed) { r.arm = true; r.spring = null; }
    if (r.arm) r.kw = p.a ? 1 : r.kw;
    if (p.released && r.arm) { r.arm = false; r.spring = T(); }
  } else if (key === 'workshop') {            // A taps the next nail
    if (p.pressed) d.down(r, r.nails.findIndex(n => n < GESTURE_NAIL_TAPS));
  } else if (key === 'press') {               // the stick down pulls the bar
    r.grab = p.ly > 0;
    r.want = clamp(p.ly, 0, 1);
  } else if (key === 'heap') {                // a flick toward the notch; harder tips more
    const push = p.lx;
    if (push > flick) flick = push;
    if (push <= 0 && flick > 0) {
      const v = flick * GESTURE_FLING_MAX;
      flick = 0;
      if (v >= GESTURE_FLING_MIN && !(r.load && r.load.mode !== 'gone')) {
        const h = stationParts('heap').heap;
        r.load = { mode: 'fling', x: h.x + P, x0: h.x + P, y: h.y, n: loadsAt(v), vx: Math.max(v, GESTURE_FLING_MIN * 1.5), vy: -GESTURE_FLING_LIFT, at: T() };
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

// --- for the drawing (render/after/*.js, render/aftercues.js) --------------------------
// Each station's record and whether it can be worked now, read, never kept.
export function gestureView() {
  if (!live()) return null;
  const g = recs();
  return GESTURE_KEYS.map(key => ({ key, open: DEFS[key].open(), held: held === key, ...g[key] }));
}
// Where each station's parts stand, in the world (place.js).
export const partsOf = (key, i = 0) => stationParts(key, i);
