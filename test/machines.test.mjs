// The machines: the record, the capacity rule, and the way back.
//
// Nothing here runs a machine yet -- there is no drawing, no beat and no lever
// to throw. What is checked is the part everything else stands on: that a
// station being worked by a machine holds one body, that the gang it displaced
// is walked to carrying rather than deleted, that throwing the lever off gets
// them back, and that a machine left running by one check cannot silently
// rewrite what the next one is allowed to mean.

import { yard, group, ok, state, run, runUntil, quickCrew, openSites, P, WORKER } from './helpers.mjs';

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
  window.__grant({ shards: 400, spores: 400, dust: 40000 });
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

// The rule the whole feature stands on.
group('a machine at a station leaves room for one body', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);                    // five down the cut, which is its lot
  window.__fullSites();
  const before = state();
  const cutBefore = before.quarriers, haulBefore = before.haulers;

  window.__machine('jaw', { bought: true, on: true });
  const on = state();
  const cut = on.roster.find(r => r.job === 'quarriers');

  window.__machine('jaw', { on: false });
  const off = state();

  window.__crew(0, 0, 0);
  return [
    ok(cutBefore === 5, 'five hands at the cut to begin with', `${cutBefore}`),
    ok(on.quarriers === 1, 'a running machine leaves one body at the station',
       `${cutBefore} -> ${on.quarriers}`),
    ok(cut && cut.cap === 1, 'and the roster says so', `cap ${cut && cut.cap}`),
    ok(cut && cut.hands === 5, 'while the complement it stands in for is still five',
       `hands ${cut && cut.hands}`),
    // Nobody is deleted. The four go back to the one job nobody is assigned to.
    ok(on.crew === before.crew, 'nobody is deleted by switching it on',
       `${before.crew} -> ${on.crew}`),
    ok(on.haulers === haulBefore + 4, 'the four it displaced carry dust instead',
       `${haulBefore} -> ${on.haulers}`),
    ok(off.quarriers === 5,
       'and switching it off walks the whole gang back to the cut',
       `${on.quarriers} -> ${off.quarriers}`)
  ];
});

