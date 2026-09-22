// The machine tenders: a body posted at a machine keeps it running while it
// stands there, and steps its stroke.

import { frames, now } from '../clock.js';
import { MACHINE_FOUL, MACHINE_CATCHUP_MS, MUCK_SWING, P, SPELL_SWEEP, WORKER, STACK_PUFFS } from '../config.js';
import { JOB_MACHINE, MACHINES, UNMANNED, machine, specOf } from '../machines.js';
import { sfx } from '../audio.js';

import { inWorking, keepTo, stepRoute, ways } from '../route.js';
import { foul, puffStack } from '../smog.js';
import { S, floor } from '../state.js';
import { spelled } from '../tower.js';
import { JOB_OF, commutePace, machineRate } from '../levels.js';
import { walkY } from '../world.js';
import { TYPE } from '../jobs.js';

// How long between one stroke of a shovel and the next; a hastened janitor
// works at twice the pace (SPELLS).
export const swingFor = w =>
  MUCK_SWING / (w.type === TYPE.JANITOR && spelled('sweep') ? SPELL_SWEEP : 1);

// Tending: one body standing at the machine that has taken its job over. It
// does nothing visibly, which is correct: the machine is doing the work and
// the body is the reason it is allowed to. Returns true when it has handled
// the body, so the station's own step is skipped.
export function stepTender(w, now) {
  const job = JOB_OF[w.type];
  const key = JOB_MACHINE[job];
  if (!key) return false;
  const r = machine(key);
  if (!r || !r.bought) return false;
  // A machine that runs itself posts nobody: the body goes about the yard's
  // ordinary work exactly as if the machine were not its trade's.
  if (UNMANNED.has(key)) return false;
  const spec = specOf(key);
  if (!spec) return false;

  // One machine, one tender: whoever is nearest the post this frame. Everybody
  // else answers to the yard's ordinary work, or nine haulers park at the
  // belt's post in a stack while the muck lies where it fell.
  const post = postOf(spec, spec.at() - WORKER - P);
  const mine = Math.abs(w.x - post);
  const me = S.workers.indexOf(w);
  for (let i = 0; i < S.workers.length; i++) {
    const o = S.workers[i];
    if (o === w || o.type !== w.type) continue;
    if (o.walking || o.inside || o.aloft || o.lifted || o.falling || o.looUntil) continue;
    const d = Math.abs(o.x - post);
    // A dead heat goes to whoever is first in the roster: nine bodies parked
    // on the same pixel are all exactly as near.
    if (d < mine - 0.5 || (Math.abs(d - mine) <= 0.5 && i < me)) return false;
  }

  // Down a working and needing to be up top: a route, so it climbs out by its
  // way's own ladder. Assigning `walkY` lifts it through the wall; walking the
  // floor to the quarry's ladder walks a hauler in the HOLE out through the
  // pit's near wall.
  if (inWorking(w)) {
    if (!keepTo(w, post, ways().yard)) return false;
    w.resting = false;
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
    return true;
  }
  // A claim left behind would keep every other body off that cell for as long
  // as the tender stands here.
  w.cell = null;

  // Some machines are worked from *inside* (`seat` on the spec); this branch
  // knows nothing about which. It still walks over and gets aboard.
  if (spec.seat) {
    const seat = spec.seat();
    const d = seat.x - w.x;
    if (Math.abs(d) > WORKER * 2) {                // still catching it up
      w.y = walkY(w.x + WORKER / 2);
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      w.resting = false;
      return true;
    }
    w.x = seat.x;                                  // aboard
    w.y = seat.y;
    // A seat is a body's height over the ground, and the "nothing floats" rule
    // would read it as standing on air. A stamp rather than a flag, like
    // `scaleAt`: nothing has to remember to clear it.
    w.aboardAt = S.tick;
    w.resting = false;
    return true;
  }

  w.y = walkY(w.x + WORKER / 2);
  // Beside it, not on top of it.
  const to = (spec.tendAt ? spec.tendAt() : spec.at() - WORKER - P);
  const d = to - w.x;
  if (Math.abs(d) > 1) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.resting = false;
    return true;
  }
  w.x = to;
  // At work, whatever it looks like: `break.js` hands a cigarette to a body
  // that had stopped.
  w.resting = false;
  return true;
}

// --- running a machine ----------------------------------------------------------
// The beat, the manning rule, and the extra dirt; the work itself belongs to
// the station and is called through its own `bite`. Here rather than in
// machines.js because it needs the crew, and machines.js is imported by
// upgrades.js, which the stations import in turn.

// Where a machine's tender stands, which is what "is this thing manned" turns
// on. A seat outranks a post: a body aboard is nowhere near `tendAt`, and the
// ram's roof is further from its post than `MACHINE_REACH`. One answer, read
// in both places that ask.
export const postOf = (spec, at) =>
  spec.seat ? spec.seat().x : (spec.tendAt ? spec.tendAt() : at);

