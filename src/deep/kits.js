// The fighters' kits (docs/wave-party.md, "The picture"): what each class
// carries at rest, the mark it grows at rung 4 and the touch at rung 8, and
// the pieces of it an attack moves about. Ported from the owner's kit growth
// page (docs/mocks/kit-growth-2026-09-27.html), the single visual reference,
// from the page's cells to the world's: a position here is in world CELLS,
// fractional while a thing moves, and a cell is laid at whole pixels, so a
// kit in motion slides a pixel at a time and at rest sits on the grid.
//
// A kit is one rigid sprite (`kitSprite`): its still cells painted once, a
// class and a rung, into an image of their own, and from then on only moved
// whole. What lives on it -- a drifting mote, a swaying bead, a fuse's
// spark -- is drawn over it where it rides. A kit turned (the sword's swing,
// a spinning dagger) is turned whole by `blit`, nearest pixel, so every cell
// stays one hard square in its place: never re-drawn as a new line of cells
// at each angle.
//
// The tones are the deep's (render/deep.js): named as they are SEEN, turned
// once at load into what is drawn, so the deep's negative brings them back.
//
// Owned by track RENDER. Nothing here reads the sim: the class's attack
// (render/attacks.js) says where each piece goes.

import { P, WORKER, KIT_BOX, MOTE_PERIOD, MOTE_RISE } from '../config.js';
import { GREYS, PURPLES } from '../render/deeptones.js';
import { drawBody } from '../render/crew.js';
import { MOVE_RUNG, CAPSTONE_RUNG } from '../config/classes.js';

export { GREYS, PURPLES };
export const WHITE = GREYS[11], INK = GREYS[0];
export const BODY = WORKER / P;          // the body's side, in cells
export const R4 = R => R >= MOVE_RUNG, R8 = R => R >= CAPSTONE_RUNG;

// The page's own noise, so a spray or a scatter falls where it fell there.
export const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const along = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
export const ease = k => k * k * (3 - 2 * k);

// --- cells --------------------------------------------------------------------
// A cell at world cell (cx, cy), laid at whole pixels. `fillRect` takes the
// top-left, and so does this.
export function cell(g, cx, cy, tone) { if (!tone) return; g.fillStyle = tone; g.fillRect(Math.round(cx * P), Math.round(cy * P), P, P); }
export function rect(g, cx, cy, w, h, tone) { g.fillStyle = tone; g.fillRect(Math.round(cx * P), Math.round(cy * P), Math.round(w) * P, Math.round(h) * P); }
export function line(ax, ay, bx, by, fn) {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
  for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, i, n);
}
// A ring of cells, every `every`th of them, none twice.
export function ring(g, cx, cy, r, tone, every = 1) {
  const n = Math.max(8, Math.ceil(Math.PI * 2 * r)), seen = new Set();
  for (let k = 0; k < n; k += every) {
    const a = k / n * Math.PI * 2, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
    if (seen.has(x + ',' + y)) continue;
    seen.add(x + ',' + y); cell(g, x, y, tone);
  }
}
// The body, the same square every body in the deep is, at a cell position.
export const body = (cx, cy) => drawBody(Math.round(cx * P), Math.round(cy * P));
// A build-up's pips under a body: `n` lit of `of`, all lit on a `flash`.
// Spaced as the shop's are, a cell apart, so the row reads as pips and not
// as a bar; a cell is the least the deep's zoom shows, so no ring inside one.
export function pips(g, x, y, n, of, flash = 0) {
  const x0 = x + Math.floor((BODY - (of * 2 - 1)) / 2);
  for (let i = 0; i < of; i++) cell(g, x0 + i * 2, y + BODY + 1, flash || i < n ? WHITE : GREYS[6]);
}

