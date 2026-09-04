// Two kinds of mess, and they are not the same job.
//
// What the sky drops is weather: it lands on everybody's yard and everybody
// clears it, the way they always have. What a body leaves behind is a body's
// own, and shovelling that is a *post* -- it lies where it fell until you put
// somebody on it, and there is nobody to put on it until the outhouse is up.
// Which is what the shed buys: not a tidier yard, but the job.

import { yard, group, ok, state, run, runUntil, openSites } from './helpers.mjs';
import { P, WORKER, IDLE_PACE, AT_POST, COMMUTE_PACE } from '../src/config.js';
import { outhouse } from '../src/state.js';
import { muckLeft } from '../src/smog.js';

group('what a body leaves lies there until somebody is put on it', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);            // so they go while we are watching
  // no rain in this one: the sky is what everybody clears, and this is about the
  // other stack
  window.__air({ haze: 0, muck: 0 });
  run(60);
  const left = state().smog;
  run(120);
  const later = state().smog;

  window.__reset();
  return [
    ok(left.poop > 0, 'a crew with nowhere to go leaves a mess', `${left.poop} cells`),
    ok(later.poop >= left.poop,
       'and nobody clears it, however long they have to think about it',
       `${left.poop} -> ${later.poop}`),
    ok(later.muck.all >= later.poop,
       'and it counts as mess on the ground like anything else',
       `${later.muck.all} of mess, ${later.poop} of it theirs`)
  ];
});

group('the shed buys the job, and the janitor does it', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(90);
  const messy = state();

  // the shed, and somebody on it
  window.__loo(true);
  window.__air({ janitors: 1 });
  const put = state();
  run(180);
  const swept = state();

  window.__reset();
  return [
    ok(messy.smog.poop > 0, 'there is something to clear up', `${messy.smog.poop} cells`),
    ok(messy.janitors === 0 && put.janitors === 1,
       'nobody can be put on it until the shed is up',
       `${messy.janitors} -> ${put.janitors}`),
    ok(swept.smog.poop < messy.smog.poop,
       'and once somebody is, it goes', `${messy.smog.poop} -> ${swept.smog.poop}`)
  ];
});

group('the shed is offered once the yard is in a state', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(0.2);                                    // a frame, so the readings are this yard's
  const clean = state();
  // Asked of every row in the game rather than of the bench's list. The outhouse
  // is sold at the janitor's closet now, not on the bench -- see src/closet.js --
  // and what this group is about is *when* it is offered, which is the same
  // question wherever the row is drawn.
  const offered = () => !!window.__rows().find(r => r.key === 'unlockouthouse')?.shown;
  const before = offered();
  run(120);
  const after = offered();
  window.__reset();
  return [
    ok(clean.smog.poop === 0, 'a new yard is clean', `${clean.smog.poop}`),
    ok(!before, 'and the shed is not on the board yet'),
    ok(after, 'five patches of it later, it is')
  ];
});

// Nobody ever ends up nowhere.
//
// The janitor was given something to do while it waits, read a sway phase that
// nothing had given it, and multiplied its position by the sine of `undefined`.
// A body at NaN is a body nowhere -- it vanishes off the yard, and asking the
// view to follow it takes you to an empty white corner of the world.
//
// Both halves of that -- a body without a rhythm, and a body at a position that
// is not a number -- are rule 6 in src/verify.js now, checked on every frame of
// every group in the tier rather than on the forty seconds this one bought. So
// this group no longer watches: it builds the one thing the watcher cannot build
// for itself, which is a yard with every trade in it at once. That was always
// the load-bearing part -- the cause was a per-trade habit, some factories
// handing out a rhythm and some not -- and it is why the group is here rather
// than in a file about one job.
group('every body has a rhythm, and none of them ends up nowhere', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(2, 2, 3, 3, 0, 1);
  window.__loo();
  window.__assign('janitors', 1);
  window.__air({ muck: 40 });
  run(6);

  const types = [...new Set(yard.S.workers.map(w => w.type))];
  window.__crew(0, 0, 0);
  return [
    ok(types.length >= 4, 'a yard with several trades in it, all of them moving',
       types.join(','))
  ];
});

