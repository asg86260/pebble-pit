// Where the pad's focus marker is drawn (DESIGN.md, "Controller support",
// "The marker"; the owner's vote, 2026-10-12: corner brackets). It glides
// from the thing it was on to the thing it is on in PAD_GLIDE_MS, fast out
// and soft in, on whole cells; lands from two cells out, then one; and then
// breathes a cell out and back from rest, a pose a half second. It fades in
// from nothing and out to nothing, never a pop. Nothing here knows
// what the focus is on: pad.js aims it at a box and the two drawings (the
// yard's layer, render/padmark.js, and the page's, padpage.js) read it.
//
// A box is in one of two spaces: the yard's world units, cells of `P`, or
// the page's CSS pixels, cells of PAD_PAGE_CELL. A glide never crosses from
// one to the other: a focus going from a station into its board lands on
// the row as if it had arrived there.

import { P, PAD_GLIDE_MS, PAD_SETTLE_STEP_MS, PAD_SETTLE_CELLS, PAD_BREATH_MS, PAD_PAGE_CELL, PAD_FADE_MS } from './config.js';
import { reducedMotion } from './prefs.js';

let from = null, to = null, at = 0, id = null, space = null;
// When the marker came up from nothing (it fades in from there), and the
// last pose it stood in once it was put away (it fades out in that pose).
let shownAt = 0, ghost = null;

const unitOf = sp => (sp === 'page' ? PAD_PAGE_CELL : P);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const snap = (v, u) => Math.round(v / u) * u;

// Aim at a thing by its id and its box now. The same id again only moves the
// end of the glide (a body walking, the coil swaying); a new one starts a
// glide from wherever the marker is drawn now, in the same space.
export function aim(newId, box, sp, t) {
  if (!box) { clear(t); return; }
  if (newId === id && sp === space) { to = box; return; }
  // From nothing, or across from the page to the yard (a glide never
  // crosses), it fades in where it lands.
  if (!to || sp !== space) { shownAt = t; ghost = null; }
  // Under reduced motion the marker is there at once, as the camera is.
  const was = sp === space && to && !reducedMotion() ? drawnBox(t) : null;
  from = was;
  to = box;
  at = t;
  id = newId;
  space = sp;
}
// Put away: the pose it stood in is kept for its fade (`markAt`).
export function clear(t = performance.now()) {
  if (to) { const m = markAt(t); ghost = m && { ...m, landed: false, at: t, alpha0: m.alpha }; }
  from = to = null; id = null; space = null;
}
export const aimedAt = () => id;
export const aimedSpace = () => space;

// The box the glide has got to, on whole cells of its space.
function drawnBox(t) {
  if (!to) return null;
  if (!from) return to;
  const k = Math.min(1, Math.max(0, (t - at) / PAD_GLIDE_MS));
  const e = easeOut(k), u = unitOf(space);
  const lerp = (a, b) => snap(a + (b - a) * e, u);
  return { x: lerp(from.x, to.x), y: lerp(from.y, to.y), w: lerp(from.w, to.w), h: lerp(from.h, to.h) };
}

// The idle breath (the owner's vote, 2026-10-15, option A): all four corners
// a cell out together and back, each pose held PAD_BREATH_MS, whole cells,
// from rest. `still` is how long the mark has stood still; the keyboard's
// mark (focusmark.js) breathes by the same count.
export const breathOut = still => (reducedMotion() || still < 0 ? 0 : Math.floor(still / PAD_BREATH_MS) % 2);

// What to draw now: the box, how many cells out the brackets stand, the
// space, whether it has landed (the tip waits for that), and how far faded
// in, 0 to 1 -- in from nothing, out to nothing, never a pop.
export function markAt(t) {
  if (!to) {
    if (!ghost || reducedMotion()) return null;
    const k = (t - ghost.at) / PAD_FADE_MS;
    if (k >= 1) { ghost = null; return null; }
    return { ...ghost, alpha: ghost.alpha0 * (1 - k) };
  }
  const glide = from ? PAD_GLIDE_MS : 0;
  const since = t - at - glide;
  const moving = since < 0;
  const landing = PAD_SETTLE_CELLS * PAD_SETTLE_STEP_MS;
  let out = 1;
  // Reduced motion: no landing and no breath, one settled pose.
  if (!moving && !reducedMotion()) {
    const settle = Math.max(0, PAD_SETTLE_CELLS - Math.floor(since / PAD_SETTLE_STEP_MS));
    out += settle || breathOut(since - landing);
  }
  const alpha = reducedMotion() ? 1 : Math.min(1, Math.max(0, (t - shownAt) / PAD_FADE_MS));
  return { r: drawnBox(t), out, space, landed: !moving && since >= landing,
           since: Math.max(0, since), unit: unitOf(space), alpha };
}

// The cells of the brackets round a box, in cells of `unit`, `out` cells
// clear of it: four L-shaped corners, an arm half the short side long,
// between PAD_ARM_MIN and PAD_ARM_MAX. Each cell is [col, row].
export function bracketCells(r, out, unit, armMin, armMax) {
  const x0 = Math.floor(r.x / unit) - out, y0 = Math.floor(r.y / unit) - out;
  const x1 = Math.ceil((r.x + r.w) / unit) - 1 + out, y1 = Math.ceil((r.y + r.h) / unit) - 1 + out;
  const L = Math.min(armMax, Math.max(armMin, Math.floor(Math.min(x1 - x0, y1 - y0) / 2)));
  const cells = [];
  const run = (x, y, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) cells.push([x + i, y + j]); };
  run(x0, y0, L, 1); run(x0, y0 + 1, 1, L - 1);
  run(x1 - L + 1, y0, L, 1); run(x1, y0 + 1, 1, L - 1);
  run(x0, y1, L, 1); run(x0, y1 - L + 1, 1, L - 1);
  run(x1 - L + 1, y1, L, 1); run(x1, y1 - L + 1, 1, L - 1);
  return cells;
}

// The one-cell halo round those cells: every neighbor that is not itself one.
export function haloCells(cells) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const out = new Map();
  for (const [x, y] of cells) {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      const k = `${x + dx},${y + dy}`;
      if (!set.has(k)) out.set(k, [x + dx, y + dy]);
    }
  }
  return [...out.values()];
}
