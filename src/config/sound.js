// --- the sound of the yard -------------------------------------------------
// Every number audio.js runs on. The law it is all in service of is in
// DESIGN.md, "The sound of the yard": you hear the yard, not the game, and
// everything is struck, nothing is played. Since the hits-only pass there is
// no bed at all -- no rain, no wind, no hum, no rift drone -- so the whole of
// the sound is the strikes, and the discipline about how many of them may
// sound at once, which is the part that decides whether the game is bearable
// at minute ninety.
//
// A voice is a *recipe*, the shape the hit bench renders (tools/hit-bench and
// the `render` in audio.js are the same arithmetic): a body, a click on the
// front, a puff of grit, and a pixel stage. The stone recipe was landed by ear
// on the bench; the others are starting points and are tuned the same way --
// copy the bench's JSON in here.

// --- the mix -----------------------------------------------------------------
// Quiet by default, and satisfying at that volume. The target is a laptop
// speaker at half volume in a room with other things going on; a sound that
// has to be loud to be good has not been designed yet.
export let SND_MASTER = 0.6;
// The six-grey palette enforced in one place: a lowpass over everything, so no
// voice has to be trusted to stay dull on its own. High frequency is what wears
// an ear out over an hour, and this is a game about grey rock under an
// overcast sky, not about glass. A gentle corner rather than a wall.
export let SND_LOWPASS_HZ = 5000;
export const SND_LOWPASS_Q = 0.5;      // a soft knee: the nearest a biquad gets to one pole
// The soft limiter, which is there so the endgame yard at full tilt is the
// same loudness as the opening yard rather than louder. Slow release, so it
// leans on the whole mix rather than pumping on each hit.
export const SND_LIMIT_DB = -6;
export const SND_LIMIT_RATIO = 8;
export const SND_LIMIT_RELEASE_S = 0.4;
export const SND_LIMIT_ATTACK_S = 0.005;
export const SND_LIMIT_KNEE_DB = 12;
// The mute ramps rather than cuts, both ways -- a gain that jumps is a click.
export const SND_MUTE_S = 0.05;

// --- every one-shot ------------------------------------------------------------
// Nothing repeats exactly: every strike takes a little detune, a little level
// and a little timing scatter from the game's own `rand()`, so a seeded run
// has a seeded soundtrack. These are the outer limits, at a recipe's `vary`
// of 1; a recipe's `vary` is the share of them it takes.
export const SND_JITTER_CENTS = 100;
export const SND_JITTER_DB = 2;
export const SND_JITTER_MS = 8;
// Nearly mono. The yard is drawn flat, so it is panned shallowly from world x
// against the middle of the view and capped well short of hard; a hard-panned
// yard is a yard you have to sit in the middle of.
export const SND_PAN_MAX = 0.3;
// A voice stolen by the cap fades rather than stops.
export const SND_STEAL_S = 0.02;
// What each class is worth in the mix, as a share of the recipe's gain. The
// player's own hand and the punctuation (the boulder landing, a building
// coming down, a core banking) are the sounds; the yard's own work -- the
// crew's picks, grain landing on a pile, chunks on the belt -- is the folding
// class, and at nought it is silent: heard all day it is a background noise,
// and the rule since the hits-only pass is that there is none. It is still
// decided, folded and counted, so turning it up is one knob and nothing else.
export let SND_HAND_LEVEL = 1;
export let SND_FOLD_LEVEL = 0;
export let SND_PUNCT_LEVEL = 1;
// How many one-shots may sound at once. Past this the oldest and quietest is
// taken, and the player's own hand is never the one taken.
export let SND_VOICES = 16;
// A rendered strike is cut off this many release constants after its longest
// envelope: past that it is under the noise floor of any speaker.
export const SND_RELEASE_TAILS = 6;
// The sample rate every strike is rendered at, whatever the context runs at.
// The bench renders at this rate, so what was heard there is what ships.
export const SND_RATE = 44100;

