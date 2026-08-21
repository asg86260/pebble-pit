// The dust hanging in the air. It rises off whatever is lying about, so a big
// pit visibly gives off more than a bare one, and it drifts past at its own rate
// as the view scrolls -- which is how movement reads with nothing in the
// background to move against.

import { P } from './config.js';
import { S, floor, pit } from './state.js';
import { at, count, surfaceY } from './grid.js';
import { blocked } from './world.js';
import { ctx } from './render.js';

export const AIR = [];
const AIR_CAP = 260;

export function seedAir() {
  AIR.length = 0;
}

// a spot just above the dust in a random column of a pile
function airSource() {
  const b = Math.random() < 0.5 ? floor : pit;
  for (let tries = 0; tries < 12; tries++) {
    const c = Math.floor(Math.random() * b.cols);
    if (!at(b, c, 0)) continue;
    if (b === floor && blocked(c)) continue;
    return { x: b.x + c * b.p + Math.random() * b.p, y: surfaceY(b, c) - P };
  }
  return null;
}

// paid dust arcs out of the pit to the bench and is gone; a flight it always
// finishes, rather than a pull it can circle forever
export function stepAir() {
  const dust = dustAbout(performance.now());
  const want = Math.min(AIR_CAP, 6 + Math.round(dust / 45));

  if (AIR.length < want && Math.random() < 0.6) {
    const from = dust > 20 ? airSource() : null;
    const at0 = from || { x: S.camX + Math.random() * S.W, y: Math.random() * S.groundY };
    AIR.push({
      x: at0.x,
      y: at0.y,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.06 - Math.random() * 0.16,
      life: 300 + Math.random() * 500,
      size: Math.random() < 0.3 ? P / 2 : P / 3,
      far: 0.45 + Math.random() * 0.4
    });
  }

  for (let i = AIR.length - 1; i >= 0; i--) {
    const m = AIR[i];
    m.x += m.vx;
    m.y += m.vy;
    m.life--;
    if (m.life <= 0 || m.y < -P || AIR.length > want + 40) AIR.splice(i, 1);
  }
}

export function drawAir() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.fillStyle = '#d9d9d9';
  for (const m of AIR) {
    ctx.fillRect(Math.round(m.x - S.camX * m.far), Math.round(m.y - S.camY * m.far), m.size, m.size);
  }
  ctx.fillStyle = '#000';
}


// roughly how much dust is lying about, refreshed a few times a second: this
// only sets how many motes drift in the air, and counting a full pit every
// frame would cost more than the whole rest of the game
export function dustAbout(now) {
  if (now - S.dustSeenAt > 400) {
    S.dustSeen = count(floor) + count(pit);
    S.dustSeenAt = now;
  }
  return S.dustSeen;
}


