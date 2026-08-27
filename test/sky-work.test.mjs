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

// The whole star is worth sparks -- crust and fire alike -- and the fire is
// worth more of them. The crust paid dust for a while, which had grey grains
// coming out of a red star: the picture arguing with itself.
group('the whole star pays sparks, and the core pays most', async () => {
  window.__meteor();
  window.__wizardHat(2);
  window.__clearFloor();
  window.__crew(0, 3, 0, 0, 0, 2);
  const started = state();

  // the crust first, which is what they can reach
  const rindGone = runUntil(() => state().meteorRind === 0, 400);
  const grey = state();
  const crustSparks = grey.sparks;
  const dust = grey.stored - started.stored;

  // and then the fire under it
  const cleared = runUntil(() => state().meteor === 0, 300);
  runUntil(() => state().sparks > crustSparks, 200);
  run(60);                                   // long enough to fetch what fell
  const s = state();

  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(rindGone, 'the crust comes off first', `${grey.meteorRind} left`),
    ok(crustSparks > 0 && grey.seenSpark,
       'and it pays sparks, not dust', `${crustSparks} sparks off the crust`),
    ok(dust < 30, 'with next to no dust out of the sky at all',
       `${dust} dust while the crust came off`),
    ok(cleared, 'then the fire goes too', `${s.meteor} cells left`),
    ok(s.sparks > crustSparks,
       'and the red is fetched off the ground and banked like anything else',
       `${crustSparks} -> ${s.sparks} sparks`)
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

// The tower takes its time over a hat, and says so while it does. What is
// checked here is the waiting itself: the row is bought once, nothing arrives on
// the spot, the progress runs from nought to one, and a hat lands at the end of
// it. The bar over the tower and the windows lighting up the shaft are drawn
// off exactly these two numbers -- see `drawTowerBar`.
group('a hat is worked on, and the tower says how far along it is', async () => {
  window.__meteor();
  const bare = state();
  const secs = window.__brew();
  const started = state();
  run(secs / 4);
  const quarter = yard.brewAt();
  run(secs / 2);
  const most = yard.brewAt();
  const landed = runUntil(() => state().wizardHats > bare.wizardHats, secs * 2);
  const after = state();
  return [
    ok(bare.wizardHats === 0 && !bare.brewing, 'nothing on the go to begin with'),
    ok(started.brewing && started.wizardHats === 0,
       'buying one starts the tower rather than handing you a hat',
       `${started.wizardHats} hats, brewing ${started.brewing}`),
    ok(quarter > 0.15 && quarter < 0.4, 'and it is a quarter of the way through a quarter in',
       `${quarter.toFixed(2)}`),
    ok(most > quarter && most < 1, 'and further along later', `${quarter.toFixed(2)} -> ${most.toFixed(2)}`),
    ok(landed && after.wizardHats === 1 && !after.brewing,
       'and at the end of it there is a hat on the stand',
       `${after.wizardHats} hats, brewing ${after.brewing}`)
  ];
});

// The mining is thrown, not swung. A wizard rides a ring round the star and puts
// a bolt across the gap; the cell comes off where the bolt lands. So there is
// always something in the air while they are working, and no wizard is ever
// standing in the thing it is taking apart.
group('the wizards circle the star and throw at it', async () => {
  window.__meteor();
  window.__wizardHat(3);
  window.__crew(0, 2, 0, 0, 0, 3);
  runUntil(() => state().aloft === 3, 90);

  const mid = { x: state().meteorX, y: state().meteorY };
  const outOf = p => {
    const [x, y] = p.split(':')[1].split(',').map(Number);
    return Math.hypot(x + WORKER / 2 - mid.x, y + WORKER / 2 - mid.y);
  };
  // ...and once they have all got there. The climb up to the ring is a body a
  // long way from the star on purpose, and it is not what this is about.
  runUntil(() => state().workerPos.filter(q => q[0] === 'w').every(p => outOf(p) < 140), 90);

  let sawBolt = false, angles = new Set(), inside = 0, far = 0;
  const start = state().meteor;
  for (let i = 0; i < 400; i++) {
    run(0.25);
    const s = state();
    if (s.bolts > 0) sawBolt = true;
    for (const p of s.workerPos.filter(q => q[0] === 'w')) {
      const [x, y] = p.split(':')[1].split(',').map(Number);
      const d = outOf(p);
      if (d < 40) inside++;                       // in the star itself
      if (d > 140) far++;                         // or nowhere near it
      angles.add(Math.round(Math.atan2(y - mid.y, x - mid.x) * 4 / Math.PI));
    }
    if (s.meteor < start - 20) break;
  }
  const s = state();
  window.__crew(0, 0);
  return [
    ok(sawBolt, 'there is magic in the air while they work'),
    ok(s.meteor < start, 'and the star comes apart where it lands',
       `${start} -> ${s.meteor} cells`),
    ok(inside === 0, 'no wizard is ever inside the thing it is working',
       `${inside} samples within the rind`),
    ok(far === 0, 'and none of them wanders off it', `${far} samples out past the ring`),
    ok(angles.size >= 5, 'they ride round it rather than hanging at one spot',
       `${angles.size} eighths of the circle seen`)
  ];
});

// The sky does not refill itself. It used to: ninety seconds after the last cell
// came off, another star was there, made by nobody, watched by nobody. What
// happens now is the wizards make it -- they hold their ring round the empty
// spot and pour into the middle of it -- so an empty sky is a job rather than a
// wait, and how fast it is done is how many of them are up there.
group('the wizards summon the next star, and more of them do it quicker', async () => {
  window.__meteor();
  window.__wizardHat(2);
  window.__crew(0, 2, 0, 0, 0, 2);
  runUntil(() => state().aloft === 2, 120);

  // strip the star: what is left is an empty sky and two bodies in it
  const emptied = runUntil(() => state().meteor === 0, 900);
  const bare = state();

  // both of them on it...
  const from2 = state().summon;
  run(8);
  const two = state().summon - from2;

  // ...and then one, taken off the job with the same button the player uses, so
  // the only thing that changed is how many pairs of hands are up there
  window.__assign('wizards', -1);
  runUntil(() => state().aloft === 1, 60);
  const from1 = state().summon;
  run(8);
  const one = state().summon - from1;

  // and it lands
  window.__assign('wizards', 1);
  const made = runUntil(() => state().meteor > 0, 300);
  const after = state();

  window.__crew(0, 0);
  return [
    ok(emptied && bare.meteor === 0, 'the star is worked out', `${bare.meteor} cells`),
    ok(one > 0, 'and the bodies left up there start making the next one',
       `${one.toFixed(3)} in eight seconds, one body`),
    ok(two > one * 1.5,
       'two of them make it better than half again as fast as one',
       `${one.toFixed(3)} a body -> ${two.toFixed(3)} for two`),
    ok(made && after.meteor > 60, 'and there is a star at the end of it',
       `${after.meteor} cells`),
    ok(after.summon === 0, 'with the charge spent', `${after.summon}`)
  ];
});

// Nobody up there, nothing made. The charge is not a clock: it holds where it
// was left until somebody is put back in the air.
group('an empty sky with nobody in it stays empty', async () => {
  window.__meteor();
  window.__wizardHat(1);
  window.__crew(0, 1, 0, 0, 0, 1);
  runUntil(() => state().meteor === 0, 900);
  run(6);
  const some = state().summon;

  window.__crew(0, 2);                       // everybody down and carrying
  runUntil(() => state().aloft === 0, 60);
  const was = state().summon;
  run(40);
  const still = state();
  window.__crew(0, 0);
  return [
    ok(some > 0, 'a body up there gets it started', `${some.toFixed(2)}`),
    ok(still.meteor === 0, 'and with nobody up there no star arrives',
       `${still.meteor} cells`),
    ok(Math.abs(still.summon - was) < 0.02,
       'the charge holds where it was left rather than ticking on',
       `${was.toFixed(3)} -> ${still.summon.toFixed(3)}`)
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
