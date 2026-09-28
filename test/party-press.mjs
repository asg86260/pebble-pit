// The party's presses, the player's way (DESIGN.md, "Built first, a recruit,
// then two choices"): the floating build button, the Recruit's board that
// picks the kind at rung 1, a station's rows and its Reset. Shared by the
// node-tier checks that buy a station or a rung as a step on the way to what
// they are about, so none of them writes a station or a rung onto `S` by
// hand and a broken `layStation`, `pressKind` or `buyRung` goes red
// everywhere it is leaned on.

import { S } from '../src/state.js';
import { press, buildOffer } from '../src/deep/buildbutton.js';
import { pressKind, pressBuy, pressReset } from '../src/deep/rails.js';
import { stationById } from '../src/deep/party.js';
import { FORK_RUNG } from '../src/config.js';

// The button pressed. With a `kind`, the build let land and the Recruit's
// rung 1 bought as that kind, paid for; without one the station is left
// going up. True when it did all it was asked.
export function pressBuild(kind = null) {
  if (!buildOffer().shown) return false;
  const id = press();
  if (!id || !kind) return !!id;
  window.__finish();
  return choose(id, kind);
}
// A Recruit's rung 1 bought on its board: it becomes the base unit of `kind`.
export function choose(id, kind) {
  flush();
  return pressKind(id, kind);
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

// Station `id` climbed to rung `n`, a row pressed a rung at a time, paid
// for: the base unit's rows, then at the fork `cls`'s, then its own. `cls`
// may be left out for a climb that stays below the fork.
export function climb(id, cls, n) {
  const st = stationById(id);
  if (!st) return null;
  flush();
  while (st.rung < n && pressBuy(id, st.rung + 1 === FORK_RUNG ? cls : null)) flush();
  return st;
}

// Reset pressed on station `id`'s rails.
export const reset = id => pressReset(id);

// Every class open, as a second station opens them (`classesOpen`): the
// setup a check about one class alone at one station is not about.
export const openEveryClass = () => { S.stationsBuilt = Math.max(S.stationsBuilt || 0, 2); };
