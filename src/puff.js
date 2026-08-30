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
      x: x + off + (Math.random() - 0.5) * P * 0.4,
      y: y + (Math.random() - 0.5) * P * 0.6,
      drift: (o.drift || 0) + (Math.random() - 0.5) * 0.25,
      s: (o.s || 1) * (0.75 + Math.random() * 0.5),
      t: Math.random() * 0.15,               // and not all at the same age -- seconds
      ...(o.flag ? { [o.flag]: true } : {})
    });
  }
}
