// The red ticks on the timeline: facts about consecutive recorded frames, pure
// so the selftest can hand them made-up frames. Each is a rule the shot is
// meant to keep (docs/wave-shot.md, "Checks"), named as the hover line says it.

import { CUT_PAN_PX_S } from '../config/cutscene.js';

export const DT = 0.1;                       // a recorded frame, in game seconds
export const CHECKS = {
  zoom: 'zoom changed while not gliding',
  pan: 'camera center moved more than a glide allows in one frame',
  box: 'frame box outside the window',
  band: 'hush not 1 or bands short while a beat holds',
};

const mid = s => ({ x: s.camX + s.viewW / 2, y: s.camY + s.viewH / 2 });

// -> one array of check names per frame.
export function runChecks(frames) {
  const full = Math.max(0, ...frames.filter(s => s.beat).map(s => s.bands || 0));
  return frames.map((s, i) => {
    const out = [];
    const p = i > 0 ? frames[i - 1] : null;
    if (p && !s.gliding && Math.abs((s.zoomShow ?? s.zoom) - (p.zoomShow ?? p.zoom)) > 1e-6) out.push('zoom');
    if (p && !s.gliding) {
      const a = mid(p), b = mid(s);
      if (Math.hypot(b.x - a.x, b.y - a.y) > CUT_PAN_PX_S * DT) out.push('pan');
    }
    const f = s.frame;
    if (f && (f.x < s.camX - 1 || f.y < s.camY - 1
        || f.x + f.w > s.camX + s.viewW + 1 || f.y + f.h > s.camY + s.viewH + 1)) out.push('box');
    if (s.beat && (s.hush < 0.999 || (s.bands || 0) < full - 0.5)) out.push('band');
    return out;
  });
}
