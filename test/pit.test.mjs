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
group('a toss lands in the hole, however small the hole is', async () => {
  window.__crew(0, 4);
  quickCrew();
  window.__pile(state().rockLeftX + 300, 900);
  const before = state();
  run(120);
  const s = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(s.pitW === 150, 'the hole is still the scrape you start with', `${s.pitW}`),
    ok(s.stored > before.stored, 'and dust is going into it',
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
  const was = (({ minerSpeedLevel, haulPaceLevel, haulCarryLevel }) =>
               ({ minerSpeedLevel, haulPaceLevel, haulCarryLevel }))(state());
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
  window.__levels({ minerSpeedLevel: 10, haulPaceLevel: 8, haulCarryLevel: 3 });
  // until the hole is full, not for a fixed quarter of an hour of game: what
  // this is about starts the moment there is no more room
  runUntil(() => state().pitFull, 250);
  run(10);                                     // and a moment to stand down in
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
    ok(s.pitFull, 'the hole reports itself full', `${s.pit} of ${s.pitCapacity}`),
    ok(s.pit >= s.pitCapacity, 'and it really is: every cell the bed allows is spoken for',
       `${s.pit} cells, ${s.pitDust} of them dust`),
    // the heap over the mouth has to have unlocked, or the pile stopped at
    // the brim of the hole and everything above it was never reachable
    ok(s.pitDust > (s.pitW / s.pitGrain) * (s.pitDepth / s.pitGrain) - s.cores,
       'the heap over the mouth was unlocked on the way',
       `${s.pitDust} dust, hole holds ${(s.pitW / s.pitGrain) * (s.pitDepth / s.pitGrain)}`),
    ok(carrying.length === 0 || s.stored === s.pitDust,
       'and nobody is stood at the lip throwing at a brim that will not take it',
       `${carrying.length} still laden, ${s.stored} counted`)
  ];
});

group('the pit is dug out, not given', async () => {
  const small = state();
  window.__tip(1000);                        // more than a scrape will take
  run(0.4);
  const full = state();

  window.__dig();                            // every dig there is
  run(0.4);
  const s = state();

  return [
    ok(small.pitW === 150 && small.pitDepth === 150,
       'it starts as a scrape, 150 by 150', `${small.pitW} x ${small.pitDepth}`),
    ok(small.pitCapacity < 800, 'which holds a couple of minutes of dust',
       `${small.pitCapacity}`),
    ok(full.pit === small.pitCapacity && full.stored === full.pitDust,
       'it fills to the brim of the scrape and takes no more',
       `${full.pit} cells, ${full.stored} counted`),
    ok(s.pitDepth === 276, 'dug out it is 276 deep', `${s.pitDepth}`),
    ok(s.pitW === 3600, 'and 3600 across', `${s.pitW}`),
    ok(s.pitLevel === 23 && s.pitDigsLeft === 0, 'and there is nothing left to dig',
       `dig ${s.pitLevel}, ${s.pitDigsLeft} to go`),
    ok(s.pitDust === full.pitDust && s.pitDust === s.stored,
       'the pile that was in it is still in it, grain for grain',
       `${full.pitDust} -> ${s.pitDust}, ${s.stored} counted`),
    ok(!s.pitFull, 'and there is room in it again', `${s.pitDust} of ${s.pitCapacity}`),
    // the hole itself, plus whatever the heap over the brim is allowed to be
    ok(s.pitCapacity > (3600 / s.pitGrain) * (276 / s.pitGrain),
       'it holds the hole and then some, for the heap over the mouth',
       `${s.pitCapacity} at grain ${s.pitGrain}`),
    ok(s.pitCapacity < (3600 / s.pitGrain) * (276 / s.pitGrain) * 1.5,
       'but the heap is a heap, not another hole', `${s.pitCapacity}`)
  ];
});

group('dust in the pit is one grain each', async () => {
  window.__dig();                            // the hole this is about is the dug one
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
    ok(j.pitStep === 0, 'and the grain it is drawn at', `${j?.pitStep}`),
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
    ok(after.pitDust === Math.min(after.stored, after.pitCapacity),
       'and the pile matches what will fit',
       `${after.pitDust} in the pit, ${after.stored} counted, ${after.pitCapacity} room`),
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
