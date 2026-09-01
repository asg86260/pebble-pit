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

import { footing, solidNear, SOLID } from './route.js';
import { P, WORKER, SMOG_PER_DUST, SMOG_RAIN_AT, SMOG_CAP, SMOG_PER_MOTE, SMOG_TOP, SMOG_FLOOR,
         SMOG_SAMPLE, SMOG_RAIN_BEND, RAIN_GAP,
         SMOG_BAND, SMOG_LIFT, SMOG_GIVE, PUFF_LEAN_WIND, SMOG_SINK, SMOG_DRIFT,
         SMOG_SPREAD_MIN, SMOG_SPREAD_MAX, SMOG_SPREAD_RATE,
         SWAY_LANES, SWAY_X, SWAY_Y, SWAY_PACE, RAIN_PER_S, RAIN_RAMP, RAIN_GRAV, RAIN_MARK, MUCK_MAX, MESS_SLIDE,
         SCRUB_PULL, RECYCLE_PER, RECYCLE_TONE, PUFF_FADE, SMOG_TINTS,
         SCRUB_ARM, SCRUB_CATCH, SCRUB_PER_MUCK, SCRUB_MUCK, SCRUB_CLOG, SCRUB_CHUTE,
         SCRUB_DRAG, SCRUB_NEAR, SCRUB_GRIP, LOO_MUCK, MESS_SLUMP, MESS_ANGLE,
         DRAUGHT_PER_S, DRAUGHT_FROM, DRAUGHT_PACE, SMOKE_STIR, SMOKE_STIR_R, SMOKE_STIR_CAP, PLUME_STIR, PLUME_STIR_R, PLUME_STIR_CAP, SMOKE_STIR_EASE, PLUME_LEAN } from './config.js';
import { S, floor, pit, quarry, farm, scrub } from './state.js';
import { now, frames } from './clock.js';
// The same wind the dust leans on, off the same clock. Smoke and dust hanging
// over the same yard at the same moment being blown two different ways was the
// plainest of the old faults: whichever one you happened to be watching, the
// other was arguing with it.
import { windAt, give } from './wind.js';
import { spawnChip } from './dust.js';
import { rockTopY, boulderAlive } from './rock.js';
import { rockLeft, overPitMouth } from './world.js';
import { shadeNear } from './grid.js';
import { pitTop } from './pit.js';
import { dugTopY } from './quarry.js';
import { rand } from './rng.js';
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

// The ones with anything left to step.
//
// A settled mote's place is its anchor plus this frame's shared numbers -- see
// `moteX` -- so once it has finished arriving there is nothing in it to
// integrate and nothing to write. It comes off this list and `place` never
// touches it again. What is left on the list is what is genuinely moving: the
// plumes on their way up, the motes still easing into the band, and whatever a
// hand through the smoke has bent out of place. A lategame sky of six thousand
// specks steps a few dozen of them.
//
// A mote goes back on it by `wake`, which captures where it is being drawn
// *now* as its new state, so nothing jumps at the moment it starts moving again.
const ACTIVE = [];

// The band's bodily creep along the sky, integrated once for the whole of it.
//
// It used to be a number on every mote, added to every frame: the same
// multiplication five thousand times over for a quantity that differs between
// motes only by a fixed share of the wind. So it is kept once here, and a mote
// remembers the reading it started from -- see `roam0` and `roamOf`.
let drift = 0;

// The ones still on their way up, for anything that wants to ask.
export const climbing = () => { let n = 0; for (const m of SKY) if (m.up) n++; return n; };

// On their way down, as muck. A sky mote becomes one of these when it rains.
export const DROPS = [];

// Nothing on its way into the house has a list of its own: the sky is what goes
// in, dragged there by the draught. See `pull`.

// where the motes settle out: a band across the top of the window
// The sky the haze lives in: a couple of cells under the top of the window, down
// to a little clear air over the ground line.
//
// It was a thirteen-cell strip along the top with clean air beneath it, and that
// strip is the whole of what has changed here. Everything that made the band
// work -- the slots, the spread that opens with age, the sway, the creep, the
// settling, the plume that climbs into it -- is untouched and applies to the
// whole sky now, which is exactly what it was always doing, only over four times
// as much of it.
//
// Read off the ground line rather than off a depth, so the haze reaches the
// works whatever the window is: a fixed depth would leave a tall window with a
// clean gap under the sky and a short one with the haze in the dirt. Floored
// against the top, so a window too short to hold both still gives the band
// somewhere to be.
// Exported, because the balloon has to agree with the air about where the sky
// is: a craft with a cruising height of its own would ride above the haze on a
// tall window and in the dirt on a short one. See `laneY` in balloon.js.
export const bandTop = () => S.camY + SMOG_TOP * P;
export const bandLow = () => Math.max(bandTop() + P * 4, S.groundY - SMOG_FLOOR * P);

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
// cut stops, the plots stop, and this poured -- dust out of the spout with the
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
// What one body in the house is worth, with whatever fan has been fitted. A
// quarter again a rung, the same step every ladder in this game takes.
export const fanPull = () => SCRUB_PULL * Math.pow(1.25, S.fanLevel || 0);
export const scrubRate = () => (S.scrubOpen ? inScrub() * fanPull() : 0);
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
// 'shard' out of the quarry, 'spore' off the plots. It is carried all the way up and
// kept on the mote, because unlike the dust hanging over a place, smoke drifts:
// by the time a mote has settled and spread it is nowhere near what made it, so
// asking what is under it now would give the wrong answer. Where it came from is
// a fact about the mote, so the mote holds it.
export function foul(grains, x, y, kind = 'dust') {
  // Nothing a machine does fouls where it happened. Its dirt goes up off its own
  // stack, in soot, in one place -- see `stepMachines` -- rather than being added
  // to what the station raised. Without this the sky over a working quarry went
  // blue, because the cut's dust is blue and the machine was still raising it.
  // ...and it does not matter whether one is working *now*. This used to read
  // `S.machineWorking && kind !== 'mach'`, which is a gate that depends on the
  // state of the yard at the moment somebody asks -- so the guarantee "hand work
  // never fouls" was true only while a machine happened to be mid-beat. It is
  // unconditional now: the sky has one producer, and the only dirt it accepts is
  // a machine's. Anything else is refused here rather than being trusted not to
  // ask, which is what makes the rule a rule instead of a habit.
  if (kind !== 'mach') return 0;
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
  // Everything that goes up climbs from where it was made. Nothing is put
  // straight into the band -- see below.
  if (x == null) return;
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
  for (let i = 0; i < puffs; i++) {
    // A full sky takes no more. This is the one place a mote is turned away, and
    // it is turned away *with* its dirt: the number cannot go up if the speck
    // did not.
    if (SKY.length >= MOTE_CAP) break;
    // And there is no cap on the climb. There was one -- past a few hundred
    // specks on their way up, the next was put straight into the band instead --
    // and what that looked like was pollution appearing in the sky out of
    // nothing, a hundred cells from anything that could have made it, and being
    // dragged off to the house before you had worked out where it came from.
    // A thick plume is what a busy yard looks like; it is not a thing to hide.
    // Made by the band's own maker, because it is going to be a mote in the band
    // and the object is never replaced -- see `skyMote` for why one shape
    // matters. The look, the kind and the share of the wind all come from there;
    // what a climbing one has of its own is the climb.
    const p = skyMote(x + (rand() - 0.5) * P * 2, y, kind);
    p.up = true;
    p.vy = -(0.55 + rand() * 0.5);
    // Where it started and which way it leans. A plume widens with height --
    // every puff leaning on the same shared sway sent the lot up as one straight
    // cylinder, which reads as a pipe rather than as smoke.
    p.lean = (rand() - 0.5) * 2;
    enter(p);
  }
}

