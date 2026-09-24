// The one canvas and the one context every draw in the game paints on to.
// A leaf of its own: a layer that imported render.js back for its context
// would put a cycle under every file in this folder.

import '../ink.js';        // the palette, on every context's setters, before the first fill

const screen = document.getElementById('c');
export let ctx = screen.getContext('2d');
export let canvas = screen;

// Every layer paints on `ctx`, so the far half through the ripple between the
// halves (render/ripple.js) is put on a sheet of its own by pointing `ctx` at
// the sheet for the length of `fn`, and back at the window after, whatever
// `fn` throws. The sheet is the window's size, so a layer that measures
// `canvas` or reads `ctx.canvas` back finds the same frame it would there.
export function paintOn(sheet, fn) {
  const was = ctx, wasCanvas = canvas;
  ctx = sheet.getContext('2d');
  canvas = sheet;
  try { fn(); } finally { ctx = was; canvas = wasCanvas; }
}
