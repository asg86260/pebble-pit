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
         SMOG_BAND, SMOG_LIFT, SMOG_GIVE, PUFF_LEAN_WIND, SMOG_SINK, SMOG_DRIFT,
         SMOG_SPREAD_MIN, SMOG_SPREAD_MAX, SMOG_SPREAD_RATE, RAIN_PER_S, RAIN_RAMP, RAIN_GRAV, RAIN_MARK, MUCK_MAX,
         SCRUB_PULL, SCRUB_REACH, RECYCLE_PER, RECYCLE_TONE, PUFF_MAX, PUFF_FADE,
         SCRUB_ARM, SCRUB_CATCH, SCRUB_PER_MUCK, SCRUB_MUCK, SCRUB_CLOG, SCRUB_CHUTE,
         SCRUB_DRAG, SCRUB_STREAM, SMOKE_STIR, SMOKE_STIR_R, SMOKE_STIR_CAP, SMOKE_STIR_EASE, PLUME_LEAN } from './config.js';
import { S, floor, pit, quarry, farm, scrub } from './state.js';
import { now } from './clock.js';
// The same wind the dust leans on, off the same clock. Smoke and dust hanging
// over the same yard at the same moment being blown two different ways was the
// plainest of the old faults: whichever one you happened to be watching, the
// other was arguing with it.
import { windAt, give } from './wind.js';
import { spawnChip } from './dust.js';
import { rockTopY, boulderAlive } from './rock.js';
import { rockLeft, overPitMouth } from './world.js';
import { surfaceY, colOf } from './grid.js';
import { pitDepth } from './pit.js';
import { dugTopY } from './quarry.js';
// Counted here rather than imported from `scrubhouse.js`, which is the same sum
// that file exports for everybody else. It is one line, and importing it made a
// ring -- the boards read the sky, the scrubbing house is a board, and the sky
// asked the scrubbing house how many were in it -- so whichever file in the ring
// happened to be reached first came up with its exports still empty.
const inScrub = () => S.workers.filter(w => w.type === 'scrubber' && w.goal === 'in').length;

// Every mote in the air, climbing or arrived. This is the haze -- not a number
// with a picture of a cloud beside it, the actual things.
//
// One list, because there is one substance. A speck off a swing and a speck in
// the band used to be two kinds of thing in two arrays, with the first deleted
// and the second created at the top of the climb -- and however carefully that
// handover was written, it was a handover: the puff went out and the mote came
// up over the best part of a second, so what you actually watched was one cell
// blinking out and another blinking in beside it. The climb and the band are two
// things the *same* mote does, so it is one object from the swing to the rain,
// and `up` says which of them it is doing.
export const SKY = [];

// The ones still on their way up, for anything that wants to ask.
export const climbing = () => { let n = 0; for (const m of SKY) if (m.up) n++; return n; };

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
// A house with somebody in it, and somewhere to put what it takes out.
//
// It used to run whatever was lying about it, which is the one station in the
// yard with no such rule: the rock stops when its spoil is up to the limit, the
// cut stops, the beds stop, and this poured -- dust out of the spout with the
// recycler on, muck out of the back without it -- for as long as there was a
// body inside. What that looks like is a machine with no cost, and what it
// actually did was spray the walk: bare ground takes a scatter and no more, so
// every grain past the scatter went looking for a column with room somewhere
// else in the yard.
//
// Now it has its own strip, like every other station, and it clogs.
export const clogged = () => !!S.pileFull.scrub || outletMuck() >= SCRUB_CLOG;
export const scrubbing = () => S.scrubOpen && inScrub() > 0 && !clogged();

