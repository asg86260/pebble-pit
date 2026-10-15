// The serpent: the wound held open against the heal, four defenses broken in
// order, and the scales every hit knocks loose.
//
// The fight is a rate, not a total (DESIGN.md, "The serpent is the rock"), so
// these are checks about rates: a clicking hand slower than the heal never
// gets anywhere, a faster one does, and a stage breaks at its depth and not
// before. The clicks go through `clickDeep`, the one door the pointer calls
// in the deep, at the coil where it is on the frame; the stage-by-stage
// checks strike with the punch, which every defense takes in full, so they
// are about the depths and not about which class answers which stage.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_WINDOW, SERPENT_PHASES, SERPENT_WOUND, CLICK_DMG, CLASSES, DAMAGE_KIND, RESISTS, RESIST_K } from '../src/config.js';
import { clickDeep, clickDmg, strike, woundK, onBreak, scalesOf } from '../src/deep/serpent.js';
import { breaking, guardOf } from '../src/deep/phases.js';
import { spendScales } from '../src/deep/scales.js';
import { coilAt, bellySeg, bellyAt, deepFloor, spotX, deepTop } from '../src/deep/place.js';
import { now } from '../src/clock.js';
import { climb } from './party-press.mjs';

const S = yard.S;
const { deepBed } = await import('../src/state.js');

// A yard the serpent has come for. The snatch itself is snatch.test.mjs's
// subject; here it is the setup, and the sqwife it leaves on the deep's
// first job is taken off it, so every blow in these checks is the check's own.
function deepYard() {
  // The snatch's facts with no station: played, it stands the first one
  // with her fighting at it, and her blows would be in every number here.
  window.__deepCrew();
  S.portalOpen = true;
  window.__serpent({ stage: 0, wound: 0 });
}

// One frame, and the belly's segment where it is on it.
const frame = () => yard.fast(1 / 60);
const belly = () => bellyAt(now());
const clickBelly = () => { const p = belly(); return clickDeep(p.x, p.y); };

group('the wound opens under clicks on the coil and stands until the window ends', async () => {
  deepYard();
  S.mealT = 0; S.mealGo = null;
  const p = belly();
  const missed = clickDeep(p.x, deepFloor() - 2);
  const woundMissed = S.serpentWound;
  const punch = clickDmg(), clicks = 20;
  for (let i = 0; i < clicks; i++) clickBelly();
  const opened = S.serpentWound;
  run(3);
  const standing = S.serpentWound;
  run(SERPENT_WINDOW[0] + 45);
  return [
    ok(!missed && woundMissed === 0, 'a click on the floor is not a click on the serpent',
       `answered ${missed}, wound ${woundMissed}`),
    ok(Math.abs(opened - clicks * punch) < 1e-9, 'each click on the coil opens it a punch deeper',
       `wound ${opened}, ${clicks} punches of ${punch}`),
    ok(standing === opened, 'and nothing closes inside the window', `${opened} then ${standing} three seconds on`),
    ok(S.serpentWound === 0, 'and left alone the window ends and the meal closes it whole', `${S.serpentWound}`),
    ok(S.serpentStage === 0, 'and nothing broke', `stage ${S.serpentStage}`)
  ];
});

group("the click is always a punch, worth the first station's rung", async () => {
  deepYard();
  const bare = clickDmg();
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  climb(S.stations[0].id, 'brawler', 5);
  const fifth = clickDmg();
  clickBelly();
  const said = S.hits.find(h => h.weapon === 'punch');
  return [
    ok(bare === CLICK_DMG[0], 'with no station, the first rung', `${bare}`),
    ok(fifth === CLICK_DMG[5], "on the first station's fifth, the fifth", `${fifth}`),
    ok(said && said.done === CLICK_DMG[5] * guardOf('punch'), 'and it lands as a punch', JSON.stringify(said && said.done)),
    ok(S.serpentStun === 0, 'which never stuns', `${S.serpentStun}`)
  ];
});

