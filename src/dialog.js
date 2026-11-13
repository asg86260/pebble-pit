// The story's dialog (DESIGN.md, "A dialog system"): a beat's line, waiting
// for the player. A phase of a beat carries `lines` ([{ who, id }], the ids
// messages in locales/en.ftl); the beat's runner (actbeats.js) asks here for
// the first line not yet read, shows it once the shot has come to rest on its
// speaker, and holds the phase until every line is read. The drawing is
// render/dialog.js's, over the bands.
//
// A line types in a letter at a time (`lineTyping`); a click, a tap, Enter or
// the right arrow while it types finishes it, and on a finished line goes on
// (`goOn`). The held space bar reads every line of the beat at once
// (`hearAll`, from the beat's `skip`). None of it pauses anything: an act
// beat owns the camera alone, so the yard, the deep and the act's place go on
// under a waiting line. Under reduced motion a line comes up whole.
//
// What is read is a saved fact (`S.heard`): a line is marked read the moment
// the player goes on from it, so a reload taken while it fades out, or a beat
// played again after a reload, never shows it twice. What is on show now is
// this session's.

// REVIEW dialog-built
// REVIEW god-speaks
import { S } from './state.js';
import { held } from './reset.js';
import { now } from './clock.js';
import { msg } from './lang.js';
import { reducedMotion } from './prefs.js';
import { DIALOG_FADE_S, DIALOG_FX as FX } from './config.js';

let shown = null; // held: the line on show { id, who, args, at, out, full }, this session's
let markTry = null; // held: the review bench's effect for `^` (`tryMark`), null drawn plain
let autoGo = null;  // held: the review bench's seconds a typed line waits before going on by itself
held('dialog', () => { shown = null; markTry = null; autoGo = null; });

export const heard = id => S.heard.includes(id);
const hear = id => { if (!heard(id)) S.heard.push(id); };

// The first line of `lines` not yet read, or null with every one read.
export const lineDue = lines => (lines || []).find(l => !heard(l.id)) || null;

// The line on show, or null: one waiting for the player (not yet gone on
// from) or fading out after.
export const lineShown = () => shown;
// A line up and waiting for the player: what a click goes on from.
export const lineWaiting = () => !!shown && shown.out == null;

const wordsOf = l => (l.args ? msg(l.id, l.args) : msg(l.id));
// Whether the line on show has all its letters in at `t`.
const typedAt = t => !!shown && (shown.full || reducedMotion() || lineTyping(wordsOf(shown)).end <= (t - shown.at) / 1000);

// One frame of a phase's lines: the due line put up once `ready` (the shot
// at rest on its speaker) and nothing is fading out; one gone on from let go
// once its fade is done. True while the phase still has a line to show or
// one fading.
export function stepLines(lines, ready, t = now()) {
  if (shown && shown.out != null && (t - shown.out) / 1000 >= DIALOG_FADE_S) shown = null;
  const due = lineDue(lines);
  if (!shown && due && ready) shown = { id: due.id, who: due.who, args: due.args || null, at: t, out: null, full: false };
  if (autoGo != null && lineWaiting() && typedAt(t - autoGo * 1000)) goOn(t);
  return !!due || !!shown;
}

// Go on from the line waiting: one still typing in is finished, one typed is
// read now and fades out. False with no line waiting, so the click is
// somebody else's.
export function goOn(t = now()) {
  if (!lineWaiting()) return false;
  if (!typedAt(t)) { shown.full = true; return true; }
  hear(shown.id);
  shown.out = t;
  return true;
}

// Every line of `lines` read at once (the held space bar), the one on show
// faded out.
export function hearAll(lines, t = now()) {
  for (const l of lines || []) hear(l.id);
  if (shown && shown.out == null) shown.out = t;
}

// The line as drawn: its words and speaker, its opacity -- in over the fade
// from when it went up, out over the fade from when it was gone on from --
// how far it has typed in (`u` seconds up), and whether it is all in.
export function lineLook(t = now()) {
  if (!shown) return null;
  const k = (t - shown.at) / 1000 / DIALOG_FADE_S;
  const o = shown.out == null ? 1 : 1 - (t - shown.out) / 1000 / DIALOG_FADE_S;
  return { id: shown.id, who: shown.who, args: shown.args, a: Math.max(0, Math.min(1, k, o)),
           u: (t - shown.at) / 1000, full: typedAt(t) };
}

