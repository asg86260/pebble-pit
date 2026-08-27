// The meteor, and the one body that can get to it.
//
// Everything here is about the yard rather than the page, so it runs against
// `step` in node with no browser anywhere. What it is checking is that the sky
// is a place work happens in and not a picture: a rock that comes apart, a rind
// that pays dust and a core that pays sparks, somebody who walks and climbs to
// get there, and a hat without which none of it happens at all.

import { group, ok, state, run, runUntil, yard, P, WORKER } from './helpers.mjs';

const wizards = () => state().workerPos.filter(p => p[0] === 'w');
const wizardY = () => state().wizardY;

group('the tower calls a meteor down, and it is a rock like any other', async () => {
  window.__crew(0, 0);
  const bare = state();
  window.__meteor();
  const called = state();
  // nobody up there to work it, so it stays exactly as it arrived
  run(20);
  const still = state();
  window.__crew(0, 0);
  return [
    ok(!bare.meteorOpen && bare.meteor === 0, 'a new yard has an empty sky',
       `${bare.meteor} cells up there`),
    ok(called.meteorOpen && called.meteor > 60,
       'and the tower puts a whole one in it', `${called.meteor} cells`),
    ok(called.meteorRind > 0 && called.meteorCore > 0,
       'grey on the outside and red in the middle',
       `${called.meteorRind} rind, ${called.meteorCore} core`),
    ok(called.meteorCore < called.meteorRind,
       'and more rind than core, so the red is a thing you dig down to',
       `${called.meteorRind} to ${called.meteorCore}`),
    ok(still.meteor === called.meteor,
       'and nothing happens to it on its own: the sky is work, not weather',
       `${called.meteor} -> ${still.meteor}`)
  ];
});

group('no hat, no flying', async () => {
  window.__meteor();
  // a body on the job with nothing on its head. The tower has made no hats, so
  // there is nowhere for it to have got one.
  window.__crew(0, 1);
  yard.S.wizardHats = 0;
  yard.S.wizards = 1;
  yard.S.crew = 1;
  window.__build();
  run(6);
  const bare = state();
  const wasMeteor = bare.meteor;
  run(30);
  const later = state();

  // and now a hat, from the tower
  window.__wizardHat(1);
  window.__crew(0, 0, 0, 0, 0, 1);
  const rose = runUntil(() => state().aloft > 0, 60);
  const up = state();
  const worked = runUntil(() => state().meteor < wasMeteor, 90);

  window.__crew(0, 0);
  return [
    ok(later.meteor === wasMeteor,
       'a body with no hat does not touch the sky',
       `${wasMeteor} -> ${later.meteor} cells`),
    ok(later.aloft === 0, 'and does not leave the ground', `${later.aloft} up there`),
    ok(rose && up.aloft > 0, 'with a hat on, it goes up', `${up.aloft} aloft`),
    ok(up.wizardY.every(y => y < up.groundY),
       'and it is really up there, not standing on the ground line',
       `${up.wizardY.join()} against a ground line at ${up.groundY}`),
    ok(worked, 'and takes the meteor apart', `${state().meteor} cells left`)
  ];
});

group('a wizard walks and climbs, and never simply appears at the sky', async () => {
  window.__meteor();
  window.__wizardHat(1);
  // Everybody on the ground and settled first. A body put on this straight off
  // the rock climbs down off the rock before it walks anywhere, which is the
  // yard working -- and it is not what this group is watching.
  window.__crew(0, 2);
  run(8);
  window.__crew(0, 1, 0, 0, 0, 1);
  // Watched all the way up rather than sampled at the ends: the whole claim is
  // that it travels, and a before and an after cannot tell a climb from a jump.
  const seen = [];
  for (let i = 0; i < 200; i++) {
    run(0.25);
    const y = wizardY()[0];
    if (y != null) seen.push(y);
    if (state().aloft > 0 && y < state().meteorY + 60) break;
  }
  const s = state();
  // A quarter of a second of floating is about twenty pixels, so anything over
  // twice that is not a body travelling -- it is a body arriving.
  const jumps = seen.slice(1).filter((y, i) => Math.abs(y - seen[i]) > 45);
  window.__crew(0, 0);
  return [
    ok(seen.length > 20, 'it is watched the whole way', `${seen.length} samples`),
    ok(seen[0] >= s.groundY - WORKER - 2,
       'it starts with its feet on the ground', `${seen[0]}`),
    ok(Math.min(...seen) < s.groundY - 200,
       'and gets a long way off it', `${Math.min(...seen)} against ${s.groundY}`),
    ok(jumps.length === 0,
       'and every pixel of that is travelled: no step is a leap',
       `${jumps.length} leaps over 45px`)
  ];
});

