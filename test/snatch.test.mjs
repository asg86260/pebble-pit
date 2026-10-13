// The snatch and the freeing (snatch.js; docs/wave-serpent.md, "The story").
//
// Reached the way a player reaches them: the pit drowned by the rift eating
// its fill, the sqwife out with her sheet put down, in either order. The
// rescue itself is bought and walked in shield.test.mjs; here the yard is
// given the rescue's own record, as ending.test.mjs does, and the sheet is put
// down with its button. The freeing is the fourth defense broken, which is
// deep/serpent.js's; the flags are set here because the fight is not this
// file's subject.
import { group, ok, state, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { ABYSS_AT, WORKER, P } from '../src/config.js';
import { now } from '../src/clock.js';
import { commutePace } from '../src/levels.js';
import { belowYard } from '../src/route.js';
import { mouthX, deepFloor, bellyAt, bellySeg, coilAt, coilThick } from '../src/deep/place.js';
import { SERPENT_WOUND, SERPENT_PHASES, KILL, KILL_REFORM_S } from '../src/config.js';
const LAST = SERPENT_PHASES - 1;
import { strike } from '../src/deep/serpent.js';
import { killDrop, apartK } from '../src/deep/phases.js';
import { freedBody, ringAt, jawAt } from '../src/snatch.js';

const done = key => S.beatsDone.filter(k => k === key).length;
const rescued = () => { S.rescued = true; S.buried = false; };
const inYard = w => !belowYard(w) && w.y + WORKER <= S.groundY + 1;

// Frame by frame, the body named: the furthest it moved in one frame, and
// the lowest and highest it was, until `until` says it is there. Found by name
// every frame, because the harness reads the yard back every five seconds and
// a reload stands every body up afresh.
function follow(name, until, limit = 60 * 60) {
  let jump = 0, low = -Infinity, high = Infinity, at = null, frames = 0, shaft = false;
  for (let f = 0; f < limit; f++) {
    const w = S.workers.find(o => o.name === name);
    if (!w) return { lost: true, jump, low, high, frames, shaft };
    if (at) jump = Math.max(jump, Math.hypot(w.x - at.x, w.y - at.y));
    at = { x: w.x, y: w.y };
    low = Math.max(low, w.y);
    high = Math.min(high, w.y);
    if (Math.abs(w.x - mouthX()) < 1 && w.y + WORKER > S.groundY + P && w.y + WORKER < deepFloor() - P) shaft = true;
    if (until(w)) return { there: true, jump, low, high, frames, shaft };
    run(1 / 60);
    frames++;
  }
  return { there: false, jump, low, high, frames, shaft };
}

group('drowned first: the rescue\'s sheet put down, and the serpent takes him, once', async () => {
  window.__crew(2, 2);
  run(1);
  window.__rift();                       // the hole ate its fill and gave way
  rescued();                             // and then the sqwife walked out
  run(1 / 60);
  const sheet = state().beat.sheet;
  window.__skipBeat('sheet');            // the button
  const danced = S.danceUntil > now();
  const before = S.crew;
  runUntil(() => S.beat.yard === 'snatch', 5);
  const started = S.beat.yard === 'snatch';
  const pair = S.pair.length;
  const crewDuring = S.crew;
  let sawHead = false, carried = false;
  for (let f = 0; f < 60 * 60 && !S.beatsDone.includes('snatch'); f++) {
    run(1 / 60);
    if (S.snatch && S.snatch.headY < S.groundY) sawHead = true;
    if (S.snatch && S.snatch.carried) carried = true;
  }
  const after = S.crew;
  const hers = S.workers.filter(w => w.deepHome);
  // And never again: not on the next frames, not after a reload.
  window.__reload();
  run(3);
  return [
    ok(sheet === 'ending', 'the rescue\'s sheet comes first', `sheet ${sheet}`),
    ok(!danced, 'putting it down does not start the dance when the pit has drowned'),
    ok(started && pair === 2, 'the snatch takes the yard with two of the crew walked as the pair',
       `beat ${S.beat.yard}, pair ${pair}`),
    ok(crewDuring === before - 2, 'the two are off the crew while it plays', `${before} -> ${crewDuring}`),
    ok(sawHead && carried, 'something comes up out of the surface and takes one of them'),
    ok(S.snatched && after === before - 1, 'the crew is one fewer', `${before} -> ${after}`),
    ok(hers.length === 1 && hers[0].type === 'fighter' && S.deepCrew === 1 && S.fighters === 1
       && S.stations.length === 1 && S.stations[0].built && hers[0].station === S.stations[0].id,
       "and the one left standing is the deep's one hand, the fighter at the free first station that stands from it",
       `${hers.length} bodies, ${hers[0]?.type}, ${S.fighters} fighting, ${S.stations.length} stations`),
    ok(done('snatch') === 1 && S.crew === after && S.beat.yard === null,
       'it plays once, and not again after a reload', `done ${done('snatch')}, crew ${S.crew}`)
  ];
});

group('rescued first: the drowning\'s scene plays through, then the snatch', async () => {
  window.__crew(2, 2);
  run(1);
  // Torn already, so the rescue owes no tearing scene (abyss-after-rescue's
  // subject) and the drowning below is the rift's own.
  window.__tear(0);
  rescued();
  run(1 / 60);
  window.__skipBeat('sheet');
  run(2);
  const early = S.beat.yard;
  // The hole eating the last of its fill: the rift drowns it on its own step.
  window.__tear(ABYSS_AT);
  runUntil(() => S.beat.camera === 'drown', 5);
  const scene = S.beat.camera;
  run(1 / 60);
  const during = S.beat.yard;
  runUntil(() => S.beat.yard === 'snatch', 30);
  const after = { yard: S.beat.yard, drownDone: S.beatsDone.includes('drown'), camera: S.beat.camera };
  runUntil(() => S.beatsDone.includes('snatch'), 60);
  return [
    ok(early === null, 'nothing is taken before the pit has drowned', `yard ${early}`),
    ok(scene === 'drown' && during !== 'snatch', 'the drowning\'s scene plays first, alone',
       `camera ${scene}, yard ${during}`),
    ok(after.yard === 'snatch' && after.drownDone && after.camera !== 'drown',
       'and the snatch follows once it has finished', JSON.stringify(after)),
    ok(S.snatched && done('snatch') === 1, 'and plays through, once')
  ];
});

group('a reload mid-snatch plays it again from the start, or past the take from the surface', async () => {
  window.__crew(2, 2);
  run(1);
  const crew0 = S.crew;
  window.__snatch();
  runUntil(() => S.snatch && S.snatch.phase === 'walk', 3);
  run(1);
  window.__reload();                     // walking to the edge
  const back = { crew: S.crew, beat: S.beat.yard, snatched: S.snatched };
  runUntil(() => S.snatch && S.snatch.phase === 'close', 60);
  window.__reload();                     // he is under; the surface closing
  const closing = { crew: S.crew, snatched: S.snatched };
  run(1 / 60);
  const resumed = S.snatch && S.snatch.phase;
  runUntil(() => S.beatsDone.includes('snatch'), 30);
  return [
    ok(back.crew === crew0 && !back.snatched && back.beat === null,
       'read back mid-walk, the pair are hands of the crew again and nothing is taken', JSON.stringify(back)),
    ok(closing.snatched && closing.crew === crew0 - 1,
       'read back past the take, he is gone and she is a hand', JSON.stringify(closing)),
    ok(resumed === 'close', 'and it finishes from the surface closing', `phase ${resumed}`),
    ok(S.crew === crew0 - 1 && S.deepCrew === 1 && done('snatch') === 1,
       'the crew is one fewer once, however it was read', `crew ${crew0} -> ${S.crew}, deep ${S.deepCrew}`)
  ];
});

// The snatch goes through a portal in the abyss's own surface, and she leaps
// in after him before it shuts (DESIGN.md, "Two crews and a portal"): her
// leap is an arc a frame at a time, and she sinks to the deep's floor and is
// its whole crew.
group('the portal opens, she leaps in as it closes, and she is the deep\'s one hand', async () => {
  window.__crew(2, 2);
  run(1);
  const yard0 = S.workers.length;
  window.__snatch();                     // the facts, the beat left to play
  let portal = 0, closedAfter = false, leapt = false, jump = 0, at = null, under = false;
  for (let f = 0; f < 60 * 90 && !S.beatsDone.includes('snatch'); f++) {
    run(1 / 60);
    const sn = S.snatch;
    if (sn) {
      portal = Math.max(portal, sn.portal || 0);
      if (portal >= 1 && (sn.portal || 0) < 0.2) closedAfter = true;
      const b = S.pair[0];
      if (b && b.leap && !b.under) {
        leapt = true;
        if (at) jump = Math.max(jump, Math.hypot(b.x - at.x, b.y - at.y));
        at = { x: b.x, y: b.y };
      }
      if (b && b.under) under = true;
    }
  }
  const name = S.workers.find(w => w.deepHome)?.name;
  runUntil(() => name && !S.workers.find(o => o.name === name)?.falling, 30);
  const her = S.workers.find(o => o.name === name);
  const down = S.workers.filter(w => belowYard(w));
  return [
    ok(portal >= 1 && closedAfter, 'a portal opens in the surface and closes again', `widest ${portal}`),
    ok(leapt && under, 'she leaps into it before it shuts'),
    ok(jump < WORKER, 'an arc, a step a frame', `${jump.toFixed(1)}px`),
    ok(her && belowYard(her) && S.deepCrew === 1 && down.length === 1 && down[0].name === name,
       "and she is the deep's one hand, down there", `deepCrew ${S.deepCrew}, ${down.length} below`),
    ok(S.workers.length === yard0 - 1, 'the crew is one fewer: he is not given back', `${S.workers.length} of ${yard0}`)
  ];
});

// The take is one place (snatch.js, `ringAt`): the whirlpool opens with its
// middle on him where he stands at the edge, the jaws close where he stood
// rather than he being moved to them, and her leap ends in the ring. The
// drawing reads the same functions (render/portal.js, render/serpent.js).
group('the whirlpool, the jaws and her leap all land where he stands', async () => {
  window.__crew(2, 2);
  run(1);
  window.__snatch();
  let stood = null, ring = null, taken = null, last = null, landed = null, heldIn = true;
  for (let f = 0; f < 60 * 90 && !S.beatsDone.includes('snatch'); f++) {
    run(1 / 60);
    const sn = S.snatch;
    if (!sn) continue;
    // him, stood at the edge as the whirlpool opens
    if (sn.phase === 'open' && S.pair.length === 2) { stood = { ...S.pair[1] }; ring = ringAt(); }
    if (sn.takenAt && !taken) taken = sn.takenAt;
    // while it has him he is drawn in its jaws, on the take's line
    if (sn.carried && sn.phase !== 'close' && Math.abs(jawAt(sn.headY).x - ring.x + WORKER / 2) > 0.5) heldIn = false;
    const b = S.pair[0];
    if (b && b.leap) {
      if (b.under && !landed) landed = { x: last.x, y: last.y, end: { x: b.x, y: b.y } };
      last = { x: b.x, y: b.y };
    }
  }
  const mid = p => ({ x: p.x + WORKER / 2, y: p.y + WORKER / 2 });
  return [
    ok(stood && Math.abs(mid(stood).x - ring.x) <= P,
       'he stands with the whirlpool opening under him', `him ${stood && mid(stood).x}, ring ${ring && ring.x}`),
    ok(taken && Math.abs(taken.jaw.x - taken.x) <= P && Math.abs(taken.jaw.y - taken.y) <= P,
       'the jaws close where he stood', JSON.stringify(taken)),
    ok(heldIn, 'and keep him on the take as they go back down'),
    ok(landed && Math.abs(mid(landed.end).x - ring.x) <= 0.5 && Math.abs(mid(landed.end).y - ring.y) <= 0.5,
       'her leap ends in the middle of the ring', JSON.stringify({ landed, ring }))
  ];
});

// He is not given back to the crew: the finale takes the two of them home
// (finale.js), off the crew both, and the sheet comes once it is over.
group("the freeing: he is out, the two of them leave the crew, and the sheet comes after the finale", async () => {
  window.__crew(2, 2);
  run(1);
  window.__snatch({ played: true });
  const had = new Set(S.workers.map(w => w.name));
  const crew0 = S.crew, deep0 = S.deepCrew;
  S.serpentStage = SERPENT_PHASES;       // the last defense broken (deep/serpent.js)
  S.serpentFreed = true;
  run(1 / 60);
  const opening = S.beat.yard;
  runUntil(() => S.beatsDone.includes('freed'), 30);
  const finale = S.beat.yard;
  runUntil(() => S.beat.sheet === 'freedsheet', 120);
  const him = S.workers.find(w => !had.has(w.name));
  return [
    ok(opening === 'freed', 'the belly opens as a beat', `yard ${opening}`),
    ok(finale === 'finale', 'and the finale follows it', `yard ${finale}`),
    ok(!him && S.crew === crew0 - 1 && S.deepCrew === deep0 - 1 && !!S.retired,
       'neither he nor she is one of the crew after it', `crew ${crew0} then ${S.crew}, deep ${deep0} then ${S.deepCrew}`),
    ok(S.beat.sheet === 'freedsheet', 'the sheet says so', `sheet ${S.beat.sheet}`)
  ];
});

// The kill (snatch.js, config KILL), reached by striking the fourth defense
// down: he goes limp and lies on the floor, comes apart, nothing reaches him
// while he is down, his freed one walks out to her, the finale takes the two
// of them off the crew, and once the sheet is put down the serpent gathers
// itself again and comes back once, at level 2 on its last defense
// (DESIGN.md, "Endless serpent").
group('the fourth break: limp to the floor, apart, him out to her, and the serpent back after the sheet', async () => {
  window.__snatch({ played: true });
  window.__deepCrew({ spare: 1 });
  window.__serpent({ stage: LAST, wound: 0 });
  const crew0 = S.crew;
  const p = bellyAt(now());
  strike('punch', SERPENT_WOUND[LAST], p.x, p.y);
  run(KILL.last + KILL.limp + 0.1);
  const lying = killDrop(), seg = bellySeg(), low = coilAt(seg, now()).y + coilThick(seg) / 2;
  const hit = strike('punch', 100, p.x, p.y);
  run(KILL.apart);
  const apart = apartK();
  run(1);
  const out = freedBody();
  runUntil(() => S.beat.sheet === 'freedsheet', 120);
  const sheet = S.beat.sheet, crew = S.crew;
  window.__skipBeat('sheet');
  run(KILL_REFORM_S + 0.5);
  return [
    ok(lying === 1 && Math.abs(low - deepFloor()) <= P, 'he goes limp and lies on the floor', `drop ${lying}, his underside ${low.toFixed(0)} by the floor ${deepFloor()}`),
    ok(hit === 0, 'and nothing reaches him while he is down', `${hit}`),
    ok(apart >= 1, 'he comes apart, all of him', `${apart}`),
    ok(out && Math.abs(out.y + WORKER - deepFloor()) <= P, 'his freed one is out, on the floor', JSON.stringify(out)),
    ok(sheet === 'freedsheet' && crew === crew0 - 1, 'and the two of them are off the crew when the sheet comes up', `${sheet} crew ${crew0} then ${crew}`),
    ok(S.serpentLevel === 2 && S.serpentStage === LAST && !S.serpentFreed && killDrop() === 0,
       'put down, the serpent gathers itself whole again and comes back at level 2, on its last defense',
       `level ${S.serpentLevel} stage ${S.serpentStage} freed ${S.serpentFreed} drop ${killDrop()}`)
  ];
});

// A fight set back after the kill (the dev hook, `__serpent`) to the story's
// serpent has not had it: the next fourth break plays the kill and the
// meeting again -- with the two of them gone home already, no finale and
// nobody joining or leaving. The hook forgets the story only at level 1.
group('set back after the kill, the next fourth break plays it all again', async () => {
  window.__snatch({ played: true });
  window.__deepCrew({ spare: 1 });
  window.__serpent({ stage: LAST, wound: 0 });
  const hit = () => { const p = bellyAt(now()); strike('punch', SERPENT_WOUND[LAST], p.x, p.y); };
  hit();
  runUntil(() => S.beat.sheet === 'freedsheet', 120);
  window.__skipBeat('sheet');
  run(KILL_REFORM_S + 0.5);
  const crew = S.crew;
  window.__serpent({ level: 1, stage: LAST, wound: 0 });
  hit();
  run(0.1);
  const again = S.beat.yard, stage = S.serpentStage, beats = S.beatsDone.filter(k => k.startsWith('freed')).join();
  run(KILL.last + KILL.limp + 0.1);
  const lying = killDrop();
  runUntil(() => S.beat.sheet === 'freedsheet', 30);
  return [
    ok(again === 'freed', 'the kill plays again', `${again} stage ${stage} done ${beats}`),
    ok(lying === 1, 'he goes limp to the floor again', `${lying}`),
    ok(S.beat.sheet === 'freedsheet' && S.crew === crew, 'and the meeting and the sheet come again', `${S.beat.sheet} crew ${crew} then ${S.crew}`)
  ];
});

// Down and gone after the kill there is nothing to fight: the party stops and
// goes back to its posts until the serpent has gathered itself again.
group('after the kill the fighters stop and go back to their posts', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 8 }] });
  window.__serpent({ stage: LAST, wound: 0 });
  runUntil(() => S.workers.some(w => w.station && w.goal === 'fight'), 30);
  const p = bellyAt(now());
  strike('punch', SERPENT_WOUND[LAST], p.x, p.y);
  run(0.1);
  const seen = new Set(S.hits);
  run(KILL.last + KILL.limp + KILL.apart + 3);
  const blows = S.hits.filter(h => !seen.has(h) && h.weapon !== 'heal' && h.weapon !== 'punch').length;
  const w = S.workers.find(o => o.station);
  return [
    ok(blows === 0, 'no blow lands on him down or gone', `${blows}`),
    ok(w && w.goal === 'back' && Math.abs(w.y + WORKER - deepFloor()) <= P * 12, 'the fighter has gone back down to its post', `${w && w.goal} at ${w && Math.round(w.y)}`)
  ];
});
