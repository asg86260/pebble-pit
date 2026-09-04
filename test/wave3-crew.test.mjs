// Track B (crew) -- feedback3.md. Four items, three about a body's own
// behaviour and one about a real bug:
//
//   B1  one builder to a job, not three
//   B2  a builder at a busy site works rather than stands (a hammer now)
//   B3  a core banked off the lip is lobbed, not dropped
//   B4  a janitor is not starved of its own mess by a crowd on the shared kind
//
// B5, the mouth-crossing fix, has its own test file (muck-reach.test.mjs) and
// is not repeated here.

import { group, ok, state, run, runUntil, buyBuilt } from './helpers.mjs';
import { yard } from './helpers.mjs';
import { BUILD_GANG, BUILD_HAMMER_MS, BUILD_HAMMER_H, BUILD_HITS_MAX, BUILD_REST_MS,
         CORE_LOB_H, P, WORKER } from '../src/config.js';
import { bench } from '../src/state.js';

group('one builder to a bench rung, not a gang of three', async () => {
  window.__reset();
  window.__crew(0, 6);                    // six spare hands, all could pile on
  window.__grant({ dust: 90000 });
  window.__buy('carry');                  // a bench rung: kind 'rung', site 'bench'

  const buildersAt = () => yard.S.workers.filter(w => w.type === 'builder').length;
  run(2);                                 // long enough for the crowd to settle
  return [
    ok(BUILD_GANG === 1, 'the gang is one body, not three', `${BUILD_GANG}`),
    ok(buildersAt() <= 1, 'and no more than one is actually made a builder',
       `${buildersAt()} builders for six spare hands`)
  ];
});

// Rewritten with the hammer -- see "The building site" in DESIGN.md. B2's ask
// was that a builder at a busy site does something rather than standing there,
// and a hop was the first answer to it; a hop on a fixed beat reads as bouncing,
// so it swings now. What is still checked is B2's actual point: it climbs ON to
// the bench (its feet end on the bench's top edge, not the ground), it plainly
// moves, and it lunges into the work.
group('a builder at the bench hammers rather than stands', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ dust: 90000 });
  window.__buy('carry');
  // Give the one builder time to walk over and arrive.
  const arrived = runUntil(() =>
    yard.S.workers.some(w => w.type === 'builder' && w.site === 'bench' && w.goal === 'at'), 30);
  const b = yard.S.workers.find(w => w.type === 'builder');

  // Filmed a frame at a time: where its feet are, relative to the bench's own
  // top edge, over a few whole hops.
  const grounded = bench.y - WORKER;         // feet planted on the bench's top
  let lo = Infinity, hi = -Infinity, sawLunge = false;
  // A whole burst and the pause after it, so the film is guaranteed to contain
  // several complete swings however the burst length rolls.
  const secs = (BUILD_HAMMER_MS * (BUILD_HITS_MAX + 1) + BUILD_REST_MS * 2) / 1000;
  for (let f = 0; f < Math.round(secs * 60); f++) {
    run(1 / 60);
    lo = Math.min(lo, b.y);
    hi = Math.max(hi, b.y);
    if (b.lunge > 0.9) sawLunge = true;
  }
  window.__crew(0, 0);

  return [
    ok(arrived, 'the one builder gets to the bench', `site ${b.site}, goal ${b.goal}`),
    // It comes down on the bench's own top edge, not the ground -- climbing on
    // is the whole of B2's ask.
    ok(Math.abs(hi - grounded) < 1, 'it lands on the bench, feet on its top edge',
       `${hi} vs ${grounded}`),
    // A hammer's dip (BUILD_HAMMER_H), which is deliberately under a cell and
    // well under the dance's three -- and plainly moving: a body that never
    // left the ground is a body standing still with extra words around it.
    ok(hi - lo > P * BUILD_HAMMER_H * 0.6 && hi - lo < P * (BUILD_HAMMER_H + 1.5),
       'it drives down about a hammer\'s dip, not a hop',
       `${(hi - lo).toFixed(1)}px of travel`),
    ok(sawLunge, 'and there is a lunge at the bottom of the swing', `lunge ${b.lunge}`)
  ];
});

// A body works a patch: a few blows here, a step along, a few more. On the open
// ground beside a building site the patch is ten cells of yard, which is fine.
// The bench top is twelve cells of timber on two legs, and the same ten-cell
// patch walked the body clean off the near end of it to hammer at thin air.
// The patch is the footing now -- see `jigSpan` in crew.js -- so this asks the
// only question that matters: over a long spell of work, does any part of the
// body ever leave the slab?
group('a builder at the bench stays on the bench top', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ dust: 90000 });
  window.__buy('carry');
  const builder = () => yard.S.workers.find(w => w.type === 'builder');
  // Working, not still walking over: the jig is what moves it about, and a body
  // still crossing the yard is nowhere near the bench to begin with.
  const arrived = runUntil(() => { const b = builder(); return !!b && b.goal === 'at' && b.jigAt != null; }, 30);

  // Long enough for many bursts, so the film covers the patch end to end rather
  // than whichever couple of cells the first burst happened to take.
  let lo = Infinity, hi = -Infinity;
  for (let f = 0; f < 600; f++) {
    run(0.1);
    const b = builder();
    if (!b || b.jigAt == null) continue;
    lo = Math.min(lo, b.x);
    hi = Math.max(hi, b.x + WORKER);
  }
  window.__crew(0, 0);

  return [
    ok(arrived, 'the builder gets on the bench and starts work', `lo ${lo}`),
    ok(lo >= bench.x, 'no part of it goes off the near end',
       `${Math.round(bench.x - lo)}px past the left edge`),
    ok(hi <= bench.x + bench.w, 'nor off the far end',
       `${Math.round(hi - (bench.x + bench.w))}px past the right edge`)
  ];
});

