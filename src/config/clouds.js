// The clouds (src/render/clouds.js): one way of drawing a cloud, for every
// cloud anywhere. A cloud is circles ("puffs") in tiers, back to front, each
// tier a smooth union of its puffs, the union banded into flat tones by
// offset copies of itself. Every kind below is the same recipe at a
// different scale, speed and tone; no kind is drawn by code of its own.
//
// Lengths are in cells unless named otherwise; times in game seconds.

// --- the tones ------------------------------------------------------------------
// A ladder is the four flat steps a page draws its clouds in, sky to darkest,
// plus the rim's tone. Nearer is further from the sky on both pages: a far
// bank is one step off the sky, a near cloud's shadow two. The rim is the
// lightest grey a moonlit edge takes, by night only: by day its tone would be
// the paper, the sky's own, and it ate the cloud's edge against the sky and
// cracked it where one lobe stands on another.
export const CLOUDS_TONES = {
  light: { steps: ['#ffffff', '#d6d6d6', '#757575', '#000000'], lit: '#ffffff', rim: false },
  dark:  { steps: ['#121212', '#262626', '#3a3a3a', '#666666'], lit: '#666666', rim: true }
};

// --- the treatments ----------------------------------------------------------------
// How much of the banding a cloud is drawn with, plainest first. Which one
// the act uses is the owner's call; the bench shows them side by side.
//   tones  one flat tone a cloud, or two (in the light, in shadow)
//   belly  'none'; 'sky', only a cloud's underside over open sky; 'inside',
//          also a lobe's belly where it hangs in front of the lobes behind
//   rim    the moonlit rim, by night
export const CLOUDS_TREATMENTS = {
  A: { tones: 1, belly: 'none', rim: false },
  B: { tones: 2, belly: 'sky', rim: false },
  C: { tones: 2, belly: 'inside', rim: false },
  D: { tones: 2, belly: 'inside', rim: true }
};
// A belly or a rim is drawn on a tier only where the tier's lobes are this
// many times its depth: under that the band is most of the lobe and reads as
// a line round it. (A crevice is the shadow a nearer row casts on the row
// behind, not a band round a lobe: it is drawn on a row whose billows are at
// least CLOUDS_CREASE_MIN cells across their radius, so the far rows stay
// plain.)
export const CLOUDS_BAND_MIN = 1.6;
export const CLOUDS_CREASE_MIN = 6;
// A tier's lobes are modeled inside the cloud -- a front lobe's top lit
// against the lobe behind it, the shadow where they meet -- only when its
// lobes are at least this many cells across their radius. Smaller clouds get
// their outer edge's light and shadow alone: two bands a junction on a lobe a
// few cells high read as hatching, not as lobes.
export const CLOUDS_CORE_MIN = 7;

// --- the field ------------------------------------------------------------------
// A puff of radius r adds (1 - d^2/R^2)^3 to every cell within R of its
// center, and a cell is cloud where the sum passes CLOUDS_THRESHOLD. A puff
// alone is then a disc of exactly r when R = r / sqrt(1 - THRESHOLD^(1/3));
// two puffs near each other add, so the neck between them fills in smoothly
// (the classic metaball). It is the exponential smooth-min's shape at a
// fraction of its cost: no square root, no exponential, and a puff touches
// only a bounded disc.
export const CLOUDS_THRESHOLD = 0.03;
// A cell keeps the tier it showed last step until the sum has moved this
// share of the threshold past it, so a lobe breathing across a cell's center
// does not flip it one way and back the next step.
export const CLOUDS_HYST = 0.25;

// --- the clock ------------------------------------------------------------------
// The field is worked out a step at a time (each kind's `step`), a slice of rows
// a frame, and every frame shows the step behind blended into the step ahead
//. The slices of every sheet share one budget a frame, in
// milliseconds; a sheet behind its deadline is worked whatever the budget
// says, so the budget moves work earlier and never drops it.
export const CLOUDS_BUDGET_MS = 0.25;
// The share of a step a sheet has to finish the step after next in.
export const CLOUDS_SLICE = 0.85;

