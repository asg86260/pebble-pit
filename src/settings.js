// The settings sheet -- which is the held sheet, with more on it.
//
// Settings are not a place. Every board in the yard is somewhere you walked up
// to, and there is nowhere to walk to for "how much should the camera move",
// so the one surface that is already not the yard carries them: the sheet that
// comes up when the game is held. It was a word and a button; now it is also
// the motion switch, the save going out and coming back in, the reset that
// used to stand on the bench, the keys, the build and the one sentence about
// there being no ending. What each of those does is here. What escape and
// resume do is still input.js's, and the reset's two-click arming stays there
// with it: this file wires the shelf, not the things that were already wired.

import { setPref, reducedMotion } from './prefs.js';
import { version } from './version.js';
import { exportSave, importSave } from './persist.js';
import { S } from './state.js';
import { showRecord, recordLabel } from './record.js';
import { showSlots, slotsLabel } from './slots.js';

const sheet = document.getElementById('held');
const motionEl = document.getElementById('motion');
const said = sheet.querySelector('.said');
const paste = document.getElementById('paste');
const box = document.getElementById('pastebox');
const recordBtn = document.getElementById('recordbtn');
const recordEl = document.getElementById('record');
const slotsBtn = document.getElementById('slotsbtn');
const slotsEl = document.getElementById('slots');

