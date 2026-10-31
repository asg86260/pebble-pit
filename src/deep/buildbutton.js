// REVIEW build-sign
// The deep's empty lot (DESIGN.md, "Built first, a recruit, then two
// choices"): the next free floor slot, and the build sign staked in it
// (buildsign.js) -- every place's lots wear the one sign. It is how a
// station is bought: the first one free, at the snatch, and every one after
// it for a fang, whenever a fang is held and a slot is free. Pressed, its
// build is queued there at once (`layStation`); what it becomes is picked on
// its board once it stands (deep/rails.js).
//
// No board lists it, so its row is its own: offered while `buildOffer` says
// so, priced a fang (or nothing, the first), and bought by its own press,
// which spends the fang itself (`layStation`).

import { msg } from '../lang.js';
import { S } from '../state.js';
import { PARTY_IDS } from '../config.js';
import { canBuild, nextSlot, layStation, stationById } from './party.js';
import { slotX, deepFloor, standOfStation } from './place.js';

// --- what it offers ---------------------------------------------------------------
// Whether it stands and where: the first lot is free, every one after a fang.
export function buildOffer() {
  const slot = nextSlot();
  const shown = !!S.snatched && canBuild() && slot >= 0;
  return { shown, slot, first: S.stations.length === 0, fangs: S.fangs };
}
// Pressed: the station's build queued. Its id, or null.
export function press() {
  if (!buildOffer().shown) return null;
  return layStation();
}

// The row the sign sells: a station raised at the next free slot.
const BUILD_ROW = {
  key: 'deep-build', name: msg('row-raise-station'),
  bill: () => (buildOffer().first ? [] : [['fang', 1]]),
  show: () => buildOffer().shown,
  buy: press
};
// Bought by the row's own press: the fang is `layStation`'s to spend.
const buyOwn = u => u.buy() != null;

// The id the next station is minted under (party.js mints them in order).
const nextId = () => PARTY_IDS.find(id => !stationById(id)) || null;

// The lot of the party row `id`, for its row in the station table: standing
// only while `id` is the next to be built, in the ground the station will
// stand on at the next free slot.
export const deepLot = id => ({
  id: () => id,
  row: () => (nextId() === id && nextSlot() >= 0 ? BUILD_ROW : null),
  box: () => { const slot = nextSlot(); if (slot < 0) return null; const r = standOfStation({ slot, cls: null }); return { x: r.x, w: r.w }; },
  // what goes up there is a station, its fighter picked once it stands
  name: () => msg('station-party-lot.sign'),
  mid: () => slotX(nextSlot()),
  floor: () => deepFloor(),
  act: buyOwn
});