// --- the rigid sprite ----------------------------------------------------------
// Its cells drawn once, on the grid, into its own canvas, and from then on
// only moved by whole pixels or turned whole about its anchor. (ax, ay) is
// the anchor, in the sprite's pixels. Made on first use: nothing here may
// touch the document while the node yard imports the drawing.
const SPRITES = new Map();
export function sprite(key, wCells, hCells, ax, ay, paint) {
  let s = SPRITES.get(key);
  if (!s) {
    const cv = document.createElement('canvas');
    cv.width = wCells * P; cv.height = hCells * P;
    const g = cv.getContext('2d');
    paint(g);
    s = { cv, ax, ay, w: cv.width, h: cv.height, data: g.getImageData(0, 0, cv.width, cv.height).data };
    SPRITES.set(key, s);
  }
  return s;
}
let TURN = null, TURN_G = null;
// Put the sprite's anchor at world pixel (x, y), turned `ang` radians
// clockwise. Turned by hand, nearest pixel, so no edge is blended.
export function blit(g, s, x, y, ang = 0) {
  const smooth = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  if (!ang) { g.drawImage(s.cv, Math.round(x - s.ax), Math.round(y - s.ay)); g.imageSmoothingEnabled = smooth; return; }
  if (!TURN) { TURN = document.createElement('canvas'); TURN_G = TURN.getContext('2d'); }
  const r = Math.ceil(Math.hypot(Math.max(s.ax, s.w - s.ax), Math.max(s.ay, s.h - s.ay))) + 1, S = 2 * r;
  const out = TURN_G.createImageData(S, S), c = Math.cos(ang), sn = Math.sin(ang);
  for (let oy = 0; oy < S; oy++) for (let ox = 0; ox < S; ox++) {
    const dx = ox - r + 0.5, dy = oy - r + 0.5;
    const sx = Math.floor(c * dx + sn * dy + s.ax), sy = Math.floor(-sn * dx + c * dy + s.ay);
    if (sx < 0 || sy < 0 || sx >= s.w || sy >= s.h) continue;
    const i = (sy * s.w + sx) * 4;
    if (!s.data[i + 3]) continue;
    const o = (oy * S + ox) * 4;
    out.data[o] = s.data[i]; out.data[o + 1] = s.data[i + 1]; out.data[o + 2] = s.data[i + 2]; out.data[o + 3] = 255;
  }
  if (TURN.width !== S || TURN.height !== S) { TURN.width = S; TURN.height = S; }
  TURN_G.putImageData(out, 0, 0);
  g.drawImage(TURN, Math.round(x) - r, Math.round(y) - r);
  g.imageSmoothingEnabled = smooth;
}

// A class's still kit at a rung, one sprite, anchored at the body's top-left
// corner: painted into a box KIT_BOX cells round the body, so a sword out
// to the left or a glyph over the head fits whichever class it is.
export function kitSprite(key, R, paint) {
  const band = R8(R) ? 8 : R4(R) ? 4 : 0, { left, top, w, h } = KIT_BOX;
  return sprite(`kit.${key}.${band}`, w, h, left * P, top * P, sg => paint(sg, left, top, band));
}
const restKit = (g, key, R, x, y, paint) => blit(g, kitSprite(key, R, paint), Math.round(x * P), Math.round(y * P));

// Motes: single cells drifting up off a point, stepping down the tones as
// they rise, slow, so a rung-8 fighter reads as more and not busy.
export const DRIFT = [GREYS[10], GREYS[8], GREYS[6], GREYS[4]];
export const MOTES_P = [PURPLES[11], PURPLES[9], PURPLES[7], PURPLES[5]];
export const MOTE_TONES = MOTES_P;
export function drift(g, cx, cy, t, n = 1, seed = 0, rise = MOTE_RISE, period = MOTE_PERIOD, tones = DRIFT) {
  for (let i = 0; i < n; i++) {
    const p = (t / period + i / n + seed) % 1;
    const dx = Math.round(Math.sin(p * 5 + i * 2 + seed * 9) * 0.7);
    cell(g, cx + dx, cy - Math.floor(p * rise), tones[Math.floor(p * tones.length)]);
  }
}

// --- the Brawler: two fists floating beside him --------------------------------
// No arms: the fists float level with the top of the body and fly out to hit
// and back. Bare at rung 0, a pale knuckle cell; wrapped from rung 4, a white
// wrap over the knuckles; at rung 8 a cell wider, a mote drifting off each.
export const bSize = R => R8(R) ? 2 : 1;
function bFistCells(g, fx, fy, size, R) {
  if (!R4(R)) { rect(g, fx, fy, size, 1, GREYS[10]); return; }
  rect(g, fx, fy, size, 1, WHITE); rect(g, fx, fy + 1, size, 1, GREYS[9]);
}
export function bFist(g, fx, fy, size, R, t, side) {
  bFistCells(g, fx, fy, size, R);
  if (R8(R)) drift(g, side < 0 ? fx : fx + size - 1, fy - 1, t, 1, side > 0 ? 0.5 : 0, MOTE_RISE, MOTE_PERIOD, MOTES_P);
}

