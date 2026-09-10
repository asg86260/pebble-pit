// --- the tower ----------------------------------------------------------------
// What a core is for. The only thing in the game bought with one, and the only
// thing bought with all four at once: a core out of the rock, the dust the yard
// makes, the stone the quarry gives up and the crop off the plots. Everything the
// operation does, on one row.
// --- the meteor, and the wizards who work it ------------------------------------
// The second thing a core buys, and the only one that buys a *place*: the tower
// calls the meteor down out of the far sky and it hangs there over the yard,
// grey rind and a red middle, until somebody who can reach it goes and works it.
//
// Cores, because a core is the one thing the rock gives up that nothing else
// does, and calling a rock out of the sky should cost the rarest thing on the
// ground.
export const METEOR_CORES = 3;
export const METEOR_DUST = 6000;
// How much of the meteor is core, as a share of the radius. The rind is dust and
// the middle is the red -- so it is a dig you can see the end of: the grey
// shrinks, and one day there is red showing through it.
export const METEOR_CORE = 0.44;
// Sparks a cell of it is worth: the crust, and then the fire under it. The crust
// paid dust for a while, on the reasoning that a rind is rock -- but it is a
// star, the whole of it is hot, and grey grains coming out of a red thing was
// the picture arguing with itself. Everything it sheds is the red now, and the
// core is worth more of it because the core is what you dug down for.
export const METEOR_SPARKS = 1;
export const METEOR_CORE_SPARKS = 3;
// The sky no longer refills itself on a clock. What comes next is summoned --
// see SUMMON_MS -- so an empty sky is a job rather than a wait, and a yard with
// nobody in the air stays empty until somebody is put back in it.

// A wizard is a hat, like every other trade in this yard -- it is just the one
// hat nobody can do the job without. The tower makes them one at a time and
// takes its time over it: dust, stone and crop go in, and a while later there is
// a hat on the stand.
export const WIZ_DUST = 4000;
export const WIZ_SHARDS = 40;
export const WIZ_SPORES = 40;
export const WIZ_RATE = 1.7;         // and each one after the first
export const WIZ_BREW_MS = 120000;   // how long the tower is at it
// What a wizard does once it is up there: a bolt at the star, this often.
// 2600, not the old 1100: a fresh wizard should feel like the bottom of a
// ladder, not the top of one. The 5-rung speed ladder ends near ~850 ms, so
// every rung bought is a change you can watch. (wave6-sim, item 10)
export const WIZ_MS = 2600;
// The tower's own two ladders, and the sky's first.
//
// The wizards were the one trade with nothing to buy for them. Everything on the
// ground can be made quicker or stronger, and the thing standing between you and
// every spark in the game -- how fast a star comes apart -- could only be made
// faster by hiring another body and buying it a hat. So: how often a bolt goes,
// and how much of the star it takes when it lands.
// --- what the tower does for the rest of the yard --------------------------------
// Spells, and they are deliberately not another ladder.
//
// Everything else the tower sells is about the tower: a wizard, a faster bolt, a
// heavier one. What was missing is the tower having anything to do with the
// ground -- so these are one-off enchantments laid on *other* stations, bought
// once each, each one a plain statement about somewhere else in the yard.
//
// One-offs rather than rungs because that is what a spell is. A ladder is a
// thing you grind; an enchantment is a thing that is either on the yard or not,
// and the sentence "the machines run half again as fast" is worth more than five
// rungs of nine per cent.
// Worded as what changes, in the plainest numbers there are. The first draft
// said "half again as fast" and "a quarter again as much", which is a fraction
// you have to work out on a board you are meant to read at a glance -- and
// "raise the houses" for a price cut said nothing at all about the price.
export const SPELLS = [
  { key: 'drive',  name: 'speed the machines',   spark: 45,
    note: 'every machine in the yard runs 50% faster' },
  { key: 'luck',   name: 'enrich the quarry',    spark: 35,
    note: 'every dig in the quarry brings up 25% more ore' },
  { key: 'thrift', name: 'cheapen the houses',   spark: 30,
    note: 'every house from now on costs half as much' },
  { key: 'sweep',  name: 'quicken the janitors', spark: 25,
    note: 'janitors shovel and walk twice as fast' }
];
export const SPELL_DRIVE = 1.5;      // what each one is worth
export const SPELL_LUCK = 1.25;
export const SPELL_THRIFT = 0.5;
export const SPELL_SWEEP = 2;

