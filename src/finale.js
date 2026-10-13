// The finale: the serpent's death, and the two of them going home (the
// owner's picks on docs/mocks/retire-2026-10-12.html and
// docs/mocks/finale-house-2026-10-12.html).
//
// The kill hands the two of them over here (snatch.js, `handOver`): he is out
// of the belly beside her. She swims back to her station and hangs her gear on
// it in held steps -- the station's class and rung stay with the station --
// and one of the deep's own crew leaves its work, swims over and takes the
// gear up. Then the pair are not crew any more: no job, not counted, no
// wages, no room. They swim up through the portal, come up out of the
// drowned pit, and walk the whole yard to its far end, the left, away from
// the hole, where the yard's builders are putting up a house (home.js) from a
// pile they carried there while the deep half played. As the pair pass, each
// of the crew gets free of where it is and falls in behind them, two files,
// hopping in held poses, with marks over them, the forklifts rolling at the
// tail, and fireworks go up overhead, quicker as they near the house. At the
// door -- the house finished as they arrive -- the door opens, she goes in,
// he follows, it shuts, a volley goes up off both sides of the house, the
// window lights under a heart, a last hold, and the sheet. The yard is held
// for all of it -- work paused, the background still and quiet (cutscene.js,
// `stepHush`) -- and through the sheet; putting the sheet down lets it go,
// and the crowd walks home.
//
// Afterwards the two of them live in the house for good (home.js,
// `stepRetired`), saved in `S.retired`.
//
// `S.finale` is the beat while it plays, and the house's last hold under the
// sheet: `{ phase, u, T, hurry, st, her, heir, pair, joined, bursts, kit,
// glide, house }` -- the phase and the seconds into it, the seconds since the
// yard part began, the station she fought at, her body's uid while she is
// still one of the crew, the one who takes the gear up, the two of them where
// they are once they are not crew, how many have fallen in, the fireworks up,
// where the gear is while it moves, the camera's glide, and the build.
// Only the phase is written down: a reload mid-finale lands at its end
// (`land`), the house standing, the pair in it and the sheet to come.

import { S, pit, quarry } from './state.js';
import { P, WORKER, KILL_GLIDE_S,
         FINALE_SWIM_PX_S, FINALE_SWIM_MAX_S, FINALE_LIFT_S, FINALE_HANG_S,
         FINALE_HEART_S, FINALE_HEIR_MAX_S, FINALE_TAKE_S, FINALE_WATCH_S, FINALE_UP_PX_S, FINALE_UP_MAX_S,
         FINALE_RING_S, FINALE_OUT_S, FINALE_OUT_STEPS, FINALE_WALK_PX_S, FINALE_WALK_MAX_S, FINALE_LEAD,
         FINALE_END_CELLS, FINALE_PAIR_GAP, FINALE_JOIN_CELLS, FINALE_JOIN_PX_S, FINALE_HURRY_K, FINALE_RANK,
         FINALE_FILE_BACK, FINALE_BEHIND, FINALE_FREE_PX_S, FINALE_FLOAT_STEP_S, FINALE_DOOR_OUT_S,
         FINALE_BANK_S, FINALE_BANK_STEPS, FINALE_BANK_CELLS, FINALE_BANK_ARC, FINALE_BANK_RISE,
         FINALE_BALLOON_S, FINALE_BALLOON_STEPS, FINALE_HOP_BEAT_S, FINALE_HOP_GROUPS, FINALE_HOP_POSES,
         FINALE_MARK_EVERY_S, FINALE_MARK_S, FINALE_MARK_AFTER_S, FINALE_LIFT_TAIL,
         FINALE_ARRIVE_S, FINALE_DOOR_S, FINALE_GAP_S, FINALE_IN_S, FINALE_HIM_AFTER_S, FINALE_SHUT_S,
         FINALE_LIGHT_S, FINALE_HOLD_S, FINALE_HURRY, FINALE_WALL_ROWS, FINALE_ROOF, FINALE_HOUSE_W,
         FIREWORK_GAP_S, FIREWORK_FIRST_S, FIREWORK_LAST_S, FIREWORK_DOUBLE_FROM, FIREWORK_DOUBLE_CHANCE,
         FIREWORK_DOUBLE_LAG_S, FIREWORK_DOUBLE_DX, FIREWORK_KINDS, FIREWORK_RISE_S, FIREWORK_LIFE_S,
         FIREWORK_HIGH, FINALE_VOLLEY, FINALE_HEART_BURST } from './config.js';
