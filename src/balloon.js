// The scrubber balloon: the craft, where it is, and how a body gets into it.
//
// The scrubbing house drags the sky down to itself, and everything it catches
// comes down in one place -- a heap out the back that fouls the one strip of
// ground the house stands on, and clogs it. A balloon answers the same sky the
// other way round: it goes up into it, takes it in where it is, and drops what
// it catches wherever it happens to be. The sink stops being a heap and becomes
// the whole yard. See DESIGN.md, "The scrubber balloon".
//
// **The house stays.** This is a thing the house sells, not a thing that
// replaces it. The throat still hangs off the roof and still pulls, the fan and
// the recycler are still fitted at the house and still say what they say, the
// board is still the house's board, and a body put on the scrubbers still walks
// to the same door. What the purchase adds is a second kind of mouth.
//
// **The air is not this file's.** `smog.js` owns what is up there and what
// happens to it; this owns the craft. The one thing the two must agree on is the
// height of the sky, so a craft's cruising height is derived from the same
// `bandTop`/`bandLow` pair the motes are placed against rather than from a
// constant of its own -- see `craftY`. The two files call each other's
// functions and neither reads the other's values at load time, which is what
// keeps the ring from biting; see the note on `airRows` in scrubhouse.js for
// what happens when one does.

import { P, WORKER, FARM_WALK, BALLOON_RUNGS, BALLOON_DUST, BALLOON_RATE,
         BALLOON_PACE, BALLOON_LIFT, BALLOON_W, BALLOON_H, BALLOON_BASKET,
         BALLOON_LANE_TOP, BALLOON_LANE_GAP, BALLOON_EDGE,
         BALLOON_FILTER_W, BALLOON_FILTER_H,
         BALLOON_BOB, BALLOON_WIND, BALLOON_SWING, BALLOON_LEAVE } from './config.js';
import { S, scrub } from './state.js';
import { frames, now } from './clock.js';
import { bandTop, bandLow } from './smog.js';
import { walkY, yardLeft } from './world.js';
import { windAt } from './wind.js';

// --- the craft ----------------------------------------------------------------------
// An array of craft, not a count, from the very first one. A fleet is more
// entries rather than a rewrite, and every question anybody asks about a balloon
// -- where is it, who is in it, what is under it -- is a question about one
// particular craft.
//
// A craft is `{ x, dir, lift }` and nothing else.
//
//   x     where it is along the world, in world pixels. Moved in **whole pixels**
//         and never snapped to the lattice, exactly as the tractor is: it is a
//         thing in the air, not a thing standing on the ground, and a craft that
//         jumped six pixels at a time would be the only thing in the sky that
//         did.
//   dir   which way it is going, +1 or -1.
//   lift  how far up it is, nought at the mast and one at its lane. This is the
//         one number here that is not geometry, and it is kept because it is a
//         *state* rather than a position -- a craft on its way up is a fact about
//         what it is doing, and the height it is drawn at is read off it.
//
// Its lane -- which height of the sky it cruises at -- is its index and not a
// stored number, so two craft cannot come to disagree about which is which.
export const CRAFT = [];

export const craftCount = () => CRAFT.length;

// What one more costs. A finite ladder, in dust, on the house's own board: one
// number the station owns, one ladder, priced like every other rung in the yard.
export const craftCost = () => Math.round(BALLOON_DUST * Math.pow(BALLOON_RATE, CRAFT.length));

// A craft is bought moored, with nobody in it. That is the honest picture and it
// is the same one every other station gives when you buy the room before the
// body: a balloon tied to a post, visibly doing nothing.
export function buyCraft() {
  CRAFT.push({ x: mastX(), dir: CRAFT.length % 2 ? -1 : 1, lift: 0, rise: 0, leaving: false });
  S.dirty = true;
}

