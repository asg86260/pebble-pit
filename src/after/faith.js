// The click, a cloud, and faith (DESIGN.md, "Acts 3 and 4", act 3, "The
// click: a cloud, and faith"). Placeholder drawing (render/after.js); the
// working is the spec's.
//
// Small clouds drift over the place on the afterlife's air. A hit puffs one a
// step smaller, and faith comes off it as motes that drift down to the camp's
// plate and are counted where they land, never on the click (nothing
// teleports). Grey storm clouds -- the yard's smog risen through the cloud
// floor, the yard still running below (call 1) -- are wrung for ink instead,
// drops that fall to the well (call 11 open: storm clouds, the
// recommendation). Now and then a thunderhead drifts over, bigger and slower,
// its shadow on the floor: the act's crit. A cloud hit to nothing fades off;
// new ones fade in. After CHOP_CLICKS cloud hits the hand is owed an axe (the
// `axe` beat; call 15 open: a click count, the recommendation).
//
// The clouds and the motes in the air are saved (`S.after.clouds`,
// `S.after.motes`): a mote is faith already won, and a reload must not lose
// it on the way down. The puffs' cells are this session's.

import { S } from '../state.js';
import { P, CHOP_CLICKS, AFTER_CLOUDS, AFTER_CLOUD_EVERY_S, AFTER_CLOUD_DRIFT, AFTER_CLOUD_SIZE,
         AFTER_STORM_SHARE, AFTER_THUNDER_SHARE, AFTER_THUNDER_SIZE, AFTER_THUNDER_BURST,
         AFTER_CLOUD_FADE_S, AFTER_PUFF_S, AFTER_MOTE_FALL, AFTER_MOTES_A_HIT,
         AFTER_GATHER_FAITH } from '../config.js';
import { owe, owed } from '../acts.js';
import { arand, secs, nextId } from './util.js';
import { puffFaith, wringInk } from './levels.js';
import { afterX0, afterX1, afterFloor, skyLo, skyHi, stationMid, stationBox } from './place.js';
import { treeAt, chopTree } from './grove.js';

// --- a cloud's shape ----------------------------------------------------------------
// A cloud of `size` puffs is an oval of cells (2·size + 2) across and size + 1
// high; which cells of the oval's ragged edge stand is fixed by its id, so it
// holds still frame to frame and shrinks a ring at a time.
export const cloudW = c => (2 * c.size + 2) * P;
export const cloudH = c => (c.size + 1) * P;
export function cloudCells(c) {
  const w = 2 * c.size + 2, h = c.size + 1, out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const nx = (i + 0.5) / w * 2 - 1, ny = (j + 0.5) / h * 2 - 1;
    const d = nx * nx + ny * ny;
    const ragged = ((((c.id * 31 + i * 7 + j * 13) * 2654435761) >>> 0) % 100) / 100;
    if (d < 0.75 || (d < 1.05 && ragged < 0.55)) out.push([i, j]);
  }
  return out;
}
const alive = c => c.die == null;

// --- the air ------------------------------------------------------------------------
let spawnIn = 0;
const puffs = [];         // { x, y, w, h, kind, age }
// The motes coming down: { x, y, v, kind: 'faith' | 'ink', tx, age }.
export const airMotes = () => (S.after ? S.after.motes : []);
export const airPuffs = () => puffs;
export const forgetAir = () => { puffs.length = 0; };

function spawnCloud(a) {
  const r = arand();
  const kind = r < AFTER_THUNDER_SHARE ? 'thunder' : r < AFTER_THUNDER_SHARE + AFTER_STORM_SHARE ? 'storm' : 'white';
  const size = kind === 'thunder' ? AFTER_THUNDER_SIZE
             : AFTER_CLOUD_SIZE[0] + Math.floor(arand() * (AFTER_CLOUD_SIZE[1] - AFTER_CLOUD_SIZE[0] + 1));
  const [lo, hi] = AFTER_CLOUD_DRIFT;
  const vx = (lo + arand() * (hi - lo)) * (kind === 'thunder' ? 0.5 : 1);
  const y = Math.round((skyHi() + arand() * (skyLo() - skyHi() - (size + 1) * P)) / P) * P;
  const x = Math.round((afterX0() + arand() * (afterX1() - afterX0() - (2 * size + 2) * P)) / P) * P;
  a.clouds.push({ id: nextId(), x, y, size, max: size, kind, vx, age: 0, die: null });
}

