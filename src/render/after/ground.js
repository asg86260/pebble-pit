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
import { afterX0, afterFloor, floorProfile, bedSpan, pileAt, pileOwner, AP } from '../../after/place.js';
import { pileCells } from '../../after/art.js';
import { ctx } from '../ctx.js';
import { fillOnPixels } from '../frame.js';
import { W, PALE, MID } from './kit.js';

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

// The spans the lip is held down under, no higher than the shelf's top: every
// plot's soil bed and the seed basket, so a plot and its seeds read above
// the cloud line (the owner, 2026-10-28).
function clear() {
  const spans = S.after.plots.map((p, i) => bedSpan(i)), key = pileOwner('seeds');
  if (key) { const x = pileAt(key, 'seeds'); spans.push([x, x + pileCells('seeds') * AP]); }
  return x => spans.some(([a, b]) => x >= a && x < b);
}
export function drawFrontLip() {
  if (!ctx || !S.after) return;
  const el = floorProfile(), L = AFTER_LIP, low = clear();
  shape(el.length);
  const j0 = Math.max(0, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(el.length, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2);
  const foot = j => afterFloor() + (L.drop - (el[j] || 0)) * P;
  const top = j => (low(afterX0() + j * P) ? Math.max(foot(j) - tops[j] * P, afterFloor() - (el[j] || 0) * P) : foot(j) - tops[j] * P);
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
