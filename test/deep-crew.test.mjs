// The deep's hands are its own crew (DESIGN.md, "Two crews and a portal"),
// and a fighter is a manned station (docs/wave-party.md): each station that
// stands has a roster post of its own, keyed by its id, holding one fighter;
// its `-` sends that fighter to a station standing empty and its `+` fetches
// one over, and nobody from the yard is ever sent. The deep itself (the pit
// drowned, the snatch behind it) and the stations standing are set up with
// the hooks, because they are not what these checks are about; a station is
// bought off the floating build button.
import { group, ok, state, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { P, WORKER } from '../src/config.js';
import { rosterHit } from '../src/roster.js';
import { belowYard } from '../src/route.js';
import { deepPost } from '../src/crew/deep.js';
import { stationById } from '../src/deep/party.js';
import { pressBuild } from './party-press.mjs';

const post = key => state().roster.find(p => p.key === key);
const press = (key, which) => { const p = post(key); return !!p && rosterHit(p[which][0], p[which][1]); };
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

group('a post stands under each station once it stands, keyed by its id', async () => {
  window.__crew(0, 3);
  window.__snatch({ played: true });
  const before = state().roster.filter(p => p.job === 'fighters').length;
  pressBuild('altar');
  const rising = !!post('station:s1');
  window.__finish();
  run(1);
  const p = post('station:s1');
  return [
    ok(before === 0 && !rising, 'no post before a station stands', `${before}`),
    ok(p && p.station === 's1' && p.cap === 1, 'one under it once it does, holding one', JSON.stringify(p)),
    ok(!state().roster.some(p => ['altarjob', 'welljob', 'fontjob', 'circlejob', 'spirejob'].includes(p.key)),
       'and none of the old weapons\' posts')
  ];
});

group("- sends a station's fighter to one standing empty, + fetches it back, down there", async () => {
  stations(['altar', 'armory']);
  runUntil(() => fighters().length === 1 && atPost(fighters()[0]), 60);
  const yard = S.workers.filter(w => !belowYard(w)).map(w => w.name);
  const w = fighters()[0];
  const from = w.station;
  const on = { s1: post('station:s1').n, s2: post('station:s2').n };
  const noMore = press('station:s1', 'more') && stationById('s1').fighter && fighters().length === 1;
  const pressed = press('station:s1', 'less');
  const moved = { s1: !!stationById('s1').fighter, s2: !!stationById('s2').fighter, station: w.station };
  let jump = 0, at = { x: w.x, y: w.y };
  for (let f = 0; f < 60 * 60 && !atPost(S.workers.find(o => o.name === w.name)); f++) {
    run(1 / 60);
    const b = S.workers.find(o => o.name === w.name);
    jump = Math.max(jump, Math.hypot(b.x - at.x, b.y - at.y));
    at = { x: b.x, y: b.y };
  }
  const there = S.workers.find(o => o.name === w.name);
  const back = press('station:s1', 'more');
  runUntil(() => atPost(S.workers.find(o => o.name === w.name)), 60);
  const home = S.workers.find(o => o.name === w.name);
  return [
    ok(from === 's1' && on.s1 === 1 && on.s2 === 0, 'she is at the first station, the second stands empty',
       JSON.stringify(on)),
    ok(noMore, 'a manned station takes no second fighter'),
    ok(pressed && !moved.s1 && moved.s2 && moved.station === 's2', "the - sends her to the empty one",
       JSON.stringify(moved)),
    ok(atPost(there) && belowYard(there) && jump < WORKER, 'and she swims there, down there', `${jump.toFixed(1)}px`),
    ok(back && home.station === 's1' && atPost(home), 'the + fetches her back'),
    ok(fighters().length === 1 && S.deepCrew === 1, 'nobody was made or unmade', `${fighters().length} fighters`),
    ok(S.workers.filter(o => yard.includes(o.name)).every(o => !belowYard(o)), "and none of the yard's hands went down")
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