// `rebalance` only ever clamped down: it walks the surplus to carrying and
// nothing walks them home. Without a way back, every "off" would cost five
// clicks on the roster and nobody would throw the lever twice.
group('throwing a machine off puts its gang back', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 0, 5);
  window.__fullSites();
  window.__machine('jaw', { bought: true, on: true });
  const capped = state();

  window.__machine('jaw', { on: false });
  const back = state();
  window.__crew(0, 0, 0);
  return [
    ok(capped.quarriers === 1, 'one body while it runs', `${capped.quarriers}`),
    ok(back.quarriers === 5, 'and the whole gang back when the lever goes off',
       `${capped.quarriers} -> ${back.quarriers}`),
    // On the bodies, not on `S.crew`: the ledger total is a number `restaff`
    // never touches, so asserting it unchanged could not have failed however
    // badly the gang was put back.
    ok(back.miners + back.quarriers + back.farmhands + back.haulers === back.crew,
       'without conjuring anybody: every body is on exactly one job',
       `${back.quarriers} cut + ${back.haulers} carrying of ${back.crew}`)
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

  window.__machine('ram', { bought: true, on: true });
  const on = state();
  const rock = on.roster.find(r => r.job === 'miners');

  window.__machine('ram', { on: false });
  const off = state();
  window.__crew(0, 0);
  return [
    ok(before.miners === 6, 'six on the rock, more than any station holds',
       `${before.miners}`),
    ok(before.roster.find(r => r.job === 'miners').cap === null,
       'and the rock has no floor plan to run out of'),
    ok(on.miners === 1, 'the ram leaves one body on it too', `${before.miners} -> ${on.miners}`),
    ok(rock && rock.hands === 5, "and stands in for the rock's notional gang of five",
       `hands ${rock && rock.hands}`),
    ok(off.miners === 6, 'and the gang comes back off the lever',
       `${on.miners} -> ${off.miners}`)
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
    // Complement, times the doubling every one of those hands is wearing, times
    // the dial. A machine is gated behind a full set of hats, so the gang it
    // stands in for is always a kitted one and the rate is measured against
    // that -- five benches of blasters is ten hands, and the jaw is half again.
    ok(jaw.hands === 5 && jaw.kitFull && Math.abs(jaw.rate - 15) < 0.01,
       'five hatted benches is fifteen hands', `${jaw.hands} kitted -> ${jaw.rate}`),
    ok(till.hands === 7 && Math.abs(till.rate - 21) < 0.01,
       'seven hatted furrows is twenty-one', `${till.hands} -> ${till.rate}`),
    ok(ram.hands === 5 && Math.abs(ram.rate - 15) < 0.01,
       "and the rock's five puts the ram level with the jaw",
       `${ram.hands} -> ${ram.rate}`),
    ok(Math.abs(two.jaw.rate - 20) < 0.01 && Math.abs(two.tiller.rate - 28) < 0.01,
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
  window.__machine('jaw', { bought: true, on: true });
  const left = state().machines.jaw.on;

  // ...and now whatever runs next asks for a staffed cut, exactly as it would.
  window.__crew(0, 0, 3);
  window.__fullSites();
  const after = state();
  window.__crew(0, 0, 0);
  return [
    ok(left, 'a check leaves a machine running'),
    ok(!after.machines.jaw.on, 'and the next __crew stops it', 'still on'),
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
  window.__machine('jaw', { bought: true, on: true });
  window.__machine('tiller', { bought: true, on: false });
  const before = state().machines;

  // The gang is put back at the cut *in the save*, which is the state an honest
  // lever-on actually writes: `throwLever` sets `on` and the rebalance happens on
  // a later frame, so a tab closed in between saves five quarriers alongside a
  // running jaw. The load is the only thing that can fix it.
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
    ok(after.jaw.bought && after.jaw.on, 'a bought, running machine comes back both',
       JSON.stringify(after.jaw)),
    ok(after.tiller.bought && !after.tiller.on,
       'and one that was bought and idle comes back idle', JSON.stringify(after.tiller)),
    ok(!after.ram.bought, 'one nobody bought is still unbought'),
    ok(after.jaw.was === 5,
       'and the complement it displaced comes back with it, or there is no way home',
       `was ${after.jaw.was}`),
    ok(s.quarriers === 1,
       'the cap is applied on the way in, not after the gang has been placed',
       `${s.quarriers} at the cut, cap ${s.roster.find(r => r.job === 'quarriers').cap}`),
    ok(s.haulers === 4, 'and the four it displaced are carrying dust',
       `${s.haulers} carrying`)
  ];
});

// --- the lever ------------------------------------------------------------------
// Nothing in this yard happens without hands, and a switch that flipped the
// moment you clicked it would be the one thing in the game that did. So the
// lever is asked for, and somebody walks over and throws it.
//
// Every check below goes through `__lever`, never `__machine`: the hook that
// sets the facts outright would pass all of this while asserting nothing at all
// about the walk, which is the whole of what a lever is.
group('a lever is thrown by somebody who walked to it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2, 1);                    // a tender and two spare pairs of hands
  window.__machine('jaw', { bought: true, on: false });
  const at = state().machines.jaw.leverX;

  // Everybody put well away from the lever, so the walk is a real one.
  for (const w of yard.S.workers) w.x = at + 420;
  run(0.2);

  const asked = window.__lever('jaw', true);
  run(0.3);
  const early = state();                     // still walking: it cannot be on yet
  const got = runUntil(() => state().machines.jaw.on, 40);
  const on = state();

  window.__crew(0, 0, 0);
  return [
    ok(asked, 'the ask is taken'),
    ok(!early.machines.jaw.on, 'and the machine is not on while somebody is still walking',
       `on=${early.machines.jaw.on}`),
    ok(early.machines.jaw.goer, 'somebody has set off for it',
       `${early.machines.jaw.goer}`),
    ok(early.machines.jaw.ask === true, 'and the ask stands until they arrive'),
    ok(got && on.machines.jaw.on, 'it goes on when they get there'),
    ok(on.machines.jaw.ask === null, 'and the ask is spent', `${on.machines.jaw.ask}`)
  ];
});

// The tender is usually standing at the machine, so off costs no walk worth
// noticing. That is a consequence of where it is, not a guarantee the code makes.
group('off is quick because the walk is short', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1, 5);
  window.__machine('jaw', { bought: true, on: true });
  runUntil(() => {
    const q = yard.S.workers.find(o => o.type === 'quarrier');
    return q && !q.walking;
  }, 40);
  const before = state();

  window.__lever('jaw', false);
  const quick = runUntil(() => !state().machines.jaw.on, 12);
  const off = state();
  window.__crew(0, 0, 0);
  return [
    ok(before.machines.jaw.on, 'it is running to begin with'),
    ok(quick, 'and a body is near enough to stop it without a journey'),
    ok(!off.machines.jaw.on, 'so it stops'),
    ok(off.quarriers === 5, 'and the gang it displaced comes back',
       `${before.quarriers} -> ${off.quarriers}`)
  ];
});

