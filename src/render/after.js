// The afterlife, drawn (DESIGN.md, "Acts 3 and 4", act 3, "The picture"). Its
// layers are in render.js's LAYERS, drawn only with the camera up there.
//
// EVERY DRAWING HERE IS A PLACEHOLDER, not the look: flat cells on the P = 6
// grid standing in for the hifi mocks still to be voted (the grove, the camp's
// mills, the pedestal, God, the throne, the crowd's bodies). What they are for
// is to show the loop working -- the pair's speech knocking rebel down to the
// pile, a tree falling and its stump dug out, a sign going out into the crowd
// and the ink spreading round it, the members walking out to the camp. High
// key, black and white only: white cloud and pale cells, black for rims, ink
// and loads. Every tone is a rung of the one grey ramp picked off a fixed hash
// of where the cell stands (no flat fills, no random draw, so it holds still
// frame to frame), and everything that comes or goes fades by opacity.

import { P, GREY, AFTER_FLOOR_CELLS, AFTER_FLOOR_TONES, AFTER_CARDS, AFTER_FALL_FRAMES, AFTER_FALL_S,
         AFTER_CROWN_FADE_S, AFTER_BUILD_FADE_S, AFTER_POSTER_FADE_S, AFTER_SPEECH_FILES, AFTER_SPEECH_WARN_S,
         AFTER_SHOUT_HOLD_S, AFTER_POST_STEP, AFTER_JOBS, AFTER_JOB_POST, AFTER_DIG_CLICKS, AFTER_BUILD_PIECES,
         AFTER_WORK_HOLD_S, AFTER_TIP_HOLD_S, AFTER_SPILL_S,
         CROWD_FILES, CROWD_NEAR, RIM_PIECES, CROWD_X0 } from '../config.js';
import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { warning } from './pilemarks.js';
import { afterX0, afterX1, afterFloor, plotX, stationBox, soulX, farX, soulY, slotX, crowdX1, stairFoot,
         throneAt, fileAt, rankAtY, campSpot, speakerAt, pileX, heapX, notchX } from '../after/place.js';
import { clouds, cloudCells, cloudAlpha, airMotes, cloudW } from '../after/rebel.js';
import { trees, GROWN, trunkCells, crownCells } from '../after/grove.js';
import { built, has, heapBrim } from '../after/levels.js';
import { heapFull, airSpills } from '../after/mill.js';
import { pairBuilding } from '../after/build.js';
import { postsOf, bodiesOf } from '../after/bodies.js';
import { souls, speechWarned, speechHeld } from '../after/union.js';

// A cell's tone, fixed by where it is, off `tones` (rungs of GREY).
const hashAt = (c, r) => ((((c * 73856093) ^ (r * 19349663)) >>> 0) % 9973);
const toneAt = (c, r, tones = AFTER_FLOOR_TONES) => tones[hashAt(c, r) % tones.length];
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, P, P); };
const snap = v => Math.round(v / P) * P;
// Whether a world box is in the view at all: a thing off screen costs no draw.
const inView = (x, w) => x + w >= S.camX && x <= S.camX + S.viewW;
const A = () => S.after;
const now = () => (S.after ? S.after.t : 0);
const fadeIn = at => (at == null ? 1 : Math.min(1, (now() - at) / AFTER_BUILD_FADE_S));

export function drawAfterBackdrop() {
  // The page under the view, white, from the view's top to the floor.
  const x0 = Math.max(afterX0(), Math.floor(S.camX / P) * P);
  const x1 = Math.min(afterX1(), Math.ceil((S.camX + S.viewW) / P) * P);
  ctx.fillStyle = GREY[0];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  // The cloud floor: AFTER_FLOOR_CELLS rows of pale cells under the floor line.
  const top = afterFloor();
  for (let r = 0; r < AFTER_FLOOR_CELLS; r++) {
    for (let x = x0; x < x1; x += P) cell(x, top + r * P, toneAt(x / P, r));
  }
  ctx.fillStyle = '#000';
}

