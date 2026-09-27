// The same row, queued again: a press on a row already in the works puts the
// next copy in line, paid on the press at its own price; the refund strip at
// the foot of the card hands back the newest copy still waiting. See
// DESIGN.md, "The same row, queued again".
//
// Bought the way a player buys -- `__buy`, the card's own press -- and handed
// back by `__handBack`, the function the strip calls. The strip itself, under
// a real pointer, is the browser tier's (src/selftest/boards.js).

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { billOf } from '../src/upgrades.js';
import { siteBox, worksAt } from '../src/works.js';
import { LADDER } from '../src/config.js';

const at = site => (state().line || {})[site] || [];
const purse = () => state().stored;
const row = key => window.__upgrades().find(u => u.key === key);
const dustOf = key => (billOf(row(key)).find(([m]) => m === 'dust') || [0, 0])[1];

// Three hands and a full purse; the carry ladder is offered once dragging has
// been seen, which is set by hand here because it is the gate on the row and
// not the thing under test.
const setUp = (dust = 50000) => {
  window.__crew(3, 0);
  window.__grant({ dust });
  yard.S.seenDrag = true;
  yard.S.autoMine = true;
  run(0.5);
};

group('a row pressed twice is two copies in line, each at its own price', async () => {
  setUp();
  const quoted1 = dustOf('carry');
  const p0 = purse();
  const first = window.__buy('carry');
  const p1 = purse();
  const quoted2 = dustOf('carry');
  const second = window.__buy('carry');
  const p2 = purse();
  const list = at('bench').map(w => w.key);
  return [
    ok(first && second, 'both presses go through', `${first} ${second}`),
    ok(list.join(',') === 'carry,carry', 'two copies of the row in the line', list.join(',')),
    ok(p0 - p1 === quoted1 && p1 - p2 === quoted2, 'each paid on the press, at the price the card showed',
       `${p0 - p1}/${quoted1} ${p1 - p2}/${quoted2}`),
    ok(quoted2 > quoted1, 'and the second is priced as the next rung up', `${quoted1} then ${quoted2}`),
    ok(state().carryLevel === 0, 'nothing has landed yet', `${state().carryLevel}`),
  ];
});

// The carry ladder's first band is dust alone, so two rungs of it can be
// queued on a yard with nothing else open; the ladders' own bands are
// test/ladder-bands territory.
group('the refund hands back the newest waiting copy, at what it cost', async () => {
  setUp();
  window.__buy('carry');
  window.__buy('autotoss');
  const before = purse();
  const second = dustOf('carry');
  window.__buy('carry');
  run(0.25);
  const back = window.__handBack('carry');
  run(0.25);
  const list = at('bench').map(w => w.key);
  const next = dustOf('carry');
  return [
    ok(back === true, 'a copy came out of the line', `${back}`),
    ok(list.join(',') === 'carry,autotoss', 'the newest copy, and only it', list.join(',')),
    ok(purse() === before, 'with its whole bill back in the pile', `${before} -> ${purse()}`),
    ok(next === second, 'and the card offers that rung again at the same price', `${second} -> ${next}`),
  ];
});

group('no copy is queued into a band whose coin the yard has not met', async () => {
  setUp();
  const a = window.__buy('carry');
  const b = window.__buy('carry');
  const c = window.__buy('carry');
  return [
    ok(a && b, 'both rungs of the dust band are queued', `${a} ${b}`),
    ok(c === false && at('bench').length === 2, 'the third, which asks crops, is not',
       `${c}, ${at('bench').length} in line`),
  ];
});

group('a press you cannot pay for buys nothing', async () => {
  setUp(0);
  // Exactly the first rung: the second is the next rung's bill, which is more.
  window.__grant({ dust: dustOf('carry') - purse() });
  const first = window.__buy('carry');
  const had = purse();
  const asked = dustOf('carry');
  const second = window.__buy('carry');
  return [
    ok(first === true, 'the first rung is bought', `${first}`),
    ok(asked > had, 'the next rung costs more than is left', `${asked} > ${had}`),
    ok(second === false, 'the second press buys nothing', `${second}`),
    ok(purse() === had && at('bench').length === 1, 'the purse and the line are as they were',
       `${had} -> ${purse()}, ${at('bench').length} in line`),
  ];
});