import { now, frames, frameMs } from './clock.js';
import { stationById, fighterAt } from './deep/party.js';
import { postX, postY, deepPortal, portalCircle, deepFloor, propRect } from './deep/place.js';
import { swim } from './deep/arms.js';
import { abyssLine } from './pit.js';
import { feetOn, ways, belowYard, wayAt, keepTo, stepRoute, rockSpan } from './route.js';
import { killFrame, gliding, goUp, setView, canGoDown } from './view.js';
import { clampCam, lockScroller } from './world.js';
import { rebalance } from './staffing.js';
import { syncWorkers, retask } from './crew.js';
import { onYard } from './crew/body.js';
import { TYPE, isDeepType } from './jobs.js';
import { markDone } from './beats.js';
import { inBasket, bringDown } from './balloon.js';
import { takeBuilders, planBuild, stepBuilder, builderPose, freeBuilders, finishHouse, houseDone,
         houseX, doorX, stepRetired, retiredIn, goInto, afterPair as afterOf } from './home.js';

const F = () => S.finale;
const clamp01 = k => Math.max(0, Math.min(1, k));
const lerp = (a, b, k) => a + (b - a) * k;
const easeInOut = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const snap = v => Math.round(v / P) * P;
// A held step: `k` 0..1 in `n` whole steps, each taken as its stretch begins.
const stepped = (k, n) => Math.min(1, Math.ceil(clamp01(k) * n) / n);
// ...and each taken as its stretch ends.
const held = (k, n) => Math.min(1, Math.floor(clamp01(k) * n + 1e-6) / n);
const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

// The phases the yard sees, and the deep's.
const DEEP = new Set(['swim', 'lift', 'hang', 'heart', 'heir', 'up', 'ring', 'through']);
const YARD = new Set(['out', 'walk', 'arrive', 'open', 'in', 'shut', 'light', 'hold', 'held']);
// At the door, the pair stood there; and the house's own end, them indoors.
const AT_DOOR = new Set(['arrive', 'open', 'in', 'shut', 'light', 'hold', 'held']);
const INDOORS = new Set(['shut', 'light', 'hold', 'held']);
export const finaleInDeep = () => !!F() && DEEP.has(F().phase);
export const finaleInYard = () => !!F() && YARD.has(F().phase);
export const finalePhase = () => (F() ? F().phase : null);

// --- whether -------------------------------------------------------------------------
// The beat running, or its sheet up after it: the yard's work stands still,
// no rock comes and no other beat starts (beats.js, game.js).
export const finaleRunning = () => S.beat.yard === 'finale';
// Held from the beat's end until the sheet is down, the frame between the
// two included.
export const workPaused = () => finaleRunning() || S.beat.sheet === 'freedsheet' || (!!S.finale && S.finale.phase === 'held');

// Who the finale is about, drawn in full ink over the held yard (stage.js):
// her and him, the one taking up the gear while the deep is watched, and in
// the yard every one of the crew -- the crowd is the subject there.
export function finaleCast(w) {
  const f = F();
  if (!f || !w) return false;
  if (w.parade || w.house) return true;
  if (f.her && w.uid === f.her) return true;
  if (f.heir && w.uid === f.heir && DEEP.has(f.phase)) return true;
  return YARD.has(f.phase) && !belowYard(w);
}

// --- the hand-over from the kill -----------------------------------------------------
// Him out of the belly at (x, y), beside her. Her: the first station's
// fighter, or failing that whoever of the deep's crew is first; with nobody,
// or the two of them already gone home, there is no finale. The yard's
// builders are taken off their work here and set off down the yard with the
// pile for the house.
export function handOver(x, y) {
  if (S.retired) return false;
  const st0 = S.stations && S.stations[0];
  const her = (st0 && fighterAt(st0)) || S.workers.find(w => w.type === TYPE.FIGHTER)
           || S.workers.find(w => isDeepType(w.type) && belowYard(w));
  if (!her) return false;
  const st = her.station ? stationById(her.station) : null;
  S.finale = { phase: 'swim', u: 0, T: 0, hurry: 1, st: st ? st.id : null, her: her.uid, heir: null,
               pair: [null, { x, y, face: -1 }], joined: 0, bursts: [], kit: null, glide: null, swum: null,
               house: null, landing: {} };
  takeBuilders(S.finale);
  return true;
}

// --- the beat --------------------------------------------------------------------------
// Entered straight from the kill (`next` of 'freed' in beats.js), or with
// nothing handed over, done on its first frame.
export function startFinale() {
  const f = F();
  if (!f) return;
  // A finale is watched: a yard looking elsewhere is taken down to it.
  if (S.view !== 'deep' && canGoDown() && !gliding()) setView('deep');
}

// The space bar: what is left plays faster. Nothing is cut to its end.
export function cutFinale() {
  if (F()) F().hurry = FINALE_HURRY;
  return false;
}

function next(phase) { F().phase = phase; F().u = 0; }
const herBody = () => S.workers.find(w => w.uid === F().her) || null;

// A body that is not crew, moved toward (tx, ty) by `step` pixels: true there.
function toward(o, tx, ty, step) {
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
  if (dx) o.face = dx > 0 ? 1 : -1;
  if (d <= step) { o.x = tx; o.y = ty; return true; }
  o.x += dx / d * step;
  o.y += dy / d * step;
  return false;
}
// A swim's pace for this one, in pixels a frame: its own, or quicker where
// the way is longer than `most` seconds of it.
const paceFor = (d, perS, most) => Math.max(perS, d / most) / 60;

