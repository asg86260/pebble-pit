// The first station stands from the snatch now (deep/party.js, `standFirst`),
// and the first trip down is a scene (abyssintro.js). A save past the snatch
// with no station gets the free one standing, a Recruit with nobody yet
// named at it: the load seats her there and she swims to it. A save that has
// been down already -- a station laid, which is pressed in the deep, or the
// view left there -- or whose sqhusband is out has had its first trip, so
// the scene is marked had and never plays over a deep long past it.
const FIRST = { id: 's1', slot: 0 };   // the first id and slot when this was written; history, not a knob

export default {
  since: '2026-10-12',
  v: 15,
  says: 'a yard past the snatch with no station gets the free one standing; one that has been down skips the first trip\'s scene',
  apply(s) {
    if (!s.snatched) return;
    const had = Array.isArray(s.stations) && s.stations.length > 0;
    if (had || s.view === 'deep' || s.serpentFreed) {
      if (!Array.isArray(s.beatsDone)) s.beatsDone = [];
      if (!s.beatsDone.includes('abyss')) s.beatsDone.push('abyss');
    }
    if (had) return;
    s.stations = [{ id: FIRST.id, kind: null, slot: FIRST.slot, built: true, cls: null, rung: 0, paid: [], fighter: null }];
    s.stationsBuilt = Math.max(1, s.stationsBuilt | 0);
  }
};
