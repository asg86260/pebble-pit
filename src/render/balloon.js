// The filter balloons the air filter sells: their posts in the yard, and the
// craft themselves among the clouds.

import { BALLOON_BASKET, BALLOON_LINES, BALLOON_H, BALLOON_W, CRAFT,
         aboard, craftAt, mastX, postY } from '../balloon.js';
import { DRAWN } from '../craftair.js';
import { fadeAt, murkTone } from '../weather.js';
import { BALLOON_HANG, P, WORKER } from '../config.js';
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
    const sx = Math.round((mastX(i) - P * 5) / P) * P, foot = Math.round(postY(i));
    ctx.fillRect(sx, foot - P * STAKE, P, P * STAKE);
    if (CRAFT[i].phase === 'moored') ctx.fillRect(sx + P, foot - P * STAKE, P * 1.5, P);
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

const NECK = -BALLOON_BASKET - BALLOON_LINES;   // the envelope's neck, from the basket's bottom

// The stream a working craft is drawing down out of its cloud: one column of
// cells from the cloud's base into the vent at the crown, gathered from a cell
// either side at the top and narrowing to the vent. Drawn in the color the air
// is, so a filthy sky is a brown stream and a clean one a pale trickle.
const CROWN = NECK - BALLOON_H;              // the top of the envelope, from the basket's bottom
function drawDrawnIn(i) {
  const cells = DRAWN[i];
  if (!cells || !cells.length) return;
  const top = CROWN - P * BALLOON_HANG;
  ctx.fillStyle = murkTone();
  ctx.beginPath();
  for (const c of cells) {
    const x = Math.round(c.off * (1 - c.t)) * P - P / 2;
    ctx.rect(x, Math.round((top + c.t * P * BALLOON_HANG) / P) * P, P, P);
  }
  ctx.fill();
}

// The envelope and the lines under it. It draws the sky in at the vent in its
// crown, so nothing hangs between bag and basket but the lines.
//
// Each craft has its own envelope, the way no two hot-air balloons at a field
// are the same, by the order they were bought in: plain, seamed, banded.
// `look` is the craft's index.
function drawEnvelope(look) {
  const w = BALLOON_W, h = BALLOON_H;
  const top = NECK - h;                        // the crown
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
  // The vent in the crown, where the stream out of the cloud goes in.
  ctx.fillRect(-P / 2, top, P, P);
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
  // The lines from either side of the neck, out a cell and down to the
  // basket's rim, so the body stands between them.
  ctx.fillStyle = '#000';
  const inner = neck * P / 2, outer = BASKET_W / 2;
  ctx.fillRect(-inner, NECK, P, P);
  ctx.fillRect(inner - P, NECK, P, P);
  ctx.fillRect(-outer, NECK + P, P, RIM - NECK - P);
  ctx.fillRect(outer - P, NECK + P, P, RIM - NECK - P);
}

// The basket, hanging on the lines, drawn over whoever is in it so they stand
// in it rather than on it: solid, with a course of weave through it.
const BASKET_W = P * 5;
const RIM = -P * 2;                            // its top, from its bottom
function drawBasket() {
  ctx.fillStyle = '#000';
  ctx.fillRect(-BASKET_W / 2, RIM, BASKET_W, -RIM);
  ctx.fillStyle = '#fff';
  for (let c = 1; c < BASKET_W / P - 1; c += 2) ctx.fillRect(-BASKET_W / 2 + c * P, RIM + P, P, P / 2);
}
