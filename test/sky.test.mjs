// The air: what fills it, what comes back down, and what the scrubbing house
// does about it.

import { yard, group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

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
  // Until the face is clear, rather than for a fixed half minute and a hope.
  // What is being checked is that the gang deal with what the sky dropped on
  // the rock and then get back to it -- not that they manage it inside any
  // particular thirty seconds, which is a fact about how much fell and how far
  // away everybody happened to be standing.
  // Generously: the spread on how long a face takes is wide -- five seconds to
  // seventy, depending on how deep the patch is and where everybody was standing
  // when it landed -- and a limit inside that spread is a check that fails on
  // the weather rather than on the code.
  runUntil(() => state().smog.muck.rock === 0, 150);
  run(10);                                    // and long enough to be swinging again
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
  // Let it stop raining first. The sky has to get properly filthy before it
  // comes down now, so what comes down is a proper downpour -- and measuring
  // whether the crew are gaining on it while it is still falling measures the
  // weather rather than the crew.
  runUntil(() => !state().smog.raining, 120);
  const wet = state();
  run(60);
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
  // A thicker sky is a longer downpour, so it is watched out rather than given a
  // fixed fourteen seconds -- otherwise what follows measures the weather still
  // falling rather than the crew shifting it.
  runUntil(() => state().smog.raining, 30);
  runUntil(() => !state().smog.raining, 180);
  const wet = state();
  run(90);
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
// The dust hanging over a place is the colour of what is under it. Smoke drifts,
// so it cannot be asked that -- by the time a mote has settled it is nowhere
// near what made it. It carries where it came from instead, and a dirty sky says
// which part of the works is dirtying it.
group('the sky says which part of the works dirtied it', async () => {
  window.__reset();
  window.__crew(2, 0, 2, 2);
  window.__air({ haze: 0, muck: 0 });
  run(25);
  const s = state();
  const k = s.smog.skyKinds || {};
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(s.smog.sky > 0, 'there is a sky to read', `${s.smog.sky} motes`),
    ok(!k.none, 'every mote knows what put it up', JSON.stringify(k)),
    ok(k.dust > 0, 'the rock sends up its own', `${k.dust || 0}`),
    ok(k.shard > 0, 'and so does the cut -- while it is being dug, not only when it pays',
       `${k.shard || 0}`),
    ok(Object.keys(k).length > 1, 'so a dirty sky is not one flat colour', JSON.stringify(k))
  ];
});

// The crew make their own mess, and there are three answers to it. Nothing: they
// go where they are working and it lands all over the yard. A shed: they walk to
// it and it lands in one place, which is one patch to shovel rather than a yard
// of them -- the shed does not make anything disappear, it gathers it. And the
// tower, which does make it disappear, and is the only thing in the game that
// makes a chore stop existing rather than go faster.
group('the outhouse gathers what the crew leave, and the tower does away with it', async () => {
  const spread = () => {
    const m = state().smog.muck;
    return { all: Math.round(m.all), cols: m.cols };
  };
  const fresh = () => {
    window.__reset();
    window.__tune('LOO_EVERY', 5000);         // wound in: it is ten minutes a body
    // Miners only. A spare pair of hands shovels a mess the moment it appears, so
    // a yard with anybody idle in it reads as nought left either way -- which is
    // the crew working, not the shed. What is being weighed here is where it
    // lands, so nobody is allowed to tidy up behind them.
    window.__crew(3, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
  };

  fresh();
  run(90);
  const wild = spread();

  fresh();
  yard.S.outhouseOpen = true;
  run(90);
  const gathered = spread();

  fresh();
  yard.S.outhouseOpen = true;
  yard.S.magicLoo = true;
  run(90);
  const magicked = spread();

  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__tune('LOO_EVERY', 600000);
  return [
    ok(wild.all > 0, 'with nowhere to go they leave it where they were working',
       `${wild.all} over ${wild.cols} columns`),
    ok(gathered.all > 0, 'a shed does not make it go away',
       `${gathered.all} still to shovel`),
    ok(gathered.cols <= wild.cols, 'it gathers it into one place instead',
       `${wild.cols} columns without it, ${gathered.cols} with`),
    ok(magicked.all === 0, 'and the tower is what actually does away with it',
       `${magicked.all} left`)
  ];
});

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

// A sky you cannot see is not a sky. This has gone invisible twice: once when
// the threshold for rain was moved without moving what feeds the sky, and once
// because the band is spread evenly over the whole world on purpose and the
// window only ever shows an eighth of it -- so the count that matters is not
// how many motes exist, it is how many are in front of you.
//
// Measured as a share of the band actually on screen, because that is the thing
// being looked at. Both numbers below are well under what it runs at, so this
// fails when the sky goes thin rather than when it wobbles.
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
    ok(tenth > 0.01,
       'a sky a tenth of the way to rain has something in it to see',
       `${(tenth * 100).toFixed(1)}% of the band in the window`),
    ok(half > 0.08,
       'half a sky covers enough of the band to read as haze',
       `${(half * 100).toFixed(1)}%`),
    ok(full > half && half > tenth,
       'and it thickens the whole way up rather than topping out early',
       `${(tenth * 100).toFixed(1)}% -> ${(half * 100).toFixed(1)}% -> ${(full * 100).toFixed(1)}%`)
  ];
});

