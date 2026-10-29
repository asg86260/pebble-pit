// The main plane's front edge (the owner, 2026-10-22: "a little cloud edge
// that comes up off the path a bit in the front, to paint cloud billows.
// insetad of the foreground drawn clouds"; mock A, a low lip): a row of
// round billows standing just in front of the path, overlapping so their
// tops scallop, following the path's shelves and ramps (after/place.js,
// `floorProfile`). Drawn over the camp and under the members, so a
// station's foot tucks behind it and a body's feet stand on it. Lit along each crest, pale through its
// body, the path's own grey across the top; under it, the page.

import { P, GREY, AFTER_LIP } from '../../config.js';
import { S } from '../../state.js';
import { afterX0, afterFloor, floorProfile } from '../../after/place.js';
import { ctx } from '../ctx.js';
import { fillOnPixels } from '../frame.js';
import { W, PALE, MID } from './kit.js';
import { plotX, AP, basketBox } from '../../after/place.js'; // MOCK grove
import { BED } from './grovemock.js'; // MOCK grove
// MOCK grove: whether a column stands under a plot's bed of soil, kept clear
// of the lip so the plot reads above the cloud line (the owner, 2026-10-28).
const groveBeds = () => { // MOCK grove
  if (!globalThis.__groveMock || !S.after) return () => false; // MOCK grove
  const xs = S.after.plots.map((p, i) => plotX(i)), k = basketBox(); // MOCK grove
  return x => xs.some(px => x >= px + BED[0] * AP && x < px + (BED[1] + 1) * AP) || (x >= k.x && x < k.x + k.w); // MOCK grove  the seed basket stands clear too
}; // MOCK grove

const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; fillOnPixels(ctx, x, y, w, h); };
const hsh = (a, b) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
};

// Each column's billow over the lip's foot, and how far its underside hangs,
// in cells: fixed by the seed, so the lip never moves but with the camera.
let tops = null, hangs = null;   // cache: keyed by the column count, from the fixed seed
function shape(cols) {
  if (tops && tops.length === cols) return;
  const L = AFTER_LIP;
  const row = (seed, round) => {
    const d = new Array(cols).fill(0);
    for (let c = -L.r[1], k = 0; c < cols + L.r[1]; k++) {
      const r = L.r[0] + hsh(seed, k) * (L.r[1] - L.r[0]), h = r * round;
      for (let j = Math.max(0, Math.floor(c - r)); j <= Math.min(cols - 1, Math.ceil(c + r)); j++) {
        const u = (j + 0.5 - c) / r;
        if (Math.abs(u) < 1) d[j] = Math.max(d[j], Math.round(h * Math.sqrt(1 - u * u)));
      }
      c += r * 2 * L.step;
    }
    return d;
  };
  tops = row(L.seed, L.round);
  hangs = row(L.seed + 1, L.round / 2);
}

export function drawFrontLip() {
  if (!ctx || !S.after) return;
  const el = floorProfile(), L = AFTER_LIP;
  shape(el.length);
  const j0 = Math.max(0, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(el.length, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2);
  const bed = groveBeds(); // MOCK grove
  const foot = j => afterFloor() + (L.drop - (el[j] || 0)) * P, top = j => (bed(afterX0() + j * P) ? Math.max(foot(j) - tops[j] * P, afterFloor() - (el[j] || 0) * P) : foot(j) - tops[j] * P); // MOCK grove  under a plot's bed, the lip no higher than the shelf's top
  for (let j = j0; j < j1; j++) {
    const x = afterX0() + j * P, y = top(j), bot = foot(j) + (L.hang + hangs[j]) * P;
    fr(x, y, P, bot - y, PALE);
    fr(x, y, P, Math.min(L.crest * P, bot - y), W);
  }
  // the top line, down each step between two columns
  for (let j = j0; j < j1; j++) {
    const x = afterX0() + j * P, y = top(j);
    fr(x, y, P, 2, MID);
    if (j > 0 && top(j - 1) !== y) fr(x, Math.min(top(j - 1), y), 2, Math.abs(top(j - 1) - y) + 2, MID);
  }
}
