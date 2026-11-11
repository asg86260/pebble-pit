// MOCK faith6
// A ring of cells laid out as a mask, shared by the air filter's dial
// (render/filter.js) and the shrine's faith ring (render/after/stations.js).
// At seven or nine cells a circle is a choice about which cells, so each
// caller keeps its mask and the choice is made once, where it can be looked
// at; this reads off a mask what both need: where each ring cell sits along a
// sweep, and the white face inside it.
//
// `from` is the angle (radians, 0 to the right, growing clockwise on the
// screen) the sweep starts at and `sweep` how far round it runs.

// Every ring cell of `mask` ('#'), with its share of the sweep, 0 where the
// sweep starts to 1 where it ends, or null for a cell outside the sweep.
export function ringCells(mask, from, sweep) {
  const hub = (mask.length - 1) / 2, out = [];
  for (let j = 0; j < mask.length; j++)
    for (let i = 0; i < mask[j].length; i++) {
      if (mask[j][i] !== '#') continue;
      let a = Math.atan2(j - hub, i - hub);
      if (a < from - 1e-6) a += Math.PI * 2;
      const share = (a - from) / sweep;
      out.push({ i, j, share: share < 0 || share > 1 ? null : share });
    }
  return out;
}

// The face: for each row between the ring's top and bottom, the cell it
// starts at and how many cells across the ring encloses.
export function ringFace(mask) {
  const out = [];
  for (let j = 1; j < mask.length - 1; j++) {
    const row = mask[j], from = row.indexOf('#') + 1, to = row.lastIndexOf('#');
    out.push({ j, from, n: to - from });
  }
  return out;
}