// --- where it is ----------------------------------------------------------------------
// The mast: over the roof of the scrubbing house, at the door a body already
// walks to. Derived every time rather than stored, like every other bit of
// geometry in this yard -- the house is re-sited whenever the yard is laid out
// again, and a mast with a remembered x would be standing in a field.
// To the *right* of the building, clear of it, rather than over the middle of
// the roof. Moored, a balloon stands with its basket on the ground and its
// envelope a dozen cells up -- which over the middle of a twenty-cell house is a
// bag drawn straight through the hood, the throat and the bellows, and a body
// getting into a basket standing inside the building.
//
// The right, because the left is spoken for: the spout is on that wall and the
// heap it makes stands off it, see `scrubHeap` in world.js.
export const mastX = () => scrub.x + scrub.w + P * 5;

// The height a craft cruises at, off the same pair the motes are placed against.
// Lane by lane down the top of the sky, so a fleet crosses rather than passing
// through itself.
//
// Off `bandTop`/`bandLow` and not off a constant: the sky is read from the
// window and the ground line, so a craft with a height of its own would be
// cruising above the haze on a tall window and in the dirt on a short one -- and
// the one thing the craft and the air must agree about is where the sky is.
export function laneY(i) {
  const top = bandTop(), deep = bandLow() - top;
  return top + deep * Math.min(0.9, BALLOON_LANE_TOP + i * BALLOON_LANE_GAP);
}

// Where a craft's basket sits, this frame: on the ground at the mast when it is
// down, at its lane when it is up, and eased between the two by `lift`.
//
// **The basket is what a body gets into, and when the craft is moored it is on
// the ground.** That is the whole answer to the one question this feature could
// most easily get wrong. Nothing in this yard arrives anywhere it did not walk
// to, and a body stepping into the sky is the most tempting place in the game to
// break that -- so there is no climb and no lift, because there is nothing to
// climb. The thing came down to be got into.
export function craftY(i) {
  const c = CRAFT[i];
  if (!c) return 0;
  const down = walkY(c.x) - BALLOON_BASKET;      // basket on the ground at the mast
  // The lane, plus whatever the craft's own slow breath is doing to it. Scaled by
  // `lift`, so a balloon on the ground does not bob -- a thing tied down and
  // loaded does not float, and one that did would look like it was about to be
  // stepped into by somebody chasing it.
  const up = laneY(i) + bobOf(i) * c.lift - (c.rise || 0);
  return down + (up - down) * c.lift;
}

// The filter: the box slung between the envelope and the basket, and the whole
// of what makes a balloon read as a thing that cleans rather than a thing that
// floats.
//
// A bag with a basket under it is a balloon. What says *scrubber* is the works
// hanging in between -- a vented housing the air is drawn into at the top and
// what is caught falls out of the bottom. So the craft's mouth is the filter's
// intake and its drop is the filter's underside, and those are two different
// places on the same box rather than one point standing for both.
export const filterTop = i => craftY(i) - BALLOON_BASKET - BALLOON_FILTER_H;
export const craftMouth = i => ({ x: CRAFT[i].x, y: filterTop(i) });
// ...and where what it catches leaves it: the lip under the box, so a grain
// falls out of the bottom of the works rather than out of the middle of the air.
export const craftDrop = i => ({ x: CRAFT[i].x, y: craftY(i) - BALLOON_BASKET });

// --- who is in it ---------------------------------------------------------------------
// A fact about the body, not about the craft.
//
// `w.craft` is the index it is riding, the way `goal: 'in'` is how the house
// says the same thing. One place to forget rather than two that can disagree --
// and a craft holds no reference to a worker, so a body knocked off its job, sent
// to the loo or taken off the roster cannot leave a craft believing it is still
// crewed.
export const riderOf = i => S.workers.find(w => w.craft === i && w.goal === 'aloft') || null;
export const crewed = i => !!riderOf(i);

// A craft only works while it is crewed *and* actually up there. A body walking
// across the yard to a balloon is a body not yet in it, which is the same rule
// the house has always run on.
export const working = i => crewed(i) && CRAFT[i].lift > 0.98;

