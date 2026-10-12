// The first trip down (DESIGN.md, "The first trip down"): the free first
// station stands from the snatch with her at it, and the first arrival in the
// deep -- the ripple done -- is a scene that owns the camera: him in the cage,
// her at the portal, her charge and her first blow, and the deep handed back
// with her at her own station. Once, ever. The trip down is taken the way the
// portal's click takes it (`goDeep`), the portal itself conjured by the
// snatch's setup hook, which is not what these checks are about.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, VIEW_GLIDE_S, SKIP_HOLD_MS, ABYSS_MAX_S } from '../src/config.js';
import { goDeep, goUp } from '../src/view.js';
import { belowYard } from '../src/route.js';
import { fighterAt, stationById } from '../src/deep/party.js';
import { slotX, segAbove, coilAt } from '../src/deep/place.js';
import { barShown } from '../src/render/serpentbar.js';
import { holdSkip } from '../src/skip.js';
import { migrate } from '../src/migrations/index.js';
import { now } from '../src/clock.js';

const KEY = 'boulder-clicker/v4';
const done = () => S.beatsDone.includes('abyss');
const playing = () => S.beat.camera === 'abyss';
const her = () => fighterAt(S.stations[0]);

// A yard past the snatch, played the way the story plays it, and her down
// and out of her fall.
function afterSnatch() {
  window.__crew(0, 3);
  window.__snatch({ played: true });
  runUntil(() => her() && !her().falling, 30);
}

// At her own station's work: up under the coil over it, swinging.
function atWork(w) {
  if (!w) return false;
  const st = stationById(w.station), t = now();
  if (!st) return false;
  const p = coilAt(segAbove(slotX(st.slot), t), t);
  return w.goal === 'fight' && Math.abs(w.x + WORKER / 2 - p.x) < WORKER * 2;
}

// Frame by frame until `until`, with the furthest any deep body moved in one
// frame and whether the scene ever held the bar and the card off.
function watch(until, limit = 60 * 40) {
  let jump = 0, barWhile = false;
  const at = new Map();
  for (let f = 0; f < limit; f++) {
    for (const w of S.workers.filter(belowYard)) {
      const was = at.get(w.uid);
      if (was) jump = Math.max(jump, Math.hypot(w.x - was.x, w.y - was.y));
      at.set(w.uid, { x: w.x, y: w.y });
    }
    if (playing() && S.abyss && S.abyss.freeAt == null && barShown()) barWhile = true;
    if (until()) return { there: true, jump, barWhile, f };
    run(1 / 60);
  }
  return { there: false, jump, barWhile };
}

const down = () => { goDeep(); run(VIEW_GLIDE_S + 0.1); };

group('the free first station stands from the snatch, her at it, before anyone goes down', async () => {
  afterSnatch();
  const st = S.stations[0];
  runUntil(() => her() && her().goal === 'fight', 30);
  return [
    ok(st && st.built && S.stations.length === 1 && S.stationsBuilt === 1, 'one station stands, built', JSON.stringify(st)),
    ok(st && st.kind === null && st.rung === 0, 'a Recruit, its first choice still to make'),
    ok(her() && belowYard(her()) && her().station === st.id && her().type === 'fighter', 'and she is its fighter'),
    ok(S.view === 'yard' && !done(), 'with nobody down there yet to see it'),
    ok(her() && her().goal === 'fight', 'she fights from the start, unseen', her() && her().goal)
  ];
});

