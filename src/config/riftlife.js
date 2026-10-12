// Life seen through the rift (src/riftlife.js): between the tear and the
// drowning, now and then something crosses the sky on the other side of the
// disc -- the deep's creatures, alone or in a shoal, and rarely the serpent
// himself. A picture only. Timings are seconds, reaches cells, as the mock
// wrote them (docs/mocks/rift-life-2026-10-12.html on mock/rift-life, option 3).

// When. The first waits a minute after the tear, so the tear stands alone;
// then a creature or a shoal every GAP, start to start. The serpent comes
// first SERPENT_FIRST after that minute, then SERPENT_GAP after his last
// start, so never twice in five minutes.
export const RIFTLIFE_FIRST_S = 60;
export const RIFTLIFE_GAP_S = [20, 40];
export const RIFTLIFE_SERPENT_FIRST_S = [120, 300];
export const RIFTLIFE_SERPENT_GAP_S = [300, 480];
export const RIFTLIFE_SERPENTS = ['coil', 'crest', 'eye'];   // picked evenly

// The three depths behind the tear, far to near: their pace in cells a
// second (a whole cell a step), the size of a sprite unit in cells, and how
// many rungs down its own ramp a creature in its own tones is painted.
export const RIFTLIFE_SPEED = [2.5, 3.5, 5];
export const RIFTLIFE_SCALE = [0.2, 0.3, 0.5];
export const RIFTLIFE_DIM = [5, 3, 0];
export const RIFTLIFE_SILHOUETTE = [5, 7, 9];   // a shoal's one tone at each depth, rungs of ABYSS_MAGIC_TONES
export const RIFTLIFE_STEP_S = 1 / 8;           // the wriggles' held step

// What crosses: a shoal (1a, silhouettes, far or middle) this share of the
// time, else one creature in its own tones (1b, middle or near). A shoal is
// N creatures strung out BACK cells apart, each up to DY cells off the line.
// The line is LANE of the way from the middle to the rim, either side.
export const RIFTLIFE_SHOAL_SHARE = 0.5;
export const RIFTLIFE_SHOAL_N = [3, 5];
export const RIFTLIFE_SHOAL_BACK = [3, 4];
export const RIFTLIFE_SHOAL_DY = 2;
export const RIFTLIFE_SHOAL_DEPTHS = [0, 1];
export const RIFTLIFE_SINGLE_DEPTHS = [1, 2];
export const RIFTLIFE_LANE = 0.2;
export const RIFTLIFE_ENTER = 1;                // cells outside the rim a crossing starts
export const RIFTLIFE_FLEE = 3;                 // the dart-off, times the pace

// The serpent sliding past (2a, far, the whole length of him) and his crest
// along the bottom chord (2b, nearer). The mock's own paces, which its
// timings were written to: 18 s and 9 s across the grown disc. `r` is his
// half-thickness, `amp`/`wave`/`waveSpeed`/`waveStep` the slow undulation,
// `len` his length, `crest` how far down his back the spikes run and
// `crestH` the tallest; `taperHead`/`taperTail` where he narrows. Tones are
// rungs of ABYSS_TONES, the crest's of ABYSS_MAGIC_TONES, and the tip on
// the tallest spikes white (grey ramp) or purple.
export const RIFTLIFE_COIL = {
  coil: { d: 0, v: 4, r: 2.5, amp: 1.2, len: 46, crest: 10, crestH: 2, lane: 0.12, enter: 3,
          edge: 5, hide: 7, spine: 6, belly: 6, lattice: 6, crestTones: [7, 9], tip: 10, tipGrey: false },
  crest: { d: 1, v: 7, r: 4, amp: 0.6, len: 40, crest: 24, crestH: 3, chord: 2.4, enter: 3,
           edge: 7, hide: 10, spine: 9, belly: 9, lattice: 9, crestTones: [9, 10], tip: 11, tipGrey: true },
};
export const RIFTLIFE_COIL_WAVE = 5;            // cells a wave
export const RIFTLIFE_COIL_WAVE_SPEED = 1.3;
export const RIFTLIFE_COIL_WAVE_STEP = 1 / 4;
export const RIFTLIFE_COIL_TAPER_HEAD = 1.5;
export const RIFTLIFE_COIL_TAPER_TAIL = 14;

// The eye at the window (2c): the stars go out from the middle a cell a
// step, dark hide surfaces, a lid opens on a pale eye with the crest's purple
// round a slit; it looks one way, blinks, looks the other, closes and backs
// off. `open` is the lid by time (-1 none, 0 shut, 1..3 opening), `looks`
// where the iris turns, `halfH` the open eye's half-height a lid state.
// On a disc wider than `big` cells it sits off the middle by `off`.
export const RIFTLIFE_EYE = {
  len: 10.6,
  outFor: 1.5, outStep: 0.15, reach: 9, backAt: 8.8, backStep: 0.18, hideTill: 9.6,
  open: [[2.6, -1], [2.9, 1], [3.2, 2], [6.4, 3], [6.6, 0], [6.8, 2], [8.0, 3], [8.2, 2], [8.4, 1], [8.8, 0]],
  looks: [[4.6, 5.8, -1.5], [6.8, 7.6, 1.5]],
  halfW: 4.6, halfH: [0, 0.9, 1.6, 2.3], lidW: 4, brow: 5.2, iris: 2.6, slit: 1.6,
  big: 5, off: [-2, 1],
  // rungs of ABYSS_TONES, and the iris's of ABYSS_MAGIC_TONES
  dark: 1, rim: 2, hide: [3, 4], lid: 6, white: 10, whiteEdge: 8, irisTones: [10, 11],
};
