// Value noise, for things that burn.
//
// Hashed samples eased between, so a column driven by it rises and falls at
// random heights without the per-frame strobe raw randomness gives. Two things
// in the yard flicker this way now -- the fire under the cauldron and the tonic
// burning off a dosed body -- and they should flicker with the same hand, so the
// function lives here rather than twice.
//
// The one rule for using it: give each column a LARGE offset of its own
// (`c * 17.3`, not `c * 0.3`). Neighbours a small step apart in noise space hold
// nearly the same value, and a row of columns reading nearly the same value one
// step apart is a travelling wave -- the fire looked like it was sliding
// sideways. Far apart, they are uncorrelated and flicker where they stand.
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

// 0..1, smooth
export const vnoise = x => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * u;
};
