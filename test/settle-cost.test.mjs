// What the sand costs when nothing is happening.
//
// `settle` used to walk every cell of every plot every frame: a hundred and
// twenty thousand cells of yard floor and forty thousand of hole, asking each
// one whether it had anywhere to fall and being told no. On an empty yard that
// was two thirds of the frame, sixty times a second, for ever -- and the checks
// in this folder, which simulate the better part of an hour of yard between
// them, spent most of their run doing it.
//
// So the plots now keep track of which columns are still moving and walk only
// those. This is the check that they do, and it is written as a fact about the
// code rather than as a stopwatch reading: `settleWork()` counts the columns
// `settle` has actually looked at, so "an untouched yard costs nothing" is
// zero rather than a number of milliseconds that would mean something different
// on every machine that ran it.
//
// The other half of the group matters just as much. A plot that never looks at
// anything is cheap and wrong -- dust hanging in mid-air, a heap that never
// finds its angle -- so every check about what it does NOT do is paired with one
// about the sand still behaving like sand.

import { group, ok, state, run, yard, P } from './helpers.mjs';

const { grid, floor } = yard;

// how many columns `settle` looked at over a stretch of frames
function costOf(seconds) {
  grid.resetSettleWork();
  run(seconds);
  return grid.settleWork();
}

// the highest cell in each column, so a heap can be told from a stack
const profile = () => {
  const tops = [];
  for (let c = 0; c < floor.cols; c++) {
    const r = grid.topRow(floor, c);
    if (r >= 0) tops.push([c, r + 1]);
  }
  return tops;
};

group('a yard where nothing is happening costs nothing to settle', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(3);                                  // and whatever was still in the air

  // A full second of an empty, quiet yard. The old walk would have read the
  // better part of eight million cells in the same stretch.
  const idle = costOf(1);

  // One grain, put down on bare ground. It wakes its own column and the two
  // beside it and nothing else, and once it has come to rest they go quiet
  // again -- so the whole episode is a handful of columns rather than a
  // hundred and twenty thousand cells a frame until the end of the run.
  const before = state().floor;
  const p = state().piles.find(q => q.key === 'rock');
  grid.resetSettleWork();
  window.__pile(p.from + 60, 1);
  run(1);
  const one = grid.settleWork();
  const after = state().floor;

  // ...and it goes back to nothing once the grain is down.
  const quiet = costOf(1);

  return [
    ok(idle === 0, 'a settled plot is not read at all', `${idle} columns walked`),
    ok(after === before + 1, 'the grain is on the ground', `${before} -> ${after}`),
    ok(one > 0 && one < 60, 'and putting it there costs a handful of columns',
       `${one} columns walked`),
    ok(quiet === 0, 'after which the plot is quiet again', `${quiet} columns walked`)
  ];
});

// The saving is only worth having if the sand is still sand. A column that has
// gone to sleep must wake the moment anything lands on it or beside it, or a
// heap would stand up as a stack and dust would hang where it was dropped.
group('sleeping ground still takes a heap', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(3);
  const idle = costOf(0.5);                // asleep to start with, by construction

  const p = state().piles.find(q => q.key === 'rock');
  const at = Math.round((p.from + p.to) / 2);
  window.__pile(at, 300);
  // A whole plot is settled a band of columns at a time -- see `settleSome` --
  // so a heap finds its angle over seconds rather than in one frame. This waits
  // for it to be finished rather than for it to have started.
  run(15);
  const tops = profile();
  const cols = tops.length;
  const tall = Math.max(...tops.map(t => t[1]));
  const grains = state().floor;

  // and it settles: the work falls back to nothing once the heap has found
  // its angle, rather than the plot churning for ever
  const rest = costOf(1);

  return [
    ok(idle === 0, 'the ground was asleep before the load landed', `${idle}`),
    ok(grains >= 300, 'every grain of the load is lying there', `${grains} grains`),
    ok(cols > 10, 'it spread along the ground rather than standing in one column',
       `${cols} columns across, ${tall} cells at the peak`),
    ok(tall < 300, 'and nothing went up as a spire', `${tall} cells`),
    ok(rest === 0, 'and the heap goes quiet once it has found its angle',
       `${rest} columns still being walked`)
  ];
});

// A grain that has to fall keeps its own column awake until it lands. This is
// the case that catches a column being put to sleep while something is still in
// mid-air: dust in this yard is dropped into the top of a column and falls, and
// a plot that stopped looking would leave it hanging.
group('a grain in mid-air keeps its column awake until it lands', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(3);

  const p = state().piles.find(q => q.key === 'rock');
  const c = Math.round((p.from + 60 - floor.x) / P);
  // Straight into the top of the column, which is not where `addGrain` would
  // have put it: this is the fall itself being checked, not the drop.
  grid.put(floor, c, floor.rows - 4, 3);
  run(10);                                 // long enough for the whole drop

  const stack = [];
  for (let r = 0; r < floor.rows; r++) if (grid.at(floor, c, r)) stack.push(r);
  const quiet = costOf(1);

  return [
    ok(stack.length === 1, 'the grain is still the only thing in the column',
       JSON.stringify(stack)),
    ok(stack[0] <= 1, 'and it fell all the way to the floor rather than hanging',
       `row ${stack[0]} of ${floor.rows}`),
    ok(quiet === 0, 'and the column sleeps once it is down', `${quiet}`)
  ];
});

// Everything that writes cells without going through `put` has to say so, or the
// plot believes a pile it has never seen is already settled. A save being loaded
// is the one that would bite hardest: the whole yard comes back as a run-length
// string written straight into the cells.
group('a plot loaded from a save is looked at again', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(3);
  const idle = costOf(0.5);

  // A yard's worth of dust, written the way `persist.js` writes it: into the
  // cells, behind the sand's back, and in mid-air rather than on the ground.
  const put = 40;
  for (let i = 0; i < put; i++) floor.grid[(floor.rows - 6) * floor.cols + 200 + i] = 3;
  grid.wakeGrid(floor);                    // which is what the loader says for real
  run(10);

  let hanging = 0;
  for (let c = 0; c < floor.cols; c++) {
    for (let r = 1; r < floor.rows; r++) {
      if (grid.at(floor, c, r) && !grid.at(floor, c, r - 1)) hanging++;
    }
  }
  const onFloor = grid.count(floor);

  return [
    ok(idle === 0, 'the plot was asleep before the save was written into it', `${idle}`),
    ok(onFloor === put, 'every cell the save wrote is still there',
       `${put} written, ${onFloor} there`),
    ok(hanging === 0, 'and none of it is left hanging in the air',
       `${hanging} grains with nothing under them`)
  ];
});
