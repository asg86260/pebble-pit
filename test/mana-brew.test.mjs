// The mana brew reaches a wizard, on the ground, where a hand can reach.
//
// The recipe existed and read right on a body it was placed on by hand, but no
// check had ever let a stirrer carry one to a wizard the way the yard does --
// and a wizard is the one body that is not on the ground. The stirrer dealt by
// x alone, so the dose was handed four hundred pixels up to a body on the ring,
// and the player watching saw nothing land. Now the wizard comes down for it
// (`doseComing`), and rule 12 in verify.js watches every group for a dose
// handed to a body in the sky.
//
// Bought like a player: the apothecary through its row, the pot through the
// picker's hook, the stirrer through the roster.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { doses, sparkBoost, doseComing } from '../src/apothecary.js';

const S = () => yard.S;
const wizards = () => S().workers.filter(w => w.type === 'wizard');
const wearing = (w, key) => doses(w).some(d => d.tonic === key);

function standTower() {
  window.__reset();
  window.__crew(1, 2, 0, 1, 0, 2);                 // two wizards on the ring
  window.__grant({ cores: 3, dust: 20000, spores: 2000, shards: 400, sparks: 50 });
  run(1);
  window.__buy('unlockapothecary');
  window.__finish();
  window.__pot('gleam');
  window.__assign('stirrers', 1);
}

group('a stirrer carries the mana brew to a wizard, who comes down for it', async () => {
  standTower();
  const up = runUntil(() => wizards().every(w => w.aloft), 60);
  // The wizard is called down while the stirrer is on its way, so somewhere
  // in the round both are true at once: a dose coming, and a wizard on the
  // ground with none yet.
  let cameDown = false;
  const landed = runUntil(() => {
    if (wizards().some(w => doseComing(w) && !w.aloft && !wearing(w, 'gleam'))) cameDown = true;
    return wizards().some(w => wearing(w, 'gleam'));
  }, 300);
  const dosed = wizards().find(w => wearing(w, 'gleam'));
  const backUp = dosed && runUntil(() => dosed.aloft, 120);
  return [
    ok(up, 'both wizards are on the ring to begin with'),
    ok(landed, 'a wizard wears the mana brew within the run',
       `shelf=${JSON.stringify(S().shelf)}`),
    ok(cameDown, 'and it came down to the ground to take it'),
    ok(dosed && Math.abs(sparkBoost(dosed) - 1.2) < 0.001, 'the bolt is a fifth stronger for it',
       dosed && String(sparkBoost(dosed))),
    ok(backUp, 'and it goes back up to the ring with the dose on')
  ];
});
