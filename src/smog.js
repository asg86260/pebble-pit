// The air, and what it costs.
//
// Every grain taken out of the ground puts a mote of it into the sky, and that
// mote is a real thing for the whole of its life. It comes off the swing where
// the swing happened, climbs, reaches the band and stays up there. It drifts. It
// finds the other motes and clumps with them, so the sky thickens into banks
// that were never drawn as banks -- they are only where the motes ended up. When
// there are enough of them they start coming down, one at a time, and land as
// muck. The house pulls them out of the sky one at a time as well.
//
// There is no cloud sprite in this file and no cloud shape. The sky is the dust
// you put there and it looks like whatever that dust has done. That is the only
// honest version: everything else in this yard is grains you can count, and a
// painted cloud over the top would be the one thing in the game that was a
// picture of something rather than the thing itself. It is also the only version
// that has no shelves or right angles in it, because nobody drew any.
//
// The answer to it is a building with somebody in it. An empty scrubbing house is
// a shed. Put a body in it and motes start leaving the sky for its intake -- the
// same motes, on a different errand. More bodies pull harder. The cost of clean
// air is bodies not on the rock, and the recycler turns what they catch back into
// dust on the ground.

import { P, WORKER, SMOG_PER_DUST, SMOG_RAIN_AT, SMOG_CAP, SMOG_PER_MOTE, SMOG_TOP,
         SMOG_BAND, SMOG_WANDER, SMOG_SINK, SMOG_DRIFT,
         SMOG_SPREAD_MIN, SMOG_SPREAD_MAX, SMOG_SPREAD_RATE, RAIN_PER_S, RAIN_GRAV, MUCK_MAX,
         SCRUB_PULL, SCRUB_REACH, RECYCLE_PER, RECYCLE_TONE, PUFF_MAX, PUFF_FADE,
         SCRUB_ARM } from './config.js';
import { S, floor, pit, quarry, farm, scrub } from './state.js';
import { now } from './clock.js';
import { spawnChip } from './dust.js';
import { rockTopY, boulderAlive } from './rock.js';
import { rockLeft, overPitMouth } from './world.js';
import { surfaceY, colOf } from './grid.js';
import { pitDepth } from './pit.js';
// Counted here rather than imported from `scrubhouse.js`, which is the same sum
// that file exports for everybody else. It is one line, and importing it made a
// ring -- the boards read the sky, the scrubbing house is a board, and the sky
// asked the scrubbing house how many were in it -- so whichever file in the ring
// happened to be reached first came up with its exports still empty.
const inScrub = () => S.workers.filter(w => w.type === 'scrubber' && w.goal === 'in').length;

// Motes that have made it up and are staying. This is the haze -- not a number
// with a picture of a cloud beside it, the actual things.
export const SKY = [];

// On their way up, off a swing. A puff becomes a sky mote when it arrives.
export const PUFFS = [];

// On their way down, as muck. A sky mote becomes one of these when it rains.
export const DROPS = [];

// And on their way into the house. Four lists, one kind of thing, four errands.
export const CAUGHT = [];

// where the motes settle out: a band across the top of the window
const bandTop = () => S.camY + SMOG_TOP * P;
const bandLow = () => bandTop() + SMOG_BAND * P;

export const raining = () => !!S.raining;
// Bodies actually through the door, not bodies assigned to it. Somebody put on
// the house is somebody who has to walk the length of the yard to get there, and
// nothing comes out of the sky until they arrive -- the same rule the lab runs
// on. A station that started working the moment you clicked the button would be
// a station whose walk was decoration.
export const scrubbing = () => S.scrubOpen && inScrub() > 0;
export const scrubRate = () => (S.scrubOpen ? inScrub() * SCRUB_PULL : 0);
// Where the thread ends, and where the dust comes back out. Both are places on
// the building rather than numbers near it: the head of the throat, which is the
// cell the hood's taper closes to and the last of it you can see, and the lip of
// the recycler's chute at the foot. A thread that stopped a course above the
// mouth ended in mid-air, and a grain that came back out of the roof was the
// house giving to the sky the one thing it is there to take out of it.
// Both on the lattice, because a caught mote is drawn as a cell like everything
// else and a run of them converging on a half cell is the one off-grid thing in
// the yard. The middle column of an odd front is a whole column; the throat
// closes on to it two courses below the last course of hood.
const intake = () => ({ x: scrub.x + Math.floor(scrub.w / (P * 2)) * P,
                        y: scrub.y + P * 5 });
