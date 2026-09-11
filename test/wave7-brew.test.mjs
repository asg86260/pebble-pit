// Wave 7, track D: the brews declare who they are for (item 22), the hauler's
// speed brew (21) and the wizard's gleam brew (25) exist, the shard recipes hide
// until the quarry opens (24), and an old save wakes up with the new keys (23's
// migration half; the label under the pot is drawing and is looked at with
// tools/look.mjs, not asserted here).
//
// Each group starts from a fresh game and reaches the building the way a player
// does: the plots broken, the apothecary bought through its row, the pot set
// through the same hook the picker's click lands on, and the stirrer assigned
// through the roster's own `assign`.

import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';
import { TONICS, tonicOf, takesTonic, tonicShown, doseLive,
         paceBoost, sparkBoost, workBoost,
         migrateApothecary } from '../src/apothecary.js';

// Open the farm ONLY (the quarry stays shut unless a group opens it -- item 24
// turns on exactly that difference), put the apothecary up, and leave spare
// hands and haulers in the yard for the doses to land on.
function standApothecary() {
  window.__reset();
  window.__crew(1, 3, 0, 1);                   // rockhand, haulers, farm open, no quarry
  window.__grant({ cores: 3, dust: 20000, spores: 2000, shards: 400 });
  run(1);
  const started = window.__buy('unlockapothecary');
  window.__finish();
  return started;
}

const S = () => yard.S;
const dosed = () => S().workers.filter(doseLive);
const wearing = (w, key) => (w.doses || []).some(d => d.tonic === key);

// --- item 22: brews declare their targets -------------------------------------
group('a hauler is never dealt the stew or the bracing tonic', async () => {
  standApothecary();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  // Point the dial at the haulers on purpose: the membership test, not the
  // preference, is what must keep the stew off them.
  window.__potPrefer('haulers');
  const landed = runUntil(() => dosed().length > 0, 200);
  run(60);                                     // several more rounds of dealing
  const haulers = S().workers.filter(w => w.type === 'hauler');
  const stewed = haulers.filter(w => wearing(w, 'stew') || wearing(w, 'brace'));
  return [
    ok(landed, 'the stew lands on somebody'),
    ok(haulers.length > 0, 'with haulers standing in the yard'),
    ok(stewed.length === 0, 'and none of them is ever handed it',
       stewed.map(w => w.name).join(',')),
    ok(TONICS.every(t => Array.isArray(t.jobs) && t.jobs.length > 0),
       'every recipe says who it is for')
  ];
});

// --- item 21: the speed brew, bought and brewed the player's way ---------------
group('a swift dose speeds only haulers', async () => {
  standApothecary();
  window.__pot('swift');
  window.__assign('stirrers', 1);
  const landed = runUntil(() => S().workers.some(w => wearing(w, 'swift')), 300);
  const who = S().workers.filter(w => wearing(w, 'swift'));
  const hauler = who[0];
  const other = S().workers.find(w => w.type !== 'hauler' && w.type !== 'stirrer');
  return [
    ok(landed, 'the speed brew is brewed and dealt'),
    ok(who.every(w => w.type === 'hauler'),
       'and it only ever lands on a hauler', who.map(w => w.type).join(',')),
    ok(hauler && paceBoost(hauler) > 1.2, 'the dosed hauler walks faster',
       hauler && String(paceBoost(hauler))),
    ok(hauler && workBoost(hauler) === 1, 'and only walks faster -- its work is untouched'),
    ok(other && paceBoost(other) === 1, 'while an undosed body keeps its own pace',
       other && `${other.type} ${paceBoost(other)}`)
  ];
});

// --- item 25: the gleam brew is the wizard's ----------------------------------
group('the gleam brew reads on a wizard and on nobody else', async () => {
  window.__reset();
  const gleam = tonicOf('gleam');
  const dose = [{ tonic: 'gleam', until: 9e12 }];
  const wiz = { type: 'wizard', doses: dose };
  const haul = { type: 'hauler', doses: dose };
  return [
    ok(!!gleam && gleam.kind === 'spark' && gleam.reagent === 'spark',
       'the recipe exists, a brew of sparks that costs sparks'),
    ok(takesTonic(wiz, gleam), 'a wizard takes it'),
    ok(!takesTonic(haul, gleam), 'a hauler does not'),
    ok(Math.abs(sparkBoost(wiz) - 1.2) < 0.001,
       'a dosed wizard yields a fifth more sparks', String(sparkBoost(wiz))),
    ok(sparkBoost(haul) === 1,
       'and the same dose misplaced on a hauler counts for nothing')
  ];
});

