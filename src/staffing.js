// The crew's counts: who is on what job, who is spare, and the two moves the
// player makes -- a hire and a body moved between jobs.
//
// Everything here writes `S.<job>` and then asks the crew to catch up
// (`syncWorkers`). It knows the works, because a build borrows a body, and it
// knows the levels, because a station holds so many. It does not know the
// board: a caller that changed the roster and wants the sheet to say so
// rebuilds the shop itself.

import { LADDER, GATHER_CAP, GATHER_PER, GATHER_KEEP, GATHER_LINGER_S } from './config.js';
import { S, deepBed } from './state.js';
import { JOB, TYPE, DEEP_JOBS } from './jobs.js';
import { TRADE_OF, JOB_OF } from './kit.js';
import { MACHINES, machine } from './machines.js';
import { syncWorkers } from './crew.js';
import { busyBuilderSites, siteX } from './works.js';
import { capOf, roomAt } from './levels.js';

// A job is a count, not a purchase: you buy a body once and move it freely.
// What a body is twice as good at is its hat, and the hat stays at the station
// (upgrades/rows-kit.js).
// The deep's five are on it like any other: a body sent down the shaft is a
// body off the spares (docs/wave-serpent.md).
export const JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.SCHOLAR, JOB.PURIFY, JOB.STIR, JOB.JANITOR, JOB.WIZARD,
                     ...DEEP_JOBS];

// Bodies on no job. They are the haulers. Builders are not subtracted here:
// the builder count is derived FROM the spares (`rebalance`), so subtracting
// it would take the same body off twice.
export const spareHands = () =>
  S.crew - JOBS.reduce((n, j) => n + S[j], 0);
export const idle = () => spareHands();

// Put a gang back where a machine displaced it. `rebalance` only clamps down,
// so a lever thrown off has to ask for its bodies back. It restores from
// whatever is idle and never conjures bodies. `want` of nought is the other
// direction: a machine switched on, and this only lets `rebalance` clamp.
export function restaff(job, want) {
  const room = Math.max(0, Math.min(want, capOf(job)) - S[job]);
  if (room > 0) S[job] += Math.min(room, Math.max(0, idle()));
  rebalance();
  syncWorkers();
}

// A station whose machine took its kit owns no hats. Zeroed here, the one
// place allowed to move counts about, and because a save can arrive with
// both a machine and a full set. `stepKit` walks any head still wearing one
// over to hand it in.
export function stripKit() {
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (!r || !r.bought || !r.tookKit) continue;
    const trade = TRADE_OF[m.job];
    if (trade && S[trade] > 0) { S[trade] = 0; }
  }
}

export function rebalance() {
  // A station cannot hold more bodies than places to stand; a save from a
  // wider plot can say otherwise, and the extras go back to carrying. Over
  // `JOBS`, not a hand-kept copy: the copy once left the rock off because its
  // cap was `Infinity`, and then the ram made it finite.
  for (const job of JOBS) S[job] = Math.min(S[job], capOf(job));
  // Hats are not clamped to bodies -- the kit belongs to the place.
  for (const job of Object.keys(TRADE_OF)) S[TRADE_OF[job]] = Math.max(0, S[TRADE_OF[job]]);
  for (const k of ['carryLevel', 'speedLevel', 'pickLevel', 'rockhandPickLevel', 'critMultLevel',
                   'rockhandSpeedLevel', 'haulCarryLevel', 'haulPaceLevel',
                   'tossSpeedLevel', 'tossReachLevel'])
    S[k] = Math.max(0, Math.min(LADDER, S[k] || 0));
  // Builders are derived, one a site, never the whole yard: a build that
  // swallowed every idle body would stop the dust moving.
  const sites = busyBuilderSites();
  const gang = sites.length;
  // Nobody spare: the body standing nearest the site is *lent* -- taken off
  // its count, which makes it spare -- and given back when nothing is left to
  // build. The loan rides on the body (`lentFrom`) rather than in a list
  // beside it, so a reload cannot come back owing a debt no body carries and
  // a repayment cannot land on top of a move the player made meanwhile.
  for (let short = sites.length - Math.max(0, spareHands()); short > 0; short--) {
    const w = nearestLendable(sites);
    if (!w) break;
    const job = JOB_OF[w.type];
    w.lentFrom = job;                    // stood down first, see syncWorkers
    S[job]--;
  }
  // Given back only if there is still room there and a body spare to be the
  // one going home; a count handed back that nobody stands behind is a roster
  // that reads higher than the crew for ever.
  if (!sites.length) {
    for (const w of S.workers) {
      const job = w.lentFrom;
      if (!job) continue;
      delete w.lentFrom;
      if (roomAt(job) > 0 && spareHands() > 0) S[job]++;
    }
  }
  S.lent = S.workers.filter(w => w.lentFrom).map(w => w.lentFrom);
  S.builders = sites.length ? Math.min(gang, Math.max(0, spareHands())) : 0;
  // The deep's gatherers are haulers too, lent down the shaft while scales lie
  // on its floor (DESIGN.md, "The crusher"), never the yard's last carrier.
  S.gatherers = Math.min(gatherTarget(), Math.max(0, spareHands() - S.builders - GATHER_KEEP));
  // Carrying is what a body does when it is on nothing, less whoever is
  // building or gathering. The carts are the lip's kit and are not held out.
  S.haulers = Math.max(0, spareHands() - S.builders - S.gatherers);
}

