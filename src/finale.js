// The finale: the serpent's death, and the two of them going home (the
// owner's picks on docs/mocks/retire-2026-10-12.html).
//
// The kill hands the two of them over here (snatch.js, `handOver`): he is out
// of the belly beside her. She swims back to her station and hangs her gear on
// it in held steps -- the station's class and rung stay with the station --
// and one of the deep's own crew leaves its work, swims over and takes the
// gear up. Then the pair are not crew any more: no job, not counted, no
// wages, no room. They swim up through the portal, come up out of the
// drowned pit, and walk the whole yard to its far end, the left, away from
// the hole. As they pass, each of the crew leaves its work and falls in
// behind them, two files, hopping, with marks over them, and fireworks go up
// overhead. At the far end the sun goes down in stripes, they sit, a heart,
// a last hold, and the sheet. The yard is held for all of it -- work paused,
// the background still and quiet (cutscene.js, `stepHush`) -- and through the
// sheet; putting the sheet down lets it go, and the crowd walks home.
//
// Afterwards the two of them stay at the left end for good, idling
// (`stepRetired`), saved in `S.retired`.
//
// `S.finale` is the beat while it plays, and the sunset after it until the
// sheet is put down: `{ phase, u, T, hurry, st, her, heir, pair, joined,
// bursts, kit, glide }` -- the phase and the seconds into it, the seconds
// since the yard part began, the station she fought at, her body's uid while
// she is still one of the crew, the one who takes the gear up, the two of
// them where they are once they are not crew, how many have fallen in, the
// fireworks up, where the gear is while it moves, and the camera's glide.
// Only the phase is written down: a reload mid-finale lands at its end
// (`land`), the pair at the left end and the sheet to come.

import { S, pit } from './state.js';
import { P, WORKER, KILL_GLIDE_S,
         FINALE_SWIM_PX_S, FINALE_SWIM_MAX_S, FINALE_LIFT_S, FINALE_LIFT_CELLS, FINALE_HANG_S, FINALE_HANG_STEPS,
         FINALE_HEART_S, FINALE_HEIR_MAX_S, FINALE_TAKE_S, FINALE_WATCH_S, FINALE_UP_PX_S, FINALE_UP_MAX_S,
         FINALE_RING_S, FINALE_OUT_S, FINALE_OUT_STEPS, FINALE_WALK_PX_S, FINALE_WALK_MAX_S, FINALE_LEAD,
         FINALE_END_CELLS, FINALE_PAIR_GAP, FINALE_JOIN_CELLS, FINALE_JOIN_PX_S, FINALE_RANK, FINALE_BEHIND,
         FINALE_HOP_S, FINALE_HOP, FINALE_MARK_EVERY_S, FINALE_MARK_S, FINALE_FIREWORK_S, FIREWORK_RISE_S,
         FIREWORK_LIFE_S, FIREWORK_HIGH, SUNSET_SIT_S, SUNSET_HOLD_S, SUNSET_OUT_S, FINALE_HURRY,
         RETIRED_TURN_S, RETIRED_STROLL_CELLS, RETIRED_STROLL_PX_S } from './config.js';
import { now, frames, frameMs } from './clock.js';
import { rand } from './rng.js';
import { stationById, fighterAt } from './deep/party.js';
import { postX, postY, deepPortal, portalCircle, deepFloor, propRect } from './deep/place.js';
import { swim } from './deep/arms.js';
import { abyssLine } from './pit.js';
import { feetOn, ways, belowYard } from './route.js';
import { killFrame, gliding, goUp, setView, canGoDown } from './view.js';
import { clampCam, lockScroller } from './world.js';
import { rebalance } from './staffing.js';
import { syncWorkers, retask } from './crew.js';
import { onYard } from './crew/body.js';
import { TYPE, isDeepType } from './jobs.js';
import { markDone } from './beats.js';

const F = () => S.finale;
const clamp01 = k => Math.max(0, Math.min(1, k));
const easeInOut = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const snap = v => Math.round(v / P) * P;
// A held step: `k` 0..1 in `n` whole steps, each taken as its stretch begins.
const stepped = (k, n) => Math.min(1, Math.ceil(clamp01(k) * n) / n);
const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

// The phases the yard sees, and the deep's.
const DEEP = new Set(['swim', 'lift', 'hang', 'heart', 'heir', 'up', 'ring', 'through']);
const YARD = new Set(['out', 'walk', 'sunset', 'held']);
export const finaleInDeep = () => !!F() && DEEP.has(F().phase);
export const finaleInYard = () => !!F() && YARD.has(F().phase);

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
  if (w.parade) return true;
  if (f.her && w.uid === f.her) return true;
  if (f.heir && w.uid === f.heir && DEEP.has(f.phase)) return true;
  return YARD.has(f.phase) && !belowYard(w);
}

