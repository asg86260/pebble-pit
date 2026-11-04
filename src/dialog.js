// The story's dialog (DESIGN.md, "A dialog system"): a beat's line, waiting
// for the player. A phase of a beat carries `lines` ([{ who, id }], the ids
// messages in locales/en.ftl); the beat's runner (actbeats.js) asks here for
// the first line not yet read, shows it once the shot has come to rest on its
// speaker, and holds the phase until every line is read. The drawing is
// render/dialog.js's, over the bands.
//
// A line waits for a click, a tap, Enter or the right arrow (`goOn`), and the
// held space bar reads every line of the beat at once (`hearAll`, from the
// beat's `skip`). None of it pauses anything: an act beat owns the camera
// alone, so the yard, the deep and the act's place go on under a waiting line.
//
// What is read is a saved fact (`S.heard`): a line is marked read the moment
// the player goes on from it, so a reload taken while it fades out, or a beat
// played again after a reload, never shows it twice. What is on show now is
// this session's.

// REVIEW dialog-built
import { S } from './state.js';
import { held } from './reset.js';
import { now } from './clock.js';
import { DIALOG_FADE_S } from './config.js';
import { msg } from './lang.js';
import { sauce, typedBy } from './dialogsauce.js'; // MOCK dialog-sauce

let shown = null; // held: the line on show { id, who, args, at, out }, this session's
held('dialog', () => { shown = null; });

export const heard = id => S.heard.includes(id);
const hear = id => { if (!heard(id)) S.heard.push(id); };

// The first line of `lines` not yet read, or null with every one read.
export const lineDue = lines => (lines || []).find(l => !heard(l.id)) || null;

// The line on show, or null: one waiting for the player (not yet gone on
// from) or fading out after.
export const lineShown = () => shown;
// A line up and waiting for the player: what a click goes on from.
export const lineWaiting = () => !!shown && shown.out == null;

// One frame of a phase's lines: the due line put up once `ready` (the shot
// at rest on its speaker) and nothing is fading out; one gone on from let go
// once its fade is done. True while the phase still has a line to show or
// one fading.
export function stepLines(lines, ready, t = now()) {
  if (shown && shown.out != null && (t - shown.out) / 1000 >= DIALOG_FADE_S) shown = null;
  const due = lineDue(lines);
  if (!shown && due && ready) shown = { id: due.id, who: due.who, args: due.args || null, at: t, out: null };
  return !!due || !!shown;
}

// Go on from the line waiting: it is read now, and fades out. False with no
// line waiting, so the click is somebody else's.
export function goOn(t = now()) {
  if (!lineWaiting()) return false;
  // MOCK dialog-sauce: a click while the line types in finishes it
  if (sauce() && !shown.full && !typedBy(msg(shown.id), (t - shown.at) / 1000)) { shown.full = true; return true; }
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

// The line as drawn: its words and speaker, and its opacity -- in over the
// fade from when it went up, out over the fade from when it was gone on from.
export function lineLook(t = now()) {
  if (!shown) return null;
  const k = (t - shown.at) / 1000 / DIALOG_FADE_S;
  const o = shown.out == null ? 1 : 1 - (t - shown.out) / 1000 / DIALOG_FADE_S;
  return { id: shown.id, who: shown.who, args: shown.args, a: Math.max(0, Math.min(1, k, o)),
           u: (t - shown.at) / 1000, full: !!shown.full };   // (MOCK dialog-sauce: how far it has typed)
}

// A new game, or a save read in: nothing on show.
export function forgetLines() { shown = null; }
