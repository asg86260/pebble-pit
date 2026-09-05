// What the board says about the air: one signed rate, a figure that survives a
// reload, a number that matches what is actually overhead, and a shower that
// leaves it made from nothing again.
//
// Every group in here that runs a jaw says for itself what a jaw is worth, and
// puts it back afterwards. It used to be that the rate group wound MACHINE_GAIN
// down and never put it back, and every group after it quietly inherited the
// wounded rate -- so the file only worked in the order it was written in, and a
// comment at the top asked whoever came next to keep it that way. The seeded
// restart each group gets does not undo a `__tune`: a tuned constant is a
// module-level `let` in config.js and not part of the saved yard, so `__seed`
// cannot put it back and nothing else was going to. Saying it out loud in each
// group costs one line and makes the file read in any order.

import { yard, group, ok, state, run, runUntil, haveRock, openSites, makeItRain } from './helpers.mjs';
import { tuned } from '../src/config.js';

// What a jaw is worth when nobody has wound it down -- read once, at load, before
// any group has had a chance to touch it.
const JAW_WORTH = tuned('MACHINE_GAIN');

// A jaw at its real rate out-fouls a fully staffed house about three to one, and
// outruns a shower besides, so the groups below that want to watch the house or
// the rain rather than the balance work a wounded one.
const woundJaw = () => window.__tune('MACHINE_GAIN', 0.08);
const healJaw = () => window.__tune('MACHINE_GAIN', JAW_WORTH);

