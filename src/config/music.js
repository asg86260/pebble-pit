// The score and the bench it is written on (DESIGN.md, "The score, and the
// bench it is written on"). The bench, the preview synth and the render all
// read these, so a clip drawn on the bench is the clip the render plays.

// A step is a sixteenth: sixteen to a bar of four beats.
export const MUSIC_STEPS_PER_BAR = 16;
export const MUSIC_BEATS_PER_BAR = 4;
// A clip loops over one of these lengths, in bars.
export const MUSIC_CLIP_BARS = [1, 2, 4, 8];
export const MUSIC_TEMPO_MIN = 40;
export const MUSIC_TEMPO_MAX = 240;
export const MUSIC_VEL_DEFAULT = 96;

// The drum lane's rows, as General MIDI drum notes, top to bottom.
export const MUSIC_DRUM_ROWS = [
  { pitch: 36, name: 'kick' },
  { pitch: 38, name: 'snare' },
  { pitch: 39, name: 'clap' },
  { pitch: 42, name: 'hat' },
  { pitch: 46, name: 'open hat' },
];

// The piano roll's window: the lowest MIDI note shown and how many rows.
export const MUSIC_ROLL_LOW = 36;
export const MUSIC_ROLL_ROWS = 48;

// The preview synth. Look-ahead scheduling: every tick, notes falling in the
// next window are handed to Web Audio with exact times, so a busy page never
// makes the beat drag.
export const MUSIC_SCHED_TICK_MS = 25;
export const MUSIC_SCHED_AHEAD_S = 0.12;
export const MUSIC_PREVIEW_MASTER = 0.5;
// The master's compressor, so a stack of tracks does not clip the preview.
export const MUSIC_PREVIEW_COMP = { threshold: -10, ratio: 4 };
// A synth track's voice when its `preview` leaves a field out: seconds for
// the envelope, hertz for the cutoff, cents for the two oscillators' spread.
export const MUSIC_PREVIEW_VOICE = { wave: 'sawtooth', cutoff: 1800, q: 1, attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.2, detune: 0 };
// The loudest a single preview note gets, at velocity 127.
export const MUSIC_PREVIEW_PEAK = 0.35;
// The filter opens to this many times its cutoff at the note's start.
export const MUSIC_PREVIEW_SWEEP = 2;
// The preview's drums, by GM pitch: a sine sweep for the kick, filtered noise
// for the rest (hertz, seconds, level at velocity 127).
export const MUSIC_PREVIEW_DRUMS = {
  kick: { from: 150, to: 45, sweep: 0.12, len: 0.35, level: 0.9 },
  snare: { freq: 1800, q: 0.8, len: 0.18, level: 0.6, tone: 190, toneLen: 0.1, toneLevel: 0.4 },
  clap: { freq: 1200, q: 1.5, len: 0.09, level: 0.5, gaps: [0, 0.012, 0.024] },
  hat: { freq: 8000, len: 0.05, level: 0.3 },
  openHat: { freq: 7000, len: 0.35, level: 0.25 },
};

// Surge live: the MIDI channel the selected track plays on (0-based).
export const MUSIC_LIVE_CHANNEL = 0;

// The render's loudness: a bed sits at -18 LUFS with the peaks under -1 dBTP.
export const MUSIC_LUFS = -18;
export const MUSIC_TRUE_PEAK = -1;

