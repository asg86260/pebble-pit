// The scrubbing house became the air filter, in the code as well as on the
// board. A save from before names it three ways: the `scrubOpen` fact, the
// site key `scrub` (what is being built there, the order the buildings went
// up in, what its board has finished) and the row key `unlockscrub` in the
// lists of rows a player has seen. Its board's title is among the headings
// already read, too, so it would come up as unread under its new name.
const site = k => (k === 'scrub' ? 'filter' : k);
const row = k => (k === 'unlockscrub' ? 'unlockfilter' : k);
const sect = k => (k === 'the scrubbing house' ? 'the air filter' : k);

function rekey(o, f) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return o;
  const out = {};
  for (const k of Object.keys(o)) out[f(k)] = o[k];
  return out;
}

export default {
  since: '2026-09-22',
  v: 5,
  says: 'the scrubbing house is the air filter',
  apply(s) {
    if ('scrubOpen' in s) {
      if (!('filterOpen' in s)) s.filterOpen = s.scrubOpen;
      delete s.scrubOpen;
    }
    s.works = rekey(s.works, site);
    for (const k in s.works || {}) {
      const w = s.works[k];
      for (const one of Array.isArray(w) ? w : [w])
        if (one && typeof one === 'object' && typeof one.key === 'string') one.key = row(one.key);
    }
    if (Array.isArray(s.buildOrder)) s.buildOrder = s.buildOrder.map(site);
    s.siteDone = rekey(s.siteDone, site);
    for (const k in s.siteDone || {})
      if (Array.isArray(s.siteDone[k])) s.siteDone[k] = s.siteDone[k].map(row);
    for (const f of ['seenRows', 'shownRows'])
      if (Array.isArray(s[f])) s[f] = s[f].map(row);
    if (typeof s.pinned === 'string') s.pinned = row(s.pinned);
    if (Array.isArray(s.seenSects)) s.seenSects = s.seenSects.map(sect);
  }
};