group('the first trip down plays the scene once, and she ends at her own station having struck', async () => {
  afterSnatch();
  const name = her().name;
  goDeep();
  const before = S.beat.camera;
  run(VIEW_GLIDE_S + 0.1);
  const started = playing() && !!S.abyss;
  const wound0 = S.serpentWound;
  const phases = new Set();
  const trip = watch(() => { if (S.abyss) phases.add(S.abyss.phase); return done() && !playing(); });
  const struck = S.serpentWound > wound0 || S.serpentStage > 0;
  const bar = barShown();
  runUntil(() => atWork(her()), 10);
  const after = her() && her().name === name && atWork(her());
  const where = JSON.stringify({ goal: her()?.goal, x: Math.round(her()?.x) });
  goUp();
  run(VIEW_GLIDE_S + 1);
  goDeep();
  run(VIEW_GLIDE_S + 0.1);
  const again = playing();
  return [
    ok(before === null, 'not while the ripple plays', `${before}`),
    ok(started, 'the scene starts as the ripple ends'),
    ok(trip.there && done(), 'and plays through to the end', JSON.stringify({ ...trip, phases: [...phases] })),
    ok(['push', 'call', 'wide', 'charge', 'blow'].every(p => phases.has(p)), 'in its five beats', [...phases].join()),
    ok(!trip.barWhile, 'the serpent\'s bar off while it has the camera'),
    ok(bar, 'and back once it lets go'),
    ok(struck, 'her blow lands, one of her own', `${wound0} -> ${S.serpentWound}`),
    ok(after, 'she is at her own station\'s work after', where),
    ok(trip.jump < WORKER, 'nothing teleports: a stroke or a stride a frame', `${trip.jump.toFixed(1)}px`),
    ok(!again, 'a second trip down plays nothing'),
    ok(S.beatsDone.filter(k => k === 'abyss').length === 1, 'and it is had once')
  ];
});

group('a held space bar skips it: the camera lets go, and she swims to her station', async () => {
  afterSnatch();
  down();
  run(1.5);
  const mid = playing();
  holdSkip(true);
  const trip = watch(() => !playing(), 60 * 5);
  holdSkip(false);
  const skipped = done();
  const back = watch(() => atWork(her()), 60 * 20);
  return [
    ok(mid, 'the scene was playing'),
    ok(trip.there && skipped && trip.f <= (SKIP_HOLD_MS / 1000 + 2) * 60, 'the hold ends it and lets the camera go', JSON.stringify(trip)),
    ok(back.there, 'she ends at her own station', JSON.stringify(back)),
    ok(Math.max(trip.jump, back.jump) < WORKER, 'swum there, never a jump', `${Math.max(trip.jump, back.jump).toFixed(1)}px`)
  ];
});

group('a click in the deep is a blow, not a skip', async () => {
  afterSnatch();
  down();
  run(0.5);
  const skipped = window.__nocine();
  return [
    ok(playing() && !skipped, 'the click leaves the scene playing')
  ];
});

group('a reload mid-scene picks it up, and it still plays once', async () => {
  afterSnatch();
  down();
  runUntil(() => S.abyss && S.abyss.phase === 'call', 5);
  const phase = S.abyss && S.abyss.phase;
  const w = her().name;
  window.__reload();
  run(1 / 60);
  const owed = playing() && S.abyss && S.abyss.phase === phase;
  const trip = watch(() => done() && !playing());
  runUntil(() => atWork(her()), 10);
  return [
    ok(phase === 'call', 'the save was taken in the middle of it', `${phase}`),
    ok(owed, 'the reload has it playing still, where it stood', JSON.stringify(S.abyss && S.abyss.phase)),
    ok(trip.there && S.beatsDone.filter(k => k === 'abyss').length === 1, 'and it plays out, once'),
    ok(her() && her().name === w && atWork(her()), 'with her at her station after')
  ];
});

group('an old save past the snatch with no station gets the free one, and has its first trip', async () => {
  afterSnatch();
  window.__view('yard');
  run(1);
  yard.persist();
  const raw = JSON.parse(localStorage.getItem(KEY));
  raw.stations = [];
  raw.stationsBuilt = 0;
  raw.saveV = 14;
  localStorage.setItem(KEY, JSON.stringify(raw));
  yard.restore();
  run(1 / 60);
  const st = S.stations[0];
  const seated = runUntil(() => her() && her().goal === 'fight', 30);
  down();
  const plays = playing();
  // And one that had been down -- a station laid, which only the deep sells.
  const been = { saveV: 14, snatched: true, stations: [{ id: 's1', kind: 'altar', slot: 0, built: true }], beatsDone: [] };
  migrate(been);
  return [
    ok(st && st.built && st.id === 's1' && st.kind === null, 'the free station stands on the load', JSON.stringify(st)),
    ok(seated && her().station === 's1', 'and she swims to it as its fighter'),
    ok(plays, 'the first trip down still has its scene'),
    ok(been.beatsDone.includes('abyss') && been.stations.length === 1, 'a save that has been down has had it')
  ];
});

group('the scene never outruns its ceiling', async () => {
  afterSnatch();
  down();
  const over = watch(() => !playing(), 60 * (ABYSS_MAX_S + 3));
  return [ok(over.there, 'it ends', JSON.stringify(over))];
});
