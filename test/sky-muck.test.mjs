// The sky filling up and giving it back: what the yard puts into the air comes
// down again as a mess on the ground, and the mess is shifted rather than banked.

import { group, ok, state, run, runUntil, makeItRain } from './helpers.mjs';

// The air. Mining fills the sky, the sky gives it back as muck, the muck is in
// the way rather than worth anything, and a house with somebody in it is the
// only thing that stops the cycle.
group('the sky fills up, and gives it back', async () => {
    run(0.4);
  const bare = state().smog;
  window.__crew(3, 3);
  run(5);
  window.__clearFloor();
  // Wound up by hand. This used to be twenty seconds of mining, which was the
  // loudest source in the game; the rock raises nothing at all now, by anybody,
  // so a yard that is only mining has a clean sky and there is nothing here to
  // watch gather. What this group is about is what the sky *does* once there is
  // one -- clouds, rain, muck, and the gang getting back to work under it -- and
  // none of that cares where the haze came from.
  window.__air({ haze: Math.round(state().smog.at / 4) });
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
  // Long enough for all of it to have *arrived*. A shower claims the sky that is
  // settled when it breaks and nothing else, so motes still climbing out of the
  // plume when the rain starts are not part of it -- they are up there when it
  // stops, which is correct and is not what "next to nothing left" is about.
  run(8);
  const full = state().smog;

  // And the engine off, and *unbought*, before it rains. A shower rains the sky
  // it broke on and nothing else -- which is the point -- so anything still
  // fouling behind it is filling the band back up, and neither "next to nothing
  // left overhead" nor "the banks shrink as it falls" stays a fact about the
  // shower.
  window.__machine('jaw', { bought: false });
  // And a moment for what is still climbing to arrive, because a shower claims
  // the sky that is *settled* when it breaks and motes in flight are not.
  run(6);
  // And then over the line by hand. It used to get there on its own: the yard
  // was mining, mining was the loudest source in the game, and a sky held a hair
  // under the line crossed it within a second. The rock raises nothing at all
  // now, so a yard held just short of raining stays just short of raining for
  // ever, and everything below waits on a shower that never comes.
  //
  // To the brim rather than a hair over the line, and then waited out: the line
  // is where a shower becomes *likely* now, and a check that wants one asks for
  // the sky that is certain to break. See `makeItRain`.
  makeItRain();

  // Watched all the way down rather than sampled at the ends: the whole claim
  // is that it thins out, and a before and an after cannot tell a fade from a
  // thing that was switched off.
  const seenR = [];
  let wet = null;
  // The deepest each place got, over the whole shower, rather than what was
  // lying there on the one frame the yard as a whole was deepest.
  //
  // The rock is the only place in the yard with a gang standing on it, so what
  // falls on it is shifted within a frame or two of landing: watched all the
  // way down it carries one or two grains at a time and is empty as often as
  // not. Reading it off `wet` -- the frame where `muck.all` peaked -- was a
  // coin toss, and it is the yard's own crew that made it one. What this is
  // about is that the rain comes down on the rock at all, and that is a fact
  // about the shower, not about one frame of it.
  const deepest = { rock: 0, yard: 0 };
  for (let i = 0; i < 80; i++) {
    run(0.25);
    const air = state().smog;
    if (!air.raining) { if (seenR.length) break; else continue; }
    seenR.push(air.cloudR);
    deepest.rock = Math.max(deepest.rock, air.muck.rock);
    deepest.yard = Math.max(deepest.yard, air.muck.yard);
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
  const cleared = runUntil(() => state().smog.muck.rock === 0, 150);
  // Until the rock actually comes down again, rather than for a fixed ten
  // seconds and a hope. That ten was measured before the muck slumped: what
  // fell on the yard beside the rock keeps creeping over the rock's own columns
  // for another half minute after the face first comes clear, and the gang go
  // back to shovelling every time it does. They get to the rock about
  // twenty-five seconds in, and how long that takes is a fact about how much
  // fell and how far it has to slump -- not something a check should be pinning
  // a stopwatch to.
  const swinging = runUntil(() => state().rock < rockWas, 120);
  const dried = state();
  // and the yard goes back the way it was found: a sky left full and a gang
  // left standing are both things the next group would notice
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(bare.haze === 0, 'a new yard has a clean sky', `${bare.haze}`),
    // The cut, not the rock. Taking rock apart raises nothing at all now, by
    // anybody -- what dirties this yard is the quarry, the plots and machinery.
    ok(dirty.haze > 0, 'and a sky can be put into it', `${dirty.haze}`),
    ok(bare.cloudR === 0 && half.cloudR > 0 && full.cloudR > half.cloudR,
       'which gathers into clouds that grow as it fills',
       `${bare.cloudR} -> ${half.cloudR} -> ${full.cloudR} cells across`),
    ok(dirty.puffs > 0 || dirty.sky > 0,
       'and you can see it up there, or on its way',
       `${dirty.puffs} climbing, ${dirty.sky} arrived`),
    // Tightened with wave6-sky item 4: a settled mote's place is its slot
    // alone, uniform over the whole span, so the fullest strip of a well-fed
    // sky may only run a little over the average -- there is no anchoring to
    // the stacks left to bunch it.
    ok(gathered.clump < 3 && gathered.bins > seeded.bins / 2,
       'and once up there it lies as a haze over everything, not in knots',
       `${seeded.clump} over ${seeded.bins} bins -> ${gathered.clump} over ${gathered.bins}`),
    ok(wet.rains >= 1, 'full, it comes back down', `${wet.rains} rains`),
    ok(deepest.rock > 0 && deepest.yard > 0,
       'as muck, on the rock and over the yard',
       `rock ${deepest.rock}, yard ${deepest.yard}`),
    ok(wet.drops > 0, 'falling a cell at a time, not drawn over the window',
       `${wet.drops} in the air`),
    ok(shrank, 'and the banks it falls out of shrink as it comes down, step by step',
       seenR.join(' ')),
    // Smaller, not empty. A shower rains the sky it broke on and nothing else --
    // which is the whole point of the change -- so what is overhead when it
    // stops is whatever arrived after it started, and the banks come down to
    // that rather than to nothing. "Next to nothing left" was true when a shower
    // reached down the plume and pulled specks out of it, and it is not the
    // behaviour anybody wants.
    ok(seenR[seenR.length - 1] < seenR[0],
       'so by the end they are smaller than they were',
       `${seenR[0]} -> ${seenR[seenR.length - 1]}`),
    // Asked of the moment the face came clear, not of the state ten seconds
    // later. The muck on the ground beside the rock keeps slumping while the
    // gang work -- `slumpMess` -- so a grain or two creeps back over the rock's
    // own columns from the yard next door, and the face is never permanently
    // clear while there is a drift lying against it. What the gang owe is
    // clearing what fell on them; keeping the whole flank swept for ever is the
    // janitors' business and a different check.
    ok(cleared, 'which the gang clear off the face',
       `${dried.smog.muck.rock} back on it by the time they were swinging again`),
    ok(swinging, 'and then get back to the rock under it',
       `${rockWas} -> ${dried.rock}`),
    // Not "exactly one" any more, and the reason is the rain itself rather than
    // anything about this group. It used to be impossible to rain under
    // SMOG_RAIN_AT, so a yard that had just been rained out could not rain again
    // until the works had put a whole line's worth back up -- which never
    // happened inside a check. The odds are a curve now and a fair sky is a small
    // chance rather than none, so a long group may well see a second shower.
    //
    // What actually has to be true is that showers do not run into each other,
    // and that is RAIN_GAP's guarantee -- measured, on its own, by "a minute of
    // dry between one shower and the next" in sky-rain. Here it is enough that
    // the yard is not raining constantly.
    ok(dried.smog.rains <= 3, 'and one rain is one rain: it does not keep coming',
       `${dried.smog.rains} over the whole group`)
  ];
});

