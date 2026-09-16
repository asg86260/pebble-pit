// The sound of the yard.
//
// You hear the yard, not the game, and everything is struck, nothing is played
// (DESIGN.md, "The sound of the yard"). Modules never build a node; they say
// what happened -- `sfx('stone', { x, hard })` at the spot where a pick met
// rock -- and this file alone decides whether that survives the window and the
// ceiling, and what it sounds like if it does. There is no bed: nothing hums,
// hisses or drones between the strikes, so a still yard is silent.
//
// It is the only file in the repo that has heard of an AudioContext, and it is
// written in two halves that never mix. The **decision half** -- the fold
// windows, the ceilings, the voice cap, the counters -- runs on the game's
// clock and needs no context at all, which is what lets the node yard assert
// it: given forty grains in one frame, how many voices fire. The **context
// half** turns a decision into a sound, and is skipped wholesale where there is
// no context, which is every check and every page before the first gesture.
// Nothing is queued before that gesture: a yard that coughed up its whole
// first second the moment the browser allowed it would not be the yard.
//
// A strike is not a node graph. It is a recipe (`RECIPES` in config/sound.js,
// mapped to the yard's events by `SOUNDS`) rendered sample by sample into a buffer -- the sfxr way,
// and the same arithmetic the hit bench runs -- so the pixel stage (a bit
// depth and a sample-rate divide) is a line of arithmetic, and a recipe landed
// by ear on the bench ships as it was heard.

import { SND_MASTER, SND_LOWPASS_HZ, SND_LOWPASS_Q, SND_LIMIT_DB, SND_LIMIT_RATIO,
         SND_LIMIT_RELEASE_S, SND_LIMIT_ATTACK_S, SND_LIMIT_KNEE_DB, SND_MUTE_S,
         SND_JITTER_CENTS, SND_JITTER_DB, SND_JITTER_MS, SND_PAN_MAX, SND_PAN_OFF, SND_PAN_REACH,
         SND_RELEASE_TAILS, SND_STEAL_S, SND_VOICES, SND_RATE,
         RECIPES, SOUNDS, RECIPE_DEFAULTS,
         SND_HARD_DROP, SND_HARD_DULL, SND_THUMP_HZ, SND_THUMP_FALL, SND_THUMP_S,
         SND_THUMP_LEVEL,
         SND_FOLD_MS, SND_FOLD_GAIN_DB, SND_FOLD_GAIN_MAX_DB, SND_FOLD_WIDEN,
         SND_FOLD_PER_S, SND_PUNCT_PER_S, SND_EACH_PER_S } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { rand, seed, stream } from './rng.js';

// --- the decision half ---------------------------------------------------------

let awake = false;
let muted = false;

// What has been decided since wake. `byClass` is what the yard *asked for*, by
// class, and `firedBy` is what got through. `pending` is open fold windows,
// which is the backlog, and is meant to read as nought a window after the yard
// goes quiet. `byEvent` is what the yard asked for, by event, so a check can
// say how often one thing in the yard is heard.
const decisions = {
  fired: 0, dropped: 0, folded: 0, stolen: 0, pending: 0,
  byClass: { hand: 0, fold: 0, punct: 0, each: 0 },
  firedBy: { hand: 0, fold: 0, punct: 0, each: 0 },
  byEvent: {}
};

const CLASSES = new Set(['hand', 'fold', 'punct', 'each']);

// What an event plays: its entry's recipe, by name or whole, or nothing.
function recipeOf(event) {
  const r = SOUNDS[event] && SOUNDS[event].recipe;
  return typeof r === 'string' ? RECIPES[r] || null : r || null;
}

// An open fold window per event: the one sound it will emit when it closes,
// and everything folded into it so far, so the emission can stand for all of
// them -- panned to where they were on average, as hard as they were on
// average, big if any one of them was.
const windows = new Map();
// When each event last fired, per ceilinged class, for the last second.
const recent = { fold: new Map(), punct: new Map(), each: new Map() };
// Every one-shot still sounding, for the cap. `env` is the context half's
// handle on it, or null on a yard with no context.
const active = [];
let lastT = -Infinity;

// The game's clock is turned back by a new game or a reseeded yard, and
// everything here is a time on that clock: a window due, a strike ringing, a
// fire in the last second. All of it belonged to the yard that is gone, so it
// goes with it -- fading, where there is anything to fade.
function clock() {
  const t = now();
  if (t < lastT) {
    windows.clear();
    for (const v of active) if (v.env) fadeOut(v);
    active.length = 0;
    recent.fold.clear();
    recent.punct.clear();
    recent.each.clear();
    decisions.pending = 0;
  }
  lastT = t;
  return t;
}

