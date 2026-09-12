import { S } from '../state.js';
import { haulCap, haulSpeed } from '../upgrades.js';
import { HAUL_CARRY_COST, HAUL_PACE_COST, HARNESS_COST, BOOTS_COST } from '../config.js';
import { tierRows } from './tiers.js';

// The bench's crew rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// Four ladders in bands (CLAUDE.md, "Decided"), two over what a hauler
// carries and two over how fast it walks. The harness continues the load and
// the boots continue the pace -- `follows` keeps each gear ladder off the
// board until the one under it is climbed, so what a pair of hands carries is
// one row at a time however many cards it takes (see `chained`). The gear used
// to carry a shard from rung one because the shard was the only scarce coin
// there was to price it in; it starts in dust like everything else now and
// the shard comes back on the third card.
const LOAD = tierRows({
  field: 'haulCarryLevel',
  unit: 'px', does: 'carry',
  value: lvl => haulCap(lvl),
  first: HAUL_CARRY_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: [
    { key: 'haulcarry',  name: 'bigger sack' },
    { key: 'haulcarry2', name: 'yoke' },
    { key: 'haulcarry3', name: 'handcart' }
  ]
});

const HARNESS = tierRows({
  field: 'harnessLevel',
  unit: 'px', does: 'carry',
  value: lvl => haulCap(S.haulCarryLevel, lvl),
  first: HARNESS_COST,
  site: 'bench',
  follows: 'haulcarry3',
  show: () => S.crew > 0,
  bands: [
    { key: 'harness',  name: 'harness' },
    { key: 'harness2', name: 'leather harness' },
    { key: 'harness3', name: 'padded harness' }
  ]
});

const PACE = tierRows({
  field: 'haulPaceLevel',
  unit: 'px/s', pct: true, does: 'walk',
  value: lvl => haulSpeed(lvl) * 60,
  first: HAUL_PACE_COST,
  site: 'bench',
  show: () => S.crew > 0,
  bands: [
    { key: 'haulpace',  name: 'quick step' },
    { key: 'haulpace2', name: 'worn path' },
    { key: 'haulpace3', name: 'laid track' }
  ]
});

const BOOTS = tierRows({
  field: 'bootsLevel',
  unit: 'px/s', pct: true, does: 'walk',
  value: lvl => haulSpeed(S.haulPaceLevel, lvl) * 60,
  first: BOOTS_COST,
  site: 'bench',
  follows: 'haulpace3',
  show: () => S.crew > 0,
  bands: [
    { key: 'boots',  name: 'boots' },
    { key: 'boots2', name: 'second pair' },
    { key: 'boots3', name: 'hobnails' }
  ]
});

export const CREW_ROWS = [...LOAD, ...HARNESS, ...BOOTS, ...PACE];