// The clear cell under the lip of the chute, not the lip itself. It used to be
// the lip, and the grain was spawned there going *up* -- so a recycled grain was
// born inside solid black, climbed through the two courses of the arm painting
// itself across them on the way, and only then fell. A spout that turns down at
// its end and then delivers upward through its own elbow is a building doing the
// opposite of what its shape says.
const outlet = () => ({ x: scrub.x - P, y: scrub.y + scrub.h - P * SCRUB_ARM });

// --- what goes up --------------------------------------------------------------
// Something was taken out of the ground, at a place. The number is bookkeeping;
// the puff is the point. Without one, the connection between what the crew do and
// what is overhead is a line in a design document and nothing you could see.
export function foul(grains, x, y) {
  if (!grains) return;
  const add = grains * SMOG_PER_DUST;
  S.haze = Math.min(SMOG_CAP, S.haze + add);
  made += add;                     // counted where it is made -- see `sampleAir`
  if (x == null || PUFFS.length > PUFF_MAX) return;
  // One puff stands for one mote's worth of sky, so a swing sends one up about
  // as often as a swing is worth one. Every hit throwing a puff would put ten
  // times as many in the air as ever end up staying, and the ones over the
  // difference would have to be quietly dropped on arrival -- which is the sort
  // of thing you can see even when you cannot say what you are seeing.
  if (Math.random() > add / SMOG_PER_MOTE) return;
  PUFFS.push({
    x: x + (Math.random() - 0.5) * P * 2,
    y,
    vy: -(0.55 + Math.random() * 0.5),
    sway: Math.random() * Math.PI * 2,
    fade: 1,
    done: false
  });
}

// A mote is a slot in the band and a phase to wander on. It has no position of
// its own: where it is is where its slot is, this frame.
// A mote is a place in the band, a phase to wander on, and -- for its first few
// seconds -- where it came in. It arrives at the spot the puff got to and eases
// out to its place among the others, which is what joining a haze looks like.
const skyMote = (x, y) => ({
  slot: slots++,
  bob: Math.random() * Math.PI * 2,
  roam: 0,
  // How long it has been up there. The stretch of sky it is placed within opens
  // out with this, which is what dispersal is here -- see `spreadAt`.
  age: 0,
  fromX: x,
  fromY: y,
  fade: 0,
  x: x,
  y: y
});

// How many should be up there for the haze there is. The motes say where the sky
// is thick and thin; this only says how many of them there are.
const motesWanted = () => Math.round(S.haze / SMOG_PER_MOTE);

