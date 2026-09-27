// The class-animation bench's shared ground: the deep, the coil, the square
// body, the stun and the scale burst, and the two registries every group
// plugs into. A mock drawn from plain cells, not the game: the tones are the
// deep's as seen, every shape sits on the P grid, and nothing here is read by
// the game. Owned by the orchestrator (docs/wave-class-anims.md); the groups
// only call it.

export const P = 6;                  // a cell, in canvas pixels
export const CW = 64, CH = 36;       // a pane, in cells
export const FLOOR = 31;             // the floor's top row
export const STATION_X = 18;         // the class's own station, a column on the floor
export const BUDDY_X = 44;           // a second fighter's station, for buffs

// The deep's tones as seen (config/rift.js ABYSS_TONES / ABYSS_MAGIC_TONES):
// index 0 is the black of the water, the last the brightest.
export const GREYS = ['#000000', '#0a0a0c', '#121216', '#1c1c21', '#26262c', '#333339', '#42424a',
                      '#55555e', '#6e6e78', '#8b8b96', '#b4b4c0', '#ffffff'];
export const PURPLES = ['#000000', '#0b0614', '#130b20', '#1b112c', '#241739', '#2d1d47', '#371f56',
                        '#412465', '#4e2090', '#5c2ba6', '#6a2fbe', '#9b5de5'];
export const WHITE = GREYS[11], INK = GREYS[0];

// A hash that is the same every frame for the same inputs, so a pattern
// holds still rather than flickering.
export const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Whole steps of a 0..1 amount, so a fade goes through the tones and never
// blends: every fade on this bench is `steps(k)` then a tone index.
export const steps = (k, n = 8) => Math.round(clamp(k, 0, 1) * n) / n;

// --- cells -----------------------------------------------------------------------
// Everything is drawn in cells. (cx, cy) is a cell's column and row; a
// fractional cell is rounded, never drawn half off the grid.
export function cell(g, cx, cy, tone) {
  g.fillStyle = tone;
  g.fillRect(Math.round(cx) * P, Math.round(cy) * P, P, P);
}
export function rect(g, cx, cy, w, h, tone) {
  g.fillStyle = tone;
  g.fillRect(Math.round(cx) * P, Math.round(cy) * P, Math.round(w) * P, Math.round(h) * P);
}
// Cells along a line, a cell apart, each handed its step and the count.
export function line(g, ax, ay, bx, by, tone, fn) {
  const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay)));
  for (let i = 0; i <= n; i++) {
    const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n;
    if (fn) fn(x, y, i, n); else cell(g, x, y, tone);
  }
}
// A ring of cells, the way the game's grenade rings and ripples are drawn.
export function ring(g, cx, cy, r, tone, every = 1) {
  const n = Math.max(8, Math.ceil(Math.PI * 2 * r));
  const seen = new Set();
  for (let k = 0; k < n; k += every) {
    const a = k / n * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
    const key = x + ',' + y;
    if (seen.has(key)) continue;
    seen.add(key); cell(g, x, y, tone);
  }
}

// --- the deep -------------------------------------------------------------------
export function drawDeep(g, t) {
  rect(g, 0, 0, CW, CH, GREYS[0]);
  // a few slow motes, so the water is water
  for (let i = 0; i < 26; i++) {
    const x = (hash(i) * CW + t * (0.3 + hash(i + 9) * 0.5)) % CW;
    const y = (hash(i + 3) * FLOOR + Math.sin(t * 0.4 + i) * 0.8);
    cell(g, x, y, GREYS[2 + Math.floor(hash(i + 5) * 3)]);
  }
  rect(g, 0, FLOOR, CW, CH - FLOOR, GREYS[2]);
  for (let c = 0; c < CW; c++) for (let r = FLOOR; r < CH; r++)
    if (hash(c * 31 + r * 17) < 0.22) cell(g, c, r, GREYS[3 + Math.floor(hash(c + r * 7) * 2)]);
}

// A station: a plinth on the floor at column `cx`, `w` cells wide. The groups
// draw their own station on top if the class needs one.
export function drawPlinth(g, cx, w = 7) {
  rect(g, cx - Math.floor(w / 2), FLOOR - 1, w, 1, GREYS[5]);
  rect(g, cx - Math.floor(w / 2) + 1, FLOOR - 2, w - 2, 1, GREYS[4]);
}

