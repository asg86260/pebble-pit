// The sky: the air filter and the reading that is not a button.

import { newRun, settle, state, buildShopFromTest, ok, shop, run, runUntil, buy, sleep, point, onScreen, hoverAway } from './kit.js';

export const TESTS = [
  // The problem, then the cure: the rain has to have come down on you once,
  // and something that dirties the sky has to be running, before the yard
  // will sell you anything to do about it.
  ['the air filter is offered after the rain and a machine', async () => {
    newRun();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__invest();
    const has = () => { buildShopFromTest(); return !!shop().querySelector('[data-key="unlockfilter"]'); };

    run(2);
    const clean = has();
    const blind = state().seenAir;

    // A dirty sky and the next front brought forward: the rain is on a clock
    // of its own and the dirt never starts it.
    window.__air({ haze: state().smog.cap });
    window.__front(1);
    runUntil(() => state().smog.rains > 0, 60);
    run(20);
    const rained = has();
    const told = state().seenAir;

    // ...and the second thing: a machine running.
    window.__fullSites();
    window.__machine('jaw', { bought: true });
    const both = has();
    const air = state().smog;
    window.__machine('jaw', { bought: false });
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!clean, 'a yard that has never been rained on is offered nothing', `${clean}`),
      ok(!blind, 'and has no reading of the sky to go on either', `${blind}`),
      ok(told, 'the first rain is what gives you the reading', `${told}`),
      ok(!rained, 'which on its own is still not enough to sell you the house', `${rained}`),
      ok(both, 'the rain and a machine are what open it', `${both}`),
      ok(air.rains > 0, 'and it took a real rain to get there', `${air.rains}`)
    ];
  }],


  ["the air filter's gauge says what it reads when you hover it", async () => {
    newRun();
    await settle();
    window.__crew(0, 0);
    window.__air({ open: true, haze: state().smog.cap, purifiers: 1 });
    run(8);
    const tip = document.getElementById('tip');
    const hover = async (wx, wy) => {
      window.__look(wx - 380);
      await sleep(60);
      const [x, y] = onScreen(wx, wy);
      point('pointermove', x, y, 0);
      await sleep(140);
      return tip.hidden ? null : tip.textContent;
    };
    const r = window.__dialRect();
    const on = await hover(r.x + r.w / 2, r.y + r.h / 2);
    const off = await hover(r.x + r.w / 2, r.y - r.h * 3);
    await hoverAway();
    return [
      ok(on && /air: filthy/i.test(on), 'a brim sky reads filthy on the gauge', String(on)),
      ok(on && /% of the brim/i.test(on) && /fouling \d+ a min, filtering \d+ a min/i.test(on),
         'with how full it is and both rates', String(on)),
      ok(on && /the sky is (filling|clearing|holding)/i.test(on), 'and which way it is going', String(on)),
      ok(!off || !/air:/i.test(off), 'and only over the gauge', String(off))
    ];
  }],
];
