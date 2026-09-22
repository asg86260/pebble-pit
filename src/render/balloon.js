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

// The row of posts beside the filter's dial, one a craft, each standing up to
// where its basket sits when it is home. A post with its craft away is still
// there to come back to.
export function drawBalloonPosts() {
  if (!S.filterOpen) return;
  ctx.fillStyle = '#000';
  for (let i = 0; i < CRAFT.length; i++) {
    const top = Math.round(postY(i));
    ctx.fillRect(Math.round(mastX(i) - P / 2), top, P, Math.max(0, S.groundY - top));
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

// One craft, drawn about the bottom-middle of its basket at its size: whole
// cells of its own, and not the lattice, since a balloon is not standing on
// anything and snapping it turns a slow drift into a six-pixel stutter.
function drawCraft(i, a) {
  ctx.save();
  ctx.translate(Math.round(a.x), Math.round(a.y));
  ctx.scale(a.s, a.s);
  ctx.globalAlpha = 1 - Math.max(0, fadeAt(a.far));
  drawDrawnIn(i);
  drawEnvelope();
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
function drawEnvelope() {
  const w = BALLOON_W, h = BALLOON_H, fw = BALLOON_FILTER_W, fh = BALLOON_FILTER_H;
  const top = FTOP - h;                        // the crown of the envelope
  ctx.fillStyle = '#000';
  // Rows rather than an oval: a curve here would be the one smooth edge in the
  // game.
  const rows = Math.round(h / P);
  for (let n = 0; n < rows; n++) {
    const t = n / (rows - 1);
    const bulge = Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.92);
    const cells = Math.max(2, Math.round((w / P) * (0.42 + bulge * 0.58)));
    const runW = cells * P;
    ctx.fillRect(Math.round(-runW / 2), top + n * P, runW, P);
  }
  // The lines from the envelope down to the filter's shoulders.
  const fl = -fw / 2;
  ctx.fillRect(fl + P, FTOP - P, P, P);
  ctx.fillRect(fl + fw - P * 2, FTOP - P, P, P);
  // The vents are what say filter rather than crate.
  ctx.fillRect(fl, FTOP, fw, P);                       // the intake lip, solid
  for (let cx = 0; cx < Math.round(fw / P); cx++) {
    // every other cell open across the middle, and the ends always closed
    const open = cx > 0 && cx < Math.round(fw / P) - 1 && cx % 2 === 1;
    if (!open) ctx.fillRect(fl + cx * P, FTOP + P, P, P);
  }
  ctx.fillRect(fl, FTOP + P * 2, fw, fh - P * 2);       // and the sump under it
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
