// The sky as a picture of one number: the ledger of what it is made of, and the
// density the field is drawn at. See src/hazefield.js and DESIGN.md, "The sky is
// one number".
//
// Nothing here looks at pixels. What the field *looks* like is judged by eye --
// `node tools/look.mjs haze1,haze2,haze3` -- because whether a sky reads as haze
// or as a dither pattern is not a thing a check can be asked. What a check is
// for is the arithmetic underneath it: that the ledger never disagrees with the
// level, that the mix's shape only moves through work, and that the density is
// a function of the level alone.

import { group, ok, run } from './helpers.mjs';

group('the ledger of the sky sums to the level, whatever happens to it', async () => {
  window.__reset();
  window.__crew(0, 0);
  window.__air({ haze: 0 });
  const clean = window.__hazeField();

  // Wound up, run, scrubbed down, and asked at each step. The one thing that
  // must never be true is the two accounts disagreeing -- which is the failure
  // `foul` already wrote a paragraph about: a level and a sky that were kept
  // alongside each other and hoped to match, and did not.
  const wound = window.__air({ haze: 2000 });
  const mid = window.__hazeField();

  window.__air({ open: true, scrubbers: 1 });
  run(20);
  const scrubbed = window.__air({});
  const after = window.__hazeField();

  const sums = m => Object.values(m || {}).reduce((n, v) => n + v, 0);

  window.__air({ haze: 0, open: false, scrubbers: 0 });

  return [
    ok(clean.density === 0, 'a clean sky paints nothing',
       `density ${clean.density}`),
    ok(mid.density > 0 && mid.density < 1, 'a dirtied sky paints some of the field',
       `density ${mid.density.toFixed(3)}`),
    ok(mid.density > clean.density, 'and more of it than a clean one does',
       `${clean.density} -> ${mid.density.toFixed(3)}`),
    // Shares, so the sum is one whenever there is anything up there at all. A
    // ledger that summed to nine tenths would be a tenth of the sky with no
    // colour to draw it in.
    ok(Math.abs(sums(wound.mix) - 1) < 1e-6, 'the mix is shares of one',
       JSON.stringify(wound.mix)),
    ok(Math.abs(sums(scrubbed.mix) - 1) < 1e-6,
       'and it still is after the house has been at it',
       JSON.stringify(scrubbed.mix)),
    // The house takes a mixed sample of a mixed sky, so what it leaves behind is
    // the same shape it found. This is the whole of why `syncMix` scales rather
    // than subtracting from a kind it would have to choose.
    ok(after.density < mid.density, 'and a staffed house paints less of the sky',
       `${mid.density.toFixed(3)} -> ${after.density.toFixed(3)}`)
  ];
});

group('the field fills in rather than reshuffling', async () => {
  // The property the whole design turns on: raising the level *adds* cells and
  // leaves the ones already painted alone. It is true by construction -- a cell
  // is painted when its own fixed threshold falls under the density, and nothing
  // moves a threshold -- and it is checked anyway, because the day somebody
  // makes the field time-varying is the day the sky starts to shimmer and
  // nothing else will say so.
  window.__reset();
  window.__crew(0, 0);

  window.__air({ haze: 700 });
  const low = window.__hazeField();
  window.__air({ haze: 2800 });
  const high = window.__hazeField();
  // ...and back down again, to the same level. The same sky has to paint the
  // same amount of field: a density that remembered where it had been would be
  // a second piece of state pretending to be a reading.
  window.__air({ haze: 700 });
  const back = window.__hazeField();

  window.__air({ haze: 0 });

  return [
    ok(high.density > low.density, 'a worse sky paints more of the field',
       `${low.density.toFixed(3)} -> ${high.density.toFixed(3)}`),
    ok(Math.abs(back.density - low.density) < 1e-9,
       'and the same level always paints the same amount',
       `${low.density.toFixed(6)} vs ${back.density.toFixed(6)}`)
  ];
});

group('the sky remembers what dirtied it', async () => {
  // Only a machine is allowed to foul this sky -- see `foul`, which refuses
  // every other kind outright -- so a played yard is soot and nothing else. The
  // ledger is built for a sky with more than one producer in it; what it has to
  // do *today* is say soot, and go on saying it.
  window.__reset();
  window.__crew(3, 3, 0, 0);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__air({ haze: 0 });
  window.__buy('ram');
  run(25);
  const worked = window.__air({});

  window.__air({ haze: 0 });

  const shares = worked.mix || {};
  return [
    ok(worked.haze > 0, 'a running machine dirties the sky', `haze ${worked.haze}`),
    ok((shares.mach || 0) > 0.99,
       'and what it puts up is soot, because soot is all this sky accepts',
       JSON.stringify(shares))
  ];
});
