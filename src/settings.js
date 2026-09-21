// The settings sheet, which is the held sheet with more on it: the one surface
// that is not the yard. This file wires the shelf; escape, resume and the
// reset's two-click arming are input.js's.

import { setPref, reducedMotion, coarse, dark } from './prefs.js';
import { version } from './version.js';
import { exportSave, importSave, persist, switchSlot } from './persist.js';
import { S } from './state.js';
import { storeTrouble, storeSettled } from './save.js';
import { VEIL_MS, LIGHT_PAPER, DARK_PAPER } from './config.js';
import { showRecord, recordLabel } from './record.js';
import { showSlots, slotsLabel } from './slots.js';
import { showTimes, timesLabel, timesOn, timesName, setTimesName } from './times.js';
import { copyOut } from './copyout.js';
export { copyOut };

const sheet = document.getElementById('held');
const motionEl = document.getElementById('motion');
const said = sheet.querySelector('.said');
const paste = document.getElementById('paste');
const box = document.getElementById('pastebox');
const recordBtn = document.getElementById('recordbtn');
const recordEl = document.getElementById('record');
const slotsBtn = document.getElementById('slotsbtn');
const slotsEl = document.getElementById('slots');
const timesBtn = document.getElementById('timesbtn');
const timesEl = document.getElementById('times');
const boardName = document.getElementById('boardname');

