// The landing page (DESIGN.md, "The landing page"): the menu column beside a
// frame running `play.html?demo`. Nothing here runs a yard: `play` opens
// play.html on the open slot, and everything else is read off and written to
// the store directly (save.js).

import { primeStore, openSlot, setSlot, slotRaw, clear, saveRaw, savePrev, isSave, storeSettled } from './save.js';
import { playLabel, slotsLabel, showSlots } from './slots.js';
import { recordListOf, recordLabelOf, showRecord } from './record.js';
import { pref, setPref, reducedMotion } from './prefs.js';
import { version } from './version.js';
import { copyOut } from './copyout.js';
import { VEIL_MS, PICTURE_WAIT_MS } from './config.js';

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
  if (name === 'settings') { sayMotion(); saySound(); volumeEl.value = pref('volume'); }
}
// The front's three lines that read the store.
function front() {
  const s = opened();
  document.getElementById('playlabel').textContent = playLabel();
  document.getElementById('slotsbtn').textContent = slotsLabel();
  document.getElementById('recordbtn').textContent = recordLabelOf(s?.won);
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
const soundEl = document.getElementById('sound');
const volumeEl = document.getElementById('volume');
const sayMotion = () => { motionEl.textContent = reducedMotion() ? 'motion: less' : 'motion: full'; };
const saySound = () => { soundEl.textContent = pref('muted') ? 'sound: off' : 'sound: on'; };
motionEl.addEventListener('click', () => {
  setPref('motion', !reducedMotion());
  sayMotion();
  document.body.classList.toggle('still', reducedMotion());
  yard.contentWindow?.location.reload();
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
if (reducedMotion()) document.body.classList.add('still');

// The veil lifts once the store is read and the picture is there too (the
// frame's load plus a frame for its first draw); lifted on the store alone it
// showed the menu and then the yard popping in behind it. A frame that never
// loads must not hold the page white, so the wait has a ceiling.
const pictureUp = new Promise(r => {
  yard.addEventListener('load', () => setTimeout(r, 60), { once: true });
  setTimeout(r, PICTURE_WAIT_MS);
});
await primeStore();
showPane('main');
await pictureUp;
requestAnimationFrame(() => document.getElementById('veil').classList.remove('up'));