// --- the Swordsman: a greatsword point-up at his side ---------------------------
// (bx, gy) the blade's column and the grip's row: the guard over the grip,
// the blade over the guard -- three cells, four from rung 4 -- the point on
// top. At rung 8 a mote drifts off either side of the blade.
export const bladeLen = R => R4(R) ? 4 : 3;
function swordCells(g, bx, gy, R) {
  const L = bladeLen(R), ty = gy - 2 - L;
  cell(g, bx, ty, WHITE);
  for (let r = ty + 1; r <= ty + L; r++) cell(g, bx, r, GREYS[10]);
  for (let d = -1; d <= 1; d++) cell(g, bx + d, gy - 1, GREYS[8]);
  cell(g, bx, gy, GREYS[6]);
}
export function sword(g, bx, gy, R, t) {
  swordCells(g, bx, gy, R);
  if (R8(R)) { const ty = gy - 2 - bladeLen(R); drift(g, bx - 1, ty + 2, t, 1, 0, MOTE_RISE, MOTE_PERIOD, MOTES_P); drift(g, bx + 1, ty + 3, t, 1, 0.5, MOTE_RISE, MOTE_PERIOD, MOTES_P); }
}
// The sword as one rigid sprite, drawn upright once -- point, blade, guard --
// and turned whole about the hand, `from` cells below the guard.
export const swordAt = (px, py, ang, i) => [px + Math.sin(ang) * i, py - Math.cos(ang) * i];
export function swordSprite(R, from) {
  const L = bladeLen(R), tip = from + L + 1;
  return sprite(`sword${L}.${from}`, 3, L + 2, 1.5 * P, (tip + 0.5) * P, g => {
    cell(g, 1, 0, WHITE);
    for (let r = 1; r <= L; r++) cell(g, 1, r, GREYS[10]);
    for (let c = 0; c < 3; c++) cell(g, c, L + 1, GREYS[8]);
  });
}

