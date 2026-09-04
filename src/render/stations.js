// The two indoor stations and the smoke that says one is being worked: the
// school, the lab, and the lab's chimney smoke. Extracted verbatim from
// render.js; behavior unchanged. Owns drawSmoke, drawSchool and drawLab. The
// shared primitives (ctx, withRise, risingPlace) come from ./ctx.js and
// ./rise.js.

import { DOOR_H, DOOR_W, LAB_FLUE, P, SMOKE_LIFE } from '../config.js';
import { S, lab, school } from '../state.js';
import { ctx } from './ctx.js';
import { risingPlace, withRise } from './rise.js';
import { drawDoseMote } from './effects.js';

// Smoke off the lab's chimney -- and off a cigarette, which is the same smoke
// at a little over half the size. It is the only thing that says the lab is
// being worked, because the crew are inside it, so it is worth its own pixels.
export function drawSmoke() {
  for (const p of S.smoke) {
    // Against its own life, not against the chimney's. A mote let go with a life
    // of its own -- a machine's stack, a tonic burning off a body -- was faded
    // on the lab's clock, so a short-lived one was still solid black when it was
    // deleted and a long-lived one went invisible halfway up.
    const k = p.t / (p.life ?? SMOKE_LIFE);
    // A coloured mote is a tonic, and it is drawn as one: it pales toward the
    // page as it ages rather than thinning to grey, because a colour at low
    // alpha over a dark body is a muddy colour and this is the one thing on a
    // worker that has to stay legible as *which tonic*.
    if (p.color) { drawDoseMote(ctx, p.x, p.y, p.color, Math.min(1, k), p.v); continue; }
    const size = Math.round(P * (p.s || 1) * (1 + k * 1.4));
    ctx.globalAlpha = Math.max(0, 0.5 - k * 0.5);
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawSchool() {
  const rising = risingPlace() === 'school';
  if (!S.schoolOpen && !rising) return;
  const { x, y, w, h } = school;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = (n) => x + P * n;                             // cell n across the front
    ctx.fillStyle = '#000';
    ctx.fillRect(c(9), y, P * 2, P * 3);                    // the belfry
    ctx.fillRect(x, y + P * 3, w, h - P * 3);               // and the block under it
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(9), y + P, P * 2, P);                    // the opening it rings out of
    // Tall and narrow, and there are a lot of them: a row of standing windows is
    // the one thing a building can do that says people are in there in numbers.
    for (const n of [2, 4, 6, 13, 15, 17]) ctx.fillRect(c(n), y + P * 4, P, P * 2);
    // The way in, standing open. Two cells by three before, which was the smallest
    // door in the yard on the widest building in it -- a twenty-cell front with a
    // slot in it, and a body three cells across walking up to a hole three cells
    // tall. It is DOOR_W by DOOR_H now like every other way in, and it is centred
    // on the same column the belfry is, so the one thing standing out of the roof
    // and the one thing cut into the wall are on one axis.
    ctx.fillRect(c(10 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
    ctx.fillStyle = '#000';
  });
}

// The lab: a tall body with one chimney, read against the school's long block and
// against the stack of one-cell rooms the crew live in.
//
// It was the one building in the yard with no way in. Everything else on the
// ground has a door because somebody walks into it, and a wall a scholar
// evaporates against is the thing the scrubbing house's door was added to stop --
// so it had the same fault, and nobody had said so out loud.
//
// And it was laid out in fractions of its own width and height: 0.35 of ten
// courses is three and a half, so the body's roof, the foot of the chimney and
// the window all sat half a cell off the lattice and drew with the grey fringe
// the rest of the game is arranged to avoid. It is whole cells now, the same way
// the school was fixed, and the two numbers it is built on are in config.js with
// every other building's. Sixteen across and twelve down: LAB_FLUE courses of
// chimney standing against the sky, and eight of body under it. Nothing here is
// a fraction of anything, and nothing is a literal either -- read the front off
// the cells it is actually made of, so a lab a course taller draws right.
export function drawLab() {
  const rising = risingPlace() === 'lab';
  if (!S.labOpen && !rising) return;
  const { x, y, w, h } = lab;
  withRise(rising, x, S.groundY, w, h, () => {
    const across = Math.round(w / P);
    const c = (n) => x + P * n;                              // cell n across the front
    const r = (n) => y + P * n;                              // and cell n down it
    ctx.fillStyle = '#000';
    ctx.fillRect(x, r(LAB_FLUE), w, h - P * LAB_FLUE);       // the body
    ctx.fillRect(c(2), y, P * 3, P * LAB_FLUE);              // a chimney
    // ...and a second, small one at the far end of the roof: a pipe a cell
    // through with a cap on it (item 1 of feedback5). The stack beside it is a
    // mass and carries the smoke; this is a vent, and what tells them apart at
    // this size is that one is a solid block and the other is a line with a hat
    // on. Two things standing off one roof is what says the building is full of
    // works rather than being a box with a chimney.
    ctx.fillRect(c(across - 4), r(LAB_FLUE - 3), P, P * 3);
    ctx.fillRect(c(across - 5), r(LAB_FLUE - 3), P * 3, P);
    ctx.fillStyle = '#fff';
    // The window goes off to one side, because the middle of the front belongs to
    // the door now: a window over a doorway is a fanlight, which is a detail this
    // yard is too coarse to draw, and a window beside one is a room with somebody
    // in it. A clear cell off the jamb of the door and two off the far corner,
    // because a hole on a building's edge is a bite taken out of the silhouette
    // rather than a light in a wall.
    //
    // Two cells square, which is the window in a room of the crew's house. It was
    // three, and three cells of white in a wall beside a four-course door is two
    // holes rather than a wall with things in it. A window is a shared measure
    // here the same way a door is: one size for a room with somebody in it, and
    // the school's tall narrow lights, which come in a row and say a crowd.
    ctx.fillRect(c(across - 4), r(LAB_FLUE + 1), P * 2, P * 2);   // a window
    // and the way in, DOOR_W by DOOR_H like every other way in, dead in the middle
    // of the front and standing on the ground. lab.js walks a scholar to the middle
    // of it (labDoor), so the hole in the wall and the place a body disappears at
    // are one thing rather than two numbers that used to differ by a tenth of the
    // front -- which put every scholar through the window.
    ctx.fillRect(c(across / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
    ctx.fillStyle = '#000';
  });
}
