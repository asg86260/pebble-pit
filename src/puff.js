// Smoke, as a puff rather than as a dotted line.
//
// Everything that smokes in this yard comes through here -- the lab's chimney,
// the crew's own hearth, a cigarette, a machine's stack -- so they all billow the
// same way and there is one place to change how smoke behaves.
//
// It lives on its own because of what it needs, which is almost nothing: the
// list to push onto and one length. Every other home for it -- the lab, the sky
// -- is a module that half the yard already imports, and a helper this widely
// called has to be somewhere nothing can close a ring through.

import { P, PUFF_MOTES, PUFF_SPREAD } from './config.js';
import { S } from './state.js';
import { rand } from './rng.js';

// One puff: a handful of motes let go together and coming apart on the way up.
//
// Everything that smokes in this yard goes through here -- the lab's chimney,
// the crew's own hearth, a cigarette, a machine's stack -- so they all billow
// the same way and there is one place to change how smoke behaves.
export function puff(x, y, o = {}) {
  const n = o.n || PUFF_MOTES;
  for (let i = 0; i < n; i++) {
    // Spread about the middle rather than heaped on one point, and each mote a
    // little different from its neighbours: identical motes on identical paths
    // read as one square with a fat edge.
    const off = (i - (n - 1) / 2) * P * PUFF_SPREAD;
    S.smoke.push({
      x: x + off + (rand() - 0.5) * P * 0.4,
      y: y + (rand() - 0.5) * P * 0.6,
      drift: (o.drift || 0) + (rand() - 0.5) * 0.25,
      s: (o.s || 1) * (0.75 + rand() * 0.5),
      t: rand() * 0.15,               // and not all at the same age -- seconds
      // How fast this one goes up and how long it lasts, both its own.
      //
      // They were one pair of numbers for everything that smokes here, which is
      // right for the lab's chimney and the crew's hearth and a cigarette --
      // they are all a wisp over a roof. A machine's stack is not: there are
      // three of them going at once in a working yard, right where the crew are,
      // and a trail that climbs for the same two and a half seconds turns into a
      // streak halfway up the window. So a caller may say, and only the machines
      // do. See MACHINE_PUFF_RISE.
      rise: o.rise,
      life: o.life,
      // Smoke is smoke, and has no colour: it is drawn in the yard's own ink.
      // A tonic burning off a body is the same rising, coming-apart plume in the
      // tonic's colour, which is the one thing about it that is not smoke -- so
      // it is a colour a caller may pass rather than a second particle system
      // that rises and spreads and expires all over again. See `drawSmoke`.
      color: o.color,
      // A mote's own variation, fixed when it is let go: whatever the drawer
      // wants to make different about this one and not its neighbours. Smoke
      // does not use it; a tonic shifts its hue by it, so a plume is a colour
      // rather than one swatch repeated. Settled here rather than at the draw
      // because a variation rolled per frame is a mote that blinks.
      v: rand(),
      ...(o.flag ? { [o.flag]: true } : {})
    });
  }
}