// --- the recipe -------------------------------------------------------------------
// A cumulus of size R, as a pixel-art cloud is drawn by hand: a crown of a few
// big domes, the tallest off center and the rest stepping down and out from
// it; a body of middling lobes across its width in front of the crown; a base
// of smaller lobes in front of that, hung at different depths so the
// underside is scalloped rather than ruled. Each row of lobes is a tier, so a
// lobe that hangs in front of the one behind it shades its own belly there.
//
//   r      a lobe's radius, as a share of R, [least, most]
//   at     its center's height above the base line, as a share of its own r
//   span   how far either side of the cloud's middle the tier reaches, in R
//   step   the spacing of its lobes, in their own radii
//   lean   how far off the middle the tallest dome may stand, in R
//   domes  how many domes beside the tallest, [least, most]; each step out
//          from it is `fall` the size of the last
export const CLOUDS_RECIPE = {
  crown: { r: [0.58, 0.8], at: [0.85, 1.2], step: [0.55, 0.85], lean: 0.3, domes: [2, 4], fall: 0.76 },
  body:  { r: [0.42, 0.58], at: [0.35, 0.8], span: 1.8, step: [1.3, 1.65] },
  base:  { r: [0.45, 0.65], at: [-0.5, 0.2], span: 1.7, step: [1.35, 1.7] }
};
// The ground is rows of billows, back to front, each row bigger and lower
// than the one behind and filled solid beneath, its billows' tops round and
// its crevices -- where a nearer row's dome stands in front of it -- in shadow.
//   r     a billow's radius in its row's size, [least, most]
//   big   [how often one is big, how many times bigger]
//   at    its center's height above the row's line, in its own r
//   step  the spacing of billows, in their own r: past 1.5 the notches
//         between them read; much past 2 they part into separate humps
//   fill  where the row's solid underneath starts, below its line, in its size
export const CLOUDS_BILLOW = { r: [0.5, 0.85], big: [0.3, 1.45], at: [0, 0.4], step: [1.55, 1.9], fill: 0 };

// --- the kinds --------------------------------------------------------------------
// Each kind is the recipe at its own sizes:
//
//   R        the size of a cloud (its biggest dome's radius), [least, most]
//   tiers    which tiers of the recipe it has, back to front
//   tones    the ladder steps [in the light, in shadow] on each page with
//            two tones a cloud -- by night the shadow is the step nearer the
//            sky, so the two swap; with one tone, every cell takes `one`
//   shade    a lobe's belly, as a share of its tier's lobe radius
//   crease   the ground's crevices, the same way
//   lit      the paper rim, the same way, when the rim is on
//   step     seconds between bakes of the field
//   breathe  [share of its radius a lobe swells and settles, seconds a breath]
//   sway     cells a lobe drifts to and fro, over the same breath
//   gap      open sky between clouds of a bank, in R, [least, most]
export const CLOUDS_KINDS = {
  // the sky's back wall: small, soft, one step off the sky, one tone
  far: { R: [4, 6.5], tiers: ['crown', 'base'], tones: { light: [1, 1], dark: [1, 1] }, one: 1, shade: 0, lit: 0, step: 4,
         breathe: [0.06, 70], sway: 0.5, gap: [0.3, 2.5] },
  // the middle of the sky: full cumulus, crown, body and scalloped base
  mid: { R: [8, 13], tiers: ['crown', 'shoulders', 'body', 'base'], tones: { light: [1, 2], dark: [2, 1] }, one: 1, shade: 0.55, lit: 0.35, step: 3,
         breathe: [0.07, 55], sway: 0.8, gap: [0.6, 3.5] },
  // a cloud the player clicks: the same cumulus, small and alone
  puff: { R: [7, 8.5], tiers: ['crown', 'shoulders', 'body', 'base'], tones: { light: [1, 2], dark: [2, 1] }, one: 1, shade: 0.55, lit: 0.35, step: 2,
          breathe: [0.08, 40], sway: 0.5, gap: [0, 0] },
  // the floor of the world: rows of billows rolling slowly along
  //   rows     how many, back to front
  //   rowDrop  how much lower each row stands than the one behind, in that
  //            row's own size
  //   rowGrow  how many times bigger each row is than the one behind
  //   drift    cells a second the billows roll along their rows
  ground: { R: [16, 18], rows: 3, tones: { light: [1, 2], dark: [2, 1] }, shade: 0, crease: 1.1, lit: 0.3, step: 3,
            breathe: [0.05, 60], sway: 0.6, drift: 0.12, rowDrop: 1.15, rowGrow: 1.7 }
};
// With one tone a cloud, the ground's rows step between these ladder steps
// back to front, so the rows still part.
export const CLOUDS_ONE_TONE_ROWS = [1, 2, 1, 2];

