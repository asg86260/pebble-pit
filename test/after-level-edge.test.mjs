// Act 3's left end (the owner's playtest, 2026-10-19: "the tree is way too
// close to the edge of the level"). Heaven's gates stand at the place's left
// end, where the souls come in; the grove starts past them by the camp's own
// spacing between neighbors, so the first pine is neither on the level's
// edge nor in the gateway. Read off the grove as drawn (render/after/pine.js)
// and the gates' end as portals.js places it.
import { group, ok, run, yard, P } from './helpers.mjs';
import { GREY, AFTER_CAMP_GAP } from '../src/config.js';
import { afterX0 } from '../src/after/place.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterGrove } from '../src/render/after.js';

const S = yard.S;
const { portalEnd } = await import('../src/portals.js');
const plot = over => ({ stage: 3, grow: 0, chops: 0, chip: null, fall: null, fell: null, logs: 0, stump: false, dug: 0, big: false, at: null, ...over });

// The leftmost world column the grove's drawing fills black, in px.
function leftInk() {
  let left = Infinity, style = null;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' ? (x, y, w) => { if (style === GREY[10] && w > 0) left = Math.min(left, x); }
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
  // the widest pine the first plot can hold
  S.after.plots = [plot({ big: true }), ...S.after.plots.slice(1)];
  window.__look(afterX0());
  run(3);
  const ink = leftInk(), gates = portalEnd('heaven', 'after');
  window.__actsOn(null);
  const clear = gates.x + gates.r + AFTER_CAMP_GAP * P;
  return [
    ok(Number.isFinite(ink), 'the grove drew its first pine'),
    ok(ink >= clear, 'the first pine stands past the gates\' reach by the camp\'s gap',
       `pine's left ${ink} px, gates' reach ends ${gates.x + gates.r}, wanted ${clear}`),
    ok(ink - afterX0() >= AFTER_CAMP_GAP * P, 'and well off the level\'s left edge', `${ink - afterX0()} px`)
  ];
}, { reload: false });