// A sky is worth having only if it is still there when you come back. The haze
// was written down and read back all along; the motes it stands for were not,
// and nothing filled them in -- so a reload showed a full readout over an empty
// band, and the two agreed again only after the crew had spent an hour putting
// the sky back up a speck at a time.
group('the sky and the mess are still there after a reload', async () => {
  window.__crew(0, 0);
  window.__air({ haze: Math.round(state().smog.at / 2) });
  window.__muckSet(c => (c % 5 === 0 ? 3 : 0));
  run(1);
  const was = state().smog;

  // as a page that has just been opened: the motes in memory are gone and only
  // the save is left, which is the case that was broken
  window.__coldSky();
  window.__reload();
  run(1);
  const now = state().smog;
  window.__air({ haze: 0, muck: 0 });

  return [
    ok(Math.abs(now.haze - was.haze) <= 2, 'the haze comes back at the level it was left',
       `${Math.round(was.haze)} -> ${Math.round(now.haze)}`),
    ok(was.sky > 100 && Math.abs(now.sky - was.sky) <= was.sky * 0.05,
       'and as the sky itself, not as a number over an empty band',
       `${was.sky} motes -> ${now.sky}`),
    ok(now.muck.cols === was.muck.cols && Math.abs(now.muck.all - was.muck.all) <= 3,
       'and the mess on the ground is where it was left',
       `${was.muck.all} over ${was.muck.cols} columns -> ${now.muck.all} over ${now.muck.cols}`)
  ];
});

// The number and the specks are the same thing, and have to stay the same
// thing. `foul` puts haze up and sends a puff to stand for it, and for a long
// time a hit was always worth less than one mote, so a single weighted coin was
// the whole of the accounting. Once the sky was made of two and a half times
// the specks a hit started being worth several -- a cut shard is worth nearly
// seven -- and one puff was still all that went up, so the haze climbed away
// from the band underneath it.
//
// That gap is what makes a sky rain twice over: a rain empties a band that was
// always short, the number is still over the line when it runs out, and the
// next frame reads a filthy sky over an empty one and starts another shower.
group('what the readout says is what is overhead', async () => {
  window.__crew(3, 3);
  haveRock();
  run(20);
  const early = state().smog;
  run(240);
  const later = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0 });

  return [
    ok(later.haze > 200, 'the yard has had time to make a sky worth checking',
       `${Math.round(later.haze)} haze`),
    // Nought, not "nearly nought". The number is worked out from the specks now
    // rather than kept beside them, so there is no room for a gap at all -- and
    // a tolerance here would be a tolerance on a thing that cannot happen.
    ok(later.owed === 0,
       'the haze is the motes that are up there, not a number beside them',
       `${Math.round(later.haze)} haze, ${later.sky} up and ${later.puffs} climbing, ${later.owed} unaccounted for`),
    ok(early.owed === 0 && later.owed === 0,
       'and the two do not drift apart the longer it runs',
       `${early.owed} after twenty seconds -> ${later.owed} after four minutes`)
  ];
});