group('a hand too slow for the window never breaks it, a fast one does inside one', async () => {
  deepYard();
  S.mealT = 0; S.mealGo = null;
  const punch = clickDmg(), depth = SERPENT_WOUND[0], win = SERPENT_WINDOW[0];
  // Slow: a third of the depth over a whole window, so each meal undoes it.
  const slowEvery = Math.max(1, Math.round(60 * punch * win / (depth / 3)));
  let most = 0;
  for (let f = 0; f < 60 * (win * 2 + 30); f++) {
    if (f % slowEvery === 0) clickBelly();
    frame();
    most = Math.max(most, S.serpentWound);
  }
  const slowStage = S.serpentStage, meals = S.meal;
  // Fast: the depth in half a window.
  S.mealT = 0; S.mealGo = null;
  window.__serpent({ stage: 0, wound: 0 });
  const fastEach = Math.ceil(depth / (win / 2) / (punch * 60));
  let frames = 0;
  while (S.serpentStage === 0 && frames < 60 * win) {
    for (let i = 0; i < fastEach; i++) clickBelly();
    frame();
    frames++;
  }
  return [
    ok(slowStage === 0 && most < depth, 'too slow, the stage stands', `stage ${slowStage}, deepest ${most.toFixed(0)} of ${depth}`),
    ok(meals > 0, 'and a meal has put it back whole', `${meals} meals`),
    ok(S.serpentStage === 1 && frames / 60 < win, 'fast enough, it breaks inside the window', `stage ${S.serpentStage} after ${(frames / 60).toFixed(1)}s`)
  ];
});

group('each defense breaks at its depth, in order, the last frees him, and every break is heard', async () => {
  deepYard();
  const seen = [S.serpentStage], bad = [], heard = [];
  const stop = onBreak(stage => heard.push(stage));
  const at = () => coilAt(bellySeg(), now());
  for (let stage = 0; stage < SERPENT_PHASES; stage++) {
    const depth = SERPENT_WOUND[stage];
    // A point short of the depth: the stage stands.
    strike('punch', depth - 1, at().x, at().y);
    frame();
    if (S.serpentStage !== stage) bad.push(`stage ${stage} broke short of its depth`);
    strike('punch', depth, at().x, at().y);
    if (S.serpentWound > depth) bad.push(`stage ${stage}'s wound went past its depth`);
    frame();
    seen.push(S.serpentStage);
    if (S.serpentStage !== stage + 1) bad.push(`stage ${stage} did not break at its depth`);
    if (S.serpentWound !== 0) bad.push(`stage ${stage + 1} began with a wound of ${S.serpentWound}`);
    // A break plays before the next defense can be touched: a blow in it
    // does nothing.
    if (stage < SERPENT_PHASES - 1) {
      if (!breaking()) bad.push(`stage ${stage + 1} opened without a break`);
      if (strike('punch', depth, at().x, at().y) !== 0) bad.push(`a blow landed in the break into stage ${stage + 1}`);
      runUntil(() => !breaking(), 10);
    }
  }
  const inOrder = seen.every((s, i) => i === 0 || s === seen[i - 1] + 1);
  run(5);
  stop();
  return [
    ok(bad.length === 0, 'every stage broke at its depth and not before', bad.join('; ')),
    ok(inOrder, 'one at a time, in order, never back', seen.join(' -> ')),
    ok(heard.join(' ') === Array.from({ length: SERPENT_PHASES }, (_, i) => i + 1).join(' '), 'and each break is heard once, with the stage it reached', heard.join(' ')),
    ok(S.serpentFreed && S.serpentStage === SERPENT_PHASES, 'and the last break opens the belly',
       `freed ${S.serpentFreed}, stage ${S.serpentStage}`),
    ok(S.serpentStage === SERPENT_PHASES && S.serpentWound === 0,
       'after which nothing goes back', `stage ${S.serpentStage}, wound ${S.serpentWound}`)
  ];
});

