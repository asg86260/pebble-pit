// --- the sound of the yard -------------------------------------------------
// Every number audio.js runs on. The law it is all in service of is in
// DESIGN.md, "The sound of the yard": you hear the yard, not the game, and
// everything is struck, nothing is played. What that comes to in numbers is
// one narrow, low band -- nothing bright, nothing long -- and a discipline
// about how much of the yard may sound at once, which is the part that decides
// whether the game is bearable at minute ninety.
//
// None of these has been heard yet by the hand that wrote them: the node tier
// can hold the decisions (how many voices forty grains become) and nothing
// else, so the ones that want an ear are `let` and hang on the dev panel.

// --- the mix -----------------------------------------------------------------
// Quiet by default, and satisfying at that volume. The target is a laptop
// speaker at half volume in a room with other things going on; a sound that
// has to be loud to be good has not been designed yet.
export let SND_MASTER = 0.18;
// The six-grey palette enforced in one place: a lowpass over everything, so no
// voice has to be trusted to stay dull on its own. High frequency is what wears
// an ear out over an hour, and this is a game about grey rock under an
// overcast sky, not about glass. A gentle corner rather than a wall.
export let SND_LOWPASS_HZ = 5000;
export const SND_LOWPASS_Q = 0.5;      // a soft knee: the nearest a biquad gets to one pole
// The soft limiter, which is there so the endgame yard at full tilt is the
// same loudness as the opening yard rather than louder. Slow release, so it
// leans on the whole mix rather than pumping on each hit.
export const SND_LIMIT_DB = -18;
export const SND_LIMIT_RATIO = 8;
export const SND_LIMIT_RELEASE_S = 0.4;
export const SND_LIMIT_ATTACK_S = 0.005;
export const SND_LIMIT_KNEE_DB = 12;
// The mute ramps rather than cuts, both ways -- a gain that jumps is a click.
export const SND_MUTE_S = 0.05;

// --- every one-shot ------------------------------------------------------------
// Nothing repeats exactly: every strike takes a little detune, a little level
// and a little timing scatter from the game's own `rand()`, so a seeded run
// has a seeded soundtrack. Two semitones is the outer limit before variation
// stops sounding like variation and starts sounding like a fault.
export const SND_JITTER_CENTS = 100;
export const SND_JITTER_DB = 2;
export const SND_JITTER_MS = 8;
// Nearly mono. The yard is drawn flat, so it is panned shallowly from world x
// against the middle of the view and capped well short of hard; a hard-panned
// yard is a yard you have to sit in the middle of.
export const SND_PAN_MAX = 0.3;
// No gain value ever jumps: this is the least attack anything gets, beds
// included. Releases go through setTargetAtTime, and the constant below is how
// many time constants a release is allowed to run before the voice is retired.
export const SND_ATTACK_S = 0.003;
export const SND_RELEASE_TAILS = 5;
// A voice stolen by the cap fades rather than stops.
export const SND_STEAL_S = 0.02;
// How many one-shots may sound at once. Past this the oldest and quietest is
// taken, and the player's own hand is never the one taken.
export let SND_VOICES = 16;

