// Act 3's hand work, in the world (docs/wave-act3-build.md, track A; the
// owner, 2026-10-18): every station is worked by dragging its own moving
// part where it stands, and a plain click on a station opens its board
// (the pointer's, off the one station table: after/stations.js). The faster the motion the faster the work,
// up to a cap; one crit stays, a moment of timing -- the pedestal's big
// bubble, paying GESTURE_BUBBLE_CRIT lines.
//
//   pedestal   a click on a rising speech bubble pops it
//   tree       the hand saw lying across a grown trunk taken by a press on
//              it (or on the tree), dragged end to end, a stroke a chop
//   stump      the stump itself taken hold of (no icon), dragged up out of
//              the ground and held there, a root a strain; out, it is in the hand
//   saw mill   the flywheel spun: each turn a stroke of the blade, capped
//   workshop   a tap on a nail a blow: two drive it, four nail a sign
//
// The parts stand where the drawing draws them (place.js, `stationParts`),
// and every grab zone is a cell or two wider than the part, so a part is
// easy to take hold of at the yard's scale.
//
// The work itself is the sim's and is reached only the way the click reached
// it: `workAfter` for the stations, the saw mill's wheel (mill.js,
// `turnWheel`, the one door its sawyer walks too), the grove's own chop and
// dig. A member at a post works the same station alongside the hand. What is
// kept here is the hand's own motion -- where the saw is, how fast the wheel
// turns, how far the stump is up -- and it is this session's: a reload
// stands every station still, and the ghost hand shows again until the
// motion has been done GESTURE_CUE_USES times.
//
// Time is the act's clock (`S.after.t`): the pointer only moves things, and
// `stepGestures` turns what it moved into speed a frame, so a check turns the
// clock with `run` and reads a fact about the game, not about the machine.

import { S } from '../state.js';
import { P, AFTER_PILES, AFTER_SIGN_TIMBER, AFTER_SIGN_S, GESTURE_CUE_USES, GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_MARK_HOLD_S, GESTURE_MARK_FADE_S,
         GESTURE_BUBBLE_CRIT, GESTURE_BUBBLE_SLACK, GESTURE_GRAB_SLACK,
         GESTURE_SAW_AMP, GESTURE_SAW_VMAX, GESTURE_SAW_FOLLOW, GESTURE_SAW_END, GESTURE_SAW_EASE,
         GESTURE_STUMP_DRAG, GESTURE_STUMP_MAX, GESTURE_STUMP_FOLLOW, GESTURE_STUMP_SINK, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S,
         GESTURE_WHEEL_MAX_REV, GESTURE_WHEEL_EASE, GESTURE_WHEEL_COAST, GESTURE_WHEEL_MIN_REV,
         GESTURE_NAILS, GESTURE_NAIL_TAPS, GESTURE_SWING_S, GESTURE_JOINER_WAIT_S,
         GESTURE_PAD_PULL, GESTURE_PAD_TURN,
         GESTURE_HOVER_S, AFTER_SAW, AFTER_SAW_HEFT, AFTER_SAWDUST, AFTER_TREE } from '../config.js';
import { smoothstep } from '../motion.js';
import { afterlifeOn } from '../acts.js';
import { secs } from './util.js';
import { built } from './levels.js';
import { stationParts, plotX, groundOf, AP } from './place.js';
import { standing, stumped, chopTree, digStump, trees, treeAt } from './grove.js';
import { turnWheel, strokesLanded } from './mill.js';
import { pairBuilding } from './build.js';
import { pileCount } from './piles.js';
import { workAfter } from './work.js';
// track C: the stump's strain, shared with the woodcutter, and its way into the hand
import { pullable, strainStep, snapRoot, intoHand, settleHeld } from './stump.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const inBox = (x, y, b, s = 0) => !!b && x >= b.x - s && x < b.x + b.w + s && y >= b.y - s && y <= b.y + b.h + s;
const T = () => S.after.t;
const G_S = GESTURE_GRAB_SLACK;

