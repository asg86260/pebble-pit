import { now } from '../clock.js';
import { P, PUFF_FADE, SMOG_DRIFT, SMOG_LIFT, SMOG_RAIN_AT, SMOG_SINK, SMOKE_STIR_EASE, SWAY_LANES, SWAY_PACE, SWAY_X, SWAY_Y } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { gust } from '../wind.js';
import { ACTIVE, DROPS, SKY, bandLow, bandTop, creep, drift } from './band.js';
import { motesWanted, reckon, skyMote, spread } from './vents.js';

// --- how the sky is arranged -------------------------------------------------
// It does not gather, because nothing is ever pushed anywhere. Each mote is given
// a place in the band when it arrives and it keeps that place, wandering a little
// around it; the places are handed out along a sequence that never puts two near
// each other. The sky is evenly covered by construction rather than by a force
// trying to even it out afterwards.
//
// Three goes at the force version came before this and all of them clumped, for
// reasons that were each true and none of which were the point:
//
//   - Motes arriving over the rock and spreading outward settle into a mound.
//     That is what diffusion from a point source does.
//   - A levelling force sampled per bin is flat inside a bin and flips sign at
//     the edge, and a sign flip is somewhere motes collect. That builds bars.
//   - Even with both fixed, a field of motes wandering at random is *randomly*
//     lumpy. Five hundred motes scattered over a thousand columns leave a third
//     of the columns empty and put five in the fullest, and the eye reads those
//     fives as clumps -- correctly, because they are clumps. Nothing put them
//     there, which is no comfort at all when you are looking at them.
//
// A haze has no individuals in it. One mote is exactly like another and none of
// them is going anywhere in particular, so there is nothing to simulate: what is
// wanted is a number of specks spread evenly over a band, and the honest way to
// get that is to spread them evenly over the band.
//
// The golden angle does the spreading -- across, and only across. Stepping a
// fraction of a turn each time, with the fraction chosen so it never lines up
// with itself, is the arrangement seeds take on a seed head and for the same
// reason: it is the one step that leaves no gaps and makes no rows, at every
// count, without knowing the count in advance.
//
// Only the one axis gets it. This used to be two such sequences off the same
// counter -- the golden ratio across, the plastic number down -- and a pair of
// them is a lattice: every mote's place was a linear function of its number, so
// the points fell into families of diagonal lines, and the sky read as woven
// cloth. Worse, the sway lane was `k % SWAY_LANES`, a third linear function of
// the same number -- so each lane owned its own regular comb of the lattice and
// slid it across the others as one piece, which is a moving pattern by
// construction. A haze must have no pattern in it at all: evenness across is
// what the readout and the rain lean on, so that axis keeps the sequence, and
// the depth and the lane are drawn from the yard's chance instead. Depth
// variance hides inside a band a hundred pixels deep drawn in overlapping
// specks; what it buys is that no three motes are ever collinear on purpose.
const ACROSS = 0.6180339887498949;      // one turn less the golden ratio

let slots = 0;                          // handed out, never reused, never reset

// Where a slot sits, before it is allowed to wander -- worked out once, when the
// slot is handed over, and carried on the mote from then on.
//
// It used to be a function of the number, called from `place` for every mote on
// every frame, and it returned an object to say so. That is two multiplications,
// two remainders and a fresh object per mote per frame: with a full band in the
// sky it was a third of a million allocations a second to re-derive four numbers
// that cannot change, because a mote's slot never changes. `lane` goes with
// them for the same reason.
export const nextSlot = () => {
  const k = slots++;
  // The depth is the sum of two draws, not one: a uniform depth fills the band
  // corner to corner and the block ends in two ruled lines, top and bottom. Two
  // draws pile the motes toward the middle and thin them linearly to nothing at
  // both edges, so the band fades out instead of stopping -- an edge with no
  // line on it, and still no pattern, because chance has no rows in it.
  return { slot: k, su: (k * ACROSS) % 1, sv: (rand() + rand()) / 2,
           lane: Math.floor(rand() * SWAY_LANES) };
};

// Where a mote sits across the band: its slot's own place, uniform over the
// whole span from the frame it arrives. There is no stretch to open and no
// anchor to the stack that made it (wave6-sky, item 4): the haze is a total
// over the yard, and the golden-ratio `su` already covers the span evenly at
// every count. The place *down* the band is `top + m.sv * deep`, which is one
// multiply and is done inline in `place` off numbers hoisted for the frame.

