// The constrict (DESIGN.md, "A fifth phase: the constrict"): on its turn the
// serpent casts an orb round the strongest station's fighter; that fighter does
// nothing; blows crack the orb before the defense takes any; lifting the
// fighter out breaks it at once; and it lets go when its turn runs out.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { MECHANICS, SERPENT_PHASES, SERPENT_WOUND, ORB_CLICK_X, WORKER, P, ORB_R, ORB_CLEAR, ORB_CLOSE_S, ORB_RISE_S,
         ORB_HANG_S, ORB_SINK_S } from '../src/config.js';
import { strike, clickDeep, clickDmg } from '../src/deep/serpent.js';
import { orbOn, inOrb, part, orbLift, orbMiddle } from '../src/deep/phases.js';
import { hitRect } from '../src/stations.js';
import { lift, drop } from '../src/crew/pointer.js';
import { bellyAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const LAST = SERPENT_PHASES - 1, M = MECHANICS[LAST];

// The last defense with four stations, the first the strongest, its turn
// `into` seconds short of the orb.
function party(into) {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 8 }, { kind: 'armory', cls: 'ranger', rung: 5 },
                              { kind: 'spire', cls: 'mage', rung: 4 }, { kind: 'circle', cls: 'sapper', rung: 2 }] });
  runUntil(() => S.workers.filter(w => w.station).every(w => w.goal === 'fight' || w.goal === null), 30);
  window.__serpent({ stage: LAST, wound: 0 });
  S.mechAt = M.every - M.last - into;
  return S.stations[0].id;
}
const body = id => S.workers.find(w => w.station === id);
const hit = n => { const p = bellyAt(now()); return strike('punch', n, p.x, p.y); };

group('the orb closes round the strongest fighter, who does nothing in it', async () => {
  const id = party(0.5);
  const before = orbOn();
  run(0.6);
  const o = orbOn(), w = body(id), x = w && w.x;
  const poses = [];
  for (let f = 0; f < 60; f++) { run(1 / 60); if (body(id).pose) poses.push(body(id).pose); }
  return [
    ok(!before && o && o.st === id, 'on its turn an orb closes, round the strongest', JSON.stringify(o)),
    ok(inOrb(w) && poses.length === 0, 'and the fighter in it starts nothing', `${poses.length} poses`),
    ok(Math.abs(o.max - M.hp * SERPENT_WOUND[LAST]) < 1e-6, 'it is the share of the depth the table gives', `${o.max}`)
  ];
});

group('blows crack the orb first, and the defense takes nothing till it breaks', async () => {
  party(0.05);
  run(0.1);
  const o = orbOn(), wound0 = S.serpentWound;
  hit(o.max / 2);
  const half = { hp: o.hp, wound: S.serpentWound };
  hit(o.max);
  return [
    ok(o && Math.abs(half.hp - o.max / 2) < 1e-6 && half.wound === wound0, 'half its worth of blows takes half the orb, and none of the defense', JSON.stringify(half)),
    ok(!orbOn() && S.mechSkip, 'the rest breaks it, and the turn is answered', `${JSON.stringify(S.orb)} ${S.mechSkip}`)
  ];
});

group('lifted out of the orb, the fighter is free at once', async () => {
  const id = party(0.05);
  run(0.1);
  const had = !!orbOn(), w = body(id);
  lift(w);
  const freed = !orbOn();
  drop(w);
  return [ok(had && freed && S.mechSkip, 'picked up, the orb breaks', `had ${had}, freed ${freed}`)];
});

group('left alone, the orb lets go when its turn runs out', async () => {
  party(0.05);
  run(0.1);
  const had = !!orbOn();
  runUntil(() => part().part !== 'on', M.last + 2);
  return [ok(had && !orbOn(), 'gone at the end of its turn', `${had} ${JSON.stringify(S.orb)}`)];
});

group('a click on the orb cracks it harder than a punch', async () => {
  const id = party(0.05);
  run(0.1);
  const o = orbOn(), w = body(id), st = S.stations.find(s => s.id === id);
  const hp = o.hp;
  const took = clickDeep(w.x + WORKER / 2, w.y + WORKER / 2 - orbLift(st) * P);
  return [ok(took && Math.abs((hp - o.hp) - clickDmg() * ORB_CLICK_X) < 1e-6, `a click on it takes ${ORB_CLICK_X} punches' worth`, `${hp} then ${o.hp}`)];
});

// The orb rises until its bottom clears its station's hit box, so a click on
// it is never a click on the station; clicked open, its fighter hangs, sinks
// home and lands, drawn a frame at a time with no jump of a body's width.
group('the orb rises clear of its station, and its fighter sinks home without a jump', async () => {
  window.__snatch({ played: true });
  // a ranged fighter the strongest, so the orb closes on a body at its post
  window.__party({ stations: [{ kind: 'armory', cls: 'ranger', rung: 8 }, { kind: 'altar', cls: 'brawler', rung: 2 }] });
  runUntil(() => S.workers.filter(w => w.station).every(w => w.goal === 'fight' || w.goal === null), 30);
  window.__serpent({ stage: LAST, wound: 0 });
  S.mechAt = M.every - M.last - 0.05;
  const id = S.stations[0].id, st = S.stations[0], w = body(id);
  const drawn = () => w.y - orbLift(st) * P;
  const home = drawn();
  const ys = [home];
  const frames = s => { for (let f = 0; f < s * 60; f++) { run(1 / 60); if (orbOn()) orbOn().hp = orbOn().max; ys.push(drawn()); } };
  frames(ORB_CLOSE_S + ORB_RISE_S + 0.2);
  const o = orbOn(), hit = hitRect(id), mid = orbMiddle(id);
  const bottom = mid.y + ORB_R * P;
  // freed the player's way: clicks on it until it breaks
  o.hp = clickDmg() * ORB_CLICK_X;
  const took = clickDeep(mid.x, mid.y);
  const at = ys.length;
  frames(ORB_HANG_S + ORB_SINK_S + 0.5);
  let worst = 0, where = 0;
  for (let i = 1; i < ys.length; i++) if (Math.abs(ys[i] - ys[i - 1]) > worst) { worst = Math.abs(ys[i] - ys[i - 1]); where = i; }
  return [
    ok(o && bottom <= hit.y - ORB_CLEAR * P + 1e-6 && home - mid.y > WORKER, 'risen, the orb\'s bottom is clear of the station\'s hit box',
       `bottom ${bottom}, hit box top ${hit.y}, risen ${home - WORKER / 2 - mid.y + WORKER / 2}px`),
    ok(took && !orbOn(), 'a click breaks it', JSON.stringify(S.orb)),
    ok(Math.abs(ys[at] - ys[at - 1]) < P, 'let go, the fighter hangs where the orb held it', `${ys[at - 1]} then ${ys[at]}`),
    ok(ys[ys.length - 1] === home, 'and sinks back to its spot', `${ys[ys.length - 1]} vs ${home}`),
    ok(worst < WORKER, 'never moving a body\'s width or more in a frame', `worst ${worst}px at frame ${where} of ${ys.length}, the click at ${at}: ${ys.slice(Math.max(0, where - 3), where + 3).join(' ')}`)
  ];
});
