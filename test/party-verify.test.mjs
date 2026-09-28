// The party's rules (docs/wave-party.md, verify.js `verifyParty`): what can
// never be true of the stations and their fighters, however the party got
// there. Every group in this tier asks them after every frame; these groups
// stand each broken state up by hand and ask the rules alone, so each rule is
// seen to speak. `__party` seats a real fighter at each station; a body
// pushed in beside them is written as the rules read one (a type, a station,
// a uid, a place), because this file is about the rules and not about how a
// body is seated.

import { group, ok, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { verifyParty } from '../src/verify.js';
import { deepFloor, deepX0 } from '../src/deep/place.js';
import { fighterAt, CALLED } from '../src/deep/party.js';
import { FIGHT_STATIONS_MAX, WORKER } from '../src/config.js';

// Whether the rules throw, and what they say.
const broken = () => {
  try { verifyParty(); return ''; } catch (e) { return e.message; }
};

// A body on the deep's floor, or on the yard's ground.
const body = (station, where = 'deep') => ({
  type: 'fighter', name: 'tess', station, uid: 'u' + station,
  x: where === 'deep' ? deepX0() + 200 : 400,
  y: where === 'deep' ? deepFloor() - WORKER : S.groundY - WORKER
});
// Pushed for one question and taken off again, so the yard's own rules never
// meet a body its factory did not make.
const withBodies = (bodies, ask) => {
  const was = S.workers;
  S.workers = [...was, ...bodies];
  try { return ask(); } finally { S.workers = was; }
};

group('a party stood up the setup way keeps every rule', async () => {
  const got = window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 4 },
                                          { kind: 'spire', cls: 'bard', rung: 2 }], fangs: 1 });
  const fine = broken();
  const seated = S.stations.every(st => fighterAt(st) && fighterAt(st).station === st.id);
  return [
    ok(got.length === 2 && S.stations.every(st => st.built), 'two stations stand', JSON.stringify(got)),
    ok(new Set(got.map(st => st.slot)).size === 2, 'on two slots', JSON.stringify(got.map(st => st.slot))),
    ok(S.fangs === 1 && S.seenFang, 'and the fang asked for is held', `${S.fangs}`),
    ok(fine === '', 'the rules are quiet', fine),
    ok(seated, 'with a fighter at each', JSON.stringify(S.stations.map(st => st.fighter)))
  ];
});

group('more stations than the party holds is red', async () => {
  window.__party({ stations: [{ kind: 'altar' }] });
  const one = S.stations[0];
  for (let i = 1; i <= FIGHT_STATIONS_MAX; i++) S.stations.push({ ...one, id: 's' + (i + 1), slot: i });
  const said = broken();
  return [ok(/more stations stand than the party holds/.test(said), 'the rule speaks', said)];
});

group('one fighter a station, and one station a fighter', async () => {
  window.__party({ stations: [{ kind: 'altar' }, { kind: 'armory' }] });
  const [a, b] = S.stations;
  const was = [a.fighter, b.fighter];
  a.fighter = b.fighter = was[0];
  const shared = broken();
  b.fighter = 'u-nobody';
  const other = broken();
  b.fighter = CALLED;
  const called = broken();
  [a.fighter, b.fighter] = was;
  const two = withBodies([body(a.id)], broken);
  const twin = withBodies([{ ...body(b.id), uid: fighterAt(a).uid }], broken);
  return [
    ok(/one fighter is seated at two stations/.test(shared), 'a fighter named at two stations is red', shared),
    ok(/a fighter stands at a station that names another/.test(other), 'a fighter at a station naming another is red', other),
    ok(/a station is manned and nobody was sent to it/.test(called), 'a station left called at the end of a frame is red', called),
    ok(/two fighters stand at one station/.test(two), 'two fighters at one station are red', two),
    ok(/two bodies share a uid/.test(twin), 'and two bodies with one uid are red', twin)
  ];
});

group("a fighter's station exists and is built", async () => {
  window.__party({ stations: [{ kind: 'altar' }] });
  const st = S.stations[0];
  const nowhere = withBodies([body('s9')], broken);
  const was = st.fighter;
  st.built = false;
  st.fighter = null;
  const unbuilt = broken();
  st.fighter = was;
  const seatedEarly = broken();
  return [
    ok(/the station a fighter stands for does not exist/.test(nowhere), 'a fighter for no station is red', nowhere),
    ok(/the station a fighter stands for is not built/.test(unbuilt), 'a fighter at a station going up is red', unbuilt),
    ok(/a fighter is seated at a station still going up/.test(seatedEarly), 'and so is one seated there', seatedEarly)
  ];
});

group('no more fangs have dropped than the serpent has broken', async () => {
  window.__party({ stations: [{ kind: 'altar' }] });
  window.__serpent({ stage: 2 });
  S.fangsDropped = 2;
  const even = broken();
  S.fangsDropped = 3;
  const over = broken();
  // A fight set back by the setup hook takes its drops back with it.
  window.__serpent({ stage: 1 });
  return [
    ok(even === '', 'a fang a break is fine', even),
    ok(/more fangs have dropped than the serpent has had breaks/.test(over), 'a fang with no break is red', over),
    ok(S.fangsDropped === 1, 'and __serpent setting the fight back takes the drops back', `${S.fangsDropped}`)
  ];
});

group('no fighter in the yard', async () => {
  window.__party({ stations: [{ kind: 'altar' }] });
  const w = fighterAt(S.stations[0]), was = { x: w.x, y: w.y };
  w.x = 400; w.y = S.groundY - WORKER;
  const up = broken();
  w.lifted = true;
  const held = broken();
  delete w.lifted;
  Object.assign(w, was);
  return [
    ok(/a fighter is in the yard/.test(up), 'a fighter standing in the yard is red', up),
    ok(held === '', 'one in the hand is on its way, not standing', held)
  ];
});

group('the party comes back from a save as it was', async () => {
  window.__party({ stations: [{ kind: 'armory', cls: 'ranger', rung: 3 }, { kind: 'well', cls: 'monk', rung: 1 }],
                   fangs: 2 });
  const before = JSON.stringify(S.stations);
  yard.persist();
  S.stations = [];
  S.fangs = 0;
  yard.restore();
  return [
    ok(JSON.stringify(S.stations) === before, 'every station, its class, rung and slot', JSON.stringify(S.stations)),
    ok(S.fangs === 2 && S.stationsBuilt === 2, 'the fangs held and the stations ever built', `${S.fangs}, ${S.stationsBuilt}`)
  ];
});