// A janitor with nothing to shovel is loitering, and loitering is a walk it
// does on purpose. What it is not is a walk it is pulled back out of.
//
// This is measured rather than described, because the fault it is here about
// was a single frame long and read as a stutter: the idle wandered up to five
// cells off the post, the branch above it walked back to the post at a commute
// the moment the body was more than three cells off, and the two took turns --
// fifteen frames of amble at IDLE_PACE and then a fourteen-pixel snap, four
// times a second, for ever. Neither branch was wrong on its own; they were two
// answers to "am I at my post" with different numbers in them. See `AT_POST` in
// config.js, which is now the one answer, worked out from the wander itself.
//
// So the rule is about a pace and not about a place: **while a body is idling,
// nothing moves it faster than idling.** That holds however far the wander is
// allowed to reach, which is the part the constant would otherwise be free to
// break again.
group('a janitor with nothing to do loiters, and is not yanked back', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__loo(true);
  // Back to how often a body is *actually* due. `tune` writes the binding in
  // config.js and a reset does not put it back, so the groups above -- which
  // wind it down to four seconds to make a mess worth watching -- are still in
  // force in this process. Without this the yard fouls faster than one janitor
  // can sweep it and there is no idle to look at.
  window.__tune('LOO_EVERY', 600000);
  window.__air({ janitors: 1, haze: 0, muck: 0 });
  run(60);
  // Nothing to do is the premise, so the yard is swept before the clock starts:
  // the crew have been going for a minute by now and a janitor with a patch to
  // clear is a janitor legitimately walking. Then long enough to walk home,
  // which it does on its own legs like everybody else.
  window.__muckSet(() => 0);
  window.__poopSet(() => 0);
  run(30);

  const janitor = () => yard.S.workers.find(w => w.type === 'janitor');
  const j = janitor();
  // The post itself, off the shed, rather than wherever the body happens to be
  // standing when the clock starts -- it may be part way back from an errand.
  // This is `stationX('janitor')`, which is not exported and is one line.
  const post = outhouse.x + outhouse.w / 2 - WORKER / 2;

  // Only the frames it is genuinely loitering count, and that is two conditions,
  // both of them needed. There has to be nothing on the ground -- a body goes to
  // the shed, so a fresh patch lands *at the post*, well inside any band drawn
  // round it, and the walk to that is an errand at a commute and is meant to be.
  // And it has to be inside the band the idle owns, which is where the fault
  // lived: the yank fired at three cells while the wander reached five, so every
  // one of those frames is in here.
  let was = j.x, worst = 0, far = 0, idled = 0;
  for (let i = 0; i < 3600; i++) {
    const clean = muckLeft() === 0;
    run(1 / 60);
    const at = janitor().x;
    if (clean && muckLeft() === 0 &&
        Math.abs(at - post) <= AT_POST && Math.abs(was - post) <= AT_POST) {
      idled++;
      worst = Math.max(worst, Math.abs(at - was));
      far = Math.max(far, Math.abs(at - post));
    }
    was = at;
  }

  window.__reset();
  return [
    ok(j != null, 'somebody is on the shed'),
    ok(idled > 1200, 'and it spends a good part of its day standing about the shed',
       `${idled} frames of 3600`),
    // Half a commute is a wide mark on purpose: what it is telling apart is an
    // amble from a walk, and a walk is an order of magnitude quicker.
    ok(worst <= COMMUTE_PACE / 2, 'nothing moves it quicker than an amble while it idles',
       `worst ${worst.toFixed(2)}px in a frame, an amble is ${IDLE_PACE}`),
    // And it does still drift, because a body that never moves reads as one the
    // game has forgotten about.
    ok(far > P, 'and it drifts about the shed rather than standing on the spot',
       `${Math.round(far)}px off the post, allowed ${AT_POST}`)
  ];
});