// Which berth a body on the scrubbers takes: `-1` for the house, or the index of
// a craft.
//
// **Claimed once and kept.** The first cut worked this out from the body's place
// in the roster -- the house to the first scrubber, craft to the rest -- and that
// is a berth that changes under the body, because the roster's order is not
// stable. What it did was hand the house's berth to whichever scrubber happened
// to sort first *this frame*, and when that was the one already up in a balloon
// it was pulled straight back out of it: the craft rose a few pixels, lost its
// rider, sank, and did it again for as long as anybody watched.
//
// So a berth is a claim. A body takes the first one nobody else holds and keeps
// it until it stops being a scrubber, which is what makes "the place a body walks
// to is decided before it sets off and does not change under it" actually true
// rather than only written down.
export function berthFor(w) {
  const others = S.workers.filter(o => o !== w && o.type === 'scrubber' && o.berth != null);
  const taken = new Set(others.map(o => o.berth));
  // What it already holds, if that is still a real place and still its own. The
  // ladder only goes up, so a craft is never sold out from under anybody -- but
  // a save from a smaller fleet can land a body on a craft that is not there.
  if (w.berth != null && !taken.has(w.berth) && (w.berth < 0 || w.berth < CRAFT.length)) {
    return w.berth;
  }
  if (!taken.has(-1)) return (w.berth = -1);
  for (let i = 0; i < CRAFT.length; i++) if (!taken.has(i)) return (w.berth = i);
  // Every berth spoken for. It stands in the house with the other one rather than
  // wandering off: `capOf` should not have let it be assigned at all, and a body
  // with nowhere to be is a body to put somewhere obvious.
  return (w.berth = -1);
}

// **Over the side.** A rider taken off the scrubbers does not ride the craft
// home; it puts an umbrella up, steps out, and the balloon goes
// up without it.
//
// Called from `retask`, which is the one place a body's job is taken away from
// it, and *after* that has already set `floating` -- so `aloft` is deliberately
// left standing here. A body under an umbrella is still in the sky, and clearing
// it would hand the body straight back to the fall rule, which is the thing
// `aloft` exists to keep away from it. `floatDown` clears all three when its feet
// are down.
export function bailOut(w) {
  if (w.craft == null) return;
  w.brolly = true;
  w.craft = null;
  w.berth = null;
  if (w.goal === 'aloft') w.goal = 'to';
}

// Out of the basket, but still on the scrubbers: it keeps its berth and goes
// back to walking. Used when a body's berth turns out to be the house after all.
export function dismount(w) {
  w.craft = null;
  w.aloft = false;
  if (w.goal === 'aloft') w.goal = 'to';
}

// And out of the job altogether. A berth left on a body that has gone off to the
// rock keeps a balloon empty for the rest of the run.
export function leaveBerth(w) {
  w.berth = null;
  w.craft = null;
  if (w.goal === 'aloft') { w.goal = 'to'; w.aloft = false; }
}

// --- the wander ------------------------------------------------------------------
// What keeps a craft from reading as a thing on rails.
//
// A balloon crossing the yard at a fixed pace on a fixed line is a tram. What it
// is *supposed* to be is a bag of air being carried about by the same weather
// everything else in this sky answers to -- so it leans on the wind, it rises and
// settles on its own slow breath, and it never quite repeats.
//
// **Derived, never stored.** All of it comes off the clock and the craft's own
// index, so there is nothing here to save, nothing to restore, and nothing that
// can come back out of a save disagreeing with where the thing is drawn. The
// same rule the machines keep about their geometry.
//
// Two swings pulling against each other rather than one, and their periods do
// not divide into each other -- which is the trick the wind itself uses, and the
// reason it never settles into a beat you could count. One sine is a pendulum
// and you can see it coming.
const BOB_A = 7.9, BOB_B = 11.3;      // seconds, and deliberately not a ratio

// Each craft gets its own place in both swings, off the golden ratio, so no two
// of them ever rise and fall together.
const phase = i => i * 0.6180339887498949 * Math.PI * 2;

