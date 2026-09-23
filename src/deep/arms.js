// The weapons made of the abyss: what a body at each deep station does, and
// what is in the water because of it -- lances, grenades and their rings,
// sigils, beams, the called star.
//
// SKELETON. Track SERPENT owns this file and replaces every body below; the
// exports and their signatures are the contract (docs/wave-serpent.md). The
// `step*` functions are each deep job's `work` step, called by the JOBS
// registry (src/crew/jobs.js) once the body is at its station.

export const stepBrawler = (w, c) => {};
export const stepLancer = (w, c) => {};
export const stepGrenadier = (w, c) => {};
export const stepScribe = (w, c) => {};
export const stepWarlock = (w, c) => {};
// The water's own: lances bleeding, grenades flying, rings spreading, beams,
// the star.
export const stepArms = c => {};
