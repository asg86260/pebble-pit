// The sound of the yard.
//
// You hear the yard, not the game, and everything is struck, nothing is played
// (DESIGN.md, "The sound of the yard"). Modules never build a node; they say
// what happened -- `sfx('stone', { x, hard })` at the spot where a pick met
// rock -- and this file alone decides whether that survives the window and the
// ceiling, and what it sounds like if it does. The beds (rain, wind, the
// machines, the rift) are not events at all: `stepAudio` reads the yard once a
// frame and sets their targets, so a bed cannot be left stuck on by an edge
// case that forgot to send its stop.
//
// It is the only file in the repo that has heard of an AudioContext, and it is
// written in two halves that never mix. The **decision half** -- the fold
// windows, the ceilings, the voice cap, the bed targets, the counters -- runs
// on the game's clock and needs no context at all, which is what lets the node
// yard assert it: given forty grains in one frame, how many voices fire. The
// **context half** turns a decision into nodes, and is skipped wholesale where
// there is no context, which is every check and every page before the first
// gesture. Nothing is queued before that gesture: a yard that coughed up its
// whole first second the moment the browser allowed it would not be the yard.

import { SND_MASTER, SND_LOWPASS_HZ, SND_LOWPASS_Q, SND_LIMIT_DB, SND_LIMIT_RATIO,
         SND_LIMIT_RELEASE_S, SND_LIMIT_ATTACK_S, SND_LIMIT_KNEE_DB, SND_MUTE_S,
         SND_JITTER_CENTS, SND_JITTER_DB, SND_JITTER_MS, SND_PAN_MAX, SND_ATTACK_S,
         SND_RELEASE_TAILS, SND_STEAL_S, SND_VOICES,
         SND_STONE, SND_WOOD, SND_METAL, SND_WATER_SHOT, SND_AIR_SHOT, SND_RIFT_SHOT,
         SND_HARD_DROP, SND_HARD_DULL, SND_THUMP_HZ, SND_THUMP_FALL, SND_THUMP_S,
         SND_THUMP_LEVEL, SND_CRIT_RATIO, SND_CRIT_SHARE,
         SND_FOLD_MS, SND_FOLD_GAIN_DB, SND_FOLD_GAIN_MAX_DB, SND_FOLD_WIDEN,
         SND_FOLD_PER_S, SND_PUNCT_PER_S, SND_DUCK_DB, SND_DUCK_S, SND_DUCK_IN_S,
         SND_DUCK_OUT_S, SND_BED_S, SND_BED_FOLLOW_S, SND_BED_STEP,
         SND_WATER_LEVEL, SND_WATER_HZ, SND_WATER_WANDER, SND_WATER_WANDER_S,
         SND_DROWNED_LEVEL, SND_AIR_LEVEL, SND_AIR_FLOOR, SND_AIR_SMOG, SND_AIR_HZ_LO,
         SND_AIR_HZ_HI, SND_AIR_FOLLOW_S, SND_RIFT_LEVEL, SND_RIFT_HZ,
         SND_RIFT_BEAT_CENTS, SND_RIFT_FLOOR, SND_HUM_LEVEL, SND_HUM_HZ, SND_HUM_Q,
         SND_MANNED_MS, SND_NOISE_S, SND_PINK, SND_PINK_WHITE, SND_PINK_GAIN,
         P, SMOG_CAP, RIFT_W0, RIFT_WMAX } from './config.js';
import { S, rift } from './state.js';
import { now } from './clock.js';
import { rand } from './rng.js';
import { gust } from './wind.js';
import { MACHINES, machine } from './machines.js';

// --- the decision half ---------------------------------------------------------

let awake = false;
let muted = false;

// What has been decided since wake, and where each bed stands. `byClass` is
// what the yard *asked for*, by class -- the same reading the stub gave, so a
// check written against it keeps its meaning -- and `firedBy` is what got
// through. `beds` is the level each bed is being held at this frame, which
// eases toward what the yard says over SND_BED_S; `wants` is what the yard
// says. `pending` is open fold windows, which is the backlog, and is meant to
// read as nought a window after the yard goes quiet.
const decisions = {
  fired: 0, dropped: 0, folded: 0, stolen: 0, pending: 0, ducked: false,
  byClass: { hand: 0, fold: 0, punct: 0 },
  firedBy: { hand: 0, fold: 0, punct: 0 },
  beds:  { water: 0, air: 0, rift: 0, hum: 0 },
  wants: { water: 0, air: 0, rift: 0, hum: 0 }
};

