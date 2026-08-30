// The two houses that take things away: the scrubbing house pulling the sky
// back down, and the outhouse gathering what the crew leave for the tower.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';

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
  // One body: the house is a shed with a fan in it and holds exactly one, the
  // way the lab does -- see `capOf`.
  window.__air({ scrubbers: 1, haze: 500 });
  runUntil(() => state().smog.scrubbing > 0, 40);
  // and then the sky has to arrive. The fan reaches about fifteen hundred
  // pixels; what is further out than that is slid along the band towards the
  // house rather than plucked out of it, so a house that has just started has a
  // warm-up while the first of the band comes over the roof. Six seconds was
  // enough when the draught acted on the whole world at once.
  run(25);
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
    ok(on.scrubbers === 1 && on.scrubbing > 0 && on.haze < 500,
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

  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  window.__tune('LOO_EVERY', 600000);
  return [
    ok(wild.all > 0, 'with nowhere to go they leave it where they were working',
       `${wild.all} over ${wild.cols} columns`),
    ok(gathered.all > 0, 'a shed does not make it go away',
       `${gathered.all} still to shovel`),
    ok(gathered.cols <= wild.cols, 'and the closet does not gather it either',
       `${wild.cols} columns without it, ${gathered.cols} with`)
  ];
});
