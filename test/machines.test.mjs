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
    ok(jaw.hands === 5 && Math.abs(jaw.rate - 7.5) < 0.01,
       'five benches is seven and a half hands', `${jaw.hands} -> ${jaw.rate}`),
    ok(till.hands === 7 && Math.abs(till.rate - 10.5) < 0.01,
       'seven plots is ten and a half', `${till.hands} -> ${till.rate}`),
    ok(ram.hands === 5 && Math.abs(ram.rate - 7.5) < 0.01,
       "and the rock's five puts the ram level with the jaw",
       `${ram.hands} -> ${ram.rate}`),
    ok(Math.abs(two.jaw.rate - 10) < 0.01 && Math.abs(two.tiller.rate - 14) < 0.01,
       'and the whole of it moves with the dial rather than being written down',
       `at 2: jaw ${two.jaw.rate}, tiller ${two.tiller.rate}`),
    ok((s.roster.find(r => r.job === 'haulers') || {}).hands === null,
       'while a job with no floor plan reports no complement at all',
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
  window.__crew(0, 0, 0);
  return [
    ok(digs > 0, 'the jaw digs a hole right out and it falls back in',
       `${digs} digs`),
    ok(got === digs * seam,
       'and each one pays exactly the seam, no more and no less',
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
group('the ram works the rock', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(1, 0);
  window.__machine('ram', { bought: true, on: true });
  window.__clearFloor();
  window.__jump(3);
  run(4);

  const r0 = state().rock;
  run(8);
  const took = r0 - state().rock;

  for (let i = 0; i < 20; i++) { for (const w of yard.S.workers) w.lifted = true; run(0.3); }
  const b0 = state().rock;
  for (let i = 0; i < 20; i++) { for (const w of yard.S.workers) w.lifted = true; run(0.3); }
  const alone = b0 - state().rock;
  for (const w of yard.S.workers) w.lifted = false;

  const still = state().machines.ram.on;
  window.__crew(0, 0, 0);
  return [
    ok(took > 0, 'the ram takes the hill apart', `${took} cells`),
    ok(alone === 0, 'and does nothing with nobody standing at it', `${alone} cells`),
    ok(still, 'and it is idle rather than switched off')
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
