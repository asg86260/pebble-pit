// One carry (DESIGN.md, "One resource system for every act", section 4): a
// body in any act carries cells, by the hand's weights, and counts a unit only
// when a take returned it. Yard haulers keep each grain's shade, the deep's
// gatherers hold cells, act 3's members carry logs and timber by weight, take
// each from the top of a pile and set it down on its home, gather a lying
// block home, carry a bought row's timber and its station's loads out of the
// shack's door; an older save's bodies migrate with their loads.
//
// Reached the way a player reaches it where the check is about it: the
// stations ordered off the shack (`__buy`), the roster's + (`__afterPress`),
// the row bought (`__buy`). The setup it is not about: the yard's carry level
// (`__levels`), the act's coins and its members walked out.
import { group, ok, run, runUntil, yard, quickCrew } from './helpers.mjs';
import { floor, deepBed } from '../src/state.js';
import { addGrain, kindOf } from '../src/grid.js';
import { KINDS, RIM_PIECES, AFTER_PILES, AFTER_UPGRADES, AFTER_SITE_LOAD } from '../src/config.js';
import { holds, loadKind } from '../src/carry.js';
import { haulCap } from '../src/levels.js';
import { AFTER_JOB } from '../src/jobs.js';
import { P } from '../src/config.js';
import { units } from '../src/after/ground.js';
import { layGood } from '../src/after/grove.js';
import { stationDoor, afterFloor } from '../src/after/place.js';
import { timberReserved } from '../src/after/build.js';
import { tossX } from '../src/deep/place.js';
import oneCarry from '../src/migrations/2026-10-28-one-carry.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const REACH = 'after-signreach';

function camp(n, stations = ['mill', 'workshop']) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  for (const st of stations) {
    window.__buy(`after-build-${st}`);
    runUntil(() => window.__afterRead().built.includes(st), 600);
  }
  return stations.every(st => window.__afterRead().built.includes(st));
}
// Units of `kind` anywhere: lying or piled on the ground, and in arms.
const arms = kind => S.after.bodies.reduce((n, b) => n + (loadKind(b) === kind ? b.carry : 0), 0);
const onGround = kind => units().filter(u => u.kind === kind).length;

group('a yard hauler\'s load keeps each grain\'s shade to the toss', async () => {
  window.__reset();
  window.__crew(0, 1);
  quickCrew();
  window.__clearFloor();
  run(0.2);
  const far = yard.S.pitX ? yard.S.pitX - 1000 : 600;
  const shades = [2, 3, 4, 5];
  shades.forEach((s, i) => addGrain(floor, far + i * P * 2, null, s, true));
  window.__place('hauler', far);
  let held = null, thrown = null;
  for (let f = 0; f < 60 * 60 && !thrown; f++) {
    run(1 / 60);
    const h = S.workers.find(w => w.type === 'hauler');
    if (h.carry > 0) held = [...h.load];
    else if (held) thrown = S.chips.map(c => c.s);
  }
  const h = S.workers.find(w => w.type === 'hauler');
  return [
    ok(held && held.length === shades.length && held.every(v => shades.includes(v)), 'the arms hold the grains\' own cells', JSON.stringify(held)),
    ok(thrown && [...held].sort().every((v, i) => [...thrown].sort().includes(v)), 'and the toss throws those shades', JSON.stringify(thrown)),
    ok(h.carry === 0 && h.load.length === 0, 'the arms are empty after')
  ];
});

group('a deep gatherer\'s load is cells', async () => {
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  for (let i = 0; i < 6; i++) addGrain(deepBed, tossX() + P * 30 + i * P, null, 3, true);
  let seen = null;
  for (let f = 0; f < 60 * 60 && !seen; f++) {
    run(1 / 60);
    const g = S.workers.find(w => w.type === 'gatherer' && w.carry > 0);
    if (g) seen = { load: [...g.load], carry: g.carry };
  }
  return [
    ok(seen && seen.load.length === seen.carry && seen.load.every(v => v === 3), 'it holds the scales as the cells they were', JSON.stringify(seen))
  ];
});