// The pedestal's bubbles are the pair's speech rising (bubbles.js): `list()`
// the bubbles in the air, each { x, y, w, h, big } a world box, and `pop(b)`
// true if it took the pop. Until they rise, none.
let BUBBLES = { list: () => [], pop: () => false }; // page: bubbles.js's wiring, handed over once a page
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
// `hint` the same hand's ink while the pointer is over the part, 0..1 linear
// (gestureView eases it).
const fresh = () => ({ uses: 0, lastUse: null, cueA: 1, marks: [], hint: 0 });
function used(g) { g.uses++; g.lastUse = T(); }
function crit(g, x, y, n) { g.marks.push({ x, y, n, at: T() }); }

const revOf = g => Math.abs(g.w) / (2 * Math.PI);
// The hand saw on plot i's trunk with the hand's stroke at `s` px (within
// GESTURE_SAW_AMP either way of its rest): `heel` the world x where its
// blade meets its grip, the blade running from there toward the fall and the
// grip toward the shack; `edge` the world y of the blade's edge, on the
// stump's top; `grip` the grip's middle, where the hand holds it. The stroke
// is the one place.js's SAW_SPAN sweeps (a cell short of the blade), laid
// over the pointer's whole swing.
const HAND_TRAVEL = (AFTER_SAW.depth.length - 1) * AP;
export function handSawAt(i, s = 0) {
  const k = clamp(s / GESTURE_SAW_AMP, -1, 1), heel = plotX(i) + (AFTER_TREE.c0 + AFTER_TREE.w) * AP + (k + 1) * HAND_TRAVEL / 2;
  const edge = groundOf('tree') - AFTER_TREE.stump * AP, half = AFTER_SAW.grip * AP / 2;
  return { heel, edge, grip: { x: heel + half, y: edge - half } };
}

