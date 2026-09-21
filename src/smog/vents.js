import { now } from '../clock.js';
import { GOING_CAP, P, PLUME_LEAN, PLUME_LIFE, PLUME_THIN, PUFF_FADE, PUFF_LEAN_WIND, PUFF_UP, PUFF_UP_FLOOR, PUFF_UP_GIVE, PUFF_WANDER, SMOG_CAP, SMOG_GIVE, SMOG_PER_DUST, SMOG_PER_MOTE, SMOG_TINTS } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { give, windAt } from '../wind.js';
import { GOING, SKY, bandLow, bandTop, drift } from './band.js';
import { countMade } from './books.js';
import { enter, nextSlot } from './sky.js';

// --- what goes up --------------------------------------------------------------
// Something was taken out of the ground, at a place. `kind` is which part of
// the works it came out of, carried on the mote: by the time a mote has
// settled and spread it is nowhere near what made it.
export function foul(grains, x, y, kind = 'dust') {
  // The sky takes a machine's soot off its stack (`stepMachines`) and a light
  // dust off hand work (`rockhandWork`, capped in the caller). Nothing else --
  // a stray kind is a bug, not a new source. Unconditional on the yard's
  // state, not gated on a machine working *now*: a gate makes "hand work
  // fouls" true only while a machine happens to be mid-beat.
  if (kind !== 'mach' && kind !== 'dust') return 0;
  if (!grains) return;
  const add = grains * SMOG_PER_DUST;
  countMade(add);                  // counted where it is made -- see `sampleAir`
  // Nothing is added to the number here: the haze *is* the motes (`reckon`),
  // so this puts motes up and the number follows by arithmetic. Two accounts
  // of one thing disagreeing is a shower that stops with the number still
  // over the line and starts again next frame.
  if (x == null) return;
  // One puff stands for one mote's worth of sky, so what goes up is what this
  // was worth: the whole ones, and the fraction as a chance at one more. A
  // cut shard is worth nearly seven; one puff at most for it is a number that
  // climbs away from the sky it counts.
  const puffs = whole(add / SMOG_PER_MOTE);
  for (let i = 0; i < puffs; i++) {
    // The one place a mote is turned away, and it is turned away *with* its
    // dirt: the number cannot go up if the speck did not.
    if (SKY.length >= MOTE_CAP) break;
    // No cap on the climb: past a cap the next puff went straight into the
    // band, which is pollution appearing out of nothing a hundred cells from
    // anything that could have made it. Made by the band's own maker because
    // it will be a mote in the band and the object is never replaced
    // (`skyMote`). Eight cells of scatter at birth: three read as one column
    // however much it leaned.
    const p = skyMote(x + (rand() - 0.5) * P * 8, y, kind);
    p.up = true;
    // The one number that decides whether a plume reads as smoke or as
    // sparks: slower and closer together, the plume rises as a body.
    p.vy = -(PUFF_UP + rand() * PUFF_UP_GIVE);
    // A plume widens with height; every puff on the same shared sway is a
    // straight cylinder, a pipe rather than smoke.
    p.lean = (rand() - 0.5) * 2;
    enter(p);
  }
}

// Whole things out of a fractional amount: the whole ones, and the fraction
// as a chance at one more. Exact over a run.
const whole = n => Math.floor(n) + (rand() < n - Math.floor(n) ? 1 : 0);

// What the sky holds at its filthiest, in motes.
const MOTE_CAP = Math.round(SMOG_CAP / SMOG_PER_MOTE);

// The number over the pit, worked out from the sky rather than kept beside
// it. This is the whole of the accounting: there is no second place where
// haze is added or taken.
export const reckon = () => { S.haze = SKY.length * SMOG_PER_MOTE; };

// What a speck looks like, decided once at birth and kept across the climb
// and the band alike: the thing off the swing and the thing in the band are
// one thing, and its color is no different.
export const look = (kind = 'dust') => ({
  // A fifth either side of the haze's own ink: one weight for every speck is
  // noise laid over the sky rather than smoke of different ages hanging in it.
  ink: 0.8 + rand() * 0.4,
  // which of its kind's shades it is (SMOG_TINTS)
  tone: Math.floor(rand() * (SMOG_TINTS[kind] || SMOG_TINTS.dust).length)
});

// A mote is a place in the band, a share of the wind, and for its first few
// seconds where it came in.
//
// There is one shape of mote, climbing or settled, and every field either
// kind will ever have is named here even where it means nothing yet. A speck
// that goes up is *the same object* that comes to rest, and handing it new
// fields on arrival and `delete`-ing others puts it in dictionary mode for
// life: with a full band, `place` reading eleven fields off every mote was
// three million dictionary lookups a second, more than half the frame.
export const skyMote = (x, y, kind = 'dust') => ({
  kind,
  up: false,                            // arrived: this one is in the band
  ...look(kind),
  ...nextSlot(),
  // The climb (`stepPuffs`): how fast it is rising, where it started, which
  // way it leans.
  vy: 0,
  y0: y,
  lean: 0,
  // What a hand through the smoke and the draught have bent it out of place
  // by. Both ease back to nought and both start there.
  px: 0, py: 0, sx: 0, sy: 0,
  // its share of the wind, a sixth either way
  give: give(rand(), SMOG_GIVE),
  // The band's shared creep when this mote's place was fixed; what it has
  // crept is `give * (drift - roam0)` on demand (`roamOf`).
  roam0: drift,
  age: 0,
  fromX: x,
  fromY: y,
  // From nothing: a speck born at full weight pops into view. Every mote
  // everywhere comes up to weight over PUFF_FADE, a climber's fade stepped
  // by `stepPuffs` and a settled one's by `place`.
  fade: 0,
  // the phase its own sideways wander runs on, fixed at birth so a puff leans
  // its own way for the whole climb (`stepPuffs`)
  seed: rand() * Math.PI * 2,
  // Which shower this one belongs to, if any. Written by `stepSmog` when a
  // shower breaks and read by `doomed`; named here because a field added late
  // is a mote that has stopped being one shape.
  rain: -1,
  // Whether it still has anything to integrate, and whether it is still in
  // the sky at all. A mote at rest is not stepped, and `x`/`y` below are
  // whatever it was last written at rather than where it is: ask `moteX` and
  // `moteY`.
  awake: false,
  gone: false,
  x: x,
  y: y
});