// --- the sky ----------------------------------------------------------------------
// A whole sky: `layers` bands of distance from the horizon (0) to overhead
// (1), and in each, clouds at three heights (CLOUDS_ALTITUDE). Every [far,
// near] pair below is taken at a layer's distance, a share of the way along
// distance^ease, so most layers crowd toward the horizon as distance does.
// A cloud's place, size, squash, speed and tone all come from its distance
// and its height; nothing is placed by hand.
//
//   R         a layer's typical cloud size (its biggest dome's radius)
//   spread    how widely sizes scatter round R (a log-normal's sigma): a few
//             clouds many times the typical one, many smaller
//   tail      the biggest a cloud may be, in R
//   flat      how far a puff is squashed top to bottom (1 round)
//   lift      how high a height of 1 stands over the horizon, as a share of
//             the sky: a far cloud of any height sits near the horizon, a
//             near one high up the sky (perspective)
//   group     how many clouds a group has, on average
//   packing   their spacing within a group, in their own size: under the 4
//             or so a cumulus spans, so a group runs into one mass
//   gap       open sky between groups, on average, in R
//   parallax  how far it moves against the camera
//   wind      cells a second it drifts
//   stray     how fast a cloud wanders against its layer, in its layer's
//             wind: clouds overtake each other, meet and part
//   every     frames between workings of its field on the card: a far
//             layer's puffs move a hair a frame, so it is worked one frame
//             in this many, its fade kept in step
export const CLOUDS_SKY = {
  layers: 5, ease: 1.7,
  R: [2.6, 18], spread: [0.4, 0.55], tail: [2.2, 2.4], flat: [0.5, 1],
  lift: [0.22, 1.25], group: [3, 1.5], packing: [1.1, 1.8], gap: [1.6, 6],
  parallax: [0.04, 0.75], wind: [0.015, 0.22], stray: 0.5, every: [6, 1]
};
// The three heights a cloud forms at, and what each makes:
//   at      its base's height, as a share of the sky over the horizon (taken
//           with its layer's `lift`), [least, most]
//   share   how often a cloud of a layer forms at this height
//   kinds   how often each shape forms here (CLOUDS_SHAPES)
//   size    its size against its layer's R
//   flat    its squash against its layer's
//   speed   its drift against its layer's wind: high cloud is slow
//   pale    true: drawn in its layer's palest tone, whatever its distance
// A tower is rooted in the low band and reaches up through the others.
export const CLOUDS_ALTITUDE = {
  low: { at: [0, 0.06], share: 0.45, kinds: { heap: 3, stratus: 2, scrap: 2, tower: 1.2 }, size: 1, flat: 0.85, speed: 1 },
  mid: { at: [0.12, 0.24], share: 0.4, kinds: { cumulus: 4, scrap: 1.5, anvil: 0.4 }, size: 0.85, flat: 1, speed: 1.15 },
  high: { at: [0.42, 0.62], share: 0.15, kinds: { cirrus: 1 }, size: 0.55, flat: 1, speed: 0.4, pale: true }
};
// How a cloud of each shape builds and dissolves: its size swells and wanes
// over `life` seconds [least, most], never below `keep` of itself (a big mass
// breathes; a scrap or a wisp is gone and comes back).
export const CLOUDS_LIFE = {
  cumulus: { life: [180, 420], keep: 0.55 }, tower: { life: [200, 460], keep: 0.5 },
  anvil: { life: [260, 520], keep: 0.6 }, heap: { life: [160, 380], keep: 0.5 },
  stratus: { life: [90, 220], keep: 0 }, scrap: { life: [50, 140], keep: 0 },
  cirrus: { life: [120, 300], keep: 0 }
};
// A cloud in the round (render/clouds.js, volume): lobes in tiers back to
// front, each tier its own smooth union, so a front lobe overlaps the lobes
// behind it and the edge between them is a lobe's own round edge.
//   rear    lobes behind the main dome, peeking out round it and over its
//           shoulders: `n` of them, `r` of R, across `span` R, their centers
//           `at` R over the base
//   crown   the main dome off the middle by up to `lean` R, `at` its own r
//           over the base, and `domes` smaller ones stepping out from it,
//           each `fall` the last
//   body    the front lobes across the lower face, `r` of R, `at` their own r
//           over the base, spaced `step` of their r, their centers across
//           `span` of the crown's whole width
//   base    the base: smaller lobes squashed `flat`, hung `at` their r about
//           the base line, across `span` of the crown's width, so the bottom
//           is darker and flatter than the top
//   crust   small lumps on a lobe's edge: `per` a cell of its radius on the
//           front tiers, `back` of that on the rear, `r` of the lobe's
//           radius, over `arc` of its edge (half-turns, left round the top
//           to right), from lobes of at least `from` cells
export const CLOUDS_VOLUME = {
  rear: { n: [3, 6], r: [0.45, 0.7], span: 0.85, at: [0.8, 1.3] },
  crown: { r: [0.55, 0.8], at: [0.85, 1.15], step: [0.45, 0.7], lean: 0.3, domes: [3, 4], fall: 0.78 },
  body: { r: [0.42, 0.6], at: [0.45, 0.9], span: 0.8, step: [1.2, 1.6] },
  base: { r: [0.38, 0.55], at: [-0.25, 0.15], span: 0.85, step: [1.1, 1.45], flat: 0.55 },
  crust: { from: 6, per: 0.45, back: 0.2, r: [0.16, 0.3], arc: [-1.1, 0.1], out: 0.9 }
};
// The tiers a sky layer's puffs fall in, back to front: high wisps behind
// all, then a cloud's rear lobes, its crown, its body and its base.
export const CLOUDS_TIERS = ['high', 'rear', 'crown', 'body', 'base'];
// The shapes beyond the plain cumulus (CLOUDS_VOLUME):
//   tower    the cumulus with domes stacked on its crown, each `shrink` the
//            last and `climb` of its radius higher, `levels` of them
//   anvil    a tower whose top spreads downwind into a flat shelf `reach` R
//            long, its puffs `flat`
//   heap     wide and low: a long body over a flat base and a few small
//            domes
//   stratus  a long low sheet: `count` small squashed puffs strung `length` R
//   scrap    a few small puffs, loose
//   cirrus   high streaks: `streaks` thin lines of tiny puffs `step` of
//            their radius apart, squashed `flat`, each `length` R long and climbing `slant` of
//            its length, a hook at its end; a puff at least `least` cells
//            across its radius and `thick` cells high, so a far streak still
//            crosses the field's threshold
export const CLOUDS_SHAPES = {
  tower: { levels: [2, 4], shrink: 0.92, climb: 0.95, wander: 0.3 },
  anvil: { reach: [1.8, 3], flat: 0.35, r: [0.35, 0.5] },
  heap: { span: 2.6, crown: [0, 2], crownR: [0.45, 0.6], flat: 0.75 },
  stratus: { count: [6, 14], length: [4, 9], r: [0.22, 0.4], flat: 0.38, wander: 0.4 },
  scrap: { count: [2, 4], r: [0.18, 0.38], spread: 1.2 },
  cirrus: { streaks: [1, 3], length: [5, 10], r: [0.12, 0.22], step: 1.1, flat: 0.22, slant: 0.18, least: 1.3, thick: 1.1 }
};

