// The fan, and the one number that says whether you are winning.
//
// The balloons are the only sink in the game -- the sky fills from the machines
// and the only thing that takes it back out is a crewed balloon -- and every
// one of them pulls with the shed's fan. So the fan is not a nice-to-have: it is
// the *whole* of how each mouth grows, and if it does not grow, a yard that buys
// its third machine has bought a sky it can never get back down again however
// much it spends. (It was written of the shed's own mouth, which is gone; the
// balloons took the job over.)
//
// It did not grow. `pull` took its draught strength as `filterRate() / fanPull()`
// -- and `filterRate()` is bodies times `fanPull()`, so the fan cancelled clean
// out of the one line that moves a mote, leaving the count of bodies, which is
// one, for ever. Five rungs and three hundred and sixty-nine shards bought a
// draught byte-for-byte identical to the one you started with.
//
// And the board agreed that it had worked, which is the worse half. It quoted
// `filterRate()` -- what the fan is *rated* at, in motes a second -- beside a
// fouling figure in haze a second. A mote is SMOG_PER_MOTE of haze, so the
// house's column read about twice what it was worth; it went on quoting the full
// figure with the house clogged, or with the sky too thin to have anything in
// reach of the draught; and the arrow that comes off the difference pointed the
// wrong way. You could buy the ladder, watch the reading go green, and drown.
//
// So: the fan is worth something overhead, the house takes what it says it takes,
// and the number on the board is a measurement rather than a quotation.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, runUntil, buyBuilt } from './helpers.mjs';
import { airRate } from '../src/smog.js';
import { working } from '../src/balloon.js';
import { SMOG_PER_MOTE, LADDER } from '../src/config.js';

// The yard from the field, which is the only honest place to ask this: a fresh
// yard has no machines, and without a machine there is nothing to foul the sky
// at all -- hand work has not marked it since SMOG_PER_DUST was cut. See
// `stuck-yard.json` and the note at the top of stuck-yard.test.mjs.
const fromTheField = (fan, machines = ['jaw', 'ram', 'tiller']) => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  // Every machine set explicitly, on AND off. This used to only switch the
  // listed ones ON, which left whatever the save already had running -- and this
  // save has the belt. So `cleared()`'s "the machines off, so what this measures
  // is the house alone" was never true: the belt went on fouling underneath the
  // measurement, the sky climbed to SMOG_RAIN_AT, and the run that cleared
  // slowest was the one that RAINED. That rain then read as the house's work --
  // 989 haze "cleared" with no fan against 428 with a full one, which says a fan
  // makes the sky worse.
  //
  // The check passed while the belt happened not to reach the line inside thirty
  // seconds. Same shape of luck as the dance's seed: a premise that was never
  // enforced, holding by accident.
  for (const k of machines) window.__machine(k, { bought: true, on: true });
  // And when the caller asks for NO machines, that has to mean none -- including
  // the ones the save arrived with. This save has the belt.
  //
  // `cleared()` says "the machines off, so what this measures is the house
  // alone", and it was not true: switching the listed machines on left the
  // belt running, it went on fouling underneath the measurement, the sky climbed
  // to SMOG_RAIN_AT, and the run that cleared slowest was the one that RAINED.
  // The rain then read as the house's work -- 989 haze "cleared" with no fan
  // against 428 with a full one, which says a fan makes the sky worse.
  //
  // The check passed for as long as the belt happened not to reach the line
  // inside thirty seconds. Same shape as the dance's seed: a premise nothing
  // enforced, holding by luck.
  //
  // Only in the empty case. The runs that want machines want the yard the save
  // came with, and quietly switching its belt off would re-tune every balance
  // below rather than fix anything.
  if (!machines.length)
    for (const m of ['jaw', 'ram', 'tiller', 'belt']) window.__machine(m, { bought: false });
  yard.S.fanLevel = fan;
  // Room in the hole.
  //
  // This save came from a yard whose pit was nearly full, and it was written on
  // a pressed pile -- 1200 columns of three-pixel grains. The press is cut, so
  // that profile no longer fits this plot and `rehomeDust` puts the dust back:
  // the hole comes back FULL, at full size, with the remainder in the rift.
  //
  // It used to arrive empty. `pitFromSave` refused the mismatched profile and
  // `restore` then cleared the grid and left the counter alone, so this fixture
  // silently loaded a yard with a hundred thousand dust on the counter and
  // nothing in the hole -- which happened to give the crew somewhere to put
  // things, which is why this check ever passed. A full hole stops the works:
  // the haulers stand down holding their loads, so the machines idle and the
  // sky stops being filled.
  //
  // What this file measures is the house against the machines, so it buys the
  // room outright rather than measuring a jammed yard.
  window.__spend(20000);
  window.__air({ haze: 1800, muck: 0, recycler: true, open: true });
  // One balloon, the mouth this file measures, bought off its row and crewed.
  if (!state().craft.length) {
    window.__grant({ dust: 90000 });
    window.__buy('balloon');
    window.__finish();
  }
  window.__air({ purifiers: 1 });
  // Wait for the balloon to actually be up and working, rather than assuming
  // a walk and a climb take any given time.
  //
  // It was three seconds, and that made every reading below partly a measurement
  // of a walk. The house does nothing at all until somebody is through the door
  // -- `working`, not `S.purifiers`, which counts everybody it has been given
  // including one still crossing the yard -- so a run that started before the
  // body arrived spent part of its thirty seconds measuring an empty shed. On a
  // busy yard the walk is longer than three seconds and the same setting came
  // out at 140 haze cleared on one arrangement and 984 on another, which is
  // noise several times the size of the thing being measured.
  //
  // The check passed for as long as the walk happened to fit. Same fault as the
  // dance's seed, and the same cure: wait for the state the measurement is
  // about instead of guessing how long it takes to arrive.
  runUntil(() => working(0), 90);
};