// --- the Monk: a ring of prayer beads over her ----------------------------------
// The spaced-bead arch (the owner's A): each bead a round two-by-two, lit in
// the purples or unlit in the greys, its top-left cell the highlight, on a
// one-cell dark cord with a clear gap to the next; the arch sways gently. At
// rung 8 the connected halo (the owner's 4): the arch lifts and closes into a
// ring of cord over her head, its ends meeting, turning slowly with the beads
// strung on it, its back half a tone darker; on a full chi it tightens and
// its lit beads whiten.
export const TELL = [0, 1, 2, 3, 4, 3, 2, 1];
export const MONK_SPIN = 1.1;            // the halo's resting turn, radians a second
function backBead(g, cx, cy, lit) {
  cell(g, cx - 1, cy - 1, lit ? PURPLES[9] : GREYS[8]); cell(g, cx, cy - 1, lit ? PURPLES[8] : GREYS[7]);
  cell(g, cx - 1, cy, lit ? PURPLES[8] : GREYS[7]); cell(g, cx, cy, lit ? PURPLES[6] : GREYS[6]);
}
function roundBead(g, cx, cy, lit) {
  cell(g, cx - 1, cy - 1, lit ? PURPLES[11] : GREYS[10]); cell(g, cx, cy - 1, lit ? PURPLES[10] : GREYS[9]);
  cell(g, cx - 1, cy, lit ? PURPLES[10] : GREYS[9]); cell(g, cx, cy, lit ? PURPLES[8] : GREYS[7]);
}
function cord(g, ax, ay, bx, by) { line(ax - 0.5, ay - 0.5, bx - 0.5, by - 0.5, (cx, cy) => cell(g, cx, cy, GREYS[5])); }
// The bead centers and the cord's path of the arch, about the body at (x, y).
// On her own phase (`anim`): the sway quickens into a palm and the arch
// draws in a little.
function archPath(x, y, t, anim = null) {
  const pts = [], path = [];
  const ph = anim ? anim.th : t, tg = anim ? anim.tight : 0, rad = 5 - 0.7 * tg;
  const hx = x + 1.5, hy = y + 1, sw = Math.sin(ph * 1.6) * 0.12 * (1 - 0.5 * tg);
  const at = (deg, i) => { const an = deg * Math.PI / 180 + sw + Math.sin(ph * 4.2 - i * 1.1) * 0.06 * (1 - 0.5 * tg); return [hx + rad * Math.sin(an), hy - rad * Math.cos(an)]; };
  for (let i = 0; i < 5; i++) pts.push(at(-72 + i * 36, i));
  for (let d = -86; d <= 86; d += 8) path.push(at(d, (d + 72) / 36));
  return { pts, path };
}
// `anim.u` is the Monk's own clock, so the arch closes once when her turn begins.
function halo(g, x, y, t, litOf, full, anim) {
  const u = anim ? anim.u : null, tg = anim ? anim.tight : full ? 1 : 0;
  const cx = x + 1.5, cy = y - 2.5, rx = 4.2 - 0.6 * tg, ry = 1.4 - 0.3 * tg, spin = anim ? anim.th : t * MONK_SPIN;
  const ringAt = i => { const th = spin + i * Math.PI * 2 / 5; return [cx + rx * Math.cos(th), cy + ry * Math.sin(th), Math.sin(th) < 0]; };
  const k = u == null ? 1 : ease(clamp(u / 0.6, 0, 1));
  if (k < 1) {
    // the arch lifting and closing: each bead on its way from the arch to the ring
    const { pts } = archPath(x, y, t, anim);
    const at = pts.map((p, i) => { const r = ringAt(i); return [lerp(p[0], r[0], k), lerp(p[1], r[1], k)]; });
    for (let i = 1; i < 5; i++) cord(g, ...at[i - 1], ...at[i]);
    if (k > 0.8) cord(g, ...at[4], ...at[0]);
    at.forEach(([bx0, by0], i) => roundBead(g, bx0, by0, litOf(i)));
    return;
  }
  // the chi palm's peak, held: each bead blurs into a smear arc behind it
  // round the ring, bright at the bead and stepping down the purples behind
  if (anim && anim.smear) {
    const SM = [PURPLES[11], PURPLES[10], PURPLES[9], PURPLES[8], PURPLES[7], PURPLES[6]];
    for (const back of [true, false]) for (let i = 0; i < 5; i++) {
      const th0 = spin + i * Math.PI * 2 / 5;
      for (let j = SM.length - 1; j >= 0; j--) {
        const th = th0 - j * 0.16, isBack = Math.sin(th) < 0;
        if (isBack !== back) continue;
        const qx = cx + rx * Math.cos(th), qy = cy + ry * Math.sin(th);
        cell(g, qx - 0.5, qy - 0.5, back ? SM[Math.min(SM.length - 1, j + 2)] : SM[j]);
        if (!j) cell(g, qx - 0.5, qy - 1.5, back ? PURPLES[9] : WHITE);
      }
    }
    return;
  }
  // the ring: its back half first, a tone darker, then the front over it
  for (const back of [true, false]) {
    for (let th = 0; th < Math.PI * 2; th += 0.2) {
      const a1 = [cx + rx * Math.cos(th), cy + ry * Math.sin(th)], a2 = [cx + rx * Math.cos(th + 0.2), cy + ry * Math.sin(th + 0.2)];
      if ((Math.sin(th + 0.1) < 0) === back) line(a1[0] - 0.5, a1[1] - 0.5, a2[0] - 0.5, a2[1] - 0.5, (qx, qy) => cell(g, qx, qy, back ? GREYS[3] : GREYS[5]));
    }
    for (let i = 0; i < 5; i++) {
      const [bx0, by0, isBack] = ringAt(i);
      if (isBack !== back) continue;
      if (back) backBead(g, bx0, by0, litOf(i));
      else {
        roundBead(g, bx0, by0, litOf(i));
        if (full && litOf(i)) cell(g, bx0 - 1, by0 - 1, WHITE);
      }
    }
  }
}
// The beads, whichever rung: `litOf(i)` says which are lit.
export function beads(g, x, y, R, t, litOf, full = false, anim = null) {
  if (R8(R)) return halo(g, x, y, t, litOf, full, anim);
  const { pts, path } = archPath(x, y, t, anim);
  for (let i = 1; i < path.length; i++) cord(g, ...path[i - 1], ...path[i]);
  pts.forEach(([cx, cy], i) => roundBead(g, cx, cy, litOf(i)));
}

