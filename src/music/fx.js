// A track's effects chain as data (DESIGN.md, "A track's effects chain"):
// `track.fx` is a list of `{ type, on, params }`, in the order the sound goes
// through them. The table of effects and their knobs is MUSIC_FX; this file
// fills a box's missing knobs with their defaults and says what is wrong with
// a chain, for the bench, the render's plan and the node tier alike.

import { MUSIC_FX } from '../config/music.js';

export const FX_TYPES = Object.keys(MUSIC_FX);

// Every knob of a box, its own value where it has one, else the default.
export function fxParams(box) {
  const spec = MUSIC_FX[box.type]?.params || {}, out = {};
  for (const [k, p] of Object.entries(spec)) out[k] = box.params?.[k] ?? p.def;
  return out;
}

// A new box, switched on, every knob written so the file says what it plays.
export const newFx = (type, params = {}) => ({ type, on: true, params: fxParams({ type, params }) });

// A knob's place along its travel, 0 to 1, and back: what a drag turns.
export function knobPos(p, v) {
  if (p.choices) return Math.max(0, p.choices.indexOf(v)) / Math.max(1, p.choices.length - 1);
  return p.log ? Math.log(v / p.min) / Math.log(p.max / p.min) : (v - p.min) / (p.max - p.min);
}
export function knobValue(p, x) {
  x = Math.max(0, Math.min(1, x));
  if (p.choices) return p.choices[Math.round(x * (p.choices.length - 1))];
  let v = p.log ? p.min * Math.pow(p.max / p.min, x) : p.min + x * (p.max - p.min);
  if (p.step) v = Math.round(v / p.step) * p.step;
  // Two significant decimals is all an ear can tell apart on a knob.
  return Math.round(v * 100) / 100;
}

// What would make a chain unreadable, one line each, named by track.
export function fxProblems(track) {
  const bad = [];
  if (track.fx == null) return bad;
  if (!Array.isArray(track.fx)) return [`${track.id}: fx is not a list`];
  track.fx.forEach((box, i) => {
    const spec = MUSIC_FX[box?.type];
    if (!spec) { bad.push(`${track.id}: effect ${i + 1} is ${box?.type}`); return; }
    for (const [k, v] of Object.entries(box.params || {})) {
      const p = spec.params[k];
      if (!p) bad.push(`${track.id}: ${box.type} has no knob ${k}`);
      else if (p.choices ? !p.choices.includes(v) : !(v >= p.min && v <= p.max))
        bad.push(`${track.id}: ${box.type} ${k} ${v} is out of range`);
    }
  });
  return bad;
}