// Muck lying on the ground the spout reaches, which is what the back of the
// house leaves when there is no recycler on it.
export function outletMuck() {
  if (!S.scrubOpen) return 0;
  const m = muckCols();
  const from = colAt(scrub.x - P * (SCRUB_CHUTE + 2)), to = colAt(scrub.x + scrub.w);
  let n = 0;
  for (let c = from; c <= to; c++) n += m[c] || 0;
  return n;
}
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
// `kind` is which part of the works this came out of -- 'dust' off the rock,
// 'shard' out of the cut, 'spore' off the beds. It is carried all the way up and
// kept on the mote, because unlike the dust hanging over a place, smoke drifts:
// by the time a mote has settled and spread it is nowhere near what made it, so
// asking what is under it now would give the wrong answer. Where it came from is
// a fact about the mote, so the mote holds it.
export function foul(grains, x, y, kind = 'dust') {
  if (!grains) return;
  const add = grains * SMOG_PER_DUST;
  made += add;                     // counted where it is made -- see `sampleAir`
  // Nothing is added to the number here, and that is the whole of the fix for a
  // sky that rained twice. The haze *is* the motes -- see `reckon` -- so what
  // this does is put motes up, and the number follows them by arithmetic rather
  // than by being kept alongside and hoped to agree.
  //
  // It never did agree. The haze went up by what the hit was worth and the
  // specks that were supposed to carry it were dropped whenever there were
  // already a few hundred climbing, so on a busy yard the number ran away from
  // the band underneath it. Then a shower emptied a band that was always short,
  // stopped with the number still over the line, and the next frame read a
  // filthy sky over an empty one and started another. That is the rain that
  // never stops and the haze that never comes back, and neither of them is
  // weather: they are two accounts of one thing disagreeing.
  if (x == null) {
    // Nowhere to climb from -- a place off the yard. It still counts, so it
    // arrives in the band rather than being lost.
    for (let i = 0, n = whole(add / SMOG_PER_MOTE); i < n; i++) join(bandTop(), kind);
    return;
  }
  // One puff stands for one mote's worth of sky, so what goes up is what this
  // was worth: the whole ones, and the fraction left over as a chance at one
  // more. Every hit throwing exactly one puff would put ten times as many in
  // the air as ever end up staying.
  //
  // It *was* one puff at most -- a coin weighted by what the hit was worth --
  // which is right only while a hit is worth less than a mote, and every hit
  // was, until the sky was made of two and a half times the specks and a swing
  // started being worth more than one of them. A cut shard is worth nearly
  // seven. The haze went up by all seven and one speck was sent to stand for
  // them, so the number climbed away from the sky it was supposed to be
  // counting: eight hundred of haze over a band holding six hundred of it.
  //
  // That gap is why the sky rains and rains again. Rain empties the band, the
  // band is short, so it runs out while the number is still over the line --
  // and the next frame reads a filthy sky over an empty one and starts another
  // shower. What is overhead and what the readout says have to be the same
  // thing, or the weather is driven by a number nobody can see.
  const puffs = whole(add / SMOG_PER_MOTE);
  // Counted once for the whole hit rather than once a speck: this runs on every
  // swing, and a sky of six thousand motes counted per speck per swing is a walk
  // over the whole band a few hundred times a second.
  let up = climbing();
  for (let i = 0; i < puffs; i++) {
    // A full sky takes no more. This is the one place a mote is turned away, and
    // it is turned away *with* its dirt: the number cannot go up if the speck
    // did not.
    if (SKY.length >= MOTE_CAP) break;
    // And when the plume is already a fog, the next one joins the band instead
    // of climbing through it. It is not dropped -- dropping it is what put the
    // number wrong -- it simply does not have a climb to watch, because there
    // are three hundred specks in the way of watching it.
    if (up > PUFF_MAX) { join(bandTop(), kind); continue; }
    up++;
    SKY.push({
      up: true,
      x: x + (Math.random() - 0.5) * P * 2,
      y,
      vy: -(0.55 + Math.random() * 0.5),
      // its share of the wind on the way up, a sixth either way. It was a sway
      // before -- its own sine on its own phase -- so a column of puffs off one
      // swing wove through itself on the way up like a shoal rather than being
      // carried off the way the day is going.
      give: give(Math.random(), SMOG_GIVE),
      fade: 1,
      // What put it up. Carried to the top of the climb and handed to the mote,
      // which is the whole of how a dirty sky says which part of the works is
      // dirtying it. It was being dropped here, so every mote in the sky came out
      // as the default grey however it was made.
      kind,
      // Where it started and which way it leans. A plume widens with height --
      // every puff leaning on the same shared sway sent the lot up as one straight
      // cylinder, which reads as a pipe rather than as smoke.
      y0: y,
      lean: (Math.random() - 0.5) * 2
    });
  }
}

// Whole things out of a fractional amount: the whole ones, and the fraction left
// over as a chance at one more. Over a run this is exact, and it is the only way
// to spend a fraction of a speck when a speck is the smallest thing there is.
const whole = n => Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0);

