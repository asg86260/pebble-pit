import { P } from './yard.js';
import { BIRD_REACH, BIRD_DUST } from './weather.js';

// --- the deep's creatures, by zone ------------------------------------------------
// The owner's layout A of docs/mocks/deep-full-height-2026-10-12.html, "zones
// over the fight": the deep's 130 rows cut into five ocean zones, each with
// the few creatures its real-world kin are drawn from, from the portal down
// to the floor. Nothing here is fought, eaten or saved; a click startles
// one off the way it startles a bird (DESIGN.md, "The deep's zones").
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
// Sparse, the way the birds are (the owner, 2026-10-13: "a little noisy",
// then "still have too many creatures around"): two in each zone, the
// midnight band round the coil and the bar one. A row at nought is a kind
// that zone keeps for a busier deep.
export const FAUNA = [
  { kind: 'school', zone: 'sun', n: 1, y: [5, 18], v: [5, 8], flip: 2, school: [9, 12], spread: [22, 8] },
  { kind: 'jelly', zone: 'sun', n: 1, y: [4, 17], v: 0.5, flip: 2 },
  { kind: 'lantern', zone: 'twi', n: 1, y: [24, 45], v: [2.5, 5], flip: 2 },
  { kind: 'hatchet', zone: 'twi', n: 0, y: [25, 43], v: [1.5, 3], flip: 2 },
  { kind: 'siphon', zone: 'twi', n: 1, y: [30, 44], v: 0.7, flip: 2 },
  { kind: 'angler', zone: 'mid', n: 1, y: [50, 82], v: 1.2, flip: 2 },
  { kind: 'vampire', zone: 'mid', n: 0, y: [50, 80], v: 0.9, flip: 2 },
  { kind: 'dumbo', zone: 'aby', n: 1, y: [92, 106], v: 0.8, flip: 2 },
  { kind: 'tripod', zone: 'aby', n: 1, floor: true, v: 0, flip: 2 },
  { kind: 'cucumber', zone: 'aby', n: 0, floor: true, v: 0.25, flip: 2 },
  { kind: 'amphipod', zone: 'had', n: 1, floor: true, v: 3.5, flip: 2, hop: true },
  { kind: 'snail', zone: 'had', n: 1, low: true, v: 1.4, flip: 2 },
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

// --- a startle --------------------------------------------------------------------
// A click on a creature startles it the way it startles a bird: it shakes
// loose the bird's handful, as scales that sink to the floor for the
// gatherers, and plays its reaction (FAUNA_REACT) in held poses `rate` a
// second. One whose reaction is a bolt darts for the nearer end of the deep,
// `pace` cells a second, its frames `quick` times as fast; out past the end
// it is away `away` seconds (a range), then comes back in at the end it left
// by its own path. `reach` is the bird's, in cells.
export const FAUNA_STARTLE = { pace: 30, rate: 12, quick: 2.5, away: [20, 40], reach: BIRD_REACH / P };
export const FAUNA_SCALES = BIRD_DUST;

// --- a click's reaction ----------------------------------------------------------
// The owner's picks off docs/mocks/creature-clicks-2026-10-13.html (school B,
// every other kind A): each kind answers a click its own way in held poses
// and is home on its own path `end` seconds after, its path carried on under
// it the while. The school alone still bolts (`bolt`), every fish turned to
// face the way it goes and held `hold` seconds first.
//
// The tracks, each [[seconds after the click, value], ...]:
//   x, y      whole cells off its path, x forward along the way it faces, y
//             down; straight between two keys, held before the first and
//             after the last, and two keys at one second are a jump
//   spacing   the siphon's bells apart, the same way but not to whole cells
//   the rest  a value from its second on, until the next (null: its own)
//     pose    a frame of its drawing, or one of FAUNA_POSES
//     turn    facing back the way it came
//     quick   its frames run this many times as fast
//     lights  'off', 'lit', or how many of them are lit, the rest out
//     halo    its lights ringed in purple
//     vflip   upside down
//     amp     the siphon's sway
// `silt`: the seconds it kicks silt off the bed, either side of its middle.
export const FAUNA_REACT = {
  school: { bolt: true, hold: 0.17 },
  jelly: { end: 3.2,
    y: [[0, -2], [0.45, -2], [0.45, -4], [0.9, -4], [0.9, -6], [1.3, -6], [3.2, 0]],
    pose: [[0, 2], [0.17, 1], [0.45, 2], [0.62, 1], [0.9, 2], [1.07, 1], [1.3, null]] },
  lantern: { end: 3.4,
    x: [[0, 0], [0.17, 6], [0.25, 8], [1.8, 8], [3.4, 0]],
    turn: [[1.8, true], [3.4, null]], quick: [[0, 3], [0.4, 1]], lights: [[0, 0], [1.4, 1], [1.6, null]] },
  hatchet: { end: 2.6,
    pose: [[0, 'edgeHalf'], [0.08, 'edge'], [1.4, 'edgeHalf'], [1.5, null]],
    y: [[0.08, 0], [1.4, 2], [1.5, 2], [2.6, 0]] },
  siphon: { end: 1.9,
    spacing: [[0, 1], [0.08, 0.6], [0.17, 0.3], [1.5, 0.3], [1.67, 0.6], [1.84, 1]], amp: [[0.08, 0.4], [1.6, null]] },
  angler: { end: 2.2,
    x: [[0.42, 0], [0.5, 3], [1.0, 3], [2.2, 0]],
    lights: [[0, 'lit'], [0.5, null]], halo: [[0, true], [0.33, null]], pose: [[0, 0], [0.33, 1], [0.5, 0], [1.0, null]] },
  vampire: { end: 2.0, pose: [[0, 1], [0.08, 'pineapple'], [1.8, 1], [1.92, null]] },
  dumbo: { end: 3.2, quick: [[0, 4], [1.4, 1]],
    x: [[0, 0], [0.67, 5], [1.4, 5], [3.2, 0]],
    y: [[0, 0], [0.17, -2], [0.33, -4], [0.5, -6], [0.67, -8], [1.4, -8], [3.2, 0]] },
  tripod: { end: 2.0, pose: [[0.08, 'stiltsUp'], [1.42, null]],
    y: [[0, 0], [0.08, -2], [0.17, -4], [0.25, -5], [1.2, -5], [1.33, -2], [1.42, 0]], silt: [0, 1.42] },
  cucumber: { end: 1.8, pose: [[0, 'clench'], [1.6, 'stretch'], [1.75, null]] },
  amphipod: { end: 1.9,
    x: [[0, 0], [0.08, 2], [0.17, 4], [0.25, 6], [0.33, 7], [1.2, 7], [1.28, 5], [1.37, 3], [1.45, 1], [1.53, 0]],
    y: [[0, 0], [0.08, -3], [0.17, -4], [0.25, -2], [0.33, 0], [1.2, 0], [1.28, -3], [1.37, -4], [1.45, -2], [1.53, 0]],
    vflip: [[0.08, true], [0.25, null], [1.28, true], [1.45, null]], turn: [[1.2, true], [1.9, null]], silt: [0.33] },
  snail: { end: 2.6, quick: [[0, 5], [0.8, 1]], turn: [[0.8, true], [2.6, null]],
    x: [[0, 0], [0.08, 4], [0.17, 9], [0.25, 12], [0.8, 12], [2.6, 0]] },
};
// The drawings a reaction holds that are not a frame of the kind's own:
// `rows` drawn in its place, or `cols` [from, to) of the frame it is on; set
// `at` cells into its box (mirrored when it faces back), `dim` rungs darker.
export const FAUNA_POSES = {
  stiltsUp: { rows: ['.........b.', '......ccb..', 'dccccccccw.', '.ccccccc...', '.dd...dd...'] },
  edgeHalf: { cols: [1, 4], at: [1, 0] },
  edge: { cols: [3, 4], at: [2, 0] },
  pineapple: { rows: ['q..qq..q', '.q.ee.q.', '.qeeeeq.', 'qeeeeeeq', '.qbqqbq.', '.qqqqqq.', '..qqqq..', '........'] },
  clench: { rows: ['.cbc.', 'ccccc', 'ccccc', 'd.d.d'], at: [1, -1], dim: 1 },
  stretch: { rows: ['.cbcb.', 'cccccc', 'd.d.d.'], at: [1, 0] },
};
// A reaction's inks on the purple ramp, whatever the zone's dim: a light put
// out, a light held lit, and the halo round it.
export const FAUNA_REACT_INK = { out: 2, lit: 11, halo: 7 };
// The smear: where a held pose moved `moved` cells or more since the last
// (and less than `far`, one come back in from the other end), the last is
// drawn under it `rungs` darker.
export const FAUNA_SMEAR = { rungs: 4, moved: 2, far: 30 };
// Silt off the bed: out a cell a held pose either side for `last` seconds,
// from rung `tone`, a rung darker every second step, the nearer cell a row
// up for the first `lift` steps.
export const FAUNA_SILT = { last: 0.5, tone: 7, lift: 4 };
