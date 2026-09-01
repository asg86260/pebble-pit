// The machines: the record, the capacity rule, and the way back.
//
// Nothing here runs a machine yet -- there is no drawing, no beat and no lever
// to throw. What is checked is the part everything else stands on: that a
// station being worked by a machine holds one body, that the gang it displaced
// is walked to carrying rather than deleted, that throwing the lever off gets
// them back, and that a machine left running by one check cannot silently
// rewrite what the next one is allowed to mean.

import { yard, group, ok, state, run, runUntil, quickCrew, openSites, haveRock, P, WORKER } from './helpers.mjs';

// The two boards nobody could buy from.
//
// `everyRow` -- the list `__buy` looks a key up in -- was missing the quarry's
// and the farm's boards, so `__buy('quarrybench')` answered `false` whatever it
// did. A check written against it would have passed by asserting nothing at all,
// which is worse than one that fails. The machines' own rows live on those two
// boards, so it is worth knowing this works before there is a machine on them.
group('a station board can be bought from at all', async () => {
  window.__reset();
  openSites();
  // `__grant` has no dust in it -- dust is banked, not granted -- and the farm's
  // rows are priced in it now.
  window.__grant({ shards: 400, spores: 400 });
  window.__tip(9000);
  const before = state().benches;
  const bought = window.__buy('quarrybench');
  const after = state().benches;

  const plots0 = state().plotCount;
  const grew = window.__buy('farmplot');
  const plots1 = state().plotCount;
  return [
    ok(bought, 'the quarry board answers when a row on it is bought'),
    ok(after === before + 1, 'and the bench is actually taken out',
       `${before} -> ${after}`),
    ok(grew && plots1 === plots0 + 1, 'and the same for the farm',
       `${plots0} -> ${plots1}`)
  ];
});

// Every slot a station will ever have, which is what a machine is gated behind.
group('a fully slotted yard is a thing a check can ask for', async () => {
  window.__reset();
  openSites();
  const full = window.__fullSites();
  const s = state();
  const quarry = s.roster.find(r => r.job === 'quarriers');
  const farm = s.roster.find(r => r.job === 'farmhands');
  return [
    ok(full.benches === 5, 'the cut is down to its last bench', `${full.benches}`),
    ok(full.plots === 7, 'and the whole plot is broken', `${full.plots}`),
    ok(full.pick === 5 && full.speed === 5, "and the rock's kit is bought out",
       `pick ${full.pick}, speed ${full.speed}`),
    ok(quarry && quarry.cap === 5, 'so the cut has five places to stand',
       `cap ${quarry && quarry.cap}`),
    ok(farm && farm.cap === 7, 'and the farm seven', `cap ${farm && farm.cap}`)
  ];
});

// There is no switch, and this is what stands in its place.
//
// A machine is stopped by taking its tender off and started by putting one back,
// through the very `-` and `+` the station already has. That is not a smaller
// version of the lever it replaced -- it is the yard's oldest rule doing the job
// on its own: a station idles until somebody is actually standing there, so an
// unmanned machine produces nothing and smokes nothing without anything being
// written to make it so.
//
// Asserted on `workedAt`, which is stamped by bites, rather than on a flag: a
// flag could be set by anything, and what is actually claimed here is that the
// machine stopped *doing work*.
group('a machine is stopped by taking its tender off', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);
  window.__fullSites();
  window.__grant({ spores: 999, shards: 999, sparks: 999 });
  window.__tip(90000);
  window.__buy('jaw');
  window.__fast(12);
  const running = state();

  // Off, through the roster's own button and not a hook that reaches past it.
  window.__assign('quarriers', -1);
  window.__fast(10);
  const off = state();

  window.__assign('quarriers', 1);
  window.__fast(10);
  const back = state();
  window.__crew(0, 0, 0);
  return [
    ok(running.machines.jaw.bought, 'the jaw is bought and standing'),
    ok(running.quarriers === 1, 'with one body tending it', `${running.quarriers}`),
    ok(running.machines.jaw.workedAt > 0, 'and it is getting work done',
       `workedAt ${running.machines.jaw.workedAt}`),
    ok(off.quarriers === 0, 'the tender is taken off from the roster', `${off.quarriers}`),
    ok(off.machines.jaw.workedAt === running.machines.jaw.workedAt,
       'and the machine stops dead: not one more bite with nobody there',
       `${running.machines.jaw.workedAt} -> ${off.machines.jaw.workedAt}`),
    ok(back.quarriers === 1, 'a body put back on walks to it again', `${back.quarriers}`),
    ok(back.machines.jaw.workedAt > off.machines.jaw.workedAt,
       'and it works again, with nothing to switch',
       `${off.machines.jaw.workedAt} -> ${back.machines.jaw.workedAt}`)
  ];
});

// The rule the whole feature stands on.
group('a machine at a station leaves room for one body', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);                    // five down the cut, which is its lot
  window.__fullSites();
  const before = state();
  const cutBefore = before.quarriers, haulBefore = before.haulers;

  window.__machine('jaw', { bought: true });
  const on = state();
  const cut = on.roster.find(r => r.job === 'quarriers');

  window.__crew(0, 0, 0);
  return [
    ok(cutBefore === 5, 'five hands at the cut to begin with', `${cutBefore}`),
    ok(on.quarriers === 1, 'a machine leaves one body at the station',
       `${cutBefore} -> ${on.quarriers}`),
    ok(cut && cut.cap === 1, 'and the roster says so', `cap ${cut && cut.cap}`),
    ok(cut && cut.hands === 5, 'while the complement it stands in for is still five',
       `hands ${cut && cut.hands}`),
    // Nobody is deleted. The four go back to the one job nobody is assigned to.
    ok(on.crew === before.crew, 'nobody is deleted by standing one up',
       `${before.crew} -> ${on.crew}`),
    ok(on.haulers === haulBefore + 4, 'the four it displaced carry dust instead',
       `${haulBefore} -> ${on.haulers}`)
  ];
});

