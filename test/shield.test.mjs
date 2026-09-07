// The shields. Bought the player's way -- through the bench row -- raised a
// piece at a time by bodies crossing the yard, and answered by the next rock.
// Two groups because there are two answers: the timber is come straight
// through, and the stone catches one before it cracks.
import { group, ok, state, run, runUntil, openSites } from './helpers.mjs';
import { SHIELD_PIECE_DUST, PROP_FROM, PROP_COST, PROP_PLANKS,
         ARCH_COST, ARCH_BLOCKS } from '../src/config.js';

// A yard with the coin for a shield and enough rocks behind it to be offered
// one. The arch also wants the quarry open and the timber already answered.
const ready = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(PROP_COST * 2);
  window.__grant({ shards: ARCH_COST * 2 });
  run(1);
};

// Raise one and let the crew walk it up, a piece per trip.
const raise = (kind, pieces) => {
  const bought = window.__buy(kind);
  const atOnce = state().shield?.laid ?? -1;
  const up = runUntil(() => (state().shield?.laid ?? 0) >= pieces, 400);
  return { bought, atOnce, up };
};

group('the props go up by somebody walking, and the next rock comes through', async () => {
  ready();
  const row = () => window.__upgrades().find(u => u.key === 'props');
  const offered = !!row()?.show();
  const { bought, atOnce, up } = raise('props', PROP_PLANKS);
  const whole = state();

  // Finish the rock and let the next one fall on the finished frame. The fall
  // is under a second, so it cannot be caught at one sample a game-second --
  // the kind leaving `shieldsDone` empty is the fact that it fell through.
  window.__next();
  const answered = runUntil(() => state().shieldsDone.includes('props'), 180);
  const smashed = state();
  const landed = runUntil(() => state().chips === 0, 120);
  const after = state();

  window.__reset();
  return [
    ok(offered, 'the row is on the bench once enough rocks have fallen'),
    ok(bought, 'and it buys, the way a player buys it'),
    ok(atOnce === 0, 'nothing is standing at the moment of purchase', `laid ${atOnce}`),
    ok(up, 'the crew raise it a plank at a time', `laid ${whole.shield?.laid}/${PROP_PLANKS}`),
    ok(answered && !smashed.shield, 'the next rock comes down and straight through it'),
    ok(!smashed.rockHeld, 'timber never holds a rock up'),
    ok(landed && (after.floor + after.pit) - (whole.floor + whole.pit) >=
       Math.round(PROP_PLANKS * SHIELD_PIECE_DUST * 0.5),
       'and the wreck comes most of the way home as dust',
       `${(after.floor + after.pit) - (whole.floor + whole.pit)} cells`),
    ok(!row()?.show(), 'the row never comes back')
  ];
});

// A half-built shield is a thing the yard is in the middle of, so it has to
// survive being put down and picked up. The catch deliberately does not: a
// rock held in the air is a beat a few seconds long, and a save reloaded into
// the middle of one comes back to a rock resting on nothing.
group('a shield still going up is still there after a reload', async () => {
  ready();
  window.__buy('props');
  runUntil(() => (state().shield?.laid ?? 0) >= 3, 200);
  const before = state().shield;

  window.__reload();
  const after = state().shield;

  window.__reset();
  return [
    ok(before && before.laid >= 3, 'some of it is up', `laid ${before?.laid}`),
    ok(!!after, 'and it is still standing after the reload'),
    ok(after && after.kind === before.kind && after.laid === before.laid &&
       after.x === before.x && after.w === before.w && after.h === before.h,
       'with every measurement it had', JSON.stringify(after)),
    ok(after && !after.caught && !state().rockHeld, 'and nothing is held up')
  ];
});

group('the arch catches one, and then the crack runs', async () => {
  ready();
  const arch = () => window.__upgrades().find(u => u.key === 'arch');
  const early = !!arch()?.show();          // the timber has not been through yet

  // through the timber first, the way the story goes
  raise('props', PROP_PLANKS);
  window.__next();
  runUntil(() => state().shieldsDone.includes('props'), 180);
  runUntil(() => state().rock > 0 && !state().rockFall, 60);

  openSites();                             // the arch is cut from the quarry
  window.__crew(2, 1);
  const offered = !!arch()?.show();
  const { bought, up } = raise('arch', ARCH_BLOCKS);
  const whole = state();

  // The catch: the rock stops in the air and is held there. It is a couple of
  // seconds, so it is watched frame by frame rather than sampled once a second.
  window.__next();
  const caught = runUntil(() => state().rockHeld, 180);
  const held = state();
  const restY = held.rockFall;
  const stayed = runUntil(() => !state().rockHeld, 30) && caught;
  const cracked = state();
  const landed = runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 180);
  const after = state();

  window.__reset();
  return [
    ok(!early, 'the arch is not offered before the timber has failed'),
    ok(offered, 'and is offered once it has'),
    ok(bought && up, 'the crew cut it up a block at a time',
       `laid ${whole.shield?.laid}/${ARCH_BLOCKS}`),
    ok(caught && held.shield?.caught, 'it catches the rock in the air'),
    ok(restY > 0, 'and the rock rests above the ground while it holds', `${restY}px up`),
    ok(stayed, 'then the crack runs'),
    ok(cracked.shieldsDone.includes('arch') && !cracked.shield,
       'and the arch comes down with it'),
    ok(landed && after.rock > 0, 'the rock finishes its fall and is minable'),
    ok(!arch()?.show(), 'and the row never comes back')
  ];
});
