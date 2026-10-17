// Where the afterlife is (DESIGN.md, "Acts 3 and 4", act 3, "The picture").
//
// One wide place on the cloud, laid out above the yard's sky, so a soul that
// rises out of the yard arrives somewhere real and every position in it is an
// ordinary world position the route, the camera and the drawing all read the
// same way -- the deep's rule (deep/place.js), turned upward. Its parts, left
// to right, are the grove, the camp, God's yard and the stair. Everything
// below is where a thing stands, read by the sim and the drawing alike, so a
// body walks to the spot the picture shows.

import { P, AFTER_GAP, AFTER_H, AFTER_W, AFTER_FLOOR_MARGIN, AFTER_OPEN_AT,
         AFTER_GROVE_X0, AFTER_PLOT_MAX, AFTER_PLOT_STEP, AFTER_STATIONS, AFTER_PEDESTAL_H,
         AFTER_CAMP_X0, AFTER_CAMP_COLS, AFTER_CAMP_PITCH, AFTER_CAMP_ROW, AFTER_CAMP_ROWS,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW,
         AFTER_WALL_STEP, AFTER_STAIR_X, AFTER_STAIR_W, AFTER_STAIR_RISE,
         AFTER_SKY_LO, AFTER_SKY_HI } from '../config.js';

const snap = v => Math.round(v / P) * P;

// The cloud floor's top: the yard's top is world y 0, so the afterlife's floor
// stands AFTER_GAP above it and its own top AFTER_H above that.
export const afterFloor = () => snap(-AFTER_GAP);
export const afterTop = () => afterFloor() - AFTER_H;
export const afterX0 = () => 0;
export const afterX1 = () => afterX0() + AFTER_W;
export const afterRect = () => ({ x: afterX0(), y: afterTop(), w: AFTER_W, h: AFTER_H });
export const inAfter = (x, y) => y >= afterTop() && y <= afterFloor() && x >= afterX0() && x <= afterX1();
// Where across it the camera opens.
export const afterOpenX = () => snap(afterX0() + AFTER_OPEN_AT * AFTER_W);
// The place as the camera reads it (acts.js, `PLACES`).
export const AFTER_PLACE = { x0: afterX0, x1: afterX1, top: afterTop, floor: afterFloor, open: afterOpenX,
                             margin: AFTER_FLOOR_MARGIN, h: AFTER_H };

// --- the grove ---------------------------------------------------------------------
// A plot's trunk column, its left edge on the grid. The grove's ground runs
// to the last plot its card can clear, so the camp beside it never moves.
export const plotX = i => afterX0() + AFTER_GROVE_X0 + i * AFTER_PLOT_STEP + snap(AFTER_PLOT_STEP / 2);
export const groveX1 = () => plotX(AFTER_PLOT_MAX - 1) + AFTER_PLOT_STEP;

// --- the camp ----------------------------------------------------------------------
// A station's box on the floor, its height a placeholder of its width; the
// pedestal a low plinth.
export const stationBox = key => {
  const s = AFTER_STATIONS[key];
  if (!s) return null;
  const w = s.w * P, h = (key === 'pedestal' ? AFTER_PEDESTAL_H : Math.round(s.w * 0.7)) * P;
  return { x: afterX0() + s.at * P, y: afterFloor() - h, w, h };
};
// Where a body stands to work a station: its door, a cell in from the left.
export const stationDoor = key => { const b = stationBox(key); return b ? b.x + P * 2 : 0; };
export const stationMid = key => { const b = stationBox(key); return b ? b.x + b.w / 2 : 0; };
// The cloud's edge a sweeping sawyer tips sawdust off: the place's left.
export const edgeX = () => afterX0() + P;
// Where the pair stand to speak: the pedestal's top, their feet on it, a body
// apart about its middle.
export const speakerAt = k => { const b = stationBox('pedestal'); return { x: snap(b.x + b.w / 2) + (k ? P : -P * 4), y: b.y }; };
// The rebel pile at the pedestal's foot, on God's-yard side, where the motes land.
export const pileX = () => { const b = stationBox('pedestal'); return b.x + b.w + P * 2; };
// Where an agitator stands: in a row behind the pedestal, a spot a post.
export const agitatorX = k => { const b = stationBox('pedestal'); return b.x - P * 3 - k * P * 4; };
// The spot of the k-th member waiting in the camp: rows across the camp's
// ground, each staggered half a spot, stepping up the screen, starting again
// at the front past the last row.
export const campSpot = k => {
  const row = Math.floor(k / AFTER_CAMP_COLS) % AFTER_CAMP_ROWS, col = k % AFTER_CAMP_COLS;
  return { x: afterX0() + AFTER_CAMP_X0 + col * AFTER_CAMP_PITCH + (row % 2 ? AFTER_CAMP_PITCH / 2 : 0),
           y: afterFloor() - row * AFTER_CAMP_ROW };
};

// --- the crowd ---------------------------------------------------------------------
// A soul is index i = rank * CROWD_FILES + file: rank-major, so a soul rising
// into the back of the crowd takes the next slot and nobody else moves.
export const fileOf = i => i % CROWD_FILES;
export const rankOf = i => Math.floor(i / CROWD_FILES);
export const soulAt = (f, r) => r * CROWD_FILES + f;
// A soul's square, its middle cell's left and top: files across God's yard,
// near ranks a body deep up the screen, far ranks a cell each behind them.
export const soulX = f => CROWD_X0 + f * CROWD_PITCH + P;
// A far rank is staggered half a file every other row, so the far field reads
// as a crowd thinning back rather than as columns.
export const farX = (f, r) => soulX(f) + (r % 2 ? CROWD_PITCH / 2 : 0);
export const soulY = r => afterFloor() - P * 2 - (r < CROWD_NEAR ? r * CROWD_ROW
                                                 : CROWD_NEAR * CROWD_ROW + (r - CROWD_NEAR) * CROWD_FAR_ROW);
// The deepest rank whose row stands at or below world y: the far field is
// drawn only up to the view's top.
export const rankAtY = y => {
  const front = afterFloor() - P * 2, near = CROWD_NEAR * CROWD_ROW;
  if (front - y < near) return Math.max(0, Math.floor((front - y) / CROWD_ROW));
  return CROWD_NEAR + Math.floor((front - near - y) / CROWD_FAR_ROW);
};
export const crowdX1 = () => CROWD_X0 + CROWD_FILES * CROWD_PITCH;
// The file under a world x, clamped to the field.
export const fileAt = x => Math.max(0, Math.min(CROWD_FILES - 1, Math.floor((x - CROWD_X0) / CROWD_PITCH)));
// The fence at the crowd's front: a poster's slot a step along it.
export const wallSlots = () => Math.floor((crowdX1() - CROWD_X0) / AFTER_WALL_STEP);
export const slotX = s => CROWD_X0 + s * AFTER_WALL_STEP + P;

// --- the stair and the sky -----------------------------------------------------------
export const stairFoot = () => AFTER_STAIR_X - AFTER_STAIR_W;
export const throneAt = () => ({ x: AFTER_STAIR_X, y: afterFloor() - AFTER_STAIR_RISE });
export const skyLo = () => afterFloor() - AFTER_SKY_LO;
export const skyHi = () => afterFloor() - AFTER_SKY_HI;