// Run a stretch of yard with **no rain in it**, and say whether one was had.
//
// Every measurement in this file is a rate, and a shower is not a rate: it takes
// the whole sky down at once, so a stretch that happens to catch one reads as
// the house clearing seventeen hundred haze, or as a bare fan holding three
// machines with room to spare. Three checks here said "with nothing allowed to
// rain" and not one of them enforced it -- whether a shower lands inside any
// given window is the seeded generator's business, and the premise held by luck
// until something moved the run along. Which is the dance's seed again, and the
// cure is the same: assert the premise instead of hoping for it.
//
// A shower ends clean, so the stretch after one is an ordinary sky again and
// trying again is all it takes. `before` runs first, for whatever the caller has
// to put back between attempts -- winding the sky up again, mostly, since a
// house measured on the empty sky a shower leaves has nothing to clear.
function dryStretch(seconds, measure, before = null, tries = 4) {
  let out = null, dry = false;
  for (let i = 0; i < tries && !dry; i++) {
    // A break rolls a brew-up now (wave6-sky, item 5), and `rains` ticks at the
    // roll -- so a storm rolled before this stretch would pour inside it with
    // the counter never moving. A storm already on its way is waited out first;
    // one that rolls mid-stretch still moves the counter and is caught below.
    //
    // Waited out BEFORE the caller winds the sky up, not after: the wait runs
    // the yard with the fan on, so a wind-up taken first is part-cleared by an
    // amount the storm roll decides -- two stretches meant to start from the
    // same sky started from whatever their waits left, and the comparison
    // measured the seeded generator instead of the fan.
    runUntil(() => yard.S.stormFor < 0 && !yard.S.raining, 120);
    if (before) before();
    const rains = yard.S.rains;
    out = measure(seconds);
    dry = yard.S.rains === rains;
  }
  return { ...out, dry };
}

// How much sky one setting of the fan takes down in half a minute.
function cleared(fan) {
  // The machines off, so what this measures is the house alone. With them
  // running the sky is being filled at the same time it is being emptied, and
  // the difference of two rates is not a measurement of either.
  fromTheField(fan, []);
  return dryStretch(30, secs => {
    const was = state().smog.haze;
    run(secs);
    const s = state().smog;
    return { took: was - s.haze, left: s.haze, rate: s.filtering / 60, rains: s.rains };
  }, () => window.__air({ haze: 1800 }));
}

