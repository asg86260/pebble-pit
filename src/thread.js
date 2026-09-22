// The balloons' threads: the cells a working craft draws down out of the
// nearest cloud, and the cloud going pale while it does (DESIGN.md, "The
// balloons pull from the clouds").
//
// Picture only. How fast a craft pulls is the fan's pull out of the sky's one
// count (`pullCraft` in smog/craft.js); which cloud the thread reaches for is
// a fact about the view, since the sheets scroll slower than the ground. So
// nothing here spends the yard's chance or is read by anything that changes
// the yard: the cells come off a stream of their own.
import { FILTER_PULL, P, THREAD_PER_S, THREAD_PACE, THREAD_GIVE, THREAD_SWITCH, THREAD_RISE,
         BALLOON_W, BALLOON_FILTER_W, BALLOON_FILTER_H, CLOUD_DRAWN_EASE } from './config.js';
import { S } from './state.js';
import { stream } from './rng.js';
import { CRAFT, craftMouth, working } from './balloon.js';
import { CLOUDS, cloudHold } from './weather.js';
import { fanPull } from './smog.js';

// One a craft, by its index: the cloud it holds, and its cells as a share of
// the way down (`t`, nought at the cloud) and a wander off the line (`off`),
// so a cell is always somewhere on the thread however far the cloud and the
// craft have slid apart since.
export const THREADS = [];
const roll = stream(0x7412ead);

// The two ends of a thread. The box's intake is right under the envelope, so
// a thread come straight down would run behind the balloon's own envelope:
// it comes down beside it instead, on the side its cloud is on, and goes in
// at that end of the box, which is wider than the envelope for exactly this.
// With no cloud held, it runs straight up off the top of the window -- the
// craft is pulling on the sky all the same.
const CLEAR = BALLOON_W / 2 + P * 2;
function ends(i, cloud) {
  const m = craftMouth(i);
  const hold = cloud && CLOUDS.includes(cloud) ? cloudHold(cloud, m.x) : null;
  if (!hold || hold.y > m.y - P * THREAD_RISE) return null;
  const side = Math.sign(hold.mid - m.x) || 1;
  const at = cloudHold(cloud, m.x + side * CLEAR);
  return { top: { x: at.x, y: at.y },
           mouth: { x: m.x + side * BALLOON_FILTER_W / 2, y: m.y + BALLOON_FILTER_H / 2 } };
}
export function threadEnds(i) {
  const th = THREADS[i], got = th ? ends(i, th.cloud) : null;
  if (got) return got;
  const m = craftMouth(i);
  return { top: { x: m.x + CLEAR, y: S.camY - THREAD_GIVE * 2 },
           mouth: { x: m.x + BALLOON_FILTER_W / 2, y: m.y + BALLOON_FILTER_H / 2 } };
}

// The nearest cloud over the craft, measured to where it would be held. The
// one already held is kept unless another is clearly nearer, or the thread
// flicks between two clouds sitting about level.
function choose(i, th) {
  const dist = c => { const e = ends(i, c); return e ? Math.hypot(e.top.x - e.mouth.x, e.top.y - e.mouth.y) : Infinity; };
  let best = null, bestD = Infinity;
  for (const c of CLOUDS) { const d = dist(c); if (d < bestD) { bestD = d; best = c; } }
  const held = th.cloud ? dist(th.cloud) : Infinity;
  if (held < Infinity && !(bestD < held * THREAD_SWITCH)) return th.cloud;
  return best;
}

export function stepThreads(dt) {
  const secs = dt / 1000;
  THREADS.length = Math.min(THREADS.length, CRAFT.length);
  const held = new Set();
  for (let i = 0; i < CRAFT.length; i++) {
    const th = THREADS[i] || (THREADS[i] = { cloud: null, cells: [] });
    const on = working(i);
    if (on) th.cloud = choose(i, th);
    if (on && th.cloud) held.add(th.cloud);
    // A thread with nobody pulling on it makes no new cells; the ones on
    // their way down still arrive.
    const { top, mouth: m } = threadEnds(i);
    const len = Math.max(1, Math.hypot(m.x - top.x, m.y - top.y));
    if (on) {
      let n = THREAD_PER_S * (fanPull() / FILTER_PULL) * secs;
      while (n > 0) {
        if (n < 1 && roll() > n) break;
        n -= 1;
        th.cells.push({ t: roll() * 0.15, off: (roll() - 0.5) * 2 });
      }
    }
    // Down at a pace in pixels, so a long thread takes longer than a short
    // one, and quickening as it goes, the way the house's draught does.
    for (let k = th.cells.length - 1; k >= 0; k--) {
      const cell = th.cells[k];
      cell.t += THREAD_PACE * secs * (1 + cell.t) / len;
      if (cell.t >= 1) th.cells.splice(k, 1);
    }
  }
  // The clouds held pale; the rest fill back in, on the clock.
  const k = Math.min(1, CLOUD_DRAWN_EASE * secs);
  for (const c of CLOUDS) {
    const want = held.has(c) ? 1 : 0;
    c.drawn = (c.drawn || 0) + (want - (c.drawn || 0)) * k;
  }
}
