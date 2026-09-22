// The purifier balloon: the craft, where it is, and how a body gets into it.
//
// The house drags the sky down to a heap out the back; a balloon goes up into
// it and drops what it catches wherever it is. See DESIGN.md, "The purifier
// balloon". It is a thing the house sells, not a replacement: the throat, the
// fan, the board and the door are all still the house's.
//
// `smog.js` owns the air; this owns the craft. The one thing a craft must
// agree with the sky on is where the clouds are, since it rides under them and
// its thread reaches up to one (`laneY`, thread.js). The files call each
// other's functions and none reads another's values at load time, which is
// what keeps the import ring from biting.

import { P, WORKER, FARM_WALK, BALLOON_DUST, BALLOON_RATE,
         BALLOON_PACE, BALLOON_LIFT, BALLOON_W, BALLOON_H, BALLOON_BASKET,
         BALLOON_UNDER, BALLOON_LANE_STEP, BALLOON_CLEAR, BALLOON_EDGE, CLOUD_TOP, CLOUD_LANES,
         BALLOON_FILTER_W, BALLOON_FILTER_H,
         BALLOON_BOB, BALLOON_WIND, BALLOON_SWING, BALLOON_LEAVE, BALLOON_MAST_GAP,
         FILTER_HOOD, DIAL_CELLS, DIAL_STUB } from './config.js';
import { S, filter } from './state.js';
import { frames, now } from './clock.js';
import { walkY, yardLeft } from './world.js';
import { windAt } from './wind.js';
import { TYPE } from './jobs.js';

// --- the craft ----------------------------------------------------------------------
// A craft is `{ x, dir, lift }`.
//
//   x     world pixels, moved in **whole pixels** and never snapped to the
//         lattice, like the tractor: a thing in the air that jumped six
//         pixels at a time would be the only thing in the sky that did.
//   dir   which way it is going, +1 or -1.
//   lift  nought at the mast, one at its lane. A state, not a position: the
//         height it is drawn at is read off it.
//
// Its lane is its index, not a stored number, so two craft cannot disagree
// about which is which.
export const CRAFT = [];

export const craftCount = () => CRAFT.length;

// What one more costs: a finite ladder in dust on the house's own board.
export const craftCost = () => Math.round(BALLOON_DUST * Math.pow(BALLOON_RATE, CRAFT.length));

// Bought moored, with nobody in it, like every other station that sells the
// room before the body.
export function buyCraft() {
  CRAFT.push({ x: mastX(), dir: CRAFT.length % 2 ? -1 : 1, lift: 0, rise: 0, leaving: false });
}

// --- where it is ----------------------------------------------------------------------
// The mast: to the right of the air filter, clear of its dial. Derived, not
// stored, since the house is re-sited whenever the yard is laid out, and off
// where the dial ends rather than where the building does, or a moored craft
// stands over the gauge. Over the middle of the roof a moored envelope is
// drawn straight through the hood and the bellows; the left is the spout's
// wall and its heap (`filterHeap` in world.js).
const dialEnd = () => filter.x + filter.w - P * (FILTER_HOOD - 1) + P * (DIAL_STUB + DIAL_CELLS);
export const mastX = () => dialEnd() + P * BALLOON_MAST_GAP + BALLOON_FILTER_W / 2;

// The height a craft cruises at, lane by lane, under the clouds it pulls on
// (thread.js). Off where the middle sheet's bases can be (`cloudY` in
// weather.js puts a base CLOUD_TOP cells under the camera and its lane below
// that), so the clouds and the craft cannot disagree about which is higher;
// held off the ground so a fleet on a short window does not ride through the
// works.
const CRAFT_TALL = BALLOON_H + BALLOON_FILTER_H + BALLOON_BASKET;
export function laneY(i) {
  const under = S.camY + P * (CLOUD_TOP + CLOUD_LANES.mid[1] + BALLOON_UNDER + i * BALLOON_LANE_STEP) + CRAFT_TALL;
  return Math.min(under, S.groundY - P * BALLOON_CLEAR);
}

// Where a craft's basket sits this frame: on the ground at the mast when
// down, at its lane when up, eased between by `lift`.
//
// **When the craft is moored the basket is on the ground.** Nothing in this
// yard arrives anywhere it did not walk to, so there is no climb and no
// lift: the thing came down to be got into.
export function craftY(i) {
  const c = CRAFT[i];
  if (!c) return 0;
  const down = walkY(c.x) - BALLOON_BASKET;      // basket on the ground at the mast
  // The bob is scaled by `lift` so a balloon on the ground does not float.
  const up = laneY(i) + bobOf(i) * c.lift - (c.rise || 0);
  return down + (up - down) * c.lift;
}

