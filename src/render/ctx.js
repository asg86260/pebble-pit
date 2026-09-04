// The one canvas and the one context every draw in the game paints on to.
//
// It lives in a leaf of its own so that nothing has to reach back through
// render.js to get at it. render.js is the painting order now -- a list that
// imports every layer -- and a layer that imported render.js back for its
// context would put a cycle under every file in this folder.

const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');
export { canvas };
