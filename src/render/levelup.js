// A fighter's level-up (the owner's vote, 2026-10-04: the abyssal corkscrew):
// a rung bought, one strand of flame tongues climbs round the body, widening
// as it goes, purple at the root of each tongue and cooling to grey at its
// tip, and burns out from the bottom up. Drawn in two passes: the turns behind
// the body before the party, the ones in front after it. Held frames, no
// flash; the rung itself is the party's (`levelingUp`, deep/party.js).

import { S } from '../state.js';
import { now } from '../clock.js';
import { P, WORKER, LEVELUP_S, LEVELUP_FPS, LEVELUP_TONGUES, LEVELUP_TURNS, LEVELUP_SPIN, LEVELUP_R,
         LEVELUP_H, LEVELUP_TONGUE, LEVELUP_IN, LEVELUP_OUT, LEVELUP_EMBERS } from '../config.js';
import { fighterAt, levelingUp } from '../deep/party.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES } from './deeptones.js';
import { hash } from './flicker.js';

const TOP = GREYS.length - 1;
// Root to tip, in front of the body and behind it.
const FRONT = () => [PURPLES[TOP - 1], GREYS[TOP], GREYS[TOP - 3], GREYS[TOP - 5]];
const BACK = () => [PURPLES[TOP - 4], GREYS[TOP - 4], GREYS[TOP - 6]];

const put = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(Math.round(x / P) * P, Math.round(y / P) * P, P, P); };

// A tongue: a short column, its height and the lean of its tip changing a
// held frame at a time.
function tongue(x, y, size, frame, seed, ramp) {
  const h = Math.max(1, Math.round(size * (0.7 + hash(seed + frame) * 0.6)));
  const lean = hash(seed * 3 + frame) < 0.5 ? -1 : 1;
  for (let j = 0; j < h; j++) {
    const tone = ramp[Math.min(ramp.length - 1, Math.floor(j / h * ramp.length))];
    put(x + (j >= h - 1 && h > 2 ? lean * P : 0), y - j * P, tone);
  }
}

function blaze(front) {
  if (S.view !== 'deep') return;
  const t = now();
  for (const st of S.stations) {
    if (!levelingUp(st)) continue;
    const w = fighterAt(st);
    if (!w) continue;
    const a = (t - st.lvlAt) / 1000, k = a / LEVELUP_S;
    const frame = Math.floor(a * LEVELUP_FPS);
    const spin = frame / LEVELUP_FPS * LEVELUP_SPIN;
    // lit from the feet up over LEVELUP_IN, held, then out from the feet up
    const top = Math.min(1, k / LEVELUP_IN), bottom = k < 1 - LEVELUP_OUT ? 0 : (k - (1 - LEVELUP_OUT)) / LEVELUP_OUT;
    const cx = w.x + WORKER / 2, foot = w.y + WORKER, ramp = front ? FRONT() : BACK();
    for (let i = 0; i < LEVELUP_TONGUES; i++) {
      const s = i / LEVELUP_TONGUES;
      if (s > top || s < bottom) continue;
      const turn = s * Math.PI * 2 * LEVELUP_TURNS + spin;
      if ((Math.sin(turn) > 0) !== front) continue;
      const r = (LEVELUP_R[0] + s * (LEVELUP_R[1] - LEVELUP_R[0])) * P;
      tongue(cx + Math.cos(turn) * r, foot - s * LEVELUP_H * P, LEVELUP_TONGUE[0] + s * (LEVELUP_TONGUE[1] - LEVELUP_TONGUE[0]),
             frame, i + st.lvlAt % 97, ramp);
    }
    // embers off the top as it burns out
    if (front && k > 1 - LEVELUP_OUT) for (let n = 0; n < LEVELUP_EMBERS; n++) {
      const up = Math.floor((k - (1 - LEVELUP_OUT)) * LEVELUP_FPS * LEVELUP_S) + n * 2;
      put(cx + Math.round(Math.sin(n * 2 + up) * 2) * P, foot - (LEVELUP_H + 1 + up % 6) * P, n % 2 ? GREYS[TOP - 3] : PURPLES[TOP - 1]);
    }
  }
}

export const drawLevelUpBack = () => blaze(false);
export const drawLevelUpFront = () => blaze(true);
