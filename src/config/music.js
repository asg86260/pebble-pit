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
