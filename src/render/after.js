// The afterlife, drawn (DESIGN.md, "Acts 3 and 4", act 3, "The picture"). Its
// layers are in render.js's LAYERS, drawn only with the camera up there; in
// the scaffold the backdrop is the whole picture, and every other layer is an
// empty body waiting for its mock to be voted: the clouds and faith, God's
// yard and the stair, the grove, the camp's mills and press, the crowd.
//
// The backdrop is a placeholder, not the look: the white page and a cloud
// floor of pale cells, each cell a tone of its own off a fixed hash of where
// it stands (no flat fills, and no random draw, so it holds still frame to
// frame). High key, black and white only (DESIGN.md, "The look").

import { P, GREY, AFTER_FLOOR_CELLS, AFTER_FLOOR_TONES } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { afterX0, afterX1, afterFloor } from '../after/place.js';

// A cell's tone, fixed by where it is.
const toneAt = (c, r) => {
  const h = (((c * 73856093) ^ (r * 19349663)) >>> 0) % 9973;
  return AFTER_FLOOR_TONES[h % AFTER_FLOOR_TONES.length];
};

export function drawAfterBackdrop() {
  // The page under the view, white, from the view's top to the floor.
  const x0 = Math.max(afterX0(), Math.floor(S.camX / P) * P);
  const x1 = Math.min(afterX1(), Math.ceil((S.camX + S.viewW) / P) * P);
  ctx.fillStyle = GREY[0];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  // The cloud floor: AFTER_FLOOR_CELLS rows of pale cells under the floor line.
  const top = afterFloor();
  for (let r = 0; r < AFTER_FLOOR_CELLS; r++) {
    for (let x = x0; x < x1; x += P) {
      ctx.fillStyle = GREY[toneAt(x / P, r)];
      ctx.fillRect(x, top + r * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The rest of the place, each waiting for its piece of the act.
export function drawAfterStair() {}      // God's throne in the glare, up its stair at the right (strike.js)
export function drawAfterYard() {}       // God's yard: the great cloud, its heaps, the fence
export function drawAfterGrove() {}      // the trees at the cloud's left edge (grove.js)
export function drawAfterCamp() {}       // the mills, the workshop, the press, the well (mill.js, press.js)
export function drawAfterCrowd() {}      // the crowd field going to ink (union.js)
export function drawAfterSky() {}        // the small clouds, faith and ink drifting down (faith.js)
