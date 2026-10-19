// The pair's speech bubbles (docs/mocks/act3-place-2026-10-18, section 3,
// pedestal C): while the two of them stand on the pillar a bubble goes up off
// a speaker's head every AFTER_BUBBLE_EVERY_S, rises, holds and fades; every
// and the bubbles come at uneven intervals and in mixed sizes, the big ones
// (about one in AFTER_BUBBLE_BIG_EVERY) twice the size and quicker, each with
// a symbol in it and never a word (the owner, 2026-10-18). This module
// is the bubbles as facts -- where each is, how inked, whether it has been
// taken -- for the drawing (render/after/pedestal.js) and for whatever makes
// them clickable (`bubbleAt`, `takeBubble`). This session's only, like the
// heap's falling grains: a bubble is a moment, not a holding.

import { P, AFTER_BUBBLE_EVERY_S, AFTER_BUBBLE_LIFE_S, AFTER_BUBBLE_RISE, AFTER_BUBBLE_HOLD,
         AFTER_BUBBLE_BIG_EVERY, AFTER_BUBBLE_BIG_RISE, AFTER_BUBBLE_POP_S, AFTER_BUBBLE_GAP, AFTER_BUBBLE_MID_SHARE,
         AFTER_BUBBLE_MID, WORKER } from '../config.js';
import { S } from '../state.js';
import { speakerAt } from './place.js';
import { pairBuilding } from './build.js';
import { secs } from './util.js';
import { useBubbles } from './gestures.js';

// A bubble's size, small and big, in px: the mock's 36 by 20 box and its tail.
const W = 36, H = 20, BIG = 2;
// How far over a speaker's head one starts.
const LIFT = 30;

let list = [], made = 0, clock = 0, nextId = 1;
export const forgetBubbles = () => { list = []; made = 0; clock = 0; };
// A fixed number in [0, 1) for the n-th bubble and a salt: its size, its
// symbol and the gap before the next all read off it, so the run of them is
// uneven and still the same every time.
const roll = (n, salt) => { const v = Math.sin((n + 1) * 12.9898 + salt * 78.233) * 43758.5453; return v - Math.floor(v); };
export const SYMBOLS = ['shout', 'ask', 'fist'];
const gapAt = n => AFTER_BUBBLE_EVERY_S * (AFTER_BUBBLE_GAP[0] + roll(n, 3) * (AFTER_BUBBLE_GAP[1] - AFTER_BUBBLE_GAP[0]));

// Whether the pair are up there to speak: not the story's pair anywhere but
// on the pillar's top (at its foot, or climbing), and not down building.
export const pairSpeaking = () => {
  const pair = S.acts && S.acts.pair;
  return !!S.after && !(pair && pair.y < 0 && pair.at !== 'pedestal') && !pairBuilding();
};

// One more off speaker `k`'s head, now.
export function sendBubble(k = made % 2) {
  if (!S.after) return null;
  const r = roll(made, 1), big = r < 1 / AFTER_BUBBLE_BIG_EVERY;
  const s = big ? BIG : r < 1 / AFTER_BUBBLE_BIG_EVERY + AFTER_BUBBLE_MID_SHARE ? AFTER_BUBBLE_MID : 1;
  const at = speakerAt(k);
  const b = { id: nextId++, k, big, s, sym: SYMBOLS[Math.floor(roll(made, 2) * SYMBOLS.length)], born: S.after.t, taken: null,
              x: Math.round((at.x + P - (s - 1) * W / 2) / 2) * 2, y0: at.y - WORKER - LIFT - (s - 1) * H };
  made++;
  list.push(b);
  return b;
}

const rise = b => (b.big ? AFTER_BUBBLE_RISE * AFTER_BUBBLE_BIG_RISE : AFTER_BUBBLE_RISE);
const life = b => (b.big ? AFTER_BUBBLE_LIFE_S / AFTER_BUBBLE_BIG_RISE : AFTER_BUBBLE_LIFE_S);
// A bubble as it stands now: its box in world px (y on whole pixels, held to
// the pixel so it never shimmers), its ink, and whether it can still be taken.
function look(b, t) {
  const age = t - b.born, k = age / life(b), s = b.s || (b.big ? BIG : 1);
  let a = k < AFTER_BUBBLE_HOLD ? 1 : Math.max(0, 1 - (k - AFTER_BUBBLE_HOLD) / (1 - AFTER_BUBBLE_HOLD));
  if (b.taken != null) a *= Math.max(0, 1 - (t - b.taken) / AFTER_BUBBLE_POP_S);
  return { id: b.id, big: b.big, sym: b.sym || 'shout', x: b.x, y: Math.round(b.y0 - age * rise(b)), w: W * s, h: H * s, scale: s, alpha: a,
           open: b.taken == null && a > 0, age };
}
export const bubbles = () => (S.after ? list.map(b => look(b, S.after.t)) : []);
// The bubble under a world point, still up and not yet taken: the newest on top.
export function bubbleAt(x, y) {
  const all = bubbles();
  for (let i = all.length - 1; i >= 0; i--) {
    const b = all[i];
    if (b.open && x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return b;
  }
  return null;
}
// Take bubble `id`: it fades out over AFTER_BUBBLE_POP_S (nothing pops) and
// cannot be taken twice. What it is worth is the taker's to say.
export function takeBubble(id) {
  const b = list.find(q => q.id === id && q.taken == null);
  if (!b || !S.after) return null;
  b.taken = S.after.t;
  return look(b, S.after.t);
}

// The hand pops them (gestures.js): the bubbles still up to be taken, and a
// pop that takes one -- what it pays is the gesture's to say. Handed over on
// the first frame rather than at load, since gestures.js reaches this file
// back round the act's imports.
let handed = false;
// One frame: a bubble sent on the clock while the pair can speak, and the
// faded ones let go.
export function stepBubbles(c) {
  if (!handed) { useBubbles({ list: () => bubbles().filter(b => b.open), pop: b => !!(b && takeBubble(b.id)) }); handed = true; }
  if (!S.after) return;
  const t = S.after.t;
  if (pairSpeaking()) {
    clock += secs(c);
    const gap = gapAt(made);
    if (clock >= gap) { clock -= gap; sendBubble(); }
  }
  list = list.filter(b => look(b, t).alpha > 0);
}
