// The serpent: the wound held open against the heal, four defenses broken in
// order, and the scales every hit knocks loose.
//
// The fight is a rate, not a total (DESIGN.md, "The serpent is the rock"), so
// these are checks about rates: a clicking hand slower than the heal never
// gets anywhere, a faster one does, and a stage breaks at its depth and not
// before. The clicks go through `clickDeep`, the one door the pointer calls
// in the deep, at the coil where it is on the frame; the stage-by-stage
// checks strike with the beam, which every defense takes in full, so they are
// about the depths and not about which weapon answers which stage.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_HEAL, SERPENT_WOUND, SERPENT_DEFENSE, FADE_UNLIT, SIGIL_HEAL_CUT,
         rungValue } from '../src/config.js';
import { clickDeep, strike, healNow, woundK } from '../src/deep/serpent.js';
import { spendScales } from '../src/deep/scales.js';
import { coilAt, bellySeg, bellyAt, deepFloor, spotX, deepTop } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A yard the serpent has come for. The snatch itself is snatch.test.mjs's
// subject; here it is the setup, and the sqwife it leaves on the deep's
// first job is taken off it, so every blow in these checks is the check's own.
function deepYard() {
  // SEAM: CREW's `__snatch` and `__deepCrew`; until the merge, the fact alone.
  if (typeof window.__snatch === 'function') {
    window.__snatch();
    runUntil(() => S.snatched, 120);
    if (typeof window.__deepCrew === 'function') window.__deepCrew({ brawlers: 0 });
  } else {
    S.snatched = true;
  }
  window.__serpent({ stage: 0, wound: 0 });
}

// One frame, and the belly's segment where it is on it.
const frame = () => yard.fast(1 / 60);
const belly = () => bellyAt(now());
const clickBelly = () => { const p = belly(); return clickDeep(p.x, p.y); };

group('the wound opens under clicks on the coil and closes when nothing strikes', async () => {
  deepYard();
  const p = belly();
  const missed = clickDeep(p.x, deepFloor() - 2);
  const woundMissed = S.serpentWound;
  for (let i = 0; i < 10; i++) clickBelly();
  const opened = S.serpentWound;
  run(3);
  const closing = S.serpentWound;
  run(10);
  const punch = rungValue('punch', S.punchLevel);
  return [
    ok(!missed && woundMissed === 0, 'a click on the floor is not a click on the serpent',
       `answered ${missed}, wound ${woundMissed}`),
    ok(Math.abs(opened - 10 * punch) < 1e-9, 'ten clicks on the coil open it ten punches deep',
       `wound ${opened}, a punch ${punch}`),
    ok(closing < opened && closing > 0, 'and it closes at the heal', `${opened} then ${closing} three seconds on`),
    ok(S.serpentWound === 0, 'and left alone it closes altogether', `${S.serpentWound}`),
    ok(S.serpentStage === 0, 'and nothing broke', `stage ${S.serpentStage}`)
  ];
});

group('a hand slower than the heal never opens it, a faster one breaks the stage', async () => {
  deepYard();
  const heal = SERPENT_HEAL[0], punch = rungValue('punch', S.punchLevel);
  // Slower: a punch every so often, half the heal a second.
  const slowEvery = Math.round(60 * punch / (heal / 2));
  let most = 0;
  for (let f = 0; f < 60 * 30; f++) {
    if (f % slowEvery === 0) clickBelly();
    frame();
    most = Math.max(most, S.serpentWound);
  }
  const slowStage = S.serpentStage;
  // Faster: four times the heal a second, until the depth.
  const fastEvery = Math.max(1, Math.round(60 * punch / (heal * 4)));
  let frames = 0;
  while (S.serpentStage === 0 && frames < 60 * 120) {
    if (frames % fastEvery === 0) clickBelly();
    frame();
    frames++;
  }
  return [
    ok(most <= punch + 1e-9, 'under the heal the wound is never more than the last blow',
       `deepest ${most.toFixed(2)}, a punch ${punch}`),
    ok(slowStage === 0, 'and the stage stands', `stage ${slowStage}`),
    ok(S.serpentStage === 1, 'over the heal it opens to the depth and breaks', `stage ${S.serpentStage} after ${frames} frames`),
    ok(frames / 60 >= SERPENT_WOUND[0] / (heal * 4),
       'and no sooner than the depth over the rate allows',
       `${(frames / 60).toFixed(1)}s against a depth of ${SERPENT_WOUND[0]}`)
  ];
});

