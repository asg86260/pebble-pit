// Three brews, one a coin, read per trade (DESIGN.md): the stew is speed, the
// strong brew is strength, the bracing tonic is crit, and every body reads the
// axis in its own trade's terms -- a hauler's speed is its legs and its
// strength its armful, a wizard's strength is its bolt. The shard brew waits
// on the quarry and the spark brew on a spark being seen, the three bills
// differ, and a save from the five-brew book folds into the three.
//
// Each group starts from a fresh game and reaches the building the way a player
// does: the plots broken, the apothecary bought through its row, the pot set
// through the same hook the picker's click lands on, and the stirrer assigned
// through the roster's own `assign`.

import { group, ok, run, runUntil, openSites, yard } from './helpers.mjs';
import { TONICS, tonicOf, takesTonic, tonicShown, doseLive, doses,
         speedBoost, strengthBoost, critBoost, doseComing,
         migrateApothecary } from '../src/apothecary.js';
import { load } from '../src/crew/hole.js';
import { haulCap } from '../src/levels.js';

// Open the farm ONLY (the quarry stays shut unless a group opens it), put the
// apothecary up, and leave spare hands and haulers in the yard for the doses to
// land on.
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
const wearing = (w, key) => doses(w).some(d => d.tonic === key);
const haulers = () => S().workers.filter(w => w.type === 'hauler');

// --- the stew is a hauler's legs ------------------------------------------------
group('the stew reaches a hauler and quickens its walk', async () => {
  standApothecary();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  window.__potPrefer('haulers');
  const landed = runUntil(() => haulers().some(w => wearing(w, 'stew')), 300);
  const h = haulers().find(w => wearing(w, 'stew'));
  return [
    ok(landed, 'a hauler is dealt the stew', `shelf=${JSON.stringify(S().shelf)}`),
    ok(h && speedBoost(h) > 1.2, 'and walks faster for it', h && String(speedBoost(h))),
    ok(h && strengthBoost(h) === 1, 'and only faster -- its armful is untouched',
       h && String(strengthBoost(h)))
  ];
});

// --- the strong brew is a hauler's armful ------------------------------------------
group('the strong brew reaches a hauler and widens its armful', async () => {
  standApothecary();
  openSites();                                 // the quarry, for the ore it costs
  window.__crew(1, 3, 0, 1);                   // (openSites stands the crew down)
  run(1);
  window.__pot('strong');
  window.__assign('stirrers', 1);
  window.__potPrefer('haulers');
  const landed = runUntil(() => haulers().some(w => wearing(w, 'strong')), 300);
  const h = haulers().find(w => wearing(w, 'strong'));
  const plain = haulers().find(w => !wearing(w, 'strong'));
  return [
    ok(landed, 'a hauler is dealt the strong brew', `shelf=${JSON.stringify(S().shelf)}`),
    ok(h && strengthBoost(h) > 1.2, 'and is stronger for it', h && String(strengthBoost(h))),
    ok(h && load(h) > haulCap() * (h.trained ? 2 : 1), 'which is a bigger load a trip, even at one grain a trip',
       h && `${load(h)} vs ${haulCap()}`),
    ok(!plain || load(plain) === Math.round(haulCap() * (plain.trained ? 2 : 1)),
       'while an undosed hauler carries what it always did', plain && String(load(plain)))
  ];
});

// --- the strong brew is a wizard's bolt, and the wizard comes down for it -------
group('a stirrer carries the strong brew to a wizard, who comes down for it', async () => {
  window.__reset();
  openSites();                                 // the quarry, for the ore it costs
  window.__crew(1, 2, 0, 1, 0, 2);             // two wizards on the ring
  window.__grant({ cores: 3, dust: 20000, spores: 2000, shards: 400, sparks: 50 });
  run(1);
  window.__buy('unlockapothecary');
  window.__finish();
  window.__pot('strong');
  window.__assign('stirrers', 1);
  window.__potPrefer('wizards');
  const wizards = () => S().workers.filter(w => w.type === 'wizard');
  const up = runUntil(() => wizards().every(w => w.aloft), 60);
  let cameDown = false;
  const landed = runUntil(() => {
    if (wizards().some(w => doseComing(w) && !w.aloft && !wearing(w, 'strong'))) cameDown = true;
    return wizards().some(w => wearing(w, 'strong'));
  }, 300);
  const w = wizards().find(b => wearing(b, 'strong'));
  const backUp = w && runUntil(() => w.aloft, 120);
  return [
    ok(up, 'both wizards are on the ring to begin with'),
    ok(landed, 'a wizard wears the strong brew within the run',
       `shelf=${JSON.stringify(S().shelf)}`),
    ok(cameDown, 'and it came down to the ground to take it'),
    ok(w && Math.abs(strengthBoost(w) - 1.25) < 0.001, 'the bolt is a quarter stronger for it',
       w && String(strengthBoost(w))),
    ok(w && speedBoost(w) === 1, 'and casts no sooner -- that is the stew\'s'),
    ok(backUp, 'and it goes back up to the ring with the dose on')
  ];
});