// The camera's glide from where it is to `x`, over KILL_GLIDE_S of the
// finale's own seconds, held there once it has arrived; a new target starts
// a new glide.
function glideX(key, x) {
  const f = F();
  if (!f.glide || f.glide.key !== key) f.glide = { key, at: f.T, from: S.camX + S.viewW / 2 };
  const k = easeInOut(clamp01((f.T - f.glide.at) / KILL_GLIDE_S));
  return f.glide.from + (x - f.glide.from) * k;
}

// Where the gear hangs on a station: a body's top-left (in pixels) stood in
// the prop's own right-hand end, on its foot, so the kit is drawn there as
// it would be held -- in the rack, against the stand -- with nobody in it.
export function hungAt(st) {
  const r = propRect(st);
  return { x: snap(r.x + r.w - WORKER), y: r.y + r.h - WORKER };
}

const endX = () => doorX();
const himAt = x => x + WORKER + FINALE_PAIR_GAP;
// Where they come out onto the near lip of the drowned pit.
const lipX = () => snap(pit.x - WORKER * 2 - FINALE_PAIR_GAP - P * 2);

export function stepFinale(t) {
  const f = F();
  if (!f) return false;
  const dt = frameMs() / 1000 * f.hurry;
  f.u += dt;
  f.T += dt;
  const st = f.st ? stationById(f.st) : null;
  const him = f.pair[1];
  landCrafts(f);

  if (f.phase === 'swim') {
    // Her back to her station's post and him beside her, at the post's
    // height, a cell off her.
    const w = herBody();
    const hx = st ? postX(st) : w ? w.x : him.x, hy = st ? postY() : w ? w.y : him.y;
    f.swum ??= paceFor(Math.max(w ? Math.hypot(hx - w.x, hy - w.y) : 0, Math.hypot(hx - him.x, hy - him.y)),
                       FINALE_SWIM_PX_S, FINALE_SWIM_MAX_S);
    const she = !w || swim(w, hx, hy, f.swum * f.hurry);
    const he = toward(him, hx + WORKER + FINALE_PAIR_GAP, hy, f.swum * f.hurry * frames());
    if (w) { w.pose = null; w.beam = null; w.goal = 'back'; }
    deepFrame(st ? postX(st) + WORKER : him.x, 1);
    if (!(she && he)) return true;
    if (w) w.face = 1;
    him.face = -1;
    // A station's gear comes off her; a body with no station has none.
    if (st && w) { st.hung = true; st.takeAt = null; f.kit = { x: w.x, y: w.y }; next('lift'); }
    else { retire(f); next('heart'); }
    return true;
  }
  if (f.phase === 'lift' || f.phase === 'hang') {
    deepFrame(postX(st) + WORKER, 1);
    if (f.phase === 'lift' && f.u >= FINALE_LIFT_S) next('hang');
    else if (f.phase === 'hang' && f.u >= FINALE_HANG_S) { retire(f); next('heart'); }
    return true;
  }
  if (f.phase === 'heart' || f.phase === 'heir') {
    // Stood aside off her post together, so the one coming for the gear
    // has somewhere to stand.
    if (st) {
      const aside = postX(st) + WORKER * 2 + FINALE_PAIR_GAP * 2, step = f.swum * f.hurry * frames();
      toward(f.pair[0], aside, postY(), step);
      toward(him, aside + WORKER + FINALE_PAIR_GAP, postY(), step);
      f.pair[0].face = 1; him.face = -1;
    }
  }
  if (f.phase === 'heart') {
    deepFrame(st ? postX(st) + WORKER : him.x, 1);
    if (f.u >= FINALE_HEART_S) next(f.heir && st && st.hung ? 'heir' : 'up');
    return true;
  }
  if (f.phase === 'heir') {
    // Watched while it swims over and takes the gear up (deep/classes.js,
    // `takeUp`); then a beat on it with the gear before the two of them go.
    const w = S.workers.find(o => o.uid === f.heir);
    deepFrame(st ? postX(st) + WORKER : him.x, 1);
    if (st && st.hung && w && f.u < FINALE_HEIR_MAX_S + FINALE_TAKE_S) { f.took = null; return true; }
    f.took ??= f.u;
    if (f.u - f.took >= FINALE_WATCH_S) next('up');
    return true;
  }
  if (f.phase === 'up') {
    // Up to the deep's end of the portal together, the frame easing back to
    // the deep's own as it follows them.
    const pc = deepPortal(), her = f.pair[0];
    const tx = pc.x - WORKER - FINALE_PAIR_GAP / 2, ty = pc.y - WORKER / 2;
    f.upPace ??= paceFor(Math.hypot(tx - her.x, ty - her.y), FINALE_UP_PX_S, FINALE_UP_MAX_S);
    const step = f.upPace * frames() * f.hurry;
    const a = toward(her, tx, ty, step), b = toward(him, tx + WORKER + FINALE_PAIR_GAP, ty, step);
    const k = 1 - easeInOut(clamp01(f.u / KILL_GLIDE_S));
    deepFrame((her.x + him.x) / 2 + WORKER / 2, k, her.y + WORKER / 2);
    if (a && b) next('ring');
    return true;
  }
  if (f.phase === 'ring') {
    deepFrame(deepPortal().x, 0, f.pair[0].y + WORKER / 2);
    if (f.u < FINALE_RING_S) return true;
    // Through: the deep draws back into its end of the portal and the yard
    // is left (view.js, the way up).
    killFrame(0, deepPortal().x);
    if (S.view === 'deep') goUp();
    next('through');
    return true;
  }
  if (f.phase === 'through') {
    if (gliding()) return true;
    // Out of the yard's end of the portal, in the drowned pit's near wall.
    const pc = portalCircle();
    f.pair[0] = { x: snap(pc.x - WORKER - FINALE_PAIR_GAP / 2), y: snap(pc.y - WORKER / 2), face: -1 };
    f.pair[1] = { x: f.pair[0].x + WORKER + FINALE_PAIR_GAP, y: f.pair[0].y, face: -1 };
    f.from = f.pair.map(o => ({ x: o.x, y: o.y }));
    f.T = 0;
    f.glide = null;
    // The walk's length is known now, and the build is fitted to it: done as
    // they reach the door. With nobody to build it, it is stood up here,
    // a whole yard away from anybody looking.
    f.walkFrom = lipX();
    f.walkPace = Math.max(FINALE_WALK_PX_S, (f.walkFrom - endX()) / FINALE_WALK_MAX_S);
    f.walkS = Math.max(0, f.walkFrom - endX()) / f.walkPace;
    if (f.house && f.house.n) planBuild(f, FINALE_OUT_S + f.walkS);
    else finishHouse(f);
    lockScroller(true, 'finale');
    next('out');
    return true;
  }
  if (f.phase === 'out') {
    // Up through the liquid to its surface, then onto the near lip and down
    // to the way, in held steps.
    const k = stepped(f.u / FINALE_OUT_S, FINALE_OUT_STEPS);
    const surf = abyssLine() - WORKER;
    f.pair.forEach((o, i) => {
      const s = f.from[i], ex = f.walkFrom + i * (WORKER + FINALE_PAIR_GAP);
      const up = clamp01(k / 0.5), over = clamp01((k - 0.5) / 0.5);
      o.x = snap(s.x + (ex - s.x) * over);
      const lift = Math.sin(over * Math.PI) * P * 3;
      o.y = over > 0 ? snap(surf + (feetOn(ways().yard, o.x) - surf) * over - lift) : snap(s.y + (surf - s.y) * up);
      o.face = -1;
    });
    yardFrame(f.pair[0].x);
    if (f.u < FINALE_OUT_S) return true;
    f.walkT = f.T;
    f.nextFw = f.T + FIREWORK_FIRST_S;
    next('walk');
    return true;
  }
  if (f.phase === 'walk') {
    // The length of the yard in whole pixels; the crowd falls in.
    const x = Math.max(endX(), Math.round(f.walkFrom - f.walkPace * f.u));
    placePair(x);
    yardFrame(x);
    joinCrowd(x);
    launch(f);
    if (x > endX()) return true;
    next('arrive');
    return true;
  }
  placePair(endX());
  yardFrame(endX());
  if (f.phase === 'arrive') {
    // At the door; held there until the house is done, the crowd still
    // falling in from anywhere it was not passed.
    joinCrowd(endX());
    if (f.u >= FINALE_ARRIVE_S && houseDone()) next('open');
    return true;
  }
  if (f.phase === 'open') {
    if (f.u >= FINALE_DOOR_S + FINALE_GAP_S) next('in');
    return true;
  }
  if (f.phase === 'in') {
    // Her in, then him, in held steps (`pairInYard` draws them dimming).
    const her = goInto(f.u, endX()), he = goInto(f.u - FINALE_HIM_AFTER_S, himAt(endX()));
    if (her) f.pair[0].x = her.x;
    if (he) f.pair[1].x = he.x;
    if (f.u < FINALE_IN_S) return true;
    volley(f);
    next('shut');
    return true;
  }
  if (f.phase === 'shut') {
    if (f.u < FINALE_SHUT_S) return true;
    next('light');
    return true;
  }
  if (f.phase === 'light') {
    if (f.u < FINALE_LIGHT_S) return true;
    next('hold');
    return true;
  }
  if (f.phase === 'hold') {
    if (f.u < FINALE_HOLD_S) return true;
    // Over: held under the sheet, and the two of them home for good.
    f.phase = 'held';
    S.retired = retiredIn();
    return false;
  }
  return false;
}

