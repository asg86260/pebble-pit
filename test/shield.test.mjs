// The shields. Bought the player's way -- through the bench row -- raised a
// piece at a time by bodies crossing the yard, and answered by the next rock.
// Two groups because there are two answers: the timber is come straight
// through, and the stone catches one before it cracks.
import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';
import { SHIELD_PIECE_DUST, PROP_FROM, PROP_COST, PROP_PLANKS,
         NET_COST, NET_ROPES, ARCH_COST, ARCH_BLOCKS,
         JACK_COST, JACK_PARTS, JACK_PUSH } from '../src/config.js';
import { TOWER_UPGRADES } from '../src/tower.js';

// A yard with the coin for a shield and enough rocks behind it to be offered
// one. The arch also wants the quarry open and the timber already answered.
const ready = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(PROP_COST * 2);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2, sparks: JACK_COST * 2 });
  run(1);
};

// Put the yard past one shield: raise it, let the crew finish it, and let the
// next rock answer it. The story is a chain -- each row is offered only once
// the one before has failed -- so a check about the fourth shield has to have
// been through the first three, the way a player would.
const through = (kind, pieces) => {
  window.__buy(kind);
  runUntil(() => (state().shield?.laid ?? 0) >= pieces, 400);
  window.__next();
  const done = runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
  return done;
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

  // through the timber and the rope first, the way the story goes
  openSites();                             // the farm's rope and the quarry's stone
  window.__crew(2, 1);
  through('props', PROP_PLANKS);
  through('net', NET_ROPES);
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

group('the net slows the rock and lets it through anyway', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props', PROP_PLANKS);

  const offered = !!window.__upgrades().find(u => u.key === 'net')?.show();
  const { bought, up } = raise('net', NET_ROPES);

  // It takes hold of the rock like the arch does -- and then, unlike the arch,
  // the rock keeps coming down the whole time it is holding it.
  window.__next();
  const caught = runUntil(() => state().rockHeld, 240);
  const high = state().rockFall;
  const sank = runUntil(() => state().rockHeld && state().rockFall < high - 12, 30);
  const low = state().rockFall;
  const gone = runUntil(() => state().shieldsDone.includes('net'), 60);
  const landed = runUntil(() => state().rock > 0 && !state().rockFall, 120);

  window.__reset();
  return [
    ok(offered, 'the net is offered once the timber has failed'),
    ok(bought && up, 'and the crew sling it a rope at a time'),
    ok(caught, 'it takes hold of the rock'),
    ok(sank && low < high, 'and the rock keeps sinking through it', `${high} -> ${low}`),
    ok(gone, 'the rope pays out and gives up'),
    ok(landed, 'and the rock arrives after all')
  ];
});

group('the jack pushes the rock back up before it buckles', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props', PROP_PLANKS);
  through('net', NET_ROPES);
  through('arch', ARCH_BLOCKS);

  window.__meteor();                       // sparks come off the star
  window.__grant({ sparks: JACK_COST * 2 });
  const offered = !!window.__upgrades().find(u => u.key === 'jack')?.show();
  const { bought, up } = raise('jack', JACK_PARTS);

  // Watched rather than sampled. The whole shove is under three seconds, so a
  // check that looks once a game-second can land either side of it -- what has
  // to be true is that the rock ends up *higher* than where it was caught, so
  // the peak is the thing to watch for and a fixed window is not.
  window.__next();
  const caught = runUntil(() => state().rockHeld, 240);
  const low = state().rockFall;
  let high = low;
  for (let i = 0; i < 120 && !state().shieldsDone.includes('jack'); i++) {
    run(1 / 20);
    if (state().rockHeld) high = Math.max(high, state().rockFall);
  }
  const shoved = high >= low + JACK_PUSH * 0.6;
  const gave = state().shieldsDone.includes('jack');
  const landed = runUntil(() => state().rock > 0 && !state().rockFall, 120);

  window.__reset();
  return [
    ok(offered, 'the jack is offered once the stone has failed'),
    ok(bought && up, 'and the crew build it a part at a time'),
    ok(caught, 'it catches the rock'),
    ok(shoved && high > low, 'and drives it back up', `${low} -> ${high}`),
    ok(gave, 'then the rams give out'),
    ok(landed, 'and the rock comes down on the wreck')
  ];
});

