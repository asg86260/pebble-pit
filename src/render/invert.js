// Turning part of the frame over: the deep's negative (render/deep.js) and the
// grit off a hammer (render/buildsites.js). Either is `difference` against
// white, which is exact everywhere and quick in Chrome; but Firefox's canvas
// on the graphics card has no `difference` blend, so each such fill takes the
// whole window off the card, turns it on the processor and sends it back --
// and a canvas that does that on enough of its first frames is taken off the
// card for good, so the whole game, both halves, is drawn on the processor
// from then on (PERF.md, "The deep in Firefox"). There, the frame drawn back
// over itself through an `invert` filter is the same picture and stays on the
// card.
//
// Chrome's filter lands a channel a step off 255 minus itself on about a fifth
// of colors, and Firefox's own software canvas (under 128 px, or with no GPU)
// is off too; a context with no `filter` (older Safari) would draw the frame
// over itself unturned. So the filter is asked once, on a scrap of every
// channel value, and used only where it turns each one over exactly. Until
// that answer is in, the filter is used wherever there is one: a frame or two
// a step off in Chrome is invisible, and a `difference` fill on Firefox's
// first frames is exactly what takes its canvas off the card.

import { INVERT_PROBE, INVERT_PROBE_SIDE } from '../config.js';
import { raw } from '../ink.js';

let exact = null, asked = false;

function filterIsExact() {
  try {
    const c = document.createElement('canvas'), n = INVERT_PROBE_SIDE;
    c.width = c.height = INVERT_PROBE;
    const g = c.getContext('2d');
    if (typeof g.filter !== 'string') return false;
    for (let i = 0; i < n * n; i++) {
      g.fillStyle = raw(`rgb(${i & 255},${(i * 7) & 255},${(i * 13) & 255})`);
      g.fillRect(i % n, Math.floor(i / n), 1, 1);
    }
    const before = g.getImageData(0, 0, n, n).data;
    g.filter = 'invert(1)';
    g.drawImage(c, 0, 0);
    const after = g.getImageData(0, 0, n, n).data;
    for (let i = 0; i < after.length; i++) {
      if ((i & 3) !== 3 && after[i] !== 255 - before[i]) return false;
    }
    return true;
  } catch { return false; }
}

// Whether to turn the frame over through the filter rather than a
// `difference` fill. The probe is asked after the frame rather than inside
// it: a readback in the middle of the frame's own drawing upset the headless
// Chrome's next frames.
export function invertByFilter(g) {
  if (exact !== null) return exact;
  if (!asked) { asked = true; setTimeout(() => { exact = filterIsExact(); }, 0); }
  return typeof g.filter === 'string';
}