// Whole things out of a fractional amount: the whole ones, and the fraction left
// over as a chance at one more. Over a run this is exact, and it is the only way
// to spend a fraction of a speck when a speck is the smallest thing there is.
const whole = n => Math.floor(n) + (rand() < n - Math.floor(n) ? 1 : 0);

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
// What a speck looks like, decided once and kept for life.
//
// Both ends of a speck's life are built here: the puff that leaves a swing (see
// `foul`) and the mote that is placed in the band (`skyMote`). That is the point
// of it being one function. The look used to be set in `skyMote` alone, and
// `skyMote` is only reached when a sky is *restored* -- a save coming back or
// the dev panel winding the haze up. Everything that gets into the sky the way
// the game actually puts it there climbs, and a climbing puff is built by hand
// in `foul` and then handed its band fields by `settleHere`, neither of which
// knew about any of this. So the variation was real in a loaded sky and absent
// in a played one, which is the one place it matters.
//
// A speck also has to keep it across that hand-off. It went up looking like
// this and it stays looking like this -- the whole argument for `settleHere`
// not touching a mote's position or weight is that the thing off the swing and
// the thing in the band are one thing, and its colour is no different.
const look = (kind = 'dust') => ({
  // What this one weighs, to look at: a fifth either side of the haze's own ink.
  // A band of specks all drawn at exactly one weight is a screen of identical
  // dots -- it reads as noise laid over the sky rather than as smoke of
  // different ages and thicknesses hanging in it. Texture, not confetti.
  ink: 0.8 + rand() * 0.4,
  // and which of its kind's shades it is. See SMOG_TINTS: a kind is a small
  // family of tones, not one flat colour.
  tone: Math.floor(rand() * (SMOG_TINTS[kind] || SMOG_TINTS.dust).length)
});

// A mote is a place in the band, a share of the wind, and -- for its first few
// seconds -- where it came in. It arrives at the spot the puff got to and eases
// out to its place among the others, which is what joining a haze looks like.
//
// **There is one shape of mote and this is it**, climbing or settled, and every
// field either kind will ever have is named here even where it means nothing
// yet. This is not tidiness. A speck that goes up is *the same object* that
// comes to rest -- that is the whole design of the plume, see `settleHere` --
// and the way that was done was to hand it four new fields on arrival and
// `delete` two others. A `delete` puts the object into dictionary mode for the
// rest of its life, so every settled mote in the sky was a hash table, and
// `place` reads eleven fields off every one of them sixty times a second: with a
// full band that is three million dictionary lookups a second, and it was more
// than half of what the frame cost. Growing a mote's shape late costs more than
// the whole of what the missing fields save -- the same lesson the grids learned
// about their `awake` flags, see grid.js.
const skyMote = (x, y, kind = 'dust') => ({
  kind,
  up: false,                            // arrived: this one is in the band
  ...look(kind),
  ...nextSlot(),
  // The climb, which is over for a mote made here and is the whole of a mote
  // made by `foul`: how fast it is rising, where it started, and which way it
  // leans on the way up. See `stepPuffs`.
  vy: 0,
  y0: y,
  lean: 0,
  // What a hand through the smoke and a fan on the other side of the yard have
  // bent it out of place by. Both ease back to nought and both start there.
  px: 0, py: 0, sx: 0, sy: 0,
  // its share of the wind, a sixth either way. This was a phase to bob on, and
  // a band of motes each bobbing on its own was a haze that shimmered where it
  // stood -- movement everywhere and no direction anywhere.
  give: give(rand(), SMOG_GIVE),
  // The band's shared creep as it stood when this mote's place was fixed. What
  // this one has crept is `give * (drift - roam0)`, worked out on demand rather
  // than accumulated per mote per frame -- see `roamOf`.
  roam0: drift,
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
  // Which shower this one belongs to, if any. Written by `stepSmog` when a
  // shower breaks and read by `doomed`; named here rather than added there,
  // because a field added late is a mote that has stopped being one shape.
  rain: -1,
  // Whether it still has anything to integrate, and whether it is still in the
  // sky at all. See ACTIVE: a mote at rest is not stepped, and `x`/`y` below are
  // whatever it was last written at rather than where it is -- ask `moteX` and
  // `moteY`.
  awake: false,
  gone: false,
  x: x,
  y: y
});

// An even handful of a list, in its own order. Taking the first n of the sky
// takes the *oldest* n -- near neighbours that have been drifting together for
// minutes, which in a sky with eddies in it agree with each other rather than
// with the weather. Striding across the whole list samples the band instead of
// sampling one swirl.
function spread(list, n) {
  if (list.length <= n) return list;
  const step = list.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
  return out;
}

// How many should be up there for the haze there is. The motes say where the sky
// is thick and thin; this only says how many of them there are.
const motesWanted = () => Math.round(S.haze / SMOG_PER_MOTE);

// The height a mote lives at: its slot's own place down the sky. One line, and
// it is what `moteY` reads too -- see there.
const slotY = (m, top, deep) => top + m.sv * deep;

