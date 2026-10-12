// Life seen through the torn rift (riftlife.js): creatures cross behind the
// disc between the tear and the drowning, never in the tear's first minute,
// never under a beat, one at a time, often; the serpent rarely, and whatever
// is crossing when he is due darts off first. The pit is torn the way a
// player tears it -- dust until the hole cannot take a grain -- and the rest
// is the schedule's own.
//
// The schedule is deliberately not saved (a reload starts its wait again),
// so the reload harness is kept out; rule 18 in verify.js watches the
// never-under-a-beat half on every frame of every group in the tier.

import { group, ok, run, yard } from './helpers.mjs';

const { ABYSS_AT, RIFTLIFE_FIRST_S, RIFTLIFE_GAP_S, RIFTLIFE_SERPENT_GAP_S } = await import('../src/config.js');
const { lifeLen, isSerpent } = await import('../src/riftlife.js');
const { now } = await import('../src/clock.js');

const S = yard.S;
const NO_RELOAD = { reload: false };

// The clock turned a frame at a time, `seconds` of it, with `see` told about
// every frame; each crossing seen is noted once, by its start, and kept as
// it last stood (a dart-off changes how long it lasts).
function watch(seconds, see = () => {}) {
  const seen = [];
  for (let i = 0; i < seconds * 60; i++) {
    run(1 / 60);
    const e = S.riftLife;
    if (e && (!seen.length || seen.at(-1).at !== e.at)) seen.push({ ...e, from: now() });
    else if (e) seen[seen.length - 1] = { ...e, from: seen.at(-1).from };
    see(e);
  }
  return seen;
}

// Dust into the pit until the hole cannot take a grain and tears. The moment
// it did, on the game's clock.
function tear() {
  window.__reset();
  window.__crew(0, 2);
  window.__give(60000);   // past the brim: the hole says no, and tears
  for (let i = 0; i < 60 * 60 && !S.riftOpen; i++) run(1 / 60);
  return now();
}

group('nothing before the tear, nothing in its first minute, then they come', async () => {
  window.__reset();
  const solid = watch(5);
  const tornAt = tear();
  let underBeat = 0, beatFrames = 0, gulping = 0;
  const seen = watch(RIFTLIFE_FIRST_S + RIFTLIFE_GAP_S[1] + 5, e => {
    if (S.beat.camera || S.beat.yard || S.shot) { beatFrames++; if (e) underBeat++; }
    if (S.riftGulp > 0 && e) gulping++;
  });
  const first = seen[0];
  const wait = first && (first.at - tornAt) / 1000;
  return [
    ok(!solid.length, 'nothing crosses before the pit has torn'),
    ok(S.riftOpen && !S.drowned, 'the dust tore the pit'),
    ok(beatFrames > 0 && !underBeat, 'nothing under the tear\'s own scene', `${underBeat} of ${beatFrames} frames`),
    ok(!gulping, 'nor while the tear gulped the hole down', `${gulping}`),
    ok(!!first, 'one came', `${seen.length} seen`),
    ok(first && wait >= RIFTLIFE_FIRST_S, 'not in the tear\'s first minute', first && `${first.kind} after ${wait.toFixed(1)} s`),
    ok(first && !isSerpent(first), 'and the first was a creature', first && first.kind),
  ];
}, NO_RELOAD);

group('never during a beat, nor with the camera in the deep', async () => {
  tear();
  run(1 / 60);                                   // the scene starts on the frame after
  // Straight into the tear's scene: one forced in under it is gone at once.
  const beat = S.beat.camera;
  const forced = window.__riftLife('shoal');
  let underBeat = 0;
  watch(1, e => { if ((S.beat.camera || S.shot) && e) underBeat++; });

  // And the deep: one forced in, the camera taken down (a way down is opened
  // for it, since a torn yard has none of its own).
  watch(RIFTLIFE_FIRST_S);
  S.portalOpen = true;
  const up = window.__riftLife('creature');
  run(1 / 60);
  const before = !!S.riftLife;
  window.__view('deep');
  let inDeep = 0;
  watch(3, e => { if (e) inDeep++; });
  window.__view('yard');
  return [
    ok(!!beat, 'the tear took the camera', `${beat}`),
    ok(!!forced && !underBeat, 'and nothing forced in under it showed', `${underBeat} frames`),
    ok(up && before, 'one was crossing before the camera went down'),
    ok(!inDeep, 'it went the frame the camera went down, and none came while it was there', `${inDeep} frames`),
  ];
}, NO_RELOAD);