// --- the marks ------------------------------------------------------------------
// The marks the owner writes round words in a line (locales/en.ftl), the
// same mark either side, and the effect the words between are drawn with
// (render/dialog.js). `^` has no effect of its own: its words are drawn
// plain until the owner picks one (the review bench tries them, `tryMark`).
export const LINE_MARKS = { '*': 'wave', '_': 'shake', '^': null, '~': 'slow', '=': 'tone', '+': 'pulse',
                            '%': 'nervous', '|': 'drop', '#': 'boom', '@': 'trail' };
// A mark opens only at a word's start (the line's start, a space or an
// opening bracket or quote before it, a letter after it) and closes only at
// a word's end (a letter before it, the line's end, a space or punctuation
// after it), so a mark character used as itself -- `5+3`, `50% off`, `a | b`,
// a lone `#1` -- is never taken for one.
const opens = (s, i) => (i === 0 || /[\s("'[]/.test(s[i - 1])) && i + 1 < s.length && !/\s/.test(s[i + 1]);
const closes = (s, j) => !/\s/.test(s[j - 1]) && (j + 1 === s.length || /[\s.,!?;:'")\]]/.test(s[j + 1]));

// A line's words as runs [{ text, fx }], the marks taken out: `fx` the
// effect a run is under, or null. A line with no marks is one plain run.
export function lineRuns(text) {
  const s = String(text), runs = [];
  const put = (str, fx) => {
    const last = runs[runs.length - 1];
    if (last && last.fx === fx) last.text += str; else if (str) runs.push({ text: str, fx });
  };
  for (let i = 0; i < s.length;) {
    const m = s[i];
    if (m in LINE_MARKS && opens(s, i)) {
      let j = s.indexOf(m, i + 2);
      while (j > 0 && !closes(s, j)) j = s.indexOf(m, j + 1);
      if (j > 0) { put(s.slice(i + 1, j), m === '^' ? markTry : LINE_MARKS[m]); i = j + 1; continue; }
    }
    put(m, null);
    i++;
  }
  return runs;
}

// --- the typewriter --------------------------------------------------------------
// A letter's own fade in, by its effect.
export const letterFade = fx => (fx === 'slow' ? FX.slow : fx === 'drop' ? FX.dropS : fx === 'trail' ? FX.trailFade
  : fx === 'boom' ? FX.boomS : FX.fade);
// The line typed: its letters (the marks out) each with its effect, when each
// starts in (seconds into the line), and when the last is all in. A `boom`
// word comes in whole and the line holds after it; a `trail` word's letters
// come slower and slower.
export function lineTyping(text) {
  const runs = lineRuns(text);
  const letters = runs.flatMap(r => r.text.split('').map(ch => ({ ch, fx: r.fx })));
  const at = [];
  let t = 0, end = 0, trail = 0;
  letters.forEach((l, i) => {
    const prev = letters[i - 1], next = letters[i + 1];
    if (l.fx === 'boom' && prev && prev.fx === 'boom') t = at[i - 1];
    at.push(t);
    end = Math.max(end, t + letterFade(l.fx));
    trail = l.fx === 'trail' ? trail + 1 : 0;
    let step = 1 / FX.cps + (l.ch === ',' ? FX.comma : /[.?!]/.test(l.ch) ? FX.stop : 0);
    if (l.fx === 'trail') step *= FX.trail * (1 + trail * FX.trailGrow);
    if (l.fx === 'boom') step = next && next.fx === 'boom' ? 0 : FX.boomHold;
    t += step;
  });
  return { runs, letters, plain: letters.map(l => l.ch).join(''), at, end };
}

// --- the review bench ("act 3: God speaks") ----------------------------------------
// The effect `^` is drawn with while the owner chooses, null plain; the line
// on show typed in again from its first letter, so the effect is seen
// arriving; and typed lines going on by themselves `s` seconds after they
// are in, null for a click.
export const tryMark = fx => { markTry = fx; };
export const retype = (t = now()) => { if (shown && shown.out == null) { shown.at = t; shown.full = false; } };
export const autoRead = s => { autoGo = s; };

// A new game, or a save read in: nothing on show.
export function forgetLines() { shown = null; }
