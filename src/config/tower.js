// --- the tower ----------------------------------------------------------------
// --- the meteor, and the wizards who work it ------------------------------------
// How much of the meteor is core, as a share of the radius: a dig you can see
// the end of, the grey shrinking until red shows through.
export const METEOR_CORE = 0.44;
// Sparks a cell of it is worth: the crust, and then the fire under it. The
// whole of a star is hot, so everything it sheds is the red; the core is
// worth more because the core is what you dug down for.
export const METEOR_SPARKS = 1;
export const METEOR_CORE_SPARKS = 3;
// The sky does not refill itself on a clock. What comes next is summoned
// (SUMMON_MS), so an empty sky is a job rather than a wait.

// A wizard is a hat, like every other trade -- the one hat nobody can do the
// job without. The tower makes them one at a time and takes its time over it.
export const WIZ_DUST = 1000;
export const WIZ_SHARDS = 200;
export const WIZ_SPORES = 200;
export const WIZ_RATE = 1.7;         // and each one after the first
export const WIZ_BREW_MS = 120000;   // how long the tower is at it
// A bolt at the star, this often. A fresh wizard should feel like the bottom
// of a ladder: the speed ladder ends near ~850 ms, so every rung bought is a
// change you can watch.
export const WIZ_MS = 2600;
// --- what the tower does for the rest of the yard --------------------------------
// Spells: one-off enchantments laid on *other* stations, bought once each,
// deliberately not another ladder. A ladder is a thing you grind; an
// enchantment is either on the yard or not, and "the machines run half again
// as fast" is worth more than five rungs of nine per cent. Worded as what
// changes, in the plainest numbers there are.
export const SPELLS = [
  { key: 'drive',  name: 'speed the machines',   spark: 135,
    note: 'every machine in the yard runs 50% faster' },
  { key: 'luck',   name: 'enrich the quarry',    spark: 105,
    note: 'every dig in the quarry brings up 25% more ore' },
  { key: 'gmo',    name: 'genetically modify crops', spark: 105,
    note: 'every crop is 25% bigger' },
  { key: 'thrift', name: 'cheapen the houses',   spark: 90,
    note: 'every house from now on costs half as much' },
  { key: 'sweep',  name: 'quicken the janitors', spark: 75,
    note: 'janitors shovel and walk twice as fast' }
];
export const SPELL_DRIVE = 1.5;      // what each one is worth
export const SPELL_LUCK = 1.25;
export const SPELL_GMO = 1.25;
export const SPELL_THRIFT = 0.5;
export const SPELL_SWEEP = 2;

// The tower's own two ladders: how often a bolt goes, and how much of the star
// it takes when it lands.
export const WIZ_SPEED_COST = 36;    // sparks for the first rung of either
export const WIZ_POWER_COST = 48;
export const WIZ_LADDER_RATE = 1.8;  // and how much steeper each one gets
// It does not touch the thing: it circles the star at a distance and throws
// magic at it, the one thing in this yard allowed to happen at range.
export const WIZ_SPIN = 0.42;        // radians a second it goes round
export const BOLT_PACE = 2.4;        // pixels a frame a bolt travels
// How far out the ring is, past the rind: far enough that the star is a thing
// they are working on rather than a thing they are standing in.
export const WIZ_ORBIT = 62;
// The trail a flying body leaves under it: magic coming off the hat, a speck
// at a time. The only thing in this game that says a body is being *carried*
// rather than standing on something.
export const WIZ_TRAIL_MS = 55;      // one speck this often, per body
export const WIZ_TRAIL_LIFE = 900;   // and this long before it is gone
// Calling one down: the wizards hang in a ring round the empty spot and pour
// light into the middle of it. One body takes about this long; two take half
// of it, because it is the same work shared.
export const SUMMON_MS = 42000;
export const SUMMON_FLASH = 900;     // and how long the sky keeps the flash
// What the arrival does to the view: less than a rock landing, but felt on
// the ground as well as seen.
export const SUMMON_SHAKE = 9;
// What the tower does while it is making a hat: rings of light going out from
// the spire, in the wizards' own purple. Three in the air at once at this
// spacing reads as a thing pulsing rather than a thing that blinked once.
export const TOWER_WAVE_MS = 2200;   // seconds a ring takes to go out
export const TOWER_WAVE_N = 3;       // and how many are on their way at once
export const TOWER_WAVE_R = 96;      // how far one gets before it is spent
export const WIZ_RISE = 1.4;         // pixels a frame it floats, up or down
export const WIZ_BOB = 2.2;          // and how far it drifts as it hangs there
// The flight to the dome is the whole width of the yard, where the climb to
// the star is straight up and slow on purpose, so it flies: full tilt across
// the yard, easing off over the last stretch so it arrives at the ring rather
// than hitting it.
export const WIZ_DASH = 12;          // pixels a frame, flat out
export const WIZ_DASH_EASE = 12;     // pixels of run-in per pixel a frame of pace
// It starts pouring as it comes in, from about this far out, so the beam
// reaches the dome as the body does rather than a beat after it has stopped.
export const WIZ_REACH = 220;

// --- what the star looks like ---------------------------------------------------
// The crust is black and dead and the core under it is fire, so a corona
// stands off it from the first moment and the rays redden as the fire is
// uncovered, which is the same fact the counter is about to be told.
export const RAY_N = 16;             // rays around it
export const RAY_MIN = 2;            // cells long at their shortest
export const RAY_MAX = 5;            // and at their longest
export const RAY_BEAT = 1.7;         // seconds for one breath of the corona
export const CORE_FLICK = 260;       // ms a core cell holds a tone before it shifts

// Two cores and four thousand dust, and nothing else: a bill with four lines on it
// is a row you have to study rather than read.
export const TOWER_CORES = 2;
export const TOWER_DUST = 4000;
