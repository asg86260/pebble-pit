// The air filter comes with its first balloon. A yard that already has the
// filter gets that balloon moored at the next post, and the ones it paid for
// stay its own (the row counts only the bought: `S.craftGift`).
export default {
  since: '2026-10-11',
  v: 13,
  says: 'a built air filter gets its included balloon',
  apply(s) {
    if (!s.filterOpen || s.craftGift) return;
    s.craftGift = 1;
    if (!Array.isArray(s.craft)) s.craft = [];
    s.craft.push({ phase: 'moored', t: 0, hang: false });
  }
};
