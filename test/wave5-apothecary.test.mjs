// The apothecary rework: pots that are each their own, stock that is per tonic,
// potency ladders one to a recipe, the armful a stirrer carries, and the rule
// that a hauler takes the carry brew and nothing else. Node tier -- everything
// about the yard; the hut, the bookshelf and the coloured flames are looked at
// with `node tools/look.mjs apothpots`. See docs/wave5.md, track F1.
//
// Each group starts from a fresh game and reaches the feature the way a player
// does: the building is bought through its row, a second pot through its row,
// and a pot's brew is set through the same `set` the board's tonic button calls.
// The `__` hooks here only stand the yard up -- the crew, the coin, the plots --
// which is the part these checks are not about.

import { group, ok, run, runUntil, openSites, buyNow, yard } from './helpers.mjs';
import { APOTHECARY_UPGRADES, TONICS, tonicOf, tonicVal, doseStock,
         potTonicOf, carryDoses, potencyLevel, migrateApothecary,
         workBoost, critBoost, carryBoost, doses } from '../src/apothecary.js';

// Open the farm, put the apothecary up, and hand the yard enough coin to brew
// for a good while on two pots at once.
function standApothecary() {
  window.__reset();
  openSites();                                 // the plots are broken
  window.__crew(1, 4, 0, 2);                   // a rockhand, spare hands, two farmhands
  window.__grant({ cores: 3, dust: 40000, spores: 4000, shards: 800 });
  run(1);
  const started = window.__buy('unlockapothecary');
  window.__finish();
  return started;
}

// Setting a pot's brew the way the board does it: the tonic button on that pot's
// section calls the row's own `set`. `window.__pot` is this for the first pot;
// there is no hook for the others, and reaching for `S.potTonics` instead would
// be the check setting the thing it is meant to be testing the route to.
const setPot = (i, key) => {
  const row = APOTHECARY_UPGRADES.find(r => r.key === `tonic-${i}-${key}`);
  if (!row || !row.show()) return false;
  row.set();
  return true;
};

// --- two pots, two brews, two shelves -----------------------------------------
group('a second pot brews its own tonic, onto its own shelf', async () => {
  standApothecary();
  const boughtPot = buyNow('anotherpot');
  window.__assign('stirrers', 2);              // a keeper apiece

  const setFirst = setPot(0, 'stew');
  const setSecond = setPot(1, 'brace');

  // Both shelves fill: the pots run at the same time, each on its own recipe.
  const both = runUntil(() => doseStock('stew') > 0 && doseStock('brace') > 0, 400);
  const stewStock = doseStock('stew');

  return [
    ok(boughtPot && yard.S.apothPots === 2, 'the row breaks room for a second pot',
       `${yard.S.apothPots} pots`),
    ok(setFirst && setSecond, 'and each pot takes a brew of its own'),
    ok(potTonicOf(0) === 'stew' && potTonicOf(1) === 'brace',
       'the two pots are on two different tonics',
       `${potTonicOf(0)} / ${potTonicOf(1)}`),
    ok(both, 'and both brews reach the shelves',
       `stew ${doseStock('stew')}, brace ${doseStock('brace')}`),
    ok(stewStock > 0, 'with stock standing under each name', String(stewStock))
  ];
});

group('turning a pot to another brew does not throw away what it made', async () => {
  standApothecary();
  buyNow('anotherpot');
  window.__assign('stirrers', 2);
  setPot(0, 'stew');
  // Nobody is left for the stirrers to dose after the first round, so the stew
  // banks up on its shelf rather than walking straight back out again.
  runUntil(() => doseStock('stew') > 1, 400);
  const backlog = doseStock('stew');

  setPot(0, 'brace');                          // the same pot, a different recipe
  run(2);

  return [
    ok(backlog > 0, 'there is stew on the shelf to begin with', String(backlog)),
    ok(potTonicOf(0) === 'brace', 'and the pot is turned to something else',
       potTonicOf(0)),
    ok(doseStock('stew') >= backlog,
       'the stew shelf keeps its backlog', `${backlog} -> ${doseStock('stew')}`)
  ];
});

// --- the potency ladders, one to a recipe -------------------------------------
group('a potency rung deepens one brew and leaves the others alone', async () => {
  standApothecary();
  const stew = tonicOf('stew'), brace = tonicOf('brace');
  const stewWas = tonicVal(stew), braceWas = tonicVal(brace);

  const bought = buyNow('potency-stew');

  return [
    ok(bought && potencyLevel('stew') === 1, 'the stew\'s own ladder goes up a rung',
       `stew ${potencyLevel('stew')}, brace ${potencyLevel('brace')}`),
    ok(tonicVal(stew) > stewWas, 'and the stew is worth more than it was',
       `${stewWas.toFixed(3)} -> ${tonicVal(stew).toFixed(3)}`),
    ok(Math.abs(tonicVal(brace) - braceWas) < 1e-9,
       'while the bracing tonic is exactly where it was',
       `${braceWas.toFixed(3)} -> ${tonicVal(brace).toFixed(3)}`)
  ];
});

