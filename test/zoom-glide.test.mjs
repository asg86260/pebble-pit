// Smooth zoom (DESIGN.md, "Zooming is smooth"): `setZoom` is a target the
// zoom on the glass (`S.zoomShow`) eases to over ZOOM_GLIDE_S, about the
// window's middle, while the world is only ever drawn at a whole number of
// device pixels a cell (`S.zoom`, the shown zoom snapped down); `setZoomNow`
// is the old cut. Screen and world meet in `toWorld`, which reads the zoom on
// the glass, so a pointer held still over the window's middle stays over the
// same point of the world through the whole glide.
import { yard, group, ok } from './helpers.mjs';
import { P, ZOOM_GLIDE_S } from '../src/config.js';

const S = yard.S;
const { setZoom, setZoomNow, toWorld, toScreen, zoomGliding, yardCell } = yard.world;

// Device pixels a cell is drawn across: whole, or the sand resamples.
const cellPx = z => P * z * S.dpr;
const whole = v => Math.abs(v - Math.round(v)) < 1e-6;
// The zoom `k` (a share of the yard's own) asks for, as the glass will show it.
const asked = k => { const u = yardCell() * S.dpr; return (yardCell() / P) * Math.round(u * k) / u; };

group('a zoom glides to its target, drawn at whole cells all the way, about the window\'s middle', async () => {
  window.__fast(1);
  // Over the middle of the yard, clear of its ends, so nothing clamps across.
  // Nothing else pointing the view: the opening seat's glide let go of.
  S.camTo = null;
  S.follow = null;
  S.camX = S.worldW / 2 - S.viewW / 2;
  yard.world.clampCam();
  const was = S.zoomShow, mid = toWorld(S.W / 2, S.H / 2);
  const to = asked(1.5);
  setZoom(1.5);
  let frames = 0, fraction = null, under = null, drift = 0, between = 0, foot = 0;
  for (let f = 0; f < 60 * (ZOOM_GLIDE_S + 1); f++) {
    window.__fast(1 / 60);
    frames++;
    if (!whole(cellPx(S.zoom)) && !fraction) fraction = `frame ${f}: ${cellPx(S.zoom)} device px a cell`;
    if (S.zoom > S.zoomShow + 1e-9 && !under) under = `frame ${f}: drawn ${S.zoom} over shown ${S.zoomShow}`;
    if (S.zoomShow > was + 1e-9 && S.zoomShow < to - 1e-9) between++;
    drift = Math.max(drift, Math.abs(toWorld(S.W / 2, S.H / 2).x - mid.x));
    // the yard keeps its floor on the foot of the window as the zoom moves
    foot = Math.max(foot, Math.abs(S.camY + S.viewH - S.worldH));
    if (!zoomGliding()) break;
  }
  const landed = { zoom: S.zoom, show: S.zoomShow, gliding: zoomGliding() };
  const after = toWorld(S.W / 2, S.H / 2);
  // and the two conversions agree with each other on the glass
  const back = toScreen(after.x, after.y);
  return [
    ok(between > 5, 'the zoom on the glass passes through the sizes between', `${between} frames between ${was} and ${to}`),
    ok(frames <= Math.ceil(ZOOM_GLIDE_S * 60) + 2, 'over the glide\'s length', `${frames} frames`),
    ok(!fraction, 'the world is never drawn at a fractional cell', fraction || ''),
    ok(!under, 'and only ever scaled up onto the glass, never down', under || ''),
    ok(!landed.gliding && landed.show === to && landed.zoom === to, 'it lands exactly on its target, drawn and shown alike', JSON.stringify(landed)),
    ok(drift < 1e-6 && Math.abs(after.x - mid.x) < 1e-6, 'a pointer at the window\'s middle is over the same world point before, during and after',
       `drift ${drift}, ${mid.x} then ${after.x}`),
    ok(foot < 1e-6, 'the yard\'s floor stays on the foot of the window', `${foot}`),
    ok(Math.abs(back.x - S.W / 2) < 1e-6 && Math.abs(back.y - S.H / 2) < 1e-6, 'and toScreen undoes toWorld', JSON.stringify(back))
  ];
});

group('setZoomNow cuts, and a target asked for again changes nothing', async () => {
  window.__fast(1);
  const to = asked(1.25);
  setZoomNow(1.25);
  const cut = { zoom: S.zoom, show: S.zoomShow, gliding: zoomGliding(), viewW: S.viewW };
  setZoom(1.25);
  const again = zoomGliding();
  setZoom(1);
  window.__fast(3 / 60);
  const moving = zoomGliding() && S.zoomShow < to && S.zoomShow > asked(1);
  setZoomNow(1);
  return [
    ok(cut.zoom === to && cut.show === to && !cut.gliding, 'the zoom is there on the same frame, nothing gliding', JSON.stringify(cut)),
    ok(Math.abs(cut.viewW - S.W / to) < 1e-9, 'and the window measured off it', `${cut.viewW}`),
    ok(!again, 'the same target again starts no glide'),
    ok(moving, 'a new target glides', `${S.zoomShow}`),
    ok(!zoomGliding() && S.zoomShow === S.zoom, 'and a cut stops a glide under way')
  ];
});
