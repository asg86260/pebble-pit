// Workers assigned by hand: dropping a held body onto a station retrains it.
// Only the ask moves at the drop, exactly as a roster button does; the body
// then walks its own retraining, old hat down, new hat on, in through the door.
//
// This file owns the target map and the drop's meaning. `drop` in pointer.js
// asks assignDrop first and only throws the body if nothing here took it; the
// aura asks holdTarget off the same table, so the ring and the deal cannot
// disagree.

import { standRect } from '../board.js';
import { ASSIGN_PAD, P, WORKER } from '../config.js';
import { JOB, JOB_OF } from '../jobs.js';
import { cellPos, rockDown, rockFootY } from '../rock.js';
import { S } from '../state.js';
import { roomAt } from '../levels.js';
import { retask } from './commute.js';
import { joinJob } from './kitwalk.js';
import { lifted } from './pointer.js';

// Which job a drop on a station means: only the stations that hire. A body
// dropped on the bench or the house is a body thrown at a building.
const JOB_AT = { quarry: JOB.QUARRY, farm: JOB.FARM, scrub: JOB.PURIFY,
                 tower: JOB.WIZARD, apothecary: JOB.STIR,
                 outhouse: JOB.JANITOR };

// Every place a held body can be dropped to mean something, as {key, job, rect}.
// standRect is null until the station is standing, so a place not yet built is
// not a target. The rock's box is the boulder's own footprint. No target for
// haulers: carrying is the remainder, rebalance()'s to give.
export function dropTargets() {
  const out = [];
  for (const key of Object.keys(JOB_AT)) {
    const r = standRect(key);
    if (!r) continue;
    // rect is the hit box, padded by ASSIGN_PAD and running from the top of
    // the sky down to the station's foot, because a held body hangs off the
    // cursor well above the ground. ring is the station's own ground, unpadded,
    // for the aura: a ring on the padded box floats in the white sky and is
    // invisible on this palette.
    out.push({ key, job: JOB_AT[key], ring: r,
               rect: { x: r.x - ASSIGN_PAD, y: 0,
                       w: r.w + ASSIGN_PAD * 2, h: r.y + r.h + ASSIGN_PAD } });
  }
  if (rockDown()) {
    const left = cellPos(0, 0).px;
    const box = { x: left, y: rockFootY() - S.gh * P,
                  w: S.gw * P, h: S.gh * P };
    out.push({ key: 'rock', job: JOB.ROCK, ring: box,
               rect: { x: box.x, y: 0, w: box.w, h: box.y + box.h } });
  }
  return out;
}

const inRect = (x, y, r) =>
  x >= r.rect.x && x <= r.rect.x + r.rect.w &&
  y >= r.rect.y && y <= r.rect.y + r.rect.h;

// The target a drop at (x, y) would join, or null: only where the deal would
// go through (not the body's own job, and the station has room). The ring
// and the drop read this one answer, so a station that shows no ring takes no
// body.
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
export function holdTarget() {
  const w = lifted();
  if (!w) return null;
  return targetAt(w, S.mouse.x, S.mouse.y);
}

// Every target the held body could join, for the markers shown while a body
// is up. Same table, same two vetoes as the drop itself.
export function holdOptions() {
  const w = lifted();
  if (!w) return [];
  return dropTargets().filter(t => t.job !== JOB_OF[w.type] && roomAt(t.job) >= 1);
}

// The drop itself. True means the body was taken and the throw must not
// happen. The old job's count comes down first (a hauler's does not: carrying
// is derived, there is no ask to return), then joinJob moves the type and the
// new count together and rebalances. The body is still in the air when retask
// is called; the fall stage holds the walk until it lands.
export function assignDrop(w) {
  const t = targetAt(w, w.x + WORKER / 2, w.y + WORKER / 2);
  if (!t) return false;
  const old = JOB_OF[w.type];
  const paid = old && old !== JOB.HAUL && S[old] > 0;
  if (paid) S[old] -= 1;
  if (!joinJob(w, t.job)) {
    // The counts can move between the ring and the release: the old ask goes
    // back and the drop is a throw.
    if (paid) S[old] += 1;
    return false;
  }
  retask(w, w.type);
  return true;
}
