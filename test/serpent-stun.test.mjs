// A stunning blow (DESIGN.md, "Blows land: the burst and the stun") holds the
// coil still and stops the heal. Only the moves that stun do it -- the
// Brawler's haymaker, the chi palm, the aimed shot at its capstone, the
// sticky charge -- for STUN_BASE_S, longer the more times over STUN_SHARE of
// the stage's depth the blow was, up to STUN_MAX_S; the Mage's finishing
// blow stuns only when it is worth the share. Never a tick; a new stun keeps
// the longer of the two; none starts in the grace after one ends.
//
// The first group reaches the stun the player's way, a Brawler bought to her
// Haymaker; the rest strike through `strike`, the one door every hit uses,
// with a blow of a size worked out from the rule.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_WOUND, SERPENT_DEFENSE, STUN_SHARE, STUN_BASE_S, STUN_MAX_S, STUN_GRACE_S, CLASSES } from '../src/config.js';
import { rungWorth } from '../src/deep/classes.js';
import { clickDeep, strike } from '../src/deep/serpent.js';
import { climb } from './party-press.mjs';
import { coilAt, bellyAt, bellySeg } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A yard the serpent has come for, and nobody fighting: every blow in these
// checks is the check's own.
function deepYard(stage = 0) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound: 0 });
}
const frame = () => yard.fast(1 / 60);
const belly = () => bellyAt(now());
// The stun a stunning blow of `done` is worth at the stage up, by the rule.
const stunFor = done => Math.min(STUN_MAX_S,
  STUN_BASE_S * Math.sqrt(Math.max(1, done / (SERPENT_WOUND[S.serpentStage] * STUN_SHARE))));
// A stunning blow worth `k` times the share on the bare coil. Thirty of them
// is short of the bare coil's depth, which a stunning blow must be: a blow
// that breaks the stage ends its own stun on the next frame.
const blowOf = k => SERPENT_WOUND[0] * STUN_SHARE * k;
const stunAt = (k, o = { stun: 1 }) => { const p = belly(); return strike('brawler', blowOf(k), p.x, p.y, null, 0, o); };

group("a Brawler's haymaker stuns the ward, and the heal stops for as long", async () => {
  deepYard(1);
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  climb(S.stations[0].id, 'brawler', 4);
  window.__serpent({ stage: 1, wound: 0 });
  let got = false;
  for (let f = 0; f < 60 * 30 && !got; f++) { frame(); got = S.serpentStun > 0; }
  const wound = S.serpentWound, stun = S.serpentStun;
  const hay = rungWorth(CLASSES.brawler, 4) * CLASSES.brawler.haymaker.x * SERPENT_DEFENSE.brawler[1];
  // Held for the stun's length, a frame short: nothing closes, though she
  // punches on.
  let least = wound;
  for (let f = 0; f < Math.floor(stun * 60) - 1; f++) { frame(); least = Math.min(least, S.serpentWound); }
  return [
    ok(got, 'a haymaker stuns the warded coil', `stun ${stun}`),
    ok(Math.abs(stun - stunFor(hay)) < 1 / 30, 'for the length the rule gives', `${stun} of ${stunFor(hay)}`),
    ok(least >= wound, 'and not a scrap of the wound closes while it lasts', `${wound} then at least ${least}`)
  ];
}, { reload: false });

group('only a stunning blow stuns: never a click, a plain blow or a tick', async () => {
  deepYard(0);
  const p = belly();
  for (let i = 0; i < 5; i++) clickDeep(p.x, p.y);
  const clicked = S.serpentStun;
  stunAt(10, {});
  const plain = S.serpentStun;
  stunAt(1000, { tick: true, stun: 1 });
  const ticked = S.serpentStun;
  window.__serpent({ stage: 0, wound: 0 });
  stunAt(1);
  return [
    ok(clicked === 0, 'a click never stuns', `${clicked}`),
    ok(plain === 0, 'nor a blow of ten times the share that is not a stunning move', `${plain}`),
    ok(ticked === 0, 'nor a tick, however big', `${ticked}`),
    ok(Math.abs(S.serpentStun - STUN_BASE_S) < 1e-9, 'where a stunning blow of the share does', `${S.serpentStun}`)
  ];
});

