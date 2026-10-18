// The shot (shot.js; DESIGN.md, "One camera for every cutscene"), on the case
// that made it necessary: the act 3 intro, the house's fall to the pair's
// arrival in the afterlife, played the way a player plays it -- the go-on card
// over the house pressed (`__goOn`, what its click calls) -- and watched a
// frame at a time. On every frame, from the bands first standing full to the
// arrival's last:
//   - both bands at their full depth;
//   - the zoom on the glass moving only under the ripple between two places;
//   - what shows between the bands never under the place's floor or over the
//     top of its sky;
//   - the frame the shot is on never off the window for longer than one
//     glide and one ripple;
// and, the bug the owner saw, nothing drops or climbs once the ripple has
// landed in the afterlife: the window held on the cloud floor where the two of
// them come up, not walked up through the empty sky beneath it.
//
// Frames are turned with `__fast` rather than `run`: a reload drops a scene
// (persist.js reads no yard beat back) and this is about one scene's frames.
import { yard, group, ok } from './helpers.mjs';
import { SCENES } from '../src/scenes.js';
import { CUT_PAN_MAX_S, VIEW_GLIDE_S } from '../src/config.js';

const S = yard.S;
const { bandCells, PLACE_LIMITS } = await import('../src/shot.js');
const { beatDone } = await import('../src/beats.js');

group('the act 3 intro holds its bands, its zoom and its frame from the fall to the arrival', async () => {
  window.__board = () => {};
  SCENES['act3-start'].run();
  let n = 0;
  while (!window.__goOn() && n++ < 60 * 30) window.__fast(1 / 60);
  const pressed = n < 60 * 30;

  const full = bandCells();
  let frames = 0, banded = false, thin = null, zoomed = null, under = null, over = null;
  let off = 0, offMost = 0, offAt = null, landedAt = null, climb = 0, climbAt = null, wasZoom = S.zoomShow;
  let landY = null, places = new Set();
  for (let f = 0; f < 60 * 120 && !beatDone('arrive'); f++) {
    window.__fast(1 / 60);
    frames++;
    const sh = window.__shot();
    places.add(sh.place);
    const at = `frame ${f} ${sh.beat}/${sh.phase} in ${sh.place}`;
    // the bands: full from the first frame they stand full
    const drawn = Math.round(S.hush * full);
    if (drawn >= full) banded = true;
    else if (banded && !thin) thin = `${at}: ${drawn} of ${full} cells`;
    // the zoom moves under the ripple, and only there
    if (Math.abs(sh.zoomShow - wasZoom) > 1e-9 && S.viewTo == null && !zoomed) zoomed = `${at}: ${wasZoom} to ${sh.zoomShow}`;
    wasZoom = sh.zoomShow;
    // what shows between the bands stays inside the place
    const L = PLACE_LIMITS[sh.place], band = sh.bands * S.hush;
    if (sh.camY + sh.viewH - band > L.foot() + 0.5 && !under) under = `${at}: foot ${(sh.camY + sh.viewH - band).toFixed(0)} under ${L.foot()}`;
    const roomy = L.foot() - L.top() >= sh.viewH - 2 * band;
    if (roomy && sh.camY + band < L.top() - 0.5 && !over) over = `${at}: top ${(sh.camY + band).toFixed(0)} over ${L.top()}`;
    // the frame on the window
    const fr = sh.frame;
    const inside = fr && fr.x >= sh.camX - 0.5 && fr.x + fr.w <= sh.camX + sh.viewW + 0.5
      && fr.y >= sh.camY - 0.5 && fr.y + fr.h <= sh.camY + sh.viewH + 0.5;
    off = fr && !inside ? off + 1 : 0;
    if (off > offMost) { offMost = off; offAt = at; }
    // once landed up there, the window holds
    if (sh.place === 'after' && S.viewTo == null && landedAt == null) { landedAt = f; landY = sh.camY; }
    if (landedAt != null && !beatDone('house-fall')) {
      const d = Math.abs(sh.camY - landY);
      if (d > climb) { climb = d; climbAt = at; }
    }
  }
  const arrived = beatDone('arrive');
  const glideMost = Math.ceil((CUT_PAN_MAX_S + VIEW_GLIDE_S) * 60);
  return [
    ok(pressed, 'the go-on card answers'),
    ok(arrived, 'the fall plays through to the arrival', `${frames} frames, ${S.beatsDone.slice(-3).join(' ')}`),
    ok(places.has('yard') && places.has('after'), 'from the yard into the afterlife', [...places].join(' ')),
    ok(banded && !thin, 'both bands stand full from the first frame they reach full to the arrival\'s last', thin || ''),
    ok(!zoomed, 'the zoom on the glass moves only while the ripple covers the window', zoomed || ''),
    ok(!under, 'what shows between the bands is never under the place\'s floor', under || ''),
    ok(!over, 'and never over the top of its sky', over || ''),
    ok(offMost <= glideMost, 'the frame is never off the window for longer than one glide and one ripple', `${offMost} frames at ${offAt}`),
    ok(landedAt != null && climb < 1, 'nothing drops or climbs once the ripple has landed in the afterlife', `${climb.toFixed(1)} px at ${climbAt}`)
  ];
});

// A cutscene's own zoom (shot.js, `zoom` on a request), on the kill: the last
// blow struck the way the scene strikes it, then the frames turned until he
// is out and has met her. The zoom moves only while the shot says it is
// moving, it pulls in, and wherever it rests it rests on a whole cell.
group("a cutscene's own zoom glides with its pan, and rests on a whole cell", async () => {
  window.__board = () => {};
  SCENES['finale-kill'].run();
  const from = S.zoomShow;
  let most = from, unglided = null, fractional = null, wasZoom = S.zoomShow;
  for (let f = 0; f < 60 * 60 && !beatDone('freed'); f++) {
    window.__fast(1 / 60);
    const sh = window.__shot();
    if (Math.abs(sh.zoomShow - wasZoom) > 1e-9 && !sh.gliding && !unglided) unglided = `frame ${f}: ${wasZoom} to ${sh.zoomShow}`;
    if (!sh.gliding && Math.abs(S.zoom - S.zoomShow) > 1e-9 && !fractional) fractional = `frame ${f}: drawn ${S.zoom}, shown ${S.zoomShow}`;
    wasZoom = sh.zoomShow;
    most = Math.max(most, S.zoomShow);
  }
  return [
    ok(beatDone('freed'), 'the kill plays through to their meeting'),
    ok(most > from * 1.3, 'it pulls in on him', `${from} to ${most}`),
    ok(!unglided, 'the zoom moves only while the shot is gliding', unglided || ''),
    ok(!fractional, 'and rests on a whole cell', fractional || ''),
  ];
});
