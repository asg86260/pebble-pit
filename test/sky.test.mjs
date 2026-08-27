// The air: what fills it, what comes back down, and what the scrubbing house
// does about it.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

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

// One number, signed, on the board where you do something about it. The rate
// the yard fouls has to be measured at the source: inferred from the haze it
// reads equal to whatever the house is taking out the moment the house starts
// winning, the two cancel, and the only number this board exists to show sits
// at nought however many bodies you move.
group('the sky reads as one rate, and it can go negative', async () => {
    run(0.4);
  window.__crew(4, 4);
  window.__lab(true);
  window.__air({ open: true, haze: 600 });
  window.__research('labair');
  run(10);
  const losing = state().smog;

  window.__air({ scrubbers: 2, haze: 600 });
  run(40);
  const winning = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0, open: false, scrubbers: 0 });
  return [
    ok(losing.fouling > 0 && losing.scrubbing === 0,
       'a yard with nobody in the house is putting up and taking down nothing',
       `+${losing.fouling}/min, -${losing.scrubbing}/min`),
    ok(Math.abs(winning.fouling - losing.fouling) < losing.fouling,
       'and the rate it fouls at does not move because somebody walked into the house',
       `${losing.fouling} -> ${winning.fouling}`),
    ok(winning.scrubbing > 0 && winning.fouling - winning.scrubbing < 0,
       'so a staffed house turns it the other way, which is the whole reading',
       `${winning.fouling} - ${winning.scrubbing} = ${(winning.fouling - winning.scrubbing).toFixed(1)}/min`),
    ok(losing.trend > 0 && winning.trend < 0,
       'and the arrow follows a minute of it, not a second',
       `${losing.trend.toFixed(2)} -> ${winning.trend.toFixed(2)}`)
  ];
});

// The air. Mining fills the sky, the sky gives it back as muck, the muck is in
// the way rather than worth anything, and a house with somebody in it is the
// only thing that stops the cycle.
group('the sky fills up, and gives it back', async () => {
    run(0.4);
  const bare = state().smog;
  window.__crew(3, 3);
  run(5);
  window.__clearFloor();
  run(20);
  const dirty = state().smog;

  // A clean sky has no cloud in it, a half-full one has clouds, and a full one
  // has bigger clouds. Wound up by hand rather than mined for: a rain is an
  // hour of honest work away and a check should not have to do it.
  window.__air({ haze: Math.round(state().smog.at / 2) });
  run(1);
  const half = state().smog;
  // The sky is the motes themselves, so what is up there gathers: scattered to
  // start with, and after a while in far fewer places and far thicker in each.
  // Measured at half a sky, before it is wound to the brim -- a full one rains
  // itself out while it is being watched.
  const seeded = { clump: state().smog.clumpiness, bins: state().smog.skyBins };
  run(25);
  const gathered = { clump: state().smog.clumpiness, bins: state().smog.skyBins };

  window.__air({ haze: state().smog.at - 1 });
  run(1);
  const full = state().smog;

  // Watched all the way down rather than sampled at the ends: the whole claim
  // is that it thins out, and a before and an after cannot tell a fade from a
  // thing that was switched off.
  const seenR = [];
  let wet = null;
  for (let i = 0; i < 80; i++) {
    run(0.25);
    const air = state().smog;
    if (!air.raining) { if (seenR.length) break; else continue; }
    seenR.push(air.cloudR);
    if (!wet || air.muck.all > wet.muck.all) wet = air;
  }
  const shrank = seenR.length > 4 && seenR.every((v, i) => i === 0 || v <= seenR[i - 1]);

  const rockWas = state().rock;
  run(30);
  const dried = state();
  // and the yard goes back the way it was found: a sky left full and a gang
  // left standing are both things the next group would notice
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(bare.haze === 0, 'a new yard has a clean sky', `${bare.haze}`),
    ok(dirty.haze > 0 && dirty.fouling > 0,
       'and mining puts what it takes out into it', `${dirty.haze}, ${dirty.fouling}/min`),
    ok(bare.cloudR === 0 && half.cloudR > 0 && full.cloudR > half.cloudR,
       'which gathers into clouds that grow as it fills',
       `${bare.cloudR} -> ${half.cloudR} -> ${full.cloudR} cells across`),
    ok(dirty.puffs > 0 || dirty.sky > 0,
       'and you can see it going up: a puff off the swing, climbing',
       `${dirty.puffs} climbing, ${dirty.sky} arrived`),
    ok(gathered.clump < 8 && gathered.bins > seeded.bins / 2,
       'and once up there it lies as a haze over everything, not in knots',
       `${seeded.clump} over ${seeded.bins} bins -> ${gathered.clump} over ${gathered.bins}`),
    ok(wet.rains === 1, 'full, it comes back down', `${wet.rains} rains`),
    ok(wet.muck.rock > 0 && wet.muck.yard > 0,
       'as muck, on the rock and over the yard',
       `rock ${wet.muck.rock}, yard ${wet.muck.yard}`),
    ok(wet.drops > 0, 'falling a cell at a time, not drawn over the window',
       `${wet.drops} in the air`),
    ok(shrank, 'and the banks it falls out of shrink as it comes down, step by step',
       seenR.join(' ')),
    ok(seenR[seenR.length - 1] < seenR[0] / 3,
       'so by the end there is next to nothing left of them',
       `${seenR[0]} -> ${seenR[seenR.length - 1]}`),
    ok(dried.smog.muck.rock === 0, 'which the gang clear off the face',
       `${dried.smog.muck.rock} left`),
    ok(dried.rock < rockWas, 'and then get back to the rock under it',
       `${rockWas} -> ${dried.rock}`),
    ok(dried.smog.rains === 1, 'and one rain is one rain: it does not keep coming',
       `${dried.smog.rains}`)
  ];
});