function stepPuffs(secs) {
  const low = bandLow();
  for (let i = PUFFS.length - 1; i >= 0; i--) {
    const p = PUFFS[i];
    // Slowing into the band and thinning where it stands.
    //
    // It reached the air the haze lives in. It does not stop dead, it does not
    // blink out, and it does not go anywhere in particular: it runs out of climb,
    // drifts on what it had, and thins into what is already up there, while the
    // mote it becomes comes up to weight in the same place over the same breath.
    //
    // It used to pick a spot along the whole sky and slide to it, on the argument
    // that the wind takes it and that arriving where it rose would pile the sky
    // over the rock. Watching it, that was a speck shooting off sideways and
    // vanishing -- an errand, not weather. The spreading belongs to the band and
    // the band already does it: what a mote does when it gets there is settle, and
    // being carried along the sky is the next hour of its life, not the next
    // half second of it.
    if (p.done) {
      // Only ever one frame of this: `done` is set at the moment the mote takes
      // over, and the puff is gone the next time round. There is no fade because
      // there is nothing to fade -- the thing you were watching did not stop, it
      // carried on as the mote.
      PUFFS.splice(i, 1);
      continue;
    }
    p.y += p.vy * secs * 60;
    p.x += Math.sin(now() / 700 + p.sway) * secs * 20;
    // It slows on the way up, but it always gets there: a puff that ran out of
    // push halfway and hung about would be a swing that never reached the sky.
    p.vy = Math.min(p.vy * (1 - secs * 0.12), -0.12);
    if (p.y > low) continue;
    // Arrived, and the wind up there has it.
    //
    // It joins the band somewhere along the sky rather than directly over the
    // place it left. That is the difference between a haze and a plume: this yard
    // fouls from three or four fixed points and the rock most of all, and a mote
    // that stays over the spot it rose from makes the sky a mound sitting on the
    // rock with thin air either side.
    //
    // Spreading it out afterwards does not fix that, and it was what this did for
    // a while: a steady stream arriving in one column with a levelling force
    // pushing outward from it settles into exactly that mound and stays there.
    // That is what diffusion from a point source does; it is not a tuning
    // failure, it is the right answer to the wrong arrangement.
    //
    // What you watch is unchanged. The puff comes off the swing, at the swing,
    // and climbs. Where it ends up once it is a thousand feet over the works is
    // wherever the air up there has taken it.
    // The mote it becomes is up there from this moment -- the count is the count --
    // and the puff itself stays on for a breath, thinning, so what you watched
    // climb goes out like something dispersing rather than like something being
    // switched off.
    // The mote it becomes starts exactly here, at the top of the climb, and eases
    // out into the band from there. One thing the whole way: a speck comes off a
    // swing, rises, slows as it reaches the haze, and drifts out into it among the
    // rest. Nothing hands over to anything, and nothing has to be faded between
    // two positions, because there are not two things.
    p.done = true;
    SKY.push(skyMote(p.x, p.y));
  }
}

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
// The golden angle does the spreading. Stepping a fraction of a turn each time,
// with the fraction chosen so it never lines up with itself, is the arrangement
// seeds take on a seed head and for the same reason: it is the one step that
// leaves no gaps and makes no rows, at every count, without knowing the count in
// advance. Two of them, at different steps, give a place across and a place down.
const ACROSS = 0.6180339887498949;      // one turn less the golden ratio
const DOWN = 0.7548776662466927;        // and the plastic number, for the other axis

let slots = 0;                          // handed out, never reused, never reset

// where a slot sits, before it is allowed to wander
function slotAt(k) {
  return { u: (k * ACROSS) % 1, v: (k * DOWN) % 1 };
}

// How wide a stretch of sky a mote of a given age is spread over. It starts at
// almost nothing and opens slowly, for as long as the mote is up there.
//
// This is the dispersal, and it is the whole of it. A mote never travels to a
// place: it sits where it came in, and the *stretch* it is placed within widens
// under it, a few tens of pixels a second. So its outward speed is a handful of
// pixels a second whatever the sky is doing -- slow enough that you never catch
// one moving, fast enough that a lungful of smoke over the rock has spread across
// the yard by the time it comes down as rain.
//
// It was a journey before: a slot taken from a wide stretch and a few seconds to
// ease out to it, which is a speck crossing hundreds of pixels in the open. There
// is no speed for a journey like that which is not wrong. Slow, it is still on
// its way when it rains; fast, it is a particle flying off on an errand, which is
// what you see and not what smoke does.
const spreadAt = age => Math.min(SMOG_SPREAD_MAX, SMOG_SPREAD_MIN + age * SMOG_SPREAD_RATE);

// Where a mote sits: within its stretch, and anywhere down the band. Its place in
// both is fixed the moment it arrives -- what changes is how wide the stretch is.
function homeOf(m, span) {
  const s = slotAt(m.slot);
  const top = bandTop(), deep = bandLow() - top;
  let x = m.fromX + (s.u - 0.5) * spreadAt(m.age);
  x %= span;
  if (x < 0) x += span;
  return { x, y: top + s.v * deep };
}

// One frame of the sky. Every mote is put where its slot says, plus a wander --
// and the wander is a circle, not a walk. A random walk accumulates: leave it
// running and the motes end up wherever the walk took them, which is the clumping
// this was written to be rid of. Going round in a small ellipse on its own phase,
// a mote is always moving and never anywhere but home.
function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  const t = now() / 1000;
  for (const m of SKY) {
    m.age += secs;
    if (m.fade < 1) m.fade = Math.min(1, m.fade + secs / (PUFF_FADE / 1000));
    m.roam += (secs * SMOG_DRIFT * 60) / span;

    const home = homeOf(m, span);
    // Down into the band over a few seconds. This one is a settle rather than a
    // dispersal: a mote arrives at the underside of the band, because that is
    // where the climb ends, and the band is a hundred pixels deep -- so easing it
    // to its height is a short, slow, obvious sinking-in rather than a jump from
    // the edge to the middle.
    const k = Math.min(1, m.age / SMOG_SINK);
    const e = k * k * (3 - 2 * k);
    const y = m.fromY + (home.y - m.fromY) * e;

    m.x = (home.x + m.roam * span) % span + Math.sin(t * 0.5 + m.bob) * SMOG_WANDER;
    m.y = y + Math.cos(t * 0.37 + m.bob) * SMOG_WANDER * 0.5;
    if (m.x > span) m.x -= span;
    if (m.x < 0) m.x += span;
  }
}

