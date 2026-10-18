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
