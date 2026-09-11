// The board pays about one, and the pegs are the odds.
//
// The slots' rates in config.js are measured off the built board, not chosen:
// this pours the thousand chip through the pegs from every gate the floor can
// open at, reads what share of the sand reached each slot, and holds the
// written rate against it. A moved peg, a wider gate or a deeper slot changes
// the shares, and this is what says so. See DESIGN.md, "The sand board", and
// `tools/node/board-rates.mjs`, which prints the same pour for tuning.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { GATES, SLOTS, SLOT_RATES, ROCK_CELL } from '../src/config.js';
import { board } from '../src/state.js';
import { at } from '../src/grid.js';

// one pour from one gate, and what reached each slot
function pourFrom(gate) {
  window.__reset(); window.__casino(true); window.__give(60000); window.__chip(2); window.__build();
  run(0.5);
  window.__buy('stakedust');
  runUntil(() => !state().pouring, 40);
  yard.S.gate = { at: gate, since: yard.clock.now() };
  yard.table.repose = false;
  runUntil(() => !state().letting, 60);
  return state().hand.counts;
}

group('every slot pays about one across the gates', async () => {
  const shares = Array.from({ length: SLOTS }, () => 0);
  const lines = [];
  for (const g of GATES) {
    const counts = pourFrom(g);
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    counts.forEach((n, k) => { shares[k] += n / total / GATES.length; });
    lines.push(`gate ${g}: ${counts.join(' ')}`);
  }
  const pays = shares.map((s, k) => s * SLOT_RATES[k]);
  const off = pays.map((p, k) => `${k + 1}:${p.toFixed(2)}`);
  return [
    ok(GATES.length === SLOTS, 'one gate a slot', `${GATES.length} gates, ${SLOTS} slots`),
    ok(pays.every(p => p > 0.85 && p < 1.15),
       'and, over the gates, calling any slot pays within a seventh of the stake',
       off.join(' ')),
    ok(shares.every(s => s > 0), 'every slot gets some of some pour', lines.join(' | '))
  ];
});

// The pegs do what pegs do: nothing settles on one. When the board has stopped
// moving every grain is in a slot or on a wall, and a wall's grains are nobody's.
group('the sand gets round the pegs', async () => {
  const counts = pourFrom(GATES[3]);
  let onPeg = 0, grains = 0;
  for (let c = 0; c < board.cols; c++)
    for (let r = 0; r < board.rows; r++) {
      const v = at(board, c, r);
      if (!v || v === ROCK_CELL) continue;
      grains++;
      // a grain directly on a peg, with the peg the only thing under it
      if (at(board, c, r - 1) === ROCK_CELL && r - 1 >= 0) onPeg++;
    }
  const slots = counts.reduce((a, b) => a + b, 0);
  return [
    ok(grains > 0, 'the pour reached the board', `${grains}`),
    ok(onPeg <= grains * 0.05, 'and next to none of it is sitting on a peg',
       `${onPeg} of ${grains}`),
    ok(slots >= grains * 0.9, 'the slots hold nearly all of it; the walls hold the rest',
       `${slots} of ${grains}: ${counts.join(' ')}`)
  ];
});