// --- item 24: shard recipes hide until the quarry opens ------------------------
group('shard brews are hidden before the quarry opens', async () => {
  standApothecary();                            // farm open, quarry shut
  // Potency rows also wait on a first batch (the grind pass); that reveal has
  // its own check, and this one is about the shard gate alone.
  S().brews = 5;
  const hiddenBefore = TONICS.filter(t => t.reagent === 'shard')
                             .every(t => !tonicShown(t));
  const stewBefore = tonicShown(tonicOf('stew'));
  const rowBefore = window.__buy('potency-brace');   // the row must not answer
  openSites();                                  // the quarry is broken open
  run(1);
  const shardAfter = TONICS.filter(t => t.reagent === 'shard').every(tonicShown);
  // The gleam brew is priced in sparks, and waits on the first spark the same
  // way the shard brews wait on the quarry.
  const gleamStillHidden = !tonicShown(tonicOf('gleam'));
  window.__grant({ sparks: 10 });
  const shownAfter = TONICS.every(tonicShown);
  const rowAfter = window.__buy('potency-brace');
  return [
    ok(hiddenBefore, 'every shard recipe is off the menu with the quarry shut'),
    ok(stewBefore, 'while the stew and the speed brew stand'),
    ok(!rowBefore, 'and a shard potency row cannot be bought'),
    ok(shardAfter, 'the quarry opens and the shard brews stand'),
    ok(gleamStillHidden, 'the gleam brew waits on a spark being seen'),
    ok(shownAfter, 'and stands once one is'),
    ok(rowAfter, 'rows and all')
  ];
});

// --- the bills differ, and the gleam brew is paid in sparks -------------------
group('no two brews cost the same, and the gleam brew takes sparks', async () => {
  standApothecary();
  window.__grant({ sparks: 10 });
  run(1);
  const bills = TONICS.map(t => JSON.stringify(window.__brewCost(t.key)));
  const gleam = window.__brewCost('gleam');
  const sparkLine = gleam.find(([m]) => m === 'spark');
  // Buy it like a player: set a pot to the gleam brew and let it light, then
  // read what left the purse.
  const before = { sparks: S().sparks, spores: S().spores };
  window.__pot('gleam');
  window.__assign('stirrers', 1);
  runUntil(() => S().sparks < before.sparks, 200);
  return [
    ok(new Set(bills).size === TONICS.length, 'every recipe has a bill of its own', bills.join(' | ')),
    ok(!!sparkLine && sparkLine[1] > 0, 'the gleam brew has a spark line', JSON.stringify(gleam)),
    ok(S().sparks === before.sparks - sparkLine[1],
       'and lighting the pot takes exactly that many sparks', `${before.sparks} -> ${S().sparks}`),
    ok(S().spores < before.spores, 'along with the crop')
  ];
});

// --- item 23's migration: an old save wakes with the new keys ------------------
group('an old save takes the new recipes without losing its own', async () => {
  window.__reset();
  // The shape an old save restores into: the maps hold only the recipes that
  // existed when it was written.
  S().potency = { stew: 2, brace: 1 };
  S().shelf = { stew: 4 };
  migrateApothecary();
  return [
    ok(S().potency.swift === 0 && S().potency.gleam === 0,
       'the new ladders stand at nought',
       `${S().potency.swift},${S().potency.gleam}`),
    ok(S().shelf.swift === 0 && S().shelf.gleam === 0,
       'with nothing on their shelves'),
    ok(S().potency.stew === 2 && S().potency.brace === 1,
       'and the rungs the save had climbed are kept'),
    ok(S().shelf.stew === 4, 'stock and all')
  ];
});
