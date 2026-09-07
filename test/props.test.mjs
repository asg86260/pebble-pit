// The props: the first shield. Bought the player's way -- through the bench
// row -- raised a plank at a time by bodies crossing the yard, and smashed
// through by the next rock, with the timber coming home as dust. One group,
// because it is one story: the row, the build, the failure, and the row never
// coming back.
import { group, ok, state, run, runUntil } from './helpers.mjs';
import { PROP_PLANKS, PROP_PLANK_DUST, PROP_FROM, PROP_COST } from '../src/config.js';

group('the props go up by somebody walking, and the next rock comes through', async () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(PROP_COST * 2);
  run(1);

  const row = () => window.__upgrades().find(u => u.key === 'props');
  const offered = !!row()?.show();
  const bought = window.__buy('props');
  const started = state();

  // The build is trips, not a timer: nothing is standing at the moment of
  // purchase, and the count only moves when a body arrives with a plank.
  const before = state().props?.laid ?? 0;
  run(2);
  const built = runUntil(() => (state().props?.laid ?? 0) >= PROP_PLANKS, 400);
  const up = state();

  // Finish the rock and let the next one fall on the finished frame. The fall
  // is under a second, so it cannot be caught at one sample a game-second --
  // `propsDone` is the fact that it fell and came through.
  window.__next();
  const answered = runUntil(() => state().propsDone, 180);
  const smashed = state();
  const landed = runUntil(() => state().chips === 0, 120);
  const after = state();

  window.__reset();
  return [
    ok(offered, 'the row is on the bench once enough rocks have fallen'),
    ok(bought, 'and it buys, the way a player buys it'),
    ok(started.props && started.props.laid === 0,
       'nothing is standing at the moment of purchase', JSON.stringify(started.props)),
    ok(before === 0 && built,
       'the crew raise it a plank at a time', `laid ${up.props?.laid}/${PROP_PLANKS}`),
    ok(answered && !smashed.props, 'the next rock comes down and straight through the frame'),
    ok(smashed.chips > 0 || after.floor > up.floor || after.pit > up.pit,
       'the planks fly rather than vanish', `${smashed.chips} chips in the air`),
    ok(landed && (after.floor + after.pit) - (up.floor + up.pit) >=
       Math.round(PROP_PLANKS * PROP_PLANK_DUST * 0.5),
       'and the wreck comes most of the way home as dust',
       `${(after.floor + after.pit) - (up.floor + up.pit)} cells of ${PROP_PLANKS * PROP_PLANK_DUST}`),
    ok(!row()?.show() && after.propsDone, 'the row never comes back')
  ];
});
