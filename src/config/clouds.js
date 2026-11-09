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
// few cells high read as hatching, not as lobes (ten, since the owner's
// polish round of 2026-11-09: on middling lobes the crescents read as holes).
export const CLOUDS_CORE_MIN = 10;

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
// A whole sky as one sheet of cloud (the owner, 2026-10-20: "all the clouds
// on the same vertical plane ... going out towards the horizon,
// perspectively"): every cloud's base at one height, the sheet seen from
// overhead out to the horizon. `layers` bands of distance cut it, the
// nearest at distance 1 and the farthest at `far`, spaced evenly in the
// distance's logarithm. Every cloud of a layer stands on the layer's one
// base line (`at` of its lane, where a place gives one), and the clouds are
// set down one after another along it, each by its drawn width plus `gap`
// R of open sky, so none overlaps its neighbor and no stretch stands empty
// (the owner, 2026-11-09: a layer was groups packed into one mass with dead
// stretches between, its bases jittered 4-5 cells -- "unnecessary
// separation ... lumped close together ... differing heights"). Seen from
// under a sheet, a thing at distance z is 1/z as big, 1/z as high over the
// horizon and moves 1/z as fast, so:
//
//   R         a cloud's typical size at distance 1 (its biggest turret's
//             radius), in cells
//   lift      its base's height over the horizon at distance 1, as a share
//             of the sky's height
//   parallax  how far it moves against the camera, at distance 1
//   wind      cells a second it drifts, at distance 1
//
// so a far cloud is small, low and slow, and the far ones crowd toward the
// horizon. Then:
//   spread    how widely sizes scatter round R (a log-normal's sigma), and
//   tail      the biggest a cloud may be, in R: close round the layer's
//             size, so a layer reads as one weather
//   gap       open sky between a cloud and the next, in R, [least, most]
// and [far, near] pairs taken at a band's share of the way out (0 the
// horizon, 1 nearest):
//   flat      how far a puff is squashed top to bottom (1 round): a far
//             cloud is seen edge-on, so flatter
//   every     frames between workings of its field on the card: a far
//             layer's puffs move a hair a frame, so it is worked one frame
//             in this many, its fade kept in step
// and:
//   stray     how fast a cloud wanders against its layer, in its layer's
//             wind: clouds overtake each other, meet and part
//   kinds     how often each shape forms (CLOUDS_SHAPES)
export const CLOUDS_SKY = {
  layers: 5, far: 8, at: 0.5,
  R: 18, lift: 0.8, parallax: 0.75, wind: 0.06,
  spread: 0.3, tail: 1.6, gap: [0.4, 1.6], flat: [0.45, 1],
  every: [6, 1], stray: 0.4,
  kinds: { cumulus: 1 }
};
// What the sheet keeps far off (the owner, 2026-10-20: the distant clouds
// read as "single cell lines and a bit messy"): the grid is a cell, so a
// cloud is never drawn smaller than it can be drawn whole.
//   least    no cloud stands less than `h` cells tall or `w` wide: one built
//            smaller is built again bigger, so distance makes clouds fewer
//            and more crowded, never tinier
//   plain    a layer nearer the horizon than this share of the way in is
//            drawn plain: a few big round lobes in one flat tone, no turrets,
//            no shading, no lumps (CLOUDS_SHAPES.blob)
//   bank     a layer nearer than this is no clouds at all but the horizon's
//            one long bank (CLOUDS_BANK)
export const CLOUDS_LOD = { least: { h: 6, w: 10 }, plain: 0.3, bank: 0.1 };
// The horizon's bank: one row of low lobes the whole way round, each `r` of
// its layer's R (scattered by `spread`), `step` of its radius apart, its
// center `at` its radius over the horizon, squashed `flat`, so the horizon
// reads as cloud meeting sky.
export const CLOUDS_BANK = { r: [0.9, 1.4], spread: 0.3, step: [0.8, 1.1], at: [0.1, 0.35], flat: 0.7 };
// How a cloud of each shape builds and dissolves: its size swells and wanes
// over `life` seconds [least, most], never below `keep` of itself (a big mass
// breathes; a scrap or a wisp is gone and comes back).
export const CLOUDS_LIFE = {
  cumulus: { life: [600, 1200], keep: 0.55 }, tower: { life: [700, 1300], keep: 0.5 },
  anvil: { life: [800, 1500], keep: 0.6 }, heap: { life: [500, 1100], keep: 0.5 },
  stratus: { life: [300, 700], keep: 0 }, scrap: { life: [200, 450], keep: 0 }
};
// A cloud in the round (render/clouds.js, volume), built the way a cumulus
// stacks: a broad flat base at the height the whole field shares (its
// bottom cut flat there, every puff of it), turrets of rounded domes rising
// off the base, and smaller turrets clustered on the bigger ones, each a step
// in front of or behind the one it grows from. A tier is one smooth union,
// so lobes in one tier melt together and a lobe in another tier shows its
// own round edge against them; a turret is never in its parent's tier.
//   base     the shelf: lobes `r` of R, squashed `flat`, their centers `at`
//            their r over the base line, spaced `step` of their r, across
//            `span` of the turrets' own width
//   turrets  `n` rising off the shelf side by side, `r` of R (`ends` smaller
//            at the ends of the row), each `close` of the two radii from the
//            last, their centers `rise` of their r over the base line (under
//            1, so every foot is in the shelf); on the one nearest the middle
//            another stands, `stack` [its height up, its size] in its r
//   kids     on each turret, `n` smaller ones `shrink` of its radius, set on
//            its upper edge within `arc` half-turns of straight up, `out` of
//            its radius from its center, in front of it a share `front` of
//            the time (else behind), down `levels` generations, none under
//            `least` cells; a kid rides its parent, swelling as it swells
//   crust    small lumps on a lobe's edge: `per` a cell of its radius on the
//            front tiers, `back` of that on the rear, `r` of the lobe's
//            radius, over `arc` of its edge (half-turns, left round the top
//            to right), from lobes of at least `from` cells
export const CLOUDS_VOLUME = {
  base: { span: [0.85, 1], r: [0.38, 0.52], flat: 0.7, at: 0.35, step: [0.95, 1.25] },
  turrets: { n: [2, 3], r: [0.66, 0.95], ends: 0.3, close: [0.6, 0.78], rise: [0.45, 0.8], stack: [0.95, 0.72] },
  kids: { n: [1, 3], shrink: [0.5, 0.7], arc: 0.45, out: [0.72, 0.92], front: 0.55, levels: 1, least: 3 },
  crust: { from: 8, per: 0.15, back: 0, r: [0.18, 0.28], arc: [-1.1, 0.1], out: 0.9 }
};
// The tiers a sky layer's puffs fall in, back to front: a cloud's own depths
// from its rear (the shelf and the turrets behind) to its nearest turrets.
export const CLOUDS_TIERS = ['rear', 'mid', 'front', 'near'];
// The shapes beyond the plain cumulus (CLOUDS_VOLUME):
//   tower    the cumulus with domes stacked on its crown, each `shrink` the
//            last and `climb` of its radius higher, `levels` of them
//   anvil    a tower whose top spreads downwind into a flat shelf `reach` R
//            long, its puffs `flat`
//   heap     wide and low: a long body over a flat base and a few small
//            domes
//   stratus  a long low sheet: `count` small squashed puffs strung `length` R
//   scrap    a few small puffs, loose
//   blob     a far cloud drawn plain (CLOUDS_LOD): `n` big lobes of `r` R,
//            `step` of their radius apart, `rise` of it over the base
export const CLOUDS_SHAPES = {
  tower: { levels: [2, 4], shrink: 0.92, climb: 0.95, wander: 0.3 },
  anvil: { reach: [1.8, 3], flat: 0.35, r: [0.35, 0.5] },
  heap: { span: 2.6, crown: [0, 2], crownR: [0.45, 0.6], flat: 0.75 },
  stratus: { count: [6, 14], length: [4, 9], r: [0.22, 0.4], flat: 0.38, wander: 0.4 },
  scrap: { count: [2, 4], r: [0.18, 0.38], spread: 1.2 },
  blob: { n: [3, 5], r: [0.5, 0.8], step: [1.2, 1.6], rise: [0.35, 0.6] }
};

