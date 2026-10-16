// The two of them are kept by the part each plays rather than by gender
// (wardrobe.js, DESIGN.md "Who you are"): the survivor who digs, once `him`,
// is `you`; the one under the rock, once `her`, is `sqouse`. Each uid and
// outfit moves to its new key unchanged, so every body wears what it wore.
// The names and roles are new and absent from such a save; it reads them as
// unnamed with today's roles, the sqhusband and the sqwife, which is every
// line exactly as it read before.

const moved = o => {
  if (!o || typeof o !== 'object') return o;
  const out = { ...o };
  for (const [a, b] of Object.entries({ him: 'you', her: 'sqouse' })) {
    if (!(b in out) && a in out) out[b] = out[a];
    delete out[a];
  }
  return out;
};

export default {
  since: '2026-10-16',
  v: 24,
  says: 'the two of them are kept as you and your sqouse, not as him and her',
  apply(s) {
    if (s.pairIds) s.pairIds = moved(s.pairIds);
    if (s.outfits) s.outfits = moved(s.outfits);
  }
};