group('a stunning blow short of the share still stuns; one that "can stun" does not', async () => {
  deepYard(0);
  stunAt(0.5);
  const small = S.serpentStun;
  window.__serpent({ stage: 0, wound: 0 });
  S.serpentStun = S.serpentGrace = 0;
  stunAt(0.5, { stun: 1, share: true });
  const can = S.serpentStun;
  stunAt(4, { stun: 1, share: true });
  return [
    ok(Math.abs(small - STUN_BASE_S) < 1e-9, 'a move that stuns stuns for the base', `${small}`),
    ok(can === 0, "the Mage's finishing blow short of the share does not", `${can}`),
    ok(Math.abs(S.serpentStun - stunFor(blowOf(4))) < 1e-9, 'and over it, it does', `${S.serpentStun}`)
  ];
});

group('a stunned coil holds its pose, and sways on from it after', async () => {
  deepYard(0);
  const seg = bellySeg();
  const before = coilAt(seg, now());
  stunAt(4);
  frame();
  const held = coilAt(seg, now());
  run(1);
  const still = coilAt(seg, now());
  const was = S.serpentStun;
  runUntil(() => S.serpentStun === 0, 10);
  run(2);
  const after = coilAt(seg, now());
  return [
    ok(was > 0, 'stunned', `${was}`),
    ok(held.x === still.x && held.y === still.y, 'the coil does not move while stunned',
       `${held.x},${held.y} then ${still.x},${still.y}`),
    ok(Math.abs(held.y - before.y) <= 1, 'and it holds where it was struck', `${before.y} then ${held.y}`),
    ok(after.x !== still.x || after.y !== still.y, 'and sways again once it is over', `${still.x},${still.y} -> ${after.x},${after.y}`)
  ];
});

group('a stun never stacks: the longer of the two stands', async () => {
  deepYard(0);
  stunAt(30);
  const most = S.serpentStun;
  run(2);
  const left = S.serpentStun;
  stunAt(1);
  const small = S.serpentStun;
  const k = ((left + 0.5) / STUN_BASE_S) ** 2;
  stunAt(k);
  const bigger = S.serpentStun;
  const cap = { stun: CLASSES.brawler.capStun };
  window.__serpent({ stage: 0, wound: 0 });
  S.serpentStun = S.serpentGrace = 0;
  stunAt(1, cap);
  return [
    ok(Math.abs(most - STUN_MAX_S) < 1e-9, 'the biggest blow stuns for the longest and no longer', `${most}`),
    ok(Math.abs(small - left) < 1e-9, 'a lesser blow while stunned adds nothing', `${left} then ${small}`),
    ok(Math.abs(bigger - (left + 0.5)) < 1e-6, 'a greater one sets its own length, not the two together',
       `${left} left, then ${bigger}`),
    ok(Math.abs(S.serpentStun - STUN_BASE_S * cap.stun) < 1e-9, "and a capstone's stun is the move's stretch of it",
       `${S.serpentStun}`)
  ];
});

group('in the grace after a stun no new one starts', async () => {
  deepYard(0);
  stunAt(1);
  const first = S.serpentStun;
  runUntil(() => S.serpentStun === 0, 10);
  const grace = S.serpentGrace;
  stunAt(30);
  const inGrace = S.serpentStun;
  run(STUN_GRACE_S + 0.1);
  window.__serpent({ stage: 0, wound: 0 });
  stunAt(1);
  return [
    ok(first > 0, 'the first blow stuns', `${first}`),
    ok(grace > 0 && grace <= STUN_GRACE_S, 'its end starts the grace', `${grace}`),
    ok(inGrace === 0, 'a blow in the grace does not stun, however big', `${inGrace}`),
    ok(S.serpentStun > 0, 'and once the grace is out a blow stuns again', `${S.serpentStun}`)
  ];
});

group('a stun and its held pose survive a reload', async () => {
  deepYard(0);
  stunAt(30);
  run(1);
  const stun = S.serpentStun, wound = S.serpentWound, pose = coilAt(bellySeg(), now());
  window.__reload();
  const back = S.serpentStun, woundBack = S.serpentWound, poseBack = coilAt(bellySeg(), now());
  run(1);
  return [
    ok(stun > 0 && Math.abs(back - stun) < 1e-9, 'the stun left is read back', `${stun} then ${back}`),
    ok(woundBack === wound, 'and the wound', `${wound} then ${woundBack}`),
    ok(pose.x === poseBack.x && pose.y === poseBack.y, 'and the coil is where it was held',
       `${pose.x},${pose.y} then ${poseBack.x},${poseBack.y}`),
    ok(S.serpentWound === wound && S.serpentStun < back, 'and the heal is still stopped after it',
       `wound ${S.serpentWound}, stun ${S.serpentStun}`)
  ];
});