// --- the hand-over from the kill -----------------------------------------------------
// Him out of the belly at (x, y), beside her. Her: the first station's
// fighter, or failing that whoever of the deep's crew is first; with nobody,
// or the two of them already gone home, there is no finale.
export function handOver(x, y) {
  if (S.retired) return false;
  const st0 = S.stations && S.stations[0];
  const her = (st0 && fighterAt(st0)) || S.workers.find(w => w.type === TYPE.FIGHTER)
           || S.workers.find(w => isDeepType(w.type) && belowYard(w));
  if (!her) return false;
  const st = her.station ? stationById(her.station) : null;
  S.finale = { phase: 'swim', u: 0, T: 0, hurry: 1, st: st ? st.id : null, her: her.uid, heir: null,
               pair: [null, { x, y, face: -1 }], joined: 0, bursts: [], kit: null, glide: null, swum: null };
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

export function stepFinale(t) {
  const f = F();
  if (!f) return false;
  const dt = frameMs() / 1000 * f.hurry;
  f.u += dt;
  f.T += dt;
  const st = f.st ? stationById(f.st) : null;
  const him = f.pair[1];

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
    lockScroller(true, 'finale');
    next('out');
    return true;
  }
  if (f.phase === 'out') {
    // Up through the liquid to its surface, then onto the near lip and down
    // to the way, in held steps.
    const k = stepped(f.u / FINALE_OUT_S, FINALE_OUT_STEPS);
    const surf = abyssLine() - WORKER;
    const lipX = snap(pit.x - WORKER * 2 - FINALE_PAIR_GAP - P * 2);
    f.pair.forEach((o, i) => {
      const s = f.from[i], ex = lipX + i * (WORKER + FINALE_PAIR_GAP);
      const up = clamp01(k / 0.5), over = clamp01((k - 0.5) / 0.5);
      o.x = snap(s.x + (ex - s.x) * over);
      const lift = Math.sin(over * Math.PI) * P * 3;
      o.y = over > 0 ? snap(surf + (feetOn(ways().yard, o.x) - surf) * over - lift) : snap(s.y + (surf - s.y) * up);
      o.face = -1;
    });
    yardFrame(f.pair[0].x);
    if (f.u < FINALE_OUT_S) return true;
    f.walkFrom = f.pair[0].x;
    f.walkPace = Math.max(FINALE_WALK_PX_S, (f.walkFrom - endX()) / FINALE_WALK_MAX_S);
    next('walk');
    return true;
  }
  if (f.phase === 'walk') {
    // The length of the yard, a whole cell at a time; the crowd falls in.
    const x = Math.max(endX(), snap(f.walkFrom - f.walkPace * f.u));
    placePair(x);
    yardFrame(x);
    joinCrowd(x);
    launch();
    if (x > endX()) return true;
    next('sunset');
    return true;
  }
  if (f.phase === 'sunset') {
    placePair(endX());
    yardFrame(endX());
    if (f.u < SUNSET_HOLD_S) return true;
    // Over: the sunset held under the sheet, and the two of them home for good.
    f.phase = 'held';
    S.retired = { x: f.pair.map(o => o.x), mode: 'sit', left: RETIRED_TURN_S[0], u: 0, home: endX() };
    return false;
  }
  return false;
}

const endX = () => FINALE_END_CELLS * P;
function placePair(x) {
  const [her, him] = F().pair;
  her.x = x; her.face = -1;
  him.x = x + WORKER + FINALE_PAIR_GAP; him.face = -1;
  const way = ways().yard;
  her.y = feetOn(way, her.x);
  him.y = feetOn(way, him.x);
}

// The deep's frame on `x`, pulled in by `k` of the kill's closeness, and
// held on height `y` while pulled in.
function deepFrame(x, k, y = null) {
  killFrame(k, glideX('deep', x), k > 0 && y != null ? y : null);
}
// The yard's: the pair a share of the window in from its left.
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
// Who can fall in: out in the open on the yard's own floor, on its feet and
// free to walk -- not behind a door, aloft, in a craft, on the cursor, or
// down a working.
const free = w => !w.parade && !w.lifted && !w.falling && !w.aloft && !w.floating && !w.inside
                && !w.craft && !w.homeward && !isDeepType(w.type) && onYard(w) && !belowYard(w)
                && Math.abs(w.y - feetOn(ways().yard, w.x)) < P * 2;
