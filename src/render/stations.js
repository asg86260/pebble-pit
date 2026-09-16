// The lab and the smoke that says it is being worked.

import { P, SMOKE_LIFE } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

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

