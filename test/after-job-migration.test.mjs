// Act 3's older job shapes are brought to today's on the raw save, by a
// migration (src/migrations/2026-10-26-after-jobs.js), not by the act's reader:
// a station's several jobs fold into its one, and a save from when jobs were
// posts bought becomes the rosters' counts and seats. Read back, the act is
// whole and the old jobs are gone.
import { group, ok, yard } from './helpers.mjs';
import { migrate } from '../src/migrations/index.js';
import { AFTER_JOB } from '../src/jobs.js';
import { blankAfter } from '../src/after/index.js';
import { storeChecks } from './helpers.mjs';
storeChecks();

const KEY = 'boulder-clicker/v4';
const S = yard.S;

const rawWith = after => {
  window.__reset(true);
  yard.persist();
  const s = JSON.parse(localStorage.getItem(KEY));
  s.saveV = 27;
  s.after = { ...JSON.parse(JSON.stringify(blankAfter())), ...after };
  return s;
};

group('a save with folded jobs is migrated: seats, crew and bodies take their station\'s job', async () => {
  const s = rawWith({
    ups: { 'after-seat-gatherer': 2, 'after-seat-woodcutter': 1, 'after-seat-carrier': 1 },
    crew: { woodcutter: 1, gatherer: 1, hauler: 1, carrier: 1 },
    bodies: [
      { id: 1, job: AFTER_JOB.GATHER, target: 4, state: 'work' },
      { id: 2, job: AFTER_JOB.HAUL, load: 'logs', target: 2, state: 'work' },
      { id: 3, job: AFTER_JOB.CARRY, load: 'sign', state: 'work' }
    ]
  });
  const ran = migrate(s);
  const a = s.after;
  return [
    ok(ran.some(m => m.since === '2026-10-26'), 'the migration ran'),
    ok(a.ups['after-seat-woodcutter'] === 2 && !('after-seat-gatherer' in a.ups), 'the larger seats kept on the station\'s job', JSON.stringify(a.ups)),
    ok(a.ups['after-seat-joiner'] === 1 && !('after-seat-carrier' in a.ups), 'a carrier\'s seat is the joiner\'s', JSON.stringify(a.ups)),
    ok(!('gatherer' in a.crew) && !('hauler' in a.crew) && a.crew.woodcutter >= 1, 'the crew follow', JSON.stringify(a.crew)),
    ok(a.bodies[0].job === AFTER_JOB.CUT && a.bodies[0].log === 4, 'the gatherer is a woodcutter with its log', JSON.stringify(a.bodies[0])),
    ok(a.bodies[1].job === AFTER_JOB.CUT && a.bodies[1].to === 'pile', 'the hauler too, its load to the pile', JSON.stringify(a.bodies[1])),
    ok(a.bodies[2].job === AFTER_JOB.JOIN && a.bodies[2].out === true, 'the carrier a joiner out on its round', JSON.stringify(a.bodies[2]))
  ];
});

group('a save from when jobs were posts bought is read as rosters and seats, and loads', async () => {
  const s = rawWith({ camp: 4, posts: { woodcutter: 3, sawyer: 1 } });
  delete s.after.crew;
  migrate(s);
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const a = S.after;
  return [
    ok(a && a.crew.woodcutter === 3 && a.crew.sawyer === 1, 'each job\'s posts are its roster\'s count', JSON.stringify(a && a.crew)),
    ok(a && a.ups['after-seat-woodcutter'] === 2, 'and the posts past the first are seats bought', JSON.stringify(a && a.ups)),
    ok(a && !('posts' in a), 'and the old field is not kept')
  ];
});
