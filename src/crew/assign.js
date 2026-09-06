// Workers assigned by hand (wave7b-assign, feedback7 item 16): dropping a held
// body onto a station retrains it. The counters and their buttons stay; this is
// the same move -- the ask moves at the drop, exactly what a button press does
// -- reached through the body instead of through the boards. The body then
// walks its own retraining: old hat down, new hat on at the kit stand, in
// through the door. Nothing teleports; only the number moves at the drop.
//
// This file owns the target map and the drop's meaning. The pointer (drop in
// crew/pointer.js) asks assignDrop first and only throws the body if nothing
// here took it; the aura (render/aura.js) asks holdTarget so the ring on the
// station under a held body is read off the same table the drop will consult.
// One table, so the ring and the deal cannot disagree.

import { standRect } from '../board.js';
import { ASSIGN_PAD, P, WORKER } from '../config.js';
import { JOB, JOB_OF } from '../jobs.js';
import { cellPos, rockDown, rockFootY } from '../rock.js';
import { S } from '../state.js';
import { roomAt } from '../upgrades.js';
import { retask } from './commute.js';
import { joinJob } from './kitwalk.js';
import { lifted } from './pointer.js';

// Which job a drop on a station means. The same shape pilemarks reads its
// under-staffed mark off: only the stations whose headcount is a gang's. The
// bench, the house, the books hire nobody, so a body dropped on them is a body
// thrown at a building, which is today's throw.
const JOB_AT = { quarry: JOB.QUARRY, farm: JOB.FARM, scrub: JOB.PURIFY,
                 tower: JOB.WIZARD, lab: JOB.SCHOLAR, apothecary: JOB.STIR,
                 outhouse: JOB.JANITOR, school: JOB.TEACH };

// Every place a held body can be dropped to mean something, as {key, job, rect}.
//
// A station's rect is where you have to stand to open its board, padded out by
// ASSIGN_PAD -- a body is a bigger thing than a cursor, and a drop that has to
// land pixel-perfect on a doorway is a control nobody hits twice. standRect is
// null until the station is standing, so a place not yet built is not a target.
//
// The rock is a target too -- rockhands are hired by count like everybody else
// -- and its box is the boulder's own footprint, the same box a swing reads.
// No target for haulers: carrying is the remainder, rebalance()'s to give, and
// there is nowhere to drop a body to ask for it.
export function dropTargets() {
  const out = [];
  for (const key of Object.keys(JOB_AT)) {
    const r = standRect(key);
    if (!r) continue;
    out.push({ key, job: JOB_AT[key],
               rect: { x: r.x - ASSIGN_PAD, y: r.y - ASSIGN_PAD,
                       w: r.w + ASSIGN_PAD * 2, h: r.h + ASSIGN_PAD * 2 } });
  }
  if (rockDown()) {
    const left = cellPos(0, 0).px;
    out.push({ key: 'rock', job: JOB.ROCK,
               rect: { x: left, y: rockFootY() - S.gh * P,
                       w: S.gw * P, h: S.gh * P } });
  }
  return out;
}

const inRect = (x, y, r) =>
  x >= r.rect.x && x <= r.rect.x + r.rect.w &&
  y >= r.rect.y && y <= r.rect.y + r.rect.h;

// The target a drop at (x, y) would join, or null. A target is only a target
// if the deal would go through: the job is not the body's own (dropping a
// farmhand on the farm is putting a farmhand down, not hiring one) and the
// station has room. No room, no target -- the ring and the drop read this one
// answer, so a station that shows no ring takes no body.
function targetAt(w, x, y) {
  for (const t of dropTargets()) {
    if (!inRect(x, y, t)) continue;
    if (t.job === JOB_OF[w.type]) return null;
    if (roomAt(t.job) < 1) return null;
    return t;
  }
  return null;
}

// The target under the cursor while a body is held, for the aura to ring.
// Asked off S.mouse rather than off the body, because the body hangs off the
// cursor -- they are the same spot -- and the mouse is the fact state.js keeps.
export function holdTarget() {
  const w = lifted();
  if (!w) return null;
  return targetAt(w, S.mouse.x, S.mouse.y);
}

// The drop itself. Called by drop() in pointer.js before the throw physics;
// true means the body was taken and the throw must not happen.
//
// The ask moves here, at the drop -- that is what the roster buttons do today,
// and the drop is the same purchase made with a hand. The old job's count comes
// down first (a hauler's does not: carrying is derived, there is no ask to
// return), then joinJob moves the body's type and the new count together and
// rebalances, so the crew rebuild finds everybody where it wants them. Then
// retask walks the body through its retraining on foot. It is still in the air
// when retask is called; the fall stage holds the walk until it lands, and a
// landing away from the new station re-issues the same walk anyway.
export function assignDrop(w) {
  const t = targetAt(w, w.x + WORKER / 2, w.y + WORKER / 2);
  if (!t) return false;
  const old = JOB_OF[w.type];
  const paid = old && old !== JOB.HAUL && S[old] > 0;
  if (paid) S[old] -= 1;
  if (!joinJob(w, t.job)) {
    // joinJob said no after all (the counts can move between the ring and the
    // release). The old ask goes back where it was and the drop is a throw.
    if (paid) S[old] += 1;
    return false;
  }
  retask(w, w.type);
  return true;
}
