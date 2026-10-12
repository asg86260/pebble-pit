// The apothecary holds three pots, one to a brew. A save with a fourth keeps
// three: the fourth pot's settings and any batch lit in it are dropped (no
// refund), and its stirrer is no longer seated, so the deal returns that body
// to the spare pool and it walks off like any other body stood down.
const POTS = 3;     // the cap when this migration was written; history, not a knob

export default {
  since: '2026-10-12',
  v: 14,
  says: 'a fourth apothecary pot is dropped, with its batch and its stirrer\'s seat',
  apply(s) {
    if (!(s.apothPots > POTS)) return;
    s.apothPots = POTS;
    for (const k of ['potTonics', 'potSpents', 'potPrefers', 'brewAt', 'brewKeys'])
      if (Array.isArray(s[k])) s[k] = s[k].slice(0, POTS);
    if (s.stirrers > POTS) s.stirrers = POTS;
  }
};
