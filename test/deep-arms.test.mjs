// The weapons made of the abyss, at work: each deep job's body, and what it
// leaves in the water.
//
// Nothing strikes the serpent that a body did not bring, so the first check
// is that a body not yet down there does nothing at all; the rest follow one
// weapon each from the hand to the coil. The stations are opened by their
// flags and the hands put on with `__deepCrew`: the doors and the roster are
// the boards' and the crew's checks, and these are about what a body does
// once it is standing at its station.
//
// Until the crew's half of the wave is merged there are no deep bodies to put
// on (no JOBS rows, no `__deepCrew`), so this file stands its own bodies at
// the stations and turns their work steps on the frame the registry would,
// before the water's own step. The checks read the same either way.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { WORKER, P, SERPENT_WOUND, SIGIL_HEAL_CUT, SPLIT_LENGTHS, COIL_SEGS,
         STAR_EVERY_S, DEEP_KNOBS, rungValue } from '../src/config.js';
import { STEPS } from '../src/game.js';
import { stepBrawler, stepLancer, stepGrenadier, stepScribe, stepWarlock, lengthOf } from '../src/deep/arms.js';
import { strike, healNow, litK, isLit } from '../src/deep/serpent.js';
import { coilAt, spotX, deepFloor, deepTop, mouthX } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// SEAM: CREW's `__deepCrew` and the JOBS rows' `work`; until the merge, bodies of our own.
const merged = typeof window.__deepCrew === 'function';

const KINDS = {
  brawler:   { job: 'brawlers',   at: 'altar',  step: stepBrawler,   open: null },
  lancer:    { job: 'lancers',    at: 'well',   step: stepLancer,    open: 'wellOpen' },
  grenadier: { job: 'grenadiers', at: 'font',   step: stepGrenadier, open: 'fontOpen' },
  scribe:    { job: 'scribes',    at: 'circle', step: stepScribe,    open: 'circleOpen' },
  warlock:   { job: 'warlocks',   at: 'spire',  step: stepWarlock,   open: 'spireOpen' }
};

// The stand-ins, worked where the crew step would work them: before the
// serpent and the water, so what a body put in the water this frame is in
// this frame's fight.
let standIns = [];
if (!merged) {
  const at = STEPS.findIndex(s => s.name === 'serpent');
  STEPS.splice(at, 0, { name: 'standins', step: c => {
    for (const w of standIns) KINDS[w.type].step(w, c);
  } });
}

// A yard the serpent has come for, with the hands asked for at their
// stations and nobody else in the deep.
function deepYard(counts = {}, where = 'station') {
  standIns = [];
  if (typeof window.__snatch === 'function') { window.__snatch(); runUntil(() => S.snatched, 120); }
  else S.snatched = true;
  window.__serpent({ stage: 0, wound: 0 });
  for (const k of Object.values(KINDS)) if (k.open) S[k.open] = true;
  if (merged) {
    window.__crew(0, 12);
    const want = { brawlers: 0, lancers: 0, grenadiers: 0, scribes: 0, warlocks: 0 };
    for (const [type, n] of Object.entries(counts)) want[KINDS[type].job] = n;
    window.__deepCrew(want);
    return;
  }
  for (const [type, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) {
      const x = spotX(KINDS[type].at) - WORKER / 2 + i * P;
      const body = { type, x, y: deepFloor() - WORKER, ph: 0, sp: 1, face: 1, walking: false };
      // Not arrived: on the way down the shaft, or still walking to it.
      if (where === 'shaft') { body.x = mouthX(); body.y = deepTop() - P * 6; }
      if (where === 'walking') body.walking = true;
      standIns.push(body);
    }
  }
}
const bodies = type => merged ? S.workers.filter(w => w.type === type) : standIns.filter(w => w.type === type);
const arrived = w => !w.walking && w.y + WORKER > deepTop();

// Everything in the water, and the fight, read once a frame over `s` seconds.
function watch(s, each = () => {}) {
  const seen = { lances: 0, grenades: 0, rings: 0, beams: 0, sigils: 0, wound: 0, punched: 0 };
  for (let f = 0; f < s * 60; f++) {
    yard.fast(1 / 60);
    seen.lances = Math.max(seen.lances, S.lances.length);
    seen.grenades = Math.max(seen.grenades, S.grenades.length);
    seen.rings = Math.max(seen.rings, S.rings.length);
    seen.beams = Math.max(seen.beams, S.beams.length);
    seen.sigils = Math.max(seen.sigils, S.sigils.length);
    seen.wound = Math.max(seen.wound, S.serpentWound);
    seen.punched = Math.max(seen.punched, ...bodies('brawler').map(w => w.punchAt || 0));
    each(f);
  }
  return seen;
}
const nothing = s => !s.lances && !s.grenades && !s.rings && !s.beams && !s.sigils && !s.wound && !s.punched;
const everyKind = { brawler: 1, lancer: 1, grenadier: 1, scribe: 1, warlock: 1 };

