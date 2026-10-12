// The ending's stage (stage.js): while the rescue under the dome and the
// snatch at the plank play, nobody but the pair stands in the scene's frame
// for longer than it takes to walk out of it, and everybody walks back to
// work after. And no rock comes down from the rescue to the end of the
// snatch (`endingHolds` in core.js), a reload in the middle included.
//
// The dome is bought through its row and the rescue rock caught by it, as a
// player has it; the three shields before it are marked answered, which
// shield.test.mjs walks through on its own.
import { group, ok, run, runUntil, state } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, COMMUTE_PACE, PROP_FROM, DOME_BILL, ARCH_COST, NET_COST } from '../src/config.js';
import { stageZone } from '../src/stage.js';
import { boulderAlive } from '../src/rock.js';
import { outOfYard } from '../src/crew/records.js';
import { setZoom } from '../src/world.js';
import { mouthX } from '../src/deep/place.js';
import { stand } from '../src/crew/body.js';

// A desk's window, not the node yard's narrow one: the frame a scene pulls
// in to is a share of the window, and the crew have to walk out of it.
const wide = on => { S.W = on ? 1920 : 800; setZoom(1); };

const did = key => S.beatsDone.includes(key);
const leads = w => !!(w.met || w.dig);
const onStage = (z, w) => !leads(w) && !outOfYard(w) && !w.craft && !w.floating
  && w.homeward == null && w.x + WORKER > z.from && w.x < z.to;

// Frame by frame until `until`: for every body, the longest run of frames it
// stood in the frame while a scene had the stage, against the frames a walk
// from the frame's middle to its edge takes at the slowest pace anybody
// crosses the yard at, and a second for the turn. Bodies are known by name:
// the harness reads the yard back every five seconds and stands each one up
// afresh.
function watch(until, limit) {
  const runs = new Map();
  let worst = 0, allowed = 0, staged = 0, wasStaged = false, endedAt = -1;
  for (let f = 0; f < limit && !until(); f++) {
    run(1 / 60);
    const z = stageZone();
    if (!z) { if (wasStaged && endedAt < 0) endedAt = f; runs.clear(); continue; }
    wasStaged = true;
    staged++;
    allowed = Math.max(allowed, Math.ceil((z.to - z.from) / 2 / COMMUTE_PACE) + 60);
    for (const w of S.workers) {
      const n = onStage(z, w) ? (runs.get(w.name) || 0) + 1 : 0;
      runs.set(w.name, n);
      worst = Math.max(worst, n);
    }
  }
  return { worst, allowed, staged };
}

const domeYard = () => {
  window.__reset();
  window.__crew(4, 8, 0, 0, 0, 1);         // a busy yard, and one who can fly
  window.__jump(PROP_FROM);
  window.__give(60000);
  window.__grant({ shards: ARCH_COST * 3, spores: NET_COST * 3 });
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n * 3);
    else window.__grant({ [money + 's']: n * 3 });
  }
  window.__answered('props', 'net', 'arch');
  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
  window.__meteor();
  run(1);
};

group('the rescue shows the two of them, the crew walk back after, and no rock comes until the snatch is over', async () => {
  domeYard();
  const bought = window.__buy('dome');
  const cast = runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 300);
  wide(true);
  window.__next();                           // the rock goes, and the next is the rescue rock
  const rock = S.boulderNo + 1;
  // Frame by frame: the dome holds it for a beat, then bursts it.
  let caught = false;
  for (let f = 0; f < 60 * 60 && !caught; f++) { run(1 / 60); caught = S.rockHeld; }
  const scene = watch(() => S.rescued && !S.beat.yard, 60 * 120);
  const rescued = S.rescued && did('rescue');
  // The rescue rock burst on the dome, and nothing in the sky behind it for
  // the rest of the story: the sheet, the tearing, the drowning, the snatch.
  // Meanwhile the crew walk back: nobody is left stood off.
  const gone = !boulderAlive() && !S.rockHeld && !S.rockFall;
  let early = false, reloaded = false, back = false;
  for (let f = 0; f < 60 * 240 && !(did('snatch') && !S.beat.camera); f++) {
    run(1 / 60);
    if (!back && !S.beat.yard && !S.workers.some(w => w.offStage)) back = true;
    // Asked at the end of the frame: the rock may come on the frame it ends.
    if (!(did('snatch') && !S.beat.camera) && (boulderAlive() || S.rockFall > 0 || S.boulderNo > rock)) early = true;
    // A save in the middle of it, read back: still nothing comes down.
    if (!reloaded && did('drown')) { window.__reload(); reloaded = true; }
  }
  const over = did('snatch') && !S.beat.camera;
  const next = runUntil(() => S.boulderNo > rock, 30);
  wide(false);
  return [
    ok(bought && cast && caught && gone, 'the dome is bought, cast, and catches and bursts the rescue rock', `${bought} ${cast} ${caught} ${gone}`),
    ok(scene.staged > 0 && rescued, 'the rescue plays with its stage', `staged ${scene.staged} frames`),
    ok(scene.worst <= scene.allowed, 'nobody but the pair stands in its frame longer than the walk out',
       `worst ${scene.worst} frames, allowed ${scene.allowed}`),
    ok(back, 'and the crew walk back to work after'),
    ok(reloaded && over, 'the story runs on through the drowning and the snatch, a reload in the middle', `reloaded ${reloaded} drown ${did('drown')} tear ${did('tear')} ending ${did('ending')} snatch ${did('snatch')} cam ${S.beat.camera} yard ${S.beat.yard} sheet ${S.beat.sheet} drowned ${S.drowned}`),
    ok(!early, 'no rock comes down until the snatch is over'),
    ok(next, 'and then the next one does', `rock ${S.boulderNo}, want > ${rock}`)
  ];
});

group('the snatch shows the pair at the plank, and the crew walk back after', async () => {
  window.__reset();
  window.__crew(4, 10);
  run(1);
  window.__rift();                           // the hole ate its fill and gave way
  S.rescued = true; S.buried = false;        // and then the sqwife walked out
  run(1 / 60);
  wide(true);
  // A crowd at the plank as it begins: the haulers stood along the near
  // edge of the hole, which is the setup and not the thing checked.
  S.workers.filter(w => w.type === 'hauler').forEach((w, i) => {
    w.x = mouthX() - 120 - i * 18; w.y = stand(w); w.route = null;
  });
  window.__skipBeat('sheet');                // the button
  const started = runUntil(() => S.beat.yard === 'snatch', 10);
  // Who was standing in the frame as it began, for the portal's wait.
  const z0 = stageZone();
  const crowd = z0 ? S.workers.filter(w => onStage(z0, w)).length : 0;
  let openedOnCrowd = false;
  const runs = watch(() => {
    const z = stageZone();
    if (z && S.snatch && S.snatch.phase === 'open' && S.workers.some(w => onStage(z, w))) openedOnCrowd = true;
    return did('snatch') && !S.beat.camera;
  }, 60 * 120);
  const back = runUntil(() => !S.workers.some(w => w.offStage), 10);
  wide(false);
  return [
    ok(started, 'the snatch plays'),
    ok(runs.staged > 0, 'with its stage', `staged ${runs.staged} frames, ${crowd} in the frame at the start`),
    ok(runs.worst <= runs.allowed, 'nobody but the pair stands in its frame longer than the walk out',
       `worst ${runs.worst} frames, allowed ${runs.allowed}`),
    ok(!openedOnCrowd, 'the portal opens on a clear frame'),
    ok(back, 'and the crew are back on their jobs after')
  ];
});
