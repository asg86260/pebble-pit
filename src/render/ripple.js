// The far half through the ripple between the halves (view.js, `ripple`), and
// what is done while the yard is idle so the ripple does not stall.
//
// The deep inside the ripple used to be drawn on the window under the
// ripple's circle as a clip. Firefox's canvas on the graphics card takes a
// clip that is not a rectangle as a mask, and every fill under it pays for
// the mask: with the deep's few hundred draws under it, a tenth of the
// ripple's frames took 25 to 40 ms where either half alone takes under ten
// (PERF.md, "The ripple in Firefox").
// So the far half is drawn on a sheet the window's size, clipped only to the
// square round the circle, and put on the window through the circle in one
// draw. The picture is the same; only the rim's one pixel of smoothing is
// taken once rather than a layer at a time.
//
// And the first frame of the ripple down used to be the deep's first frame:
// its floor and stations painted into their images, its coil's code run for
// the first time, and the invert probe's readback (render/invert.js) a frame
// later -- tens of milliseconds in Firefox, a hundred or more in Chrome, in
// the middle of the glide. The probe is asked the first time the page is
// idle; the deep is drawn on the sheet a few times, unseen, the first times
// the page is idle with the portal standing, and again whenever the window
// changes size.

import { RIPPLE_WARM_PASSES, RIPPLE_WARM_WAIT_MS } from '../config.js';
import { askInvert } from './invert.js';
import { canvas, ctx, paintOn } from './ctx.js';

// The sheet, the window's size, and remade only when the window is: a canvas
// made or resized in the middle of the ripple is a fresh allocation on the
// card a frame.
let sheet = null;
function sheetOf() {
  sheet ??= document.createElement('canvas');
  if (sheet.width !== canvas.width) sheet.width = canvas.width;
  if (sheet.height !== canvas.height) sheet.height = canvas.height;
  return sheet;
}

// What a layer may have left on the window's context that the next one could
// lean on: carried over to the sheet's at the start of each ripple frame, as
// the one context used to carry it. The inks are the frame's resting black
// (a layer puts `fillStyle` back to it), set rather than copied: the palette
// (ink.js) maps a color as it is set, and a copied one would be mapped twice.
const CARRIED = ['font', 'textAlign', 'textBaseline', 'lineWidth', 'lineCap', 'lineJoin', 'imageSmoothingEnabled'];

// The far half, drawn by `drawFar` with its own camera already standing, into
// the circle `rip` (screen pixels) on the window.
export function drawThrough(rip, dpr, drawFar) {
  const g = ctx, c = canvas;
  const x0 = Math.max(0, Math.floor((rip.cx - rip.r) * dpr) - 1);
  const y0 = Math.max(0, Math.floor((rip.cy - rip.r) * dpr) - 1);
  const x1 = Math.min(c.width, Math.ceil((rip.cx + rip.r) * dpr) + 1);
  const y1 = Math.min(c.height, Math.ceil((rip.cy + rip.r) * dpr) + 1);
  if (x1 <= x0 || y1 <= y0) return;
  const s = sheetOf();
  paintOn(s, () => {
    ctx.save();
    for (const k of CARRIED) ctx[k] = g[k];
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(x0, y0, x1 - x0, y1 - y0);
    ctx.clip();
    drawFar();
    ctx.restore();
  });
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.beginPath();
  g.arc(rip.cx * dpr, rip.cy * dpr, rip.r * dpr, 0, Math.PI * 2);
  g.clip();
  g.drawImage(s, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  g.restore();
}

// Called every frame with whether the ripple could run from here (the
// portal stands, no glide is under way) and a pass of the far half to draw
// unseen. Asks the probe at the first idle moment, then draws the passes one
// idle moment apart, once for each size the window has been.
let probed = false, warmFor = '', passes = 0, waiting = false;
export function warmRipple(ready, pass) {
  if (waiting) return;
  const key = `${canvas.width}x${canvas.height}`;
  if (probed && (warmFor === key || !ready())) return;
  waiting = true;
  idle(() => {
    waiting = false;
    if (!probed) { probed = true; askInvert(); return; }
    // Stale by the time it ran: the glide started, or the window changed.
    if (!ready() || `${canvas.width}x${canvas.height}` !== key) return;
    paintOn(sheetOf(), () => { ctx.save(); pass(); ctx.restore(); });
    if (++passes >= RIPPLE_WARM_PASSES) { warmFor = key; passes = 0; }
  });
}

// The next moment the page has nothing to do, or the wait's end if it never
// has: at the screen's full rate on a heavy yard there may be no idle time
// at all, and the pass is then one frame's worth of work between two frames.
const idle = fn => (typeof requestIdleCallback === 'function'
  ? requestIdleCallback(fn, { timeout: RIPPLE_WARM_WAIT_MS })
  : setTimeout(fn, RIPPLE_WARM_WAIT_MS));