group('a hit is halved in the phase that resists its kind, and whole in the rest', async () => {
  deepYard();
  const bad = [];
  for (const [key, cls] of Object.entries(CLASSES)) {
    if (!cls.hit) continue;
    const got = [];
    for (let stage = 0; stage < SERPENT_PHASES; stage++) {
      window.__serpent({ stage, wound: 0 });
      const p = belly();
      got.push(strike(cls.hit, 100, p.x, p.y) / 100);
    }
    const want = RESISTS.map(r => (r[0] === DAMAGE_KIND[cls.hit] ? RESIST_K : 1));
    if (got.some((k, i) => k !== want[i])) bad.push(`${key} (${DAMAGE_KIND[cls.hit]}): ${got}`);
  }
  return [
    ok(bad.length === 0, 'by its kind, the fading as it opens', bad.join('; ')),
    ok(!('star' in DAMAGE_KIND) && !('beam' in DAMAGE_KIND) && !('lance' in DAMAGE_KIND), 'and no weapon rows are left')
  ];
});

// Follows particular scales from the hit to the floor, and a save writes the
// water down as nothing: the scales in it are this session's.
group('a hit sheds scales, and they lie on the floor until they are crushed', async () => {
  deepYard();
  const before = S.scales, bed = deepBed.n;
  const p = belly();
  const done = strike('punch', 500, p.x, p.y);
  const inWater = S.sinking.length, countedAtOnce = S.scales - before;
  const landed = runUntil(() => S.sinking.length === 0, 30);
  const nothing = strike('punch', 0, p.x, p.y);
  return [
    ok(done === 500 && inWater === scalesOf(500) && inWater > scalesOf(5) && inWater < 10,
       'a big blow knocks a few more loose than a small one, not one a unit of damage', `${done} done, ${inWater} in the water`),
    ok(countedAtOnce === 0, 'and none counted in the water', `${countedAtOnce}`),
    ok(landed && deepBed.n - bed === inWater, 'all of them lying on the bed once they land', `${deepBed.n - bed}`),
    ok(S.scales === before, 'and none of them is money until it is crushed', `${S.scales - before}`),
    ok(nothing === 0 && S.sinking.length === 0, 'a blow that did nothing sheds nothing', `${S.sinking.length}`)
  ];
}, { reload: false });

// Follows the flecks a payment sends up to their station.
group('paying lifts scales out of the crusher to the station that took them', async () => {
  deepYard();
  window.__scales(50);
  const laid = S.scales;
  const x = spotX('altar'), y = deepFloor() - 60;
  const paid = spendScales(20, x, y);
  const after = S.scales, rising = S.lifting.length;
  const tooMuch = spendScales(1000, x, y);
  const gone = runUntil(() => S.lifting.length === 0, 30);
  return [
    ok(laid === 50, 'fifty crushed', `${laid}`),
    ok(paid && after === 30, 'twenty paid out of the crusher', `${paid}, ${after} left`),
    ok(rising > 0 && rising <= 20, 'and they rise to the station', `${rising} in the water`),
    ok(!tooMuch && S.scales === 30, 'a bill the crusher cannot cover takes nothing', `${tooMuch}, ${S.scales}`),
    ok(gone, 'and the risen are gone at the station')
  ];
}, { reload: false });

group('a cold reload in the split comes back split, wounded and with its scales', async () => {
  deepYard();
  window.__serpent({ stage: 2, wound: 1234 });
  window.__scales(37);
  S.meal = 5; S.mealT = 2.5; S.mealGo = null;
  window.__cold();
  const back = { stage: S.serpentStage, wound: S.serpentWound, scales: S.scales, meal: S.meal, at: S.mealT };
  run(SERPENT_WINDOW[2] + 45);
  return [
    ok(back.stage === 2, 'the stage', `${back.stage}`),
    ok(back.wound === 1234, 'the wound', `${back.wound}`),
    ok(back.scales === 37, 'and the crushed scales', `${back.scales}`),
    ok(back.meal === 5 && back.at === 2.5, 'and the window where it was', `${back.meal} ${back.at}`),
    ok(S.serpentWound < 1234, 'and the fight goes on from there', `${S.serpentWound}`),
    ok(deepTop() < deepFloor(), 'the deep is where it was')
  ];
});
