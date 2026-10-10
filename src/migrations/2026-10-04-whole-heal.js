// The serpent heals whole (DESIGN.md, "The serpent heals whole: a phase is a
// window"): there is no heal to bank and no Weakened to cut it, so a save's
// bank and any Weakened on the serpent go.
export default {
  since: '2026-10-04',
  v: 8,
  says: 'the serpent heals whole at a meal; Weakened is now Exposed',
  apply(s) {
    delete s.healBank;
    if (s.statuses && typeof s.statuses === 'object') delete s.statuses.weakened;
  }
};
