// The end of the story: the fact the ending sheet (ending.js) is hung on.
//
// The sheet itself is DOM and this tier has none, so what is checked here is
// the fact under it -- that after the rescue the story is owed a sheet and
// nothing in the sim has quietly said it already, and that a save from
// before the sheet existed, with the rescue behind it, does not get one on
// load. The rescue itself is bought and walked in shield.test.mjs; this
// check reads the yard's own record of it rather than staging it again.
import { group, ok, state, run, yard } from './helpers.mjs';
import { S } from '../src/state.js';

const KEY = 'boulder-clicker/v4';

group('a rescued yard owes the ending until the sheet is put down', async () => {
  window.__reset();
  window.__crew(2, 1);
  run(1);
  const fresh = state();
  // the rescue's own record, as intro.js leaves it: out, and no beat running
  S.rescued = true; S.buried = false;
  yard.persist();
  S.beatsDone.push('ending');                // scribbled over, to prove the load reads it
  yard.restore();
  const back = state();
  run(1 / 60);                               // the ending beat takes the sheet
  window.__skipBeat('sheet');                // the button
  yard.persist();
  yard.restore();
  const told = state();
  window.__reset();
  return [
    ok(!fresh.beatsDone.includes('ending') && !fresh.rescued, 'a fresh yard has no story to tell yet'),
    ok(back.rescued && !back.beatsDone.includes('ending'), 'rescued and not yet told survives a reload, so the sheet comes back',
       `rescued ${back.rescued} done ${back.beatsDone}`),
    ok(told.beatsDone.includes('ending'), 'and once put down it stays down')
  ];
});

group('a save from before the sheet, with the rescue behind it, is not owed one', async () => {
  window.__reset();
  run(1);
  yard.persist();
  const s = JSON.parse(localStorage.getItem(KEY));
  s.rescued = true;
  delete s.storyTold;
  delete s.beatsDone;                        // a save from before the beats
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const old = state();
  window.__reset();
  return [
    ok(old.rescued && old.beatsDone.includes('ending'), 'the ending is taken as read', `done ${old.beatsDone}`)
  ];
});