// One number, signed, on the board where you do something about it. The rate
// the yard fouls has to be measured at the source: inferred from the haze it
// reads equal to whatever the house is taking out the moment the house starts
// winning, the two cancel, and the only number this board exists to show sits
// at nought however many bodies you move.
group('the sky reads as one rate, and it can go negative', async () => {
    run(0.4);
  // Somebody on the cut. This group needs a yard that is actively fouling, and
  // mining raises nothing at all now -- the rock is silent, by anybody -- so the
  // source has to be the quarry.
  openSites();
  window.__fullSites();
  // Wound well down: what this group is about is the house turning the reading
  // round, not the balance between a jaw and a houseful of bodies.
  woundJaw();
  window.__crew(4, 4, 5);
  window.__machine('jaw', { bought: true });
  window.__lab(true);
  window.__research('labair');
  // Long enough for the cut to be working at its steady rate. The rock fouled
  // from the first frame; a quarry takes a while to get going -- bodies walk to
  // the rim, climb down, and only then start taking ground out -- so a reading at
  // ten seconds catches it still ramping and looks, twenty seconds later, like
  // the house changed it.
  // Swept as it goes, or the jaw fills the cut's heap in seconds and stands
  // down -- and a machine standing down is a yard that has stopped fouling,
  // which is the one thing this group must not have happen.
  for (let i = 0; i < 40; i++) { run(1); window.__clearFloor(); }
  // And the sky held well under the line, because a shower is very much a thing
  // "taking down" the sky and this group is about the house doing it.
  window.__air({ open: true, haze: Math.round(state().smog.at / 3) });
  run(2);
  window.__clearFloor();
  const losing = state().smog;

  window.__air({ purifiers: 2, haze: 600 });
  run(40);
  const winning = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0, open: false, purifiers: 0 });
  healJaw();
  return [
    ok(losing.fouling > 0 && losing.scrubbing === 0,
       'a yard with nobody in the house is putting up and taking down nothing',
       `+${losing.fouling}/min, -${losing.scrubbing}/min`),
    // That the yard goes on fouling, not that it fouls at exactly the same rate.
    //
    // This used to compare the two readings and demand they be close, which
    // worked while the rock was the source: a gang on a hill swings at a steady
    // beat from the first frame. The rock raises nothing now, so the source is
    // the cut -- and a cut is *bursty* by design. Bodies climb down, work a hole
    // out, climb back up and the ground falls in behind them, so the rate over
    // any few seconds depends on where in that cycle you looked. Comparing two
    // samples of it measures the dig, not the house.
    //
    // The claim was only ever that scrubbing and fouling are two different
    // things and the house does not stop the works.
    ok(winning.fouling > 0,
       'and the works goes on fouling whether or not somebody is in the house',
       `${losing.fouling} -> ${winning.fouling}`),
    ok(winning.scrubbing > 0 && winning.fouling - winning.scrubbing < 0,
       'so a staffed house turns it the other way, which is the whole reading',
       `${winning.fouling} - ${winning.scrubbing} = ${(winning.fouling - winning.scrubbing).toFixed(1)}/min`),
    ok(losing.trend > 0 && winning.trend < 0,
       'and the arrow follows a minute of it, not a second',
       `${losing.trend.toFixed(2)} -> ${winning.trend.toFixed(2)}`)
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

  // All three bands come in against a deterministic run, because a reload is a
  // round trip and a round trip has no wobble in it: on a fixed seed the haze
  // comes back at 1600 against 1600, the band at 3333 motes against 3333, and
  // the mess at 804 cells against 804 -- not close, the same. The old bands were
  // two of haze, a twentieth of the sky and three cells of mess, which is a fifth
  // of the whole band's worth of slack in the middle one: a save that dropped one
  // mote in twenty would have gone straight through it. A grain either way is
  // left for the rounding on the way in and out, and nothing beyond that.
  return [
    ok(Math.abs(now.haze - was.haze) <= 1, 'the haze comes back at the level it was left',
       `${Math.round(was.haze)} -> ${Math.round(now.haze)}`),
    ok(was.sky > 100 && Math.abs(now.sky - was.sky) <= 2,
       'and as the sky itself, not as a number over an empty band',
       `${was.sky} motes -> ${now.sky}`),
    ok(now.muck.cols === was.muck.cols && Math.abs(now.muck.all - was.muck.all) <= 1,
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
  // A machine running, because a machine is the only thing that dirties this
  // yard. No hand work fouls at all any more -- not the rock, not the cut, not
  // the plots. That is the whole of the smoke curve: a yard worked by people is
  // clean, and what you buy when you buy an engine is the sky.
  woundJaw();
  openSites();
  window.__fullSites();
  window.__crew(3, 3, 5);
  window.__machine('jaw', { bought: true });
  haveRock();
  run(20);
  const early = state().smog;
  run(240);
  const later = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0 });
  healJaw();

  return [
    // Forty rather than eighty rather than two hundred: a yard of bodies doing
    // ordinary work barely marks the sky (see SMOG_PER_DUST), and the whole air
    // cycle runs at half the pace it used to besides. What this group is
    // actually about is whether the number and the band agree -- not how big
    // either of them is.
    ok(later.haze > 40, 'the yard has had time to make a sky worth checking',
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
  // A machine running, because a machine is the only thing that dirties this
  // yard. No hand work fouls at all any more -- not the rock, not the cut, not
  // the plots. That is the whole of the smoke curve: a yard worked by people is
  // clean, and what you buy when you buy an engine is the sky.
  // At the real rate the plume outruns the rain and the shower stops over a band
  // that is still filthy, which is a fact about the balance and not about whether
  // a shower ends clean.
  woundJaw();
  openSites();
  window.__fullSites();
  window.__crew(3, 3, 5);
  window.__machine('jaw', { bought: true });
  haveRock();
  // A sky at the brim, which is the one that is certain to break at the next
  // look: over the line is a chance now, not an event. See `makeItRain`.
  const wet = makeItRain();

  // watched all the way through, because what went wrong before went wrong
  // between two frames: a shower that stops and starts is a shower nobody sees
  // A brim sky is about forty seconds of shower now (RAIN_PER_S 650, wave6-sky)
  // plus the drizzle and the taper, so the watch is long enough to see the
  // whole storm out rather than the front half of it.
  let flips = 0, was = true, dry = null;
  for (let i = 0; i < 400 && dry == null; i++) {
    run(0.25);
    const s = state().smog;
    if (s.raining !== was) { flips++; was = s.raining; }
    if (!s.raining) dry = s;
  }
  const rains = state().smog.rains;

  // and now the yard goes on working, which is what used to set it off again
  // Until the sky starts filling again, not for a fixed minute. A shower leaves
  // a few thousand cells of muck on the works and the crew drop everything for
  // it -- so the swinging that makes the next sky does not start again until the
  // shovelling is done, and how long that takes is a fact about how much fell.
  runUntil(() => state().smog.haze > (dry ? dry.haze : 0) + 5, 300);
  const after = state().smog;
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  healJaw();
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
  // A machine running, because a machine is the only thing that dirties this
  // yard. No hand work fouls at all any more -- not the rock, not the cut, not
  // the plots. That is the whole of the smoke curve: a yard worked by people is
  // clean, and what you buy when you buy an engine is the sky.
  woundJaw();
  openSites();
  window.__fullSites();
  window.__crew(2, 0, 5);
  window.__machine('jaw', { bought: true });
  haveRock();
  run(3);
  const climbing = () => yard.smogSky().filter(m => m.up);
  const rose = runUntil(() => climbing().length > 0, 30);
  const mote = climbing()[0];
  const startY = mote && mote.y;
  // Followed until it arrives, watching the one object rather than the counts.
  //
  // The invariants changed with the plume's lifetime (PLUME_LIFE): a speck
  // bound high no longer climbs the whole window -- past a couple of seconds
  // it thins out where it is and joins the band at its own height. So "at
  // full weight the whole way" and "never jumps" are the old rules; what must
  // hold now is that nothing visible ever teleports (a jump only happens
  // while it is faded to nothing) and its weight never flickers back up
  // mid-climb (thinning is one-way until it settles).
  let visibleJump = 0, flicker = 0, lastY = startY, lastFade = 1;
  for (let i = 0; i < 600 && mote && mote.up; i++) {
    run(1 / 30);
    const f = mote.fade ?? 1;
    // A jump is visible only if the speck could be seen where it LEFT --
    // weight at the new spot is it fading back in there, which is an
    // arrival, not a teleport.
    if (Math.abs(mote.y - lastY) > 40 && lastFade > 0) visibleJump++;
    if (f > lastFade && mote.up) flicker++;
    lastY = mote.y;
    lastFade = f;
  }
  const stillThere = mote && yard.smogSky().includes(mote);
  // Where it joined the band: its slot's own place across the whole span,
  // uniform by construction (wave6-sky, item 4) -- not anywhere near the stack
  // that made it. Read while it is still being stepped, so `x` is this frame's.
  run(0.1);
  const span = state().worldW;
  const slotX = mote && !mote.up ? ((mote.su * span) % span + span) % span : null;
  const offSlot = slotX == null ? Infinity : Math.abs(mote.x - slotX);
  window.__crew(0, 0);
  window.__air({ haze: 0 });
  healJaw();
  return [
    ok(rose && !!mote, 'a cell taken out of the cut puts a speck in the air'),
    ok(stillThere && mote && !mote.up,
       'and the thing that arrives in the band is that same speck',
       `${stillThere ? 'still the same object' : 'a different one'}`),
    ok(visibleJump === 0, 'nothing you can see ever jumps: a leap happens only faded out',
       `${visibleJump} visible jumps over 40px`),
    ok(flicker === 0, 'and its weight only ever goes one way on the climb',
       `${flicker} flickers`),
    // It used to have to end up above where it started; a slot is anywhere in
    // the band now, which can be below a tall stack. What must hold instead is
    // that it joins the band at its slot -- the uniform place the whole sky is
    // spread by -- rather than remembering the machine that made it.
    ok(offSlot < 40, 'and it joins the band at its slot, uniform over the sky',
       `${Math.round(offSlot)}px from its slot`)
  ];
});
