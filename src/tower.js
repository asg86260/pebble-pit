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
import { STEP } from './mult.js';
import { S } from './state.js';
import { WIZ_DUST, WIZ_SHARDS, WIZ_SPORES, WIZ_RATE, WIZ_BREW_MS,
         WIZ_SPEED_COST, WIZ_POWER_COST, WIZ_LADDER_RATE, RUNGS, SPELLS,
         DOME_BILL, DOME_WORK } from './config.js';
import { raiseShield, shieldDone } from './shield.js';
import { now } from './clock.js';
import { rebalance } from './upgrades.js';
import { syncWorkers } from './crew.js';
import { emptySky } from './meteor.js';
import { registerRows, workOn, leftAt, progressOf } from './works.js';
import { TYPE } from './jobs.js';

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
export const brewing = () => !!workOn(TYPE.WIZARD);
export const brewLeft = () => leftAt('tower', TYPE.WIZARD);
export const brewAt = () => { const w = workOn(TYPE.WIZARD); return w ? progressOf(w) : 0; };

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
    // The tower board hides its gain column (see style.css, `#towershop .gain`)
    // on the reasoning that the note under the name says what a row buys -- and
    // these two rungs had no note, so they said nothing at all. The note carries
    // the number the column would have, and what the number is of.
    note: () => `every wizard throws a bolt at the star ${Math.round((STEP - 1) * 100)}% more often`,
    unit: 'bolts/min',
    pct: true,
    does: 'cast',
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
    note: () => `each bolt knocks ${wizBite() + 1} cells off the star instead of ${wizBite()}`,
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
    key: TYPE.WIZARD,
    name: 'train a wizard',
    // The note says what a wizard is for, not how long one takes: how long a
    // thing takes is part of what it costs, so that is priced in the bill under
    // a clock, and while one is being trained the clock counts down what is
    // left of it.
    note: () => 'flies up and bolts the star apart for sparks, and summons a new one when the sky is empty',
    // At the tower, where hats come from. The first one is the awkward case --
    // there is nobody up there until a hat exists -- and it is not answered
    // here: a station standing empty is lent a hand by the yard (see
    // `busyBuilderSites`), so the first hat is made by whoever is free and every
    // one after it by the wizards already wearing theirs.
    //
    // A rung, not a building: a hat is made inside a tower that already stands,
    // so nothing rises out of the ground and no tape goes round it -- the same
    // reasoning as the kit rows. The clock comes from `work` below.
    kind: 'rung', site: 'tower',
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
  },
  // And the last shield, which is the wizards' and nobody else's. It is here
  // rather than on the bench because it is not a thing the crew can carry out
  // and put up: the wizards fly over and pour it, the way they pour a star
  // into an empty sky, and the waiting is what makes it a spell. Priced in
  // cores -- the coin that opens what you do not have, which by now is the one
  // thing left. The clock on the bill is one body's pour; a ring of them
  // shares it, the same as a summoning.
  {
    key: 'dome',
    name: 'conjure the barrier',
    note: () => 'nothing can get past this thing.',
    bill: () => [...DOME_BILL.map(l => [...l]), ['time', DOME_WORK * 1000]],
    cost: () => DOME_BILL.find(([m]) => m === 'dust')[1],
    buy: () => raiseShield('dome'),
    // The three before it have all been through, and there is somebody who can
    // fly to cast it. It leaves the board the moment it is bought, because
    // unlike the hat there is only ever one of them -- and it stays gone once
    // the dome has done its work and faded (shield.js, `stepShield`), the same
    // way the three that broke never come back.
    show: () => !S.shield && shieldDone('arch') && !shieldDone('dome') && S.towerOpen &&
                (S.wizards > 0 || S.wizardHats > 0)
  }
];

// --- the black hole ------------------------------------------------------------
// **Nothing on this board is about the rift, and that is the whole of it.**
//
// There were two rows here in turn. The first summoned the black hole: red and
// dust, offered the first time the hole said no -- and what it was a cure for
// was a yard that had stopped earning, so it was priced in the very coin that
// had stopped coming in. That one went when the hole learned to collapse on its
// own (see `throughRift` in pit.js).
//
// The second was the ladder: how wide the hole is torn, bought a rung at a time,
// for ever. It went for a plainer reason. A black hole is not a thing you tune.
// It is the one object in this yard that is not machinery -- it has no walls, no
// tender and no dial, and a board row promising it half a second more appetite
// made it a machine with a bad interface. What it does now it does at full
// strength from the moment it tears: it takes everything, on the frame it
// arrives. See `stepRift` in rift.js.
//
// A save that bought rungs of the old ladder loses nothing by it -- every one of
// them collapses into behavior the yard now has for free, and `S.riftLevel` is
// still read back off the save so an old file still loads clean.

export const TOWER_SECTIONS = [
  { title: 'the tower', keys: [TYPE.WIZARD, 'wizspeed', 'wizpower'] },
  // And what the tower does for the rest of the yard, which is the only thing on
  // any board that is about somewhere else entirely.
  { title: 'enchantments', keys: SPELLS.map(sp => 'spell' + sp.key) },
  // The last shield is the tower's and nobody else's: it is not a thing the
  // crew can carry out and put up, it is poured. See DESIGN.md, "The shields".
  { title: 'the dome', keys: ['dome'] }
];

// and the yard is told what these rows are, so a work coming back out of a
// save knows which row it belongs to. See `registerRows` in works.js.
registerRows(TOWER_UPGRADES);