// How many haulers the deep wants: one for every GATHER_PER scales lying on
// its floor, up to GATHER_CAP; any still carrying a load until it is in; and
// the ones already down there until the floor has been bare GATHER_LINGER_S,
// so a gang is not sent up the shaft between two showers.
export function gatherTarget() {
  if (!S.snatched) return 0;
  const lying = deepBed.n || 0;
  const need = lying > 0 ? Math.min(GATHER_CAP, Math.ceil(lying / GATHER_PER)) : 0;
  const loaded = S.workers.filter(w => w.type === TYPE.GATHER && (w.carry || 0) > 0).length;
  const stay = (S.gatherBare || 0) < GATHER_LINGER_S ? S.gatherers : 0;
  return Math.max(need, loaded, stay);
}

// A frame of the lending: how long the floor has lain bare, and a new deal
// when the deep wants a different gang from the one it has.
export function stepGatherers(c) {
  S.gatherBare = deepBed.n ? 0 : (S.gatherBare || 0) + c.dt / 1000;
  const want = Math.min(gatherTarget(), Math.max(0, spareHands() - S.builders - GATHER_KEEP));
  if (want !== S.gatherers) { rebalance(); syncWorkers(); }
}

// The deal, on the save (persist.js, `SAVERS`). `read` is where the load's
// `rebalance` happens: after the machines, because a restored machine
// changes what its station's cap *is*, and before the crew is stood.
export const SAVE = {
  fields: [JOB.HAUL, 'lent'],
  write(out) {
    // Worked out again on the way in; written for a save arriving as a bug
    // report.
    out.haulers = S.haulers;
    out.lent = S.lent || [];
  },
  read(s) {
    rebalance();
    // Only jobs this build still has.
    S.lent = Array.isArray(s.lent) ? s.lent.filter(j => JOBS.includes(j)) : [];
  },
  blank() { S.haulers = 0; }
};

// The station body nearest any site that wants one and not already lent.
function nearestLendable(sites) {
  const xs = sites.map(siteX).filter(x => x != null);
  let best = null, dist = Infinity;
  for (const w of S.workers) {
    const job = JOB_OF[w.type];
    if (!job || !JOBS.includes(job) || w.lentFrom) continue;
    // Never one of the deep's: the yard's builds are the yard's, and a body
    // down the shaft is the furthest body there is from any of them.
    if (DEEP_JOBS.includes(job)) continue;
    if (S[job] < 1) continue;
    const d = xs.length ? Math.min(...xs.map(x => Math.abs(w.x - x))) : 0;
    if (d < dist) { dist = d; best = w; }
  }
  return best;
}

export function hire() {
  S.crew++;
  rebalance();
  syncWorkers();
}

// A loan taken off a job the player has just re-set is forgiven, not repaid:
// the roster shows the count with the loan already off it, so repaying on top
// of the press undoes what the player just did. `rebalance` borrows again
// against the new count if the build still needs somebody.
const forgive = job => { for (const w of S.workers) if (w.lentFrom === job) delete w.lentFrom; };

// Move one body on to a job, or off it and back to carrying. The hat it was
// wearing stays at the station.
export function assign(job, d) {
  if (d > 0 && idle() < 1) return;
  if (d > 0 && roomAt(job) < 1) return;
  if (d < 0 && S[job] < 1) return;
  S[job] += d;
  forgive(job);
  rebalance();
  syncWorkers();
}

// A place opens with one spare body sent over through the same `assign` the
// board's + button uses. `rebalance` first: a build with nobody spare borrows
// the nearest body off its station, and on the frame the door lands that body
// is still on loan, off its count, and reads as idle -- asked then, `assign`
// would hand the yard's one rockhand to the new place.
export function staffDoor(job) {
  rebalance();
  assign(job, 1);
}