// What the sky owes the number, either way. Losing motes happens in play -- they
// are rained out or pulled into the house. Gaining them only ever happens from a
// save, because in play they arrive by climbing, which is the whole point.
function settleCount() {
  const want = motesWanted();
  while (SKY.length > want) SKY.splice(Math.floor(Math.random() * SKY.length), 1);
  if (want - SKY.length > 30) {
    const span = Math.max(P, S.worldW || 0);
    while (SKY.length < want) {
      const m = skyMote(Math.random() * span, bandTop());
      m.age = SMOG_SPREAD_MAX / SMOG_SPREAD_RATE;   // loaded, not arrived: long since spread
      m.fade = 1;
      SKY.push(m);
    }
  }
}

// how thick the sky is, 0..1 scaled, for anything that wants to know without counting
export const cloudR = () => Math.round(Math.min(1, S.haze / SMOG_RAIN_AT) * 42);

// --- the house --------------------------------------------------------------------
// Motes leave the sky for the intake. The same motes: one of them was a swing on
// the rock a minute ago and is about to be a grain of dust on the ground beside
// the house. Nothing here is a new effect standing in for a thing happening.
function pull(secs) {
  const to = intake();
  let take = scrubRate() * secs / SMOG_PER_MOTE;
  while (take > 0 && SKY.length) {
    if (take < 1 && Math.random() > take) break;
    take -= 1;
    // the nearest one, sampled rather than searched: the sky is drawn down
    // towards the house rather than thinning out evenly everywhere at once
    let best = 0, near = Infinity;
    for (let i = 0; i < SKY.length; i += 3) {
      const d = Math.abs(SKY[i].x - to.x);
      if (d < near) { near = d; best = i; }
    }
    const m = SKY.splice(best, 1)[0];
    // where it left the sky, and how far along it is. It is drawn along a curve
    // rather than eased at, so both ends of the journey have to be kept.
    CAUGHT.push({ x: m.x, y: m.y, x0: m.x, y0: m.y, t: 0 });
  }

  // The way in is over and then down the middle. A mote used to close on the
  // throat along the straight line between the two, which meant most of them
  // arrived on a slant, through the side of the hood, from outside the building
  // -- a thing being sucked in through a wall. The house has one mouth and it
  // faces up, so the last of every journey is a fall down the middle column into
  // it, and the bend that gets it over the middle happens up in the sky where
  // there is room for it.
  //
  // A quadratic through a corner above the throat, at the mote's own height: the
  // curve leaves the sky along the drift, turns over the building, and comes down
  // the shaft dead vertical, because that corner is what the tangent at the end
  // points away from. No second stage and nothing to decide -- one run of `t`
  // does the whole of it.
  for (let i = CAUGHT.length - 1; i >= 0; i--) {
    const k = CAUGHT[i];
    k.t += secs / SCRUB_REACH;
    // squared, so it drifts out of the bank and gathers pace into the mouth. A
    // constant crossing reads as a thing being carried; the draw is strongest
    // where the fan is.
    const e = Math.min(1, k.t) ** 2, u = 1 - e;
    k.x = k.x0 * u * u + to.x * (1 - u * u);
    k.y = k.y0 * (1 - e * e) + to.y * e * e;
    if (k.t < 1) continue;
    CAUGHT.splice(i, 1);
    if (!S.recycler) continue;
    S.scrubBank += 1 / RECYCLE_PER;
    // Whole grains only, and real ones: dust in this game is a grain on the
    // ground that somebody has to carry, not a number going up.
    while (S.scrubBank >= 1) {
      S.scrubBank -= 1;
      S.recycled++;
      const out = outlet();
      // and it drops out of the spout rather than being thrown out of it: the
      // arm points down, so the grain goes down
      spawnChip(out.x, out.y, (Math.random() - 0.5) * 0.5, 0.15, RECYCLE_TONE);
    }
  }
}

