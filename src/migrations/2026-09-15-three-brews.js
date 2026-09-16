// Five brews became three, each read per trade (DESIGN.md, "Three brews, one
// a coin"): the speed brew folds into the stew and the mana brew into the
// strong brew. The potency is the deeper of the two rungs (the player bought
// two things that are now one), the stock joins the shelf, a pot on the old
// brew is set to the new one, and a live dose keeps its clock under the new
// name.
const FOLDED = { swift: 'stew', gleam: 'strong' };
const fold = key => FOLDED[key] || key;

export default {
  since: '2026-09-15',
  v: 1,
  says: 'five brews became three',
  apply(s) {
    s.potency = s.potency || {};
    s.shelf = s.shelf || {};
    for (const [old, to] of Object.entries(FOLDED)) {
      if (s.potency[old] != null) {
        s.potency[to] = Math.max(s.potency[to] | 0, s.potency[old] | 0);
        delete s.potency[old];
      }
      if (s.shelf[old] != null) {
        s.shelf[to] = (s.shelf[to] | 0) + (s.shelf[old] | 0);
        delete s.shelf[old];
      }
    }
    if (Array.isArray(s.potTonics)) s.potTonics = s.potTonics.map(fold);
    if (Array.isArray(s.brewKeys)) s.brewKeys = s.brewKeys.map(fold);
    if (Array.isArray(s.who))
      for (const k of s.who)
        for (const d of k?.doses || []) if (d) d.tonic = fold(d.tonic);
  }
};
