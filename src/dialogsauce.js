// MOCK dialog-sauce
// Throwaway review code, never merged: the dialog spruced up (the owner,
// 2026-11-03: "lets add text entrance speed, char by char. some text effects
// on lines of text. i want the two squares to appear in front of god with
// his spotlight on them while the dialog happens"). `globalThis.__dialogSauce`
// picks the option ({ type, light }); null is the game as it is, and a reset
// puts it away. The drawing is render/dialogsauce.js's.
//
// - The typewriter: a line's letters come in one by one at SAUCE_TYPE's pace,
//   each fading in; a click while it types finishes it (dialog.js, `goOn`),
//   the next goes on.
// - The markup: a pair of one mark round words gives them an effect
//   (`FX_MARKS`): `*eternal*` waves, `_work_` shakes, `^paradise^` glows,
//   `~the end~` fades in slowly, and round two `=` `+` `%` `|` `#` `@` give a
//   run of the game's colors, a slow swell, a nervous jitter, a drop in from
//   above, a heavy landing and a drawn-out trail. The marks are not drawn; a
//   line with none is plain.
// - The pair before God: heaven's gates' afterlife end stands on the floor in
//   front of the throne (portals.js), so the souls step out of the gates
//   there, the camera opening on him and them together; his light on them is
//   render/dialogsauce.js's. When the lines end the refusal sends them off on
//   the brisk walk to the pedestal, as it does today.

import { held } from './reset.js';
import { SAUCE_TYPE } from './config.js';

held('dialog-sauce', () => { globalThis.__dialogSauce = null; });

export const sauce = () => globalThis.__dialogSauce || null;

// --- the markup ------------------------------------------------------------------
// Each effect's mark, the same either side of its words, and its name (the
// line editor's cheat sheet reads the same list; what each does is the
// bench's to say, review.html).
export const FX_MARKS = [
  ['*', 'wave'],
  ['_', 'shake'],
  ['^', 'glow'],
  ['~', 'slow'],
  ['=', 'rainbow'],
  ['+', 'pulse'],
  ['%', 'nervous'],
  ['|', 'drop'],
  ['#', 'boom'],
  ['@', 'trail']
];
const MARKS = Object.fromEntries(FX_MARKS);
// A line's words as letters, each with the effect it is under (or null),
// the marks taken out; and the plain words, for the wrap and the measure.
export function parseMarks(text) {
  const out = [];
  let fx = null;
  for (const ch of String(text)) {
    if (MARKS[ch]) { fx = fx === MARKS[ch] ? null : MARKS[ch]; continue; }
    out.push({ ch, fx });
  }
  return { letters: out, plain: out.map(l => l.ch).join('') };
}

// --- the typewriter --------------------------------------------------------------
const pace = () => SAUCE_TYPE[(sauce() && sauce().type) || 'steady'] || SAUCE_TYPE.steady;
// When each letter starts in, seconds into the line, and when the last has
// finished coming in.
// A `#boom#` word comes in whole, its letters at one time, and the line holds
// after it; a `@trail@` word's letters come slower and slower.
export function births(letters) {
  const T = pace(), at = [];
  let t = 0, end = 0, trail = 0;
  letters.forEach((l, i) => {
    const prev = letters[i - 1], next = letters[i + 1];
    if (l.fx === 'boom' && prev && prev.fx === 'boom') t = at[i - 1];
    at.push(t);
    end = Math.max(end, t + letterFade(l));
    trail = l.fx === 'trail' ? trail + 1 : 0;
    let step = 1 / T.cps + (l.ch === ',' ? T.comma : /[.?!]/.test(l.ch) ? T.stop : 0);
    if (l.fx === 'trail') step *= T.trail * (1 + trail * T.trailGrow);
    if (l.fx === 'boom') step = next && next.fx === 'boom' ? 0 : T.boomHold;
    t += step;
  });
  return { at, end };
}
export const letterFade = l => {
  const T = pace();
  return l.fx === 'slow' ? T.slow : l.fx === 'drop' ? T.dropS : l.fx === 'trail' ? T.trailFade : l.fx === 'boom' ? T.boomS : T.fade;
};
// Whether a line `u` seconds up has all its letters in.
export const typedBy = (text, u) => births(parseMarks(text).letters).end <= u;