group('the rind is dust and the core is sparks', async () => {
  window.__meteor();
  window.__wizardHat(2);
  window.__clearFloor();
  window.__crew(0, 3, 0, 0, 0, 2);
  const started = state();

  // through the rind first: nothing red comes down while there is grey on it
  const rindGone = runUntil(() => state().meteorRind === 0, 400);
  const grey = state();
  const dropped = grey.floor;

  // and then the core, which is the only thing in the game that is red
  const cleared = runUntil(() => state().meteor === 0, 300);
  const banked = runUntil(() => state().sparks > 0, 200);
  const s = state();

  // and the sky fills again on its own, without another purchase
  const again = runUntil(() => state().meteor > 0, 200);
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(rindGone, 'the rind comes off first', `${grey.meteorRind} left`),
    ok(dropped > 100, 'and what comes off it lands in the yard as dust',
       `${dropped} grains on the floor`),
    ok(started.sparks === 0 && grey.sparks === 0,
       'with nothing red banked while there was still grey up there',
       `${grey.sparks} sparks`),
    ok(cleared, 'then the core goes too', `${s.meteor} cells left`),
    ok(banked && s.sparks > 0 && s.seenSpark,
       'and the red is fetched off the ground and banked like anything else',
       `${s.sparks} sparks`),
    ok(again, 'and another one drifts in afterwards', `${state().meteor} cells`)
  ];
});

group('the sky holds one body per hat, and they do not stand in each other', async () => {
  window.__meteor();
  window.__wizardHat(1);
  // Three bodies and one hat, put on by the same button the player uses -- which
  // is the one that has to say no, because the hook that hires a crew hands out
  // the hats to go with it.
  window.__crew(0, 3);
  window.__assign('wizards', 3);
  run(2);
  const capped = state();

  window.__wizardHat(2);                  // two more hats
  window.__assign('wizards', 2);
  runUntil(() => state().aloft === 3, 90);
  const up = state();
  const spots = wizards();
  const apart = spots.every((p, i) => spots.every((q, j) => {
    if (i === j) return true;
    const [ax, ay] = p.split(':')[1].split(',').map(Number);
    const [bx, by] = q.split(':')[1].split(',').map(Number);
    return Math.hypot(ax - bx, ay - by) > WORKER / 2;
  }));

  window.__crew(0, 0);
  return [
    ok(capped.wizards === 1, 'no more bodies in the sky than there are hats',
       `${capped.wizards} up on ${capped.wizardHats} hat`),
    ok(up.wizards === 3 && up.aloft === 3, 'three hats, three of them up there',
       `${up.wizards} on ${up.wizardHats}`),
    ok(apart, 'each on its own patch of it, rather than all on one cell',
       spots.join(' '))
  ];
});

group('a wizard taken off the sky comes down', async () => {
  window.__meteor();
  window.__wizardHat(1);
  window.__crew(0, 1, 0, 0, 0, 1);
  runUntil(() => state().aloft > 0, 90);
  const up = state();

  window.__crew(0, 2);                    // both of them carrying dust now
  const down = runUntil(() => state().aloft === 0 &&
    state().workerPos.every(p => +p.split(':')[1].split(',')[1] >= state().groundY - WORKER - 4), 60);
  const after = state();
  window.__crew(0, 0);
  return [
    ok(up.aloft === 1, 'one up there to begin with', `${up.aloft}`),
    ok(down, 'and it is on the ground once it is taken off the job',
       after.workerPos.join(' ')),
    ok(after.wizards === 0 && after.wizardHats === 1,
       'and the hat stays at the tower for whoever is sent next',
       `${after.wizardHats} on the stand`)
  ];
});

group('the sky is saved as it was left', async () => {
  window.__meteor();
  window.__wizardHat(1);
  window.__crew(0, 1, 0, 0, 0, 1);
  runUntil(() => state().meteor < 150, 300);
  const before = state();
  window.__reload();
  const after = state();
  window.__crew(0, 0);
  return [
    ok(before.meteor > 0 && before.meteor < 161,
       'a meteor part way through being worked', `${before.meteor} cells`),
    ok(after.meteor === before.meteor,
       'comes back the same size it was closed on',
       `${before.meteor} -> ${after.meteor}`),
    ok(after.wizardHats === before.wizardHats && after.meteorOpen,
       'and the tower still has its hat and its sky',
       `${after.wizardHats} hats, open ${after.meteorOpen}`)
  ];
});
