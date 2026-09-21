// Who a body is: its name, its age and the record of what it has done. None of
// it feeds a rate; it is so the four on the rock are four people rather than
// the number four.

import { S, quarry } from '../state.js';
import { P, WORKER } from '../config.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';
import { inHouse } from '../scrubhouse.js';
import { JOB_OF } from '../levels.js';
import { TYPE } from '../jobs.js';
import { FACTORY } from './jobs.js';
import { syncWorkers } from './muster.js';
import { resite, overCutMouth } from '../world.js';
import { cutTop } from '../quarry.js';
import { rebalance } from '../staffing.js';
import { busyBuilderSites } from '../works.js';
import { hushNotices } from '../notices.js';

// --- who they are --------------------------------------------------------------
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

// The fields that are *this body* and what it is in the middle of; everything
// else is rebuilt by the factory. A load is dust already dug, and a save that
// drops it throws it away. `goal` names a state, not a plan: the claims that
// go with one are re-picked every frame and deliberately not saved, and a
// body rebuilt as `goal: 'to'` on the floor of the cut climbs out and back
// down. `lentFrom` is the loan, saved with the body it is on (`rebalance` in
// upgrades.js).
export const KEEPS = ['name', 'lived', 'mined', 'quarried', 'farmed', 'stored', 'tidied',
                      'at', 'trained', 'kitOf', 'x', 'y',
                      'carry', 'load', 'hasCore', 'goal', 'lentFrom',
                      // the doses in a stirrer's arms, or a stirrer saved on a
                      // round comes back with `goal: 'out'` and empty hands
                      'holding', 'carryTonic',
                      // the room a carter booked in the hole and how much it
                      // took: the hole's book is the sum over the bodies
                      'booked', 'took',
                      // mid-arc, or a body comes back at its saved height and
                      // is stood on the ground in one frame
                      'falling', 'vx', 'vy',
                      // how fast it is strolling (`amble`): dropped, a body
                      // back from a refresh mid-stroll sets off from a standstill
                      'pace',
                      // behind a door, or it comes back on the doorstep
                      'inside',
                      // in the air on its own account, or a wizard saved aloft
                      // falls and starts the climb again on every refresh
                      'aloft', 'floating', 'brolly', 'spot',
                      // which craft it is aboard, and the berth a purifier was
                      // dealt, which puts it back in the same basket
                      'craft', 'berth',
                      // the plot a farmhand is working, or the far end of a
                      // long row is never reached between refreshes
                      'plot',
                      // the commute it is on (crew/commute.js), or a body
                      // sent for a hat comes back without one
                      'walking', 'walkTo', 'leg', 'legs', 'wanting', 'fetching', 'fromHome',
                      // the dance it is in the middle of, so a refresh mid-hop
                      // lands the hop (`moveAt` is a moment, below)
                      'jigAt', 'jigDir', 'jigRate', 'jigBeat', 'jigDown', 'move', 'moveFrom', 'moveBeats', 'foot', 'footAt',
                      // the mess it is on and where it planted its shovel, or
                      // a janitor against a fouling crew never wins
                      'muckAt', 'shovelAt'];

// Moments on a body's clock, kept as how far off they are because the clock
// starts again with the page: written as `field - now()`, read back the
// reverse. The work's own clocks are in here too, or every refresh hands
// every body a free swing.
const MOMENTS = ['brkAt', 'idleSince', 'looAt',
                 'next', 'swingAt', 'stoopAt', 'quarryAt', 'tidyNext', 'moveAt', 'jigOn', 'sweepAt', 'propAt'];
const momentsOf = w => {
  const out = {};
  for (const k of MOMENTS) if (Number.isFinite(w[k]) && w[k] > 0) out[k] = Math.round(w[k] - now());
  return out;
};

// Live doses, written as how much is *left* rather than `until`, for the same
// reason as the moments. Out here rather than in KEEPS because KEEPS is a
// straight copy and this has to be turned round on both journeys.
const doseKeep = w => (w.doses || [])
  .filter(d => d.until > now())
  .map(d => ({ tonic: d.tonic, left: Math.round(d.until - now()) }));

export function keepOf(w) {
  const out = { type: w.type };
  for (const k of KEEPS) if (w[k] != null) out[k] = w[k];
  const doses = doseKeep(w);
  if (doses.length) out.doses = doses;
  const moments = momentsOf(w);
  if (Object.keys(moments).length) out.moments = moments;
  return out;
}

// and back again, on to a body the factory has just made
export function wearRecord(w, from) {
  const hasGoal = 'goal' in w;
  for (const k of KEEPS) if (from[k] != null) w[k] = from[k];
  // A goal is only worn by a body whose job has one: the factory's `w` carries
  // the job's own starting goal, and a saved word the job has no stepper for
  // would ride along unread for ever.
  if (!hasGoal) delete w.goal;
  // An old save has one `dose` rather than a list; older still, a dose with no
  // `left` was written as a moment on a clock since restarted, and the body
  // comes back sober.
  const had = from.doses || (from.dose ? [from.dose] : []);
  const on = had.filter(d => d && d.left > 0)
                .map(d => ({ tonic: d.tonic, until: now() + d.left }));
  if (on.length) w.doses = on;
  // and its moments, the same way round: what was written is how far off
  if (from.moments) for (const k of MOMENTS) if (Number.isFinite(from.moments[k])) w[k] = now() + from.moments[k];
  if (!w.at) w.at = {};
  return w;
}

