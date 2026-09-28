// What the deep's boards sell: the pods, and a ladder a class for each
// station of the party (docs/wave-party.md).
//
// The pods' board is a board like a yard station's: another pod, sold on it
// and built there by the deep's builders. A station's board is the station's
// fighter heading and its rails (deep/rails.js): the two classes the kind
// offers, each one ladder of eight, climbed with scales and then the yard's
// coins (`lead: 'scale'`). What a rung is worth and what it costs is LADDERS
// in config/rungs.js, by the class's key; this file says how a ladder hangs
// off a station. A station is keyed by its id, never its kind: a kind can
// stand twice, and each keeps its own ladder.

import { S } from '../state.js';
import { rungValue, POD_SCALES0, POD_RATE, PARTY_IDS, CLASSES } from '../config.js';
import { tierRows, named } from '../upgrades/tiers.js';
import { hirePod } from '../staffing.js';
import { registerRows, ahead } from '../works.js';
import { registerBoard } from '../boardrows.js';
import { stationById } from './party.js';

// A pod: one more of the crew, living down here (DESIGN.md, "One crew, two
// homes"). Sold on the pods' own board, as the yard's rooms are on the
// house's, and built there by the builders, a steeper price in scales each one.
const POD = {
  key: 'pod', name: 'another pod', kind: 'building', site: 'pods', board: 'pods',
  note: () => 'a capsule on the deep\'s far side: one more of the crew, living down here',
  // One more each press, each priced as the pod it will be.
  repeats: true,
  from: () => S.crew + ahead('pod'), to: () => S.crew + ahead('pod') + 1,
  // Scales alone: naming no dust at nought would have `billOf` add its worth.
  bill: () => [['scale', Math.round(POD_SCALES0 * Math.pow(POD_RATE, (S.pods || 0) + ahead('pod')))], ['dust', 0]],
  buy: () => { hirePod(); S.shopStale = true; },
  show: () => S.snatched
};

// --- a class's ladder, on a station ----------------------------------------------
// What a class's number is called on its rails, a unit a class. The words a
// rung says are in rails.js.
export const CLASS_UNIT = {
  brawler: 'dmg', sword: 'dmg', monk: 'dmg', martial: 'dmg', ranger: 'dmg',
  assassin: 'dmg', hexer: 'dmg', sapper: 'dmg', mage: 'dmg/s', bard: '%'
};

// One class's ladder at one station: the one card of it, through `tierRows`
// like every ladder, with its rung on the station (`field` as a pair). The
// rung is the station's while the station has taken this class, and nought
// for the class it has not: a station climbs one ladder, and a class looked
// at on a blank station is priced from its foot. Made afresh when asked, so
// a station's record is read where it stands in `S.stations` now.
export function classLadder(st, cls) {
  const [card] = tierRows({
    field: { get: () => (st.cls === cls ? st.rung : 0), set: v => { st.rung = v; } },
    lead: 'scale',
    unit: CLASS_UNIT[cls],
    value: lvl => rungValue(cls, lvl),
    show: () => true,
    bands: named(cls, CLASSES[cls].name)
  });
  return card;
}
// What the next rung of `cls` at station `id` asks, as [coin, n] pairs with
// no coin at nought: what `buyRung` takes and adds to the station's `paid`.
export function rungBill(id, cls) {
  const st = stationById(id);
  if (!st || !CLASSES[cls]) return [];
  return classLadder(st, cls).bill().filter(([, n]) => n > 0);
}

// --- the boards ------------------------------------------------------------------
// The pods, by key, for board.js and shop.js to draw and hooks.js to reach.
export const DEEP_ROWS = { pods: [POD] };
export const DEEP_UPGRADES = Object.values(DEEP_ROWS).flat();
export const DEEP_SECTIONS = { pods: [{ title: 'the pods', keys: ['pod'] }] };

// So a work coming back out of a save knows which row it belongs to.
registerRows(DEEP_UPGRADES);
for (const key of Object.keys(DEEP_ROWS))
  registerBoard(key, { rows: () => DEEP_ROWS[key], sections: () => DEEP_SECTIONS[key] });

// A station's board: its fighter's heading, wearing the count of one or none
// a roster heading wears, and nothing sold as a card -- the rails stand under
// the heading, laid in by deep/rails.js. Every id has its board from the
// first frame, empty until a station stands under it.
const fighterHead = id => ({ title: 'the fighter', roster: true, keys: [],
                             heads: () => (stationById(id)?.fighter ? 1 : 0) });
for (const id of PARTY_IDS)
  registerBoard(id, { rows: () => [], sections: () => [fighterHead(id)] });
