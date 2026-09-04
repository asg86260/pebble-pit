// The hole in the ground: how big it is, what it holds, what it turns away, and
// what the crew do about a full one.
//
// Every check here is about the yard rather than about the page, so it runs
// against `step` in node with no browser anywhere. The words are the words these
// checks were written with in the browser suite; what changed is where they run.

import { group, ok, state, run, runUntil, quickCrew, haveRock, bankCore, P, WORKER } from './helpers.mjs';

// A hole you can throw across has a back to it. The toss off the lip was a
// fixed spray, which was fine while the pit ran two windows to the right and
// wrong the moment it starts as a scrape: the same throw cleared the far wall
// and came down on the ground behind the pit, where nothing can pick it up.
// What this is really about is the throw: a hauler stands at the near lip and
// tips, and none of it may sail over the far wall onto the ground behind. It
// used to say "however small the hole is", back when the hole started as a
// scrape and the far wall was close enough to clear.
group('a toss lands in the hole, not on the ground behind it', async () => {
  window.__crew(0, 4);
  quickCrew();
  // A swept floor to start on: what this counts is dust lying past the far wall,
  // and a grain an earlier check left out there reads as a throw that sailed.
  window.__clearFloor();
  window.__pile(state().rockLeftX + 300, 900);
  const before = state();
  runUntil(() => state().stored > before.stored + 200, 120);
  const s = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(s.stored > before.stored, 'dust is going into it',
       `${before.stored} -> ${s.stored}`),
    ok(s.dustPastPit === 0, 'nothing sails over the far wall onto the ground behind',
       `${s.dustPastPit} grains behind the pit`)
  ];
});