// The crew, put back. Each body is made by its own factory, so it has every
// field its job expects whatever has changed since the save, and then handed
// back the things that are *it* rather than its job.
function restoreCrew(who, mouth = null) {
  // Whether the ground under the crew is the ground they were saved on, and
  // if the cut has moved, by how much: the yard re-walks when a station grows
  // (DRAWN_W in world.js), and a save carries every body at its old x.
  const sameGround = mouth != null && mouth === quarry.x;
  const cutShift = mouth != null && S.quarryOpen ? quarry.x - mouth : 0;
  S.workers = [];
  if (!Array.isArray(who)) return;
  for (const k of who) {
    if (!k.type) continue;
    const made = FACTORY(k.type);
    if (!made.type) continue;                  // a trade this build does not have
    let rec = k;
    // A body down in the cut when the cut moved goes with the cut, or it
    // comes back in solid ground with no working under it (verify.js rule 1).
    // A body at ground height over the mouth on a layout that moved stands at
    // the near edge instead; at ground height exactly, because a carter on
    // the bridge deck is over the mouth too and belongs there. A quarrier at
    // work stands on the cut's floor under its own x, or it walks the whole
    // top of the cut and climbs down again on every refresh. None of it on
    // the same layout: a body over the mouth then is at the head of the
    // ladder mid-stride, and moving it hops it back on every refresh.
    if (cutShift && Number.isFinite(rec.x) && Number.isFinite(rec.y)
        && rec.y + WORKER > S.groundY + 1
        && rec.x + WORKER > mouth && rec.x < mouth + quarry.w) {
      rec = { ...rec, x: rec.x + cutShift };
    }
    if (!sameGround && Number.isFinite(rec.x) && overCutMouth(rec.x)
        && (!Number.isFinite(rec.y) || Math.abs(rec.y + WORKER - S.groundY) <= 1)) {
      if (k.type === TYPE.QUARRY && rec.goal === 'work') {
        rec = { ...rec, y: cutTop(rec.x + WORKER / 2) - WORKER };
      } else {
        const nearSide = rec.x + WORKER / 2 < quarry.x + quarry.w / 2;
        rec = { ...rec, x: nearSide ? quarry.x - WORKER - P : quarry.x + quarry.w + P };
      }
    }
    S.workers.push(wearRecord(Object.assign(made, newRecord()), rec));
  }
}

// The crew, on the save (persist.js, `SAVERS`): the crew itself, not just
// how many of them there are. A body has a name and a record, and rebuilding
// the yard from four counts would hand you back four strangers standing
// where your crew was.
export const SAVE = {
  fields: ['workers', 'mouth'],
  write(out) {
    out.who = S.workers.map(keepOf);
    // Where the mouth of the cut was under them, so a load can tell a
    // layout that moved from one that did not (`restoreCrew`).
    out.mouth = S.quarryOpen ? quarry.x : null;
  },
  read(s) {
    resite();                    // the quarry is as deep and the plot as wide as it was
    restoreCrew(s.who, Number.isFinite(s.mouth) ? s.mouth : null);
    // A body written down is a body in the yard: a save can carry the
    // headcount and the list disagreeing (the fixture in `test/fixtures`
    // does), and `syncWorkers` stands down anybody the deal has no room
    // for, so the count gives way to the list. The deal is done again when
    // it does, because `rebalance` is where `S.haulers` comes from.
    if (S.workers.length > S.crew) { S.crew = S.workers.length; rebalance(); }
    syncWorkers();               // and anybody the counts say is missing
    hushNotices();               // what this save already earned is on the sheet, not in the air
    // A site with no gang of its own that was busy when the tab shut needs
    // its builders sent again: only a build starting turns spare hands into
    // builders, and a reload is not one. Only when there is a busy site,
    // because a second `rebalance` over a roster whose numbers never quite
    // add up is a place a body can be lost.
    if (busyBuilderSites().length) { rebalance(); syncWorkers(); }
  },
  // The crew walks out by the counts (`syncWorkers`), which a reset does
  // itself once every count is nought.
  blank() { S.crew = 0; }
};

// Not in the yard: behind a door, up in the balloon, or on the cursor and
// what follows it (in the air, falling, seeing stars). One list, asked by the
// celebration and by the loo clock below.
export const outOfYard = w =>
  !!(w.inside || w.aloft || inHouse(w) ||
     w.lifted || w.falling || w.dizzyUntil);

// one frame of getting older, and of being somewhere
export function stepRecords(dt) {
  for (const w of S.workers) {
    if (w.lived == null) Object.assign(w, newRecord());
    w.lived += dt;
    // The loo clock is an hour of WORK, not of the world: a deadline that
    // slides into the past while a body is asleep at home has the whole shift
    // go on the doorstep on the way out. Held rather than re-armed, so what
    // it has already waited still counts.
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