// --- the stair and the throne --------------------------------------------------------
// A run of steps from the crowd's end up to the throne, the throne a block of
// white in a ring of glare cells; the speech's sweep warned by a frame over
// its files, then held as a white wash across them.
export function drawAfterStair() {
  if (!A()) return;
  const floor = afterFloor(), th = throneAt(), x0 = stairFoot();
  if (inView(x0, th.x - x0 + P * 8)) {
    const steps = Math.round((th.x - x0) / P);
    for (let k = 0; k < steps; k++) {
      const x = x0 + k * P, y = snap(floor - (floor - th.y) * (k + 1) / steps);
      for (let yy = y; yy < floor; yy += P) cell(x, yy, yy === y ? 6 : toneAt(x / P, yy / P, [1, 2]));
    }
    // The glare: rings of pale cells round the throne, the throne white, black-rimmed.
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 6 || d < 2.5) continue;
      if (hashAt(dx + 40, dy + 40) % 3) continue;
      cell(th.x + dx * P, th.y - P * 3 + dy * P, 1);
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(th.x - P * 2, th.y - P * 5, P * 5, P * 5);
    ctx.fillStyle = GREY[0];
    ctx.fillRect(th.x - P, th.y - P * 4, P * 3, P * 3);
  }
  const sp = A().speech;
  if (!sp) return;
  const x = soulX(sp.f0) - P, w = AFTER_SPEECH_FILES * (soulX(1) - soulX(0));
  const top = soulY(Math.max(CROWD_NEAR, Math.ceil(souls().length / CROWD_FILES))) - P * 4;
  if (speechHeld()) {
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = GREY[0];
    ctx.fillRect(x, top, w, floor - top);
    ctx.globalAlpha = 1;
  } else if (speechWarned()) {
    // The warning fades in over its seconds: a frame of grey cells round the band.
    ctx.globalAlpha = Math.min(1, 1 - (sp.next - now()) / AFTER_SPEECH_WARN_S);
    for (let xx = x; xx < x + w; xx += P * 2) { cell(xx, top, 5); cell(xx, floor - P, 5); }
    ctx.globalAlpha = 1;
  }
}

// --- God's yard: the fence and the posters on it ---------------------------------------------
export function drawAfterYard() {
  if (!A()) return;
  const floor = afterFloor();
  // The fence at the crowd's front: posts and a rail, under the posters.
  const x0 = CROWD_X0, x1 = crowdX1();
  if (inView(x0, x1 - x0)) {
    for (let x = x0; x < x1; x += P) cell(x, floor - P * 4, toneAt(x / P, 7, [3, 4]));
    for (let x = x0; x < x1; x += P * 8) for (let y = floor - P * 4; y < floor; y += P) cell(x, y, 7);
  }
  for (const p of A().posters) {
    const x = slotX(p.slot);
    if (!inView(x, P * 2)) continue;
    ctx.globalAlpha = p.torn != null ? Math.max(0, 1 - (now() - p.torn) / AFTER_POSTER_FADE_S) : 1;
    // A sheet, three cells by three (five tall when it reaches further),
    // black-rimmed; torn, every other row gone.
    const rows = p.big ? 5 : 3, top = floor - P * (3 + rows);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - P, top, P * 3, P * (rows + 1));
    for (let r = 0; r < rows; r++) {
      if (p.torn != null && r % 2) continue;
      ctx.fillStyle = GREY[r % 2 ? 2 : 0];
      ctx.fillRect(x - P + 1, top + 1 + r * P, P * 3 - 2, P - (r === rows - 1 ? 2 : 0));
    }
    ctx.globalAlpha = 1;
  }
}

