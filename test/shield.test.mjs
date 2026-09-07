// The shields. Bought the player's way -- through the bench row -- built the
// yard's way: paying starts a work (works.js), a spare body is lent and stands
// at the landing spot putting the labor in under a bar, and the shield stands
// when the last of it is in. Then the next rock answers it.
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
  // Every price in this game carries its dust equivalent alongside its own coin
  // (DUST_PER in config/machines.js), so a shield priced in shards is also
  // priced in dust. The fixture funds all of it rather than the coin alone.
  window.__give(40000);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2, sparks: JACK_COST * 2 });
  run(1);
};

// Put the yard past one shield: raise it, let the crew finish it, and let the
// next rock answer it. The story is a chain -- each row is offered only once
// the one before has failed -- so a check about the fourth shield has to have
// been through the first three, the way a player would.
const through = (kind) => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  const done = runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
  return done;
};

// Raise one and watch it built: the buy starts a work on the yard, nothing is
// standing while the work is unfinished, and the most hands seen at it says
// whether anybody actually built it -- a shield nobody works on does not go up.
const raise = (kind) => {
  const bought = window.__buy(kind);
  const w0 = state().works.yard;
  const started = !!w0 && w0.key === kind && !state().shield;
  let hands = 0;
  const up = runUntil(() => {
    const w = state().works.yard;
    if (w && w.key === kind) hands = Math.max(hands, w.hands || 0);
    return !!state().shield;
  }, 400);
  return { bought, started, hands, up };
};

group('the props are built by somebody standing at them, and the next rock comes through', async () => {
  ready();
  const row = () => window.__upgrades().find(u => u.key === 'props');
  const offered = !!row()?.show();
  const { bought, started, hands, up } = raise('props');
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
    ok(started, 'paying starts a work on the yard, and nothing is standing yet'),
    ok(hands > 0, 'somebody actually stands at it and builds', `${hands} hands`),
    ok(up, 'and it stands when the labor is in'),
    ok(answered && !smashed.shield, 'the next rock comes down and straight through it'),
    ok(!smashed.rockHeld, 'timber never holds a rock up'),
    ok(landed && (after.floor + after.pit) - (whole.floor + whole.pit) >=
       Math.round(PROP_PLANKS * SHIELD_PIECE_DUST * 0.5),
       'and the wreck comes most of the way home as dust',
       `${(after.floor + after.pit) - (whole.floor + whole.pit)} cells`),
    ok(!row()?.show(), 'the row never comes back')
  ];
});

// A half-built shield is a work the yard is in the middle of, so it has to
// survive being put down and picked up -- which works.js already promises for
// every work; this holds it to that promise for a shield in particular.
group('a shield still going up is still there after a reload', async () => {
  ready();
  window.__buy('props');
  runUntil(() => (state().works.yard?.done ?? 0) > 2 && !state().shield, 200);
  const before = state().works.yard;

  window.__reload();
  const after = state().works.yard;
  const finished = runUntil(() => !!state().shield, 400);

  window.__reset();
  return [
    ok(before && before.key === 'props' && before.done > 2,
       'some of the labor is in', JSON.stringify(before)),
    ok(after && after.key === 'props' && after.done >= before.done - 1,
       'and none of it is lost to a reload', JSON.stringify(after)),
    ok(finished, 'and the build carries on to the end')
  ];
});

group('the arch catches one, and then the crack runs', async () => {
  ready();
  const arch = () => window.__upgrades().find(u => u.key === 'arch');
  const early = !!arch()?.show();          // the timber has not been through yet

  // through the timber and the rope first, the way the story goes
  openSites();                             // the farm's rope and the quarry's stone
  window.__crew(2, 1);
  through('props');
  through('net');
  const offered = !!arch()?.show();
  const { bought, up } = raise('arch');
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
    ok(bought && up, 'somebody builds it and it stands'),
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
  through('props');

  const offered = !!window.__upgrades().find(u => u.key === 'net')?.show();
  const { bought, up } = raise('net');

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
    ok(bought && up, 'somebody builds it and it stands'),
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
  through('props');
  through('net');
  through('arch');

  window.__meteor();                       // sparks come off the star
  window.__grant({ sparks: JACK_COST * 2 });
  const offered = !!window.__upgrades().find(u => u.key === 'jack')?.show();
  const { bought, up } = raise('jack');

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
    ok(bought && up, 'somebody builds it and it stands'),
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
  through('props');
  through('net');
  through('arch');
  window.__meteor();
  window.__grant({ sparks: JACK_COST * 2, cores: 20 });
  through('jack');

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
  through('props');
  through('net');
  through('arch');
  window.__meteor();                       // which also raises the tower
  window.__grant({ sparks: JACK_COST * 2, cores: 20 });

  // The dome is the tower's row, cast rather than carried, and `__upgrades()`
  // is the bench's board -- so it is asked for where it actually lives.
  const dome = () => TOWER_UPGRADES.find(u => u.key === 'dome');
  const before = !!dome()?.show();         // the machine has not failed yet
  through('jack');
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