function joinCrowd(x) {
  const f = F();
  for (const w of S.workers) {
    if (!free(w) || x > w.x + FINALE_JOIN_CELLS * P) continue;
    w.parade = { k: f.joined++ };
    w.walking = false;
    w.route = null;
    w.say = null;
  }
}
// Its place in the files: behind the pair, two abreast, the second file
// half a rank back and a cell nearer.
function slotOf(k) {
  const f = F(), lead = f.pair[1].x + WORKER + FINALE_BEHIND;
  const rank = Math.floor(k / 2), file = k % 2;
  return { x: lead + rank * FINALE_RANK + file * snap(FINALE_RANK / 2), file };
}
// The crowd's step (crew/step.js): to its place at a hurry, then hopping in
// held poses with a mark over it now and then; still in the final hold.
function stepParade(w) {
  const f = F();
  if (!f || !YARD.has(f.phase)) return;
  const s = slotOf(w.parade.k);
  const step = FINALE_JOIN_PX_S / 60 * frames() * f.hurry;
  const d = s.x - w.x;
  w.x += Math.sign(d) * Math.min(Math.abs(d), step);
  if (Math.abs(d) > 0.5) w.face = Math.sign(d);
  else w.face = -1;
  w.y = feetOn(ways().yard, w.x) + s.file * P;
  if (stillNow()) { w.say = null; return; }
  const k = w.parade.k, beat = f.T + hash(k) * FINALE_MARK_EVERY_S;
  const n = Math.floor(beat / FINALE_MARK_EVERY_S);
  if (n !== w.parade.n && f.T > 0.4) {
    w.parade.n = n;
    w.say = { mark: ['heart', 'note', 'bang'][Math.floor(hash(k * 7 + n) * 3)], until: now() + FINALE_MARK_S * 1000 };
  }
}
// The final hold: nothing moves but the sparks falling out.
const stillNow = () => { const f = F(); return f.phase === 'held' || (f.phase === 'sunset' && f.u >= SUNSET_HOLD_S - 2); };
// How far a body in the crowd is drawn over its feet, in pixels: its hop, a
// held pose at a time, once it is in its place. Never moves `w.y`, so
// nothing reasoning about where a body stands has a body in the air.
export function paradeLift(w) {
  const f = F();
  if (!w.parade || !f || !YARD.has(f.phase) || stillNow()) return 0;
  const s = slotOf(w.parade.k);
  if (Math.abs(s.x - w.x) > P) return 0;
  return FINALE_HOP[Math.floor(f.T / FINALE_HOP_S + w.parade.k) % FINALE_HOP.length] * P;
}

// One of the crew's frames while the yard is held (crew/step.js): the crowd
// in the procession, the one taking the gear up let get on with it, and
// everybody else stood still where they are. True when the frame is taken.
export function finaleBody(w) {
  if (!workPaused()) return false;
  if (w.parade) { stepParade(w); return true; }
  const f = F();
  // the one taking up her gear goes once the heart is had, and only then
  if (f && f.heir && w.uid === f.heir && f.phase === 'heir') return false;
  return true;
}

// --- the fireworks -------------------------------------------------------------------------
// One every FINALE_FIREWORK_S of the walk, somewhere over the window, a kind
// picked at random; where each is is a share of the window, since they burst
// far off over the yard and the window is on the move.
function launch() {
  const f = F();
  const n = Math.floor(f.T / FINALE_FIREWORK_S);
  while ((f.fired || 0) <= n) {
    const i = f.fired = (f.fired || 0) + 1;
    f.bursts.push({ i, at: (i - 1) * FINALE_FIREWORK_S, sx: 0.08 + 0.84 * hash(i * 3.1 + 1),
                    sy: FIREWORK_HIGH[0] + (FIREWORK_HIGH[1] - FIREWORK_HIGH[0]) * hash(i * 7.7 + 2),
                    kind: ['star', 'ring', 'willow'][Math.floor(rand() * 3) % 3] });
  }
  f.bursts = f.bursts.filter(b => f.T - b.at < FIREWORK_RISE_S + FIREWORK_LIFE_S);
}

// --- the sheet put down ------------------------------------------------------------------
// The yard goes again: the crowd walks home, each the way it would to a job
// it was put on, and the sunset's bands go.
export function sheetDown() {
  for (const w of S.workers) {
    if (!w.parade) continue;
    delete w.parade;
    w.say = null;
    retask(w, w.type);
  }
  lockScroller(false, 'finale');
  if (F()) { F().phase = 'dusk'; F().u = 0; }
}

