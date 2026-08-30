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
         SMOG_SPREAD_MIN, SMOG_SPREAD_MAX, SMOG_SPREAD_RATE,
         SWAY_LANES, SWAY_X, SWAY_Y, SWAY_PACE, RAIN_PER_S, RAIN_RAMP, RAIN_GRAV, RAIN_MARK, MUCK_MAX,
         SCRUB_PULL, RECYCLE_PER, RECYCLE_TONE, PUFF_FADE, SMOG_TINTS,
         SCRUB_ARM, SCRUB_CATCH, SCRUB_PER_MUCK, SCRUB_MUCK, SCRUB_CLOG, SCRUB_CHUTE,
         SCRUB_DRAG, SCRUB_NEAR, SCRUB_GRIP, LOO_MUCK,
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
import { surfaceY, colOf, shadeNear } from './grid.js';
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

// Nothing on its way into the house has a list of its own: the sky is what goes
// in, dragged there by the draught. See `pull`.

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
// 'shard' out of the quarry, 'spore' off the plots. It is carried all the way up and
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
    SKY.push({
      up: true,
      // the same look a mote in the band has, because it is going to be one --
      // see `look`
      ...look(kind),
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
  ink: 0.8 + Math.random() * 0.4,
  // and which of its kind's shades it is. See SMOG_TINTS: a kind is a small
  // family of tones, not one flat colour.
  tone: Math.floor(Math.random() * (SMOG_TINTS[kind] || SMOG_TINTS.dust).length)
});

