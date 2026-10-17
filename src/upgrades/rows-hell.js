// What hell's boards sell (DESIGN.md, "Acts 3 and 4", act 4, "Ladders in
// bands"): four ladders of eight, each one card through `tierRows` led by
// brimstone -- then low bars, then high bars, then a spark carried down
// (config/hell.js, HELL_BAND_COINS) -- and the wall gang's size, a choice
// rather than a purchase. The barriers and the chambers behind them carry no
// bill; the five tools are the anvil's recipes, not rungs.
//
// A rung is had on the press: hell has no builders yet (placeholder), so
// every card's work is nought. The black water is a stand-in too: the spec
// carries it down from the abyss; until the road is built it is a barrel a
// press, bought with sparks and set down at the road's foot.

import { msg } from '../lang.js';
import { S } from '../state.js';
import { rungValue, GANG_MAX, WATER_SPARKS, WATER_ROAD_MAX } from '../config.js';
import { tierRows, named } from './tiers.js';
import { registerRows } from '../works.js';
import { registerBoard } from '../boardrows.js';

const inHell = () => !!S.hell;

// One hell ladder: its rung on `S.hell.rungs`, by key.
const ladder = (key, name, does, unit) => {
  const [card] = tierRows({
    field: { get: () => S.hell?.rungs?.[key] || 0, set: v => { S.hell.rungs[key] = v; } },
    lead: 'brimstone', unit, does,
    value: lvl => rungValue(key, lvl),
    show: inHell,
    bands: named(key, name)
  });
  card.work = () => 0;
  return card;
};

export const HELL_FACE_ROW = ladder('hellface', msg('row-hellface'), msg('row-hellface-does'), 'hits/s');
export const HELL_FURNACE_ROW = ladder('hellfurnace', msg('row-hellfurnace'), msg('row-hellfurnace-does'), 'x');
export const HELL_ANVIL_ROW = ladder('hellanvil', msg('row-hellanvil'), msg('row-hellanvil-does'), 'hits/s');
export const HELL_MUSTER_ROW = ladder('hellmuster', msg('row-hellmuster'), msg('row-hellmuster-does'), '');

// The wall gang: one more miner off the faces, or one back. A choice, so a
// signpost row with nothing to pay.
const gang = () => S.hell?.gang || 0;
const GANG_UP = {
  key: 'hellgangup', name: msg('row-hellgangup'), sign: true,
  from: gang, to: () => Math.min(GANG_MAX, gang() + 1),
  show: inHell, dead: () => gang() >= GANG_MAX,
  buy: () => { S.hell.gang = Math.min(GANG_MAX, gang() + 1); S.shopStale = true; }
};
const GANG_DOWN = {
  key: 'hellgangdown', name: msg('row-hellgangdown'), sign: true,
  from: gang, to: () => Math.max(0, gang() - 1),
  show: inHell, dead: () => gang() <= 0,
  buy: () => { S.hell.gang = Math.max(0, gang() - 1); S.shopStale = true; }
};

// Black water (PLACEHOLDER SOURCE): a barrel a press, for sparks, set down at
// the road's foot for a hauler to carry to the anvil. Offered once the iron
// pick is made, so it is there before the quench is wanted.
const water = () => (S.hell ? S.hell.water + S.hell.road : 0);
const WATER = {
  key: 'hellwater', name: msg('row-hellwater'), repeats: true,
  from: water, to: () => water() + 1,
  bill: () => [['spark', WATER_SPARKS], ['dust', 0]],
  cap: () => (S.hell ? WATER_ROAD_MAX - S.hell.road : 0),
  buy: () => { S.hell.road++; S.shopStale = true; },
  show: () => inHell() && S.hell.tool >= 2
};

export const HELL_UPGRADES = [HELL_FACE_ROW, HELL_FURNACE_ROW, HELL_ANVIL_ROW, HELL_MUSTER_ROW, GANG_UP, GANG_DOWN, WATER];
registerRows(HELL_UPGRADES);

// The boards, by the station a click in hell lands on (hell/index.js,
// `hellBoardAt`). Their titles and pages are stations.js's rows, Track C's.
const BOARDS = {
  'hell-face': { title: msg('board-hell-face'), rows: [HELL_FACE_ROW] },
  'hell-furnace': { title: msg('board-hell-furnace'), rows: [HELL_FURNACE_ROW] },
  'hell-anvil': { title: msg('board-hell-anvil'), rows: [HELL_ANVIL_ROW, WATER] },
  'hell-muster': { title: msg('board-hell-muster'), rows: [HELL_MUSTER_ROW] },
  'hell-wall': { title: msg('board-hell-wall'), rows: [GANG_UP, GANG_DOWN] }
};
for (const [key, { title, rows }] of Object.entries(BOARDS))
  registerBoard(key, { rows: () => rows, sections: () => [{ title, keys: rows.map(u => u.key) }] });