// A shower ends when the sky it is made of is gone, and the sky and the number
// are the same thing -- so a shower cannot end over a filthy readout, and the
// next mote off a swing cannot start another one.
//
// This is what "the haze never comes back" looked like from the outside: the
// number stood over the line with an empty band under it, so every frame
// started a shower, found nothing to pour, and stopped again. On, off, on, off,
// and the readout never moved.
group('a shower ends clean, and the next sky is made from nothing', async () => {
  window.__crew(3, 3);
  haveRock();
  window.__air({ haze: state().smog.at + 30 });     // a sky over the line
  const wet = runUntil(() => state().smog.raining, 10);

  // watched all the way through, because what went wrong before went wrong
  // between two frames: a shower that stops and starts is a shower nobody sees
  let flips = 0, was = true, dry = null;
  for (let i = 0; i < 200 && dry == null; i++) {
    run(0.25);
    const s = state().smog;
    if (s.raining !== was) { flips++; was = s.raining; }
    if (!s.raining) dry = s;
  }
  const rains = state().smog.rains;

  // and now the yard goes on working, which is what used to set it off again
  run(60);
  const after = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(wet, 'a sky over the line comes down'),
    ok(dry && dry.haze < 40,
       'and when it stops there is next to nothing left overhead',
       `${dry && Math.round(dry.haze)} haze, ${dry && dry.sky} motes`),
    ok(flips === 1, 'it stops once rather than flickering off and on',
       `${flips} changes of state`),
    ok(after.rains === rains,
       'and the work that follows makes a sky rather than another shower',
       `${rains} rains -> ${after.rains}`),
    ok(after.haze > (dry ? dry.haze : 0),
       'the haze comes back, which is the whole of what it was not doing',
       `${dry && Math.round(dry.haze)} -> ${Math.round(after.haze)}`)
  ];
});

// One speck, from the swing to the band. It used to be two: a puff that was
// deleted at the top of the climb and a mote created in its place, coming up
// from nothing over the best part of a second -- so what you watched was one
// cell going out and another coming in beside it.
group('a speck off a swing is the speck in the band', async () => {
  window.__crew(2, 0);
  haveRock();
  run(3);
  const climbing = () => yard.smogSky().filter(m => m.up);
  const rose = runUntil(() => climbing().length > 0, 30);
  const mote = climbing()[0];
  const startY = mote && mote.y;
  // followed until it arrives, watching the one object rather than the counts
  let solid = true, jumped = 0, lastY = startY;
  for (let i = 0; i < 600 && mote && mote.up; i++) {
    run(1 / 30);
    if ((mote.fade ?? 1) < 1) solid = false;
    if (Math.abs(mote.y - lastY) > 40) jumped++;
    lastY = mote.y;
  }
  const stillThere = mote && yard.smogSky().includes(mote);
  window.__crew(0, 0);
  window.__air({ haze: 0 });
  return [
    ok(rose && !!mote, 'a swing puts a speck in the air'),
    ok(stillThere && mote && !mote.up,
       'and the thing that arrives in the band is that same speck',
       `${stillThere ? 'still the same object' : 'a different one'}`),
    ok(solid, 'at full weight the whole way: it never goes out and comes back'),
    ok(jumped === 0, 'and it never jumps: every pixel of the climb is travelled',
       `${jumped} jumps over 40px`),
    ok(mote && startY > mote.y, 'and it ends up above where it started',
       `${Math.round(startY)} -> ${Math.round(mote ? mote.y : 0)}`)
  ];
});
