// Act 3's piles are no numbers any more (DESIGN.md, "One resource system for
// every act", sections 4 and 5): a pile's count is its strip's units on the
// ground, read off the cells, the sawdust heap's is its grains, and a station
// going up keeps its loads as units of the ground too, not as counters.
//
// A save from before keeps `after.stock`, a copy of the pile counts (the ground
// it was read off is saved beside it and holds every unit) and the heap's grain
// count, which was the only record of the heap; and each site as five counters
// (`claimed`, `brought`, `taken`, `laid`, `drop`, `pick`), its loads in a
// builder's arms a grain. Here the sawdust becomes a list to lay (`after.lay`,
// read by after/piles.js, `standPiles`), the loads set down and not yet taken
// (`brought` less `taken`) become loads to lay on the site's strip, a builder's
// grain becomes a load unit, and `stock` and the counters go. `laid` stays: the
// loads laid in bands, the account behind that sink.
import { KINDS, AFTER_BUILD_PIECES, AFTER_BUILD_A_BAND } from '../config.js';

// The load's cell value as the table stood that day, before sawdust left it
// (2026-10-29-no-sawdust.js): the log, plank, sign and sawdust, four tones each.
const LOAD_V33 = KINDS.log.first + 16;
const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-10-28',
  v: 33,
  says: 'act 3\'s piles are read off the ground, the sawdust heap is saved as grains and a site\'s loads are units on its strip: the stock and site counters are gone',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    const lay = Array.isArray(a.lay) ? a.lay : [];
    if (obj(a.stock)) {
      const n = Math.max(0, Math.floor(+a.stock.sawdust || 0));
      if (n) lay.push({ what: 'sawdust', n });
    }
    delete a.stock;
    const loads = AFTER_BUILD_PIECES * AFTER_BUILD_A_BAND;
    if (obj(a.raising)) {
      for (const [key, r] of Object.entries(a.raising)) {
        if (!obj(r)) continue;
        // a site older than the carried loads stood its pile whole and built off it
        const laid = r.brought == null ? Math.min(loads, (+r.n || 0) * AFTER_BUILD_A_BAND) : Math.max(0, Math.floor(+r.laid || 0));
        const onPile = Math.max(0, r.brought == null ? loads - laid : Math.floor((+r.brought || 0) - (+r.taken || 0)));
        for (let k = 0; k < onPile; k++) lay.push({ kind: 'load', site: key, at: k });
        a.raising[key] = { n: Math.max(0, Math.floor(+r.n || 0)), at: Array.isArray(r.at) ? r.at : [], laid, whole: r.whole == null || r.whole <= -1e8 ? null : r.whole };
      }
    }
    if (Array.isArray(a.bodies)) {
      // 1 was a grain, the lightest shade, the load a builder carried in v32
      for (const b of a.bodies) {
        if (obj(b) && (b.phase === 'carry' || b.phase === 'lay') && Array.isArray(b.load)) b.load = b.load.map(v => (v === 1 ? LOAD_V33 : v));
      }
    }
    a.lay = lay;
  }
};
