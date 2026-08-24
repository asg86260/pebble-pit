// The opening, and the reason any of this is happening.
//
// The game used to start with a rock already sitting on the ground and a cursor
// to hit it with. Nothing said why, and "why" is the one question an incremental
// never answers: you are clicking because clicking is what there is.
//
// So it starts before the rock. Two squares are stood on the bare ground talking
// to each other -- the same dots two bodies pass back and forth on a break, and
// the whole of the vocabulary this game has for people getting on -- and then a
// boulder comes down out of the sky on one of them.
//
// Everything after that is one body trying to get its mate out. That is what the
// crew is for, what the pit is for, and why the rocks keep coming: **the one
// underneath is still alive.** Every time the last of a rock goes you can see
// them down there, and every time, before anybody can get them out, the next one
// lands. The game does not end and neither does that.
//
// It costs the game one thing: you start with a body rather than buying the
// first with a core. That is the story's price and it is worth paying -- a game
// that opens on somebody you are digging out is a game with a reason in it.

import { P, WORKER, INTRO_CHAT_MS, INTRO_BEAT, INTRO_APART } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { makeBoulder } from './rock.js';
import { walkY } from './world.js';
import { rebalance } from './upgrades.js';
import { syncWorkers } from './crew.js';

// Where the two of them stand: either side of the spot the rock is about to
// land on, which is the middle of the yard and the middle of the game.
const pairX = i => Math.round((S.cx + (i ? INTRO_APART : -INTRO_APART) - WORKER / 2) / P) * P;

// A fresh game, and nothing has happened yet.
export function startIntro() {
  if (S.introDone) return;
  S.intro = 'chat';
  S.introAt = now();
  S.pair = [0, 1].map(i => ({ x: pairX(i), y: 0, say: null, turn: i === 0 }));
}

export const introRunning = () => S.intro === 'chat';

// Straight to the yard as it stands after the rock has landed. It is what the
// dev hooks and the checks use: nothing in the suite is about the opening except
// the one check that is, and five seconds of two squares talking in front of
// every other one is five seconds of nothing being tested.
export function skipIntro() {
  if (!introRunning()) return;
  drop();
}

// One frame of it. They talk, taking turns, until the rock comes.
export function stepIntro(t) {
  if (!introRunning()) return;
  for (const b of S.pair) b.y = walkY(b.x + WORKER / 2);

  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT;
    const who = S.pair.find(b => b.turn) || S.pair[0];
    who.say = { n: 1 + Math.floor(Math.random() * 3), until: t + INTRO_BEAT * 0.9 };
    for (const b of S.pair) b.turn = b !== who;
  }
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;

  if (t - S.introAt < INTRO_CHAT_MS) return;
  drop();
}

// And it lands. The one on the left is under it; the one on the right is the
// crew, and it goes straight at the rock because that is the only thing left to
// do. Nobody is hired here -- the first body in this game is somebody who was
// already standing there.
function drop() {
  S.intro = null;
  S.introDone = true;
  S.buried = true;
  S.pair = [];
  S.crew = 1;
  S.miners = 1;
  rebalance();
  syncWorkers();
  makeBoulder(true);                 // out of the sky, on to the spot they were stood
  S.dirty = true;
}

// --- the one underneath -------------------------------------------------------
// Whenever the rock is off the ground -- the moment the last of it goes, right
// through the crew's five seconds on the bare ground -- they are down there, and
// you can see them. Then the next one lands on them.
//
// It is the same square as everybody else, and it says the same dots, because
// the point is that it is a person and not a prize.
export const buriedVisible = () => S.buried && !S.boulder.some(row => row.some(v => v));

export function buriedAt() {
  const x = Math.round((S.cx - WORKER / 2) / P) * P;
  return { x, y: walkY(x + WORKER / 2) };
}

// and every so often, while it is in sight, it says something
export function stepBuried(t) {
  if (!buriedVisible()) { S.buriedSay = null; return; }
  if (S.buriedSay && t < S.buriedSay.until) return;
  S.buriedSay = t < (S.buriedSayAt || 0) ? null
    : { n: 1 + Math.floor(Math.random() * 3), until: t + INTRO_BEAT * 0.9 };
  if (S.buriedSay) S.buriedSayAt = t + INTRO_BEAT * 1.6;
}