group('one at a time; creatures often, the serpent rarely', async () => {
  tear();
  const seen = watch(1500);
  let overlaps = 0, lastEnd = -Infinity;
  for (const e of seen) {
    if (e.at < lastEnd) overlaps++;
    lastEnd = e.at + lifeLen(e) * 1000;
  }
  const serpents = seen.filter(isSerpent), creatures = seen.filter(e => !isSerpent(e));
  const gaps = serpents.slice(1).map((e, i) => (e.at - serpents[i].at) / 1000);
  const kinds = new Set(serpents.map(e => e.kind));
  return [
    ok(!overlaps, 'one is gone before the next comes in', `${overlaps}`),
    ok(creatures.length >= 1440 / 45, 'a creature or a shoal every 20 to 40 s', `${creatures.length} in 1500 s`),
    ok(creatures.some(e => e.shoal) && creatures.some(e => !e.shoal), 'shoals and single creatures both',
       `${creatures.filter(e => e.shoal).length} shoals`),
    ok(serpents.length >= 2 && serpents.length <= 1500 / RIFTLIFE_SERPENT_GAP_S[0] + 1, 'the serpent, but rarely',
       `${serpents.length}: ${serpents.map(e => e.kind).join(',')}`),
    ok(gaps.every(g => g >= RIFTLIFE_SERPENT_GAP_S[0]), 'never twice in five minutes', gaps.map(g => g.toFixed(0)).join(',')),
    ok(S.riftOpen && !S.drowned, 'and the rift stayed torn throughout'),
  ];
}, NO_RELOAD);

group('whatever is crossing darts off before the serpent comes', async () => {
  tear();
  let e = null;
  for (let i = 0; i < 200 * 60 && !e; i++) {
    run(1 / 60);
    if (S.riftLife && !isSerpent(S.riftLife) && now() - S.riftLife.at < 1000) e = S.riftLife;
  }
  const calm = e && lifeLen({ ...e, flee: null });
  S.riftLifeSerpentAt = now();             // he is due this frame
  run(1 / 60);
  const fled = e && e.flee != null;
  const ends = e && e.at + lifeLen(e) * 1000;
  let him = null;
  for (let i = 0; i < 30 * 60 && !him; i++) {
    run(1 / 60);
    if (S.riftLife && isSerpent(S.riftLife)) him = S.riftLife;
  }
  return [
    ok(!!e, 'a creature came in', e && `${e.shoal ? 'shoal' : 'creature'} at depth ${e.d}`),
    ok(fled, 'it darted off the frame he was due', e && `flee ${e.flee}`),
    ok(fled && lifeLen(e) < calm, 'and cleared the window sooner than it would have', e && `${lifeLen(e).toFixed(1)} s, not ${calm.toFixed(1)}`),
    ok(!!him, 'then he came', him && him.kind),
    ok(him && him.at >= ends, 'only once it was gone', him && `${((him.at - ends) / 1000).toFixed(2)} s after`),
  ];
}, NO_RELOAD);

group('nothing once it drowns, nor on the rescue\'s swell', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__tear(ABYSS_AT - 1000);
  window.__give(20000);
  for (let i = 0; i < 60 * 30 && !S.drowned; i++) run(1 / 60);
  const after = watch(RIFTLIFE_FIRST_S + RIFTLIFE_GAP_S[1] + 10);

  // Rescued with the pit solid: the hole is owed the tear, the swell and the
  // drowning (`owedArc` in rift.js), with nothing scheduled into any of it.
  window.__reset();
  window.__crew(3, 3);
  window.__give(20000);
  run(1);
  S.rescued = true; S.buried = false;
  run(1 / 60);
  window.__skipBeat('sheet');
  let torn = 0;
  const swell = watch(60, () => { if (S.riftOpen && !S.drowned) torn++; });
  return [
    ok(S.drowned, 'the rescued yard drowned on its own'),
    ok(!after.length, 'nothing crossed after the drowning', after.map(e => e.kind).join(',')),
    ok(torn > 0, 'the rescue\'s rift stood torn a while', `${(torn / 60).toFixed(1)} s`),
    ok(!swell.length, 'and nothing crossed behind it', swell.map(e => e.kind).join(',')),
  ];
}, NO_RELOAD);