// The filter: the box slung between the envelope and the basket, which is
// what makes a balloon read as a thing that cleans. The mouth is its intake
// at the top and the drop is its underside, two different places on one box.
export const filterTop = i => craftY(i) - BALLOON_BASKET - BALLOON_FILTER_H;
export const craftMouth = i => ({ x: CRAFT[i].x, y: filterTop(i) });
export const craftDrop = i => ({ x: CRAFT[i].x, y: craftY(i) - BALLOON_BASKET });

// --- who is in it ---------------------------------------------------------------------
// A fact about the body, not the craft: `w.craft` is the index it is riding.
// A craft holds no reference to a worker, so a body knocked off its job or
// taken off the roster cannot leave a craft believing it is still crewed.
export const riderOf = i => S.workers.find(w => w.craft === i && w.goal === 'aloft') || null;
export const crewed = i => !!riderOf(i);

// A craft only works while crewed *and* actually up there; a body walking to
// a balloon is not yet in it.
export const working = i => crewed(i) && CRAFT[i].lift > 0.98;

// Which berth a body on the purifiers takes: `-1` for the house, or the index
// of a craft. **Claimed once and kept.** A berth worked out from the body's
// place in the roster changes under it, because the roster's order is not
// stable: the rider already aloft was handed the house's berth and pulled
// straight back out of its craft, over and over.
export function berthFor(w) {
  const others = S.workers.filter(o => o !== w && o.type === TYPE.PURIFY && o.berth != null);
  const taken = new Set(others.map(o => o.berth));
  // What it already holds, if that is still a real place: a save from a
  // smaller fleet can land a body on a craft that is not there.
  if (w.berth != null && !taken.has(w.berth) && (w.berth < 0 || w.berth < CRAFT.length)) {
    return w.berth;
  }
  if (!taken.has(-1)) return (w.berth = -1);
  for (let i = 0; i < CRAFT.length; i++) if (!taken.has(i)) return (w.berth = i);
  // Every berth spoken for: `capOf` should not have let it be assigned, and
  // a body with nowhere to be goes somewhere obvious.
  return (w.berth = -1);
}

// **Over the side.** A rider taken off the purifiers puts an umbrella up and
// steps out; the balloon goes up without it.
//
// Called from `retask`, *after* it has set `floating`, so `aloft` is
// deliberately left standing: a body under an umbrella is still in the sky,
// and clearing it hands the body to the fall rule. `floatDown` clears all
// three when its feet are down.
export function bailOut(w) {
  if (w.craft == null) return;
  w.brolly = true;
  w.craft = null;
  w.berth = null;
  if (w.goal === 'aloft') w.goal = 'to';
}

// Out of the basket, but still on the purifiers: it keeps its berth. Used
// when a body's berth turns out to be the house after all.
export function dismount(w) {
  w.craft = null;
  w.aloft = false;
  if (w.goal === 'aloft') w.goal = 'to';
}

// --- the wander ------------------------------------------------------------------
// What keeps a craft from reading as a tram: it leans on the wind, rises and
// settles on its own breath, and never quite repeats. All derived off the
// clock and the craft's index, so nothing here is saved or can disagree with
// where the thing is drawn.
//
// Two swings whose periods do not divide, the wind's own trick: one sine is
// a pendulum and you can see it coming.
const BOB_A = 7.9, BOB_B = 11.3;      // seconds, and deliberately not a ratio

// Each craft gets its own place in both swings, off the golden ratio, so no
// two rise and fall together.
const phase = i => i * 0.6180339887498949 * Math.PI * 2;

// How far off its lane a craft is floating, this instant.
export function bobOf(i) {
  const t = now() / 1000, p = phase(i);
  return (Math.sin(t / BOB_A * Math.PI * 2 + p) * 0.62
        + Math.sin(t / BOB_B * Math.PI * 2 + p * 1.7) * 0.38) * BALLOON_BOB;
}

// The wind's effect on its pace, off the same number the haze leans on.
// Never to a standstill (looks broken) and never backwards (it has a fan).
const paceOf = i => {
  const w = windAt(now());
  const own = Math.sin(now() / 1000 / BOB_B * Math.PI * 2 + phase(i));
  return Math.max(0.35, 1 + w * BALLOON_WIND * CRAFT[i].dir + own * BALLOON_SWING);
};

