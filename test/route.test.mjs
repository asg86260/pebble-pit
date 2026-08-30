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

group('the hill is a workplace, not a road', async () => {
  window.__reset();
  window.__crew(2, 4, 0, 0);
  run(20);
  // A mess laid out on the bare ground away to the left of the hill, so the
  // haulers have a reason to walk the width of the yard and cross the footprint
  // on the way. Without it they work the pile and the hole, which are both on
  // the same side of the rock, and the check below has nothing to look at.
  const left = state().rockLeftX, right = left + state().gw * 6;
  window.__muckSet(c => (c * 6 < left - 60 && c % 4 === 0 ? 3 : 0));
  run(4);

  const gy = groundY();
  // What counts as being up on the hill rather than in front of it. A few
  // pixels, because the flanks come down to the ground line and a body at the
  // very toe of the rock is standing on both.
  const UP = 6;
  // And how far into the face a body up on it is allowed to be. Feet follow the
  // surface at the pace of the walk and a half again (see CLIMB_SLOPE), so a
  // body that has just met a sheer step is briefly inside it while it climbs.
  // A body and a half, measured at 24px worst case. This is a floor under the
  // regression rather than a target.
  const DEEP = 30;

  const climbed = new Set();       // who was ever up on the hill
  let crossed = 0, ramped = 0, deep = 0, sunk = 0, worst = 0, worstFlat = 0;
  const why = [];
  for (let i = 0; i < 1800; i++) {
    run(1 / 60);
    for (const b of detail()) {
      const mid = b.x + 9, feet = b.y + 18;
      if (mid < left || mid > right) continue;
      const surf = window.__surface(mid);
      if (surf > gy - 6) continue;                  // no rock left in this column
      if (feet > gy + 1) { sunk++; continue; }      // nobody is under the yard here
      if (feet < gy - UP) {
        // Up on the hill. Whoever it is, it is there because its work is there,
        // and it is standing on the face rather than inside it.
        climbed.add(b.t);
        const into = feet - surf;
        worst = Math.max(worst, into);
        if (into > DEEP) { deep++; if (why.length < 4) why.push(`${b.t} ${Math.round(into)}px in at ${b.x}`); }
        // A hauler has no business on the hill in this yard: the mess is all on
        // bare ground and the rock's pile is off the footprint. One up there is
        // one that took the crest as a shortcut.
        if (b.t === 'h') ramped++;
      } else if (b.t === 'h') {
        // A hauler in front of the hill, on the floor of the yard and at the
        // height of it. Haulers only, because they are the ones with no reason
        // ever to leave the ground here -- a miner passing through this band is
        // a miner walking down off the crest to a mess, and it is meant to be
        // between the two heights for the few frames that takes.
        crossed++;
        worstFlat = Math.max(worstFlat, Math.abs(feet - gy));
      }
    }
  }

  return [
    // The gang's work is on the rock, so the route to their stand goes up it.
    // Nothing tells them to climb: their stand is a place on the hill's surface,
    // so the shortest walk to it is a walk on to the hill.
    ok(climbed.has('m'), 'the gang climb the hill, because their work is on it',
       `up there: ${[...climbed].join('') || 'nobody'}`),
    // And everybody else goes past it. This is the whole of the bug: with the
    // hill in the yard's floor the shortest path across the yard went over the
    // summit, so every errand in the game ramped up and over a hill it had no
    // business on.
    ok(crossed > 0, 'and a hauler crossed the footprint on the ground',
       `${crossed} frames in front of it`),
    ok(ramped === 0, 'a hauler crossing the hill walks in front of it, not over it',
       `${ramped} frames up on the crest`),
    ok(worstFlat <= 1, 'and it stays on the ground line the whole way across',
       `worst ${Math.round(worstFlat)}px off the line`),
    // Neither of the two ways buries anybody: not in the rock, and not in the
    // ground the rock is standing on.
    ok(deep === 0, 'nobody up on the hill is ever buried in it',
       `${deep} frames deeper than a body, worst ${Math.round(worst)}px${why.length ? ` -- ${why.join(' / ')}` : ''}`),
    ok(sunk === 0, 'and nobody in front of it is ever under the yard', `${sunk} frames`)
  ];
});

