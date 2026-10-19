// The settings sheet, which is the held sheet with more on it: the one surface
// that is not the yard. This file wires the shelf; escape and resume are
// input.js's.

import { pref, setPref, reducedMotion, coarse, theme, nextTheme } from './prefs.js';
import { version } from './version.js';
import { exportSave, importSave, persist, switchSlot, restore, bootYard, reset } from './persist.js';
import { S } from './state.js';
import { storeTrouble, storeSettled, openSlot, slotRaw } from './save.js';
import { VEIL_MS, LIGHT_PAPER, DARK_PAPER, DEEP_PAPER, TOAST_MS } from './config.js';
import { showRecord, recordLabel } from './record.js';
import { showSlots, slotsLabel } from './slots.js';
import { fillControls } from './controls.js';
import { showIndex, sayIndexButton, leaveEntry } from './indexpage.js';
import './focusmark.js';   // the keyboard's focus, drawn as the pad's brackets
import { copyOut } from './copyout.js';
import { showCloud, CLOUD_LOOK_MS } from './cloudsheet.js';
import { cloudReady, cloudStatus } from './cloud.js';
import { cloudNoticeDue } from './notices.js';
import { msg } from './lang.js';
import { mountReadable, sayReadable } from './readable.js';
import { fillLanguages } from './langpage.js';
import { focusFirstRow, mountTabs } from './settingstabs.js';
import { feedbackReady } from './feedback.js';
import { mountFeedback } from './feedbackform.js';
import { showWardrobe, leaveWardrobe, wardrobeOpener } from './wardrobepage.js';
// input.js imports this file; `hold` is a declaration, so it is there to
// call however the ring is entered.
import { hold } from './input.js';
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
const indexBtn = document.getElementById('indexbtn');
const indexEl = document.getElementById('index');
const cloudEl = document.getElementById('cloudsheet');
const fbBtn = document.getElementById('fbbtn');

// The sheet's pages: every child carries `data-pane`, a space-separated list
// of the pages it is on. Two fronts (`title`, where the boot stops, and
// `main`, which escape brings up); behind them `record`, `slots` and
// `settings`, written as the page is turned because the record grows behind
// your back and the saves page reads the store. A yard opened from the saves
// page turns back to the front: the thing to do next is resume it. `hold` in
// input.js opens the sheet on a front every time, or the resume button is
// sometimes not there.
let paneNow = 'main';
// The page the sheet is on, for the `i` key: pressed on the index it closes.
export const pane = () => paneNow;
export function showPane(name) {
  paneNow = name;
  // The feedback button is on the front, under settings, only where the
  // build has a worker to send to: asked as the page turns, so a check can
  // point it.
  fbBtn.dataset.pane = feedbackReady() ? 'main' : '';
  for (const el of sheet.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(name);
  paste.hidden = true;                          // folded; asked for again if wanted
  recordBtn.textContent = recordLabel();
  slotsBtn.textContent = slotsLabel();
  sayIndexButton(indexBtn);
  if (name === 'record') showRecord(recordEl);
  // The two of them's picker: off the house's board, or once at a new yard (`offerDress`).
  if (name === 'wardrobe') showWardrobe(document.getElementById('wardrobe'), { start: dressing, leave: () => hold(false) });
  dressing = false;
  if (name === 'index') showIndex(indexEl);
  // A new form every time the page is turned to: the tick off, the words the
  // draft, the save the open slot's blob as the store holds it now.
  if (name === 'feedback') mountFeedback(document.getElementById('fbform'), { page: 'game', raw: () => slotRaw(openSlot()), back: document.getElementById('fbback') });
  if (name === 'slots') {
    // Deleting the open slot is the reset it replaced: a new yard, standing.
    // A slot opened empty, or the open one deleted, is a new yard: the
    // picker is offered as it is at a first boot.
    showSlots(slotsEl, line => { said.textContent = line; }, n => { switchSlot(n); back(); offerDress(); }, true, () => { reset(); offerDress(); });
    showCloud(cloudEl, line => { said.textContent = line; }, { took: tookCloud });
  }
}
const back = () => showPane('main');
recordBtn.addEventListener('click', () => showPane('record'));
document.getElementById('recordback').addEventListener('click', back);
indexBtn.addEventListener('click', () => showPane('index'));
document.getElementById('indexback').addEventListener('click', () => { if (!leaveEntry(indexEl)) back(); });
slotsBtn.addEventListener('click', () => showPane('slots'));
document.getElementById('slotsback').addEventListener('click', back);
// Opened by a key or the pad (a click with no pointer count), the focus goes
// to the first row of the tab in force, so the next press goes on from there.
document.getElementById('settingsbtn').addEventListener('click', e => {
  showPane('settings');
  if (!e.detail) focusFirstRow(sheet);
});
document.getElementById('settingsback').addEventListener('click', back);
fillControls(document.getElementById('controlslist'));
// The settings' tabs (settingstabs.js): graphics, audio, controls and the
// languages, each a tab's rows on the one page.
mountTabs(sheet);
// A pick of another language is a reload, as the dark switch's is, since
// every module reads its words at load; the one in force is a pick of
// nothing.
fillLanguages(document.getElementById('langlist'), { reload: () => leave(location.href), stay: () => {} });
// The two of them, a page of the sheet of its own, brought up over the yard
// by the house board's row (crewboard.js). Its way back is the yard again.
wardrobeOpener(() => { hold(true); showPane('wardrobe'); });
document.getElementById('wardrobeback').addEventListener('click', () => leaveWardrobe());
let dressing = false;
// Once, at a new yard: the sheet up on the page's steps (who you are, your
// square, your sqouse, the two of you) before the opening walks out, the
// yard held under it. Done or skip lets it go, and only then is it offered;
// a reload in the middle offers it again. Not under a browser
// driven by the checks or the tools, whose every yard is new, unless asked
// for by name (`force`, the scene that shoots it).
export function offerDress(force = false) {
  if (S.dressOffered || S.naming || (!force && typeof navigator !== 'undefined' && navigator.webdriver)) return;
  hold(true);
  dressing = true;
  showPane('wardrobe');
}
fbBtn.addEventListener('click', () => showPane('feedback'));
document.getElementById('fbback').addEventListener('click', back);
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
  motionEl.textContent = reducedMotion() ? msg('set-motion-less') : msg('set-motion-full');
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
  touchEl.textContent = coarse() ? msg('set-touch-on') : msg('set-touch-off');
}
touchEl.addEventListener('click', () => {
  setPref('touch', !coarse());
  dispatchEvent(new Event('resize'));          // the yard's zoom follows the thumb
  sayTouch();
});

