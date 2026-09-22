// The clock over the one under the rock: the time the story is taking, on
// the books while they are under and on the ending sheet once they are out.
//
// It runs from the first rock, on the frame's own `dt`, so a held yard adds
// nothing to it; and it is saved, so a reload carries on from where it was
// rather than from nought. That it stops when they walk out is checked where
// the rescue is walked, in shield.test.mjs.
import { group, ok, state, run, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { BOOK_ROWS } from '../src/stats.js';

const row = key => BOOK_ROWS.find(u => u.key === key);

group('the clock over the one under the rock runs while they are under', async () => {
  window.__reset();
  window.__crew(2, 1);
  run(1);
  const start = state();
  run(10);
  const later = state();
  // the books' two rows: the running one up, the finished one not yet
  const under = row('tallyunder'), saved = row('tallysaved');
  const shown = under.show() && !saved.show();
  const said = under.price();
  // and a reload carries the reading on rather than starting it over
  yard.persist();
  yard.restore();
  const back = state();
  run(5);
  const on = state();
  window.__reset();
  return [
    ok(start.buried && start.buriedMs > 0, 'it starts with the rock that put them there',
       `buried ${start.buried}, ${start.buriedMs} ms`),
    ok(later.buriedMs - start.buriedMs >= 9500 && later.buriedMs - start.buriedMs <= 10500,
       'and reads the game seconds that passed', `${start.buriedMs} -> ${later.buriedMs}`),
    ok(shown, 'the books show the running clock and not the finished one'),
    ok(/\d\d:\d\d$/.test(said), 'read as minutes and seconds', said),
    ok(Math.abs(back.buriedMs - later.buriedMs) < 100, 'a reload keeps the reading',
       `${later.buriedMs} -> ${back.buriedMs}`),
    ok(on.buriedMs > back.buriedMs, 'and it goes on running after one')
  ];
});
