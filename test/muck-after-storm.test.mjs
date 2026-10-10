// Muck waits for the storm, and the first muck is a scene.
//
// Nobody goes for the weather's muck while a storm is still putting it down;
// once the last dirty drop is in, the yard's own clear-up goes for it as it
// always did. And the first time that happens, ever, the camera goes to the
// body that went: a "?", the yuck, the shovel, the cell gone, the camera
// back. With nobody whose job it is, one of the rock's gang is sent for it
// and walks back. DESIGN.md, "Muck waits for the storm" and "The first
// muck's scene".
import { yard, group, ok, state, run, makeItRain } from './helpers.mjs';
import { P, WORKER, CUT_MUCK_MAX_S } from '../src/config.js';
import { S } from '../src/state.js';
import { muckCols, muckOpen, onOpenYard } from '../src/smog.js';
import { rockLeft } from '../src/world.js';
import { TYPE } from '../src/jobs.js';

const weatherClaims = () => S.workers.filter(w => w.muckAt != null && (muckCols()[w.muckAt] || 0) > 0);
// frame by frame until `done`, at most `limit` game seconds; the seconds taken
const frames = (done, limit) => {
  for (let i = 0; i < limit * 60; i++) { run(1 / 60); if (done()) return (i + 1) / 60; }
  return null;
};
// the storm over and the last of it landed
const stormOver = () => !S.raining && muckOpen();
// a few cells of muck on the open yard, somewhere off the haulers' feet
const layYard = () => {
  const m = muckCols();
  let laid = 0;
  for (let c = 40; c < m.length && laid < 6; c++) if (onOpenYard(c)) { m[c] = 1; laid++; }
  window.__muckSet(c => m[c]);
  return laid;
};

group('nobody goes for the muck while the storm is falling', async () => {
  window.__reset();
  window.__crew(0, 3);
  run(2);
  layYard();
  const before = frames(() => weatherClaims().length > 0, 10) != null;
  makeItRain();
  run(2);                                   // into the drizzle: every claim let go
  let during = 0, muckGoal = 0;
  frames(() => {
    during = Math.max(during, weatherClaims().length);
    muckGoal = Math.max(muckGoal, S.workers.filter(w => w.type === TYPE.HAUL && w.goal === 'muck').length);
    return !S.raining;
  }, 120);
  const dirtyLeft = S.raining || !muckOpen();
  frames(stormOver, 20);
  const after = frames(() => weatherClaims().length > 0, 20) != null;
  const left = muckCols().reduce((n, v) => n + v, 0);
  frames(() => muckCols().every(v => !v), 90);
  const cleared = muckCols().reduce((n, v) => n + v, 0);
  return [
    ok(before, 'with no storm, the haulers go for muck on the yard'),
    ok(during === 0 && muckGoal === 0, 'while it rains, nobody holds a claim on the muck',
       `${during} claims, ${muckGoal} haulers on a muck errand`),
    ok(after, 'once the last drop is down, a hauler goes for it', dirtyLeft ? 'tail still falling at the end of the pour' : ''),
    ok(cleared < left, 'and shifts it', `${left} -> ${cleared} cells`)
  ];
});

group('the first muck is a scene, once, on whoever goes for it', async () => {
  window.__reset();
  window.__crew(0, 3);
  run(2);
  makeItRain();
  frames(stormOver, 120);
  const laid = muckCols().some(v => v > 0);
  let said = new Set(), who = null, col = null, claimed = false;
  const took = frames(() => S.beat.camera === 'firstmuck', 30);
  if (S.muckScene) {
    who = S.muckScene.uid; col = S.muckScene.col;
    const w = S.workers.find(o => o.uid === who);
    claimed = !!w && w.muckAt === col;
  }
  const len = frames(() => {
    const w = S.workers.find(o => o.uid === who);
    if (w && w.say) said.add(w.say.mark);
    return !S.beat.camera;
  }, CUT_MUCK_MAX_S + 3);
  const clear = col != null && !(muckCols()[col] > 0);
  const once = S.beatsDone.includes('firstmuck');
  window.__reload();
  const kept = S.beatsDone.includes('firstmuck');
  // a second filthy storm, and its muck gone after: no scene
  let again = false;
  run(70);
  makeItRain();
  frames(() => { again ||= S.beat.camera === 'firstmuck'; return stormOver(); }, 120);
  frames(() => { again ||= S.beat.camera === 'firstmuck'; return false; }, 20);
  return [
    ok(laid, 'the storm left muck on the ground'),
    ok(took != null, 'the scene starts once a body goes for it', `${took}s after the storm`),
    ok(claimed, 'on the body whose claim it is, and its column'),
    ok(said.has('ask') && said.has('yuck'), 'it asks, then pulls a face', [...said].join(' ')),
    ok(len != null && len < 9, 'and it is short', `${len}s`),
    ok(clear, 'and ends with that cell cleared', `col ${col}`),
    ok(once && kept, 'it is had, and stays had across a reload'),
    ok(!again, 'and never runs again')
  ];
});

group('with nobody to clear it, one of the gang is sent off the rock', async () => {
  window.__reset();
  window.__crew(3, 0);
  run(5);
  makeItRain();
  frames(() => !S.raining, 120);
  frames(stormOver, 20);
  // off the rock only: the pull is the point here, not the gang's own site
  const from = Math.floor(rockLeft() / P) - 2, to = Math.ceil((rockLeft() + S.gw * P) / P) + 2;
  window.__muckSet(c => (c >= from && c <= to ? 0 : muckCols()[c]));
  let sent = null, col = null;
  const pulled = frames(() => S.muckPull != null, 10);
  if (pulled != null) {
    sent = S.workers.find(o => o.uid === S.muckPull);
    col = sent && sent.muckAt;
  }
  const scene = frames(() => S.beat.camera === 'firstmuck', 30);
  const followed = !!S.muckScene && !!sent && S.muckScene.uid === sent.uid;
  frames(() => !S.beat.camera, CUT_MUCK_MAX_S + 3);
  const clear = col != null && !(muckCols()[col] > 0);
  const onRock = () => {
    const w = S.workers.find(o => sent && o.uid === sent.uid);
    if (!w) return false;
    const mid = w.x + WORKER / 2;
    return mid >= rockLeft() - WORKER && mid <= rockLeft() + S.gw * P + WORKER;
  };
  const back = frames(onRock, 30);
  return [
    ok(pulled != null && sent && sent.type === TYPE.ROCK, 'a rockhand is sent for the muck', sent ? sent.name : 'nobody'),
    ok(scene != null && followed, 'and the scene follows it'),
    ok(clear, 'it clears the cell', `col ${col}`),
    ok(back != null && S.muckPull == null, 'and walks back to the rock', `${back}s`)
  ];
});