const clamp = (v, lo = 0, hi = 1) => v < lo ? lo : v > hi ? hi : v;
const db = d => Math.pow(10, d / 20);
const cents = c => Math.pow(2, c / 1200);

// The ceilings. An event's recent fires in a class are kept for a second and
// pruned as they age out. Over the ceiling is *dropped*: a ceiling that defers
// runs permanently late once the endgame yard gets going.
function over(event, cls, t, ceiling) {
  const list = recent[cls].get(event) || [];
  const kept = list.filter(at => at > t - 1000);
  recent[cls].set(event, kept);
  return kept.length >= ceiling;
}
const mark = (event, cls, t) => recent[cls].get(event).push(t);

// The cap. Oldest-and-quietest goes first, and the player's own hand is never
// the one taken: it is the one event the player caused directly, and it is
// allowed to be the clearest thing in the mix.
function makeRoom() {
  while (active.length >= SND_VOICES) {
    let pick = -1;
    for (let i = 0; i < active.length; i++) {
      const v = active[i];
      if (v.cls === 'hand') continue;
      if (pick < 0 || v.level < active[pick].level ||
          (v.level === active[pick].level && v.at < active[pick].at)) pick = i;
    }
    if (pick < 0) return;                     // all hands: over the cap, and kept
    const [v] = active.splice(pick, 1);
    decisions.stolen++;
    if (v.env) fadeOut(v);
  }
}

// A recipe's field, or what a recipe that never set it has for it.
const field = (spec, k) => spec[k] ?? RECIPE_DEFAULTS[k];

// How long a recipe sounds, in seconds: its longest envelope run out, plus the
// thump if it carries one.
function ringOf(spec, o) {
  const sub = field(spec, 'sub');
  const longest = Math.max(spec.decay * SND_RELEASE_TAILS + field(spec, 'bodyHold'),
                           spec.noiseMs * SND_RELEASE_TAILS + field(spec, 'noiseHold'),
                           spec.slideMs,
                           sub ? field(spec, 'subMs') * SND_RELEASE_TAILS : 0) / 1000;
  return longest + (o.big ? SND_THUMP_S : 0);
}

// One decided strike: the level it will take, the room it needs, and -- where
// there is a context -- the sound. `n` is how many events this one stands for,
// and a folded strike was counted when its window opened, which is when the
// decision was made. The jitter is drawn here, from the yard's own word, so
// the node yard and the browser draw the same numbers whether or not anything
// is rendered.
function fire(event, o, cls, t, n = 1, counted = false) {
  if (!counted) { decisions.fired++; decisions.firedBy[cls]++; }
  const spec = recipeOf(event);
  if (!spec) return;                        // an unmapped event: decided, counted, silent
  const foldDb = Math.min(SND_FOLD_GAIN_MAX_DB, SND_FOLD_GAIN_DB * Math.log2(n));
  const level = spec.gain * db(foldDb + (rand() * 2 - 1) * SND_JITTER_DB * spec.vary);
  const widen = 1 + SND_FOLD_WIDEN * Math.log2(n);
  const delay = rand() * SND_JITTER_MS;
  // and the event's own step, if it asked for one: the pegs climb a row at a time
  const detune = (rand() * 2 - 1) * SND_JITTER_CENTS * spec.vary + (o.cents || 0);
  const ring = ringOf(spec, o);
  makeRoom();
  const v = { at: t, level, cls, until: t + delay + ring * 1000, env: null };
  active.push(v);
  if (ctx) v.env = play(spec, o, { level, widen, delay, detune, ring });
}