// Chords first (DESIGN.md, "Chords first, no wrong notes"). A key is a root
// and a mode; a chord is a scale degree, so a change of key carries the song.
export const MUSIC_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const MUSIC_MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
// A plain word for how each degree's chord tends to feel, shown under its name.
export const MUSIC_FEEL = {
  major: ['home', 'soft', 'wistful', 'lift', 'pull home', 'sad', 'tense'],
  minor: ['home, sad', 'tense', 'bright', 'soft, sad', 'restless', 'warm, lift', 'hopeful'],
};
// The chords that usually sound right after each degree: a small fixed table
// of common moves, starred on the strip. Nothing is forbidden.
export const MUSIC_NEXT = {
  major: { 1: [4, 5, 6], 2: [5, 4], 3: [6, 4], 4: [5, 1, 2], 5: [1, 6, 4], 6: [4, 2, 5], 7: [1, 3] },
  minor: { 1: [6, 4, 7], 2: [5, 1], 3: [6, 7, 4], 4: [1, 5, 7], 5: [1, 6], 6: [3, 7, 4], 7: [3, 1, 6] },
};
// Changing mode keeps each chord's degree, except where that lands on the
// diminished chord: into major the seventh becomes the fifth (both pull
// home), into minor the second becomes the fourth (both lean away from it).
export const MUSIC_MODE_SWAP = { major: { 7: 5 }, minor: { 2: 4 } };
// A new scene's chords, before anybody picks: a progression that already works.
export const MUSIC_START_CHORDS = { major: [1, 5, 6, 4], minor: [1, 6, 3, 7] };
// How many bars a chord strip can be; one chord a bar.
export const MUSIC_CHORD_BARS = [1, 2, 4, 8];

// Where each role's chord sits: the lowest MIDI note its root may land on, so
// the root falls in the octave above it.
export const MUSIC_ROLE_LOW = { bass: 33, pad: 52, arp: 57 };
// A following part's notes, a bar at a time: [step, tone, length, velocity].
// A tone is the chord's root `r`, third `3`, fifth `5`, the root an octave up
// `8`, the fifth below the root `5-`, or `a`, the scale note a step under the
// next bar's root (the walking bass's approach).
export const MUSIC_PATTERNS = {
  'bass-pulse': { role: 'bass', label: 'root pulse',
    hits: [[0, 'r', 2, 104], [2, 'r', 2, 80], [4, 'r', 2, 92], [6, 'r', 2, 80], [8, 'r', 2, 100], [10, 'r', 2, 80], [12, 'r', 2, 92], [14, 'r', 2, 80]] },
  'bass-fifth': { role: 'bass', label: 'root and fifth',
    hits: [[0, 'r', 6, 104], [6, 'r', 2, 82], [8, '8', 4, 92], [12, '5', 4, 88]] },
  'bass-walk': { role: 'bass', label: 'walking',
    hits: [[0, 'r', 4, 100], [4, '3', 4, 86], [8, '5', 4, 90], [12, 'a', 4, 84]] },
  'bass-held': { role: 'bass', label: 'held', hits: [[0, 'r', 16, 96]] },
  'pad-held': { role: 'pad', label: 'held chord', hits: [[0, 'r', 16, 72], [0, '3', 16, 68], [0, '5', 16, 68]] },
  'pad-swell': { role: 'pad', label: 'swell',
    hits: [[0, 'r', 16, 56], [0, '3', 16, 52], [0, '5', 16, 52], [8, '8', 8, 64]] },
  'pad-stabs': { role: 'pad', label: 'stabs',
    hits: [0, 6, 10].flatMap(st => [[st, 'r', 2, 88], [st, '3', 2, 84], [st, '5', 2, 84]]) },
  'arp-up': { role: 'arp', label: 'up',
    hits: ['r', '3', '5', '8', 'r', '3', '5', '8'].map((t, i) => [i * 2, t, 2, i % 2 ? 76 : 90]) },
  'arp-updown': { role: 'arp', label: 'up and down',
    hits: ['r', '3', '5', '8', '5', '3', 'r', '3'].map((t, i) => [i * 2, t, 2, i % 2 ? 76 : 90]) },
  'arp-broken': { role: 'arp', label: 'broken',
    hits: ['r', '5', '3', '5', '8', '5', '3', '5', 'r', '5', '3', '5', '8', '5', '3', '5'].map((t, i) => [i, t, 1, i % 4 ? 70 : 92]) },
};

