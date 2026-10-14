// The curves every motion in the game is drawn through, one copy of each
// (docs/design-language/canvas.md, "Motion"). Travel eases; a reaction to a
// blow is a held pose, stepped with `held`; nothing else gets a curve of its
// own. A leaf: imports nothing, so the sim, the drawing and the tools can all
// reach it.

export const clamp01 = k => (k <= 0 ? 0 : k >= 1 ? 1 : k);
export const lerp = (a, b, k) => a + (b - a) * k;

// In and out, the same at both ends: anything that sets off and arrives.
export const smoothstep = k => { k = clamp01(k); return k * k * (3 - 2 * k); };
// Fast away, soft in: a thing thrown or a view settling.
export const outCubic = k => 1 - (1 - clamp01(k)) ** 3;
// In and out on a square, slower to leave than smoothstep: a body's own step.
export const quadInOut = k => { k = clamp01(k); return k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; };

// The pose a table of held poses (`{ s, ... }`, each held `s`) is in at `k`
// (0..1) of the way through it: the table's own timings, stretched or
// squeezed to whatever length the caller's move has.
export function poseAt(table, k) {
  let total = 0;
  for (const p of table) total += p.s;
  let u = clamp01(k) * total;
  for (const p of table) { if (u < p.s) return p; u -= p.s; }
  return table[table.length - 1];
}
// The highest a table's poses lift, for a caller scaling it to its own height.
export const topOf = table => table.reduce((m, p) => Math.max(m, p.lift || 0), 0);

// A held step: which of `steps` poses `k` (0..1) is in, from 0, as a share
// (0, 1/steps, ...). Always the floor, so a pose is held for its whole step
// and the last one is reached only at the end. A hair over, so a share that
// is a whole step in arithmetic (0.6 of 5) is not a float short of it.
export const held = (k, steps) => Math.min(steps, Math.floor(clamp01(k) * steps + 1e-6)) / steps;
