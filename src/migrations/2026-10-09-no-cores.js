// The barriers are the gates and cores go (DESIGN.md): a save keeps the
// places it has open, and its cores -- banked, in hand or lying about -- and
// the notice for the first one are dropped.
export default {
  since: '2026-10-09',
  v: 10,
  says: 'cores are gone; the barriers open the places',
  apply(s) {
    for (const k of ['cores', 'seenCore', 'heldCore', 'coreItem', 'core', 'coreLoose']) delete s[k];
    if (Array.isArray(s.won)) s.won = s.won.filter(k => k !== 'firstcore');
    if (s.riftHeld) delete s.riftHeld.cores;
  }
};