export const WIZ_SPEED_COST = 12;    // sparks for the first rung of either
export const WIZ_POWER_COST = 16;
export const WIZ_LADDER_RATE = 1.8;  // and how much steeper each one gets
// It does not touch the thing. A body hanging against the rind with its arms in
// it was a rockhand on a rock four hundred feet up; what it does instead is circle
// the star at a distance and throw magic at it, which is the one thing in this
// yard that is allowed to happen at range -- it is the whole of what the hat is
// for.
export const WIZ_SPIN = 0.42;        // radians a second it goes round
export const BOLT_PACE = 2.4;        // pixels a frame a bolt travels
// And how far out the ring is, past the rind: far enough that the star is a
// thing they are working on rather than a thing they are standing in.
export const WIZ_ORBIT = 62;
// The trail a flying body leaves under it: magic coming off the hat, a speck at
// a time, drifting down and going out. It is the only thing in this game that
// says a body is being *carried* rather than standing on something.
export const WIZ_TRAIL_MS = 55;      // one speck this often, per body
export const WIZ_TRAIL_LIFE = 900;   // and this long before it is gone
// Calling one down. Once the tower has taught the sky the trick, it is the
// wizards who do it: they hang in a ring round the empty spot and pour light
// into the middle of it until there is something there. One body takes about
// this long; two take half of it, because it is the same work shared.
export const SUMMON_MS = 42000;
export const SUMMON_FLASH = 900;     // and how long the sky keeps the flash
// And what the arrival does to the view. Less than a rock landing -- that is a
// hundred tons hitting the ground twenty feet away and this is a star lighting
// four hundred feet up -- but the one thing in the sky that should be felt on
// the ground as well as seen.
export const SUMMON_SHAKE = 9;
// What the tower does while it is making a hat: rings of light going out from
// the spire, one after another, in the wizards' own purple. Three of them in the
// air at once at this spacing reads as a thing pulsing rather than a thing that
// blinked once.
export const TOWER_WAVE_MS = 2200;   // seconds a ring takes to go out
export const TOWER_WAVE_N = 3;       // and how many are on their way at once
export const TOWER_WAVE_R = 96;      // how far one gets before it is spent
export const WIZ_RISE = 1.4;         // pixels a frame it floats, up or down
export const WIZ_BOB = 2.2;          // and how far it drifts as it hangs there

// --- what the star looks like ---------------------------------------------------
// It is a star, not a stone. The crust is black and dead and the core under it is
// fire, so a corona stands off it from the first moment and the thing gets
// visibly hotter as the crust is taken off: the rays redden as the fire is
// uncovered, which is the same fact the counter is about to be told.
export const RAY_N = 16;             // rays around it
export const RAY_MIN = 2;            // cells long at their shortest
export const RAY_MAX = 5;            // and at their longest
export const RAY_BEAT = 1.7;         // seconds for one breath of the corona
export const CORE_FLICK = 260;       // ms a core cell holds a tone before it shifts

// How near the meteor a wizard works from: it hangs off the rind rather than
// inside it, so what it is taking apart is not behind it.
export const WIZ_STANDOFF = 16;

// A core and a thousand dust, and nothing else.
//
// It asked for all four at once, which is the only price in the game that does
// -- and a bill with four lines on it is a row you have to study rather than
// read. It also said the wrong thing: the row's own note is "what a core is
// for", and a core that costs a core *and* a thousand of everything else is not
// what a core is for, it is what the end of the game is for.
export const TOWER_CORES = 1;
export const TOWER_DUST = 1000;
