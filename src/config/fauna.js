// --- the deep's creatures, by zone ------------------------------------------------
// The owner's layout A of docs/mocks/deep-full-height-2026-10-12.html, "zones
// over the fight": the deep's 130 rows cut into five ocean zones, each with
// the few creatures its real-world kin are drawn from, from the portal down
// to the floor. Picture only: nothing here is fought, eaten or saved
// (DESIGN.md, "The deep's zones").
//
// Rows count down from the deep's ceiling, columns along from its left end,
// in cells.

// The zones, top to bottom. `tones` are the two rungs of the deep's grey ramp
// (ABYSS_TONES) its water is dithered in -- `tones[1]` on `share` of the
// cells, `tones[0]` up to FAUNA_TINT_FILL of them unless it is black -- and
// `dim` the rungs every creature in it is drawn darker by. The midnight band
// holds the serpent's bar and the fight's numbers, so it is kept dim there.
export const FAUNA_ZONES = [
  { key: 'sun', from: 0, to: 22, tones: [2, 3], share: 0.12, dim: 0 },
  { key: 'twi', from: 22, to: 48, tones: [1, 2], share: 0.14, dim: 0 },
  { key: 'mid', from: 48, to: 88, tones: [0, 1], share: 0.07, dim: 2 },
  { key: 'aby', from: 88, to: 118, tones: [0, 1], share: 0.02, dim: 0 },
  { key: 'had', from: 118, to: 130, tones: [0, 0], share: 0, dim: 0 },
];
export const FAUNA_TINT_FILL = 0.6;
// Rows either side of a border where the two zones' cells are mixed, and the
// chance a cell on the row next to the border takes its neighbor's, falling
// an equal step a row to nothing past the edge: dithered across, never a
// gradient.
export const FAUNA_TINT_EDGE = 4;
export const FAUNA_TINT_MIX = 0.4;
// Rows of the sunlit's tint carried on over the deep's ceiling: a tall window
// (a phone's) reaches above it, and the tint stopping there would draw a
// hard edge across the water.
export const FAUNA_TINT_HEAD = 60;

// The drawings: rows of characters, two or three held frames each at `fps`.
// d c b a grey body, each cell nudged a rung either way, fixed per creature
// (FAUNA_BASE, FAUNA_VARY); w white; e near-black; q r p the purple ramp; L a
// light that blinks on its own clock (FAUNA_BLINK).
export const FAUNA_SPRITES = {
  sardine: { fps: 6, f: [['d.cbw', 'dcccb'], ['.dcbw', 'dcccb']] },
  jelly: { fps: 2.5, f: [
    ['.bbb.', 'bcwcb', 'b...b', 'd.d.d', '.d.d.', 'd.d.d'],
    ['.bbb.', 'bcwcb', '.b.b.', '.ddd.', '.d.d.', '.d.d.'],
    ['..b..', '.bwb.', 'bc.cb', 'd.d.d', 'd.d.d', '.d.d.']] },
  lantern: { fps: 5, f: [['..cccb.', 'dccccbw', 'd.L.L..'], ['d.cccb.', '.ccccbw', '..L.L..']] },
  hatchet: { fps: 4, f: [['..bbw', '.bbbb', 'dbbbb', '.bbbL', '..LL.'], ['..bbw', '.bbbb', '.bbbb', 'dbbbL', '..LL.']] },
  angler: { fps: 2, f: [
    ['.....dddd.', '....d...dL', '..cccc....', 'dccccccw..', 'dcccccccc.', 'dcccwcwc..', '..ccccc...'],
    ['.....dddd.', '....d...dL', '..cccc....', 'dccccccw..', 'dccccc....', 'dcccwcw...', '..cccccc..']] },
  vampire: { fps: 2, f: [
    ['...rr...', '..rrrr..', '.rqqqqr.', '.qbqqbq.', 'qqqqqqqq', 'q.q..q.q', 'q.q..q.q', '..q..q..'],
    ['...rr...', '..rrrr..', '.rqqqqr.', '.qbqqbq.', '.qqqqqq.', '..qqqq..', '..q..q..', '.q.qq.q.']] },
  dumbo: { fps: 3, f: [
    ['b.ccc.b', 'bbcccbb', '.cwcwc.', '.ccccc.', 'c.c.c.c', 'c.c.c.c', '.c...c.'],
    ['..ccc..', 'bbcccbb', 'bcwcwcb', '.ccccc.', '.c.c.c.', 'c.c.c.c', 'c.....c'],
    ['..ccc..', '.ccccc.', 'bcwcwcb', 'bcccccb', '.c.c.c.', '.c.c.c.', 'c.c.c.c']] },
  tripod: { fps: 1.5, f: [
    ['.........b.', '......ccb..', 'dccccccccw.', '.ccccccc...', '.d....d....', '.d.....d...', 'd.......d..'],
    ['..........b', '......cccb.', 'dccccccccw.', '.ccccccc...', '.d....d....', '.d.....d...', 'd.......d..']] },
  cucumber: { fps: 1, f: [['.cbcbc.', 'ccccccc', 'd.d.d.d'], ['..cbcbc', '.cccccc', '.d.d.d.']] },
  amphipod: { fps: 6, f: [['.bb.', 'bccw', 'd.d.'], ['.bb.', 'bccw', '.d.d']] },
  snail: { fps: 3, f: [['....bbb.', 'dbbbbbbw', '....bbb.'], ['d...bbb.', '.bbbbbbw', '....bbb.']] },
  gulperHead: { fps: 1.5, f: [['cc...', 'cccw.', 'ccccc', 'cccc.', 'cc...'], ['cccc.', 'cc.w.', 'c....', 'c....', 'cccc.']] },
};
// The grey body's rungs of ABYSS_TONES, and each cell's nudge: a rung down
// under `lo` of its hash, a rung up over `hi`, never under `floor`.
export const FAUNA_BASE = { d: 6, c: 8, b: 10 };
export const FAUNA_VARY = { lo: 0.2, hi: 0.85, floor: 4 };
// The rungs the other characters are drawn in: white, near-black, and the
// purple ramp's (ABYSS_MAGIC_TONES) -- `q` its two body rungs, the darker on
// `qDark` of the cells.
export const FAUNA_INK = { w: 11, e: 4, q: [7, 6], qDark: 0.25, r: 9, p: 11 };
// A light: lit on two beats in three, a beat `rate` a second, each light on
// its own phase; lit and dark rungs of the purple ramp.
export const FAUNA_BLINK = { rate: 2.3, lit: 11, dark: 6 };

