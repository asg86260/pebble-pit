// The item review cut eleven items and renamed one (wardrobe.js): a slot
// wearing a cut item is bare (none, or plain), and the pattern once kept as
// `black` is `filled`. The load would bare a cut item on its own
// (`wholeOutfit`); the rename it could not tell from a cut.

const CUT = {
  head: ['pigtails', 'tiara'],
  neck: ['bowtie', 'tie', 'collar', 'medal'],
  back: ['small-pack', 'cat-tail', 'bushy-tail'],
  pattern: ['grey', 'pale'],
};
const BARE = { head: 'none', neck: 'none', back: 'none', pattern: 'plain' };

const mend = o => {
  if (!o || typeof o !== 'object') return;
  if (o.pattern === 'black') o.pattern = 'filled';
  for (const [slot, keys] of Object.entries(CUT)) if (keys.includes(o[slot])) o[slot] = BARE[slot];
};

export default {
  since: '2026-10-16',
  v: 25,
  says: 'a cut wardrobe item is taken off, and the black pattern is called filled',
  apply(s) {
    if (s.outfits && typeof s.outfits === 'object') for (const who of Object.keys(s.outfits)) mend(s.outfits[who]);
  }
};
