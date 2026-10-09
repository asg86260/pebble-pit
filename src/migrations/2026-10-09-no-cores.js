// The barriers are the gates and cores go (DESIGN.md): a save keeps the
// places it has open, and its cores -- banked, in hand or lying about -- and
// the notice for the first one are dropped.
export default {
  since: '2026-10-09',
  v: 10,
  says: 'cores are gone; the barriers open the places',
  apply(s) {
    s.cores = 0;
    s.seenCore = false;
    s.heldCore = false;
    s.coreItem = null;
    if (Array.isArray(s.won)) s.won = s.won.filter(k => k !== 'firstcore');
    if (s.riftHeld) s.riftHeld.cores = 0;
  }
};