const CLASSES = new Set(['hand', 'fold', 'punct']);
const SPEC = { stone: () => SND_STONE, wood: () => SND_WOOD, metal: () => SND_METAL,
               water: () => SND_WATER_SHOT, air: () => SND_AIR_SHOT, rift: () => SND_RIFT_SHOT };

// An open fold window per voice: the one sound it will emit when it closes,
// and everything folded into it so far, so the emission can stand for all of
// them -- panned to where they were on average, as hard as they were on
// average, big or crit if any one of them was.
const windows = new Map();
// When each voice last fired, per ceilinged class, for the last second.
const recent = { fold: new Map(), punct: new Map() };
// Every one-shot still sounding, for the cap. `env` is the context half's
// handle on it, or null on a yard with no context.
const active = [];
let duckUntil = -Infinity;
let lastT = -Infinity;

// The game's clock is turned back by a new game or a reseeded yard, and
// everything here is a time on that clock: a window due, a strike ringing, a
// fire in the last second, a duck coming off. All of it belonged to the yard
// that is gone, so it goes with it -- fading, where there is anything to fade.
function clock() {
  const t = now();
  if (t < lastT) {
    windows.clear();
    for (const v of active) if (v.env) fadeOut(v);
    active.length = 0;
    recent.fold.clear();
    recent.punct.clear();
    duckUntil = -Infinity;
    decisions.pending = 0;
  }
  lastT = t;
  return t;
}

const clamp = (v, lo = 0, hi = 1) => v < lo ? lo : v > hi ? hi : v;
const db = d => Math.pow(10, d / 20);
const cents = c => Math.pow(2, c / 1200);

// The ceilings. A voice's recent fires in a class are kept for a second and
// pruned as they age out. Over the ceiling is *dropped*: a ceiling that defers
// runs permanently late once the endgame yard gets going.
function over(voice, cls, t, ceiling) {
  const list = recent[cls].get(voice) || [];
  const kept = list.filter(at => at > t - 1000);
  recent[cls].set(voice, kept);
  return kept.length >= ceiling;
}
const mark = (voice, cls, t) => recent[cls].get(voice).push(t);

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

// One decided strike: the level it will take, the room it needs, and -- where
// there is a context -- the nodes. `n` is how many events this one stands for,
// and a folded strike was counted when its window opened, which is when the
// decision was made.
function fire(voice, o, cls, t, n = 1, counted = false) {
  const spec = (SPEC[voice] || SPEC.stone)();
  const foldDb = Math.min(SND_FOLD_GAIN_MAX_DB, SND_FOLD_GAIN_DB * Math.log2(n));
  const level = spec.level * db(foldDb + (rand() * 2 - 1) * SND_JITTER_DB);
  const widen = 1 + SND_FOLD_WIDEN * Math.log2(n);
  const delay = rand() * SND_JITTER_MS;
  const detune = (rand() * 2 - 1) * SND_JITTER_CENTS;
  const ring = SND_ATTACK_S + spec.decay * SND_RELEASE_TAILS +
               (o.big ? SND_THUMP_S : 0);
  makeRoom();
  if (!counted) { decisions.fired++; decisions.firedBy[cls]++; }
  const v = { at: t, level, cls, until: t + delay + ring * 1000, env: null };
  active.push(v);
  if (ctx) v.env = play(voice, spec, o, { level, widen, delay, detune, ring });
}

