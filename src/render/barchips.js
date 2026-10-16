// A bar's stretch breaking off in square chips: the serpent's bar on the
// glass (render/serpentbar.js) and the constrict's orb's over its head
// (render/serpent.js) break the same way, at their own size. `k` scales the
// BAR_BITE_* rules from the serpent's bar, BAR_H high in screen pixels, to a
// bar of another height in its own pixels, so a chip is a square half the
// bar's height on either one and is thrown and falls the same in proportion.

import { BAR_BITE, BAR_BITE_MIN, BAR_BITE_HOLD_S, BAR_BITE_LIFT, BAR_BITE_GRAV, BAR_BITE_KICK, BAR_BITE_TUMBLE_S,
         BAR_BITE_FALL_S, BAR_BITE_FADE_S } from '../config.js';
import { ctx } from './ctx.js';

let thrown = 0;
const hash = n => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };
const lift = k => Math.max(1, Math.round(BAR_BITE_LIFT * k));

// The stretch from `a` to `b` pixels along a bar `h` high breaks off at once,
// at `t` seconds, into `list`: cut from its end down into square bites
// BAR_BITE wide, the last narrower, each leaving as two chips, its top half
// and its bottom, all held lit where they were for BAR_BITE_HOLD_S and then
// thrown together toward the empty end. A stretch under BAR_BITE_MIN pixels
// still breaks off that wide, from the end, so every blow that lands is seen
// to chip the bar.
export function breakOff(list, t, a, b, h, k = 1) {
  const kick = BAR_BITE_KICK, half = h / 2;
  const bite = Math.max(1, Math.round(BAR_BITE * k)), min = Math.max(1, Math.round(BAR_BITE_MIN * k));
  b = Math.round(b);
  a = Math.max(0, Math.min(Math.round(a), b - min));
  for (let x1 = b; x1 > a; x1 -= bite) {
    const w = Math.min(bite, x1 - a);
    for (let r = 0; r < 2; r++) {
      const n = thrown++;
      list.push({ at: t, x: x1 - w, y: r * half, w, h: half, base: null,
        vx: ((r ? 1 : -1) * kick.side * 0.4 + (hash(n) - 0.3) * kick.sideRand + kick.side) * k,
        vy: (-(kick.up + hash(n + 5) * kick.upRand) + r * kick.row) * k, tumble: r === 1 });
    }
  }
}

// The chips still in the air at `s` seconds.
export const liveChips = (list, s) => list.filter(p => s - p.at < BAR_BITE_HOLD_S + BAR_BITE_FALL_S);

// The chips at `s` seconds, off a bar whose top-left is (x, y) this frame and
// stands at `rest` when nothing knocks it: held lit where they broke off, on
// the bar as it stands, then thrown from where it stood as they let go,
// moved every frame to the whole pixel, the tumbling one a square and a
// diamond in turn, fading out whole. `fill(color, x, y, w, h)` paints, at
// `alpha`; `held` and `ink` are the lit and the falling colors.
export function drawChips(list, s, x, y, rest, { k = 1, fill, held, ink, alpha = 1 }) {
  for (const p of list) {
    const a = s - p.at;
    if (a < 0) continue;
    if (a < BAR_BITE_HOLD_S) { fill(held, x + p.x, y + p.y - lift(k), p.w, p.h); continue; }
    // where the bar stood as it let go, so a knock or a bob still going on
    // does not carry a chip already in the air
    if (p.base == null) p.base = y - rest - lift(k);
    const f = a - BAR_BITE_HOLD_S;
    const px = Math.round(x + p.x + p.vx * f);
    const py = Math.round(rest + p.base + p.y + p.vy * f + 0.5 * BAR_BITE_GRAV * k * f * f);
    ctx.globalAlpha = alpha * Math.max(0, Math.min(1, (BAR_BITE_HOLD_S + BAR_BITE_FALL_S - a) / BAR_BITE_FADE_S));
    if (p.tumble && Math.floor(f / BAR_BITE_TUMBLE_S) % 2) diamond(fill, ink, px + p.w / 2, py + p.h / 2, Math.min(p.w, p.h));
    else fill(ink, px, py, p.w, p.h);
    ctx.globalAlpha = alpha;
  }
}

// A chip `side` pixels square turned an eighth, centered on (cx, cy): a
// diamond whose half-diagonal is the square's, in whole pixels, a row at a time.
function diamond(fill, ink, cx, cy, side) {
  const n = Math.floor(side / Math.SQRT2), x0 = Math.round(cx), y0 = Math.round(cy);
  for (let i = -n; i <= n; i++) {
    const half = n - Math.abs(i);
    fill(ink, x0 - half, y0 + i, half * 2 + 1, 1);
  }
}
