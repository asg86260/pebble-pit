// The shields. Bought the player's way -- through the bench row -- built the
// yard's way: paying starts a work (works.js), a spare body is lent and stands
// at the landing spot putting the labor in under a bar, and the shield stands
// when the last of it is in. Then the next rock answers it.
import { group, ok, state, run, runUntil, openSites, yard, buyBuilt } from './helpers.mjs';
import { SHIELD_PIECE_DUST, PROP_FROM, PROP_COST, PROP_PLANKS,
         NET_COST, NET_ROPES, ARCH_COST, ARCH_BLOCKS,
         DOME_BILL, DOME_BURST_MS, DOME_FADE_MS, P } from '../src/config.js';
import { rockShape, boulderAlive } from '../src/rock.js';
import { floor } from '../src/state.js';
import { at, colOf } from '../src/grid.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { domeOrbitR } from '../src/shield.js';
import { DUST_PER } from '../src/levels.js';
import { DEEP_UPGRADES } from '../src/deep/rows.js';

// The dome is priced in everything the yard makes, and the fixture pays for
// it the way the yard would: dust into the hole, the rest through the grant.
const fundDome = () => {
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n);
    else window.__grant({ [money + 's']: n });
  }
};

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
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2 });
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

// The moment it stands gets a fanfare: a wave off the crown and the crew
// cheering under it (shield.js, `fanfare`). Reached the way a player reaches
// it -- bought, built by somebody, and watched a frame at a time over the
// last stretch, because the wave is gone inside a second and a sample a
// game-second would step clean over it.
group('a shield standing finished throws a wave, and the crew cheer', async () => {
  ready();
  window.__buy('props');
  const quiet = state();
  runUntil(() => { const w = state().works.yard; return !!w && w.of && w.done / w.of > 0.9; }, 400);
  let seen = null;
  for (let f = 0; f < 60 * 120 && !seen; f++) {
    run(1 / 60);
    if (state().shield) seen = state();
  }
  window.__reset();
  return [
    ok(!quiet.waves && !quiet.dancing, 'nothing is going on while it is going up'),
    ok(!!seen, 'it stands'),
    ok(seen && seen.waves > 0, 'and a wave goes out from it the frame it does', seen && `${seen.waves} waves`),
    ok(seen && seen.dancing, 'and the crew cheer'),
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
  // Frame by frame to the catch itself: the knock it lands with has died away
  // inside a second, so a second's stride would step over it.
  let caught = false;
  for (let i = 0; i < 180 * 60 && !caught; i++) { window.__fast(1 / 60); caught = state().rockHeld; }
  const held = state();
  const restY = held.rockFall;
  const knocked = held.shake > 0;          // the catch is felt, the frame it happens
  const stayed = runUntil(() => !state().rockHeld, 30) && caught;
  const cracked = state();
  const landed = runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 180);
  const after = state();
  const wonders = !!window.__upgrades().find(u => u.key === 'askwizards')?.show();

  window.__reset();
  return [
    ok(!early, 'the arch is not offered before the timber has failed'),
    ok(offered, 'and is offered once it has'),
    ok(bought && up, 'somebody builds it and it stands'),
    ok(caught && held.shield?.caught, 'it catches the rock in the air'),
    ok(restY > 0, 'and the rock rests above the ground while it holds', `${restY}px up`),
    ok(knocked, 'and the yard feels the catch', `shake ${held.shake}`),
    ok(stayed, 'then the crack runs'),
    ok(cracked.shieldsDone.includes('arch') && !cracked.shield,
       'and the arch comes down with it'),
    ok(landed && after.rock > 0, 'the rock finishes its fall and is minable'),
    ok(!arch()?.show(), 'and the row never comes back'),
    ok(wonders, 'and the bench wonders about the wizards')
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
  // The strain is the payout: a rope that has just caught is not about to go,
  // and one nearly at the ground is. It read as one from the first frame once.
  const fresh = state().shield.strain;
  const sank = runUntil(() => state().rockHeld && state().rockFall < high - 12, 30);
  const low = state().rockFall;
  const partway = state().shield.strain;
  const gone = runUntil(() => state().shieldsDone.includes('net'), 60);
  const landed = runUntil(() => state().rock > 0 && !state().rockFall, 120);

  window.__reset();
  return [
    ok(offered, 'the net is offered once the timber has failed'),
    ok(bought && up, 'somebody builds it and it stands'),
    ok(caught, 'it takes hold of the rock'),
    ok(sank && low < high, 'and the rock keeps sinking through it', `${high} -> ${low}`),
    ok(fresh < 0.2 && partway > fresh && partway < 1,
       'straining harder the further it has paid out', `${fresh} -> ${partway}`),
    ok(gone, 'the rope pays out and gives up'),
    ok(landed, 'and the rock arrives after all')
  ];
});

// The spine: each shield's failure is what opens the next station (DESIGN.md,
// "The shields are the spine"). Read off the boards the way a player reads
// them -- `shown` is the board's own reveal, not the row's `show` -- with
// every coin already in hand, so the only thing standing between the yard
// and each door is the shield before it. Nothing here opens a place by hand:
// the farm, the quarry and the tower are bought through their rows, and the
// shields are raised and answered. The shields are not doors, so the walk
// finds every door already offered, and the shields still answer in their
// order.
group('each shield that fails opens the next station', async () => {
  ready();
  run(1);
  const shown = key => !!window.__rows().find(r => r.key === key)?.shown;
  const build = key => buyBuilt(key, 200);

  const farmEarly = shown('unlockfarm');
  through('props');
  const farmAfter = shown('unlockfarm');
  const farmUp = build('unlockfarm');

  const quarryEarly = shown('unlockquarry');
  through('net');
  const quarryAfter = shown('unlockquarry');
  const quarryUp = build('unlockquarry');

  const towerEarly = shown('unlocktower');
  through('arch');
  const towerAfter = shown('unlocktower');
  const towerUp = build('unlocktower');

  window.__reset();
  // Each place waits on the barrier before it failing (DESIGN.md, "The
  // barriers are the gates"): not offered before, offered after.
  const gated = (early, after) => !early && after;
  const when = 'only once';
  return [
    ok(gated(farmEarly, farmAfter), `the farm is offered ${when} the timber has failed`,
       `${farmEarly} -> ${farmAfter}`),
    ok(farmUp, 'and it builds'),
    ok(gated(quarryEarly, quarryAfter), `the quarry ${when} the rope has failed`,
       `${quarryEarly} -> ${quarryAfter}`),
    ok(quarryUp, 'and it builds'),
    ok(gated(towerEarly, towerAfter), `the tower ${when} the stone has failed`,
       `${towerEarly} -> ${towerAfter}`),
    ok(towerUp, 'and it builds')
  ];
});

// The beat the arc was built to reach. It is checked for the things that make
// it mean anything -- that somebody was under there, that they are not any
// more, that they walked rather than vanished, and that they are one of the
// crew afterwards -- rather than for how it looked while it happened.
group('under the dome, the rock bursts and the one underneath walks out', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props');
  through('net');
  through('arch');
  window.__meteor();                       // which also raises the tower
  fundDome();
  window.__crew(2, 1, 0, 0, 0, 1);         // and somebody who can fly

  const before = state();
  window.__buy('dome');
  runUntil(() => {
    const sh = state().shield;
    return sh && sh.laid >= sh.pieces;
  }, 200);

  window.__next();
  // Frame by frame, because the fall, the held beat and the burst are over
  // inside a second -- read straight off the yard, since a snapshot a frame
  // for a minute of frames is the slow part of the file.
  const S = yard.S;
  const sh = S.shield;
  const domeFrom = sh.x, domeTo = sh.x + sh.w;
  let caught = false, caughtAt = 0, squashed = false, sheets = 0, burstAt = 0, grit = 0;
  for (let i = 0; i < 60 * 240 && !burstAt; i++) {
    run(1 / 60);
    if (!caught) {
      if (S.rockHeld) {
        caught = true; caughtAt = yard.clock.now();
        sheets = S.boulder.reduce((n, row) => n + row.reduce((m, v) => m + v, 0), 0);
      }
      continue;
    }
    if (S.rockHeld && rockShape().squash > 0) squashed = true;
    if (!S.rockHeld) { burstAt = yard.clock.now(); grit = S.chips.filter(c => c.dome).length; }
  }
  const gone = !boulderAlive() && S.rockFall === 0 && !S.rockHeld;
  const walking = state().beat.yard === 'rescue';
  // Every burst grain comes down, and none of it settles between the dome's
  // feet: the ground there is counted as the grit leaves the rock and again
  // once the last of it is down, and it has not grown.
  const under = () => {
    let n = 0;
    for (let c = colOf(floor, domeFrom); c < colOf(floor, domeTo); c++)
      for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
    return n;
  };
  const underBefore = under();
  const flying = new Set(S.chips.filter(c => c.dome));
  let down = 0;
  for (let i = 0; i < 60 * 20 && flying.size; i++) {
    run(1 / 60);
    const up = new Set(S.chips);
    for (const ch of flying) if (!up.has(ch)) { down++; flying.delete(ch); }
  }
  const underAfter = under();
  const storedThen = state().stored;
  const out = runUntil(() => state().rescued && !state().beat.yard, 90);
  const after = state();
  // and the haulers carry it to the hole
  const carried = runUntil(() => state().stored > storedThen + 50, 120);
  run(5);
  const later = state();

  window.__reset();
  return [
    ok(before.buried, 'somebody has been under every rock until now'),
    ok(caught && walking, 'the dome takes hold of one and the beat starts', `beat ${state().beat.yard}`),
    ok(squashed, 'the rock sits squashed on the crown while it is held'),
    ok(burstAt && Math.abs(burstAt - caughtAt - DOME_BURST_MS) <= 1000 / 60 * 2,
       `and bursts ${DOME_BURST_MS}ms after`, `${burstAt - caughtAt}ms`),
    ok(gone, 'the rock is gone once it has burst'),
    ok(sheets > 0 && grit === sheets, 'into a grain for every sheet of it', `${grit} grains, ${sheets} sheets`),
    ok(!flying.size && down === grit, 'every grain comes down', `${down} of ${grit}`),
    ok(underAfter <= underBefore, 'and none of it settles between the dome\'s feet',
       `${underBefore} -> ${underAfter}`),
    ok(carried, 'the haulers carry it to the hole', `${storedThen} -> ${state().stored}`),
    ok(out, 'they get out'),
    ok(!after.buried && after.rescued, 'and nobody is under the rock any more'),
    ok(after.crew > before.crew, 'they join the crew',
       `${before.crew} -> ${after.crew}`),
    ok(after.buriedMs > before.buriedMs && later.buriedMs === after.buriedMs,
       'the clock over them ran until they walked out, and stopped there',
       `${before.buriedMs} -> ${after.buriedMs} -> ${later.buriedMs}`)
  ];
});

