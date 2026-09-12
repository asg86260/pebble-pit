// The yard's multipliers, now that the lab has gone.
//
// Four are left, and every one is the fourth card of a ground's ladder: the
// crop's and the tending's at the plots, the seam's and the pace's at the cut.
// The crew's two -- the swing over the diggers and your click, the pace over the
// haulers' walk -- were dropped 2026-09-12: a second ladder over a number that
// already had one, sold under the row that had just finished. The bargain the
// multipliers carry (bought through a row, built by bodies, the rate not moving
// until it lands) is checked where the cards are, in ladders.test.mjs; what is
// worth saying here is only that each sits on the board of the thing it climbs.

import { group, ok, openSites } from './helpers.mjs';

group('each multiplier sits on the board of the thing it multiplies', async () => {
  window.__reset();
  openSites();
  window.__invest();
  const boards = window.__boards();
  const at = key => boards.filter(b => b.sections.flat().includes(key)).map(b => b.name);
  const gone = key => !window.__rows().some(r => r.key === key);
  return [
    ok(at('labcave').join() === 'quarry', "the cut's is at the cut",
       at('labcave').join() || 'nowhere'),
    ok(at('labseam').join() === 'quarry', "and so is the seam's", at('labseam').join() || 'nowhere'),
    ok(at('labtend').join() === 'farm', "the plots' is at the plots",
       at('labtend').join() || 'nowhere'),
    ok(at('labcrop').join() === 'farm', "and so is the crop's", at('labcrop').join() || 'nowhere'),
    ok(gone('labswing') && gone('labhaul'), 'and the crew has no multiplier rows at all')
  ];
});
