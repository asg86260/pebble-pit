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

// The crew make their own mess, and there is one answer to it: somebody whose
// job it is.
//
// There used to be two, and this group was written against them -- a shed the
// crew walked to, which gathered the mess into one patch, and the tower, which
// made it disappear. The shed is not a destination any more (see `relieve` in
// crew.js): a body goes where it stands and leaves it there, always. What the
// row buys now is the *post* rather than the place. `capOf('janitors')` in
// upgrades.js is two with the closet up and nought without it, and `mayShift`
// in smog.js makes a janitor the only pair of hands in the yard allowed to
// touch what a body left -- carrying hands may not, however idle they are.
//
// So the closet cannot be weighed by where the mess lands: that is the same
// either way, and the old check asking whether it was gathered could only ever
// answer no. It is weighed by whether there is anybody on it.
group("the closet is the janitor's post, and only a janitor shifts what the crew leave", async () => {
  // What the crew left, and over how much ground. `smog.poop` is their layer.
  // The old check read `smog.muck.cols`, which counts the *sky's* layer -- and
  // this scenario winds the sky to nothing, so that count was nought in both
  // halves and the comparison was `0 <= 0`. The crew write to the poop layer
  // (`dropMuckAt(..., 'poop')` in crew.js), so the poop layer is what to read;
  // it is not in the report by column, so the array itself is.
  const spread = () => ({
    poop: Math.round(state().smog.poop),
    cols: (yard.S.poop || []).filter(Boolean).length,
    janitors: state().janitors
  });
  const fresh = () => {
    window.__reset();
    window.__tune('LOO_EVERY', 5000);         // wound in: it is ten minutes a body
    // Three at the rock and two carrying. The two are there to be refused: a
    // pair of hands on dust may not shift what a body left, so a yard with
    // haulers in it is still a yard with nobody on the mess. The only thing
    // that differs between the two halves below is the post.
    window.__crew(3, 2);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
  };

  // --- the closet shut ---------------------------------------------------------
  fresh();
  window.__air({ janitors: 2 });              // asked for, with nowhere to keep a shovel
  const shutPost = state().janitors;
  run(90);
  const wild = spread();
  window.__tune('LOO_EVERY', 600000);         // and nothing new while we watch
  run(60);
  const ignored = spread();

  // --- the closet up, and nobody on it -----------------------------------------
  // The half that says what the closet does *not* do. It is the same ninety
  // seconds of the same yard with the door open and no janitor hired, so the
  // only thing that could differ is where the mess lands -- and it does not.
  fresh();
  window.__loo(true);                         // the row itself, not a poke at S
  run(90);
  const landed = spread();

  // --- the closet up, and two on it --------------------------------------------
  fresh();
  window.__loo(true);
  window.__air({ janitors: 2 });
  const openPost = state().janitors;
  // Watched along the way rather than only at the end. Two janitors keep up
  // with three miners, so the figure at any one moment is nought as often as
  // not -- and "nought left" read once is equally what a yard where nobody ever
  // went would say. The high-water mark is what says the mess was still being
  // made while they were clearing it.
  let peak = 0;
  for (let i = 0; i < 18; i++) { run(5); peak = Math.max(peak, state().smog.poop); }
  const made = spread();
  window.__tune('LOO_EVERY', 600000);         // measure the clearing, not the race
  const cleared = runUntil(() => state().smog.poop === 0, 150);
  const swept = spread();

  window.__crew(0, 0);
  window.__loo(false);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  window.__tune('LOO_EVERY', 600000);
  return [
    ok(wild.poop > 0, 'the crew leave something behind wherever they are working',
       `${wild.poop} over ${wild.cols} columns`),
    ok(shutPost === 0, 'with the closet shut there is no post to put anybody on',
       `asked for two janitors, got ${shutPost}`),
    ok(ignored.poop >= wild.poop, 'so it lies there however long you leave it',
       `${wild.poop} -> ${ignored.poop} after another minute`),
    // The thing the old check thought it was measuring, written down as what it
    // actually is. The closet on its own gathers nothing and clears nothing:
    // open it and hire nobody and the same ninety seconds leaves the same mess
    // over the same spread of yard. What the row buys is a job, not a place.
    ok(landed.cols > 1 && landed.poop > 0,
       'the closet on its own gathers nothing -- it still lands where they work',
       `${wild.cols} columns shut, ${landed.cols} open with nobody on it`),
    // The closet opens with one post now -- `loopost` sells the second, see
    // A3 in feedback3.md -- so asking for two janitors with nowhere but that
    // one post gets one.
    ok(openPost === 1, 'what it opens is the post', `${openPost} janitors`),
    ok(peak > 0, 'and a post does not stop the crew making the mess',
       `${Math.round(peak)} on the ground at the worst of it`),
    ok(cleared && swept.poop === 0, 'but somebody comes round and clears it',
       `${Math.round(peak)} at the worst of it -> ${swept.poop} left`),
    ok(made.poop < wild.poop / 4,
       'so a yard with the post staffed is a yard being kept up with',
       `${wild.poop} left with nobody on it, ${made.poop} with two`)
  ];
});