// The motes a hit throws off: `v` shared across at most AFTER_MOTES_A_HIT,
// each drifting down to `tx` on the floor.
function shed(x, y, v, kind, tx) {
  const n = Math.max(1, Math.min(AFTER_MOTES_A_HIT, v));
  let left = v;
  for (let k = 0; k < n; k++) {
    const each = k === n - 1 ? left : Math.floor(v / n);
    left -= each;
    S.after.motes.push({ x: x + (k - (n - 1) / 2) * P * 2, y, v: each, kind, tx, age: 0 });
  }
}

// Where faith and ink come down: the plate and the well.
const plateX = () => stationMid('plate');
const wellX = () => stationMid('well');

// A puff off a cloud, by the click (`hand`) or a gatherer's pole: the cloud a
// step smaller, faith or ink thrown off it, and the cloud fading out once it
// is gone to nothing.
export function puffCloud(c, hand) {
  const a = S.after;
  const mx = c.x + cloudW(c) / 2, my = c.y + cloudH(c);
  if (c.kind === 'storm') shed(mx, my, hand ? wringInk() : 1, 'ink', wellX());
  else {
    const v = hand ? puffFaith() * (c.kind === 'thunder' ? AFTER_THUNDER_BURST : 1) : AFTER_GATHER_FAITH;
    shed(mx, my, v, 'faith', plateX());
  }
  puffs.push({ x: c.x, y: c.y, w: cloudW(c), h: cloudH(c), kind: c.kind, age: 0 });
  c.size -= 1;
  if (c.size <= 0) { c.size = 0; c.die = a.t; }
  if (hand) a.clicks = (a.clicks || 0) + 1;
}

// The cloud under a world point, the nearest the front first.
export function cloudAt(x, y) {
  const list = S.after ? S.after.clouds : [];
  for (let i = list.length - 1; i >= 0; i--) {
    const c = list[i];
    if (!alive(c)) continue;
    if (x >= c.x && x < c.x + cloudW(c) && y >= c.y && y < c.y + cloudH(c)) return c;
  }
  return null;
}

// A click on the place, in world pixels: true if it hit a cloud, or, with
// the axe, a grown tree.
export function hitCloud(x, y) {
  if (!S.after) return false;
  if (S.after.axe) {
    const t = treeAt(x, y);
    if (t != null) { chopTree(t, true); return true; }
  }
  const c = cloudAt(x, y);
  if (!c) return false;
  puffCloud(c, true);
  return true;
}

// The axe: owed once the click count is reached and until the beat hands it
// over (story.js). `owe` is acts.js's seam for a trigger not yet wired into
// the beats; Track C may read `axeDue` instead.
export const axeDue = () => !!S.after && !S.after.axe && (S.after.clicks || 0) >= CHOP_CLICKS;
export const giveAxe = () => { if (S.after) S.after.axe = true; };

// One frame of the sky over the place.
export function stepFaith(c) {
  const a = S.after, dt = secs(c);
  // Clouds: drift, age, fade; a new one drifts in now and then.
  for (const cl of a.clouds) {
    cl.age += dt;
    cl.x += cl.vx * dt;
    if (alive(cl) && cl.x > afterX1()) cl.die = a.t;
  }
  a.clouds = a.clouds.filter(cl => alive(cl) || a.t - cl.die < AFTER_CLOUD_FADE_S);
  spawnIn -= dt;
  if (spawnIn <= 0 && a.clouds.filter(alive).length < AFTER_CLOUDS) { spawnCloud(a); spawnIn = AFTER_CLOUD_EVERY_S; }
  // Motes and drops: down on the air, steered to the plate or the well, and
  // counted where they land.
  const floor = afterFloor(), motes = a.motes;
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.age += dt;
    const land = (m.kind === 'ink' ? stationBox('well') : stationBox('plate')).y;
    const fall = AFTER_MOTE_FALL * dt;
    const left = Math.max(1, (land - m.y) / AFTER_MOTE_FALL);
    m.x += (m.tx - m.x) * Math.min(1, dt / left);
    m.y += fall;
    if (m.y >= Math.min(land, floor)) {
      if (m.kind === 'ink') a.ink += m.v; else a.faith += m.v;
      motes.splice(i, 1);
    }
  }
  for (let i = puffs.length - 1; i >= 0; i--) if ((puffs[i].age += dt) > AFTER_PUFF_S) puffs.splice(i, 1);
  // The axe's beat owed while it is due.
  if (axeDue()) {
    if (S.beatsDone.includes('axe')) giveAxe();
    else if (!owed('axe') && S.beat.camera !== 'axe') owe('axe');
  }
}

// The clouds drifting now, for the drawing.
export const clouds = () => (S.after ? S.after.clouds : []);
export const cloudAlpha = (cl, t) => cl.die != null ? Math.max(0, 1 - (t - cl.die) / AFTER_CLOUD_FADE_S)
                                                 : Math.min(1, cl.age / AFTER_CLOUD_FADE_S);
