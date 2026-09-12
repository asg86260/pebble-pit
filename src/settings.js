// The settings sheet -- which is the held sheet, with more on it.
//
// Settings are not a place. Every board in the yard is somewhere you walked up
// to, and there is nowhere to walk to for "how much should the camera move",
// so the one surface that is already not the yard carries them: the sheet that
// comes up when the game is held. It was a word and a button; now it is also
// the motion switch, the save going out and coming back in, the reset that
// used to stand on the bench, the keys, the build and the one sentence about
// there being no ending. What each of those does is here. What space and
// resume do is still input.js's, and the reset's two-click arming stays there
// with it: this file wires the shelf, not the things that were already wired.

import { setPref, reducedMotion } from './prefs.js';
import { version } from './version.js';
import { exportSave, importSave } from './persist.js';
import { S } from './state.js';

const sheet = document.getElementById('held');
const motionEl = document.getElementById('motion');
const said = sheet.querySelector('.said');
const paste = document.getElementById('paste');
const box = document.getElementById('pastebox');

// The save, out of the browser and into your hand. The clipboard is not
// allowed on every page; when it is not, the text is left where the console
// can reach it, and the sheet says so. Shared with the crashed sheet, which
// hands over the same blob for a worse reason -- one copy of the fallback,
// so the two sheets cannot answer differently.
export async function copyOut(raw, sayEl) {
  if (!raw) { sayEl.textContent = 'nothing saved yet'; return; }
  try {
    await navigator.clipboard.writeText(raw);
    sayEl.textContent = 'copied ' + Math.round(raw.length / 1024) + 'kb';
  } catch {
    window.__save = raw;
    sayEl.textContent = 'in window.__save';
  }
}

// The switch says what is in force, not what was pressed: a player whose
// system asked for less motion reads "less" before ever touching it, and
// pressing it from there is asking for the full picture back.
function sayMotion() {
  motionEl.textContent = reducedMotion() ? 'motion: less' : 'motion: full';
}

motionEl.addEventListener('click', () => {
  setPref('motion', !reducedMotion());
  sayMotion();
});

document.getElementById('savecopy').addEventListener('click', () => copyOut(exportSave(), said));

// What the store has to say, said on the sheet when it comes up (wave-critics,
// A10/A11): a page whose writes are being refused, a page another tab has
// overtaken, a save that would not read and is waiting to be copied out. Each
// is a run about to be lost quietly, and the sheet is the one surface that is
// not the yard. `input.js`'s hold calls this.
export function sayStore() {
  if (S.broken) said.textContent = 'your last save could not be read. save a copy hands it over';
  else if (S.yielded) said.textContent = 'this yard is open in another tab; that one is being saved';
  else if (S.unsaved) said.textContent = 'not saving: storage is blocked or full. save a copy still works';
}

// The paste is asked for rather than always there: six rows of empty box on a
// sheet whose other lines are one word each would be the loudest thing on it.
document.getElementById('loadsave').addEventListener('click', () => {
  paste.hidden = false;
  said.textContent = '';
  box.focus();
});
document.getElementById('nevermind').addEventListener('click', () => {
  paste.hidden = true;
  box.value = '';
});

// Handed over exactly as pasted: a save is a blob and not a sentence, and the
// yard's own check is the one that says whether it is one. A refusal leaves
// the box open with the text still in it, since the likeliest reason is a
// paste that missed the end and the fix is another paste, not a fresh start.
document.getElementById('loadit').addEventListener('click', () => {
  let took = false;
  try {
    took = importSave(box.value);
  } catch (err) {
    // A throw out of the import is not a bad paste and not a reason to stop
    // the game either: the yard the player had is still standing, and the
    // sheet says what happened in the import's own words.
    said.textContent = 'could not load: ' + (err && err.message ? err.message : String(err));
    return;
  }
  if (took) {
    paste.hidden = true;
    box.value = '';
    said.textContent = 'loaded';
  } else {
    said.textContent = 'that is not a save';
  }
});

document.getElementById('build').textContent = version();

// The sheet is opened by two hands -- space in input.js, and the frame keeping
// it in step with `S.paused` -- and neither of them knows about this file. So
// it watches the sheet come up instead of being told, and puts it in order
// each time: the switch reading what is in force now, and nothing left over
// from the last visit.
// (Guarded: input.js imports this file for `sayStore`, and the node yard's
// document has no observers.)
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (sheet.hidden) return;
  sayMotion();
  paste.hidden = true;
  box.value = '';
  said.textContent = '';
}).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
sayMotion();

// wave-desk-sound, track B: the mute. The one line outside audio.js that knows
// a context exists is the wake on the first pointer gesture -- the browser
// allows nothing before one, and audio.js queues nothing before it either.
// The switch itself is a preference and not a fact about the run: it survives
// a reset and does not travel with a save (prefs.js). The switch says what is
// in force, the way the motion switch does, and is put in order on open by its
// own observer, guarded like the one above.
import { pref } from './prefs.js';
import { wakeAudio, muteAudio } from './audio.js';

const soundEl = document.getElementById('sound');
function saySound() {
  soundEl.textContent = pref('muted') ? 'sound: off' : 'sound: on';
}
soundEl.addEventListener('click', () => {
  setPref('muted', !pref('muted'));
  muteAudio(pref('muted'));
  saySound();
});
muteAudio(pref('muted'));
window.addEventListener('pointerdown', wakeAudio, { once: true });
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (!sheet.hidden) saySound();
}).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
saySound();
