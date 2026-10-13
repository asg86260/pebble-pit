// A click on one of the deep's creatures (DESIGN.md, "The deep's zones"):
// the birds' treatment. It shakes loose the bird's handful, which sinks as
// loose scales and is money only once a gatherer has carried it to the
// crusher; the creature bolts off the end of the deep a held pose at a time,
// and comes back in there a while later. Nothing pops out, nothing pops in,
// nothing is counted that no body carried.
//
// `startleFauna` is the call the pointer makes in the deep (input.js); the
// pointer's own way there is the browser tier's (selftest/deep.js).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { FAUNA_STARTLE, FAUNA_SCALES, BIRD_DUST, P } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { POPULATION, COLS, startleFauna, faunaUnder, faunaReport } from '../src/deep/fauna.js';
import { deepX0, deepTop, hopperRect } from '../src/deep/place.js';

const S = yard.S;
const gatherers = () => S.workers.filter(w => w.type === 'gatherer');

// The deep with one gatherer and nothing else to make scales: no fighter,
// so every scale on the floor is the creature's.
function deep() {
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  window.__view('deep');
  run(0.5);
}

// A creature well inside the deep, clear of both ends, to aim at; and clear
// of the crusher's hopper, where a scale let go falls straight in.
const target = () => {
  const h = hopperRect(), mid = h.x + h.w / 2;
  return faunaReport().find(f => !f.bolting && f.inside && f.cx > 40 && f.cx < COLS - 40 && Math.abs(f.x - mid) > P * 60);
};
// Its middle is in the deep, where a click can reach it.
const within = f => f.x > deepX0() && f.x < deepX0() + COLS * P;

// The click follows one creature and one handful for longer than the reload
// harness's five seconds, and a startle is this session's: a reload sends
// every creature home (checked below).
group('a click on a creature: it bolts off the deep in held poses, and its handful is carried to the crusher', async () => {
  deep();
  const f = target();
  const c = POPULATION[f.i];
  const scales = S.scales, lying = deepBed.n, sinking = S.sinking.length;
  const hit = startleFauna(f.x, f.y);
  const shaken = S.sinking.length - sinking;
  const from = S.sinking.slice(sinking).map(s => ({ x: s.x, y: s.y }));
  // Frame by frame until it is out past the end: never further in a frame
  // than one held pose's step.
  const step = Math.ceil(FAUNA_STARTLE.pace / FAUNA_STARTLE.rate) + 1;
  let was = faunaReport()[f.i], worst = 0, frames = 0, gone = false;
  while (frames < 60 * 30) {
    run(1 / 60); frames++;
    const now = faunaReport()[f.i];
    worst = Math.max(worst, Math.abs(now.cx - was.cx));
    was = now;
    if (!now.inside) { gone = true; break; }
  }
  // The scales land, and lie there until somebody comes for them.
  const landed = runUntil(() => S.sinking.length === sinking, 30);
  const onFloor = deepBed.n - lying, banked = S.scales - scales;
  // A gatherer swims out for them and carries them over.
  let carried = 0;
  for (let i = 0; i < 60 * 90 && S.scales - scales < shaken; i++) {
    run(1 / 60);
    carried = Math.max(carried, ...gatherers().map(w => w.carry || 0));
  }
  return [
    ok(hit, 'the click landed on it', `${f.kind} at ${Math.round(f.x)},${Math.round(f.y)}`),
    ok(FAUNA_SCALES === BIRD_DUST && shaken === FAUNA_SCALES, "it shakes loose the bird's handful", `${shaken} of ${FAUNA_SCALES}`),
    ok(from.every(s => Math.abs(s.x - f.x) <= P && Math.abs(s.y - f.y) <= P), 'from where it was', from.map(s => `${Math.round(s.x)},${Math.round(s.y)}`).join(' ')),
    ok(gone, 'it leaves the deep', `${frames} frames, at ${was.cx}`),
    ok(worst <= step, 'a held pose at a time, never a jump', `${worst} cells in a frame, ${step} at most`),
    ok(c.t0 >= 0, 'and it is away, not gone for good'),
    ok(landed && onFloor >= shaken, 'the handful sinks to the floor', `${onFloor} lying`),
    ok(banked === 0, 'none of it is counted while it lies there', `${banked}`),
    ok(carried > 0, 'a gatherer carries it', `${carried} at most in arms`),
    ok(S.scales - scales >= shaken, 'and it is counted once it reaches the crusher', `${S.scales - scales}`)
  ];
}, { reload: false });

group('a click on empty water does nothing', async () => {
  deep();
  // A spot of the deep no creature is near.
  let spot = null;
  for (let gx = 10; gx < COLS - 10 && !spot; gx += 7) for (let gy = 4; gy < 120 && !spot; gy += 5) {
    const x = deepX0() + gx * P, y = deepTop() + gy * P;
    if (!faunaUnder(x, y)) spot = { x, y };
  }
  const sinking = S.sinking.length, before = faunaReport().map(f => f.bolting);
  const hit = startleFauna(spot.x, spot.y);
  return [
    ok(!hit, 'no creature there, nothing startled'),
    ok(S.sinking.length === sinking, 'and no scales shaken loose', `${S.sinking.length - sinking}`),
    ok(faunaReport().every((f, i) => f.bolting === before[i]), 'and nobody bolts')
  ];
});

// One creature followed from the click through its swim back in.
group('the startled come back: in at the end they left, swimming, and clickable again', async () => {
  deep();
  const f = target();
  startleFauna(f.x, f.y);
  const c = POPULATION[f.i];
  const step = Math.ceil(FAUNA_STARTLE.pace / FAUNA_STARTLE.rate) + 1;
  let was = faunaReport()[f.i], worst = 0, back = false;
  for (let i = 0; i < 60 * 180 && !back; i++) {
    run(1 / 60);
    const now = faunaReport()[f.i];
    // inside the deep, never a jump; out past its ends it may wait anywhere
    if (now.inside && was.inside) worst = Math.max(worst, Math.abs(now.cx - was.cx));
    back = !now.bolting && within(now);
    was = now;
  }
  const r = faunaReport()[f.i];
  const again = back && startleFauna(r.x, r.y);
  return [
    ok(back, 'it swims back into the deep', `${c.kind}, back at ${c.back.toFixed(1)}s`),
    ok(worst <= step, 'never jumping inside it', `${worst} cells in a frame`),
    ok(again, 'and can be startled again')
  ];
}, { reload: false });

group('a startle is not saved: read back, every creature is home', async () => {
  deep();
  const f = target();
  startleFauna(f.x, f.y);
  run(0.5);
  const away = faunaReport()[f.i].bolting;
  window.__reload();
  return [
    ok(away, 'it was bolting'),
    ok(faunaReport().every(r => !r.bolting) && POPULATION.every(c => c.t0 < 0), 'and after the reload nobody is')
  ];
}, { reload: false });