// The rock is the one station with no floor plan, and the one `rebalance` used
// to leave alone -- its clamp list was written out by hand with `miners` left
// off, because clamping to `Infinity` is a no-op. That was true right up until a
// machine made it finite.
group('the ram is the case the old clamp list would have missed', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(6, 0);                       // six on the rock, which has no cap
  const before = state();

  window.__machine('ram', { bought: true });
  const on = state();
  const rock = on.roster.find(r => r.job === 'miners');

  window.__crew(0, 0);
  return [
    ok(before.miners === 6, 'six on the rock, more than any station holds',
       `${before.miners}`),
    ok(before.roster.find(r => r.job === 'miners').cap === null,
       'and the rock has no floor plan to run out of'),
    ok(on.miners === 1, 'the ram leaves one body on it too', `${before.miners} -> ${on.miners}`),
    ok(rock && rock.hands === 5, "and stands in for the rock's notional gang of five",
       `hands ${rock && rock.hands}`)
  ];
});

// What the machine is worth, stated as a number a check can read rather than a
// comment that asserts it.
group('a machine is worth its complement times the dial', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  // Tuned *away* from the default and back, so the group can tell a rate that is
  // read off the dial from one that happens to match it. Setting the dial to the
  // value it already had proved nothing at all.
  window.__crew(0, 1);                       // the carrying post only shows with a crew
  window.__tune('MACHINE_GAIN', 2);
  const two = state().machines;
  window.__tune('MACHINE_GAIN', 1.5);
  const s = state();
  const jaw = s.machines.jaw, ram = s.machines.ram, till = s.machines.tiller;
  return [
    // The complement, plus one again for each of it that is wearing a hat,
    // times the dial. A machine is gated behind a full set -- three, `KIT_MAX` --
    // so the gang it stands in for is five benches of which three are hatted:
    // eight hands, and the jaw is half again on top of that.
    ok(jaw.hands === 5 && jaw.kitFull && Math.abs(jaw.rate - 12) < 0.01,
       'five benches, three of them hatted, is twelve hands',
       `${jaw.hands} kitted -> ${jaw.rate}`),
    ok(till.hands === 7 && Math.abs(till.rate - 15) < 0.01,
       'seven furrows and three brims is fifteen', `${till.hands} -> ${till.rate}`),
    ok(ram.hands === 5 && Math.abs(ram.rate - 12) < 0.01,
       "and the rock's five puts the ram level with the jaw",
       `${ram.hands} -> ${ram.rate}`),
    ok(Math.abs(two.jaw.rate - 16) < 0.01 && Math.abs(two.tiller.rate - 20) < 0.01,
       'and the whole of it moves with the dial rather than being written down',
       `at 2: jaw ${two.jaw.rate}, tiller ${two.tiller.rate}`),
    // Carrying has no floor plan either, and used to report none. It has a
    // complement now because it has a machine: what the belt stands in for is a
    // full crew of carriers, and a station a machine can replace has to be able
    // to say what it is worth.
    ok((s.roster.find(r => r.job === 'haulers') || {}).hands === 6,
       'and carrying, which has a belt now, reports the whole lip gang',
       `${JSON.stringify((s.roster.find(r => r.job === 'haulers') || {}).hands)}`)
  ];
});

// The single highest-value edit in the feature. `__crew` already zeroes the
// scrubbers and the janitors, with an essay about bodies leaking into a station
// the caller never named. A machine left running is that trap one level worse:
// it does not merely move bodies, it changes what the next `__crew(0, 0, 3)` is
// *allowed* to mean.
group('a machine cannot leak from one check into the next', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);
  window.__machine('jaw', { bought: true });
  const left = state().machines.jaw.bought;

  // ...and now whatever runs next asks for a staffed cut, exactly as it would.
  window.__crew(0, 0, 3);
  window.__fullSites();
  const after = state();
  window.__crew(0, 0, 0);
  return [
    ok(left, 'a check leaves a machine standing'),
    ok(!after.machines.jaw.bought, 'and the next __crew takes it away', 'still there'),
    ok(after.quarriers === 3, 'so the cut it asked for is the cut it gets',
       `${after.quarriers} of 3`)
  ];
});

// Facts survive a reload; a walk in progress does not, because no body does.
group('what a machine remembers across a reload', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);
  window.__machine('jaw', { bought: true });
  const before = state().machines;

  // The gang is put back at the cut *in the save*, which is a state the yard can
  // genuinely write: `buyMachine` sets the latch and the rebalance happens on a
  // later frame, so a tab closed in between saves five quarriers alongside a
  // standing jaw. The load is the only thing that can fix it.
  yard.S.quarriers = 5;
  yard.S.haulers = 0;

  // A cold load, not the dev reload. `__reload` is persist-then-restore in one
  // process, so a machine still running in memory makes restore's rebalance
  // clamp by accident -- which is exactly how the ordering bug this asserts
  // against hid for a commit.
  window.__cold();
  const after = state().machines;
  const s = state();
  window.__crew(0, 0, 0);
  return [
    ok(after.jaw.bought, 'a bought machine comes back bought', JSON.stringify(after.jaw)),
    ok(!after.ram.bought, 'one nobody bought is still unbought'),
    ok(s.quarriers === 1,
       'the cap is applied on the way in, not after the gang has been placed',
       `${s.quarriers} at the cut, cap ${s.roster.find(r => r.job === 'quarriers').cap}`),
    ok(s.haulers === 4, 'and the four it displaced are carrying dust',
       `${s.haulers} carrying`)
  ];
});

