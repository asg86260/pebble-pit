// The stage cleared for the ending's two scenes: the rescue under the dome
// and the snatch at the plank show their pair and nobody else.
//
// For as long as one of them plays, every other body on the yard inside the
// scene's frame stops what it is doing and walks out of it -- to the nearer
// edge, on its own legs, at the pace anybody crosses the yard at -- and
// stands there facing in. A body outside that would walk in is held at the
// edge, the way the drop zone holds its line. When the scene is over each
// one that was stood off is put back on its job, which walks it back to its
// work. Nothing is hidden and nothing is moved but by walking.
//
// The rescue's frame is taken from the dome's scene, which starts on the
// rock leaving the sky: the walk-off runs through the fall, the catch and the
// dig, all of which come before anybody steps out of the ground. The snatch's
// is the plank's, and the portal waits at the edge until the frame is clear
// (`stageClear`, snatch.js), never longer than STAGE_WAIT_S.

import { P, WORKER, STAGE_MARGIN } from './config.js';
import { S } from './state.js';
import { beatRunning } from './beats.js';
import { sceneFrame } from './cutscene.js';
import { keepTo, stepRoute, wayOver } from './route.js';
import { commutePace } from './levels.js';
import { outOfYard } from './crew/records.js';
import { onYard, stand, duck } from './crew/body.js';
import { retask } from './crew/commute.js';

// Which scene's frame is the stage now, if any. The dome's scene plays only
// for its first hold, which is the rescue (beats.js, `shieldFalls`), and the
// stage is its from the rock leaving the sky to the end of the rescue's own
// beat: the sqwife joins the crew there, and the two of them would be walked
// off their own scene by its tail. The snatch's lasts as long as its camera,
// since she has gone under by then.
function staged() {
  if (beatRunning('snatch') || beatRunning('snatchcam')) return 'snatchcam';
  if (beatRunning('rescue') || (beatRunning('dome') && !S.rescued)) return 'dome';
  return null;
}

// Taken once a scene and kept: the dome fades at the end of its scene, and a
// frame read off it then would slide out from under the bodies stood at its
// edge.
let held = null;
export function stageZone() {
  const key = staged();
  if (!key) { held = null; return null; }
  if (!held || held.key !== key) {
    const f = sceneFrame(key);
    const pad = STAGE_MARGIN * P;
    held = { key, from: f.from - pad, to: f.to + pad };
  }
  return held;
}

// The two the scene is about: the one who dug and the one dug out (her body
// is `S.pair`, not one of the crew), and at the snatch the pair, who are
// off the crew for the length of it.
const leads = w => !!(w.met || w.dig);

// Bodies the stage does not reach: off the yard, in your hand, falling,
// aboard something, or the deep's own.
const offYard = w => outOfYard(w) || !!w.craft || !!w.floating || w.homeward != null;

const within = (z, x) => x + WORKER > z.from && x < z.to;

// Out by the nearer edge, a cell clear of it, unless that side is off the
// world's end.
function exitX(z, w) {
  const left = z.from - WORKER - P, right = z.to + P;
  const leftOk = left >= 0, rightOk = right + WORKER <= S.worldW;
  const nearLeft = w.x + WORKER / 2 < (z.from + z.to) / 2;
  if (nearLeft ? leftOk : !rightOk) return leftOk ? left : right;
  return right;
}

// The stage, as a stage of a body's frame (crew/step.js): true while it has
// the body. Once the scene is over, the frame after puts each body it stood
// off back on its job.
export function stepStage(w, c) {
  const z = c.stage;
  if (!z) {
    if (!w.offStage) return false;
    w.offStage = false;
    w.route = null;
    if (!offYard(w)) retask(w, w.type);
    return false;
  }
  if (leads(w) || offYard(w)) return false;
  if (!w.offStage && !within(z, w.x)) return false;
  w.offStage = true;
  w.lunge = 0;
  // A rock in the air comes first: out from under it at the duck's pace.
  if (c.zone && onYard(w) && S.rockFall > 0 && !S.rockHeld && duck(w, c.zone)) {
    w.y = stand(w);
    return true;
  }
  const to = exitX(z, w);
  if (within(z, w.x) && keepTo(w, to, wayOver(to))) {
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
  }
  // Stood off the edge, watching.
  w.face = w.x + WORKER / 2 < (z.from + z.to) / 2 ? 1 : -1;
  if (onYard(w)) w.y = stand(w);
  return true;
}

// Nobody walks in while it plays: a body that began the frame outside and
// ended it inside is put back on the edge, as `holdTheLine` does for a drop
// zone.
export function holdTheStage(w, x0, z) {
  if (!z || x0 == null || leads(w) || offYard(w) || !onYard(w)) return;
  if (within(z, x0) || !within(z, w.x)) return;
  w.x = x0 + WORKER <= z.from ? z.from - WORKER : z.to;
  w.y = stand(w);
}

// Whether the frame holds nobody but the pair.
export function stageClear() {
  const z = stageZone();
  return !z || !S.workers.some(w => !leads(w) && !offYard(w) && within(z, w.x));
}
