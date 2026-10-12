// The deep's hands are its own crew (DESIGN.md, "Two crews and a portal"),
// and a fighter is a manned station (docs/wave-party.md): one a station,
// staying at the one it first swims to, with no counter under it, and nobody
// from the yard is ever sent. The deep itself (the pit
// drowned, the snatch behind it) and the stations standing are set up with
// the hooks, because they are not what these checks are about; a station is
// bought off the floating build button.
import { group, ok, state, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { P, WORKER } from '../src/config.js';
import { belowYard } from '../src/route.js';
import { deepPost } from '../src/crew/deep.js';
import { stationById } from '../src/deep/party.js';
import { pressBuild } from './party-press.mjs';

const post = key => state().roster.find(p => p.key === key);
const fighters = () => S.workers.filter(w => w.type === 'fighter');
const atPost = w => !!w && !w.walking && Math.abs(w.x - deepPost(w.type, w)) < 1;

// Past the snatch, with `n` stations standing (the fangs for all but the
// first handed over) and `spare` more of the deep's own hands.
function stations(kinds, spare = 0) {
  window.__crew(0, 3);
  window.__snatch({ played: true });
  if (spare) window.__deepCrew({ spare });
  window.__party({ fangs: kinds.length - 1 });      // the breaks' fangs
  for (const k of kinds) { pressBuild(k); window.__finish(); }
  run(1);
}

group('a station that stands has no counter under it', async () => {
  stations(['armory', 'circle']);
  runUntil(() => fighters().length === 1 && atPost(fighters()[0]), 60);
  return [
    ok(!state().roster.some(p => p.job === 'fighters' || /^station:/.test(p.key)),
       'no post for the stations in the deep', JSON.stringify(state().roster.map(p => p.key))),
    ok(fighters()[0].station === 's1' && !!stationById('s1').fighter, 'and her station still names her')
  ];
});

group('one fighter a station: the bodies are the stations manned', async () => {
  stations(['altar', 'armory', 'spire'], 5);
  runUntil(() => fighters().every(atPost), 60);
  const manned = S.stations.filter(st => st.fighter).length;
  const bodies = fighters();
  const each = new Set(bodies.map(w => w.station));
  return [
    ok(manned === 3 && bodies.length === 3, 'three stations, three fighters', `${manned} manned, ${bodies.length} bodies`),
    ok(each.size === 3 && bodies.every(w => stationById(w.station)?.fighter === w.uid),
       'one at each, the one its station names'),
    ok(S.workers.filter(w => w.type === 'gatherer').length === 3, 'and the rest of the deep gathers',
       `${S.workers.filter(w => w.type === 'gatherer').length}`)
  ];
});

group('a reload with fighters in the deep brings them back at their stations', async () => {
  stations(['altar', 'armory'], 1);
  runUntil(() => fighters().length === 2 && fighters().every(atPost), 60);
  const before = fighters().map(w => ({ name: w.name, x: w.x, y: w.y, station: w.station }));
  window.__cold();
  run(1 / 60);
  const after = before.map(b => S.workers.find(w => w.name === b.name));
  return [
    ok(before.length === 2 && before.every(b => b.y + WORKER > S.groundY + WORKER),
       'two fighters stand in the deep', JSON.stringify(before)),
    ok(after.every((w, i) => w && w.type === 'fighter' && belowYard(w) && w.station === before[i].station
                   && Math.abs(w.x - before[i].x) <= P && Math.abs(w.y - before[i].y) <= P),
       'and come back where they stood, each at its own station',
       JSON.stringify(after.map(w => w && [w.type, w.station, w.x, w.y])))
  ];
});
