// The fan, and the one number that says whether you are winning.
//
// The house is the only sink in the game -- the sky fills from the machines and
// the only thing that takes it back out is a body standing in that shed -- and
// `capOf` allows exactly one body in there. So the fan is not a nice-to-have on
// the side of the house: it is the *whole* of how the sink grows, and if it does
// not grow, a yard that buys its third machine has bought a sky it can never get
// back down again however much it spends.
//
// It did not grow. `pull` took its draught strength as `scrubRate() / fanPull()`
// -- and `scrubRate()` is bodies times `fanPull()`, so the fan cancelled clean
// out of the one line that moves a mote, leaving the count of bodies, which is
// one, for ever. Five rungs and three hundred and sixty-nine shards bought a
// draught byte-for-byte identical to the one you started with.
//
// And the board agreed that it had worked, which is the worse half. It quoted
// `scrubRate()` -- what the fan is *rated* at, in motes a second -- beside a
// fouling figure in haze a second. A mote is SMOG_PER_MOTE of haze, so the
// house's column read about twice what it was worth; it went on quoting the full
// figure with the house clogged, or with the sky too thin to have anything in
// reach of the draught; and the arrow that comes off the difference pointed the
// wrong way. You could buy the ladder, watch the reading go green, and drown.
//
// So: the fan is worth something overhead, the house takes what it says it takes,
// and the number on the board is a measurement rather than a quotation.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { scrubRate } from '../src/smog.js';
import { inScrub } from '../src/scrubhouse.js';
import { SMOG_PER_MOTE } from '../src/config.js';

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
  window.__air({ haze: 1800, muck: 0, scrubbers: 1, recycler: true, open: true });
  // Wait for the body to actually be IN the house, rather than assuming three
  // seconds of walking is enough.
  //
  // It was three seconds, and that made every reading below partly a measurement
  // of a walk. The house does nothing at all until somebody is through the door
  // -- `inScrub`, not `S.scrubbers`, which counts everybody it has been given
  // including one still crossing the yard -- so a run that started before the
  // body arrived spent part of its thirty seconds measuring an empty shed. On a
  // busy yard the walk is longer than three seconds and the same setting came
  // out at 140 haze cleared on one arrangement and 984 on another, which is
  // noise several times the size of the thing being measured.
  //
  // The check passed for as long as the walk happened to fit. Same fault as the
  // dance's seed, and the same cure: wait for the state the measurement is
  // about instead of guessing how long it takes to arrive.
  runUntil(() => inScrub() > 0, 60);
};

// How much sky one setting of the fan takes down in half a minute, with nothing
// allowed to rain: the sky is wound to well under the line and the stretch is
// short, so what this measures is the house and not the weather.
function cleared(fan) {
  // The machines off, so what this measures is the house alone. With them
  // running the sky is being filled at the same time it is being emptied, and
  // the difference of two rates is not a measurement of either.
  fromTheField(fan, []);
  const before = state().smog.haze;
  run(30);
  const s = state().smog;
  return { took: before - s.haze, left: s.haze, rate: s.scrubbing / 60, rains: s.rains };
}

