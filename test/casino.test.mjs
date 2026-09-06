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


// Past a thousand the heap stops being a count of the pot and becomes a reading
// of it, on a ladder written down in config.js. The numbers stay exact -- the
// row, the credit and the hole all say the pot -- and what gets smaller is the
// sand, which is the only thing here that was ever expensive.
//
// The ladder itself, worked out the way DESIGN.md writes it. A check that read
// the game's own function for the answer would agree with anything.
const band = n => n <= 100 ? n : Math.min(700, Math.round(100 + 150 * Math.log10(n / 100)));

group('the heap past the first band is a reading of the pot', async () => {
  atTheTable(2);                                 // the thousand chip
  // Fund the whole loop below. The table's 6000 covers six spins at this chip
  // against 40% odds -- a losing streak the seeded rng actually dealt once
  // wave 7's motes started drawing on the same stream -- while the loop is
  // written for forty. The check is about the heap, not the bankroll.
  window.__give(40000);
  const stake = state().stakes.dust;

  // Play it until a win, so the pot on the table is two thousand -- which is the
  // first number in this building that is not drawn one for one.
  let won = null, air = 0;
  for (let i = 0; i < 40 && !won; i++) {
    if (state().pot) { window.__buy('bank'); runUntil(() => !state().paying && state().tableAir === 0, 30); }
    window.__buy('stakedust');
    for (let f = 0; f < 3600 && (state().pouring || state().spinning); f++) {
      run(1 / 60);
      air = Math.max(air, state().tableAir);
    }
    if (state().pot) won = state();
  }

  // and it settles to the band rather than to the number
  const rested = runUntil(() => state().table === state().tableWant && !state().tableAir, 30);
  const settled = state();
  const on = settled.pot ? settled.pot.on : 0;
  const held = settled.stored;

  // taking it is still worth exactly what the row said, however few squares fly
  window.__buy('bank');
  const flying = state();
  runUntil(() => !state().paying && state().tableAir === 0, 40);
  const landed = state();

  return [
    ok(!!won && on === stake * 2, 'a win off the thousand chip puts two thousand on the table',
       `${on}`),
    ok(settled.tableWant === band(on), 'and the heap it asks for is the band, not the pot',
       `${settled.tableWant} grains for ${on}, band says ${band(on)}`),
    ok(band(on) < on, 'which is less sand than the pot has units',
       `${band(on)} of ${on}`),
    ok(rested && settled.table === settled.tableWant, 'the heap settles to it',
       `${settled.table} of ${settled.tableWant}`),
    ok(air <= 700 + 200, 'and nothing near the old cloud is ever in the air at once',
       `${air} at the worst`),
    ok(flying.paying === on, 'banking still sets off with the whole pot',
       `${flying.paying} of ${on}`),
    ok(landed.stored === held + on, 'and the hole is paid the pot to the grain',
       `${held} + ${on} -> ${landed.stored}`),
    ok(landed.table === 0 && landed.tableAir === 0, 'with nothing left on the ground',
       `${landed.table} left`)
  ];
});

// The ladder itself: every rung of it, against the game's own reading of a pot
// it is actually holding. The pot is set by playing the table up to it -- there
// is no way to hold ten million dust in a hole that does not fit it -- so this
// reads the function through the one number the yard reports.
group('the ladder is the one written down', async () => {
  atTheTable(0);
  const rungs = [10, 100, 200, 1000, 10000, 100000, 1000000, 10000000, 100000000];
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
    ok(said[said.length - 1] === 700, 'and it stops at the brim', `${said[said.length - 1]}`),
    ok(said[0] === 10 && said[1] === 100,
       'while everything up to a hundred is still one grain a unit',
       `${said[0]}, ${said[1]}`)
  ];
});
