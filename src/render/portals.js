// The acts' connective tissue, drawn (actbeats.js, portals.js, ghosts.js):
// heaven's tear in the sky over the house and the cloud stair let down from
// it, the rock out of the sky and lying on the ruin, the go-on card, hell's
// white-hot slit in the deep's floor, each portal's far end, the pointing
// hands, the two of them as souls and ghosts on the road, the freed souls
// coming down to the mansion, the blocks in the builders' hands, and a beat's
// line in the band. Placeholders all, before the mocks are voted (the tear
// and the slit are the review's picks, H-A and L-A, in plain cells). Flat
// cells on the grid; a fade is opacity, never a pop.

import { S } from '../state.js';
import { P, WORKER, GREY, FINALE_GREYS, FINALE_HOUSE_W, ACT_PORTAL_TONES, ACT_PORTAL_SPIN_HZ, ACT_ROCK_W, ACT_ROCK_H,
         ACT_ROCK_FROM, ACT_ROCK_STEPS, ACT_ROCK_TONES, ACT_SOUL_RIM, ACT_SOUL_PAPER, ACT_STAIR_TONES, ACT_STAIR_STEP,
         ACT_SLIT_TONES, ACT_GOON_ABOVE, ACT_GOON_PAD, ACT_GOON_FONT_PX, ACT_CAPTION_FONT_PX, ACT_CAPTION_GREY,
         ACT_RIM_PIECES, MANSION_SOULS, ABYSS_TONES } from '../config.js';
import { now } from '../clock.js';
import { ctx } from './ctx.js';
import { hash } from './flicker.js';
import { msg, FACE } from '../lang.js';
import { raw, light } from '../ink.js';
import { bandCells } from '../cutscene.js';
import { CELL } from '../config.js';
import { drawBody, lookFor } from './crew.js';
import { dressBehind, dressOn, dressHead } from './wardrobe.js';
import { drawHand } from './hand.js';
import { GREYS, PURPLES } from './deeptones.js';
import { houseX } from '../home.js';
import { portalOpenK, portalEnd, handShown, handAlpha, handBox, PORTALS } from '../portals.js';
import { pairBodies, placeAt, onRoad, tear, stairFoot } from '../ghosts.js';
import { goOnDue, goOnAlpha, fallNow, actCaption } from '../actbeats.js';
import { rockRowsLeft, soulAt, mansionHeld } from '../mansion.js';
import { afterFloor, floorAt } from '../after/place.js';
import { deepFloor } from '../deep/place.js';

const snap = v => Math.round(v / P) * P;
const cellAt = (x, y, tone) => { if (!tone) return; ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); };
const WHO = ['sqouse', 'you'];
const WHITE_SEEN = GREYS[ABYSS_TONES.length - 1];

// Opacity, never a cut.
function faded(k, draw) {
  if (k <= 0) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * Math.min(1, k);
  draw();
  ctx.globalAlpha = was;
}

// --- a portal's far end, and its hand -------------------------------------------------
// A ring of turning purple cells: the mark of where the camera comes through.
function drawRing(e, k, tones = ACT_PORTAL_TONES) {
  const t = now() / 1000, turn = Math.floor(t * ACT_PORTAL_SPIN_HZ * 8);
  const n = Math.max(12, Math.ceil(Math.PI * 2 * e.r / P));
  faded(k, () => {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      cellAt(snap(e.x + Math.cos(a) * e.r - P / 2), snap(e.y + Math.sin(a) * e.r - P / 2), tones[(i + turn) % tones.length]);
    }
  });
}
function drawHandAt(key, place, line, fill) {
  if (!handShown(key)) return;
  const b = handBox(key, place);
  faded(handAlpha(key), () => drawHand(b.x, b.y, 'left', line, fill));
}

// --- in the yard -------------------------------------------------------------------------
export function drawActsYard() {
  if (!S.acts) { drawGoOn(); return; }
  drawRuin();
  drawRock();
  drawTear();
  drawStair();
  drawHandAt('heaven', 'yard', ACT_PORTAL_TONES[2], GREY[0]);
  drawGoOn();
  ctx.fillStyle = '#000';
}