// Something physically happened at world x. `event` is a key in SOUNDS --
// 'rock-hit', 'footstep', 'boulder-land' -- and the table says what class it
// falls under and what, if anything, it plays. `opts` is { x, hard, big, cents }
// plus, for a check that wants to say so, a `cls` that overrides the table's.
// 'hand' is never folded or stolen; 'fold' (the yard's own work) is one sound
// per window; 'punct' is rare by construction, with a ceiling of its own;
// 'each' is a strike per event, never folded, but stolen like the yard's work
// and ceilinged, because a refund lands hundreds of grains in one frame and
// every strike is a buffer rendered.
// Before the first gesture it is a no-op and nothing is queued.
export function sfx(event, opts = {}) {
  if (!awake) return;
  const cls = CLASSES.has(opts.cls) ? opts.cls : (SOUNDS[event] ? SOUNDS[event].cls : 'fold');
  decisions.byClass[cls]++;
  decisions.byEvent[event] = (decisions.byEvent[event] || 0) + 1;
  const t = clock();
  if (cls === 'hand') { fire(event, opts, cls, t); return; }
  if (cls === 'punct' || cls === 'each') {
    if (over(event, cls, t, cls === 'punct' ? SND_PUNCT_PER_S : SND_EACH_PER_S)) { decisions.dropped++; return; }
    mark(event, cls, t);
    fire(event, opts, cls, t);
    return;
  }
  const w = windows.get(event);
  if (w) {
    // Inside the window: folded into the sound it will emit, not queued and
    // not fired. Averaged where it is worth averaging, or'd where one is
    // enough.
    w.n++;
    w.x += opts.x || 0;
    w.hard += opts.hard || 0;
    w.big = w.big || !!opts.big;
    decisions.folded++;
    return;
  }
  if (over(event, cls, t, SND_FOLD_PER_S)) { decisions.dropped++; return; }
  mark(event, cls, t);
  // The decision is made now -- this window will sound -- and the sound itself
  // waits for the window to close, so everything that lands inside it is in
  // it. Eighty milliseconds behind the first grain is not a lag anybody hears
  // on a grain; it is what makes forty of them one handful.
  windows.set(event, { due: t + SND_FOLD_MS, n: 1, x: opts.x || 0,
                       hard: opts.hard || 0, big: !!opts.big });
  decisions.fired++;
  decisions.firedBy.fold++;
  decisions.pending = windows.size;
}

// Once a frame: the windows that have closed and the voices that have
// finished. With no bed there is nothing here that needs the frame's length.
export function stepAudio() {
  if (!awake) return;
  const t = clock();
  for (const [event, w] of windows) {
    if (t < w.due) continue;
    windows.delete(event);
    fire(event, { x: w.x / w.n, hard: w.hard / w.n, big: w.big }, 'fold', t, w.n, true);
  }
  decisions.pending = windows.size;
  for (let i = active.length - 1; i >= 0; i--) if (t >= active[i].until) active.splice(i, 1);
  if (ctx) follow();
}

// The first real pointer gesture; until then the browser allows nothing, and
// nothing here is counted either. On the node yard there is no context to
// make, and the decisions wake without one.
export function wakeAudio() {
  if (awake) { if (ctx && ctx.state === 'suspended') ctx.resume(); return; }
  awake = true;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return;
  try { ctx = new AC(); build(); } catch { ctx = null; return; }
  if (ctx.state === 'suspended') ctx.resume();
}

// The mute. A ramp both ways -- the one thing the switch calls, and the
// switch's own memory is `prefs.js`'s.
export function muteAudio(on) {
  muted = !!on;
  if (!ctx) return;
  nodes.master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, SND_MUTE_S / 3);
}

// The slider. SND_MASTER is the level the whole mix was pitched at and the
// slider is a share of it rather than a second absolute: all the way up is
// still the designed level, not louder, so nothing a player can reach turns
// the yard into the thing the mix law refuses. Ramped like the mute, so a
// dragged slider is not a run of clicks.
let volume = 1;
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, +v || 0));
  if (!ctx) return;
  nodes.master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, SND_MUTE_S / 3);
}
const masterLevel = () => muted ? 0 : SND_MASTER * volume;

// The decision half, for the node tier.
export function audioDecisions() { return decisions; }

// The bench's mapping laid over the table: `{ event: recipe | null, ... }`,
// each a recipe pasted whole or a name in RECIPES. An event the table does
// not know is ignored, and one the mapping does not name keeps what it had.
// This is how a sound is heard in place before it is written into config:
// the dev panel's `sounds` tab pastes here and remembers the paste.
export function applySounds(map) {
  if (!map || typeof map !== 'object') return 0;
  let n = 0;
  for (const k in map) {
    if (!SOUNDS[k]) continue;
    const r = map[k];
    if (r !== null && typeof r !== 'object' && typeof r !== 'string') continue;
    SOUNDS[k].recipe = r;
    n++;
  }
  return n;
}

// The renderer, for the bench and tools/listen.mjs: a recipe to samples, with
// no context and no jitter. What the game plays is this with the jitter drawn
// by `fire`.
export function renderStrike(spec, o = {}, shape = { level: spec.gain, widen: 1, detune: 0 }) {
  return render(spec, o, shape);
}

// --- the context half ------------------------------------------------------------
// Nothing below runs without a context, and nothing above depends on it.