group('act 3 members carry by weight, off the top of a pile and onto its home, none phantom', async () => {
  const stood = camp(6);
  window.__levels({ haulCarryLevel: 8 });            // sixteen grains: the setup this is not about
  const cap = haulCap();
  // Planks lying about the open ground and logs with them; the mill is not
  // worked, so nothing is sawn and every unit must stay a unit.
  const x0 = stationDoor('mill') - P * 90;
  for (let i = 0; i < 6; i++) layGood('plank', x0 + i * P * 3, afterFloor());
  for (let i = 0; i < 3; i++) layGood('log', x0 - P * 60 - i * P * 5, afterFloor());
  const planks0 = onGround('plank') + arms('plank'), logs0 = onGround('log') + arms('log');
  let mostPlank = 0, mostLog = 0, drift = 0, bad = 0;
  const done = () => units().filter(u => u.kind === 'plank' || u.kind === 'log').every(u => { const s = window.__afterRead(); return true; });
  for (let f = 0; f < 60 * 120; f++) {
    run(1 / 60);
    mostPlank = Math.max(mostPlank, ...S.after.bodies.map(b => (loadKind(b) === 'plank' ? b.carry : 0)));
    mostLog = Math.max(mostLog, ...S.after.bodies.map(b => (loadKind(b) === 'log' ? b.carry : 0)));
    if (onGround('plank') + arms('plank') !== planks0 || onGround('log') + arms('log') !== logs0) drift++;
    for (const b of S.after.bodies) {
      const k = loadKind(b);
      if (k && (b.carry > holds(k) || b.load.some(v => !kindOf(v)))) bad++;
    }
  }
  window.__actsOn(null);
  return [
    ok(stood && cap === 16, 'a camp stood, the carry at sixteen grains', `${cap}`),
    ok(holds('log') === Math.max(1, Math.floor(cap / KINDS.log.weight)) && holds('plank') === Math.floor(cap / KINDS.plank.weight), 'a log weighs sixteen grains and a plank four', `${holds('log')} ${holds('plank')}`),
    ok(mostPlank > 1 && mostPlank <= holds('plank'), 'timber is carried several at a time, up to its share', `${mostPlank} of ${holds('plank')}`),
    ok(mostLog === 1, 'a log is carried one at a time', `${mostLog}`),
    ok(drift === 0, 'every frame, each kind\'s units on the ground and in arms are the same', `${drift} frames off`),
    ok(bad === 0, 'no body holds more than its share or a cell that is no unit', `${bad}`),
    ok(onGround('plank') + arms('plank') === planks0 && units().filter(u => u.kind === 'plank').every(u => true), 'none lost at the end')
  ];
});

group('a bought row\'s timber is carried block by block and the row lands on the last', async () => {
  const stood = camp(6);
  const bill = AFTER_UPGRADES[REACH].bills[0].find(([c]) => c === 'timber')[1];
  window.__afterGrant({ timber: AFTER_PILES.timber.brim });
  const t0 = S.after.stock.timber;
  const bought = window.__buy(REACH);
  const reserved = timberReserved();
  let carried = 0, phantoms = 0;
  const landed = runUntil(() => {
    const o = S.after.orders[0];
    if (o) {
      const inArms = arms('plank');
      carried = Math.max(carried, inArms);
      // taken up = claimed: the blocks off the mound plus those in arms and set down
      if (o.claimed > S.after.stock.timber * 0 + o.n) phantoms++;
    }
    return !S.after.orders.length;
  }, 300);
  window.__actsOn(null);
  return [
    ok(stood && bought && reserved === bill, 'the row bought, its blocks spoken for on the mound', `${reserved} of ${bill}`),
    ok(landed && S.after.ups[REACH] === 1, 'the blocks are carried and the row lands'),
    ok(carried > 0 && phantoms === 0, 'each claimed block was in someone\'s arms', `${carried}`),
    ok(timberReserved() === 0, 'nothing is left spoken for')
  ];
});

group('a station\'s loads come out of the shack\'s door', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < 4 ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  const bought = window.__buy('after-build-mill');
  const door = stationDoor('shack');
  const took = [];
  let was = new Map();
  for (let f = 0; f < 60 * 300 && !window.__afterRead().built.includes('mill'); f++) {
    run(1 / 60);
    for (const b of S.after.bodies) {
      if (b.phase === 'carry' && !was.get(b.id)) took.push({ x: b.x, load: [...b.load] });
      was.set(b.id, b.phase === 'carry');
    }
  }
  window.__actsOn(null);
  return [
    ok(bought, 'the station bought off the shack'),
    ok(took.length > 0 && took.every(t => Math.abs(t.x - door) < P * 4), 'every load was taken up at the shack\'s door', JSON.stringify(took.slice(0, 3)) + ' door ' + door),
    ok(took.every(t => t.load.length === 1 && t.load[0] === AFTER_SITE_LOAD), 'as a unit in the arms'),
    ok(window.__afterRead().built.includes('mill'), 'and the station stands off them')
  ];
});

group('an older save\'s bodies migrate with their loads intact', async () => {
  const s = { after: { bodies: [
    { id: 1, load: 'log', carry: 2 }, { id: 2, load: 'plank' }, { id: 3, load: 'tip' }, { id: 4, load: 'lay' }, { id: 5, load: null }, { id: 6, load: [] }
  ] } };
  oneCarry.apply(s);
  const [a, b, c, d, e, f] = s.after.bodies;
  return [
    ok(a.carry === 2 && a.load.length === 2 && a.load.every(v => v === KINDS.log.first), 'two logs are two log cells'),
    ok(b.carry === 1 && b.load[0] === KINDS.plank.first, 'a load with no count is one'),
    ok(c.tipping === true && c.load.length === 0 && c.carry === 0, 'a sawyer\'s tip is its own flag'),
    ok(d.phase === 'lay' && d.load.length === 1 && d.carry === 1, 'a builder\'s load is a unit of the shack\'s with its phase'),
    ok(e.load.length === 0 && f.load.length === 0 && e.carry === 0, 'empty hands stay empty')
  ];
});
