// The floating build button (docs/wave-party.md, "The boards"): a small
// button standing in the deep's water over the next free floor slot, wearing
// the fang's mark and how many are held. It is how a station is bought: the
// first one free, at the snatch (the altar, the armory or the spire, a
// starting class each), and every one after it for a fang, whenever a fang
// is held and a slot is free. Pressed, it opens a small picker of the kinds
// it may build, a line each; picking one hands the kind to the party
// (`buildStation`), which spends the fang and has a builder put it up.
//
// It is not on a board: it hangs over the place the station will stand, so
// what the fang buys and where it goes are one picture. It rides the deep's
// camera as the roster posts do, and fades in and out (shelf.css,
// `#buildbtn`), never popping.

import { S } from '../state.js';
import { P, PAIRS, CLASSES, FIRST_KINDS, FANG_MARK, BUILD_BUTTON_UP, BUILD_FADE_MS } from '../config.js';
import { canBuild, nextSlot, classesOpen, buildStation } from './party.js';
import { slotX, deepFloor } from './place.js';
import { KINDS } from '../stations.js';
import { onTap } from '../tap.js';

document.documentElement.style.setProperty?.('--build-fade-ms', `${BUILD_FADE_MS}ms`);

// The fang's pixels as an image the stylesheet can mask with, as the scale's
// are (`--scale-mark`, board.js).
const fangInk = FANG_MARK.flatMap((row, y) => [...row].map((c, x) => c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''));
document.documentElement.style.setProperty?.('--fang-mark',
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${FANG_MARK[0].length}" height="${FANG_MARK.length}" shape-rendering="crispEdges">${fangInk.join('')}</svg>`)}")`);

// --- what it offers ---------------------------------------------------------------
// Whether it stands, where, and what it builds: the first station is free and
// offers the starting kinds; after it, a fang buys any kind.
export function buildOffer() {
  const slot = nextSlot();
  const shown = !!S.snatched && canBuild() && slot >= 0;
  const first = S.stations.length === 0;
  const kinds = first ? FIRST_KINDS : Object.keys(PAIRS);
  return { shown, slot, first, fangs: S.fangs, kinds };
}
// A kind's one line in the picker: the kind and its classes -- on the first
// pick the class it will open with, after that both.
export const kindLine = (kind, first = S.stations.length === 0) =>
  `${KINDS[kind].name}: ${(first ? classesOpen(kind) : PAIRS[kind]).map(c => CLASSES[c].name).join(', ')}`;

// The picker's state: open or not. The pointer's, not the yard's.
let picking = false;
export const pickerOpen = () => picking;
export function openPicker() { if (buildOffer().shown) picking = true; return picking; }
export function closePicker() { picking = false; }
// A kind picked: the party builds it, and the picker goes.
export function pick(kind) {
  const offer = buildOffer();
  picking = false;
  if (!offer.shown || !offer.kinds.includes(kind)) return false;
  return buildStation(kind);
}

// --- the page -----------------------------------------------------------------------
let btn = null, picker = null;
function make() {
  btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'buildbtn';
  btn.innerHTML = '<i class="fang"></i><b class="count"></b>';
  picker = document.createElement('div');
  picker.id = 'buildpick';
  document.body.appendChild(btn);
  document.body.appendChild(picker);
  onTap(btn, () => { if (picking) closePicker(); else openPicker(); seatBuildButton(); });
}

// The picker's lines, built when the kinds it offers change.
let pickFor = '';
function fillPicker(kinds, first) {
  const key = `${first}|${kinds.join(',')}`;
  if (key === pickFor) return;
  pickFor = key;
  picker.textContent = '';
  for (const kind of kinds) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'kind';
    b.dataset.kind = kind;
    b.textContent = kindLine(kind, first);
    onTap(b, () => { pick(kind); seatBuildButton(); });
    picker.appendChild(b);
  }
}

// Every frame (a layer in render.js): shown or not, and where. A fade, not a
// pop: `on` is the class the stylesheet fades on, and the element is never
// hidden outright, so it can fade out from where it stood.
let at = { x: null, y: null };
export function seatBuildButton() {
  if (!btn) make();
  const offer = buildOffer();
  const on = offer.shown && S.view === 'deep';
  if (!on) picking = false;
  btn.classList.toggle('on', on);
  picker.classList.toggle('on', on && picking);
  if (!on) return;
  const count = offer.first ? 'free' : `×${offer.fangs}`;
  const say = btn.querySelector('.count');
  if (say.textContent !== count) say.textContent = count;
  fillPicker(offer.kinds, offer.first);
  // Centered over the slot, its foot BUILD_BUTTON_UP over the floor, in the
  // deep's camera, as `seatCall` seats the call to build the bench.
  const w = btn.offsetWidth || 0;
  const x = Math.round((slotX(offer.slot) - S.camX) * S.zoom - w / 2);
  const bottom = Math.round(S.H - (deepFloor() - BUILD_BUTTON_UP - S.camY) * S.zoom);
  if (x !== at.x || bottom !== at.y) {
    at = { x, y: bottom };
    btn.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
    // The picker stands on the button's head.
    picker.style.transform = `translate3d(${x}px, ${-(bottom + (btn.offsetHeight || 0) + P)}px, 0)`;
  }
}