let ctx = null;
const nodes = {};

// Master chain, in order: yard bus -> the lowpass that is the palette -> the
// limiter that makes the endgame yard the same loudness as the opening one ->
// master gain.
function build() {
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t);
  master.gain.setTargetAtTime(masterLevel(), t, SND_MUTE_S / 3);
  master.connect(ctx.destination);

  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = SND_LIMIT_DB;
  limiter.ratio.value = SND_LIMIT_RATIO;
  limiter.release.value = SND_LIMIT_RELEASE_S;
  limiter.attack.value = SND_LIMIT_ATTACK_S;
  limiter.knee.value = SND_LIMIT_KNEE_DB;
  limiter.connect(master);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = SND_LOWPASS_HZ;
  lowpass.Q.value = SND_LOWPASS_Q;
  lowpass.connect(limiter);

  const yard = ctx.createGain();
  yard.connect(lowpass);
  Object.assign(nodes, { master, limiter, lowpass, yard });
}

// A parameter told where to go, and only when where to go has moved.
function aim(param, holder, key, value, tau, step) {
  const last = holder[key];
  if (last !== undefined && Math.abs(value - last) < step) return;
  holder[key] = value;
  param.setTargetAtTime(value, ctx.currentTime, tau);
}

// The two knobs on the panel, live, once a frame.
function follow() {
  aim(nodes.master.gain, nodes, 'masterSent', masterLevel(), SND_MUTE_S / 3, 0.01);
  aim(nodes.lowpass.frequency, nodes, 'cornerSent', SND_LOWPASS_HZ, SND_MUTE_S, 1);
}

// Where a world x sits in the ear. Shallow across the view, against its
// middle; then, past either edge, deepening toward SND_PAN_OFF over
// SND_PAN_REACH view widths, so a strike off the left of the screen is heard
// off the left. Exported for the node yard, which has no context to hear it.
export function panOf(x) {
  if (x == null || !S.viewW) return 0;
  const half = S.viewW / 2;
  const d = (x - (S.camX + half)) / half;      // -1..1 across the view
  const side = d < 0 ? -1 : 1, a = Math.abs(d);
  if (a <= 1) return d * SND_PAN_MAX;
  const beyond = clamp((a - 1) / (SND_PAN_REACH * 2));
  return side * (SND_PAN_MAX + (SND_PAN_OFF - SND_PAN_MAX) * beyond);
}

// The grit's and the click's noise: a stream of its own rather than `rand()`,
// because a strike draws thousands of numbers and taking those from the
// yard's word would put the browser's run off the node yard's from the first
// gesture on (see `stream` in rng.js). Seeded from the run, so a seeded run
// has a seeded soundtrack.
let noise = null;

