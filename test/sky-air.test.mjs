// What is in the air over the yard: how thick it gets, where it will not go,
// the colour it takes from the works under it, and how it looks from the walk.

import { yard, group, ok, state, run, openSites, P } from './helpers.mjs';

group('the air thickens with what is lying about, and keeps out of the ground', async () => {
  // The air is the only thing in the background of this game, so it is the
  // only thing that says the view is moving. What it must not do is drift
  // about inside solid ground, and what it must do is answer the yard.
  window.__clearFloor();
  run(4);
  const bare = state();

  window.__pile(bare.rockX + 300, 2400);       // a heap where the spoil goes
  run(20);                                     // the air comes on a mote at a time
  const heaped = state();

  window.__clearFloor();
  run(20);
  const swept = state();

  return [
    ok(bare.air > 0, 'a bare yard still has dust hanging in it', `${bare.air}`),
    // what the yard asks for, not what the screen is carrying: a stocked pit
    // asks for more than the cap allows, and by then the count says nothing
    ok(heaped.airWant > bare.airWant, 'a heap in the yard puts more of it up',
       `${bare.airWant} bare, ${heaped.airWant} heaped`),
    ok(swept.airWant < heaped.airWant, 'and carrying the heap away thins it again',
       `${heaped.airWant} heaped, ${swept.airWant} swept`),
    ok(heaped.airFront > 0, 'some of it passes in front of the yard, not behind it',
       `${heaped.airFront} of ${heaped.air}`),
    ok(bare.airUnder === 0 && heaped.airUnder === 0 && swept.airUnder === 0,
       'and none of it is under the ground',
       `${bare.airUnder}/${heaped.airUnder}/${swept.airUnder}`)
  ];
});

group('the thing in the sky is benched', async () => {
  const s = state();
  return [
    ok(!s.skyShown, 'it is not in the sky'),
    ok(typeof s.skyShown === 'boolean', 'but the switch for it still exists')
  ];
});

// Clouds and birds are the only things in the game that are purely scenery, so
// the one thing they must never do is get in the way: they stay in the strip of
// sky above the height a rock can reach, and they stay in the view when it is
// scrolled, which is what the parallax is for -- a fixed sky would slide off the
// side of the world and leave an empty one behind.
// Clouds and smog share the sky, layered rather than mixed: the haze along the
// very top, the weather below it, and the birds through the middle of it.
group('the sky has clouds under the haze, and birds now and then', async () => {
  const before = state().sky;
  run(2);
  window.__look(0);
  run(2);
  const near = state().sky;
  window.__birds();
  const flock = state().sky;
  run(4);
  const later = state().sky;
  return [
    ok(before.clouds > 0 && before.clouds === near.clouds,
       'the same few clouds are kept wherever you are looking',
       `${before.clouds} / ${near.clouds}`),
    ok(near.cloudY.every(y => y >= near.top) && near.cloudY.every(y => y <= near.low),
       'they keep to their own band of sky', `${near.top}..${near.low}`),
    ok(near.top > state().camY + state().smogBand,
       'which starts below the haze rather than in it',
       `${near.top} against a haze ending ${state().camY + state().smogBand}`),
    ok(flock.birds >= 2 && flock.birds <= 4, 'birds still come in twos and threes',
       `${flock.birds}`),
    ok(flock.birdY.every(y => y <= flock.low + 20), 'flying no lower than they ever did',
       flock.birdY.join(' ')),
    ok(later.birds >= flock.birds &&
       flock.birdAcross.every((x, i) => x !== later.birdAcross[i]),
       'and every one of them is crossing',
       flock.birdAcross.join(' ') + ' -> ' + later.birdAcross.join(' '))
  ];
});

// A mote is the colour of what kicked it up, which is the only thing in the
// game that says what the far end of the yard is from across the world: blue
// air over the quarry, green over the plots, grey everywhere else.
group('the air over a site is the colour of what comes out of it', async () => {
    run(4);
  const yard = state();                        // nothing open: a grey yard

  window.__grant({ cores: 8 });
  window.__crew(0, 0, 2, 0);                   // opens the quarry, and works it
  window.__look(state().quarryX - 100);
  run(20);
  const atQuarry = state();

  window.__crew(0, 0, 0, 2);                   // and the plots
  window.__look(state().farmX - 100);
  run(20);
  const atFarm = state();

  return [
    ok(yard.airKinds.shard === 0 && yard.airKinds.spore === 0,
       'a yard with nothing open gives off nothing but dust',
       JSON.stringify(yard.airKinds)),
    ok(atQuarry.airKinds.shard > 0, 'the air over the quarry comes up blue',
       `${atQuarry.airKinds.shard} of ${atQuarry.air}`),
    ok(atFarm.airKinds.spore > 0, 'and the air over the plots comes off green',
       `${atFarm.airKinds.spore} of ${atFarm.air}`),
    ok(atFarm.airKinds.dust > 0, 'the yard itself is still grey',
       `${atFarm.airKinds.dust} of ${atFarm.air}`)
  ];
});