// Something physically happened at world x. `voice` is one of stone, wood,
// metal, water, air, rift; `opts` is { x, hard, big, crit, cls }, with cls one
// of 'hand' (never folded, never stolen, never ducked), 'fold' (the default:
// a handful of gravel is one sound, not forty) or 'punct' (rare by
// construction, and allowed to duck the beds). Before the first gesture it is
// a no-op and nothing is queued.
export function sfx(voice, opts = {}) {
  if (!awake) return;
  const cls = CLASSES.has(opts.cls) ? opts.cls : 'fold';
  decisions.byClass[cls]++;
  const t = clock();
  if (cls === 'hand') { fire(voice, opts, cls, t); return; }
  if (cls === 'punct') {
    if (over(voice, cls, t, SND_PUNCT_PER_S)) { decisions.dropped++; return; }
    mark(voice, cls, t);
    fire(voice, opts, cls, t);
    duckUntil = t + SND_DUCK_S * 1000;
    return;
  }
  const w = windows.get(voice);
  if (w) {
    // Inside the window: folded into the sound it will emit, not queued and
    // not fired. Averaged where it is worth averaging, or'd where one is
    // enough.
    w.n++;
    w.x += opts.x || 0;
    w.hard += opts.hard || 0;
    w.big = w.big || !!opts.big;
    w.crit = w.crit || !!opts.crit;
    decisions.folded++;
    return;
  }
  if (over(voice, cls, t, SND_FOLD_PER_S)) { decisions.dropped++; return; }
  mark(voice, cls, t);
  // The decision is made now -- this window will sound -- and the sound itself
  // waits for the window to close, so everything that lands inside it is in
  // it. Eighty milliseconds behind the first grain is not a lag anybody hears
  // on a grain; it is what makes forty of them one handful.
  windows.set(voice, { due: t + SND_FOLD_MS, n: 1, x: opts.x || 0,
                       hard: opts.hard || 0, big: !!opts.big, crit: !!opts.crit });
  decisions.fired++;
  decisions.firedBy.fold++;
  decisions.pending = windows.size;
}

// What the yard says each bed should be, in [0, 1], read fresh every frame.
// The one silence in the game is honored literally here: while the body lies
// flat after the boulder lands, every bed wants nought -- not even wind --
// until it gets up.
function wants() {
  const w = decisions.wants;
  if (S.intro === 'down') { w.water = w.air = w.rift = w.hum = 0; return; }
  w.water = clamp((S.raining ? 1 : 0) + (S.drowned ? SND_DROWNED_LEVEL : 0));
  // The wind you can see is the wind you can hear: one number, `gust()`, and
  // the sky's dirt on top of it.
  const blow = Math.abs(gust());
  const dirt = clamp((S.haze || 0) / SMOG_CAP);
  w.air = clamp(SND_AIR_FLOOR + (1 - SND_AIR_FLOOR) * blow + SND_AIR_SMOG * dirt);
  // The rift grows from the day it tears to the day the hole gives way, and
  // the abyss standing in the pit after that is the whole of it.
  if (!S.riftOpen) w.rift = 0;
  else if (S.drowned) w.rift = 1;
  else {
    const grown = clamp((rift.w / P - RIFT_W0) / Math.max(1, RIFT_WMAX - RIFT_W0));
    w.rift = SND_RIFT_FLOOR + (1 - SND_RIFT_FLOOR) * grown;
  }
  // A machine hums while somebody is standing at it, which is the rule every
  // machine already runs by: an unmanned one produces nothing and smokes
  // nothing, so it says nothing either.
  let manned = 0;
  const t = now();
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (r && r.bought && t - (r.mannedAt || 0) <= SND_MANNED_MS) manned++;
  }
  w.hum = MACHINES.length ? manned / MACHINES.length : 0;
}

// Once a frame: the windows that have closed, the voices that have finished,
// the beds moving toward what the yard says, and the duck coming off. `dt` is
// the frame in milliseconds, the same number every other step gets.
export function stepAudio(dt) {
  if (!awake) return;
  const t = clock();
  for (const [voice, w] of windows) {
    if (t < w.due) continue;
    windows.delete(voice);
    fire(voice, { x: w.x / w.n, hard: w.hard / w.n, big: w.big, crit: w.crit }, 'fold', t, w.n, true);
  }
  decisions.pending = windows.size;
  for (let i = active.length - 1; i >= 0; i--) if (t >= active[i].until) active.splice(i, 1);
  wants();
  // A linear crossfade over SND_BED_S, whatever the frame rate: the bed moves
  // by the frame's share of the crossfade and no more.
  const rate = dt / (SND_BED_S * 1000);
  const b = decisions.beds, w = decisions.wants;
  for (const k in b) b[k] += clamp(w[k] - b[k], -rate, rate);
  const ducked = t < duckUntil;
  const wasDucked = decisions.ducked;
  decisions.ducked = ducked;
  if (ctx) follow(ducked, wasDucked);
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
  nodes.master.gain.setTargetAtTime(muted ? 0 : SND_MASTER, ctx.currentTime, SND_MUTE_S / 3);
}

// The decision half, for the node tier.
export function audioDecisions() { return decisions; }

// --- the context half ------------------------------------------------------------
// Nothing below runs without a context, and nothing above depends on it.

let ctx = null;
const nodes = {};

