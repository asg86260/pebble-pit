// --- going and shovelling -------------------------------------------------------
// One thing a body can be told to do, because several kinds of body have to
// be able to do it. Idle bodies and a mess is the one combination this rules
// out.

import { P, WORKER } from '../config.js';
import { S } from '../state.js';
import { workSpot, muckAtCol, nearestMuck, muckFor, sweepMuckAt, poopCols, colAt,
         MUCK_ELBOW } from '../smog.js';
import { NONE, footing, ways, wayAt, wayOver, keepTo, stepRoute, climbTo, feetOn, inWorking } from '../route.js';
import { commutePace } from '../levels.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { stopJig } from './dance.js';
import { swingFor } from './tenders.js';
import { across, stand } from './body.js';
import { unbook } from './hole.js';

// Nobody shovels inside anybody, but only when two are genuinely standing in
// each other: the claims already keep them four columns apart, and a wider
// push shoves a body out of the patch it is walking back to, sixty times a
// second. Hands the nudge back rather than moving the body, because a
// shovelling body's x is snapped to a whole cell and a third of a pixel does
// not survive a snap.
function elbowMuck(w) {
  for (const o of S.workers) {
    if (o === w || o.inside || o.goal !== 'muck' || inWorking(o)) continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= WORKER * 0.8) continue;
    // Two on the very same pixel have no side to push to: the tiebreak is the
    // crew list, so they alternate. Sideways only; height belongs to whoever
    // is doing the job, or a rockhand shovelling the crest flickers between
    // the top of the rock and the ground.
    const tie = S.workers.indexOf(w) % 2 ? 1 : -1;
    return -Math.sign(d || tie) * 0.35 * frames();
  }
  return 0;
}

