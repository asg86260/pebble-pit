// MOCK grove-plant-here
// Where an acorn goes, marked over each bare plot that can take one (the
// owner, reviewing the built grove: "we should put an indicator over the plant
// site where to put a seed"). Three options for the vote, keyed on
// `globalThis.__plantCueMock` ('a', 'b', 'c'; null draws nothing):
//
//   a  a ghost acorn bobbing over the soil bed, the cue's outline and paper
//   b  a dotted acorn outline sitting on the bed, its ink breathing
//   c  a down-arrow over the bed, tapping down as the pointing hand taps
//
// All three are the ghost hand's language (render/aftercues.js): drawn in the
// cue's fine dots, a mid-grey line round paper, at the cue's ink. Each plot's
// mark fades in as the plot comes bare and out as it is planted, and stands at
// full ink while the hand holds an acorn. Throwaway, never merged.

import { GREY, GESTURE_CUE_DOT, GESTURE_CUE_ALPHA, GESTURE_CUE_FADE_S, GESTURE_CUE_TAP_S, AFTER_BLOCK, AFTER_BLOCK_H } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { plotX, groundOf, AP } from '../../after/place.js';
import { trees, plantable } from '../../after/grove.js';
import { heldGoods } from '../../hands.js';
import { held } from '../../reset.js';
import { line } from '../../ink.js';
import { MID, W, K } from './kit.js';   // K, the ink the held line is drawn in

held('plant-cue-mock', () => { globalThis.__plantCueMock = null; });
const mode = () => globalThis.__plantCueMock || null;

const D = GESTURE_CUE_DOT;
// The acorn's cells (render/after/pine.js `ACORN`), stalk, cap and nut.
const ACORN = [[1, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3]];
// The down-arrow, in the cue's dots: a shaft three wide over a head as wide
// as the acorn, narrowing to its point.
const ARROW_ROWS = ['...###...', '...###...', '...###...', '...###...', '...###...', '#########', '.#######.', '..#####..', '...###...', '....#....'];
// A shape of cells as dots: { on: Set of 'i|j', w, h } at `per` dots a cell.
function dots(cells, per) {
  const on = new Set();
  for (const [c, r] of cells) for (let j = 0; j < per; j++) for (let i = 0; i < per; i++) on.add(`${c * per + i}|${r * per + j}`);
  return on;
}
const PER = Math.round(AP / D);
const ACORN_DOTS = dots(ACORN, PER), CAP_DOTS = dots(ACORN.filter(([, r]) => r < 2), PER), ARROW_DOTS = new Set(ARROW_ROWS.flatMap((row, j) => [...row].flatMap((ch, i) => (ch === '#' ? [`${i}|${j}`] : []))));
const edge = (on, i, j) => !on.has(`${i - 1}|${j}`) || !on.has(`${i + 1}|${j}`) || !on.has(`${i}|${j - 1}`) || !on.has(`${i}|${j + 1}`);
// A shape laid with its top left at (x, y): its edge dots in the cue's line,
// its inside paper, the acorn's cap (`cap`) filled in the line's tone so it
// reads as an acorn and not a cross. `dashed` draws every other edge dot and
// the cap in a checker, no paper; `rims` only the edge (the held
// acorn's darker `tone` laid over the cue's).
function lay(on, x, y, { dashed = false, cap = null, rims = false, tone = GREY[MID] } = {}) {
  x = Math.round(x / D) * D; y = Math.round(y / D) * D;
  for (const k of on) {
    const [i, j] = k.split('|').map(Number), rim = edge(on, i, j), inCap = !!cap && cap.has(k);
    if (rim ? dashed && ((i + j) >> 1) % 2 : rims || (dashed && (!inCap || (i + j) % 2))) continue;
    ctx.fillStyle = rim || inCap ? tone : GREY[W];
    ctx.fillRect(x + i * D, y + j * D, D, D);
  }
}

// Each plot's ink, eased toward what it should be (page state: drawing only).
const ink = []; // page: each plot's mark's ink, 0..1
const dark = []; // page: each plot's held-acorn line, 0..1, eased the same way
let lastT = null; // page: the act's clock last drawn, for the ease
export function drawPlantCueMock() {
  const opt = mode(), list = trees();
  if (!opt || !S.after) return;
  const t = S.after.t, dt = lastT == null || t < lastT ? 0 : Math.min(0.25, t - lastT);
  lastT = t;
  const holding = heldGoods()?.kind === 'acorn';
  const top = groundOf('grove') - AP;   // the soil bed's top
  const aw = AFTER_BLOCK.acorn * AP, ah = AFTER_BLOCK_H.acorn * AP;
  list.forEach((p, i) => {
    const want = plantable(i) ? (holding ? 1 : GESTURE_CUE_ALPHA) : 0;
    const was = ink[i] ?? 0;
    ink[i] = was + Math.max(-dt / GESTURE_CUE_FADE_S, Math.min(dt / GESTURE_CUE_FADE_S, want - was));
    const hw = plantable(i) && holding ? 1 : 0, hv = dark[i] ?? 0;
    dark[i] = hv + Math.max(-dt / GESTURE_CUE_FADE_S, Math.min(dt / GESTURE_CUE_FADE_S, hw - hv));
    const a = ink[i];
    if (a <= 0.01) return;
    // the shape at the plot's ink, then its line again in ink as the hand holds an acorn
    const both = (on, x, y, o = {}) => {
      lay(on, x, y, o);
      if (dark[i] <= 0.01) return;
      ctx.save(); ctx.globalAlpha *= dark[i]; lay(on, x, y, { ...o, rims: !o.cap, tone: line(GREY[K]) }); ctx.restore();
    };
    const bx = plotX(i), x0 = bx - aw / 2;
    ctx.save();
    ctx.globalAlpha *= a;
    if (opt === 'a') {
      // over the bed, a cell and a half up, bobbing a cell smoothly
      const bob = (Math.sin(t * 2 * Math.PI / 1.6) + 1) / 2;
      both(ACORN_DOTS, x0, top - ah - AP * 1.5 - bob * AP, { cap: CAP_DOTS });
    } else if (opt === 'b') {
      // sitting on the bed where the acorn goes, its ink breathing between two levels
      ctx.globalAlpha *= 0.7 + 0.3 * (Math.sin(t * 2 * Math.PI / 1.8) + 1) / 2;
      both(ACORN_DOTS, x0, top - ah, { dashed: true, cap: CAP_DOTS });
    } else {
      // over the bed, tapping down two dots on the pointing hand's beat
      const down = (t % GESTURE_CUE_TAP_S) < GESTURE_CUE_TAP_S * 0.4 ? D * 2 : 0;
      const w = ARROW_ROWS[0].length * D, h = ARROW_ROWS.length * D;
      both(ARROW_DOTS, bx - w / 2, top - h - AP * 2 + down);
    }
    ctx.restore();
  });
  ink.length = list.length; dark.length = list.length;
}
export const plantCueInk = () => ink.slice(); // MOCK grove-plant-here  for the shots' check
