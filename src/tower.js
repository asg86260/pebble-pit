// The tower: the far end of the walk, and the only thing a core buys.
//
// What it sells is not a rate. Everything else in this yard makes a number go up
// faster; the tower makes a thing stop happening, or makes a thing possible that
// was not. Three rows: a chore you no longer have, a rock called down out of the
// sky, and the hat that lets somebody go and work it.
//
// The hat is the one purchase in the game you wait for. Everything else is
// instant because everything else is a thing the crew already knew how to do and
// you were only paying for it; this is the tower actually making something, and
// a spell that lands the moment you can afford it is a shop row rather than a
// spell.

import { S } from './state.js';
import { WIZ_DUST, WIZ_SHARDS, WIZ_SPORES, WIZ_RATE, WIZ_BREW_MS,
         DOME_COST, DOME_CAST_MS } from './config.js';
import { raiseShield, shieldDone } from './shield.js';
import { now } from './clock.js';
import { rebalance } from './upgrades.js';
import { syncWorkers } from './crew.js';
import { emptySky } from './meteor.js';

// what the next hat costs, in each of the three things the yard makes
export const wizCost = () => {
  const up = Math.pow(WIZ_RATE, S.wizardHats);
  return { dust: Math.round(WIZ_DUST * up),
           shards: Math.round(WIZ_SHARDS * up),
           spores: Math.round(WIZ_SPORES * up) };
};

// how far through the hat on the go it is, 0..1, for the row to say
export const brewing = () => S.brewAt > 0;
export const brewLeft = () => Math.max(0, S.brewAt - now());
export const brewAt = () => brewing() ? 1 - brewLeft() / WIZ_BREW_MS : 0;

// A minute and a half is a long time to look at a number of milliseconds.
const mins = ms => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`;
};

export function stepTower() {
  if (!brewing() || now() < S.brewAt) return;
  S.brewAt = 0;
  S.wizardHats++;
  // The first hat opens the sky -- empty, because a star is a thing wizards make
  // and this is the moment there is one to make it. Whoever wears this hat goes
  // up to nothing at all and summons the first one, which is what the ring of
  // them does for every star after it too.
  if (!S.meteorOpen) {
    S.meteorOpen = true;
    S.skyShown = true;
    emptySky();
  }
  rebalance();
  syncWorkers();
  S.dirty = true;
}

export const TOWER_UPGRADES = [
  // A meteor is not bought any more: raising the tower calls the first one down
  // -- see `unlocktower` in upgrades.js. It was a row that asked for a second
  // core to do the one thing the tower is *for*, on a board that then had
  // nothing else on it until you had paid: you built the thing that reaches the
  // sky and were told the sky cost extra. And after that first one the wizards
  // summon their own, so the row was a toll on the way in and nothing else.
  // And the hat. Dust, stone and crop -- everything the ground makes, for the
  // one body that will not be standing on it.
  {
    key: 'wizard',
    name: 'train a wizard',
    // No note. What the note said was how long it takes, and how long a thing
    // takes is part of what it costs -- so it is priced in the bill with the
    // rest of it, under a clock, and the row does not need a second sheet to
    // open beside it to say one number. While one is being trained the clock
    // counts down what is left of it.
    bill: () => { const c = wizCost();
                  return [['dust', c.dust], ['shard', c.shards], ['spore', c.spores],
                          ['time', brewing() ? brewLeft() : WIZ_BREW_MS]]; },
    cost: () => wizCost().dust,
    // Paying starts it. What you get for the money is the tower's time, and it
    // takes as long as it takes.
    // One at a time. A tower with three hats on the go is a shop with a queue in
    // it, and the waiting is the whole of what makes this row a spell -- so a
    // second buy while one is on the go does nothing, and the row stays up
    // saying how long is left rather than vanishing until it is done.
    buy: () => { if (!brewing()) S.brewAt = now() + WIZ_BREW_MS; },
    dead: () => brewing(),
    // Once the tower is up, not once the sky is: this row is how the sky opens.
    show: () => S.towerOpen
  },
  // And the last shield, which is the tower's and nobody else's. It is here
  // rather than on the bench because it is not a thing the crew can carry out
  // and put up: the tower pours it, the way it pours a hat, and the waiting is
  // what makes it a spell. Priced in cores -- the coin that opens what you do
  // not have, which by now is the one thing left.
  {
    key: 'dome',
    name: 'raise the dome',
    note: () => 'the spire pours it over the landing spot, and the sky stops being a thing that arrives',
    bill: () => [['core', DOME_COST], ['time', DOME_CAST_MS]],
    cost: () => DOME_COST,
    buy: () => raiseShield('dome'),
    // The four before it have all been through, and there is a tower to cast
    // it from. It leaves the board the moment it is bought, because unlike the
    // hat there is only ever one of them.
    show: () => !S.shield && shieldDone('jack') && S.towerOpen
  }
];

export const TOWER_SECTIONS = [
  { title: 'the tower', keys: ['wizard', 'dome'] }
];