group('each defense breaks at its depth, in order, and the fourth frees him', async () => {
  deepYard();
  const seen = [S.serpentStage], bad = [];
  const at = () => coilAt(bellySeg(), now());
  for (let stage = 0; stage < 4; stage++) {
    const depth = SERPENT_WOUND[stage];
    S.sigils = [{ x: spotX('circle'), slot: 0 }];
    // Short of the depth by a whole second's heal: the frame closes a little,
    // and the stage stands.
    strike('beam', depth - SERPENT_HEAL[stage] * 2, at().x, at().y);
    frame();
    if (S.serpentStage !== stage) bad.push(`stage ${stage} broke short of its depth`);
    strike('beam', depth, at().x, at().y);
    if (S.serpentWound > depth) bad.push(`stage ${stage}'s wound went past its depth`);
    frame();
    seen.push(S.serpentStage);
    if (S.serpentStage !== stage + 1) bad.push(`stage ${stage} did not break at its depth`);
    if (S.serpentWound !== 0) bad.push(`stage ${stage + 1} began with a wound of ${S.serpentWound}`);
    if (S.sigils.length) bad.push(`the circles held against stage ${stage} outlived it`);
  }
  const inOrder = seen.every((s, i) => i === 0 || s === seen[i - 1] + 1);
  run(5);
  return [
    ok(bad.length === 0, 'every stage broke at its depth and not before', bad.join('; ')),
    ok(inOrder, 'one at a time, in order, never back', seen.join(' -> ')),
    ok(S.serpentFreed && S.serpentStage === 4, 'and the fourth break opens the belly',
       `freed ${S.serpentFreed}, stage ${S.serpentStage}`),
    ok(S.serpentStage === 4 && S.serpentWound === 0 && healNow() === 0,
       'after which there is nothing to heal and nothing goes back', `stage ${S.serpentStage}, heal ${healNow()}`)
  ];
});

group('the weapon that answers a stage does more than one that glances', async () => {
  deepYard();
  window.__serpent({ stage: 1, wound: 0 });
  const p = belly();
  const punch = strike('punch', 100, p.x, p.y);
  window.__serpent({ stage: 1, wound: 0 });
  const lance = strike('lance', 100, p.x, p.y);
  return [
    ok(lance > punch * 2, 'against the wards a lance goes in and a punch glances',
       `lance ${lance}, punch ${punch}`),
    ok(punch === 100 * SERPENT_DEFENSE.punch[1] && lance === 100 * SERPENT_DEFENSE.lance[1],
       'by the defense table', `${punch} and ${lance}`),
    ok(punch > 0, 'and the glancing one still lands a little', `${punch}`)
  ];
});

group('fading: a coil nobody lights is barely there to hit', async () => {
  deepYard();
  window.__serpent({ stage: 3, wound: 0 });
  const p = belly();
  S.beams = [];
  const unlit = strike('punch', 100, p.x, p.y);
  const beamUnlit = strike('beam', 100, p.x, p.y);
  window.__serpent({ stage: 3, wound: 0 });
  // A wizard's beam on the coil this frame, laid for the check: that a beam
  // is laid by a wizard at the spire is deep-arms.test.mjs's.
  S.beams = [{ x: p.x, y: deepFloor(), tx: p.x, ty: p.y, seg: bellySeg(), tick: S.tick }];
  const lit = strike('punch', 100, p.x, p.y);
  S.beams = [];
  return [
    ok(Math.abs(unlit - 100 * SERPENT_DEFENSE.punch[3] * FADE_UNLIT) < 1e-9,
       'unlit, a punch is worth the fade of what it would be', `${unlit}`),
    ok(Math.abs(lit - unlit / FADE_UNLIT) < 1e-9, 'lit, it is worth the whole of it', `${lit} against ${unlit}`),
    ok(beamUnlit === 100 * SERPENT_DEFENSE.beam[3], 'and the beam is the light, never dimmed', `${beamUnlit}`)
  ];
});

