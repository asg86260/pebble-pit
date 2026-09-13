// The machine tenders: a body posted at a machine keeps it running while it
// stands there, and steps its stroke. Extracted verbatim from crew.js; behavior
// unchanged. Owns swingFor, stepTender, postOf, tenderFor and stepMachines. It
// is a leaf -- it calls nothing back in crew.js. The spine calls swingFor and
// postOf from here (and game.js calls stepMachines through crew.js's re-export).

import { frames, now } from '../clock.js';
import { CLIMB_PACE, MACHINE_FOUL, MACHINE_CATCHUP_MS, MUCK_SWING, P, SPELL_SWEEP, WORKER } from '../config.js';
import { JOB_MACHINE, MACHINES, machine, specOf } from '../machines.js';
import { sfx } from '../audio.js';
import { quarryFace } from '../quarry.js';
import { busyAt } from '../works.js';
import { shedSite } from './shedhand.js';
import { inWorking, keepTo, stepRoute, ways } from '../route.js';
import { foul } from '../smog.js';
import { S, floor } from '../state.js';
import { spelled } from '../tower.js';
import { JOB_OF, commutePace, machineRate } from '../upgrades.js';
import { walkY } from '../world.js';
import { TYPE } from '../jobs.js';

// How long between one stroke of a shovel and the next. A hastened janitor works
// at twice the pace, which is the tower reaching into the yard rather than into
// its own tower -- see SPELLS.
export const swingFor = w =>
  MUCK_SWING / (w.type === TYPE.JANITOR && spelled('sweep') ? SPELL_SWEEP : 1);

// Tending. One body, standing at the machine that has taken its job over.
//
// It is a walk like any other -- the machine is somewhere to be, and getting
// there is the same commute a body makes to a plot or a face. What it does when
// it arrives is nothing, visibly, which is correct: the machine is doing the
// work and the body is the reason it is allowed to.
//
// Returns true when it has handled the body, so the station's own step is
// skipped. It answers false for every body at a station with no machine running,
// which is every body in the game until one is bought.
export function stepTender(w, now) {
  const job = JOB_OF[w.type];
  const key = JOB_MACHINE[job];
  if (!key) return false;
  const r = machine(key);
  if (!r || !r.bought) return false;
  const spec = specOf(key);
  if (!spec) return false;

  // An upgrade on the go at this body's own station comes first. Tending runs
  // before the job's own step, and once the machine is bought the gang is one
  // body (`capOf`) -- so a tender that never let go was a station whose bought
  // bench sat at nought for the rest of the run: nobody else exists to claim
  // it, and the yard lends no builder to a gang it can count. Declining here
  // hands the frame to `stepShedwork`, which claims the body and walks it to
  // the shed; the machine idles unmanned meanwhile, which is the same bargain
  // a hand-worked gang pays -- while the bench is being cut, nothing comes up.
  // ...and a body still holding a claim after the work has landed is declined
  // too: `stepShedwork` is the only thing that clears `onBuild`, and a tender
  // that grabbed the body first left the claim set for ever -- which reads as
  // claimed to everything that asks, `tenderFor` included.
  const site = shedSite(w);
  if (w.onBuild || (site && busyAt(site))) return false;

  // One machine, one tender. This used to catch every body of the trade: the
  // machine caps its station at one, but nothing capped how many walked to the
  // post -- so a yard carrying nine haulers when the belt was bought parked all
  // nine at its post for the rest of the run, standing in a stack, while the
  // weather's muck -- chiefly the haulers' job -- lay where it fell. Whoever is
  // nearest the post is the tender this frame; everybody else answers to the
  // yard's ordinary work, exactly as if the machine were not theirs to mind.
  const post = postOf(spec, spec.at() - WORKER - P);
  const mine = Math.abs(w.x - post);
  const me = S.workers.indexOf(w);
  for (let i = 0; i < S.workers.length; i++) {
    const o = S.workers[i];
    if (o === w || o.type !== w.type) continue;
    if (o.walking || o.inside || o.aloft || o.lifted || o.falling || o.looUntil) continue;
    const d = Math.abs(o.x - post);
    // Nearer takes it; a dead heat goes to whoever is first in the roster. Nine
    // bodies parked on the same pixel are all exactly as near, and without the
    // tie-break every one of them concluded it was the tender.
    if (d < mine - 0.5 || (Math.abs(d - mine) <= 0.5 && i < me)) return false;
  }

  // Down a working and needing to be up top. A body caught by the lever while
  // it is still on the floor of the cut has to *climb out* -- assigning it
  // `walkY` lifted it straight up through the wall, which is the one thing
  // this yard never does.
  //
  // It is a route, not a walk written out by hand. This used to walk the floor
  // to `quarryFace()` and climb there, which is right for the cut and only the
  // cut: a hauler on the floor of the HOLE, called to the belt, was walked
  // along the pit's floor toward the quarry's ladder and out through the pit's
  // near wall -- `verifyWorld` found it two hundred and seventy-six pixels
  // under the yard with no working under it. The ways know where their
  // ladders are (`links`, route.js); asking them is what every other errand
  // that leaves a working does.
  if (inWorking(w)) {
    if (!keepTo(w, post, ways().yard)) return false;
    w.resting = false;
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
    return true;
  }
  // A tender is not on its way to a cell any more, and a claim it left behind
  // would keep every other body off that cell for as long as it stands there.
  w.cell = null;

  // Some machines are worked from *inside*. A tractor has a seat and a drill rig
  // has a cab, and a body walking along beside either of them all day is a body
  // that has forgotten what the machine is for. Where that place is, is the
  // machine's own business -- see `seat` on the spec -- so this branch knows
  // there is such a thing as a seat and nothing about which machines have one.
  //
  // It still has to *walk over* and get aboard, which is what the catching-up
  // half does. Nothing in this yard arrives anywhere it did not walk to.
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
    w.resting = false;
    return true;
  }

  w.y = walkY(w.x + WORKER / 2);
  // Beside it, not on top of it, the same way a farmhand stands beside a plot
  // rather than over the crop.
  const to = (spec.tendAt ? spec.tendAt() : spec.at() - WORKER - P);
  const d = to - w.x;
  if (Math.abs(d) > 1) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.resting = false;
    return true;
  }
  w.x = to;
  // Not resting: it is at work, whatever it looks like. `break.js` hands a
  // cigarette to a body that had stopped anyway, and a tender has not stopped --
  // the runner also sets this, and both are right for the same reason.
  w.resting = false;
  return true;
}