// --- the Martial Artist: a bo staff across her back -----------------------------
// mark: a ribbon off the staff's end, waved as the shop flags are
// (render/aura.js): walked out from its knot half a cell at a time, its
// heading turned by one ripple that travels out to the loose end and grows
// toward it. touch: the staff's other end a pike, a blade on it.
export function ribbon(g, ex, ey, dir, t, len = 4, seed = 0, purple = false) {
  let px = 0, py = 0;
  for (let s = 0.5; s <= len; s += 0.5) {
    const rip = Math.sin((t / 1.3 - s * 0.75 / len) * Math.PI * 2 + seed * 7) * Math.pow(s / len, 1.2) * 1.2;
    const th = Math.PI / 2 * 0.5 + rip;
    px += Math.sin(th) * 0.5; py += Math.cos(th) * 0.5;
    const cx = Math.round(px), cy = Math.round(py);
    if (cx === 0 && cy === 0) continue;
    cell(g, ex + dir * cx, ey + cy, purple ? (s > len - 1 ? PURPLES[8] : PURPLES[10]) : s > len - 1 ? GREYS[8] : GREYS[10]);
  }
}
// The pike's head off a staff end at (ex, ey), pointing (dx, dy): a
// crossguard across the join, then the blade, its tip the abyss's purple.
export function pike(g, ex, ey, dx, dy) {
  cell(g, ex + dx + dy, ey + dy + dx, GREYS[8]); cell(g, ex + dx - dy, ey + dy - dx, GREYS[8]);
  cell(g, ex + dx, ey + dy, GREYS[8]);
  cell(g, ex + 2 * dx, ey + 2 * dy, GREYS[10]); cell(g, ex + 3 * dx, ey + 3 * dy, PURPLES[11]);
}
function staffCells(g, x, y, R) {
  cell(g, x - 2, y + 1, GREYS[9]); cell(g, x - 1, y + 1, GREYS[8]); cell(g, x + 3, y + 1, GREYS[8]); cell(g, x + 4, y + 1, GREYS[9]);
  if (R8(R)) pike(g, x + 4, y + 1, 1, 0);
}
export function staffBack(g, x, y, R, t) {
  staffCells(g, x, y, R);
  if (R4(R)) ribbon(g, x - 2, y + 1, -1, t, 4, 0, R8(R));
}

// --- the Ranger: a bow twice his height -----------------------------------------
// The bow drawn from its span, so a longer one is the same bow: the string
// straight between the tips, the limb bellied two cells off it at the
// middle. A cell longer at rung 4, two at rung 8.
export const bowGrow = R => R8(R) ? 2 : R4(R) ? 1 : 0;
function vbow(g, sx, top, bot) {
  const n = bot - top;
  for (let r = top; r <= bot; r++) {
    const off = Math.round(2 * Math.sin(Math.PI * (r - top) / n));
    cell(g, sx, r, off ? GREYS[9] : GREYS[8]);
    if (off) cell(g, sx + off, r, GREYS[8]);
  }
}
// Level over his head, string row sy, limb up; drawn, the string is pulled
// down to the nock under an arrow standing on it. The aimed shot's two
// arrows are the abyss's, purple head to nock.
function hbow(g, cx, sy, half, drawn, two = false) {
  for (let c = -half; c <= half; c++) {
    const off = Math.round(2 * Math.sin(Math.PI * (c + half) / (2 * half)));
    if (!off) { cell(g, cx + c, sy, GREYS[8]); continue; }
    if (!(drawn && c === 0)) cell(g, cx + c, sy - off, GREYS[8]);
    if (!drawn || Math.abs(c) >= half - 1) cell(g, cx + c, sy, GREYS[9]);
    else if (c) cell(g, cx + c, sy + 1, GREYS[9]);
  }
  if (drawn) for (const ax of two ? [cx - 1, cx + 1] : [cx]) {
    cell(g, ax, sy - 3, two ? PURPLES[11] : WHITE);
    for (let r = sy - 2; r <= sy; r++) cell(g, ax, r, two ? PURPLES[9] : GREYS[10]);
    cell(g, ax, sy + 1, two ? PURPLES[6] : GREYS[6]);
  }
}
// 'rest' at his side, 'lift' raised, 'over' level over his head, 'braced'
// with the string slack, 'drawn' with an arrow on it.
export function drawBow(g, pose, x, y, R, two = false) {
  const e = bowGrow(R), half = 3 + e;
  if (pose === 'rest' || pose === 'lift') {
    const bot = pose === 'rest' ? y + 2 : y;
    vbow(g, x + 4, bot - 5 - e, bot);
  } else hbow(g, pose === 'over' ? x + 3 : x + 1, y - 2, half, pose === 'drawn', two);
}