group('a bigger fan is a bigger draught, not a bigger number', async () => {
  const bare = cleared(0);
  const full = cleared(5);
  return [
    ok(bare.took > 0, 'a house with no fan on it still pulls the sky down',
       `${Math.round(bare.took)} haze in thirty seconds`),
    // The ladder is five rungs of a quarter each -- 1.25^5, a little over three
    // times. Well short of that here and the fan is decoration again; this asks
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
group('the house takes what it is rated at', async () => {
  fromTheField(2, []);
  run(20);                                  // past the first mote and into the steady state
  const rated = scrubRate() * SMOG_PER_MOTE; // haze a second, the board's unit
  const before = state().smog.haze;
  run(30);
  const s = state().smog;
  const took = (before - s.haze) / 30;      // nothing rains at this haze
  return [
    ok(s.rains === state().smog.rains && s.haze < 3200,
       'the sky stays under the line, so nothing here is the weather',
       `${Math.round(s.haze)} haze`),
    ok(took > rated * 0.7 && took < rated * 1.3,
       'what comes out of the sky is what the fan is rated to take',
       `rated ${rated.toFixed(1)}, took ${took.toFixed(1)} haze/s`)
  ];
});

group('the board counts what the mouth swallows', async () => {
  // An empty sky and a fan five rungs up: the rating is high and there is
  // nothing up there to take, so a board quoting the rating says the house is
  // winning by a mile while it stands there doing nothing.
  //
  // **The machines off**, or the sky is not empty and the premise is gone. They
  // used to be able to stay on: the house had to drag a speck across the yard to
  // its throat, which took the best part of a second and a half, so four seconds
  // after the sky was cleared almost nothing had arrived. A mouth takes its
  // share of the sky the moment the speck has settled now -- see `eat` -- so a
  // fouling yard is a yard with something to take, and the house honestly reads
  // as scrubbing it. What this group is about is the board quoting what was
  // *swallowed* rather than what the fan is rated at, and that needs a sky with
  // nothing in it.
  fromTheField(5, []);
  window.__air({ haze: 0 });
  run(4);
  const idle = state().smog;

  // And running, where the two columns have to be in the same unit or the
  // difference between them -- which is the whole of what the board is for --
  // means nothing. The machines are on for this one: a board with nothing in the
  // fouling column is only half a board.
  fromTheField(2);
  run(20);
  const before = state().smog.haze;
  run(30);
  const s = state().smog;
  const fell = (before - s.haze) / 30;         // how the sky actually went
  const said = (s.scrubbing - s.fouling) / 60; // and what the board said it would
  return [
    ok(idle.scrubbing < 1,
       'a fan over a clear sky is not scrubbing anything, whatever it is rated at',
       `${idle.scrubbing}/min with nothing overhead`),
    // Both are the same quantity from the two ends: what the sky did over the
    // stretch, and what the board's two columns said it would do. In the same
    // unit they agree; in the old ones the board was out by about a factor of
    // two and pointing the wrong way.
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
  const net = fan => {
    fromTheField(fan);
    run(20);
    const before = state().smog.haze;
    run(60);
    return (state().smog.haze - before) / 60;
  };
  const bare = net(0);
  const full = net(5);
  return [
    ok(bare > 0.5, 'a bare fan loses ground to three machines',
       `${bare.toFixed(1)} haze/s, and climbing`),
    ok(full < 0, 'and the full ladder holds them',
       `${full.toFixed(1)} haze/s`)
  ];
});

// What a swallowed speck does on its way out. Nothing else in this game
// disappears -- muck is carried, dust is banked, a rock is broken up -- and a
// cell blinking off is the one thing the sky was still doing.
group('a speck a mouth takes fades rather than popping', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__clearFloor();
  window.__air({ open: true, haze: 2000, muck: 0, scrubbers: 1 });
  run(25);
  const working = state();

  // The level is the count of the sky, so a fading speck must already be out of
  // it: the board cannot be made to lag the truth by the length of a fade.
  const rated = scrubRate() * SMOG_PER_MOTE * 60;
  const said = working.smog.scrubbing;

  window.__air({ scrubbers: 0 });
  run(3);
  const stopped = state();

  window.__air({ haze: 0, muck: 0, open: false });
  window.__clearFloor();
  return [
    ok(working.going > 0, 'a working mouth always has a few specks on the way out',
       `${working.going} fading`),
    // The fade is short, so what is in flight at any moment is the rate times its
    // length and no more. A number far above that is a list nobody is emptying.
    ok(working.going < 60, 'and only a few: the fade is short',
       `${working.going} against a rate of ${Math.round(rated / 60)} a second`),
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
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__air({ haze: 0, muck: 0 });
  window.__buy('ram');
  window.__buy('jaw');
  window.__buy('tiller');
  run(40);                                   // a yard properly at work, and smoking

  let fading = 0, going = 0, seen = 0;
  for (let i = 0; i < 5; i++) {
    run(0.5);
    const f = window.__skyFades();
    fading += f.filter(v => v < 0.95).length;
    going += state().going;
    seen += f.length;
  }

  window.__air({ haze: 0, muck: 0 });
  return [
    ok(seen > 0, 'the works put a sky up', `${seen} specks sampled`),
    // Coming up to weight at the far end of the jump...
    ok(fading > 0, 'and specks are always arriving, part way up to full weight',
       `${fading} mid-fade over five samples`),
    // ...and thinning out at the near end of it, which is what stops the plume
    // reading as popping.
    ok(going > 0, 'while what they left behind at the top of the climb thins out',
       `${going} fading out`)
  ];
});
