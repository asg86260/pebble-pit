// The opening, and the reason any of this is happening.
//
// The game used to start with a rock already sitting on the ground and a cursor
// to hit it with. Nothing said why, and "why" is the one question an incremental
// never answers: you are clicking because clicking is what there is.
//
// So it starts before the rock, and it starts *close*. Two squares are stood on
// the bare ground with the view pulled right in on them -- two squares at the
// far end of a yard are two squares; two squares filling the window are two
// people -- and they are talking, and every so often one of them says the other
// thing. Then a boulder comes down out of the sky on one of them.
//
// What follows is the beat the whole game hangs on, and it is given the room to
// land: the one left standing is thrown flat on its back, lies there, gets up,
// stares at the thing, and starts digging. The view pulls back out while it
// does, and by the time it is out you are playing.
//
// Everything after that is one body trying to get its mate out. That is what the
// crew is for, what the pit is for, and why the rocks keep coming: **the one
// underneath is still alive.** Every time the last of a rock goes you can see
// them down there, and every time, before anybody can get them out, the next one
// lands. The game does not end and neither does that.
//
// It costs the game one thing: you start with a body rather than buying the
// first with a core. That is what the story costs and it is worth paying.

import { P, WORKER, GRAV, INTRO_ZOOM, INTRO_CHAT_MS, INTRO_HEART_MS, INTRO_DOWN_MS,
         INTRO_UP_MS, INTRO_BEAT, INTRO_APART, INTRO_HURL,
         INTRO_SHOW_DUST, INTRO_SHOW_IN, INTRO_SHOW_MAX } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { makeBoulder } from './rock.js';
import { walkY, setZoom, clampCam } from './world.js';
import { rebalance, assign } from './upgrades.js';
import { syncWorkers } from './crew.js';

// Where the two of them stand: either side of the spot the rock is about to
// land on, which is the middle of the yard and the middle of the game. The one
// on the left is the one it lands on.
const pairX = i => Math.round((S.cx + (i ? INTRO_APART : -INTRO_APART) - WORKER / 2) / P) * P;

export const introRunning = () => !!S.intro;
export const introTalking = () => S.intro === 'chat';

// A fresh game, and nothing has happened yet.
export function startIntro() {
  if (S.introDone) return;
  S.intro = 'chat';
  S.introAt = now();
  S.introSaid = 0;
  S.introHeart = 0;
  S.pair = [0, 1].map(i => ({ x: pairX(i), y: 0, vx: 0, vy: 0, say: null, turn: i === 0 }));
}

// Straight to the yard as it stands after all of it, for the dev hooks and the
// checks: nothing in the suite is about the opening except the one check that
// is, and twenty seconds of it in front of every other one is twenty seconds of
// nothing being tested.
export function skipIntro() {
  if (!introRunning()) return;
  if (S.intro === 'chat') crush();
  S.pair = [];
  S.crew = 1;
  S.miners = 1;
  finish();
}

// --- one frame of it ----------------------------------------------------------

export function stepIntro(t) {
  if (!S.intro) return;
  hold(t);
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;

  if (S.intro === 'chat') return talking(t);
  if (S.intro === 'fall') return falling(t);
  if (S.intro === 'down') return down(t);
  if (S.intro === 'up') return up(t);
  if (S.intro === 'show') return show(t);
}

const ease = k => 1 - Math.pow(1 - k, 3);

// The view, for as long as the opening owns it: right in on the pair, and easing
// back out over the last stretch. Nothing else in this game moves the zoom -- a
// cell is a cell whatever you are looking at it on -- and this is the exception
// that earns it.
function hold(t) {
  // The last stretch is not held at all: the view is back to its own size and
  // walking with whoever is doing the showing. See `show`.
  if (S.intro === 'show') return;

  const out = S.intro === 'up' ? ease(Math.min(1, (t - S.introAt) / INTRO_UP_MS)) : 0;
  const k = INTRO_ZOOM + (1 - INTRO_ZOOM) * out;

  // The ground line sits low in the frame with the two of them standing on it,
  // rather than the bottom of the pit sitting on the bottom of the window --
  // and it is walked back to the yard's own height over the same stretch the
  // zoom is. Letting go of it at the end instead left the view a good forty
  // pixels from where the game wanted it, and dropping forty pixels in one frame
  // is a hitch you feel however smooth everything either side of it was.
  S.camLockY = null;
  setZoom(k);
  const close = S.groundY - S.viewH * 0.66;
  const rest = S.worldH - S.viewH;
  S.camLockY = close + (rest - close) * out;
  S.camX = S.cx - S.viewW / 2;
  S.camTo = null;
  clampCam();
}

// Talking, and every so often one of them says the other thing.
function talking(t) {
  for (const b of S.pair) b.y = walkY(b.x + WORKER / 2);

  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT;
    const who = S.pair.find(b => b.turn) || S.pair[0];
    // A heart now and then rather than every time: it is a thing being said,
    // not a label stuck over them, and something said every second is a label.
    const heart = t - (S.introHeart || 0) > INTRO_HEART_MS;
    if (heart) S.introHeart = t;
    who.say = heart
      ? { mark: 'heart', until: t + INTRO_BEAT * 1.6 }
      : { mark: 'dots', n: 1 + Math.floor(Math.random() * 3), until: t + INTRO_BEAT * 0.9 };
    for (const b of S.pair) b.turn = b !== who;
  }

  if (t - S.introAt < INTRO_CHAT_MS) return;
  crush();
}