// The dome answers the one rock it was for, and then it is done. Its whole
// job is the rescue, so the frame the rescue beat ends it starts to fade, and
// DOME_FADE_MS later it is gone, remembered in `shieldsDone` like the kinds
// that broke -- and the next rock waits for it to go, then comes down on the
// ground, hard, the way rocks do.
group('the dome bursts the rescue rock, and then fades out', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props');
  through('net');
  window.__meteor();                       // which also raises the tower
  fundDome();

  // The dome is the tower's row, cast rather than carried, and `__upgrades()`
  // is the bench's board -- so it is asked for where it actually lives.
  const dome = () => TOWER_UPGRADES.find(u => u.key === 'dome');
  const before = !!dome()?.show();         // the stone has not failed yet
  through('arch');
  const noFlyers = !!dome()?.show();       // nobody who can fly yet, either
  window.__crew(2, 1, 0, 0, 0, 1);
  const offered = !!dome()?.show();
  const bought = window.__buy('dome');
  const nobodyCarries = state().shield?.laid === 0;
  // The pour is the wizards': it only climbs while somebody is aloft and
  // channeling over the crown, and nothing appears on the yard's own works.
  let poured = false;
  const cast = runUntil(() => {
    const s = state();
    if (s.aloft > 0 && s.shield && s.shield.laid > 0) poured = true;
    return s.shield && s.shield.laid >= s.shield.pieces;
  }, 240);
  const noGroundWork = !state().works.yard;

  // the first rock it answers -- the rescue rock
  window.__next();
  const S = yard.S;
  const landedBefore = S.landAt;
  // Frame by frame: the hold is a held beat, gone inside a second's stride.
  let caught = false, up = 0;
  for (let i = 0; i < 60 * 240 && !caught; i++) {
    run(1 / 60);
    if (S.rockHeld) { caught = true; up = S.rockFall; }
  }
  // Frame by frame through the burst: a fading dome is still `S.shield` for
  // DOME_FADE_MS, so a second's stride would step into the middle of it.
  let burst = false, atBurst = null;
  for (let i = 0; i < 60 * 120 && !burst; i++) {
    run(1 / 60);
    if (!S.rockHeld) { burst = true; atBurst = { landAt: S.landAt, alive: boulderAlive(), shield: S.shield && { ...S.shield } }; }
  }
  const stillUp = !!S.shield && S.shield.kind === 'dome';
  // The rock bursts while the one underneath is still in the ground (the
  // `rescue` beat), and the dome stands over the dig and the walk: the
  // fade waits for the beat to end, and starts on the frame it does (the
  // beats step before the shield).
  let walkOver = false, heldOff = true;
  for (let i = 0; i < 60 * 60 && !walkOver; i++) {
    if (S.beat.yard !== 'rescue') { walkOver = true; break; }
    if (!S.shield || S.shield.fading) heldOff = false;
    run(1 / 60);
  }
  run(1 / 60);
  const fading = !!S.shield && S.shield.fading > 0;
  const fadeFrom = S.shield && S.shield.fading;
  // the whole fade is a shield that is still there and never catches anything
  let heldWhileFading = false, gone = false, goneAt = 0, rockWhileFading = false;
  for (let i = 0; i < 60 * 10 && !gone; i++) {
    run(1 / 60);
    if (S.shield && S.rockHeld) heldWhileFading = true;
    if (S.shield && S.rockFall > 0) rockWhileFading = true;
    if (!S.shield) { gone = true; goneAt = yard.clock.now(); }
  }
  const done = state().shieldsDone.includes('dome');
  const rowBack = !!dome()?.show();
  const wonders = !!window.__upgrades().find(u => u.key === 'askwizards')?.show();
  const restoredDone = (() => { window.__reload(); return !state().shield && state().shieldsDone.includes('dome'); })();

  // and the one after that comes down on bare ground, the way rocks do
  window.__next();
  let everHeld = false;
  const landed = runUntil(() => { if (state().rockHeld) everHeld = true; return state().rock > 0 && !state().rockFall; }, 240);
  const landAt = S.landAt;

  window.__reset();
  return [
    ok(!before, 'the dome is not offered until the machine has failed too'),
    ok(!noFlyers, 'nor until somebody can fly'),
    ok(offered && bought, 'and is bought from the tower'),
    ok(nobodyCarries, 'nothing of it is carried across the yard'),
    ok(cast && poured, 'the wizards ring it and pour it up', `laid ${state().shieldsDone}`),
    ok(noGroundWork, 'and no work of it ever touches the ground'),
    ok(caught && up > 0, 'it catches the rock overhead', `${up}px up`),
    ok(burst && !atBurst.alive && atBurst.landAt === landedBefore, 'and bursts it rather than letting it land',
       atBurst && `landAt ${landedBefore} -> ${atBurst.landAt}`),
    ok(stillUp && !atBurst.shield.fading, 'the dome is still standing after the burst'),
    ok(walkOver && heldOff, 'and stands until the two of them have met under it'),
    ok(fading, 'then starts to fade the frame after', `fading ${fadeFrom}`),
    ok(gone && !heldWhileFading, 'it catches nothing while it fades, and then it is gone'),
    ok(!rockWhileFading, 'and no rock comes down through it while it fades'),
    ok(gone && Math.abs(goneAt - fadeFrom - DOME_FADE_MS) <= 1000 / 60 * 2,
       `gone ${DOME_FADE_MS}ms after the fade began`, `${goneAt - fadeFrom}ms`),
    ok(done, 'and it is remembered as answered, like the kinds that broke'),
    ok(!rowBack && !wonders, 'so neither its row nor the thought of it comes back'),
    ok(restoredDone, 'and a reload keeps it gone'),
    ok(landed && !everHeld, 'the next rock is never held'),
    ok(landed && landAt > 0, 'and lands on the ground with a shake', `landAt ${landAt}`)
  ];
});