// A mote that arrives without a climb: from off the yard, or from a plume too
// thick to see another one through. Settled from the first frame.
function join(y, kind) {
  if (SKY.length >= MOTE_CAP) return;
  const m = skyMote(Math.random() * Math.max(P, S.worldW || 0), y, kind);
  m.fade = 1;
  SKY.push(m);
}

// What the sky holds at its filthiest, in motes rather than in dirt. Everything
// else in this file counts specks now, so the ceiling does too.
const MOTE_CAP = Math.round(SMOG_CAP / SMOG_PER_MOTE);

// The number over the pit, worked out from the sky rather than kept beside it.
// One line, called once a frame, and it is the whole of the accounting: there is
// no second place where haze is added or taken, so there is nothing for the two
// of them to disagree about.
const reckon = () => { S.haze = SKY.length * SMOG_PER_MOTE; };

// A mote is a slot in the band and a share of the wind. It has no position of
// its own: where it is is where its slot is, this frame, leaned on by whatever
// the wind is doing at that instant.
// A mote is a place in the band, a share of the wind, and -- for its first few
// seconds -- where it came in. It arrives at the spot the puff got to and eases
// out to its place among the others, which is what joining a haze looks like.
const skyMote = (x, y, kind = 'dust') => ({
  kind,
  up: false,                            // arrived: this one is in the band
  slot: slots++,
  // its share of the wind, a sixth either way. This was a phase to bob on, and
  // a band of motes each bobbing on its own was a haze that shimmered where it
  // stood -- movement everywhere and no direction anywhere.
  give: give(Math.random(), SMOG_GIVE),
  roam: 0,
  // How long it has been up there. The stretch of sky it is placed within opens
  // out with this, which is what dispersal is here -- see `spreadAt`.
  age: 0,
  fromX: x,
  fromY: y,
  // Solid from the first frame. It used to come up from nothing over the best
  // part of a second, which is right for a thing that was not there before and
  // wrong for every mote that got here by climbing: what you had been following
  // went out and faded back in beside itself.
  fade: 1,
  x: x,
  y: y
});

// How many should be up there for the haze there is. The motes say where the sky
// is thick and thin; this only says how many of them there are.
const motesWanted = () => Math.round(S.haze / SMOG_PER_MOTE);

function stepPuffs(secs) {
  const low = bandLow();
  const w = windAt(now());          // one wind, asked once, for the whole plume
  const drag = scrubbing() ? { ...intake(), power: scrubRate() / SCRUB_PULL } : null;
  for (let i = SKY.length - 1; i >= 0; i--) {
    const p = SKY[i];
    if (!p.up) continue;            // arrived: the band has it, see `place`
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
    const rose = -p.vy * secs * 60;             // what it climbed this frame
    p.y -= rose;
    // carried by the yard's wind, its own share of it, for as long as it is up
    p.x += w * PUFF_LEAN_WIND * p.give * secs;
    // and a tenth of that sideways, the way it is leaning. Taken off the climb
    // itself rather than off the clock, so the drift is always the same share of
    // the height however fast the puff got up there -- a plume that leans and
    // opens a little, not one that fans across the sky.
    p.x += p.lean * PLUME_LEAN * rose;
    // whatever the cursor left in it, dying away
    if (p.sx || p.sy) {
      p.x += p.sx || 0;
      p.y += p.sy || 0;
      p.sx = (p.sx || 0) * 0.94;
      p.sy = (p.sy || 0) * 0.94;
    }
    // It slows on the way up, but it always gets there: a puff that ran out of
    // push halfway and hung about would be a swing that never reached the sky.
    p.vy = Math.min(p.vy * (1 - secs * 0.12), -0.12);
    // And the house pulls on it while it climbs, the same as it pulls on the
    // band: a plume rising past the door leans into the mouth. It is the same
    // field and the same numbers -- these are the same objects, so there is no
    // second rule about smoke.
    if (drag) {
      const dx = drag.x - p.x, dy = drag.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(d, SCRUB_DRAG * drag.power * secs / d);
      p.x += (dx / d) * k;
      p.y += (dy / d) * k;
    }
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
    //
    // And it is the same speck. Nothing is spliced out and nothing is pushed in:
    // the object you have been watching climb is given the fields a settled mote
    // has and carries on, from exactly the pixel it had got to. There is no
    // handover to hide, because there is nothing to hand over to.
    settleHere(p);
  }
}