// --- the rain ----------------------------------------------------------------------
// No clock. It runs until the sky is empty, because what falls *is* the sky: a
// mote drops out of it, comes down under gravity and lands. The banks thin as it
// goes because there is less and less of them left up there.
const RAIN_FLOOR = 4;

function pour(secs) {
  let n = RAIN_PER_S * secs;
  while (n > 0 && SKY.length) {
    if (n < 1 && Math.random() > n) break;
    n -= 1;
    const m = SKY.splice(Math.floor(Math.random() * SKY.length), 1)[0];
    S.haze = Math.max(0, S.haze - SMOG_PER_MOTE);
    DROPS.push({ x: m.x, y: m.y, vy: 0.2 + Math.random() * 0.4 });
  }
  if (S.haze <= RAIN_FLOOR || !SKY.length) S.raining = false;
}

function stepDrops() {
  const m = muckCols();
  for (let i = DROPS.length - 1; i >= 0; i--) {
    const d = DROPS[i];
    d.vy += RAIN_GRAV;
    d.y += d.vy;
    const c = colAt(d.x);
    if (c < 0 || c >= m.length) { DROPS.splice(i, 1); continue; }
    const rest = muckFloor(c) - m[c] * P;
    if (d.y < rest - P) continue;
    if (m[c] < MUCK_MAX) m[c]++;
    DROPS.splice(i, 1);
    S.dirty = true;
  }
}

// --- the layer -----------------------------------------------------------------------
// One depth per column of the world. This is the whole of what the rain leaves:
// what is buried, what is in the way and what there is to shift are all read off
// it, so nothing anywhere can disagree with what you are looking at.
export function muckCols() {
  if (!S.muck || S.muck.length !== floor.cols) {
    const was = S.muck || [];
    S.muck = new Array(floor.cols).fill(0);
    for (let i = 0; i < Math.min(was.length, floor.cols); i++) S.muck[i] = was[i] || 0;
  }
  return S.muck;
}

export const colAt = wx => Math.floor(wx / P);
const inRange = (c, from, to) => c >= colAt(from) && c <= colAt(to);

const rockCols = () => boulderAlive()
  ? { from: rockLeft(), to: rockLeft() + S.gw * P } : null;
const cutCols = () => S.quarryOpen ? { from: quarry.x, to: quarry.x + quarry.w } : null;
const bedCols = () => S.farmOpen ? { from: farm.x, to: farm.x + farm.w } : null;

function depthOver(range) {
  if (!range) return 0;
  const m = muckCols();
  let n = 0;
  for (let c = colAt(range.from); c <= colAt(range.to); c++) n += m[c] || 0;
  return n;
}

export const rockMuck = () => depthOver(rockCols());
export const cutMuck = () => depthOver(cutCols());
export const bedMuck = () => depthOver(bedCols());

// Where the muck in a column sits: on the rock if the rock is there, on the floor
// of the cut if that is, on the ground otherwise. It lies on top of what it
// landed on -- it does not sink into it and it does not float over it.
export function muckFloor(c) {
  const wx = c * P + P / 2;
  const r = rockCols();
  if (r && wx > r.from && wx < r.to) {
    const col = Math.round((wx - rockLeft()) / P);
    if (S.rockTops[col] >= 0) return rockTopY(col);
  }
  if (S.quarryOpen && wx > quarry.x && wx < quarry.x + quarry.w)
    return S.groundY + quarry.h;
  // Over the hole it lands on whatever is *in* the hole, which is the dust. It
  // used to land on the ground line, which over an open pit is thin air: a grey
  // lid sitting across the mouth with the hole visible underneath it. Muck lies
  // on top of what it fell on, everywhere, and the pit is not an exception just
  // because the top of it is lower than the ground.
  //
  // On the dust and not in it. Nothing about this counts against what the hole
  // holds -- muck is worth nothing and takes nothing -- it is a layer over the
  // top of the pile, in the way, like the layer over everything else.
  if (overPitMouth(wx)) {
    const col = colOf(pit, wx);
    if (col >= 0 && col < pit.cols) return surfaceY(pit, col);
  }
  return S.groundY;
}

