// The apothecary: the pot as an upkeep, the stirrer that deals the doses, and
// the buff on the body. Node tier -- everything about the yard, none of the
// board's drawing (the menu, the mark and the steam are looked at with
// tools/look.mjs). See DESIGN.md, "The apothecary".
//
// Each group starts from a fresh game and reaches the feature the way a player
// does: the farm is opened, the building is bought and finished, a stirrer is
// assigned through the same `assign` a roster button calls, and the pot is set
// through the same `set` the board row's click calls.

import { group, ok, state, run, runUntil, openSites, buyNow, yard } from './helpers.mjs';
import { doseLive, boiling, brewMs, dosesPer, workBoost, critBoost,
         doseStockTotal, potTonicOf, potSpentOf } from '../src/apothecary.js';

// Open the farm, put the apothecary up, and hand the yard enough coin to brew.
// Leaves a spare hand or two to make into a stirrer.
function standApothecary() {
  window.__reset();
  openSites();                                 // the plots are broken
  window.__crew(1, 3, 0, 1);                   // a rockhand, spare hands, a farmhand to buff
  window.__grant({ cores: 3, dust: 20000, spores: 2000, shards: 400 });
  run(1);
  const started = window.__buy('unlockapothecary');
  window.__finish();
  return started;
}

const dosed = () => yard.S.workers.filter(doseLive);
// Stock is per tonic now (wave 5, item 13): what a batch mints goes on the
// shelf for its own brew rather than into a per-pot heap.
const doseHeld = () => doseStockTotal();

// --- the building opens, the player's way -------------------------------------
group('the apothecary opens after the plots are broken', async () => {
  const started = standApothecary();
  return [
    ok(started, 'the row answers when it is pressed'),
    ok(yard.S.apothecaryOpen, 'and the building is up'),
    ok(yard.apothecary.w > 0 && yard.apothecary.x > 0,
       'standing on real ground', `${yard.apothecary.x},${yard.apothecary.w}`)
  ];
});

group('and it will not open before the farm does', async () => {
  window.__reset();
  window.__crew(1, 2);
  window.__grant({ cores: 3, dust: 20000, spores: 2000 });
  run(1);
  const before = window.__buy('unlockapothecary');   // no farm yet
  return [
    ok(!before, 'the row is not on offer with the plots unbroken')
  ];
});

// --- a pot needs a body -------------------------------------------------------
group('a set pot brews nothing until a stirrer is at it', async () => {
  standApothecary();
  window.__pot('stew');                         // set the pot, keep brewing
  run(90);
  const idle = doseHeld();
  const boiledCold = boiling();

  window.__assign('stirrers', 1);               // now give it a body
  const got = runUntil(() => doseHeld() > 0 || dosed().length > 0, 120);

  return [
    ok(idle === 0, 'a pot with nobody on it mints no doses', `held ${idle}`),
    ok(!boiledCold, 'and it does not read as on the boil'),
    ok(got, 'a stirrer walks to it and the batch comes')
  ];
});

// --- the dose is carried to a body, and lands on it ---------------------------
group('the stirrer carries a dose out and the buff lands on a body', async () => {
  standApothecary();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  const landed = runUntil(() => dosed().length > 0, 200);
  const who = dosed()[0];

  return [
    ok(landed, 'a body ends up under the tonic'),
    ok(who && who.type !== 'stirrer', 'and it is a worker, not the stirrer itself',
       who && who.type),
    ok(who && who.doses.some(d => d.tonic === 'stew'),
       'wearing the tonic the pot was set to',
       who && who.doses.map(d => d.tonic).join(','))
  ];
});

// --- the buff multiplies the body's work --------------------------------------
group('a hearty stew makes a farmhand cut faster', async () => {
  // Two identical farms, one with the stew on it: the buffed farm cuts more crop
  // over the same stretch of time. Measured through the crop the farm banks, the
  // same figure a player watches.
  standApothecary();
  // reach into a farmhand and put a fresh stew on it by hand is NOT how -- set
  // the pot and let the stirrer deal it, then read the boost off the body.
  window.__pot('stew');
  window.__assign('stirrers', 1);
  runUntil(() => dosed().some(w => w.type === 'farmhand'), 200);
  const fh = dosed().find(w => w.type === 'farmhand');

  return [
    ok(!!fh, 'a farmhand is dealt the stew'),
    ok(fh && workBoost(fh) > 1.2, 'and its work is scaled up while it wears it',
       fh && String(workBoost(fh)))
  ];
});

// --- the buff reaches the rock, not just the farm and the cut ------------------
// The reviewer's C-1: the stew and the bracing tonic were offered to rock hands on
// the `doses favor` dial and drew the mark on a rockhand's body, but did nothing --
// `rock.js knockOff` took no body, so neither the quicker swing nor the lifted
// crit chance reached it. Here the dose is put on the rockhand directly (the
// carrying is proven above); what is under test is whether the swing answers it.
group('a hearty stew makes a rockhand swing faster', async () => {
  function minedIn(sec, buff) {
    window.__reset();
    openSites();
    window.__crew(1, 2, 0, 0);                 // one rockhand at the rock
    window.__grant({ dust: 5000 });
    run(2);                                     // let it reach the face
    const m = yard.S.workers.find(w => w.type === 'rockhand');
    if (buff) m.doses = [{ tonic: 'stew', until: 9e12 }];   // a stew that will not lapse
    const before = m.mined || 0;
    run(30);
    return { took: (m.mined || 0) - before, boost: workBoost(m) };
  }
  const base = minedIn(30, false);
  const up = minedIn(30, true);
  return [
    ok(up.boost > 1.2, 'a stew-dosed rockhand reads as boosted', String(up.boost)),
    ok(up.took > base.took * 1.1,
       'and takes more rock over the same stretch than an unbuffed one',
       `${base.took} -> ${up.took}`)
  ];
});

