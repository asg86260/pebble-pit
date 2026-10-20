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