// Each station's motion: `grab(g, x, y)` the part under a world point, if
// any; `down` taking it ('tap' when nothing is held after), `move`, `up`,
// `step(g, dt)` a frame, and `open()` whether it can be worked now at all.
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
    // F1 (track B): the hand saw lies across every grown trunk from the
    // start, nothing bought (the owner, 2026-10-30: "the player can always
    // cut the tree down, the saw unlocks worker automation"), and no icon: a
    // press on the saw anywhere along its stroke, or on the tree itself,
    // takes it. `on` the tree whose saw the hand last took (every other lies
    // at rest), `s` where along its stroke, `dust` the bites whose sawdust is
    // still in the air (render/after/saw.js draws it off when and where each
    // bite was).
    init: () => ({ on: null, s: 0, target: 0, s0: 0, gx: 0, from: 0, v: 0, grab: false, dust: [] }),
    open: () => trees().some(standing),
    grab(g, x, y) {
      const list = trees();
      for (let i = 0; i < list.length; i++) if (standing(list[i]) && inBox(x, y, stationParts('tree', i).sawBox, G_S)) return i;
      return treeAt(x, y);
    },
    down(g, i, x) {
      if (g.on !== i) Object.assign(g, { on: i, s: 0, target: 0, from: 0, v: 0 });
      g.grab = true; g.gx = x; g.s0 = g.target;
      return true;
    },
    move(g, x) { g.target = clamp(g.s0 + (x - g.gx), -GESTURE_SAW_AMP, GESTURE_SAW_AMP); },
    up(g) { g.grab = false; },
    step(g, dt) {
      if (g.dust.length) g.dust = g.dust.filter(d => T() - d.at < AFTER_SAWDUST.life);
      const p = g.on != null && trees()[g.on];
      if (!p || !standing(p)) { g.v *= Math.exp(-6 * dt); g.from = 0; g.s = 0; g.target = 0; if (!(p && p.fall != null)) g.on = null; g.grab = false; return; }
      const prev = g.s;
      g.s += clamp((g.target - g.s) * Math.min(1, dt * GESTURE_SAW_FOLLOW), -GESTURE_SAW_VMAX * dt, GESTURE_SAW_VMAX * dt);
      g.v += (Math.abs(g.s - prev) / dt - g.v) * Math.min(1, dt * GESTURE_SAW_EASE);
      const end = g.s <= -GESTURE_SAW_END * GESTURE_SAW_AMP ? -1 : g.s >= GESTURE_SAW_END * GESTURE_SAW_AMP ? 1 : 0;
      // A stroke is end to end: the first end reached only sets the saw going.
      // Each stroke that cuts throws sawdust off the kerf, the last more.
      if (end && end !== g.from) {
        if (g.from && chopTree(g.on, true)) {
          used(g);
          g.dust.push({ at: T(), i: g.on, n: p.fall != null ? AFTER_SAW_HEFT.lastSpecks : AFTER_SAW_HEFT.specks });
        }
        g.from = end;
      }
    },
  },
  // --- track C: the stump, F3a-1 "the earth gives" (DESIGN.md, "Act 3's grove,
  // rebuilt"; after/stump.js holds the rule this shares with the woodcutter) ---
  stump: {
    // `i` the stump taken hold of, `lift` px it is up toward `target`,
    // `strain` held past the strain height; `snap`, `snapK` and `snapI` the
    // last root to go, for the drawing's jerk and dirt; `mote` the stump come
    // out into the hand, swinging in to the pointer.
    init: () => ({ i: null, lift: 0, target: 0, y0: 0, grab: false, strain: 0, snap: null, snapK: null, snapI: null, mote: null }),
    open: () => trees().some(pullable),
    // The stump itself is the handle: the block as drawn, a little slack
    // round it, no icon.
    grab(g, x, y) {
      const list = trees();
      for (let i = 0; i < list.length; i++) if (pullable(list[i]) && inBox(x, y, stationParts('stump', i).stump, G_S)) return i;
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
      settleHeld(g, dt);
      const p = g.i != null && trees()[g.i];
      if (!p || !pullable(p)) { g.lift = Math.max(0, g.lift - GESTURE_STUMP_SINK * dt); g.grab = false; return; }
      if (g.grab) g.lift += (g.target - g.lift) * Math.min(1, dt * GESTURE_STUMP_FOLLOW);
      else g.lift = Math.max(0, g.lift - GESTURE_STUMP_SINK * dt);
      if (!strainStep(g, dt, g.grab, g.lift)) return;
      snapRoot(g, g.i, p.dug);
      // The last root and it is out: into the pointer's hand that holds it,
      // which from here is the one hand's to carry and let go (the pad's A
      // holds no hand, so its stump is laid where it came out).
      const hand = held === 'stump';
      if (digStump(g.i, true, hand ? intoHand(g, g.i, g.lift) : null)) used(g);
      if (!stumped(p)) {
        Object.assign(g, { grab: false, lift: 0, target: 0 });
        if (hand) { held = null; heldWhat = null; }
      }
    },
  },
  // --- end track C ---
  mill: {
    // `w` the wheel's spin by the hand, radians a second, and `acc` how far
    // the pointer turned it since the last frame, `prog` the turns the hand
    // has given it since it took hold; the wheel itself is the machine's
    // (mill.js), turned only through `turnWheel`.
    init: () => ({ w: 0, grab: false, pa: 0, acc: 0, prog: 0 }),
    open: () => built('mill'),
    grab(g, x, y) {
      const c = stationParts('mill').wheel;
      return Math.hypot(x - c.x, y - c.y) <= c.r + G_S * 2 ? true : null;
    },
    down(g, h, x, y) { const c = stationParts('mill').wheel; g.grab = true; g.prog = 0; g.pa = Math.atan2(y - c.y, x - c.x); return true; },
    move(g, x, y) {
      const c = stationParts('mill').wheel, na = Math.atan2(y - c.y, x - c.x), d = wrap(na - g.pa);
      g.acc += d; g.pa = na;
    },
    up(g) { g.grab = false; },
    step(g, dt) {
      let d;
      if (g.grab) { g.w += (g.acc / dt - g.w) * Math.min(1, dt * GESTURE_WHEEL_EASE); d = g.acc; }
      else {
        g.w *= Math.exp(-GESTURE_WHEEL_COAST * dt);
        if (revOf(g) <= GESTURE_WHEEL_MIN_REV) g.w = 0;
        d = g.w * dt;
      }
      // A heavy wheel: spun past its cap it turns no faster. Each stroke the
      // turn lands is a motion of the hand's; a stopped saw with a log on its
      // bed holds the wheel at its top, and the spin dies there.
      const cap = GESTURE_WHEEL_MAX_REV * 2 * Math.PI * dt, want = clamp(d, -cap, cap);
      // what the pointer turned past the cap waits for the next step (a long
      // frame is several), but never more than a step's worth: the wheel lags
      // a hand spinning it too fast, it does not run on after it
      if (g.grab) g.acc = clamp(g.acc - want, -cap, cap);
      if (!want) return;
      const n0 = strokesLanded(), went = turnWheel(want / (2 * Math.PI), true) * 2 * Math.PI;
      g.prog += Math.abs(went) / (2 * Math.PI);
      if (want > 0 && went < want - 1e-9) g.w = 0;
      if (strokesLanded() > n0) used(g);
    },
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
      if (benchShort() && g.nails.every(n => n === 0)) return 'tap';   // no blank without timber
      if (lastTap(g) && !signFits()) return 'tap';                      // the last blow waits for a sign it can make
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
      if (g.nails.every(n => n === 0) && benchShort()) return;
      if (lastTap(g) && !signFits()) return;
      const k = g.nails.findIndex(n => n < GESTURE_NAIL_TAPS);
      g.auto = t; g.strike = t; g.hit = k; g.nails[k] += 1;
      settleSign(g);
    },
  }
};
// The timber a blank is cut from: the workshop's own bench pile where it has
// one (track B's `benchtimber`), else the timber mound.
const benchTimber = () => pileCount('benchtimber');
const benchShort = () => benchTimber() < AFTER_SIGN_TIMBER;
// Whether the blow about to land is the one that drives the last nail flush.
const lastTap = g => g.nails.reduce((n, k) => n + (GESTURE_NAIL_TAPS - k), 0) === 1;
// Whether a sign could be made now: timber on the bench for it and room in
// the rack (its brim, where the rack is a counted pile), so the last nail is
// never driven only for the four to be pulled with no sign made.
function signFits() {
  const brim = AFTER_PILES.signs?.brim;
  return !benchShort() && (brim == null || pileCount('signs') < brim);
}
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
let G = null, seen = null, held = null, heldWhat = null, lastPress = null, pressAt = null, hovered = null; // cache: keyed by the act (`S.after.begun`) and its clock; a new act or a clock run back stands them still
const actId = () => (S.after ? S.after.begun : null);
// An act begun afresh in the same session (a new game) may share a seed with
// the last, but its clock starts again: that stands everything still too.
let lastT = 0; // cache: the act's clock last frame, half of the key above
function recs() {
  const back = S.after && S.after.t < lastT;
  lastT = S.after ? S.after.t : 0;
  if (seen !== actId() || back) {
    seen = actId(); held = null; heldWhat = null; lastPress = null; pressAt = null; hovered = null;
    G = Object.fromEntries(GESTURE_KEYS.map(k => [k, { ...fresh(), ...DEFS[k].init() }]));
  }
  return G;
}
const live = () => afterlifeOn() && !!S.after;

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
// bubble, the bubble's; on a moving part (a tree's saw among them), the part
// held until the release. A press on anything else is
// the pointer's: a station's board (the one station table, stations.js), else
// the place's click (input.js asks this first).
export function gestureDown(x, y) {
  if (!live()) return false;
  const g = recs();
  held = null; heldWhat = null; pressAt = { x, y };
  if (DEFS.pedestal.open()) {
    const b = bubbleAt(x, y);
    if (b) { lastPress = 'bubble'; DEFS.pedestal.down(g.pedestal, b); return true; }
  }
  const part = partAt(x, y);
  if (part) {
    lastPress = 'part';
    if (DEFS[part.key].down(g[part.key], part.what, x, y) === true) { held = part.key; heldWhat = part.what; }
    return true;
  }
  lastPress = 'floor';
  return false;
}
// Whether the last press was the hand work's (a bubble, an icon, a part): its
// release is no tap on a station.
export const pressTaken = () => live() && seen === actId() && lastPress != null && lastPress !== 'floor';
// Whether a press at a world point would be the hand work's, asked without
// pressing: a finger landing on a part, a bubble or an icon is the game's,
// never a scroll.
export function gestureUnder(x, y) {
  if (!live()) return false;
  recs();
  return (DEFS.pedestal.open() && !!bubbleAt(x, y)) || !!partAt(x, y);
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
// The pointer over the place, no button needed (input.js, on every move of a
// mouse; null when it leaves): whose work it is on, by what a press there
// would take hold of (`gestureDown`), so the ghost hand comes back, faint,
// over the very thing it points at (DESIGN.md, "Act 3's goods are blocks",
// rule 3).
export function gestureHover(x, y) {
  if (!live() || x == null) { hovered = null; return; }
  recs();
  if (DEFS.pedestal.open() && bubbleAt(x, y)) hovered = 'pedestal';
  else hovered = partAt(x, y)?.key ?? null;
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
    // the hover's ink: in while the pointer is on the part, out once it is
    // taken hold of, back in when it is let go with the pointer still there
    const over = d.open() && hovered === key && held !== key ? 1 : 0;
    r.hint = clamp(r.hint + clamp(over - r.hint, -dt / GESTURE_HOVER_S, dt / GESTURE_HOVER_S), 0, 1);
  }
}