group('a bigger fan is a bigger draught, not a bigger number', async () => {
  const bare = cleared(0);
  const full = cleared(LADDER);
  return [
    ok(bare.dry && full.dry, 'both stretches were measured without a shower in them',
       `bare ${bare.dry}, full ${full.dry}`),
    ok(bare.took > 0, 'a balloon with no fan on it still pulls the sky down',
       `${Math.round(bare.took)} haze in thirty seconds`),
    // The ladder is worth a little over three times at the top (FAN_TOP, the
    // old five quarters spread over nine rungs). Well short of that here and the fan is decoration again; this asks
    // for half the ladder's worth, which no amount of luck in where the motes
    // happened to be sitting will hand over.
    ok(full.took > bare.took * 1.5,
       'and every rung of the ladder is more sky down the throat',
       `no fan ${Math.round(bare.took)} -> full fan ${Math.round(full.took)} haze`),
    ok(full.left < bare.left,
       'so what is left overhead is thinner for having bought it',
       `${Math.round(bare.left)} -> ${Math.round(full.left)} haze`)
  ];
});

// What the row on the house says it buys, in the unit the row says it in:
// motes a second, per body, times the fan. It was a decoration -- whatever the
// draught swept into the throat was swallowed, which is a question about the
// shape of the sky and came to roughly twice the rating, so one body with no fan
// held three machines on its own and there was nothing to spend shards on.
group('a balloon takes what it is rated at', async () => {
  fromTheField(2, []);
  run(20);                                  // past the first mote and into the steady state
  // Through `dryStretch`, like every other rate in this file. This one read
  // `rains` off the same snapshot twice and called that "nothing rained" --
  // and a storm rolled before the stretch pours inside it with the counter
  // never moving, so the shower read as the house taking eight times its
  // rating. Whether that storm rolls before or after the window is the seeded
  // generator's business, and a change anywhere in the crew moves it.
  //
  // And the rating is summed second by second rather than read once at the
  // top: the house is rated at what the body IN it can take, and the body
  // steps out -- a loo break, a stretch -- whenever its own clock says, which
  // a single reading before the window cannot see either.
  const { took, rated, s, dry } = dryStretch(30, secs => {
    const before = state().smog.haze;
    let rated = 0;
    for (let i = 0; i < secs; i++) {
      rated += airRate() * SMOG_PER_MOTE;       // haze a second, the board's unit
      run(1);
    }
    const s = state().smog;
    return { took: (before - s.haze) / secs, rated: rated / secs, s };
  }, () => window.__air({ haze: 1800 }));
  return [
    ok(dry && s.haze < 3200,
       'the sky stays under the line, so nothing here is the weather',
       `${Math.round(s.haze)} haze, dry ${dry}`),
    ok(rated > 0 && took > rated * 0.7 && took < rated * 1.3,
       'what comes out of the sky is what the fan is rated to take',
       `rated ${rated.toFixed(1)}, took ${took.toFixed(1)} haze/s`)
  ];
});

