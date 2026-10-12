// Held still, letterboxed (cutscene.js `stepHush`, stage.js, render/recede.js).
// While a scene holds the yard, the bands are up and only then; the
// bystanders fade out and nobody teleports; the rock's gang stop where they
// are and hold their swing, and pick the work up after; and the yard's
// takings over a scene are a skipped scene's, less the gang's pause and
// nothing else.
//
// The scene is the first muck, reached the way a player reaches it: a dirty
// sky, the yard's own storm, and the first body that goes for its muck.
import { group, ok, run, runUntil, state, makeItRain, reloads } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, CELL } from '../src/config.js';
import { outOfYard } from '../src/crew/records.js';
import { bodyInk, setPass, bandCells, hudInk } from '../src/render/recede.js';
import { roleOf } from '../src/stage.js';

const onYard = w => !outOfYard(w) && !w.craft && !w.floating && w.homeward == null;
const ink = w => { setPass('back'); const b = bodyInk(w); setPass('front'); const f = bodyInk(w); setPass('back'); return Math.max(b, f); };
const bands = () => Math.round(S.hush * bandCells());
const mined = () => S.workers.reduce((n, w) => n + (w.mined || 0), 0);

// Two of the gang on the rock and three haulers, a filthy sky, the storm let
// run out, and then the yard to its own clear-up until the scene starts.
function toTheMuck() {
  window.__crew(2, 3);
  run(3);
  makeItRain();
  runUntil(() => !state().smog.raining, 120);
  for (let i = 0; i < 600 && S.beat.camera !== 'firstmuck'; i++) run(0.1);
  return S.beat.camera === 'firstmuck';
}

group('the first muck: the bands only while it holds, the haulers faded, the gang held and back at work after', async () => {
  const started = toTheMuck();
  let bandsOff = 0, full = 0, shown = 0, jump = 0, who = '', gangMoved = 0, gangSwung = 0, heldFrames = 0;
  let hudLeft = 0, hudStep = 0, hudWas = hudInk(), hudLow = 1, hudAt = '', seenReloads = reloads;
  const was = new Map();
  let gang0 = null;
  for (let f = 0; f < 60 * 30 && (S.beat.camera || S.hush > 0); f++) {
    run(1 / 60);
    // the bands: up only while a beat has the camera, its way out included
    if (bands() > 0 && !S.beat.camera) bandsOff++;
    if (bands() === bandCells()) full++;
    // the yard's reading: faded on the recede's own number, never popped --
    // across a frame, which the harness's reload is not
    const fresh = reloads !== seenReloads;
    seenReloads = reloads;
    if (!fresh && Math.abs(hudInk() - hudWas) > hudStep) {
      hudStep = Math.abs(hudInk() - hudWas);
      hudAt = `frame ${S.tick}, ${hudWas.toFixed(2)} to ${hudInk().toFixed(2)}, camera ${S.beat.camera}`;
    }
    hudWas = hudInk();
    hudLow = Math.min(hudLow, hudWas);
    for (const w of S.workers) {
      if (!onYard(w) || w.falling) { was.delete(w.name); continue; }
      const p = was.get(w.name);
      if (p != null && Math.abs(w.x - p) > jump) { jump = Math.abs(w.x - p); who = `${w.name} ${w.type}`; }
      was.set(w.name, w.x);
    }
    if (S.hushOn && S.hush >= 1) {
      heldFrames++;
      if (hudInk() > 0) hudLeft++;
      shown = Math.max(shown, S.workers.filter(w => onYard(w) && roleOf(w) === 'by' && ink(w) > 0).length);
      const gang = S.workers.filter(w => roleOf(w) === 'held');
      gang0 ??= new Map(gang.map(w => [w.name, { x: w.x, mined: w.mined || 0 }]));
      for (const w of gang) {
        const g = gang0.get(w.name);
        if (!g) continue;
        if (Math.abs(w.x - g.x) > 1) gangMoved++;
        if ((w.mined || 0) !== g.mined) gangSwung++;
      }
    }
  }
  const after = mined();
  run(10);
  const back = mined() > after;
  const bandsAfter = bands();
  return [
    ok(started, 'the first muck plays'),
    ok(full > 0 && heldFrames > 0, 'the bands step all the way in while it holds', `${full} frames at full, ${heldFrames} held`),
    ok(bandsOff === 0 && bandsAfter === 0, 'and are never up with no scene behind them', `${bandsOff} frames, ${bandsAfter} after`),
    ok(bandCells() * CELL >= 0.08 * S.H, 'and stand a share of the window deep', `${bandCells()} cells on ${S.H}px`),
    ok(hudLow === 0 && hudLeft === 0 && hudInk() === 1, 'the counter, the rosters and the pile marks are gone while it holds, and back after',
       `${hudLeft} held frames with any, lowest ${hudLow}, ${hudInk()} after`),
    ok(hudStep < 0.05, 'and fade rather than pop', `${hudStep.toFixed(3)} a frame at most, ${hudAt}`),
    ok(shown === 0, 'no bystander is drawn once it holds', `${shown}`),
    ok(jump < WORKER, 'nobody teleports', `${jump.toFixed(1)}px a frame, ${who}`),
    ok(gang0 && gang0.size > 0 && gangMoved === 0 && gangSwung === 0, 'the gang stand still and land nothing while it holds',
       `${gang0 && gang0.size} held, moved ${gangMoved}, swung ${gangSwung}`),
    ok(back, 'and are back at the rock after', `${after} mined, then more`)
  ];
});

// The same yard twice from the same seed: once with the scene played, once
// with it skipped on its first frame. Over the scene and ten seconds after,
// the played yard banks no more than the skipped one, and no less than the
// skipped one less what the gang would have mined while they stood -- their
// pace in the skipped yard times the seconds they were held -- and a grain's
// slack. That pause is the scene's honest difference: the work waits and
// picks up again, nothing is made and nothing is lost.
group('a scene costs the yard the gang\'s pause and nothing else', async () => {
  const measure = skip => {
    window.__seed(20261012);
    const started = toTheMuck();
    if (skip) window.__skipBeat('camera');
    const m0 = mined(), s0 = S.stored;
    let held = 0, t = 0;
    for (; t < 60 * 40 && (S.beat.camera || S.hush > 0 || t < 60 * 12); t++) { run(1 / 60); if (S.hushOn) held++; }
    run(10);
    return { started, mined: mined() - m0, stored: S.stored - s0, held: held / 60, secs: t / 60 + 10 };
  };
  const played = measure(false), skipped = measure(true);
  const pace = skipped.mined / skipped.secs;
  const owed = pace * played.held;
  const gap = skipped.mined - played.mined;
  return [
    ok(played.started && skipped.started, 'the scene comes up in both yards'),
    ok(played.held > 1 && skipped.held < played.held, 'played, the yard is held; skipped, hardly',
       `${played.held.toFixed(1)} s against ${skipped.held.toFixed(1)} s`),
    ok(gap >= -2, 'the played yard mines no more than the skipped one', `played ${played.mined}, skipped ${skipped.mined}`),
    ok(gap <= owed * 1.5 + 4, 'and no less than the gang\'s pause owes',
       `short ${gap}, the pause owes ${owed.toFixed(1)} (${pace.toFixed(2)} a second for ${played.held.toFixed(1)} s)`),
    ok(played.stored <= skipped.stored + 4 && skipped.stored - played.stored <= owed * 1.5 + 8,
       'and banks the same, less the pause', `played ${played.stored}, skipped ${skipped.stored}`)
  ];
});
