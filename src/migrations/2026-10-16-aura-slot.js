// The wardrobe's sixth slot, the aura (wardrobe.js): an outfit saved before
// it is written down wearing none, so the slot is in every save from here
// on as plainly as the other five. The load would put on the default
// (`wholeOutfit`), which is none too; this says so in the save itself.

export default {
  since: '2026-10-16',
  v: 26,
  says: 'the two of them wear no aura until one is chosen',
  apply(s) {
    if (!s.outfits || typeof s.outfits !== 'object') return;
    for (const o of Object.values(s.outfits)) if (o && typeof o === 'object' && typeof o.aura !== 'string') o.aura = 'none';
  }
};