// The nearest column of poop, `nearestMuck`'s search kept to the one kind
// that is a janitor's alone. Reads and writes the same `taken` set with the
// same elbow, so the two searches can never both hand out the same ground.
function nearestPoop(wx, taken) {
  const p = poopCols();
  const home = colAt(wx);
  for (let d = 0; d < p.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= p.length || !p[c]) continue;
      if (taken && taken.has(c)) continue;
      if (taken) for (let k = c - MUCK_ELBOW; k <= c + MUCK_ELBOW; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  return null;
}

// A frame this errand keeps the body for without sending it anywhere. The
// stage that owns a frame owns the body's feet, so a body held here is stood
// on its ground here; left "where it is", a rockhand that let a patch go
// mid-climb stands three cells over the hill's flank.
const held = w => { w.y = stand(w); return true; };

// Returns true if the body is on muck duty and has had its turn this frame.
export function takeMess(w, c) {
  const { now, taken, muckTaken, poopTaken } = c;
  // Two kinds of mess: what the sky drops is everybody's, what a body leaves
  // behind is a post, and only a janitor's (`muckFor`, `capOf`).
  if (w.carry || w.hasCore || muckFor(w) <= 0) return false;
  // One body, one column, held until that column is clear; a set rebuilt
  // every pass is not a claim. A finished column is let go and the next one
  // picked a FRAME later: the set carries this body's own elbows until the
  // rebuild, so a same-frame re-pick hops away from its own remnants. That
  // frame is still a frame on the job (`held`), or `mess.back` walks the body
  // a stride toward home and the next claim walks it back, once a column.
  if (w.muckAt != null && muckAtCol(w.muckAt, w) <= 0) { w.muckAt = null; return held(w); }
  // The same frame of empty hands when the hauler's hole branch let the
  // column go (`muckDropped`): the set is just as stale.
  if (w.muckDropped === now) return held(w);
  if (w.muckAt == null) {
    // A janitor's own kind first: with the rest of the crew free to work
    // everything else, the nearest shared column keeps drifting away from
    // the poop, and the mess the player wants gone is never the nearest.
    const pick = (w.type === TYPE.JANITOR ? nearestPoop(w.x + WORKER / 2, poopTaken) : null)
      ?? nearestMuck(w.x + WORKER / 2, muckTaken, w);
    w.muckAt = pick == null ? null : Math.floor(pick / P);
    // The elbow's push belongs to the stance it was pushed on (see below).
    w.shovelAt = null;
  }
  // The patch, and the ground to work it from: a body cannot stand on a site,
  // so it walks to the edge and reaches across. The claim is the muck's own
  // column, held until that column is clear.
  const patch = w.muckAt == null ? null : w.muckAt * P + P / 2;
  if (patch == null) return false;
  // Over a mouth, a stance further from its patch than a body's width is not
  // a stance: `workSpot` widens its search until it finds real ground
  // somewhere, and muck over the open mouth of an empty pit hands back dry
  // land cells away, with the body shovelling across the gap from the ground
  // line. The claim is dropped and picked again next frame instead. On a heap
  // the reach is the point: a body cannot stand on loose dust, so it stands at
  // the foot of the bank and the shovel goes up it (`sweepMuckAt` takes the
  // nearest cells first), or the muck a rain leaves on the middle of a wide
  // bank -- further from bare ground than `slideOffLoose` carries it -- is
  // claimed, refused and claimed again by every body in the yard for good.
  const to = patch == null ? null : workSpot(patch);
  if (to == null || (footing(patch) === NONE && Math.abs(to - patch) > WORKER)) { w.muckAt = null; return held(w); }
  // A mess under the coming rock, or across it, is not fetched through the
  // fall: the walk knows nothing of the zone and judders against its wall.
  if (S.rockFall > 0 && c.zone &&
      ((to + WORKER > c.zone.from && to < c.zone.to) || across(c.zone, w.x, to))) {
    // The claim is kept (nobody else can walk there either) and the body is
    // left to the celebrate stage, which has already had this frame.
    return true;
  }
  // the dance is put away when the shovel comes out, so the hop is not carried
  // to the mess
  if (w.jigAt != null) stopJig(w);
  if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
  unbook(w);
  // Out of the house first: this runs before the going-home branch, and a
  // body indoors otherwise works the yard invisible.
  w.inside = false;
  w.goal = 'muck';
  // Off the rock climbed down, not dropped: nothing needs setting, `climbTo`
  // eases from wherever the feet are in either direction.
  if (w.type === TYPE.ROCK) {
    if (w.jigAt != null) stopJig(w);
    w.idleAt = null;
  }
  // A shovel in hand is not a break, whoever is holding it.
  w.resting = false;
  // Getting there is a route, not a walk: the mess is on a way, and feet
  // planted on the mess's way for the whole trip walk a janitor coming off
  // the crest through solid rock (rule 2 in verify.js).
  const at = to - WORKER / 2;
  const all = ways();
  const on = wayOver(at, all);
  // A couple of cells short is arrived, but only from the right way: the
  // mess's x at the yard's height under a heap on the hill is one coordinate
  // out of two. Once stood there, a body's width more than that: the elbow
  // parts two shovellers by a body's width from wherever they arrived, and
  // arrival may be the two cells short, so any less walks a parted body
  // straight back in.
  const arrive = P * 2;
  const slack = w.route ? arrive : arrive + WORKER;
  if (Math.abs(at - w.x) > slack || wayAt(w.x, w.y, all).key !== on.key) {
    w.shovelAt = null;
    // Nowhere a route reaches: give the patch up rather than hold a claim on
    // it; `mess.back` puts the body on its own goal and it looks again.
    if (!keepTo(w, at, on)) return false;
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
    return true;
  }
  w.route = null;
  // Arrived: it plants its feet on a whole cell, swings, and a cell comes
  // off. Snapped, not pinned, because the elbow has to be able to move a body
  // or the gang bunches onto one spot.
  //
  // The fraction lives on `shovelAt` (the trap balloon.js writes up: a thing
  // moving less than a pixel a frame has to remember the part of a pixel it
  // has moved), or the elbow's third of a pixel is undone by the next frame's
  // round and two bodies shovel through each other for the whole clear-up.
  //
  // The feet go down on `at`'s cells, snapped TOWARD `at`, never past it:
  // rounding to the world's cells sends a body arrived a fraction short back
  // the other way, and `faceTravel` turns it round on the frame it arrives.
  // Once down, the feet move a whole cell each time the push adds up to one
  // from where they stand. Rounding the push itself toward `at` would make the
  // cell on `at` two cells wide -- a push crossing it pays double, and a
  // fraction left behind that side starts a cell in arrears -- so a pair
  // elbowed across their patch parts one cell short of a body's width.
  //
  // The push is the stance's: a new claim or a walk forgets it. Kept, a push
  // left over from the column before pulls a body that has just stepped a
  // cell to its next column straight back, off that column's ground, and the
  // body climbs back and drops again five times a second.
  const spot = s => { const d = s - at; return at + Math.sign(d) * Math.floor(Math.abs(d) / P) * P; };
  const cells = (w.x - at) / P;
  if (Math.abs(cells - Math.round(cells)) > 1e-6) { w.x = spot(w.x); w.shovelAt = null; }
  // Further from the feet than a frame's push can leave it is a push from
  // some other stance (a load): it starts again from here.
  if (w.shovelAt == null || Math.abs(w.shovelAt - w.x) >= 2 * P) w.shovelAt = w.x;
  const push = w.shovelAt - w.x;
  if (Math.abs(push) >= P) w.x += Math.sign(push) * Math.floor(Math.abs(push) / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  if (now >= (w.sweepAt || 0)) {
    sweepMuckAt(w.x + WORKER / 2, 1, w);
    w.lunge = 1;
    w.sweepAt = now + swingFor(w) * (0.85 + rand() * 0.3);
  }
  // and not shoulder to shoulder with the next one, or a gang that arrived
  // together clears the mess as one lump you cannot count
  w.shovelAt += elbowMuck(w);
  return true;
}