group('the board counts what the mouth swallows', async () => {
  // An empty sky and a fan at the top of its ladder: the rating is high and there is
  // nothing up there to take, so a board quoting the rating says the house is
  // winning by a mile while it stands there doing nothing.
  //
  // **The machines off**, or the sky is not empty and the premise is gone. They
  // used to be able to stay on: the house had to drag a speck across the yard to
  // its throat, which took the best part of a second and a half, so four seconds
  // after the sky was cleared almost nothing had arrived. A mouth takes its
  // share of the sky the moment the speck has settled now -- see `eat` -- so a
  // fouling yard is a yard with something to take, and the house honestly reads
  // as filtering it. What this group is about is the board quoting what was
  // *swallowed* rather than what the fan is rated at, and that needs a sky with
  // nothing in it.
  fromTheField(LADDER, []);
  window.__air({ haze: 0 });
  run(4);
  const idle = state().smog;

  // And running, where the two columns have to be in the same unit or the
  // difference between them -- which is the whole of what the board is for --
  // means nothing. The machines are on for this one: a board with nothing in the
  // fouling column is only half a board.
  fromTheField(2);
  run(20);
  // Over a stretch with no rain in it. A shower takes the whole sky down at
  // once and is not what either column is about, and whether one falls inside
  // any given thirty seconds is the seed's business: the premise held by luck
  // until a change elsewhere moved the seeded run and a rain landed in the
  // window. So the window is one in which the count of rains did not move,
  // tried a few times over -- a shower ends clean, and the next stretch is an
  // ordinary sky again.
  // Both sides averaged over the same stretch, which is the only way the
  // comparison means anything.
  //
  // The board's two columns are what happened in the LAST SECOND -- `mark.rate`
  // and `mark.drew` in smog.js -- and this used to read them once, at the end,
  // and hold them against half a minute of sky. That is a sample against an
  // average, and it only agreed while the yard's output was smooth. It is not:
  // the whole crew stops to celebrate a finished rock, so a fifth of any given
  // stretch has the machines standing idle, and whether the one second that got
  // read fell inside one of those was down to where the rhythm happened to land.
  // Winding the dance up half a beat was enough to fail it, which is a check
  // about the sampling rather than about the board.
  const run30 = dryStretch(30, secs => {
    const was = state().smog.haze;
    const foul = [], filter = [];
    for (let i = 0; i < secs; i++) {
      run(1);
      foul.push(state().smog.fouling);
      filter.push(state().smog.filtering);
    }
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
    return { was, s: state().smog, foul: mean(foul), filter: mean(filter) };
  });
  const { was, s, foul, filter, dry } = run30;
  const fell = (was - s.haze) / 30;            // how the sky actually went
  const said = (filter - foul) / 60;            // and what the board said it would
  return [
    ok(idle.filtering < 1,
       'a fan over a clear sky is not filtering anything, whatever it is rated at',
       `${idle.filtering}/min with nothing overhead`),
    // Both are the same quantity from the two ends: what the sky did over the
    // stretch, and what the board's two columns said it would do. In the same
    // unit they agree; in the old ones the board was out by about a factor of
    // two and pointing the wrong way.
    ok(dry, 'measured over a stretch with no rain in it'),
    ok(Math.abs(said - fell) < Math.max(2, Math.abs(fell) * 0.4),
       'and the two columns are the same kind of thing, so the difference is the truth',
       `board says ${said.toFixed(1)}, sky did ${fell.toFixed(1)} haze/s`)
  ];
});

// And the whole point of the ladder, in one check: the sky a three-machine yard
// makes is more than a bare fan can hold and less than a full one can. That is
// the shape the house is supposed to have -- ignore it and it rains on you, buy
// into it and it stops -- and it is the shape it did not have, in either
// direction, before this. The fan did nothing, so the ladder was unbuyable; and
// whatever the draught swept in was swallowed, so the bare house was already
// enough and there was nothing to buy it for.
group('three machines are more than a bare fan can hold, and less than a full one', async () => {
  // Over a stretch with no shower in it, like everything else here: a rain takes
  // the sky to nothing and reads as a bare fan holding three machines easily.
  const net = fan => {
    fromTheField(fan);
    run(20);
    return dryStretch(60, secs => {
      const was = state().smog.haze;
      run(secs);
      return { rate: (state().smog.haze - was) / secs };
    });
  };
  const bare = net(0);
  const full = net(LADDER);
  return [
    ok(bare.dry && full.dry, 'both stretches were measured without a shower in them',
       `bare ${bare.dry}, full ${full.dry}`),
    ok(bare.rate > 0.5, 'a bare fan loses ground to three machines',
       `${bare.rate.toFixed(1)} haze/s, and climbing`),
    ok(full.rate < 0, 'and the full ladder holds them',
       `${full.rate.toFixed(1)} haze/s`)
  ];
});

