import { now } from '../clock.js';
import { GOING_CAP, SMOG_GO_LEAN } from '../config.js';
import { windAt } from '../wind.js';
import { GOING, SKY } from './band.js';
import { swallow } from './craft.js';
import { dropped, moteX, moteY } from './sky.js';

// --- a mouth on the sky ------------------------------------------------------------
// What takes the sky down: a balloon's mouth (`pullCraft` in craft.js). The
// air filter's shed used to have one of its own; it is the balloons' board and
// gauge now, and the balloons do the taking.

// Where the walk starts, kept between frames: starting at nought every frame
// would take the same few hundred specks over and over and leave the far end
// of the sky untouched for ever.
let sweep = 0;

// One mouth, taking what it is owed out of the sky, from anywhere: a mouth
// with a reach takes only what happens to float near it, so the same craft
// clears its rating on one yard and a fortieth of it on another, and the
// board's rate is a number that lies. The specks are picked off a rolling
// sweep so the whole sky thins rather than one part wearing out.
//
// `owe`/`pay` rather than a number in and out, so the caller keeps its own
// gullet: every balloon has one, and one going hungry must not spend
// another's.
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