// The hole is dug, not given: it starts as a scrape you can fill in a minute
// and every dig at the bench takes the far wall out and the floor down. This
// check digs it all the way out and leaves it there, which is the state the
// capacity checks below it want.
// The hole filling up is a fact about the *pile*, not about the counter, and
// they are nearly the same number: a core in the pile takes a cell and is not
// dust. Reading the counter meant the hole was physically full one grain
// before the counter agreed, the heap over the mouth never unlocked, and the
// crew stood at the lip throwing dust at a brim with nowhere under it -- for
// ever, because nothing about that state could change.
group('a core in the pile does not jam the hole', async () => {
  const was = (({ rockhandSpeedLevel, haulPaceLevel, haulCarryLevel }) =>
               ({ rockhandSpeedLevel, haulPaceLevel, haulCarryLevel }))(state());
  // The core goes in first, while there is still room for it. Everything is
  // counted against the one capacity now -- a find is a grain like any other --
  // so a core arriving at a hole that is already full is a core that waits on
  // the ground, and what this check is about is a core *in* the pile. Whatever
  // an earlier check left in the hole is emptied out first, or there may be no
  // room for it even at the start.
  window.__spend(state().stored);
  window.__clearFloor();
  await bankCore();
  // Enough hands to keep the yard clear: the rock's pile stops the gang when
  // it fills, and this check needs the hole actually filled inside its run.
  window.__crew(3, 6);
  window.__levels({ rockhandSpeedLevel: 10, haulPaceLevel: 8, haulCarryLevel: 3 });
  // Filled by hand. The hole is the whole hole from the first frame, so mining
  // it full is an hour of yard -- and what this is about starts the moment
  // there is no more room, not on the way there. The crew above are still here
  // to keep working against a full hole once it is.
  window.__give(999999);
  // Waited on the COLLAPSE rather than on `pitFull`. Once the hole has torn
  // open the rift swallows off the top on its own clock, so the pile drops a
  // grain below the brim and back over it between one frame and the next --
  // `pitFull` blinks, and a check that waits for it and then reads it can catch
  // either. What this group is about is the yard against a hole with no room in
  // it, and that is what the collapse says.
  // The hole at the moment it gave way, read before a single frame of the
  // tearing has run. `__give` fills the plot and the hole refuses a grain inside
  // that one call, so this is the brim -- and the brim is all it is now: the
  // tear takes the whole pile from there (see `## The rift`), so a check that
  // runs a quarter of a second past it reads a hole a third of the way gone.
  //
  // The two facts about a *full* hole -- every cell spoken for, and the heap
  // over the mouth unlocked on the way -- are only ever true here. Everything
  // about the yard afterwards is read below, once the gulp is done and the crew
  // have had a moment.
  const brim = state();
  run(10);                                     // the tearing, and a moment to stand down in
  const s = state();
  const carrying = s.crewDetail.filter(w => w[0] === 'h' && +w.split('|c')[1].split('|k')[0] > 0);
  // put the yard back: an empty hole and a swept floor, or every check after
  // this one starts in a works that has ground to a halt
  window.__crew(0, 0);
  window.__spend(s.stored);
  window.__clearFloor();
  window.__levels(was);                    // and a yard that swings at its old pace
  run(1);
  return [
    ok(s.cores > 0, 'a core has been banked, so the pile is not all dust',
       `${s.cores} cores`),
    ok(brim.riftOpen && s.riftOpen, 'the hole has been filled past what it holds',
       `${brim.pit} of ${brim.pitCapacity}`),
    // Within a whisker of every cell: the rift is swallowing off the top the
    // whole time, so the pile sits a hair under the brim and is topped straight
    // back up. A tolerance rather than a number, because how big the whisker is
    // depends on the rift's rate.
    ok(brim.pit >= brim.pitCapacity * 0.99, 'and it really was: every cell the plot allows was spoken for',
       `${brim.pit} cells of ${brim.pitCapacity}, ${brim.pitDust} of them dust`),
    // the heap over the mouth has to have unlocked, or the pile stopped at
    // the brim of the hole and everything above it was never reachable
    ok(brim.pitDust > (brim.pitW / brim.pitGrain) * (brim.pitDepth / brim.pitGrain) - brim.cores,
       'the heap over the mouth was unlocked on the way',
       `${brim.pitDust} dust, hole holds ${(brim.pitW / brim.pitGrain) * (brim.pitDepth / brim.pitGrain)}`),
    // Laden is fine now, and is the point: a hole that has collapsed always has
    // somewhere to put a load, so a carter walks up and tips it rather than
    // standing at the lip holding it. What must be true is that the books
    // balance -- what is counted, less what is through the rift, is the pile.
    // And the tearing took it: the hole a player is left with after the moment
    // is an empty one, which is the whole of what the rift is for.
    ok(s.pit < brim.pit * 0.1, 'and the tearing emptied it',
       `${brim.pit} -> ${s.pit}`),
    ok(s.stored - s.rift === s.pitDust,
       'and what is counted, less what is through the rift, is the pile',
       `${s.stored} counted, ${s.rift} through, ${s.pitDust} in the pile`)
  ];
});

group('the pit is the whole hole from the first frame', async () => {
  const s0 = state();
  // The hole used to be bought a dig at a time, from a scrape to the full pit,
  // which made a hole in the ground the ceiling on every price in the game: what
  // you could hold was what you had dug. It is given now.
  window.__tip(1000);
  run(0.4);
  const s = state();
  return [
    ok(s0.pitW === 3600, 'it is the full width from the start', `${s0.pitW}`),
    ok(s0.pitDepth === 276, 'and the full depth', `${s0.pitDepth}`),
    ok(s0.pitCapacity > 30000, 'so it holds a run of the yard, not a couple of minutes',
       `${s0.pitCapacity}`),
    ok(!s.pitFull && s.pitDust === s.stored,
       'a thousand tipped in is a thousand in the pile, with room to spare',
       `${s.pitDust} of ${s.pitCapacity}`),
    // the hole itself, plus whatever the heap over the brim is allowed to be
    ok(s.pitCapacity > (3600 / s.pitGrain) * (276 / s.pitGrain),
       'it holds the hole and then some, for the heap over the mouth',
       `${s.pitCapacity} at grain ${s.pitGrain}`),
    ok(s.pitCapacity < (3600 / s.pitGrain) * (276 / s.pitGrain) * 1.5,
       'but the heap is a heap, not another hole', `${s.pitCapacity}`)
  ];
});

