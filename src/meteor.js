// The meteor: the one thing in this game that is not on the ground.
//
// It hangs in the sky over the yard and sheds a spark every so often, which
// falls and is banked. You can knock one loose early by clicking it, once it has
// charged -- so the last site is the one thing that stays hands-on, in a game
// that has otherwise been handed over to the crew.
//
// Sparks are rare and buy exactly one thing, at the lab: pace on everything at
// once. That is what makes them worth crossing the yard for.

import { GRAV, SPARK_BASE, SPARK_FLOOR, METEOR_R, P, SPARK_CELL } from './config.js';
import { S, meteor } from './state.js';
import { spawnFind } from './finds.js';

// how long between sparks
export const sparkMs = () => Math.max(SPARK_FLOOR, SPARK_BASE);

// how charged it is, 0..1, for drawing
export function charge(now) {
  if (!S.meteorOpen) return 0;
  const left = S.meteorAt - now;
  return Math.max(0, Math.min(1, 1 - left / sparkMs()));
}

export const overMeteor = (x, y) =>
  S.meteorOpen && Math.hypot(x - meteor.x, y - meteor.y) < METEOR_R + 10;

function shed(now) {
  S.falling.push({ x: meteor.x + (Math.random() - 0.5) * METEOR_R,
                   y: meteor.y + METEOR_R * 0.6,
                   vx: (Math.random() - 0.5) * 0.8, vy: 0 });
  S.meteorAt = now + sparkMs();
  S.dirty = true;
}

// clicking it: only worth anything once it is most of the way charged, so it is
// a thing you notice rather than a thing you grind
export function knockMeteor(now) {
  if (!S.meteorOpen || charge(now) < 0.55) return false;
  shed(now);
  return true;
}

export function stepMeteor(now) {
  if (!S.meteorOpen) return;
  if (!S.meteorAt) S.meteorAt = now + sparkMs();
  if (now >= S.meteorAt) shed(now);

  for (let i = S.falling.length - 1; i >= 0; i--) {
    const f = S.falling[i];
    f.vy += GRAV * 0.35;                   // it drifts down rather than drops
    f.x += f.vx;
    f.y += f.vy;
    if (f.y >= S.groundY - P) {
      S.falling.splice(i, 1);
      spawnFind(SPARK_CELL, f.x, f.y, 0, 0);       // from here it is a body like the rest
    }
  }
}
