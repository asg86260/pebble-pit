// Wave 7, track C: the crew as people you meet rather than counters you read.
// A body minds stepping in somebody's leavings (item 6), the leavings answer
// the cursor even on the rock (item 9), the janitor's building is sold as the
// janitor's closet (item 10), the roster's two sprite lines stand apart and the
// janitor's shows no bare default body (items 11, 12), the hover card is three
// lines (item 17), and hovering a body holds it still (item 18).

import { group, ok, state, run, runUntil, yard, P, WORKER } from './helpers.mjs';
import { dropMuckAt, poopCols, muckFloor, colAt } from '../src/smog.js';
import { GROSS_MS, HOVER_PAUSE_MS } from '../src/config.js';
import { whatIsAt } from '../src/input.js';
import { OUTHOUSE_SECTIONS } from '../src/outhouse.js';
import { OUTHOUSE_ROWS } from '../src/upgrades/rows-outhouse.js';
import { rosterReport, postAt, POSTS } from '../src/roster.js';
import { card } from '../src/crewboard.js';
import { hoverAt } from '../src/crew/pointer.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A body out on the yard's floor with its feet on the ground, to put things in
// front of. Not one behind a door, in the air or off on a route down a hole.
const onGround = () => S.workers.find(w =>
  !w.inside && !w.walking && !w.falling && !w.aloft && !w.route &&
  Math.abs(muckFloor(colAt(w.x + WORKER / 2)) - (w.y + WORKER)) < P * 2);

// --- item 6: grossed out ---------------------------------------------------------
group('a body about to step in poop stops, says yuck, and goes around', async () => {
  window.__crew(2, 2);
  run(3);
  const w = runUntil(() => !!onGround(), 30) && onGround();
  if (!w) return [ok(false, 'somebody stands on the open floor to test with')];

  // The leavings land one column ahead of where the body is facing -- the very
  // cell its next step takes -- laid with the same call `relieve` uses, so the
  // stage is reading the ground a real squat writes.
  const dir = w.face || 1;
  const ahead = colAt(w.x + WORKER / 2 + dir * P);
  dropMuckAt(ahead * P + P / 2, 2, 'poop');
  const fouled = poopCols()[ahead] > 0;

  run(0.2);
  const stopped = w.grossUntil > 0;
  const said = w.say && w.say.mark === 'yuck';
  const xAtStop = w.x;
  const t0 = w.grossUntil;

  // it stands for the whole of GROSS_MS...
  run(GROSS_MS / 1000 / 2);
  const held = w.grossUntil === t0 && Math.abs(w.x - xAtStop) < P;

  // ...and then steps around rather than through
  runUntil(() => !w.grossUntil, 5);
  const around = colAt(w.x + WORKER / 2) !== ahead;
  const cooled = w.grossOkAt > now();

  return [
    ok(fouled, 'the poop is on the column ahead of the body', `col ${ahead}`),
    ok(stopped, 'the body stops the frame its next step would land in it'),
    ok(said, 'and says so over its head', w.say && w.say.mark),
    ok(held, 'it stands where it stopped for the length of the stop'),
    ok(around, 'then steps around the fouled column rather than through it',
       `at col ${colAt(w.x + WORKER / 2)}`),
    ok(cooled, 'and holds a cooldown so a crowd cannot gridlock',
       `${Math.round(w.grossOkAt - now())}ms`)
  ];
});

// --- item 9: the mess answers the cursor before the rock -------------------------
group('poop lying on the rock is what the cursor is told about', async () => {
  window.__crew(1, 1);
  run(1);
  // Leavings on the boulder's own footprint: the column under the rock's
  // center, laid the way a squat on the flank lays them.
  const c = colAt(S.cx);
  dropMuckAt(c * P + P / 2, 2, 'poop');
  const foot = muckFloor(c);
  const label = whatIsAt(c * P + P / 2, foot - P);
  // and bare rock, a little way off, still answers as the rock
  const clear = whatIsAt(S.cx + P * 4, foot + P * 4);
  return [
    ok(poopCols()[c] > 0, 'there is poop on a rock column', `col ${c}`),
    ok(label === 'poop', 'and pointing at it names the poop, not the rock', label),
    ok(clear !== 'poop', 'while the rock around it still answers for itself', clear)
  ];
});