// A mote is a place in the band, a share of the wind, and -- for its first few
// seconds -- where it came in. It arrives at the spot the puff got to and eases
// out to its place among the others, which is what joining a haze looks like.
const skyMote = (x, y, kind = 'dust') => ({
  kind,
  up: false,                            // arrived: this one is in the band
  ...look(kind),
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

function stepPuffs(secs) {
  const low = bandLow();
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
  // Its look is not among the fields set here, and that is deliberate: `foul`
  // gave it one when it left the swing and it keeps it. A speck that changed
  // colour or weight on arriving would be a speck you watched climb and then
  // saw replaced by another one.
  
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

function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  const w = windAt(now());
  swayNow(now() / 1000);
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
    // and its lane's drift for this frame, which is the whole of the band's own
    // movement: one lookup, no arithmetic per mote worth speaking of.
    const lane = m.slot % SWAY_LANES;
    m.x = (home.x + m.roam * span) % span + (m.px || 0) + SWAY_DX[lane];
    m.y = y - Math.abs(w) * m.give * SMOG_LIFT + (m.py || 0) + SWAY_DY[lane];

    // and however far the draught has dragged this one so far. It is carried on
    // the mote and added here, because a settled mote has no position of its
    // own -- it is placed where its slot says, every frame -- so being pulled
    // across the sky is a growing offset from that place. See `pull`.
    // Either one on its own is enough to matter, and either one may be missing:
    // the draught pulls sideways along the band without touching the height, so
    // a mote being dragged has an `sx` and no `sy` at all. Adding an undefined
    // to a coordinate makes it NaN, and a NaN coordinate is not merely a speck
    // in the wrong place -- `pull` measures distance with `hypot(...) || 1`, so
    // a NaN distance reads as one pixel and the whole sky is swallowed in a
    // single frame the moment somebody steps into the house.
    if (m.sx || m.sy) { m.x += m.sx || 0; m.y += m.sy || 0; }
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
  const power = scrubRate() / SCRUB_PULL;
  let n = DRAUGHT_PER_S * power * secs;
  while (n > 0) {
    if (n < 1 && Math.random() > n) break;
    n -= 1;
    // in from anywhere round the hood, though mostly from above it: what a fan
    // facing the sky pulls on is the sky
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
    const d = DRAUGHT_FROM * (0.5 + Math.random() * 0.5);
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

function pull(secs) {
  const to = intake();
  const power = scrubRate() / SCRUB_PULL;      // bodies inside

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
    const dx = aim - m.x, dy = to.y - m.y;
    const d = Math.hypot(dx, dy);
    // A speck whose place cannot be worked out is left alone rather than treated
    // as being in the mouth. `|| 1` used to stand here and it turned exactly that
    // case into a pixel away.
    if (!Number.isFinite(d)) continue;

    // In. Whatever reaches the mouth is taken -- there is no separate errand and
    // nothing is picked out.
    if (d < SCRUB_GRIP) { SKY.splice(i, 1); swallow(); continue; }

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
      m.sx = (m.sx || 0) + Math.sign(dx) * Math.min(step, over);
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
    m.sx = (m.sx || 0) + Math.sign(dx) * Math.min(step * quick * (1 - in_ * 0.5), over);
    m.sy = (m.sy || 0) + Math.sign(dy) * Math.min(step * quick * in_ * in_ * 2.4, Math.abs(dy));
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
    spawnChip(out.x, out.y, (Math.random() - 0.5) * 0.5, 0.15, shadeNear(RECYCLE_TONE));
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
  const span = Math.max(P, S.worldW || 0);
  for (const m of SKY) {
    if (!m.sx && !m.sy) continue;
    // where it stands now, said in the terms the band uses. A mote's place is
    // `fromX`, plus its creep along the sky, plus its slot's share of a stretch
    // that opens with age -- so backing all three out of where it actually is
    // leaves a starting point that puts it back on the same pixel. It spreads
    // out again from there, which is the stream over the roof loosening into
    // band as it rises rather than snapping into place.
    const s0 = slotAt(m.slot);
    const back = m.roam * span + (s0.u - 0.5) * spreadAt(0);
    m.fromX = ((((m.x - back) % span) + span) % span);
    m.fromY = m.y;
    m.age = 0;
    m.sx = 0;
    m.sy = 0;
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

// And what the crew leave, which is a different stack in the same shape.
//
// Two kinds of mess, and they are not the same job. What the sky drops is
// weather: it lands on everybody's yard and everybody clears it. What a body
// leaves is a body's own, and shovelling that is a post -- see `capOf`, and the
// janitor. Kept apart rather than distinguished by a flag on a number, because
// nearly everything that asks about muck wants one or the other and would have
// had to say which every time.
export function poopCols() {
  if (!S.poop || S.poop.length !== floor.cols) {
    const was = S.poop || [];
    S.poop = new Array(floor.cols).fill(0);
    for (let i = 0; i < Math.min(was.length, floor.cols); i++) S.poop[i] = was[i] || 0;
  }
  return S.poop;
}

// what is standing in a column, of whatever kind: for heights, for drawing, and
// for anything that only wants to know whether the ground is clear
export const messAt = c => (muckCols()[c] || 0) + (poopCols()[c] || 0);

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
// patch itself; on the rock, the quarry or the plots it is the nearest ground
// beside it. A shovel reaches on to a site, a pair of boots does not -- so the
// body steps up to the edge of the thing and works across it, the same way it
// steps aside to leave anything of its own on ground somebody can clean.
// The rock is the exception, and it is the obvious one: a rock is a hill with a
// gang standing on top of it all day. A body clearing the face climbs up and
// shovels where the muck is, the way a miner works where the rock is -- reaching
// across from the apron was a body cleaning a roof from a ladder it never moved.
//
// The quarry and the plots stay worked from the edge. There is nowhere to stand on
// either of them: one is a hole with benches in it and the other is a plot you
// would be treading on.
export const onRock = wx => {
  const r = rockCols();
  return !!r && wx > r.from && wx < r.to;
};

export const workSpot = wx =>
  onRock(wx) ? wx : onSite(colAt(wx)) ? (cleanSpotNear(wx) ?? wx) : wx;

// Capped like everything else the sky drops. A column holds MUCK_MAX and no
// more, whoever put it there -- without that a body could bury a column deeper
// than a downpour ever would, and the crew would still be shovelling it long
// after the weather had been dealt with.
export function dropMuckAt(wx, n, kind = 'muck') {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  const m = kind === 'poop' ? poopCols() : muckCols();
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
  // A janitor clears both stacks and takes what a body left first, since that is
  // the job it was put on. Everybody else clears the weather and steps over the
  // rest.
  const own = hand && hand.type === 'janitor';
  const stacks = own ? [poopCols(), muckCols()] : [muckCols()];
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
let poopTotal = 0;          // how much of the mess is what a body left
let yardLeft = 0;
let allLeft = 0;

function refresh() {
  siteAt = [rockCols(), quarryCols(), plotCols()].filter(Boolean);
  const m = muckCols(), poo = poopCols();
  let all = 0, yard = 0;
  poopTotal = 0;
  for (let c = 0; c < m.length; c++) {
    poopTotal += poo[c] || 0;
    const v = (m[c] || 0) + (poo[c] || 0);
    if (!v) continue;
    all += v;
    if (!onSite(c)) yard += v;
  }
  allLeft = all;
  // Once the yard has been left in a state it has been: the row that sells the
  // shed hangs off this, and a row that appeared and then vanished again because
  // somebody happened to tidy up would be the game changing its mind.
  if (poopTotal >= LOO_MUCK * 5) S.seenMess = true;
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
  return c >= 0 && c < floor.cols ? messAt(c) : 0;
}

export function nearestMuck(wx, taken, hand) {
  // What this pair of hands is allowed to shift. Weather is everybody's; what a
  // body left is the janitor's -- so a hauler walking to the nearest mess must
  // not be sent to a column that is nothing but the other kind, or it walks
  // there, finds nothing it may touch, and stands over it.
  const own = hand && hand.type === 'janitor';
  const m = muckCols(), poo = poopCols();
  const here = c => (m[c] || 0) + (own ? poo[c] || 0 : 0);
  const home = colAt(wx);
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !here(c)) continue;
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
// how much of it is what a body left, which is the janitor's alone
export const poopLeft = () => poopTotal;
// and what a given pair of hands may actually shift, which is the number that
// decides whether it is worth walking over there
export const muckFor = w => (w && w.type === 'janitor' ? allLeft : allLeft - poopTotal);
export const yardMuck = () => yardLeft;
export const buried = () => rockMuck() > 0 || quarryMuck() > 0 || plotMuck() > 0;

// --- one frame ---------------------------------------------------------------------
export function stepSmog(dt) {
  const secs = dt / 1000;
  refresh();                        // what the crew will ask about, asked once
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
  if (S.haze >= SMOG_RAIN_AT && !raining()) {
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

// how much of the sky the house has hold of: specks inside a few cells of the
// mouth, on their way down the throat
export function drawnIn() {
  if (!S.scrubOpen) return 0;
  const to = intake();
  let n = 0;
  for (const m of SKY) if (Math.hypot(m.x - to.x, m.y - to.y) < SCRUB_CATCH) n++;
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
           skyX: spread(SKY.filter(m => !m.up), 200).map(m => +m.x.toFixed(2)),
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
           poop: poopTotal,
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
  S.muck = [];
}
