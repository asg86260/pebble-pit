// Who a body is: its name, its age and the record of what it has done -- none of
// which feeds a rate, so it is bookkeeping, not behavior. Extracted verbatim
// from crew.js; behavior unchanged. Owns NAMES/newName, newRecord, KEEPS,
// keepOf, wearRecord, outOfYard, stepRecords and mainlyAt. It calls nothing back
// in crew.js -- every name it uses comes from the modules imported below.

import { S } from '../state.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';
import { indoors } from '../lab.js';
import { inHouse } from '../scrubhouse.js';
import { JOB_OF } from '../upgrades.js';

// --- who they are --------------------------------------------------------------
// A body used to be a slot: the crew was four counts, `syncWorkers` made people
// out of them when it needed people, and coming back to a saved game made a
// fresh set who happened to be standing in the same places. That was the point
// for a long while -- a job is a count and a body is whichever body happens to
// be doing it -- and it is what lets a hat belong to a station rather than to a
// head.
//
// It is not the point any more. This game opens on two squares who are somebody,
// and a crew of interchangeable slots underneath that story was the yard
// disagreeing with its own first minute. So a body has a name, an age and a
// record: how much rock it has taken, how much it has found, how much it has put
// in the hole, and where it has spent its time. None of it does anything -- no
// number here feeds a rate -- it is only so that the four on the rock are four
// people rather than the number four.
const NAMES = ['ada', 'bel', 'cass', 'dot', 'edie', 'fen', 'gil', 'hal', 'ivy',
               'jax', 'kit', 'lom', 'mo', 'nell', 'ora', 'pip', 'rue', 'sid',
               'tam', 'vic', 'wren', 'yaz', 'zeb', 'bram', 'cleo', 'flo', 'gus',
               'hex', 'iso', 'jom', 'lark', 'mel', 'nix', 'obe', 'quin', 'ros',
               'tess', 'vim', 'wick', 'yew'];

// A name nobody in the yard already has, while there are any left; after that
// the yard is big enough that two of a name is the two of them, not a bug.
function newName() {
  const taken = new Set(S.workers.map(w => w.name));
  const free = NAMES.filter(n => !taken.has(n));
  const from = free.length ? free : NAMES;
  return from[Math.floor(rand() * from.length)];
}

// The record a body keeps. `lived` is counted up rather than measured from a
// start time on purpose: the clock is wall time since the page loaded, so a
// birthday saved in it means nothing the next time you come back.
export const newRecord = () => ({
  name: newName(),
  lived: 0,                        // milliseconds on the payroll
  mined: 0,                        // pixels off the rock
  quarried: 0,                     // shards brought up out of the quarry
  farmed: 0,                       // spores taken off the plots
  stored: 0,                       // grains put in the hole
  at: {}                           // and time spent on each job
});

// The fields that are *this body* rather than what it is doing this second.
// Everything else is rebuilt by the factory for whatever job it is on.
// ...and what is in its hands. A load is not "what it is doing this second": it
// is dust the yard has already dug and lifted, and a save that dropped it threw
// it away -- fifteen carters' worth of it, on every reload. What the player saw
// was the yard standing about: everybody empty-handed at once, with a floor that
// had already been swept, so there was nothing to fetch until the rock gave up
// something new. That is the reported stall, and the dust was gone as well.
// ...and what it was in the middle of. `goal` is the yard's own word for that
// -- the steppers set it and read it every frame -- and without it every body
// came back rebuilt as `goal: 'to'`, which means "walk to your station" even to
// somebody already standing on the floor of the cut. A quarrier so restored
// walked to the head of the ladder and climbed back down a hole it was already
// in before it could swing again.
//
// Safe because a goal names a *state*, not a plan somebody has to remember: the
// claims that go with one -- a column of dust, a patch of muck, a seat in the
// cut -- are worked out fresh every frame and are deliberately not saved, and
// every stepper already copes with finding them gone, because a body can lose a
// claim mid-play.
// ...and which job it owes its way back to, if it was borrowed for a build.
//
// A loan is a body and it is saved with the body. It used to be a list of job
// names on its own (`S.lent`), saved while the flag on the body was not -- so a
// yard reloaded mid-build came back owing a debt that no worker in it was
// carrying, and the two could only ever drift further apart. See `rebalance` in
// upgrades.js.
export const KEEPS = ['name', 'lived', 'mined', 'quarried', 'farmed', 'stored',
                      'at', 'trained', 'kitOf', 'x', 'y',
                      'carry', 'load', 'hasCore', 'goal', 'lentFrom'];