group('a body works only once it has arrived', async () => {
  let before = null, early = [];
  if (merged) {
    // The walk down is the crew's; here, nothing is in the water until
    // somebody is standing in the deep.
    deepYard(everyKind);
    watch(60, () => {
      if (bodies('lancer').concat(bodies('warlock'), bodies('brawler')).some(arrived)) return;
      if (S.lances.length || S.beams.length || S.serpentWound) early.push(S.tick);
    });
  } else {
    deepYard(everyKind, 'shaft');
    const shaft = watch(10);
    deepYard(everyKind, 'walking');
    const walking = watch(10);
    before = { shaft, walking };
  }
  deepYard(everyKind);
  if (merged) runUntil(() => Object.keys(everyKind).every(t => bodies(t).length && bodies(t).every(arrived)), 120);
  const at = watch(30);
  return [
    ...(before ? [
      ok(nothing(before.shaft), 'a body in the shaft is nobody\'s weapon yet', JSON.stringify(before.shaft)),
      ok(nothing(before.walking), 'nor one still walking to its station', JSON.stringify(before.walking))
    ] : [ok(early.length === 0, 'nothing is in the water before a body is in the deep', early.slice(0, 5).join(', '))]),
    ok(at.punched > 0, 'at its station a brawler punches'),
    ok(at.lances > 0, 'a lancer throws'),
    ok(at.grenades > 0 && at.rings > 0, 'a grenadier throws and the grenade bursts', JSON.stringify(at)),
    ok(at.sigils > 0, 'a scribe draws a circle'),
    ok(at.beams > 0, 'a wizard channels'),
    ok(at.wound > 0, 'and the serpent is hurt', `${at.wound}`)
  ];
});

// Follows one lance from the hand to where it dissolves: a save writes the
// water down as nothing.
group('a lance is carried up, sticks, bleeds and dissolves', async () => {
  deepYard({ lancer: 1 });
  const w = () => bodies('lancer')[0];
  const held = runUntil(() => w() && w().holding, 30);
  const floorY = deepFloor() - WORKER;
  const carried = runUntil(() => S.lances.length > 0, 30);
  const thrownFrom = S.lances.length ? S.lances[0].y0 : NaN;
  const lance = S.lances[0];
  const stuck = runUntil(() => lance.stuck, 5);
  const woundAt = S.serpentWound;
  run(2);
  const onCoil = coilAt(lance.seg, now());
  const riding = Math.abs(lance.x - onCoil.x) < 1 && Math.abs(lance.y - onCoil.y) < 1;
  const bled = S.serpentWound - woundAt;
  const hold = rungValue('lancehold', S.lanceholdLevel);
  const t0 = now();
  const gone = runUntil(() => !S.lances.includes(lance), hold + 5);
  const lasted = (now() - t0) / 1000 + 2;
  return [
    ok(held, 'drawn at the well'),
    ok(carried && thrownFrom < floorY - P * 10, 'and carried up off the floor before it is thrown',
       `thrown from ${Math.round(floorY - thrownFrom)}px over the floor`),
    ok(stuck, 'it sticks'),
    ok(riding, 'and rides the coil where it stuck', `${Math.round(lance.x)},${Math.round(lance.y)} against ${onCoil.x},${onCoil.y}`),
    ok(bled > 0, 'bleeding the serpent while it holds', `${bled}`),
    ok(gone && Math.abs(lasted - hold) <= 1.5, 'and dissolves when its hold is up', `lasted about ${lasted.toFixed(1)}s of ${hold}`),
    ok(runUntil(() => bodies('lancer')[0].holding, 30), 'and the lancer has gone back down for another')
  ];
}, { reload: false });

// Follows each ring from its burst to its reach.
group('a grenade\'s ring strikes each length of coil it crosses once', async () => {
  deepYard({ grenadier: 1 });
  window.__serpent({ stage: 2, wound: 0 });
  // The split's heal off for the length of the check, so the wound is the
  // sum of the blows and nothing else.
  const knob = DEEP_KNOBS.find(k => k.key === 'SERPENT_HEAL_3');
  const was = knob.get();
  knob.set(0);
  const rings = new Map();
  const bad = [];
  watch(40, () => {
    for (const r of S.rings) if (!rings.has(r)) rings.set(r, S.serpentWound);
    for (const [r, woundAt] of rings) {
      if (S.rings.includes(r) || r.done) continue;
      r.done = true;
      if (new Set(r.hit).size !== r.hit.length) bad.push(`a ring hit a length twice: ${r.hit}`);
      const dealt = S.serpentWound - woundAt;
      const want = r.hit.length * rungValue('grenade', S.grenadeLevel);
      if (Math.abs(dealt - want) > 1e-6 && S.rings.length === 0) bad.push(`a ring dealt ${dealt} for ${r.hit.length} lengths`);
    }
  });
  // A burst on the join between two lengths reaches both, and each once.
  const join = Math.round(COIL_SEGS / SPLIT_LENGTHS);
  const p = coilAt(join, now());
  const lengths = new Set([lengthOf(join - 1), lengthOf(join + 1)]);
  S.rings.push({ x: p.x, y: p.y, at: now(), r: 0, hit: [] });
  const laid = S.rings[S.rings.length - 1];
  run(2);
  knob.set(was);
  return [
    ok(rings.size >= 3, 'the grenadier threw and they burst', `${rings.size} rings`),
    ok(bad.length === 0, 'every ring hit a length once and only once', bad.join('; ')),
    ok(lengths.size === 2 && laid.hit.length === 2, 'and a burst across a join hits both lengths',
       `hit ${laid.hit.join(', ')}`)
  ];
}, { reload: false });

