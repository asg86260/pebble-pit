// The party's presses, the player's way (docs/wave-party.md, "The boards"):
// the floating build button and its picker, a station's rails' Buy and
// Reset. Shared by the node-tier checks that buy a station or a rung as a
// step on the way to what they are about, so none of them writes a station
// or a rung onto `S` by hand and a broken `buildStation` or `buyRung` goes
// red everywhere it is leaned on.

import { S } from '../src/state.js';
import { openPicker, pick, buildOffer } from '../src/deep/buildbutton.js';
import { view, pressBuy, pressReset, railsOf } from '../src/deep/rails.js';
import { stationById } from '../src/deep/party.js';

// The button pressed and a kind picked off its picker. True when it built.
export function pressBuild(kind) {
  if (!buildOffer().shown) return false;
  openPicker();
  return pick(kind);
}

// A purse deep enough for any rung: scales on the crusher and every coin the
// deep's bands add, with the places they come from standing (a band asking a
// coin the yard has never met is greyed, `coinsOpen`), as they stand in any
// yard the serpent has come for.
export function flush() {
  if (!S.quarryOpen || !S.farmOpen) window.__fullSites();
  S.seenSpark = true;
  window.__scales(1e5);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
}

// Station `id`'s rail for `cls` climbed to rung `n`, Buy pressed a rung at a
// time, paid for. A blank station views the class first, as the player taps
// its plate; the first rung bought takes it.
export function climb(id, cls, n) {
  const st = stationById(id);
  if (!st) return null;
  flush();
  if (!st.cls && railsOf(id).buy.cls !== cls) view(id, cls);
  while (st.rung < n && railsOf(id).buy.cls === cls && pressBuy(id)) flush();
  return st;
}

// Reset pressed on station `id`'s rails.
export const reset = id => pressReset(id);

// Every class open, as a second station opens them (`classesOpen`): the
// setup a check about one class alone at one station is not about.
export const openEveryClass = () => { S.stationsBuilt = Math.max(S.stationsBuilt || 0, 2); };