function placePair(x) {
  const f = F(), [her, him] = f.pair;
  if (AT_DOOR.has(f.phase) && f.phase !== 'arrive' && f.phase !== 'open') return;
  her.x = x; her.face = -1;
  him.x = himAt(x); him.face = -1;
  const way = ways().yard;
  her.y = feetOn(way, her.x);
  him.y = feetOn(way, him.x);
}

// The deep's frame on `x`, pulled in by `k` of the kill's closeness, and
// held on height `y` while pulled in.
function deepFrame(x, k, y = null) {
  killFrame(k, glideX('deep', x), k > 0 && y != null ? y : null);
}
// The yard's: the pair a share of the window in from its left. At the door
// it stays there, the house coming into view as the camera arrives.
function yardFrame(x) {
  S.follow = null;
  S.camTo = null;
  S.camLockY = null;
  S.camX = glideX('yard', x + WORKER - FINALE_LEAD * S.viewW + S.viewW / 2) - S.viewW / 2;
  clampCam();
}

// Her off the crew: out of the workers where she stands, off the count and
// the deep's, and off her station, which seats the one who takes it up from
// the deep's spare hands (`rebalance`): a gatherer or a delver leaves its
// work and swims over.
function retire(f) {
  const w = herBody();
  f.pair[0] = w ? { x: w.x, y: w.y, face: 1 } : { x: f.pair[1].x - WORKER - FINALE_PAIR_GAP, y: f.pair[1].y, face: 1 };
  if (!w) return;
  S.workers.splice(S.workers.indexOf(w), 1);
  S.crew = Math.max(0, S.crew - 1);
  if (belowYard(w)) S.deepCrew = Math.max(0, (S.deepCrew || 0) - 1);
  const st = f.st ? stationById(f.st) : null;
  if (st && st.fighter === w.uid) st.fighter = null;
  f.her = null;
  rebalance();
  syncWorkers();
  const heir = st && fighterAt(st);
  f.heir = heir ? heir.uid : null;
  S.shopStale = true;
}

