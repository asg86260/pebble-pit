// The roombas and their dock (crew/roomba.js). Flat cells on the grid: a dome
// three high on a base six wide, the bin's gauge along the band between them
// in the mess's own tones, a blinking eye at the front and a stub of exhaust at
// the back. The dock is a charge post a slot, its light blinking while its
// roomba sits there.

import { P, ROOMBA_W, ROOMBA_H, ROOMBA_GAUGE, ROOMBA_BIN, ROOMBA_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { binOf, postX, roombasOf } from '../crew/roomba.js';
import { ctx } from './ctx.js';

const INK = '#000', PAPER = '#fff';
const BLINK_MS = 360;               // the eye's and the post light's half-period
const snap = v => Math.round(v / P) * P;

// A post a slot owned, standing a cell before where its roomba docks.
export function drawRoombaDock() {
  const n = roombasOf();
  if (!n || !S.outhouseOpen) return;
  const lit = Math.floor(now() / BLINK_MS) % 2 === 0;
  for (let i = 0; i < n; i++) {
    const x = postX(i);
    ctx.fillStyle = INK;
    ctx.fillRect(x, S.groundY - P * ROOMBA_H, P, P * ROOMBA_H);
    // The light on top, lit on the beat while its roomba is home.
    const home = S.roombaBots?.[i]?.goal === 'dock';
    if (home && lit) { ctx.fillStyle = PAPER; ctx.fillRect(x, S.groundY - P * ROOMBA_H, P, P); }
  }
  ctx.fillStyle = INK;
}

export function drawRoombas() {
  const bots = S.roombaBots || [];
  const t = now();
  bots.forEach((r, i) => {
    const x = snap(r.x);
    const cell = (k, row, tone) => { ctx.fillStyle = tone; ctx.fillRect(x + k * P, S.groundY - P * (row + 1), P, P); };
    const W = ROOMBA_W, front = r.face > 0 ? W - 1 : 0, back = r.face > 0 ? 1 : W - 2;
    // the base, and the eye in its front cell, blinking while it is out
    for (let k = 0; k < W; k++) cell(k, 0, INK);
    if (r.goal !== 'dock' && Math.floor(t / BLINK_MS) % 2) cell(front, 0, PAPER);
    // the band: its two ends, and the gauge between them
    cell(0, 1, INK); cell(W - 1, 1, INK);
    const full = Math.ceil(binOf(r) / ROOMBA_BIN * ROOMBA_GAUGE);
    for (let k = 0; k < ROOMBA_GAUGE; k++) {
      // Each cell its own tone of the mess, fixed per machine and cell, so a
      // full bin reads as a load of stuff rather than a painted bar.
      const tone = ROOMBA_TONES[(i * 2 + k) % ROOMBA_TONES.length];
      cell(1 + k, 1, k < full ? tone : PAPER);
    }
    // the dome, and the exhaust stub over its back
    for (let k = 1; k < W - 1; k++) cell(k, 2, INK);
    cell(back, 3, INK);
  });
  // Grains in the air: into a mouth, or thrown out of a bin at the closet's
  // door, on an arc when they are thrown. On the grid like everything else.
  for (const f of S.roombaFlecks || []) {
    const k = Math.max(0, Math.min(1, (t - f.at) / f.ms));
    const fx = f.x0 + (f.x1 - f.x0) * k;
    const fy = f.y0 + (f.y1 - f.y0) * k - f.arc * 4 * k * (1 - k);
    ctx.fillStyle = f.tone;
    ctx.fillRect(snap(fx - P / 2), snap(fy - P / 2), P, P);
  }
  ctx.fillStyle = INK;
}
