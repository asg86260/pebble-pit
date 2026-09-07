import { PROP_COST, PROP_FROM, NET_COST, ARCH_COST, JACK_COST,
         PROP_WORK, NET_WORK, ARCH_WORK, JACK_WORK } from '../config.js';
import { S } from '../state.js';
import { raiseShield, shieldDone, shieldGround } from '../shield.js';

// The shields: what the yard puts between itself and the sky. Data only;
// upgrades.js strings the files together into UPGRADES.
//
// Every one is a `building` on the yard, which is what puts it through
// works.js: paying starts the work, a spare body is lent, it stands at the
// landing spot and hammers under a bar, and `buy` runs -- the shield stands --
// when the labor is in. A shield nobody works on does not go up, which is the
// same bargain everything past the bench strikes. `box` is the footprint the
// thing will stand on, worked out the same way `raiseShield` works it out, so
// the tape goes up around exactly that ground. Each carries its own `work`
// because the materials are not the same afternoon: rope is quick, timber is
// half a minute, stone and steel are labor.
//
// Every shield after the first is an argument with the one that just failed, so
// each is offered only once its predecessor has been answered -- an argument
// offered before the thing it answers is a row about nothing. And each is
// priced in a different coin, because each is the yard reaching for a different
// one of the things it makes. The fifth, the dome, is not here: it is the
// tower's, it lives on the tower's board, and it is the one shield with no
// `work` anywhere -- nobody builds it, the tower pours it.
export const SHIELD_ROWS = [
  {
    key: 'props',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround(),
    work: () => PROP_WORK,
    name: 'raise the props',
    note: () => 'timber legs and a lid over the rock, so the next one has something to answer',
    cost: () => PROP_COST,
    buy: () => raiseShield('props'),
    show: () => !S.shield && !shieldDone('props') && S.introDone && S.boulderNo >= PROP_FROM
  },
  // Rope off the farm, and the first idea that is not "build it stronger".
  {
    key: 'net',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround(),
    work: () => NET_WORK,
    name: 'sling the net',
    note: () => 'rope between two masts. if it cannot be stopped, it can be caught',
    cost: () => NET_COST,
    currency: 'spore',
    buy: () => raiseShield('net'),
    show: () => !S.shield && shieldDone('props') && !shieldDone('net') && S.farmOpen
  },
  // Stone, priced in the quarry's own coin because it is cut from the quarry:
  // the yard answering the sky with the best thing it has out of the ground.
  {
    key: 'arch',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround(),
    work: () => ARCH_WORK,
    name: 'cut the arch',
    note: () => 'stone over the landing spot. rock against rock, and this one is ours',
    cost: () => ARCH_COST,
    currency: 'shard',
    buy: () => raiseShield('arch'),
    show: () => !S.shield && shieldDone('net') && !shieldDone('arch') && S.quarryOpen
  },
  // A machine, so it is bought with what every machine is bought with. The last
  // thing the yard can try before it stops arguing with the ground.
  {
    key: 'jack',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround(),
    work: () => JACK_WORK,
    name: 'build the jack',
    note: () => 'a steel plate on rams. it does not wait for the rock, it pushes back',
    cost: () => JACK_COST,
    currency: 'spark',
    buy: () => raiseShield('jack'),
    show: () => !S.shield && shieldDone('arch') && !shieldDone('jack') && S.meteorOpen
  }
];