// The age past which a mote's own clock stops moving it: the ease down into
// the band is finished at `SMOG_SINK`, and past that another second of age
// changes nothing about where the mote is drawn -- so the arithmetic and the
// accumulation that feed it are dead weight. See `place`.
const AGE_STILL = SMOG_SINK;

// One frame of the sky. Every mote is put where its slot says, carried along by
// the wind and lifted a little by it -- the same wind, the same instant, for all
// of them, give or take a sixth.
//
// It was a wander before: a small ellipse on each mote's own phase. The argument
// for the ellipse was sound as far as it went -- a random walk accumulates and
// ends up wherever it wandered, which is the clumping the slots exist to be rid
// of, so whatever a mote does has to be something it comes back from -- but it
// went nowhere near far enough. A field of specks each going round its own
// little circle is a field with no direction in it at all, and the sky over this
// yard shimmered where it stood while the dust below it was plainly being blown
// about.
//
// The creep is what carries them now, and it is shared, so it moves the whole
// band as one piece rather than moving the motes apart: a translation cannot
// clump, whatever it accumulates. It runs backwards on the return gust, which is
// what keeps it from being a journey.
// The lanes' offsets for this frame. Worked out once and read by every mote --
// see SWAY_LANES. Each lane is given its own phase off the golden angle so that
// twelve of them never line up into one big shared wobble, which would be the
// whole band moving as a block again.
const SWAY_DX = new Float64Array(SWAY_LANES);
const SWAY_DY = new Float64Array(SWAY_LANES);
function swayNow(t) {
  for (let i = 0; i < SWAY_LANES; i++) {
    const a = t * SWAY_PACE + i * 2.399963;
    SWAY_DX[i] = Math.sin(a) * SWAY_X;
    // Not the same rate as the sideways part, or a lane would run round a tidy
    // ellipse over and over. Slower, so the two come apart and drift.
    SWAY_DY[i] = Math.cos(a * 0.63 + i) * SWAY_Y;
  }
}

// One frame of the settled sky, and the one loop in this game that used to be
// run thousands of times a frame in a yard that had been going a while.
//
// **A settled mote has no state to step, so it is not stepped.** Its place is
// `anchor + f(t)`: the spot it came in at, plus the stretch its slot gives it,
// plus the band's own sway and creep -- all of which are either fixed for the
// life of the mote or shared by the whole band for the frame. So there is
// nothing per-mote to integrate, and the only reason a settled mote was written
// to sixty times a second was that six other places read its position out of it
// as a field.
//
// They ask `moteX`/`moteY` now. A mote that has finished arriving comes off
// ACTIVE and this loop never sees it again -- not the arithmetic, not the field
// writes, not even the iteration. What is left on ACTIVE is what is genuinely
// moving, which on a full lategame band is a few dozen out of six thousand.
//
// The frame's shared numbers, worked out once by `place` and kept for `moteX`
// and `moteY`. Kept rather than re-derived, because an evaluation later in the
// frame -- the drawing, a readout -- has to be the very number this frame would
// have written on the mote, and not a second reading of a camera that has moved
// since.
let fSpan = P, fTop = 0, fDeep = 0, fGust = 0;

// How far this one has crept along the sky: its share of the band's creep, since
// the reading it started from. Two subtractions instead of an accumulation.
const roamOf = m => m.give * (drift - m.roam0);

// Where a mote is, this frame. The one way to ask.
//
// For anything still being stepped that is the field `place` wrote. For a mote
// at rest it is worked out here from the anchor, and it is exactly the number
// `place` would have written: same terms, same order, same wrap.
export function moteX(m) {
  if (m.awake) return m.x;
  let x = (m.su * fSpan + roamOf(m) * fSpan) % fSpan
          + SWAY_DX[m.lane] + m.sx;
  if (x > fSpan) x -= fSpan;
  if (x < 0) x += fSpan;
  return x;
}

export function moteY(m) {
  if (m.awake) return m.y;
  // The ease is finished, so its height is its slot's place down the band, less
  // whatever the wind is lifting it by, plus its lane's sway.
  return fTop + m.sv * fDeep - fGust * m.give * SMOG_LIFT + SWAY_DY[m.lane] + m.sy;
}

