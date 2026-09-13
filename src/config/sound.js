// --- the sound of the yard -------------------------------------------------
// Every number audio.js runs on. The law it is all in service of is in
// DESIGN.md, "The sound of the yard": you hear the yard, not the game, and
// everything is struck, nothing is played. Since the hits-only pass there is
// no bed at all -- no rain, no wind, no hum, no rift drone -- so the whole of
// the sound is the strikes, and the discipline about how many of them may
// sound at once, which is the part that decides whether the game is bearable
// at minute ninety.
//
// A sound is a *recipe*, the shape the hit bench renders (the Boulder Hit
// Bench artifact and the `render` in audio.js are the same arithmetic): a
// body, a click on the front, a puff of grit, and a pixel stage. Recipes are
// landed by ear on the bench and the JSON is copied in here; which event in
// the yard plays which is the SOUNDS table below.

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
// A safety limiter and nothing more: it starts a decibel under full scale
// and leaves everything under that alone, so a boulder is as much louder
// than a click as the bench said. Punch is contrast; a limiter leaning on
// the mix took the contrast out.
export const SND_LIMIT_DB = -1;
export const SND_LIMIT_RATIO = 20;
export const SND_LIMIT_RELEASE_S = 0.1;
export const SND_LIMIT_ATTACK_S = 0.001;
export const SND_LIMIT_KNEE_DB = 0;
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
// How many one-shots may sound at once. Past this the oldest and quietest is
// taken, and the player's own hand is never the one taken.
export let SND_VOICES = 16;
// A rendered strike is cut off this many release constants after its longest
// envelope: past that it is under the noise floor of any speaker.
export const SND_RELEASE_TAILS = 6;
// The sample rate every strike is rendered at, whatever the context runs at.
// The bench renders at this rate, so what was heard there is what ships.
export const SND_RATE = 44100;

// --- the recipes, and which event plays which ----------------------------------
// A recipe, rendered sample by sample. The fields:
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
//
// And the knobs added for weight, each "off" in RECIPE_DEFAULTS so a recipe
// written before it existed sounds exactly as it did:
//
//   bodyHold   ms the body sits at full before its decay starts
//   sub        a sine thump under the body, at this level ...
//   subHz      ... landing at this pitch ...
//   subDrop    ... from this many times it ...
//   subMs      ... over this long, which is also its decay constant
//   clickRaw   share of the front that skips the recipe's lowpass
//   noiseSlide the grit's center starts at this many times noiseHz and
//              sweeps to it over slideMs
//   noiseHold  ms the grit sits at full before its decay starts
//   drive      gain into the soft clip
export const RECIPE_DEFAULTS = { bodyHold: 0, sub: 0, subHz: 50, subDrop: 2, subMs: 80, clickRaw: 0,
                                 noiseSlide: 1, noiseHold: 0, drive: 1.4 };
//
// Named as they were on the bench, and pasted in from it (2026-09-13, second
// mapping). A knob left at its RECIPE_DEFAULTS value is not written.
export const RECIPES = {
  'stone':        { wave: 'sine', hz: 145, slide: 0.5, slideMs: 120, decay: 10, level: 1, duty: 0.05,
                    click: 0.03, clickMs: 0.5, clickHz: 500,
                    noise: 0.51, noiseHz: 60, noiseQ: 5.8, noiseMs: 5,
                    bits: 16, hold: 1, cut: 800, gain: 1.5, vary: 1 },
  'stone crit':   { wave: 'sine', hz: 63, slide: 0.5, slideMs: 2, decay: 10, level: 1, duty: 0.05,
                    click: 0, clickMs: 0.5, clickHz: 500,
                    noise: 0.51, noiseHz: 720, noiseQ: 5.8, noiseMs: 5,
                    bits: 16, hold: 1, cut: 800, gain: 1.5, vary: 1 },
  'worker mine':  { wave: 'sine', hz: 110, slide: 0.5, slideMs: 2, decay: 10, level: 0.1, duty: 0.05,
                    click: 0, clickMs: 2.3, clickHz: 500,
                    noise: 1, noiseHz: 60, noiseQ: 0.3, noiseMs: 5,
                    bits: 14, hold: 1, cut: 2500, gain: 0.8, vary: 1 },
  'worker crit':  { wave: 'sine', hz: 110, slide: 0.5, slideMs: 2, decay: 10, level: 0.1, duty: 0.05,
                    click: 0.1, clickMs: 2.3, clickHz: 500,
                    noise: 1, noiseHz: 240, noiseQ: 2.4, noiseMs: 5,
                    bits: 16, hold: 1, cut: 1300, gain: 0.8, vary: 1 },
  'boulder-land': { wave: 'sine', hz: 20, slide: 0.25, slideMs: 1, decay: 10, level: 1, duty: 0.05,
                    click: 1, clickMs: 0.5, clickHz: 8000,
                    noise: 1, noiseHz: 60, noiseSlide: 0.25, noiseQ: 0.3, noiseMs: 5,
                    sub: 1, subHz: 44, subDrop: 3.1, subMs: 67,
                    bits: 16, hold: 1, cut: 1300, drive: 4.3, gain: 0.44, vary: 1 },
  'stone hard':   { wave: 'tri', hz: 92, slide: 2, slideMs: 16, decay: 70, level: 1, duty: 0.5,
                    click: 0.5, clickMs: 2, clickHz: 1800,
                    noise: 0.45, noiseHz: 180, noiseQ: 0.9, noiseMs: 32,
                    bits: 8, hold: 5, cut: 4000, gain: 0.8, vary: 0.4 },
  'dust-gain':    { wave: 'sine', hz: 238, slide: 2.6, slideMs: 2, decay: 19, level: 0.13, duty: 0.05,
                    click: 0, clickMs: 3, clickHz: 500,
                    noise: 1, noiseHz: 60, noiseQ: 0.3, noiseMs: 5,
                    bits: 16, hold: 1, cut: 1400, gain: 0.67, vary: 1 },
  'sun summon':   { wave: 'sine', hz: 40, slide: 0.5, slideMs: 30, decay: 287, level: 0.46, duty: 0.2,
                    click: 0.74, clickMs: 1.1, clickHz: 3600,
                    noise: 1, noiseHz: 950, noiseQ: 1.8, noiseMs: 158,
                    bits: 16, hold: 1, cut: 5800, gain: 0.55, vary: 1 },
  'bolt throw':   { wave: 'square', hz: 1282, slide: 0.25, slideMs: 99, decay: 94, level: 0.46, duty: 0.05,
                    click: 0, clickMs: 0.5, clickHz: 2700,
                    noise: 0.43, noiseHz: 1040, noiseSlide: 3.35, noiseQ: 2.6, noiseMs: 138,
                    sub: 1, subHz: 28, subDrop: 1, subMs: 28,
                    bits: 6, hold: 1, cut: 600, drive: 0.5, gain: 0.71, vary: 1 }
};