// --- the Assassin: a dagger point-up in her fist ---------------------------------
// One dagger at rung 0; the mark is the second, in the other fist; the
// touch turns both tips the abyss's purple, and they spin as they go.
export const blades = (x, R) => R4(R) ? [x - 2, x + 4] : [x + 4];
function daggerCells(g, gx, gy, R) {
  cell(g, gx, gy - 3, R8(R) ? PURPLES[11] : WHITE);
  cell(g, gx, gy - 2, GREYS[10]); cell(g, gx, gy - 1, GREYS[10]);
  cell(g, gx, gy, GREYS[7]); cell(g, gx - 1, gy, GREYS[7]); cell(g, gx + 1, gy, GREYS[7]);
  cell(g, gx, gy + 1, GREYS[8]);
}
// A dagger with its guard at (gx, gy), pointing `ang` radians from straight
// up; spinning, it is one rigid sprite turned whole about its guard.
export function dagger(g, gx, gy, R, ang = 0) {
  if (!ang) return daggerCells(g, gx, gy, R);
  const spr = sprite('dagger' + (R8(R) ? 8 : 0), 3, 5, 1.5 * P, 3.5 * P, sg => daggerCells(sg, 1, 3, R));
  blit(g, spr, (gx + 0.5) * P, (gy + 0.5) * P, ang);
}

// --- the Sapper: a bomb under his arm, the fuse sparking -------------------------
// A fuse: one cell standing up off the top, the spark on its tip leaning out
// and flickering.
function fuseStem(g, fx, fy) { cell(g, fx, fy, GREYS[7]); }
function fuseSpark(g, fx, fy, dir, t) {
  const k = Math.floor(t * 6) % 3;
  cell(g, fx + (k === 2 ? 0 : dir), fy - 1, k === 1 ? GREYS[9] : WHITE);
}
// Rung 0: a round bomb, two cells across, lit from its top corner.
function bombCells(g, bx, by) {
  cell(g, bx, by, GREYS[10]); cell(g, bx + 1, by, GREYS[8]); cell(g, bx, by + 1, GREYS[8]); cell(g, bx + 1, by + 1, GREYS[7]);
  fuseStem(g, bx + 1, by - 1);
}
// Rung 4: the sticky charge, a flat slab three across; rung 8 holds two.
function slabCells(g, bx, by, dir) {
  const c0 = dir > 0 ? bx : bx - 2;
  for (let c = 0; c < 3; c++) { cell(g, c0 + c, by, c === 1 ? GREYS[10] : GREYS[9]); cell(g, c0 + c, by + 1, c === 1 ? GREYS[6] : GREYS[7]); }
  fuseStem(g, c0 + 1, by - 1);
}
// `gone` names the hands whose charge is away, thrown and not yet back.
export function bundle(g, x, y, R, t, gone = {}) {
  if (!R4(R)) { if (!gone.r) { bombCells(g, x + 4, y + 1); fuseSpark(g, x + 5, y, 1, t); } return; }
  if (!gone.r) { slabCells(g, x + 4, y + 1, 1); fuseSpark(g, x + 5, y, 1, t); }
  if (R8(R) && !gone.l) { slabCells(g, x - 2, y + 1, -1); fuseSpark(g, x - 3, y, -1, t); }
}
// A charge thrown or stuck, its middle at (cx, cy); `lit` with its spark.
export function charge(g, cx, cy, t, R, lit) {
  if (!R4(R)) { cell(g, cx, cy, GREYS[10]); cell(g, cx + 1, cy, GREYS[8]); cell(g, cx, cy + 1, GREYS[8]); cell(g, cx + 1, cy + 1, GREYS[7]); }
  else { for (let c = 0; c < 3; c++) { cell(g, cx - 1 + c, cy, c === 1 ? GREYS[10] : GREYS[9]); cell(g, cx - 1 + c, cy + 1, c === 1 ? GREYS[6] : GREYS[7]); } }
  if (lit) cell(g, cx + 1, cy - 1, Math.floor(t * 6) % 2 ? WHITE : GREYS[9]);
}

// --- the Hexer: nothing held, a purple mote rising slowly off her -----------------
// From rung 4 a glyph hangs over her head, traced cell by cell before each
// hex (the owner, 2026-09-28); between hexes a faint ghost of it hangs
// there. At rung 8 a ring is traced round it after the rune.
export function motes(g, x, top, t, n = 1) {
  for (let i = 0; i < n; i++) {
    const p = (t / 3.2 + i / n) % 1, dx = Math.round(Math.sin(p * 6 + i * 2.1) * 1.2);
    cell(g, x + dx, top - 1 - Math.floor(p * 5), MOTE_TONES[Math.floor(p * 3.99)]);
  }
}
// The rune, 5 by 5, in stroke order: up the left leg, down to a point in the
// middle, up and down the right leg, then the crossing bar.
const RUNE = [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 1], [2, 2], [3, 1], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],
              [1, 3], [2, 3], [3, 3]];
