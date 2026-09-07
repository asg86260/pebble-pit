// The props: the first shield, and the first thing the yard ever does about the
// sky rather than about the ground. Timber legs either side of the rock and a
// lid over the top of it, raised a plank at a time by whoever is free -- and the
// next rock comes through it as if it were not there. See DESIGN.md, "The
// shields": the rocks are the game's income, so the failure is load-bearing, and
// nothing here tries to win. What the smash owes the player is that the timber
// flies out along the heap and mines back as dust, so a shield failing is a
// beat, never a bill.
import { S, bench } from './state.js';
import {
  P, WORKER, ROCK_CLEAR,
  PROP_PLANKS, PROP_LEG_W, PROP_LID_T, PROP_CLEAR_C, PROP_PLANK_DUST
} from './config.js';
import { rockSize, rockFootY } from './rock.js';
import { sendOn } from './crew.js';
import { spawnSpoil } from './dust.js';
import { shadeNear } from './grid.js';

// Sized against the rock it has to answer: wide enough for the *next* one's
// footprint and its clearance, and tall enough to stand over whichever is
// bigger of the rock here now and the one coming -- with a body's worth of
// daylight over the peak, so the crew climb under the lid rather than into it.
// Measured, never tuned: a later rock cannot outgrow sums that were taken
// against it rather than guessed before it.
export function raiseProps() {
  const was = S.boulderNo;
  S.boulderNo = was + 1;
  const size = rockSize();
  S.boulderNo = was;
  const w = size.w * P + ROCK_CLEAR * 2 + PROP_LEG_W * P * 2;
  const x = Math.round((S.cx - w / 2) / P) * P;
  const h = Math.max(S.gh, size.h) + PROP_CLEAR_C;
  S.props = { x, w, h, laid: 0 };
  S.dirty = true;
}

export const propsUp = () => !!S.props && S.props.laid >= PROP_PLANKS;

// The lid's top, in world pixels. Whole courses, so the frame sits on the
// lattice like everything else standing on this ground.
export const propsLidY = (p = S.props) => S.groundY - p.h * P;

// One trip is one plank: fetched from the bench and walked out to whichever
// side is next, so the timber visibly arrives from somewhere. One builder at a
// time, like the kit walk -- the build is a story beat, not a race, and a gang
// filing across the yard in step reads as a procession.
function sendBuilder() {
  const p = S.props;
  if (S.workers.some(w => w.leg === 'plank' || (w.legs && w.legs.some(l => l.do === 'plank')))) return;
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft || w.walking || w.carry || w.resting) continue;
    if (w.legs && w.legs.length) continue;   // already on a commute of its own
    const d = Math.abs(w.x - bench.x);
    if (d < near) { near = d; who = w; }
  }
  if (!who) return;
  const side = p.laid % 2 ? 1 : -1;
  const at = side < 0 ? p.x - WORKER : p.x + p.w;
  sendOn(who, [
    { to: bench.x + Math.round(bench.w / 2), do: 'grab' },
    { to: at, do: 'plank' }
  ]);
}

// A plank is laid by a body arriving with it -- crew.js calls this from the
// walk's last leg, and nothing else moves the count, so the frame cannot grow
// except by somebody crossing the yard.
export function layPlank() {
  if (!S.props || S.props.laid >= PROP_PLANKS) return;
  S.props.laid++;
  S.dirty = true;
}

// The rock comes through the lid as if it were not there. Every laid plank
// breaks into spoil thrown along the heap in the arc a miner's spoil takes, and
// lands as ordinary minable dust -- the wreck comes most of the way home. The
// structure is gone and the row never comes back: the yard has learned what
// timber is worth against the sky, and the story moves on.
export function smashProps() {
  const p = S.props;
  if (!p) return;
  const top = propsLidY(p);
  const grains = p.laid * PROP_PLANK_DUST;
  for (let i = 0; i < grains; i++) {
    const px = p.x + Math.random() * p.w;
    const py = top + Math.random() * P * PROP_LID_T;
    spawnSpoil(px, py, shadeNear(3), 'rock');
  }
  S.props = null;
  S.propsDone = true;
  S.dirty = true;
}

// One frame of the props' life. While a rock is falling, watch for its foot
// crossing the lid -- the smash happens where the picture says it does, in the
// air, not at the ground. Otherwise keep a builder on the job until the last
// plank is up.
export function stepProps() {
  const p = S.props;
  if (!p) return;
  if (S.rockFall > 0) {
    if (rockFootY() >= propsLidY(p) - P) smashProps();
    return;
  }
  if (p.laid < PROP_PLANKS) sendBuilder();
}