// --- every frame --------------------------------------------------------------------------
// The sunset going once the sheet is down, and the two of them at the left
// end going about their afternoon.
export function stepFinaleAfter(c) {
  const f = F();
  if (f && f.phase === 'dusk') {
    f.u += c.dt / 1000;
    if (f.u >= SUNSET_OUT_S) S.finale = null;
  }
  if (f && f.phase === 'held') {
    // Under the sheet: the sunset stands, the clock of the fireworks runs on
    // so the last sparks fall out.
    f.T += c.dt / 1000;
    f.u += c.dt / 1000;
  }
  stepRetired(c);
}

// The turns the two of them take, at random, a turn lasting
// RETIRED_TURN_S..: sitting together, a stroll out and back, looking up at
// the sky, a heart, a hop. Never while the finale is still on them.
const TURNS = ['sit', 'stroll', 'look', 'heart', 'hop'];
function stepRetired(c) {
  const r = S.retired;
  if (!r || (F() && F().phase !== 'dusk')) return;
  if (!Array.isArray(r.x) || r.x.length !== 2) r.x = [endX(), endX() + WORKER + FINALE_PAIR_GAP];
  r.home ??= endX();
  const dt = c.dt / 1000;
  r.u = (r.u || 0) + dt;
  r.left = (r.left ?? 0) - dt;
  if (r.mode === 'stroll') {
    // out along the yard a few cells and back, hand in hand
    const half = RETIRED_STROLL_CELLS * P / RETIRED_STROLL_PX_S;
    const k = r.u < half ? r.u / half : Math.max(0, 2 - r.u / half);
    const x = snap(r.home + k * RETIRED_STROLL_CELLS * P);
    r.x = [x, x + WORKER + FINALE_PAIR_GAP];
    r.face = r.u < half ? 1 : -1;
    if (r.u >= half * 2) { r.x = [r.home, r.home + WORKER + FINALE_PAIR_GAP]; r.left = 0; }
    else return;
  }
  if (r.left > 0) return;
  const was = r.mode;
  let mode = TURNS[Math.floor(rand() * TURNS.length) % TURNS.length];
  if (mode === was) mode = TURNS[(TURNS.indexOf(mode) + 1) % TURNS.length];
  r.mode = mode;
  r.u = 0;
  r.face = -1;
  r.left = RETIRED_TURN_S[0] + rand() * (RETIRED_TURN_S[1] - RETIRED_TURN_S[0]);
}

// Where the two of them are drawn, finale or after: [{ x, y, face, sit }]
// in world pixels, or null when they are nowhere to be seen in the yard.
export function pairInYard() {
  const f = F();
  if (f && YARD.has(f.phase)) {
    const sit = (f.phase === 'sunset' && f.u >= SUNSET_SIT_S) || f.phase === 'held';
    return f.pair.map(o => ({ x: o.x, y: f.phase === 'held' ? feetOn(ways().yard, o.x) : o.y, face: o.face, sit }));
  }
  const r = S.retired;
  if (!r || !Array.isArray(r.x)) return null;
  const way = ways().yard;
  return r.x.map((x, i) => ({ x, y: feetOn(way, x), face: r.mode === 'heart' ? (i ? -1 : 1) : (r.face ?? -1),
                              sit: r.mode === 'sit' || !!f }));
}

// --- the save ------------------------------------------------------------------------------
// Only the phase is written. A reload mid-finale lands at its end: her off
// the crew if she was not yet, the two of them at the left end, the kill and
// the finale played, the sunset held and the sheet to come. Read after the
// crew and the beats (persist.js, `SAVERS`).
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
  S.retired = { x: [endX(), endX() + WORKER + FINALE_PAIR_GAP], mode: 'sit', left: RETIRED_TURN_S[0], u: 0, home: endX() };
  S.finale = { phase: 'held', u: SUNSET_HOLD_S, T: 0, hurry: 1, st: null, her: null, heir: null,
               pair: S.retired.x.map(x => ({ x, y: S.groundY - WORKER, face: -1 })), joined: 0, bursts: [],
               kit: null, glide: null };
  markDone('freed', 'finale');
}

export const SAVE = {
  fields: ['finale'],
  write(out) {
    const f = F();
    out.finale = f && f.phase !== 'dusk' ? { phase: f.phase, her: f.her || null } : null;
  },
  read(s) {
    S.finale = null;
    const f = s.finale;
    if (!f || typeof f.phase !== 'string') return;
    land(typeof f.her === 'string' ? f.her : null);
  },
  blank() { S.finale = null; }
};

// The two of them's spots at the end, for the checks.
export const retiredAt = () => [endX(), endX() + WORKER + FINALE_PAIR_GAP];