// --- how each voice is made ----------------------------------------------------
// One signal chain with six settings: noise or a sine, through a bandpass, under
// an envelope. What separates stone from metal is where the band sits, how
// wide it is and how long the ring is -- not a different technique. Everything
// sits around one low center, the yard's note, so fifty unrelated events in a
// second still sound like fifty things in one room.
//
//   hz      the band's center
//   q       how narrow: low is a thud, high is a ring
//   decay   seconds for the envelope's release constant
//   level   the voice's own level, before jitter and the mix
//   second  [ratio, share] -- a second band at hz * ratio, at share of the
//           level, for the voices that need one (wood's hollowness, metal's
//           detuned pair)
export let SND_STONE = { hz: 180, q: 1.2, decay: 0.06, level: 0.5 };
export let SND_WOOD  = { hz: 420, q: 4, decay: 0.035, level: 0.4, second: [2.7, 0.25] };
export let SND_METAL = { hz: 640, q: 9, decay: 0.14, level: 0.32, second: [1.04, 0.8] };
// Water and air as one-shots are not used by anybody yet -- rain is a bed and
// wind is a bed -- but the seam allows them, so they have a shape: a soft,
// wide, low band, over before it is noticed.
export let SND_WATER_SHOT = { hz: 300, q: 0.7, decay: 0.08, level: 0.25 };
export let SND_AIR_SHOT   = { hz: 240, q: 0.5, decay: 0.12, level: 0.2 };
// The rift's one-shot is the tear: the two beating sines the bed is made of,
// struck rather than held, for the moment a rung lands.
export let SND_RIFT_SHOT  = { hz: 48, q: 0, decay: 0.5, level: 0.45 };
// `hard` in [0, 1] moves the band down and dulls it: harder rock is lower and
// duller, not louder. A reward that is merely louder is a slot machine.
export const SND_HARD_DROP = 0.45;     // share of the center taken off at hard = 1
export const SND_HARD_DULL = 0.5;      // share of the q taken off at hard = 1
// `big` puts a sine thump under stone that tunes down as it goes: the boulder,
// a core banking, a building coming down onto its footprint.
export const SND_THUMP_HZ = 70;
export const SND_THUMP_FALL = 0.45;    // it ends at this share of where it began
export const SND_THUMP_S = 0.22;
export const SND_THUMP_LEVEL = 0.6;
// `crit` adds body, not level: a second band an octave down, under the same
// envelope, so it is the same voice with more under it rather than a louder
// one.
export const SND_CRIT_RATIO = 0.5;
export const SND_CRIT_SHARE = 0.7;

// --- density -------------------------------------------------------------------
// A handful of gravel is one sound, not forty. Events of the folding class
// arriving inside a window neither queue nor each fire: they fold into the one
// sound the window emits when it closes, a little louder and a little wider
// for each one folded in.
export let SND_FOLD_MS = 80;
export const SND_FOLD_GAIN_DB = 1.5;   // per doubling of what was folded in
export const SND_FOLD_GAIN_MAX_DB = 6;
export const SND_FOLD_WIDEN = 0.25;    // q divided by 1 + this per doubling
// And past the window, a ceiling per voice per second, over which events are
// dropped -- never deferred. A ceiling that defers runs permanently late once
// the endgame yard gets going, and then you are hearing last minute's yard.
export let SND_FOLD_PER_S = 12;
// Punctuation is rare by construction, so its ceiling is a guard against a
// burst nobody designed -- three buildings landing on one frame -- rather
// than a balance number.
export let SND_PUNCT_PER_S = 4;
// What punctuation does to the beds underneath it: a few dB for about a
// second, which is what earns it the room to be the loudest thing in the game.
export let SND_DUCK_DB = 4;
export let SND_DUCK_S = 1;
export const SND_DUCK_IN_S = 0.03;     // how quickly the beds give way
export const SND_DUCK_OUT_S = 0.3;     // and how gently they come back

// --- the beds ------------------------------------------------------------------
// The things that are simply true right now: rain, wind, the machines, the
// rift, the drowned pit. Driven from state once a frame and crossfaded over
// seconds, never frames -- an event-triggered bed is a bed that eventually
// gets stuck on.
export let SND_BED_S = 2;
// The decision half does the crossfade, a frame's share at a time; the gain
// node only has to keep up with it, so it follows on a short constant.
export const SND_BED_FOLLOW_S = 0.1;
// A bed's target is re-sent to the node only when it has moved by this much:
// the crossfade is the node's to do, not the frame's.
export const SND_BED_STEP = 0.01;
// Water: rain, and the abyss standing in the pit once the hole has drowned.
export let SND_WATER_LEVEL = 0.22;
export let SND_WATER_HZ = 900;         // where the lowpass over the rain sits
export const SND_WATER_WANDER = 0.35;  // share of that it wanders by
export const SND_WATER_WANDER_S = 7;   // over about this long
export let SND_DROWNED_LEVEL = 0.4;    // share of the water bed the abyss holds
// Air: the same noise with the cutoff far lower, driven straight off the wind
// so the wind you can see is the wind you can hear. The floor is what a still
// yard sounds like under an overcast sky; the smog band adds to it.
export let SND_AIR_LEVEL = 0.16;
export const SND_AIR_FLOOR = 0.25;     // share of the level at a dead lull
export const SND_AIR_SMOG = 0.35;      // and what a sky at its cap adds
export const SND_AIR_HZ_LO = 120;      // the cutoff at a lull
export const SND_AIR_HZ_HI = 520;      // and in a gust
export const SND_AIR_FOLLOW_S = 0.4;   // how closely the cutoff tracks the wind
// The rift: two very low sines, detuned a few cents, beating slowly against
// each other. That beat is the flowing interference the pit already draws.
export let SND_RIFT_LEVEL = 0.2;
export const SND_RIFT_HZ = 44;
export const SND_RIFT_BEAT_CENTS = 12;
export const SND_RIFT_FLOOR = 0.3;     // share of the level the day it tears
// The machines: a narrow band of the same noise, so it hums rather than plays.
// A machine counts while somebody is standing at it -- the same reading the
// belt takes of `mannedAt`, which `stepMachines` stamps each frame a tender is
// in reach.
export let SND_HUM_LEVEL = 0.12;
export const SND_HUM_HZ = 96;
export const SND_HUM_Q = 14;
export const SND_MANNED_MS = 250;