// The sheet's pages: every child carries `data-pane`, a space-separated list
// of the pages it is on. Two fronts (`title`, where the boot stops, and
// `main`, which escape brings up); behind them `record`, `slots` and
// `settings`, written as the page is turned because the record grows behind
// your back and the saves page reads the store. `hold` in input.js opens the
// sheet on a front every time, or the resume button is sometimes not there.
export function showPane(name) {
  for (const el of sheet.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(name);
  paste.hidden = true;                          // folded; asked for again if wanted
  recordBtn.textContent = recordLabel();
  slotsBtn.textContent = slotsLabel();
  timesBtn.textContent = timesLabel();
  // No board, no page: a build nobody pointed at a server has no times button
  // and no name box.
  if (!timesOn()) { timesBtn.hidden = true; boardName.hidden = true; }
  if (name === 'record') showRecord(recordEl);
  if (name === 'slots') showSlots(slotsEl, line => { said.textContent = line; }, switchSlot);
  if (name === 'times') showTimes(timesEl);
  if (name === 'settings') boardName.value = timesName();
}
const back = () => showPane('main');
recordBtn.addEventListener('click', () => showPane('record'));
document.getElementById('recordback').addEventListener('click', back);
slotsBtn.addEventListener('click', () => showPane('slots'));
document.getElementById('slotsback').addEventListener('click', back);
timesBtn.addEventListener('click', () => showPane('times'));
document.getElementById('timesback').addEventListener('click', back);
boardName.addEventListener('change', () => { setTimesName(boardName.value); boardName.value = timesName(); });
document.getElementById('settingsbtn').addEventListener('click', () => showPane('settings'));
document.getElementById('settingsback').addEventListener('click', back);
document.getElementById('titlebtn').addEventListener('click', () => leave('index.html'));

// Leaving the page, for the landing page or the desk's exit: the veil goes up
// and the store takes the last write, and only then does the page go. A
// navigation that did not wait could lose the last second of play.
let leaving = false;
async function leave(to) {
  if (leaving) return;
  leaving = true;
  persist();
  document.getElementById('veil').classList.add('up');
  await Promise.all([storeSettled(), new Promise(r => setTimeout(r, reducedMotion() ? 0 : VEIL_MS))]);
  if (to) location.href = to; else window.close();
}

// The switch says what is in force, not what was pressed: a system asking for
// less motion reads "less" before the switch is ever touched.
function sayMotion() {
  motionEl.textContent = reducedMotion() ? 'motion: less' : 'motion: full';
}

motionEl.addEventListener('click', () => {
  setPref('motion', !reducedMotion());
  sayMotion();
  document.body.classList.toggle('still', reducedMotion());
});

// The thumb switch, the same way: it reads what is in force, so a phone
// reads "on" before it is ever pressed. Everything keyed on a phone -- the
// hop, the sheet, the hover -- asks `coarse()` each frame, so nothing else
// has to be told.
const touchEl = document.getElementById('touch');
function sayTouch() {
  touchEl.textContent = coarse() ? 'touch: on' : 'touch: off';
}
touchEl.addEventListener('click', () => {
  setPref('touch', !coarse());
  sayTouch();
});

// And the dark switch: a desk that asked its system for dark reads "on"
// before the switch is ever touched. Pressing it is a reload, since the
// page's palette is fixed at boot (ink.js): the veil goes up in the color of
// the page that is coming, the page comes back under it and the veil
// lifts, so the change is one fade and not a cut.
const darkEl = document.getElementById('dark');
function sayDark() {
  darkEl.textContent = dark() ? 'dark: on' : 'dark: off';
}
darkEl.addEventListener('click', () => {
  setPref('dark', !dark());
  sayDark();
  document.getElementById('veil').style.background = dark() ? DARK_PAPER : LIGHT_PAPER;
  leave(location.href);
});

// In the Electron shell the save goes out and comes in through native
// dialogs; the clipboard and the paste box are the web page's way.
// `window.desk` is reached here and in save.js and nowhere else in src/.
const desk = () => (typeof window !== 'undefined' && window.desk) || null;

document.getElementById('savecopy').addEventListener('click', async () => {
  const d = desk();
  if (!d) return copyOut(exportSave(), said);
  let took = false;
  try { took = await d.exportTo(exportSave()); } catch {}
  said.textContent = took ? 'saved' : 'not saved';
});

// What the store has to say, said on the sheet when it comes up: each is a run
// about to be lost quietly. `hold` in input.js calls this.
export function sayStore() {
  if (S.fellBack) said.textContent = 'the last save would not load; this is the one before it';
  else if (S.broken) said.textContent = 'your last save could not be read. save a copy hands it over';
  else if (S.yielded) said.textContent = 'this yard is open in another tab; that one is being saved';
  else if (S.unsaved) said.textContent = unsavedLine();
  // Said once: the observer below clears it when the sheet goes down.
  else if (S.newerSave) said.textContent = 'this save is from a newer build (' + S.newerSave + ')';
}

// Blocked and full want different things of the player: blocked is a browser
// setting or the game in its own tab; full is the origin's quota, mostly other
// games' data on a shared host, and the number says so.
const mb = n => (n / 1048576).toFixed(1) + ' mb';
const kb = n => Math.ceil(n / 1024) + ' kb';
export function unsavedLine() {
  const t = storeTrouble();
  if (t?.kind === 'blocked') return 'not saving: your browser blocks storage inside this page. save a copy still works';
  if (t?.kind === 'full') return `not saving: this site's storage is full (${mb(t.used)} used, ${kb(t.ours)} of it ours). save a copy still works`;
  return 'not saving: storage refused the save' + (t ? ' (' + t.name + ')' : '') + '. save a copy still works';
}

// The paste box is asked for rather than always there.
document.getElementById('loadsave').addEventListener('click', async () => {
  const d = desk();
  if (!d) {
    paste.hidden = false;
    said.textContent = '';
    box.focus();
    return;
  }
  // The desk's open dialog hands its text to the same door the paste goes
  // through.
  let raw = null;
  try { raw = await d.importFrom(); } catch {}
  if (raw == null) return;                       // cancelled: nothing to say
  takeIn(raw);
});

// A throw out of the import is not a reason to stop the game: the yard the
// player had is still standing, and the sheet says what happened.
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

// A refusal leaves the box open with the text still in it: the likeliest
// reason is a paste that missed the end.
document.getElementById('loadit').addEventListener('click', () => {
  if (takeIn(box.value)) {
    paste.hidden = true;
    box.value = '';
  }
});

document.getElementById('build').textContent = version();

// Quit, on the desk: `close()` is enough, since the shell opened the window
// and its close handler lets the last autosave land. Off the desk the button
// has no pane, so `showPane` never shows it.
const quitEl = document.getElementById('quit');
if (window.desk) {
  quitEl.dataset.pane = 'main';
  quitEl.hidden = false;
  quitEl.addEventListener('click', () => leave(null));
}

// The sheet is opened by escape in input.js and by the frame keeping it in
// step with `S.paused`, and neither knows about this file, so it watches the
// sheet come up and puts it in order. Guarded because the node yard's
// document has no observers. `sayStore` is asked again here because this
// runs after `hold`'s call and clearing the line would wipe what it said; the
// once-only lines are let go when the sheet goes down.
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (sheet.hidden) { S.fellBack = false; S.newerSave = null; return; }
  sayMotion();
  sayTouch();
  sayDark();
  paste.hidden = true;
  box.value = '';
  said.textContent = '';
  sayStore();
}).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
sayMotion();
sayTouch();
sayDark();

// The mute and the volume. The wake on the first pointer gesture is the one
// line outside audio.js that knows a context exists: the browser allows
// nothing before one. Both are preferences (prefs.js), put in order on open
// by their own observer, guarded like the one above.
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
