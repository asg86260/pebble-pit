// The red ticks on the timeline: facts about consecutive recorded frames, pure
// so the selftest can hand them made-up frames. Each is a rule the shot is
// meant to keep (docs/wave-shot.md, "Checks"), named as the hover line says it.

import { CUT_PAN_PX_S } from '../config/cutscene.js';

export const DT = 0.1;                       // a recorded frame, in game seconds
export const CHECKS = {
  zoom: 'zoom changed while not gliding',
  pan: 'camera center moved more than a glide allows in one frame',
  box: 'frame box outside the window',
  band: 'the bands dip while the shot holds',
};

const mid = s => ({ x: s.camX + s.viewW / 2, y: s.camY + s.viewH / 2 });

// -> one array of check names per frame.
export function runChecks(frames) {
  // Band height is compared on the glass: in world pixels it changes with the
  // zoom, which a place change is allowed to do under the ripple.
  const glass = s => (s.bands || 0) * (s.zoomShow ?? s.zoom ?? 1);
  const full = Math.max(0, ...frames.filter(s => s.beat).map(glass));
  // The bands ease in at a scene's start and out at its end on purpose; a
  // band is only short if it dips between the first frame they are full and
  // the last.
  const isFull = s => s.beat && s.hush >= 0.999 && glass(s) >= full - 0.5;
  const first = frames.findIndex(isFull);
  const last = frames.length - 1 - [...frames].reverse().findIndex(isFull);
  return frames.map((s, i) => {
    const out = [];
    const p = i > 0 ? frames[i - 1] : null;
    // A frame is a tenth of a second of several steps: a glide that was under
    // way at the last frame and landed somewhere in this one moved on purpose
    // all the way, so either end gliding covers the move between them.
    const moving = s.gliding || (p && p.gliding);
    if (p && !moving && Math.abs((s.zoomShow ?? s.zoom) - (p.zoomShow ?? p.zoom)) > 1e-6) out.push('zoom');
    if (p && !moving) {
      const a = mid(p), b = mid(s);
      if (Math.hypot(b.x - a.x, b.y - a.y) > CUT_PAN_PX_S * DT) out.push('pan');
    }
    // While the camera is gliding to a frame, or rippling into the place it is
    // in, the frame is where it is going, not where it is.
    const f = s.gliding ? null : s.frame;
    if (f && (f.x < s.camX - 1 || f.y < s.camY - 1
        || f.x + f.w > s.camX + s.viewW + 1 || f.y + f.h > s.camY + s.viewH + 1)) out.push('box');
    if (first >= 0 && i > first && i < last && !isFull(s)) out.push('band');
    return out;
  });
}