group('dust in the pit is one grain each', async () => {
  const cap = state().pitCapacity;
  window.__give(Math.floor(cap * 0.6));
  run(0.6);
  const s = state();
  return [
    ok(s.pitGrain === 6, 'a grain in the pile is the same size as dust anywhere else',
       `${s.pitGrain}px`),
    ok(s.stored === s.pitDust, 'every dust counted is a grain in the pile',
       `${s.stored} counted, ${s.pitDust} in the pit`),
    ok(cap > 20000, 'the hole holds a whole run of mining', `${cap}`)
  ];
});

group('a full pit still saves and reloads', async () => {
  // A full one, said outright. It used to be full because the check above this
  // one had just filled it, which is the sort of thing that makes a suite
  // impossible to run a piece at a time.
  window.__dig();
  window.__tip(state().pitCapacity + 2000);
  window.__reload();
  run(1.2);
  const raw = localStorage.getItem('boulder-clicker/v4');
  const s = state();
  const j = JSON.parse(raw || 'null');
  return [
    ok(raw.length < 200 * 1024, 'the save stays small', `${Math.round(raw.length / 1024)}KB`),
    ok(j.stored === s.stored, 'the hole is saved', `${j?.stored}`),
    ok(typeof j.pit?.heights === 'string', 'the pile is saved as its profile'),
    // The rift travels with it, and it is the one part of what you own that the
    // pile cannot be read back from: lose this line and a player's dust is not
    // somewhere else, it is gone.
    // A hole filled past the brim tears open, so there is something standing in
    // the rift to travel. Not to the grain: the save is written on its own timer
    // and the rift swallows every frame, so the two are read a moment apart.
    ok(j.rift > 0 && Math.abs(j.rift - s.rift) < 200,
       'and what is standing in the rift', `${j?.rift} saved against ${s.rift}`),
    ok(j.pitLevel === s.pitLevel, 'and how far the hole has been dug', `${j?.pitLevel}`)
  ];
});

group('spending a full pit takes it back out', async () => {
  window.__dig();
  window.__tip(state().pitCapacity * 2);     // a full one, which is what is being spent
  run(0.4);
  const before = state();
  window.__spend(Math.floor(before.stored / 2));
  run(0.6);
  const after = state();
  return [
    ok(after.stored === before.stored - Math.floor(before.stored / 2), 'the counter comes down',
       `${before.stored} -> ${after.stored}`),
    // The pile is what you own LESS what is through the rift -- and a hole
    // tipped past its brim has torn open, so some of this is through. Spending
    // comes out of the hole first and the rift after (see rift.test.mjs), so
    // half of a doubly-full hole is the whole visible pile.
    ok(after.pitDust === Math.min(after.stored - after.rift, after.pitCapacity),
       'and the pile matches what will fit',
       `${after.pitDust} in the pit, ${after.stored} counted, ${after.rift} through`),
    ok(after.paid > 0, 'dust is seen leaving')
  ];
});

// A grain that has cleared the whole hole lands on the ground beyond it -- a
// throw that went too far, and somebody has to go and get it. A grain already
// down inside the hole is a different thing entirely: the back of the hole is
// a wall, and it used to be let through and deposited on the surface outside,
// which is a grain climbing out of a hole.
group('the back of the hole is a wall to anything already in it', async () => {
    run(0.4);
  window.__crew(0, 0);
  window.__clearFloor();
  const s = state();

  for (let i = 0; i < 5; i++) window.__toss('shard', s.pitX + s.pitW + 60 + i * 12);
  run(3);
  const over = state();

  window.__clearFloor();
  window.__spend(state().stored);
  window.__toss('shard', s.pitX + s.pitW - 12, s.groundY + 30);
  run(3);
  const inside = state();
  window.__clearFloor();
  return [
    ok(over.dustPastPit === 5 && over.shards === 0,
       'a throw that clears the hole lies on the ground beyond it',
       `${over.dustPastPit} past, ${over.shards} banked`),
    ok(inside.dustPastPit === 0 && inside.shards === 1,
       'and one already down the hole stays down it',
       `${inside.dustPastPit} past, ${inside.shards} banked`)
  ];
});
