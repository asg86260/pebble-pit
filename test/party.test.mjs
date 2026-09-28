// The party (docs/wave-party.md, "Checks"): after the snatch the first
// station is free, built by a delver, and the sqwife swims to it; a fang drops
// at a phase break, sinks, is carried to the crusher, and buys the next
// station, whose fighter is a pod resident who swims there; four stations is
// the most. The snatch and the deep's spare hands are set up with the hooks,
// because they are not what these checks are about. Lines marked
// `// until merge` stand in for another track's piece (the floating build
// button is BOARD's, the rails too) and go the player's way at integration.
import { group, ok, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, FIRST_KINDS, FIGHT_STATIONS_MAX, SERPENT_WOUND, FANG_BREAKS } from '../src/config.js';
import { belowYard } from '../src/route.js';
import { deepPost } from '../src/crew/deep.js';
import { buildStation, canBuild, kindsOffered, stationById, fighterAt, buyRung, resetStation,
         classesOpen } from '../src/deep/party.js';

const her = () => S.workers.find(w => belowYard(w));
const atPost = w => !!w && !w.walking && Math.abs(w.x - deepPost(w.type, w)) < 1;

// Frame by frame until `until` holds: the furthest the body named moved in a
// frame, what it was on the way, and whether it got there.
function follow(name, until, limit = 60 * 240) {
  let jump = 0, at = null;
  const types = new Set();
  for (let f = 0; f < limit; f++) {
    const w = S.workers.find(o => o.name === name);
    if (!w) return { lost: true, jump, types: [...types] };
    types.add(w.type);
    if (at) jump = Math.max(jump, Math.hypot(w.x - at.x, w.y - at.y));
    at = { x: w.x, y: w.y };
    if (until(w)) return { there: true, jump, types: [...types] };
    run(1 / 60);
  }
  return { there: false, jump, types: [...types] };
}

// A yard past the snatch, the sqwife down there on no station.
function afterSnatch() {
  window.__crew(0, 3);
  window.__snatch({ played: true });
  runUntil(() => her() && !her().falling, 30);
}

// The serpent's defense broken the way the fight breaks it: the wound held
// at the stage's depth, and the serpent's own step turning the stage.
const breakPhase = () => window.__serpent({ wound: SERPENT_WOUND[S.serpentStage] });

group('after the snatch the first station is free, a delver builds it and the sqwife swims there', async () => {
  afterSnatch();
  const offered = kindsOffered();
  const could = canBuild();                          // until merge: the floating button showing
  const name = her().name;
  const built = buildStation('altar');               // until merge: the button's pick
  const st = S.stations[0];
  const second = buildStation('armory');
  const trip = follow(name, w => stationById('s1')?.built && w.type === 'fighter' && atPost(w));
  const w = S.workers.find(o => o.name === name);
  return [
    ok(JSON.stringify(offered) === JSON.stringify(FIRST_KINDS) && could,
       'the button offers the three starting kinds', JSON.stringify(offered)),
    ok(built && st && st.kind === 'altar' && !st.built && S.fangs === 0, 'one is picked, and it costs nothing',
       JSON.stringify(st)),
    ok(!second && S.stations.length === 1, 'and with no fang held, nothing else can be built'),
    ok(trip.types.includes('delver'), 'she puts it up herself, as a delver', trip.types.join()),
    ok(trip.there && S.stationsBuilt === 1, 'it stands, and she swims to it as its fighter', JSON.stringify(trip)),
    ok(trip.jump < WORKER, 'a stroke at a time, never a jump', `${trip.jump.toFixed(1)}px`),
    ok(w && fighterAt(stationById('s1')) === w && w.station === 's1' && belowYard(w),
       'and she is the one the station names')
  ];
});

