// The constrict (DESIGN.md, "A fifth phase: the constrict"): on its turn the
// serpent casts an orb round the strongest station's fighter; that fighter does
// nothing; the orb's time is its health (the owner, 2026-10-15), running down
// a second a second, with blows and clicks taking seconds off it before the
// defense takes any; lifting the fighter out breaks it at once; and it lets
// go when its time runs out.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { MECHANICS, SERPENT_PHASES, SERPENT_WOUND, ORB_CLICK_S, SAVE_V, WORKER, P, ORB_R, ORB_CLOSE_S, ORB_RISE_S, COIL_SEGS, COIL_SWAY_MS,
         ORB_HANG_S, ORB_SINK_S } from '../src/config.js';
import { strike, clickDeep } from '../src/deep/serpent.js';
import { orbOn, inOrb, orbLift, orbMiddle, orbSecsPerHit } from '../src/deep/phases.js';
import { migrate } from '../src/migrations/index.js';
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
// What the whole of the orb's time is worth in hit points: the share of the
// level-1 last depth the table gives.
const WORTH = M.hp * SERPENT_WOUND[LAST];
// A click on the orb, where the player's pointer lands on it: its middle.
const clickOrb = () => { const c = orbMiddle(orbOn().st); return clickDeep(c.x, c.y); };

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
    ok(o.max === M.last && o.left < M.last && o.left > 0, 'it closes holding its turn\'s seconds, and they run down', JSON.stringify(o)),
    ok(Math.abs(orbSecsPerHit() * WORTH - M.last) < 1e-9, 'and the whole of them is worth the share of the depth the table gives', `${orbSecsPerHit()} s a point`)
  ];
});

group('blows take seconds off the orb first, and the defense takes nothing till it breaks', async () => {
  party(0.05);
  run(0.1);
  const o = orbOn(), wound0 = S.serpentWound, left0 = o.left;
  hit(WORTH / 2);
  const half = { left: o.left, wound: S.serpentWound };
  hit(WORTH);
  return [
    ok(o && Math.abs(left0 - half.left - M.last / 2) < 1e-6 && half.wound === wound0, 'half its worth of blows takes half its seconds, and none of the defense', `${left0} then ${JSON.stringify(half)}`),
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

group('the orb runs down a second a second, less what blows have cut off it, and lets go at nought', async () => {
  const id = party(0.05);
  run(0.1);
  const had = !!orbOn(), cast = orbOn().at;
  // the party fights on, so its blows cut seconds too: what is left is what
  // it closed with, less the time since and the cut (read off the orb as it
  // stands, since the harness's reloads read it back as a new object)
  const at = [];
  for (let i = 0; i < 4; i++) { run(1); const o = orbOn(); if (o) at.push({ age: (now() - cast) / 1000, left: o.left, cut: o.cut }); }
  const off = Math.max(...at.map(a => Math.abs(M.last - a.age - a.cut - a.left)));
  const falling = at.every((a, i) => !i || a.left < at[i - 1].left);
  let o = orbOn();
  for (let f = 0; f < (M.last + 2) * 60 && orbOn(); f++) { o = orbOn(); run(1 / 60); }
  const age = (now() - cast) / 1000;
  return [
    ok(had && at.length === 4 && falling, 'its time falls every second', JSON.stringify(at)),
    ok(off < 2 / 60, 'by the seconds gone and the seconds cut, no more and no less', `${off.toFixed(4)} s off`),
    ok(!orbOn() && o.left <= 0 && S.orbBurst && S.orbBurst.st === id && age <= M.last + 2 / 60, 'at nought it lets go, inside its turn, and its fighter sinks home', `${o.left} at ${age.toFixed(2)}s`)
  ];
});

group('a click on the orb, as a player clicks it, takes a chunk of its time', async () => {
  party(0.05);
  run(0.1);
  const o = orbOn(), before = { left: o.left, cut: o.cut };
  const took = clickOrb();
  const k1 = { left: o.left, cut: o.cut };
  clickOrb();
  return [
    ok(took && Math.abs(before.left - k1.left - ORB_CLICK_S) < 1e-9 && Math.abs(k1.cut - before.cut - ORB_CLICK_S) < 1e-9,
       `a click takes ${ORB_CLICK_S} s off it, cut`, `${JSON.stringify(before)} then ${JSON.stringify(k1)}`),
    ok(Math.abs(k1.left - o.left - ORB_CLICK_S) < 1e-9, 'and the next as much again', `${k1.left} then ${o.left}`),
    ok(ORB_CLICK_S / M.last >= 0.1, 'a chunk a player sees go: a tenth of the bar or more', `${ORB_CLICK_S} of ${M.last}`)
  ];
});

group('clicked down to nought, the orb breaks', async () => {
  party(0.05);
  run(0.1);
  const o = orbOn();
  let n = 0;
  while (orbOn() && n < 20) { clickOrb(); n++; }
  return [ok(!orbOn() && o.left <= 0 && S.mechSkip && n <= Math.ceil(M.last / ORB_CLICK_S), 'it breaks on the click that empties it', `${n} clicks, ${o.left}`)];
});

// A refresh mid-orb: the page's clock starts again near nought, and the orb
// holds the time it had, no more and no less. Its own refresh, at a chosen
// point, so the harness's are kept out.
group('a refresh mid-orb keeps the time it had left', async () => {
  party(0.05);
  run(0.1);
  run(3);
  clickOrb();
  const was = { ...orbOn() };
  window.__cold({ clock: 1000 });
  const back = orbOn();
  const read = back && { ...back };
  run(1);
  const after = orbOn();
  return [
    ok(read && Math.abs(read.left - was.left) < 1e-9 && read.max === was.max && Math.abs(read.cut - was.cut) < 1e-9 && read.st === was.st,
       'read back, it has the seconds it had', `${JSON.stringify(was)} then ${JSON.stringify(read)}`),
    ok(after && was.left - after.left >= 1 - 2 / 60, 'and runs down from there (the new page\'s first frame has no time in it)', `${was.left} then ${after && after.left}`)
  ];
}, { reload: false });

group('an orb saved holding hit points is read as the same share of its time', async () => {
  const raw = { saveV: SAVE_V - 1, orb: { st: 3, hp: 690.75, max: 2763, at: 5000 } };
  migrate(raw);
  const o = raw.orb;
  return [ok(o.max === M.last && Math.abs(o.left - M.last / 4) < 1e-9 && o.cut === 0 && o.st === 3 && o.at === 5000 && !('hp' in o),
             'a quarter of its hit points is a quarter of its seconds', JSON.stringify(o))];
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
  const frame = () => { run(1 / 60); if (orbOn()) orbOn().left = orbOn().max; };
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
  const frames = s => { for (let f = 0; f < s * 60; f++) { run(1 / 60); if (orbOn()) orbOn().left = orbOn().max; ys.push(drawn()); } };
  frames(ORB_CLOSE_S + ORB_RISE_S + 0.2);
  const o = orbOn(), mid = orbMiddle(id);
  // freed the player's way: a click on it that empties it
  o.left = ORB_CLICK_S;
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