group('a claim on a mess keeps its elbows out', async () => {
  window.__reset();
  window.__crew(0, 4);
  window.__loo();
  window.__assign('janitors', 2);
  // An earlier group tunes LOO_EVERY down to seconds and a tuned constant
  // outlives the reboot (see the note in sky-readout): four bodies on a
  // four-second bladder spend the window queuing, not claiming.
  window.__tune('LOO_EVERY', 600000);
  run(10);
  // One patch, thirty columns wide, and four pairs of hands sent at it: the
  // haulers may shift weather and the janitors everything, so everybody comes.
  window.__muckSet(c => (c > 338 && c < 368) ? 3 : 0);   // bare yard between the farm and the quarry

  // `nearestMuck` reserves a body's width either side of a claim -- but that
  // reservation used to live only in the frame the claim was made: the rebuild
  // carried the claimed column forward without its elbows, so from the next
  // frame a fresh body could book the cell beside a held claim, and the crew
  // bunched and jostled over one spot. Sampled every frame of the clear-up:
  // no two held claims may ever stand closer than the elbow.
  let worst = Infinity;
  for (let i = 0; i < 60 * 12 && muckLeft() > 0; i++) {
    run(1 / 60);
    const claims = yard.S.workers.filter(w => w.muckAt != null)
                                 .map(w => w.muckAt).sort((a, b) => a - b);
    for (let k = 1; k < claims.length; k++) worst = Math.min(worst, claims[k] - claims[k - 1]);
  }
  const { MUCK_ELBOW } = await import('../src/smog.js');
  window.__reset();

  return [
    ok(worst !== Infinity, 'more than one body claimed at once', `${worst}`),
    ok(worst > MUCK_ELBOW, 'and no two claims ever stood inside each other\'s elbows',
       `closest pair ${worst} columns, elbow ${MUCK_ELBOW}`)
  ];
});

// The elbow that keeps two shovels apart has to be able to move a body.
//
// A body settling on to a heap plants its feet on a whole cell -- otherwise what
// you see is a shape creeping a fraction of a pixel a frame with its lunge
// pinned at full, which reads as a progress bar in a hat. That snap was done to
// the body's own x, and the elbow that parts a pair standing in each other
// nudges by about a third of a pixel: the round put it straight back, every
// frame, for as long as the two of them stood there. The nudge could never add
// up to anything, so two bodies on the last patch of a clear-up shovelled
// through one another until the heap ran out.
//
// The same fractional-rounding trap balloon.js writes up over its craft: a thing
// that moves less than a pixel a frame has to remember the part of a pixel it
// has moved.
group('a shoveller with somebody in its elbow moves off the spot', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__loo(true);
  window.__air({ janitors: 3, haze: 0 });
  window.__clearFloor();
  run(3);

  // A yard under muck, clear of the pit's mouth -- getting down there is a route
  // of its own, and this is about standing on the ground beside a heap.
  const lip = Math.round(state().pitX / P);
  const heap = () => window.__muckSet(c => (!window.__overPit(c) && c > lip + 5 ? 8 : 0));
  heap();

  const shovelling = () => yard.S.workers.find(w =>
    w.type === 'janitor' && w.goal === 'muck' && w.muckAt != null &&
    !w.route && !w.walking && w.x % P === 0);
  const came = runUntil(() => { heap(); return !!shovelling(); }, 60);
  const jan = shovelling();
  const other = came ? yard.S.workers.find(w => w !== jan) : null;
  const from = jan ? jan.x : 0;

  // ...and somebody else stood in exactly its place, on the same errand: the end
  // of a clear-up, where the last patch is claimed and a second body comes for
  // it anyway.
  for (let i = 0; i < 40 && other; i++) {
    heap();
    other.goal = 'muck';
    other.x = jan.x;
    other.y = jan.y;
    run(0.1);
  }
  const moved = jan ? Math.abs(jan.x - from) : 0;

  window.__air({ janitors: 0 });
  window.__crew(0, 0);
  return [
    ok(came && !!other, 'a janitor is stood at a heap with somebody at its elbow'),
    // Before this was fixed it managed one frame's worth -- a third of a pixel --
    // and then sat there for ever. A body is eighteen wide, and clear of the
    // other body is the whole point of the elbow.
    ok(moved >= WORKER, 'four seconds of elbowing gets it clear of the other one',
       `${moved.toFixed(2)}px off the spot it started on`),
    // An elbow and not a walk. The nudge is about a third of a pixel a frame, so
    // four seconds of it is a stride or two -- a body that had simply set off
    // somewhere would be several hundred pixels away and would pass the check
    // above for the wrong reason.
    ok(moved < 120, 'and it stepped aside rather than walking off',
       `${moved.toFixed(2)}px`)
  ];
});
