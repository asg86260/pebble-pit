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

import { HOP_Y, HOP_SIZE } from './config.js';
import { S } from './state.js';
import { coarse } from './prefs.js';
import { lookAt, toScreen } from './world.js';
import { showPanel } from './board.js';
import { station } from './stations.js';
import { GLYPHS, drawGlyph } from './glyphs.js';
import { onTap } from './tap.js';
import { inDeep } from './view.js';
import { stops, stopMid } from './stops.js';
import { themeGen } from './ink.js';


// Every standing station with a board in the half on screen, by where it
// stands, left to right: the deep's stations are under the world, and a hop
// is a glide across, never down the shaft. Read off the one list of stops
// the digit keys and the pad walk too (stops.js).
const standing = () =>
  stops(inDeep() ? 'deep' : 'yard').filter(s => s.kind === 'station' && s.board)
    .map(s => ({ key: s.key, mid: stopMid(s) }));

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
// The stylesheet draws the squares at the size config names, --edge in from the glass.
document.documentElement.style.setProperty?.('--hop-size', `${HOP_SIZE}px`);
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
let wore = { [-1]: null, [1]: null }, shown = null, putY = null;  // page: what the hop arrows' DOM shows, compared against the yard every frame
// cache: the turn of the page each arrow's glyph was drawn on (ink.js), its inks' key
const woreOn = { [-1]: 0, [1]: 0 };
export function refreshHop() {
  const want = coarse() && !S.paused;
  if (want !== shown) { shown = want; hopEl.hidden = !want; }
  if (!want) return;
  // On the same seat every shell element uses: a share of the window's
  // height, so the sky it stands in is the phone's own -- and never lower
  // than the middle of the sky, since a phone on its side has its ground
  // line above HOP_Y and an arrow on the ground reads as a thing in the yard.
  const ground = toScreen(0, S.groundY).y;
  const y = Math.round(Math.min(S.H * HOP_Y, ground / 2) - HOP_SIZE / 2);
  if (y !== putY) { putY = y; hopEl.style.transform = `translate3d(0, ${y}px, 0)`; }
  for (const dir of [-1, 1]) {
    const el = arrows[dir];
    const to = hopTarget(dir);
    const key = to ? to.key : null;
    if (key === wore[dir] && woreOn[dir] === themeGen) continue;
    wore[dir] = key;
    woreOn[dir] = themeGen;
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