function stepPuffs(secs) {
  const top = bandTop(), deep = bandLow() - top;
  const w = windAt(now());          // one wind, asked once, for the whole plume
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

    // **A puff climbs to its own height, not to the underside of a strip.**
    //
    // This used to stop at `bandLow()` -- the bottom of the thirteen-cell band --
    // which was the same height for every speck because the band was a strip. The
    // sky is the whole window now, and its underside is just above the ground, so
    // that test would have every puff arriving on the frame it was born and no
    // speck would ever be seen to climb.
    //
    // So a puff rises until it reaches the place it is going to live, which is
    // its slot's own share of the sky. Some go a little way and some go all the
    // way up, and the plume off a swing thins out over the whole height of the
    // window instead of stacking against a ceiling.
    if (p.y > slotY(p, top, deep)) continue;
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
  // Its look is not among the fields set here, and that is deliberate: `foul`
  // gave it one when it left the swing and it keeps it. A speck that changed
  // colour or weight on arriving would be a speck you watched climb and then
  // saw replaced by another one.
  
  Object.assign(m, nextSlot());
  m.roam0 = drift;
  m.age = 0;
  m.fromX = m.x;
  m.fromY = m.y;
  m.fade = 1;                     // it never went out, so it has nothing to come back from
  // The climb, over. Set back rather than deleted: these two used to be
  // `delete`d here, which is the one operation that turns an object into a
  // dictionary for good, and it was being done to every mote in the sky on the
  // frame it arrived. See `skyMote`.
  m.vy = 0;
  m.lean = 0;
  m.y0 = m.y;
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

  // The climbing ones, which take it harder: see PLUME_STIR. This is the smoke
  // your hand is actually near.
  const blow = Math.min(speed, 40) * PLUME_STIR;
  const capUp = v => Math.max(-PLUME_STIR_CAP, Math.min(PLUME_STIR_CAP, v));
  for (const m of SKY) {
    if (!m.up) continue;
    const d = Math.hypot(m.x - wx, m.y - wy);
    if (d > PLUME_STIR_R) continue;
    const k = blow * (1 - d / PLUME_STIR_R) ** 2;
    m.sx = capUp((m.sx || 0) + ux * k);
    m.sy = capUp((m.sy || 0) + uy * k);
    dragged = true;                    // a hand through a plume leaves the same offsets
    moved++;
  }

  for (const m of SKY) {
    if (m.up) continue;
    // Asked of the sky rather than read off the mote: one at rest is not written
    // to any more, so where it is is what `moteX` says it is.
    const d = Math.hypot(moteX(m) - wx, moteY(m) - wy);
    if (d > SMOKE_STIR_R) continue;
    // Bent out of place, so it has something to step again: back on the list,
    // from exactly the pixel it was being drawn at.
    wake(m);
    const k = push * (1 - d / SMOKE_STIR_R) ** 2;
    m.px = cap(m.px + ux * k);
    m.py = cap(m.py + uy * k);
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

// Where a slot sits, before it is allowed to wander -- worked out once, when the
// slot is handed over, and carried on the mote from then on.
//
// It used to be a function of the number, called from `place` for every mote on
// every frame, and it returned an object to say so. That is two multiplications,
// two remainders and a fresh object per mote per frame: with a full band in the
// sky it was a third of a million allocations a second to re-derive four numbers
// that cannot change, because a mote's slot never changes. `lane` goes with
// them for the same reason.
const nextSlot = () => {
  const k = slots++;
  return { slot: k, su: (k * ACROSS) % 1, sv: (k * DOWN) % 1, lane: k % SWAY_LANES };
};

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

// Where a mote sits across the band: within its stretch, wrapped into the world.
// Its place is fixed the moment it arrives -- what changes is how wide the
// stretch is. The place *down* the band is `top + m.sv * deep`, which is one
// multiply and is done inline in `place` off numbers hoisted for the frame.
function homeX(m, span, spread) {
  let x = (m.fromX + (m.su - 0.5) * spread) % span;
  if (x < 0) x += span;
  return x;
}

// The age past which a mote's own clock stops moving it.
//
// Two things read `age`: the stretch it is spread within, which stops opening at
// `SMOG_SPREAD_MAX`, and the ease down into the band, which is finished at
// `SMOG_SINK`. Past the later of the two, another second of age changes nothing
// about where the mote is drawn -- so the arithmetic that works those two out,
// and the accumulation that feeds them, are all dead weight. See `place`.
const AGE_STILL = Math.max(SMOG_SINK, (SMOG_SPREAD_MAX - SMOG_SPREAD_MIN) / SMOG_SPREAD_RATE);

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
  let x = (homeX(m, fSpan, SMOG_SPREAD_MAX) + roamOf(m) * fSpan) % fSpan
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
const enter = m => { m.awake = true; ACTIVE.push(m); SKY.push(m); };

// And back on to it. Whatever has taken hold of it -- a hand through the smoke,
// the house letting go -- it carries on from the pixel it was being drawn at, so
// there is nothing to see at the moment it starts being stepped again.
function wake(m) {
  if (m.awake) return;
  m.x = moteX(m);
  m.y = moteY(m);
  m.awake = true;
  ACTIVE.push(m);
}

// Out of the sky. `place` compacts the list, so this only has to say so.
const dropped = m => { m.gone = true; };

// Everything out at once -- a save coming back, or a new game.
export function clearSky() {
  SKY.length = 0;
  ACTIVE.length = 0;
}

function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  const w = windAt(now());
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
  drift += (secs * SMOG_DRIFT * 60 * w) / span;
  // What the wind does to the height is lift: a gust getting under a bank of
  // haze raises it a few pixels and it settles back as the gust dies. Off the
  // same number as everything else in the air, so the band never rises on a wind
  // the dust is not in.
  const gust = Math.abs(w);
  fSpan = span; fTop = top; fDeep = deep; fGust = gust;

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
    const x = homeX(m, span, spreadAt(m.age));
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
    m.y = y - gust * m.give * SMOG_LIFT + m.py + SWAY_DY[m.lane];

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
    m.age = SMOG_SPREAD_MAX / SMOG_SPREAD_RATE;   // loaded, not arrived: long since spread
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
// The air itself, drawn in. Nothing in this list is worth anything or counted
// anywhere -- it is the one thing in this game that is a picture of something
// rather than the thing itself, and it earns that by being the only way a fan
// over a clean sky can say it is running.
export const DRAUGHT = [];

function breathe(secs) {
  const to = intake();
  // The same draught the sky is pulled on -- see `pull`. A bigger fan makes more
  // of it, so what you can see round the hood is what is happening to the band.
  const power = scrubRate() / SCRUB_PULL;
  let n = DRAUGHT_PER_S * power * secs;
  while (n > 0) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    // in from anywhere round the hood, though mostly from above it: what a fan
    // facing the sky pulls on is the sky
    const a = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.4;
    const d = DRAUGHT_FROM * (0.5 + rand() * 0.5);
    DRAUGHT.push({ x: to.x + Math.cos(a) * d, y: to.y + Math.sin(a) * d, t: 0 });
  }
  for (let i = DRAUGHT.length - 1; i >= 0; i--) {
    const k = DRAUGHT[i];
    const dx = to.x - k.x, dy = to.y - k.y;
    const d = Math.hypot(dx, dy) || 1;
    // it gathers pace as it goes, the way the haze does, and is gone at the mouth
    const step = DRAUGHT_PACE * secs * (1 + (1 - Math.min(1, d / DRAUGHT_FROM)));
    if (d < P * 2) { DRAUGHT.splice(i, 1); continue; }
    k.x += (dx / d) * step;
    k.y += (dy / d) * step;
    k.t = 1 - d / DRAUGHT_FROM;
  }
  if (DRAUGHT.length) S.dirty = true;
}

// Whether anything up there is carrying a draught offset at all.
//
// `unpull` is called on every frame the house is not scrubbing, which is nearly
// all of them, and its whole job is to find motes with an `sx` or an `sy` -- two
// fields that are zero on every mote in a sky no fan has ever pulled on. A full
// band is five or six thousand of them, so that is a walk of the entire sky, six
// thousand pairs of reads, to discover nothing, sixty times a second, for a
// building most yards have not bought yet.
//
// One flag answers it. It is set wherever an offset is written -- `pull`, and
// the plume half of `stirSmoke` -- and cleared by the pass that zeroes them all.
// Generous in the same direction the awake columns are: a flag left standing
// costs one wasted walk, and the other way round would be motes stuck with an
// offset the fan is no longer holding them at.
let dragged = false;

// What the throat has not swallowed yet, in whole motes. The house's rate is a
// rate, and a rate below one a frame cannot be spent a frame at a time without
// being rounded away to nothing, so what is left over is carried.
let gullet = 0;

function pull(secs) {
  const to = intake();
  // What the fan is worth, as a draught rather than as a number on a board.
  //
  // This read `scrubRate() / fanPull()`, which is the count of bodies inside --
  // and `capOf` has held that at one since the house was built, so the draught
  // was the same draught at every rung of the ladder. The fan multiplied the
  // rate the board *quoted* and cancelled straight back out of the one line that
  // actually moves a mote, so five rungs of it changed nothing overhead and the
  // reading went green while the sky went on filling. Against `SCRUB_PULL`
  // instead, so a bigger fan is a stronger pull on the sky, which is what it
  // says on the row.
  const power = scrubRate() / SCRUB_PULL;
  // and what it may take this frame, never more than a second's worth banked up
  // -- so a house that has been standing over a clear sky does not swallow a
  // whole second of band in one gulp the moment one drifts over it.
  gullet = Math.min(gullet + scrubRate() * secs, scrubRate());

  for (let i = SKY.length - 1; i >= 0; i--) {
    const m = SKY[i];

    // Nothing is taken on the way up. A house that reached into the plumes was a
    // house catching smoke a foot off the swing that made it -- and the sky over
    // the yard is what it is for. A speck joins the band, and *then* it is the
    // house's business.
    if (m.up) continue;

    // Every speck is aimed at its own cell of the mouth rather than at one
    // pixel of it. All of them steering for the same number arrived in single
    // file: a one-cell thread hanging from the band to the roof, which is a
    // pipe, not a draught. Spread over the width of the throat -- off the slot,
    // so a mote keeps the same lane for its whole journey in.
    const aim = to.x + ((m.slot % 5) - 2) * P;
    // Asked of the sky rather than read off the mote: a mote at rest is placed
    // by `moteX` and not written to. The draught's own offsets are part of what
    // that answers with, so a mote being dragged never has to be stepped.
    const dx = aim - moteX(m), dy = to.y - moteY(m);
    const d = Math.hypot(dx, dy);
    // A speck whose place cannot be worked out is left alone rather than treated
    // as being in the mouth. `|| 1` used to stand here and it turned exactly that
    // case into a pixel away.
    if (!Number.isFinite(d)) continue;

    // In -- as fast as the fan is rated to take it, and no faster.
    //
    // Whatever reached the mouth used to be swallowed, which made the rating on
    // the upgrade row a decoration: what the house actually took was however
    // many specks the draught happened to sweep into the throat, and that is a
    // question about the shape of the sky and the width of the near zone. It
    // came to roughly twice the rating, so one body with no fan held three
    // machines on its own and the whole ladder was spare change. The rate is the
    // rate now: `SCRUB_PULL` motes a second per body, times whatever fan has
    // been fitted, counted down as they go in.
    if (d < SCRUB_GRIP) {
      if (gullet < 1) continue;              // full for this moment; it waits at the mouth
      gullet -= 1;
      dropped(SKY.splice(i, 1)[0]);
      swallow();
      continue;
    }

    // The draught, and it runs *along the band* until it is over the house.
    //
    // Straight at the mouth from wherever it was, the whole sky slid down into
    // one long diagonal river running the length of the yard at chimney height:
    // the band stopped being a band, and the pollution took a low road through
    // the middle of the town to get to the fan. Smoke over a works does not do
    // that. It drifts along up there and goes down the throat when it is over
    // the throat.
    //
    // So the pull is sideways while it is still out over the yard, and turns
    // down only once the speck is near enough the house to be coming in. The
    // band keeps its shape and thins towards the house, which is what a fan
    // pulling on a still sky actually looks like.
    const step = SCRUB_DRAG * power * secs;
    const over = Math.abs(dx);
    if (over > SCRUB_NEAR) {
      // Sideways, and only sideways. A speck keeps the height it settled at, so
      // the band keeps its depth as it slides: a sinking term as well pressed
      // the whole sky down on to the underside of the band and what was left was
      // a wire running the width of the world.
      m.sx += Math.sign(dx) * Math.min(step, over);
      dragged = true;
      continue;
    }
    // Over the house: down the last of it, on a curve. The drop is weighted by
    // how nearly overhead the speck is -- nothing at the edge of the near zone,
    // all of it directly over the mouth -- so a speck comes along the band,
    // tips, and falls down the throat rather than cutting the corner on a
    // straight diagonal. The pull quickens as it closes, the way the last of
    // anything being sucked in does.
    // and the turn is eased rather than cornered: the sideways part fades out as
    // the down part comes in, over a zone wide enough to be a bend you can see.
    // Squared, so the first of the descent is gentle and the last of it is a
    // drop -- a right angle at the top of the throat read as a pipe.
    const in_ = 1 - over / SCRUB_NEAR;
    const quick = 1 + in_;
    m.sx += Math.sign(dx) * Math.min(step * quick * (1 - in_ * 0.5), over);
    m.sy += Math.sign(dy) * Math.min(step * quick * in_ * in_ * 2.4, Math.abs(dy));
    dragged = true;
  }
}

// What the house does with one, once it has it. Without the recycler it comes
// out of the back as muck on the ground and the crew have to shovel it: a house
// that made a bad sky simply vanish was a building you bought once and then
// forgot, and the only cost of running it was the body standing in it.
//
// That is also what the recycler is *for*. It was a strict bonus on top of a
// machine that already did its whole job, so the upgrade read as optional; now
// it is the thing that turns a pile of muck out the back into dust worth
// carrying, which is a reason to save for it.
function swallow() {
  drew += 1;                       // counted at the mouth -- see `sampleAir`
  if (!S.recycler) {
    S.scrubMuck = (S.scrubMuck || 0) + 1;
    while (S.scrubMuck >= SCRUB_PER_MUCK) {
      S.scrubMuck -= SCRUB_PER_MUCK;
      dropMuckAt(outlet().x, SCRUB_MUCK);
    }
    return;
  }
  S.scrubBank += 1 / RECYCLE_PER;
  // Whole grains only, and real ones: dust in this game is a grain on the ground
  // that somebody has to carry, not a number going up.
  while (S.scrubBank >= 1) {
    S.scrubBank -= 1;
    S.recycled++;
    const out = outlet();
    // and it drops out of the spout rather than being thrown out of it: the arm
    // points down, so the grain goes down
    // and no two grains quite the same shade. It paid out on RECYCLE_TONE flat,
    // so the heap under the spout was a block of one grey sitting next to the
    // rock's spoil, which is mottled because it comes from different depths.
    // Nothing about a machine handing back what it caught says every grain is
    // identical -- see `shadeNear`.
    spawnChip(out.x, out.y, (rand() - 0.5) * 0.5, 0.15, shadeNear(RECYCLE_TONE));
  }
}

// And the sky letting go the moment the fan stops.
//
// The offsets used to ease back to nought, which slid every speck home along the
// line it had been dragged in on: a body steps out of the house and the whole
// stream over the roof flies back out across the yard, at the speed it came in
// and in the wrong direction. Nothing in the air does that. What smoke does when
// the draught under it stops is stay where it is and drift back up into the rest
// of the smoke.
//
// So the pull is not undone, it is *kept*: the sideways part is folded into the
// mote's own creep along the sky, which is the number that says where it is, and
// the height is handed to the settle the band already has -- the same easing a
// mote uses when it first arrives, from wherever it is now up to its place. See
// `place`. A speck released over the house is a speck that was there, and it
// floats up from there.
function unpull() {
  if (!dragged) return;                // nothing up there has been pulled on
  dragged = false;
  const span = Math.max(P, S.worldW || 0);
  for (const m of SKY) {
    if (!m.sx && !m.sy) continue;
    // where it stands now, said in the terms the band uses. A mote's place is
    // `fromX`, plus its creep along the sky, plus its slot's share of a stretch
    // that opens with age -- so backing all three out of where it actually is
    // leaves a starting point that puts it back on the same pixel. It spreads
    // out again from there, which is the stream over the roof loosening into
    // band as it rises rather than snapping into place.
    const back = roamOf(m) * span + (m.su - 0.5) * spreadAt(0);
    const x = moteX(m), y = moteY(m);
    m.fromX = ((((x - back) % span) + span) % span);
    m.fromY = y;
    m.age = 0;
    m.sx = 0;
    m.sy = 0;
    // It has an arrival to make again, so it goes back on the stepped list --
    // from exactly where it was, which is what `wake` is for.
    wake(m);
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

// ...and part of *this* shower.
//
// A shower rains the sky that was overhead when it broke, and no more. Without
// that mark it rained whatever happened to be up there at the time, so every
// mote that climbed into the band during a downpour was taken straight back down
// again -- and the works went on fouling all the way through, so the shower fed
// on its own smoke and ran far longer than there was sky to justify. New haze
// arriving belongs to the next one.
const doomed = m => settled(m) && m.rain === S.rains;

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
  for (let i = 0; i < SKY.length; i++) if (doomed(SKY[i])) pick.push(i);
  // Nothing settled left, and what is left is still climbing. A shower does not
  // reach down the plume and pull specks back out of it -- it is over, and what
  // is on its way up belongs to the next one.
  if (!pick.length) { S.raining = false; return; }

  const gone = new Set();
  while (n > 0 && pick.length) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    const at = Math.floor(rand() * pick.length);
    const i = pick[at];
    pick[at] = pick[pick.length - 1];
    pick.pop();
    gone.add(i);
    const m = SKY[i];
    DROPS.push({ x: moteX(m), y: moteY(m), vy: 0.2 + rand() * 0.4 });
    dropped(m);
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
  // Over when the sky it broke on is gone, whatever has arrived since.
  if (!SKY.some(doomed)) S.raining = false;
}

function stepDrops() {
  const m = muckCols();
  const f = frames();
  for (let i = DROPS.length - 1; i >= 0; i--) {
    const d = DROPS[i];
    // rain falls at pixels a frame, so it falls by however long the frame was
    d.vy += RAIN_GRAV * f;
    d.y += d.vy * f;
    const c = colAt(d.x);
    if (c < 0 || c >= m.length) { DROPS.splice(i, 1); continue; }
    const rest = muckFloor(c) - m[c] * P;
    if (d.y < rest - P) continue;
    if (rand() < RAIN_MARK && m[c] < MUCK_MAX) m[c]++;
    DROPS.splice(i, 1);
    S.dirty = true;
  }
}

// --- the layer -----------------------------------------------------------------------
// One layer, one depth per column, and each column's mess knows what kind it is.
// This is the whole of what lies on the ground: what is buried, what is in the
// way and what there is to shift are all read off it, so nothing anywhere can
// disagree with what you are looking at.
//
// Two kinds, and they are not the same job. What the sky drops is weather: it
// lands on everybody's yard and everybody clears it. What a body leaves is a
// body's own, and shovelling that is a post -- see `capOf`, and the janitor.
// That difference is one word in the table below and nothing else. It used to be
// two arrays with one set of operations written twice over them and the
// ownership rule spelt out by hand at each of the places that cared, which is
// how `muckFor` and `yardMuck` came to disagree about poop and send a quarrier
// up and down a ladder for as long as anybody watched.
//
// So: one row per kind, holding everything anybody asks about one. Add a row and
// it rains down, slumps, slides off loose ground, gets shovelled by whoever is
// allowed to shovel it and is counted in the yard's own account of itself,
// without a second copy of any of that.
//
//   theirs  somebody's own mess rather than the weather's, so only the body
//           whose post it is may shift it. See `mayShift`.
//
// The kind's name is also where it lives in the save, because a layer that is
// written down under a different name from the one it is asked about is exactly
// the sort of second copy this table exists to stop.
export const MESS = {
  muck: { theirs: false },
  poop: { theirs: true }
};

// In the order the world works them: the weather first, which is what falls
// first and what everybody clears.
const KINDS = Object.keys(MESS);

// One column array per kind, kept the length of the world.
function cols(kind) {
  if (!S[kind] || S[kind].length !== floor.cols) {
    const was = S[kind] || [];
    S[kind] = new Array(floor.cols).fill(0);
    for (let i = 0; i < Math.min(was.length, floor.cols); i++) S[kind][i] = was[i] || 0;
  }
  return S[kind];
}

// The two questions the rest of the game asks, still under their old names
// because they are still the right questions -- what has changed is that there
// is one place that answers them. They hand back the layer itself, so a check
// laying mess by hand writes to the same cells the yard reads.
export const muckCols = () => cols('muck');
export const poopCols = () => cols('poop');

// Whether a given pair of hands may shift a given kind. The whole of the
// ownership rule, asked of the kind rather than re-derived at every call site.
const mayShift = (hand, kind) => !MESS[kind].theirs || !!(hand && hand.type === 'janitor');

// What this pair of hands may shift, in the order it works it: its own post
// first, since that is the job it was put on, and the weather after.
const shiftable = hand => KINDS.filter(k => mayShift(hand, k))
  .sort((a, b) => (MESS[b].theirs ? 1 : 0) - (MESS[a].theirs ? 1 : 0));

// what is standing in a column, of whatever kind: for heights, for drawing, and
// for anything that only wants to know whether the ground is clear
export const messAt = c => KINDS.reduce((n, k) => n + (cols(k)[c] || 0), 0);

export const colAt = wx => Math.floor(wx / P);
const inRange = (c, from, to) => c >= colAt(from) && c <= colAt(to);

const rockCols = () => boulderAlive()
  ? { from: rockLeft(), to: rockLeft() + S.gw * P } : null;
const quarryCols = () => S.quarryOpen ? { from: quarry.x, to: quarry.x + quarry.w } : null;
const plotCols = () => S.farmOpen ? { from: farm.x, to: farm.x + farm.w } : null;

function depthOver(range) {
  if (!range) return 0;
  const m = muckCols();
  let n = 0;
  for (let c = colAt(range.from); c <= colAt(range.to); c++) n += m[c] || 0;
  return n;
}

export const rockMuck = () => depthOver(rockCols());
export const quarryMuck = () => depthOver(quarryCols());
export const plotMuck = () => depthOver(plotCols());

// Where the muck in a column sits: on the rock if the rock is there, on the floor
// of the quarry if that is, on the ground otherwise. It lies on top of what it
// landed on -- it does not sink into it and it does not float over it.
export function muckFloor(c) {
  const wx = c * P + P / 2;
  const r = rockCols();
  if (r && wx > r.from && wx < r.to) {
    const col = Math.round((wx - rockLeft()) / P);
    if (S.rockTops[col] >= 0) return rockTopY(col);
  }
  // Over the quarry it lands on the quarry's floor -- which is wherever that column has
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
export const throughQuarryMuck = n => clearRange(quarryCols(), n);
export const throughPlotMuck = n => clearRange(plotCols(), n);

// Muck put down rather than rained down. The crew make their own now -- see
// `relieve` in crew.js -- and it is the same stuff the sky drops, so the same
// shovelling clears it and no new kind of mess had to be invented.
//
// It refuses the columns a shovel cannot reach. `onSite` holds the rock, the quarry
// and the plots out of the sweep, so muck left standing on one of those would lie
// there for the rest of the run: a body about to go on a site holds on until it
// is somewhere the crew can clean up after it.
// The nearest ground to a place that a shovel can actually reach, or null if
// there is none near. A body standing on the rock is standing on ground that is
// held out of the sweep, so what it leaves goes on the bare yard a step away
// rather than on the rock -- it steps aside, the way anybody would.
export function cleanSpotNear(wx, reach = 90) {
  const m = muckCols();
  const at = solidNear(wx, reach);
  if (at == null) return null;
  const c = colAt(at);
  return c < 0 || c >= m.length ? null : c * P + P / 2;
}

// Where a body goes to stand to work a patch: the patch, if there is footing
// under it, and the nearest footing there is if not.
//
// This used to name the places. The rock was an exception ("a body clearing the
// face climbs up and shovels where the muck is"), the quarry and the plots were
// worked from the edge, and heaps were not thought about at all -- which is why
// a body sent to clear a mess on a full heap stood at the height of the ground
// in the middle of it, and read as walking through the bank rather than in front
// of it. Three answers to one question, and a fourth case nobody had answered.
//
// It is one question now, and `footing` answers it: can you stand here. The rock
// is solid, so the answer over the rock is yes and a body climbs it -- the old
// exception, arrived at rather than written down. A heap is loose and a mouth is
// nothing, so the answer over either is no and the body steps to the side. See
// route.js.
export const workSpot = wx => footing(wx) === SOLID ? wx : (solidNear(wx) ?? wx);

// Capped like everything else the sky drops. A column holds MUCK_MAX and no
// more, whoever put it there -- without that a body could bury a column deeper
// than a downpour ever would, and the crew would still be shovelling it long
// after the weather had been dealt with.
export function dropMuckAt(wx, n, kind = 'muck') {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  const m = cols(kind);
  const c = colAt(at);
  // A unit at a time, each into the lowest column nearby, which is what makes a
  // heap rather than a pillar.
  //
  // It used to go into one column and stack there until it hit MUCK_MAX -- so
  // what a body left behind was a tower of it in a single cell, standing
  // straight up out of flat ground like a chimney. Nothing else in this yard
  // behaves like that: dust falls where it falls and slumps sideways, and the
  // mess should read the same way, as something that was dropped and settled.
  for (let i = 0; i < n; i++) {
    let best = c, low = m[c] || 0;
    for (let d = 1; d <= MESS_SLUMP; d++) {
      for (const k of [c - d, c + d]) {
        if (k < 0 || k >= m.length) continue;
        const h = m[k] || 0;
        // Strictly lower, so it fills the dip beside the heap before it starts a
        // new one further out -- and the nearer of two equal columns wins,
        // because the loop reaches them in that order.
        if (h < low) { low = h; best = k; }
      }
    }
    if (low >= MUCK_MAX) break;                // nowhere near here has room
    m[best] = Math.min(MUCK_MAX, (m[best] || 0) + 1);
  }
  S.dirty = true;
  return true;
}

// One pass of the mess settling: a column standing more than a step above its
// neighbour topples a unit into it. Sand does this every frame -- see `settle` in
// grid.js -- and the mess is drawn out of the same cells, so it should stand at
// the same angle.
export function slumpMess() {
  for (const kind of KINDS) {
    const m = cols(kind);
    for (let c = 0; c < m.length; c++) {
      const h = m[c] || 0;
      if (h < 2) continue;
      for (const k of [c - 1, c + 1]) {
        if (k < 0 || k >= m.length) continue;
        if (h - (m[k] || 0) > MESS_ANGLE) { m[c]--; m[k] = (m[k] || 0) + 1; break; }
      }
    }
  }
  slideOffLoose();
}

// Mess that has ended up on ground that will not hold it, sliding to ground that
// will. `dropMuckAt` already puts what falls on solid footing, so nothing lands
// on a bank -- but a bank grows. Tip a load onto a heap that a rain has already
// dirtied and the mess is suddenly halfway up a slope of loose dust, where
// nobody can stand to shovel it; leave it there and it is a mess that can never
// be cleared, on ground nobody can reach.
//
// So it slides, the same way the mess already topples off its own slopes one
// step above. It is the settling rule applied to a second kind of slope: loose
// dust is a surface nothing rests on, and this is what "nothing rests on it"
// looks like a frame at a time.
//
// One column a pass. This runs every frame, the slide is only ever a few cells,
// and a loop that walked the whole yard looking for solid ground for every dirty
// column would be the most expensive thing in the file.
function slideOffLoose() {
  for (const kind of KINDS) {
    const m = cols(kind);
    for (let c = 0; c < m.length; c++) {
      if (!m[c]) continue;
      const x = c * P + P / 2;
      if (footing(x) === SOLID) continue;
      const to = solidNear(x, MESS_SLIDE);
      if (to == null) continue;
      const k = colAt(to);
      if (k === c || k < 0 || k >= m.length || (m[k] || 0) >= MUCK_MAX) continue;
      m[c]--;
      m[k] = (m[k] || 0) + 1;
      S.dirty = true;
      return;                       // one column a pass; the rest follow it down
    }
  }
}

// The rest of it, shifted from wherever the body doing the shifting is standing,
// so a gang spread along the yard clears the yard rather than all of them
// working the same column.
//
// A shovel reaches on to a site, and it always should have. `onSite` was in this
// loop, so muck that came down on the rock, the quarry or the plots was not
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
  // What this pair of hands may shift, and in what order -- a janitor clears
  // both stacks and takes what a body left first, since that is the job it was
  // put on, and everybody else clears the weather and steps over the rest. The
  // rule is not written here: it is read off the kinds. See `shiftable`.
  const stacks = shiftable(hand).map(k => cols(k));
  const home = colAt(wx);
  const hold = hand || loose;
  hold.owed = Math.min(1, (hold.owed || 0) + n);
  let cells = Math.floor(hold.owed);
  if (cells < 1) return 0;
  let took = 0;
  for (let d = 0; d < 60 && cells > 0; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= floor.cols || cells < 1) continue;
      for (const m of stacks) {
        if (!m[c] || cells < 1) continue;
        const take = Math.min(m[c], cells);
        m[c] -= take;
        cells -= take;
        took += take;
        S.dirty = true;
      }
    }
  }
  hold.owed -= took;
  return took;
}