// The tear: a lens of sky ripped open, its lip ragged in dark cells round a
// mouth of the afterlife's white with purple at its seam. Grows to whole as it
// opens (portals.js), and fades in by opacity.
function drawTear() {
  const k = portalOpenK('heaven');
  if (k <= 0) return;
  const e = tear(), rx = e.r * 1.2, ry = e.r * 2 * k;
  faded(k, () => {
    for (let dy = -ry - P; dy <= ry + P; dy += P) {
      for (let dx = -rx - P; dx <= rx + P; dx += P) {
        const d = Math.hypot(dx / rx, dy / Math.max(P, ry));
        const jag = hash((e.x + dx) * 0.37 + (e.y + dy) * 0.11) * 0.35;
        const x = snap(e.x + dx), y = snap(e.y + dy);
        if (d < 0.55) cellAt(x, y, light(GREY[0]));   // the afterlife's white shines on either page
        else if (d < 0.8) cellAt(x, y, ACT_PORTAL_TONES[0]);
        else if (d < 1 + jag) cellAt(x, y, d < 0.95 ? ACT_PORTAL_TONES[2] : GREY[8]);
      }
    }
  });
}

// The cloud stair, let down from the tear to beside the ruin once the road
// is open: a slab of pale cells a step, ACT_STAIR_STEP cells down and across.
let stairSeen = 0;
function drawStair() {
  if (!S.acts.road) { stairSeen = 0; return; }
  stairSeen = Math.min(1, stairSeen + 1 / 90);
  const e = tear(), foot = stairFoot();
  const top = { x: snap(e.x), y: snap(e.y + e.r) };
  const steps = Math.max(1, Math.round((foot.y + WORKER - top.y) / (ACT_STAIR_STEP * P)));
  const shown = Math.ceil(steps * stairSeen);
  for (let s = 0; s < shown; s++) {
    const x = snap(top.x + (foot.x - top.x) * s / steps), y = top.y + s * ACT_STAIR_STEP * P;
    for (let i = 0; i < 4; i++) cellAt(x + i * P, y, ACT_STAIR_TONES[(s + i) % ACT_STAIR_TONES.length]);
    cellAt(x + P, y + P, GREY[2]);
  }
}

// The rock out of the sky: coming down in held steps while the fall plays,
// then lying on the ruin, a row lighter for every row the mansion's builders
// have broken off it (mansion.js). Its cells a tone each off where they are.
function rockCells(x0, y0, rows) {
  const w = ACT_ROCK_W, h = ACT_ROCK_H;
  for (let r = h - rows; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const u = (c + 0.5) / w * 2 - 1, v = (r + 0.5) / h * 2 - 1;
      if (u * u + Math.max(0, v) * v * 0.15 + Math.min(0, v) * v > 1) continue;
      cellAt(x0 + c * P, y0 + r * P, ACT_ROCK_TONES[Math.floor(hash(c * 7.3 + r * 1.9) * ACT_ROCK_TONES.length)]);
    }
  }
}
function drawRock() {
  const f = fallNow();
  const x0 = snap(houseX() + FINALE_HOUSE_W * P / 2 - ACT_ROCK_W * P / 2);
  const rest = Math.round(S.groundY / P) * P - ACT_ROCK_H * P;
  if (f && f.rock < 0) return;
  if (f && f.rock < 1) {
    const k = Math.floor(f.rock * ACT_ROCK_STEPS) / ACT_ROCK_STEPS;
    rockCells(x0, snap(rest - ACT_ROCK_FROM * (1 - k)), ACT_ROCK_H);
    return;
  }
  if (S.acts.house === 'standing') return;
  const rows = rockRowsLeft();
  if (rows > 0) rockCells(x0, rest, rows);
  if (f && f.dust > 0) drawDust(x0, rest, f.dust);
}
// The dust off the fall: a ring of grey cells going out along the ground and
// up, thinning, in held steps.
function drawDust(x0, y, k) {
  const n = 14, step = Math.floor(k * 8) / 8;
  faded(1 - step, () => {
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
      const x = snap(x0 + ACT_ROCK_W * P / 2 + side * (ACT_ROCK_W * P / 2 + step * P * (6 + j * 2)));
      cellAt(x, snap(y + ACT_ROCK_H * P - P - step * P * (1 + (j % 3)) * 3), FINALE_GREYS[3 + (j % 3)]);
    }
  });
}
// The ruin: boards of the house broken and lying out from under the rock.
function drawRuin() {
  if (S.acts.house !== 'fallen') return;
  const gy = Math.round(S.groundY / P) * P - P, hx = houseX();
  const bits = [[-1, 0, 3], [1, -1, 2], [FINALE_HOUSE_W - 2, 0, 3], [FINALE_HOUSE_W, -1, 2], [FINALE_HOUSE_W + 1, 0, 2]];
  for (const [c, r, w] of bits) for (let i = 0; i < w; i++) cellAt(hx + (c + i) * P, gy + r * P, (c + i) % 2 ? '#000' : FINALE_GREYS[1]);
}

