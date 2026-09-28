// The party (docs/wave-party.md): the stations on the deep's floor, the
// fighter at each, the class and the ladder a station. The only writer of
// `S.stations`; every other module reads through these. Owned by track CREW.
//
// SKELETON: the signatures below are the seam every track codes against.
// CREW fills in the bodies; until then they return the safe empty answer.

import { S } from '../state.js';
import { CLASSES, PAIRS, STARTERS, FIGHT_STATIONS_MAX } from '../config/classes.js';

export const stationById = id => S.stations.find(s => s.id === id) || null;
export const stationsBuilt = () => S.stations.filter(s => s.built);
export const classOf = st => (st && st.cls && CLASSES[st.cls]) || null;
// The fighter's body: CREW resolves the uid to a worker.
export const fighterAt = st => null;                       // TODO(CREW)
// The lowest floor slot with no station on it, or -1 when the floor is full.
export const nextSlot = () => -1;                          // TODO(CREW)
// The first station is free; every one after it takes a fang.
export const canBuild = () => S.stations.length === 0 ||
  (S.fangs > 0 && S.stations.length < FIGHT_STATIONS_MAX);
// A kind's classes the player may pick: the starters only, until a second station stands.
export const classesOpen = kind => (S.stationsBuilt >= 2 ? PAIRS[kind] || []
  : (PAIRS[kind] || []).filter(k => STARTERS.includes(k)));

export function buildStation(kind) { return false; }       // TODO(CREW): spend a fang (the first free), queue the work
export function stationLanded(id) {}                       // TODO(CREW): built, stationsBuilt++, seat()
export function seat() {}                                  // TODO(CREW): spare pod residents -> built stations with no fighter
export function buyRung(id, cls) { return false; }         // TODO(CREW): commit cls on the first rung, rung++, add the bill to paid
export function resetStation(id) {}                        // TODO(CREW): refund paid, rung 0, cls null; the fighter stays, a base fighter
