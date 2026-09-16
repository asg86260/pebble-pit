// The tower's board: the hat that lets somebody work the sky, the wizards'
// two ladders, the spells and the dome.

import { wizMs, wizBite } from './wizard.js';
import { STEP } from './mult.js';
import { S } from './state.js';
import { WIZ_DUST, WIZ_SHARDS, WIZ_SPORES, WIZ_RATE, WIZ_BREW_MS,
         WIZ_SPEED_COST, WIZ_POWER_COST, WIZ_LADDER_RATE, RUNGS, SPELLS,
         DOME_BILL, DOME_WORK, SPELL_DRIVE, SPELL_LUCK, SPELL_THRIFT, SPELL_SWEEP } from './config.js';
import { raiseShield, shieldDone } from './shield.js';

import { rebalance } from './upgrades.js';
import { syncWorkers } from './crew.js';
import { emptySky } from './meteor.js';
import { registerRows, workOn, progressOf } from './works.js';
import { TYPE } from './jobs.js';
import { MACHINES, machine } from './machines.js';

// what the next hat costs, in each of the three things the yard makes
export const wizCost = () => {
  const up = Math.pow(WIZ_RATE, S.wizardHats);
  return { dust: Math.round(WIZ_DUST * up),
           shards: Math.round(WIZ_SHARDS * up),
           spores: Math.round(WIZ_SPORES * up) };
};

// Whether a hat is on the go, and how far along it is: an ordinary work at
// the tower, so somebody has to be up there.
export const brewing = () => !!workOn(TYPE.WIZARD);
export const brewAt = () => { const w = workOn(TYPE.WIZARD); return w ? progressOf(w) : 0; };

// A minute and a half is a long time to look at a number of milliseconds.
const mins = ms => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s}s`;
};

// What a finished hat does, called by the row's `buy` when the work lands.
export function hatMade() {
  S.wizardHats++;
  // The first hat opens the sky, empty: whoever wears it goes up and summons
  // the first star, as the ring does for every star after.
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

// What each spell is worth, off its own constant so the card cannot drift
// from what the yard does with it; the figure alone, since a slot is
// seventeen characters and the name already says what is enchanted. And what
// each has to have in the yard before it is offered: the thing it is a
// sentence about.
const pct = f => `${Math.round(Math.abs(f - 1) * 100)}%`;
const SPELL_BLURB = {
  drive: () => `+${pct(SPELL_DRIVE)} speed`,
  luck: () => `+${pct(SPELL_LUCK)} ore`,
  thrift: () => `${pct(SPELL_THRIFT)} cheaper`,
  sweep: () => `${SPELL_SWEEP}x faster`
};
const SPELL_NEEDS = {
  drive: () => MACHINES.some(m => machine(m.key)?.bought),
  luck: () => !!S.quarryOpen,
  thrift: () => true,
  sweep: () => !!S.outhouseOpen
};

export const TOWER_UPGRADES = [
  // The spells: one row each, bought once, each a sentence about somewhere
  // else in the yard, which is why they are not rungs.
  ...SPELLS.map(sp => ({
    key: 'spell' + sp.key,
    // Worked at the tower like everything else there.
    kind: 'building', site: 'tower',
    name: sp.name,
    note: () => sp.note,
    blurb: SPELL_BLURB[sp.key](),
    bill: () => [['spark', sp.spark], ['dust', 2500]],
    buy: () => { if (!spelled(sp.key)) S.spells = [...(S.spells || []), sp.key]; },
    show: () => S.towerOpen && S.seenSpark && !spelled(sp.key) && SPELL_NEEDS[sp.key]()
  })),
  {
    // How often a wizard throws.
    key: 'wizspeed',
    kind: 'rung', site: 'tower',
    name: 'quicker casting',
    // The tower board hides its gain column (`#towershop .gain` in style.css),
    // so the note carries the number the column would have.
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
    // How much of the star comes off when a bolt lands: a stronger bolt
    // spreads outward from where it hit rather than punching deeper.
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

  // The hat: everything the ground makes, for the one body that will not be
  // standing on it.
  {
    key: TYPE.WIZARD,
    name: 'train a wizard',
    note: () => 'flies up and bolts the star apart for sparks, and summons a new one when the sky is empty',
    // A rung, not a building: made inside a tower that already stands, so
    // nothing rises and no tape goes round it. The first hat is made by
    // whoever the yard lends an empty station (`busyBuilderSites`).
    kind: 'rung', site: 'tower',
    work: () => WIZ_BREW_MS / 1000,
    bill: () => { const c = wizCost();
                  return [['dust', c.dust], ['shard', c.shards], ['spore', c.spores]]; },
    cost: () => wizCost().dust,
    buy: hatMade,
    // Once the tower is up, not once the sky is: this row is how the sky opens.
    show: () => S.towerOpen
  },
  // The last shield, poured by the wizards rather than carried out and put
  // up, which is why it is here and not on the bench. The clock on the bill
  // is one body's pour; a ring shares it, the same as a summoning.
  {
    key: 'dome',
    name: 'conjure the barrier',
    note: () => 'nothing can get past this thing.',
    bill: () => [...DOME_BILL.map(l => [...l]), ['time', DOME_WORK * 1000]],
    cost: () => DOME_BILL.find(([m]) => m === 'dust')[1],
    buy: () => raiseShield('dome'),
    // Gone once bought, and gone for good once the dome has done its work and
    // faded (`stepShield` in shield.js).
    show: () => !S.shield && shieldDone('arch') && !shieldDone('dome') && S.towerOpen &&
                (S.wizards > 0 || S.wizardHats > 0)
  }
];

// Nothing on this board is about the rift: a black hole is not a thing you
// tune, and it takes everything from the frame it tears (`stepRift` in
// rift.js). `S.riftLevel` is still read off old saves so they load clean.

export const TOWER_SECTIONS = [
  { title: 'the tower', keys: [TYPE.WIZARD, 'wizspeed', 'wizpower'] },
  { title: 'enchantments', keys: SPELLS.map(sp => 'spell' + sp.key) },
  { title: 'the dome', keys: ['dome'] }
];

// so a work coming back out of a save knows which row it belongs to
registerRows(TOWER_UPGRADES);
