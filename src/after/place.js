// Where the afterlife is (DESIGN.md, "Acts 3 and 4", act 3, "The picture").
//
// One wide place on the cloud, laid out above the yard's sky, so a soul that
// rises out of the yard arrives somewhere real and every position in it is an
// ordinary world position the route, the camera and the drawing all read the
// same way -- the deep's rule (deep/place.js), turned upward. Its parts, left
// to right, are the grove, the camp, God's yard and the stair; the scaffold
// stands only the extent they will be laid out in.

import { P, AFTER_GAP, AFTER_H, AFTER_W, AFTER_FLOOR_MARGIN, AFTER_OPEN_AT } from '../config.js';

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