// --- the flow -----------------------------------------------------------------------
// The sky is liquid: every puff moves every frame on its own slow current and
// the field is worked out afresh each frame (render/cloudgl.js), so two lobes
// drifting together grow a neck that thickens until they are one, and a lobe
// drifting off thins its neck until it pinches away. A puff's path is sines
// over time at its own periods and phases, each a share of its radius:
//   wander  how far it strays, as a share of its radius, [least, most]
//   period  seconds a stray takes, [least, most]
//   lift    how much of the stray is up and down rather than across
export const CLOUDS_FLOW = { wander: [0.35, 0.85], period: [30, 90], lift: 0.45 };
// A cell that changes tone eases into the new one over this many seconds,
// so an edge flowing across the grid glides rather than ticks.
export const CLOUDS_FADE_S = 0.3;
// The ground in the sky's flow: its rows' size, its puffs' wander and period,
// and the frames between workings of its field (CLOUDS_SKY.every); its rows'
// depth and the rest are CLOUDS_KINDS.ground's.
export const CLOUDS_GROUND_FLOW = { R: 14, wander: [0.25, 0.6], period: [30, 80], every: 2 };

// --- the palette -------------------------------------------------------------------
// The clouds' tones, each named for the one job it does (the owner,
// 2026-10-20: more tones than act 3's four, so long as each is used
// distinctly). Two roles may share a tone -- the lit face by day is the haze,
// and by night the haze is the shadow -- but no two different tones sit
// closer than test/after-palette.test.mjs's step, on either page.
//   sky    the open sky
//   haze   a cloud far off, toward the horizon: one flat step off the sky
//   lit    a near cloud's face toward the light
//   body   a near cloud's plain body; by night, the middle distance's
//   shade  its side away from the light, its underside, the ground's crevices
//   core   by day, the deep shadow where lobes meet and the lower half of a
//          near cloud's base
//   near   by night, a near cloud's plain body (its shadow is the body)
export const CLOUDS_PALETTE = {
  light: { sky: '#ffffff', haze: '#ebebeb', lit: '#ebebeb', body: '#d6d6d6', shade: '#a4a4a4', core: '#757575' },
  dark: { sky: '#121212', haze: '#262626', body: '#3a3a3a', near: '#4e4e4e', lit: '#666666' }
};
// Which roles a cloud takes by how far off it is, on each page: a list of
// bands, each [from this depth on (0 the horizon, 1 nearest), the ladder of
// roles for [its lit face, its body, its shadowed side, its core]], so
// contrast falls away toward the horizon. A rear lobe's face is never lit
// (it stands a step deeper than the lobes before it), and a pale cloud
// (high) takes the farthest band whatever its distance.
// The third entry says how much of a cloud's volume is drawn at that
// distance: 'flat' a silhouette, 'base' its underside alone, 'round' all of
// it -- lit face, shadowed side, the shadow where lobes meet, the base.
export const CLOUDS_DEPTH_BANDS = {
  light: [[0, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.25, ['haze', 'haze', 'body', 'body'], 'base'], [0.6, ['lit', 'body', 'shade', 'core'], 'round']],
  dark: [[0, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.25, ['body', 'body', 'haze', 'haze'], 'base'], [0.6, ['lit', 'near', 'body', 'haze'], 'round']]
};
// Which way the light falls from: a step toward it, up and to the left.
export const CLOUDS_LIGHT = [-0.6, -0.8];
// How deep each band of a near cloud's volume is, as a share of the tier's
// typical lobe radius (each at least 2 cells, and none on a lobe under
// CLOUDS_BAND_MIN times it):
//   lit    its face toward the light
//   shade  its side away from the light
//   base   its underside, as a share of its layer's R
//   core   a rear lobe's shadow where a nearer lobe stands below it (in the
//          shadowed side's tone: the darkest step is the base's alone). Only
//          the rear: the front tiers are one lit mass, parted from the rear
//          by this shadow, and a band at every tier's edge read as stripes
export const CLOUDS_VOLUME_BANDS = { lit: 0.42, shade: 0.4, base: 0.3, core: 0.2 };
// The ground's rows, back to front, as depths for the bands above.
export const CLOUDS_GROUND_DEPTHS = [0.1, 0.62, 1];