// A climbing mote becomes a band mote, in place. Its position is not touched --
// the band eases it from here to its slot over the next few seconds, which is
// what settling looks like -- and neither is what it is made of or how solid it
// is drawn: it went up at the weight of the haze and it stays at the weight of
// the haze.
function settleHere(m) {
  m.up = false;
  m.slot = slots++;
  m.roam = 0;
  m.age = 0;
  m.fromX = m.x;
  m.fromY = m.y;
  m.fade = 1;                     // it never went out, so it has nothing to come back from
  m.vy = 0;
  delete m.lean;
  delete m.y0;
}

// --- the draught, in the smoke -------------------------------------------------
// The same hand that moves the dust moves this. A haze that took no notice of a
// pointer going through it was the one field in the yard you could put your hand
// into and have nothing happen -- and it is the field most obviously *air*.
//
// Both halves of it. What is still climbing gets a shove it carries; what has
// settled gets a displacement that eases back, because a settled mote is placed
// where its slot says every frame and the only way to move one is to bend where
// that is. Fainter than the dust, which is already faint: this weighs nothing.
export function stirSmoke(wx, wy, dx, dy) {
  const speed = Math.hypot(dx, dy);
  if (speed < 0.5) return 0;
  const push = Math.min(speed, 40) * SMOKE_STIR;
  const ux = dx / speed, uy = dy / speed;
  const cap = v => Math.max(-SMOKE_STIR_CAP, Math.min(SMOKE_STIR_CAP, v));
  let moved = 0;

  for (const m of SKY) {
    if (!m.up) continue;
    const d = Math.hypot(m.x - wx, m.y - wy);
    if (d > SMOKE_STIR_R) continue;
    const k = push * (1 - d / SMOKE_STIR_R) ** 2;
    m.sx = cap((m.sx || 0) + ux * k);
    m.sy = cap((m.sy || 0) + uy * k);
    moved++;
  }

  for (const m of SKY) {
    if (m.up) continue;
    const d = Math.hypot(m.x - wx, m.y - wy);
    if (d > SMOKE_STIR_R) continue;
    const k = push * (1 - d / SMOKE_STIR_R) ** 2;
    m.px = cap((m.px || 0) + ux * k);
    m.py = cap((m.py || 0) + uy * k);
    moved++;
  }
  return moved;
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
function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  const w = windAt(now());
  // the draught, asked once for the whole band
  const sag = scrubbing() ? { ...intake(), power: scrubRate() / SCRUB_PULL } : null;
  for (const m of SKY) {
    if (m.up) continue;             // still climbing: `stepPuffs` has it
    m.age += secs;
    if (m.fade < 1) m.fade = Math.min(1, m.fade + secs / (PUFF_FADE / 1000));
    // The bodily creep along the sky, which is the one thing up here that adds
    // up rather than easing back. It used to be a fixed rate: the whole haze
    // slid slowly to the right for the entire run, whatever the wind was doing,
    // which meant the sky's largest movement was the one movement in the yard
    // that took no notice of the weather. It is the wind's now, sign and all --
    // so a bank stalls in a lull and comes back on the return gust.
    m.roam += (secs * SMOG_DRIFT * 60 * w * m.give) / span;

    const home = homeOf(m, span);
    // Down into the band over a few seconds. This one is a settle rather than a
    // dispersal: a mote arrives at the underside of the band, because that is
    // where the climb ends, and the band is a hundred pixels deep -- so easing it
    // to its height is a short, slow, obvious sinking-in rather than a jump from
    // the edge to the middle.
    const k = Math.min(1, m.age / SMOG_SINK);
    const e = k * k * (3 - 2 * k);
    const y = m.fromY + (home.y - m.fromY) * e;

    // and whatever the cursor bent it out of place by, easing back to nought
    if (m.px || m.py) {
      const keep = Math.max(0, 1 - SMOKE_STIR_EASE * secs);
      m.px *= keep;
      m.py *= keep;
      if (Math.abs(m.px) < 0.05) m.px = 0;
      if (Math.abs(m.py) < 0.05) m.py = 0;
    }

    // Sideways is the drift above -- carried, not offset. What the wind does
    // here is lift: a gust getting under a bank of haze raises it a few pixels
    // and it settles back as the gust dies. Off the same number as everything
    // else in the air, so the band never rises on a wind the dust is not in.
    m.x = (home.x + m.roam * span) % span + (m.px || 0);
    m.y = y - Math.abs(w) * m.give * SMOG_LIFT + (m.py || 0);

    // And the draught off the house, which bends where a mote is placed rather
    // than pushing it about: the fan is on for minutes at a time and a force
    // that accumulated would empty the band into the wall. Hardest at the mouth
    // and falling off with distance, so the sky sags towards the house from one
    // end of the world to the other -- a lean you can see from the far side of
    // the yard, and the reason what streams in comes off the nearest part of it.
    if (sag) {
      const dx = sag.x - m.x, dy = sag.y - m.y;
      const d = Math.hypot(dx, dy) || 1;
      // A third of the way, and no further. It is a lean, not a collapse: pulled
      // most of the way in, the band came down *past* the mouth and everything
      // caught after that rose into the hood from underneath -- smoke going down
      // a chimney the wrong way round. The sky bends towards the house; it does
      // not fall into it.
      const k = Math.min(d * 0.33, SCRUB_DRAG * sag.power / d);
      m.x += (dx / d) * k;
      m.y += (dy / d) * k;
      // and never below the mouth it is leaning towards, whatever the arithmetic
      // says: everything the house takes has to be above the thing taking it.
      if (m.y > sag.y - P * 3) m.y = sag.y - P * 3;
    }
    if (m.x > span) m.x -= span;
    if (m.x < 0) m.x += span;
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
  while (SKY.length > want) SKY.splice(Math.floor(Math.random() * SKY.length), 1);
  while (SKY.length < want) {
    const m = skyMote(Math.random() * span, bandTop());
    m.age = SMOG_SPREAD_MAX / SMOG_SPREAD_RATE;   // loaded, not arrived: long since spread
    SKY.push(m);
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
  SKY.length = 0;
  DROPS.length = 0;
  CAUGHT.length = 0;
  fillSky();
}

// how thick the sky is, 0..1 scaled, for anything that wants to know without counting
export const cloudR = () => Math.round(Math.min(1, S.haze / SMOG_RAIN_AT) * 42);

// --- the house --------------------------------------------------------------------
// The house does not pick specks out of the sky. It makes a draught.
//
// It used to reach out and take the nearest settled mote, whole, and put it on a
// curve to the mouth -- a hand plucking, one a frame, from a band that otherwise
// took no notice of the building at all. What a fan does is pull on everything
// in front of it, hardest close up and less the further out you are, so that is
// what this is: every mote in the world leans towards the mouth while there is
// somebody inside, from the plume climbing past the door to the far end of the
// band over the pit. You can see the whole sky sag towards the house.
//
// The lean and the swallowing are two things. Leaning is a bend in where the
// band puts a mote, so a bank drifts over the house rather than a speck being
// yanked out of it; swallowing is the house taking motes at the pace it is
// rated for, off the part of the sky the lean has brought nearest, and those
// are the ones you watch stream down the throat.
//
// The climbing ones are pulled by exactly the same field. They are the same
// objects now -- see SKY -- so a plume rising past the house bends into it
// without a word of code about plumes.
function pull(secs) {
  const to = intake();
  let take = scrubRate() * secs / SMOG_PER_MOTE;

  // What the house actually swallows, at the pace it is rated for. The draught
  // is what you watch; this is what it is worth, and the two are kept apart on
  // purpose -- a rate that came out of the geometry would be a rate nobody could
  // tune and a house whose worth depended on where the wind had left the sky.
  //
  // The nearest go first, and near is measured to the mouth rather than along
  // the ground: the stream comes off whichever part of the sky is closest to
  // the throat, which is the part the draught has already dragged down.
  while (take > 0 && SKY.length && CAUGHT.length < SCRUB_STREAM) {
    if (take < 1 && Math.random() > take) break;
    take -= 1;
    let best = -1, near = Infinity;
    for (let i = 0; i < SKY.length; i += 3) {
      const d = Math.hypot(SKY[i].x - to.x, SKY[i].y - to.y);
      if (d < near) { near = d; best = i; }
    }
    if (best < 0) break;
    const m = SKY.splice(best, 1)[0];
    // where it left the sky, and how far along it is. It is drawn along a curve
    // rather than eased at, so both ends of the journey have to be kept.
    CAUGHT.push({ x: m.x, y: m.y, x0: m.x, y0: m.y, t: 0, kind: m.kind });
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
    // Down the last of it, always. The height it drops from is its own or a few
    // cells over the hood, whichever is higher -- so a mote taken from below the
    // mouth climbs over the building first and comes down the shaft, rather than
    // sliding sideways and rising into it from underneath. Everything goes in
    // through the top, because the top is the only way in.
    const over = Math.min(k.y0, to.y - P * 6);
    k.y = over * (1 - e * e) + to.y * e * e;
    if (k.t < 1) continue;
    CAUGHT.splice(i, 1);
    // What the house takes out of the sky has to go somewhere. Without the
    // recycler it comes out of the back as muck on the ground, and the crew have
    // to shovel it: a house that made a bad sky simply vanish was a building you
    // bought once and then forgot, and the only cost of running it was the body
    // standing in it.
    //
    // That is also what the recycler is *for*. It was a strict bonus on top of a
    // machine that already did its whole job, so the upgrade read as optional;
    // now it is the thing that turns a pile of muck out the back into dust worth
    // carrying, which is a reason to save for it.
    if (!S.recycler) {
      S.scrubMuck = (S.scrubMuck || 0) + 1;
      while (S.scrubMuck >= SCRUB_PER_MUCK) {
        S.scrubMuck -= SCRUB_PER_MUCK;
        dropMuckAt(outlet().x, SCRUB_MUCK);
      }
      continue;
    }
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

// What falls has to have got there first. This picked out of the whole sky, a
// mote at a time, which during a downpour included the ones that had arrived
// that instant -- so a puff you had just watched climb for four seconds off a
// swing reached the band and was pulled straight back down as a raindrop. It
// reads as pollution turning into rain on contact, which is not what either of
// them is: the sky is the thing coming down, and a speck that has not joined
// the sky yet is not part of it.
//
// A mote is settled once it has eased into the band -- the same `SMOG_SINK` the
// sinking-in uses. Only settled ones can be picked, unless there is nothing
// settled left at all, in which case the rain takes what there is rather than
// stalling with a sky still overhead.
const settled = m => !m.up && m.age >= SMOG_SINK;

function pour(secs) {
  if (!SKY.length) { S.raining = false; return; }

  // How far into the shower this is. Rain comes on: a spot or two, then more of
  // them, then the whole sky. It used to open at the full rate on the very first
  // frame -- nothing overhead, and a quarter of a second later sixteen hundred
  // drops in the air -- which is not weather arriving, it is a bucket being
  // tipped over. The rate is squared across the ramp, so the first second is a
  // scatter and the shower is properly on by the end of it.
  //
  // Nothing is lost to the slow start. What falls is the sky itself, and the sky
  // is still up there: a shower runs until it is empty either way, so the ramp
  // makes the front of it gentler rather than the whole of it smaller.
  S.rainFor = (S.rainFor || 0) + secs;
  const on = Math.min(1, S.rainFor / RAIN_RAMP);
  let n = RAIN_PER_S * secs * on * on;

  // Which ones may fall, as places in the sky rather than as motes: a settled
  // sky is thousands of specks and this runs every frame of a downpour, so a
  // pick has to cost nothing. Taken by swapping the chosen one out of the back
  // of the list, which is a pick without a search.
  const pick = [];
  for (let i = 0; i < SKY.length; i++) if (settled(SKY[i])) pick.push(i);
  // Nothing settled left, and what is left is still climbing. A shower does not
  // reach down the plume and pull specks back out of it -- it is over, and what
  // is on its way up belongs to the next one.
  if (!pick.length) { S.raining = false; return; }

  const gone = new Set();
  while (n > 0 && pick.length) {
    if (n < 1 && Math.random() > n) break;
    n -= 1;
    const at = Math.floor(Math.random() * pick.length);
    const i = pick[at];
    pick[at] = pick[pick.length - 1];
    pick.pop();
    gone.add(i);
    const m = SKY[i];
    DROPS.push({ x: m.x, y: m.y, vy: 0.2 + Math.random() * 0.4 });
  }

  // and out of the sky in one pass, keeping the order of what is left
  if (gone.size) {
    let w = 0;
    for (let i = 0; i < SKY.length; i++) if (!gone.has(i)) SKY[w++] = SKY[i];
    SKY.length = w;
  }
  // The shower is over when the sky it was made of is gone. There is no second
  // condition on the number any more, and there is no room for one: the number
  // is the specks, so an empty band *is* a clean readout. It used to be able to
  // stop with a filthy figure still standing over an empty sky, and the next
  // frame would start another shower with nothing to pour -- on and off, every
  // frame, for ever, which is what a haze that never comes back looks like from
  // the outside.
  if (!SKY.some(settled)) S.raining = false;
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
    if (Math.random() < RAIN_MARK && m[c] < MUCK_MAX) m[c]++;
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
  // Over the cut it lands on the cut's floor -- which is wherever that column has
  // actually been dug to, not the depth the hole will eventually reach. It was
  // the full depth, a fixed line a long way under the ground, so muck over the
  // quarry was drawn hanging at the bottom of a hole that had not been dug yet:
  // as the crew shifted it you watched it slide down through the ground, over
  // the top of everything, because the layer is painted after the world is.
  if (S.quarryOpen && wx > quarry.x && wx < quarry.x + quarry.w)
    return dugTopY(wx);
  // Over the hole it lands on the top of the pile, flush with it. `surfaceY` is
  // where the *next* grain down that column would come to rest, which is one
  // cell above the dust that is already there -- so a layer laid on that line
  // hung a cell over the pile with daylight under it. What muck lies on is the
  // top of the pile, and the top of the pile is one cell below where the next
  // grain would land.
  //
  // It used to land on the ground line, which over an open pit is thin air: a grey
  // lid sitting across the mouth with the hole visible underneath it. Muck lies
  // on top of what it fell on, everywhere, and the pit is not an exception just
  // because the top of it is lower than the ground.
  //
  // On the dust and not in it. Nothing about this counts against what the hole
  // holds -- muck is worth nothing and takes nothing -- it is a layer over the
  // top of the pile, in the way, like the layer over everything else.
  if (overPitMouth(wx)) return pitTop(wx);
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

// Where a body goes to *stand* to work a patch. Out on the yard that is the
// patch itself; on the rock, the cut or the beds it is the nearest ground
// beside it. A shovel reaches on to a site, a pair of boots does not -- so the
// body steps up to the edge of the thing and works across it, the same way it
// steps aside to leave anything of its own on ground somebody can clean.
export const workSpot = wx => (onSite(colAt(wx)) ? (cleanSpotNear(wx) ?? wx) : wx);

// Capped like everything else the sky drops. A column holds MUCK_MAX and no
// more, whoever put it there -- without that a body could bury a column deeper
// than a downpour ever would, and the crew would still be shovelling it long
// after the weather had been dealt with.
export function dropMuckAt(wx, n) {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  const m = muckCols();
  const c = colAt(at);
  m[c] = Math.min(MUCK_MAX, m[c] + n);
  S.dirty = true;
  return true;
}

// The rest of it, shifted from wherever the body doing the shifting is standing,
// so a gang spread along the yard clears the yard rather than all of them
// working the same column.
//
// A shovel reaches on to a site, and it always should have. `onSite` was in this
// loop, so muck that came down on the rock, the cut or the beds was not
// something anybody could clear: it was worked off by mining through it, and a
// rock nobody was swinging at -- a full pile, a crew with no miners on it, the
// gap between one rock and the next -- kept whatever the sky left on it for the
// rest of the run. A body cannot *stand* on a site, which is a different rule
// and is kept where it belongs, in `cleanSpotNear`: it stands on the ground
// beside the thing and works across it.
// Whole cells, and that is the point of `hand`.
//
// Effort arrives a sixtieth of a second at a time -- three and a half cells a
// second is a twentieth of a cell a frame -- and taking that fraction off the
// column drew a layer sinking smoothly into the ground. Nothing else in this
// yard moves like that: the rock comes off a cell at a time, the pile fills a
// grain at a time, and a shovel takes a shovelful. So the fraction is kept in
// the hand doing the shovelling until it is worth a whole cell, and then a whole
// cell goes.
//
// The carry is capped at one. Without that, a body walking a long way to a patch
// arrives with several seconds of effort saved up and takes a trench out of it
// on the first frame.
export function sweepMuckAt(wx, n, hand) {
  const m = muckCols();
  const home = colAt(wx);
  const hold = hand || loose;
  hold.owed = Math.min(1, (hold.owed || 0) + n);
  let cells = Math.floor(hold.owed);
  if (cells < 1) return 0;
  let took = 0;
  for (let d = 0; d < 60 && cells > 0; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !m[c] || cells < 1) continue;
      const take = Math.min(m[c], cells);
      m[c] -= take;
      cells -= take;
      took += take;
      S.dirty = true;
    }
  }
  hold.owed -= took;
  return took;
}

// for a sweep nobody owns -- a hook, a check -- so the fraction has somewhere to
// live either way
const loose = { owed: 0 };

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
// Is there still anything to shift in this column? A claim is held until the
// column it names is clear, so this is what tells a body it is done with it.
export function muckAtCol(c) {
  const m = muckCols();
  return c >= 0 && c < m.length ? m[c] : 0;
}

export function nearestMuck(wx, taken) {
  const m = muckCols();
  const home = colAt(wx);
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !m[c]) continue;
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

// The top of whatever is in the hole at a place: the dust, or the floor when it
// is empty. What a body in the pit stands on, and what the muck lies on.
//
// `surfaceY` answers a different question -- where the *next* grain down this
// column would come to rest -- and that is one cell above the dust already
// there. Read as a surface it put everything a cell too high: the layer hung
// over the pile with daylight under it, and the crew walked the hole a cell off
// the ground the way they walk the yard a cell off the ground, which is to say
// not at all. One cell down is the top of the pile itself.
export function pitTop(wx) {
  const c = colOf(pit, wx);
  if (c < 0 || c >= pit.cols) return S.groundY + pitDepth();
  return surfaceY(pit, c) + pit.p;
}

// What a body standing in the hole stands on: the highest the pile gets under
// any part of it, not whatever its middle happens to be over.
//
// A body is three cells wide and the pile is not level -- it heaps under the lip
// and runs away downhill, and while it is being filled it is whatever shape the
// tipping left. Standing on the middle column put the uphill half of the body
// inside the pile: it read as walking through the heap rather than over it. It
// is the same rule a core rests by -- see `supportY` in core.js -- and the same
// rule anything wide standing on something uneven has to follow.
export function pitStand(leftX, width = WORKER) {
  let top = Infinity;
  for (let x = leftX; x < leftX + width; x += pit.p) top = Math.min(top, pitTop(x));
  return Math.min(top, pitTop(leftX + width - 1));
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
    // The house takes motes. It used to take motes *and* dock the number by what
    // the fan was worth, which is the same dirt subtracted twice.
    pull(secs);
  } else if (CAUGHT.length) {
    CAUGHT.length = 0;
  }
  // The number is worked out from the sky before anything asks whether it should
  // be raining, because the answer to that question has to be about what is
  // actually overhead.
  reckon();
  // A shower starts over from the first spot every time -- the ramp is a fact
  // about this one, not a clock that carries on between them.
  if (S.haze >= SMOG_RAIN_AT && !raining()) { S.raining = true; S.rains++; S.rainFor = 0; }
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
  // The band, and not the plumes on their way into it: what this measures is
  // how evenly the sky has spread, and a column of specks climbing off the rock
  // is a clump that has not had its chance to spread yet.
  for (const m of SKY) if (!m.up) out[((Math.floor(m.x / STRIP) % n) + n) % n]++;
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
  // what the sky is made of, by where it came from: the tint is drawn straight
  // off this, so a check can see whether a dirty sky knows what dirtied it
  const kinds = {};
  for (const m of SKY) kinds[m.kind || 'none'] = (kinds[m.kind || 'none'] || 0) + 1;
  return { sky: SKY.length, skyKinds: kinds,
           // Haze the sky cannot account for: the number, less what is actually
           // overhead and what is still on its way up. It belongs at nothing.
           // A number drifting above the specks it stands for is a band thinner
           // than the readout claims and, once the gap is wide enough, a sky
           // that rains itself empty while the number is still over the line
           // and starts another shower on the very next frame.
           // Haze the sky cannot account for. It is nought by construction now
           // -- the number is worked out from the specks -- and it is still
           // reported, because it is the one reading that would catch this
           // coming apart again.
           owed: +(S.haze - SKY.length * SMOG_PER_MOTE).toFixed(1),
           // where the first few of them are, finely enough that a check can see
           // the band lean: the wind moves a settled mote a pixel or two over a
           // second, which whole pixels would swallow
           skyX: SKY.filter(m => !m.up).slice(0, 40).map(m => +m.x.toFixed(2)),
           puffs: climbing(), drops: DROPS.length, trend: airTrend(),
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
  DROPS.length = 0;
  CAUGHT.length = 0;
  S.muck = [];
}
