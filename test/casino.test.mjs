// The casino: the stake on the roof, the call, and the sand through the pegs.
//
// Putting the chip down is one gesture -- the stake rains out of the sky on to
// the roof and stands there as a heap -- and the bet is the call: which slot
// the sand has to land in when you let it go. What these check is that the
// heap on the roof is the stake, that nothing can be pressed while the sand is
// moving, that a hand bought the player's way is settled by the called slot,
// that the hole is paid to the grain, and that the ladder past the first band
// is the one written down. See DESIGN.md, "The sand board".

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { SLOT_RATES, CASINO_PILE_BRIM } from '../src/config.js';

// The table, opened without the dust it costs, with something in the hole to
// stake out of and the chip wound up to a pot worth watching arrive.
function atTheTable(chip = 1) {
  window.__reset();
  window.__casino(true);
  window.__give(6000);
  window.__chip(chip);
  window.__build();
  run(0.5);
}

// the yard gone quiet: nothing in the air, nothing owed, nothing moving
const quiet = () => runUntil(() => !state().pouring && !state().letting && !state().clearing &&
                                   !state().paying && state().tableAir === 0, 40);

group('the stake rains on to the roof and stands there as the pot', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  const held = state().stored;
  const put = window.__buy('stakedust');
  const down = state();

  // Watch it come down: the heap on the roof grows while grains are in the air,
  // and the pour is over only once the last of them is lying still.
  let sawAir = 0, poured = 0;
  for (let i = 0; i < 900 && state().pouring; i++) {
    run(1 / 60);
    poured++;
    if (state().tableAir > 0) sawAir++;
  }
  const settled = state();

  return [
    ok(put, 'the chip goes down through the row that puts it down'),
    ok(down.stored === held - stake, 'and it comes out of your hands there and then',
       `${held} - ${stake} -> ${down.stored}`),
    ok(down.pot && down.pot.on === stake, 'the pot is on the roof the moment it is staked',
       down.pot && `${down.pot.on}`),
    ok(down.pouring && !down.letting, 'and it is still in the sky: nothing has been let go'),
    ok(sawAir > 0, 'the stake is really in the air on the way down',
       `${sawAir} of ${poured} frames with a grain flying`),
    ok(!settled.pouring && settled.table === stake && settled.tableAir === 0,
       'and then the whole of it is standing in the tray, one grain a dust',
       `${settled.table} of ${stake}, ${settled.tableAir} in the air`),
    ok(settled.pot && settled.pot.on === stake, 'with the pot still what was staked'),
    ok(settled.board === 0, 'and nothing on the board yet')
  ];
});

group('a pot still pouring is a bet already made', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  run(0.3);                                       // half of it still falling
  const mid = state();

  // Neither a second chip nor the let-go is open while it comes down: a second
  // stake here would be a double stake, and letting go a heap that is not there
  // yet would be letting go of nothing.
  const again = window.__buy('stakedust');
  const early = window.__buy('letgo');
  const after = state();
  quiet();

  return [
    ok(mid.pouring && mid.tableAir > 0, 'it is still coming down',
       `${mid.table} down, ${mid.tableAir} in the air`),
    ok(!again, 'a second stake will not go down on a pot that is still landing'),
    ok(!early, 'and it cannot be let go before it has landed'),
    ok(after.pot && after.pot.on === stake && after.stored === mid.stored,
       'the pot and the purse are exactly where they were',
       after.pot && `${after.pot.on} on the roof, ${after.stored} held`)
  ];
});

// A hand bought the player's way: the chip through its row, the call through
// its dial, the let-go through its row -- and what the hole is paid is what the
// called slot held, at the slot's rate, to the grain.
group('a hand is settled by the slot that was called', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  runUntil(() => !state().pouring, 30);
  // call the middle: two nudges up from wherever the dial was left, then back
  // to the middle by reading it
  while (state().slot < 3) window.__slot(1);
  while (state().slot > 3) window.__slot(-1);
  const held = state().stored;
  const let_ = window.__buy('letgo');
  const opened = state();
  // a call cannot be moved once the floor is open
  window.__slot(1);
  const moved = state().slot;
  const done = runUntil(() => !state().letting, 60);
  const settled = state();
  quiet();
  const paid = state();

  const counts = settled.hand.counts;
  const total = counts.reduce((a, b) => a + b, 0);
  const want = Math.round(stake * (counts[3] / Math.max(1, total)) * SLOT_RATES[3]);

  return [
    ok(let_, 'letting go goes through its row'),
    ok(opened.letting && opened.gate, 'and the floor is open somewhere',
       opened.gate && `at ${opened.gate.at}`),
    ok(moved === 3, 'the call cannot be moved once the sand is going'),
    ok(done && settled.table === 0, 'the whole of the tray goes through the pegs',
       `${settled.table} left in the tray`),
    ok(total >= stake * 0.9, 'and nearly all of it reaches a slot',
       `${total} of ${stake}: ${counts.join(' ')}`),
    ok(settled.hand && settled.hand.slot === 3 && settled.hand.rate === SLOT_RATES[3],
       'the hand says which slot was called and what it paid'),
    ok(settled.hand.n === want, 'and pays what the called slot held at its rate',
       `${counts[3]} of ${total} x ${SLOT_RATES[3]} on ${stake} -> ${settled.hand.n}, wanted ${want}`),
    ok(paid.stored === held + want, 'which reaches the hole to the grain',
       `${held} + ${want} -> ${paid.stored}`),
    ok(paid.board === 0 && paid.table === 0 && paid.tableAir === 0,
       'and the building stands empty for the next hand',
       `${paid.board} on the board, ${paid.table} in the tray, ${paid.tableAir} in the air`),
    ok(!paid.pot, 'with nothing left on the roof')
  ];
});

