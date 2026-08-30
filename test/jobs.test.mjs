// Jobs, trades and what the yard remembers: who does what, which hats belong to
// which station, and what survives a reload.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

group('every trade doubles the work it is for', async () => {
  // brisk, but not so brisk that either site hits its floor: a station with
  // nothing left to buy drops its row off the bench, and the board checks
  // further down expect those headings to be there
  window.__levels({ quarryPaceLevel: 6, tendLevel: 6 });
  window.__crew(0, 0, 3, 3);                   // the quarry and the plots
  window.__school({ blasters: 0, growers: 0 });
  window.__clearFloor();
  // What the sites *do* in a fixed stretch of yard. The plots are measured by
  // what lands in their pile; the quarry is measured by how far down it gets,
  // because what a cut pays is fixed per dig -- the stone is scattered through
  // the ground and a dig turns up all of it -- so counting shards would measure
  // how many holes happened to finish inside the window rather than how hard
  // anybody worked. How far it got is the work.
  // Cells out of the ground, counted outright: the share dug runs round and
  // round as the hole is emptied and falls in, so a window that happens to cross
  // the end of a dig reads as negative work.
  const dug = () => state().quarryTotal;
  const p0 = dug();
  run(90);
  const plain = { ...state().pileCount, dug: dug() - p0 };

  window.__school({ blasters: 3, growers: 3 });
  window.__clearFloor();
  const t0 = dug();
  run(90);
  const trained = { ...state().pileCount, dug: dug() - t0 };

  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(plain.dug > 0 && plain.farm > 0, 'the quarry and the plots are working at all',
       `${plain.dug} cells out, ${plain.farm} off the plots`),
    ok(trained.dug > plain.dug, 'a blaster gets further down in the same time',
       `${plain.dug} -> ${trained.dug} cells`),
    ok(trained.farm > plain.farm, 'and a grower brings a plot on sooner',
       `${plain.farm} -> ${trained.farm}`)
  ];
});

// A job is a count and a body is whichever body happens to be doing it, and
// what the school sells is not a person at all: it is a hat, and the hat
// belongs to the station. Take everybody off the rock and the helmets stay on
// it; send somebody back and they pick one up. Nobody is ever nailed down.
group('a trade is a hat the station keeps', async () => {
  window.__crew(3, 0);
  window.__school({ breakers: 2 });
  const s = state();
  window.__assign('miners', -1);
  const one = state();
  window.__assign('miners', -1);
  window.__assign('miners', -1);
  run(15);                                   // long enough to walk the hat back
  const bare = state();
  window.__assign('miners', 1);
  run(15);                                   // and long enough to walk over and get it
  const two = state();
  // The same body count, twice as hard on the rock -- both halves off a fresh
  // rock and a swept yard, or the pair are not being compared on the same job.
  window.__crew(2, 0); window.__school({ breakers: 0 });
  run(15);                                   // any helmet still on a head goes back
  window.__jump(1);
  window.__clearFloor();
  const plainBefore = state().rock;
  run(20);
  const plain = plainBefore - state().rock;
  window.__jump(1);
  window.__crew(2, 0); window.__school({ breakers: 2 });
  run(15);                                   // helmets fetched before the clock starts
  window.__jump(1);                          // on the same rock the plain pair had
  window.__clearFloor();
  const hewnBefore = state().rock;
  run(20);
  const hewn = hewnBefore - state().rock;
  window.__crew(0, 0);
  window.__jump(1);
  return [
    ok(s.breakers === 2 && s.miners === 3, 'the rock has two helmets and three bodies',
       `${s.breakers} of ${s.miners}`),
    ok(one.miners === 2, 'anybody on it can be taken off', `${one.miners}`),
    ok(bare.miners === 0 && bare.breakers === 2,
       'and the last of them too -- the helmets stay on the rock',
       `${bare.breakers} left with ${bare.miners} there`),
    ok(bare.roster.find(r => r.job === 'miners').spareKit === 2,
       'lying there with nobody wearing them'),
    ok(two.trained.includes('m'),
       'so the next body sent over picks one up', two.trained || 'nobody'),
    ok(hewn > plain * 1.5, 'a breaker takes twice the bite',
       `${plain} plain, ${hewn} broken`)
  ];
});