// --- the jaw --------------------------------------------------------------------
// The machine that works the cut. What it does is what a quarrier does, through
// the same two functions, one cell at a time -- and the checks below are mostly
// about that "one cell at a time", because it is what everything underneath
// stands on.
group('a manned jaw digs, and an unmanned one does not', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 1);                    // one tender, which is all it holds
  window.__machine('jaw', { bought: true });
  window.__clearFloor();
  runUntil(() => {
    const q = yard.S.workers.find(o => o.type === 'quarrier');
    return q && !q.walking;
  }, 40);

  const a0 = state().quarryTotal;
  run(8);
  const worked = state().quarryTotal - a0;

  // and now take the tender away, and nothing else about the machine changes
  for (const w of yard.S.workers) w.lifted = true;
  const b0 = state().quarryTotal;
  for (let i = 0; i < 30; i++) { for (const w of yard.S.workers) w.lifted = true; run(0.3); }
  const alone = state().quarryTotal - b0;

  for (const w of yard.S.workers) w.lifted = false;
  // Read before `__crew`, which takes every machine away on purpose.
  const still = state().machines.jaw.bought;
  window.__crew(0, 0, 0);
  return [
    ok(worked > 0, 'a machine with somebody standing at it takes the ground out',
       `${worked} cells`),
    ok(alone === 0, 'and one with nobody at it does nothing at all',
       `${alone} cells with nobody standing there`),
    ok(still, 'and it is still standing there -- idle, not gone, and nothing was switched')
  ];
});

// The invariant the whole scatter rests on. `findShards` pays a dig exactly its
// seam *because* the count of what is left is taken before each single cell
// comes out, which is what makes the last cell one-in-one. A jaw that took a
// column at a beat would quietly rewrite what `dig deeper` is worth.
group('a jaw pays a dig exactly what a gang would', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 1);
  // Wound right down for the measuring. At its real rate the jaw takes a hole
  // out in well under a second, and a whole dig can begin and end inside one
  // sample -- so the fall-ins get miscounted and the sum comes out one short.
  // What is being checked is the arithmetic of the payout, not the speed of it.
  window.__tune('MACHINE_GAIN', 0.15);
  window.__machine('jaw', { bought: true });
  window.__clearFloor();
  run(4);

  const quarried = () => state().crewNames.split(' ')
    .reduce((a, p) => a + (+(p.split('|')[4] || 'q0').slice(1) || 0), 0);

  // Measured between two fall-ins, exactly as the hand version is: a dig caught
  // half done has some of its stone up and the rest still in the ground.
  let digs = -1, seam = state().seam, was = state().quarryDug, q0 = 0, q1 = 0;
  for (let i = 0; i < 900; i++) {
    run(0.4);
    window.__clearFloor();
    const s = state();
    if (s.quarryDug < was - 0.3) {
      if (digs < 0) { digs = 0; q0 = q1 = quarried(); }
      else { digs++; q1 = quarried(); }
    }
    was = s.quarryDug;
    seam = s.seam;
  }
  digs = Math.max(0, digs);
  const got = q1 - q0;
  window.__tune('MACHINE_GAIN', 1.5);
  window.__crew(0, 0, 0);
  return [
    ok(digs > 0, 'the jaw digs a hole right out and it falls back in',
       `${digs} digs`),
    // Within one, and the one is the frame boundary rather than slack in the
    // arithmetic: the tally is read on the sample that catches a fall-in, and a
    // find landing in that same frame after the ground has come back is counted
    // against the next dig. Anything actually wrong with the payout -- a dig
    // paying twice, or half -- is orders of magnitude outside this.
    ok(Math.abs(got - digs * seam) <= 1,
       'and each one pays its seam, no more and no less',
       `${got} over ${digs} digs of ${seam}`)
  ];
});

// A machine obeys the station's own rules, because it is asking them through the
// station's own functions rather than keeping its own copy.
group('a full pile stops the jaw like it stops a gang', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 1);
  window.__machine('jaw', { bought: true });
  window.__clearFloor();
  run(4);

  // fill the quarry's own strip until the station stands down
  const p = state().piles.find(x => x.key === 'quarry');
  for (let i = 0; i < 400; i++) window.__pile(p.from + (i % 40) * 4, 6);
  run(2);
  const full = state();
  const a0 = full.quarryTotal;
  run(6);
  const whileFull = state().quarryTotal - a0;

  window.__clearFloor();
  const b0 = state().quarryTotal;
  run(6);
  const after = state().quarryTotal - b0;
  window.__crew(0, 0, 0);
  return [
    ok(full.pileFull.quarry, 'the quarry pile is full', `${JSON.stringify(full.pileCount)}`),
    ok(whileFull === 0, 'and the jaw stands down with it', `${whileFull} cells`),
    ok(after > 0, 'and starts again the moment there is room', `${after} cells`)
  ];
});