group('sigils cut the heal and are spent on the break', async () => {
  deepYard({ scribe: 1 });
  window.__serpent({ stage: 1, wound: 0 });
  const bare = healNow();
  const drawn = runUntil(() => S.sigils.length > 0, 60);
  const held = healNow();
  const most = rungValue('sigil', S.sigilLevel);
  run(30);
  const capped = S.sigils.length;
  const p = coilAt(20, now());
  strike('beam', SERPENT_WOUND[1], p.x, p.y);
  run(1 / 60);
  const spent = S.sigils.length;
  const again = runUntil(() => S.sigils.length > 0, 60);
  return [
    ok(drawn, 'a scribe draws a circle on the floor'),
    ok(Math.abs(held - bare * (1 - SIGIL_HEAL_CUT)) < 1e-9, 'and the heal is cut by it', `${bare} then ${held}`),
    ok(capped === most, 'no more than the ladder holds', `${capped} of ${most}`),
    ok(S.serpentStage === 2 && spent === 0, 'the break spends them', `stage ${S.serpentStage}, ${spent} left`),
    ok(again, 'and the scribe draws again against the next')
  ];
});

group('a wizard\'s beam lights the coil, and goes out with the wizard', async () => {
  deepYard({ warlock: 1 });
  window.__serpent({ stage: 3, wound: 0 });
  const unlit = litK();
  const lit = runUntil(() => S.beams.length > 0, 60);
  const beam = S.beams[0];
  const k = litK(), onIt = isLit(beam.seg);
  // The split's wound would close faster than one wizard opens it; what the
  // beam does is read off the scales it knocks loose.
  const shedAt = S.sinking.length + S.scales;
  run(2);
  const hurt = S.sinking.length + S.scales > shedAt;
  const p = coilAt(S.beams[0].seg, now());
  const punch = strike('punch', 100, p.x, p.y);
  if (merged) window.__deepCrew({ warlocks: 0 }); else standIns = [];
  run(1 / 60);
  const after = S.beams.length;
  const dim = strike('punch', 100, p.x, p.y);
  return [
    ok(unlit === 0, 'no wizard, no light', `${unlit}`),
    ok(lit && k > 0 && onIt, 'a wizard at the spire lights the coil it reaches', `${k}, ${onIt}`),
    ok(hurt, 'and the beam does harm of its own'),
    ok(punch > dim * 5, 'a blow on a lit coil lands where a blow on a dark one barely does', `${punch} lit, ${dim} dark`),
    ok(after === 0, 'the beam is gone when the wizard is', `${after}`)
  ];
});

// Follows one star from the yard's sky to the coil.
group('a called star is seen falling in the yard before it lands in the deep', async () => {
  deepYard({});
  // The machine is the board's row; its flag is the setup here.
  S.starOpen = true;
  const phases = [];
  let skyY = null, woundAt = null;
  let landed = false;
  for (let f = 0; f < 60 * 30 && !landed; f++) {
    yard.fast(1 / 60);
    const s = S.starFall;
    if (s && phases[phases.length - 1] !== s.phase) phases.push(s.phase);
    if (s && s.phase === 'sky' && s.y < S.groundY) skyY = s.y;
    if (s) woundAt = S.serpentWound;
    landed = phases.length > 0 && !s;
  }
  return [
    ok(skyY != null, 'seen in the yard\'s sky', `${skyY} over ground ${S.groundY}`),
    ok(phases.join(' ') === 'sky under deep', 'into the pit, under the surface, then down through the deep', phases.join(' ')),
    ok(landed && (S.serpentStage > 0 || S.serpentWound > (woundAt || 0)), 'and it lands on the coil',
       `stage ${S.serpentStage}, wound ${S.serpentWound}`),
    ok(Math.abs(S.starAt - STAR_EVERY_S[0]) < 0.1, 'and the next is a wait away', `${S.starAt}`)
  ];
}, { reload: false });