// for a sweep nobody owns -- a hook, a check -- so the fraction has somewhere to
// live either way
const loose = { owed: 0 };

// --- the frame's answers, worked out once -------------------------------------
// How much mess is out there, and how much of it is on ground a shovel can be
// swung on. Every body in the crew asks on every frame, and the honest answer is
// a walk over every column in the world asking `onSite` about each -- which asks
// the footing, which builds the ways. Done per body per frame that is a yard
// that stutters for the sake of a number that cannot have changed since the body
// before it asked.
//
// So it is worked out once a frame. Not by a `refresh()` somebody has to
// remember to call at the right moment and null at the right moment -- that is a
// cache whose lifetime nobody can see, and it left `siteAt` sitting here for
// months, assigned on every frame and read by nothing. It is a memo, keyed on
// the things it is an answer about: the frame, and the layer's own arrays. A new
// frame, or a layer rebuilt under it by a reseeding or a wider world, and the
// walk happens again; anything else reads the answer. Nothing has to be told.
//
// Frame-grained on purpose. The crew are stepped before the sky is, so every
// body in a pass has always seen the same figure, and a number that moved under
// the crew mid-pass would mean the first body to ask cleared the mess out from
// under the sixth.
let tallied = null;

// Forget the frame's tally. The memo invalidates itself on a new frame and on
// the arrays being replaced -- but a hand reaching in BETWEEN frames and
// rewriting the cells in place (the __muckSet/__poopSet hooks are the hands)
// changes the world without changing either key, and every reader until the
// next tick gets the old answer. The hook calls this; nothing in play needs to.
export const retally = () => { tallied = null; };

