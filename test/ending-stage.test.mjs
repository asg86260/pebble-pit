// The ending's stage (stage.js, render/recede.js): while the rescue under the
// dome and the snatch at the plank hold the yard, nobody but the pair is
// drawn -- the rest of the crew fade out where they are and carry on with
// their day -- nobody teleports, and everybody is drawn again after. And no
// rock comes down from the rescue to the end of the snatch (`endingHolds` in
// core.js), a reload in the middle included.
//
// The dome is bought through its row and the rescue rock caught by it, as a
// player has it; the three shields before it are marked answered, which
// shield.test.mjs walks through on its own.
import { group, ok, run, runUntil, state } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, PROP_FROM, DOME_BILL, ARCH_COST, NET_COST, ABYSS_AT } from '../src/config.js';
import { boulderAlive } from '../src/rock.js';
import { outOfYard } from '../src/crew/records.js';
import { setZoom } from '../src/world.js';
import { mouthX } from '../src/deep/place.js';
import { stand } from '../src/crew/body.js';
import { bodyInk, setPass } from '../src/render/recede.js';
import { roleOf } from '../src/stage.js';

// A desk's window, not the node yard's narrow one.
const wide = on => { S.W = on ? 1920 : 800; setZoom(1); };

const did = key => S.beatsDone.includes(key);
const onYard = w => !outOfYard(w) && !w.craft && !w.floating && w.homeward == null;
// How much of a body the picture has: the receding pass and the front pass
// together, as render.js paints them.
const ink = w => { setPass('back'); const b = bodyInk(w); setPass('front'); const f = bodyInk(w); setPass('back'); return Math.max(b, f); };

// Frame by frame until `until`: the frames the yard was held all the way,
// and on those, the most bystanders the picture still had; the longest step
// any body on the yard took in one frame (a body known by name: the harness
// reads the yard back every five seconds and stands each one up afresh).
function watch(until, limit) {
  let held = 0, shown = 0, jump = 0, who = '';
  const was = new Map();
  for (let f = 0; f < limit && !until(); f++) {
    run(1 / 60);
    for (const w of S.workers) {
      if (!onYard(w) || w.falling) { was.delete(w.name); continue; }
      const p = was.get(w.name);
      if (p != null && Math.abs(w.x - p) > jump) { jump = Math.abs(w.x - p); who = `${w.name} ${w.type}`; }
      was.set(w.name, w.x);
    }
    if (S.hushOn && S.hush >= 1) {
      held++;
      shown = Math.max(shown, S.workers.filter(w => onYard(w) && roleOf(w) === 'by' && ink(w) > 0).length);
    }
  }
  return { held, shown, jump, who };
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
  // The gifts above overflow the hole into the rift; a yard that reaches the
  // rescue undrowned is what this is about, so it stays short of the drowning.
  S.riftAte = Math.min(S.riftAte || 0, ABYSS_AT / 2);
  S.quarryOpen = S.farmOpen = S.towerOpen = S.meteorOpen = true;
  window.__meteor();
  run(1);
};

group('the rescue shows the two of them, the crew fade back after, and no rock comes until the snatch is over', async () => {
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
  // Meanwhile the crew are drawn again: the yard is back in full.
  const gone = !boulderAlive() && !S.rockHeld && !S.rockFall;
  let early = false, reloaded = false, back = false;
  for (let f = 0; f < 60 * 240 && !(did('snatch') && !S.beat.camera); f++) {
    run(1 / 60);
    if (!back && !S.beat.yard && S.hush === 0 && S.workers.every(w => ink(w) === 1)) back = true;
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
    ok(scene.held > 0 && rescued, 'the rescue plays, the yard held around it', `held ${scene.held} frames`),
    ok(scene.shown === 0, 'nobody but the pair is drawn once it holds', `${scene.shown} bystanders drawn`),
    ok(scene.jump < WORKER, 'and nobody teleports', `${scene.jump.toFixed(1)}px a frame, ${scene.who}`),
    ok(back, 'and the crew are drawn again after'),
    ok(reloaded && over, 'the story runs on through the drowning and the snatch, a reload in the middle', `reloaded ${reloaded} drown ${did('drown')} tear ${did('tear')} ending ${did('ending')} snatch ${did('snatch')} cam ${S.beat.camera} yard ${S.beat.yard} sheet ${S.beat.sheet} drowned ${S.drowned}`),
    ok(!early, 'no rock comes down until the snatch is over'),
    ok(next, 'and then the next one does', `rock ${S.boulderNo}, want > ${rock}`)
  ];
});

group('the snatch shows the pair at the plank, and the crew fade back after', async () => {
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
  let openedOnCrowd = false;
  const scene = watch(() => {
    if (S.snatch && S.snatch.phase === 'open' && S.workers.some(w => onYard(w) && roleOf(w) === 'by' && ink(w) > 0)) openedOnCrowd = true;
    return did('snatch') && !S.beat.camera;
  }, 60 * 120);
  const back = runUntil(() => S.hush === 0 && S.workers.every(w => ink(w) === 1), 10);
  wide(false);
  return [
    ok(started, 'the snatch plays'),
    ok(scene.held > 0, 'with the yard held around it', `held ${scene.held} frames`),
    ok(scene.shown === 0, 'nobody but the pair is drawn once it holds', `${scene.shown} bystanders drawn`),
    ok(scene.jump < WORKER, 'and nobody teleports', `${scene.jump.toFixed(1)}px a frame, ${scene.who}`),
    ok(!openedOnCrowd, 'the portal opens on a clear frame'),
    ok(back, 'and the crew are drawn again after')
  ];
});
