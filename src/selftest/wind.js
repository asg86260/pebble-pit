// The wind: the draught the cursor leaves in the dust, and the one swing the
// dust and the smoke both lean on.

import { newRun, settle, state, ok, point, run } from './kit.js';

export const TESTS = [
  ['the cursor leaves a draught in the dust', async () => {
    newRun();
    await settle();
    run(3);
    const quiet = state();

    // Put the hand down first and let the air forget it: the move *to* the
    // starting corner is itself a sweep across the window.
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

  // What is asked is not that the motes move but that they agree. The haze is
  // loaded rather than climbed into so that nothing in it is still
  // dispersing, which is not the wind and would drown it here.
  ['the dust and the smoke lean on one wind', async () => {
    newRun();
    window.__air({ haze: 700 });
    await settle();
    run(3);

    // Which way a field went between two readings, and how much of it agreed.
    // Motes that did not move are left out, and so are ones that jumped
    // further than the wind could have taken them (born again across the
    // window, or wrapped round the end of the world).
    const tally = (from, to, wrap) => {
      let right = 0, left = 0;
      for (let i = 0; i < Math.min(from.length, to.length); i++) {
        const d = to[i] - from[i];
        if (!d || Math.abs(d) > wrap) continue;
        if (d > 0) right++; else left++;
      }
      const n = right + left;
      // and how far the body of it went, signed: in a sky with eddies this is
      // the number that means "the wind took the smoke", where counting heads
      // measures how big the swirls are next to how far apart the samples are.
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

    // Sampled at moments spread across a few seconds: the wind eases through
    // nought (the lull), and at those instants there is nothing to agree
    // about. The claim is that when it is blowing, it is blowing one way.
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
      // Only where there is a wind to agree about: at the turn the smoke's
      // mean drift is a fraction of a pixel the stirring can flip either way.
      // Added up across the readings rather than scored one by one: eight
      // short windows, each of which one large eddy can turn over, is eight
      // coin flips with a pass mark on them.
      if (a.n >= 20 && s.n >= 10 && Math.abs(is.wind) > 0.1) {
        bothWays++;
        downwind += s.mean * Math.sign(is.wind);
        if (a.way === s.way) together++;
      }
      // On to a different part of the gust. WIND_MS is a time constant, not a
      // period: the slower swing comes round once in the best part of a
      // minute, and with a seeded clock eight readings a second apart land on
      // the same fifth of it every run, one where the two swings can cancel.
      run(4);
    }

    return [
      ok(dust.n >= 20, 'there is dust in the air and it is moving',
         `${dust.n} of ${state().airX.length} sampled motes shifted`),
      ok(dust.share > 0.95, 'and near enough all of it leans the same way at once',
         `${dust.most} of ${dust.n} agreed`),
      ok(smoke.n >= 10, 'there is smoke up there too', `${smoke.n} settled motes shifted`),
      // The body of it moves, rather than every speck the same way: the sky
      // has eddies, and unanimity would mean the stirring had stopped.
      ok(Math.abs(smoke.mean) > 0.02, 'and the body of it is carried',
         `${smoke.mean.toFixed(3)}px a mote, ${smoke.n} moved`),
      // Over the whole run: smoke takes up the air's pace over about half a
      // second (SKY_WIND), so at the turn the band is still going the old way
      // for a beat. That lag is the smoke having weight.
      ok(bothWays > 0 && downwind > 0,
         'and the smoke leans the way the dust does: one wind, not two',
         `${downwind.toFixed(2)}px downwind over ${bothWays} readings`),
      // A wind with no lull in it is a fan.
      ok(Math.max(...winds) - Math.min(...winds) > 0.1,
         'and the wind itself gusts rather than blowing at one steady rate',
         `${Math.min(...winds).toFixed(2)} to ${Math.max(...winds).toFixed(2)}`)
    ];
  }],

  // The push itself is checked in the node yard, which calls `stirSmoke` with
  // four numbers. What is not checked there is the plumbing: the dust is
  // stirred in *screen* pixels and the smoke in *world* ones, off two readings
  // of the same pointer event (input.js), so this one dispatches `pointermove`
  // at the canvas and then looks at the band.
  //
  // The hand goes round a circuit rather than back and forth: a return stroke
  // along the same line drags the smoke back where it came from.
  ['a hand through the smoke drags the band along', async () => {
    newRun();
    window.__air({ haze: 700 });
    await settle();
    run(3);                                   // and the band comes to rest

    // Park the hand somewhere else first and let the sky forget it: the move
    // *to* the start of the circuit is itself a sweep across the window.
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
    // mote's place is worked out from the wind's phase on demand, and
    // dispatching sixty pointer events takes real milliseconds the next tick
    // folds into the game clock, so a baseline taken before the circuit is a
    // baseline taken in a different wind. The stir offsets are taken up on
    // the next step either way, so reading here measures exactly the push.
    const was = window.__skyX();              // world x, unrounded: the push is a pixel

    // The offsets are taken up when a mote is next stepped, so one frame, and
    // one only: a settled mote drifts about a tenth of a pixel a frame on the
    // sway and the wind, and that is the noise this is measured against.
    run(1 / 60);
    const now = window.__skyX();
    const y = window.__skyXY();               // for the height, which __skyX does not carry

    // Near and far are measured against the whole circuit, not its top leg:
    // the haze has the full sky, so every leg stirs, and a mote on the bottom
    // leg classed "far" files the hand's own work under the still air.
    const wx0 = s.camX + LEFT / s.zoom, wx1 = s.camX + RIGHT / s.zoom;
    const wy0 = s.camY + HIGH / s.zoom, wy1 = s.camY + LOW / s.zoom;
    // Distance from a point to the rectangle's perimeter: outside, the usual
    // clamp; inside, how far from the nearest wall the hand ran along.
    const offRect = (x, yy) => {
      const dx = Math.max(0, wx0 - x, x - wx1), dy = Math.max(0, wy0 - yy, yy - wy1);
      if (dx || dy) return Math.hypot(dx, dy);
      return Math.min(x - wx0, wx1 - x, yy - wy0, wy1 - yy);
    };
    const near = [], far = [];
    for (let i = 0; i < was.length; i++) {
      const X = was[i], Y = s.camY + y[i][1];
      const moved = Math.abs(now[i] - was[i]);
      // `moved` is x alone, and a hand drags the smoke the way it is going, so
      // only the two horizontal legs put their push on the measured axis. A
      // mote on a vertical leg is dragged down the axis nobody is reading:
      // as "near" it dilutes the drag, as "far" it fails the stillness check.
      const onLeg = X >= wx0 && X <= wx1 &&
                    (Math.abs(Y - wy0) < 30 || Math.abs(Y - wy1) < 30);
      if (onLeg) near.push(moved);
      else if (offRect(X, Y) > 300) far.push(moved);
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
