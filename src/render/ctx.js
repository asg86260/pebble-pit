// The one canvas and the one context every draw in the game paints on to.
// A leaf of its own: a layer that imported render.js back for its context
// would put a cycle under every file in this folder.

import '../ink.js';        // the palette, on every context's setters, before the first fill

const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');
export { canvas };