group('a fang drops at a break, sinks, is carried to the crusher, and buys the next station', async () => {
  afterSnatch();
  buildStation('altar');                             // until merge: the button's pick
  window.__finish();
  run(3);
  window.__deepCrew({ spare: 1 });                   // a pod resident, gathering
  run(3);
  breakPhase();
  run(1 / 60);
  const dropped = { n: S.fangsLoose.length, stage: S.serpentStage, once: S.fangsDropped };
  const y0 = S.fangsLoose[0]?.y;
  let rested = false, held = false, carrier = null;
  for (let f = 0; f < 60 * 120 && !(S.fangs > 0); f++) {
    run(1 / 60);
    const g = S.fangsLoose[0];
    if (g?.rest) rested = true;
    if (g?.held) { held = true; carrier = S.workers.find(w => w.name === g.by)?.type; }
  }
  const counted = { fangs: S.fangs, seen: S.seenFang, loose: S.fangsLoose.length };
  const button = canBuild() && kindsOffered().length === 5;  // until merge: the button, drawn with the fang's mark
  const resident = S.workers.find(w => w.type === 'gatherer')?.name;
  const bought = buildStation('well');               // until merge: the button's pick
  const spent = S.fangs;
  const trip = follow(resident, w => stationById('s2')?.built && w.type === 'fighter' && atPost(w));
  return [
    ok(dropped.stage === 1 && dropped.n === 1 && dropped.once === 1, 'the break drops one fang',
       JSON.stringify(dropped)),
    ok(rested, 'it sinks to the floor', `from ${Math.round(y0)}`),
    ok(held && carrier === 'gatherer', 'a gatherer picks it up', `${carrier}`),
    ok(counted.fangs === 1 && counted.seen && counted.loose === 0, 'and carries it to the crusher, where it counts',
       JSON.stringify(counted)),
    ok(button, 'with a fang held, the button offers every kind'),
    ok(bought && spent === 0, 'the fang buys the next station', `fangs ${spent}`),
    ok(trip.types.includes('delver') && trip.there, 'a delver builds it, and the pod resident swims there as its fighter',
       JSON.stringify(trip)),
    ok(trip.jump < WORKER, 'a stroke at a time', `${trip.jump.toFixed(1)}px`)
  ];
});

group('a break drops its fang once, across a reload', async () => {
  afterSnatch();
  breakPhase();
  run(1 / 60);
  const one = S.fangsLoose.length;
  window.__reload();
  run(2);
  return [
    ok(one === 1 && S.fangsDropped === 1, 'the break dropped one', `${one}`),
    ok(S.fangsLoose.length === 1 && S.fangsDropped === 1, 'and the reload drops no second',
       `${S.fangsLoose.length} loose, ${S.fangsDropped} dropped`),
    ok(FANG_BREAKS === 3, 'only the first three breaks drop one')
  ];
});

group('four stations is the most; a station with nobody spare stands empty until one is', async () => {
  afterSnatch();
  buildStation('spire');                             // until merge: the button's pick
  window.__finish();
  run(3);
  S.fangs = 5;                                       // until merge: three breaks' fangs, and more
  const built = ['altar', 'circle', 'well'].map(k => { const b = buildStation(k); window.__finish(); return b; });
  const fifth = buildStation('armory');
  run(3);
  const manned = S.stations.filter(st => st.fighter).length;
  window.__deepCrew({ spare: 1 });                   // a pod resident comes free
  runUntil(() => S.workers.filter(w => w.type === 'fighter' && atPost(w)).length === 2, 60);
  const fighters = S.workers.filter(w => w.type === 'fighter');
  return [
    ok(built.every(Boolean) && S.stations.length === FIGHT_STATIONS_MAX, 'three fangs build three more',
       `${S.stations.length} stations`),
    ok(!fifth && !canBuild() && S.fangs === 2, 'and a fifth cannot be built, fang or no fang', `fangs ${S.fangs}`),
    ok(manned === 1, 'with only her down there, one station is manned', `${manned}`),
    ok(fighters.length === 2 && new Set(fighters.map(w => w.station)).size === 2,
       'the next hand free goes to an empty one', fighters.map(w => w.station).join()),
    ok(S.stations.find(st => st.id === 's2').fighter, 'the oldest empty station first')
  ];
});

group("a station's ladder commits its class on the first rung, and Reset hands it back", async () => {
  afterSnatch();
  buildStation('altar');                             // until merge: the button's pick
  window.__finish();
  run(3);
  const open = classesOpen('altar');
  const locked = buyRung('s1', 'sword', [['scale', 5]]);
  const first = buyRung('s1', 'brawler', [['scale', 5]]);   // until merge: the rails' Buy
  const other = buyRung('s1', 'ranger', [['scale', 5]]);
  buyRung('s1', 'brawler', [['scale', 7], ['dust', 3]]);
  const st = stationById('s1');
  const kept = { cls: st.cls, rung: st.rung, paid: JSON.stringify(st.paid) };
  const sinking = S.sinking.length;
  const fighter = st.fighter;
  resetStation('s1');                                // until merge: the rails' Reset
  return [
    ok(JSON.stringify(open) === '["brawler"]' && !locked, 'before a second station, the altar opens only the Brawler'),
    ok(first && !other, 'the first rung commits the class'),
    ok(kept.cls === 'brawler' && kept.rung === 2 && kept.paid === '[["scale",12],["dust",3]]',
       'and the station keeps what was paid there', JSON.stringify(kept)),
    ok(st.rung === 0 && st.cls === null && st.paid.length === 0, 'Reset blanks it'),
    ok(S.sinking.length - sinking === 12, 'the scales go back into the water', `${S.sinking.length - sinking}`),
    ok(st.fighter === fighter && fighter, 'and the fighter stays, a base fighter')
  ];
});