// --- the flow -----------------------------------------------------------------------
// The sky is liquid: the field is worked out afresh each frame
// (render/cloudgl.js) from puffs that moved this frame. A cloud of the sky
// moves as one body (the owner, 2026-11-09, option B of the review 'clouds:
// natural motion'): every lobe of it rides one slow current and advects with
// the layer's wind, so the lobes keep their places in the cloud and its
// shading does not swim; the shape changes only at its edges, where turrets
// billow and the small lumps on its edge condense and dissipate. (Lobes
// each on a current of their own, 0.2-0.45 of their radius over 120-300 s,
// slid through each other at twice the wind's speed and the shadows between
// them migrated across the body -- the "morphing" the owner saw.)
//   CLOUDS_BODY    the cloud's one current: sines over time, `wander` of the
//                  cloud's R, `period` seconds, `lift` the share up and down
//   CLOUDS_TURRET  a turret of at least `from` cells billows: swells `swell`
//                  of its radius and rises `rise` of that swell as it does,
//                  over `period` seconds; a share `share` of the turrets
//                  billow at all, so one rises at a time
//   CLOUDS_LUMP    a crust lump condenses and dissipates over `period`
//                  seconds, its radius a smoothstep of a sine
export const CLOUDS_BODY = { wander: [0.03, 0.07], period: [240, 600], lift: 0.25 };
export const CLOUDS_TURRET = { from: 3, swell: [0.1, 0.22], rise: 0.5, period: [180, 420], share: 0.6 };
export const CLOUDS_LUMP = { period: [90, 240] };
// The horizon's bank and the cloud sea still put each puff on a current of
// its own (there a billow rolling against its neighbors is the point):
//   wander  how far it strays, as a share of its radius, [least, most]
//   period  seconds a stray takes, [least, most]
//   lift    how much of the stray is up and down rather than across
export const CLOUDS_FLOW = { wander: [0.2, 0.45], period: [120, 300], lift: 0.45 };
// A cell that changes tone eases into the new one over this many seconds,
// so an edge flowing across the grid glides rather than ticks.
export const CLOUDS_FADE_S = 0.3;
// How wide a shelf of windows on the card runs before the next starts under
// it, in cells (render/cloudgl.js `render`): wide enough that a sky of
// windows comes to a squarish card, well inside any drawing buffer's limit.
export const CLOUDS_SHELF_W = 2048;
// A cell takes a new role only once it has been wanted this many worked
// frames running (cloudgl.js, SETTLE): a tenth of a second at sixty, so an
// edge where two lobes' turrets meet and part cannot show a tone and take it
// back inside that.
export const CLOUDS_SETTLE = 6;
// How many pairs of cleanup passes the card runs on a frame's roles
// (cloudgl.js, CLEAN): each takes the cells left one cell thick in their
// tone, and taking one can leave its neighbor thin, so two pairs.
export const CLOUDS_CLEAN = 2;
// The ground in the sky's flow: its rows' size, its puffs' wander and period,
// and the frames between workings of its field (CLOUDS_SKY.every); its rows'
// depth and the rest are CLOUDS_KINDS.ground's.
export const CLOUDS_GROUND_FLOW = { R: 14, wander: [0.15, 0.35], period: [100, 240], every: 2 };

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
// The middle distance is a flat silhouette in the haze on both pages (the
// owner's polish round, 2026-11-09): a band drawn on a cloud a few cells
// tall was a ruled line under a slab, and by night, in the near cloud's
// shadow tone, it fused with the undersides into a notched strip.
export const CLOUDS_DEPTH_BANDS = {
  light: [[0, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.25, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.6, ['lit', 'body', 'shade', 'shade'], 'round']],
  dark: [[0, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.25, ['haze', 'haze', 'haze', 'haze'], 'flat'], [0.6, ['lit', 'near', 'body', 'body'], 'round']]
};
// Each lobe of a near cloud lit as a rounded form of its own (cloudgl.js,
// FIELD): a cell belongs to the strongest lobe of its tier there, and is in
// that lobe's lit cap when it faces the light by more than `lit[0]` (the
// cosine) and stands past `lit[1]` of the lobe's radius from its middle, in
// its shadow when it faces away by more than `shade[0]` past `shade[1]`. Only
// lobes of at least `least` cells, so a far cloud is not speckled.
export const CLOUDS_LOBE_LIGHT = { lit: [0.35, 0.6], shade: [0.3, 0.62], least: 5 };
// Which way the light falls from: a step toward it, up and to the left.
export const CLOUDS_LIGHT = [-0.6, -0.8];
// The step from a cell toward open sky that puts it on a cloud's shadowed
// side: sideways, to the right, never down. Looking down (away from the
// light) made every cell over the flat base cut "shadowed side": a band of
// shade the cloud's full width, measured 355 px of ruled line under one
// cloud at the owner's window (the polish round, 2026-11-09).
export const CLOUDS_SHADE_DIR = [1, 0];
// How deep each band of a near cloud's volume is, as a share of the tier's
// typical lobe radius (each at least 2 cells, and none on a lobe under
// CLOUDS_BAND_MIN times it):
//   lit    its face toward the light
//   shade  its side away from the light
//   base   its underside, as a share of its layer's R: none, since the
//          polish round -- any band along the flat cut is a ruled line, so
//          the underside takes only each lobe's own shadow
//   core   a rear lobe's shadow where a nearer lobe stands below it (in the
//          shadowed side's tone). Only
//          the rear: the front tiers are one lit mass, parted from the rear
//          by this shadow, and a band at every tier's edge read as stripes
export const CLOUDS_VOLUME_BANDS = { lit: 0.42, shade: 0.4, base: 0, core: 0.2 };
// The ground's rows, back to front, as depths for the bands above.
export const CLOUDS_GROUND_DEPTHS = [0.1, 0.62, 1];
// --- the cloud sea ---------------------------------------------------------------
// The ground in the liquid sky (render/clouds.js, groundLayer): rows of
// billows back to front, each row a tier and each smaller than the one in
// front of it by `grow` (perspective), `drop` of its billows' size under the
// one behind. A row's billows are of every size -- a log-normal of `spread`
// round the row's size, between `least` and `most` of it -- set `step` of
// their own radius apart, so big ones push their neighbors off and small
// ones crowd, with no spacing to repeat; their centers `at` of their radius
// over the row's line. Now and then (`mound`, a share of them) a billow is a
// mound: `rise` times the row's size, with `kids` smaller ones on its top,
// as a heap of cumulus rising out of the sea. Each row is solid from `fill`
// of its size under its line, and its crevice -- the shadow where the row in
// front stands -- is `crease` of its billows' size deep, on rows whose
// billows are at least `creaseMin` cells.
export const CLOUDS_SEA = {
  grow: 1.3, drop: 0.75, spread: 0.5, least: 0.4, most: 2.2, step: [1.1, 1.6], at: [0.05, 0.55],
  mound: 0.1, rise: 1.6, kids: [2, 3], fill: 0.2, crease: 0.45, creaseMin: 3
};

