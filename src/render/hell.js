// Hell, drawn (DESIGN.md, "Acts 3 and 4", act 4, "The place: a run of
// chambers down to the cage room"). Its layers are in render.js's LAYERS,
// drawn only with the camera down there; in the scaffold the backdrop is the
// whole picture, and every other layer is an empty body waiting for its mock
// to be voted: the chambers and the stair, the seams, the furnaces and the
// anvil, the barriers, the cage.
//
// The backdrop is a placeholder, not the look: a black hollow on a dark floor
// of grey cells, each a tone of its own off a fixed hash of where it stands.
// No red anywhere -- red is the sparks' -- and the fire, when it comes, is
// white (DESIGN.md, "The look").

import { P, GREY, HELL_FLOOR_CELLS, HELL_FLOOR_TONES } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { hellX0, hellX1, hellFloor } from '../hell/place.js';

// A cell's tone, fixed by where it is.
const toneAt = (c, r) => {
  const h = (((c * 83492791) ^ (r * 2654435761)) >>> 0) % 9973;
  return HELL_FLOOR_TONES[h % HELL_FLOOR_TONES.length];
};

export function drawHellBackdrop() {
  ctx.fillStyle = GREY[10];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  const x0 = Math.max(hellX0(), Math.floor(S.camX / P) * P);
  const x1 = Math.min(hellX1(), Math.ceil((S.camX + S.viewW) / P) * P);
  const top = hellFloor();
  for (let r = 0; r < HELL_FLOOR_CELLS; r++) {
    for (let x = x0; x < x1; x += P) {
      ctx.fillStyle = GREY[toneAt(x / P, r)];
      ctx.fillRect(x, top + r * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The rest of the place, each waiting for its piece of the act.
export function drawHellChambers() {}    // the run's walls, the stair, the road's foot (chambers.js)
export function drawHellSeams() {}       // each chamber's ore in its wall (ore.js)
export function drawHellForge() {}       // the furnaces and the anvil (forge.js)
export function drawHellBarriers() {}    // the walls across each chamber's far side (barriers.js)
export function drawHellCage() {}        // the cage room (cage.js)
