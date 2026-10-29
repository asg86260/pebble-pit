import { BUILD_CAP_S } from './build.js';
// The shields, and the shape a rock is in while it is arriving.
//
// DESIGN.md, "The shields" and "The shields are the spine": four tries at
// stopping the next rock, of which the first three fail, and each failure
// opens the next station. What every shield shares is here; what one kind
// does differently is a field in KINDS (shield.js). A shield's width and
// height are derived from the rock it stands over, so only the story's own
// numbers live in this file.

export const SHIELD_LEG_W = 2;       // cells across a leg or a pier
// The most cells a shield under a rock it cannot take leans over, a held cell
// at a time as its strain climbs (render/shield.js): a held pose, not a shake.
export const SHIELD_LEAN = 2;
export const SHIELD_LID_T = 2;       // courses thick across the lid, and the arch's band
export const SHIELD_CLEAR_C = 4;     // courses of daylight kept over the rock's peak
export const SHIELD_PIECE_DUST = 25; // cells a piece breaks back into, so most of the spend comes home


// The props: timber, and the rock does not even slow down for it.
export const PROP_FROM = 2;         // boulderNo starts at 1 and counts up as a rock falls clear, so 2 is the first rock done
export const PROP_COST = 400;       // dust for the timber
export const PROP_PLANKS = 12;      // trips from the bench; one plank arrives per walk

// The net: rope off the farm. It catches the rock and pays out under it, all
// the way down.
export const NET_COST = 300;        // spores: three plots' worth, not less than one
export const NET_ROPES = 10;
export const NET_SLOW = 26;         // world pixels a second the rock sinks through it

// The arch: quarried stone, priced in the quarry's own coin. The hold is long
// enough for the yard to believe it has won, and short enough that the belief
// is the beat rather than a pause in the game.
export const ARCH_COST = 400;       // shards: more than the tiller, a real cut of the quarry
export const ARCH_BLOCKS = 16;      // heavier than timber, so more trips
export const ARCH_HOLD_MS = 2600;   // how long the rock rests on it before the crack runs
// A rock stopping on stone is an arrival: a knock, smaller than the ground's
// because the arch takes the weight before the ground does.
export const ARCH_CATCH_SHAKE = 6;  // world pixels the catch throws the view

// The dome: the tower's, and the only one that holds, cast by the wizards the
// way they pour a star. The dearest thing in the game by a distance: every
// line of this bill stands well above the biggest ask of that coin on any
// other board at any rung, and the whole bill is about a third of everything
// else on every board put together. The last shield is the whole works'
// answer to the sky, and it costs the whole works. `test/shield.test.mjs`
// holds this against every row on every board, climbed.
export const DOME_BILL = [['dust', 250000], ['shard', 5000],
                          ['spore', 10000], ['spark', 5000]];
export const DOME_RINGS = 24;       // steps in the pour, for the reveal to run through
// Wizard-seconds of pouring, the same shape as a star's summoning: one body in
// the ring is the build cap (`BUILD_CAP_S`), three are a third of it. Nobody on the
// ground can put a second of this in.
export const DOME_WORK = BUILD_CAP_S;
// The dome does not hold the rock up: it bursts it. The rock sits squashed on
// the crown for one held beat, then comes apart into its own grains, a grain a
// sheet as a pick takes them, which skate down the curve and heap on the
// ground outside it for the haulers to carry to the hole.
export const DOME_BURST_MS = 500;   // the held impact, squashed on the crown: a beat the eye can land on
export const DOME_SQUASH = 0.65;    // how squashed, as a share of a landing's worst (SQUASH_WIDE, SQUASH_FLAT)
// The burst is measured in dome radii, so a wide dome throws as far, as a
// share of itself, in the same time as a narrow one.
export const DOME_BURST_GRAV = 4.5;           // radii a second a second, pulling the grains down
export const DOME_BURST_SPEED = [0.6, 1.4];  // radii a second out from the crown, slowest and fastest
export const DOME_BURST_FLING = 1.8;          // the outward speed is this much of it across...
export const DOME_BURST_LIFT = 0.35;          // ...and this much of it up
export const DOME_BURST_POP = [0.26, 0.68];   // radii a second of hop on top, least and most
export const DOME_BURST_JITTER = 0.08;        // radii a second of sideways scatter, either way
export const DOME_SLIDE_KEEP = 0.92;          // of a grain's speed along the shell, kept a second
export const DOME_SLIDE_KICK = 0.6;           // of the blow of a grain coming down on the shell, turned down the curve
// How long the burst's flare takes to run from the crown down the band.
export const DOME_FLARE_MS = 450;
export const DOME_FLARE_W = 0.07;     // half its width, as a share of the way from foot to crown
export const DOME_FLARE_TRAIL = 0.1;  // and the paler one this far behind it
// The dome's one job is the rescue. Once they are out it has nothing left to
// do, and it is magic, not masonry, so it fades rather than falls: this long
// from the frame the rescue beat ends to gone. The one exit in
// the game with no body walking it, because there is no body.
export const DOME_FADE_MS = 1500;

// How wide the two curved shields stand, as a multiple of the width of the
// rock they are built for. An arch or a dome is a curve whose crown is the
// catch line, and a rock nearly as wide as the curve perches on its apex with
// its flanks hanging out over the haunches: the span has to be visibly wider
// than the rock on both sides for the rock to read as sitting *on* it. The
// flank clearance (ROCK_FLANK_CLEAR) still caps it.
export const ARCH_SPAN = 1.35;
export const DOME_SPAN = 1.5;

// The fanfare when a shield stands finished: one wave off its crown, out past
// the span, and the crew cheer under it for a moment. The wave's reach is a
// share of the span, so a wider shield throws a wider one; the cheer is the
// dance the crew do for a finished rock, cut short.
export const SHIELD_WAVE_MS = 1000;     // how long the wave takes to run out
export const SHIELD_WAVE_SPAN = 0.8;   // how far it reaches, as a share of the span
export const SHIELD_WAVE_POWER = 5;    // the specks thrown with it, in a crit's units
export const SHIELD_CHEER_MS = 2500;   // and how long the crew cheer

// How long a landed rock spends spreading and settling back into its own
// shape: an impact, not an animation. Beside the shields because the dome is
// what decides a rock does not do it -- something set down gently is placed
// rather than dropped.
export const SQUASH_MS = 260;
export const SQUASH_WIDE = 0.16; // how much wider it goes at the worst of it
export const SQUASH_FLAT = 0.26; // and how much of its height it gives up
