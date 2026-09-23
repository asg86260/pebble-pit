// The landing page (DESIGN.md, "The landing page"): the menu column beside a
// frame running `play.html?demo`. Nothing here runs a yard: `play` opens
// play.html on the open slot, and everything else is read off and written to
// the store directly (save.js).

import { primeStore, openSlot, setSlot, slotRaw, clear, saveRaw, savePrev, isSave, storeSettled } from './save.js';
import { playLabel, slotsLabel, showSlots } from './slots.js';
import { recordListOf, recordLabelOf, showRecord } from './record.js';
import { timesOn, showTimes } from './timesboard.js';
import { pref, setPref, reducedMotion, dark } from './prefs.js';
import { version } from './version.js';
import { copyOut } from './copyout.js';
import { VEIL_MS, PICTURE_WAIT_MS, PICTURE_UP, LIGHT_PAPER, DARK_PAPER } from './config.js';

const col = document.querySelector('.col');
const said = document.getElementById('said');
const paste = document.getElementById('paste');
const box = document.getElementById('pastebox');
const say = line => { said.textContent = line; };

// The open slot's blob, parsed, or null. Read again each time, because the
// saves page changes which slot is open.
function opened() {
  const raw = slotRaw(openSlot());
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// The column's pages, told apart by `data-pane` as the held sheet's are
// (settings.js): a space-separated list, shown when it holds the name.
function showPane(name) {
  for (const el of col.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(name);
  paste.hidden = true;
  say('');
  front();
  if (name === 'slots') showSlots(document.getElementById('slots'), say, pick, false);
  if (name === 'record') { const s = opened(); showRecord(document.getElementById('record'), recordListOf(s?.won, s?.wonAt)); }
  if (name === 'settings') { sayMotion(); sayDark(); saySound(); volumeEl.value = pref('volume'); }
}
// The front's three lines that read the store.
function front() {
  const s = opened();
  document.getElementById('playlabel').textContent = playLabel();
  document.getElementById('slotsbtn').textContent = slotsLabel();
  document.getElementById('recordbtn').textContent = recordLabelOf(s?.won);
}
// The board of times, standing on the right the whole time: asked once as
// the page comes up. A build with no board has no panel at all.
if (timesOn()) {
  document.getElementById('board').hidden = false;
  showTimes(document.getElementById('times'), opened()?.runId || null);
}
// Opening a slot here moves the pointer and nothing else: no yard is running
// to swap.
function pick(n) { setSlot(n); }

document.getElementById('slotsbtn').addEventListener('click', () => showPane('slots'));
document.getElementById('recordbtn').addEventListener('click', () => showPane('record'));
document.getElementById('settingsbtn').addEventListener('click', () => showPane('settings'));
for (const id of ['slotsback', 'recordback', 'settingsback']) document.getElementById(id).addEventListener('click', () => showPane('main'));

// Play waits for the store to take every write made here, and for the veil to
// reach white: play.html comes up out of the same white (main.js), so the load
// between the two documents is the middle of one fade.
let leaving = false;
async function play() {
  if (leaving) return;
  leaving = true;
  const veil = document.getElementById('veil');
  veil.classList.add('up');
  await Promise.all([storeSettled(), new Promise(r => setTimeout(r, reducedMotion() ? 0 : VEIL_MS))]);
  location.href = 'play.html';
}
document.getElementById('play').addEventListener('click', play);
addEventListener('keydown', e => {
  if (e.target === box) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
});

// --- the settings, as on the held sheet ------------------------------------
const motionEl = document.getElementById('motion');
const darkEl = document.getElementById('dark');
const soundEl = document.getElementById('sound');
const volumeEl = document.getElementById('volume');
const sayMotion = () => { motionEl.textContent = reducedMotion() ? 'motion: less' : 'motion: full'; };
const sayDark = () => { darkEl.textContent = dark() ? 'dark: on' : 'dark: off'; };
const saySound = () => { soundEl.textContent = pref('muted') ? 'sound: off' : 'sound: on'; };
motionEl.addEventListener('click', () => {
  setPref('motion', !reducedMotion());
  sayMotion();
  document.body.classList.toggle('still', reducedMotion());
  yard.contentWindow?.location.reload();
});
// The dark switch is a fade, not a cut: the veil goes up in the color of the
// page that is coming, the column changes under it and the picture is
// reloaded in the new palette (ink.js says why a reload), and the veil lifts
// once the picture is there, with the same ceiling the boot's wait has.
darkEl.addEventListener('click', async () => {
  setPref('dark', !dark());
  const veil = document.getElementById('veil');
  veil.style.background = dark() ? DARK_PAPER : LIGHT_PAPER;
  veil.classList.add('up');
  await new Promise(r => setTimeout(r, reducedMotion() ? 0 : VEIL_MS));
  document.documentElement.classList.toggle('dark', dark());
  sayDark();
  const up = pictureDrawn(true);
  yard.contentWindow?.location.reload();
  await up;
  requestAnimationFrame(() => veil.classList.remove('up'));
});
soundEl.addEventListener('click', () => { setPref('muted', !pref('muted')); saySound(); });
volumeEl.addEventListener('input', () => setPref('volume', +volumeEl.value));

// The save out and in, on the open slot's blob. In goes through the same door
// as the sheet's paste (parse, the shape check, one step of undo) but is left
// in the slot for play to boot from.
document.getElementById('savecopy').addEventListener('click', () => copyOut(slotRaw(openSlot()) || '', said));
document.getElementById('loadsave').addEventListener('click', () => { paste.hidden = false; say(''); box.focus(); });
document.getElementById('nevermind').addEventListener('click', () => { paste.hidden = true; box.value = ''; });
document.getElementById('loadit').addEventListener('click', () => {
  let s;
  try { s = JSON.parse(box.value); } catch { say('that is not a save'); return; }
  if (!isSave(s)) { say('that is not a save'); return; }
  savePrev(slotRaw(openSlot()));
  saveRaw(box.value);
  paste.hidden = true;
  box.value = '';
  say('loaded');
  front();
});

// The reset, armed the way the sheet's is: one press asks, a second within
// four seconds erases the open slot.
const resetEl = document.getElementById('reset');
let armed = 0;
const disarm = () => { clearTimeout(armed); armed = 0; resetEl.classList.remove('armed'); resetEl.textContent = 'reset progress'; };
resetEl.addEventListener('click', () => {
  if (!armed) {
    armed = setTimeout(disarm, 4000);
    resetEl.classList.add('armed');
    resetEl.textContent = 'erase everything?';
    return;
  }
  disarm();
  clear();
  say('erased');
  front();
});

// The desk: a window with no menu bar needs a way out that is not a key.
const quitEl = document.getElementById('quit');
if (window.desk) {
  quitEl.dataset.pane = 'main';
  quitEl.addEventListener('click', async () => {
    document.getElementById('veil').classList.add('up');
    await new Promise(r => setTimeout(r, reducedMotion() ? 0 : VEIL_MS));
    window.close();
  });
  document.getElementById('links').hidden = true;   // the shell opens no browser
}
document.getElementById('build').textContent = version();

const yard = document.getElementById('yard');

// When the picture is on the glass. The frame says so itself once its first
// frame is drawn (`PICTURE_UP` in main.js), as a flag for a page that asks
// after and a message for one already waiting: the frame is in the HTML and
// loads beside this script, usually ahead of it, so a listener for its `load`
// was nearly always too late and the page stood white for the whole ceiling.
// `fresh` is for a frame about to reload, whose old flag still stands. A
// frame that never comes must not hold the page white, so the wait has a
// ceiling.
function pictureDrawn(fresh = false) {
  return new Promise(r => {
    try { if (!fresh && yard.contentWindow?.[PICTURE_UP]) return r(); } catch {}
    const heard = e => {
      if (e.source !== yard.contentWindow || e.data !== PICTURE_UP) return;
      removeEventListener('message', heard);
      r();
    };
    addEventListener('message', heard);
    setTimeout(() => { removeEventListener('message', heard); r(); }, PICTURE_WAIT_MS);
  });
}
if (reducedMotion()) document.body.classList.add('still');

// The veil lifts once the store is read and the picture is there too; lifted
// on the store alone it showed the menu and then the yard popping in behind
// it.
const pictureUp = pictureDrawn();
await primeStore();
showPane('main');
await pictureUp;
requestAnimationFrame(() => document.getElementById('veil').classList.remove('up'));