// And it comes down. The one on the left is under it; the one on the right is
// thrown clear of it, which is the only thing in this game that happens to
// somebody rather than being asked for. Nobody is hired here -- the first body
// in this game is somebody who was already standing there.
function crush() {
  const b = S.pair[1];                         // the one on the right
  S.pair = b ? [b] : [];                       // the left-hand one is gone
  S.buried = true;
  S.intro = 'fall';
  S.introAt = now();
  makeBoulder(true);                           // out of the sky, on to the spot

  // And it is thrown clear as it comes. They were stood close enough together to
  // be two people rather than two squares, which is a good deal closer than the
  // rock is wide -- so it is not knocked back *after* the rock lands, it is
  // already flying while the rock is still in the air, and it comes down outside
  // the footprint. Anything else is a rock landing on both of them.
  if (b) {
    const clear = S.cx + (S.gw * P) / 2 + P * 5 - b.x;
    b.vy = -INTRO_HURL;
    b.vx = clear / ((2 * INTRO_HURL) / FALL_G);   // there in the time the lob takes
    b.say = null;
    b.flung = true;
  }
  S.dirty = true;
}

const FALL_G = GRAV * 0.6;

// One frame of a body in the air, and on its back once it is not.
function fly(b) {
  if (!b || !b.flung) return;
  const foot = walkY(b.x + WORKER / 2);
  b.vy += FALL_G;
  b.x += b.vx;
  b.y += b.vy;
  if (b.y < foot) return;
  b.y = foot;
  b.vy = 0;
  b.vx *= 0.4;
  b.down = true;                               // and drawn on its side while it is
}

// While the rock is in the air, nothing else happens: you watch it come, and you
// watch the other one go over.
function falling(t) {
  const b = S.pair[0];
  fly(b);
  if (S.rockFall > 0 || !(b && b.down)) return;
  S.intro = 'down';
  S.introAt = t;
}

// Landed, and lying there for a moment doing nothing at all -- which is the only
// silence in the game.
function down(t) {
  const b = S.pair[0];
  fly(b);
  if (t - S.introAt < INTRO_DOWN_MS) return;
  if (b) {
    b.down = false;
    b.flung = false;
    b.say = { mark: 'bang', until: t + INTRO_UP_MS * 0.7 };
  }
  S.intro = 'up';
  S.introAt = t;
}

// Up, staring at it, while the view pulls back out. By the time it is out you
// are playing.
function up(t) {
  const b = S.pair[0];
  if (b) b.y = walkY(b.x + WORKER / 2);
  if (t - S.introAt < INTRO_UP_MS) return;
  begin(t);
}

// --- and then it shows you ----------------------------------------------------
// The last thing the opening does is play the loop through once, with the real
// crew doing it: a body goes at the rock, a few pixels come off on to the
// ground, and it carries them the length of the yard and tips them in the hole.
//
// Nothing here is a special case pretending to be the game. It *is* the game --
// one body, put on the rock and then taken off it at the right moment, and the
// crew code does the walking, the swinging, the scooping and the throw. All the
// opening does is decide when to change its mind and where to point the camera.
function begin(t) {
  // Where it is standing when it stops being a story and starts being the crew.
  // The body that walks to the rock is *this* body, from here -- it used to be
  // stood down and a miner made from nothing, which put a fresh square on top of
  // the rock in the same frame the one you had been watching disappeared.
  const from = S.pair[0] ? S.pair[0].x : S.cx;

  S.intro = 'show';
  S.introAt = t;
  S.pair = [];
  S.crew = 1;
  S.miners = 1;                                // on the rock, or on its way
  rebalance();
  syncWorkers();

  const w = S.workers[0];
  if (w) {
    w.x = from;
    w.y = walkY(from + WORKER / 2);
    w.walkTo = S.cx - WORKER / 2;              // and it walks there, like anybody
    w.leg = 'work';
    w.walking = true;
  }

  S.camLockY = null;                           // the yard has its view back
  setZoom(1);
  S.dirty = true;
}

function show(t) {
  // The view walks with it. The hole is off the side of any window you can see
  // the rock in, so a body carrying dust there without the camera going too is a
  // body walking off the screen.
  const w = S.workers[0];
  if (w) {
    S.camX += ((w.x + WORKER / 2 - S.viewW / 2) - S.camX) * 0.06;
    S.camTo = null;
    clampCam();
  }

  // enough on the ground to be worth carrying: down tools and carry it
  if (S.miners && S.floorGrains >= INTRO_SHOW_DUST) assign('miners', -1);

  if (S.stored < INTRO_SHOW_IN && t - S.introAt < INTRO_SHOW_MAX) return;
  finish();
}

// And it goes back to the rock. It is digging its mate out -- that is the whole
// of why any of this is happening -- so leaving it stood at the lip when the
// demonstration is over is leaving it doing the one thing the story says it
// would not. The trip to the hole was a thing it went and did; the rock is where
// it lives.
function toWork() {
  if (S.crew > 0 && !S.miners) assign('miners', 1);
}

function finish() {
  S.intro = null;
  S.introDone = true;
  S.buried = true;
  S.pair = [];
  S.crew = Math.max(1, S.crew);
  rebalance();
  syncWorkers();
  toWork();                        // back on the rock, which is where it lives
  S.camLockY = null;               // the yard has its own view back
  setZoom(1);
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
    : { mark: 'dots', n: 1 + Math.floor(Math.random() * 3), until: t + INTRO_BEAT * 0.9 };
  if (S.buriedSay) S.buriedSayAt = t + INTRO_BEAT * 1.6;
}