// A track's effects chain (DESIGN.md, "A track's effects chain"). Each
// effect has up to three knobs; a knob is a range with a default (`log` turns
// it on a curve, for hertz and times), or a short list of `choices`; `about`
// is the sentence the bench shows for an effect or a knob. The
// preview (preview.js) and the render (tools/music/mix.py) read the same
// table, so a knob means the same thing to both.
const MIX = { label: 'mix', min: 0, max: 1, def: 0.4, about: 'How much of the effect you hear against the untouched sound.' };
// `lfo` marks a sweep's speed in hertz: the render rounds it to a whole
// number of cycles a loop, so the sweep never restarts at the seam.
const RATE = (def, about) => ({ label: 'rate', min: 0.05, max: 5, def, unit: 'Hz', log: true, lfo: true, about });
// Rates in beats keep a pulse on the beat at any tempo: a cycle of one beat,
// two beats, and so on.
const BEATS = (def, about) => ({ label: 'rate', choices: [0.25, 0.5, 1, 2, 4], names: ['1/16', '1/8', '1/4', '1/2', '1 bar'], def, about });
export const MUSIC_FX = {
  filter: { label: 'Filter', group: 'tone', about: 'Cuts the top or the bottom off. A lowpass makes things dark and far away.', params: {
    type: { label: 'type', choices: ['lowpass', 'highpass', 'bandpass'], def: 'lowpass', about: 'Lowpass keeps the lows, highpass the highs, bandpass a narrow middle.' },
    cutoff: { label: 'cutoff', min: 40, max: 16000, def: 1200, unit: 'Hz', log: true, about: 'Where the cut starts. Lower is darker for a lowpass.' },
    reso: { label: 'reso', min: 0, max: 1, def: 0.2, about: 'A ringing bump right at the cutoff. Higher sounds more synthy.' } } },
  eq: { label: 'EQ', group: 'tone', about: 'Turns the lows, the mids and the highs up or down.', params: {
    low: { label: 'low', min: -12, max: 12, def: 0, unit: 'dB', about: 'The bass end, below about 200 Hz.' },
    mid: { label: 'mid', min: -12, max: 12, def: 0, unit: 'dB', about: 'The middle, around 1 kHz: the body of most sounds.' },
    high: { label: 'high', min: -12, max: 12, def: 0, unit: 'dB', about: 'The top end, above about 5 kHz: air and sizzle.' } } },
  autofilter: { label: 'Auto-filter', group: 'tone', about: 'A filter that opens and shuts by itself: a slow breathing sweep.', params: {
    rate: RATE(0.25, 'How fast it sweeps. Slow sounds like breathing.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.6, about: 'How far it sweeps either side of the center.' },
    center: { label: 'center', min: 150, max: 8000, def: 1200, unit: 'Hz', log: true, about: 'The middle of the sweep. Lower stays darker.' } } },
  drive: { label: 'Drive', group: 'crunch', about: 'Pushes the sound until it gets fuzzy and warm.', params: {
    amount: { label: 'amount', min: 0, max: 36, def: 8, unit: 'dB', about: 'How hard it is pushed. A little is warm, a lot is fuzz.' },
    tone: { label: 'tone', min: 1000, max: 16000, def: 6000, unit: 'Hz', log: true, about: 'Takes the fizz off the top. Lower is darker and more muffled.' },
    mix: { ...MIX, def: 0.7 } } },
  bitcrush: { label: 'Bitcrush', group: 'crunch', about: 'Fewer bits: hard digital grit, like an old console.', params: {
    bits: { label: 'bits', min: 2, max: 16, def: 8, step: 1, about: 'Fewer bits is rougher. 16 is clean, 4 is very crushed.' },
    mix: { ...MIX, def: 0.5 } } },
  downsample: { label: 'Downsample', group: 'crunch', about: 'A lower sample rate: a softer, grainier crunch.', params: {
    rate: { label: 'rate', min: 1000, max: 44100, def: 11025, unit: 'Hz', log: true, about: 'Lower is grainier and more metallic. 44100 is clean.' },
    mix: { ...MIX, def: 1 } } },
  chorus: { label: 'Chorus', group: 'movement', about: 'Doubles the sound slightly out of tune: wide and shimmery.', params: {
    rate: RATE(0.7, 'How fast the doubled copy drifts.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.35, about: 'How far out of tune the copy drifts.' },
    mix: { ...MIX, def: 0.45 } } },
  phaser: { label: 'Phaser', group: 'movement', about: 'A swirling, sweeping whoosh.', params: {
    rate: RATE(0.5, 'How fast it swirls.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.5, about: 'How wide the swirl sweeps.' },
    mix: { ...MIX, def: 0.5 } } },
  flanger: { label: 'Flanger', group: 'movement', about: 'A jet-plane sweep, stronger than chorus.', params: {
    rate: RATE(0.3, 'How fast the jet sweeps by.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.6, about: 'How far it sweeps.' },
    feedback: { label: 'feedback', min: 0, max: 0.95, def: 0.6, about: 'Higher rings and whistles more.' } } },
  wobble: { label: 'Wobble', group: 'movement', about: 'Wow and flutter: the pitch drifts like a worn tape.', params: {
    wow: { label: 'wow', min: 0.1, max: 3, def: 0.6, unit: 'Hz', log: true, lfo: true, about: 'The slow drift: how fast the tape sags and recovers.' },
    depth: { label: 'depth', min: 0, max: 1, def: 0.4, about: 'How far out of tune it drifts. A little goes a long way.' },
    flutter: { label: 'flutter', min: 0, max: 1, def: 0.2, about: 'A fast, fine shake on top, like a cheap player.' } } },
  tremolo: { label: 'Tremolo', group: 'movement', about: 'The volume pulses up and down, in time with the beat.', params: {
    rate: BEATS(0.5, 'One pulse every this much of the beat.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.5, about: 'How far the volume dips on each pulse.' },
    shape: { label: 'shape', choices: ['sine', 'square'], def: 'sine', about: 'Sine is a smooth swell, square a hard chop.' } } },
  autopan: { label: 'Auto-pan', group: 'movement', about: 'Moves the sound from left to right and back, in time.', params: {
    rate: BEATS(2, 'One trip left and right every this much of the beat.'),
    depth: { label: 'depth', min: 0, max: 1, def: 0.7, about: 'How far it travels to each side.' } } },
  delay: { label: 'Delay', group: 'space', about: 'Echoes, in time with the beat.', params: {
    time: { label: 'time', choices: [0.25, 0.5, 0.75, 1, 1.5, 2], names: ['1/16', '1/8', '3/16', '1/4', '3/8', '1/2'], def: 0.75,
      about: 'The gap between echoes, as a slice of the beat. 3/16 is the classic bouncy one.' },
    feedback: { label: 'feedback', min: 0, max: 0.9, def: 0.35, about: 'How many echoes: higher keeps them going longer.' },
    mix: { ...MIX, def: 0.3 } } },
  reverb: { label: 'Reverb', group: 'space', about: 'A room around the sound, from a small close one to a huge hall.', params: {
    size: { label: 'size', min: 0, max: 1, def: 0.55, about: 'How big the room is: a closet at 0, a cathedral at 1.' },
    damp: { label: 'damping', min: 0, max: 1, def: 0.5, about: 'Soft walls: higher makes the tail darker.' },
    mix: { ...MIX, def: 0.25 } } },
  width: { label: 'Width', group: 'space', about: 'Spreads the sound wide across the speakers, or narrows it to the middle.', params: {
    amount: { label: 'amount', min: 0, max: 2, def: 1.5, about: '0 is mono in the middle, 1 leaves it as it is, 2 is extra wide.' } } },
  vinyl: { label: 'Vinyl', group: 'texture', about: 'Adds crackle and hiss under the track.', params: {
    crackle: { label: 'crackle', min: 0, max: 1, def: 0.4, about: 'Pops and clicks, like dust on a record.' },
    hiss: { label: 'hiss', min: 0, max: 1, def: 0.3, about: 'A soft bed of noise underneath.' },
    wear: { label: 'wear', min: 0, max: 1, def: 0.3, about: 'An old, worn record: takes off the top end.' } } },
  pitch: { label: 'Pitch shift', group: 'texture', about: 'Blends in a copy an octave up or down: a sparkle, or a sub.', params: {
    interval: { label: 'interval', choices: [-12, -7, -5, 5, 7, 12], names: ['-oct', '-5th', '-4th', '+4th', '+5th', '+oct'], def: 12,
      about: 'How far the copy is moved. An octave up sparkles, an octave down adds weight.' },
    mix: { ...MIX, def: 0.3 } } },
  comp: { label: 'Compressor', group: 'dynamics', about: 'Evens out the loud and the quiet, so it sits steady.', params: {
    threshold: { label: 'threshold', min: -40, max: 0, def: -18, unit: 'dB', about: 'How loud before it steps in. Lower squashes more.' },
    ratio: { label: 'ratio', min: 1, max: 20, def: 3, log: true, about: 'How hard it squashes. 2 is gentle, 10 is a wall.' },
    release: { label: 'release', min: 10, max: 1000, def: 150, unit: 'ms', log: true, about: 'How quickly it lets go after a loud bit.' } } },
  // The pump under the kick: dips the track on every kick of the song's drums.
  duck: { label: 'Duck', group: 'dynamics', about: 'Dips the track on every kick: the pumping sound.', params: {
    amount: { label: 'amount', min: 0, max: 24, def: 6, unit: 'dB', about: 'How far it dips on each kick.' },
    release: { label: 'release', min: 0.03, max: 0.6, def: 0.15, unit: 's', log: true, about: 'How quickly it swells back after each kick.' } } },
};
// The panel's groups, in the order it lists them.
export const MUSIC_FX_GROUPS = [
  ['tone', 'Tone'], ['crunch', 'Crunch'], ['movement', 'Movement'], ['space', 'Space'], ['texture', 'Texture'], ['dynamics', 'Dynamics'],
];
// Starting points: a whole chain to drop on a track and then tweak.
export const MUSIC_FX_PRESETS = [
  { name: 'Muffled crunch', about: 'Dark, crushed and far away, like your test song.', chain: [
    ['bitcrush', { bits: 4, mix: 0.8 }], ['drive', { amount: 9, tone: 1800, mix: 0.4 }], ['filter', { type: 'lowpass', cutoff: 2200, reso: 0.1 }]] },
  { name: 'Lo-fi tape', about: 'A worn cassette: a slight warble, soft grain, a little hiss.', chain: [
    ['wobble', { wow: 0.5, depth: 0.3, flutter: 0.2 }], ['downsample', { rate: 16000, mix: 1 }],
    ['filter', { type: 'lowpass', cutoff: 4000, reso: 0.1 }], ['vinyl', { crackle: 0.25, hiss: 0.2, wear: 0.3 }]] },
  { name: 'Dreamy pad', about: 'Wide and slowly breathing, for chords that hang in the air.', chain: [
    ['chorus', { rate: 0.4, depth: 0.5, mix: 0.5 }], ['autofilter', { rate: 0.15, depth: 0.5, center: 1500 }],
    ['reverb', { size: 0.85, damp: 0.4, mix: 0.45 }]] },
  { name: 'Underwater', about: 'Muffled and wobbly, like hearing it through water.', chain: [
    ['filter', { type: 'lowpass', cutoff: 600, reso: 0.35 }], ['wobble', { wow: 0.4, depth: 0.5, flutter: 0 }],
    ['chorus', { rate: 0.3, depth: 0.6, mix: 0.5 }], ['reverb', { size: 0.7, damp: 0.7, mix: 0.4 }]] },
  { name: 'Old radio', about: 'Thin and crackly, from a speaker in another room.', chain: [
    ['filter', { type: 'bandpass', cutoff: 1500, reso: 0.3 }], ['drive', { amount: 12, tone: 4000, mix: 0.6 }],
    ['downsample', { rate: 8000, mix: 1 }], ['vinyl', { crackle: 0.5, hiss: 0.35, wear: 0.5 }]] },
  { name: 'Space echo', about: 'Echoes that trail away into the distance.', chain: [
    ['delay', { time: 0.75, feedback: 0.6, mix: 0.4 }], ['filter', { type: 'lowpass', cutoff: 3500, reso: 0.1 }],
    ['reverb', { size: 0.75, damp: 0.5, mix: 0.35 }]] },
  { name: 'Warm bass', about: 'Round and full, and it breathes with the kick.', chain: [
    ['drive', { amount: 6, tone: 3000, mix: 0.6 }], ['filter', { type: 'lowpass', cutoff: 700, reso: 0.15 }],
    ['comp', { threshold: -20, ratio: 4, release: 120 }], ['duck', { amount: 6, release: 0.15 }]] },
  { name: 'Chip crunch', about: 'Old console grit, kept in the middle.', chain: [
    ['bitcrush', { bits: 6, mix: 1 }], ['downsample', { rate: 11025, mix: 1 }], ['width', { amount: 0.3 }]] },
  { name: 'Swirl keys', about: 'Electric-piano wobble, gently pulsing.', chain: [
    ['phaser', { rate: 0.3, depth: 0.6, mix: 0.5 }], ['tremolo', { rate: 0.5, depth: 0.35, shape: 'sine' }],
    ['reverb', { size: 0.5, damp: 0.5, mix: 0.3 }]] },
  { name: 'Wide shimmer', about: 'A sparkly octave above, spread wide.', chain: [
    ['pitch', { interval: 12, mix: 0.25 }], ['chorus', { rate: 0.5, depth: 0.4, mix: 0.4 }],
    ['width', { amount: 1.8 }], ['reverb', { size: 0.8, damp: 0.4, mix: 0.4 }]] },
];

// A new song's following parts start with these chains.
export const MUSIC_START_FX = {
  bass: [{ type: 'duck', params: { amount: 5 } }],
  pad: [{ type: 'chorus' }, { type: 'reverb', params: { mix: 0.3 } }],
  arp: [{ type: 'delay' }, { type: 'reverb', params: { mix: 0.2 } }],
};

// The preview's stand-ins for the effects (fxnodes.js): corner frequencies
// in hertz, times in seconds. The render keeps its own in tools/music/mix.py.
export const MUSIC_PREVIEW_FX = {
  shaperSize: 1024,
  filterQ: [0.7, 14],               // Q at reso 0, and what reso 1 adds
  eqLow: 200, eqMid: 1000, eqMidQ: 0.9, eqHigh: 5000,
  driveMakeup: 0.25,                // how much of the drive's gain is taken back after
  chorusBase: 0.012, chorusSwing: 0.006,
  phaserFreqs: [400, 800, 1600, 3200], phaserSwing: 600,
  delayTone: 5000,
  reverbSeconds: [0.6, 3.4],        // a hall's length at size 0, and what size 1 adds
  reverbCurve: 3, reverbStep: 0.05,
  reverbDamp: [1500, 14000],        // the hall's lowpass at damping 1 and at 0
  compAttack: 0.01,
  duckAttack: 0.004, duckHold: 0.02,
  autoQ: 2, autoSwing: 0.85,        // the auto-filter's sweep: a share of its center at depth 1
  flangeBase: 0.002, flangeSwing: 0.0018,
  wobbleBase: 0.006, wowSwing: 0.003, flutterHz: 7, flutterSwing: 0.0004,
  tremSmooth: 60,                   // hertz: the square tremolo's edges, softened
  vinylLoop: 4.3, hissLevel: 0.03, crackleOdds: 0.0004, crackleLevel: 0.5,
  wearHz: [16000, 3000],            // the record's top end at wear 0 and at wear 1
  pitchWindow: 0.06,
};

// the render
// tools/music/render.mjs: one sample rate for every stem so a cached stem
// mixes with a fresh one. The loop kept is the second pass, [L, 2L), which
// already holds the first pass's releases, delay and reverb. Surge's
// oscillators and LFOs run free, so the second pass never ends on the sample
// its own head began from; a third pass is rendered so the samples after 2L
// are the true continuation of the loop's end, and the head is crossfaded
// from that continuation into the second pass over MUSIC_RENDER_SEAM_S. The
// tail lets the third pass's releases finish inside the render.
export const MUSIC_RENDER_SR = 44100;
export const MUSIC_RENDER_PASSES = 3;
export const MUSIC_RENDER_TAIL_S = 3;
export const MUSIC_RENDER_SEAM_S = 0.01;
// Surge XT's first process() after a state change is silent, so it is primed.
export const MUSIC_RENDER_PRIME_S = 0.5;
// Each Surge takes 30 to 55 s and a core to load; other agents share the machine.
export const MUSIC_RENDER_JOBS = 3;
export const MUSIC_RENDER_OGG_Q = 5;
// The MIDI file's resolution: a sixteenth is a quarter of a beat.
export const MUSIC_RENDER_PPQ = 480;
