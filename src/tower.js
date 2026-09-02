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

import { wizMs, wizBite } from './wizard.js';
import { STEP } from './lab.js';
import { S, rift } from './state.js';
import { WIZ_DUST, WIZ_SHARDS, WIZ_SPORES, WIZ_RATE, WIZ_BREW_MS,
         WIZ_SPEED_COST, WIZ_POWER_COST, WIZ_LADDER_RATE, RUNGS, SPELLS,
         RIFT_BILL, RIFT_RATE } from './config.js';
import { now } from './clock.js';
import { rebalance } from './upgrades.js';
import { lookAt } from './world.js';
import { riftRate, riftUpCost } from './rift.js';
import { syncWorkers } from './crew.js';
import { emptySky } from './meteor.js';
import { registerRows, workOn, leftAt, progressOf } from './works.js';

// what the next hat costs, in each of the three things the yard makes
export const wizCost = () => {
  const up = Math.pow(WIZ_RATE, S.wizardHats);
  return { dust: Math.round(WIZ_DUST * up),
           shards: Math.round(WIZ_SHARDS * up),
           spores: Math.round(WIZ_SPORES * up) };
};

// how far through the hat on the go it is, 0..1, for the row to say
// Whether a hat is on the go, and how far along it is.
//
// It used to be a wall clock -- `S.brewAt`, a deadline -- so a wizard trained
// itself while the tower stood empty, which nothing else in this yard does. It
// is an ordinary work at the tower now: somebody has to be up there, the bar
// over the tower says how far along it is, and the row's clock counts down at
// the rate it is actually going. The rule the whole game runs on is that a
// station idles until somebody is actually standing there, and the tower was
// the one place quietly exempt from it.
export const brewing = () => !!workOn('wizard');
export const brewLeft = () => leftAt('tower', 'wizard');
export const brewAt = () => { const w = workOn('wizard'); return w ? progressOf(w) : 0; };