group('the bench rung still finishes at the same rate, swing or no swing', async () => {
  // B2 says the animation costs nothing: `workFor`/`handsAt` never ask where a
  // body's feet are. Proven the direct way -- build the same rung twice, once
  // watched frame by frame (forcing the jig to run every tick) and once fast
  // -- and check they land in the same span of ticks.
  const building = () => Object.values(state().works || {}).some(w => w.key === 'carry');

  window.__reset();
  window.__crew(0, 2);
  window.__grant({ dust: 90000 });
  window.__buy('carry');
  let secsFast = 0;
  while (building() && secsFast < 240) { run(1); secsFast++; }
  const doneFast = !building();
  window.__crew(0, 0);

  window.__reset();
  window.__crew(0, 2);
  window.__grant({ dust: 90000 });
  window.__buy('carry');
  let framesFramed = 0;
  while (building() && framesFramed < 240 * 60) { run(1 / 60); framesFramed++; }
  const doneFramed = !building();
  const secsFramed = Math.round(framesFramed / 60);
  window.__crew(0, 0);

  return [
    ok(doneFast, 'the rung finishes at all, run a second at a time', `${secsFast}s`),
    ok(doneFramed, 'and finishes watched a frame at a time too', `${secsFramed}s`),
    // The animation is decorative: `workFor`/`handsAt` never ask where a
    // body's feet are, so the same rung should take the same span of seconds
    // whether the jig is ticked once a second or sixty times.
    ok(Math.abs(secsFast - secsFramed) <= 2,
       'the same work, watched a second at a time or a frame at a time',
       `${secsFast}s vs ${secsFramed}s`)
  ];
});

group('a core off the lip is lobbed, not dropped', async () => {
  window.__reset();
  window.__crew(0, 1);
  // The opening rock is still in the air on the frame after a reset, and the
  // whole yard stops for one -- see the celebrate stage in crew.js. A body
  // waiting out a fall is not tipping anything, and this check is about the arc
  // rather than about who is allowed to throw when. So the fall lands first.
  runUntil(() => yard.S.rockFall === 0, 5);
  const w = yard.S.workers.find(o => o.type === 'hauler');

  // Handed a core and walked right up to the lip, so the very next frame is
  // the toss.
  w.carry = 0; w.load = []; w.hasCore = true; w.goal = 'dump';
  w.x = yard.pit.x - WORKER - 0.4;
  yard.S.coreItem = null;
  yard.S.cores = 0;

  run(1 / 60);
  const thrown = yard.S.coreItem;
  const bankedOnRelease = yard.S.cores;

  // The peak of the arc: keep stepping while it climbs (vy negative) and stop
  // the frame it turns to come back down.
  let peak = thrown ? thrown.y : null;
  let frames = 0;
  while (yard.S.coreItem && yard.S.coreItem.vy < 0 && frames < 600) {
    run(1 / 60);
    if (yard.S.coreItem) peak = Math.min(peak, yard.S.coreItem.y);
    frames++;
  }
  const groundY = state().groundY;
  const landed = runUntil(() => !yard.S.coreItem, 30);
  window.__crew(0, 0);

  return [
    ok(!w.hasCore, 'the hands are empty the moment it is thrown', `${w.hasCore}`),
    ok(!!thrown, 'and something is now in the air', `${thrown}`),
    ok(bankedOnRelease === 0, 'not banked on the way out of the hand', `${bankedOnRelease}`),
    // "About ninety": the arc is thrown from hand height, a body's height above
    // the ground already, so the peak is asked for within a body and a half of
    // the number rather than to the pixel.
    ok(peak != null && Math.abs((groundY - peak) - CORE_LOB_H) < WORKER * 1.5,
       'the arc peaks about ninety world pixels above the lip',
       `${peak == null ? 'never left the ground' : (groundY - peak).toFixed(0)}px`),
    ok(landed, 'and it comes down'),
    ok(state().cores === 1, 'banked when it lands, not before', `${state().cores}`)
  ];
});

group('a janitor is not starved of its own mess by a crowd on the shared kind', async () => {
  // Reproduction: a swarm of haulers with nothing better to do also work
  // ordinary muck (their own job, when there is no dust to fetch), and with
  // enough of them the nearest column for anybody's search is always
  // wherever the crowd has not yet reached -- which drifts away from a
  // janitor's own patch of poop rather than towards it, because `nearestMuck`
  // used to treat every kind alike. Poop is the one mess only a janitor may
  // touch; it should never lose out to muck everybody else can work instead.
  window.__reset();
  window.__loo(true);
  window.__crew(0, 16);
  window.__air({ janitors: 1, haze: 6, muck: 6 });
  window.__clearFloor();

  const outX = state().outhouseX;
  const poopCol = Math.round((outX - 500) / 6);
  window.__poopSet(c => (c === poopCol ? 4 : 0));

  // Thirty seconds rather than twenty. The window was set when the rock hands alone
  // stopped for a celebration; the whole crew stops now, which is a few per cent
  // of every body's day, and it moves where sixteen idle hands are standing when
  // the janitor looks around. The slowest seed measured clears at twenty-five.
  // What is being asked has not moved -- the poop is cleared rather than left
  // for ever, which is what B4 is about, and it holds on every seed tried.
  const cleared = runUntil(() => state().smog.poop === 0, 30);
  window.__crew(0, 0);

  return [
    ok(cleared, 'the poop actually gets cleared, not just chased at',
       `${state().smog.poop} left after twenty seconds`)
  ];
});