// --- the go-on card (call 7) ---------------------------------------------------------------
// A white card with a black edge over the house, its one line the player's
// say; drawn in screen pixels over its world place, so the words are the
// size every card's are. Its box is kept in the world for the click.
let goOnBox = null;
export const onGoOn = (x, y) => !!goOnBox && goOnDue() && goOnAlpha() >= 1
  && x >= goOnBox.x && x < goOnBox.x + goOnBox.w && y >= goOnBox.y && y < goOnBox.y + goOnBox.h;
export const goOnRect = () => goOnBox;
function drawGoOn() {
  if (!goOnDue() || S.view !== 'yard') { goOnBox = null; return; }
  const k = goOnAlpha();
  const text = msg('act-goon');
  const wx = houseX() + FINALE_HOUSE_W * P / 2, wy = S.groundY - ACT_GOON_ABOVE;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.font = `${ACT_GOON_FONT_PX}px ${FACE}`;
  const tw = Math.ceil(ctx.measureText ? ctx.measureText(text).width || 0 : 0);
  const pad = ACT_GOON_PAD * S.zoom, w = tw + pad * 2, h = ACT_GOON_FONT_PX + pad * 2;
  const sx = Math.round((wx - S.camX) * S.zoom - w / 2), sy = Math.round((wy - S.camY) * S.zoom - h);
  goOnBox = { x: S.camX + sx / S.zoom, y: S.camY + sy / S.zoom, w: w / S.zoom, h: h / S.zoom };
  ctx.globalAlpha = k;
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx, sy, w, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 1, sy + 1, w - 2, h - 2);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText?.(text, sx + w / 2, sy + h / 2 + 1);
  ctx.restore();
  ctx.fillStyle = '#000';
}

// --- in the deep: hell's slit ---------------------------------------------------------------
// A white-hot slit in the floor: a line of the deep's white with purple at
// its ends, a cell of glow over it, opening by length and opacity.
export function drawActsDeep() {
  const k = portalOpenK('hell');
  if (k > 0) {
    const e = portalEnd('hell', 'deep'), y = snap(deepFloor()) - P, half = Math.round(e.r * k / P);
    const t = Math.floor(now() / 1000 * ACT_PORTAL_SPIN_HZ * 4);
    faded(k, () => {
      for (let i = -half; i <= half; i++) {
        const end = Math.abs(i) >= half - 1;
        cellAt(snap(e.x) + i * P, y, end ? PURPLES[PURPLES.length - 2] : WHITE_SEEN);
        if (!end && (i + t) % 3 === 0) cellAt(snap(e.x) + i * P, y - P, PURPLES[PURPLES.length - 3]);
      }
    });
    drawHandAt('hell', 'deep', PURPLES[PURPLES.length - 3], WHITE_SEEN);
  }
  ctx.fillStyle = '#000';
}

// --- up there, and down there: each portal's far end ------------------------------------------
export function drawActsAfter() {
  const k = portalOpenK('heaven');
  if (k > 0) {
    // the patch of cloud floor the road comes up through, thin and pale
    const e = portalEnd('heaven', 'after'), y = afterFloor();
    faded(k, () => { for (let i = -3; i <= 3; i++) cellAt(snap(e.x) + i * P, y, i % 2 ? ACT_PORTAL_TONES[0] : GREY[0]); });
    drawRing(e, k);
    drawHandAt('heaven', 'after', ACT_PORTAL_TONES[2], GREY[0]);
  }
  ctx.fillStyle = '#000';
}
export function drawActsHell() {
  const k = portalOpenK('hell');
  if (k > 0) {
    const e = portalEnd('hell', 'hell');
    drawRing(e, k, [ACT_SLIT_TONES[0], ACT_SLIT_TONES[1], ACT_SLIT_TONES[2]]);
    drawHandAt('hell', 'hell', ACT_SLIT_TONES[1], GREY[0]);
  }
  ctx.fillStyle = '#000';
}