// A mote joins the sky, and the list of ones being stepped. Even one born at
// rest -- a restored sky is nothing else -- goes on the list, so that the first
// frame is what decides it is at rest rather than whoever made it.
export const enter = m => { m.awake = true; ACTIVE.push(m); SKY.push(m); };

// And back on to it. Whatever has taken hold of it -- a hand through the smoke,
// the house letting go -- it carries on from the pixel it was being drawn at, so
// there is nothing to see at the moment it starts being stepped again.
export function wake(m) {
  if (m.awake) return;
  m.x = moteX(m);
  m.y = moteY(m);
  m.awake = true;
  ACTIVE.push(m);
}

// Out of the sky. `place` compacts the list, so this only has to say so.
export const dropped = m => { m.gone = true; };

// Everything out at once -- a save coming back, or a new game.
export function clearSky() {
  SKY.length = 0;
  ACTIVE.length = 0;
}

export function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  // The bend, not the raw field: the band's creep and the dust's travel are the
  // same wind seen twice, so they take the same shape of it. Off the raw number
  // the haze went on sliding through a lull the dust had already stopped in.
  const w = gust();
  swayNow(now() / 1000);
  // The band, this frame: where the top of it is and how deep it goes. Read off
  // the camera, so it is one pair of numbers for the whole sky and not a pair of
  // calls per mote.
  const top = bandTop(), deep = bandLow() - top;
  // The bodily creep along the sky, which is the one thing up here that adds up
  // rather than easing back. It used to be a fixed rate: the whole haze slid
  // slowly to the right for the entire run, whatever the wind was doing, which
  // meant the sky's largest movement was the one movement in the yard that took
  // no notice of the weather. It is the wind's now, sign and all -- so a bank
  // stalls in a lull and comes back on the return gust. One number for the whole
  // band; each mote's own share of it is a multiplication in `roamOf`.
  creep((secs * SMOG_DRIFT * 60 * w) / span);
  // What the wind does to the height is lift: a gust getting under a bank of
  // haze raises it a few pixels and it settles back as the gust dies. Off the
  // same number as everything else in the air, so the band never rises on a wind
  // the dust is not in.
  // Named for what it does, not for what it is off: `gust` is the shared field
  // now (wind.js) and a local of that name shadowed it for the whole function.
  const lift = Math.abs(w);
  fSpan = span; fTop = top; fDeep = deep; fGust = lift;

  const fadeBy = secs / (PUFF_FADE / 1000);
  const unstir = Math.max(0, 1 - SMOKE_STIR_EASE * secs);

  // Marked as they are found and swept up afterwards, rather than copied down
  // one at a time: on a churning sky nothing leaves for minutes at a stretch,
  // and a shuffle every mote every frame is the cost this loop exists to be rid
  // of. See the sweep below.
  let left = false;
  const n = ACTIVE.length;
  for (let i = 0; i < n; i++) {
    const m = ACTIVE[i];
    if (m.gone) { m.awake = false; left = true; continue; }   // rained out, or swallowed
    if (m.up) continue;             // still climbing: `stepPuffs` has it
    // Arrived, for good, and off the list: the stretch is as wide as it ever
    // gets, the sink is long over, it is at full weight and nothing is bending
    // it out of place. From here its place is its anchor and this frame's shared
    // numbers, and `moteX` gives back the very number this loop would have
    // written -- so nothing moves at the moment it stops being stepped. The
    // draught's own offsets are not in this test, because `moteX` carries them:
    // a band the house is dragging on is as free as a still one.
    if (m.age >= AGE_STILL && m.fade >= 1 && !m.px && !m.py) {
      m.awake = false; left = true; continue;
    }

    m.age += secs;
    if (m.fade < 1) m.fade = Math.min(1, m.fade + fadeBy);
    const x = m.su * span;
    const hy = top + m.sv * deep;
    // Down into the band over a few seconds. This one is a settle rather than a
    // dispersal: a mote arrives at the underside of the band, because that is
    // where the climb ends, and the band is a hundred pixels deep -- so easing
    // it to its height is a short, slow, obvious sinking-in rather than a jump
    // from the edge to the middle.
    const k = Math.min(1, m.age / SMOG_SINK);
    const e = k * k * (3 - 2 * k);
    const y = m.fromY + (hy - m.fromY) * e;
    // and whatever the cursor bent it out of place by, easing back to nought
    if (m.px || m.py) {
      m.px *= unstir;
      m.py *= unstir;
      if (Math.abs(m.px) < 0.05) m.px = 0;
      if (Math.abs(m.py) < 0.05) m.py = 0;
    }

    // and its lane's drift for this frame, which is the whole of the band's own
    // movement: one lookup, no arithmetic per mote worth speaking of.
    m.x = (x + roamOf(m) * span) % span + m.px + SWAY_DX[m.lane];
    m.y = y - lift * m.give * SMOG_LIFT + m.py + SWAY_DY[m.lane];

    // and however far the draught has dragged this one so far. It is carried on
    // the mote and added here, because a settled mote has no position of its
    // own -- it is placed where its slot says -- so being pulled across the sky
    // is a growing offset from that place. See `pull`, and `moteX`, which adds
    // the same pair for a mote that is no longer stepped.
    //
    // Both are named in `skyMote` and start at nought, which is the point of
    // there being one shape of mote: this used to read `m.sx || 0`, because the
    // draught pulls sideways without touching the height and a dragged mote had
    // an `sx` and no `sy` at all. Adding an undefined to a coordinate makes it
    // NaN, and a NaN coordinate is not merely a speck in the wrong place --
    // `pull` measured distance with `hypot(...) || 1`, so a NaN distance read as
    // one pixel and the whole sky was swallowed in a single frame the moment
    // somebody stepped into the house.
    if (m.sx || m.sy) { m.x += m.sx; m.y += m.sy; }
    if (m.x > span) m.x -= span;
    if (m.x < 0) m.x += span;
  }
  if (left) {
    let keep = 0;
    for (let i = 0; i < ACTIVE.length; i++) if (ACTIVE[i].awake) ACTIVE[keep++] = ACTIVE[i];
    ACTIVE.length = keep;
  }
}

