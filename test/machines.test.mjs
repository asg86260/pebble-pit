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
    ok(off.quarriers === 1 || off.quarriers === 5,
       'and switching it off restores the cap', `${off.quarriers} at the cut`)
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
    ok(back.crew === capped.crew, 'without conjuring anybody', `${back.crew}`)
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
       `${ram.hands} -> ${ram.rate}`)
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

  window.__reload();
  const after = state().machines;
  window.__crew(0, 0, 0);
  return [
    ok(after.jaw.bought && after.jaw.on, 'a bought, running machine comes back both',
       JSON.stringify(after.jaw)),
    ok(after.tiller.bought && !after.tiller.on,
       'and one that was bought and idle comes back idle', JSON.stringify(after.tiller)),
    ok(!after.ram.bought, 'one nobody bought is still unbought'),
    ok(state().quarriers <= 1,
       'and the cap is applied on the way in, not after the gang has been placed',
       `${state().quarriers} at the cut`)
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
