// Act 3's left end (the owner's playtest, 2026-10-19: "the tree is way too
// close to the edge of the level"). Heaven's gates stand at the place's left
// end, where the souls come in; the grove starts past them by the camp's own
// spacing between neighbors, so no tree, the farthest plot's included, is on
// the level's edge or in the gateway. Read off the grove as drawn
// (render/after/pine.js) and the gates' end as portals.js places it.
import { group, ok, run, yard, P } from './helpers.mjs';
import { GREY, AFTER_CAMP_GAP, AFTER_PLOT_MAX } from '../src/config.js';
import { afterX0 } from '../src/after/place.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterGrove } from '../src/render/after.js';

const S = yard.S;
const { portalEnd } = await import('../src/portals.js');
const plot = over => ({ grow: 1, seed: null, tones: [0, 1, 2, 3, 1], stump: false, dug: 0, fall: null, fell: null, chops: 0, by: null, ...over });
const GREYS = new Set(GREY);

// The leftmost world column the grove's drawing paints a tree on, in px.
function leftInk() {
  let left = Infinity, style = null;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' ? (x, y, w) => { if (!GREYS.has(style) && w > 0) left = Math.min(left, x); }
                    : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { if (k === 'fillStyle') style = v; o[k] = v; return true; }
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, drawAfterGrove);
  return left;
}

group('the grove stands clear of heaven\'s gates and of the level\'s left edge', async () => {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of ['house-fall', 'arrive', 'meet-god', 'refuse']) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
  // every plot the grove's card can clear, a grown tree in each
  S.after.plots = Array.from({ length: AFTER_PLOT_MAX }, () => plot());
  window.__look(afterX0());
  run(3);
  const ink = leftInk(), gates = portalEnd('heaven', 'after');
  window.__actsOn(null);
  const clear = gates.x + gates.r + AFTER_CAMP_GAP * P;
  return [
    ok(Number.isFinite(ink), 'the grove drew its trees'),
    ok(ink >= clear, 'the farthest tree stands past the gates\' reach by the camp\'s gap',
       `the trees' left ${ink} px, gates' reach ends ${gates.x + gates.r}, wanted ${clear}`),
    ok(ink - afterX0() >= AFTER_CAMP_GAP * P, 'and well off the level\'s left edge', `${ink - afterX0()} px`)
  ];
}, { reload: false });