// *Where* it pays out, which is the whole of what a chute is. The grain used
// to leave the spout, fall the two courses to the ground -- and appear in the
// farm's heap a hundred cells away, because the ground at the quiet end of the
// yard was barred to dust. It was barred for a good reason once: it was ground
// nobody could reach, and a grain settling out there would lie in plain sight
// for the rest of the run with nothing able to fetch it. Then the house went
// up on it, and the crew started walking out there to man it.
//
// A grain landing on a barred column is not refused; `addGrain` walks outward
// until it finds one that is not. So the counter went up, the spout visibly
// paid, and nothing ever came to rest under it: dust that looked like it
// worked and was never actually made.
//
// Checked with nobody on the rock, so every grain on the floor is one this
// chute gave back and the span is the chute's own.
// A house that made a bad sky simply vanish was a building you bought once and
// then forgot: the only cost of running it was the body standing in it, and the
// recycler on top of that was a strict bonus, which is why the upgrade read as
// optional. The filters have to be emptied somewhere.
// The dust hanging over a place is the colour of what is under it. Smoke drifts,
// so it cannot be asked that -- by the time a mote has settled it is nowhere
// near what made it. It carries where it came from instead, and a dirty sky says
// which part of the works is dirtying it.
group('the sky says which part of the works dirtied it', async () => {
  window.__reset();
  // A machine running, because a machine is the only thing that dirties this
  // yard. No hand work fouls at all any more -- not the rock, not the cut, not
  // the plots. That is the whole of the smoke curve: a yard worked by people is
  // clean, and what you buy when you buy an engine is the sky.
  openSites();
  window.__fullSites();
  window.__crew(2, 0, 5, 7);
  window.__machine('jaw', { bought: true });
  window.__machine('tiller', { bought: true });
  window.__air({ haze: 0, muck: 0 });
  // Long enough for a plot to come all the way on and be cut. The quarry fouls
  // per cell dug and starts almost at once; the farm only fouls when a crop is
  // taken off, which is a whole ripening away.
  run(60);
  const s = state();
  const k = s.smog.skyKinds || {};
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(s.smog.sky > 0, 'there is a sky to read', `${s.smog.sky} motes`),
    ok(!k.none, 'every mote knows what put it up', JSON.stringify(k)),
    // Blue and green, from the two grounds that still raise anything by hand.
    // The rock raises nothing at all now, so there is no `dust` in the band
    // unless a machine has put soot there.
    ok(k.mach > 0, 'and it is soot, off a stack', `${k.mach || 0}`),
    ok(!k.dust && !k.shard && !k.spore,
       'and nothing else is up there, because no hand work fouls',
       JSON.stringify(k)),
    ok(Object.keys(k).length >= 1, 'so a dirty sky is a yard with engines in it',
       JSON.stringify(k))
  ];
});

// A sky you cannot see is not a sky. This has gone invisible twice: once when
// the threshold for rain was moved without moving what feeds the sky, and once
// because the band is spread evenly over the whole world on purpose and the
// window only ever shows an eighth of it -- so the count that matters is not
// how many motes exist, it is how many are in front of you.
//
// Measured as a share of the band actually on screen, because that is the thing
// being looked at. Both numbers below are set against a deterministic run: a
// tenth of a sky covers 2.9 percent of the band in the window, half a sky 17.1
// percent and a full one 34.9, the same three figures every time the seed is the
// same and the code that runs before this group is the same. They move whenever
// an earlier group's own dust draws a different number of chances off the same
// seed -- dust leniency's ground out past the left end of the yard, and the
// clearance in front of the hill, both being ground now, cost this run a few
// more grains' worth of scatter than the run these figures used to describe. It
// used to read one percent and eight, before that -- a fifth and a half of what
// the yard actually does, room for a wobble the seeded run does not have. At
// two and thirteen this fails when the sky goes thin, which is the fault it is
// here for, and still has a quarter again in hand.
group('a dirty sky can be seen from where you stand', async () => {
  window.__crew(0, 0);
  const at = state().smog.at;

  // cells of band inside the window: how wide the view is, thirteen deep
  const bandCells = () => Math.round(state().viewW / P) * 13;
  const inWindow = () => {
    const s = state();
    return window.__skyXY().filter(([x]) => x > s.camX && x < s.camX + s.viewW).length;
  };
  const coverAt = haze => {
    window.__air({ haze });
    run(1);
    return inWindow() / bandCells();
  };

  const tenth = coverAt(Math.round(at / 10));
  const half = coverAt(Math.round(at / 2));
  const full = coverAt(at - 1);
  window.__air({ haze: 0 });

  return [
    ok(tenth > 0.022,
       'a sky a tenth of the way to rain has something in it to see',
       `${(tenth * 100).toFixed(1)}% of the band in the window`),
    ok(half > 0.13,
       'half a sky covers enough of the band to read as haze',
       `${(half * 100).toFixed(1)}%`),
    ok(full > half && half > tenth,
       'and it thickens the whole way up rather than topping out early',
       `${(tenth * 100).toFixed(1)}% -> ${(half * 100).toFixed(1)}% -> ${(full * 100).toFixed(1)}%`)
  ];
});
