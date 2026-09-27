// A heavy blow stuns (DESIGN.md, "Blows land: the burst and the stun"): one
// blow worth STUN_SHARE of the stage's depth holds the coil still and stops
// the heal, for longer the bigger it was, up to STUN_MAX_S. Only single
// blows stun -- a punch, a grenade's burst, the star -- never a lance's or a
// beam's held ticks; a new stun keeps the longer of the two; and none starts
// in the grace after one ends.
//
// The punch is bought on the altar's board and landed through `clickDeep`,
// the pointer's door; the star is called and falls; the grenade is a
// grenadier's. The rest strike through `strike`, the one door every weapon
// uses, with a blow of a size worked out from the rule.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_WOUND, STUN_SHARE, STUN_BASE_S, STUN_MAX_S, STUN_GRACE_S,
         rungValue } from '../src/config.js';
import { clickDeep, strike } from '../src/deep/serpent.js';
import { coilAt, bellyAt, bellySeg } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A yard the serpent has come for, and nobody at a weapon: every blow in
// these checks is the check's own.
function deepYard(stage = 0) {
  window.__snatch({ played: true });
  window.__deepCrew({ brawlers: 0 });
  window.__serpent({ stage, wound: 0 });
}
const frame = () => yard.fast(1 / 60);
const belly = () => bellyAt(now());
// The stun a blow of `done` is worth at the stage up, by the rule.
const stunFor = done => Math.min(STUN_MAX_S, STUN_BASE_S * Math.sqrt(done / (SERPENT_WOUND[S.serpentStage] * STUN_SHARE)));
// A blow worth `k` times the least that stuns the stage up, as a punch on
// the bare coil (which takes a punch in full). Thirty of them is short of
// the bare coil's depth, which a stunning blow must be: a blow that breaks
// the stage ends its own stun on the next frame.
const punchOf = k => SERPENT_WOUND[0] * STUN_SHARE * k;
const punchAt = k => { const p = belly(); return strike('punch', punchOf(k), p.x, p.y); };

group('a bought punch clicked on the bare coil stuns it, and the heal stops for as long', async () => {
  deepYard(0);
  // Two rungs of punch strength, bought on the altar's board.
  window.__grant({ scales: 1e5, dust: 1e6 });
  let bought = 0;
  for (let i = 0; i < 2; i++) if (window.__buy('punch')) { window.__finish(); run(0.2); bought++; }
  window.__serpent({ stage: 0, wound: 0 });
  const punch = rungValue('punch', S.punchLevel);
  const p = belly();
  const landed = clickDeep(p.x, p.y);
  const wound = S.serpentWound, stun = S.serpentStun, want = stunFor(punch);
  // Held for the stun's length, a frame short: nothing closes.
  let least = wound;
  const frames = Math.floor(want * 60) - 1;
  for (let f = 0; f < frames; f++) { frame(); least = Math.min(least, S.serpentWound); }
  const heldTo = S.serpentWound;
  run(1);
  return [
    ok(bought === 2 && S.punchLevel >= 2, 'two rungs of punch bought on the board', `bought ${bought}, level ${S.punchLevel}`),
    ok(punch >= punchOf(1), 'a punch on the second rung is a stunning blow on the bare coil',
       `${punch} against ${punchOf(1).toFixed(2)}`),
    ok(landed && wound === punch, 'the click lands the punch', `wound ${wound}`),
    ok(Math.abs(stun - want) < 1e-9, 'and stuns for the length the rule gives', `${stun} of ${want}`),
    ok(least === wound && heldTo === wound, 'not a scrap of the wound closes while it lasts',
       `${wound} then at least ${least}`),
    ok(S.serpentStun === 0 && S.serpentWound < wound, 'and when it is over the heal takes up again',
       `stun ${S.serpentStun}, wound ${S.serpentWound}`)
  ];
});

