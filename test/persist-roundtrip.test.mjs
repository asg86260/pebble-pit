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
               // wave6-sim: clamped to the school's one lectern on the way in
               'teachers',
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
  const ALIAS = { who: 'workers', core: 'coreItem', coreLoose: 'coreItem' };
  S.dirty = true;
  yard.persist();
  const written = Object.keys(JSON.parse(localStorage.getItem('boulder-clicker/v4')));
  const unlisted = written.filter(k => !seen.has(ALIAS[k] || k));

  return [
    ok(missing.length === 0,
       'a field on S is in SAVED, SAVED_BY_HAND or EPHEMERAL -- decide which',
       missing.join(', ')),
    ok(twice.length === 0, 'and in only one of them', twice.join(', ')),
    ok(unlisted.length === 0,
       'and everything persist() writes is named in one of the two saved lists',
       unlisted.join(', ')),
    // The lists are about S, so a name on one of them that is not a field is
    // either a typo or one of the six that belong to another module -- the
    // grids, the sky, the chance, the craft, and the two leftovers the format
    // still carries. Named here so a typo cannot hide among them.
    ...Object.entries(lists).map(([name, list]) => {
      const OUTSIDE = ['floor', 'pit', 'cut', 'meteorCells', 'rngState', 'craft',
                       'poop', 'falling'];
      const odd = list.filter(k => !(k in S) && !OUTSIDE.includes(k));
      return ok(odd.length === 0, `${name} names only fields of the yard`, odd.join(', '));
    })
  ];
});
