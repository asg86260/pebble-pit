// Getting about: the surface, the ways, and the one way out of a hole.
//
// These are the checks the yard did not have, and their absence is most of what
// this refactor was for. Every bug in the list that started it -- quarriers
// climbing out through the wall, a janitor standing inside a heap -- was a rule
// that existed in one place and was needed in four, and nothing anywhere said
// what the rule was. So each group below states one rule about *the world*
// rather than about one body's behaviour, which is what makes them hold for
// bodies nobody has written yet.

import { group, ok, state, run, runUntil } from './helpers.mjs';

import { S } from '../src/state.js';
import { stepQuarrier } from '../src/quarry.js';

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

// A yard with every reason a body has to leave the cut in a hurry, one after
// another: digging, a mess up top to be dropped for, a rock coming down to dance
// for. Each of those used to be its own path with its own idea of how to get out,
// and each of them used to walk somebody through the wall.
//
// There is nothing to assert here any more, and that is the point. This group
// used to build the yard and then watch it: forty seconds of settling and three
// twelve-second stretches sampled a frame at a time, comparing every quarrier's
// depth against the last frame's and reporting a crossing that did not happen at
// the ladder. That watch is now `verifyWorld` (see src/verify.js), and it runs on
// every frame of every group in the tier rather than on the seventy-six seconds
// this one could afford -- so what is left of the group is the interesting yard,
// built quickly and handed to the watcher that is already running.
group('nobody leaves the cut through the wall', async () => {
  window.__reset();
  window.__crew(2, 3, 4, 0);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__loo();
  window.__assign('janitors', 1);
  // Waited for rather than slept through: what the group is after is the crew
  // actually being down there, and how long the walk takes is somebody else's
  // check. It used to be forty seconds flat, which is the walk plus a margin for
  // the worst yard the chance could build.
  runUntil(() => state().underground > 0, 40);
  run(3);                                         // digging
  window.__muckSet(c => (c % 3 === 0 ? 3 : 0));   // a mess up top to be dropped for
  run(3);
  window.__next();                                // a rock coming down to dance for
  run(3);

  const down = state().underground;
  return [ok(down > 0, 'and there was somebody down there to do it wrong',
             `${down} in the cut`)];
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

  // What is left here is the shortest-path property, and only that: who climbs
  // the hill and who walks past it. Being *inside* the hill, and being under the
  // yard in front of it, were both counted in this loop too and are now rules
  // checked on every frame of every group in the tier (rules 1 and 2 in
  // src/verify.js), which is watching this run as well. Two of the six checks
  // below went with them, and the loop is half as long, because what is left is
  // a property a shorter look proves just as well: a hauler either takes the
  // crest as a shortcut or it does not.
  const climbed = new Set();       // who was ever up on the hill
  let crossed = 0, ramped = 0, worstFlat = 0;
  for (let i = 0; i < 900; i++) {
    run(1 / 60);
    for (const b of detail()) {
      const mid = b.x + 9, feet = b.y + 18;
      if (mid < left || mid > right) continue;
      const surf = window.__surface(mid);
      if (surf > gy - 6) continue;                  // no rock left in this column
      if (feet > gy + 1) continue;                  // under the yard: verify.js has it
      if (feet < gy - UP) {
        // Up on the hill, and it is there because its work is there.
        climbed.add(b.t);
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
       `worst ${Math.round(worstFlat)}px off the line`)
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
  //
  // Burial is measured against the *lowest* of the three columns a body stands
  // across, which is the same question `deepest` in src/verify.js asks and for
  // the same reason. It used to be measured against the single column under the
  // body's midpoint, and that read 20px on a gang at work while the climber had
  // in fact arrived -- `w.foot` sat exactly on its target on the worst frame of
  // the run. What the 20 was, was a miner standing on the column it is striking
  // (which is what a body working a face does, see `rockTopY(colAtX(...))` in
  // crew.js) with a two-cell spike left standing beside it, and the midpoint
  // happening to land on the spike. A body is not buried in a column it is
  // stood next to. Below even the lowest of them and there is nothing under any
  // part of it, which is the only thing burial can honestly mean.
  const under = x => {
    let low = -Infinity;
    for (let p = x; p < x + 18; p += cell) low = Math.max(low, window.__surface(p));
    return Math.max(low, window.__surface(x + 17));
  };
  let into = 0, jump = 0;
  let prev = detail();
  for (let i = 0; i < 600; i++) {
    run(1 / 60);
    const now = detail();
    for (let k = 0; k < now.length; k++) {
      const b = now[k], mid = b.x + 9, feet = b.y + 18;
      if (mid < foot || mid > foot + cols * cell || feet > gy - 6) continue;
      into = Math.max(into, feet - under(b.x));
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
    // and steps included, without anybody dropping through it. Measured at 8px
    // against the columns a body is actually standing on, and all 8 of it is
    // the miner's own bob and lunge -- a swing drives it down as much as
    // `P * 1.4` (see the miner's branch in crew.js) and it comes back up. So
    // the mark is that, with room for the bob on top of it, and anything over
    // it is a body genuinely under the rock rather than leaning into a swing.
    ok(into <= 12, 'and nobody on it is ever buried in the shape it is left with',
       `worst ${Math.round(into)}px into the face`),
    // A cell a frame is what `climbTo` allows, and the bob and the swing ride on
    // top of that. Anything much over it is a body being put on the new surface
    // rather than walking down to it -- a miner hopping down the hill a cell at
    // a time as the swings land, which is what easing is here to stop.
    ok(jump <= 12, 'and it walks down to the new surface rather than being put on it',
       `worst ${Math.round(jump)}px in a frame`)
  ];
});

// The hole is not a wall with a way round it: the ground past the far wall is
// reached by going through, and nothing but the shape of the world says so.
//
// This is what `downTheHole` used to be -- a five-state machine with its own
// ladder discipline, its own `w.side` and its own two-sided lip clamp, sitting
// beside a routing system that already had both of the pit's ladders in its
// links table. The rule stated here is about the world rather than about a
// hauler, so it holds for anything anybody sends out there later.
group('the ground past the hole is reached through it', async () => {
  window.__reset();
  window.__crew(0, 2);
  run(2);

  const s = state();
  const world = window.__ways();
  const holeLinks = world.links.filter(l => l.a === 'hole' || l.b === 'hole');
  const near = holeLinks.find(l => l.name === 'near pit ladder');
  const far = holeLinks.find(l => l.name === 'far pit ladder');

  // Somebody standing in the yard, asked to get to the ground behind the hole.
  const out = window.__route(0, s.pitX + s.pitW + 40);

  return [
    ok(world.ways.includes('past'),
       'the strip behind the far wall is a way of its own', world.ways.join(' ')),
    ok(holeLinks.length === 2, 'the hole is joined to the world by its two ladders',
       JSON.stringify(holeLinks)),
    // Which ways each ladder joins is the whole of it. The near one is the only
    // edge between the yard and the pile; the far one is the only edge between
    // the pile and the ground beyond. Neither of them joins the two halves of
    // the floor, because nothing does -- there is a hole in between.
    ok(near && near.a === 'yard' && near.b === 'hole',
       'the near ladder is the only step down from the yard', JSON.stringify(near)),
    ok(far && far.a === 'past' && far.b === 'hole',
       'and the far one comes up on the ground behind', JSON.stringify(far)),
    // And the route that follows from that, with nobody told to climb anything.
    ok(out && out.legs.length === 5,
       'so getting out there is a walk, two climbs and two more walks',
       JSON.stringify(out)),
    ok(out && out.legs.some(l => l.includes('near pit ladder'))
           && out.legs.some(l => l.includes('far pit ladder')),
       'down one ladder and up the other', JSON.stringify(out && out.legs))
  ];
});

// A height belongs to a place, and a body is only ever put at one if it is
// standing at that place.
//
// The quarrier's work branch read the floor of the cut and assigned it, flatly,
// to whatever body was in the work state -- and nothing in the branch asked
// where the body was. Anything that leaves that state set while the body is
// somewhere else (picked up and put down, shoved along, sent off for a hat, a
// walk cut short) put a digger at the height of a hole thousands of pixels
// away and left it there, swinging, for as long as you watched. Reported from a
// browser run as a body sunk under the surface it was standing over for
// hundreds of frames.
//
// Stated as a rule about the world rather than about a quarrier: a body's
// standing height comes from the way it is on. If the state a body is in
// disagrees with where the body is, it is the state that is wrong.
group('a body is never put at the height of a hole it is not in', async () => {
  window.__reset();
  window.__crew(0, 0, 2);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  runUntil(() => state().underground > 0, 40);      // somebody down the cut, digging

  const w = S.workers.find(o => o.type === 'quarrier');
  // Up on the hill, a long way from the cut, and still on the digging job.
  const onRock = state().rockLeftX + state().gw * 3;
  const top = window.__surface(onRock + 9);
  w.x = onRock;
  w.y = top - 18;
  w.foot = w.footAt = null;
  w.goal = 'work';
  w.route = null;
  stepQuarrier(w, 0);
  const feet = w.y + 18;

  return [
    ok(top < groundY() - 12, 'the spot picked is genuinely up the hill',
       `${top} against a ground line of ${groundY()}`),
    ok(w.goal !== 'work', 'a body outside the cut is not digging, whatever it was on',
       `${w.goal}`),
    ok(feet <= top + 8, 'and it is standing on the hill rather than inside it',
       `feet ${Math.round(feet)} against a surface of ${top}`)
  ];
});
