// The construction bench's rows: the bench itself, and its two ladders.
// Data only: upgrades.js strings the files together into UPGRADES.
//
// The bench is the last free-standing build -- it raises the way buildings
// always have, because the thing that makes builds need a builder is the thing
// being built. After it lands, its `buy` disbands the derived gang: builders
// are a post from then on, hired at the roster like anybody, and a build with
// none assigned waits. See DESIGN.md, "The build yard".

import { BUILDBENCH_CORES, BUILDBENCH_DUST, BUILDPOSTS_SPARKS0, BUILDPACE_SPORES0,
         BUILD_POST_RUNGS, BUILD_PACE_RUNGS, BUILD_PACE_STEP } from '../config.js';
import { S } from '../state.js';
import { site } from './site.js';
import { rungCost } from '../upgrades.js';
import { buildPosts } from '../buildbench.js';

const BENCH = site({
  key: 'unlockbuildbench', name: 'build the work bench',
  cores: BUILDBENCH_CORES, dust: BUILDBENCH_DUST, open: 'buildbenchOpen',
  at: () => S.buildbench.x + S.buildbench.w / 2,
  // Once the second building unlock is affordable-ish -- the second rock is
  // when the yard starts buying places -- and gone from the board once it
  // stands, like every other door.
  show: () => S.boulderNo >= 2 && !S.buildbenchOpen
});

// The moment the bench stands, the derived gang disbands: from here on a
// builder is somebody you assigned, and zero assigned is zero building --
// which is the check F6 makes, and the honest reading of "hired at a post".
const opened = BENCH.buy;
BENCH.buy = () => { S.builders = 0; opened(); };

export const BUILDBENCH_ROWS = [
  BENCH,
  // Another post: +1 builder the bench can hold, and therefore +1 build rising
  // at once -- one body to a work, so the two are one number. Sparks: this is
  // plant, and red is the machines' currency end to end.
  {
    key: 'buildposts',
    board: 'buildbench',
    name: 'another post',
    rung: () => S.buildPostLevel,
    rungs: () => BUILD_POST_RUNGS,
    from: () => buildPosts(),
    to: () => buildPosts() + 1,
    currency: 'spark',
    cost: () => rungCost(BUILDPOSTS_SPARKS0, S.buildPostLevel),
    buy: () => S.buildPostLevel++,
    show: () => S.buildbenchOpen
  },
  // The builder's pace: BUILD_GANG's old meaning, back as gear. A rung of pace
  // pays back exactly one rung of the work table's climb (both are
  // BUILD_PACE_STEP), and it is a rung, so it is instant -- a better hammer is
  // a number, not a wall.
  {
    key: 'buildpace',
    board: 'buildbench',
    name: 'a better hammer',
    pct: true,
    unit: 'x',
    rung: () => S.buildPaceLevel,
    rungs: () => BUILD_PACE_RUNGS,
    from: () => Math.pow(BUILD_PACE_STEP, S.buildPaceLevel),
    to: () => Math.pow(BUILD_PACE_STEP, S.buildPaceLevel + 1),
    currency: 'spore',
    cost: () => rungCost(BUILDPACE_SPORES0, S.buildPaceLevel),
    buy: () => S.buildPaceLevel++,
    show: () => S.buildbenchOpen && S.seenSpore
  }
];

// The bench's own two ladders, on the bench's own board.
//
// They sat on the workbench under a heading called "the build yard", beside the
// row that puts the place up -- which broke the rule the rest of the yard keeps:
// a decision about a place is made at the place. How many builders the yard
// holds and how hard they swing are decisions about THIS bench, and the bench is
// a thing standing in the yard with a rect of its own that you can walk up to.
// Only `unlockbuildbench` stays behind on the workbench, because a place cannot
// sell the row that builds it. See DESIGN.md, "The bench is a catch-all".
export const BUILDBENCH_UPGRADES = BUILDBENCH_ROWS.filter(u => u.key !== 'unlockbuildbench');
export const BUILDBENCH_SECTIONS = [
  { title: 'the work bench', keys: ['buildposts', 'buildpace'] }
];
