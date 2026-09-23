// The deep's crew is set at the shaft (DESIGN.md, "The deep's crew is set at
// the shaft"): one count, a post over the drowned pit and another at the
// shaft's foot, and a body stays in the half it is put in. Every move here is
// a press on the roster's buttons, the way a player makes it; the deep itself
// (the pit drowned, the snatch behind it) is set up with the hooks.

import { group, ok, run, runUntil, state } from './helpers.mjs';
import { S } from '../src/state.js';
import { WORKER, PILE_LIMIT } from '../src/config.js';
import { rosterHit } from '../src/roster.js';
import { belowYard } from '../src/route.js';
import { mouthX, deepFloor } from '../src/deep/place.js';

const post = key => state().roster.find(p => p.key === key);
const press = (key, which) => { const p = post(key); return !!p && rosterHit(p[which][0], p[which][1]); };
const deepBodies = () => S.workers.filter(w => belowYard(w));

// The snatch behind it, nobody on a weapon, a yard of haulers.
function deepYard(haulers = 4) {
  window.__snatch({ played: true });
  window.__deepCrew({});
  window.__crew(0, haulers);
  run(1);
}

group("the shaft's + walks a yard hand down the shaft, and it gathers down there", async () => {
  deepYard();
  const shown = !!post('shaft') && !!post('shaftdeep');
  const haulers = S.haulers;
  const pressed = press('shaft', 'more');
  const w = S.workers.find(o => o.type === 'gatherer');
  let shaft = false;
  const there = runUntil(() => {
    const b = w && S.workers.find(o => o.name === w.name);
    if (b && Math.abs(b.x + WORKER / 2 - mouthX()) < WORKER && b.y > S.groundY) shaft = true;
    return b && belowYard(b) && Math.abs(b.y + WORKER - deepFloor()) < 1;
  }, 90);
  return [
    ok(shown, 'the shaft has its post in both halves'),
    ok(pressed && S.deepCrew === 1 && S.gatherers === 1 && S.haulers === haulers - 1,
       'the + makes one of the haulers the deep\'s', `deepCrew ${S.deepCrew}, gatherers ${S.gatherers}, haulers ${S.haulers}`),
    ok(there && shaft, 'and it walks down the shaft to the deep\'s floor')
  ];
});

group('+ under the altar with nobody spare below brings a hand down to it', async () => {
  deepYard();
  const pressed = press('altarjob', 'more');
  const w = S.workers.find(o => o.type === 'brawler');
  const there = runUntil(() => w && belowYard(S.workers.find(o => o.name === w.name) || w), 90);
  return [
    ok(pressed && S.brawlers === 1 && S.deepCrew === 1 && S.gatherers === 0,
       'the altar takes one, and the deep\'s crew is one more for it', `brawlers ${S.brawlers}, deepCrew ${S.deepCrew}`),
    ok(there, 'and it goes down')
  ];
});

group("a hand of the deep's with nothing to do stays down, however full the yard's piles", async () => {
  deepYard(6);
  press('shaft', 'more');
  press('shaft', 'more');
  runUntil(() => deepBodies().length === 2, 90);
  // A yard pile heaped past its limit: the lent haulers used to be called up
  // for this. The deep's own are the deep's.
  const pile = S.piles.find(p => p.key === 'quarry');
  window.__pile((pile.from + pile.to) / 2, PILE_LIMIT.quarry + 60);
  let up = 0;
  for (let f = 0; f < 60 * 20; f++) {
    run(1 / 60);
    if (S.workers.filter(w => w.type === 'gatherer').some(w => !belowYard(w))) up++;
  }
  return [
    ok(S.deepCrew === 2 && S.gatherers === 2, 'the deep keeps its two', `deepCrew ${S.deepCrew}`),
    ok(up === 0, 'and neither comes up to haul', `${up} frames with one up top`)
  ];
});

group("the shaft's buttons go pale when there is nobody to move", async () => {
  deepYard(1);
  const start = post('shaft');
  press('shaft', 'more');                 // the one hauler, sent down
  const sent = post('shaft');
  press('altarjob', 'more');              // and put on the altar
  const onAltar = post('shaft');
  const refused = !press('shaft', 'less') || S.deepCrew === 1;
  return [
    ok(start.canMore && !start.canLess, 'with nobody down there, only + is live'),
    ok(!sent.canMore && sent.canLess, 'with the one hauler down there, only - is', JSON.stringify(sent)),
    ok(!onAltar.canLess && refused && S.brawlers === 1,
       "with it on the altar, the shaft's - does not pull it off the weapon", `brawlers ${S.brawlers}, deepCrew ${S.deepCrew}`)
  ];
});

// What the pointer says over them: the post is the abyssal workers' count in
// both halves, and the arrow at the shaft says which way it goes.
group('the shaft post and arrow say what they are', async () => {
  deepYard();
  const { whatIsAt } = await import('../src/input.js');
  const { arrowBox } = await import('../src/render/shaftway.js');
  const at = key => { const p = post(key); return whatIsAt((p.less[0] + p.more[0]) / 2, p.less[1]); };
  const yardPost = at('shaft');
  const yardArrow = (b => whatIsAt(b.x + b.w / 2, b.y + b.h / 2))(arrowBox(false));
  window.__view('deep');
  const deepPost = at('shaftdeep');
  const deepArrow = (b => whatIsAt(b.x + b.w / 2, b.y + b.h / 2))(arrowBox(true));
  return [
    ok(yardPost === 'abyssal workers' && deepPost === 'abyssal workers', 'the post, in both halves', `${yardPost} / ${deepPost}`),
    ok(yardArrow === 'down to the deep' && deepArrow === 'up to the yard', 'and the arrow', `${yardArrow} / ${deepArrow}`)
  ];
}, { reload: false });

// A body thrown in the deep sinks there (crew/falls.js, `sink`): it never
// jumps, never leaves the deep, lands on the deep's floor and goes back to
// its work from there. It used to be stood on the yard's ground the frame it
// was let go of.
group('a hand thrown in the deep sinks to its floor and stays down there', async () => {
  const { lift, drop } = await import('../src/crew/pointer.js');
  const { deepTop } = await import('../src/deep/place.js');
  deepYard();
  press('altarjob', 'more');
  const w0 = S.workers.find(o => o.type === 'brawler');
  runUntil(() => belowYard(S.workers.find(o => o.name === w0.name)) && !S.workers.find(o => o.name === w0.name).walking, 120);
  const w = S.workers.find(o => o.name === w0.name);
  lift(w);
  w.x -= 120; w.y -= 200;                 // carried up into the water and off to one side
  drop(w);
  let jump = 0, left = false, at = { x: w.x, y: w.y }, landed = false;
  for (let f = 0; f < 60 * 30; f++) {
    run(1 / 60);
    const b = S.workers.find(o => o.name === w.name);
    jump = Math.max(jump, Math.hypot(b.x - at.x, b.y - at.y));
    at = { x: b.x, y: b.y };
    if (b.y + WORKER <= deepTop()) left = true;
    if (!b.falling && Math.abs(b.y + WORKER - deepFloor()) < 2) landed = true;
  }
  const back = S.workers.find(o => o.name === w.name);
  return [
    ok(!left, 'it never came up out of the deep'),
    ok(jump < WORKER, 'it never jumped', `${jump.toFixed(1)}px in a frame`),
    ok(landed, "it came to rest on the deep's floor"),
    ok(back.type === 'brawler' && belowYard(back), 'and it is still the altar\'s, down there')
  ];
}, { reload: false });