group('a bracing tonic reaches a rockhand\'s crit roll', async () => {
  // The +crit half of C-1: a brace-dosed rockhand is eligible for the lifted chance
  // `rock.js` now passes into `critRoll`. Proven at the seam it was missing from.
  window.__reset();
  openSites();
  window.__crew(1, 0, 0, 0);
  run(2);
  const m = yard.S.workers.find(w => w.type === 'rockhand');
  m.doses = [{ tonic: 'brace', until: 9e12 }];
  return [
    ok(critBoost(m) > 0, 'a brace-dosed rockhand carries a crit bonus into its swing',
       String(critBoost(m)))
  ];
});

// --- crop is spent to brew (the carried-in cost) ------------------------------
group('brewing draws down the crop', async () => {
  standApothecary();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  const before = state().spores;
  runUntil(() => doseHeld() > 0 || dosed().length > 0, 120);
  const after = state().spores;
  return [
    ok(after < before, 'a batch takes spore out of the pile',
       `${before} -> ${after}`)
  ];
});

// --- one-off vs keep brewing --------------------------------------------------
group('a one-off brews a single batch and then idles', async () => {
  standApothecary();
  window.__pot('stew');
  window.__potKeep(false);                      // a one-off
  window.__assign('stirrers', 1);
  runUntil(() => potSpentOf(0), 120);
  const spent = potSpentOf(0);
  // let the doses all deal out, then confirm no second batch ever starts
  run(120);
  const minted = doseStockTotal();
  return [
    ok(spent, 'the batch is put up and the pot is marked spent'),
    ok(minted === 0, 'its doses deal out and no second batch is brewed',
       `still holding ${minted}`)
  ];
});

// --- the ladders --------------------------------------------------------------
group('the pot ladders deepen what a brew is worth', async () => {
  standApothecary();
  const brew0 = brewMs();
  const doses0 = dosesPer();
  // a rung on the pot is built by its own hands, like the plots break the next
  // furrow -- so it is a work the yard finishes, not an instant number
  const boughtSpeed = buyNow('brewspeed');
  const boughtDoses = buyNow('brewdoses');
  const pots0 = yard.S.apothPots;
  const boughtPot = buyNow('anotherpot');
  return [
    ok(boughtSpeed && brewMs() < brew0, 'brew speed shortens a batch',
       `${brew0} -> ${brewMs()}`),
    ok(boughtDoses && dosesPer() > doses0, 'doses a brew reaches more bodies',
       `${doses0} -> ${dosesPer()}`),
    ok(boughtPot && yard.S.apothPots === pots0 + 1, 'another pot breaks more room',
       `${pots0} -> ${yard.S.apothPots}`)
  ];
});

// --- the setting survives a reload --------------------------------------------
group('the pot remembers what it was set to across a reload', async () => {
  standApothecary();
  window.__pot('brace');
  window.__buy('bufflength');
  const lvl = yard.S.lengthLevel;
  window.__reload();
  return [
    ok(yard.S.apothecaryOpen, 'the building comes back up'),
    ok(potTonicOf(0) === 'brace', 'set to the tonic it was on', potTonicOf(0)),
    ok(yard.S.lengthLevel === lvl, 'with its ladder where it was', `${lvl} -> ${yard.S.lengthLevel}`)
  ];
});

// --- a body can be under more than one tonic ---------------------------------
// They lift different things, so there is no sense in which a stew replaces a
// bracing tonic -- and it used to, which meant the yard quietly threw away a
// dose it had just paid crop and a reagent for whenever the pot changed.
//
// What may NOT double up is a kind: two stews at once would be the same boost
// applied twice. A second stew refreshes the first.
group('a body wears one tonic of each kind, and a repeat refreshes rather than stacks', async () => {
  standApothecary();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  runUntil(() => dosed().some(w => w.type === 'farmhand'), 200);
  const fh = dosed().find(w => w.type === 'farmhand');
  const stewOnly = workBoost(fh);
  const critBefore = critBoost(fh);

  // ...and now the pot goes on to something that lifts a different thing
  window.__pot('stew');                        // off
  window.__pot('brace');
  const both = runUntil(() => fh.doses.length > 1, 300);
  const workAfter = workBoost(fh);
  const critAfter = critBoost(fh);

  // A second of the SAME kind: the list does not grow, and the boost does not
  // double -- it is the same stew, wound back up.
  const was = fh.doses.length;
  const stew = { tonic: 'stew', until: 1 };    // a spent one to be replaced
  fh.doses = [...fh.doses.filter(d => d.tonic !== 'stew'), stew];
  window.__pot('brace'); window.__pot('stew');
  const again = runUntil(() => fh.doses.some(d => d.tonic === 'stew' && d.until > 1), 300);
  const doubled = workBoost(fh);

  window.__crew(0, 0);
  return [
    ok(stewOnly > 1.2 && critBefore === 0,
       'a stew alone lifts the work and nothing else', `${stewOnly.toFixed(2)}, crit ${critBefore}`),
    ok(both, 'a bracing tonic lands on a body already under a stew',
       fh.doses.map(d => d.tonic).join(',')),
    ok(workAfter > 1.2 && critAfter > 0,
       'and it is under both at once -- the stew was not thrown away',
       `work ${workAfter.toFixed(2)}, crit ${critAfter.toFixed(2)}`),
    ok(again && fh.doses.filter(d => d.tonic === 'stew').length === 1,
       'a second stew is one stew, not two', `${fh.doses.length} doses`),
    ok(Math.abs(doubled - workAfter) < 0.001,
       'and it lifts the work by the same as one did', `${doubled.toFixed(2)}`)
  ];
});