// What the machine costs the sky. Measured against the dial rather than against
// an absolute, because the band saturates -- past MOTE_CAP a mote is turned away
// with its dirt -- and a standing count reads the same at the cap whatever the
// rate. Two runs of the same work, one dirty machine and one clean, is a
// comparison the ceiling cannot flatten.
group('a machine is dirtier per unit of work than the hands were', async () => {
  const perCell = foulDial => {
    window.__reset();
    openSites();
    window.__fullSites();
    window.__tune('MACHINE_FOUL', foulDial);
    window.__crew(0, 0, 1);
    window.__machine('jaw', { bought: true });
    window.__clearFloor();
    window.__air({ haze: 0, muck: 0 });
    // Wait for the tender to actually be at the machine. A window that is spent
    // walking reads as a clean run, and comparing a working machine against a
    // walking one is not the comparison this group is about.
    runUntil(() => {
      const q = yard.S.workers.find(o => o.type === 'quarrier');
      return q && !q.walking && state().quarryTotal > 0;
    }, 40);
    const c0 = state().quarryTotal, s0 = state().smog.sky;
    for (let i = 0; i < 20; i++) { run(0.5); window.__clearFloor(); }
    const cells = state().quarryTotal - c0, made = state().smog.sky - s0;
    return { cells, made, per: made / Math.max(1, cells) };
  };

  const clean = perCell(1);
  const dirty = perCell(3);
  window.__crew(0, 0, 0);
  return [
    ok(clean.cells > 0 && dirty.cells > 0, 'the jaw works either way',
       `${clean.cells} and ${dirty.cells} cells`),
    ok(clean.made > 0, 'and digging dirties the sky at all', `${clean.made}`),
    ok(dirty.per > clean.per * 1.5,
       'and a machine at three fouls well over one lot per cell of work',
       `${clean.per.toFixed(2)} -> ${dirty.per.toFixed(2)} per cell`)
  ];
});

// --- the tiller -----------------------------------------------------------------
// The one machine that travels, and the one whose tender travels with it.
group('the tiller crawls the row and brings the plots in', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 0, 1);                 // one tender at the farm
  window.__machine('tiller', { bought: true });
  window.__clearFloor();
  run(6);

  const a0 = state().pileCount.farm;
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    run(0.5);
    const m = state().machines.tiller;
    if (m && m.x != null) seen.add(Math.round(m.x / 40));
  }
  const cut = state().pileCount.farm - a0;

  // and with nobody at it, it stops where it stands
  for (let i = 0; i < 20; i++) { for (const w of yard.S.workers) w.lifted = true; run(0.3); }
  const b0 = state().pileCount.farm;
  for (let i = 0; i < 20; i++) { for (const w of yard.S.workers) w.lifted = true; run(0.3); }
  const alone = state().pileCount.farm - b0;

  for (const w of yard.S.workers) w.lifted = false;
  window.__crew(0, 0, 0);
  return [
    ok(cut > 0, 'the tiller brings plots in and cuts them', `${cut} onto the pile`),
    ok(alone === 0, 'and stops where it stands with nobody at it', `${alone} more`)
  ];
});

// --- the ram --------------------------------------------------------------------
// The ram is measured against itself with the lever off, and it has to be.
//
// The first version of this group asserted `took > 0` with the ram running and
// called that proof -- but the one miner the cap leaves at the station is still
// a miner, and its own swings are what that number counted. The ram took *no*
// bites at all for the whole of that commit, and the check said it was working.
// A machine is only ever proved by the difference it makes.
group('the ram works the rock, measured against not having one', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(1, 0);
  window.__clearFloor();
  window.__jump(3);
  run(4);

  // The same one body, the same rock, twice: once with the lever off and once on.
  // The yard is swept as we go. Without it this measures which of the two fills
  // the rock's pile first -- there are no haulers here, the station stands down
  // at PILE_LIMIT, and the quicker worker simply jams sooner. That is a real
  // thing about the yard and it is not the thing this group is about.
  // Counted off the crew rather than off the hill. `state().rock` is what is
  // left of the boulder, which goes *up* when one is finished and the next comes
  // down -- and the ram is quick enough to do that inside the window, which read
  // as the machine putting rock back.
  const mined = () => state().crewNames.split(' ')
    .reduce((a, p) => a + (+(p.split('|')[3] || 'm0').slice(1) || 0), 0);
  // Swept often, not occasionally. The ram fills the rock's pile in well under
  // half a second, and a station stands down on a full pile -- so a sweep every
  // half second measures how fast the yard can be tidied rather than how fast the
  // machine works. (That throttle is real and is the right pressure on haulage;
  // it is simply not what this group is about.)
  const window10 = () => {
    const before = mined();
    for (let i = 0; i < 100; i++) { run(0.1); window.__clearFloor(); }
    return mined() - before;
  };
  const byHand = window10();

  window.__jump(3);
  window.__machine('ram', { bought: true });
  run(4);
  const byMachine = window10();
  const worked = state().machines.ram.workedAt > 0;

  window.__crew(0, 0, 0);
  return [
    ok(byHand > 0, 'one pair of hands takes rock off the hill', `${byHand} cells`),
    ok(worked, 'the ram actually gets a bite in, which is the thing that was never true'),
    // A floor, not a measurement. The ram is worth fifteen hands against one
    // hatted pair, so the honest figure is nearer seven times -- but this runs
    // alongside fifteen other files on a busy machine, and a starved frame costs
    // the machine more than it costs a body that only swings twice a second.
    ok(byMachine > byHand * 1.5,
       'and the ram takes off a great deal more than the hands it stood down',
       `${byHand} by hand -> ${byMachine} by machine`)
  ];
});

