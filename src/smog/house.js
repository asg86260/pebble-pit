import { now } from '../clock.js';
import { DRAUGHT_FROM, DRAUGHT_PACE, DRAUGHT_PER_S, GOING_CAP, P, FILTER_PULL, SMOG_GO_LEAN } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { windAt } from '../wind.js';
import { GOING, SKY, intake, filterRate } from './band.js';
import { swallow } from './craft.js';
import { dropped, moteX, moteY } from './sky.js';
import { look } from './vents.js';

// --- the house --------------------------------------------------------------------
// The house takes motes at the pace it is rated for, from anywhere in the sky
// (`eat`), and moves nothing else. What you see of it is `breathe`: a few
// drawn-in cells that are a picture and nothing more, counted nowhere. They
// are the only way a fan over a clean sky can say it is running.
export const DRAUGHT = [];

export function breathe(secs) {
  breatheAt(intake(), filterRate() / FILTER_PULL, secs, DRAUGHT_FROM);
}

// A few cells drawn in to a mouth. Metered by the real rate, so an unstaffed
// or clogged mouth makes none and a bigger fan visibly pulls harder: it cannot
// say anything untrue about how hard the thing is working. A craft shows its
// pull as a thread instead (thread.js).
function breatheAt(to, power, secs, from) {
  if (power <= 0) return;
  let n = DRAUGHT_PER_S * power * secs;
  while (n > 0) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    // mostly from above: what a fan facing the sky pulls on is the sky
    const a = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.4;
    const d = from * (0.5 + rand() * 0.5);
    DRAUGHT.push({ x: to.x + Math.cos(a) * d, y: to.y + Math.sin(a) * d, t: 0,
                   tx: to.x, ty: to.y, from });
  }
  for (let i = DRAUGHT.length - 1; i >= 0; i--) {
    const k = DRAUGHT[i];
    const dx = k.tx - k.x, dy = k.ty - k.y;
    const d = Math.hypot(dx, dy) || 1;
    // it gathers pace as it goes, the way the haze does, and is gone at the mouth
    const step = DRAUGHT_PACE * secs * (1 + (1 - Math.min(1, d / k.from)));
    if (d < P * 2) { DRAUGHT.splice(i, 1); continue; }
    k.x += (dx / d) * step;
    k.y += (dy / d) * step;
    k.t = 1 - d / k.from;
  }
}



// What the throat has not swallowed yet, in whole motes: a rate below one a
// frame cannot be spent a frame at a time without rounding away to nothing.
export let gullet = 0;
// Only this file may assign to it; `seedSmog` empties it through the door.
export const resetGullet = () => { gullet = 0; };

// Where the walk starts, kept between frames: starting at nought every frame
// would take the same few hundred specks over and over and leave the far end
// of the sky untouched for ever.
let sweep = 0;

// The house takes the sky in and does not drag it about to do so. A mouth
// eats the air it is in, so the sky thins where the works is cleaning it and
// fills back in as the band drifts.
export function pull(secs) {
  gullet = Math.min(gullet + filterRate() * secs, filterRate());
  eat(() => gullet, n => { gullet = n; }, null);
}

// One mouth, taking what it is owed out of the sky, from anywhere: a mouth
// with a reach takes only what happens to float near it, so the same house
// clears its rating on one yard and a fortieth of it on another, and the
// board's rate is a number that lies. The specks are picked off a rolling
// sweep so the whole sky thins rather than one part wearing out.
//
// `owe`/`pay` rather than a number in and out, so the caller keeps its own
// gullet: a house and three balloons each have one, and one going hungry
// must not spend another's.
export function eat(owe, pay, craft) {
  if (owe() < 1 || !SKY.length) return;
  let left = owe();
  // Bounded, so a mouth cannot walk the whole sky in a frame looking for one
  // speck; with tens of thousands and four mouths that walk is the frame.
  const look = Math.min(SKY.length, 400);
  for (let n = 0; n < look && left >= 1; n++) {
    sweep = SKY.length ? (sweep + 1) % SKY.length : 0;
    const m = SKY[sweep];
    // Nothing is taken on the way up: a mouth reaching into the plumes would
    // catch smoke a foot off the swing that made it.
    if (!m || m.up) continue;
    left -= 1;
    // Out of the sky now (the level is the count) and a picture of it left
    // behind to fade. See `GOING`.
    if (GOING.length < GOING_CAP) {
      // still drifting on the wind while it thins: nothing up here stops
      GOING.push({ x: moteX(m), y: moteY(m), kind: m.kind,
                   tone: m.tone, ink: m.ink, t: 1,
                   vx: windAt(now()) * SMOG_GO_LEAN * m.give, vy: 0 });
    }
    dropped(m);
    SKY.splice(sweep, 1);
    if (sweep >= SKY.length) sweep = 0;
    swallow(craft);
  }
  pay(left);
}