// --- the grove -----------------------------------------------------------------------------
// A plot: a patch of darker cloud cells it stands on, fading in when it is
// cleared. A tree: a trunk three cells wide (black, pale, black) and a crown
// of cloud cells, by stage and size; a chop a black notch out of the trunk;
// falling, its cells turned about the base a held frame at a time; down, the
// crown's cells fading off and the logs lying. A stump: three cells, a notch
// a swing taken at it.
function treeCells(stage, big) {
  const out = [];
  const h = trunkCells(stage, big), cr = crownCells(stage, big);
  for (let j = 0; j < h; j++) for (let i = -1; i <= 1; i++) out.push([i, -1 - j, i === 0 ? 'trunk' : 'rim']);
  for (let dy = -cr; dy <= cr; dy++) for (let dx = -cr - 1; dx <= cr + 1; dx++) {
    if (dx * dx / ((cr + 1.2) ** 2) + dy * dy / ((cr + 0.4) ** 2) > 1) continue;
    out.push([dx, -1 - h - cr + dy, 'crown']);
  }
  return out;
}
const TONE = { trunk: 1, rim: 10 };
export function drawAfterGrove() {
  const a = A();
  if (!a) return;
  const floor = afterFloor(), t = now();
  trees().forEach((p, i) => {
    const bx = plotX(i);
    if (!inView(bx - P * 8, P * 16)) return;
    ctx.globalAlpha = fadeIn(p.at);
    for (let c = -2; c <= 2; c++) cell(bx + c * P, floor, toneAt(c + i * 5, 9, [3, 4, 3]));
    ctx.globalAlpha = 1;
    // The logs lying, a bar of three cells each, stacked.
    for (let k = 0; k < p.logs; k++) {
      for (let c = 0; c < 3; c++) cell(bx + P * (1 + c), floor - P * (1 + k), c === 1 ? 2 : 8);
    }
    if (p.stump) {
      cell(bx - P, floor - P, 10); cell(bx, floor - P, 2); cell(bx + P, floor - P, 10);
      // A notch a swing at it, cut down into the stump from the top.
      for (let k = 0; k < Math.min(p.dug || 0, AFTER_DIG_CLICKS); k++) cell(bx - P + k * P, floor - P * 2, 3);
    }
    let stage = p.stage, angle = 0, alpha = 1;
    if (p.fall != null) {
      const k = Math.min(AFTER_FALL_FRAMES - 1, Math.floor((t - p.fall) / AFTER_FALL_S * AFTER_FALL_FRAMES));
      angle = (Math.PI / 2) * k / (AFTER_FALL_FRAMES - 1);
    } else if (p.fell != null) {
      stage = GROWN; angle = Math.PI / 2; alpha = Math.max(0, 1 - (t - p.fell) / AFTER_CROWN_FADE_S);
    }
    if (!stage) return;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    ctx.globalAlpha = alpha * fadeIn(p.at);
    for (const [dx, dy, kind] of treeCells(stage, p.big)) {
      // Down, only the crown is left to fade: the trunk is the logs.
      if (p.fell != null && kind !== 'crown') continue;
      const rx = Math.round(dx * cos - dy * sin), ry = Math.round(dx * sin + dy * cos);
      const x = bx + rx * P, y = floor + ry * P;
      if (y >= floor) continue;
      cell(x, y, kind === 'crown' ? toneAt(dx + i * 17, dy, [1, 2, 3, 2]) : TONE[kind]);
    }
    // The chops, a notch apiece up the trunk.
    if (p.fall == null && p.fell == null) for (let k = 0; k < p.chops; k++) cell(bx + P, floor - P * (2 + k), 0);
    ctx.globalAlpha = 1;
  });
}