// The carts are the lip's kit, the same as the helmets are the rock's. This is
// the case that was worst under the old rule: thirteen carts bought early were
// thirteen bodies that could never work a plot again.
group('a cart belongs to the lip, not to the carter', async () => {
  window.__crew(0, 4);
  window.__school({ carters: 2 });
  const s = state();
  window.__assign('miners', 1);
  window.__assign('miners', 1);
  window.__assign('miners', 1);
  run(20);                     // the carts are walked back to the lip and put down
  const after = state();
  window.__crew(0, 0); window.__school({ carters: 0 });
  return [
    ok(s.haulers === 4 && s.carters === 2, 'the lip has two carts and four bodies',
       `${s.carters} of ${s.haulers}`),
    ok(s.idle === 4, 'and every one of them is a spare hand', `${s.idle} spare`),
    ok(after.miners === 3, 'so all of them can be sent to the rock',
       `${after.miners} went`),
    ok(after.haulers === 1 && after.carters === 2,
       'and the carts stay at the lip', `${after.carters} carts, ${after.haulers} there`),
    ok(after.roster.find(r => r.job === 'haulers').worn === 1,
       'with the one body left pulling one of them')
  ];
});

group('the roster says how many of them have the trade', async () => {
  window.__crew(4, 3);
  window.__school({ breakers: 0, carters: 0 });
  const none = state().roster.find(r => r.job === 'miners');
  window.__school({ breakers: 2, carters: 1 });
  const some = state().roster;
  const rock = some.find(r => r.job === 'miners');
  const carry = some.find(r => r.job === 'haulers');
  window.__crew(0, 0);
  return [
    ok(!none.trade, 'no second line until somebody has a trade'),
    ok(rock.hats === 2 && !!rock.trade,
       'then the count of them stands under the headcount', `${rock.hats}`),
    ok(rock.trade && rock.trade[1] > none.less[1],
       'under it, not beside it: they are part of that number, not another one',
       rock.trade && `${rock.trade[1]} vs ${none.less[1]}`),
    // carrying has no buttons -- you never put a body *on* it -- but it has
    // carters, and they are worth as much of a count as anybody
    ok(carry.hats === 1 && !!carry.trade,
       'and the haulers get one too, buttons or no buttons', `${carry.hats}`),
    // and it is the cart, not a hat: what you see of a carter in the yard is
    // the thing it is dragging
    ok(carry.mark === 'cart' && rock.mark === 'helmet',
       'each station shows the mark its own trade wears',
       `${rock.mark} on the rock, ${carry.mark} on the dust`)
  ];
});

// Bodies are not saved -- the crew is a set of counts and the people are built
// from them -- so who was wearing what has to be worked out again on the way
// back in. It was not, and everybody walked back into the yard bare-headed
// with the stands piled high: a shift of errands to redo for nothing.
group('a hat is still on after a reload', async () => {
    run(0.4);
  window.__crew(2, 1);
  window.__clearFloor();
  window.__school({ breakers: 2, carters: 1 });
  run(25);
  const before = state();
  window.__reload();
  const after = state();
  window.__crew(0, 0);
  window.__school({ breakers: 0, carters: 0 });
  run(20);
  window.__clearFloor();
  const at = (s, job) => s.roster.find(r => r.job === job);
  return [
    ok(before.trained === 'hmm', 'the yard is kitted before the reload',
       `"${before.trained}"`),
    ok(after.trained === 'hmm', 'and every one of them still has it after',
       `"${after.trained}"`),
    ok(at(after, 'miners').worn === 2 && at(after, 'miners').spareKit === 0,
       'the rock counts two helmets worn and none waiting',
       `${at(after, 'miners').worn} worn, ${at(after, 'miners').spareKit} waiting`),
    ok(at(after, 'haulers').worn === 1, 'and the cart is still being pulled',
       `${at(after, 'haulers').worn} worn`)
  ];
});

