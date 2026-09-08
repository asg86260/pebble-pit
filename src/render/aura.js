// The offer flag: a station whose board holds something you could buy this
// second flies a flag off its roof peak -- a pole, a black pennant rippling in
// the wind, and, once it is up, one ring of ink breathing off the tip (the
// tower's own gesture at a whisper). The flag does not appear: the mast slides
// up out of the roofline and the cloth is then run up it, and a closing offer
// plays the same two moves backwards. It replaces the dashed
// breathing outline, which was the one thing in the yard that was an effect
// laid over a building rather than a thing standing in it; a flag is an object
// the wind moves, which is the register everything else here works in.
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
import { S, bench, lab, school, tower } from '../state.js';
import { holdOptions, holdTarget } from '../crew/assign.js';   // wave7b-assign
import { ctx } from './ctx.js';
import { cell } from './marks.js';

// Whether a station is offering. One rule for every station, hasOffer, the
// bench included: it used to answer through benchMark() instead, which counts
// an unread heading as well, so the bench flew a flag over an empty purse --
// the one thing a flag is supposed to mean is that there is something down
// there you could buy this second.

// One ring, at one point of the breath. `phase` is 0..1 through the swell:
// 0 is the line fully inset on the walls, 1 fully out past them. The caller
// owns the stroke state (dash, color), so the same body draws the breathing
// offer ring and the steady hold-a-body ring off one piece of arithmetic.
//
// The breath runs from INSIDE the walls to just outside them. The ground the
// buildings stand against is white, so a ring that lived wholly outside the
// box would be white on white -- invisible. Starting inset, the white line
// lies on the black of the building where it reads, and the outward half of
// the breath carries it over the edge and lets it dissolve into the sky --
// which is what makes it a pulse rather than a stripe painted on the wall.
// Whole pixels, so the 1-px line stays a 1-px line: a fractional offset is
// painted as a two-pixel grey fringe, the hairline the game is arranged to
// avoid.
export function auraRing(rect, phase) {
  const out = Math.round(-AURA_IN + phase * (AURA_IN + AURA_BREATH));
  // The box is snapped to the cell grid; the breath then pushes it out by
  // whole pixels, off the lattice on purpose -- a pulse quantized to cells
  // would jump six pixels at a stroke and read as a glitch, not a breath.
  const x = Math.round(rect.x / P) * P - out;
  const y = Math.round(rect.y / P) * P - out;
  const w = Math.round(rect.w / P) * P + out * 2;
  const h = Math.round(rect.h / P) * P + out * 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// The roof peak, in whole cells: the middle column of the stand box, at its top
// edge. Derived from the box rather than from any station's own drawing, so a
// station nobody has built yet gets its mark for free.
function roofPeak(rect) {
  const cols = Math.round(rect.w / P);
  // The exact middle of the front, less half the pole's own cell: on an
  // odd-width building this is the center cell, on an even one the pole
  // straddles the middle boundary. Half a cell is still whole pixels, and a
  // solid fill carries no hairline -- snapping to the lattice here just
  // pushed every even-width flag half a cell to the right.
  const x = Math.round(rect.x / P) * P + (cols * P) / 2 - P / 2;
  const y = Math.round(rect.y / P) * P;
  return { x, y };
}

// Where a station's pole stands: on the building's own topmost feature, read
// off the same geometry the drawing reads, so the two cannot drift apart. The
// house's chimney climbs as the settlement grows and the flag climbs with it.
// A station not listed gets the middle column of its stand box's top edge,
// which is right for anything with a flat or peaked roof.
// Each two-cell feature takes the pole astride its middle boundary -- half a
// cell in from its left edge -- so the flag stands centered on it; the lab's
// three-cell stack centers on its middle cell outright.
const SPOT = {
  house: () => { const f = chimneyAt(); return f && { x: f.x + P / 2, y: f.y - P * 4 }; },
  bench: () => ({ x: bench.x + P * 4.5, y: bench.y - P * 2 }),  // the clamped block
  school: () => ({ x: school.x + P * 9.5, y: school.y }),       // the belfry
  lab: () => ({ x: lab.x + P * 3, y: lab.y }),                  // the chimney
  // The tower's stand box is the shaft plus the turret hung off its right side,
  // so the middle of the box is the spire's right shoulder -- two and a half
  // cells right of the point and three below the vane. The pole goes on the
  // vane's own mast instead, the topmost thing the tower draws, so the flag
  // continues the staff the vane already stands on. (bars.js works around the
  // same wide box with towerSpireBox.)
  tower: () => ({ x: tower.x + P * (TOWER_SHAFT / 2 - 0.5), y: tower.y - P * 3 }),
};

function flagBase(rect, which) {
  const spot = (SPOT[which] && SPOT[which]()) || roofPeak(rect);
  // The half-cell center is a real place but not a drawable one: the view maps
  // whole cells to whole device pixels (CELL/P is fractional), so a rect on
  // the half-cell smears into grey fringes down both edges. Snap the base to
  // the device-pixel grid instead -- within half a pixel of true center, and
  // every column of the flag, P multiples from here, stays crisp with it.
  const k = S.zoom * S.dpr;
  return { x: Math.round(spot.x * k) / k, y: spot.y };
}

// The highest pixel a station's flag can reach -- the pole's top, less the
// cells the pennant's crest rides up on. Answered whether or not the station is
// flying one this second: anything hanging above a station (its work bar, its
// done tick) clears the flag by this, and a clearance that came and went with
// the offer would make those marks hop every time a board changed. Null for a
// station that is not standing, which has nothing to clear.
export function flagReach(which) {
  const r = standRect(which);
  if (!r) return null;
  return flagBase(r, which).y - (FLAG_POLE + FLAG_CREST) * P;
}

// The cells the cloth can ride above the knot, derived rather than guessed:
// integrating a turn of FLAG_SWING radians over the quarter-wave that fits on
// FLAG_W cells at FLAG_WAVES waves gives the crest's height. The cloth hangs
// from the masthead rather than straddling it, so its own depth clears nothing
// extra -- only the crest itself lifts it past the pole's top. Anything that
// hangs over a station clears the flag by this, so a wider swing carries those
// marks up with it instead of being drawn through.
const FLAG_CREST = Math.ceil(FLAG_SWING * FLAG_W / (2 * Math.PI * FLAG_WAVES));

// A stable per-station number in 0..1, so every flag flutters out of step with
// its neighbors without anything being stored or saved.
const seedOf = which => {
  let h = 0;
  for (const c of which) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
};

// The flag: a one-cell pole off the peak, and a pennant knotted to the top of
// it. The cloth is the same piece of cloth in every wind -- what the wind
// changes is which way it points. It is walked out from the knot half a cell
// at a time, and at each step two things steer the walk: the lean, which is
// the yard's wind, and the ripple, one wave traveling out toward the loose end.
//
// The heading is measured from STRAIGHT DOWN, and that is the whole reason the
// flag no longer flips. It used to fly a fixed distance out to whichever side
// the wind's sign said, so the instant the wind crossed zero the cloth was
// drawn two cells across the pole in one frame -- a horizontal flip you could
// not help seeing, on the one part of the yard that is meant to read as slow
// weather. The heading is a signed lean times a right angle now: a dying gust
// swings the cloth down through vertical until it hangs against its own mast,
// and the next gust lifts it out the other side. Nothing snaps, because nothing
// in the drawing reads the wind's sign any more.
//
// Depth lies ACROSS the walk, which is what makes it a sheet rather than a
// line: level cloth shows its depth as height, hanging cloth shows the same
// depth as width. Half-cell steps mean consecutive stamps always overlap, so
// the cloth is solid at every angle -- whole-cell steps tore it into a dotted
// diagonal wherever it ran at a slant.
//
// The pole runs all the way down to the ground and this layer is painted
// BEFORE the buildings, so whatever roofline a station actually draws -- a
// step, a slope, a turret off center -- covers the pole's lower run and the
// pole reads as standing on the silhouette. Anchoring it by arithmetic on the
// stand box put it floating over every roof that was not flat.
//
// `pole` and `hoist` are the two halves of the raise, each 0..1: how much of
// the mast is out of the roof, and how far up it the knot has been pulled. Both
// move in whole DEVICE pixels rather than whole cells -- a mast that grew a
// cell at a time would climb in eight jerks of six pixels, which is the same
// glitch the aura's breath is arranged to avoid, and a rect on a fractional
// pixel draws as a grey fringe down its edge instead of a black line.
function drawFlag(rect, which, t, pole, hoist) {
  // The pole stands on the station's own topmost feature where one is named
  // (SPOT, above), and on the middle of the box's top edge otherwise.
  const { x, y } = flagBase(rect, which);
  const k = S.zoom * S.dpr;
  const snap = v => Math.round(v * k) / k;
  const peak = snap(y - FLAG_POLE * P * pole);
  // Two cells past the base, into the feature it stands on -- enough to bury
  // the foot in the chimney or the roof mass. It ran to the ground for a
  // while, trusting the silhouette to cover it, and the bench is mostly air:
  // the pole showed straight through between its legs. That buried foot is
  // also what the mast rises out of: at pole 0 there is two cells of it, all
  // of them inside the roof, so the flag starts as nothing.
  ctx.fillRect(x, peak, P, y - peak + P * 2);
  if (hoist <= 0) return;
  // The knot, somewhere between the foot and the masthead. The cloth is the
  // same cloth the whole way up -- it flies while it is being run up, because
  // that is what cloth on a rope in a wind does.
  const top = snap(y - (y - peak) * hoist);
  const seed = seedOf(which);
  // The yard's own wind, not a second one. The flags kept a private pair of
  // sines for a while, and it was why they read as a gale over a yard whose
  // smoke was barely moving: two skies over one place. `wind()` is the number
  // the haze, the grit, the smoke and the balloon all already lean on, and it
  // has a lull in it -- it drops to still air and builds again, which a sum of
  // sines never does. `give` is that module's own idiom for a per-thing share
  // of a shared number: neighbors differ by a few percent and never disagree
  // about which way it is blowing.
  const lean = Math.max(-1, Math.min(1, wind() * give(seed, FLAG_GIVE) * FLAG_FILL));
  const pull = Math.abs(lean);
  // The walk, in cells right of the pole and cells below its top. It starts ON
  // the pole -- a flag with no wind in it hangs against its own mast -- and half
  // a depth down, so the cloth hangs FROM the masthead: the stamps are centered
  // on the walk, and a walk that began level with the pole's top put half the
  // cloth above the top of its own mast.
  let px = 0, py = (FLAG_H - 1) / 2;
  const step = 0.5;
  for (let s = step; s <= FLAG_W; s += step) {
    // The heading, from straight down. A full gust holds the whole length out
    // at a right angle; a weaker one lets the far end fall back toward vertical
    // while the knot goes on holding its own end up, which is FLAG_SAG.
    const held = 1 - (1 - pull) * FLAG_SAG * (s / FLAG_W);
    // The ripple: one wave traveling out from the knot, its turn growing toward
    // the loose end -- a sheet held at one edge is nearly still where it is held
    // and does almost all of its moving out at the free end. It grows with the
    // pull but never to nothing: FLAG_LIMP is what a furled flag keeps, so the
    // hang stirs instead of drawing as a bar. Turned with the lean, so the wave
    // runs OUT along the cloth whichever way the cloth is pointing. The
    // per-station seed staggers pace and phase so the yard's flags never beat
    // in unison.
    const rip = Math.sin((t / (FLAG_RIPPLE_MS * (0.85 + 0.3 * seed))
                          - (s * FLAG_WAVES) / FLAG_W) * Math.PI * 2 + seed * 7)
              * Math.pow(s / FLAG_W, 1.4)
              * (FLAG_LIMP + (1 - FLAG_LIMP) * pull) * FLAG_SWING;
    // Added, not mirrored. Turning the ripple with the wind's sign put the one
    // discontinuity back that all of this is here to remove: at the crossing
    // the whole wave jumped to its own mirror image in a frame. The wave runs
    // out along the cloth either way without it -- all the sign ever did was
    // decide whether a crest lifted or dipped, which nobody can tell.
    const th = lean * (Math.PI / 2) * held + rip;
    px += Math.sin(th) * step;
    py += Math.cos(th) * step;
    const cx = x + Math.round(px) * P;
    const cy = top + Math.round(py) * P;
    // Depth across the walk. Which way "across" is depends on which way the
    // cloth is running, and the flip happens on the diagonal, where the two
    // stampings cover nearly the same cells -- so it costs no seam. Both are
    // centered on the walk: hung off one side instead, the edge-on stamp
    // reached a further two cells out and read as a whisker off the tip
    // rather than as a piece of cloth turned away from you.
    const off = Math.floor((FLAG_H - 1) / 2) * P;
    if (Math.abs(Math.sin(th)) >= Math.abs(Math.cos(th)))
      ctx.fillRect(cx, cy - off, P, FLAG_H * P);
    else
      ctx.fillRect(cx - off, cy, FLAG_H * P, P);
  }
}

// When a raised flag reaches the masthead, one ring of ink breathes off its tip
// and spends itself -- the tower's rings-going-out gesture at a whisper. The
// flag alone carries the standing state after; the ring marks the moment.
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

// How far into its raise each station's flag is, in milliseconds: up while the
// station is offering, back down while it is not. One number rather than a
// state machine, because the strike is the raise run backwards and an offer
// that closes halfway through the hoist should lower the cloth from where it
// actually got to, not from the top.
const raised = new Map();
const RAISE_TOTAL = FLAG_RAISE_MS + FLAG_HOIST_MS;
let lastFrame = 0;

// Nought to one with the corners taken off, so the mast eases out of the roof
// and settles at the top instead of starting and stopping at full speed.
const ease = k => k * k * (3 - 2 * k);

// The flags, painted before the buildings so the poles stand behind the
// rooflines (see drawFlag). The hold ring stays in drawAuras, over everything.
export function drawFlags() {
  const t = now();
  // The game's own clock, so a flag raises in game time like everything else --
  // turn the handle and the flag goes up with the yard. Deliberately NOT
  // clamped: on the first frame after a load `lastFrame` is nought, so the
  // whole raise resolves at once and a yard that was already flying its flags
  // comes back flying them, rather than hoisting the lot at you on arrival.
  const dt = Math.max(0, t - lastFrame);
  lastFrame = t;
  ctx.save();
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    const on = hasOffer(which);
    const r = standRect(which);
    // A station that is not standing has no roofline to raise a pole out of, so
    // its raise is forgotten rather than lowered: there is nothing to lower it
    // against.
    if (!r) { raised.delete(which); openedAt.delete(which); continue; }
    const e = Math.max(0, Math.min(RAISE_TOTAL, (raised.get(which) || 0) + (on ? dt : -dt)));
    if (e <= 0) { raised.delete(which); openedAt.delete(which); continue; }
    raised.set(which, e);
    drawFlag(r, which, t,
             ease(Math.min(1, e / FLAG_RAISE_MS)),
             ease(Math.max(0, (e - FLAG_RAISE_MS) / FLAG_HOIST_MS)));
    // The ring marks the moment the flag reaches the masthead, not the moment
    // the board changed: it is the punctuation on the raise, and fired at the
    // start it went off around a pole that was still a stub in the roof.
    if (e < RAISE_TOTAL) { openedAt.delete(which); continue; }
    if (!openedAt.has(which)) openedAt.set(which, t);
    drawOpeningWave(r, which, openedAt.get(which), t);
  }
  ctx.restore();
}

export function drawAuras() {
  ctx.save();
  // While a body is held, every station it could join wears a small arrow
  // pointing down at it, bobbing -- the options laid out before the hand
  // wanders, read off the same table the drop consults. The zone itself is
  // the whole column of sky over the station, so the arrow hangs in the air
  // the way the drop does.
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
  // wave7b-assign: the station under a held body wears the same ring, steady
  // -- solid line, no breath and no crawl -- so the offer to retrain reads
  // before the hand commits. At phase 0, fully inset: the line lies on the
  // black of the building where a white line is at its brightest; swelled out
  // it would sit in the white sky, which on this palette is no ring at all.
  // holdTarget is null over a full station: no ring, no deal, one rule, and
  // the ring and the drop read one table in assign.js.
  const hold = holdTarget();
  if (hold) {
    ctx.setLineDash([]);
    auraRing(hold.ring, 0);
  }
  ctx.restore();
}