// --- act 3 ------------------------------------------------------------------------
// The afterlife's clouds, all on the one renderer (render/after/cloudsky.js;
// the owner, 2026-10-20: "wire them in"). Every place is in act 3's own
// cells, a world cell (P) each; a `rate` is how fast a layer slides against
// the camera (1 the main plane), set where the act opens.
//   sky    the sky's layers (CLOUDS_SKY), each sliding at its own parallax
//          times `rate`. The horizon's bank stands on the horizon, `rows`
//          cells of sky over it; every other layer keeps to the top of the
//          sky the way the yard's clouds do (config/weather.js, CLOUD_LANES;
//          the owner, 2026-10-21: "they should appear higher and stay higher,
//          like act 1"; six cells lower, 2026-10-22, "lets lower the cloud
//          band a bit"): its bases in its `lanes` entry, [highest, lowest] in
//          cells below the top of the act's resting window, far to near --
//          the middle distance at the near layer's own base, behind it, and
//          the far banks a few cells under (a layer hanging well below the
//          near bases read as teeth under the clouds by night; the polish
//          round, 2026-11-09). In cells, so a cloud's height does not
//          move when the window is resized. A cloud is cut flat at its base,
//          so however it swells or flows it never hangs below its lane.
//   path   the path's surface by night: the cloud palette's role it is
//          drawn in (by day it is the paper)
//   pad    a layer wraps at the act's width as it slides past at its rate,
//          plus this many cells, so no stretch of cloud comes round twice
//          in one pan
//   seed   the act's clouds' seed
export const CLOUDS_ACT3 = {
  seed: 7, pad: 900, path: { dark: 'haze' },
  sky: { rows: 120, rate: 0.4, lanes: [null, [36, 39], [32, 35], [32, 36], [28, 33]] }
};