// A lab with nothing to research is a room of people doing nothing, and there
// is no button that takes them off it. So they take themselves off.
group('an idle lab lets its people go', async () => {
  window.__abandon();                         // nothing for them to work on
  window.__crew(0, 1);
  window.__lab(true);
  window.__assign('labbers', 1);
  const sent = state();
  const inside = runUntil(() => state().crewDetail.some(d => d.startsWith('l|in')), 200);
  // LAB_IDLE_MS is twenty seconds: the grace to get some work started before
  // the people you sent over give up on you
  run(10);                                     // half way: still standing there
  const waiting = state();
  run(15);                                     // and well past it
  const gone = state();
  window.__crew(0, 0);
  return [
    ok(sent.labbers === 1, 'a body can be put on the lab', `${sent.labbers}`),
    ok(inside, 'and it walks over and goes in'),
    ok(waiting.labbers === 1,
       'an empty lab does not turn people out the moment they arrive',
       `${waiting.labbers}`),
    ok(gone.labbers === 0, 'but it does not keep them standing in it for ever',
       `${gone.labbers}`),
    ok(gone.haulers === 1 && gone.crew === 1,
       'and the one it lets go is back to carrying dust, not off the payroll',
       `${gone.haulers} carrying of ${gone.crew}`)
  ];
});

group('the books report what was made, not what is left', async () => {
  window.__crew(6, 3);
  quickCrew();                             // this is about the books, not the pace
  window.__give(8000, 4);
  // Until the yard is actually producing. The reading is a rolling average of
  // what has been banked, so it says nothing until a load has been carried in
  // -- and how long that takes is a fact about the walk, not about the books.
  runUntil(() => state().rates.banked > 0, 60);
  const before = state().rates.banked;
  window.__spend(6000);                    // a big purchase
  run(2.5);
  const after = state().rates.banked;
  return [
    ok(before > 0, 'production reads while dust is coming in', `${before}/min`),
    ok(after >= 0, 'and buying something does not read as negative production',
       `${after}/min`)
  ];
});

group('the save keeps what matters', async () => {
  const s = state();
  // Written outright rather than waited for. The game saves itself on a timer in
  // the page; what this check is about is what ends up in the save, and the
  // timer has a check of its own in the browser suite.
  window.__reload();
  const raw = JSON.parse(localStorage.getItem('boulder-clicker/v4') || 'null');
  return [
    ok(!!raw, 'a save exists'),
    ok(Math.abs(raw.stored - s.stored) <= 20, 'the hole is saved',
       `${raw?.stored} vs ${s.stored}`),
    ok(raw.cores === s.cores, 'cores are saved'),
    ok(raw.miners === s.miners && raw.haulers === s.haulers, 'the crew is saved'),
    ok(raw.shards === s.shards, 'shards are saved', `${raw?.shards} vs ${s.shards}`),
    ok(raw.quarryOpen === s.quarryOpen, 'and whether the quarry is open'),
    ok(raw.spores === s.spores, 'spores are saved', `${raw?.spores} vs ${s.spores}`),
    ok(Array.isArray(raw.plots), 'and how far along every plot is'),
    ok(raw.labOpen === s.labOpen, 'whether the lab is built'),
    ok(!!raw.mult && raw.mult.swing === s.mult.swing, 'and every multiplier bought'),
    ok(raw.labbers === s.labbers, 'who is in the lab', `${raw?.labbers} vs ${s.labbers}`),
    ok(!raw.research === !s.research, 'and whatever it is working on'),
    ok(typeof raw.boulder === 'string' && raw.boulder.length === raw.gw * raw.gh,
       'the rock is saved cell by cell')
  ];
});

// A backed-up rock pile is not a reason to stop fetching shards.
//
// The crew used to ask "is *any* heap backing up" and answer "fetch dust". That
// is right when the dust is what is backing up and exactly wrong when it is not
// -- and it stopped being an edge case the day the machines landed, because a
// ram fills the rock's pile in under a second and never empties it. Dust won
// every time for the rest of the run and the other two resources were left where
// they lay.
group('a full rock pile does not stop the crew fetching the other grounds', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 4, 2);                    // carriers, and somebody working the cut
  window.__clearFloor();
  run(3);

  // Back the rock's heap right up, the way a machine does.
  const p = state().piles.find(x => x.key === 'rock');
  for (let i = 0; i < 900; i++) window.__pile(p.from + (i % 60) * 4, 8);
  run(2);
  const jammed = state();

  // and put a shard on the ground out by the plots
  window.__toss('shard', state().farmX + 40);
  run(1);
  const before = state().shards;
  const got = runUntil(() => state().shards > before, 90);

  window.__crew(0, 0, 0);
  return [
    ok(jammed.pileFull.rock, 'the rock heap is backed up',
       `${jammed.pileCount.rock} on it`),
    ok(got, 'and a shard on the ground is still fetched',
       `${before} -> ${state().shards}`)
  ];
});