// --- item 10: the janitor's closet -----------------------------------------------
// Bought the player's way: the mess appears, the row appears on the bench, the
// row is pressed -- and every word the player reads says closet while every key
// the save relies on still says outhouse.
group("the janitor's building is sold and titled as the janitor's closet", async () => {
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  run(90);                                       // they go, and the mess is seen
  window.__give(20000);
  const row = OUTHOUSE_ROWS.find(u => u.key === 'unlockouthouse');
  const offered = row.show();
  const pressed = window.__buy('unlockouthouse');
  window.__finish();
  return [
    ok(offered, 'mess on the ground puts the row on the bench'),
    ok(row.name === "build the janitor's closet",
       "and the row sells a janitor's closet", row.name),
    ok(!row.name.includes('outhouse'), 'with no outhouse in the words'),
    ok(OUTHOUSE_SECTIONS[0].title === "the janitor's closet",
       "the shed's own board is titled the same way", OUTHOUSE_SECTIONS[0].title),
    ok(pressed && S.outhouseOpen,
       'while the key it opens is still the outhouse, so old saves read back'),
    ok(row.key === 'unlockouthouse', 'and the row key is unchanged', row.key)
  ];
});

// --- items 11, 12: the roster's two sprite lines --------------------------------
group('the trade line stands a clear cell under the counter, and the janitor has no bare body', async () => {
  window.__crew(3, 2);
  window.__loo(true);                           // the shed up; buying it is the group above
  window.__kit({ breakers: 2 });             // so the rock post has a trade line
  run(1);
  const report = rosterReport();
  const rock = report.find(r => r.key === 'mine');
  const loo = report.find(r => r.key === 'loojob');
  const rockPost = POSTS.find(p => p.key === 'mine');
  // The counter body spans WORKER cells around its post's y; the trade body's
  // center sits WORKER + P*3 under the post, which leaves one clear cell
  // between the hat standing a cell proud of the trade square and the counter.
  const gap = rock && rock.trade ? rock.trade[1] - postAt(rockPost).y : null;
  return [
    ok(rock && !!rock.trade, 'the rock post draws a trade line', rock && rock.hats),
    ok(gap === WORKER + P * 3,
       'and it stands a clear cell below the counter group', `${gap}px`),
    ok(loo && loo.hats > 0, 'the janitor post owns its cap', loo && loo.hats),
    ok(loo && loo.trade === null,
       'but draws no second default body under the count -- the badge wears the cap')
  ];
});

// --- item 17: the slim card -----------------------------------------------------
group('a hovered body says who it is, how old, and what it is doing -- and no more', async () => {
  window.__crew(2, 1);
  run(2);
  const w = S.workers[0];
  const lines = card(w).split(String.fromCharCode(10));
  return [
    ok(lines.length === 3, 'the card is exactly three lines', String(lines.length)),
    ok(lines[0] === (w.name || 'somebody'), 'the name first', lines[0]),
    ok(lines[1].startsWith('age'), 'then the age', lines[1]),
    ok(lines[2].startsWith('doing'), 'then what it is doing this second', lines[2]),
    ok(!card(w).includes('favorite') && !card(w).includes('mined'),
       'and the biography rows are gone')
  ];
});

// --- item 18: hover holds a body still ------------------------------------------
group('the cursor resting on a body holds it where it stands, asking ?', async () => {
  window.__crew(2, 2);
  run(2);
  // whoever is out in the yard, hovered where it stands -- the same hit-test
  // the pointer makes, so this is the pointermove path minus the DOM event
  const w = S.workers.find(o => !o.inside && !o.aloft);
  const hit = hoverAt(w.x + WORKER / 2, w.y + WORKER / 2);
  const x0 = w.x, carried = w.carry || 0, claim = w.claim;
  run(0.4);                                     // well inside the pause
  const held = Math.abs(w.x - x0) < 1;
  const asks = w.say && w.say.mark === '?';
  // the cursor moves off, and the pause lapses rather than being cleared
  run(HOVER_PAUSE_MS / 1000 + 0.5);
  const dropped = (w.carry || 0) < carried;
  const claimBroken = claim >= 0 && w.claim !== claim && w.pauseUntil > now();
  return [
    ok(hit === w, 'the hit-test finds the body under the cursor'),
    ok(w.pauseUntil > 0, 'and stamps the pause on it'),
    ok(held, 'the body stands still while the pause holds', `${w.x - x0}px`),
    ok(asks, 'and asks ? over its head', w.say && w.say.mark),
    ok(!(w.pauseUntil > now()), 'the pause lapses once the cursor is gone'),
    ok(!dropped && !claimBroken, 'and nothing was dropped and no claim broken')
  ];
});