// Every event in the yard that can make a sound, and what it plays. The key is
// what the module says (`sfx('rock-hit', { x })`); the class is the mix
// discipline it falls under -- 'hand' is never folded or stolen, 'fold' is
// one sound per window, 'punct' has a ceiling of its own -- and the recipe is
// a name in RECIPES, a recipe pasted in whole, or null, which is silence: the
// event is still decided and counted, and never rendered. The mapping is the
// one the player made on the bench (2026-09-13): silence where it says
// silence. The dev panel's `sounds` tab takes the bench's mapping JSON and
// lays it over this table live, and `applySounds` in audio.js is what does
// the laying.
export const SOUNDS = {
  'rock-hit':     { label: 'you hit the rock',                          cls: 'hand',  recipe: 'stone' },
  'rock-crit':    { label: 'you crit the rock',                         cls: 'hand',  recipe: 'stone crit' },
  'rock-swing':   { label: "a body's or the ram's swing at the rock",   cls: 'fold',  recipe: 'worker mine' },
  'crew-crit':    { label: "a body's crit swing at the rock",           cls: 'fold',  recipe: 'worker crit' },
  'bird-startle': { label: 'you knock a bird off its line',             cls: 'hand',  recipe: null },
  'rock-through': { label: 'the last sheet of a rock cell gives way',   cls: 'fold',  recipe: null },
  'boulder-land': { label: 'the boulder lands',                         cls: 'punct', recipe: 'boulder-land' },
  'footstep':     { label: "a body's footstep",                         cls: 'fold',  recipe: null },
  'machine-beat': { label: 'a beat of a machine',                       cls: 'fold',  recipe: 'stone hard' },
  'belt-load':    { label: 'the scoop sets a chunk on the belt',        cls: 'fold',  recipe: null },
  'belt-catch':   { label: 'a thrown chunk lands on the belt',          cls: 'fold',  recipe: null },
  'grain-land':   { label: 'a grain comes to rest on the ground',       cls: 'fold',  recipe: null },
  'pit-land':     { label: 'a grain comes to rest in the pit',          cls: 'fold',  recipe: 'dust-gain' },
  'core-bank':    { label: 'a core is banked',                          cls: 'punct', recipe: 'stone crit' },
  'meteor-call':  { label: 'the sky is summoned',                       cls: 'punct', recipe: 'sun summon' },
  'bolt-throw':   { label: 'a wizard throws a bolt at the star',        cls: 'fold',  recipe: 'bolt throw' },
  'bolt-strike':  { label: 'a bolt lands on the star',                  cls: 'fold',  recipe: 'worker mine' },
  'bolt-crit':    { label: 'a crit bolt takes a patch off the star',    cls: 'fold',  recipe: 'worker crit' },
  'jackpot':      { label: 'the wheel pays out',                        cls: 'punct', recipe: null },
  'dud':          { label: 'the wheel comes up empty',                  cls: 'hand',  recipe: null },
  'work-land':    { label: 'a building comes down on its ground',       cls: 'punct', recipe: null },
  'rift-tear':    { label: 'the pit floor tears',                       cls: 'punct', recipe: null },
  'rift-open':    { label: 'the pit floor gives way',                   cls: 'punct', recipe: null }
};

// `hard` in [0, 1] can move the body and the grit down and dull the grit --
// harder rock lower and duller, not louder. Both at nought for now: the hit
// on the rock is the recipe exactly as it was landed, at every depth.
export const SND_HARD_DROP = 0;        // share of the pitch taken off at hard = 1
export const SND_HARD_DULL = 0;        // share of the grit's q taken off at hard = 1
// `big` can put a sine thump under the recipe that tunes down as it goes: the
// boulder, a core banking, a building coming down onto its footprint. At
// nought: the bench has no thump, so a recipe landed there plays without one.
export const SND_THUMP_HZ = 70;
export const SND_THUMP_FALL = 0.45;    // it ends at this share of where it began
export const SND_THUMP_S = 0.22;
export const SND_THUMP_LEVEL = 0;
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
    get: () => SND_VOICES, set: v => { SND_VOICES = v; } }
];