// A minute and a half is a long time to look at a number of milliseconds.
const mins = ms => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`;
};

// What a finished hat does. Called by the row's own `buy` when the work lands,
// the same as every other row in the game.
export function hatMade() {
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

// Whether an enchantment has been laid on the yard.
export const spelled = key => (S.spells || []).includes(key);

export const TOWER_UPGRADES = [
  // The spells. One row each, bought once, and each one a plain sentence about
  // somewhere else in the yard -- which is the whole reason they are not rungs.
  ...SPELLS.map(sp => ({
    key: 'spell' + sp.key,
    // A spell is worked out at the tower like everything else there. It was had
    // the instant you pressed it -- four rows that changed the whole yard with
    // no clock on them and nothing to watch.
    kind: 'building', site: 'tower',
    name: sp.name,
    note: () => sp.note,
    bill: () => [['spark', sp.spark], ['dust', 2500]],
    buy: () => { if (!spelled(sp.key)) S.spells = [...(S.spells || []), sp.key]; },
    show: () => S.towerOpen && S.seenSpark && !spelled(sp.key)
  })),
  {
    // How often a wizard throws. The tower had no ladders at all -- the one
    // thing standing between you and every spark in the game could only be made
    // faster by hiring another body and buying it a hat.
    key: 'wizspeed',
    kind: 'rung', site: 'tower',
    name: 'quicker casting',
    unit: 'bolts/min',
    pct: true,
    rung: () => S.wizSpeedLevel,
    from: () => 60000 / wizMs(),
    to: () => 60000 / (wizMs() / STEP),
    bill: () => [['spark', Math.round(WIZ_SPEED_COST * Math.pow(WIZ_LADDER_RATE, S.wizSpeedLevel))],
                 ['dust', Math.round(600 * Math.pow(WIZ_LADDER_RATE, S.wizSpeedLevel))]],
    buy: () => { S.wizSpeedLevel++; },
    show: () => S.towerOpen && S.seenSpark && S.wizSpeedLevel < RUNGS
  },
  {
    // And how much of the star comes off when one lands. A star should come
    // apart in patches, so a stronger bolt spreads outward from where it hit
    // rather than punching a deeper hole.
    key: 'wizpower',
    kind: 'rung', site: 'tower',
    name: 'heavier bolts',
    unit: 'cells/bolt',
    rung: () => S.wizPowerLevel,
    from: () => wizBite(),
    to: () => wizBite() + 1,
    bill: () => [['spark', Math.round(WIZ_POWER_COST * Math.pow(WIZ_LADDER_RATE, S.wizPowerLevel))],
                 ['dust', Math.round(900 * Math.pow(WIZ_LADDER_RATE, S.wizPowerLevel))]],
    buy: () => { S.wizPowerLevel++; },
    show: () => S.towerOpen && S.seenSpark && S.wizPowerLevel < RUNGS
  },

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
    // At the tower, where hats come from. The first one is the awkward case --
    // there is nobody up there until a hat exists -- and it is not answered
    // here: `busyBuilderSites` sends the yard's spare hands to any station whose
    // gang is empty, so the first hat is made by whoever is free and every one
    // after it by the wizards already wearing theirs.
    kind: 'building', site: 'tower',
    // ...and this is the row that makes the tower's own gang, which is what
    // lets the yard lend a hand for the first one. See `busyBuilderSites`.
    hires: 'wizards',
    // Its own figure rather than the table's, because a hat has always taken a
    // minute and a half and this is not the moment to change what it costs.
    work: () => WIZ_BREW_MS / 1000,
    bill: () => { const c = wizCost();
                  return [['dust', c.dust], ['shard', c.shards], ['spore', c.spores]]; },
    cost: () => wizCost().dust,
    // Paying starts it. What you get for the money is the tower's time, and it
    // takes as long as it takes.
    // One at a time. A tower with three hats on the go is a shop with a queue in
    // it, and the waiting is the whole of what makes this row a spell -- so a
    // second buy while one is on the go does nothing, and the row stays up
    // saying how long is left rather than vanishing until it is done.
    buy: hatMade,
    // Once the tower is up, not once the sky is: this row is how the sky opens.
    show: () => S.towerOpen
  }
];

// --- the black hole ------------------------------------------------------------
// The rift, summoned. It used to be a row on the bench under `the hole`, which
// sold it as a purchase: pay, and the hole in the ground has a hole in the air
// beside it. It is the one plainly magic thing done to the one plainly dirt
// thing, and the tower is where the yard's magic comes from -- so it is called
// down from here, once the pit has been a problem, the way the first star was.
// Its ladder sits beside it for the same reason the wizards' do: what a board
// is about is what stands on it. What it is and what it swallows is in rift.js.
TOWER_UPGRADES.push(
  {
    key: 'rift',
    kind: 'building', site: 'tower',
    name: 'summon a black hole',
    note: () => 'a hole in the pit that swallows what will not fit: the hole stops being the ceiling',
    bill: () => RIFT_BILL,
    buy: () => { S.riftOpen = true; lookAt(rift.x + rift.w / 2); },
    // Once the tower stands, there is red to spend, and the hole has actually
    // turned dust away. Offering a cure for a full pit to somebody who has never
    // filled one is the scrubbing house's mistake -- the disease is the
    // advertisement, and here the disease is a hauler standing at the lip
    // holding a load it cannot put down. Not a threshold on how much has been
    // banked: see `bankDust`.
    show: () => S.towerOpen && S.seenSpark && S.seenFullPit && !S.riftOpen
  },
  {
    key: 'riftrate',
    kind: 'rung', site: 'tower',
    name: 'widen the black hole',
    unit: 'dust/s',
    // No `rung`, and that is the point rather than an omission. `rungOf` calls a
    // row with no rung "not a ladder at all -- a building, a one-off, a job --
    // and never finished", which is exactly what this is. Five pips over the one
    // row in the game that must not end would be the board promising an end.
    note: () => `it swallows ${Math.round(riftRate() * RIFT_RATE)} a second instead of ${Math.round(riftRate())}`,
    bill: () => [['spark', riftUpCost()], ['dust', riftUpCost() * 60]],
    buy: () => { S.riftLevel = (S.riftLevel || 0) + 1; },
    show: () => S.towerOpen && !!S.riftOpen
  }
);

export const TOWER_SECTIONS = [
  { title: 'the tower', keys: ['wizard', 'wizspeed', 'wizpower'] },
  // And what the tower does for the rest of the yard, which is the only thing on
  // any board that is about somewhere else entirely.
  { title: 'enchantments', keys: SPELLS.map(sp => 'spell' + sp.key) },
  // And the one it does to the hole.
  { title: 'the black hole', keys: ['rift', 'riftrate'] }
];

// and the yard is told what these rows are, so a work coming back out of a
// save knows which row it belongs to. See `registerRows` in works.js.
registerRows(TOWER_UPGRADES);