// The sheet's pages. Every child carries `data-pane`, a space-separated list
// of the pages it is on, and turning the page is showing the elements whose
// list holds the name and hiding the rest. Two fronts -- `title`, where the
// boot stops, and `main`, which escape brings up -- share everything under
// the rule; behind them are `record`, `slots` and `settings`, each with a
// back that returns to whichever front the sheet was opened on. The fronts
// carry the count and the yard number on their buttons; the pages behind
// carry the lists, written as the page is turned, because the record grows
// behind your back and the saves page reads the store. `hold` in input.js
// opens the sheet on a front every time: a sheet that came up on whichever
// page it went down on would be a sheet whose resume button is sometimes
// not there.
let front = 'main';
export function showPane(name) {
  if (name === 'title' || name === 'main') front = name;
  for (const el of sheet.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(name);
  paste.hidden = true;                          // folded; asked for again if wanted
  recordBtn.textContent = recordLabel();
  slotsBtn.textContent = slotsLabel();
  if (name === 'record') showRecord(recordEl);
  if (name === 'slots') showSlots(slotsEl, line => { said.textContent = line; });
}
export const onFront = () => front;
const back = () => showPane(front);
recordBtn.addEventListener('click', () => showPane('record'));
document.getElementById('recordback').addEventListener('click', back);
slotsBtn.addEventListener('click', () => showPane('slots'));
document.getElementById('slotsback').addEventListener('click', back);
document.getElementById('settingsbtn').addEventListener('click', () => showPane('settings'));
document.getElementById('settingsback').addEventListener('click', back);
// The way back out of a yard: the sheet turns to the title front and nothing
// else happens -- the yard stays held behind it, and play is resume by
// another name.
document.getElementById('titlebtn').addEventListener('click', () => showPane('title'));

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

// The desk (wave-desk-sound, track A): in the Electron shell the save goes
// out through a native save dialog and comes back through an open dialog,
// and the clipboard and the paste box are the web page's way. Two branches
// and no third surface; `window.desk` is reached here and in save.js and
// nowhere else in src/.
const desk = () => (typeof window !== 'undefined' && window.desk) || null;

document.getElementById('savecopy').addEventListener('click', async () => {
  const d = desk();
  if (!d) return copyOut(exportSave(), said);
  let took = false;
  try { took = await d.exportTo(exportSave()); } catch {}
  said.textContent = took ? 'saved' : 'not saved';
});

// What the store has to say, said on the sheet when it comes up (wave-critics,
// A10/A11): a page whose writes are being refused, a page another tab has
// overtaken, a save that would not read and is waiting to be copied out. Each
// is a run about to be lost quietly, and the sheet is the one surface that is
// not the yard. `input.js`'s hold calls this.
export function sayStore() {
  if (S.fellBack) said.textContent = 'the last save would not load; this is the one before it';
  else if (S.broken) said.textContent = 'your last save could not be read. save a copy hands it over';
  else if (S.yielded) said.textContent = 'this yard is open in another tab; that one is being saved';
  else if (S.unsaved) said.textContent = 'not saving: storage is blocked or full. save a copy still works';
  // A save from a build newer than this one is loaded, not refused, and said
  // once: the sheet's observer below clears it when the sheet goes down.
  else if (S.newerSave) said.textContent = 'this save is from a newer build (' + S.newerSave + ')';
}

// The paste is asked for rather than always there: six rows of empty box on a
// sheet whose other lines are one word each would be the loudest thing on it.
document.getElementById('loadsave').addEventListener('click', async () => {
  const d = desk();
  if (!d) {
    paste.hidden = false;
    said.textContent = '';
    box.focus();
    return;
  }
  // The desk's way: an open dialog, and the file's text handed to the same
  // door the paste goes through, with the same three answers.
  let raw = null;
  try { raw = await d.importFrom(); } catch {}
  if (raw == null) return;                       // cancelled: nothing to say
  takeIn(raw);
});

// The blob into the yard, by whichever route it arrived, and the sheet told
// which of the three things happened. A throw out of the import is not a bad
// blob and not a reason to stop the game either: the yard the player had is
// still standing, and the sheet says what happened in the import's own words.
function takeIn(raw) {
  let took = false;
  try {
    took = importSave(raw);
  } catch (err) {
    said.textContent = 'could not load: ' + (err && err.message ? err.message : String(err));
    return false;
  }
  said.textContent = took ? 'loaded' : 'that is not a save';
  return took;
}
document.getElementById('nevermind').addEventListener('click', () => {
  paste.hidden = true;
  box.value = '';
});

// Handed over exactly as pasted: a save is a blob and not a sentence, and the
// yard's own check is the one that says whether it is one. A refusal leaves
// the box open with the text still in it, since the likeliest reason is a
// paste that missed the end and the fix is another paste, not a fresh start.
document.getElementById('loadit').addEventListener('click', () => {
  if (takeIn(box.value)) {
    paste.hidden = true;
    box.value = '';
  }
});

document.getElementById('build').textContent = version();

// Quit, on the desk. The page cannot close a window it did not open, except
// the one the shell opened for it -- so `close()` is the whole of it, and the
// shell's close handler writes the window down and lets the last autosave
// land. Off the desk the button has no pane, so `showPane` never shows it:
// a browser tab has its own way out.
const quitEl = document.getElementById('quit');
if (window.desk) {
  quitEl.dataset.pane = 'title main';
  quitEl.hidden = false;
  quitEl.addEventListener('click', () => window.close());
}

// The sheet is opened by two hands -- escape in input.js, and the frame keeping
// it in step with `S.paused` -- and neither of them knows about this file. So
// it watches the sheet come up instead of being told, and puts it in order
// each time: the switch reading what is in force now, and nothing left over
// from the last visit.
// (Guarded: input.js imports this file for `sayStore`, and the node yard's
// document has no observers.)
//
// It is also the hand that says what the store has to say. `hold` in input.js
// calls `sayStore` as it opens the sheet, but this observer runs after that
// call, and clearing the line here wiped what it had just said -- so the store
// is asked again once the sheet is in order. And the two lines that are said
// once -- the desk's fallback, a save from a newer build -- are let go when
// the sheet goes down, which is what "once" means on a surface that can be
// opened again.
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (sheet.hidden) { S.fellBack = false; S.newerSave = null; return; }
  sayMotion();
  paste.hidden = true;
  box.value = '';
  said.textContent = '';
  sayStore();
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
import { wakeAudio, muteAudio, setVolume } from './audio.js';

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
// The slider writes the preference on every move and the level follows; it
// reads the preference back when the sheet opens, the way the switches do.
const volumeEl = document.getElementById('volume');
volumeEl.addEventListener('input', () => {
  setPref('volume', +volumeEl.value);
  setVolume(pref('volume'));
});
setVolume(pref('volume'));
window.addEventListener('pointerdown', wakeAudio, { once: true });
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (!sheet.hidden) { saySound(); volumeEl.value = pref('volume'); }
}).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
saySound();
volumeEl.value = pref('volume');