function tally() {
  const stacks = KINDS.map(k => cols(k));
  if (tallied && tallied.tick === S.tick && stacks.every((s, i) => s === tallied.stacks[i]))
    return tallied;
  // Per kind, and the same sum again over only the ground a body can work --
  // which is the pair of numbers `muckFor` and `yardMuckFor` are two ranges of.
  const by = {}, yardBy = {};
  for (const k of KINDS) by[k] = yardBy[k] = 0;
  let all = 0, yard = 0;
  for (let c = 0; c < stacks[0].length; c++) {
    let v = 0;
    for (const s of stacks) v += s[c] || 0;
    if (!v) continue;              // and `onSite` is never asked about bare ground
    const off = !onSite(c);
    for (let i = 0; i < KINDS.length; i++) {
      const n = stacks[i][c] || 0;
      by[KINDS[i]] += n;
      if (off) yardBy[KINDS[i]] += n;
    }
    all += v;
    if (off) yard += v;
  }
  // Once the yard has been left in a state it has been: the row that sells the
  // shed hangs off this, and a row that appeared and then vanished again because
  // somebody happened to tidy up would be the game changing its mind. What
  // counts towards it is what the crew left, asked of the kinds rather than
  // named here.
  const theirs = KINDS.reduce((n, k) => (MESS[k].theirs ? n + by[k] : n), 0);
  if (theirs >= LOO_MUCK * 5) S.seenMess = true;
  return (tallied = { tick: S.tick, stacks, all, yard, by, yardBy });
}