// --- the dome is a call ------------------------------------------------------
// A wizard up at the star is called off it when the dome is bought, and it
// flies there flat out: the star is the whole width of the yard away, and at
// its climbing pace the wizard drifted over the houses for most of a minute
// before the first of the pour. The pour starts within seconds now, and it
// is the wizard's own pouring that it starts on -- nothing else moves it.
group('a wizard at the star is called to the dome, and gets there fast', async () => {
  ready();
  openSites();
  window.__crew(2, 1);
  through('props');
  through('net');
  window.__wizardHat();                    // a hat, and a star to fly up to
  fundDome();
  through('arch');
  window.__crew(2, 1, 0, 0, 0, 1);
  runUntil(() => state().aloft > 0, 120);  // up at the star, ring or climb
  run(20);
  const starY = state().wizardY[0];
  const bought = window.__buy('dome');
  const far = Math.abs(state().meteorX - (state().shield.x + state().shield.w / 2));
  const poured = runUntil(() => state().shield && state().shield.laid > 0, 12);
  const y = state().wizardY[0];
  // The ring hangs just over the crown (`domeSpot`), so where the body has
  // come down to is measured against the dome standing rather than against a
  // drop typed in here -- a wider dome is a taller one, and a higher ring.
  const ringY = state().groundY - (state().shield.h + 4) * P;
  window.__reset();
  return [
    ok(bought, 'the dome is bought out from under a wizard at the star'),
    ok(far > 2000, 'which is the far side of the yard', `${far}px`),
    ok(poured, 'and the pour starts within seconds of the buy, not most of a minute'),
    ok(y > starY && Math.abs(y - ringY) <= domeOrbitR() + P * 2,
       'the body having come down to the ring over the crown', `${starY} -> ${y}, ring at ${ringY}`)
  ];
});

