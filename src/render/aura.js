// The offer flag: a station whose board holds something you could buy this
// second flies a flag off its roof peak -- a pole, a pennant in the wind, and
// once it is up one ring of ink off the tip. The mast slides up out of the
// roofline and the cloth is run up it; a closing offer plays both backwards.
//
// The pole stands on the middle column of the station's stand box, so any
// station, present or future, is covered without knowing its drawing.

import { STATIONS, hasOffer, standRect } from '../board.js';
import {
  AURA_BREATH, AURA_IN,
  DROP_MARK_BOB_MS, DROP_MARK_LIFT,
  FLAG_FILL, FLAG_GIVE, FLAG_H, FLAG_HOIST_MS, FLAG_LIMP, FLAG_POLE,
  FLAG_RAISE_MS, FLAG_RIPPLE_MS,
  FLAG_SAG, FLAG_SWING, FLAG_W, FLAG_WAVES,
  OFFER_WAVE_INK, OFFER_WAVE_MS, OFFER_WAVE_R, P, TOWER_SHAFT,
} from '../config.js';
import { now } from '../clock.js';
import { give, wind } from '../wind.js';
import { chimneyAt } from '../house.js';
import { S, bench, lab, tower } from '../state.js';
import { holdOptions, holdTarget } from '../crew/assign.js';
import { ctx } from './ctx.js';
import { cell } from './marks.js';

// Whether a station is offering is `hasOffer`, one rule for every station, the
// bench included: `benchMark()` counts an unread heading as well and would fly
// a flag over an empty purse.