// How far off its lane a craft is floating, this instant.
export function bobOf(i) {
  const t = now() / 1000, p = phase(i);
  return (Math.sin(t / BOB_A * Math.PI * 2 + p) * 0.62
        + Math.sin(t / BOB_B * Math.PI * 2 + p * 1.7) * 0.38) * BALLOON_BOB;
}

// And what the wind is doing to its pace. With the weather it runs on; against
// it it labours -- the same number the sky's own creep and the band's sway are
// driven by, so a gust that leans the haze leans the balloon carrying it.
//
// Never to a standstill and never backwards: a craft that stopped dead in a lull
// would look broken rather than becalmed, and one blown back the way it came
// would be a thing with no engine, which is not what this is. It is a balloon
// with a fan in it.
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

    // **A craft that has lost its rider in the air does not come home.** It goes
    // up, out of the top of the window, and turns up again moored at the mast --
    // which is what a balloon nobody is flying does, and it is a far better
    // picture than a bag drifting back across the yard on its own and settling
    // itself neatly on a post.
    //
    // Only from properly up. One still climbing off the mast has not gone
    // anywhere and simply settles back down, which is what "the body changed its
    // mind on the way over" ought to look like.
    if (want === 1) c.leaving = false;
    else if (c.lift > 0.999) c.leaving = true;

    if (c.leaving) {
      c.rise += BALLOON_LEAVE * f;
      c.x += c.dir * BALLOON_PACE * paceOf(i) * f;
      // Gone: over the top of the window and out of it, envelope and all. It
      // comes back at its mast with nothing remembered about the trip -- which
      // is a jump, and the one place in this game a jump is honest, because
      // there is nobody who could be looking at it.
      if (craftY(i) + BALLOON_H + BALLOON_FILTER_H + BALLOON_BASKET < S.camY) {
        c.x = mastX();
        c.lift = 0;
        c.rise = 0;
        c.leaving = false;
      }
      continue;
    }

    // Up when somebody is aboard, down when they are not, and eased either way.
    // A craft that snapped between the mast and its lane would be a thing that
    // teleported, which is the one move this yard never makes -- and watching it
    // go up is half of knowing somebody got in.
    const step = BALLOON_LIFT * f / Math.max(1, laneY(i) ? 1 : 1);
    if (c.lift < want) c.lift = Math.min(want, c.lift + step);
    else if (c.lift > want) c.lift = Math.max(want, c.lift - step);

    // Moored, or still on its way up: it holds the mast. A balloon that set off
    // along the yard with its basket six inches off the ground would be dragging
    // whoever was climbing in along the dirt.
    if (c.lift < 0.999) {
      const d = mastX() - c.x;
      if (Math.abs(d) > 1) c.x += Math.sign(d) * Math.min(BALLOON_PACE * f, Math.abs(d));
      else c.x = mastX();
      continue;
    }

    // Up, and crossing -- at whatever pace the weather and its own swing are
    // giving it this instant, rather than at a fixed one. See `paceOf`.
    //
    // The pace is kept *fractional* here and rounded at the moment of drawing.
    // Rounding it here instead is the obvious thing and it stops the craft dead:
    // a pace of four tenths of a pixel a frame rounds back to where it started
    // every single frame, so the balloon rose, reached its lane and then hung
    // there for ever. A thing that moves less than a pixel a frame has to
    // remember the part of the pixel it has moved.
    c.x += c.dir * BALLOON_PACE * paceOf(i) * f;
    const from = yardLeft() + BALLOON_EDGE * P;
    const to = Math.max(from + P, (S.worldW || 0) - BALLOON_EDGE * P);
    if (c.x <= from) { c.x = from; c.dir = 1; }
    if (c.x >= to) { c.x = to; c.dir = -1; }
  }
}