// --- the crowd ----------------------------------------------------------------------------
// Who can fall in: any of the yard's crew, wherever it is, once nothing
// else has it -- not in your hand, not mid-fall or seeing stars, not being
// brought home by its own job. The builders are building.
const joinable = w => !w.parade && !w.house && !isDeepType(w.type) && !w.lifted && !w.falling && !w.floating
  && !w.dizzyUntil && !w.hatOff && !w.robbed && (w.homeward == null);
// How it gets free of where it is: down out of a balloon, a wizard down out
// of the sky, out of a shack's door, by the ways off the hill or up out of a
// working, a hop down off a bank, or nothing to get free of.
function howFree(w) {
  if (w.craft != null && inBasket(w)) return 'balloon';
  if (w.aloft) return 'float';
  if (w.inside) return 'door';
  if (belowYard(w) || !onYard(w) || wayAt(w.x, w.y).key !== 'yard') return 'route';
  if (w.y < S.groundY - WORKER - FINALE_BANK_RISE * P) return 'bank';
  return 'none';
}
function joinCrowd(x) {
  const f = F();
  for (const w of S.workers) {
    if (!joinable(w) || x > w.x + FINALE_JOIN_CELLS * P) continue;
    const how = howFree(w);
    w.parade = { k: f.joined++, st: 'free', how, ft: 0, x0: w.x, y0: w.y };
    w.walking = false;
    w.route = null;
    w.say = null;
    if (how === 'balloon') { w.homeward = w.craft; w.berth = null; f.landing[w.craft] ??= f.T; }
    if (how === 'float') { w.channel = false; w.cell = null; }
    if (how === 'door') w.inside = false;
  }
}
// The balloons coming down to their posts, in held steps.
function landCrafts(f) {
  for (const i of Object.keys(f.landing || {}))
    bringDown(+i, held((f.T - f.landing[i]) / FINALE_BALLOON_S, FINALE_BALLOON_STEPS));
}
// Where a body gets out to on the yard's floor: clear of the cut's mouth and
// of the hill, on the side the pair are going.
function clearX(w) {
  let x = w.x;
  if (S.quarryOpen && x + WORKER > quarry.x && x < quarry.x + quarry.w) x = quarry.x - WORKER - P;
  const span = rockSpan();
  if (span && x + WORKER > span.from && x < span.to) x = span.from - WORKER - P;
  return x;
}
// Its place in the files: behind the pair (behind the door once they are at
// it), two abreast, the second file FINALE_FILE_BACK further back and a cell
// nearer.
function slotOf(k) {
  const f = F(), at = AT_DOOR.has(f.phase) ? himAt(endX()) : f.pair[1].x;
  const lead = at + WORKER + FINALE_BEHIND;
  const rank = Math.floor(k / 2), file = k % 2;
  return { x: lead + rank * FINALE_RANK + file * FINALE_FILE_BACK, file };
}
const hurryPace = f => Math.max(FINALE_JOIN_PX_S, (f.walkPace || 0) * FINALE_HURRY_K) / 60;
// The crowd's step (crew/step.js): free of where it is, then to its place at
// a hurry, then locked to it, hopping in held poses with a mark over it now
// and then; still in the final hold.
function stepParade(w) {
  const f = F();
  if (!f || !YARD.has(f.phase)) return;
  const p = w.parade, way = ways().yard;
  const dt = frames() / 60 * f.hurry;
  if (p.st === 'free') {
    p.ft = (p.ft || 0) + dt;
    if (p.how === 'balloon') {
      // off at the foot of its post the frame the craft is moored (`comeHome`)
      if (w.homeward == null) p.st = 'hurry';
    } else if (p.how === 'float') {
      const foot = feetOn(way, w.x);
      w.y = Math.min(foot, p.y0 + Math.floor(p.ft / FINALE_FLOAT_STEP_S) * P);
      w.aloft = w.y < foot;
      if (!w.aloft) p.st = 'hurry';
    } else if (p.how === 'door') {
      if (p.ft >= FINALE_DOOR_OUT_S) p.st = 'hurry';
    } else if (p.how === 'route') {
      if (!keepTo(w, clearX(w), way) || !stepRoute(w, FINALE_FREE_PX_S / 60 * f.hurry)) { w.route = null; p.st = 'hurry'; }
    } else if (p.how === 'bank') {
      const k = held(p.ft / FINALE_BANK_S, FINALE_BANK_STEPS), tx = p.x0 - FINALE_BANK_CELLS * P;
      w.x = lerp(p.x0, tx, k);
      w.y = lerp(p.y0, feetOn(way, tx), k) - Math.round(Math.sin(k * Math.PI) * FINALE_BANK_ARC) * P;
      if (p.ft >= FINALE_BANK_S) p.st = 'hurry';
    } else p.st = 'hurry';
    if (p.st !== 'hurry') return;
  }
  const s = slotOf(p.k);
  if (p.st === 'hurry') {
    const step = hurryPace(f) * frames() * f.hurry, d = s.x - w.x;
    if (Math.abs(d) <= step) { w.x = s.x; p.st = 'in'; p.inAt = f.T; }
    else { w.x += Math.sign(d) * step; w.face = Math.sign(d); }
  } else w.x = s.x;
  if (p.st === 'in') w.face = -1;
  w.y = feetOn(way, w.x) + s.file * P;
  if (stillNow() || p.st !== 'in') { w.say = null; return; }
  if (f.T - p.inAt < FINALE_MARK_AFTER_S) return;
  const beat = f.T + hash(p.k + 1) * FINALE_MARK_EVERY_S;
  const n = Math.floor(beat / FINALE_MARK_EVERY_S);
  if (n !== p.n) {
    p.n = n;
    w.say = { mark: ['heart', 'note', 'bang'][Math.floor(hash(p.k * 7 + n) * 3)], until: now() + FINALE_MARK_S * 1000 };
  }
}
// The final hold: nothing moves but the sparks falling out.
const stillNow = () => { const f = F(); return !f || f.phase === 'hold' || f.phase === 'held'; };

