// The serpent: its four defenses, the wound held open against its heal, and
// the one door every weapon strikes it through.
//
// SKELETON. Track SERPENT owns this file and replaces every body below; the
// exports and their signatures are the contract the other tracks build
// against (docs/wave-serpent.md, "The seams"). Until then each answers as a
// serpent nobody has touched.

// A hit: `weapon` is a key of SERPENT_DEFENSE, `dmg` what the weapon is
// worth before the defense, (x, y) where it landed. Returns the damage done.
export const strike = (weapon, dmg, x, y) => 0;
// A click in the deep, in world coordinates: true if it was the serpent's.
export const clickDeep = (x, y) => false;
export const stageOf = () => 0;           // 0..3 the defense up, 4 freed
export const woundK = () => 0;            // the wound as a fraction of the stage's depth
export const healNow = () => 0;           // the heal this frame, after sigils and the curse
export const litK = () => 0;              // how much of the coil the wizards light, 0..1
export const boundK = () => 0;            // how much of it the sigils hold, 0..1
export const stepSerpent = c => {};