function clearRange(range, effort) {
  if (!range) return effort;
  const m = muckCols();
  const from = colAt(range.from), to = colAt(range.to);
  let left = effort;
  for (let c = from; c <= to && left > 0; c++) {
    if (!m[c]) continue;
    const took = Math.min(m[c], left);
    m[c] -= took;
    left -= took;
    S.dirty = true;
  }
  return left;
}

export const throughRockMuck = n => clearRange(rockCols(), n);
export const throughCutMuck = n => clearRange(cutCols(), n);
export const throughBedMuck = n => clearRange(bedCols(), n);

// Muck put down rather than rained down. The crew make their own now -- see
// `relieve` in crew.js -- and it is the same stuff the sky drops, so the same
// shovelling clears it and no new kind of mess had to be invented.
//
// It refuses the columns a shovel cannot reach. `onSite` holds the rock, the cut
// and the beds out of the sweep, so muck left standing on one of those would lie
// there for the rest of the run: a body about to go on a site holds on until it
// is somewhere the crew can clean up after it.
// The nearest ground to a place that a shovel can actually reach, or null if
// there is none near. A body standing on the rock is standing on ground that is
// held out of the sweep, so what it leaves goes on the bare yard a step away
// rather than on the rock -- it steps aside, the way anybody would.
export function cleanSpotNear(wx, reach = 90) {
  const m = muckCols();
  const home = colAt(wx);
  for (let d = 0; d <= reach; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || onSite(c)) continue;
      return c * P + P / 2;
    }
  }
  return null;
}

export function dropMuckAt(wx, n) {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  muckCols()[colAt(at)] += n;
  S.dirty = true;
  return true;
}

// The rest of it, shifted from wherever the body doing the shifting is standing,
// so a gang spread along the yard clears the yard rather than all of them
// working the same column.
export function sweepMuckAt(wx, n) {
  const m = muckCols();
  const home = colAt(wx);
  let left = n;
  for (let d = 0; d < 60 && left > 0; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !m[c] || onSite(c)) continue;
      const took = Math.min(m[c], left);
      m[c] -= took;
      left -= took;
      S.dirty = true;
    }
  }
  return n - left;
}

// --- the frame's answers, worked out once -------------------------------------
// Is there a mess, and where is the nearest of it. Every body in the crew asks
// both on every frame, and the honest answer to either is a walk over every
// column in the world. Done per body per frame that is a million comparisons a
// second and three throwaway objects per column -- a yard that stutters for the
// sake of a number that cannot have changed since the body before it asked.
//
// So it is worked out once at the top of the frame and read from there. Nothing
// inside a frame changes it: muck is only added by rain and only taken by work,
// and both of those happen here.
let siteAt = null;
let yardLeft = 0;
let allLeft = 0;

function refresh() {
  siteAt = [rockCols(), cutCols(), bedCols()].filter(Boolean);
  const m = muckCols();
  let all = 0, yard = 0;
  for (let c = 0; c < m.length; c++) {
    const v = m[c];
    if (!v) continue;
    all += v;
    if (!onSite(c)) yard += v;
  }
  allLeft = all;
  yardLeft = yard;
}

function onSite(c) {
  if (!siteAt) return false;
  for (const r of siteAt) if (inRange(c, r.from, r.to)) return true;
  return false;
}

// How much ground a body shovelling claims either side of itself, in columns: a
// body is three cells wide, so this keeps the next one clear of its elbows.
const MUCK_ELBOW = 4;