// The hop, a held pose at a time: a steady beat, the crowd in groups a share
// of a beat apart, each body starting on its own group's next beat after it
// is in its place. `{ lift, rows, smear, dust }`, lift in cells.
function hopPose(k, inAt) {
  const f = F(), per = FINALE_HOP_BEAT_S;
  const ph = (k % FINALE_HOP_GROUPS) * per / FINALE_HOP_GROUPS;
  const start = Math.ceil((inAt + ph) / per) * per - ph;
  if (f.T < start) return null;
  let u = (f.T + ph) % per;
  for (const pose of FINALE_HOP_POSES) { if (u < pose.s) return pose; u -= pose.s; }
  return null;
}
// How a body in the finale is drawn over its feet (render/crew.js): its hop
// in the crowd, or a builder's stoop, raised arms and what it carries.
// `{ lift, rows, smear, dust, arms, hold }`, lift in pixels; null drawn as
// itself. Never moves `w.y`, so nothing reasoning about where a body stands
// has a body in the air.
export function finalePose(w) {
  const f = F();
  if (!f || !YARD.has(f.phase) && !w.house) return null;
  if (w.house) {
    const b = builderPose(w);
    if (b) return { lift: 0, rows: b.rows, arms: b.arms, hold: b.hold };
    if (w.house.st === 'cheer' && YARD.has(f.phase) && !stillNow()) {
      w.house.inAt ??= f.T;
      const pose = hopPose(w.house.b * 2, w.house.inAt);
      return pose ? { lift: (pose.lift || 0) * P, rows: pose.rows || 3, smear: pose.smear, dust: pose.dust } : null;
    }
    return null;
  }
  if (!w.parade || w.parade.st !== 'in' || stillNow()) return null;
  const pose = hopPose(w.parade.k, w.parade.inAt);
  return pose ? { lift: (pose.lift || 0) * P, rows: pose.rows || 3, smear: pose.smear, dust: pose.dust } : null;
}