// Somebody of the right trade, standing at the machine and not doing something
// else. An unmanned machine produces nothing and smokes nothing. Deliberately
// generous about *which* body: a machine that insisted on one tender would
// stop every time it went for a hat.
const MACHINE_REACH = WORKER * 3;
function tenderFor(spec, at) {
  for (const w of S.workers) {
    if (w.type !== spec.type) continue;
    if (w.walking || w.inside || w.aloft || inWorking(w) || w.lifted || w.falling) continue;
    if (w.looUntil) continue;                  // stopped, but not for the machine
    if (Math.abs(w.x - postOf(spec, at)) > MACHINE_REACH) continue;
    return w;
  }
  return null;
}

// The machine this body is minding, `stepMachines`' own answer asked the other
// way round. Derived, never stamped: the tender stage writes no goal, and a
// card reading the goal a body walked there with says "looking for pebbles"
// at the belt for the rest of the run.
export function minding(w) {
  for (const m of MACHINES) {
    const r = machine(m.key), spec = specOf(m.key);
    if (!r || !r.bought || !spec || spec.type !== w.type || m.unmanned) continue;
    if (tenderFor(spec, spec.at()) === w) return m;
  }
  return null;
}

export function stepMachines(now) {
  for (const m of MACHINES) {
    const r = machine(m.key);
    const spec = specOf(m.key);
    if (!r || !spec || !r.bought) continue;

    const at = spec.at();
    r.working = false;                         // until it gets through all of it
    // A machine that runs itself needs nobody; every other one needs a body
    // standing at it.
    const tender = UNMANNED.has(m.key) ? null : tenderFor(spec, at);
    // Untended: the beat is pushed forward every idle frame so the clock cannot
    // fall behind; nothing is banked to pay out when somebody wanders back.
    if (!tender && !UNMANNED.has(m.key)) { r.beatAt = now + 200; continue; }
    // The belt's band reads this to keep running: a load already on it must
    // not be gated on the machine having *bitten*, since the ground goes clean
    // long before the last grain reaches the hole (`stepBelt`).
    r.mannedAt = now;
    if (tender) tender.resting = false;        // it is working, whatever it looks like
    if (!spec.ready()) { r.beatAt = now + 200; continue; }

    // Not clamped to a frame: a machine quicker than a frame does *several*
    // units in it, or the clamp silently becomes the rate and the dial stops
    // meaning anything.
    const ms = Math.max(1, spec.ms(machineRate(m.job)));
    if (!r.beatAt || r.beatAt > now + ms) r.beatAt = now + ms;   // a dial turned down
    if (now < r.beatAt) continue;
    // Beats owed, a quarter second's worth at most, so a tab left in the
    // background does not come back and take a hundred cells in one frame.
    let owed = Math.max(1, Math.floor(Math.min(now - r.beatAt, MACHINE_CATCHUP_MS) / ms) + 1);
    r.beatAt = now + ms;
    // The station's own functions must not foul while a machine drives them:
    // the dirt goes up off the stack below, in soot, in one place. A flag
    // because what is true is about the frame and every path underneath
    // wants the same answer.
    //
    // Everything owed is handed over at once: a bite takes a count and answers
    // with how many beats' worth it got through (`true` is one), and is asked
    // again only for what it left, so the station's bookkeeping runs once a
    // frame rather than once a beat.
    let did = 0;
    S.machineWorking = true;
    while (owed > 0) {
      const got = spec.bite(tender, owed);
      const n = got === true ? 1 : +got || 0;
      if (n <= 0) break;
      did += n;
      owed -= n;
    }
    S.machineWorking = false;
    if (!did) continue;
    // Heard at a body's pace, not its own: `ms(1)` is the station's own clock,
    // and per beat the ram is eight strikes a second. The drill's event is its
    // own so the bench can silence it alone.
    if (now >= (r.soundAt || 0)) {
      r.soundAt = now + spec.ms(1);
      sfx(m.key === 'jaw' ? 'drill-beat' : 'machine-beat', { x: at, big: m.key === 'ram' });
    }
    // The one thing the stack is allowed to read: a chimney smoking over a
    // machine getting nothing done is the drawing claiming what the yard
    // denies.
    r.working = true;
    // `working` is true only on the frames a beat lands, so a drawing gated on
    // it strobes; "has this been working lately" is a moment.
    r.workedAt = now;

    // All the dirt, per unit of work done, all of it soot ('mach'): what an
    // engine puts up is nobody's resource, so the station's own fouling is
    // switched off while a machine drives it and the whole amount comes off
    // the stack in one color. Off the top of the stack, which is the
    // station's to answer, so the chimney puffs where the dirt goes up.
    const dirt = MACHINE_FOUL * did;
    const s = spec.stack ? spec.stack() : { x: at + P, y: spec.y ? spec.y() : walkY(at) };
    if (dirt > 0) foul(dirt, s.x, s.y, 'mach');
    // and the smoke you see, off the same stack, on the same beat
    puffStack(s.x, s.y, STACK_PUFFS);
  }
}
