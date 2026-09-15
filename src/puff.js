// Smoke, as a puff rather than as a dotted line. Everything that smokes in
// this yard comes through here, so there is one place to change how smoke
// behaves. A leaf on its own because a helper this widely called has to be
// somewhere nothing can close a ring through.

import { P, PUFF_MOTES, PUFF_SPREAD, SMOKE_LIFE, SMOKE_RISE } from './config.js';
import { S } from './state.js';
import { rand } from './rng.js';

// One puff: a handful of motes let go together and coming apart on the way up.
export function puff(x, y, o = {}) {
  const n = o.n || PUFF_MOTES;
  for (let i = 0; i < n; i++) {
    // Spread about the middle, each mote a little different from its
    // neighbors: identical motes on identical paths read as one fat square.
    const off = (i - (n - 1) / 2) * P * PUFF_SPREAD;
    S.smoke.push({
      x: x + off + (rand() - 0.5) * P * 0.4,
      y: y + (rand() - 0.5) * P * 0.6,
      drift: (o.drift || 0) + (rand() - 0.5) * 0.25,
      s: (o.s || 1) * (0.75 + rand() * 0.5),
      t: rand() * 0.15,               // and not all at the same age -- seconds
      ph: rand(),                     // which of its cells stay as it comes apart: see drawSmoke
      // How fast this one goes up and how long it lasts, both its own: a
      // machine's stack is not a chimney (MACHINE_PUFF_RISE), and a trail that
      // climbs as long as a wisp over a roof streaks halfway up the window.
      rise: o.rise,
      life: o.life,
      // Smoke has no color. A tonic burning off a body is the same plume in
      // the tonic's color, so it is a color a caller may pass rather than a
      // second particle system (`drawSmoke`).
      color: o.color,
      // A mote's own variation, fixed when it is let go: a tonic shifts its
      // hue by it. Settled here because a variation rolled per frame blinks.
      // Hashed off where the mote is, NOT drawn from `rand()`: that is the
      // SIMULATION's seeded stream, every check is written against the yard
      // that seed produces, and one more call per mote shifts it for
      // everything downstream (one taken here put a quarrier through the floor
      // six thousand frames later, in a test that has nothing to do with
      // smoke). Decoration does not touch the stream the game is dealt from.
      v: ((Math.sin((x + y * 3 + i) * 12.9898) * 43758.5453) % 1 + 1) % 1,
      ...(o.flag ? { [o.flag]: true } : {})
    });
  }
}

// What happens to a mote once let go: it climbs, leans on its drift, ages,
// and is gone. Nothing else ages `S.smoke`. `rise` and `life` are per-mote
// (MACHINE_PUFF_RISE); a mote not told falls back to the wisp.
export function stepSmoke(dt) {
  for (let i = S.smoke.length - 1; i >= 0; i--) {
    const p = S.smoke[i];
    p.t += dt / 1000;
    p.y -= p.rise ?? SMOKE_RISE;
    p.x += p.drift;
    if (p.t > (p.life ?? SMOKE_LIFE)) S.smoke.splice(i, 1);
  }
}