// What the rain leaves is not material. It is shifted and it is gone -- nothing
// carries it to the hole, nothing counts it, and the yard ends up exactly the
// way it was. The shift is the whole of the cost.
// Clearing it up is the job when there is a mess. It used to be what a body did
// when it had nothing else on, which meant it was never done: there is always
// dust to fetch, so a yard under an inch of muck stayed under it while the crew
// walked over it carrying grains.
//
// The weather is everybody's. What a body *leaves* is the janitor's, and that is
// a different stack in the same ground -- see `poopCols` -- so this group is
// about the rain and says nothing about the other.
group('a mess comes before the dust', async () => {
    run(0.4);
  window.__crew(1, 5);
  window.__give(500);                          // plenty on the floor to distract them
  run(4);
  makeItRain();
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
  // To the brim rather than a hair over the line: with nobody on the rock there
  // is nothing putting the last mote up there, and a sky at the line only might
  // rain. `makeItRain` waits the shower out of it.
  makeItRain();
  // Out, and then *down*: the shower ends when the sky it is made of is empty,
  // and at that moment there are still a couple of thousand drops in the air
  // with a second of falling left in them. Read at the moment it stopped
  // raining, the layer this measures is most of a shower short of the one the
  // crew actually have to shift.
  runUntil(() => !state().smog.raining && state().smog.drops === 0, 180);
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

