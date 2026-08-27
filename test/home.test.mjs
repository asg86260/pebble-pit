// What the crew do when there is nothing to do: stand down, take a break, walk
// home, and turn a light on behind a window.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';
// A yard with nothing in it to carry is a yard nobody needs to be stood in.
// The one thing that has to be true is that letting them go is never a
// decision you regret: they are all back the moment there is dust.
group('a body with no work goes home, and the lights say who is in', async () => {
    run(0.4);
  window.__crew(0, 4);
  window.__clearFloor();
  const dark = state();
  runUntil(() => state().houses.home === 4, 200);   // until all four have knocked off
  const in_ = state();
  const rockX = state().rockX;
  for (let i = 0; i < 8; i++) window.__pile(rockX + 60 + i * 30, 60);
  run(4);
  const out = state();
  runUntil(() => state().floorGrains === 0, 60);    // and until the yard is clear again
  const done = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(dark.houses.home === 0 && dark.houses.lights === 0,
       'a yard just started has nobody in and no window lit',
       `${dark.houses.home} in, ${dark.houses.lights} lit`),
    ok(in_.houses.home === 4, 'with nothing to carry they all knock off',
       `${in_.houses.home} of 4`),
    ok(in_.houses.lights > 0 && in_.houses.lights <= in_.houses.home,
       'and the windows light up behind them -- never more than are in',
       `${in_.houses.lights} lit for ${in_.houses.home}`),
    ok(in_.workerPos.length === 4 && in_.houseSmoke >= 0,
       'they are still on the books, just out of sight', `${in_.workerPos.length} hired`),
    ok(out.houses.home === 0 && out.houses.lights === 0,
       'dust on the ground brings every one of them straight back out',
       `${out.houses.home} still in`),
    ok(done.stored > 0, 'and it gets carried', `${done.stored} banked`)
  ];
});

// A body that has knocked off is stood indoors and is not drawn -- that is
// what being home means. Nothing else in the game takes somebody off carrying,
// so nothing else ever had to clear it, and a body put on the quarry straight
// out of the house went down the cut, worked the face, brought shards up and
// was invisible the whole time.
group('a body put to work comes out of the house first', async () => {
    run(0.4);
  window.__crew(0, 3);
  window.__clearFloor();
  const away = runUntil(() => state().houses.home === 3, 300);
  const home = state();

  window.__assign('quarriers', 1);
  window.__assign('quarriers', 1);
  // Long enough for the cut to pay. Shards come out in a seam at the bottom of a
  // dig now rather than trickling off the face, so the first of them is most of
  // a minute in -- and until there is one on the ground the hauler still at home
  // has nothing to be called out for.
  runUntil(() => state().pileCount.quarry > 0, 180);
  runUntil(() => state().houses.home === 0, 60);
  const at = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(away && home.houses.home === 3, 'with nothing to carry they are all indoors',
       `${home.houses.home} in`),
    ok(at.quarriers === 2, 'two of them are put on the quarry', `${at.quarriers}`),
    ok(at.houses.home === 0, 'and none of them is still counted as being at home',
       `${at.houses.home} still in`),
    ok(at.workerPos.length === 3, 'so all three are out where you can see them',
       `${at.workerPos.length} drawn of 3`),
    ok(at.crewDetail.filter(d => d[0] === 'q').length === 2,
       'and the two of them are down the cut working',
       JSON.stringify(at.crewDetail))
  ];
});
// The crew live in a block of cubes between the bench and the rock, one cube
// a body. It is the narrowest strip of ground in the yard and the rock grows
// into it, so the two things worth checking are that it is not there before
// anybody is hired and that it never touches either neighbour -- at the
// biggest rock the game allows, which is where the strip is at its narrowest.
group('the crew have somewhere to live', async () => {
  window.__crew(0, 0, 0, 0, 0);
  const empty = state().houses;
  window.__crew(1, 0, 0, 0, 0);
  const one = state().houses;
  window.__crew(6, 6, 0, 0, 0);
  const twelve = state().houses;
  const grew = twelve.top < one.top;              // up the screen is a smaller y
  window.__jump(30);
  const big = state().houses;
  const onGrid = big.cells.every(c => c.split(',').every(v => +v % P === 0));

  // every room, at every crew size it has ever stood at
  const seen = {}, moved = [];
  for (let n = 1; n <= 26; n++) {
    window.__crew(n, 0, 0, 0, 0);
    const h = state().houses;
    // Rooms and the holes cut in them, each list keyed on its own count: a
    // window that jumps when the room next door is built is the same fault as
    // a room that moves, and it is the one that survived the first go at this.
    for (const [what, list] of [['room', h.cells], ['hole', h.holes]]) {
      list.forEach((c, k) => {
        const key = `${what} ${k}`;
        if (seen[key] && seen[key] !== c) moved.push(`${n}: ${key} was ${seen[key]}, now ${c}`);
        seen[key] = c;
      });
    }
  }
  const settled = moved.length === 0;
  window.__crew(0, 0, 0, 0, 0);
  window.__jump(1);
  return [
    ok(empty.cubes === 0, 'nothing stands there until somebody is hired',
       `${empty.cubes} cubes`),
    // a room a body, and the doorway on top of that: the first hire gets a
    // way in and somewhere to live, not a shed with a door in it
    ok(one.cubes === 2 && twelve.cubes === 13, 'then it is a room a body and a doorway',
       `${one.cubes} / ${twelve.cubes}`),
    ok(grew, 'and the block goes up as the crew does',
       `${one.top} -> ${twelve.top}`),
    ok(big.base === big.foot, 'the bottom course stands on the ground line',
       `${big.base} / ${big.foot}`),
    // The bench stands between the block and the rock: you walk in past your
    // own front door to get to the shop, not out past the shop to get home.
    ok(big.right <= state().benchX, 'the block stands outside the bench',
       `${big.right} / ${state().benchX}`),
    // and it stands in the middle of the ground it has, rather than hard
    // against one neighbour with all the slack on the other side
    ok(big.ofBench > 0, 'it stands clear of the bench',
       `${big.ofBench}px`),
    ok(big.benchOfApron > 0, 'and the bench clears the apron at the biggest rock',
       `${big.benchOfApron}px`),
    ok(big.ofBench === big.benchOfApron,
       'the bench is centred between the block and the biggest rock',
       `${big.ofBench}px to the houses, ${big.benchOfApron}px to the apron`),
    ok(big.ofApron > 0, 'with the block further out again',
       `${big.ofApron}px`),
    ok(onGrid, 'every cube sits on the lattice'),
    // Building is additive. Taking somebody on adds a room; it does not move
    // the rooms that were already standing, and it did once -- the base was
    // worked out from the size of the crew, so every hire rebuilt the place
    // and the one thing you should have been able to watch happen was the one
    // thing you could not.
    ok(settled, 'and a hire adds a room without moving the ones already there',
       settled ? '1 through 26' : moved.slice(0, 3).join('; '))
  ];
});
