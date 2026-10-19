// The shot (shot.js; DESIGN.md, "One camera for every cutscene"), on the case
// that made it necessary: the act 3 intro, the house's fall to the pair's
// arrival in the afterlife, played the way a player plays it -- the go-on card
// over the house pressed (`__goOn`, what its click calls) -- and watched a
// frame at a time. On every frame, from the bands first standing full to the
// arrival's last:
//   - both bands at their full depth;
//   - the zoom on the glass moving only while the shot says it is moving;
//   - what shows between the bands never under the floor or over the sky of
//     what the camera may frame;
//   - the frame the shot is on never off the window for longer than one glide;
// and the way up as the owner chose it (2026-10-19, heaven's gates are the
// portal): the two of them between the bands on every frame of the climb up
// the cloud stair, and one ripple, out of the gates into the afterlife, as
// they go through.
//
// Frames are turned with `__fast` rather than `run`: a reload drops a scene
// (persist.js reads no yard beat back) and this is about one scene's frames.
import { yard, group, ok } from './helpers.mjs';
import { SCENES } from '../src/scenes.js';
import { CUT_PAN_MAX_S } from '../src/config.js';

const S = yard.S;
const { bandCells, limitsOf } = await import('../src/shot.js');
const { beatDone } = await import('../src/beats.js');
const { pairBodies } = await import('../src/ghosts.js');
const { WORKER } = await import('../src/config.js');

group('the act 3 intro follows them up the stair and through the gates, its bands, zoom and frame held, from the fall to the arrival', async () => {
  window.__board = () => {};
  SCENES['act3-start'].run();
  let n = 0;
  while (!window.__goOn() && n++ < 60 * 30) window.__fast(1 / 60);
  const pressed = n < 60 * 30;

  const full = bandCells();
  let frames = 0, banded = false, thin = null, zoomed = null, under = null, over = null;
  let off = 0, offMost = 0, offAt = null, lost = null, climbFrames = 0, wasZoom = S.zoomShow;
  const ripples = [];
  let wasTo = null;
  const places = new Set();
  for (let f = 0; f < 60 * 120 && !beatDone('arrive'); f++) {
    window.__fast(1 / 60);
    frames++;
    const sh = window.__shot();
    places.add(sh.place);
    const at = `frame ${f} ${sh.beat}/${sh.phase} in ${sh.place}`;
    if (S.viewTo != null && S.viewTo !== wasTo) ripples.push(`${S.viewTo} by ${window.__state().view}`);
    wasTo = S.viewTo;
    // the bands: full from the first frame they stand full
    const drawn = Math.round(S.hush * full);
    if (drawn >= full) banded = true;
    else if (banded && !thin) thin = `${at}: ${drawn} of ${full} cells`;
    // the zoom moves only while the shot moves
    if (Math.abs(sh.zoomShow - wasZoom) > 1e-9 && !sh.gliding && !zoomed) zoomed = `${at}: ${wasZoom} to ${sh.zoomShow}`;
    wasZoom = sh.zoomShow;
    // what shows between the bands stays inside what may be framed
    const L = limitsOf(sh.place), band = sh.bands * S.hush;
    if (sh.camY + sh.viewH - band > L.foot() + 0.5 && !under) under = `${at}: foot ${(sh.camY + sh.viewH - band).toFixed(0)} under ${L.foot()}`;
    const roomy = L.foot() - L.top() >= sh.viewH - 2 * band;
    if (roomy && sh.camY + band < L.top() - 0.5 && !over) over = `${at}: top ${(sh.camY + band).toFixed(0)} over ${L.top()}`;
    // the frame on the window
    const fr = sh.frame;
    const inside = fr && fr.x >= sh.camX - 0.5 && fr.x + fr.w <= sh.camX + sh.viewW + 0.5
      && fr.y >= sh.camY - 0.5 && fr.y + fr.h <= sh.camY + sh.viewH + 0.5;
    off = fr && !inside ? off + 1 : 0;
    if (off > offMost) { offMost = off; offAt = at; }
    // the climb: both of them between the bands every frame
    const p = S.acts && S.acts.pair, bodies = pairBodies();
    if (p && p.route === 'climb' && p.leg > 0) {
      climbFrames++;
      for (const b of bodies) {
        const seen = b.x >= sh.camX && b.x + WORKER <= sh.camX + sh.viewW && b.y >= sh.camY + band && b.y + WORKER <= sh.camY + sh.viewH - band;
        if (!seen && !lost) lost = `${at}: body at ${b.x.toFixed(0)},${b.y.toFixed(0)}`;
      }
    }
  }
  const arrived = beatDone('arrive');
  const glideMost = Math.ceil(CUT_PAN_MAX_S * 60);
  return [
    ok(pressed, 'the go-on card answers'),
    ok(arrived, 'the fall plays through to the arrival', `${frames} frames, ${S.beatsDone.slice(-3).join(' ')}`),
    ok(places.has('yard') && places.has('after'), 'from the yard into the afterlife', [...places].join(' ')),
    ok(ripples.length === 1 && ripples[0].startsWith('after'), 'by one ripple, out of the gates into the afterlife', ripples.join('; ')),
    ok(banded && !thin, 'both bands stand full from the first frame they reach full to the arrival\'s last', thin || ''),
    ok(!zoomed, 'the zoom on the glass moves only while the shot is moving', zoomed || ''),
    ok(!under, 'what shows between the bands is never under the floor of what may be framed', under || ''),
    ok(!over, 'and never over the top of its sky', over || ''),
    ok(offMost <= glideMost, 'the frame is never off the window for longer than one glide', `${offMost} frames at ${offAt}`),
    ok(climbFrames > 0 && !lost, 'both of them between the bands on every frame of the climb up the stair', lost || `${climbFrames} frames`)
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