// One of the crew's frames while the yard is held (crew/step.js): the crowd
// getting free and in the procession, the builders at the house, the one
// taking the gear up let get on with it, and everybody else stood still
// where they are. True when the frame is taken.
export function finaleBody(w) {
  if (!workPaused()) return false;
  const f = F();
  if (w.house) { if (f) stepBuilder(w, f); return true; }
  if (w.parade) { stepParade(w); return true; }
  // the one taking up her gear goes once the heart is had, and only then
  if (f && f.heir && w.uid === f.heir && f.phase === 'heir') return false;
  return true;
}

// A forklift's frame while the yard is held (crew/lifts.js): stood where it
// is, until the pair pass it; then it rolls along at the tail of the
// procession. True when the frame is taken.
export function finaleLift(w) {
  if (!workPaused()) return false;
  const f = F();
  if (!f || !YARD.has(f.phase)) return true;
  if (!w.parade) {
    const x = f.phase === 'walk' ? f.pair[0].x : AT_DOOR.has(f.phase) ? endX() : Infinity;
    if (w.inside || x > w.x + FINALE_JOIN_CELLS * P) return true;
    w.parade = { tail: (S.lifts || []).filter(o => o.parade).length };
  }
  const s = slotOf(f.joined + (FINALE_LIFT_TAIL + w.parade.tail) * 2);
  const step = hurryPace(f) * frames() * f.hurry, d = s.x - w.x;
  w.x += Math.sign(d) * Math.min(Math.abs(d), step);
  if (Math.abs(d) > 0.5) w.face = Math.sign(d);
  w.y = feetOn(ways().yard, w.x);
  return true;
}

// --- the fireworks -------------------------------------------------------------------------
// Over the walk, from FIREWORK_FIRST_S into it, the gap closing as the pair
// near the house and some going up in twos at the end; each a kind off the
// list, somewhere over the window -- a share of it, since they burst far off
// over the yard and the window is on the move.
function launch(f) {
  const left = f.walkT + f.walkS - FIREWORK_LAST_S;
  while (f.T >= f.nextFw && f.nextFw < left) {
    const i = f.fired = (f.fired || 0) + 1, at = f.nextFw;
    const k = clamp01((at - f.walkT) / Math.max(1e-6, f.walkS));
    const sx = 0.08 + 0.84 * hash(i * 3.1 + 1);
    f.bursts.push({ i, at, sx, sy: FIREWORK_HIGH[0] + (FIREWORK_HIGH[1] - FIREWORK_HIGH[0]) * hash(i * 7.7 + 2),
                    kind: FIREWORK_KINDS[Math.floor(hash(i * 5.3) * FIREWORK_KINDS.length) % FIREWORK_KINDS.length] });
    if (k > FIREWORK_DOUBLE_FROM && hash(i * 2.9) < FIREWORK_DOUBLE_CHANCE)
      f.bursts.push({ i: i + 500, at: at + FIREWORK_DOUBLE_LAG_S, sx: clamp01(sx + FIREWORK_DOUBLE_DX) * 0.8 + 0.1,
                      sy: FIREWORK_HIGH[0] + (FIREWORK_HIGH[1] - FIREWORK_HIGH[0]) * hash(i * 1.7), kind: 'peony' });
    f.nextFw += lerp(FIREWORK_GAP_S[0], FIREWORK_GAP_S[1], k);
  }
  f.bursts = f.bursts.filter(b => f.T - b.at < (b.rise || FIREWORK_RISE_S) + FIREWORK_LIFE_S);
}
// The volley off both sides of the house as the door shuts, bursting left to
// right over it, and the heart over it as the window lights.
function volley(f) {
  const V = FINALE_VOLLEY, H = FINALE_HEART_BURST, hx = houseX();
  for (let j = 0; j < V.n; j++)
    f.bursts.push({ i: 900 + j, at: f.T + j * V.every, wx: hx + (V.from + j * V.step) * P, sy: V.high[j % 2],
                    kind: j % 2 ? 'ring' : 'crossette', rise: V.rise });
  f.bursts.push({ i: 950, at: f.T + H.at, wx: hx + H.dx * P, sy: H.high, kind: 'heart', rise: H.rise });
}

// --- the sheet put down ------------------------------------------------------------------
// The yard goes again: the crowd and the builders walk back to work, each
// the way it would to a job it was put on, the forklifts back to theirs;
// and the two of them come out of the house (home.js).
export function sheetDown() {
  for (const w of S.workers) {
    if (!w.parade && !w.house) continue;
    delete w.parade;
    w.say = null;
    retask(w, w.type);
  }
  freeBuilders();
  for (const w of S.lifts || []) delete w.parade;
  lockScroller(false, 'finale');
  S.finale = null;
}