// --- the noise itself ----------------------------------------------------------
// One buffer, made once at wake and read from different offsets: an unlimited
// supply of non-identical noise for nothing. Pinkish rather than white, which
// is the one-pole-ish shaping below (Kellet's economy filter): white noise is
// all hiss, and hiss is exactly the brightness the palette forbids.
export const SND_NOISE_S = 4;
export const SND_PINK = [
  [0.99765, 0.0990460],
  [0.96300, 0.2965164],
  [0.57000, 1.0526913]
];
export const SND_PINK_WHITE = 0.1848;
export const SND_PINK_GAIN = 0.11;

// What a held frame is worth to the beds' crossfade, in ms. The clock does not
// advance while the game is held, so the fade needs a frame's worth handed to
// it; a nominal sixtieth is close enough for a fade measured in seconds.
export const HELD_DT = 1000 / 60;

// The knobs. See the note over `TUNABLE` in config.js: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is.
export const SOUND_KNOBS = [
  { key: 'SND_MASTER', label: 'sound', min: 0, max: 1, step: 0.01,
    get: () => SND_MASTER, set: v => { SND_MASTER = v; } },
  { key: 'SND_LOWPASS_HZ', label: 'sound corner', min: 800, max: 8000, step: 100,
    get: () => SND_LOWPASS_HZ, set: v => { SND_LOWPASS_HZ = v; } },
  { key: 'SND_FOLD_PER_S', label: 'fold ceiling', min: 1, max: 40, step: 1,
    get: () => SND_FOLD_PER_S, set: v => { SND_FOLD_PER_S = v; } },
  { key: 'SND_PUNCT_PER_S', label: 'punct ceiling', min: 1, max: 20, step: 1,
    get: () => SND_PUNCT_PER_S, set: v => { SND_PUNCT_PER_S = v; } },
  { key: 'SND_FOLD_MS', label: 'fold window', min: 20, max: 200, step: 5,
    get: () => SND_FOLD_MS, set: v => { SND_FOLD_MS = v; } },
  { key: 'SND_VOICES', label: 'voices', min: 4, max: 32, step: 1,
    get: () => SND_VOICES, set: v => { SND_VOICES = v; } },
  { key: 'SND_DUCK_DB', label: 'duck', min: 0, max: 12, step: 0.5,
    get: () => SND_DUCK_DB, set: v => { SND_DUCK_DB = v; } },
  { key: 'SND_BED_S', label: 'bed crossfade', min: 0.25, max: 6, step: 0.25,
    get: () => SND_BED_S, set: v => { SND_BED_S = v; } },
  { key: 'SND_WATER_LEVEL', label: 'rain', min: 0, max: 1, step: 0.01,
    get: () => SND_WATER_LEVEL, set: v => { SND_WATER_LEVEL = v; } },
  { key: 'SND_AIR_LEVEL', label: 'wind', min: 0, max: 1, step: 0.01,
    get: () => SND_AIR_LEVEL, set: v => { SND_AIR_LEVEL = v; } },
  { key: 'SND_RIFT_LEVEL', label: 'rift hum', min: 0, max: 1, step: 0.01,
    get: () => SND_RIFT_LEVEL, set: v => { SND_RIFT_LEVEL = v; } },
  { key: 'SND_HUM_LEVEL', label: 'machine hum', min: 0, max: 1, step: 0.01,
    get: () => SND_HUM_LEVEL, set: v => { SND_HUM_LEVEL = v; } }
];
