// What a save may not quietly drop.
//
// Every other check in this tier is about something the yard does. This one is
// about the one thing nothing else can see: a field that is declared, played
// with, and then not written down. Nothing warns you -- the game runs perfectly,
// the save is valid, and the first anybody hears of it is a player saying the
// thing they bought is gone. `test/reload.test.mjs` covers what a refresh must
// not do to a *running* yard; this one covers the ledger itself.
//
// It leans on the three lists in state.js. `SAVED` is the plain part, written
// and read by one loop in persist.js; `SAVED_BY_HAND` is the part whose encode
// or decode is more than a copy; `EPHEMERAL` is what is deliberately thrown
// away. A field in none of them fails the last group here, which is the whole
// point of the lists: adding one and not thinking about it is a red test rather
// than lost player data.

import { group, ok, yard } from './helpers.mjs';
import { S, BLANK, SAVED, SAVED_BY_HAND, EPHEMERAL } from '../src/state.js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// A value that is plainly not the default, made from what the declaration in
// state.js says the field is. Two of them, so the check can put one in, save,
// write the other over it and prove the value that comes back was read off the
// save rather than left standing in memory -- which is what makes a one-process
// `persist(); restore()` worth anything at all.
//
// The numbers are small on purpose. Half of these are rungs of a ladder, and a
// ladder has an end: `rebalance` clamps a level to the rows that exist, so a
// made-up hundred comes back as five and the check would be reading the clamp
// rather than the save. One, two and three are a rung of every ladder in the
// game.
function sentinel(blank, n) {
  const small = 1 + (n % 3);
  if (Array.isArray(blank)) return [small, small + 1];
  if (typeof blank === 'number') return small;
  if (typeof blank === 'boolean') return n % 2 === 0 ? !blank : blank;
  return { sentinel: small };              // the null-by-default fields
}

// Counts the crew are dealt out into. `rebalance` works these out again on the
// way in against the crew that is actually standing there, so what comes back
// is the yard's answer and not the save's -- which is right, and means a made-up
// number for one of them is not a round trip to check. They are still saved, and
// a played save's numbers do agree; it is only this check's nonsense ones that
// cannot.
const DEALT = ['breakers', 'carters', 'blasters', 'growers', 'farmhands',
               'stirrers', 'janitors',
               // wave7b-build: derived before the bench is open (which this
               // check's nonsense flags may or may not say), clamped to its
               // posts after -- either way rebalance's answer, not the save's
               'builders'];

group('every plain field on the list survives a save and a load', async () => {
  const fields = SAVED.filter(k => !DEALT.includes(k));
  const want = {};
  fields.forEach((k, i) => { want[k] = sentinel(BLANK[k], i * 2); });
  Object.assign(S, want);
  S.dirty = true;
  yard.persist();
  // Everything the loop is meant to read put to something else first -- a
  // different value, field by field -- so a field the save forgot comes back
  // wrong rather than coming back by accident.
  fields.forEach((k, i) => { S[k] = sentinel(BLANK[k], i * 2 + 1); });

  yard.restore();

  const lost = fields.filter(k =>
    JSON.stringify(S[k]) !== JSON.stringify(want[k]));
  return [
    ok(fields.length > 50, 'there is a list to check', `${fields.length} fields`),
    ok(lost.length === 0, 'and every one of them came back',
       lost.map(k => `${k}: ${JSON.stringify(S[k])} not ${JSON.stringify(want[k])}`).join(', '))
  ];
});

group('a save with none of it in reads as a fresh yard', async () => {
  // The other half of the loop: a save from before a field existed. Every one
  // of them has to come back to what state.js says a yard is, and it has to be
  // the yard's own array rather than a share of `BLANK`'s.
  SAVED.forEach((k, i) => { S[k] = sentinel(BLANK[k], i * 2); });
  localStorage.removeItem('boulder-clicker/v4');
  yard.restore();

  const stale = SAVED.filter(k => JSON.stringify(S[k]) !== JSON.stringify(BLANK[k]));
  const shared = SAVED.filter(k => S[k] && typeof S[k] === 'object' && S[k] === BLANK[k]);
  return [
    ok(stale.length === 0, 'nothing of the last game is left standing',
       stale.map(k => `${k}: ${JSON.stringify(S[k])}`).join(', ')),
    ok(shared.length === 0, 'and no field is handed BLANK\'s own object to mutate',
       shared.join(', '))
  ];
});

