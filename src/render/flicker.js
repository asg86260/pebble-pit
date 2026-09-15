// Value noise, for things that burn: hashed samples eased between, so a column
// driven by it rises and falls at random heights without the per-frame strobe
// raw randomness gives. The fire under the cauldron and the tonic burning off
// a dosed body both use it, so they flicker with the same hand.
//
// The one rule: give each column a LARGE offset of its own (`c * 17.3`, not
// `c * 0.3`). Neighbors a small step apart in noise space hold nearly the same
// value, and that is a wave sliding sideways.
// The hash on its own is for anything drawn that wants a fixed, arbitrary
// value per cell, since the alternative, `rand()`, strobes.
export const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

// 0..1, smooth
export const vnoise = x => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * u;
};
