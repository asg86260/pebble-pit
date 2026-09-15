// The apothecary rework: pots that are each their own, stock that is per tonic,
// potency ladders one to a recipe, the armful a stirrer carries, and the rule
// that a hauler takes the stew on its legs and no bracing tonic. Node tier -- everything
// about the yard; the hut, the bookshelf and the coloured flames are looked at
// with `node tools/look.mjs apothpots`. See docs/wave5.md, track F1.
//
// Each group starts from a fresh game and reaches the feature the way a player
// does: the building is bought through its row, a second pot through its row,
// and a pot's brew is set through the same `set` the board's tonic button calls.
// The `__` hooks here only stand the yard up -- the crew, the coin, the plots --
// which is the part these checks are not about.

import { group, ok, run, runUntil, openSites, buyNow, yard } from './helpers.mjs';
import { TONICS, tonicOf, tonicVal, doseStock, choosePotTonic,
         potTonicOf, carryDoses, potencyLevel, migrateApothecary,
         speedBoost, critBoost, strengthBoost, doses } from '../src/apothecary.js';

// Open the farm, put the apothecary up, and hand the yard enough coin to brew
// for a good while on two pots at once.
function standApothecary() {
  window.__reset();
  openSites();                                 // the plots are broken
  window.__crew(1, 4, 0, 2);                   // a rockhand, spare hands, two farmhands
  // Sparks too: the bracing tonic is priced in them.
  window.__grant({ cores: 3, dust: 40000, spores: 4000, shards: 800, sparks: 200 });
  run(1);
  const started = window.__buy('unlockapothecary');
  window.__finish();
  // The deeper rows reveal themselves after batches have landed (the grind
  // pass); the reveal has its own check, and these are not it.
  yard.S.brews = 5;
  return started;
}

// Setting a pot's brew: the same call the picker at the pot makes when a swatch
// is clicked. The board's per-pot menu is gone -- the pot IS the control now --
// and a DOM popover is not something this tier can press, so the route itself is
// proved by the browser check that clicks a cauldron and then a swatch
// ("clicking a pot picks what that pot brews", selftest/boards.js). What these
// checks are about is what happens downstream of the setting, and this is how
// they get there without asserting anything about how you reach it.
const setPot = (i, key) => choosePotTonic(i, key);

// --- two pots, two brews, two shelves -----------------------------------------
group('a second pot brews its own tonic, onto its own shelf', async () => {
  standApothecary();
  // A first batch is one dose and a keeper carries it straight out, so stock
  // only stands on a shelf once a batch is bigger than a pair of hands.
  window.__levels({ dosesLevel: 3 });
  const boughtPot = buyNow('anotherpot');
  window.__assign('stirrers', 2);              // a keeper apiece

  setPot(0, 'stew');
  setPot(1, 'brace');

  // Both shelves fill: the pots run at the same time, each on its own recipe.
  const both = runUntil(() => doseStock('stew') > 0 && doseStock('brace') > 0, 400);
  const stewStock = doseStock('stew');

  return [
    ok(boughtPot && yard.S.apothPots === 2, 'the row breaks room for a second pot',
       `${yard.S.apothPots} pots`),
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
  window.__levels({ dosesLevel: 3 });          // as above: a batch that leaves stock behind
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

// A batch belongs to the tonic it was bought as. Turning the pot while it cooks
// used to swap what came off the fire without swapping what had been paid, so a
// stew's price bought a brace you could not otherwise afford.
group('a batch lands as the brew that was paid for, not the one the pot ended on', async () => {
  standApothecary();
  window.__assign('stirrers', 1);
  setPot(0, 'stew');                           // a stew's bill: spore and dust
  const lit = runUntil(() => (yard.S.brewAt[0] || 0) > 0, 200);
  const brewsWas = yard.S.brews;

  setPot(0, 'brace');                          // turned mid-batch to a shard recipe
  const landed = runUntil(() => yard.S.brews > brewsWas, 400);

  return [
    ok(lit, 'a stew batch is lit and paid for', String(yard.S.brewAt[0] | 0)),
    ok(landed, 'and a batch comes off the fire', `${brewsWas} -> ${yard.S.brews}`),
    ok(doseStock('brace') === 0,
       'it is not the bracing tonic the pot was turned to',
       `brace ${doseStock('brace')}, stew ${doseStock('stew')}`)
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
// A stirrer carries one vial, and there is no ladder over it any more: an
// armful was production climbing by another name, and the building already
// out-brewed what its bodies could drink. One body, one dose, one walk.
group('a stirrer carries one vial and nothing sells it more', async () => {
  standApothecary();
  const rows = window.__rows().map(r => r.key);
  return [
    ok(carryDoses() === 1, 'one in hand', String(carryDoses())),
    ok(!rows.includes('dosecarry'), 'and no armful row on any board')
  ];
});

// --- who a tonic is for -------------------------------------------------------
group('a hauler reads the stew on its legs and takes no bracing tonic', async () => {
  standApothecary();
  const hauler = yard.S.workers.find(w => w.type === 'hauler');
  const farmhand = yard.S.workers.find(w => w.type === 'farmhand');
  const forever = 9e12;

  hauler.doses = [{ tonic: 'stew', until: forever },
                  { tonic: 'brace', until: forever }];
  const haulSpeed = speedBoost(hauler), haulCrit = critBoost(hauler);

  hauler.doses = [{ tonic: 'strong', until: forever }];
  const haulStrength = strengthBoost(hauler);

  farmhand.doses = [{ tonic: 'stew', until: forever }];
  const farmSpeed = speedBoost(farmhand);

  return [
    ok(haulSpeed > 1.2, 'a stew quickens a hauler the way it quickens anybody', String(haulSpeed)),
    ok(haulCrit === 0, 'while a bracing tonic does nothing for a body that never rolls', String(haulCrit)),
    ok(haulStrength > 1.2, 'and the strong brew widens what it carries', String(haulStrength)),
    ok(farmSpeed > 1.2, 'and the same stew still lifts a farmhand',
       String(farmSpeed))
  ];
});

group('and no stirrer ever walks a bracing tonic out to a hauler', async () => {
  standApothecary();
  window.__assign('stirrers', 1);
  setPot(0, 'brace');
  // Long enough for several batches to be brewed and dealt across the yard.
  runUntil(() => yard.S.workers.some(w =>
    w.doses && w.doses.length && w.type !== 'stirrer'), 400);
  run(180);
  const dosedHaulers = yard.S.workers.filter(w =>
    w.type === 'hauler' && w.doses && w.doses.some(d => d.tonic === 'brace'));
  const dosedOthers = yard.S.workers.filter(w =>
    w.type !== 'hauler' && w.type !== 'stirrer' &&
    w.doses && w.doses.some(d => d.tonic === 'brace'));
  return [
    ok(dosedOthers.length > 0, 'the bracing tonic reaches the bodies that roll',
       `${dosedOthers.length} bodies`),
    ok(dosedHaulers.length === 0, 'and not one hauler',
       `${dosedHaulers.length} haulers under a bracing tonic`)
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