// A tender tends. It does not also work its own face, which is the bug that
// made a cut pay more than its seam -- and nothing asserted it either way.
group('a tender does no hand work of its own', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);
  window.__machine('jaw', { bought: true });
  window.__clearFloor();
  run(6);

  // Nobody is ever down the hole: the jaw is worked from the deck.
  let under = 0;
  for (let i = 0; i < 40; i++) { run(0.25); under = Math.max(under, state().underground); }
  window.__crew(0, 0, 0);
  return [
    ok(under === 0, 'the cut is worked without anybody standing in it',
       `${under} below ground`)
  ];
});

// The dial has to actually do something. It did not: a beat floor of one frame
// meant every machine at every setting delivered the same rate, and turning
// MACHINE_GAIN up changed nothing at all.
group('turning the gain up actually makes a machine quicker', async () => {
  const cellsAt = gain => {
    window.__reset();
    openSites();
    window.__fullSites();
    window.__tune('MACHINE_GAIN', gain);
    window.__crew(0, 0, 1);
    window.__machine('jaw', { bought: true });
    window.__clearFloor();
    runUntil(() => state().quarryTotal > 0, 40);
    const c0 = state().quarryTotal;
    for (let i = 0; i < 16; i++) { run(0.5); window.__clearFloor(); }
    return state().quarryTotal - c0;
  };
  const slow = cellsAt(0.5);
  const fast = cellsAt(4);
  window.__tune('MACHINE_GAIN', 1.5);
  window.__crew(0, 0, 0);
  return [
    ok(slow > 0 && fast > 0, 'the jaw works at either setting',
       `${slow} and ${fast} cells`),
    ok(fast > slow * 2,
       'and eight times the dial is a great deal more ground out of the hole',
       `gain 0.5: ${slow} cells -> gain 4: ${fast} cells`)
  ];
});

// A cut worked right out has to fall back in, and with a machine there is no
// gang climbing out to do it. This deadlocked the quarry for good.
group('a jaw fills the cut in behind itself, for ever', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 1);
  window.__machine('jaw', { bought: true });
  window.__clearFloor();
  run(4);

  // Several digs' worth. If the hole is ever worked out and not filled, the
  // count stops and never starts again.
  const marks = [];
  for (let i = 0; i < 40; i++) { run(0.5); window.__clearFloor(); marks.push(state().quarryTotal); }
  const s = state();
  window.__crew(0, 0, 0);
  const stalled = marks[marks.length - 1] === marks[Math.floor(marks.length / 2)];
  return [
    ok(!stalled, 'the jaw keeps taking ground out over many digs',
       `${marks[Math.floor(marks.length / 2)]} -> ${marks[marks.length - 1]} cells`),
    ok(!s.quarryDone || s.quarryDug < 1,
       'and never ends stood in a hole it cannot fill in',
       `dug ${s.quarryDug}, done ${s.quarryDone}`)
  ];
});

// The one line DESIGN.md says twice. A machine on the rock replaces the crew's
// hand work, never the player's own swings.
//
// This is measured with a real swing, through the very call `input.js` makes
// when you click the hill. An earlier draft of this check compared a report
// field with itself -- the field did not exist, so it read `undefined ===
// undefined` and passed while asserting nothing at all, which is worse than
// failing.
group('the ram replaces the miners and never your own cursor', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(1, 0);
  window.__clearFloor();
  window.__jump(3);
  run(2);

  // What one swing of yours takes with no machine anywhere...
  const bare = window.__swing(6);

  // ...and what it takes with the ram running beside you. The crew's hands have
  // been stood down and replaced; yours have not.
  window.__machine('ram', { bought: true });
  run(1);
  const withRam = window.__swing(6);

  const s = state();
  window.__crew(0, 0, 0);
  return [
    ok(bare > 0, 'a swing of your own takes rock off', `${bare} cells`),
    ok(withRam === bare,
       'and takes exactly as much with the ram running beside it',
       `${bare} -> ${withRam}`),
    ok(s.machines.ram.job === 'miners',
       "because what the ram stands in for is the crew's job, not yours")
  ];
});

// --- buying one -----------------------------------------------------------------
// A machine is not offered until its station has been given everything hands can
// be given. That gate is what stops a machine hollowing out the ladder beneath
// it: `the next plot` can never be made worthless by a tiller bought instead of
// it, because the tiller is what you get *for* buying the last plot.
group('a machine is not for sale until every slot is bought', async () => {
  window.__reset();
  openSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(9000);
  // Every board, and only the rows actually being offered. `__upgrades` hands
  // back the bench's array raw, unshown rows included, which cannot answer the
  // question a gate is about.
  const rows = () => window.__rows().filter(r => r.shown).map(r => r.key);

  const bare = rows();
  window.__levels({ benchLevel: 2 });        // four of five benches
  const nearly = rows();
  window.__fullSites();
  const full = rows();
  return [
    ok(!bare.includes('jaw') && !bare.includes('tiller') && !bare.includes('ram'),
       'none of the three is on a board to begin with',
       bare.filter(k => ['jaw', 'ram', 'tiller'].includes(k)).join(',') || 'none'),
    ok(!nearly.includes('jaw'), 'nor with one bench still to take out'),
    ok(full.includes('jaw'), 'and the jaw appears when the last bench is bought'),
    ok(full.includes('tiller'), 'the tiller when the last furrow is'),
    ok(full.includes('ram'), "and the ram when the rock's kit is bought right out")
  ];
});