// --- the pad ---------------------------------------------------------------------------
// A frame of the pad on the station under its focus: `{ a, pressed,
// released, lx, ly }`, A down, pressed and let go this frame, and the left
// stick, each turned into the motion the pointer makes on the part.
export function padGesture(key, p) {
  if (!live() || !DEFS[key] || !DEFS[key].open()) return;
  const g = recs(), r = g[key], d = DEFS[key];
  if (key === 'pedestal') {                   // A pops the lowest bubble
    const b = p.pressed && lowestBubble();
    if (b) d.down(r, b);
  } else if (key === 'tree') {                // the stick side to side saws the first grown tree
    const i = trees().findIndex(standing);
    if (i < 0) return;
    if (r.on !== i) Object.assign(r, { on: i, s: 0, target: 0, from: 0 });
    r.grab = true;
    r.target = clamp(p.lx, -1, 1) * GESTURE_SAW_AMP;
  } else if (key === 'stump') {               // mash A pulls it up
    const i = trees().findIndex(stumped);
    if (i < 0) return;
    if (r.i !== i) Object.assign(r, { i, lift: 0, target: 0, strain: 0 });
    if (p.a) { r.grab = true; if (p.pressed) r.target = Math.min(GESTURE_STUMP_MAX, Math.max(r.target, r.lift) + GESTURE_PAD_PULL); }
    else { r.grab = false; r.target = 0; }
  } else if (key === 'mill') {                // the stick's turn spins the wheel
    const m = Math.hypot(p.lx, p.ly);
    if (m < GESTURE_PAD_TURN) { if (held === key) gestureUp(); else r.grab = false; return; }
    const pt = stationParts('mill').wheel;
    const x = pt.x + p.lx / m * pt.r, y = pt.y + p.ly / m * pt.r;
    if (!r.grab) { d.down(r, true, x, y); held = key; } else d.move(r, x, y);
  } else if (key === 'workshop') {            // A taps the next nail
    if (p.pressed) d.down(r, r.nails.findIndex(n => n < GESTURE_NAIL_TAPS));
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
  return GESTURE_KEYS.map(key => ({ key, open: DEFS[key].open(), held: held === key, ...g[key],
                                    hintA: smoothstep(g[key].hint) }));
}
// Where each station's parts stand, in the world (place.js).
export const partsOf = (key, i = 0) => stationParts(key, i);