// Rung 8's outer ring round the rune, in the order it is traced: from the top, clockwise.
const RING8 = (() => {
  const seen = new Set(), out = [];
  for (let k = 0; k < 64; k++) {
    const an = k / 64 * Math.PI * 2, c = [Math.round(2 + Math.sin(an) * 3.9), Math.round(2 - Math.cos(an) * 3.9)];
    if (!seen.has(c + '')) { seen.add(c + ''); out.push(c); }
  }
  return out;
})();
export const GLYPH = { trace: 0.5, ring: 0.3, flare: 0.12, fade: 0.4 };
// The glyph's timings on her clock, by rung: when the trace starts, when it
// closes, when the hex streams out, and when it lands.
export function glyphTimes(R) {
  const t0 = 0.3, done = t0 + GLYPH.trace + (R8(R) ? GLYPH.ring : 0), out = done + GLYPH.flare;
  return { t0, done, out, land: out + 1.0 };
}
// The glyph over her head, its top-left cell at (gx, gy). `a` her clock, or
// null at rest (the ghost).
export function glyph(g, gx, gy, R, a) {
  const cells = R8(R) ? [...RUNE, ...RING8] : RUNE, T = glyphTimes(R), n = cells.length;
  const ghost = PURPLES[5];
  const all = tone => cells.forEach(([cx, cy]) => cell(g, gx + cx, gy + cy, tone));
  if (a == null || a < T.t0) return all(ghost);
  if (a < T.done) {
    const runeN = RUNE.length, rp = clamp((a - T.t0) / GLYPH.trace, 0, 1), ringP = clamp((a - T.t0 - GLYPH.trace) / GLYPH.ring, 0, 1);
    const k = rp < 1 ? Math.floor(rp * runeN) : runeN + Math.floor(ringP * (n - runeN));
    all(ghost);
    for (let i = 0; i < Math.min(k, n); i++) cell(g, gx + cells[i][0], gy + cells[i][1], k - i <= 2 ? PURPLES[11] : PURPLES[9]);
    if (k < n) cell(g, gx + cells[k][0], gy + cells[k][1], WHITE);
    return;
  }
  // closed: a flare held a pose, lit while the hex streams, then fading
  if (a < T.out) return all(WHITE);
  const f = a - T.out - 0.4;
  if (f < 0) return all(PURPLES[11]);
  if (f < GLYPH.fade) return all([PURPLES[9], PURPLES[7], PURPLES[6]][Math.floor(f / GLYPH.fade * 3)]);
  all(ghost);
}
export const glyphAt = (x, y, t) => [x - 1, y - 7 - (Math.floor(t * 1.2) % 2)];

// --- the Mage: a staff taller than her, a purple stone in its claws ---------------
const ORBIT = Array.from({ length: 8 }, (_, k) => { const a = k / 8 * Math.PI * 2; return [Math.round(Math.cos(a) * 2.5), Math.round(0.5 + Math.sin(a) * 2.5)]; });
// The stone at (sx, top): mark, a cell orbiting it; touch, three orbiting.
// Spent after the finishing blow, it goes dark a beat before it relights.
export function stone(g, sx, top, R, t, up, glow, spent = false) {
  if (spent) { cell(g, sx, top + 1, PURPLES[5]); cell(g, sx, top, PURPLES[6]); return; }
  cell(g, sx, top + 1, up ? PURPLES[11] : PURPLES[9]);
  cell(g, sx, top, glow > 0.66 ? WHITE : PURPLES[11]);
  if (R4(R)) for (let i = 0; i < (R8(R) ? 3 : 1); i++) {
    const [dx, dy] = ORBIT[(Math.floor(t * 5) + i * 3) % 8];
    cell(g, sx + dx, top + dy, i ? PURPLES[8] : PURPLES[10]);
  }
}
function mStaffCells(g, x, y, lift = 0) {
  const sx = x - 1, top = y - 3 - lift;
  for (let r = top + 2; r <= y + 2 - lift; r++) cell(g, sx, r, GREYS[8]);
  cell(g, sx - 1, top + 1, GREYS[8]); cell(g, sx + 1, top + 1, GREYS[8]);
}
export function mStaff(g, x, y, R, t, up = false, glow = 0, home = true, spent = false) {
  const lift = up ? 1 : 0;
  mStaffCells(g, x, y, lift);
  if (home) stone(g, x - 1, y - 3 - lift, R, t, up, glow, spent);
}

