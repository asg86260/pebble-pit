// The pit's arc: solid, torn, drowned -- see "The pit's arc" in DESIGN.md.
//
// The first overflow tears a *small* hole that inhales at full strength and
// grows with what it eats; at ABYSS_AT eaten it gives way and the pit drowns
// into the abyss. Nothing is sold, nothing is tended, and spending never
// shrinks it. What these check is the arc itself: the eras arrive in order,
// the size is a fact about what has been eaten, the two transitions are
// watched once each by a cutscene that never pauses the yard, and a save
// comes back in the era it was written in.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const { RIFT_W0, RIFT_WMAX, ABYSS_AT } = await import('../src/config.js');
const { riftCells } = await import('../src/rift.js');
const { pitTop } = await import('../src/pit.js');

group('the first overflow tears a small hole, not the abyss', async () => {
  window.__reset();
  window.__crew(0, 2);
  const early = state();

  // More dust than the hole can hold: the overflow is reached the way a
  // player reaches it -- a full pit turning a grain away -- not by a hook.
  window.__give(60000);
  const torn = state();
  run(8);                                // the tear's gulp and its scene run out
  const after = state();

  return [
    ok(!early.riftOpen && !early.drowned, 'a fresh yard is solid'),
    ok(torn.riftOpen, 'the overflow tears the rift'),
    ok(!torn.drowned && !after.drowned, 'and the pit does not drown: the disc era comes first'),
    ok(after.riftAte > 0, 'the tear itself fed it', `${after.riftAte} eaten`),
    ok(after.riftCells >= RIFT_W0 && after.riftCells < RIFT_WMAX,
       'the disc is small, well under its grown size',
       `${after.riftCells} cells, born ${RIFT_W0}, grown ${RIFT_WMAX}`),
    // The torn pit is still the working floor: the crossing is the pile and
    // the ladders, not the drowned era's plank at the brim.
    ok(pitTop(yard.pit.x + yard.pit.w / 2) > yard.S.groundY,
       'a body still crosses the hole on its floor, not on a plank')
  ];
});

group('the tearing is watched once, and the yard never pauses', async () => {
  window.__reset();
  window.__crew(1, 2);                   // a miner on the rock: proof the yard runs
  window.__give(60000);
  run(0.2);
  const during = state();
  const rockBefore = during.rock;
  run(6);
  const after = state();

  return [
    ok(during.cine === 'tear', 'the tear starts its cutscene', `${during.cine}`),
    ok(after.cine === null, 'and the camera is given back when it is over'),
    // A cutscene is a camera, not a stop: the crew went on working under it.
    ok(after.rock < rockBefore, 'the yard kept moving while it played',
       `rock ${rockBefore} -> ${after.rock}`)
  ];
});

group('the disc grows with what it eats, and only grows', async () => {
  window.__reset();
  const sizes = [0, 50000, 250000, 600000, ABYSS_AT].map(ate => {
    window.__tear(ate);
    return riftCells();
  });

  const climbs = sizes.every((c, i) => i === 0 || c >= sizes[i - 1]);
  return [
    ok(sizes[0] === RIFT_W0, 'it tears at its born size', `${sizes[0]}`),
    ok(climbs, 'the size is monotone in what it has eaten', sizes.join(' -> ')),
    ok(sizes[1] > sizes[0], 'and the early growth shows', `${sizes[0]} -> ${sizes[1]}`),
    ok(sizes.at(-1) === RIFT_WMAX, 'pinned at its grown size at the threshold',
       `${sizes.at(-1)} of ${RIFT_WMAX}`)
  ];
});

group('spending never shrinks the hole', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__tear(200000);
  window.__give(20000);                  // the rift inhales it: dust through, ate up
  run(3);
  const fed = state();
  window.__spend(Math.floor(fed.stored / 2));
  run(2);
  const after = state();

  return [
    ok(fed.riftAte > 200000, 'feeding it grew the count', `${fed.riftAte}`),
    ok(after.riftAte >= fed.riftAte, 'a spend took nothing off what it ate',
       `${fed.riftAte} -> ${after.riftAte}`),
    ok(after.riftCells >= fed.riftCells, 'so the disc never shrank',
       `${fed.riftCells} -> ${after.riftCells}`)
  ];
});

group('eating its fill drowns the pit', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__tear(ABYSS_AT - 1000);        // the last stretch of the era
  window.__give(20000);                  // and more than enough to cross it
  const crossed = runUntil(() => state().drowned, 30);
  const during = state();
  run(10);                               // the drowning's gulp and scene run out
  const after = state();

  return [
    ok(crossed, 'the threshold drowns the pit'),
    ok(during.cine === 'drown' || after.cine === null,
       'the drowning is the second watched moment', `${during.cine}`),
    ok(after.drowned && after.riftOpen, 'and the abyss era is one-way'),
    ok(after.cine === null, 'with the camera given back'),
    // The abyss as built: the plank at the brim, and the books unmoved.
    ok(pitTop(yard.pit.x + yard.pit.w / 2) === yard.S.groundY,
       'the drowned pit is crossed at the brim'),
    ok(after.stored - after.rift === after.pitDust,
       'the counter is still the pile plus what is through',
       `${after.stored} - ${after.rift} vs ${after.pitDust}`)
  ];
});

group('a save comes back in the era it was written in', async () => {
  // A torn-era save round-trips torn, at its own growth. `__reset` wipes the
  // save on purpose -- a reset is a reset -- so the raw save is carried
  // across it by hand, which is also exactly what a bug-report save is.
  window.__reset();
  window.__tear(300000);
  yard.persist();
  const raw = localStorage.getItem('boulder-clicker/v4');
  window.__reset();
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  const torn = state();

  // And a save from before the arc existed -- riftOpen with no riftAte --
  // was written when the tear and the drowning were one moment, so it comes
  // back drowned: nobody is pulled back an era.
  const pre = JSON.parse(raw);
  delete pre.riftAte;
  delete pre.drowned;
  window.__reset();
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(pre));
  yard.restore();
  const old = state();

  return [
    ok(torn.riftOpen && !torn.drowned, 'a torn yard reloads torn'),
    ok(torn.riftAte === 300000, 'with its appetite intact', `${torn.riftAte}`),
    ok(old.riftOpen && old.drowned, 'a pre-arc torn save reloads drowned'),
    ok(old.riftAte >= ABYSS_AT, 'seeded past the threshold, so nothing re-drowns it',
       `${old.riftAte}`)
  ];
});

// A reset is a game that has never been played, and one that has never been
// played is solid. `riftAte` and `drowned` are by-hand fields, and the reset
// blanked its by-hand fields off a list of its own that had never heard of
// them -- so a drowned yard reset to a fresh crew standing beside the abyss.
group('a reset puts a drowned yard back to solid', async () => {
  window.__reset();
  window.__rift();
  const before = state();
  window.__reset(true, true);            // the dev panel's button: a new run, opening and all
  const after = state();
  return [
    ok(before.drowned && before.riftAte >= ABYSS_AT, 'the yard was drowned to begin with'),
    ok(!after.drowned, 'and is not after the reset'),
    ok(!after.riftOpen && after.riftAte === 0, 'the rift is neither torn nor fed',
       `open ${after.riftOpen}, ate ${after.riftAte}`)
  ];
});
