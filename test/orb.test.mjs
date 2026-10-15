// The constrict (DESIGN.md, "A fifth phase: the constrict"): on its turn the
// serpent casts an orb round the strongest station's fighter; that fighter does
// nothing; blows crack the orb before the defense takes any; lifting the
// fighter out breaks it at once; and it lets go when its turn runs out.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { MECHANICS, SERPENT_PHASES, SERPENT_WOUND, ORB_CLICK_X, WORKER, P, ORB_R, ORB_CLOSE_S, ORB_RISE_S, COIL_SEGS, COIL_SWAY_MS,
         ORB_HANG_S, ORB_SINK_S } from '../src/config.js';
import { strike, clickDeep, clickDmg } from '../src/deep/serpent.js';
import { orbOn, inOrb, part, orbLift, orbMiddle } from '../src/deep/phases.js';
import { lift, drop } from '../src/crew/pointer.js';
import { bellyAt, coilLine, coilThick, standOfStation, deepFloor } from '../src/deep/place.js';
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

// Held, the orb stands halfway between the coil's underside and its station's
// top, in open air (the owner, 2026-10-15: it used to rise until it cleared
// the station's hit box, up against the coil). Measured here off the drawn
// coil over a whole sway, not off `orbHome`: the lowest the underside came
// over the orb, and the ring never touching the coil, the station or the
// floor. A ranged fighter is carried up from its post; a melee one caught up
// on the hide is carried down to the same place.
for (const [kind, cls] of [['armory', 'ranger'], ['altar', 'brawler']]) group(`a ${cls} held in the orb hangs halfway between the coil and the station, in open air`, async () => {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind, cls, rung: 8 }, { kind: 'spire', cls: 'mage', rung: 2 }] });
  runUntil(() => S.workers.filter(w => w.station).every(w => w.goal === 'fight' || w.goal === null), 30);
  window.__serpent({ stage: LAST, wound: 0 });
  S.mechAt = M.every - M.last - 0.05;
  const id = S.stations[0].id, st = S.stations[0], R = ORB_R * P;
  const frame = () => { run(1 / 60); if (orbOn()) orbOn().hp = orbOn().max; };
  for (let f = 0; f < (ORB_CLOSE_S + ORB_RISE_S + 0.1) * 60; f++) frame();
  let under = -Infinity, touch = null;
  const mids = [];
  for (let f = 0; f < COIL_SWAY_MS / 1000 * 60 && orbOn(); f++) {
    frame();
    const c = orbMiddle(id), t = now();
    mids.push(c.y);
    for (let u = 0; u < COIL_SEGS; u += 0.5) {
      const p = coilLine(u, t), half = coilThick(u) / 2;
      if (Math.abs(p.x - c.x) <= P) under = Math.max(under, p.y + half);
      if (!touch && Math.hypot(p.x - c.x, p.y - c.y) < R + half) touch = `segment ${u} at frame ${f}`;
    }
  }
  const top = standOfStation(st).y, mid = (under + top) / 2, low = Math.max(...mids);
  const off = Math.max(...mids.map(y => Math.abs(y - mid))) / P;
  const cell = y => ((y - S.worldH) / P).toFixed(1);
  return [
    ok(mids.length >= COIL_SWAY_MS / 1000 * 60, 'the orb holds through a whole sway', `${mids.length} frames`),
    ok(off <= 2.5, 'its middle stays within a couple of cells of halfway between the coil\'s underside and the station\'s top',
       `${off.toFixed(1)} cells off: underside ${cell(under)}, station top ${cell(top)}, middle ${cell(mids[mids.length - 1])} (cells under the yard)`),
    ok(!touch, 'its ring never touches the coil', touch),
    ok(low + R <= top && low + R <= deepFloor(), 'nor the station or the floor', `bottom ${low + R}, station top ${top}`)
  ];
});

// Clicked open, its fighter hangs, sinks home and lands, drawn a frame at a
// time with no jump of a body's width.
group('the orb rises off its post, and its fighter sinks home without a jump', async () => {
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
  const o = orbOn(), mid = orbMiddle(id);
  // freed the player's way: clicks on it until it breaks
  o.hp = clickDmg() * ORB_CLICK_X;
  const took = clickDeep(mid.x, mid.y);
  const at = ys.length;
  frames(ORB_HANG_S + ORB_SINK_S + 0.5);
  let worst = 0, where = 0;
  for (let i = 1; i < ys.length; i++) if (Math.abs(ys[i] - ys[i - 1]) > worst) { worst = Math.abs(ys[i] - ys[i - 1]); where = i; }
  return [
    ok(o && home + WORKER / 2 - mid.y > WORKER, 'risen off its post by more than a body', `risen ${home + WORKER / 2 - mid.y}px`),
    ok(took && !orbOn(), 'a click breaks it', JSON.stringify(S.orb)),
    ok(Math.abs(ys[at] - ys[at - 1]) < P, 'let go, the fighter hangs where the orb held it', `${ys[at - 1]} then ${ys[at]}`),
    ok(ys[ys.length - 1] === home, 'and sinks back to its spot', `${ys[ys.length - 1]} vs ${home}`),
    ok(worst < WORKER, 'never moving a body\'s width or more in a frame', `worst ${worst}px at frame ${where} of ${ys.length}, the click at ${at}: ${ys.slice(Math.max(0, where - 3), where + 3).join(' ')}`)
  ];
});