// --- how each voice is made ----------------------------------------------------
// One recipe, rendered sample by sample. The fields:
//
//   wave     sine | tri | square | saw -- the body
//   hz       the body's pitch, where it lands
//   slide    the body starts at hz * slide and falls (or rises) to hz ...
//   slideMs  ... over this long
//   decay    ms, the body's release constant
//   level    the body's own level
//   duty     the square's duty cycle (the others ignore it)
//   click    the front: a burst of highpassed noise ...
//   clickMs  ... this long ...
//   clickHz  ... over this corner
//   noise    the grit: a resonant band of noise under the body ...
//   noiseHz  ... centered here ...
//   noiseQ   ... this narrow ...
//   noiseMs  ... with this release constant
//   bits     the pixel stage: quantized to this many bits ...
//   hold     ... and each sample held for this many (a sample-rate divide)
//   cut      a one-pole lowpass over the lot, Hz
//   gain     the recipe's level into the mix
//   vary     the share of SND_JITTER_* this voice scatters by, per hit
export let SND_STONE = { wave: 'sine', hz: 40, slide: 0.5, slideMs: 2, decay: 10, level: 1, duty: 0.05,
                         click: 0.3, clickMs: 0.5, clickHz: 4900,
                         noise: 0.51, noiseHz: 60, noiseQ: 5.8, noiseMs: 5,
                         bits: 16, hold: 1, cut: 800, gain: 1.5, vary: 1 };
export let SND_WOOD  = { wave: 'tri', hz: 410, slide: 1.6, slideMs: 8, decay: 32, level: 0.8, duty: 0.5,
                         click: 0.6, clickMs: 1.5, clickHz: 3200,
                         noise: 0.3, noiseHz: 900, noiseQ: 3, noiseMs: 18,
                         bits: 8, hold: 3, cut: 6000, gain: 0.8, vary: 0.5 };
export let SND_METAL = { wave: 'square', hz: 660, slide: 1.15, slideMs: 6, decay: 120, level: 0.6, duty: 0.5,
                         click: 0.8, clickMs: 1.5, clickHz: 5000,
                         noise: 0.2, noiseHz: 2400, noiseQ: 6, noiseMs: 40,
                         bits: 6, hold: 2, cut: 8000, gain: 0.7, vary: 0.3 };
// The rift's one-shot is the tear: a very low body with a long fall, for the
// moment a rung lands or the floor gives way.
export let SND_RIFT  = { wave: 'sine', hz: 44, slide: 2.6, slideMs: 60, decay: 260, level: 1, duty: 0.5,
                         click: 0.4, clickMs: 3, clickHz: 1400,
                         noise: 0.7, noiseHz: 120, noiseQ: 0.7, noiseMs: 140,
                         bits: 8, hold: 6, cut: 3000, gain: 1, vary: 0.2 };
// `hard` in [0, 1] moves the body and the grit down and dulls the grit:
// harder rock is lower and duller, not louder. A reward that is merely louder
// is a slot machine.
export const SND_HARD_DROP = 0.45;     // share of the pitch taken off at hard = 1
export const SND_HARD_DULL = 0.5;      // share of the grit's q taken off at hard = 1
// `big` puts a sine thump under the recipe that tunes down as it goes: the
// boulder, a core banking, a building coming down onto its footprint.
export const SND_THUMP_HZ = 70;
export const SND_THUMP_FALL = 0.45;    // it ends at this share of where it began
export const SND_THUMP_S = 0.22;
export const SND_THUMP_LEVEL = 0.6;
// `crit` adds body, not level: a second body an octave down, under the same
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
export const SND_FOLD_WIDEN = 0.25;    // the grit's q divided by 1 + this per doubling
// And past the window, a ceiling per voice per second, over which events are
// dropped -- never deferred. A ceiling that defers runs permanently late once
// the endgame yard gets going, and then you are hearing last minute's yard.
export let SND_FOLD_PER_S = 12;
// Punctuation is rare by construction, so its ceiling is a guard against a
// burst nobody designed -- three buildings landing on one frame -- rather
// than a balance number.
export let SND_PUNCT_PER_S = 4;

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
  { key: 'SND_HAND_LEVEL', label: 'hand level', min: 0, max: 1, step: 0.01,
    get: () => SND_HAND_LEVEL, set: v => { SND_HAND_LEVEL = v; } },
  { key: 'SND_FOLD_LEVEL', label: 'yard level', min: 0, max: 1, step: 0.01,
    get: () => SND_FOLD_LEVEL, set: v => { SND_FOLD_LEVEL = v; } },
  { key: 'SND_PUNCT_LEVEL', label: 'punct level', min: 0, max: 1, step: 0.01,
    get: () => SND_PUNCT_LEVEL, set: v => { SND_PUNCT_LEVEL = v; } }
];