// --- who each brew reaches -----------------------------------------------------
group('the stew and the strong brew reach every trade; the bracing tonic only those who roll', async () => {
  window.__reset();
  const stew = tonicOf('stew'), strong = tonicOf('strong'), brace = tonicOf('brace');
  const body = (type, key) => ({ type, doses: [{ tonic: key, until: 9e12 }] });
  return [
    ok(TONICS.length === 3 && stew && strong && brace, 'three brews in the book',
       TONICS.map(t => t.key).join(',')),
    ok(stew.reagent === 'spore' && strong.reagent === 'shard' && brace.reagent === 'spark',
       'one a coin: crop, ore, spark'),
    ok(['hauler', 'wizard', 'purifier', 'rockhand', 'quarrier', 'farmhand']
         .every(t => takesTonic({ type: t }, stew) && takesTonic({ type: t }, strong)),
       'every trade takes the stew and the strong brew'),
    ok(!takesTonic({ type: 'hauler' }, brace) && !takesTonic({ type: 'purifier' }, brace),
       'a hauler and a purifier take no bracing tonic'),
    ok(takesTonic({ type: 'wizard' }, brace) && takesTonic({ type: 'rockhand' }, brace),
       'while a wizard and a rockhand do'),
    ok(critBoost(body('hauler', 'brace')) === 0 && critBoost(body('rockhand', 'brace')) > 0,
       'and a bracing tonic misplaced on a hauler counts for nothing'),
    ok(speedBoost(body('purifier', 'stew')) > 1.2 && strengthBoost(body('purifier', 'strong')) > 1.2,
       'a purifier reads both the stew and the strong brew')
  ];
});

// --- the shard brew waits on the quarry, the spark brew on a spark ----------------
group('the strong brew hides before the quarry and the bracing tonic before a spark', async () => {
  standApothecary();                            // farm open, quarry shut
  // Potency rows also wait on a first batch (the grind pass); that reveal has
  // its own check, and this one is about the gates alone.
  S().brews = 5;
  const strongHidden = !tonicShown(tonicOf('strong'));
  const braceHidden = !tonicShown(tonicOf('brace'));
  const stewShown = tonicShown(tonicOf('stew'));
  const rowBefore = window.__buy('potency-strong');   // the row must not answer
  openSites();                                  // the quarry is broken open
  run(1);
  const strongShown = tonicShown(tonicOf('strong'));
  const braceStillHidden = !tonicShown(tonicOf('brace'));
  window.__grant({ sparks: 10 });
  const allShown = TONICS.every(tonicShown);
  const rowAfter = window.__buy('potency-strong');
  return [
    ok(strongHidden, 'the strong brew is off the menu with the quarry shut'),
    ok(braceHidden, 'and so is the bracing tonic before a spark'),
    ok(stewShown, 'while the stew stands'),
    ok(!rowBefore, 'and the strong brew\'s potency row cannot be bought'),
    ok(strongShown, 'the quarry opens and the strong brew stands'),
    ok(braceStillHidden, 'the bracing tonic still waits on a spark'),
    ok(allShown, 'and stands once one is seen'),
    ok(rowAfter, 'rows and all')
  ];
});

// --- the bills differ, and the bracing tonic is paid in sparks --------------------
group('no two brews cost the same, and the bracing tonic takes sparks', async () => {
  standApothecary();
  window.__grant({ sparks: 10 });
  run(1);
  const bills = TONICS.map(t => JSON.stringify(window.__brewCost(t.key)));
  const brace = window.__brewCost('brace');
  const sparkLine = brace.find(([m]) => m === 'spark');
  // Buy it like a player: set a pot to the bracing tonic and let it light,
  // then read what left the purse.
  const before = { sparks: S().sparks, spores: S().spores };
  window.__pot('brace');
  window.__assign('stirrers', 1);
  runUntil(() => S().sparks < before.sparks, 200);
  return [
    ok(new Set(bills).size === TONICS.length, 'every recipe has a bill of its own', bills.join(' | ')),
    ok(TONICS.every(t => window.__brewCost(t.key).some(([m]) => m === 'spore')),
       'and every one of them takes crop'),
    ok(TONICS.every(t => !window.__brewCost(t.key).some(([m]) => m === 'dust')),
       'and none of them dust'),
    ok(!!sparkLine && sparkLine[1] > 0, 'the bracing tonic has a spark line', JSON.stringify(brace)),
    ok(S().sparks === before.sparks - sparkLine[1],
       'and lighting the pot takes exactly that many sparks', `${before.sparks} -> ${S().sparks}`),
    ok(S().spores < before.spores, 'along with the crop')
  ];
});

// --- a five-brew save folds into three ------------------------------------------
group('a save from the five-brew book folds into the three', async () => {
  window.__reset();
  window.__crew(1, 1);
  // The shape a five-brew save restores into: the speed brew and the mana brew
  // on the ladders, the shelf, a pot and a body.
  S().potency = { stew: 2, brace: 1, strong: 0, swift: 4, gleam: 3 };
  S().shelf = { stew: 4, brace: 0, strong: 2, swift: 3, gleam: 1 };
  S().potTonics = ['swift', 'gleam'];
  const h = S().workers.find(w => w.type === 'hauler');
  h.doses = [{ tonic: 'swift', until: 9e12 }];
  migrateApothecary();
  return [
    ok(S().potency.stew === 4 && S().potency.strong === 3 && S().potency.brace === 1,
       'each folded ladder keeps the deeper of its two rungs', JSON.stringify(S().potency)),
    ok(S().potency.swift == null && S().potency.gleam == null, 'and the old keys are gone'),
    ok(S().shelf.stew === 7 && S().shelf.strong === 3 && S().shelf.swift == null,
       'stock joins the shelf its brew joined', JSON.stringify(S().shelf)),
    ok(S().potTonics[0] === 'stew' && S().potTonics[1] === 'strong',
       'a pot on an old brew is set to the new one', S().potTonics.join(',')),
    ok(h.doses[0].tonic === 'stew' && speedBoost(h) > 1.2,
       'and a live dose is renamed and still read', JSON.stringify(h.doses))
  ];
});