// --- the camp --------------------------------------------------------------------------------
// A station: a box of hashed pale cells in a black frame, a black door, and
// its glyph; raised a piece at a time once bought, a band of the box from the
// floor up, each fading in as it lands; its heaps beside it; its posts a row
// of stakes along its roof (the pedestal's along its face), black while a
// member holds one or is walking to it, hollow while it waits. A station not
// bought is a ring of grey cells on the floor where it will stand. Worked by
// hand, its glyph is held a cell down a moment.
const MARKS = {   // a placeholder glyph a station, cells off its middle: no words on the canvas
  mill: [[-1, 0], [1, 0], [0, -1], [0, 1]], chipper: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  papermill: [[-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]],
  workshop: [[0, -1], [0, 0], [0, 1], [-1, -1], [1, -1]], press: [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]],
  shack: [[-1, 1], [0, 0], [1, 1], [0, 1]]
};
// What an upgrade adds to a station's face: a second glyph beside the first
// (the second blade, drum, bench and vat), and a rail along its foot (the
// paper mill's drying line, the chipper's spout).
const SECOND = { mill: 'after-blade', chipper: 'after-drum', workshop: 'after-bench', papermill: 'after-vat' };
const RAIL = { papermill: 'after-dry', chipper: 'after-spout' };
function drawPosts(key, b) {
  const jobs = AFTER_JOBS.filter(j => AFTER_JOB_POST[j] === key);
  let k = 0;
  for (const job of jobs) {
    const held = bodiesOf(job).length;
    const posts = postsOf(job);
    for (let n = 0; n < posts; n++, k++) {
      const x = b.x + P + k * AFTER_POST_STEP, y = key === 'pedestal' ? b.y + P : b.y - P * 2;
      ctx.globalAlpha = n === posts - 1 ? fadeIn(A().postAt[job]) : 1;
      cell(x, y, n < held ? 10 : 3);
      cell(x, y + P, n < held ? 10 : 4);
    }
    ctx.globalAlpha = 1;
  }
}
// The station's box from row `y0` down to `y1`, with its door.
function stationRows(key, b, y0, y1) {
  const floor = afterFloor();
  ctx.fillStyle = '#000';
  ctx.fillRect(b.x, y0, b.w, y1 - y0);
  for (let y = Math.max(y0, b.y + P); y < y1; y += P) for (let x = b.x + P; x < b.x + b.w - P; x += P)
    cell(x, y, toneAt(x / P, y / P, [0, 1, 1, 2]));
  if (key === 'pedestal' || y1 <= floor - P * 3) return;
  const top = Math.max(y0, floor - P * 3);
  ctx.fillStyle = '#000';
  ctx.fillRect(b.x + P * 2, top, P * 2, y1 - top);
}
function drawStation(key) {
  const b = stationBox(key);
  if (!inView(b.x - P * 12, b.w + P * 24)) return;
  const a = A(), floor = afterFloor(), r = a.raising[key];
  if (!built(key) && !r) {
    for (let x = b.x; x < b.x + b.w; x += P * 2) cell(x, floor - P, 3);
    return;
  }
  if (r) {
    // A band a piece, the floor up, each fading in from when it landed.
    const rows = b.h / P;
    for (let k = 0; k < r.n; k++) {
      const top = Math.round(rows * (k + 1) / AFTER_BUILD_PIECES), bot = Math.round(rows * k / AFTER_BUILD_PIECES);
      ctx.globalAlpha = fadeIn(r.at[k]);
      stationRows(key, b, floor - top * P, floor - bot * P);
    }
    ctx.globalAlpha = 1;
    if (!built(key)) return;
  } else stationRows(key, b, b.y, floor);
  const settled = r ? fadeIn(r.at[r.at.length - 1]) : 1;
  const mx = snap(b.x + b.w / 2), my = snap(b.y + b.h / 2) - P;
  const held = a.workAt[key] != null && a.t - a.workAt[key] < AFTER_WORK_HOLD_S ? P : 0;
  if (MARKS[key]) {
    ctx.globalAlpha = settled;
    for (const [dx, dy] of MARKS[key]) cell(mx + dx * P, my + dy * P + held, 10);
  }
  if (SECOND[key] && has(SECOND[key])) {
    ctx.globalAlpha = Math.min(settled, fadeIn(a.upAt[SECOND[key]]));
    for (const [dx, dy] of MARKS[key]) cell(mx + (dx + 3) * P, my + dy * P + held, 10);
  }
  if (RAIL[key] && has(RAIL[key])) {
    ctx.globalAlpha = Math.min(settled, fadeIn(a.upAt[RAIL[key]]));
    for (let x = b.x + P * 5; x < b.x + b.w - P; x += P) cell(x, floor - P, 8);
  }
  ctx.globalAlpha = 1;
  drawPosts(key, b);
}
// A heap of `n` cells, a column of `cap` at most, rising left to right from x.
function heap(x, n, cap, tone) {
  const floor = afterFloor();
  for (let k = 0; k < n; k++) cell(x + Math.floor(k / cap) * P, floor - P * (1 + (k % cap)), tone(k));
}
// The sawdust heap between the mill and the chipper, a column of eight at
// most, its top held tipped toward the notch a moment after a tip; the notch,
// a gap in the cloud floor's top rows; a tip's grains falling into it and
// fading.
function drawSawdust(a) {
  const floor = afterFloor(), x0 = heapX(), nx = notchX();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) cell(nx + c * P, floor + r * P, r ? 1 : 0);
  const n = Math.min(heapBrim(), Math.round(a.stock.sawdust));
  const tipped = a.tipAt != null && a.t - a.tipAt < AFTER_TIP_HOLD_S;
  for (let k = 0; k < n; k++) {
    const col = Math.floor(k / 8), row = k % 8;
    cell(x0 + (col + (tipped && row >= 4 ? 1 : 0)) * P, floor - P * (1 + row), k % 3 ? 4 : 5);
  }
  for (const sp of airSpills()) {
    const k = sp.age / AFTER_SPILL_S;
    ctx.globalAlpha = Math.max(0, 1 - k);
    for (let g = 0; g < Math.min(6, sp.n); g++) cell(nx + (g % 2) * P, snap(floor - P * 2 + k * P * 5 + g * P), g % 2 ? 4 : 5);
    ctx.globalAlpha = 1;
  }
  if (heapFull()) warning(x0 + P * 2, floor - P * 11);
}
// A body: a square of `rim` with a pale middle at its feet (x, y), a load
// carried overhead, an arm out held on the blow, and a shout mark over it
// while it gives a line.
function drawBody(w, rim, fill) {
  const x = snap(w.x) - P, y = snap(w.y) - P * 3;
  ctx.fillStyle = GREY[rim];
  ctx.fillRect(x, y, P * 3, P * 3);
  cell(x + P, y + P, fill);
  if (w.load === 'log') for (let c = -1; c <= 3; c++) cell(x + c * P, y - P, c === 1 ? 2 : 8);
  else if (w.load === 'sign') { cell(x + P, y - P, 10); for (let c = 0; c < 3; c++) cell(x + c * P, y - P * 2, 1); }
  else if (w.load === 'posters') { cell(x, y - P, 0); cell(x + P, y - P, 2); cell(x + P * 2, y - P, 0); }
  else if (w.load === 'tip') { cell(x, y - P, 4); cell(x + P, y - P, 4); }
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) shoutMark(x + P, y - P * 3);
    else for (let k = 1; k <= 2; k++) cell(x + (w.face > 0 ? 2 + k : -k) * P, y - k * P, 10);
  }
}
// The shout mark: a bar and a dot, cells over a speaker's head.
function shoutMark(x, y) { cell(x, y - P * 2, 10); cell(x, y - P, 10); cell(x, y + P, 10); }
// The pair on the pedestal, as placeholders, while the story's pair are not
// up here to stand at its foot and they are not down building: arms up and
// the mark over them held a moment after a line.
function drawSpeakers() {
  const a = A(), pair = S.acts && S.acts.pair;
  if ((pair && pair.y < 0) || pairBuilding()) return;
  const loud = a.shout != null && a.t - a.shout < AFTER_SHOUT_HOLD_S;
  for (let k = 0; k < 2; k++) {
    const at = speakerAt(k);
    ctx.fillStyle = '#000';
    ctx.fillRect(at.x, at.y - P * 3, P * 3, P * 3);
    cell(at.x + P, at.y - P * 2, k ? 2 : 1);
    if (loud) { cell(at.x - P, at.y - P * 4, 10); cell(at.x + P * 3, at.y - P * 4, 10); shoutMark(at.x + P, at.y - P * 4); }
  }
}
export function drawAfterCamp() {
  const a = A();
  if (!a) return;
  for (const key of AFTER_CARDS) if (key !== 'grove') drawStation(key);
  const st = a.stock;
  const mill = stationBox('mill'), ch = stationBox('chipper'), pm = stationBox('papermill'), ws = stationBox('workshop'),
        pr = stationBox('press');
  // The logs waiting at the saw and the chipper, the timber stacked behind
  // the saw's logs, the sawdust heap between them.
  heap(mill.x - P * 7, Math.min(st.logs, 24), 4, k => (k % 2 ? 8 : 6));
  heap(mill.x - P * 11, Math.min(Math.floor(st.timber), 18), 6, () => 3);
  if (built('chipper')) heap(ch.x + ch.w + P, Math.min(st.chiplogs, 12), 4, k => (k % 2 ? 8 : 6));
  drawSawdust(a);
  if (built('papermill')) heap(pm.x + pm.w + P, Math.min(st.paper, 12), 6, () => 0);
  if (built('workshop')) heap(ws.x + ws.w, Math.min(st.signs, 6), 1, () => 10);
  if (built('press')) heap(pr.x + pr.w, Math.min(st.posters, 12), 6, () => 1);
  // The rebel pile at the pedestal's foot, a cell a power of ten.
  const rows = Math.ceil(Math.log10(1 + a.rebel) * 2);
  heap(pileX(), rows, 6, k => (k % 2 ? 2 : 3));
  drawSpeakers();
  // The members waiting in the camp, each on its spot, back rows first.
  for (let k = a.camp - 1; k >= 0; k--) {
    const at = campSpot(k);
    if (inView(at.x - P, P * 3)) drawBody(at, 10, 2);
  }
}

