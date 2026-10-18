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

// Surge live: the MIDI channel the selected track plays on (0-based).
export const MUSIC_LIVE_CHANNEL = 0;

// The render's loudness: a bed sits at -18 LUFS with the peaks under -1 dBTP.
export const MUSIC_LUFS = -18;
export const MUSIC_TRUE_PEAK = -1;

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