// The first thing in this game ever priced in sparks. `take('spark')` has been
// written and unexercised since the day red was banked -- its comment says so --
// so this is also the first run `takeCoreCells(n, SPARK_CELL)` has ever had.
group('a machine is paid for in three coins at once', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__tip(9000);
  run(1);

  // Every coin but one: the row is there and refuses.
  window.__grant({ sparks: 999, spores: 999 });     // no shards
  const poor = window.__buy('ram');
  const stillThere = window.__rows().some(r => r.key === 'ram' && r.shown);

  window.__grant({ shards: 999 });
  const before = state();
  const rich = window.__buy('ram');
  const after = state();
  // Read before `__crew`, which takes every machine away on purpose -- and an
  // unbought machine puts its row straight back on the board.
  const gone = !window.__rows().some(r => r.key === 'ram' && r.shown);

  window.__crew(0, 0, 0);
  return [
    ok(!poor, 'a machine cannot be bought with two of its three coins'),
    ok(stillThere, 'and the row stays on the board rather than vanishing'),
    ok(rich, 'and it is bought when the third is in hand'),
    ok(after.machines.ram.bought, 'the machine is yours', JSON.stringify(after.machines.ram)),
    ok(after.sparks < before.sparks, 'sparks came out of the pile',
       `${before.sparks} -> ${after.sparks}`),
    ok(after.shards < before.shards, 'and shards', `${before.shards} -> ${after.shards}`),
    ok(after.spores < before.spores, 'and spores', `${before.spores} -> ${after.spores}`),
    ok(gone, 'and the row comes off the board once it is bought')
  ];
});

// No machine is priced in what its own station makes. One rule, three prices:
// a machine is paid for by the rest of the yard.
group('a machine is never priced in what its own station makes', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(9000);
  const bill = key => {
    const r = window.__rows().find(x => x.key === key);
    return r ? r.bill.map(b => b[0]) : [];
  };
  const jaw = bill('jaw'), ram = bill('ram'), till = bill('tiller');
  return [
    ok(jaw.length === 3 && ram.length === 3 && till.length === 3,
       'each is priced in three coins',
       `jaw ${jaw}, ram ${ram}, tiller ${till}`),
    ok(jaw.includes('spark') && ram.includes('spark') && till.includes('spark'),
       'every one of them in sparks, which is what makes them the last thing'),
    ok(!jaw.includes('shard'), 'the jaw works the cut, so it is not priced in shards',
       jaw.join(',')),
    ok(!ram.includes('dust'), 'the ram works the rock, so it is not priced in dust',
       ram.join(',')),
    ok(!till.includes('spore'), 'the tiller works the plots, so not in spores',
       till.join(','))
  ];
});

// --- the specialists ------------------------------------------------------------
// A machine is gated behind a full set of hats as well as a full set of slots,
// and that is not a difficulty tax. Without it, buying a machine put every
// helmet you owned in a drawer -- a machine caps its station at one body -- so
// the trade ladder stopped being worth finishing halfway up. And the machine was
// a *downgrade*: a hatted hand is worth two, so a kitted cut of five is worth
// ten and the jaw was worth seven and a half.
group('a machine waits for the specialists, and then beats them', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(9000);
  const offered = () => window.__rows().filter(r => r.shown).map(r => r.key);

  const kitted = offered();
  // and now take the hats away again
  window.__school({ blasters: 0, growers: 0, breakers: 0 });
  const bare = offered();
  // half a set is not a set -- and a set is three now, so half of it is two
  window.__school({ blasters: 2 });
  const half = offered();
  window.__school({ blasters: 3, growers: 3, breakers: 3 });
  const back = offered();

  return [
    ok(kitted.includes('jaw'), 'a fully slotted, fully hatted cut is offered a jaw'),
    ok(!bare.includes('jaw'), 'a cut with no blasters in it is not',
       bare.filter(k => k === 'jaw').join(',') || 'not offered'),
    ok(!half.includes('jaw'), 'and nor is one with two of its three'),
    ok(back.includes('jaw'), 'the last hat is what puts the row up'),
    ok(!bare.includes('tiller') && !bare.includes('ram'),
       'and the same for the other two')
  ];
});

// The measurement DESIGN.md promised and never had: a machine against a real
// gang, kit and all, on the same station in the same yard. `MACHINE_GAIN` is a
// dial to be measured rather than believed, and this is the measuring.
group('a jaw out-digs the kitted gang it stood down', async () => {
  window.__reset();
  openSites();
  window.__fullSites();

  // Five blasters at the cut, working it by hand.
  window.__crew(0, 0, 5);
  window.__fullSites();
  window.__clearFloor();
  run(6);
  const byHand = (() => {
    const before = state().quarryTotal;
    for (let i = 0; i < 30; i++) { run(0.5); window.__clearFloor(); }
    return state().quarryTotal - before;
  })();
  const hatted = state().crewDetail.length;

  // The same yard, the same crew, with the jaw running instead.
  window.__machine('jaw', { bought: true });
  run(6);
  const byMachine = (() => {
    const before = state().quarryTotal;
    for (let i = 0; i < 30; i++) { run(0.5); window.__clearFloor(); }
    return state().quarryTotal - before;
  })();

  const s = state();
  window.__crew(0, 0, 0);
  return [
    ok(byHand > 0, 'five hatted quarriers take ground out', `${byHand} cells`),
    ok(s.machines.jaw.kitFull, 'and the cut had its whole set of blasters on'),
    ok(byMachine > byHand,
       'and the jaw, standing four of them down, still takes out more',
       `${byHand} by hand -> ${byMachine} by machine`),
    // Not a squeaker. The point of the gate is that finishing the specialists is
    // worth doing and the machine is worth buying after it, and a machine that
    // barely edged a gang would make both feel like a waste.
    ok(byMachine > byHand * 1.2,
       'and by a margin worth fifty sparks',
       `${(byMachine / Math.max(1, byHand)).toFixed(2)}x`)
  ];
});