// Master chain, in order: yard bus -> the lowpass that is the palette -> the
// limiter that makes the endgame yard the same loudness as the opening one ->
// master gain. The beds sit on their own bus under the yard's, which is what
// punctuation ducks.
function build() {
  const t = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t);
  master.gain.setTargetAtTime(muted ? 0 : SND_MASTER, t, SND_MUTE_S / 3);
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
  const beds = ctx.createGain();
  beds.connect(yard);

  Object.assign(nodes, { master, limiter, lowpass, yard, beds, noise: makeNoise() });
  nodes.water = bed('lowpass', SND_WATER_HZ, 1);
  nodes.air = bed('lowpass', SND_AIR_HZ_LO, 1);
  nodes.hum = bed('bandpass', SND_HUM_HZ, SND_HUM_Q);
  nodes.rift = riftBed();
}

// One buffer, a few seconds of pinkish noise out of the game's own `rand()`,
// read from a different offset by every strike: an unlimited supply of
// non-identical noise for nothing, and a seeded run has a seeded soundtrack.
function makeNoise() {
  const n = Math.floor(SND_NOISE_S * ctx.sampleRate);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const out = buf.getChannelData(0);
  const poles = SND_PINK.map(() => 0);
  for (let i = 0; i < n; i++) {
    const white = rand() * 2 - 1;
    let pink = 0;
    for (let p = 0; p < poles.length; p++) {
      poles[p] = SND_PINK[p][0] * poles[p] + white * SND_PINK[p][1];
      pink += poles[p];
    }
    out[i] = (pink + white * SND_PINK_WHITE) * SND_PINK_GAIN;
  }
  return buf;
}

// A looping read of the noise, starting somewhere in it.
function noiseSource(loop) {
  const src = ctx.createBufferSource();
  src.buffer = nodes.noise;
  src.loop = loop;
  return src;
}

// A bed made of the noise: source -> filter -> gain, held at nought until the
// yard says otherwise. Started once and left running; its gain is the whole of
// whether it is there.
function bed(type, hz, q) {
  const src = noiseSource(true);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = hz;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(filter); filter.connect(gain); gain.connect(nodes.beds);
  src.start(ctx.currentTime, rand() * SND_NOISE_S);
  return { src, filter, gain, sent: 0 };
}

// The one voice that is not struck: two very low sines a few cents apart,
// beating slowly. The beat is the flowing interference the pit already draws.
function riftBed() {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(nodes.beds);
  const oscs = [SND_RIFT_HZ, SND_RIFT_HZ * cents(SND_RIFT_BEAT_CENTS)].map(hz => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz;
    o.connect(gain);
    o.start();
    return o;
  });
  return { oscs, gain, sent: 0 };
}

// A parameter told where to go, and only when where to go has moved: the
// crossfade is the node's to do with a time constant, not the frame's to do a
// step at a time.
function aim(param, holder, key, value, tau, step) {
  const last = holder[key];
  if (last !== undefined && Math.abs(value - last) < step) return;
  holder[key] = value;
  param.setTargetAtTime(value, ctx.currentTime, tau);
}

// The beds and the master follow the decisions, once a frame.
function follow(ducked, wasDucked) {
  const b = decisions.beds;
  const tau = SND_BED_FOLLOW_S;
  aim(nodes.water.gain.gain, nodes.water, 'sent', b.water * SND_WATER_LEVEL, tau, SND_BED_STEP);
  aim(nodes.air.gain.gain, nodes.air, 'sent', b.air * SND_AIR_LEVEL, tau, SND_BED_STEP);
  aim(nodes.hum.gain.gain, nodes.hum, 'sent', b.hum * SND_HUM_LEVEL, tau, SND_BED_STEP);
  aim(nodes.rift.gain.gain, nodes.rift, 'sent', b.rift * SND_RIFT_LEVEL, tau, SND_BED_STEP);
  // The rain's lowpass wanders, so it is a band that opens and closes rather
  // than a fixed hiss; the wind's follows the gust, so a lull is dull and a
  // gust is bright, within the palette.
  const t = now() / 1000;
  const wander = SND_WATER_HZ * (1 + SND_WATER_WANDER * Math.sin(t * 2 * Math.PI / SND_WATER_WANDER_S));
  aim(nodes.water.filter.frequency, nodes.water, 'hz', wander, SND_WATER_WANDER_S / 4, SND_BED_STEP * SND_WATER_HZ);
  const blow = Math.abs(gust());
  aim(nodes.air.filter.frequency, nodes.air, 'hz', SND_AIR_HZ_LO + (SND_AIR_HZ_HI - SND_AIR_HZ_LO) * blow,
      SND_AIR_FOLLOW_S, SND_BED_STEP * (SND_AIR_HZ_HI - SND_AIR_HZ_LO));
  // The duck: quick in, gentle out.
  if (ducked !== wasDucked) {
    nodes.beds.gain.setTargetAtTime(ducked ? db(-SND_DUCK_DB) : 1, ctx.currentTime,
                                    ducked ? SND_DUCK_IN_S : SND_DUCK_OUT_S);
  }
  // And the two knobs on the panel, live.
  aim(nodes.master.gain, nodes, 'masterSent', muted ? 0 : SND_MASTER, SND_MUTE_S / 3, SND_BED_STEP);
  aim(nodes.lowpass.frequency, nodes, 'cornerSent', SND_LOWPASS_HZ, SND_MUTE_S, 1);
}

