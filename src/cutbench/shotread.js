// One reading of the camera per frame, in the shape docs/wave-shot.md gives
// `window.__shot()`. When the frame has no `__shot` (track A not landed) the
// same shape is composed from `__cutRead` (hooks.js) and `__framed`
// (console.js), and `src` says so; the bench writes "no shot readout" over
// the picture then, because `bands` and `gliding` are only approximations.

export function readShot(w) {
  if (typeof w.__shot === 'function') {
    const s = w.__shot();
    if (s) return { ...s, src: 'shot', done: w.__cutRead ? w.__cutRead().done : [] };
  }
  const c = w.__cutRead(), f = w.__framed();
  const k = c.zoom || 1;
  const r = f.rect;
  return {
    place: c.place, zoom: c.zoom, zoomShow: c.zoomShow, camX: c.camX, camY: c.camY,
    viewW: c.viewW, viewH: c.viewH,
    frame: r ? { x: c.camX + r.x / k, y: c.camY + r.y / k, w: r.w / k, h: r.h / k } : null,
    bands: f.band / k, hush: c.hush, beat: c.beat, phase: null,
    // Not known without the shot: "settled in its frame" stands in for "not gliding".
    gliding: !f.framed, src: 'fallback', done: c.done,
  };
}

// The name a phase mark carries, and what "reached a phase" means for the
// play-from-a-phase fast-forward.
export const labelOf = s => (s.beat ? s.beat + (s.phase != null ? ':' + s.phase : '') : '');
