// The save mark: a disk in the corner row that fades up for a moment when a
// save lands, and stands, struck through, for as long as the page is not
// being saved -- another tab has the slot (`S.yielded`) or the store refused
// the write (`S.unsaved`). The game never stops for either; this is how the
// player finds out, without opening a sheet. A press on the struck mark of a
// page another tab holds reloads it onto the newest save, which is the one
// way back that is the player's own choice. Its note is the yard's own
// (board.js, `#tip`), as the corner's squares' are.

import { S } from './state.js';
import { SAVE_MARK_EVERY_S, SAVE_MARK_SHOW_MS } from './config.js';
import { lastLanded } from './persist.js';
import { unsavedLine } from './settings.js';
import { showTipAt } from './board.js';
import { onTap } from './tap.js';
import { msg } from './lang.js';

// The drawings, a cell a character, on the cell grid the corner's chevron
// uses: a disk with its corner notched and its shutter at the top, and the
// same disk with a stroke through it from corner to corner, cut out of the
// disk a cell either side so the stroke reads over the ink.
const DISK = [
  '.........',
  '.######..',
  '.##..#.#.',
  '.##..#.#.',
  '.#######.',
  '.#.....#.',
  '.#.....#.',
  '.#######.',
  '.........'
];
function struck() {
  const g = DISK.map(r => r.split(''));
  const n = g.length;
  for (let i = 0; i < n; i++) {
    const r = n - 1 - i;
    // the cells beside the stroke, inside the disk, are paper
    for (const c of [i - 1, i + 1]) if (c >= 0 && c < n && g[r][c] === '#') g[r][c] = '.';
  }
  for (let i = 0; i < n; i++) g[n - 1 - i][i] = '#';
  return g.map(r => r.join(''));
}
const STRUCK = struck();

// A drawing as a mask over the ink, so it turns with the page in dark mode.
function mask(rows) {
  let d = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') d += `M${x} ${y}h1v1h-1z`; }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${rows[0].length} ${rows.length}' shape-rendering='crispEdges'><path d='${d}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const el = document.getElementById('savemark');
el.style.setProperty('--disk', mask(DISK));
el.style.setProperty('--struck', mask(STRUCK));

let shownAt = 0;                 // page: when the mark last came up for a landed save
let heard = 0;                   // page: the landed save it came up for
let noting = false;              // page: the pointer is over the mark

const troubled = () => (S.yielded || S.unsaved) && !S.staged && !S.fatal;
const noteText = () => S.yielded ? msg('said-yielded') + '. ' + msg('savemark-take')
                     : S.unsaved ? unsavedLine() : msg('savemark-saved');
function note() {
  if (!noting) return;
  const r = el.getBoundingClientRect();
  showTipAt(noteText(), r.left + r.width / 2, r.bottom + 6, true);
}
onTap(el, () => { if (S.yielded) location.reload(); });
el.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { noting = true; note(); } });
el.addEventListener('pointerleave', () => { if (noting) { noting = false; showTipAt(null); } });

// For a check: as a page that has shown nothing yet.
export function resetSaveMark() { shownAt = 0; heard = 0; }

// Once a frame (main.js): which drawing, and whether it is up.
export function refreshSaveMark(now = Date.now()) {
  const trouble = troubled();
  const landed = lastLanded();
  if (!trouble && landed && landed !== heard && now - shownAt >= SAVE_MARK_EVERY_S * 1000) {
    heard = landed;
    shownAt = now;
  }
  const up = trouble || (shownAt > 0 && now - shownAt < SAVE_MARK_SHOW_MS);
  el.classList.toggle('on', up);
  el.classList.toggle('trouble', trouble);
  el.classList.toggle('take', !!S.yielded && trouble);
  const label = trouble ? noteText() : msg('savemark-saved');
  if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
  if (noting && !up) { noting = false; showTipAt(null); }
}