// --- running a machine ----------------------------------------------------------
// One frame of all three. The beat, the manning rule, and the extra dirt; the
// work itself belongs to the station and is called through its own `bite`.
//
// It lives here rather than in machines.js because it needs the crew, and
// machines.js is imported by `upgrades.js` -- which the quarry, the farm and the
// rock all import in turn. A runner in there that reached back into the stations
// would close that ring. So the stations register what only they can answer and
// this walks the list.

// Where a machine's tender stands, which is the one question "is this thing
// manned" turns on.
//
// A seat outranks a post. `tendAt` is where a body stands *beside* a machine,
// and for one it works from on top of -- a tractor's seat, a rig's roof -- the
// body is nowhere near that spot by design: the ram's roof is sixty-six pixels
// from its tending post, and `MACHINE_REACH` is fifty-four, so the moment its
// tender climbed aboard the machine decided nobody was there and stopped dead.
//
// One answer, read in both places that ask.
export const postOf = (spec, at) =>
  spec.seat ? spec.seat().x : (spec.tendAt ? spec.tendAt() : at);

// Somebody of the right trade, standing at the machine and not doing something
// else. This is the yard's oldest rule rather than a new one -- **a station
// idles until somebody is actually standing there** -- and it is what makes the
// whole feature safe: an unmanned machine produces nothing and smokes nothing,
// so a yard under its own smoke with nobody free to stop it cannot get worse.
// The moment the last body walks away, the machine stops.
//
// It is deliberately generous about *which* body. A machine that insisted on one
// particular tender would stop every time that tender went for a hat.
const MACHINE_REACH = WORKER * 3;
function tenderFor(spec, at) {
  for (const w of S.workers) {
    if (w.type !== spec.type) continue;
    if (w.walking || w.inside || w.aloft || inWorking(w) || w.lifted || w.falling) continue;
    if (w.looUntil) continue;                  // stopped, but not for the machine
    if (w.onBuild) continue;                   // claimed by the station's own upgrade
    if (Math.abs(w.x - postOf(spec, at)) > MACHINE_REACH) continue;
    return w;
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
    const tender = tenderFor(spec, at);
    // Unmanned: it does not tick, and the beat is pushed forward every idle
    // frame so the clock cannot fall behind. There is nothing banked to pay out
    // the moment somebody wanders back into reach; it simply is not running.
    if (!tender) { r.beatAt = now + 200; continue; }
    // Somebody is standing at it, this frame. The belt's band reads this to know
    // whether to keep running -- a load already on it must not be gated on the
    // machine having *bitten*, since the ground goes clean long before the last
    // grain reaches the hole. See `stepBelt`.
    r.mannedAt = now;
    tender.resting = false;                    // it is working, whatever it looks like
    if (!spec.ready()) { r.beatAt = now + 200; continue; }

    // How long one unit of the station's own work takes it. Not clamped to a
    // frame: a machine quicker than sixteen milliseconds has to do *several*
    // units in the frame, or the clamp silently becomes the rate and the dial
    // stops meaning anything at all. That is exactly what was happening -- every
    // machine at every setting of MACHINE_GAIN delivered the same thirty-three
    // units a second, and turning the dial up changed nothing.
    const ms = Math.max(1, spec.ms(machineRate(m.job)));
    if (!r.beatAt || r.beatAt > now + ms) r.beatAt = now + ms;   // a dial turned down
    if (now < r.beatAt) continue;
    // How many beats are owed -- a quarter second's worth at most, so a tab left
    // in the background does not come back and take a hundred cells out of the
    // ground in one frame. See MACHINE_CATCHUP_MS for why it is time and not a
    // count of units.
    let owed = Math.max(1, Math.floor(Math.min(now - r.beatAt, MACHINE_CATCHUP_MS) / ms) + 1);
    r.beatAt = now + ms;
    // The station's own functions are about to run, and they must not foul: the
    // dirt for this beat goes up off the stack, in soot, all in one place. A flag
    // rather than an argument threaded through four files, because what is true
    // is about the *frame* -- the yard is being worked by a machine right now --
    // and every path underneath wants the same answer.
    //
    // Everything owed is handed over at once. A bite takes a count and answers
    // with how many beats' worth it got through -- `true` is one, for a station
    // that works a unit at a time -- and it is asked again only for what it
    // left. A machine past a beat a frame used to be called eight times a frame,
    // and each call did the station's whole bookkeeping over again: eight
    // `refreshRockTops` for the ram, eight walks of the run for the belt. The
    // cap stays what it was, a cap on *units* a frame, so a tab left in the
    // background still cannot come back and take a hundred cells in one go.
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
    // One beat of the machine, however many units it got through this frame:
    // the fold window is what turns a fast machine into a rattle rather than a
    // buzz. The ram's is a strike, and it gets the thump under it.
    sfx('machine-beat', { x: at, big: m.key === 'ram' });
    // It did a unit of work this beat, which is the one thing the stack is
    // allowed to read: a chimney smoking over a machine that is not getting
    // anything done would be the drawing claiming what the yard denies.
    r.working = true;
    // When it last got something done. `working` is true only on the frames a
    // beat actually lands, which for a fast machine is one frame in three -- so
    // a drawing gated on the flag itself strobes. What the drawing wants to know
    // is "has this been working lately", and that is a moment, not a frame.
    r.workedAt = now;

    // The extra dirt, from the machine's stack, in one place.
    //
    // The station's own work already fouled once where it happened, because it
    // went through the station's own function. What a machine adds is the rest
    // of MACHINE_FOUL -- so this is one call rather than three trebled constants
    // at four call sites, and it is why the stack is worth drawing.
    // Per unit of work done, not per frame -- a machine that got through four
    // cells this frame made four cells' worth of dirt.
    // Grey, and 'mach' rather than the station's own kind. What comes off a stack
    // is soot: stone dust off a face is blue because it is stone, and a sky going
    // blue because you bought an engine says the wrong thing twice over.
    // All of it, and all of it soot.
    //
    // This used to be the *extra* over what the station's own work already put
    // up -- so a jaw's dirt went into the sky as one part blue (the cut's own
    // dust, raised inside its own functions) and a bit of grey on top, and the
    // sky over a working quarry stayed blue. What an engine puts up is what an
    // engine puts up wherever it stands, and it is the one thing in the sky that
    // is nobody's resource. So the station's own fouling is switched off while a
    // machine drives it and the whole amount comes off the stack in one colour.
    //
    // Off the top of the stack, which is where the smoke you can see comes from.
    // It used to go up from `at + P` at the machine's own waist -- the left-hand
    // end of the engine, halfway up it -- so the yard drew a chimney puffing at
    // one place and put the dirt into the sky at another. Both read the machine's
    // own `stack` now, which is the station's to answer and nobody else's.
    const dirt = MACHINE_FOUL * did;
    if (dirt > 0) {
      const s = spec.stack ? spec.stack() : { x: at + P, y: spec.y ? spec.y() : walkY(at) };
      foul(dirt, s.x, s.y, 'mach');
    }
    S.dirty = true;
  }
}