// --- the coil --------------------------------------------------------------------
// The serpent across the top half of the pane: a centerline that sways on its
// own clock, a girth that swells at the belly and tapers to the tail. While
// it is stunned the sway freezes where it was (the voted D).
export const COIL_X0 = 4, COIL_X1 = 60;
export const BELLY = 34;
const sway = (cx, t) => 12 + 2.6 * Math.sin(cx * 0.09 + t * 0.6) + 1.1 * Math.sin(cx * 0.23 - t * 0.9);
export const girth = cx => {
  if (cx < COIL_X0 || cx > COIL_X1) return 0;
  const u = (cx - COIL_X0) / (COIL_X1 - COIL_X0);
  return 1.4 + 1.9 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + (Math.abs(cx - BELLY) < 5 ? 0.8 : 0);
};
// The serpent's state for a frame. `stun` > 0 while stunned (seconds left);
// `stunAt` the time it began, so the sway is frozen where it was.
export function coilY(cx, t, s = {}) {
  const at = s.stun > 0 && s.stunAt != null ? s.stunAt : t;
  // No shudder (the owner, 2026-09-27: "get rid of the shake, just stop
  // and the ring around"): a stunned coil only holds still.
  return sway(cx, at);
}
export const coilTop = (cx, t, s) => Math.round(coilY(cx, t, s) - girth(cx));
export const coilBottom = (cx, t, s) => Math.round(coilY(cx, t, s) + girth(cx));
// Every cell of the body, handed to `fn(cx, cy, edge)`: edge is 'top',
// 'bottom' or '' for the inside. A status painter walks this to lay its
// pattern on the body.
export function coilCells(t, s, fn) {
  for (let cx = COIL_X0; cx <= COIL_X1; cx++) {
    const top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
    for (let cy = top; cy <= bot; cy++) fn(cx, cy, cy === top ? 'top' : cy === bot ? 'bottom' : '');
  }
}
export function drawCoil(g, t, s = {}) {
  coilCells(t, s, (cx, cy, edge) => {
    const mid = Math.round(coilY(cx, t, s));
    const tone = edge === 'bottom' ? GREYS[8] : cy === mid ? GREYS[10] : WHITE;
    cell(g, cx, cy, tone);
  });
  // the head's eye, so the reader knows which end is which
  const hx = COIL_X0 + 2;
  cell(g, hx, Math.round(coilY(hx, t, s)) - 1, INK);
}

// --- the scale burst and the chip (the voted C) -----------------------------------
// A blow at (cx, cy) worth `k` (0..1, a punch about 0.3, a star 1) at time
// t0: scales spray up and out and fall, and the hide is bitten there, a hole
// that closes over CHIP_S. Call it every frame with the same t0; it draws
// nothing before t0 or once it is over.
export const CHIP_S = 2.5;
export function burst(g, t, t0, cx, cy, k = 0.3, id = 0) {
  const a = t - t0;
  if (a < 0 || a > 3) return;
  const n = Math.round(3 + 12 * k * k);
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI * (0.15 + 0.7 * hash(id * 97 + i));
    const sp = (8 + 12 * k) * (0.5 + hash(i + id));
    const x = cx + Math.cos(ang) * sp * a, y = cy + Math.sin(ang) * sp * a + 8 * a * a;
    if (y >= FLOOR) continue;
    cell(g, x, y, GREYS[a < 1 ? 11 : a < 2 ? 9 : 7]);
  }
}
export function chip(g, t, t0, cx, cy, k = 0.3, id = 0) {
  const a = t - t0;
  if (a < 0 || a > CHIP_S) return;
  const rad = (0.8 + 2 * k) * (1 - a / CHIP_S);
  for (let x = Math.floor(cx - rad); x <= cx + rad; x++)
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad && hash(x * 31 + y * 7 + id) < 0.8) cell(g, x, y, GREYS[1]);
}

