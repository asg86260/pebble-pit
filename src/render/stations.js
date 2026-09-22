// The lab and the smoke that says it is being worked.

import { P, SMOKE_LIFE } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';

import { drawDoseMote } from './effects.js';

// Against its own life, not the chimney's: a mote let go with a life of its
// own (a machine's stack, a tonic burning off a body) faded on the lab's
// clock is solid black when deleted or invisible halfway up.
const age = p => p.t / (p.life ?? SMOKE_LIFE);

// Smoke off the lab's chimney, and off a cigarette at a little over half the
// size. It is the only thing that says the lab is being worked, because the
// crew are inside it.
export function drawSmoke() {
  for (const p of S.smoke) {
    if (p.color) continue;                     // a tonic's: drawDoseMotes
    const k = age(p);
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

// A colored mote is a tonic burning off a body: it pales toward the page
// rather than thinning to gray, since a color at low alpha over a dark body
// is mud and this has to stay legible as *which tonic*. Its own layer, beside
// the smoke's, because it is the crew's and the crew switch fades or hides it
// with them (render.js, a `dim` layer).
export function drawDoseMotes() {
  for (const p of S.smoke) if (p.color) drawDoseMote(ctx, p.x, p.y, p.color, Math.min(1, age(p)), p.v);
}