// --- one frame ------------------------------------------------------------------------
export function stepBalloons() {
  const f = frames();
  for (let i = 0; i < CRAFT.length; i++) {
    const c = CRAFT[i];
    const want = crewed(i) ? 1 : 0;

    // **A craft that has lost its rider in the air does not come home.** It
    // goes up out of the window and turns up again moored at the mast. Only
    // from properly up: one still climbing off the mast settles back down.
    if (want === 1) c.leaving = false;
    else if (c.lift > 0.999) c.leaving = true;

    if (c.leaving) {
      c.rise += BALLOON_LEAVE * f;
      c.x += c.dir * BALLOON_PACE * paceOf(i) * f;
      // Gone over the top of the window: back at its mast with nothing
      // remembered. The one honest jump in the game, since nobody can be
      // looking at it.
      if (craftY(i) + BALLOON_H + BALLOON_FILTER_H + BALLOON_BASKET < S.camY) {
        c.x = mastX();
        c.lift = 0;
        c.rise = 0;
        c.leaving = false;
      }
      continue;
    }

    // Up when somebody is aboard, down when not, eased either way: watching
    // it go up is half of knowing somebody got in.
    const step = BALLOON_LIFT * f;
    if (c.lift < want) c.lift = Math.min(want, c.lift + step);
    else if (c.lift > want) c.lift = Math.max(want, c.lift - step);

    // Moored, or still on its way up: it holds the mast, or it would drag
    // whoever was climbing in along the dirt.
    if (c.lift < 0.999) {
      const d = mastX() - c.x;
      if (Math.abs(d) > 1) c.x += Math.sign(d) * Math.min(BALLOON_PACE * f, Math.abs(d));
      else c.x = mastX();
      continue;
    }

    // Up and crossing at whatever pace the weather gives it (`paceOf`). The
    // pace is kept *fractional* and rounded only when drawn: four tenths of
    // a pixel a frame rounded here is a balloon that hangs at its lane for
    // ever.
    c.x += c.dir * BALLOON_PACE * paceOf(i) * f;
    const from = yardLeft() + BALLOON_EDGE * P;
    const to = Math.max(from + P, (S.worldW || 0) - BALLOON_EDGE * P);
    if (c.x <= from) { c.x = from; c.dir = 1; }
    if (c.x >= to) { c.x = to; c.dir = -1; }
  }
}

// --- the body walking to it -------------------------------------------------------------
// A purifier whose berth is a craft walks to the mast on its feet and steps
// into the basket at ground level. Returns true when it has taken the body
// for this frame, so the house's stepper is left only the bodies going in.
export function stepRider(w, berth) {
  if (w.goal === 'aloft') {
    // Aboard: its place is read off the craft every frame rather than
    // stepped alongside it, since two positions kept in step can drift.
    const c = CRAFT[berth];
    if (!c) { w.goal = 'to'; w.craft = null; w.aloft = false; return false; }
    w.x = c.x - WORKER / 2;
    w.y = craftY(berth) - WORKER;
    return true;
  }

  w.y = walkY(w.x + WORKER / 2);
  const c = CRAFT[berth];
  // To the basket, only worth stepping into while it is actually down; a
  // craft still coming home is waited for at the mast.
  const d = mastX() - WORKER / 2 - w.x;
  if (Math.abs(d) >= 1) {
    // Times the frame (`frames` in clock.js), or at thirty hertz the body
    // crosses at half speed while the craft it is boarding rises on time.
    w.x += Math.sign(d) * Math.min(FARM_WALK * frames(), Math.abs(d));
    return true;
  }
  w.x = mastX() - WORKER / 2;
  if (c && c.lift < 0.02 && Math.abs(c.x - mastX()) < 1) {
    // **This flag is the whole of what keeps a rider in the sky.** The fall
    // rule runs early in the crew pipeline and a body hundreds of pixels up
    // with nothing under it is exactly what it looks for; `aloft` is how the
    // wizard escapes it too. It also makes `retask` float the body down
    // rather than drop it.
    w.aloft = true;
    w.goal = 'aloft';                  // in, and the craft takes it from here
    w.craft = berth;
  }
  return true;
}

// --- the save -------------------------------------------------------------------------
// The lane is the index, the mast is the house's geometry and who is aboard
// is a fact about the body, so none of those are written down.
export const craftSave = () => CRAFT.map(c => ({ x: Math.round(c.x), dir: c.dir, lift: c.lift }));

export function craftLoad(list) {
  CRAFT.length = 0;
  for (const c of (list || [])) {
    CRAFT.push({
      x: Number.isFinite(c.x) ? c.x : mastX(),
      dir: c.dir < 0 ? -1 : 1,
      lift: Math.max(0, Math.min(1, c.lift || 0)),
      // A craft caught mid-departure comes back moored rather than half way
      // out of the window.
      rise: 0, leaving: false
    });
  }
}

export const clearCraft = () => { CRAFT.length = 0; };

// The craft, on the save (persist.js, `SAVERS`).
export const SAVE = {
  fields: ['craft'],
  write(out) { out.craft = craftSave(); },
  read(s) { craftLoad(s.craft); },
  blank() { clearCraft(); }
};

export { BALLOON_W, BALLOON_H, BALLOON_BASKET, BALLOON_FILTER_W, BALLOON_FILTER_H };