// --- the crowd, the signs, the bodies --------------------------------------------------------
// The files in view only: a far rank a cell a soul, its tone the ink on its
// rim; a near rank a body, its square pale and its eight rim cells inked one
// by one. A slot whose member walked out stands empty.
const RIM = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
const FAR_TONE = [1, 2, 3, 4, 5, 6, 7, 8, 10];
export const crowdSpan = () => ({ f0: fileAt(S.camX - P * 4), f1: fileAt(S.camX + S.viewW + P * 4), r1: rankAtY(S.camY - P * 4) });
let drawn = 0;
export const crowdDrawn = () => drawn;
function drawSoul(f, r, v) {
  const x = soulX(f) - P, y = soulY(r) - P;
  for (let k = 0; k < RIM_PIECES; k++) cell(x + RIM[k][0] * P, y + RIM[k][1] * P, k < v ? 10 : 3);
  cell(x + P, y + P, 1);
}
export function drawAfterCrowd() {
  const a = A();
  if (!a) return;
  const arr = souls(), n = arr.length;
  const { f0, f1, r1 } = crowdSpan();
  drawn = 0;
  // Back to front, so a near body stands over the far field behind it; the
  // ranks above the view's top are left undrawn.
  for (let r = Math.min(r1, Math.ceil(n / CROWD_FILES) - 1); r >= 0; r--) {
    for (let f = f0; f <= f1; f++) {
      const i = r * CROWD_FILES + f;
      if (i >= n) continue;
      const v = arr[i];
      if (v > RIM_PIECES) continue;
      drawn++;
      if (r < CROWD_NEAR) drawSoul(f, r, v);
      else cell(farX(f, r), soulY(r), FAR_TONE[v]);
    }
  }
  // The signs planted: a post and a board (five cells wide when it reaches
  // further), the board knocked a cell over when askew.
  for (const s of a.signs) {
    const x = soulX(s.f), y = soulY(s.r) + P;
    if (!inView(x - P * 2, P * 5)) continue;
    ctx.globalAlpha = s.pull != null ? 0.6 : 1;
    for (let k = 0; k < 3; k++) cell(x, y - k * P, 10);
    const off = s.askew ? P : 0, half = s.big ? 2 : 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - P * half + off, y - P * 5, P * (half * 2 + 1), P * 2);
    cell(x + off, y - P * 5, 1);
    ctx.globalAlpha = 1;
  }
  // The members, walking out and at their posts, black-rimmed; the wardens,
  // pale with a halo.
  for (const w of a.bodies) if (inView(w.x - P * 4, P * 8)) drawBody(w, 10, 1);
  for (const w of a.wardens) {
    if (!inView(w.x - P * 4, P * 8)) continue;
    drawBody(w, 4, 0);
    for (let c = -1; c <= 1; c++) cell(snap(w.x) + c * P, snap(w.y) - P * 5, 3);
  }
}

// --- the sky ---------------------------------------------------------------------------------
// The clouds, scenery, each an oval of pale cells with a grey edge; the motes
// of rebel coming down to the pile.
export function drawAfterSky() {
  if (!A()) return;
  const t = now();
  for (const c of clouds()) {
    const w = cloudW(c);
    if (!inView(c.x, w)) continue;
    const cells = cloudCells(c), set = new Set(cells.map(([i, j]) => `${i},${j}`));
    ctx.globalAlpha = cloudAlpha(c, t);
    const x0 = snap(c.x);
    for (const [i, j] of cells) {
      const rim = !set.has(`${i - 1},${j}`) || !set.has(`${i + 1},${j}`) || !set.has(`${i},${j - 1}`) || !set.has(`${i},${j + 1}`);
      cell(x0 + i * P, c.y + j * P, rim ? 4 : toneAt(i + c.id, j, [1, 1, 2]));
    }
    ctx.globalAlpha = 1;
  }
  for (const m of airMotes()) {
    ctx.fillStyle = '#000'; ctx.fillRect(snap(m.x), snap(m.y), P, P);
    ctx.fillStyle = GREY[1]; ctx.fillRect(snap(m.x) + 1, snap(m.y) + 1, P - 2, P - 2);
  }
}