// What the rain leaves is not material. It is shifted and it is gone -- nothing
// carries it to the hole, nothing counts it, and the yard ends up exactly the
// way it was. The shift is the whole of the cost.
// Clearing up is the job when there is a mess. It used to be what a body did
// when it had nothing else on, which meant it was never done: there is always
// dust to fetch, so a yard under an inch of muck stayed under it while the crew
// walked over it carrying grains.
group('a mess comes before the dust', async () => {
    run(0.4);
  window.__crew(1, 5);
  window.__give(500);                          // plenty on the floor to distract them
  run(4);
  window.__air({ haze: state().smog.at + 1 });
  let peak = 0;
  for (let i = 0; i < 60; i++) { run(0.25); peak = Math.max(peak, state().smog.muck.yard); }
  const wet = state();
  run(30);
  const later = state();
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(peak > 100, 'a rain leaves the yard under a real layer', `${Math.round(peak)} cells`),
    ok(later.smog.muck.yard < wet.smog.muck.yard,
       'and the crew set about it rather than stepping over it',
       `${wet.smog.muck.yard} -> ${later.smog.muck.yard}`),
    ok(later.floor > 0,
       'with the dust left lying where it is until the mess is gone',
       `${later.floor} still on the ground`)
  ];
});

group('muck is shifted, not banked', async () => {
    run(0.4);
  window.__crew(0, 3);                         // nobody on the rock: no dust at all
  run(5);
  window.__clearFloor();
  run(4);
  window.__clearFloor();
  const before = state();
  // over the brim rather than just under it: with nobody on the rock there is
  // nothing putting the last mote up there
  window.__air({ haze: before.smog.at + 1 });
  run(14);
  const wet = state();
  run(40);
  const after = state();
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(after.smog.rains === 1, 'it rained', `${after.smog.rains}`),
    ok(wet.smog.muck.cols > 100 && wet.smog.muck.all > wet.smog.muck.cols,
       'and it laid a layer over the whole yard rather than freckling it',
       `${wet.smog.muck.all} cells over ${wet.smog.muck.cols} columns`),
    ok(after.smog.muck.yard < wet.smog.muck.yard, 'which spare hands set about shifting',
       `${wet.smog.muck.yard} -> ${after.smog.muck.yard}`),
    ok(after.stored === before.stored,
       'with nothing to show for it: not one grain of muck was banked',
       `${before.stored} -> ${after.stored}`),
    ok(after.floor === before.floor,
       'and none of it was left lying about as dust either',
       `${before.floor} -> ${after.floor}`)
  ];
});