// Ground a shovel cannot be swung on, because there is nowhere to stand. It is
// asked of the footing rather than of a list of buildings, so what is held out
// is exactly what cannot be worked: the two mouths, and the plots, which are
// loose in the sense that matters here -- you would be treading on the crop.
//
// The rock is no longer on this list and that is the point. It is solid ground
// that happens to be uphill, so a mess on it is a mess like any other and
// whoever is nearest goes and clears it. It used to be held out here and then
// let back in by a special case in `workSpot`, which is two rules cancelling.
function onSite(c) {
  const x = c * P + P / 2;
  if (footing(x) !== SOLID) return true;
  const p = plotCols();
  return !!p && inRange(c, p.from, p.to);
}

// How much ground a body shovelling claims either side of itself, in columns: a
// body is three cells wide, so this keeps the next one clear of its elbows.
export const MUCK_ELBOW = 4;

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
  return c >= 0 && c < floor.cols ? messAt(c) : 0;
}

export function nearestMuck(wx, taken, hand) {
  // What this pair of hands is allowed to shift. Weather is everybody's; what a
  // body left is the janitor's -- so a hauler walking to the nearest mess must
  // not be sent to a column that is nothing but the other kind, or it walks
  // there, finds nothing it may touch, and stands over it. The rule is the
  // kinds' own -- see `shiftable` -- so a claim can never be made on ground the
  // shovel would then refuse.
  const mine = shiftable(hand).map(k => cols(k));
  // And what this pair of hands can stand on. Muck really does lie over the
  // mouth of the pit -- `muckTop` sends it down to `pitTop` -- but the only body
  // with any business down there is a hauler, and it is the only one whose
  // branch routes down a ladder for it. Every
  // other trade claimed the column through here, walked to it, and then stood at
  // `walkY`: the ground line, with the dust it was shovelling several hundred
  // pixels below its feet. That is the reported "some workers are walking
  // through the air over the pit", and the reason some behaved is that those
  // ones were haulers.
  //
  // The gate belongs here rather than at the five call sites of `takeMuck`,
  // because here is where a claim is made and all five of them claim through it.
  // It tests `overPitMouth`, the same predicate the hauler's own pit branch
  // tests, so the two sides cannot drift apart.
  // A hauler -- and a janitor. The gate was written when the hauler's own pit
  // branch was the only way down; a mess is reached by route now, and the hole
  // is on the ways like everywhere else. What kept the janitor out was only
  // this line -- and poop is the one mess nobody else may shift, so what a body
  // left on the pile (bodies work down there, and cross it) lay in the hole for
  // the rest of the run with the janitor loitering at its shed: barred here,
  // while every hauler that could walk to it was barred by `shiftable`.
  const canDescend = hand && (hand.type === 'hauler' || hand.type === 'janitor');
  const m = muckCols();
  const here = c => { let n = 0; for (const s of mine) n += s[c] || 0; return n; };
  const home = colAt(wx);
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !here(c)) continue;
      if (!canDescend && overPitMouth(c * P + P / 2)) continue;
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
  // Everything within reach is spoken for -- so there is nothing here for THIS
  // pair of hands, and it says so.
  //
  // There used to be a second pass here that handed out the nearest patch
  // anyway, on the argument that two on one patch beats one doing nothing. What
  // that actually bought was the end of every clear-up: three bodies granted
  // the same last cell, standing in each other and jostling over one shovelful.
  // The dust system answers the same moment the other way -- a hauler with
  // nothing left to claim rests and asks again next frame -- and a claim frees
  // the instant its column is clear, so the wait is a beat, not a stall. One
  // patch, one body, to the very last cell.
  return null;
}

