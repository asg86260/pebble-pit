import { PROP_COST, PROP_FROM, NET_COST, ARCH_COST, JACK_COST } from '../config.js';
import { S } from '../state.js';
import { raiseShield, shieldDone } from '../shield.js';

// The shields: what the yard puts between itself and the sky. Data only;
// upgrades.js strings the files together into UPGRADES.
//
// None of these carries a `kind`, which is what keeps them out of the build-site
// machinery in works.js -- and that is deliberate rather than an oversight. A
// shield *is* built over time by the crew walking pieces out to it, but it is
// shield.js that runs that walk, because what a shield does while it is going up
// (and what the next rock makes of a half-built one) is its own business. Two
// build systems on one object would be two answers to "how much of it is
// standing".
//
// Every shield after the first is an argument with the one that just failed, so
// each is offered only once its predecessor has been answered -- an argument
// offered before the thing it answers is a row about nothing. And each is
// priced in a different coin, because each is the yard reaching for a different
// one of the things it makes. The fifth, the dome, is not here: it is the
// tower's, and it lives on the tower's board. See DESIGN.md, "The shields".
export const SHIELD_ROWS = [
  {
    key: 'props',
    name: 'wooden barrier',
    note: () => 'quickly try to build a barrier to save your sqwife',
    cost: () => PROP_COST,
    buy: () => raiseShield('props'),
    show: () => !S.shield && !shieldDone('props') && S.introDone && S.boulderNo >= PROP_FROM
  },
  // Rope off the farm, and the first idea that is not "build it stronger".
  {
    key: 'net',
    name: 'the net',
    note: () => 'that didn\'t work, try catching the rock with a net?',
    cost: () => NET_COST,
    currency: 'spore',
    buy: () => raiseShield('net'),
    show: () => !S.shield && shieldDone('props') && !shieldDone('net') && S.farmOpen
  },
  // Stone, priced in the quarry's own coin because it is cut from the quarry:
  // the yard answering the sky with the best thing it has out of the ground.
  {
    key: 'arch',
    name: 'cut the arch',
    note: () => 'still not sturdy enough. lets build a stone arch.',
    cost: () => ARCH_COST,
    currency: 'shard',
    buy: () => raiseShield('arch'),
    show: () => !S.shield && shieldDone('net') && !shieldDone('arch') && S.quarryOpen
  },
  // A machine, so it is bought with what every machine is bought with. The last
  // thing the yard can try before it stops arguing with the ground.
  {
    key: 'jack',
    name: 'build the jack',
    note: () => 'a steel plate on posts. surely this can push the rock back',
    cost: () => JACK_COST,
    currency: 'spark',
    buy: () => raiseShield('jack'),
    show: () => !S.shield && shieldDone('arch') && !shieldDone('jack') && S.meteorOpen
  }
];