// And the dark switch, stepping light, dim, dark (prefs.js, `theme`): a desk
// that asked its system for dark reads "on" before the switch is ever
// touched. Pressing it is a reload, since the page's palette is fixed at boot
// (ink.js): the veil goes up in the color of the page that is coming, the
// page comes back under it and the veil lifts, so the change is one fade and
// not a cut.
const darkEl = document.getElementById('dark');
const THEME_WORD = { light: 'set-dark-off', dim: 'set-dark-dim', dark: 'set-dark-on' };
const THEME_PAPER = { light: LIGHT_PAPER, dim: DEEP_PAPER, dark: DARK_PAPER };
function sayDark() {
  darkEl.textContent = msg(THEME_WORD[theme()]);
}
darkEl.addEventListener('click', () => {
  setPref('theme', nextTheme());
  sayDark();
  document.getElementById('veil').style.background = THEME_PAPER[theme()];
  leave(location.href);
});

// The readable-text switch turns the page in place (readable.js).
const readableEl = document.getElementById('readable');
mountReadable(readableEl);

// In the Electron shell the save goes out and comes in through native
// dialogs; the clipboard and the paste box are the web page's way.
// `window.desk` is reached here and in save.js and nowhere else in src/.
const desk = () => (typeof window !== 'undefined' && window.desk) || null;

document.getElementById('savecopy').addEventListener('click', async () => {
  const d = desk();
  if (!d) return copyOut(exportSave(), said);
  let took = false;
  try { took = await d.exportTo(exportSave()); } catch {}
  said.textContent = took ? msg('said-saved') : msg('said-notsaved');
});

// What the store has to say, said on the sheet when it comes up: each is a run
// about to be lost quietly. `hold` in input.js calls this.
export function sayStore() {
  if (S.fellBack) said.textContent = msg('said-fellback');
  else if (S.broken) said.textContent = msg('said-broken');
  else if (S.yielded) said.textContent = msg('said-yielded');
  else if (S.unsaved) said.textContent = unsavedLine();
  // Said once: the observer below clears it when the sheet goes down.
  else if (S.newerSave) said.textContent = msg('said-newer', { build: S.newerSave });
}