// An empty scrubbing house is a shed. The bodies are the whole cost of it, and
// the recycler is what turns that cost into a wage.
group('a staffed scrubbing house pulls the sky back down', async () => {
    run(0.4);
  window.__crew(2, 4);
  run(5);
  window.__clearFloor();

  // built, and nobody in it
  window.__air({ open: true, haze: 500 });
  run(6);
  const shut = state().smog;

  // Put on it, and then given the walk. A body moved onto the house is
  // whichever body was nearest to hand -- it keeps where it is standing and
  // walks over, which from the middle of the yard to the quiet end of it is a
  // good twenty seconds, and nothing comes out of the sky until it is through
  // the door. Waiting a fixed six was waiting for the walk to be decoration.
  window.__air({ scrubbers: 2, haze: 500 });
  runUntil(() => state().smog.scrubbing > 0, 40);
  run(6);
  const on = state().smog;

  window.__air({ recycler: true, haze: 500 });
  const floorWas = state().floor;
  run(12);
  const paid = state();
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0, open: false, recycler: false, scrubbers: 0 });
  window.__clearFloor();
  return [
    ok(shut.haze >= 500 && shut.scrubbing === 0,
       'an empty house does nothing at all', `${shut.haze}, ${shut.scrubbing}/min`),
    ok(on.scrubbers === 2 && on.scrubbing > 0 && on.haze < 500,
       'bodies in it start pulling the sky down',
       `${on.scrubbers} in, ${on.scrubbing}/min, haze ${on.haze}`),
    ok(on.caught > 0, 'and you can see it: motes bend out of the drift towards it',
       `${on.caught} of ${on.motes} on their way in'`),
    ok(paid.smog.recycled > 0, 'a recycler keeps what it catches',
       `${paid.smog.recycled} grains`),
    ok(paid.floor > floorWas,
       'and pays it out as real dust on the ground, not as a number going up',
       `${floorWas} -> ${paid.floor}`)
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
// air over the quarry, green over the beds, grey everywhere else.
group('the air over a site is the colour of what comes out of it', async () => {
    run(4);
  const yard = state();                        // nothing open: a grey yard

  window.__grant({ cores: 8 });
  window.__crew(0, 0, 2, 0);                   // opens the quarry, and works it
  window.__look(state().quarryX - 100);
  run(20);
  const atQuarry = state();

  window.__crew(0, 0, 0, 2);                   // and the beds
  window.__look(state().farmX - 100);
  run(20);
  const atFarm = state();

  return [
    ok(yard.airKinds.shard === 0 && yard.airKinds.spore === 0,
       'a yard with nothing open gives off nothing but dust',
       JSON.stringify(yard.airKinds)),
    ok(atQuarry.airKinds.shard > 0, 'the air over the quarry comes up blue',
       `${atQuarry.airKinds.shard} of ${atQuarry.air}`),
    ok(atFarm.airKinds.spore > 0, 'and the air over the beds comes off green',
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
group('the scrubbing house empties its filters out the back, until the recycler', async () => {
  const run1 = () => {
    window.__reset();
    window.__crew(0, 0);
    window.__clearFloor();
    // under the rain line, or the weather makes the muck instead of the house
    window.__air({ haze: 300, open: true, scrubbers: 2, muck: 0 });
    run(10);
    return state();
  };
  const plain = run1();

  window.__reset();
  window.__crew(0, 0);
  window.__clearFloor();
  window.__air({ haze: 300, open: true, scrubbers: 2, recycler: true, muck: 0 });
  run(10);
  const fitted = state();

  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(plain.smog.haze < 300, 'the house pulls the sky down either way',
       `300 -> ${Math.round(plain.smog.haze)}`),
    ok(plain.smog.rains === 0 && fitted.smog.rains === 0,
       'and no rain muddied the reading', `${plain.smog.rains}/${fitted.smog.rains} rains`),
    ok(plain.smog.muck.yard > 0, 'and leaves what it caught out the back as muck',
       `${Math.round(plain.smog.muck.yard)} to shovel`),
    ok(plain.floor === 0, 'with nothing worth carrying in it', `${plain.floor} grains`),
    ok(fitted.smog.muck.yard === 0, 'the recycler is what stops the mess',
       `${Math.round(fitted.smog.muck.yard)} to shovel`),
    ok(fitted.smog.recycled > 0 && fitted.floor > 0,
       'and turns the same catch into dust worth fetching',
       `${fitted.smog.recycled} recycled, ${fitted.floor} on the ground`)
  ];
});

group('the recycler pays out on the ground under its own chute', async () => {
    run(0.4);
  window.__crew(0, 3);                 // two go in the house, one is left to fetch
  run(3);
  window.__clearFloor();
  window.__air({ open: true, scrubbers: 2, recycler: true, haze: 400 });
  // held topped up: the house empties a sky of 400 faster than a body crosses
  // the yard to it, and a house that runs dry mid-check is a check about the
  // walk rather than about the chute
  for (let i = 0; i < 40 && !(state().smog.scrubbing > 0); i++) {
    window.__air({ haze: 400 });
    run(1);
  }
  window.__clearFloor();               // from here, the floor is the chute's doing
  for (let i = 0; i < 15; i++) { window.__air({ haze: 400 }); run(1); }
  const paid = state();
  const span = window.__dustSpan();
  window.__air({ haze: 0 });
  // Until some of it has been carried in, which is the whole of what is being
  // watched. The walk to the hole and back is a long one, and how long it is
  // has checks of its own.
  runUntil(() => state().stored > 0, 200);
  const swept = state();
  window.__crew(0, 0);
  window.__air({ open: false, recycler: false, scrubbers: 0, haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(paid.smog.recycled > 0 && paid.floor > 0,
       'the chute gives whole grains back',
       `${paid.smog.recycled} recycled, ${paid.floor} on the floor`),
    ok(span.lo !== null && span.lo >= paid.scrubX - P * 12 &&
       span.hi <= paid.scrubX + P * 24,
       'and they come to rest on the ground beside the house, not in a heap that is not its own',
       `lying ${span.lo}..${span.hi}, house at ${paid.scrubX}`),
    ok(swept.stored > 0,
       'where the crew fetch them in like anything else lying about',
       `${swept.stored} banked`)
  ];
});
