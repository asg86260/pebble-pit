// A fifth phase (DESIGN.md, "A fifth phase: the constrict"): the stage past
// the last defense was 4 and is now 5, so a save already past the fading's
// break, freed, is moved on to the new kill.
export default {
  since: '2026-10-04',
  v: 9,
  says: 'a fifth phase stands before the kill',
  apply(s) {
    if (s.serpentFreed || s.serpentStage >= 4) s.serpentStage = 5;
  }
};