// A pot caught mid-pour is a bet that was made, so it survives the tab shutting.
// The sand itself does not -- neither grid is ever saved -- so what comes back
// is the pot on the roof and the pour starting again out of the sky.
group('a save mid-pour comes back mid-pour', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  run(0.3);
  window.__reload();
  const back = state();
  const landed = runUntil(() => !state().pouring, 30);
  const at = state();
  return [
    ok(back.pot && back.pot.on === stake, 'the pot is still on the roof',
       back.pot && `${back.pot.on}`),
    ok(back.pouring, 'and the sand is on its way down again'),
    ok(landed && at.table === stake, 'with the whole pot in the tray when it lands',
       `${at.table} of ${stake}`)
  ];
});

// Past a hundred the heap stops being a count of the pot and becomes a reading
// of it, on a ladder written down in config.js. The numbers stay exact -- the
// row and the hole both say the pot -- and what gets smaller is the sand.
//
// The ladder itself, worked out the way DESIGN.md writes it. A check that read
// the game's own function for the answer would agree with anything.
const band = n => n <= 100 ? n : Math.min(CASINO_PILE_BRIM, Math.round(100 + 100 * Math.log10(n / 100)));

group('the heap past the first band is a reading of the pot', async () => {
  atTheTable(2);                                 // the thousand chip
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  let air = 0;
  for (let f = 0; f < 3600 && state().pouring; f++) { run(1 / 60); air = Math.max(air, state().tableAir); }
  const settled = state();
  const held = settled.stored;
  // and it is paid out on the exact pot, however few squares carry it
  window.__buy('letgo');
  runUntil(() => !state().letting, 60);
  const hand = state().hand;
  quiet();
  const paid = state();
  const total = hand.counts.reduce((a, b) => a + b, 0);
  const want = Math.round(stake * (hand.counts[hand.slot] / Math.max(1, total)) * SLOT_RATES[hand.slot]);
  return [
    ok(settled.pot && settled.pot.on === stake, 'a thousand goes on the roof', `${settled.pot && settled.pot.on}`),
    ok(settled.tableWant === band(stake), 'and the heap it asks for is the band, not the pot',
       `${settled.tableWant} grains for ${stake}, band says ${band(stake)}`),
    ok(band(stake) < stake, 'which is less sand than the pot has units'),
    ok(settled.table === settled.tableWant, 'the heap settles to it',
       `${settled.table} of ${settled.tableWant}`),
    ok(air <= CASINO_PILE_BRIM + 200, 'and nothing near a thousand is ever in the air at once',
       `${air} at the worst`),
    ok(paid.stored === held + want, 'and the hole is paid the pot\'s share to the grain',
       `${held} + ${want} -> ${paid.stored}`)
  ];
});

group('the ladder is the one written down', async () => {
  atTheTable(0);
  const rungs = [10, 100, 200, 1000, 10000, 100000, 1000000, 10000000];
  const said = [];
  for (const n of rungs) {
    yard.S.pot = { cur: 'dust', stake: n, n };
    said.push(state().tableWant);
  }
  yard.S.pot = null;
  return [
    ok(said.every((v, i) => v === band(rungs[i])),
       'every rung reads as the ladder says it should',
       said.map((v, i) => `${rungs[i]}->${v}`).join(' ')),
    ok(said[said.length - 1] === CASINO_PILE_BRIM, 'and it stops at the brim', `${said[said.length - 1]}`),
    ok(said[0] === 10 && said[1] === 100,
       'while everything up to a hundred is still one grain a unit',
       `${said[0]}, ${said[1]}`)
  ];
});