// An even handful of a list, in its own order. The first n of the sky are the
// *oldest* n, near neighbors that agree with each other rather than with the
// weather; striding across the list samples the band instead of one swirl.
export function spread(list, n) {
  if (list.length <= n) return list;
  const step = list.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
  return out;
}

// How many should be up there for the haze there is.
export const motesWanted = () => Math.round(S.haze / SMOG_PER_MOTE);

// The height a mote lives at: its slot's own place down the sky, the same
// line `moteY` reads.
const slotY = (m, top, deep) => top + m.sv * deep;

export function stepPuffs(secs) {
  const top = bandTop(), deep = bandLow() - top;
  const w = windAt(now());          // one wind, asked once, for the whole plume
  const tSec = now() / 1000;        // one clock for every puff's wander
  const fadeBy = secs / (PUFF_FADE / 1000);
  for (let i = SKY.length - 1; i >= 0; i--) {
    const p = SKY[i];
    if (!p.up) continue;            // arrived: the band has it, see `place`
    // It runs out of climb, drifts on what it had, and thins into what is
    // already up there. It does not slide to a spot along the sky: that reads
    // as an errand, not weather, and the spreading is the band's own.
    const rose = -p.vy * secs * 60;             // what it climbed this frame
    p.y -= rose;
    // carried by the yard's wind, its own share of it, for as long as it is up
    p.x += w * PUFF_LEAN_WIND * p.give * secs;
    // A tenth of the climb sideways, the way it leans. Off the climb rather
    // than the clock, so the drift is the same share of the height however
    // fast the puff got up there.
    p.x += p.lean * PLUME_LEAN * rose;
    // Its own wander on top of the lean: a lean is one straight line per
    // puff, and a sheaf of straight lines is a band splayed, not a plume
    // billowing open.
    p.x += Math.sin(p.seed + tSec * 0.7) * PUFF_WANDER * secs;
    // Coming up to weight, and only while the plume is still a plume: past
    // PLUME_LIFE the thinning below owns the fade, and stepping it up under
    // that would be two hands on one number.
    if (p.age <= PLUME_LIFE && p.fade < 1) p.fade = Math.min(1, p.fade + fadeBy);
    // whatever the cursor left in it, dying away
    if (p.sx || p.sy) {
      p.x += p.sx || 0;
      p.y += p.sy || 0;
      p.sx = (p.sx || 0) * 0.94;
      p.sy = (p.sy || 0) * 0.94;
    }
    // It eases off as it goes but never below a crawl: a puff that ran out of
    // push halfway and hung about would be a swing that never reached the sky.
    p.vy = Math.min(p.vy * (1 - secs * 0.12), -PUFF_UP_FLOOR);

    // A plume is a plume for PLUME_LIFE, and no puff flies to its slot: a
    // column of smoke crossing the whole view reads as an event, not exhaust.
    // It thins out where it is over PLUME_THIN, and only once gone from the
    // climb does the same object join the band at its slot, fading in there
    // over PUFF_FADE. The relocation waits a tenth past the fade reaching
    // nothing, and the weight is derived from the age rather than integrated,
    // so whatever the frame step there is no instant at which something
    // visible is somewhere new; the sky-readout check holds that rule.
    p.age += secs;
    if (p.age <= PLUME_LIFE) continue;
    p.fade = Math.max(0, 1 - (p.age - PLUME_LIFE) / PLUME_THIN);
    if (p.age <= PLUME_LIFE + PLUME_THIN + 0.1) continue;
    settleHere(p, false);
    // Born straight at its place in the band, so the sink ease has nothing to
    // do and the fade-in is the whole of the arrival.
    p.fromY = slotY(p, top, deep);
    p.y = p.fromY;
  }
}

// A climbing mote becomes a band mote, in place: its position, look and
// weight are not touched. `ghost` is the cross-fade picture left at the top
// of a finished climb; a plume that timed out has already thinned to nothing,
// and a ghost there would draw the smoke back in where it just faded.
function settleHere(m, ghost = true) {
  m.up = false;
  // Its look is deliberately not among the fields set here: `foul` gave it
  // one when it left the swing and it keeps it.

  Object.assign(m, nextSlot());
  m.roam0 = drift;
  m.age = 0;
  m.fromX = m.x;
  m.fromY = m.y;
  // It comes up to weight rather than appearing at it, and a picture of it is
  // left behind at the top of the climb to thin out: the arrival at a slot is
  // a jump, and without the cross-fade the plume pops out of existence at the
  // top.
  if (ghost && GOING.length < GOING_CAP) {
    // still climbing and still leaning: smoke thinning as it goes, not a
    // speck parked in the air
    GOING.push({ x: m.x, y: m.y, kind: m.kind, tone: m.tone, ink: m.ink, t: 1,
                 vx: m.lean * PLUME_LEAN * 2, vy: m.vy });
  }
  m.fade = 0;
  // Set back rather than deleted: a `delete` turns the object into a
  // dictionary for good. See `skyMote`.
  m.vy = 0;
  m.lean = 0;
  m.y0 = m.y;
}