// The nearest loose muck to a place, as a world x, or null if the yard is clear.
// Somebody has to walk to it: shovelling from wherever you happen to be standing
// is the sort of thing that makes a crew look like a spreadsheet.
// `taken` is the set of columns somebody else is already walking to. One patch,
// one body -- the same rule the dust has, and for the same reason: without it
// every body in the yard works out the same nearest answer, walks to the same
// cell, and the crew clears a mess as one lump you cannot count. A yard of muck
// is the one job the whole crew drops everything for, so it is the job where
// they bunch up worst.
//
// The claim is a column rather than a body, so a patch two cells wide takes two
// of them and the third goes and finds its own.
export function nearestMuck(wx, taken) {
  const m = muckCols();
  const home = colAt(wx);
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !m[c] || onSite(c)) continue;
      if (taken && taken.has(c)) continue;
      // A claim is a stretch, not a cell. Columns are six pixels and a body is
      // eighteen wide, so reserving the one cell somebody is shovelling puts the
      // next body one cell over -- close enough that it never has to walk, and
      // the two of them stand in each other for the whole clear-up. Reserving a
      // body's width either side is what actually sends the next one elsewhere.
      if (taken) for (let k = c - MUCK_ELBOW; k <= c + MUCK_ELBOW; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  // Everything within reach is spoken for. Rather than standing still it goes
  // for the nearest anyway: two on one patch is better than one doing nothing,
  // and it is what happens at the end of a clear-up when there is one cell left.
  if (!taken) return null;
  return nearestMuck(wx, null);
}

// The ladders into the hole: one down each wall, and the dust in the bottom
// between them.
//
// The crew used to reach the layer in the pit from the lip, arm out over the
// mouth. It read as a fudge -- somebody shovelling a thing eight cells away and
// two deep without going near it -- and every other hole in this yard is one you
// go down: the quarry has a ladder in its near corner and the crew climb it hand
// over hand.
//
// Two of them, because the hole has two sides and there is ground beyond it. A
// single ladder in the near wall made the pit a dead end: everything past it was
// somewhere the crew could see muck lying and never reach, since the lip clamp
// pins them this side of the mouth. With a ladder in each wall the pit stops
// being a wall and becomes a way through -- down one side, across the top of the
// pile, and up the other.
export const NEAR = -1, FAR = 1;

// which wall a place is nearest, for a body deciding which way to go down
export const pitSide = wx => (wx > pit.x + pit.w / 2 ? FAR : NEAR);

export function pitLadder(side) {
  const x = side === FAR ? pit.x + pit.w - P : pit.x + P;
  return { x, top: S.groundY - WORKER, foot: pitTop(x) - WORKER };
}

// past the far wall entirely: ground the crew can only get to through the hole
export const pastPit = wx => wx > pit.x + pit.w;

// whether there is anything out there worth being out there for
export function muckPastPit() {
  const m = muckCols();
  for (let c = 0; c < m.length; c++)
    if (m[c] && pastPit(c * P + P / 2)) return true;
  return false;
}

// the top of whatever is in the hole at a place: the dust, or the floor when it
// is empty. What a body in the pit stands on, and what the muck lies on.
export function pitTop(wx) {
  const c = colOf(pit, wx);
  if (c < 0 || c >= pit.cols) return S.groundY + pitDepth();
  return surfaceY(pit, c);
}

export const muckLeft = () => allLeft;
export const yardMuck = () => yardLeft;
export const buried = () => rockMuck() > 0 || cutMuck() > 0 || bedMuck() > 0;

// --- one frame ---------------------------------------------------------------------
export function stepSmog(dt) {
  const secs = dt / 1000;
  refresh();                        // what the crew will ask about, asked once
  stepPuffs(secs);
  if (scrubbing()) {
    pull(secs);
    S.haze = Math.max(0, S.haze - scrubRate() * secs);
  } else if (CAUGHT.length) {
    CAUGHT.length = 0;
  }
  // The sky is squared with the number *before* anything asks whether it should
  // be raining. The other way round, a sky wound up from outside -- a save, the
  // dev panel -- starts raining on a frame where there are no motes up there to
  // fall, stops again in the same breath because there is nothing to pour, and
  // starts over once the motes arrive. One shower, counted twice.
  settleCount();
  if (S.haze >= SMOG_RAIN_AT && !raining()) { S.raining = true; S.rains++; }
  if (raining()) pour(secs);
  place(secs);
  stepDrops();
}

// --- the books ------------------------------------------------------------------------
// What the yard has put up since the last reading, counted as it goes in rather
// than worked back out of the total.
//
// It used to be inferred: the change in the haze, plus what the house took out,
// floored at nought so a downpour did not read as the yard un-mining a rock. Every
// part of that is defensible and the whole is wrong the moment the house starts
// winning -- the haze falls, the floor clamps the difference to nought, and what
// is left is exactly the scrubbing rate. So fouling always read equal to
// scrubbing, the two cancelled, and the one number this board exists to show sat
// at nought however many bodies you moved.
//
// Counted at the source there is nothing to infer and nothing to correct for.
// Rain can take what it likes out of the sky and the house can take what it likes:
// neither is production, and this only counts production.
let made = 0;
let mark = { at: 0, rate: 0 };