// What the sky owes the number. Losing motes happens in play -- they are rained
// out or pulled into the house -- and that is done here.
//
// Gaining them is not. In play a mote arrives by climbing off a swing, which is
// the whole point of the thing: the connection between what the crew do and what
// is overhead is a speck you can watch go up. This used to top the sky up out of
// nothing whenever the count fell more than thirty behind, every frame, which is
// motes appearing in the middle of the band at full weight -- and the busier the
// yard, the more of them, because the number always ran ahead of the climbing.
//
// So this is only ever called where a sky is being restored rather than made: a
// save coming back, or the dev panel winding the haze up. Nothing pops in while
// you are watching.
//
// It no longer takes any away either. It used to trim the band down to whatever
// the number said, every frame, which is the same fault from the other end:
// specks going out in the middle of the sky because a figure kept somewhere else
// had moved. The number is worked out from the motes now -- see `reckon` -- so
// there is nothing to trim to.
function fillTo(want) {
  const span = Math.max(P, S.worldW || 0);
  while (SKY.length > want) dropped(SKY.splice(Math.floor(rand() * SKY.length), 1)[0]);
  while (SKY.length < want) {
    const m = skyMote(rand() * span, bandTop());
    m.age = AGE_STILL;                            // loaded, not arrived: long since settled
    enter(m);
  }
}

// A sky handed to us from outside -- a save, or the dev panel -- is filled in
// rather than climbed into, because there is nobody to have made it.
export const fillSky = () => { fillTo(motesWanted()); reckon(); };

// A save coming back. The weather in flight is not saved and does not survive --
// a puff halfway up and a drop halfway down both belong to a moment that is
// over -- so what a reload rebuilds is the band itself, out of the haze that
// was written down.
//
// It clears before it fills on purpose: whatever is in these arrays belongs to
// the game that was running a moment ago, and a restore that inherited it would
// be reading the save over the top of the last game rather than in place of it.
export function skyFromSave() {
  clearSky();
  DROPS.length = 0;
  fillSky();
}

// how thick the sky is, 0..1 scaled, for anything that wants to know without counting
export const cloudR = () => Math.round(Math.min(1, S.haze / SMOG_RAIN_AT) * 42);