// The beat the arc was built to reach. It is checked for the things that make
// it mean anything -- that somebody was under there, that they are not any
// more, that they walked rather than vanished, and that they are one of the
// crew afterwards -- rather than for how it looked while it happened.
group('under the dome, the one underneath walks out', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props', PROP_PLANKS);
  through('net', NET_ROPES);
  through('arch', ARCH_BLOCKS);
  window.__meteor();
  window.__grant({ sparks: JACK_COST * 2, cores: 20 });
  through('jack', JACK_PARTS);

  const before = state();
  window.__buy('dome');
  runUntil(() => {
    const sh = state().shield;
    return sh && sh.laid >= sh.pieces;
  }, 200);

  window.__next();
  const caught = runUntil(() => state().rockHeld, 240);
  // the rock waits overhead while they get clear
  const walking = runUntil(() => state().intro === 'rescue', 30);
  const heldFor = state().rockHeld;
  const out = runUntil(() => state().rescued && !state().intro, 60);
  const after = state();
  const set = runUntil(() => !state().rockHeld && !state().rockFall, 60);

  window.__reset();
  return [
    ok(before.buried, 'somebody has been under every rock until now'),
    ok(caught && walking, 'the dome holds one and the beat starts', `intro ${state().intro}`),
    ok(heldFor, 'the rock is still up there while they walk out'),
    ok(out, 'they get out'),
    ok(!after.buried && after.rescued, 'and nobody is under the rock any more'),
    ok(after.crew > before.crew, 'they join the crew',
       `${before.crew} -> ${after.crew}`),
    ok(set, 'and only then is the rock set down')
  ];
});

group('the dome holds, and sets every rock down after it', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props', PROP_PLANKS);
  through('net', NET_ROPES);
  through('arch', ARCH_BLOCKS);
  window.__meteor();                       // which also raises the tower
  window.__grant({ sparks: JACK_COST * 2, cores: 20 });

  // The dome is the tower's row, cast rather than carried, and `__upgrades()`
  // is the bench's board -- so it is asked for where it actually lives.
  const dome = () => TOWER_UPGRADES.find(u => u.key === 'dome');
  const before = !!dome()?.show();         // the machine has not failed yet
  through('jack', JACK_PARTS);
  const offered = !!dome()?.show();
  const bought = window.__buy('dome');
  const nobodyCarries = state().shield?.laid === 0;
  const cast = runUntil(() => {
    const sh = state().shield;
    return sh && sh.laid >= sh.pieces;
  }, 200);

  // the first rock it answers
  window.__next();
  const caught = runUntil(() => state().rockHeld, 240);
  const up = state().rockFall;
  const set = runUntil(() => !state().rockHeld && state().rock > 0 && !state().rockFall, 60);
  const after = state();

  // and the one after that, because the dome does not go anywhere
  window.__next();
  const again = runUntil(() => state().rockHeld, 240);
  const settled = runUntil(() => !state().rockHeld && !state().rockFall, 60);

  window.__reset();
  return [
    ok(!before, 'the dome is not offered until the machine has failed too'),
    ok(offered && bought, 'and is bought from the tower, in cores'),
    ok(nobodyCarries, 'nothing of it is carried across the yard'),
    ok(cast, 'the tower pours it over time'),
    ok(caught && up > 0, 'it catches the rock overhead', `${up}px up`),
    ok(set, 'and lets it down rather than dropping it'),
    ok(after.shield && after.shield.kind === 'dome', 'the dome is still standing'),
    ok(again && settled, 'and it catches the next one too')
  ];
});