group('sigils and the curse cut the heal', async () => {
  deepYard();
  window.__serpent({ stage: 1, wound: 0 });
  const bare = healNow();
  S.sigils = [{ x: spotX('circle'), slot: 0 }, { x: spotX('circle'), slot: 1 }];
  const held = healNow();
  S.curseLevel = 2;
  const cursed = healNow();
  S.sigils = [];
  S.curseLevel = 0;
  return [
    ok(Math.abs(held - bare * (1 - 2 * SIGIL_HEAL_CUT)) < 1e-9, 'two circles take their share off',
       `${bare} then ${held}`),
    ok(cursed < held, 'and the curse more on top', `${held} then ${cursed}`)
  ];
});

// Follows particular scales from the hit to the floor, and a save writes the
// water down as nothing: the scales in it are this session's.
group('a hit sheds scales, and they are counted when they land', async () => {
  deepYard();
  const before = S.scales;
  const p = belly();
  const done = strike('beam', 5, p.x, p.y);
  const inWater = S.sinking.length, countedAtOnce = S.scales - before;
  const landed = runUntil(() => S.sinking.length === 0, 30);
  const nothing = strike('punch', 0, p.x, p.y);
  return [
    ok(done === 5 && inWater === 5, 'five done, five knocked loose', `${done} done, ${inWater} in the water`),
    ok(countedAtOnce === 0, 'and none counted in the water', `${countedAtOnce}`),
    ok(landed && S.scales - before === 5, 'all five counted on the bed once they land', `${S.scales - before}`),
    ok(S.seenScale, 'and the yard has seen a scale'),
    ok(nothing === 0 && S.sinking.length === 0, 'a blow that did nothing sheds nothing', `${S.sinking.length}`)
  ];
}, { reload: false });

// Follows the flecks a payment sends up to their station.
group('paying lifts scales off the bed to the station that took them', async () => {
  deepYard();
  window.__scales(50);
  const laid = S.scales;
  const x = spotX('altar'), y = deepFloor() - 60;
  const paid = spendScales(20, x, y);
  const after = S.scales, rising = S.lifting.length;
  const tooMuch = spendScales(1000, x, y);
  const gone = runUntil(() => S.lifting.length === 0, 30);
  return [
    ok(laid === 50, 'fifty on the bed', `${laid}`),
    ok(paid && after === 30, 'twenty paid off the bed', `${paid}, ${after} left`),
    ok(rising > 0 && rising <= 20, 'and they rise to the station', `${rising} in the water`),
    ok(!tooMuch && S.scales === 30, 'a bill the bed cannot cover takes nothing', `${tooMuch}, ${S.scales}`),
    ok(gone, 'and the risen are gone at the station')
  ];
}, { reload: false });

group('a cold reload in the split comes back split, wounded and with its scales', async () => {
  deepYard();
  window.__serpent({ stage: 2, wound: 1234 });
  window.__scales(37);
  window.__cold();
  const back = { stage: S.serpentStage, wound: S.serpentWound, scales: S.scales };
  run(1);
  return [
    ok(back.stage === 2, 'the stage', `${back.stage}`),
    ok(back.wound === 1234, 'the wound', `${back.wound}`),
    ok(back.scales === 37, 'and the scales on the bed', `${back.scales}`),
    ok(woundK() > 0 && S.serpentWound < 1234, 'and the fight goes on from there', `${S.serpentWound}`),
    ok(deepTop() < deepFloor(), 'the deep is where it was')
  ];
});