// The machine absorbs the specialists.
//
// It is gated behind a full set of hats and is worth what that set made, so once
// it is standing the hats have been spent. Leaving them on the shelf gave you a
// drawer of helmets nobody could wear -- the station holds one body now, so four
// of five would sit at the kit stand for the rest of the run, still counted,
// still drawn, meaning nothing.
group('buying a machine takes the specialists with it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1, 5);
  window.__fullSites();
  window.__grant({ sparks: 999, spores: 999 });
  window.__tip(9000);
  run(2);
  const before = state();

  window.__buy('jaw');
  run(1);
  const bought = state();
  // the hats are handed in over the next few seconds, by the bodies wearing them
  const handed = runUntil(() => state().machines.jaw.kit === 0, 60);
  run(6);
  const after = state();

  window.__crew(0, 0, 0);
  return [
    ok(before.machines.jaw.kit === 3, 'a full set of three blasters at the cut to begin with',
       `${before.machines.jaw.kit}`),
    ok(bought.machines.jaw.bought, 'the jaw is bought'),
    ok(handed && after.machines.jaw.kit === 0,
       'and the station owns no blasters afterwards', `${after.machines.jaw.kit}`),
    // The rate must not follow the hats down. It was bought against a kitted
    // gang and is worth what that gang made; reading the station afterwards
    // would find nought hats and quietly halve the thing you just paid for.
    ok(Math.abs(after.machines.jaw.rate - 12) < 0.01,
       'and the machine is still worth the twelve hands it was bought as',
       `${after.machines.jaw.rate}`),
    ok(after.trained.indexOf('q') < 0,
       'with nobody left wearing one', `${after.trained}`)
  ];
});

// --- the belt -------------------------------------------------------------------
// The fourth machine, and the odd one out: it does not work a face, it works the
// ground between the rock and the hole. It is what the yard starts asking for
// the moment any other machine runs -- a ram fills the rock's pile in well under
// a second and then stands down waiting to be carried.
group('the belt carries dust to the hole without anybody walking it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1);                       // one body, and it tends the belt
  window.__machine('belt', { bought: true });
  window.__clearFloor();
  run(4);

  // A heap of loose dust on the open ground between the rock and the lip.
  const s0 = state();
  const mid = Math.round((s0.rockX ?? s0.cx ?? 0));
  for (let i = 0; i < 200; i++) window.__pile(s0.pitX - 300 + (i % 30) * 6, 3);
  run(1);
  const before = state();

  run(14);
  const after = state();
  window.__crew(0, 0);
  return [
    ok(before.floor > 0, 'there is dust lying on the ground', `${before.floor} grains`),
    ok(after.stored > before.stored,
       'and it ends up in the hole', `${before.stored} -> ${after.stored}`),
    ok(after.floor < before.floor,
       'without anybody carrying it, because the belt did',
       `${before.floor} -> ${after.floor} on the ground`)
  ];
});

// A belt survives a reload running, because there is no lever to have left off.
group('a belt comes back bought', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 3);
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__school({ carters: 6 });
  window.__levels({ haulCarryLevel: 5, haulPaceLevel: 5, harnessLevel: 5, bootsLevel: 5 });
  window.__buy('belt');
  window.__reload();
  const back = state().machines.belt;
  window.__crew(0, 0);
  return [
    ok(back.bought, 'bought after a reload -- and bought is all there is to be',
       `bought ${back.bought}`)
  ];
});

// The dust *rides* the belt. This is the check the drawing cannot make for
// itself: before this, the bite threw each grain the whole length of the yard in
// one arc, over the top of a band it never touched, and the load you saw moving
// along it was a white pattern painted on the band. Nothing about the numbers
// would have changed if the belt had been deleted and a catapult left in its
// place -- which is precisely what it was.
group('a grain rides the belt rather than being thrown over it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1);
  window.__machine('belt', { bought: true });
  window.__clearFloor();
  run(4);

  // A heap on the open ground well back along the run, so a load has a good
  // stretch of belt to travel and cannot be mistaken for one that started at the
  // hole. Inside the run: the belt's tail is out by the rock and ground beyond it
  // is ground the belt does not reach, which is a fact about the machine and not
  // a bug to be tested for here.
  const s0 = state();
  for (let i = 0; i < 120; i++) window.__pile(s0.pitX - 500 + (i % 40) * 6, 3);
  run(1);
  const before = state();

  // Part-way through: there is dust on the band, out along it, and it is not in
  // the air. The old belt would have had every grain in `chips` and none here.
  let onBand = 0, seen = [];
  for (let i = 0; i < 30; i++) {
    run(0.1);
    const s = state();
    if (s.belt > onBand) onBand = s.belt;
    if (s.beltX.length) seen.push(s.beltX[0]);
  }
  // and it all arrives
  run(10);
  const after = state();
  window.__crew(0, 0);

  const moved = seen.length > 1 && seen.some(x => x !== seen[0]);
  return [
    ok(before.floor > 0, 'there is dust on the ground', `${before.floor} grains`),
    ok(onBand > 0, 'and some of it is on the band, being carried', `${onBand} loads`),
    ok(moved, 'and what is on the band is moving along it',
       seen.slice(0, 6).join(' -> ')),
    ok(after.belt === 0, 'the band empties when the ground does', `${after.belt} left on it`),
    ok(after.stored > before.stored, 'and the hole has it', `${before.stored} -> ${after.stored}`),
    ok(after.floor < before.floor, 'and the ground has not',
       `${before.floor} -> ${after.floor}`)
  ];
});

