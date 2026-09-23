// The hop (DESIGN.md, "A hop between stations"): two arrows in the mid sky,
// one at each edge of the window, and a tap on one glides the view to the
// next standing station that way. Each wears the glyph of the station it
// would take you to, so the button is a signpost -- "the quarry is this way"
// -- rather than a control to try. An arrow with nothing past it is not
// drawn: the edges of the world are the edges of the yard.
//
// On a phone only (`coarse()`): the yard is six windows wide there and the
// mid sky is the one part of the glass a thumb reaches without moving the
// hand. On a desk the wheel is the hop. The target is worked out here and
// the glide is `lookAt`'s, so it obeys reduced motion like every other.

import { HOP_Y, HOP_SIZE, HOP_INSET } from './config.js';
import { S } from './state.js';
import { coarse } from './prefs.js';
import { lookAt } from './world.js';
import { STATIONS, standRect, showPanel } from './board.js';
import { station } from './stations.js';
import { GLYPHS, drawGlyph } from './glyphs.js';
import { onTap } from './tap.js';
import { inDeep } from './view.js';
import { deepTop } from './deep/place.js';


// Every standing station in the half on screen, by where it stands, left to
// right: the deep's stations are under the world, and a hop is a glide
// across, never down the shaft.
const here = r => (r.y >= deepTop()) === inDeep();
const standing = () =>
  STATIONS.map(key => ({ key, r: standRect(key) })).filter(s => s.r && here(s.r))
          .map(s => ({ key: s.key, mid: s.r.x + s.r.w / 2 }))
          .sort((a, b) => a.mid - b.mid);

// The next station past the view's center, in a direction: the first whose
// middle is past the center by more than a cell, so a station under the
// center is neither ahead nor behind and the hop from it is to the next.
// Null at the end of the world.
export function hopTarget(dir, camX = S.camX) {
  const center = camX + S.viewW / 2;
  const list = standing();
  if (dir > 0) return list.find(s => s.mid > center + 1) || null;
  return [...list].reverse().find(s => s.mid < center - 1) || null;
}

const hopEl = document.getElementById('hop');
// The stylesheet draws the squares at the size and inset config names.
document.documentElement.style.setProperty?.('--hop-size', `${HOP_SIZE}px`);
document.documentElement.style.setProperty?.('--hop-inset', `${HOP_INSET}px`);
const arrows = { [-1]: hopEl?.querySelector('.left'), [1]: hopEl?.querySelector('.right') };

// A hop is looking, not shopping: whatever board is up comes down, and the
// tap on the station opens it as ever.
function hop(dir) {
  const to = hopTarget(dir);
  if (!to) return;
  showPanel(null, true);
  lookAt(to.mid);
}
for (const dir of [-1, 1]) if (arrows[dir]) onTap(arrows[dir], () => hop(dir));

// Seated every frame from the view, written only when something changes:
// which way there is more, which station it is, where the sky sits.
let wore = { [-1]: null, [1]: null }, shown = null, putY = null;
export function refreshHop() {
  const want = coarse() && !S.paused;
  if (want !== shown) { shown = want; hopEl.hidden = !want; }
  if (!want) return;
  // On the same seat every shell element uses: a share of the window's
  // height, so the sky it stands in is the phone's own -- and never lower
  // than the middle of the sky, since a phone on its side has its ground
  // line above HOP_Y and an arrow on the ground reads as a thing in the yard.
  const ground = (S.groundY - S.camY) * S.zoom;
  const y = Math.round(Math.min(S.H * HOP_Y, ground / 2) - HOP_SIZE / 2);
  if (y !== putY) { putY = y; hopEl.style.transform = `translate3d(0, ${y}px, 0)`; }
  for (const dir of [-1, 1]) {
    const el = arrows[dir];
    const to = hopTarget(dir);
    const key = to ? to.key : null;
    if (key === wore[dir]) continue;
    wore[dir] = key;
    el.hidden = !key;
    if (!key) continue;
    el.dataset.to = key;
    const pic = el.querySelector('.pic');
    // The station's own drawing (`glyph` on its row).
    const c = drawGlyph(GLYPHS[station(key)?.glyph] || GLYPHS.crate);
    // A tile hangs its glyph off a zero-width anchor by the ink's half-width;
    // here it stands in the row beside the arrow.
    c.style.marginLeft = '0';
    pic.replaceChildren(c);
  }
}

// For the checks: what each arrow is wearing, or null where there is none.
export const hopWears = () => ({ left: wore[-1], right: wore[1] });