export const muckLeft = () => tally().all;
// how much of it is what a body left, which is the janitor's alone
export const poopLeft = () => tally().by.poop;
// and what a given pair of hands may actually shift, which is the number that
// decides whether it is worth walking over there
//
// One rule, asked at two ranges. What a body may shift is: everything, if it is
// a janitor; everything but what other bodies left, otherwise. That sentence is
// written once, in `mineToShift`, and the two questions that need it differ only
// in how far they look.
//
// They used to be written twice and they disagreed. `muckFor` took the poop out
// and `yardMuck` left it in, so with no outhouse up -- where poop accumulates
// and nothing ever clears it -- a quarrier standing in a full cut was told by
// `yardMuck` that there was work up top and told by `muckFor`, the moment it got
// there, that there was none. It climbed out, was refused a shovel, climbed back
// in, and did that for as long as you watched. That is the reported "quarry
// workers are getting stuck on the ladder": not a ladder fault at all, but two
// spellings of one question.
//
// And it is not written at all any more, in the sense of being a subtraction
// somebody chose: it is the sum of the kinds this pair of hands may shift, which
// is the same sentence `sweepMuckAt` and `nearestMuck` work from. Add a kind to
// `MESS` and all three of them count it or hold it back on the strength of one
// word in the table.
const mineToShift = (w, sums) => shiftable(w).reduce((n, k) => n + sums[k], 0);
export const muckFor = w => mineToShift(w, tally().by);
// the same question, asked only of the ground that is not a site
export const yardMuckFor = w => mineToShift(w, tally().yardBy);
// the raw number, for the yard's own account of itself -- a report wants what is
// out there, not what one pair of hands is allowed to touch
export const yardMuck = () => tally().yard;
export const buried = () => rockMuck() > 0 || quarryMuck() > 0 || plotMuck() > 0;

// --- whether it rains ----------------------------------------------------------------
// The sky is looked at every few seconds and asked, not compared against a line
// every frame. What a sample gives is a chance, and the chance is how filthy it
// is: nothing at all under the line, about one in eight the moment it crosses,
// and a certainty at the brim.
//
// So a full sky is a thing that is *going* to rain rather than a thing that
// rains at a number, and the yard cannot be played by the arithmetic -- you
// watch it darken and you get on with the shovels.
// **There is no line.** It used to be nothing at all under `SMOG_RAIN_AT` and a
// chance ramping from there to the brim. What is left is one curve: how often it
// rains *is* how dirty the sky is, all the way down.
//
// Bent hard rather than straight, which is what keeps a lightly dirty yard from
// being rained on: the chance is the share of the cap raised to
// `SMOG_RAIN_BEND`, so it falls away far faster than the sky clears.
//
// And **nought at nought**, exactly. A clean sky is not a one-in-a-million
// chance that happens to lose: it is not a question. That is not only fair, it
// is what keeps `breaks` from taking a number off the yard's one generator every
// few seconds for the whole of a game -- see the note there, and why every
// seeded run would otherwise diverge over a coin that was never flipped.
export function rainOdds() {
  if (!(S.haze > 0)) return 0;
  const share = Math.min(1, S.haze / SMOG_CAP);
  return Math.min(1, Math.pow(share, SMOG_RAIN_BEND));
}

