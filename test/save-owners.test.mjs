// Every saved fact is written and read beside its owner (DESIGN.md, "The
// second pass", seam 5). persist.js is the loop over `SAVERS` and the codec
// for the three plots; each owner exports a `SAVE` with the by-hand names it
// owns, a `write`, a `read` and a `blank`.
//
// What this file proves is that the move changed nothing about the save: a
// rich yard -- every station open, crew, machines, a shield up, a pot on the
// table, the star, a build in flight, dust on every ground -- is
// written, read back and written again, and the second blob is the first
// byte for byte, less the stamp's clock and the four facts a load re-derives
// on purpose (named below, each with its reason). The same yard on the tree
// before the move gave the same blob (the report for track P in
// docs/wave-second-pass.md carries the lengths and the key diff); the
// round-trip check here is what keeps it that way.

import { group, ok, run, runUntil, yard, state } from './helpers.mjs';
import { SAVERS } from '../src/persist.js';
import { SAVED_BY_HAND } from '../src/state.js';

const KEY = 'boulder-clicker/v4';
const S = yard.S;

// The names a blob spells differently from the field on S they hold; the
// same table persist-roundtrip.test.mjs keeps.
const ALIAS = { workers: ['who'], coreItem: ['core', 'coreLoose'],
                danceUntil: ['danceLeft'], nextBoulderAt: ['nextBoulderIn'] };
const spelledAs = k => ALIAS[k] || [k];

// A yard with something saved in every corner of it, stood up the player's
// way where a hook is not the point: the shield is bought through its row and
// built by the crew.
function richYard() {
  window.__fullSites();
  window.__grant({ shards: 900, spores: 900, cores: 9, sparks: 300 });
  window.__give(60000);
  window.__crew(4, 4, 3, 3);
  window.__kit({ breakers: 4, carters: 4, blasters: 3, growers: 3 });
  window.__tip(40000);
  window.__pileRock(200);
  window.__pileCut(200);
  for (const key of ['jaw', 'tiller', 'ram', 'belt']) window.__machine(key, { bought: true, driven: true });
  run(5);
  window.__meteor();
  window.__wizardHat();
  run(3);
  window.__air({ open: true, purifiers: 1 });
  run(3);
  window.__casino(true);
  window.__casinoStake(60);
  run(2);
  // The shield, the build and the grains in the air last, so all three are
  // standing when the blob is written: the tower's spell is a build with a
  // gang at it, and a shard in the air is a chip with a landing.
  window.__jump(6);
  window.__buy('props');
  runUntil(() => !!S.shield, 400);
  S.seenSpark = true; window.__buy('spelldrive');
  for (let i = 0; i < 40; i++) window.__toss('shard', S.cx + i * 6);
  run(0.1);
}

// The facts a load re-derives rather than copies, so a blob written after
// one differs there and nowhere else:
const REDERIVED = {
  savedAt: 'the stamp\'s clock',
  rngState: 'a load draws on the stream (the pit\'s finds, the sky, new names)',
  pouring: 'a bet made is a bet made: a pot comes back pouring into its plot',
  skyKinds: 'the band is rebuilt from the haze and its kinds relabelled by share',
  works: 'a site with an empty list is dropped on the way in'
};
const rest = raw => {
  const s = JSON.parse(raw);
  for (const k of Object.keys(REDERIVED)) delete s[k];
  return JSON.stringify(s);
};

group('a rich yard written, read back and written again is the same blob', async () => {
  richYard();
  yard.persist();
  const first = localStorage.getItem(KEY);
  const before = JSON.parse(first);
  yard.restore();
  yard.persist();
  const second = localStorage.getItem(KEY);
  const after = JSON.parse(second);

  const differ = Object.keys(before).filter(k => !(k in REDERIVED) &&
    JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  return [
    ok(before.who.length >= 14 && !!before.shield && !!before.pot && !!before.meteorCells &&
       Object.values(before.works).some(l => l.length) &&
       before.chips.length > 0 && before.floor.cells.length > 100 && before.cut.cells.length > 10 &&
       Object.values(before.machines).filter(m => m.bought).length === 4,
       'the yard has something saved in every corner',
       `${before.who.length} crew, shield ${!!before.shield}, pot ${!!before.pot}, star ${!!before.meteorCells}, ` +
       `works ${JSON.stringify(before.works)}, ${before.chips.length} chips`),
    ok(Object.keys(before).join() === Object.keys(after).join(),
       'the second blob has the same keys in the same order'),
    ok(rest(first) === rest(second),
       'and is the first byte for byte, less what a load re-derives',
       differ.map(k => `${k}: ${JSON.stringify(before[k]).slice(0, 80)} -> ${JSON.stringify(after[k]).slice(0, 80)}`).join('; '))
  ];
});

group('every saver\'s fields are on the blob', async () => {
  // Any yard: a key is written whether or not there is anything behind it.
  window.__crew(2, 1);
  run(1);
  yard.persist();
  const written = new Set(Object.keys(JSON.parse(localStorage.getItem(KEY))));
  const missing = [];
  for (const o of SAVERS)
    for (const k of o.fields)
      for (const name of spelledAs(k)) if (!written.has(name)) missing.push(name);
  const claimed = SAVERS.flatMap(o => o.fields);
  return [
    ok(SAVERS.length >= 20, 'there is a list of savers', `${SAVERS.length}`),
    ok(SAVERS.every(o => Array.isArray(o.fields) && typeof o.write === 'function' &&
                         typeof o.read === 'function' && typeof o.blank === 'function'),
       'and each is a saver: fields, write, read, blank'),
    ok(missing.length === 0, 'every field every saver claims is written', missing.join(', ')),
    ok(claimed.length === SAVED_BY_HAND.length && SAVED_BY_HAND.every(k => claimed.includes(k)),
       'and the claims are the by-hand list, exactly',
       `${claimed.length} claimed, ${SAVED_BY_HAND.length} declared`)
  ];
});