group('a stunned coil holds its pose, and sways on from it after', async () => {
  deepYard(0);
  const seg = bellySeg();
  const before = coilAt(seg, now());
  punchAt(4);
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

group('a lance or a beam never stuns, however big its tick', async () => {
  deepYard(1);
  const p = belly();
  const huge = SERPENT_WOUND[1] * 10;
  strike('lance', huge, p.x, p.y, {});
  const afterLance = S.serpentStun;
  frame();
  window.__serpent({ stage: 1, wound: 0 });
  strike('beam', huge, p.x, p.y, {});
  const afterBeam = S.serpentStun;
  frame();
  window.__serpent({ stage: 1, wound: 0 });
  // The same size as a blow does stun: it is the kind, not the number.
  strike('star', huge / 20, p.x, p.y);
  return [
    ok(afterLance === 0, 'a lance tick deeper than the whole stage does not stun', `${afterLance}`),
    ok(afterBeam === 0, 'nor does a beam tick', `${afterBeam}`),
    ok(S.serpentStun > 0, 'where a star of a twentieth of it does', `${S.serpentStun}`)
  ];
});

group('a stun never stacks: the longer of the two stands', async () => {
  deepYard(0);
  // A blow worth the most, then two seconds of it gone.
  punchAt(30);
  const most = S.serpentStun;
  run(2);
  const left = S.serpentStun;
  // A smaller blow while stunned leaves the longer.
  punchAt(1);
  const small = S.serpentStun;
  // A blow worth more than what is left takes its own length, not the sum.
  const k = ((left + 0.5) / STUN_BASE_S) ** 2;
  punchAt(k);
  const bigger = S.serpentStun;
  return [
    ok(Math.abs(most - STUN_MAX_S) < 1e-9, 'the biggest blow stuns for the longest and no longer', `${most}`),
    ok(Math.abs(small - left) < 1e-9, 'a lesser blow while stunned adds nothing', `${left} then ${small}`),
    ok(Math.abs(bigger - (left + 0.5)) < 1e-6, 'a greater one sets its own length, not the two together',
       `${left} left, then ${bigger}`)
  ];
});

group('in the grace after a stun no new one starts', async () => {
  deepYard(0);
  punchAt(1);
  const first = S.serpentStun;
  runUntil(() => S.serpentStun === 0, 10);
  const grace = S.serpentGrace;
  punchAt(30);
  const inGrace = S.serpentStun;
  run(STUN_GRACE_S + 0.1);
  window.__serpent({ stage: 0, wound: 0 });
  punchAt(1);
  return [
    ok(first > 0, 'the first blow stuns', `${first}`),
    ok(grace > 0 && grace <= STUN_GRACE_S, 'its end starts the grace', `${grace}`),
    ok(inGrace === 0, 'a blow in the grace does not stun, however big', `${inGrace}`),
    ok(S.serpentStun > 0, 'and once the grace is out a blow stuns again', `${S.serpentStun}`)
  ];
});

group('a stun and its held pose survive a reload', async () => {
  deepYard(0);
  punchAt(30);
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

group('a called star stuns the fading coil where a wizard lights it', async () => {
  deepYard(3);
  window.__deepCrew({ warlocks: 2 });
  runUntil(() => S.beams.length > 0, 60);
  // The machine is the board's row; its flag is the setup here.
  S.starOpen = true;
  S.starAt = 0;
  let stunned = 0;
  for (let f = 0; f < 60 * 20 && !stunned; f++) { frame(); if (S.serpentStun > 0) stunned = S.serpentStun; }
  return [
    ok(stunned > 0, 'the star lands and the fading coil seizes', `${stunned}`)
  ];
}, { reload: false });

group("a grenadier's burst stuns the warded coil", async () => {
  deepYard(1);
  window.__deepCrew({ grenadiers: 1 });
  window.__levels({ grenadeLevel: 6 });
  const got = runUntil(() => S.serpentStun > 0, 60);
  return [
    ok(got, 'a burst of the seventh rung is a stunning blow on the ward', `stun ${S.serpentStun}, level ${S.grenadeLevel}`)
  ];
});