// --- the body walking to it -------------------------------------------------------------
// A scrubber whose berth is a craft. It walks to the mast on its feet -- the same
// walk it already makes to the door -- and steps into the basket at ground level.
//
// It returns true when it has taken the body for this frame, so the house's own
// stepper is left holding only the bodies that are actually going into the house.
export function stepRider(w, berth) {
  if (w.goal === 'aloft') {
    // Aboard. Its place is the craft's place, read off the craft every frame
    // rather than stepped alongside it: a body carried by a thing is at that
    // thing, and two positions kept in step is two positions that can drift.
    const c = CRAFT[berth];
    if (!c) { w.goal = 'to'; w.craft = null; w.aloft = false; return false; }
    w.x = c.x - WORKER / 2;
    w.y = craftY(berth) - WORKER;
    return true;
  }

  w.y = walkY(w.x + WORKER / 2);
  const c = CRAFT[berth];
  // To the basket, which is at the mast and on the ground -- and only worth
  // walking to while it is actually down. A craft still coming home is a craft
  // the body waits at the mast for.
  const d = mastX() - WORKER / 2 - w.x;
  if (Math.abs(d) >= 1) {
    // Times the frame, like the craft above it (see `frames` in clock.js).
    // The walk to the mast was written before the rest of the file was put on
    // the clock and was left behind: at thirty hertz a scrubber crossed to its
    // basket at half speed while the craft it was boarding rose on time.
    w.x += Math.sign(d) * Math.min(FARM_WALK * frames(), Math.abs(d));
    return true;
  }
  w.x = mastX() - WORKER / 2;
  if (c && c.lift < 0.02 && Math.abs(c.x - mastX()) < 1) {
    // Aloft, and out of the yard's reach. **This flag is the whole of what keeps
    // a rider in the sky.** The fall rule runs early in the crew pipeline -- long
    // before anything a station gets to say -- and a body several hundred pixels
    // above the ground with nothing under it is exactly what it is looking for:
    // it caught the rider, settled it back on the ground and handed it a fresh
    // errand, so the craft rose a few pixels, lost its rider, sank, and did it
    // again for as long as anybody watched. `aloft` is how the wizard escapes
    // the same rule, and a body in a basket is in the sky for the same reasons.
    //
    // It also buys the right ending for free: `retask` floats an `aloft` body
    // down rather than dropping it, so a rider taken off the scrubbers comes
    // down the way it went up.
    w.aloft = true;
    w.goal = 'aloft';                  // in, and the craft takes it from here
    w.craft = berth;
  }
  return true;
}

// --- the save -------------------------------------------------------------------------
// Two numbers and an eased height per craft. The lane is the index, the mast is
// the house's own geometry and who is aboard is a fact about the body, so none
// of those are written down.
export const craftSave = () => CRAFT.map(c => ({ x: Math.round(c.x), dir: c.dir, lift: c.lift }));

export function craftLoad(list) {
  CRAFT.length = 0;
  for (const c of (list || [])) {
    CRAFT.push({
      x: Number.isFinite(c.x) ? c.x : mastX(),
      dir: c.dir < 0 ? -1 : 1,
      lift: Math.max(0, Math.min(1, c.lift || 0)),
      // A craft caught mid-departure comes back moored rather than half way out
      // of the window. There is nothing worth saving about a trip whose whole
      // point is that it ends off screen.
      rise: 0, leaving: false
    });
  }
}

export const clearCraft = () => { CRAFT.length = 0; };

// What the board offers. A finite ladder on the building that owns the number,
// which is what the rule in TODO item 2 asks for: one number, one ladder, on its
// own station's board.
export const CRAFT_ROW = {
  key: 'balloon',
  // Built at the scrubbing house, where it is moored. A craft is a machine and
  // takes a machine's time; it used to appear in the sky the instant you paid.
  kind: 'machine', site: 'scrub',
  name: 'the balloon',
  note: () => 'rides the sky and drops what it catches under itself',
  rung: () => CRAFT.length,
  cost: craftCost,
  currency: 'dust',
  buy: buyCraft,
  show: () => S.scrubOpen && CRAFT.length < BALLOON_RUNGS
};

export { BALLOON_W, BALLOON_H, BALLOON_BASKET, BALLOON_FILTER_W, BALLOON_FILTER_H };
