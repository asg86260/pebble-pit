// The wind: the draught the cursor leaves in the dust, and the one swing the
// dust and the smoke both lean on.
//
// 3 groups, in the order they have always run in --
// see src/selftest.js, which is where the order lives.

import { newRun, settle, state, ok, point, run } from './kit.js';

export const TESTS = [
  // Something moving through still air moves the air. The dust is the one thing
  // in this yard the pointer goes through without touching anything, and a field
  // that takes no notice of a hand through it is a picture of dust.
  ['the cursor leaves a draught in the dust', async () => {
    newRun();
    await settle();
    run(3);
    const quiet = state();

    // Put the hand down first and let the air forget it. Whatever ran before this
    // left the pointer somewhere, so the move *to* the starting corner is itself
    // a sweep across the window -- and measuring "nothing is blowing about" in
    // the frame after it reads the last check's draught, not this one's.
    point('pointermove', 200, 200, 0);
    run(3);
    const still = state();
    for (let i = 1; i <= 12; i++) point('pointermove', 200 + i * 16, 200, 0);
    const stirred = state();
    const was = stirred.airPos;
    run(2 / 60);
    const after = state();
    const shifted = after.airPos.filter((p, i) => p !== was[i]).length;

    // and the pointer left where it is: standing still stirs nothing
    run(3);
    const settledAir = state();
    point('pointermove', 392, 200, 0);
    point('pointermove', 392, 200, 0);
    const parked = state();

    return [
      ok(quiet.air > 0, 'there is dust in the air to begin with', `${quiet.air} motes`),
      ok(still.airStirred === 0, 'and none of it is being blown about',
         `${still.airStirred} carrying a draught`),
      ok(stirred.airStirred > 0, 'a hand drawn through it takes some of it along',
         `${stirred.airStirred} of ${stirred.air}`),
      ok(stirred.airStirred < stirred.air,
         'and not the whole field: it is a wake, not a wind', `${stirred.airStirred} of ${stirred.air}`),
      ok(shifted > 0, 'the motes it caught actually move', `${shifted} moved`),
      ok(settledAir.airStirred === 0, 'the air settles again once the hand has gone by',
         `${settledAir.airStirred} still drifting`),
      ok(parked.airStirred === 0,
         'and a pointer parked in it stirs nothing at all, however long it sits there',
         `${parked.airStirred} drifting`)
    ];
  }],

  // One wind over the yard, and everything hanging in it leaning on that one
  // wind. The dust used to swim on a cosine of its own, on its own phase and its
  // own period, and the haze to bob on a sine of its own -- so two specks a
  // hand's breadth apart went opposite ways in the same frame. That is movement
  // everywhere and weather nowhere, and it is the whole reason the air read as
  // noise. What is asked here is not that the motes move, which they always did,
  // but that they agree.
  //
  // The haze is loaded rather than climbed into so that nothing in it is still
  // dispersing: a young mote's stretch of sky is opening under it a couple of
  // pixels a second, outward in both directions at once, and that is deliberate
  // -- see `spreadAt` -- but it is not the wind and would drown it here.
  ['the dust and the smoke lean on one wind', async () => {
    newRun();
    window.__air({ haze: 700 });
    await settle();
    run(3);

    // Which way a field went between two readings, and how much of it agreed.
    // Motes that did not move at all are left out, and so are ones that jumped
    // further than the wind could have taken them: a mote that landed and was
    // born again across the window, or one that wrapped round the end of the
    // world, is not a mote that disagreed about the weather.
    const tally = (from, to, wrap) => {
      let right = 0, left = 0;
      for (let i = 0; i < Math.min(from.length, to.length); i++) {
        const d = to[i] - from[i];
        if (!d || Math.abs(d) > wrap) continue;
        if (d > 0) right++; else left++;
      }
      const n = right + left;
      // and how far the body of it went, on average and with sign. In a sky with
      // eddies in it this is the number that means "the wind took the smoke":
      // counting heads asks whether every speck agreed, which in a fluid is a
      // question about how big the swirls are next to how far apart the sampled
      // motes happen to be.
      let sum = 0;
      for (let i = 0; i < Math.min(from.length, to.length); i++) {
        const d = to[i] - from[i];
        if (!d || Math.abs(d) > wrap) continue;
        sum += d;
      }
      return { n, most: Math.max(right, left), way: sum >= 0 ? 1 : -1,
               mean: n ? sum / n : 0,
               share: n ? Math.max(right, left) / n : 0 };
    };

    // Sampled at moments spread across a few seconds rather than once. The wind
    // eases through nought and back -- it is meant to, that is the lull -- so
    // there are instants where next to nothing is moving and there is nothing to
    // agree about. The claim is that when it is blowing, it is blowing one way.
    let dust = { n: 0, share: 0 }, smoke = { n: 0, share: 0 };
    let bothWays = 0, together = 0, downwind = 0;
    const winds = [];
    for (let i = 0; i < 8; i++) {
      const was = state();
      run(10 / 60);
      const is = state();
      winds.push(is.wind);
      const a = tally(was.airX, is.airX, 40);
      const s = tally(was.smog.skyX, is.smog.skyX, 60);
      if (a.n > dust.n) dust = a;
      if (s.n > smoke.n) smoke = s;
      // and only where there is a wind to agree about. The gusts ease through
      // nought -- that is the lull, and it is meant to be there -- and at the
      // turn the smoke's mean drift is a fraction of a pixel that the stirring
      // can flip either way. Asking the two to agree there is asking them to
      // agree about nothing.
      //
      // Added up across the readings rather than scored one by one. Eight short
      // windows, each of which a single large eddy can turn over, is eight coin
      // flips with a pass mark on them; the question is whether the smoke goes
      // downwind over the run, and that is one number.
      if (a.n >= 20 && s.n >= 10 && Math.abs(is.wind) > 0.1) {
        bothWays++;
        downwind += s.mean * Math.sign(is.wind);
        if (a.way === s.way) together++;
      }
      // and on to a different part of the gust. Four seconds rather than the
      // one-and-a-third this used to take, because a third of a minute is what
      // "a different part" actually costs: WIND_MS is a time constant and not a
      // period, so the slower of the two swings the wind is made of comes round
      // once every nine seconds times two pi -- the best part of a minute. Eight
      // readings a second and a bit apart sample a fifth of one swing, and which
      // fifth they get depends on where the clock started. That was invisible
      // while the clock started wherever the page happened to load; with a
      // seeded run it starts at nought every time, and the fifth it lands on is
      // one where the two swings pull against each other and the whole thing
      // moves by nine hundredths. Widening the sweep asks the question the check
      // means to ask -- does the wind get somewhere it was not -- rather than
      // asking it of whichever twelve seconds we happened to be handed.
      run(4);
    }

    return [
      ok(dust.n >= 20, 'there is dust in the air and it is moving',
         `${dust.n} of ${state().airX.length} sampled motes shifted`),
      ok(dust.share > 0.95, 'and near enough all of it leans the same way at once',
         `${dust.most} of ${dust.n} agreed`),
      ok(smoke.n >= 10, 'there is smoke up there too', `${smoke.n} settled motes shifted`),
      // The body of it moves, rather than every speck of it moving the same way.
      //
      // This asked that 95% of settled motes shift the same way inside a tenth
      // of a second, and that was a true description of a band that was placed
      // rather than blown: one shared creep moved every mote by the same amount,
      // so of course they agreed. The sky is a fluid now -- see `flowAt` -- and
      // a fluid has eddies: specks on the near side of a swirl go one way while
      // their neighbours go the other, and unanimity would mean the stirring had
      // stopped. Head-counting in a turbulent field measures how big the swirls
      // are next to how far apart the sampled motes are, which is not weather.
      // What the wind has to do is carry the smoke, and that is a mean.
      ok(Math.abs(smoke.mean) > 0.02, 'and the body of it is carried',
         `${smoke.mean.toFixed(3)}px a mote, ${smoke.n} moved`),
      // The smoke goes the way the wind is blowing, taken over the whole run.
      //
      // Dust on the ground answers a gust in the frame it happens -- it is being
      // blown along a floor -- and smoke does not: a mote takes up the air's
      // pace over about half a second (SKY_WIND), so at the turn the band is
      // still going the old way for a beat. That lag is the smoke having weight,
      // which is the thing the whole rework is for. Scoring each reading
      // separately made a pass mark out of eight coin flips; summing the drift
      // against the wind's own sign asks the question once.
      ok(bothWays > 0 && downwind > 0,
         'and the smoke leans the way the dust does: one wind, not two',
         `${downwind.toFixed(2)}px downwind over ${bothWays} readings`),
      // A wind with no lull in it is a fan. Over half a minute -- most of the
      // way round the slower of its two swings -- it has to have got somewhere
      // it was not.
      ok(Math.max(...winds) - Math.min(...winds) > 0.1,
         'and the wind itself gusts rather than blowing at one steady rate',
         `${Math.min(...winds).toFixed(2)} to ${Math.max(...winds).toFixed(2)}`)
    ];
  }],

  // And the same hand in the smoke overhead.
  //
  // The push itself is checked in the node yard, which calls `stirSmoke` with
  // four numbers. What is not checked there is the plumbing that hands it those
  // numbers, and that is the part with something to get wrong: the dust is
  // stirred in *screen* pixels and the smoke in *world* ones, off two different
  // readings of the same pointer event (see `input.js`), so a check that never
  // goes through a real event cannot tell the two apart. This one dispatches
  // `pointermove` at the canvas and then looks at the band.
  //
  // The hand goes round a circuit rather than back and forth: a return stroke
  // along the same line drags the smoke back where it came from, so the run home
  // is taken well below the band, outside the draught's reach.
  ['a hand through the smoke drags the band along', async () => {
    newRun();
    window.__air({ haze: 700 });
    await settle();
    run(3);                                   // and the band comes to rest

    // Park the hand somewhere else first and let the sky forget it. Whatever ran
    // before this left the pointer somewhere, and the move *to* the start of the
    // circuit is itself a sweep across the window.
    point('pointermove', 700, 500, 0);
    point('pointermove', 700, 500, 0);
    run(1);

    const s = state();

    const LEFT = 200, RIGHT = 560, HIGH = 42, LOW = 300;
    for (let lap = 0; lap < 3; lap++) {
      for (let x = LEFT; x <= RIGHT; x += 20) point('pointermove', x, HIGH, 0);
      for (let y = HIGH; y <= LOW; y += 20) point('pointermove', RIGHT, y, 0);
      for (let x = RIGHT; x >= LEFT; x -= 20) point('pointermove', x, LOW, 0);
      for (let y = LOW; y >= HIGH; y -= 20) point('pointermove', LEFT, y, 0);
    }

    // Read AFTER the circuit, right before the one stepped frame. A settled
    // mote's place is worked out from the slot and the wind's phase on demand
    // now (wave6-sky, item 4), and dispatching sixty pointer events takes real
    // milliseconds the next tick folds into the game clock -- so a baseline
    // taken before the circuit is a baseline taken in a different wind, and the
    // whole band appears to move a pixel that no stir put on it. The stir
    // offsets are laid on the motes and taken up on the next step either way,
    // so reading here measures exactly the push and none of the weather.
    const was = window.__skyX();              // world x, unrounded: the push is a pixel

    // The offsets are laid on a mote and taken up when it is next stepped, so
    // one frame -- and one only. A settled mote drifts about a tenth of a pixel
    // a frame on the sway and the wind, and that is the noise this is measured
    // against.
    run(1 / 60);
    const now = window.__skyX();
    const y = window.__skyXY();               // for the height, which __skyX does not carry

    const wx0 = s.camX + LEFT / s.zoom, wx1 = s.camX + RIGHT / s.zoom;
    const at = s.camY + HIGH / s.zoom;        // the line the hand was drawn along
    const near = [], far = [];
    for (let i = 0; i < was.length; i++) {
      const off = Math.hypot(Math.max(0, Math.max(wx0 - was[i], was[i] - wx1)),
                             s.camY + y[i][1] - at);
      const moved = Math.abs(now[i] - was[i]);
      if (off < 50) near.push(moved);
      else if (off > 300) far.push(moved);
    }
    const mean = a => a.length ? a.reduce((x, v) => x + v, 0) / a.length : 0;
    const most = a => a.length ? Math.max(...a) : 0;

    return [
      ok(near.length >= 20 && far.length >= 200,
         'there is a band up there, some of it under the hand and some well clear',
         `${near.length} under the hand, ${far.length} away from it`),
      ok(mean(near) > 0.3, 'the smoke the hand went through is dragged along',
         `${mean(near).toFixed(3)}px a mote`),
      // Three world pixels is SMOKE_STIR_CAP: a hand is a draught, not a shove.
      ok(most(near) <= 3, 'and no further than the draught is ever allowed to carry one',
         `${most(near).toFixed(3)}px at the most`),
      ok(most(far) < 0.2, 'while the far end of the band stands where it was',
         `${most(far).toFixed(3)}px at the most`),
      ok(mean(near) > mean(far) * 4, 'so the draught is where the hand went, not over the whole sky',
         `${mean(near).toFixed(3)}px against ${mean(far).toFixed(3)}px`)
    ];
  }],
];