// Live doses are kept too, and they are the one thing on a body that cannot be
// written down as they stand. A dose's `until` is a moment on the clock, and the
// clock starts again when the page does -- so a dose saved as "until 94,000"
// comes back either already spent or good for another minute and a half,
// depending on how long you were gone. What is true either way is how much of it
// is *left*, so that is what is written, and the moment it runs out is worked
// out again on the way back in.
//
// It is out here rather than in KEEPS because KEEPS is a straight copy, and this
// is the one field that has to be turned round on both journeys.
const doseKeep = w => (w.doses || [])
  .filter(d => d.until > now())
  .map(d => ({ tonic: d.tonic, left: Math.round(d.until - now()) }));

export function keepOf(w) {
  const out = { type: w.type };
  for (const k of KEEPS) if (w[k] != null) out[k] = w[k];
  const doses = doseKeep(w);
  if (doses.length) out.doses = doses;
  return out;
}

// and back again, on to a body the factory has just made
export function wearRecord(w, from) {
  for (const k of KEEPS) if (from[k] != null) w[k] = from[k];
  // A save written before tonics stacked has one `dose` rather than a list of
  // them; it is read as a list of one. Either way a dose with no `left` on it is
  // older still -- it was written as a moment on a clock that has since started
  // again -- and it is not worth guessing what that moment meant, so a body
  // carrying one comes back sober.
  const had = from.doses || (from.dose ? [from.dose] : []);
  const on = had.filter(d => d && d.left > 0)
                .map(d => ({ tonic: d.tonic, until: now() + d.left }));
  if (on.length) w.doses = on;
  if (!w.at) w.at = {};
  return w;
}

// Not in the yard: at home behind its own front door, through the lab's or the
// scrubbing house's, or up in the balloon. One list, because two things ask it
// -- the celebration (a body that is not here cannot dance in it) and the loo
// clock below -- and a second copy of it is a second copy to keep in step.
//
// ...and off the ground on the cursor, which is the same fact by a different
// road. A body you have picked up is not at work: it is in the air, then it is
// falling, then it is standing where it landed seeing stars, and it does not
// mine, carry or shovel through any of it. The loo clock is an hour of *work*
// (see below), and it went on running through all three -- so carrying somebody
// across the yard and putting them down made them overdue on the spot, which is
// exactly the bug that was just fixed for a body asleep behind its own door,
// arriving by a road that fix did not cover.
export const outOfYard = w =>
  !!(w.inside || w.aloft || indoors(w) || inHouse(w) ||
     w.lifted || w.falling || w.dizzyUntil);

// one frame of getting older, and of being somewhere
export function stepRecords(dt) {
  for (const w of S.workers) {
    if (w.lived == null) Object.assign(w, newRecord());
    w.lived += dt;
    // The loo clock is an hour of WORK, not an hour of the world.
    //
    // It is a deadline -- a moment on the clock -- and it went on sliding into
    // the past while a body was asleep at home, so it was overdue the instant
    // the body stepped back out. A shift that knocked off together came back
    // together and every one of them went on the doorstep, which is what got
    // reported: they all poop when they come out of the house.
    //
    // Held rather than re-armed: what a body has already waited still counts,
    // so somebody who was nearly due when it went in is nearly due when it
    // comes out -- it simply does not owe for the hours it spent indoors.
    if (w.looAt && outOfYard(w)) w.looAt += dt;
    const job = JOB_OF[w.type];
    w.at[job] = (w.at[job] || 0) + dt;
  }
}

// where it has spent most of its time, which is what it would say it does
export function mainlyAt(w) {
  let best = null, most = 0;
  for (const [job, ms] of Object.entries(w.at || {})) if (ms > most) { most = ms; best = job; }
  return best;
}