// --- the bodies on the road ---------------------------------------------------------------------
// A soul: the body's square with its rim's eight cells in the pale grey,
// those inked in black (lives coming back a piece at a time), what it wears
// drawn in the same pale inks.
// On the dark page the pale greys are drawn at the light page's own
// lightness (`light`, past the map), so a soul is a pale thing on either
// page: mapped as the yard maps every grey they would land beside the black
// and read as ink. The middle stays paper and an inked piece ink, as a
// body's are in the yard.
const seen = light;
const SOUL_RIM = seen(ACT_SOUL_RIM);
const SOUL_INKS = { ink: SOUL_RIM, paper: ACT_SOUL_PAPER, grey: seen(GREY[2]), pale: seen(GREY[1]) };
const RIM = [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [0, 1]];
function drawSoul(x, y, inked, look) {
  if (look) dressBehind(ctx, x, y, look);
  RIM.forEach(([c, r], i) => cellAt(x + c * P, y + r * P, i < inked ? '#000' : SOUL_RIM));
  cellAt(x + P, y + P, ACT_SOUL_PAPER);
  if (look) { dressOn(ctx, x, y, look); dressHead(ctx, x, y, look); }
}

const onCloud = b => (Math.abs(b.y + WORKER - afterFloor()) < 1 ? floorAt(b.x + WORKER / 2) - afterFloor() : 0);
export function drawActBodies(place) {
  const pair = pairBodies(), p = S.acts && S.acts.pair;
  if (pair && p) {
    // Faded off over the pedestal's own drawing of them while they stand on
    // it (actbeats.js, `top`).
    const k = Math.min(p.lift ?? 1, 1 - (p.inside || 0), 1 - (p.top || 0));
    pair.forEach((b, i) => {
      // on the road up between the yard and the cloud floor, the road's own
      // layer draws them (render/road.js)
      if ((placeAt(b.y) || (onRoad(b.y) ? 'road' : null)) !== place) return;
      // Up there, a body standing on the cloud floor stands on its puffs.
      const x = Math.round(b.x), y = Math.round(b.y) + (place === 'after' ? onCloud(b) : 0);
      const look = lookFor(WHO[i], {}, b.x, { face: p.face || null, deep: place === 'deep' });
      faded(k, () => {
        if (p.mode === 'alive') drawBody(x, y, look);
        else drawSoul(x, y, Math.min(ACT_RIM_PIECES, p.rims || 0), look && { ...look, inks: SOUL_INKS });
      });
      // a load of the yard's dust in the first one's hands, on the way down
      if (i === 0 && p.carry > 0) for (let c = 0; c < 2; c++) cellAt(x + c * P + P / 2, y - P, FINALE_GREYS[2]);
    });
  }
  if (place !== 'yard') { ctx.fillStyle = '#000'; return; }
  // the freed souls coming down the stair to the mansion
  for (let i = 0; i < MANSION_SOULS; i++) {
    const s = soulAt(i);
    if (!s) continue;
    faded(s.stair ? 1 : s.k ?? 1, () => drawSoul(snap(s.x), Math.round(s.y), 0, null));
  }
  // what the mansion's builders carry: a block over the head, a pole upright
  for (const w of S.workers) {
    const held = mansionHeld(w);
    if (!held) continue;
    const x = Math.round(w.x), y = Math.round(w.y);
    if (held.kind === 'pole' || held.kind === 'off') for (let r = 0; r < 4; r++) cellAt(x + WORKER, y - r * P, FINALE_GREYS[3]);
    else for (let c = 0; c < 3; c++) cellAt(x + c * P, y - P, ACT_ROCK_TONES[c % ACT_ROCK_TONES.length]);
  }
  ctx.fillStyle = '#000';
}

// --- a beat's line --------------------------------------------------------------------------------
// In the foot band, white on its black, faded in and out (actbeats.js). The
// words are the owner's to write: each is a plain label in locales/en.ftl.
export function drawActCaption() {
  const c = actCaption();
  if (!c || c.a <= 0 || S.hush <= 0) return;
  const band = Math.round(S.hush * bandCells()) * CELL;
  if (band < ACT_CAPTION_FONT_PX) return;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.globalAlpha = c.a;
  ctx.font = `${ACT_CAPTION_FONT_PX}px ${FACE}`;
  ctx.fillStyle = raw(ACT_CAPTION_GREY);   // on the band's own black, past the page's map
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText?.(c.args ? msg(c.id, c.args) : msg(c.id), S.W / 2, S.H - band / 2);
  ctx.restore();
  ctx.fillStyle = '#000';
}