// A recipe rendered to samples at SND_RATE. The bench's `render`, line for
// line, with the yard's meanings laid over it: `hard` moves the body and the
// grit down and dulls the grit; `big` puts the thump under it; a fold's `widen` opens the grit's band and
// its `level` carries the fold gain. Everything is one pass over the buffer,
// then the pixel stage, then the recipe's own lowpass and a soft clip.
function render(spec, o, { level, widen, detune }) {
  if (!noise) noise = stream(seed());
  const SR = SND_RATE;
  const hard = clamp(o.hard || 0);
  const pitch = cents(detune) * (1 - hard * SND_HARD_DROP);
  const len = Math.ceil(SR * (ringOf(spec, o) + 0.01));
  const out = new Float32Array(len);
  const bodyTau = spec.decay / 1000, noiseTau = spec.noiseMs / 1000, slideS = spec.slideMs / 1000;
  const bodyHold = field(spec, 'bodyHold') / 1000, noiseHold = field(spec, 'noiseHold') / 1000;
  const sub = field(spec, 'sub'), subHz = field(spec, 'subHz'), subDrop = field(spec, 'subDrop');
  const subS = field(spec, 'subMs') / 1000;
  const clickRaw = field(spec, 'clickRaw'), noiseSlide = field(spec, 'noiseSlide'), drive = field(spec, 'drive');
  const clickS = spec.clickMs / 1000;
  const noiseQ = Math.max(0.1, spec.noiseQ * (1 - hard * SND_HARD_DULL) / widen);
  // the grit: a state-variable bandpass over white noise, its center
  // sweeping over the fall if the recipe asks
  const gritHz = spec.noiseHz * (1 - hard * SND_HARD_DROP);
  const coef = hz => 2 * Math.sin(Math.PI * Math.min(hz, SR / 4) / SR);
  let f = coef(gritHz * noiseSlide); const qq = 1 / noiseQ;
  let lo = 0, bp = 0;
  // the front: a very short burst of noise through a one-pole highpass
  const hpA = Math.exp(-2 * Math.PI * spec.clickHz / SR);
  let hpY = 0, hpX = 0;
  // the recipe's own lowpass, and the pixel stage's held samples -- the share
  // of the front that skips the lowpass is held and quantized alongside
  const lpA = 1 - Math.exp(-2 * Math.PI * spec.cut / SR);
  let lp = 0, held = 0, heldRaw = 0;
  const steps = Math.pow(2, spec.bits - 1);
  const hold = Math.max(1, spec.hold | 0);
  let ph = 0, phS = 0, phT = 0;
  const wave = ph => {
    switch (spec.wave) {
      case 'sine':   return Math.sin(ph * 2 * Math.PI);
      case 'tri':    return 1 - 4 * Math.abs(ph - 0.5);
      case 'square': return ph < spec.duty ? 1 : -1;
      default:       return 2 * ph - 1;
    }
  };
  // an envelope that sits at full for `hold` and then releases on `tau`
  const env = (t, hold, tau) => t < hold ? 1 : Math.exp(-(t - hold) / tau);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    // the body: the pitch falls (or rises) from hz * slide to hz over slideMs
    const k = Math.min(1, t / slideS);
    const hz = spec.hz * pitch * Math.pow(spec.slide, 1 - k);
    ph += hz / SR; if (ph >= 1) ph -= 1;
    let b = wave(ph) * spec.level * env(t, bodyHold, bodyTau);
    // the thump: a sine dropping from subHz * subDrop to subHz over subMs
    if (sub) {
      const ks = Math.min(1, t / subS);
      phS += subHz * pitch * Math.pow(subDrop, 1 - ks) / SR; if (phS >= 1) phS -= 1;
      b += Math.sin(phS * 2 * Math.PI) * sub * Math.exp(-t / subS);
    }
    // the grit
    const w = noise() * 2 - 1;
    if (noiseSlide !== 1) f = coef(gritHz * Math.pow(noiseSlide, 1 - k));
    lo += f * bp; const hi = w - lo - qq * bp; bp += f * hi;
    const n = bp * spec.noise * env(t, noiseHold, noiseTau) * 0.8;
    // the front
    let c = 0;
    if (t < clickS) { hpY = hpA * (hpY + w - hpX); hpX = w; c = hpY * spec.click * (1 - t / clickS) * 1.6; }
    let s = (b + n + c * (1 - clickRaw)) * level;
    // the thump under a big one: a sine that tunes down as it goes
    if (o.big && SND_THUMP_LEVEL) {
      const fall = Math.min(1, t / SND_THUMP_S);
      const thz = SND_THUMP_HZ * pitch * Math.pow(SND_THUMP_FALL, fall);
      phT += thz / SR; if (phT >= 1) phT -= 1;
      s += Math.sin(phT * 2 * Math.PI) * level * SND_THUMP_LEVEL *
           Math.exp(-t / (SND_THUMP_S / SND_RELEASE_TAILS * 2));
    }
    // the pixel stage: quantize, then hold each sample for `hold` samples
    if (i % hold === 0) {
      held = Math.round(s * steps) / steps;
      heldRaw = Math.round(c * clickRaw * level * steps) / steps;
    }
    lp += lpA * (held - lp);
    out[i] = Math.tanh((lp + heldRaw) * drive);
  }
  return out;
}

// One strike, played: rendered, put in a buffer, panned to where it happened
// and started `delay` from now. Returns the gain the cap fades if it takes
// this one.
function play(spec, o, { level, widen, delay, detune }) {
  const data = render(spec, o, { level, widen, detune });
  const buf = ctx.createBuffer(1, data.length, SND_RATE);
  buf.copyToChannel(data, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const env = ctx.createGain();
  env.gain.value = 1;
  src.connect(env);
  let out = env;
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = panOf(o.x);
    env.connect(pan);
    out = pan;
  }
  out.connect(nodes.yard);
  src.start(ctx.currentTime + delay / 1000);
  return { env, sources: [src] };
}

// A voice the cap took: a fade over a few milliseconds, never a stop.
function fadeOut(v) {
  const t = ctx.currentTime;
  const g = v.env.env.gain;
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
  g.setTargetAtTime(0, t, SND_STEAL_S / 3);
  for (const s of v.env.sources) s.stop(t + SND_STEAL_S * SND_RELEASE_TAILS);
}
