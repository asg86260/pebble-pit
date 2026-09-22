// The filter balloons the air filter sells: their posts in the yard, and the
// craft themselves among the clouds.

import { BALLOON_BASKET, BALLOON_FILTER_H, BALLOON_FILTER_W, BALLOON_H, BALLOON_W, CRAFT,
         aboard, craftAt, mastX, postY } from '../balloon.js';
import { DRAWN } from '../craftair.js';
import { fadeAt, murkTone } from '../weather.js';
import { P, WORKER } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { drawBody } from './crew.js';
import { GUESTS } from '../skyguests.js';

// The row of moorings beside the filter's dial, one a craft: a stake in the
// ground to the left of where the basket rests, the craft's tether tied off
// at its head while it is home. A stake with its craft away is still there to
// come back to.
const STAKE = 4;   // cells tall
export function drawBalloonPosts() {
  if (!S.filterOpen) return;
  ctx.fillStyle = '#000';
  for (let i = 0; i < CRAFT.length; i++) {
    const sx = Math.round((mastX(i) - P * 3) / P) * P, foot = Math.round(postY(i));
    ctx.fillRect(sx, foot - P * STAKE, P, P * STAKE);
    if (CRAFT[i].phase === 'moored') ctx.fillRect(sx + P, foot - P * STAKE, P * 2 - P / 2, P);
  }
}

// Each craft is drawn among the clouds (`drawClouds` in weather.js asks for
// these), between the sheets by its depth: behind the clouds nearer than it
// and in front of the ones behind. Sized and paled by its depth as a cloud of
// that sheet is, so a far balloon is small and grey and a near one full-sized
// and black.
export function skyGuests() {
  if (!S.filterOpen) return [];
  const out = [];
  for (let i = 0; i < CRAFT.length; i++) {
    const a = craftAt(i);
    out.push({ far: a.far, draw: () => drawCraft(i, a) });
  }
  return out;
}
GUESTS.list = skyGuests;

// One craft, drawn about the bottom-middle of its basket at its size: whole
// cells of its own, and not the lattice, since a balloon is not standing on
// anything and snapping it turns a slow drift into a six-pixel stutter.
function drawCraft(i, a) {
  ctx.save();
  ctx.translate(Math.round(a.x), Math.round(a.y));
  ctx.scale(a.s, a.s);
  ctx.globalAlpha = 1 - Math.max(0, fadeAt(a.far));
  drawDrawnIn(i);
  drawEnvelope(i);
  if (aboard(i)) drawBody(-WORKER / 2, -P - WORKER);
  drawBasket();
  ctx.restore();
  ctx.globalAlpha = 1;
}

const FTOP = -BALLOON_BASKET - BALLOON_FILTER_H;   // the filter's own top, from the basket's bottom

// The haze a working craft is drawing in: each cell on its way from where it
// started, round the craft, into the middle of the filter box. Behind the
// balloon, so the envelope stays a clean shape and the haze goes in out of
// sight. Drawn in the color the air is, so a filthy sky is a brown stream and
// a clean one a pale trickle.
function drawDrawnIn(i) {
  const cells = DRAWN[i];
  if (!cells || !cells.length) return;
  const cy = FTOP + BALLOON_FILTER_H / 2;
  ctx.fillStyle = murkTone();
  ctx.beginPath();
  for (const c of cells) {
    const d = c.d * (1 - c.t);
    ctx.rect(Math.round(Math.cos(c.a) * d / P) * P, Math.round((cy + Math.sin(c.a) * d) / P) * P, P, P);
  }
  ctx.fill();
}

// The envelope and the filter slung under it. The filter is the point of the
// drawing: without the vented box between bag and basket the craft is a nice
// picture of the wrong thing.
//
// Each craft has its own envelope, the way no two hot-air balloons at a field
// are the same, by the order they were bought in: plain, seamed, banded.
// `look` is the craft's index.
function drawEnvelope(look) {
  const w = BALLOON_W, h = BALLOON_H, fw = BALLOON_FILTER_W, fh = BALLOON_FILTER_H;
  const top = FTOP - P - h;                    // the crown, a course of lines over the box
  const cols = Math.round(w / P), rows = Math.round(h / P), neck = 3;
  ctx.fillStyle = '#000';
  // Round over the top and widest a little above the middle, then drawn in
  // on a curve to a neck the lines run down from.
  const widths = [];
  for (let n = 0; n < rows; n++) {
    const t = n / (rows - 1);
    const c = t < 0.6 ? Math.round(cols * Math.sqrt(Math.max(0.12, 1 - ((0.6 - t) / 0.6) ** 2)))
                      : Math.round(neck + (cols - neck) * Math.cos((t - 0.6) / 0.4 * Math.PI / 2));
    widths.push(Math.max(neck, c % 2 ? c : c + 1));
    ctx.fillRect(-widths[n] * P / 2, top + n * P, widths[n] * P, P);
  }
  ctx.fillStyle = '#fff';
  if (look % 3 === 1) {
    // gores: two seams from the crown down to the neck
    for (let n = 1; n < rows - 1; n++) {
      const half = (widths[n] - 1) / 2;
      const off = Math.round(half * 0.5);
      if (off >= 1) { ctx.fillRect(-off * P - P / 2, top + n * P, P, P); ctx.fillRect(off * P - P / 2, top + n * P, P, P); }
    }
  } else if (look % 3 === 2) {
    // a band round the widest part
    const n = widths.indexOf(Math.max(...widths));
    ctx.fillRect(-(widths[n] - 2) * P / 2, top + (n + 1) * P, (widths[n] - 2) * P, P);
  }
  ctx.fillStyle = '#000';
  // The lines from the neck down to the filter's shoulders.
  const fl = -fw / 2;
  ctx.fillRect(fl, FTOP - P, P, P);
  ctx.fillRect(fl + fw - P, FTOP - P, P, P);
  ctx.fillRect(-P / 2, FTOP - P, P, P);
  // The vents are what say filter rather than crate.
  ctx.fillRect(fl, FTOP, fw, P);
  for (let cx = 0; cx < Math.round(fw / P); cx++) {
    const open = cx > 0 && cx < Math.round(fw / P) - 1 && cx % 2 === 1;
    if (!open) ctx.fillRect(fl + cx * P, FTOP + P, P, P);
  }
  ctx.fillRect(fl, FTOP + P * 2, fw, fh - P * 2);
}

// The basket, hanging under the works on two lines, drawn over whoever is in
// it so they stand in it rather than on it.
function drawBasket() {
  const bw = P * 3, bl = -P * 1.5;
  ctx.fillStyle = '#000';
  ctx.fillRect(Math.round(bl) + P, -BALLOON_BASKET, P, BALLOON_BASKET - P * 2);
  ctx.fillRect(Math.round(bl) + bw - P * 2, -BALLOON_BASKET, P, BALLOON_BASKET - P * 2);
  ctx.fillRect(Math.round(bl), -P * 2, bw, P * 2);
}
