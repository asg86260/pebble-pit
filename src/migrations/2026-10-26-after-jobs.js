// Act 3 had several jobs a station once, then bought posts a job; it has one
// job a station now (DESIGN.md, "Act 3: one job a station"). A save from
// either shape is brought to today's here, on the raw object, so the act's
// reader (after/index.js) reads one shape and nothing else.
//
// A save from when a station's jobs were posts bought (`posts`, by job): the
// agitators' posts are gone, every agitator standing at the podium idle as
// any member with no job; each other job's posts become what its roster
// wants, filled from the members the save has as far as they go, in the
// rosters' order, the rest idle; and a job's posts past its one seat become
// seats bought, so nothing paid for is lost.
//
// A save from when a station had several jobs: a folded job's seats go to
// its station's one, the larger kept, and its crew too, as far as those
// seats go; its bodies take that job, a gatherer's log still the one walked
// to and a carrier or a paster with anything in hand out on its round until
// it is empty.
import { AFTER_SEAT_BILLS } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { seatKey as seat } from '../after/levels.js';

// The jobs as they stood the day this was written, spelled out here: the
// chipper, the paper mill and the press were cut after it (the next
// migration, 2026-10-26-cut-paper.js, carries their jobs to the saw mill's).
const AFTER_JOBS = ['woodcutter', 'sawyer', 'feeder', 'pulper', 'joiner', 'printer'];
// The jobs folded away, each into its station's one.
const AFTER_JOB_FOLD = { gatherer: 'woodcutter', hauler: 'woodcutter', carrier: 'joiner', paster: 'printer' };

function fromPosts(a, posts) {
  a.ups ||= {}; a.crew = {}; a.bodies ||= [];
  let left = (a.camp | 0) + a.bodies.filter(b => b.state === 'work' && b.pair == null).length;
  for (const job of AFTER_JOBS) {
    const bought = Math.max(0, Math.floor(posts[job] || 0));
    if (bought > 1) a.ups[seat(job)] = Math.min(AFTER_SEAT_BILLS.length, Math.max(a.ups[seat(job)] || 0, bought - 1));
    const n = Math.min(bought, left);
    if (n > 0) { a.crew[job] = n; left -= n; }
  }
  for (const b of a.bodies) {
    if (b.job != null && b.job !== AFTER_JOB.BUILD && !AFTER_JOBS.includes(b.job)) b.job = null;
    // A body at its post in the old save has got there.
    if (b.job && b.state === 'work') b.on = true;
  }
}

function foldJobs(a) {
  const ups = a.ups && typeof a.ups === 'object' ? a.ups : null;
  const crew = a.crew && typeof a.crew === 'object' ? a.crew : null;
  for (const [from, to] of Object.entries(AFTER_JOB_FOLD)) {
    const seats = ups && ups[seat(from)];
    if (seats != null) { ups[seat(to)] = Math.max(ups[seat(to)] || 0, seats); delete ups[seat(from)]; }
    if (!crew || !crew[from]) continue;
    crew[to] = Math.min(1 + Math.min(AFTER_SEAT_BILLS.length, (ups && ups[seat(to)]) || 0), (crew[to] || 0) + crew[from]);
    delete crew[from];
  }
  for (const b of Array.isArray(a.bodies) ? a.bodies : []) {
    const to = AFTER_JOB_FOLD[b.job];
    if (!to) continue;
    if (b.job === AFTER_JOB.GATHER) { b.log = b.target; b.target = null; }
    else if (b.job === AFTER_JOB.HAUL) { b.to = b.load ? 'pile' : null; b.target = null; }
    else b.out = !!(b.load || b.pick || b.target != null);
    b.job = to;
  }
}

export default {
  since: '2026-10-26',
  v: 28,
  says: 'act 3\'s older job shapes (posts bought, several jobs a station) become one job a station',
  apply(s) {
    const a = s.after;
    if (!a || typeof a !== 'object') return;
    // Posts were read after the fold, over a blank that had a crew: the
    // old shape is the one with no `crew` of its own.
    const old = !a.crew && a.posts && typeof a.posts === 'object' ? a.posts : null;
    foldJobs(a);
    if (old) fromPosts(a, old);
  }
};