// Where a world x sits in the ear: shallow, against the middle of the view.
function panOf(x) {
  if (x == null || !S.viewW) return 0;
  const mid = S.camX + S.viewW / 2;
  return clamp((x - mid) / (S.viewW / 2), -1, 1) * SND_PAN_MAX;
}

// A bandpass over the noise at hz, into `to`, at `share` of the level.
function band(hz, q, to, share, at, stop) {
  const src = noiseSource(false);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = hz;
  f.Q.value = q;
  let tail = f;
  if (share !== 1) { tail = ctx.createGain(); tail.gain.value = share; f.connect(tail); }
  src.connect(f); tail.connect(to);
  src.start(at, rand() * (SND_NOISE_S - 1));
  src.stop(stop);
  return src;
}

// One strike, as nodes: source -> bandpass -> envelope -> pan -> the yard bus.
// `hard` moves the band down and dulls it; `big` puts the sine thump under it;
// `crit` adds an octave-down band under the same envelope -- body, not level.
// Returns the envelope, which is the handle the cap fades if it takes this one.
function play(voice, spec, o, { level, widen, delay, detune, ring }) {
  const at = ctx.currentTime + delay / 1000;
  const stop = at + ring;
  const hard = clamp(o.hard || 0);
  const hz = spec.hz * (1 - hard * SND_HARD_DROP) * cents(detune);
  const q = Math.max(0.1, spec.q * (1 - hard * SND_HARD_DULL) / widen);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(level, at + SND_ATTACK_S);
  env.gain.setTargetAtTime(0, at + SND_ATTACK_S, spec.decay);
  let out = env;
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = panOf(o.x);
    env.connect(pan);
    out = pan;
  }
  out.connect(nodes.yard);

  const sources = [];
  if (spec.q > 0) {
    sources.push(band(hz, q, env, 1, at, stop));
    if (spec.second) sources.push(band(hz * spec.second[0], q, env, spec.second[1], at, stop));
    if (o.crit) sources.push(band(hz * SND_CRIT_RATIO, q, env, SND_CRIT_SHARE, at, stop));
  } else {
    // The rift's strike: the bed's two sines, struck.
    for (const f of [hz, hz * cents(SND_RIFT_BEAT_CENTS)]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.connect(env);
      osc.start(at);
      osc.stop(stop);
      sources.push(osc);
    }
  }
  if (o.big) {
    // The thump: a sine that tunes down as it goes, under its own envelope,
    // panned with the strike it sits under.
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(SND_THUMP_HZ * cents(detune), at);
    osc.frequency.exponentialRampToValueAtTime(SND_THUMP_HZ * SND_THUMP_FALL, at + SND_THUMP_S);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(level * SND_THUMP_LEVEL, at + SND_ATTACK_S);
    g.gain.setTargetAtTime(0, at + SND_ATTACK_S, SND_THUMP_S / SND_RELEASE_TAILS);
    osc.connect(g); g.connect(out);
    osc.start(at);
    osc.stop(stop);
    sources.push(osc);
  }
  return { env, sources };
}

// A voice the cap took: a fade over a few milliseconds, never a stop.
function fadeOut(v) {
  const t = ctx.currentTime;
  const g = v.env.env.gain;
  if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
  g.setTargetAtTime(0, t, SND_STEAL_S / 3);
  for (const s of v.env.sources) s.stop(t + SND_STEAL_S * SND_RELEASE_TAILS);
}