// Seconds since the last shower stopped, and how long it is since the sky was
// last looked at. Both are facts about a run rather than about a save -- a game
// picked up again is a dry yard, and it may rain on you when it likes.
let dryFor = Infinity, sinceLook = 0;

export const dryTime = () => dryFor;

// One frame of that question. It is asked every frame and answered on the frames
// a sample falls due, so the roll happens at the sampling rate however fast the
// machine underneath is running.
function breaks(secs) {
  if (raining()) { dryFor = 0; sinceLook = 0; return false; }
  dryFor += secs;
  sinceLook += secs;
  if (sinceLook < SMOG_SAMPLE) return false;
  sinceLook = 0;
  // A minute of dry, whatever is overhead. See RAIN_GAP: a shower rains the sky
  // it broke on and the works go on fouling underneath it, so without this floor
  // a busy yard came out of one downpour straight into the next.
  if (dryFor < RAIN_GAP) return false;
  // The odds first, and the roll only if there are any. A clean sky is not a
  // one-in-nothing chance that happens to lose: it is not a question, and asking
  // it anyway would take a number off the yard's one generator every few seconds
  // for the whole of a game -- so every seeded run in the yard, weather or not,
  // would come out differently for the sake of a coin that was never flipped.
  const odds = rainOdds();
  return odds > 0 && rand() < odds;
}

// --- one frame ---------------------------------------------------------------------
export function stepSmog(dt) {
  const secs = dt / 1000;
  stepPuffs(secs);
  // The draught, or the sky letting go of it again. The house takes motes; it
  // used to take motes *and* dock the number by what the fan was worth, which is
  // the same dirt subtracted twice.
  if (scrubbing()) { pull(secs); breathe(secs); }
  else { unpull(); DRAUGHT.length = 0; }
  // The number is worked out from the sky before anything asks whether it should
  // be raining, because the answer to that question has to be about what is
  // actually overhead.
  reckon();
  // A shower starts over from the first spot every time -- the ramp is a fact
  // about this one, not a clock that carries on between them.
  if (breaks(secs)) {
    S.raining = true; S.rains++; S.rainFor = 0;
    // Everything settled up there right now belongs to this shower. Anything
    // that arrives after this frame does not, and will still be there when it
    // stops -- which is what a sky that keeps being dirtied ought to look like.
    for (const m of SKY) if (settled(m)) m.rain = S.rains;
  }
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
let mark = { at: 0, rate: 0, drew: 0 };

// And what the house has actually taken, counted the same way: at the mouth, as
// motes go down the throat. It used to be quoted rather than counted -- the
// board showed `scrubRate()`, which is what the fan is *rated* at, and a rating
// is not a measurement. Two things were wrong with it at once. It was in motes a
// second where the fouling beside it was in haze a second, so the house's column
// read about twice what it was worth against the yard's; and it went on quoting
// the full figure while the house stood clogged, or while the sky was too thin
// to have anything within reach of the draught. A board that says you are
// winning while the band thickens over your head is worse than no board.
let drew = 0;

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
  // In haze a second, the same unit the fouling is in, so the two columns on the
  // board are the same kind of thing and the difference between them means
  // something.
  const took = mark.at ? (drew / gone) * SMOG_PER_MOTE : 0;
  mark = { at: t, rate, drew: took };
  made = 0;
  drew = 0;
  if (!mark.at) return;
  net[oldest] = rate - took;
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
// What the house took out over the last second, not what its fan is rated at.
const scrubbed = () => mark.drew;

export function airReadout() {
  const net = fouling() - scrubbed();
  return {
    haze: Math.round(S.haze),
    at: SMOG_RAIN_AT,
    // The brim as well as the line. A sky at the line only *might* rain; a sky
    // at the brim is going to, on the next look -- which is the difference the
    // sampling makes, and the number a check winds to when it wants weather.
    cap: SMOG_CAP,
    share: Math.min(1, S.haze / SMOG_CAP),
    fouling: +(fouling() * 60).toFixed(1),
    scrubbing: +(scrubbed() * 60).toFixed(1),
    // blank when the house is winning, which is the number worth playing for
    dueMs: net <= 0 ? null : Math.round(((SMOG_CAP - S.haze) / net) * 1000),
    // What a look at the sky would say right now, and how long it has been dry.
    // The board shows how far off the line is; these are the two numbers behind
    // the fact that reaching it is not the same as it raining.
    odds: +rainOdds().toFixed(3),
    dryFor: dryFor === Infinity ? null : +dryFor.toFixed(1)
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
  for (const m of SKY) if (!m.up) out[((Math.floor(moteX(m) / STRIP) % n) + n) % n]++;
  return out;
}

export function clumpiness() {
  const b = strips();
  const total = b.reduce((x, y) => x + y, 0);
  if (!total) return 0;
  return +(Math.max(...b) / (total / b.length)).toFixed(2);
}

export const skyBins = () => strips().filter(Boolean).length;

// how much of the sky the house has hold of: specks inside a few cells of the
// mouth, on their way down the throat
export function drawnIn() {
  if (!S.scrubOpen) return 0;
  const to = intake();
  let n = 0;
  for (const m of SKY) if (Math.hypot(moteX(m) - to.x, moteY(m) - to.y) < SCRUB_CATCH) n++;
  return n;
}

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
           skyX: spread(SKY.filter(m => !m.up), 200).map(m => +moteX(m).toFixed(2)),
           puffs: climbing(), drops: DROPS.length, trend: airTrend(),
           // Motes the draught has hold of: near the mouth and plainly coming.
           // It used to be a list of specks on a scripted curve into the hood;
           // there is no such list any more, because there is no such errand --
           // the sky itself is what comes in.
           caught: drawnIn(), clumpiness: clumpiness(), skyBins: skyBins(),
           cloudR: cloudR(),
           raining: raining(), rains: S.rains, recycled: S.recycled,
           scrubbers: S.scrubbers, scrubOpen: S.scrubOpen, recycler: S.recycler,
           muck: { rock: rockMuck(), cut: quarryMuck(), plot: plotMuck(),
                   yard: yardMuck(), all: muckLeft(),
                   cols: muckCols().filter(Boolean).length },
           poop: poopLeft(),
           ...airReadout() };
}

export function seedSmog() {
  made = 0;
  // A new yard has been dry for ever: the first shower waits on the sky and on
  // nothing else.
  dryFor = Infinity;
  sinceLook = 0;
  net.fill(0);
  filled = 0;
  oldest = 0;
  mark = { at: 0, rate: 0, drew: 0 };
  drew = 0;
  gullet = 0;
  clearSky();
  // The band's shared creep, back to where a mote made now would read it. It is
  // a fact about a run, like the clock and the seed.
  drift = 0;
  DROPS.length = 0;
  S.muck = [];
}
