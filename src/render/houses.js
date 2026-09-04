// The settlement, and the one room of it still going up. Extracted verbatim
// from render.js; behavior unchanged. Owns drawSettlement (the layer that hands
// house.js the frame's context), roomsIncludingRising, risingRoom and
// drawRisingHouse. ctx comes from ./ctx.js.

import { HOUSE_CUBE } from '../config.js';
import { drawHouses, cubes as houseCubes } from '../house.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { risingPlace, withRise } from './rise.js';

// The settlement itself. house.js draws on whichever context it is handed --
// the roster hands it one of its own -- so the frame's is passed in here.
export function drawSettlement() {
  drawHouses(ctx);
}

// Every room the settlement will have once the one going up lands -- one more
// than today's count, the same way `nextHouseAt` in house.js asks. `houseFoot`
// and `risingRoom` (below) both want this and must not disagree about which
// room is going up, so there is exactly one place that works it out.
export const roomsIncludingRising = () => {
  const today = S.crew > 0 ? S.crew + 1 : 0;
  return houseCubes(today + (S.crew > 0 ? 1 : 2));
};

// The room a hire is currently building, if any -- the one `kind: 'building'`
// work with no entry in `OPENS_PLACE`, because what it raises is not a place
// but the next room on a settlement that already exists. `cubes` (house.js) is
// asked for one room more than the crew has today, the same way `nextHouseAt`
// does, so the room about to appear is the last one it hands back.
function risingRoom() {
  const rooms = roomsIncludingRising();
  return rooms[rooms.length - 1] || null;
}

// The next room, going up over `workFor` seconds with a builder at it (C1) --
// see #3, "Wave 3.1", for making that visible the way every other building's
// rise is. Drawn in the same black mass as the rest of the settlement, clipped
// to the work's own progress and rising from its own foot -- a room on the
// ground rises out of the ground, a room on the third storey rises out of the
// course under it, which is the only "ground" it has.
export function drawRisingHouse() {
  if (risingPlace() !== 'house') return;
  const room = risingRoom();
  if (!room) return;
  withRise(true, room.x, room.y + HOUSE_CUBE, HOUSE_CUBE, HOUSE_CUBE, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(room.x, room.y, HOUSE_CUBE, HOUSE_CUBE);
  });
}
