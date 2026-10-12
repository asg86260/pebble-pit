// --- the first muck ----------------------------------------------------------
// Once, ever: after the first storm that leaves weather muck on the ground,
// the first body to go for it is watched doing it -- the last stretch of its
// walk, a "?" over its head at the patch, the yuck, the shovel, the cell
// fading out -- and the camera lets go (DESIGN.md, "The first muck's scene").
//
// The scene follows whoever the yard's own clear-up sends: the claim is the
// body's (`muckAt`, crew/shovel.js) and nothing here picks a column for a
// hauler or a janitor. Only when nobody whose job it is has gone for the
// muck a moment after the storm is one of the rock's gang sent off for the
// one patch (`S.muckPull`); it walks there, shovels, and walks back on the
// rock's own way home (`rockhandBack`). Nothing teleports either way.
//
// The beat is a row of BEATS that owns the camera (beats.js); the framing is
// a scene in cutscene.js asking this file where to look and when it is over.
// This file is imported by the crew, so it imports nothing of the story's:
// the beat's state is read straight off `S`.

import { P, WORKER, CUT_MUCK_NEAR, CUT_MUCK_LEAD,
         CUT_MUCK_ASK_S, CUT_MUCK_YUCK_S, CUT_MUCK_FADE_S, CUT_MUCK_WAIT_S,
         CUT_MUCK_PULL_CELLS } from './config.js';
import { S } from './state.js';
import { TYPE } from './jobs.js';
import { dryTime, muckCols, muckOpen, onOpenYard } from './smog.js';

export const KEY = 'firstmuck';

const done = () => S.beatsDone.includes(KEY);
const running = () => S.beat.camera === KEY && !(S.shot && S.shot.out);
const mid = w => w.x + WORKER / 2;
const cellX = c => c * P + P / 2;
// The patch the scene is about: weather muck on the open yard, ground a body
// walks up to level. Muck on the rock or a heap is shovelled as ever, and
// not watched: the shot is somebody crossing the yard to it.
const weather = c => c != null && (muckCols()[c] || 0) > 0 && onOpenYard(c);

// A storm has stood through to its end with muck in it (`muckRains`, the
// record's own count, rain.js), the scene has not been had, and the weather
// is done with the ground (`muckOpen`).
export const muckArmed = () => !done() && (S.tally.muckRains | 0) >= 1 && muckOpen();

// Whoever is going for the weather's muck: of the claims on a column with
// muck in it, the body nearest its patch. `near` holds it to the last stretch.
function claimant(near = Infinity) {
  let best = null, gap = Infinity;
  for (const w of S.workers) {
    // On its way to it, not holding the claim through the loo or a fall.
    if (!weather(w.muckAt) || w.goal !== 'muck' || w.looUntil || w.lifted || w.falling || w.inside) continue;
    // The body sent for it, if one was: the scene is that walk.
    const d = w.uid === S.muckPull ? -1 : Math.abs(mid(w) - cellX(w.muckAt));
    if (d <= near && d < gap) { best = w; gap = d; }
  }
  return best;
}

// The beat's `when`: armed, and somebody on its last stretch to the muck.
export const firstMuckDue = () => muckArmed() && !!claimant(CUT_MUCK_NEAR * P);

// The beat's `enter`, before the camera is taken (beats.js plays the shot).
export function startFirstMuck() {
  adopt(claimant(CUT_MUCK_NEAR * P));
}

// The scene's state, on the body it follows: which column, from which side
// it came in, how deep the column stood, and the cells shovelled off it,
// fading. Ephemeral; a reload takes the scene again over whoever is on the
// muck then (`over`).
function adopt(w) {
  if (!w) return;
  const col = w.muckAt;
  S.muckScene = { uid: w.uid, col, side: Math.sign(mid(w) - cellX(col)) || -1,
                  depth: muckCols()[col] || 0, phase: 'walk', at: 0, ghosts: [] };
}

// --- the camera's questions (cutscene.js) ---------------------------------------
// The patch off center, the frame's open side toward the walker.
export function muckSpot() {
  const sc = S.muckScene;
  if (!sc) return S.camX + S.viewW / 2;
  return cellX(sc.col) + sc.side * CUT_MUCK_LEAD * S.viewW;
}
// Over once the patch is clear and its last cell has faded. A scene picked
// up again after a reload takes whoever is on the muck now; with nobody, it
// is over.
export function muckOver() {
  if (!S.muckScene) adopt(claimant());
  return !S.muckScene || S.muckScene.phase === 'done';
}