// An ask outlives a yard with nobody free: it is answered when somebody is.
//
// The bodies are held in the player's hand rather than taken off the books,
// because `__crew` stops every machine and drops every ask -- deliberately, so a
// machine cannot leak from one check into the next -- and a yard with nobody in
// it is therefore a yard with no ask in it either. A body being carried about is
// the honest version of "nobody free": the worker pass skips it entirely, which
// is exactly what makes it durable enough to hold for a window.
group('an ask nobody can answer stands until somebody can', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1);
  window.__machine('jaw', { bought: true, on: false });
  run(0.5);
  for (const w of yard.S.workers) w.lifted = true;

  window.__lever('jaw', true);
  run(4);
  const stuck = state();

  for (const w of yard.S.workers) w.lifted = false;
  const got = runUntil(() => state().machines.jaw.on, 60);
  window.__crew(0, 0, 0);
  return [
    ok(stuck.machines.jaw.ask === true, 'the ask stands with nobody able to go',
       `${stuck.machines.jaw.ask}`),
    ok(!stuck.machines.jaw.on, 'and nothing has happened'),
    ok(!stuck.machines.jaw.goer, 'and nobody has set off', `${stuck.machines.jaw.goer}`),
    ok(got, 'and it is answered the moment somebody can go')
  ];
});

