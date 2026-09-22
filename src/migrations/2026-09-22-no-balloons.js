// The balloons are gone: the air filter's dial stands where they were moored.
// A save from before may have bought some, may be part way through building
// one, and may have bodies up in a basket or coming down under an umbrella.
//
// What each one cost is paid back into the hole, at the prices they were sold
// at, written out here since the ladder that priced them is gone: 1200 dust
// and each one 1.9 times dearer than the last, a finite ladder of three. A
// build still going was paid for when it was ordered, so it is paid back too.
//
// A rider is let down on the wizards' own descent (`floating`), not dropped
// and not put on the ground: nothing in this yard arrives anywhere it did not
// get to.
const PRICE = n => Math.round(1200 * Math.pow(1.9, n));

export default {
  since: '2026-09-22',
  v: 6,
  says: 'the balloons are gone, and paid back',
  apply(s) {
    let bought = Array.isArray(s.craft) ? s.craft.length : 0;
    let back = 0;
    for (let i = 0; i < bought; i++) back += PRICE(i);
    delete s.craft;

    // A balloon on the go at the filter's site, paid for and not yet landed.
    if (s.works && typeof s.works === 'object') {
      for (const site of Object.keys(s.works)) {
        const list = s.works[site];
        if (!Array.isArray(list)) continue;
        s.works[site] = list.filter(w => {
          if (!w || w.key !== 'balloon') return true;
          back += PRICE(bought++);
          return false;
        });
      }
    }
    if (back) s.stored = (+s.stored || 0) + back;

    for (const rec of Array.isArray(s.who) ? s.who : []) {
      if (!rec || typeof rec !== 'object') continue;
      if (rec.goal === 'aloft' || rec.craft != null) {
        rec.goal = 'to';
        if (rec.aloft) rec.floating = true;
      }
      delete rec.craft;
      delete rec.berth;
      delete rec.brolly;
    }

    // Its row, wherever a list of rows remembers it.
    for (const f of ['seenRows', 'shownRows'])
      if (Array.isArray(s[f])) s[f] = s[f].filter(k => k !== 'balloon');
    if (s.pinned === 'balloon') s.pinned = null;
    for (const k in s.siteDone || {})
      if (Array.isArray(s.siteDone[k])) s.siteDone[k] = s.siteDone[k].filter(r => r !== 'balloon');
  }
};
