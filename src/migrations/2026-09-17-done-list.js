// A station's done mark became a list: everything it has finished since its
// board was read, oldest first, each ticked in the stack over it. A save from
// before held the one key of the last thing landed.
export default {
  since: '2026-09-17',
  v: 3,
  says: 'a site\'s done mark is a list of what landed',
  apply(s) {
    if (!s.siteDone || typeof s.siteDone !== 'object') return;
    for (const site in s.siteDone) {
      const v = s.siteDone[site];
      if (Array.isArray(v)) continue;
      if (typeof v === 'string' && v) s.siteDone[site] = [v];
      else delete s.siteDone[site];
    }
  }
};