// --- the Bard: a flute held sideways at her mouth ---------------------------------
// mark: a purple tip on the flute; touch: the whole flute purple.
export function flute(g, x, y, R) {
  const p = R8(R);
  cell(g, x + 3, y, p ? PURPLES[9] : GREYS[10]); cell(g, x + 4, y, p ? PURPLES[6] : GREYS[6]);
  cell(g, x + 5, y, p ? PURPLES[9] : GREYS[10]); cell(g, x + 6, y, R4(R) ? PURPLES[11] : GREYS[10]);
}

// --- each class at rest ----------------------------------------------------------
// The body and its kit where it stands, (x, y) the body's top-left in world
// cells: the still cells one rigid sprite, the living ones over it.
export const REST = {
  brawler(g, x, y, R, t) {
    body(x, y);
    const z = bSize(R);
    restKit(g, 'brawler', R, x, y, (sg, ox, oy, band) => { bFistCells(sg, ox - z, oy, z, band); bFistCells(sg, ox + BODY, oy, z, band); });
    if (R8(R)) { drift(g, x - z, y - 1, t, 1, 0, MOTE_RISE, MOTE_PERIOD, MOTES_P); drift(g, x + BODY + z - 1, y - 1, t, 1, 0.5, MOTE_RISE, MOTE_PERIOD, MOTES_P); }
  },
  sword(g, x, y, R, t) {
    body(x, y);
    restKit(g, 'sword', R, x, y, (sg, ox, oy, band) => { swordCells(sg, ox - 3, oy + 1, band); cell(sg, ox - 3, oy + 2, GREYS[9]); });
    if (R8(R)) { const ty = y + 1 - 2 - bladeLen(R); drift(g, x - 4, ty + 2, t, 1, 0, MOTE_RISE, MOTE_PERIOD, MOTES_P); drift(g, x - 2, ty + 3, t, 1, 0.5, MOTE_RISE, MOTE_PERIOD, MOTES_P); }
  },
  monk(g, x, y, R, t) {
    body(x, y);
    const k = TELL[Math.floor(t * 3) % 8];
    beads(g, x, y, R, t, i => i === k || (R4(R) && i === 4 - k));
  },
  martial(g, x, y, R, t) {
    body(x, y);
    restKit(g, 'martial', R, x, y, (sg, ox, oy, band) => staffCells(sg, ox, oy, band));
    if (R4(R)) ribbon(g, x - 2, y + 1, -1, t, 4, 0, R8(R));
  },
  ranger(g, x, y, R) {
    body(x, y);
    restKit(g, 'ranger', R, x, y, (sg, ox, oy, band) => drawBow(sg, 'rest', ox, oy, band));
  },
  assassin(g, x, y, R) {
    body(x, y);
    restKit(g, 'assassin', R, x, y, (sg, ox, oy, band) => { for (const bx of blades(ox, band)) daggerCells(sg, bx, oy, band); });
  },
  sapper(g, x, y, R, t) {
    body(x, y);
    restKit(g, 'sapper', R, x, y, (sg, ox, oy, band) => {
      if (!R4(band)) bombCells(sg, ox + 4, oy + 1);
      else { slabCells(sg, ox + 4, oy + 1, 1); if (R8(band)) slabCells(sg, ox - 2, oy + 1, -1); }
    });
    fuseSpark(g, x + 5, y, 1, t);
    if (R8(R)) fuseSpark(g, x - 3, y, -1, t);
  },
  hexer(g, x, y, R, t) {
    body(x, y);
    if (R4(R)) { const [gx, gy] = glyphAt(x, y, t); glyph(g, gx, gy, R, null); motes(g, x + 1, gy, t); }
    else motes(g, x + 1, y, t);
  },
  mage(g, x, y, R, t) {
    body(x, y);
    restKit(g, 'mage', R, x, y, (sg, ox, oy) => mStaffCells(sg, ox, oy));
    stone(g, x - 1, y - 3, R, t, false, 0);
  },
  bard(g, x, y, R) {
    body(x, y);
    restKit(g, 'bard', R, x, y, (sg, ox, oy, band) => flute(sg, ox, oy, band));
  },
};
// A class's float off the floor at rest, which may come with a rung (the Hexer's).
export const LIFT = { monk: () => 1, hexer: R => R8(R) ? 1 : 0 };
export const liftOf = (key, R) => (LIFT[key] ? LIFT[key](R) : 0);