group('the way over the hill is the hill that is left', async () => {
  window.__reset();
  window.__crew(4, 0, 0, 0);
  run(20);

  // The rock as it stands once the gang have been at it a while: the crest is
  // down, the flanks are chewed, and the outline is nothing like the one it
  // landed with. Everything below is asked of *that* shape, because a way whose
  // span or surface was written down when the rock arrived is a way over rock
  // that is not there any more.
  run(90);

  const gy = groundY(), cell = 6;
  const foot = state().rockLeftX, cols = state().gw;
  const world = window.__ways();
  const flanks = world.links.filter(l => l.a === 'rock' || l.b === 'rock');

  // Where the rock still reaches, read off the surface a column at a time --
  // the same question `rockSpan` asks of the columns, asked here of the answer
  // the surface gives, so the two cannot agree by sharing a mistake.
  let lo = null, hi = null;
  for (let c = 0; c < cols; c++) {
    if (window.__surface(foot + c * cell + cell / 2) < gy - 1) { if (lo === null) lo = c; hi = c; }
  }
  const alive = state().rock > 0;

  // And a body on it while the ground goes down under it. The gang are taking
  // the cells out from under their own feet and the outline they are standing on
  // is jagged -- craters where somebody has been working, spikes between them --
  // so there are two ways this can go wrong: a body sunk into a face it has not
  // climbed yet, and a body jumping to the new surface the frame a swing lands.
  // Both are measured, a frame at a time, because both take one frame.
  let into = 0, jump = 0;
  let prev = detail();
  for (let i = 0; i < 600; i++) {
    run(1 / 60);
    const now = detail();
    for (let k = 0; k < now.length; k++) {
      const b = now[k], mid = b.x + 9, feet = b.y + 18;
      if (mid < foot || mid > foot + cols * cell || feet > gy - 6) continue;
      into = Math.max(into, feet - window.__surface(mid));
      if (prev[k] && prev[k].t === b.t) jump = Math.max(jump, Math.abs(b.y - prev[k].y));
    }
    prev = now;
  }

  return [
    ok(alive && world.ways.includes('rock'), 'the hill is a way of its own while there is hill left',
       world.ways.join(' ')),
    ok(flanks.length === 2, 'joined to the yard at its two flanks and nowhere else',
       JSON.stringify(flanks)),
    // The span is the rock that is left, not the footprint it landed in. Mine a
    // flank away and the foot of the hill moves in, and the links move with it,
    // because they are worked out from the columns every time they are asked
    // for rather than remembered from when the rock came down.
    ok(lo !== null && flanks.some(l => Math.abs(l.x - (foot + lo * cell - 18)) < 1),
       'the near flank sits just clear of the leftmost rock that is left',
       `${JSON.stringify(flanks.map(l => l.x))} against ${lo === null ? '-' : foot + lo * cell - 18}`),
    ok(hi !== null && flanks.some(l => Math.abs(l.x - (foot + (hi + 1) * cell)) < 1),
       'and the far flank just clear of the rightmost',
       `${JSON.stringify(flanks.map(l => l.x))} against ${hi === null ? '-' : foot + (hi + 1) * cell}`),
    // And the walk over it tracks the outline as the outline changes, craters
    // and steps included, without anybody clipping through a spike of it. A body
    // and a half, measured at 23px, and the same floor-under-the-regression the
    // group above uses.
    ok(into <= 30, 'and nobody on it is ever buried in the shape it is left with',
       `worst ${Math.round(into)}px into the face`),
    // A cell a frame is what `climbTo` allows, and the bob and the swing ride on
    // top of that. Anything much over it is a body being put on the new surface
    // rather than walking down to it -- a miner hopping down the hill a cell at
    // a time as the swings land, which is what easing is here to stop.
    ok(jump <= 12, 'and it walks down to the new surface rather than being put on it',
       `worst ${Math.round(jump)}px in a frame`)
  ];
});
