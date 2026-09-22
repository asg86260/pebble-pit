// A knocked-off hat is a thing lying in the yard, and a refresh keeps it
// there. Lost, the station's count of hats outnumbers the heads and the
// ground, so the helmet turns up back on the stand without anybody carrying
// it -- and the body that went to pick it up finds nothing where it fell.
//
// One rockhand and one helmet, so the owner is the only body entitled to it
// and the walk back for it is the owner's own.

import { group, ok, state, run, yard, reloadCheck, WORKER } from './helpers.mjs';
import { DIZZY_MS } from '../src/config.js';

const roster = () => state().roster;
const rock = () => roster().find(r => r.job === 'rockhands');

// Knocked off by the same shake a cursor drives (`__shake` goes through
// `shakeHeld`), then `beforeSave` game seconds later the yard is saved and
// read back.
function knockAndReload(beforeSave) {
  window.__reset();
  window.__crew(1, 0);
  window.__kit({ breakers: 1 });
  run(8);                                    // and has gone and put it on
  const S = yard.S;
  const i = S.workers.findIndex(o => o.trained && o.kitOf === 'rockhands');
  const owner = S.workers[i];
  const shook = window.__shake(i);
  run(beforeSave);
  const was = owner.hatOff && { ...owner.hatOff };
  reloadCheck();                             // the refresh, and nobody moved
  const back = S.workers[i];
  const now = back.hatOff && { ...back.hatOff };
  return { S, i, shook, was, now, bare: !back.trained };
}

group('a hat lying where it fell is still there after a refresh, and is fetched', async () => {
  const { S, i, shook, was, now, bare } = knockAndReload(0.6);
  const lying = rock();
  run(DIZZY_MS / 1000 + 8);                  // it walks over and puts it on
  const w = S.workers[i];
  const after = rock();

  return [
    ok(shook && shook.hatOff && was && was.rest, 'the hat came off and came to rest',
       JSON.stringify(was)),
    ok(now && now.of === 'rockhands' && Math.abs(now.x - was.x) <= 1 && Math.abs(now.y - was.y) <= 1,
       'and after the refresh it is lying in the same place',
       `${JSON.stringify(was)} -> ${JSON.stringify(now)}`),
    // Not back on the stand: a hat on the ground is not a spare one.
    ok(lying.worn === 0 && lying.spareKit === 0 && lying.hats === 1 && bare,
       'with nobody wearing it and nothing spare on the stand',
       JSON.stringify(lying)),
    ok(w.trained && w.kitOf === 'rockhands' && !w.hatOff,
       'and its owner walks over and is wearing it again',
       `trained ${w.trained} kit ${w.kitOf} hatOff ${JSON.stringify(w.hatOff)}`),
    ok(after.worn === 1 && after.hats === 1, 'one helmet, one head', JSON.stringify(after))
  ];
});

group('a hat saved in flight comes back on the ground under where it was', async () => {
  const { S, i, was, now } = knockAndReload(1 / 60);
  run(DIZZY_MS / 1000 + 8);
  const w = S.workers[i];

  return [
    ok(was && !was.rest, 'the hat was still in the air when the yard was saved',
       JSON.stringify(was)),
    ok(now && now.rest && now.vx === 0 && now.vy === 0,
       'and comes back at rest, not flying', JSON.stringify(now)),
    ok(now && Math.abs(now.x - was.x) <= WORKER && now.y > was.y,
       'on the ground under where it was', `${JSON.stringify(was)} -> ${JSON.stringify(now)}`),
    ok(w.trained && w.kitOf === 'rockhands' && !w.hatOff,
       'and its owner fetches it and wears it', `trained ${w.trained} kit ${w.kitOf}`),
    ok(rock().worn === 1 && rock().hats === 1, 'one helmet, one head', JSON.stringify(rock()))
  ];
});

// A save written before the hat was on it: the helmet is not lying anywhere,
// so it is the stand's, and the bare owner walks over and takes it from there.
group('a save from before the hat was written loads clean', async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__kit({ breakers: 1 });
  run(8);
  const S = yard.S;
  const i = S.workers.findIndex(o => o.trained && o.kitOf === 'rockhands');
  window.__shake(i);
  run(0.6);
  yard.persist();
  const KEY = 'boulder-clicker/v4';
  const s = JSON.parse(localStorage.getItem(KEY));
  const had = s.who.some(k => k.hatOff);
  for (const k of s.who) delete k.hatOff;
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const lying = S.workers.some(o => o.hatOff);
  run(DIZZY_MS / 1000 + 8);

  return [
    ok(had, 'the save had the hat on it to take off'),
    ok(!lying, 'nothing is lying about after the load'),
    ok(S.workers[i].trained && rock().worn === 1 && rock().hats === 1,
       'and the owner wears the one helmet, off the stand', JSON.stringify(rock()))
  ];
});

// Two on the rock and one helmet: the mate goes for it while the owner sees
// stars, and a refresh on the way keeps the claim it was walking on.
group('a body walking for somebody else\'s hat is still walking for it after a refresh', async () => {
  window.__reset();
  window.__crew(2, 0);
  window.__kit({ breakers: 1 });
  run(8);
  const S = yard.S;
  const i = S.workers.findIndex(o => o.trained && o.kitOf === 'rockhands');
  window.__shake(i);
  let claimed = false;
  for (let n = 0; n < 120 && !claimed; n++) {
    run(1 / 60);
    claimed = S.workers.some(o => o.claimHat === S.workers[i]);
  }
  reloadCheck();
  const j = S.workers.findIndex(o => o.claimHat);
  const still = j >= 0 && S.workers[j].claimHat === S.workers[i] && !!S.workers[i].hatOff;
  run(DIZZY_MS / 1000 + 8);

  return [
    ok(claimed, 'somebody set off for the hat before the refresh'),
    ok(still, 'and after it is walking for the same hat'),
    ok(j >= 0 && S.workers[j].trained && S.workers[j].kitOf === 'rockhands' && !S.workers[i].trained,
       'and is the one wearing it', JSON.stringify(S.workers.map(o => [o.type, o.trained, o.kitOf]))),
    ok(rock().worn === 1 && rock().hats === 1 && S.rockhands === 2,
       'one helmet, one head, two on the rock', JSON.stringify(rock()))
  ];
});