// --- every frame --------------------------------------------------------------------------
// Under the sheet the fireworks' clock runs on so the last sparks fall out;
// and afterwards the two of them at the house, going about their afternoon.
export function stepFinaleAfter(c) {
  const f = F();
  if (f && f.phase === 'held') {
    f.T += c.dt / 1000;
    f.u += c.dt / 1000;
  }
  if (!f) stepRetired(c);
}

// Where the two of them are drawn, finale or after: [{ x, y, face, sit, dim }
// or null for one indoors] in world pixels, or null when they are nowhere to
// be seen in the yard.
export function pairInYard() {
  const f = F();
  if (f && YARD.has(f.phase)) {
    if (INDOORS.has(f.phase)) return [null, null];
    if (f.phase === 'in') {
      const y = feetOn(ways().yard, endX());
      return [goInto(f.u, endX()), goInto(f.u - FINALE_HIM_AFTER_S, himAt(endX()))
                ?? (f.u < FINALE_HIM_AFTER_S ? { x: himAt(endX()) } : null)]
        .map(o => o && { x: o.x, y, face: -1, sit: false, dim: o.dim || 0 });
    }
    return f.pair.map(o => ({ x: o.x, y: o.y, face: o.face, sit: false, dim: 0 }));
  }
  if (f) return null;
  const r = S.retired;
  if (!r) return null;
  return afterOf(r);
}

// --- the save ------------------------------------------------------------------------------
// Only the phase is written. A reload mid-finale lands at its end: her off
// the crew if she was not yet, the house standing with the two of them in
// it, the kill and the finale played, held for the sheet to come. Read after
// the crew and the beats (persist.js, `SAVERS`).
export function land(her = null) {
  const w = her && S.workers.find(o => o.uid === her);
  if (w) {
    S.workers.splice(S.workers.indexOf(w), 1);
    S.crew = Math.max(0, S.crew - 1);
    if (belowYard(w)) S.deepCrew = Math.max(0, (S.deepCrew || 0) - 1);
    const st = w.station ? stationById(w.station) : null;
    if (st) { if (st.fighter === w.uid) st.fighter = null; st.hung = true; st.takeAt = null; }
    rebalance();
    syncWorkers();
  }
  S.retired = retiredIn();
  const y = S.groundY - WORKER;
  S.finale = { phase: 'held', u: FINALE_HOLD_S, T: 0, hurry: 1, st: null, her: null, heir: null,
               pair: [{ x: endX(), y, face: -1 }, { x: himAt(endX()), y, face: -1 }], joined: 0, bursts: [],
               kit: null, glide: null, house: null, landing: {} };
  finishHouse(S.finale);
  markDone('freed', 'finale');
}

export const SAVE = {
  fields: ['finale'],
  write(out) {
    const f = F();
    out.finale = f ? { phase: f.phase, her: f.her || null } : null;
  },
  read(s) {
    S.finale = null;
    const f = s.finale;
    if (!f || typeof f.phase !== 'string') return;
    land(typeof f.her === 'string' ? f.her : null);
  },
  blank() { S.finale = null; }
};

// The house's walls and roof, as a box in the world (the letterbox's subject
// at the door).
function houseBox() {
  const rows = FINALE_WALL_ROWS + 1 + FINALE_ROOF.length;
  return { x: houseX(), y: S.groundY - rows * P, w: FINALE_HOUSE_W * P, h: rows * P };
}

// What the finale is about, for the letterbox's window (cutscene.js,
// `subject`): the two of them, and in the deep the station her gear goes back
// on, from the top of its prop to the floor. Through the portal, the yard's
// end of it, where they come out (the ripple itself has the window). At the
// door, the house with them; once they are in, the house.
export function finaleSubject() {
  const f = F();
  if (!f) return [];
  if (f.phase === 'through') {
    const pc = portalCircle();
    return [{ x: pc.x - WORKER, y: pc.y - WORKER / 2, w: WORKER * 2, h: WORKER }];
  }
  if (AT_DOOR.has(f.phase)) {
    const at = [houseBox()];
    for (const o of pairInYard() || []) if (o) at.push({ x: o.x, y: o.y, w: WORKER, h: WORKER });
    return at;
  }
  const at = [...f.pair, herBody()].filter(Boolean).map(o => ({ x: o.x, y: o.y, w: WORKER, h: WORKER }));
  const st = f.st ? stationById(f.st) : null;
  if (st && DEEP.has(f.phase) && f.phase !== 'up' && f.phase !== 'ring') {
    const r = propRect(st);
    at.push({ x: r.x, y: r.y, w: Math.max(r.w, postX(st) + WORKER - r.x), h: deepFloor() - r.y });
  }
  return at;
}

// Where the walk ends, for the checks: the door, and him beside her.
export const doorAt = () => [endX(), himAt(endX())];
