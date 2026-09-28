// What the fighters put in the water (deep/arms.js): arrows, palm waves,
// hexes and daggers flying straight to the hide, charges thrown on the
// water's gravity, charges stuck to it. Nothing is in the water that a
// fighter at work did not loose, so the first check is that a body not yet
// down there looses nothing; the rest follow a shot from the hand to the
// hide. Which class looses what, and what it does there, is
// classes.test.mjs's.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { WORKER, CLASSES, SERPENT_DEFENSE } from '../src/config.js';
import { shots, loose } from '../src/deep/arms.js';
import { rungWorth } from '../src/deep/classes.js';
import { pressBuild, climb, openEveryClass } from './party-press.mjs';
import { coilAt, coilThick, deepTop } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// The serpent come for, and a station of `kind` standing with `cls` bought
// to `rung` on its rail. `walk`: the station is bought off the build button
// with a pod resident spare, so its fighter swims the floor to it; otherwise
// `__party` stands it with its fighter there.
function station(kind, cls, rung, walk = false) {
  window.__snatch({ played: true });
  window.__serpent({ stage: 3, wound: 0 });
  if (walk) {
    window.__deepCrew({ spare: 1 });
    pressBuild(kind);
    window.__finish();
  } else window.__party({ stations: [{ kind, cls: null, rung: 0 }] });
  openEveryClass();
  return climb(S.stations[0].id, cls, rung);
}
const fighter = () => S.workers.find(w => w.station === 's1');
const arrived = w => w && !w.walking && w.y + WORKER > deepTop();

// Follows one body from the crusher to its station: a reload stands it back
// up at its post.
group('a fighter looses nothing until it is down at its station', async () => {
  station('armory', 'ranger', 1, true);
  const early = [];
  let down = false;
  for (let f = 0; f < 60 * 60 && !(down && shots.length); f++) {
    yard.fast(1 / 60);
    if (arrived(fighter())) down = true;
    if (!down && shots.length) early.push(`a shot at frame ${S.tick}`);
  }
  return [
    ok(down, 'the ranger swims to the armory'),
    ok(early.length === 0, 'nothing of hers is in the water before she is there', early.slice(0, 3).join(', ')),
    ok(shots.length > 0, 'and once she is, she shoots')
  ];
}, { reload: false });

group('a straight shot never misses: it is on its segment when its flight is up', async () => {
  station('armory', 'ranger', 1);
  runUntil(() => shots.some(s => s.kind === 'arrow'), 30);
  const arrow = shots.find(s => s.kind === 'arrow');
  const woundAt = S.serpentWound;
  let last = null;
  for (let f = 0; f < 60 && shots.includes(arrow); f++) {
    last = { x: arrow.x, y: arrow.y, seg: arrow.seg, t: now() };
    yard.fast(1 / 60);
  }
  const p = last && coilAt(last.seg, last.t);
  const v = rungWorth(CLASSES.ranger, 1) * SERPENT_DEFENSE.ranger[3];
  return [
    ok(arrow && arrow.arc > 0, 'an arrow flies on a bow', `${arrow && arrow.arc}`),
    ok(!shots.includes(arrow), 'and lands', `${shots.length} in the water`),
    ok(p && Math.hypot(p.x - last.x, p.y - last.y) < coilThick(last.seg), 'on the hide where its segment had swayed to',
       p && `${Math.round(last.x)},${Math.round(last.y)} against ${p.x},${p.y}`),
    ok(S.serpentWound >= woundAt + v - 1e-6 || S.serpentStage > 3, 'and strikes it', `${woundAt} then ${S.serpentWound}`)
  ];
}, { reload: false });

group('a thrown charge falls on the water, goes off where it meets the coil, or where it is when lost', async () => {
  station('circle', 'sapper', 1);
  runUntil(() => shots.some(s => s.kind === 'charge'), 30);
  const charge = shots.find(s => s.kind === 'charge');
  let fell = false, vy = charge ? charge.vy : 0;
  while (charge && shots.includes(charge)) { yard.fast(1 / 60); if (charge.vy > vy) fell = true; vy = charge.vy; }
  const near = charge && Math.hypot(charge.x - coilAt(charge.seg, now()).x, charge.y - coilAt(charge.seg, now()).y);
  // One thrown away from the coil altogether: it goes off all the same once
  // it has been in the water twice its aimed time.
  let went = 0;
  const astray = loose({ kind: 'charge', by: fighter(), x: 0, y: deepTop() + 10, x0: 0, y0: deepTop() + 10, at: now(),
                         fly: 200, seg: 0, vx: 0, vy: 0, land: () => { went++; } });
  run(1);
  return [
    ok(fell, 'it sinks on the way', `${vy}`),
    ok(charge && charge.reached && near <= coilThick(charge.seg) + 12, 'and goes off at the coil', `${near}`),
    ok(went === 1 && !shots.includes(astray), 'a lost one goes off where it is, once', `${went}`)
  ];
}, { reload: false });

group('the water is empty in a game before the snatch', async () => {
  station('armory', 'ranger', 1);
  runUntil(() => shots.length > 0, 30);
  const had = shots.length;
  window.__seed(20250830);
  run(1 / 60);
  return [
    ok(had > 0, 'there were shots in the water'),
    ok(shots.length === 0, 'and a new game has none', `${shots.length}`)
  ];
}, { reload: false });