// Who lives where. `n` of each `kind` in `zone`, each at a height in `y`
// (rows) or on the floor (`floor`), or hovering `low` over it; a pace `v` in
// cells a second (one, or a range each draws from); every `flip`-th swims
// the other way. A school is `school` sardines scattered over `spread`
// cells; the amphipods `hop`, going in dashes. Same seeds every run.
export const FAUNA = [
  { kind: 'school', zone: 'sun', n: 4, y: [5, 18], v: [5, 8], flip: 2, school: [9, 12], spread: [22, 8] },
  { kind: 'jelly', zone: 'sun', n: 6, y: [4, 17], v: 0.5, flip: 2 },
  { kind: 'lantern', zone: 'twi', n: 16, y: [24, 45], v: [2.5, 5], flip: 3 },
  { kind: 'hatchet', zone: 'twi', n: 9, y: [25, 43], v: [1.5, 3], flip: 2 },
  { kind: 'siphon', zone: 'twi', n: 3, y: [30, 44], v: 0.7, flip: 2 },
  { kind: 'angler', zone: 'mid', n: 3, y: [50, 82], v: 1.2, flip: 2 },
  { kind: 'gulper', zone: 'mid', n: 2, y: [52, 80], v: 2.2, flip: 2 },
  { kind: 'vampire', zone: 'mid', n: 3, y: [50, 80], v: 0.9, flip: 2 },
  { kind: 'dumbo', zone: 'aby', n: 4, y: [92, 106], v: 0.8, flip: 2 },
  { kind: 'tripod', zone: 'aby', n: 5, floor: true, v: 0, flip: 2 },
  { kind: 'cucumber', zone: 'aby', n: 6, floor: true, v: 0.25, flip: 2 },
  { kind: 'amphipod', zone: 'had', n: 12, floor: true, v: 3.5, flip: 2, hop: true },
  { kind: 'snail', zone: 'had', n: 3, low: true, v: 1.4, flip: 2 },
];

// The motions. A swimmer bobs a held cell or two on a slow sine (`bob`, per
// second, `amp` rows); a jelly more slowly and further. A low hoverer sits
// `up` rows over the floor. A creature leaves one end and comes back in at
// the other `wrap` cells beyond it, so nothing pops in. Nothing swims nearer
// the floor than `clear` rows. The amphipods dash `dash` a second, each dash
// `step` of a second's way, `burst` times as fast as their pace.
export const FAUNA_MOTION = {
  bob: 1.3, amp: 1, jellyBob: 0.9, jellyAmp: 2,
  low: { up: 6, bob: 1.1, amp: 1.5 },
  wrap: 30, clear: 8,
  hop: { dash: 1.5, step: 0.45, burst: 2.2 },
  school: { drift: 1.7, driftAmp: 1.2, bob: 2.1, bobAmp: 0.8, seedStep: 0.13 },
};
// A siphonophore: a float, then a chain of `bells` cells swaying on a wave
// with a glint running down it, a frond every third bell.
export const FAUNA_SIPHON = { bells: 26, glint: 6, wave: 0.45, sway: 1.2, amp: 1.6,
  float: [10, 9], bell: [7, 9], frond: 5, frondLit: 8, glintTone: 11 };
// A gulper eel: the head drawing, then a whip of a tail `tail` cells long
// with a lit tip, thick for its first `thick`, dark for its last `dark`.
export const FAUNA_GULPER = { tail: 24, wave: 0.35, beat: 3, amp: 3, thick: 8, dark: 6,
  body: 8, under: 6, tip: 11 };

// The far stream's crossings (render/fish.js) swim the zones above the fight
// rather than across it: the farthest anywhere from the sunlit down through
// the twilight, the middle depth in the twilight, each a zone key from first
// to last. The near stream keeps its band over the coil, where the meals
// come from.
export const FLOW_FAR_ZONES = [['sun', 'twi'], ['twi', 'twi']];

// --- a scare -----------------------------------------------------------------------
// A lash sweeping the coil, or a defense breaking, frightens what lives near
// it: a creature within `reach` cells of the point is thrown directly away
// from it, up to `push` cells at the point itself and nothing at the edge of
// the reach, in whole cells, held `rate` times a second. The push builds over
// `rise` seconds, then eases back over `fall`, so a creature is home on its
// own path `rise + fall` after. A lash scares every `every` seconds of its
// sweep, at the tip of it. The floor-dwellers skitter along the floor
// (`floorK` of the push, sideways only); a school's fish each take a share
// of `shoal` either side of whole, and a vertical push is `lift` of a
// horizontal one. At most `keep` scares are held; within `core` cells of the
// point the push eases to nothing rather than turning a creature round.
export const FAUNA_SCARE = {
  lash: { reach: 34, push: 5, every: 0.35 },
  break: { reach: 80, push: 13 },
  rise: 0.3, fall: 2.2, rate: 12,
  floorK: 1, shoal: 0.45, lift: 0.6, keep: 24, core: 6,
};
