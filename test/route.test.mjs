// Getting about: the surface, the ways, and the one way out of a hole.
//
// These are the checks the yard did not have, and their absence is most of what
// this refactor was for. Every bug in the list that started it -- quarriers
// climbing out through the wall, a janitor standing inside a heap -- was a rule
// that existed in one place and was needed in four, and nothing anywhere said
// what the rule was. So each group below states one rule about *the world*
// rather than about one body's behaviour, which is what makes them hold for
// bodies nobody has written yet.

import { group, ok, state, run } from './helpers.mjs';

const detail = () => state().crewDetail.map(d => {
  const [t, goal, x, c, k, p, w, y] = d.split('|');
  return { t, goal, x: +x, carry: +c.slice(1), kit: w.slice(1), y: +y.slice(1) };
});

// The ground line. Read off the yard rather than worked out from where somebody
// happens to be standing: the first go at this took it off the lowest hauler,
// which is the ground line right up until every hauler is on the rock or in the
// hole, and then it is not.
const groundY = () => state().groundY;

group('a hole has exactly one way out, and it is the ladder', async () => {
  window.__reset();
  window.__crew(2, 3, 4, 0);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  run(40);

  const world = window.__ways();
  const cutLinks = world.links.filter(l => l.a === 'cut' || l.b === 'cut');
  const face = state().quarryFaceX;

  return [
    ok(world.ways.includes('cut'), 'the floor of the cut is its own way',
       world.ways.join(' ')),
    // This is the whole of the fix, stated. Nothing tells a body to use the
    // ladder; there is simply nothing else joined to the cut, so every route out
    // of it goes along the one link there is.
    ok(cutLinks.length === 1, 'joined to the rest of the world in exactly one place',
       JSON.stringify(cutLinks)),
    ok(cutLinks[0] && Math.abs(cutLinks[0].x - face) < 2,
       'and that place is the head of the ladder',
       `${cutLinks[0] && cutLinks[0].x} against ${Math.round(face)}`)
  ];
});

group('nobody leaves the cut through the wall', async () => {
  window.__reset();
  window.__crew(2, 3, 4, 0);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__loo();
  window.__assign('janitors', 1);
  run(40);

  const gy = groundY();
  const bad = [];
  // Sampled a frame at a time: a crossing takes one frame, and a loop that steps
  // a second at a go steps clean over every one of them and reports a yard where
  // nothing ever happened.
  const watch = (secs, tag) => {
    let prev = detail();
    for (let i = 0; i < secs * 60; i++) {
      run(1 / 60);
      const now = detail();
      const face = state().quarryFaceX;
      for (let n = 0; n < Math.min(prev.length, now.length); n++) {
        const a = prev[n], b = now[n];
        if (a.t !== 'q' || b.t !== 'q') continue;         // the crew is rebuilt: skip a swap
        const was = a.y + 18 > gy + 1, is = b.y + 18 > gy + 1;
        if (was !== is && Math.abs(b.x - face) > 12)
          bad.push(`${tag} ${was ? 'out' : 'in'} at ${b.x}, ladder at ${Math.round(face)}`);
      }
      prev = now;
    }
  };

  // Every reason a body has to be somewhere else, one after another. Each of
  // these used to be its own path with its own idea of how to get out.
  watch(12, 'digging');
  window.__muckSet(c => (c % 3 === 0 ? 3 : 0));   // a mess up top to be dropped for
  watch(12, 'mess');
  window.__next();                                // a rock coming down to dance for
  watch(12, 'rock');

  return [ok(bad.length === 0, 'in and out of the cut only ever at the ladder',
             bad.slice(0, 4).join(' / '))];
});

group('a heap is passed in front of, the rock is walked over', async () => {
  window.__reset();
  window.__crew(2, 2, 0, 0);
  run(6);

  const gy = groundY();
  const p = state().piles.find(q => q.key === 'rock');
  for (let x = p.from + 10; x < p.to - 10; x += 8) window.__pile(x, 45);
  run(3);

  const onHeap = window.__surface(p.from + 90);
  const onRock = window.__surface(state().rockLeftX + 120);
  const bare = window.__surface(p.to + 200);

  return [
    // Loose dust is a bank, not a floor. A body walks past it at the height of
    // the ground and is drawn in front of it -- which is the whole of what the
    // janitor was doing wrong.
    ok(onHeap >= gy - 1, 'a heap of dust is not something to stand on top of',
       `${onHeap} against a ground line of ${gy}`),
    // And the hill is, for everybody. There is no longer a job that walks over
    // it and a job that walks through it.
    ok(onRock < gy - 6, 'and the rock is', `${onRock} against ${gy}`),
    ok(Math.abs(bare - gy) <= 1, 'and bare ground is the ground', `${bare}`)
  ];
});

group('every body walks the same ground', async () => {
  window.__reset();
  window.__crew(2, 4, 0, 0);
  run(20);

  const gy = groundY();
  const left = state().rockLeftX, right = left + state().gw * 6;
  // Anybody at all, over the rock's footprint, at any time: nobody should ever
  // be *inside* the hill. This used to be true of miners only.
  // How far into the hill a body is allowed to be. Not nothing: feet follow the
  // ground at the pace of the walk and a half again (see CLIMB_SLOPE), so a body
  // arriving at a cliff face is briefly below the surface while it climbs it.
  // That is a climb, and it is what a climb looks like. What it must never be is
  // the old behaviour -- a body at ground level in the middle of the footprint,
  // buried to well over its own height, for the whole width of the rock.
  // A body and a half. Measured at 24px worst case against a sheer face, and it
  // was 120px before -- a body at ground level in the middle of the hill. The
  // remaining lag is `climbTo` easing up a wall it cannot climb at walking pace;
  // see the review. This is a floor under the regression, not a target.
  const DEEP = 30;
  let deep = 0, over = 0, worst = 0;
  for (let i = 0; i < 900; i++) {
    run(1 / 60);
    for (const b of detail()) {
      const mid = b.x + 9;
      if (mid < left || mid > right) continue;
      const surf = window.__surface(mid);
      if (surf > gy - 6) continue;                     // no rock in this column
      const into = (b.y + 18) - surf;
      worst = Math.max(worst, into);
      if (into > DEEP) deep++;
      else over++;
    }
  }

  return [
    ok(over > 0, 'somebody crossed the hill', `${over} frames on it`),
    ok(deep === 0, 'and nobody was ever buried in it',
       `${deep} frames deeper than a body, worst ${Math.round(worst)}px`)
  ];
});
