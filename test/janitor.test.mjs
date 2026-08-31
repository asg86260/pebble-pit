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
  const offered = () => !!window.__upgrades().find(u => u.key === 'unlockouthouse')?.show();
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
