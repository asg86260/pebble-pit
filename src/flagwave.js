// The yard's flag wave, as one pure function, so the goal card's ribbon ripples
// with the same sine as the pennants on the roofs (render/aura.js) instead of a
// copy of its math. `u` is how far along the cloth, 0 at the wrapped end to 1 at
// the free one; the seed staggers pace and phase so no two cloths beat together.
export function flagRip(t, u, seed, ms, waves) {
  return Math.sin((t / (ms * (0.85 + 0.3 * seed)) - u * waves) * Math.PI * 2 + seed * 7);
}