group('every field on S is accounted for', async () => {
  const lists = { SAVED, SAVED_BY_HAND, EPHEMERAL };
  const all = [...SAVED, ...SAVED_BY_HAND, ...EPHEMERAL];
  const seen = new Set(all);
  const missing = Object.keys(S).filter(k => !seen.has(k));
  const twice = all.filter((k, i) => all.indexOf(k) !== i);

  // The three keys a save spells differently from the field it holds. Every
  // other name in the two saved lists is the field's own.
  // ...and the two moments of the beat between rocks, written as distances
  // (`danceLeft`, `nextBoulderIn`) the way a body's moments are.
  const ALIAS = { who: 'workers', core: 'coreItem', coreLoose: 'coreItem',
                  danceLeft: 'danceUntil', nextBoulderIn: 'nextBoulderAt' };
  S.dirty = true;
  yard.persist();
  const written = Object.keys(JSON.parse(localStorage.getItem('boulder-clicker/v4')));
  const unlisted = written.filter(k => !seen.has(ALIAS[k] || k));
  // ...and the other way round. A name on the by-hand list is a promise that
  // `persist()` writes it in a line of its own, and for a month the quarry's
  // yield ladder was on the list with no line behind it: the game ran, the save
  // was valid, and every rung came back nought. The plain list cannot lose a
  // field this way because one loop writes all of it; the by-hand one can, so
  // every name on it has to be found among the keys the save actually has.
  const spelled = new Set(written.map(k => ALIAS[k] || k));
  const unwritten = SAVED_BY_HAND.filter(k => !spelled.has(k));

  return [
    ok(missing.length === 0,
       'a field on S is in SAVED, SAVED_BY_HAND or EPHEMERAL -- decide which',
       missing.join(', ')),
    ok(twice.length === 0, 'and in only one of them', twice.join(', ')),
    ok(unlisted.length === 0,
       'and everything persist() writes is named in one of the two saved lists',
       unlisted.join(', ')),
    ok(unwritten.length === 0,
       'and everything on SAVED_BY_HAND is actually written by persist()',
       unwritten.join(', ')),
    // The lists are about S, so a name on one of them that is not a field is
    // either a typo or one of the six that belong to another module -- the
    // grids, the sky, the chance, the craft, and the two leftovers the format
    // still carries. Named here so a typo cannot hide among them.
    ...Object.entries(lists).map(([name, list]) => {
      // ...and `mouth`, where the cut's mouth was: a fact about the layout the
      // crew were saved on, read by `restoreCrew` and kept by nothing.
      const OUTSIDE = ['floor', 'pit', 'cut', 'meteorCells', 'rngState', 'craft', 'mouth'];
      const odd = list.filter(k => !(k in S) && !OUTSIDE.includes(k));
      return ok(odd.length === 0, `${name} names only fields of the yard`, odd.join(', '));
    })
  ];
});

// The group above reads the keys `S` has at the moment it runs, and a field a
// module hangs on `S` the first time it is needed is not among them: the
// house's part-clod (`scrubMuck`) was written by craft.js for a month with no
// declaration, no list and no blank, so a reset kept it and a reload lost it,
// and nothing here went red. So the source is read as well as the object:
// every name assigned through `S.` anywhere under src/ has to be declared.
group('every field a module writes on S is declared in state.js', async () => {
  const files = [];
  const walk = dir => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.js') && f !== 'state.js') files.push(p);
    }
  };
  walk(fileURLToPath(new URL('../src', import.meta.url)));
  const written = new Map();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bS\.([A-Za-z_]\w*)\s*(?:[-+*/|&]?=(?!=)|\+\+|--)/g)) {
      if (!written.has(m[1])) written.set(m[1], f);
    }
  }
  const undeclared = [...written].filter(([k]) => !(k in BLANK));
  return [
    ok(written.size > 100, 'the sweep found the writes', `${written.size} names`),
    ok(undeclared.length === 0,
       'and every one of them is a field state.js declares',
       undeclared.map(([k, f]) => `${k} (${f})`).join(', '))
  ];
});

// A reset is the one time a running yard is put down in place, and it used to
// name what it put down. What it did not name stood: the quarry's running
// total (and so the "a thousand ore" notice, landing on a yard that had dug
// none), the house's part-clod, a wheel mid-spin, a cutscene half played. It
// clears the session's fields off the declaration now; this plants a value in
// each of the ones that leaked and looks for it afterward.
group('a reset puts down what the save throws away', async () => {
  const planted = { quarryTotal: 1234, scrubMuck: 5, wheel: 42, cine: { name: 'tear', at: 1 },
                    riftGulp: 1.8, rescueTo: 5088, smoke: [{ x: 1, y: 1 }], spinWon: true,
                    hand: { won: true }, restaff: { at: 1 } };
  Object.assign(S, planted);
  window.__reset();
  const kept = Object.keys(planted).filter(k => JSON.stringify(S[k]) === JSON.stringify(planted[k]));
  return [
    ok(kept.length === 0, 'nothing of the old yard stands through a reset', kept.join(', '))
  ];
});
