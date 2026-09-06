// What is spent flies to the station that sold the row, not always to the bench.
// A grain leaving the pile is stamped with where it is paying to (`payTo` in
// pit.js, set by `buy` off the row's site); `fly` in game.js flies each grain to
// its own stamp. Here we read the stamp off the grains a purchase throws.

import { group, ok, yard } from './helpers.mjs';

// Open the farm and the apothecary, the player's way, with coin to spend.
function stand() {
  window.__reset();
  window.__crew(0, 1, 0, 1);
  window.__grant({ cores: 5, dust: 40000, spores: 3000, shards: 300 });
  window.__buy('unlockfarm'); window.__finish();
  window.__buy('unlockapothecary'); window.__finish();
}

const near = (a, b) => Math.abs(a - b) < 50;
const centre = s => s.x + s.w / 2;

group('an apothecary row pays to the cauldron, not the bench', async () => {
  stand();
  const apX = centre(yard.apothecary), benchX = centre(yard.bench);
  // The second pot reveals after batches have landed (the grind pass); the
  // reveal has its own check, and this one is about where the dust flies.
  yard.S.brews = 5;
  yard.S.paid = [];
  window.__buy('anotherpot');                      // an apothecary row, priced in dust
  const grains = yard.S.paid;
  const aimed = grains.filter(g => g.tx != null);
  return [
    ok(grains.length > 0, 'the purchase throws dust into flight', `${grains.length}`),
    ok(aimed.length === grains.length, 'and every grain is aimed somewhere', `${aimed.length}/${grains.length}`),
    ok(grains.every(g => near(g.tx, apX)),
       'each grain flies to the apothecary', `tx ${grains[0]?.tx?.toFixed(0)} vs apo ${apX.toFixed(0)}`),
    ok(!near(apX, benchX), 'and the apothecary is not the bench', `apo ${apX.toFixed(0)} bench ${benchX.toFixed(0)}`)
  ];
});

group('a bench row still pays to the bench', async () => {
  stand();
  const benchX = centre(yard.bench);
  yard.S.paid = [];
  window.__buy('carry');                           // your own strength, bought at the bench
  const grains = yard.S.paid;
  return [
    ok(grains.length > 0, 'the purchase throws dust', `${grains.length}`),
    // A bench row's site is the bench, so it is aimed at the bench -- the same
    // place the old fixed target sent everything.
    ok(grains.every(g => g.tx == null || near(g.tx, benchX)),
       'its dust flies to the bench', `tx ${grains[0]?.tx}`)
  ];
});
