// The wheel waits for the sand.
//
// Putting the chip down is still one gesture -- the whole point of the place is
// that you do not stake and then press a second thing to find out what happened
// -- but a stake is not a number leaving a counter. It is a pot raining out of
// the sky on to the ground beside the building, and it takes a second and a half
// to get there. The wheel used to be spinning the whole time it was falling,
// which is a wheel spinning for something that is not on the table yet.
//
// So: the chip goes down, the sand comes down, and the wheel goes round when the
// last grain of it is lying still. What "lying still" means is a fact about the
// ground and not a length of time -- nothing left to send, nothing in the air,
// no column of the heap still moving -- and that is what these check.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';

// The table, opened without the twenty cores it costs, with dust in the hole to
// stake out of and the chip wound up to a pot worth watching arrive.
function atTheTable(chip = 1) {
  window.__reset();
  window.__casino(true);
  window.__give(6000);
  yard.S.chip = chip;                  // a setting, like the dial the board draws
  window.__build();
  run(0.5);
}

group('the wheel does not go round until the stake has landed', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  const held = state().stored;
  const put = window.__buy('stakedust');
  const down = state();

  // Watch it come down. Nothing about the wheel may be in earnest while there is
  // still a grain of the stake in the air or a column of the heap still moving.
  let spunWithAirborne = 0, spunShort = 0, sawAir = 0, poured = 0;
  let began = null, idled = false;
  const from = down.wheel;
  for (let i = 0; i < 900 && !began; i++) {
    run(1 / 60);
    const s = state();
    if (s.pouring) {
      poured++;
      if (s.tableAir > 0) sawAir++;
      if (s.spinning) spunWithAirborne++;
      if (s.table < stake) spunShort += s.spinning ? 1 : 0;
      if (s.wheel !== from) idled = true;         // the slow turn, which carries on
    }
    if (s.spinning) began = s;
  }

  // and then it is a spin like any other: it goes round, it stops, and what it
  // stopped on is what happened to the pot
  const turning = runUntil(() => state().wheel !== (began ? began.wheel : 0), 5);
  runUntil(() => !state().spinning && !state().pouring, 30);
  const done = state();

  return [
    ok(put, 'the chip goes down through the row that puts it down'),
    ok(down.stored === held - stake, 'and it comes out of your hands there and then',
       `${held} - ${stake} -> ${down.stored}`),
    ok(down.pot && down.pot.on === stake, 'the pot is on the table the moment it is staked',
       down.pot && `${down.pot.on}`),
    ok(down.pouring && !down.spinning,
       'and the wheel is not spinning yet: the sand is still in the sky'),
    ok(sawAir > 0, 'the stake is really in the air on the way down',
       `${sawAir} of ${poured} frames with a grain flying`),
    ok(spunWithAirborne === 0, 'and the wheel never spins while a grain is still flying',
       `${spunWithAirborne} frames`),
    ok(spunShort === 0, 'nor while the heap is short of the pot', `${spunShort} frames`),
    ok(idled, 'it keeps its idle turn through the pour rather than sitting dead'),
    ok(!!began, 'and then it goes round in earnest'),
    ok(began && began.tableAir === 0 && began.table >= stake,
       'starting only once the whole stake is lying in the pile',
       began && `${began.table} of ${stake} down, ${began.tableAir} in the air`),
    ok(turning, 'the spin actually turns the wheel'),
    ok(!done.spinning && !done.pouring, 'and it comes to rest on its own'),
    ok(done.hand !== null, 'and says which way it went'),
    ok(done.pot ? done.pot.on === stake * 2 : done.stored === held - stake,
       'a win doubles what is on the table and a loss leaves nothing there',
       done.pot ? `${done.pot.on} on ${stake}` : 'gone')
  ];
});

group('a pot still pouring is a bet already made', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  run(0.3);                                       // half of it still falling
  const mid = state();

  // Neither decision is open while it comes down. The pour is the front half of
  // the spin, not a window before it: a second stake here would be a double
  // stake, and banking here would be taking a bet back off the table.
  const again = window.__buy('stakedust');
  const took = window.__buy('bank');
  const after = state();

  runUntil(() => !state().spinning && !state().pouring, 30);
  const done = state();

  return [
    ok(mid.pouring && mid.tableAir > 0, 'it is still coming down',
       `${mid.table} down, ${mid.tableAir} in the air`),
    ok(!again, 'a second stake will not go down on a pot that is still landing'),
    ok(!took, 'and it cannot be banked out from under the wheel'),
    ok(after.paying === null, 'nothing sets off for the hole', `${after.paying}`),
    ok(after.pot && after.pot.on === stake && after.stored === mid.stored,
       'the pot and the purse are exactly where they were',
       after.pot && `${after.pot.on} on the table, ${after.stored} held`),
    ok(!done.pouring, 'and the hand plays itself out from there')
  ];
});

// A pot caught mid-pour is a bet that was made, so it survives the tab shutting.
// The sand itself does not -- the table's grid is never saved -- so what comes
// back is the pot on the board, the pour starting again out of the sky, and the
// spin it was owed still owed.
group('a save mid-pour comes back mid-pour', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  window.__buy('stakedust');
  run(0.3);
  window.__reload();
  const back = state();
  const spun = runUntil(() => state().spinning, 30);
  const at = state();
  runUntil(() => !state().spinning && !state().pouring, 30);
  const done = state();

  return [
    ok(back.pot && back.pot.on === stake, 'the pot is still on the table',
       back.pot && `${back.pot.on}`),
    ok(back.pouring, 'and the spin it was owed is still owed'),
    ok(spun, 'so the wheel goes round when the sand has settled again'),
    ok(at.table >= stake, 'with the whole pot in the pile by then',
       `${at.table} of ${stake}`),
    ok(!done.pouring && !done.spinning, 'and the hand finishes')
  ];
});
