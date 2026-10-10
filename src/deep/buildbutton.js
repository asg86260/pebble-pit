// The floating build button (DESIGN.md, "Built first, a recruit, then two
// choices"): a small button standing in the deep's water over the next free
// floor slot, wearing the fang's mark and its price, one. It is how a
// station is bought: the first one free, at the snatch, and every one after
// it for a fang, whenever a fang is held and a slot is free. Pressed, its
// build is queued there at once (`layStation`); what it becomes is picked on
// its board once it stands (deep/rails.js).
//
// It is not on a board: it hangs over the place the station will stand, so
// what the fang buys and where it goes are one picture. It rides the deep's
// camera as the roster posts do, and fades in and out (shelf.css,
// `#buildbtn`), never popping.

import { S } from '../state.js';
import { FANG_MARK, BUILD_BUTTON_UP, BUILD_FADE_MS } from '../config.js';
import { canBuild, nextSlot, layStation } from './party.js';
import { slotX, deepFloor } from './place.js';
import { onTap } from '../tap.js';

document.documentElement.style.setProperty?.('--build-fade-ms', `${BUILD_FADE_MS}ms`);

// The fang's pixels as an image the stylesheet can mask with, as the scale's
// are (`--scale-mark`, board.js).
const fangInk = FANG_MARK.flatMap((row, y) => [...row].map((c, x) => c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''));
document.documentElement.style.setProperty?.('--fang-mark',
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${FANG_MARK[0].length}" height="${FANG_MARK.length}" shape-rendering="crispEdges">${fangInk.join('')}</svg>`)}")`);

// --- what it offers ---------------------------------------------------------------
// Whether it stands and where: the first lot is free, every one after a fang.
export function buildOffer() {
  const slot = nextSlot();
  const shown = !!S.snatched && canBuild() && slot >= 0;
  return { shown, slot, first: S.stations.length === 0, fangs: S.fangs };
}
// Pressed: the station's build queued. Its id, or null.
export function press() {
  if (!buildOffer().shown) return null;
  return layStation();
}

// --- the page -----------------------------------------------------------------------
let btn = null;
function make() {
  btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'buildbtn';
  btn.innerHTML = '<i class="fang"></i><b class="count"></b>';
  document.body.appendChild(btn);
  onTap(btn, () => { press(); seatBuildButton(); });
}

// Every frame (a layer in render.js): shown or not, and where. A fade, not a
// pop: `on` is the class the stylesheet fades on, and the element is never
// hidden outright, so it can fade out from where it stood.
let at = { x: null, y: null };
const EDGE = 4;                          // px kept clear of the window's edge, as board.js keeps
export function seatBuildButton() {
  if (!btn) make();
  const offer = buildOffer();
  const on = offer.shown && S.view === 'deep';
  btn.classList.toggle('on', on);
  if (!on) return;
  // the price, not the purse: the fangs held are on the counter card
  const count = offer.first ? 'free' : '×1';
  const say = btn.querySelector('.count');
  if (say.textContent !== count) say.textContent = count;
  // Centered over the slot, its foot BUILD_BUTTON_UP over the floor, in the
  // deep's camera, as `seatCall` seats the call to build the bench, and kept
  // inside the window, as every board is.
  const inside = (x, w) => Math.round(Math.max(EDGE, Math.min(x, S.W - w - EDGE)));
  const w = btn.offsetWidth || 0;
  const mid = (slotX(offer.slot) - S.camX) * S.zoom;
  const x = inside(mid - w / 2, w);
  const bottom = Math.round(S.H - (deepFloor() - BUILD_BUTTON_UP - S.camY) * S.zoom);
  if (x !== at.x || bottom !== at.y) {
    at = { x, y: bottom };
    btn.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
  }
}
