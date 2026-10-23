// The road up to heaven, as the rise rides it (DESIGN.md, "The rise rides up
// with them"): the yard's sky carried on up the gap between heaven's tear and
// the cloud floor, with clouds hung up it for the camera to climb past, and
// the floor's underside billowing down over them so it reads as cloud from
// below. Nothing here moves; the clouds stream down the window because the
// window is climbing.
//
// The clouds are hung above the window the yard was left in (view.js,
// `skyCam`), never inside it, so the yard never sees one: the road is only
// there for the camera that goes up it. They are drawn in the yard's own
// cloud tones (weather.js, `roadTones`), lit on top and shaded under, each
// cell picking its tone off a hash so no cloud is a flat slab of paint.

import { P, GREY, ACT_ROAD_CLOUDS, ACT_ROAD_CLOUD_W, ACT_ROAD_CLOUD_H, ACT_ROAD_BILLOW, ACT_ROAD_SEED, ACT_ROAD_FAR,
         ACT_ROAD_SPREAD, ACT_ROAD_JITTER, ACT_ROAD_ROUND, ACT_ROAD_SPECKLE, AFTER_W } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { afterX0, billow } from '../after/place.js';
import { tear } from '../ghosts.js';
import { skyCam } from '../view.js';
import { roadTones } from '../weather.js';
import { afterlifeOn, afterUnder } from '../acts.js';

const snap = v => Math.round(v / P) * P;
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519 + ACT_ROAD_SEED * 1013904223) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
};

// The road is there from the house's fall, when the tear opens over its ruin.
export const roadUp = () => afterlifeOn() && !!S.acts && S.acts.house !== 'standing';

function fill(x, y, tone) { ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); }

// The clouds, evenly up the road from just over the yard's window to just
// under the cloud floor's billow, each one's height on the road and its
// place across it jittered off its own number.
function clouds(tones) {
  const sky = skyCam();
  const lo = Math.min(sky.y, tear().y) - P * ACT_ROAD_CLOUD_H * 2;
  const hi = afterUnder() + P * (ACT_ROAD_BILLOW + ACT_ROAD_CLOUD_H * 2);
  const n = ACT_ROAD_CLOUDS;
  if (!(lo > hi) || n <= 0) return;
  const step = (lo - hi) / n, mid = tear().x, span = sky.w * ACT_ROAD_SPREAD;
  const [wMin, wMax] = ACT_ROAD_CLOUD_W;
  for (let i = 0; i < n; i++) {
    const w = wMin + Math.floor(hsh(i, 1) * (wMax - wMin + 1));
    const h = Math.max(2, Math.min(ACT_ROAD_CLOUD_H, 2 + Math.floor(w / 8)));
    const base = snap(lo - step * (i + 0.5 + (hsh(i, 2) - 0.5) * ACT_ROAD_JITTER));
    const x0 = snap(mid + (hsh(i, 3) - 0.5) * span - (w * P) / 2);
    if (base < S.camY - P || base - h * P > S.camY + S.viewH || x0 > S.camX + S.viewW || x0 + w * P < S.camX) continue;
    // A mound on a flat base: each row up drawn in a little further at
    // either end, the base row the shaded one and the crown the lit.
    for (let r = 0; r < h; r++) {
      const inset = Math.round((r * r * w) / (h * h * ACT_ROAD_ROUND)) + (r && hsh(i, r, 5) < 0.5 ? 1 : 0);
      const t = r === 0 ? 2 : r === h - 1 ? 0 : 1;
      for (let c = inset; c < w - inset; c++) {
        const k = Math.min(tones.length - 1, t + (hsh(i, r * 97 + c, 7) < ACT_ROAD_SPECKLE ? 1 : 0));
        fill(x0 + c * P, base - (r + 1) * P, tones[k]);
      }
    }
  }
}

// The floor's underside, the floor's own billowed edge turned over (render/
// after/floor.js): the cloud's white body hanging a row under its underside
// line everywhere and a puff or two more where it billows, its outline a
// thin line in the sky's shaded tone with each convex corner cut by a step,
// and the row over that line in the shade, cell by cell.
const EDGE = 2;     // the outline's thickness, in world px, as the floor's top line is
let under = null;   // cache: made once from the fixed seed
function underside(tones) {
  const line = afterUnder();
  if (line + P * (ACT_ROAD_BILLOW + 2) < S.camY || line > S.camY + S.viewH) return;
  const cols = Math.ceil(AFTER_W / P);
  under ||= billow(cols, ACT_ROAD_SEED, ACT_ROAD_BILLOW);
  const j0 = Math.max(0, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(cols, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 1);
  const ink = tones[tones.length - 1], body = GREY[0];
  const hang = j => 1 + (under[j] || 0);
  for (let j = j0; j < j1; j++) {
    const h = hang(j), x = afterX0() + j * P, foot = line + h * P;
    ctx.fillStyle = body; ctx.fillRect(x, line, P, h * P);
    // the shade along the inside of the outline, a cell a column, toned off a hash
    fill(x, foot - P, tones[Math.min(tones.length - 2, 1 + (hsh(j, h, 11) < ACT_ROAD_SPECKLE ? 1 : 0))]);
    const cutL = j > 0 && hang(j - 1) < h, cutR = hang(j + 1) < h;
    ctx.fillStyle = ink;
    ctx.fillRect(x + (cutL ? EDGE : 0), foot - EDGE, P - (cutL ? EDGE : 0) - (cutR ? EDGE : 0), EDGE);
    // a riser where the outline steps from this column's depth to the last's
    if (j > j0 && hang(j - 1) !== h) {
      const deep = line + Math.max(h, hang(j - 1)) * P, shallow = line + Math.min(h, hang(j - 1)) * P;
      ctx.fillRect(h > hang(j - 1) ? x : x - EDGE, shallow - EDGE, EDGE, deep - shallow);
    }
  }
}

export function drawRoadSky() {
  if (!roadUp()) return;
  const tones = roadTones(ACT_ROAD_FAR);
  clouds(tones);
  underside(tones);
  ctx.fillStyle = '#000';
}