// Picking up the body that was on its way.
//
// The dispatcher sends one walker per lever, or the whole yard files across to
// the same switch. That claim has to be given up when the walk is: a lever
// claimed for ever by a pair of hands now in the player's is a machine that
// never starts and never says why.
group('picking up the walker hands the lever back', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 3, 1);
  window.__machine('jaw', { bought: true, on: false });
  const at = state().machines.jaw.leverX;
  for (const w of yard.S.workers) w.x = at + 420;
  run(0.2);

  window.__lever('jaw', true);
  runUntil(() => state().machines.jaw.goer, 20);
  const walker = yard.S.workers.find(o => o.throwing === 'jaw');
  const name = walker && walker.name;
  yard.lift ? yard.lift(walker) : (walker.lifted = true, walker.throwing = null,
                                   walker.legs = null, walker.walking = false);

  const got = runUntil(() => state().machines.jaw.on, 60);
  // The one who threw it is still walking *back* to its own station, and still
  // holds the claim while it does -- which is right: the errand is the walk out
  // and the walk home, the same shape as fetching a hat.
  const home = runUntil(() => state().machines.jaw.goer === null, 40);
  const on = state();
  window.__crew(0, 0, 0);
  return [
    ok(name, 'somebody sets off for the lever', `${name}`),
    ok(got, 'and picking them up does not strand the ask'),
    ok(on.machines.jaw.on, 'somebody else finishes the errand'),
    ok(home, 'and the claim is given up when they get back to their own work',
       `${on.machines.jaw.goer}`)
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
  window.__machine('jaw', { bought: true, on: true });
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
  // Read before `__crew`, which stops every machine on purpose.
  const still = state().machines.jaw.on;
  window.__crew(0, 0, 0);
  return [
    ok(worked > 0, 'a machine with somebody standing at it takes the ground out',
       `${worked} cells`),
    ok(alone === 0, 'and one with nobody at it does nothing at all',
       `${alone} cells with nobody standing there`),
    ok(still, 'and it stopped without the lever having moved -- it is idle, not off')
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
  window.__machine('jaw', { bought: true, on: true });
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
  window.__machine('jaw', { bought: true, on: true });
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
    window.__machine('jaw', { bought: true, on: true });
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
  window.__machine('tiller', { bought: true, on: true });
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
  window.__machine('ram', { bought: true, on: true });
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
  window.__machine('jaw', { bought: true, on: true });
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

// Two machines at once, and both gangs back. The restaff latch holds one
// station at a time, and two levers thrown together used to be a way to lose a
// gang -- nothing in the file ever ran more than one machine.
group('two machines can be thrown off without losing a gang', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1, 5, 7);
  window.__fullSites();
  const before = state();

  window.__machine('jaw', { bought: true, on: true });
  window.__machine('tiller', { bought: true, on: true });
  const both = state();

  window.__machine('jaw', { on: false });
  window.__machine('tiller', { on: false });
  const back = state();
  window.__crew(0, 0, 0);
  return [
    ok(both.quarriers === 1 && both.farmhands === 1,
       'two machines running leave one body each',
       `${both.quarriers} cut, ${both.farmhands} farm`),
    ok(back.quarriers === before.quarriers,
       'and the cut gets its gang back', `${before.quarriers} -> ${back.quarriers}`),
    ok(back.farmhands === before.farmhands,
       'and so does the farm', `${before.farmhands} -> ${back.farmhands}`),
    ok(back.crew === before.crew, 'with the same crew throughout', `${back.crew}`)
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
    window.__machine('jaw', { bought: true, on: true });
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
  window.__machine('jaw', { bought: true, on: true });
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
  window.__machine('ram', { bought: true, on: true });
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
    ok(!window.__rows().some(r => r.key === 'ram' && r.shown),
       'and the row comes off the board once it is bought')
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

// Buying one starts it -- by sending somebody to throw the lever, like anything
// else. A machine that arrived already running would be the one thing in the
// yard that happened without hands; one that arrived off would read as a
// purchase that did nothing.
group('buying a machine sends somebody to start it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2, 5);
  window.__fullSites();
  window.__grant({ sparks: 999, spores: 999 });
  window.__tip(9000);
  run(1);

  window.__buy('jaw');
  const justBought = state();
  const on = runUntil(() => state().machines.jaw.on, 60);
  const after = state();
  window.__crew(0, 0, 0);
  return [
    ok(justBought.machines.jaw.bought, 'it is bought'),
    ok(!justBought.machines.jaw.on, 'and not yet running: somebody has to go and start it'),
    ok(justBought.machines.jaw.ask === true, 'the ask is standing', 
       `${justBought.machines.jaw.ask}`),
    ok(on && after.machines.jaw.on, 'and it runs once they get there'),
    ok(after.quarriers === 1, 'and the cut is down to its tender',
       `${justBought.quarriers} -> ${after.quarriers}`)
  ];
});

// The lever has to exist *in the yard*, not only in a dev hook. A machine you
// can buy and never switch off is a one-way door, and for most of this build
// that is exactly what it was: the mechanism was written, and nothing drew a
// lever or hit-tested one.
group('a lever is a thing in the yard you can point at', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2, 5);
  window.__fullSites();
  window.__machine('jaw', { bought: true, on: true });
  run(2);

  const box = state().machines.jaw.leverBox;
  const on = state().machines.jaw.on;

  // Clicked where it is drawn, through the same hit test the pointer uses.
  const hit = yard.leverHit
    ? yard.leverHit(box.x + box.w / 2, box.y + box.h / 2)
    : window.__clickLever('jaw');
  const asked = state().machines.jaw.ask;
  const off = runUntil(() => !state().machines.jaw.on, 60);

  window.__crew(0, 0, 0);
  return [
    ok(box && box.w > 0, 'a bought machine has a lever standing in the yard',
       JSON.stringify(box)),
    ok(on, 'and it is running to begin with'),
    ok(hit, 'the lever answers a click where it is drawn'),
    ok(asked === false, 'which asks for it to go off rather than flipping it',
       `${asked}`),
    ok(off, 'and somebody walks over and throws it')
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
  // half a set is not a set
  window.__school({ blasters: 3 });
  const half = offered();
  window.__school({ blasters: 5, growers: 7, breakers: 5 });
  const back = offered();

  return [
    ok(kitted.includes('jaw'), 'a fully slotted, fully hatted cut is offered a jaw'),
    ok(!bare.includes('jaw'), 'a cut with no blasters in it is not',
       bare.filter(k => k === 'jaw').join(',') || 'not offered'),
    ok(!half.includes('jaw'), 'and nor is one with three of its five'),
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
  window.__machine('jaw', { bought: true, on: true });
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
    ok(before.machines.jaw.kit === 5, 'five blasters at the cut to begin with',
       `${before.machines.jaw.kit}`),
    ok(bought.machines.jaw.bought, 'the jaw is bought'),
    ok(handed && after.machines.jaw.kit === 0,
       'and the station owns no blasters afterwards', `${after.machines.jaw.kit}`),
    // The rate must not follow the hats down. It was bought against a kitted
    // gang and is worth what that gang made; reading the station afterwards
    // would find nought hats and quietly halve the thing you just paid for.
    ok(Math.abs(after.machines.jaw.rate - 15) < 0.01,
       'and the machine is still worth the fifteen hands it was bought as',
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
  window.__machine('belt', { bought: true, on: true });
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
