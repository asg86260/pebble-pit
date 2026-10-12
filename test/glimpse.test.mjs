// The serpent's glimpses on the drowned pit's surface (glimpse.js): they come
// once the pit has drowned, one at a time, never under a beat, and all three
// kinds turn up. The pit is drowned the way a player drowns it -- dust over
// the rift's last stretch -- and the rest is the schedule's own.
//
// Every group here follows the schedule's clock across more than five
// seconds, and the schedule is deliberately not saved (a reload draws the
// wait afresh), so the reload harness is kept out of them; rule 17 in
// verify.js watches the never-under-a-beat half on every frame of every
// group in the tier.

import { group, ok, run, runUntil, yard } from './helpers.mjs';

const { ABYSS_AT, GLIMPSE_GAP_S, GLIMPSE_LEN_S, GLIMPSE_KINDS, CUT_DROWN_S, CUT_OUT_S } = await import('../src/config.js');
const { glimpseFrame } = await import('../src/glimpse.js');
const { now } = await import('../src/clock.js');

const S = yard.S;
const NO_RELOAD = { reload: false };
const longest = Math.max(...GLIMPSE_KINDS.map(k => GLIMPSE_GAP_S[k][1]));

// Dust over the last stretch of the torn era, and the clock run until the
// pit gives way. The moment it did, on the game's clock.
function drown() {
  window.__reset();
  window.__crew(0, 2);
  window.__tear(ABYSS_AT - 1000);
  window.__give(20000);
  for (let i = 0; i < 60 * 30 && !S.drowned; i++) run(1 / 60);
  return now();
}

// The clock turned a frame at a time, `seconds` of it, with `see` told about
// every frame; each glimpse seen is noted once, by its start.
function watch(seconds, see = () => {}) {
  const seen = [];
  for (let i = 0; i < seconds * 60; i++) {
    run(1 / 60);
    const g = S.glimpse;
    if (g && (!seen.length || seen.at(-1).at !== g.at)) seen.push({ ...g, from: now() });
    see(g);
  }
  return seen;
}

group('once the pit drowns, a glimpse comes within its wait', async () => {
  window.__reset();
  const solid = watch(5);
  const drownedAt = drown();
  const scene = CUT_DROWN_S + CUT_OUT_S + 1;   // the drowning's own camera holds it off
  const seen = watch(scene + longest + 1);
  const first = seen[0];
  const wait = first && (first.at - drownedAt) / 1000;
  return [
    ok(!solid.length, 'nothing shows before the pit has drowned'),
    ok(S.drowned, 'the dust drowned the pit'),
    ok(!!first, 'a glimpse came', `${seen.length} seen in ${Math.round(scene + longest)} s`),
    ok(first && wait <= GLIMPSE_GAP_S[first.kind][1] + scene,
       'within its own wait (the drowning\'s scene aside)', first && `${first.kind} after ${wait.toFixed(1)} s`),
    ok(first && wait >= GLIMPSE_GAP_S[first.kind][0] - 0.1, 'and not before it', first && `${wait.toFixed(1)} s`),
    ok(first && first.x * 6 >= yard.pit.x && first.x * 6 < yard.pit.x + yard.pit.w, 'on the pit\'s own surface',
       first && `column ${first.x}, pit ${yard.pit.x}..${yard.pit.x + yard.pit.w}`)
  ];
}, NO_RELOAD);

group('never during a camera beat, nor with the camera in the deep', async () => {
  // The drowning's own scene is the camera beat a player meets: a glimpse
  // forced up under it, and the next one made due, while it plays.
  drown();
  run(1 / 60);                                   // the scene starts on the frame after
  const beat = S.beat.camera;
  const forced = window.__glimpse('hump', { x: Math.round(yard.pit.x / 6) + 60, dir: 1 });   // grains are going in everywhere just now
  S.glimpseNext = { kind: 'watcher', at: now() };
  let underBeat = 0, beatFrames = 0;
  watch(CUT_DROWN_S + CUT_OUT_S + 1, g => {
    if (!S.beat.camera && !S.shot) return;
    beatFrames++;
    if (g) underBeat++;
  });
  const freeAt = now();
  const first = watch(longest + 1)[0];

  // And the deep: the portal standing, a glimpse up, the camera taken down.
  S.portalOpen = true;
  const up = window.__glimpse('fin');
  run(1 / 60);
  const before = !!S.glimpse;
  window.__view('deep');
  let inDeep = 0;
  watch(3, g => { if (g) inDeep++; });
  window.__view('yard');
  const back = watch(Math.min(...GLIMPSE_KINDS.map(k => GLIMPSE_GAP_S[k][0])) - 1);
  return [
    ok(beat === 'drown', 'the drowning took the camera', `${beat}`),
    ok(!!forced, 'a glimpse was forced up under it'),
    ok(beatFrames > 0 && !underBeat, 'and none showed on any frame of the scene', `${underBeat} of ${beatFrames} frames`),
    ok(first && first.at >= freeAt, 'and they came once the camera was given back',
       first && `${first.kind} ${((first.at - freeAt) / 1000).toFixed(1)} s after`),
    ok(up && before, 'a glimpse was up before the camera went down', up && up.kind),
    ok(!inDeep, 'it went the frame the camera went down, and none came while it was there', `${inDeep} frames`),
    ok(!back.length, 'nor the moment it came back up', back.map(g => g.kind).join(','))
  ];
}, NO_RELOAD);

group('never two at once, and all three kinds over a long watch', async () => {
  drown();
  let overlaps = 0, frames = 0, lastEnd = -Infinity;
  const kinds = new Set();
  const seen = watch(1500, g => {
    if (!g) return;
    frames++;
    if (!glimpseFrame(now())) overlaps++;    // a glimpse up and nothing drawn would be a stale one
  });
  for (const g of seen) {
    kinds.add(g.kind);
    if (g.at < lastEnd) overlaps++;
    lastEnd = g.at + GLIMPSE_LEN_S[g.kind] * 1000;
  }
  const count = k => seen.filter(g => g.kind === k).length;
  return [
    ok(seen.length >= 10, 'they keep coming', `${seen.length} in 1500 s`),
    ok(!overlaps, 'one ends before the next begins', `${overlaps}`),
    ok(GLIMPSE_KINDS.every(k => kinds.has(k)), 'the hump, the fin and the watcher all came',
       GLIMPSE_KINDS.map(k => `${k} ${count(k)}`).join(', ')),
    ok(count('watcher') < count('hump') + count('fin'), 'the watcher the rarest',
       GLIMPSE_KINDS.map(k => `${k} ${count(k)}`).join(', ')),
    ok(frames > 0, 'and each was drawn while it was up')
  ];
}, NO_RELOAD);
