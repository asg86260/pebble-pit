// The shields, and the shape a rock is in while it is arriving.
//
// DESIGN.md, "The shields": five tries at stopping the next rock, of which the
// first four fail -- the rocks are the game's income, and a wall that worked
// in the mid-game would starve the yard that built it. What every shield
// shares is here; what one kind does differently is a field in KINDS
// (shield.js). A shield's width and height are derived from the rock it stands
// over, so only the story's own numbers live in this file.

export const SHIELD_LEG_W = 2;       // cells across a leg or a pier
export const SHIELD_LID_T = 2;       // courses thick across the lid, and the arch's band
export const SHIELD_CLEAR_C = 4;     // courses of daylight kept over the rock's peak
export const SHIELD_PIECE_DUST = 25; // cells a piece breaks back into, so most of the spend comes home

// What each one costs in labor, in worker-seconds at the site (works.js).
// They climb with the material: timber goes up in half a minute, rope is quick,
// stone and steel are most of the yard's afternoon. The dome has no figure here
// because nobody works on it -- the tower pours it on its own clock.
export const PROP_WORK = 30;
export const NET_WORK = 20;
export const ARCH_WORK = 70;
export const JACK_WORK = 85;

// The props: timber, and the rock does not even slow down for it.
export const PROP_FROM = 4;         // rocks fallen before the yard thinks to look up
export const PROP_COST = 400;       // dust for the timber
export const PROP_PLANKS = 12;      // trips from the bench; one plank arrives per walk

// The net: rope off the farm, and the first idea that is not "build it
// stronger". It catches the rock and pays out under it, all the way down.
export const NET_COST = 300;        // spores: three plots' worth, not less than one
export const NET_ROPES = 10;
export const NET_SLOW = 26;         // world pixels a second the rock sinks through it

// The arch: quarried stone, priced in the quarry's own coin. It catches one --
// the hold is long enough for the yard to believe it has won, and short enough
// that the belief is the beat rather than a pause in the game.
export const ARCH_COST = 400;       // shards: more than the tiller, a real cut of the quarry
export const ARCH_BLOCKS = 16;      // heavier than timber, so more trips
export const ARCH_HOLD_MS = 2600;   // how long the rock rests on it before the crack runs

// The jack: a steel plate on rams, and the only shield that pushes back. The
// shove is the beat -- it is the closest the yard comes to winning -- so it is
// slow enough to read as effort rather than as a bounce.
export const JACK_COST = 450;       // sparks: above the drill, under the ram
export const JACK_PARTS = 14;
export const JACK_HOLD_MS = 1200;   // braced under the weight before it starts to lift
export const JACK_PUSH = 48;        // world pixels it drives the rock back up
export const JACK_PUSH_RATE = 22;   // and how fast, so the shove is visibly hard work

// The dome: the tower's, and the only one that holds. It is cast rather than
// carried: the wizards fly over and pour it the way they pour a star into an
// empty sky. It is priced in everything the yard makes, and it is the dearest
// thing in the game by a distance: every line of this bill stands well above
// the biggest ask of that coin on any other board at any rung (the balloon's
// dust, the ram's shards and sparks, the crit ladder's spores, the TNT's
// cores), and the whole bill comes to about a third of everything else on
// every board put together. It was four cores alone, which made the end of
// the argument cheaper than the machine that had just lost it; then eight and
// thirty thousand dust, which a climbed ladder or two outbid. The last shield
// is the whole works' answer to the sky, and it costs the whole works.
// `test/shield.test.mjs` holds this against every row on every board, climbed.
export const DOME_BILL = [['core', 25], ['dust', 250000], ['shard', 5000],
                          ['spore', 10000], ['spark', 5000]];
export const DOME_RINGS = 24;       // steps in the pour, for the reveal to run through
// Wizard-seconds of pouring, the same shape as a star's summoning: one body in
// the ring is three quarters of a minute, two is half that. Nobody on the
// ground can put a second of this in.
export const DOME_WORK = 45;
export const DOME_HOLD_MS = 2200;   // the rock rests overhead before it is let down
export const DOME_SET_RATE = 34;    // and comes down this gently, in world pixels a second

// How long a landed rock spends spreading and settling back into its own
// shape. Long enough to see it happen, short enough that it is over before you
// could reach for it -- an impact, not an animation. It lives beside the
// shields because the dome is what decides a rock does not do it: something
// set down gently is placed rather than dropped.
export const SQUASH_MS = 260;
export const SQUASH_WIDE = 0.16; // how much wider it goes at the worst of it
export const SQUASH_FLAT = 0.26; // and how much of its height it gives up