// One ring, at one point of the breath. `phase` is 0..1: 0 is the line fully
// inset on the walls, 1 fully out past them. The caller owns the stroke state.
//
// The breath runs from INSIDE the walls to just outside: the ground is white,
// so a ring wholly outside the box would be white on white. Whole pixels, so
// the 1-px line stays a 1-px line rather than a two-pixel gray fringe.
export function auraRing(rect, phase) {
  const out = Math.round(-AURA_IN + phase * (AURA_IN + AURA_BREATH));
  // The box is snapped to the cell grid; the breath pushes it out by whole
  // pixels, off the lattice on purpose: a pulse quantized to cells would jump
  // six pixels at a stroke and read as a glitch.
  const x = Math.round(rect.x / P) * P - out;
  const y = Math.round(rect.y / P) * P - out;
  const w = Math.round(rect.w / P) * P + out * 2;
  const h = Math.round(rect.h / P) * P + out * 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// The roof peak: the middle column of the stand box, at its top edge. Derived
// from the box, so a station nobody has built yet gets its mark for free.
function roofPeak(rect) {
  const cols = Math.round(rect.w / P);
  // The exact middle of the front, less half the pole's own cell. Half a cell
  // is still whole pixels and a solid fill carries no hairline; snapping to
  // the lattice pushes every even-width flag half a cell right.
  const x = Math.round(rect.x / P) * P + (cols * P) / 2 - P / 2;
  const y = Math.round(rect.y / P) * P;
  return { x, y };
}

// Where a station's pole stands: on the building's own topmost feature, read
// off the same geometry the drawing reads, so the two cannot drift apart. A
// station not listed gets `roofPeak`. Each two-cell feature takes the pole
// astride its middle boundary, half a cell in from its left edge.
const SPOT = {
  house: () => { const f = chimneyAt(); return f && { x: f.x + P / 2, y: f.y - P * 4 }; },
  bench: () => ({ x: bench.x + P * 4.5, y: bench.y - P * 2 }),  // the clamped block
  lab: () => ({ x: lab.x + P * 3, y: lab.y }),                  // the chimney
  // The tower's stand box is the shaft plus the turret off its right side, so
  // the middle of the box is the spire's shoulder. The pole goes on the vane's
  // own mast, the topmost thing the tower draws. (bars.js works around the
  // same wide box with towerSpireBox.)
  tower: () => ({ x: tower.x + P * (TOWER_SHAFT / 2 - 0.5), y: tower.y - P * 3 }),
};

function flagBase(rect, which) {
  const spot = (SPOT[which] && SPOT[which]()) || roofPeak(rect);
  // The half-cell center is not a drawable place: whole cells map to whole
  // device pixels (CELL/P is fractional), so a rect on the half-cell smears
  // into gray fringes. Snap the base to the device-pixel grid; every column of
  // the flag, P multiples from here, stays crisp with it.
  const k = S.zoom * S.dpr;
  return { x: Math.round(spot.x * k) / k, y: spot.y };
}

// The highest pixel a station's flag can reach, answered whether or not the
// station is flying one this second: the marks hanging over a station clear
// the flag by this, and a clearance that came and went with the offer would
// make them hop every time a board changed. Null for a station not standing.
export function flagReach(which) {
  const r = standRect(which);
  if (!r) return null;
  return flagBase(r, which).y - (FLAG_POLE + FLAG_CREST) * P;
}

// The cells the cloth can ride above the knot: a turn of FLAG_SWING radians
// integrated over the quarter-wave that fits on FLAG_W cells at FLAG_WAVES
// waves. The cloth hangs from the masthead, so only the crest lifts past the
// pole's top.
const FLAG_CREST = Math.ceil(FLAG_SWING * FLAG_W / (2 * Math.PI * FLAG_WAVES));

// A stable per-station number in 0..1, so every flag flutters out of step with
// its neighbors without anything being stored or saved.
const seedOf = which => {
  let h = 0;
  for (const c of which) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
};

// The flag: a one-cell pole off the peak and a pennant knotted to its top,
// walked out from the knot half a cell at a time, steered by the lean (the
// yard's wind) and one ripple traveling out toward the loose end.
//
// The heading is measured from STRAIGHT DOWN, a signed lean times a right
// angle: a dying gust swings the cloth down through vertical and the next
// lifts it out the other side. Nothing in the drawing reads the wind's sign,
// which is why the flag never flips.
//
// Depth lies ACROSS the walk, which makes it a sheet rather than a line.
// Half-cell steps mean consecutive stamps always overlap; whole-cell steps
// tear the cloth into a dotted diagonal at a slant.
//
// This layer is painted BEFORE the buildings, so whatever roofline a station
// draws covers the pole's lower run and the pole reads as standing on it.
//
// `pole` and `hoist` are the two halves of the raise, each 0..1: how much of
// the mast is out of the roof, and how far up it the knot is. Both move in
// whole DEVICE pixels: a mast growing a cell at a time climbs in jerks, and a
// rect on a fractional pixel draws as a gray fringe.
function drawFlag(rect, which, t, pole, hoist) {
  const { x, y } = flagBase(rect, which);
  const k = S.zoom * S.dpr;
  const snap = v => Math.round(v * k) / k;
  const peak = snap(y - FLAG_POLE * P * pole);
  // Two cells past the base, into the feature it stands on: the bench is
  // mostly air, so a pole run to the ground shows between its legs. That
  // buried foot is what the mast rises out of, so at pole 0 the flag is nothing.
  ctx.fillRect(x, peak, P, y - peak + P * 2);
  if (hoist <= 0) return;
  // The knot, between the foot and the masthead; the cloth flies while it is
  // being run up.
  const top = snap(y - (y - peak) * hoist);
  const seed = seedOf(which);
  // The yard's own wind, never a private one: two winds over one place read as
  // a gale over a yard whose smoke is barely moving. `give` is a per-thing share
  // of the shared number, so neighbors differ a few percent and never disagree
  // about which way it is blowing.
  const lean = Math.max(-1, Math.min(1, wind() * give(seed, FLAG_GIVE) * FLAG_FILL));
  const pull = Math.abs(lean);
  // The walk, in cells right of the pole and below its top. It starts ON the
  // pole (no wind, the flag hangs against its mast) and half a depth down, so
  // the cloth hangs FROM the masthead rather than straddling it.
  let px = 0, py = (FLAG_H - 1) / 2;
  const step = 0.5;
  for (let s = step; s <= FLAG_W; s += step) {
    // A full gust holds the whole length out at a right angle; a weaker one
    // lets the far end fall back toward vertical (FLAG_SAG).
    const held = 1 - (1 - pull) * FLAG_SAG * (s / FLAG_W);
    // One wave out from the knot, its turn growing toward the loose end. It
    // grows with the pull but never to nothing: FLAG_LIMP is what a furled flag
    // keeps, so the hang stirs instead of drawing as a bar. The seed staggers
    // pace and phase so the yard's flags never beat in unison.
    const rip = Math.sin((t / (FLAG_RIPPLE_MS * (0.85 + 0.3 * seed))
                          - (s * FLAG_WAVES) / FLAG_W) * Math.PI * 2 + seed * 7)
              * Math.pow(s / FLAG_W, 1.4)
              * (FLAG_LIMP + (1 - FLAG_LIMP) * pull) * FLAG_SWING;
    // Added, not mirrored with the wind's sign: mirroring jumps the whole wave
    // to its own reflection in a frame at the crossing.
    const th = lean * (Math.PI / 2) * held + rip;
    px += Math.sin(th) * step;
    py += Math.cos(th) * step;
    const cx = x + Math.round(px) * P;
    const cy = top + Math.round(py) * P;
    // Depth across the walk. The flip between the two stampings happens on the
    // diagonal, where they cover nearly the same cells, so it costs no seam.
    // Both are centered on the walk; hung off one side, the edge-on stamp
    // reads as a whisker off the tip.
    const off = Math.floor((FLAG_H - 1) / 2) * P;
    if (Math.abs(Math.sin(th)) >= Math.abs(Math.cos(th)))
      ctx.fillRect(cx, cy - off, P, FLAG_H * P);
    else
      ctx.fillRect(cx - off, cy, FLAG_H * P, P);
  }
}

// When a raised flag reaches the masthead, one ring of ink breathes off its
// tip and spends itself; the flag alone carries the standing state after.
const openedAt = new Map();
function drawOpeningWave(rect, which, since, t) {
  const k = (t - since) / OFFER_WAVE_MS;
  if (k >= 1) return;
  const { x, y } = flagBase(rect, which);
  const from = { x: x + P / 2, y: y - FLAG_POLE * P };
  const rad = k * OFFER_WAVE_R;
  if (rad < P) return;
  ctx.globalAlpha = (1 - k) * OFFER_WAVE_INK;
  const n = Math.max(10, Math.round((Math.PI * 2 * rad) / P));
  ctx.beginPath();
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2;
    cell(from.x + Math.cos(a) * rad, from.y + Math.sin(a) * rad);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// How far into its raise each station's flag is, in milliseconds: up while
// offering, back down while not. One number rather than a state machine, so
// an offer that closes halfway through the hoist lowers the cloth from where
// it got to.
const raised = new Map();
const RAISE_TOTAL = FLAG_RAISE_MS + FLAG_HOIST_MS;
let lastFrame = 0;

// Smoothstep, so the mast eases out of the roof and settles at the top.
const ease = k => k * k * (3 - 2 * k);

// Painted before the buildings so the poles stand behind the rooflines. The
// hold ring stays in drawAuras, over everything.
export function drawFlags() {
  const t = now();
  // The game's own clock, so a flag raises in game time. Deliberately NOT
  // clamped: on the first frame after a load `lastFrame` is nought, so the
  // whole raise resolves at once and a yard that was flying its flags comes
  // back flying them.
  const dt = Math.max(0, t - lastFrame);
  lastFrame = t;
  ctx.save();
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    const on = hasOffer(which);
    const r = standRect(which);
    // A station not standing has no roofline to raise a pole out of, so its
    // raise is forgotten rather than lowered.
    if (!r) { raised.delete(which); openedAt.delete(which); continue; }
    const e = Math.max(0, Math.min(RAISE_TOTAL, (raised.get(which) || 0) + (on ? dt : -dt)));
    if (e <= 0) { raised.delete(which); openedAt.delete(which); continue; }
    raised.set(which, e);
    drawFlag(r, which, t,
             ease(Math.min(1, e / FLAG_RAISE_MS)),
             ease(Math.max(0, (e - FLAG_RAISE_MS) / FLAG_HOIST_MS)));
    // The ring marks the moment the flag reaches the masthead, not the moment
    // the board changed; fired at the start it goes off around a stub.
    if (e < RAISE_TOTAL) { openedAt.delete(which); continue; }
    if (!openedAt.has(which)) openedAt.set(which, t);
    drawOpeningWave(r, which, openedAt.get(which), t);
  }
  ctx.restore();
}

export function drawAuras() {
  ctx.save();
  // While a body is held, every station it could join wears a small arrow
  // pointing down at it, off the same table the drop consults.
  const t = now();
  const bob = Math.round(Math.sin(t / DROP_MARK_BOB_MS * Math.PI * 2)) * P;
  ctx.fillStyle = '#000';
  for (const o of holdOptions()) {
    const cols = Math.round(o.ring.w / P);
    const cx = Math.round(o.ring.x / P) * P + Math.floor(cols / 2) * P;
    const y = Math.round(o.ring.y / P) * P - DROP_MARK_LIFT * P + bob;
    ctx.fillRect(cx - P, y, P * 3, P);
    ctx.fillRect(cx, y + P, P, P);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  // The station under a held body wears the same ring, steady, at phase 0:
  // fully inset, the line lies on the black of the building; swelled out it
  // would sit in the white sky, which is no ring at all. holdTarget is null
  // over a full station: no ring, no deal, one table in assign.js.
  const hold = holdTarget();
  if (hold) {
    ctx.setLineDash([]);
    auraRing(hold.ring, 0);
  }
  ctx.restore();
}
