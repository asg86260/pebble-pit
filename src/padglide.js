// Where the pad's focus marker is drawn (DESIGN.md, "Controller support",
// "The marker"; the owner's vote, 2026-10-12: corner brackets). It travels
// from where the thing it was on was seen to the thing it is on, eased in
// and out, at no more than PAD_GLIDE_SPEED; lands from two cells out, then
// one; and then breathes a cell out and back from rest, a pose a half
// second. It fades in from nothing and out to nothing, never a pop. Nothing
// here knows what the focus is on: pad.js and padpage.js aim it at a box and
// the two drawings (the yard's layer, render/padmark.js, and the page's,
// padpage.js) read it.
//
// A box is in one of two spaces: the yard's world units, cells of `P`, or
// the page's CSS pixels, cells of PAD_PAGE_CELL. The glide itself is on the
// glass, in CSS pixels (the owner, 2026-10-16: "i also want to see the corner
// bracket transition between elements"): it starts where the old box was
// seen when the press came and ends on the new box where it is seen now, so
// a camera gliding after the focus carries the end along rather than the
// whole marker, and a focus going from the yard up to the corner cards, or
// from a station into its board, travels across rather than starting over.

import { P, PAD_GLIDE_MS, PAD_GLIDE_SPEED, PAD_SETTLE_STEP_MS, PAD_SETTLE_CELLS, PAD_BREATH_MS, PAD_PAGE_CELL,
         PAD_FADE_MS } from './config.js';
import { S } from './state.js';
import { reducedMotion } from './prefs.js';

// `from` is a box on the glass with its cell (`u`), frozen at the press;
// `to` the box aimed at, in its own space, read on the glass every frame.
let from = null, to = null, at = 0, dur = 0, id = null, space = null;
// When the marker came up from nothing (it fades in from there), and the
// last pose it stood in once it was put away (it fades out in that pose).
let shownAt = 0, ghost = null;

const unitOf = sp => (sp === 'page' ? PAD_PAGE_CELL : P);
// Smooth at both ends: no first frame that leaps most of the way.
const easeInOut = k => (1 - Math.cos(Math.PI * k)) / 2;
// The glass and back. The yard's box is world units under the camera; the
// page's is already CSS pixels.
const zoom = () => S.zoom || 1;
const onGlass = (b, sp) => (sp === 'yard'
  ? { x: (b.x - S.camX) * zoom(), y: (b.y - S.camY) * zoom(), w: b.w * zoom(), h: b.h * zoom(), u: P * zoom() }
  : { x: b.x, y: b.y, w: b.w, h: b.h, u: PAD_PAGE_CELL });
const offGlass = (g, sp) => (sp === 'yard'
  ? { r: { x: g.x / zoom() + S.camX, y: g.y / zoom() + S.camY, w: g.w / zoom(), h: g.h / zoom() }, u: g.u / zoom() }
  : { r: { x: g.x, y: g.y, w: g.w, h: g.h }, u: g.u });

// Aim at a thing by its id and its box now. The same id again only moves the
// end of the glide (a body walking, the coil swaying); a new one starts a
// glide from wherever the marker is seen now, in either space.
export function aim(newId, box, sp, t) {
  if (!box) { clear(t); return; }
  if (newId === id && sp === space) { to = box; return; }
  if (!to) { shownAt = t; ghost = null; }
  // Under reduced motion the marker is there at once, as the camera is.
  from = to && !reducedMotion() ? glassAt(t) : null;
  to = box;
  at = t;
  id = newId;
  space = sp;
  // Long enough that no frame of it moves further than the speed allows, the
  // ease's steepest middle included (half again as fast as its average).
  const end = onGlass(to, space);
  const far = from ? Math.max(Math.hypot(end.x - from.x, end.y - from.y), Math.abs(end.w - from.w), Math.abs(end.h - from.h)) : 0;
  dur = from ? Math.max(PAD_GLIDE_MS, (far * Math.PI / 2) / PAD_GLIDE_SPEED * 1000) : 0;
}
// Put away: the pose it stood in is kept for its fade (`markAt`).
export function clear(t = performance.now()) {
  if (to) { const m = markAt(t); ghost = m && { ...m, landed: false, at: t, alpha0: m.alpha }; }
  from = to = null; id = null; space = null;
}
export const aimedAt = () => id;
export const aimedSpace = () => space;

// Where the glide has got to, on the glass.
function glassAt(t) {
  if (!to) return null;
  const end = onGlass(to, space);
  if (!from || !dur) return end;
  const k = Math.min(1, Math.max(0, (t - at) / dur));
  const e = easeInOut(k);
  const lerp = (a, b) => a + (b - a) * e;
  return { x: lerp(from.x, end.x), y: lerp(from.y, end.y), w: lerp(from.w, end.w), h: lerp(from.h, end.h), u: lerp(from.u, end.u) };
}

// The idle breath (the owner's vote, 2026-10-15, option A): all four corners
// a cell out together and back, each pose held PAD_BREATH_MS, whole cells,
// from rest. `still` is how long the mark has stood still; the keyboard's
// mark (focusmark.js) breathes by the same count.
export const breathOut = still => (reducedMotion() || still < 0 ? 0 : Math.floor(still / PAD_BREATH_MS) % 2);

// What to draw now: the box and its cell in the space it is aimed in, how
// many cells out the brackets stand, whether it has landed (the tip waits
// for that), how far faded in, 0 to 1, and the box on the glass (`seen`,
// CSS pixels) for whoever measures it.
export function markAt(t) {
  if (!to) {
    if (!ghost || reducedMotion()) return null;
    const k = (t - ghost.at) / PAD_FADE_MS;
    if (k >= 1) { ghost = null; return null; }
    // The ghost stands where it was seen, as the camera goes on moving.
    const back = offGlass(ghost.seen, ghost.space);
    return { ...ghost, r: back.r, unit: back.u, alpha: ghost.alpha0 * (1 - k) };
  }
  const since = t - at - dur;
  const moving = since < 0;
  const landing = PAD_SETTLE_CELLS * PAD_SETTLE_STEP_MS;
  let out = 1;
  // Reduced motion: no landing and no breath, one settled pose.
  if (!moving && !reducedMotion()) {
    const settle = Math.max(0, PAD_SETTLE_CELLS - Math.floor(since / PAD_SETTLE_STEP_MS));
    out += settle || breathOut(since - landing);
  }
  const alpha = reducedMotion() ? 1 : Math.min(1, Math.max(0, (t - shownAt) / PAD_FADE_MS));
  const seen = glassAt(t);
  // Landed, the box is the thing's own, on its own cells; on the way, the
  // glass's box read back into the space it is going to.
  const back = moving ? offGlass(seen, space) : { r: to, u: unitOf(space) };
  return { r: back.r, out, space, landed: !moving && since >= landing,
           since: Math.max(0, since), unit: back.u, alpha, seen };
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