// A full hole stops the band. `ready` has always refused new bites on a full
// pit, but the loads already riding were tipped off the head into a hole that
// handed every one straight back out over the lip -- and the ram's spoil kept
// landing on the band from above, so the yard ran a circle of dump and reject
// for as long as the hole stayed full. Now the band stands still with its loads
// on it, takes nothing new out of the air, and the ram works on with its spoil
// landing on the ground -- where the pile filling is what stands it down, the
// same mark that stops every other machine.
group('a full hole stops the band, and the ram works on', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(2, 2);
  window.__machine('ram', { bought: true });
  window.__machine('belt', { bought: true });
  haveRock();
  window.__clearFloor();
  run(2);

  // Loads on the band first, then the hole filled under them.
  const s0 = state();
  for (let i = 0; i < 80; i++) window.__pile(s0.pitX - 500 + (i % 40) * 6, 3);
  runUntil(() => state().belt > 0, 20);
  // to the brim and no further: a tip past capacity is a failed bank per grain
  window.__tip(state().pitCapacity - state().stored + 8);
  run(1);
  const full = state();

  run(3);
  const later = state();
  window.__crew(0, 0);

  const frozen = full.beltX.length && later.beltX.length &&
                 String(full.beltX) === String(later.beltX);
  return [
    ok(full.pitFull, 'the hole is full'),
    ok(full.belt > 0, 'with loads still riding the band', `${full.belt} loads`),
    ok(later.belt >= full.belt, 'none of them is tipped into the full hole',
       `${full.belt} -> ${later.belt}`),
    ok(frozen, 'and the band stands still with them on it',
       `${full.beltX} -> ${later.beltX}`),
    ok(later.stored <= full.stored, 'the hole takes nothing over the brim',
       `${full.stored} -> ${later.stored}`),
    ok(later.rock < full.rock, 'the ram goes on working the rock',
       `${full.rock} -> ${later.rock}`),
    ok(later.floor > full.floor, 'and its spoil lands on the ground instead of the band',
       `${full.floor} -> ${later.floor}`)
  ];
});

// And it does not have to be picked up off the ground at all. The band is a
// surface: the rock's spoil comes down on it straight off the shovel and the
// yard between the rock and the hole never sees it.
//
// Before this, the belt did the job the long way round -- every grain fell to
// the floor, sat there, and was picked back up and lifted five cells onto a band
// that had been directly over it the whole time.
group("the rock's spoil lands on the belt and never touches the ground", async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(2, 2);
  window.__machine('ram', { bought: true });
  window.__machine('belt', { bought: true });
  haveRock();
  run(8);                                     // both machines up and manned
  window.__clearFloor();

  // Now watch the yard while the ram works it. The floor is the assertion: a
  // grain that lands on the ground and is picked back up would show here.
  let worst = 0, sawBand = 0;
  for (let i = 0; i < 40; i++) {
    run(0.2);
    const s = state();
    if (s.floor > worst) worst = s.floor;
    if (s.belt > sawBand) sawBand = s.belt;
  }
  const after = state();
  window.__crew(0, 0);
  return [
    ok(sawBand > 0, 'the spoil is on the band', `${sawBand} loads at once`),
    ok(after.stored > 0, 'and it reaches the hole', `${after.stored} banked`),
    // A little slack: a grain the belt cannot claim -- outside the run, or over
    // another station's strip -- still falls to the ground and is fair game for
    // the scoop, which is what the scoop is still for.
    ok(worst < 40, 'and next to none of it ever lies on the ground',
       `${worst} grains on the floor at the worst of it`)
  ];
});

// A load already on the band is not the machine's *bite*, so it must not be
// gated on one: the ground goes clean long before the last grain reaches the
// hole, and a band that stopped when there was nothing left to pick up would
// leave a row of grains hanging in the air over the yard.
group('the last load off a swept yard still reaches the hole', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1);
  window.__machine('belt', { bought: true });
  window.__clearFloor();
  run(4);
  const s0 = state();
  for (let i = 0; i < 40; i++) window.__pile(s0.pitX - 500 + (i % 20) * 6, 2);
  const before = state();
  // long enough that the ground is bare well before the end of it
  run(20);
  const after = state();
  window.__crew(0, 0);
  return [
    ok(after.floor === 0, 'the ground is bare', `${after.floor} left`),
    ok(after.belt === 0, 'and nothing is left standing on the band', `${after.belt}`),
    ok(after.stored >= before.stored + before.floor,
       'every grain that was on it got there',
       `${before.floor} on the ground, ${before.stored} -> ${after.stored} in the hole`)
  ];
});

// It is priced and gated like the rest, but on the lip's own gear.
group('the belt waits for the whole of the lip to be bought out', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(20000);
  const shown = () => window.__rows().filter(r => r.shown).map(r => r.key);

  const bare = shown();
  window.__levels({ haulCarryLevel: 5, haulPaceLevel: 5, harnessLevel: 5, bootsLevel: 5 });
  const geared = shown();
  window.__school({ carters: 6 });
  const kitted = shown();
  return [
    ok(!bare.includes('belt'), 'not offered on a lip with its gear unbought'),
    ok(!geared.includes('belt'), 'nor with the gear bought and no carters'),
    ok(kitted.includes('belt'), 'and offered once both are done',
       kitted.filter(k => k === 'belt').join(''))
  ];
});
