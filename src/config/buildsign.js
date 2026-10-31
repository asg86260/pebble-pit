// The build sign: a signboard on a post staked in an empty lot, its name over
// its price, the lot's first build bought off it (src/buildsign.js). The
// owner voted its look as the review's mock D drew it (2026-10-30); these are
// that drawing's sizes.
import { P } from './yard.js';

// The board, in cells: the name on one line, the price on the next.
export const SIGN_PLATE = 7;
// The post under it, in cells, down into the ground under the board's middle.
export const SIGN_POST = 4;
// Where the name and the price stand on the board, in cells from its top, and
// the price line's height in cells.
export const SIGN_WORD_AT = 1;
export const SIGN_BILL_AT = 3.5;
export const SIGN_BILL_H = 2.5;
// The air between a coin's mark and its count, and between one coin and the
// next on the price line, px.
export const SIGN_GAP = 4;
export const SIGN_COIN_GAP = 10;
// How tall a coin's mark is drawn, px: whole pixels a cell of the mark, near
// the type's height.
export const SIGN_MARK = 10;
// How far past the drawing a press still counts as on it.
export const SIGN_HIT = P;
// How long it takes to fade in or out.
export const SIGN_FADE_MS = 200;
