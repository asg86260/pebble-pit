// A fighter's level-up (the owner's vote, 2026-10-04: the abyssal corkscrew):
// a rung bought, one strand of flame tongues climbs round the body, widening
// as it goes, purple at the root of each tongue and cooling to grey at its
// tip; at the top every tongue leaps tall at once and then each one's tip
// flies off along its own turn as an ember (the owner's C, 2026-10-04). Drawn
// in two passes: the turns behind the body before the party, the ones in
// front after it. Held frames, no flash; the rung itself is the party's
// (`levelingUp`, deep/party.js).

import { S } from '../state.js';
import { now } from '../clock.js';
import { P, WORKER, LEVELUP_S, LEVELUP_FPS, LEVELUP_TONGUES, LEVELUP_TURNS, LEVELUP_SPIN, LEVELUP_R,
         LEVELUP_H, LEVELUP_TONGUE, LEVELUP_IN, LEVELUP_FLARE, LEVELUP_BURST_S, LEVELUP_BURST_STEPS,
         LEVELUP_BURST_OUT, LEVELUP_BURST_RISE } from '../config.js';
import { fighterAt, levelingUp } from '../deep/party.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES } from './deeptones.js';
import { hash } from './flicker.js';

const TOP = GREYS.length - 1;
// Root to tip, in front of the body and behind it.
const FRONT = () => [PURPLES[TOP - 1], GREYS[TOP], GREYS[TOP - 3], GREYS[TOP - 5]];
const BACK = () => [PURPLES[TOP - 4], GREYS[TOP - 4], GREYS[TOP - 6]];
// An ember cooling as it flies: white, purple, grey, then nearly gone.
const EMBER = () => [GREYS[TOP], PURPLES[TOP - 1], GREYS[TOP - 3], PURPLES[TOP - 5], GREYS[TOP - 6]];

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
    // lit from the feet up over LEVELUP_IN and held; the flare is its last
    // LEVELUP_FLARE, every tongue twice as tall; then the burst
    const top = Math.min(1, k / LEVELUP_IN), tall = k > 1 - LEVELUP_FLARE ? 2 : 1;
    const b = k < 1 ? -1 : (a - LEVELUP_S) / LEVELUP_BURST_S;
    const step = Math.floor(b * LEVELUP_BURST_STEPS), embers = EMBER();
    const cx = w.x + WORKER / 2, foot = w.y + WORKER, ramp = front ? FRONT() : BACK();
    for (let i = 0; i < LEVELUP_TONGUES; i++) {
      const s = i / LEVELUP_TONGUES;
      if (s > top) continue;
      const turn = s * Math.PI * 2 * LEVELUP_TURNS + spin;
      if ((Math.sin(turn) > 0) !== front) continue;
      const r = (LEVELUP_R[0] + s * (LEVELUP_R[1] - LEVELUP_R[0])) * P;
      if (b < 0) {
        tongue(cx + Math.cos(turn) * r, foot - s * LEVELUP_H * P, tall * (LEVELUP_TONGUE[0] + s * (LEVELUP_TONGUE[1] - LEVELUP_TONGUE[0])),
               frame, i + st.lvlAt % 97, ramp);
        continue;
      }
      // the burst: each tongue's tip flown out along its own turn, a held step at a time
      const out = r + step * LEVELUP_BURST_OUT * P, q = step / LEVELUP_BURST_STEPS + (i % 3) * 0.1;
      put(cx + Math.cos(turn) * out, foot - (s * LEVELUP_H + step * LEVELUP_BURST_RISE) * P,
          embers[Math.min(embers.length - 1, Math.floor(q * embers.length))]);
    }
  }
}

export const drawLevelUpBack = () => blaze(false);
export const drawLevelUpFront = () => blaze(true);
