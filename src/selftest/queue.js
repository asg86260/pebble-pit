// The queue card (queue.js): the one piece of the queue that needs a page --
// a card in the corner of the window that is absent on a fresh game, present
// the moment something is building, one name a line, and a press on a waiting
// name hands that work back. The mechanics of the line itself are the node
// tier's (test/queue.test.mjs).

import { newRun, raf, settle, state, ok, panel, run } from './kit.js';

const card = () => document.getElementById('queue');
const names = () => [...card().querySelectorAll('button .name')].map(n => n.textContent);
const showing = () => !card().hidden && !card().classList.contains('off');

export const TESTS = [
  ['the queue card is absent until something is building, then lists the line', async () => {
    newRun();
    await settle();
    window.__crew(3, 0);
    window.__give(200000);
    // Twenty seconds of hauling: `carry` is offered once a load has been seen carried.
    run(20);
    await raf();
    const before = showing();
    window.__buy('carry');
    run(0.1);
    await raf(); await raf();
    const one = { showing: showing(), names: names() };
    window.__buy('auto');
    run(0.1);
    await raf(); await raf();
    const two = { showing: showing(), names: names(), front: card().querySelector('button.front .pips')?.textContent,
                  clocks: [...card().querySelectorAll('button .left')].map(c => c.textContent.trim()) };
    window.__finish();
    run(0.1);
    await raf(); await raf();
    const after = showing();
    newRun();
    return [
      ok(!before, 'nothing building, no card'),
      ok(one.showing && one.names.length === 1, 'one press, one name on the card', one.names.join(', ')),
      ok(two.names.length === 2 && two.names[1] === 'hold to mine', 'a second press adds a second name behind it',
         two.names.join(', ')),
      ok(!!two.front && two.front.length === 5, 'the front line carries its bar as pips', `${two.front}`),
      // Two clocks. The front's is a figure, or its status while the builder
      // is still walking over; the waiting one's is always a figure, and more
      // than the front's when the front has one, since it counts both.
      ok(two.clocks.length === 2 && +two.clocks[1] > 0
         && (two.clocks[0] === 'building' || +two.clocks[1] > +two.clocks[0] && +two.clocks[0] > 0),
         'every line has a clock, and the waiting one counts what is ahead of it', two.clocks.join(' | ')),
      ok(!after, 'and the card goes when the line is empty')
    ];
  }],

  ['pressing a waiting name on the card hands the work back', async () => {
    newRun();
    await settle();
    window.__crew(3, 0);
    window.__give(200000);
    run(20);
    window.__buy('carry');
    const before = state().stored;
    window.__buy('auto');
    const paid = before - state().stored;
    run(0.1);
    await raf(); await raf();
    const wait = card().querySelector('button.wait');
    const front = card().querySelector('button.front');
    if (wait) wait.click();
    run(0.1);
    await raf(); await raf();
    const left = names();
    const back = state().stored;
    // The card stands under the boards: on a short window a board reaches the
    // corner the card is in, and the board you walked up to read is the one on
    // top. Read off the computed style, since that is the whole of the rule.
    const under = +getComputedStyle(card()).zIndex < +getComputedStyle(panel()).zIndex;
    newRun();
    return [
      ok(paid > 0, 'the second rung was paid for', `${paid}`),
      ok(!!wait && !!front && front.disabled, 'the front name is not a button; the waiting one is'),
      ok(left.length === 1, 'the waiting name is gone from the card', left.join(', ')),
      ok(back >= before, 'and the bill is back in the pile', `${before} -> ${back}`),
      ok(under, 'the card stands under the boards', `${getComputedStyle(card()).zIndex} vs ${getComputedStyle(panel()).zIndex}`)
    ];
  }]
];