// A minute of them, kept as a ring and averaged.
//
// The reading is a direction, and a direction taken off one second of the yard
// flickers: a gang whose swings happen to land together reads as losing and the
// same gang a second later reads as winning, so a house that is very nearly
// keeping up puts an arrow on the board that flips every second or two. That is
// not a reading, it is a nervous tic. Over a minute the answer is the answer.
const WINDOW = 60;
const net = new Array(WINDOW).fill(0);
let filled = 0, oldest = 0;

export function sampleAir(t) {
  if (t - mark.at < 1000) { return; }
  const gone = (t - mark.at) / 1000;
  const rate = mark.at ? made / gone : 0;
  mark = { at: t, rate };
  made = 0;
  if (!mark.at) return;
  net[oldest] = rate - scrubRate();
  oldest = (oldest + 1) % WINDOW;
  filled = Math.min(WINDOW, filled + 1);
}

// what the sky has been doing, on average, for the last minute
export function airTrend() {
  if (!filled) return 0;
  let sum = 0;
  for (let i = 0; i < filled; i++) sum += net[i];
  return sum / filled;
}
const fouling = () => mark.rate;

export function airReadout() {
  const net = fouling() - scrubRate();
  return {
    haze: Math.round(S.haze),
    at: SMOG_RAIN_AT,
    share: Math.min(1, S.haze / SMOG_RAIN_AT),
    fouling: +(fouling() * 60).toFixed(1),
    scrubbing: +(scrubRate() * 60).toFixed(1),
    // blank when the house is winning, which is the number worth playing for
    dueMs: net <= 0 ? null : Math.round(((SMOG_RAIN_AT - S.haze) / net) * 1000)
  };
}

// How bunched up what is up there is: the fullest bin against the average. A
// number for the thing you can watch happening, so a check can watch it too.
// The fullest bin against what a bin would hold if the sky were spread perfectly
// evenly. One is a flat haze; the higher it goes the more the sky is bunched into
// one place. Over every bin, not just the ones with something in: over the
// occupied ones it moves the wrong way, because emptying bins lifts the average
// of whatever is left.
// How bunched up what is up there is: the fullest strip of sky against what a
// strip would hold if the whole lot were spread perfectly evenly. One is a flat
// haze. Measured off the motes themselves rather than off anything the placing
// keeps, so it is a check on the picture and not on the intention.
const STRIP = P * 7;

function strips() {
  const span = Math.max(P, S.worldW || 0);
  const n = Math.max(2, Math.ceil(span / STRIP));
  const out = new Array(n).fill(0);
  for (const m of SKY) out[((Math.floor(m.x / STRIP) % n) + n) % n]++;
  return out;
}

export function clumpiness() {
  const b = strips();
  const total = b.reduce((x, y) => x + y, 0);
  if (!total) return 0;
  return +(Math.max(...b) / (total / b.length)).toFixed(2);
}

export const skyBins = () => strips().filter(Boolean).length;

export function smogReport() {
  return { sky: SKY.length, puffs: PUFFS.length, drops: DROPS.length, trend: airTrend(),
           caught: CAUGHT.length, clumpiness: clumpiness(), skyBins: skyBins(),
           cloudR: cloudR(),
           raining: raining(), rains: S.rains, recycled: S.recycled,
           scrubbers: S.scrubbers, scrubOpen: S.scrubOpen, recycler: S.recycler,
           muck: { rock: rockMuck(), cut: cutMuck(), bed: bedMuck(),
                   yard: yardMuck(), all: muckLeft(),
                   cols: muckCols().filter(Boolean).length },
           ...airReadout() };
}

export function seedSmog() {
  made = 0;
  net.fill(0);
  filled = 0;
  oldest = 0;
  mark = { at: 0, rate: 0 };
  siteAt = null;
  yardLeft = allLeft = 0;
  SKY.length = 0;
  PUFFS.length = 0;
  DROPS.length = 0;
  CAUGHT.length = 0;
  S.muck = [];
}
