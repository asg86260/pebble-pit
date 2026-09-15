// The settlement, and the one room of it still going up.

import { HOUSE_CUBE } from '../config.js';
import { drawHouses, cubes as houseCubes, roomsToday } from '../house.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// house.js draws on whichever context it is handed (the roster hands it one of
// its own), so the frame's is passed in here.
export function drawSettlement() {
  drawHouses(ctx);
}

// Every room the settlement will have once the one going up lands, the same
// way `nextHouseAt` in house.js asks. `houseFoot` and `risingRoom` must not
// disagree about which room is going up, so there is one place that works it
// out.
export const roomsIncludingRising = () => {
  return houseCubes(roomsToday() + (S.crew > 0 ? 1 : 2));
};

// The room a hire is currently building: the one `kind: 'building'` work with
// no entry in `OPENS_PLACE`, because what it raises is not a place but the
// next room. The room about to appear is the last one `cubes` hands back.
function risingRoom() {
  const rooms = roomsIncludingRising();
  return rooms[rooms.length - 1] || null;
}

// The next room, clipped to the work's own progress and rising from its own
// foot: a room on the third storey rises out of the course under it, which is
// the only ground it has.
export function drawRisingHouse() {
  if (!risingAt('house')) return;
  const room = risingRoom();
  if (!room) return;
  withRise('house', room.x, room.y + HOUSE_CUBE, HOUSE_CUBE, HOUSE_CUBE, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(room.x, room.y, HOUSE_CUBE, HOUSE_CUBE);
  });
}