// --- the body's half (crew/shovel.js) ---------------------------------------------
// Asked by the shovel on the frame it would swing, stood at its patch: true
// holds it there. The followed body asks, then pulls a face, then is let go
// to shovel. Before the beat has the camera, an armed yard holds any body
// arrived at weather muck a frame, so the scene that is about to start sees
// the first stroke rather than the end of it.
export function posing(w, now) {
  const sc = S.muckScene;
  if (!sc) return muckArmed() && !S.beat.camera && weather(w.muckAt);
  if (!running() || w.uid !== sc.uid || w.muckAt !== sc.col) return false;
  w.face = Math.sign(cellX(sc.col) - mid(w)) || w.face;
  if (sc.phase === 'walk') {
    sc.phase = 'ask'; sc.at = now;
    w.say = { mark: 'ask', until: now + CUT_MUCK_ASK_S * 1000 };
    return true;
  }
  if (sc.phase === 'ask') {
    if (now - sc.at < CUT_MUCK_ASK_S * 1000) return true;
    sc.phase = 'yuck'; sc.at = now;
    w.say = { mark: 'yuck', until: now + CUT_MUCK_YUCK_S * 1000 };
    return true;
  }
  if (sc.phase === 'yuck') {
    if (now - sc.at < CUT_MUCK_YUCK_S * 1000) return true;
    sc.phase = 'shovel';
    w.say = null;
  }
  return false;
}

// Where the followed body stands, off its patch: a body's width to the side
// it came in from, so the cells are in view as they go. Nought for anybody
// else, and once the scene has let go.
export function standOff(w) {
  const sc = S.muckScene;
  return sc && running() && w.uid === sc.uid && w.muckAt === sc.col ? sc.side * WORKER : 0;
}

// --- one frame -------------------------------------------------------------------
// Before the crew (game.js), so a body sent off the rock is sent this frame.
export function stepFirstMuck(t) {
  const sc = S.muckScene;
  if (sc) {
    if (done() && !running()) { S.muckScene = null; return; }
    // Every cell that comes off the patch fades where it lay.
    const now = muckCols()[sc.col] || 0;
    for (let n = sc.depth; n > now; n--) sc.ghosts.push({ n, at: t });
    sc.depth = Math.min(sc.depth, now);
    sc.ghosts = sc.ghosts.filter(g => t - g.at < CUT_MUCK_FADE_S * 1000);
    if (!now && sc.phase !== 'fade' && sc.phase !== 'done') { sc.phase = 'fade'; sc.at = t; }
    if (sc.phase === 'fade' && t - sc.at >= CUT_MUCK_FADE_S * 1000) sc.phase = 'done';
  }
  pull();
}

// One of the gang, sent off the rock for the one patch when nobody whose job
// it is has gone for any of it. The pull ends when the body's claim does
// (the patch clear, or the claim dropped), and the rock's own way back
// takes it home (`rockhandMess`, `rockhandBack`).
function pull() {
  if (S.muckPull != null) {
    const w = S.workers.find(o => o.uid === S.muckPull);
    if (!w || !weather(w.muckAt)) S.muckPull = null;
    return;
  }
  if (S.muckScene || !muckArmed() || dryTime() < CUT_MUCK_WAIT_S || claimant()) return;
  let best = null, col = null, gap = Infinity;
  for (const w of S.workers) {
    if (w.type !== TYPE.ROCK || w.lifted || w.falling || w.inside || w.walking || w.carry) continue;
    const c = nearestOpen(mid(w));
    if (c == null) continue;
    const d = Math.abs(cellX(c) - mid(w));
    if (d < gap) { best = w; col = c; gap = d; }
  }
  if (!best) return;
  best.muckAt = col;
  S.muckPull = best.uid;
}

// The nearest such patch to a body, a short walk off.
function nearestOpen(wx) {
  const m = muckCols();
  const home = Math.floor(wx / P);
  for (let d = CUT_MUCK_PULL_CELLS; d < m.length; d++) {
    for (const c of [home - d, home + d]) {
      if (c >= 0 && c < m.length && weather(c)) return c;
    }
    if (home - d < 0 && home + d >= m.length) break;
  }
  return null;
}