// --- the armful ---------------------------------------------------------------
group('the carry ladder sends a stirrer out with more than one vial', async () => {
  standApothecary();
  const was = carryDoses();
  const bought = buyNow('dosecarry');
  return [
    ok(was === 1, 'a stirrer starts out carrying one', String(was)),
    ok(bought && carryDoses() === 2, 'and a rung makes it two',
       `${was} -> ${carryDoses()}`)
  ];
});

group('a fuller armful doses more bodies in one round', async () => {
  // Bought first, then run: one trip out of the building now lands on two
  // bodies, so the yard comes under the tonic in half the walks.
  standApothecary();
  buyNow('dosecarry');
  buyNow('dosecarry');                         // three at a time
  window.__assign('stirrers', 1);
  setPot(0, 'stew');
  const onStew = () => yard.S.workers.filter(w =>
    doses(w).some(d => d.tonic === 'stew')).length;
  const spread = runUntil(() => onStew() >= 2, 400);
  const under = onStew();
  return [
    ok(carryDoses() === 3, 'the stirrer carries three', String(carryDoses())),
    ok(spread, 'and more than one body ends up under the brew', `${under} bodies`)
  ];
});

// --- who a tonic is for -------------------------------------------------------
group('a hauler takes the carry brew and nothing else', async () => {
  standApothecary();
  const hauler = yard.S.workers.find(w => w.type === 'hauler');
  const farmhand = yard.S.workers.find(w => w.type === 'farmhand');
  const forever = 9e12;

  hauler.doses = [{ tonic: 'stew', until: forever },
                  { tonic: 'brace', until: forever }];
  const haulWork = workBoost(hauler), haulCrit = critBoost(hauler);

  hauler.doses = [{ tonic: 'strong', until: forever }];
  const haulCarry = carryBoost(hauler);

  farmhand.doses = [{ tonic: 'stew', until: forever }];
  const farmWork = workBoost(farmhand);

  return [
    ok(haulWork === 1, 'a stew does nothing for a hauler\'s work', String(haulWork)),
    ok(haulCrit === 0, 'and a bracing tonic nothing for its crit', String(haulCrit)),
    ok(haulCarry > 1, 'while the strong brew widens what it carries', String(haulCarry)),
    ok(farmWork > 1.2, 'and the same stew still lifts a farmhand',
       String(farmWork))
  ];
});

group('and no stirrer ever walks a stew out to a hauler', async () => {
  standApothecary();
  window.__assign('stirrers', 1);
  setPot(0, 'stew');
  // Long enough for several batches to be brewed and dealt across the yard.
  runUntil(() => yard.S.workers.some(w =>
    w.doses && w.doses.length && w.type !== 'stirrer'), 400);
  run(180);
  const dosedHaulers = yard.S.workers.filter(w =>
    w.type === 'hauler' && w.doses && w.doses.some(d => d.tonic === 'stew'));
  const dosedOthers = yard.S.workers.filter(w =>
    w.type !== 'hauler' && w.type !== 'stirrer' &&
    w.doses && w.doses.some(d => d.tonic === 'stew'));
  return [
    ok(dosedOthers.length > 0, 'the stew reaches the bodies it is for',
       `${dosedOthers.length} bodies`),
    ok(dosedHaulers.length === 0, 'and not one hauler',
       `${dosedHaulers.length} haulers under a stew`)
  ];
});

// --- an old save --------------------------------------------------------------
// The one thing here with no player path: what a save written before this landed
// turns into. The building's single tonic becomes the first pot's, the doses it
// was holding land on that tonic's shelf, and every rung of the old strength
// ladder is kept on every recipe -- taking rungs away because the ladder changed
// shape is the one thing a refactor may not do to somebody's save.
group('a save from before the rework is poured into the new shape', async () => {
  standApothecary();
  Object.assign(yard.S, {
    potTonics: [], potSpents: [], shelf: {}, potency: {},
    potTonic: 'brace', potSpent: true, doseHold: [2, 1], strengthLevel: 3
  });

  migrateApothecary();

  return [
    ok(potTonicOf(0) === 'brace', 'the building\'s tonic becomes the first pot\'s',
       potTonicOf(0)),
    ok(doseStock('brace') === 3, 'and the doses it held stand on that shelf',
       String(doseStock('brace'))),
    ok(TONICS.every(t => potencyLevel(t.key) === 3),
       'every recipe keeps the rungs the old ladder had bought',
       TONICS.map(t => `${t.key} ${potencyLevel(t.key)}`).join(', ')),
    ok(yard.S.potTonic == null && !yard.S.doseHold.length,
       'and the legacy fields are read once and left empty',
       `${yard.S.potTonic}, ${yard.S.doseHold.length}`)
  ];
});
