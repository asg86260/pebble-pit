// The sky: the air filter and the reading that is not a button.

import { newRun, settle, state, buildShopFromTest, ok, shop, run, runUntil, buy, sleep, point, onScreen, hoverAway, raf } from './kit.js';
import { LOO_EVERY } from '../config.js';

// A mess tag as the player sees it (messtags.js): up and faded in, the count
// it says, and where its middle stands.
const tagOf = kind => {
  const el = document.querySelector(`#messtags .messtag[data-kind="${kind}"]`);
  const r = el.hidden ? null : el.getBoundingClientRect();
  return { on: !el.hidden && el.classList.contains('on') && getComputedStyle(el).opacity === '1',
           gone: el.hidden, n: Number(el.querySelector('.n').textContent),
           mid: r ? Math.round(r.left + r.width / 2) : null, top: r ? Math.round(r.top) : null };
};
// The page's frames until a thing is so, for a fade or a glide to finish.
const framesUntil = async (done, limit = 120) => {
  for (let i = 0; i < limit; i++) { await raf(); if (done()) return true; }
  return false;
};

export const TESTS = [
  // The problem, then the cure: the rain has to have come down on you once,
  // and something that dirties the sky has to be running, before the yard
  // will sell you anything to do about it.
  ['the air filter is offered after the rain and a machine', async () => {
    newRun();
    await settle();
    window.__crew(4, 4);
    window.__grant({ spores: 40 });
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
      ok(on && /^filthy, /i.test(on), 'a brim sky reads filthy on the gauge', String(on)),
      ok(on && /(getting worse|getting better|holding steady)$/i.test(on), 'and which way it is going', String(on)),
      ok(!off || !/getting|holding/i.test(off), 'and only over the gauge', String(off))
    ];
  }],

  // Muck down the way the game lays it, from a storm's wash, and poop the
  // way a crew with nowhere to go leaves it: each kind's card fades in with
  // its count, the two stand side by side, and as one kind is cleared its
  // card fades right out and the other glides to the middle.
  ['the muck and poop tags come up with the mess and go with the last of it', async () => {
    newRun();
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__poopSet(() => 0);
    await settle();
    const clean = [tagOf('muck'), tagOf('poop')];

    window.__air({ haze: state().smog.cap });
    window.__front(1);
    runUntil(() => state().smog.raining, 120);
    runUntil(() => !state().smog.raining, 120);
    window.__air({ haze: 0 });
    await settle(0);
    const muckUp = await framesUntil(() => tagOf('muck').on);
    const muck = tagOf('muck'), laid = state().smog.mess.muck;

    window.__crew(3, 2);
    const loo = LOO_EVERY;
    window.__tune('LOO_EVERY', 4000);   // so they go while we are watching
    runUntil(() => state().smog.mess.poop > 0, 90);
    window.__crew(0, 0);
    window.__tune('LOO_EVERY', loo);
    await settle(0);
    const poopUp = await framesUntil(() => tagOf('poop').on && tagOf('muck').on);
    await framesUntil(() => false, 25);   // the glide to two seats
    const both = [tagOf('muck'), tagOf('poop')], dropped = state().smog.mess.poop;

    window.__air({ muck: 0 });
    await settle(0);
    const muckGone = await framesUntil(() => tagOf('muck').gone);
    await framesUntil(() => false, 25);   // and the glide to the middle
    const alone = tagOf('poop');

    window.__poopSet(() => 0);
    await settle(0);
    const poopGone = await framesUntil(() => tagOf('poop').gone);
    const mid = Math.round(innerWidth / 2);
    return [
      ok(clean.every(t => t.gone), 'a clean yard has no tag up', JSON.stringify(clean)),
      ok(muckUp && laid > 0, 'a storm lays muck and the muck tag fades in', `${muckUp}, ${laid} cells`),
      ok(muck.n === state().smog.mess.muck || muck.n === laid, 'saying how many cells are down', `${muck.n} vs ${laid}`),
      ok(poopUp && both[1].n === dropped, "the crew's poop gets its own tag, with its own count", `${poopUp}, ${both[1].n} vs ${dropped}`),
      ok(both[0].mid < mid && both[1].mid > mid && both[0].top === both[1].top,
         'the two stand side by side about the middle', JSON.stringify(both)),
      ok(muckGone, 'swept clean, the muck tag fades right out', `${muckGone}`),
      ok(alone.on && Math.abs(alone.mid - mid) <= 1, 'and the poop tag is left standing in the middle', `${alone.mid} vs ${mid}`),
      ok(poopGone, 'and goes with the last of the poop', `${poopGone}`)
    ];
  }],
];
