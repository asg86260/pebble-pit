// The numbers that ride beside the things they count, drawn in screen pixels so
// the digits stay sharp. Lifted out of the frame's body in render.js; behavior
// unchanged. Each of these is a one-line layer over somebody else's draw, and
// they are here so that the painting order can name them.

import { drawRosterCounts } from '../roster.js';
import { drawStockCount } from './apothecary.js';
import { ctx } from './ctx.js';
import { drawKitCounts } from './crew.js';
import { screenAt } from './frame.js';

// who is working where, beside each badge
export function drawRosterBadgeCounts() {
  drawRosterCounts(ctx, screenAt);
}

// and how many are waiting on each stand
export function drawKitStandCounts() {
  drawKitCounts(screenAt);
}

// and how many doses stand ready on the apothecary table
export function drawStockCounts() {
  drawStockCount(screenAt);
}