group('both copies land in turn, and the ladder is two up', async () => {
  setUp();
  window.__buy('carry');
  window.__buy('carry');
  run(2);
  const early = at('bench');
  const landed = [];
  runUntil(() => {
    if (landed[landed.length - 1] !== state().carryLevel) landed.push(state().carryLevel);
    return at('bench').length === 0;
  }, 240);
  return [
    ok(early.length === 2 && early[0].done > 0 && early[1].done === 0,
       'the front copy is being built and the one behind it stands at nought',
       early.map(w => `${w.key}:${w.done}`).join(' ')),
    ok(landed.join(',') === '0,1,2', 'they land one at a time', landed.join(',')),
    ok(state().carryLevel === 2, 'and the ladder is two up', `${state().carryLevel}`),
  ];
});

group('a ladder cannot be queued past its top', async () => {
  setUp(5000000);
  window.__levels({ carryLevel: LADDER - 2 });
  // Every coin the top band asks, and a yard that has met them all: the
  // setup this check is not about.
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
  Object.assign(yard.S, { farmOpen: true, quarryOpen: true, seenSpark: true });
  const a = window.__buy('carry');
  const b = window.__buy('carry');
  const c = window.__buy('carry');
  return [
    ok(a && b, 'the last two rungs are queued', `${a} ${b}`),
    ok(c === false && at('bench').length === 2, 'and a third press finds nothing left to sell',
       `${c}, ${at('bench').length} in line`),
  ];
});

group('a one-off in the works is not bought twice', async () => {
  setUp();
  const first = window.__buy('autotoss');
  const before = purse();
  const second = window.__buy('autotoss');
  return [
    ok(first === true, 'hold to toss is bought', `${first}`),
    ok(second === false && purse() === before, 'a second press buys nothing', `${second}, ${before} -> ${purse()}`),
    ok(at('bench').filter(w => w.key === 'autotoss').length === 1, 'one copy in the line',
       at('bench').map(w => w.key).join(',')),
  ];
});

group('two houses queued stand on two rooms, and both go up', async () => {
  setUp();
  const crew = state().crew;
  const a = window.__buy('house');
  const b = window.__buy('house');
  const [w1, w2] = worksAt('yard').filter(w => w.key === 'house');
  const box1 = w1 && siteBox('yard', w1), box2 = w2 && siteBox('yard', w2);
  runUntil(() => !worksAt('yard').some(w => w.key === 'house'), 400);
  return [
    ok(a && b, 'both houses are bought', `${a} ${b}`),
    ok(!!box1 && !!box2 && (box2.w !== box1.w || box2.y !== box1.y || box2.x !== box1.x),
       'the second stands on ground of its own, the room after the first',
       `${JSON.stringify(box1)} ${JSON.stringify(box2)}`),
    ok(state().crew === crew + 2, 'and two more bodies live there', `${crew} -> ${state().crew}`),
  ];
});

group('copies in line come back from a save as themselves', async () => {
  setUp();
  window.__buy('carry');
  window.__buy('autotoss');
  window.__buy('carry');
  run(1);
  const was = worksAt('bench').map(w => `${w.key}:${w.id}:${w.done > 0 ? 'going' : 'waiting'}`);
  window.__reload();
  run(0.1);
  const now = worksAt('bench').map(w => `${w.key}:${w.id}:${w.done > 0 ? 'going' : 'waiting'}`);
  const back = window.__handBack('carry');
  return [
    ok(was.length === 3 && new Set(worksAt('bench').map(w => w.id)).size === worksAt('bench').length,
       'two copies of carry and a toss between, told apart by their ids', was.join(' ')),
    ok(now.join(' ') === was.join(' '), 'the same three after the reload', `${was.join(' ')} -> ${now.join(' ')}`),
    ok(back === true, 'and the newest can still be handed back', `${back}`),
  ];
});