// --- the dome is the dearest thing in the game --------------------------------
// Asserted against every row on every board rather than against a number typed
// in here: a new machine or a raised price anywhere is what would make this
// wrong, and this is where it would be caught. Each of the dome's coins stands
// above the biggest ask of that coin on any other row *at any rung* -- the
// ladders are climbed first, because a ladder's dearest rung is its last and
// the check used to read its first -- and the whole bill, in dust, stands
// above every other bill in dust.
// The dome is the first half's dearest thing; the deep comes after it, and
// its ladders are priced against the second half, so they are not in this.
group('the dome is priced in every coin and is the dearest thing on any board', async () => {
  window.__reset();
  const inDust = bill => bill.reduce((d, [money, n]) =>
    d + (money === 'time' ? 0 : money === 'dust' ? n : (DUST_PER[money] || 0) * n), 0);
  const dome = window.__rows().find(r => r.key === 'dome');
  // every bill every other row will ever ask, one entry a rung
  const deep = new Set(DEEP_UPGRADES.map(u => u.key));
  const rows = window.__climbed().filter(r => r.key !== 'dome' && !deep.has(r.key))
    .flatMap(r => r.bills.map((bill, i) =>
      ({ key: r.bills.length > 1 ? `${r.key}@${i + 1}` : r.key, bill })));
  window.__reset();
  const coins = ['dust', 'shard', 'spore', 'spark'];
  const domeLine = money => (dome.bill.find(([m]) => m === money) || [money, 0])[1];
  const topOf = money => rows.reduce((best, r) => {
    const n = (r.bill.find(([m]) => m === money) || [money, 0])[1];
    return n > best.n ? { n, key: r.key } : best;
  }, { n: 0, key: null });
  const under = coins.filter(money => domeLine(money) <= topOf(money).n)
                     .map(money => `${money}: ${topOf(money).key} asks ${topOf(money).n}`);
  const dearest = rows.reduce((best, r) => inDust(r.bill) > inDust(best.bill) ? r : best, rows[0]);
  return [
    ok(!!dome, 'the dome is on a board'),
    ok(coins.every(money => domeLine(money) > 0), 'and costs every coin the yard has',
       JSON.stringify(dome.bill)),
    ok(under.length === 0, 'more of each than anything else asks', under.join('; ')),
    ok(inDust(dome.bill) > inDust(dearest.bill), 'and more in all than the next dearest row',
       `${inDust(dome.bill)} against ${dearest.key} at ${inDust(dearest.bill)}`)
  ];
});
