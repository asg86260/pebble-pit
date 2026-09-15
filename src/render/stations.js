// The lab and the smoke that says it is being worked.

import { DOOR_H, DOOR_W, LAB_FLUE, P, SMOKE_LIFE } from '../config.js';
import { S, lab } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';
import { drawDoseMote } from './effects.js';

// Smoke off the lab's chimney, and off a cigarette at a little over half the
// size. It is the only thing that says the lab is being worked, because the
// crew are inside it.
export function drawSmoke() {
  for (const p of S.smoke) {
    // Against its own life, not the chimney's: a mote let go with a life of
    // its own (a machine's stack, a tonic burning off a body) faded on the
    // lab's clock is solid black when deleted or invisible halfway up.
    const k = p.t / (p.life ?? SMOKE_LIFE);
    // A colored mote is a tonic: it pales toward the page rather than thinning
    // to gray, since a color at low alpha over a dark body is mud and this has
    // to stay legible as *which tonic*.
    if (p.color) { drawDoseMote(ctx, p.x, p.y, p.color, Math.min(1, k), p.v); continue; }
    // A few cells at full ink that come apart as it ages; a square growing at
    // half alpha is a soft gray blob in a yard with no other soft edge. Which
    // cells stay is the puff's own phase, so a cloud does not flicker.
    const cells = Math.max(1, Math.round((p.s || 1) * 3 * (1 - k)));
    const cx = Math.round((p.x - P) / P) * P, cy = Math.round((p.y - P) / P) * P;
    ctx.fillStyle = '#000';
    const seed = Math.floor((p.ph || 0) * 97);
    for (let i = 0; i < cells; i++) {
      const dx = (seed + i * 7) % 3, dy = (seed + i * 5) % 3;
      ctx.fillRect(cx + dx * P, cy + dy * P - Math.round(k * P * 3), P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The lab: a tall body with one chimney. Whole cells throughout, read off the
// cells it is made of rather than fractions of its width, so a lab a course
// taller draws right: LAB_FLUE courses of chimney against the sky, the body
// under it.
export function drawLab() {
  const rising = risingAt('lab') && 'lab';
  if (!S.labOpen && !rising) return;
  const { x, y, w, h } = lab;
  withRise(rising, x, S.groundY, w, h, () => {
    const across = Math.round(w / P);
    const c = (n) => x + P * n;                              // cell n across the front
    const r = (n) => y + P * n;                              // and cell n down it
    ctx.fillStyle = '#000';
    ctx.fillRect(x, r(LAB_FLUE), w, h - P * LAB_FLUE);       // the body
    ctx.fillRect(c(2), y, P * 3, P * LAB_FLUE);              // a chimney
    // A second, small stack at the far end of the roof: a line with a hat on
    // beside the solid block, which is what says works rather than a box with
    // a chimney.
    ctx.fillRect(c(across - 4), r(LAB_FLUE - 3), P, P * 3);
    ctx.fillRect(c(across - 5), r(LAB_FLUE - 3), P * 3, P);
    ctx.fillStyle = '#fff';
    // The window off to one side, because the middle of the front belongs to
    // the door: a clear cell off the jamb and two off the far corner, since a
    // hole on a building's edge is a bite out of the silhouette. Two cells
    // square, the window of a crew room; three beside a four-course door is
    // two holes rather than a wall with things in it.
    ctx.fillRect(c(across - 4), r(LAB_FLUE + 1), P * 2, P * 2);   // a window
    // The way in, DOOR_W by DOOR_H, dead in the middle of the front. lab.js
    // walks a scholar to the middle of it (labDoor), so the hole in the wall
    // and the place a body disappears are one thing.
    ctx.fillRect(c(across / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
    ctx.fillStyle = '#000';
  });
}