// What a swallowed speck does on its way out. Nothing else in this game
// disappears -- muck is carried, dust is banked, a rock is broken up -- and a
// cell blinking off is the one thing the sky was still doing.
group('a speck a mouth takes fades rather than popping', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__clearFloor();
  window.__grant({ dust: 90000 });
  window.__air({ open: true, haze: 2000, muck: 0 });
  window.__buy('balloon');
  window.__finish();
  window.__air({ purifiers: 1, haze: 2000 });
  run(25);
  const busy = state();

  // The level is the count of the sky, so a fading speck must already be out of
  // it: the board cannot be made to lag the truth by the length of a fade.
  const rated = airRate() * SMOG_PER_MOTE * 60;
  const said = busy.smog.filtering;

  window.__air({ purifiers: 0 });
  run(3);
  const stopped = state();

  window.__air({ haze: 0, muck: 0, open: false });
  window.__clearFloor();
  return [
    ok(busy.going > 0, 'a working mouth always has a few specks on the way out',
       `${busy.going} fading`),
    // The fade is short, so what is in flight at any moment is the rate times its
    // length and no more. A number far above that is a list nobody is emptying.
    ok(busy.going < 60, 'and only a few: the fade is short',
       `${busy.going} against a rate of ${Math.round(rated / 60)} a second`),
    ok(Math.abs(said - rated) < Math.max(20, rated * 0.25),
       'and the board still reads the rate, so nothing is counted twice',
       `board ${said}/min against a rating of ${rated.toFixed(0)}/min`),
    ok(stopped.going === 0, 'and they are all gone shortly after the mouth stops',
       `${stopped.going} left`)
  ];
});

// And the other end of a speck's life: arriving. A puff joins the sky wherever
// the air up there has taken it rather than over the works it rose from -- which
// is right, and is a jump. Without a fade at both ends it read as the plume
// popping out of existence at the top of its climb.
group('a speck arriving in the sky comes up to weight rather than appearing at it',
  async () => {
  window.__reset();
  window.__crew(3, 3, 3, 3);
  window.__machineGates();
  // A purse for three machines at once, which is more than a thousand of
  // anything the machines are priced in.
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 9 });
  // No burying the yard: a full pit under the works used to stand in for "at
  // work", but a hand on the rock fouls a little now (DESIGN.md, "Hand work
  // fouls, lightly") and its dust shifts the seeded run enough that a buried
  // yard, machines starved, can idle through the window this waits in. The
  // engines smoke on their own; the tip only decided whether they could reach
  // their work.
  window.__air({ haze: 0, muck: 0 });
  // Each machine is built rather than had -- see works.js -- so the yard has to
  // put them up before there is anything smoking.
  buyBuilt('ram');
  buyBuilt('jaw');
  buyBuilt('tiller');
  run(6);                                    // a yard properly at work, and smoking

  // Empty the band and watch it refill from nothing. A yard running three
  // engines flat out rides at the sky's cap for long stretches, and a full
  // sky turns fresh climbers away (`foul` breaks at MOTE_CAP), so a fixed
  // window of looks at a saturated steady state can honestly find no speck
  // mid-climb and call a working plume broken -- which is a threshold on a
  // noisy statistic, not a rule (CLAUDE.md). From an emptied band every puff
  // the engines raise has to climb, so the property this is about -- a speck
  // comes UP to weight rather than appearing at it -- is guaranteed to be on
  // show, and we wait for it rather than hope to catch it.
  window.__coldSky();
  const climbing = () => yard.smogSky().filter(m => m.up);
  const rose = runUntil(() => climbing().length > 0, 30);

  // Follow one climbing speck the way sky-readout does: hold the object and
  // read its own weight across the frames of its climb. It is born faded --
  // coming up to weight at the far end of its jump -- and it rises toward full
  // as it climbs. A speck that popped into the band at weight would be at full
  // the moment it appeared and never seen part-way. Whether it then settles or
  // is dropped from a busy band is a different rule, and sky-readout's "a speck
  // off a swing is the speck in the band" is where that one lives; this is only
  // the arriving edge.
  const mote = climbing()[0];
  let cameUp = false, seen = 0;
  if (mote && (mote.fade ?? 1) < 0.95) seen++;   // faded the moment it is caught
  for (let i = 0; i < 300 && mote && mote.up; i++) {
    run(1 / 30);
    const f = mote.fade ?? 1;
    if (f < 0.95) seen++;
    if (f > 0.5) cameUp = true;              // it did reach toward full weight
  }

  window.__air({ haze: 0, muck: 0 });
  return [
    ok(rose && !!mote, 'the works put a speck up into an emptied band'),
    // It is seen below full weight while it climbs -- coming up to weight
    // rather than appearing at it.
    ok(seen > 0, 'and it is on the way to weight, not born at it',
       `${seen} frames below full weight`),
    ok(cameUp, 'and it comes up toward full weight as it climbs')
  ];
});