// --- the body --------------------------------------------------------------------
// The game's body: one filled square three cells wide, white with a dark
// edge (render/crew.js, `drawBody`). (cx, cy) is its top-left cell. A class
// is told apart by what it wears and holds, drawn by the class's `hat` and
// its scene -- never by recoloring the body.
export const BODY = 3;
export function drawBody(g, cx, cy) {
  // The edge is the game's two-pixel stroke, finer than a cell on purpose, so
  // it is drawn in pixels: `rect` would round a third of a cell to nothing.
  const x = Math.round(cx) * P, y = Math.round(cy) * P, w = BODY * P;
  g.fillStyle = GREYS[6]; g.fillRect(x, y, w, w);
  g.fillStyle = WHITE; g.fillRect(x + 2, y + 2, w - 4, w - 4);
}

// --- pips ------------------------------------------------------------------------
// Every build-up a class counts is a row of pips under its body, one cell
// wide, centered on the square; an unlit pip is a grey step up from the
// water so the count reads before it fills (the owner, 2026-09-27: "for the
// progress bars/combo bars. lets do pips instead keep that same language").
// `n` lit of `of`; `flash` > 0 the whole row white, < 0 dark, for the beat
// a full row is spent.
export function pips(g, x, y, n, of, flash = 0) {
  const x0 = x + Math.floor((BODY - of) / 2);
  for (let i = 0; i < of; i++)
    cell(g, x0 + i, y + BODY + 1, flash ? (flash > 0 ? WHITE : GREYS[4]) : i < n ? WHITE : GREYS[6]);
}

// --- registries ------------------------------------------------------------------
// A status is drawn by whoever owns it (docs/wave-class-anims.md), once, on
// the whole serpent or on a fighter; every class that applies it shows it
// through `api.status(key, level)`. `level` is 0..1 (stacks or strength).
export const STATUS = {};
export function registerStatus(key, painter) { STATUS[key] = painter; }
// painter: { name, on: 'serpent' | 'fighter',
//            serpent(g, t, s, level)   -- over the whole coil, after it is drawn
//            fighter(g, t, cx, cy, level) -- round a body at (cx, cy) }

// A class: { key, name, station, group, hat(g, cx, cy, t), scenes }
// scenes: [{ name, about, dur, draw(g, t, api) }] -- the first is the base
// attack, then one a branch. `draw` is called after the deep, the coil and
// the two bodies; it draws the attack and says, through `api`, which statuses
// stand at `t`. A scene is a loop of `dur` seconds and `t` runs 0..dur.
export const CLASSES = [];
export function registerClass(c) { CLASSES.push(c); }

// --- one frame of a pane ----------------------------------------------------------
// Two passes so the statuses a scene declares are drawn under its attack:
// the scene is asked for its state first (`api.state` is filled by calls to
// `stun`, `status`, `buff`), then the frame is drawn in order.
export function frame(g, cls, scene, t) {
  const st = { stun: 0, stunAt: null, statuses: {}, buffs: {}, notes: [] };
  const probe = {
    // A stun is always marked: whichever class landed it, the stunned
    // painter shows over the head while the coil holds still.
    stun(from, len) {
      if (t >= from && t < from + len) { st.stun = from + len - t; st.stunAt = from; st.statuses.stunned = 1; }
    },
    status(key, level = 1) { if (level > 0) st.statuses[key] = Math.max(st.statuses[key] || 0, level); },
    buff(who, key, level = 1) { if (level > 0) (st.buffs[who] ||= {})[key] = level; },
  };
  const off = { ...probe, draw: false };
  if (scene.state) scene.state(t, off);
  drawDeep(g, t);
  drawPlinth(g, STATION_X);
  drawPlinth(g, BUDDY_X);
  drawCoil(g, t, st);
  for (const [k, lv] of Object.entries(st.statuses)) STATUS[k]?.serpent?.(g, t, st, lv);
  const me = { x: STATION_X - 1, y: FLOOR - 2 - BODY };
  const buddy = { x: BUDDY_X - 1, y: FLOOR - 2 - BODY };
  const api = { ...probe, draw: true, st, me, buddy, t, cls };
  if (scene.body !== false) { drawBody(g, me.x, me.y); cls.hat?.(g, me.x, me.y, t); }
  drawBody(g, buddy.x, buddy.y);
  for (const who of ['me', 'buddy']) {
    const at = who === 'me' ? me : buddy;
    for (const [k, lv] of Object.entries(st.buffs[who] || {})) STATUS[k]?.fighter?.(g, t, at.x, at.y, lv);
  }
  scene.draw(g, t, api);
  return st;
}