// Blocked and full want different things of the player: blocked is a browser
// setting or the game in its own tab; full is the origin's quota, mostly other
// games' data on a shared host, and the number says so.
const mb = n => (n / 1048576).toFixed(1);
const kb = n => Math.ceil(n / 1024);
export function unsavedLine() {
  const t = storeTrouble();
  if (t?.kind === 'blocked') return msg('said-unsaved-blocked');
  if (t?.kind === 'full') return msg('said-unsaved-full', { used: mb(t.used), ours: kb(t.ours) });
  return t ? msg('said-unsaved-refused', { name: t.name }) : msg('said-unsaved-refused-why');
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
  if (takeIn(raw)) back();
});

// A throw out of the import is not a reason to stop the game: the yard the
// player had is still standing, and the sheet says what happened.
function takeIn(raw) {
  let took = false;
  try {
    took = importSave(raw);
  } catch (err) {
    said.textContent = msg('said-couldnotload', { message: err && err.message ? err.message : String(err) });
    return false;
  }
  said.textContent = took ? msg('said-loaded') : msg('said-notasave');
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
    box.value = '';
    back();
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
  sayReadable(readableEl);
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
import { wakeAudio, muteAudio, setVolume } from './audio.js';

const soundEl = document.getElementById('sound');
function saySound() {
  soundEl.textContent = pref('muted') ? msg('set-sound-off') : msg('set-sound-on');
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
// Captured, so the press that wakes it is heard: bubbling, the canvas took
// the swing before the context existed. And on every press, not once: a
// context the browser suspended later (a phone's call, a hidden tab) is
// resumed by the next gesture, which `wakeAudio` does when already awake.
window.addEventListener('pointerdown', wakeAudio, { capture: true });
if (typeof MutationObserver !== 'undefined') new MutationObserver(() => {
  if (!sheet.hidden) { saySound(); volumeEl.value = pref('volume'); }
}).observe(sheet, { attributes: true, attributeFilter: ['hidden'] });
saySound();
volumeEl.value = pref('volume');

// --- the cloud, in play (docs/wave-cloud.md, "The face") -------------------------
// The open yard taken from the cloud is in the store, not on the glass: the
// standing yard is read back from it the way a slot switch reads one, and
// without the persist first that `switchSlot` makes, which would write the
// yard being replaced over the one just taken.
function tookCloud(n, side) {
  if (side !== 'cloud' || n !== openSlot()) return;
  restore();
  bootYard();
  back();
}

// Another device is ahead on this yard: said once, as a card at the top edge
// in the toast's own shape, and pressing it opens the saves page, where the
// answer is. Not the toast itself, which says only the record's notices and
// opens the record. Asked on the foot bar's slow beat: the yard plays on
// either way, so a few seconds late is nothing.
const cloudNote = document.createElement('button');
cloudNote.type = 'button';
cloudNote.className = 'toast';
cloudNote.hidden = true;
// appendChild, not append: the node yard's page stand-in has only the one.
cloudNote.appendChild(Object.assign(document.createElement('div'), { className: 'name', textContent: msg('note-cloud-name') }));
cloudNote.appendChild(Object.assign(document.createElement('div'), { className: 'note', textContent: msg('note-cloud-note') }));
document.body.appendChild(cloudNote);
let noteDown = 0;
function dropCloudNote() {
  clearTimeout(noteDown);
  cloudNote.classList.remove('up');
  if (cloudNote.classList.contains('still')) cloudNote.hidden = true;
}
cloudNote.addEventListener('transitionend', () => { if (!cloudNote.classList.contains('up')) cloudNote.hidden = true; });
cloudNote.addEventListener('click', () => {
  dropCloudNote();
  hold(true);
  showPane('slots');
});
// Unref'd where the timer is node's: the node yard loads this page's modules,
// and a live interval would keep its test process from ever exiting.
setInterval(() => {
  if (!cloudReady() || !cloudNoticeDue(cloudStatus().state)) return;
  cloudNote.classList.toggle('still', reducedMotion());
  cloudNote.hidden = false;
  void cloudNote.offsetWidth;          // hidden off and up on in one pass would skip the slide
  cloudNote.classList.add('up');
  noteDown = setTimeout(dropCloudNote, TOAST_MS);
}, CLOUD_LOOK_MS)?.unref?.();
