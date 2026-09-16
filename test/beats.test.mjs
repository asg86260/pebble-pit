// The story is one table (beats.js): every beat plays once, a click on any
// of them lands the fact it was about, two beats share the yard only with
// different owners, and a save from before the table folds into it. Each is
// reached the way a player reaches it -- the opening watched, the rock mined
// out, the dome bought and stood under -- and cut with the click the beat
// answers to. DESIGN.md, "Beats and gates: one table each".
import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';
import { BEATS } from '../src/beats.js';
import { PROP_FROM, NET_COST, ARCH_COST, DOME_BILL } from '../src/config.js';

const KEY = 'boulder-clicker/v4';
const OPENING = ['leave', 'chat', 'fall', 'down', 'up', 'show'];
const once = (done, keys) => keys.every(k => done.filter(d => d === k).length === 1);

group('a fresh yard plays the opening through, each beat once, across a reload', async () => {
  window.__reset(true);
  const seen = [];
  for (let i = 0; i < 60 * 90 && !state().beatsDone.includes('show'); i++) {
    run(1 / 60);
    const k = state().beat.yard;
    if (k && !seen.includes(k)) seen.push(k);
  }
  const played = state();

  // ...and again, with the tab closed on the chat: the opening is not written
  // down, so it starts over from the door, and still plays each beat once.
  window.__reset(true);
  runUntil(() => state().beat.yard === 'chat', 20);
  const chatting = state();
  window.__reload();
  const back = state();
  runUntil(() => state().beatsDone.includes('show'), 90);
  const again = state();
  window.__reset();
  return [
    ok(seen.join(' ') === OPENING.join(' '), 'the six beats play in order', seen.join(' ')),
    ok(once(played.beatsDone, OPENING), 'and each is done exactly once', played.beatsDone.join(' ')),
    ok(played.beat.yard === null && played.crew === 1 && played.buried,
       'leaving one body in the yard and one under the rock',
       `beat ${played.beat.yard}, crew ${played.crew}, buried ${played.buried}`),
    ok(chatting.beat.yard === 'chat' && back.beat.yard === 'leave',
       'a reload mid-chat starts the opening over from the door',
       `${chatting.beat.yard} -> ${back.beat.yard}`),
    ok(once(again.beatsDone, OPENING), 'and it still plays each beat once', again.beatsDone.join(' ')),
  ];
});

// The dome's first hold, the way skip.test.mjs reaches it.
const fundDome = () => {
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n);
    else window.__grant({ [money + 's']: n });
  }
};
const through = (kind) => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
};
const standAtDome = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2 });
  run(1);
  openSites();
  window.__crew(2, 1);
  for (const k of ['props', 'net', 'arch']) through(k);
  window.__meteor();
  fundDome();
  window.__crew(2, 1, 0, 0, 0, 1);
  window.__buy('dome');
  runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 400);
};

group('a skipped beat lands the fact it was about', async () => {
  // the chat: the rock comes down, and there is one body in the yard
  window.__reset(true);
  runUntil(() => state().beat.yard === 'chat', 20);
  const talking = state();
  window.__skipBeat('yard');
  run(1 / 60);
  const cutChat = state();

  // the parting: the pair are parted and the next rock is on its way
  window.__reset(true);
  runUntil(() => !state().beat.yard, 200);
  window.__crew(3, 1);
  const before = state();
  window.__next();
  runUntil(() => state().beat.yard === 'part', 200);
  const parting = state();
  window.__skipBeat('yard');
  run(1 / 60);
  const cutPart = state();

  // the rescue: the body is out, and walks -- the click hurries the dig, not
  // the walk
  standAtDome();
  const crew0 = state().crew;
  window.__next();
  runUntil(() => state().beat.yard === 'rescue', 400);
  const holding = state();
  window.__skipBeat('yard');
  run(1 / 60);
  const cutRescue = state();
  const walked = runUntil(() => !state().beat.yard, 30);
  const out = state();
  window.__reset();
  return [
    ok(talking.beat.yard === 'chat' && talking.rock === 0, 'they are talking and there is no rock',
       `${talking.beat.yard}, rock ${talking.rock}`),
    ok(!cutChat.beat.yard && cutChat.rock > 0 && cutChat.crew === 1 && cutChat.buried,
       'cut, the rock is down and one of them is under it',
       `beat ${cutChat.beat.yard}, rock ${cutChat.rock}, crew ${cutChat.crew}, buried ${cutChat.buried}`),
    ok(once(cutChat.beatsDone, OPENING), 'and the whole opening is done once', cutChat.beatsDone.join(' ')),
    ok(parting.beat.yard === 'part', 'the pair are parting', `${parting.beat.yard}`),
    ok(!cutPart.beat.yard && cutPart.beatsDone.includes('part') && cutPart.boulderNo === before.boulderNo + 1,
       'cut, they are parted and the next rock is coming',
       `beat ${cutPart.beat.yard}, rock ${before.boulderNo} -> ${cutPart.boulderNo}`),
    ok(holding.beat.yard === 'rescue' && holding.buried, 'the dome holds and the one under is still under'),
    ok(cutRescue.rescued && !cutRescue.buried && cutRescue.beat.yard === 'rescue' && cutRescue.pair === 1,
       'cut, the body is out and still walking', `rescued ${cutRescue.rescued}, beat ${cutRescue.beat.yard}, pair ${cutRescue.pair}`),
    ok(walked && out.beatsDone.includes('rescue') && out.crew === crew0 + 1,
       'and joins the crew when the walk is walked', `crew ${crew0} -> ${out.crew}`),
  ];
});

group('the rescue and the dome run together, one owning the yard and one the camera', async () => {
  standAtDome();
  window.__next();
  let together = false, frames = 0;
  // The rule in verify.js (no owner holds two beats, a running key is a row
  // of the table, never one that has played) is asked by `fast` after every
  // one of these frames; the check here is only that the two really overlap.
  while (frames < 60 * 60 && !(state().rescued && !state().beat.yard)) {
    run(1 / 60);
    frames++;
    const s = state();
    if (s.beat.yard === 'rescue' && s.beat.camera === 'dome') together = true;
  }
  const after = state();
  window.__reset();
  return [
    ok(together, 'the rescue owns the yard while the dome owns the camera'),
    ok(after.beatsDone.includes('rescue') && after.rescued, 'and the rescue is played', after.beatsDone.join(' ')),
    ok(BEATS.every(r => ['yard', 'camera', 'sheet'].includes(r.owns)), 'every row names an owner'),
  ];
});

group('a save from before the table loads with its beats done, and plays none', async () => {
  window.__reset();
  window.__crew(2, 1);
  run(1);
  yard.persist();
  const s = JSON.parse(localStorage.getItem(KEY));
  delete s.beatsDone;
  delete s.beat;
  s.introDone = true;
  s.reunionDone = true;
  s.rescued = true;
  s.storyTold = true;
  s.cineOwed = 'arch';                       // a scene the old sitting closed the tab on
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const old = state();
  run(3);
  const later = state();
  window.__reset();
  return [
    ok(['leave', 'chat', 'fall', 'down', 'up', 'show', 'meet', 'part', 'rescue', 'ending'].every(k => old.beatsDone.includes(k)),
       'the six flags fold into the set', old.beatsDone.join(' ')),
    ok(old.beat.camera === 'arch', 'and the scene it was owed is the running camera beat', `${old.beat.camera}`),
    ok(!later.beat.yard && !later.beat.sheet, 'no yard or sheet beat plays over it',
       `${later.beat.yard} ${later.beat.sheet}`),
  ];
});
