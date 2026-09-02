// What a refresh may not do.
//
// A reload is the one moment the whole yard is written down and read back, and
// anything the writing forgets is destroyed. It reads as the yard standing about
// -- the crew come back empty-handed with a floor they had already swept, so
// there is nothing to fetch until the rock gives up something new -- and the
// dust is gone as well as the minute.
//
// Loaded from a real save rather than a yard built by hand, because what makes
// this bite is a played yard's shape: fifteen carters keep the floor clear, so
// at any moment most of the dust in flight is in somebody's hands.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, yard } from './helpers.mjs';

const player = () =>
  readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8');

const held = () => yard.S.workers.reduce((n, w) => n + (w.carry || 0), 0);
const hands = () => yard.S.workers.filter(w => w.carry > 0).length;

group('a refresh does not empty the crew\'s hands', async () => {
  localStorage.setItem('boulder-clicker/v4', player());
  yard.restore();
  // Long enough for the carters to be mid-errand, which for this yard is most
  // of the time: the floor is swept and the dust is in transit.
  run(25);

  const wasHeld = held(), wasHands = hands(), wasBanked = state().stored;
  window.__reload();                 // persist + restore, the two calls a page load makes
  const nowHeld = held(), nowHands = hands();

  // and it goes on working rather than standing about
  let dead = 0;
  for (let i = 0; i < 10; i++) { const a = state().stored; run(1); if (state().stored === a) dead++; }

  return [
    ok(wasHands > 0, 'somebody was carrying something to begin with',
       `${wasHands} pairs of hands, ${wasHeld} grains`),
    ok(nowHands === wasHands && nowHeld === wasHeld,
       'and they still are afterwards',
       `${wasHands}/${wasHeld} before, ${nowHands}/${nowHeld} after`),
    ok(state().stored >= wasBanked, 'nothing was banked twice over',
       `${wasBanked} -> ${state().stored}`),
    ok(dead <= 2, 'and the yard keeps banking through the reload',
       `${dead} of ten seconds with nothing banked`)
  ];
});

// And the other half of coming back: a body picks up where it was, rather than
// being handed the one goal a factory-fresh body gets. Everybody used to come
// back on `goal: 'to'` -- "walk to your station" -- which for a quarrier already
// standing on the floor of the cut meant walking to the head of the ladder and
// climbing back down a hole it was already in.
group('a refresh does not send the gang back down the ladder', async () => {
  localStorage.setItem('boulder-clicker/v4', player());
  yard.restore();
  run(40);                           // down there and digging

  const gang = () => yard.S.workers.filter(w => w.type === 'quarrier');
  const digging = () => gang().filter(w => w.goal === 'work').length;
  const wasY = gang().map(w => Math.round(w.y));
  const wasDigging = digging();

  window.__reload();
  const stillDigging = digging();
  const nowY = gang().map(w => Math.round(w.y));

  // and it does not take them a walk to get going again
  let worst = 0;
  for (let i = 0; i < 6; i++) { run(1); worst = Math.max(worst, wasDigging - digging()); }

  return [
    ok(wasDigging > 0, 'the cut was being worked to begin with', `${wasDigging} at the face`),
    ok(stillDigging === wasDigging, 'and it still is the frame after a reload',
       `${wasDigging} before, ${stillDigging} after`),
    ok(nowY.every((y, i) => Math.abs(y - wasY[i]) <= 1), 'nobody was lifted out of the cut',
       `${wasY.join(',')} -> ${nowY.join(',')}`),
    ok(worst <= 1, 'and none of them downs tools to walk anywhere',
       `${worst} stopped digging at once`)
  ];
});
