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
         INTRO_SHOW_DUST, INTRO_SHOW_MAX,
         MEET_IN_MS, MEET_MS, PART_MS,
         CORE_SIZE, DUCK_PACE, COMMUTE_PACE, ROCK_CLEAR,
         BURIED_REACH, BURIED_HOLD_MS, BURIED_TOSS_IN } from './config.js';
import { S, pit } from './state.js';
import { now, frames } from './clock.js';
import { makeBoulder, boulderAlive } from './rock.js';
import { spawnChip, aim } from './dust.js';
import { walkY, setZoom, clampCam, lookAt } from './world.js';
import { rebalance, assign } from './upgrades.js';
import { syncWorkers } from './crew.js';
import { rand } from './rng.js';
import { JOB } from './jobs.js';

// Where the two of them stand: either side of the spot the rock is about to
// land on, which is the middle of the yard and the middle of the game. The one
// on the left is the one it lands on.
const pairX = i => Math.round((S.cx + (i ? INTRO_APART : -INTRO_APART) - WORKER / 2) / P) * P;

export const introRunning = () => !!S.intro;
// The phases that own the yard: nothing rolls in on its own while one of these
// is running, because the rock arriving is a thing the scene does itself.
export const introHolds = () =>
  S.intro === 'chat' || S.intro === 'meet' || S.intro === 'part' || S.intro === 'rescue';

// A fresh game, and nothing has happened yet.
export function startIntro() {
  if (S.introDone) return;
  // A fresh opening has not thrown anything yet. Without this a second playing
  // -- a reset, or the checks running it twice in one process -- finds the mark
  // from the first still set, never throws, and stands there until the timeout
  // takes pity on it.
  S.introThrew = 0;
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
  S.rockhands = 1;
  finish();
}

// --- one frame of it ----------------------------------------------------------

export function stepIntro(t) {
  // The ground under the rock is only somewhere to get out of once something is
  // actually coming down on it -- see `dropZone`.
  S.sceneHolds = introHolds() && !S.rockFall;
  if (!S.intro) return;
  hold(t);
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;

  if (S.intro === 'chat') return talking(t);
  if (S.intro === 'fall') return falling(t);
  if (S.intro === 'down') return down(t);
  if (S.intro === 'up') return up(t);
  if (S.intro === 'show') return show(t);
  if (S.intro === 'meet') return meet(t);
  if (S.intro === 'part') return part(t);
  if (S.intro === 'rescue') return rescue(t);
}

// --- the second act -----------------------------------------------------------
// The first rock comes off and, for a moment, you did it: the one underneath is
// out on the bare ground, the one who has been digging is stood over it, and
// whoever else you have hired is hopping about round the pair of them. Then the
// next rock comes down and it was all for nothing, which is the game.
//
// Once. After the first rock and never again -- a beat you are shown twice is a
// beat, a beat you are shown every time is a loading screen. What it buys is the
// shape of the whole thing in one go, early enough to matter.
export function maybeReunion(t) {
  if (S.intro || S.reunionDone || !S.introDone) return;
  if (S.boulderNo !== 1 || boulderAlive()) return;
  if (S.coreBuried) return;                    // the core comes out first: it is yours
  S.intro = 'meet';
  S.introAt = t;
  S.introSaid = 0;
  S.introHeart = 0;

  // and whoever has been digging goes over. It is not scripted people: it is one
  // of the crew, sent on the same walk the roster sends anybody on, and it stops
  // beside the one it dug out rather than on top of them. Everybody else stays
  // where they are and hops, which is the dance they already do when a rock is
  // finished -- so the yard celebrates with its own legs.
  const at = buriedAt();
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.walking) continue;
    const d = Math.abs(w.x - at.x);
    if (d < near) { near = d; who = w; }
  }
  if (who) {
    who.walkTo = at.x + (who.x > at.x ? WORKER * 1.7 : -WORKER * 1.7);
    who.leg = 'back';                          // it never left its job
    who.walking = true;
    who.met = true;
  }
  S.dirty = true;
}

// --- and, once, somebody gets out ---------------------------------------------
// The beat the whole game has been owed, and the only one that ever pays the
// opening back. The dome catches a rock and holds it there -- and while it is
// held, the person who has been under every rock in this yard walks out from
// under the shadow of one.
//
// It is the opening played back the right way round. There, two squares stood
// talking and a rock came down on one of them; here a rock comes down and does
// not, and the two of them stand talking again. Nothing about it is new
// vocabulary: the same square, the same dots, the same heart.
//
// They do not vanish into a cutscene afterwards -- they join the crew, because
// what this game is about is the people in the yard and there is one more of
// them now. That is the whole of the reward, and it is a better one than a
// number: every rock after this is dug out by somebody who was under one.
export function startRescue(t) {
  if (S.rescued || !S.buried) return;
  const at = buriedAt();
  S.intro = 'rescue';
  S.introAt = t;
  S.introSaid = 0;
  // Out from under, and clear of the footprint the rock is going to be set
  // down on -- it walks out of the way of the thing overhead rather than out
  // of the picture. Toward the pit, which is to say toward the working end of
  // the yard: the way it goes is the way everybody else already is, because
  // where it is walking to is the crew.
  const half = Math.round((S.gw / 2) * P);
  S.rescueTo = at.x + half + ROCK_CLEAR + WORKER;
  // And the view goes with it. This is the one beat the whole arc was built to
  // reach, and a beat played off the side of the window is a beat nobody sees;
  // it is the same gentle pan a purchase gets, not a cut and not a zoom.
  lookAt(S.rescueTo + WORKER / 2);
  // It stops being buried the moment it starts walking: from here it is a
  // square on the ground like any other, and `S.pair` is where the scenes keep
  // those. Marked now rather than at the end, so a save in the middle of the
  // walk cannot play the beat a second time.
  S.buried = false;
  S.buriedSay = null;
  S.rescued = true;
  S.pair = [{ x: at.x, y: at.y, say: null }];

  // and somebody comes to meet them, the same way somebody did after the first
  // rock -- one of the crew, sent on an ordinary walk, stopping beside them
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft || w.walking) continue;
    const d = Math.abs(w.x - S.rescueTo);
    if (d < near) { near = d; who = w; }
  }
  if (who) {
    who.walkTo = S.rescueTo - WORKER * 1.7;
    who.leg = 'back';                          // it never left its job
    who.walking = true;
    who.met = true;
  }
  S.dirty = true;
}

// One frame of it: the walk out, then the two of them, then back to work.
function rescue(t) {
  const b = S.pair[0];
  if (!b) { S.intro = null; return; }
  const d = S.rescueTo - b.x;
  if (Math.abs(d) > 1) {
    // its own legs, at the pace anybody crosses the yard at
    b.x += Math.sign(d) * Math.min(COMMUTE_PACE * frames(), Math.abs(d));
    b.y = walkY(b.x + WORKER / 2);
    S.introAt = t;                             // the beat starts when it arrives
    return;
  }
  b.y = walkY(b.x + WORKER / 2);
  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    b.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
    const who = S.workers.find(w => w.met);
    if (who && !who.walking) who.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  if (t - S.introAt < MEET_MS) return;

  // And then it is one of the crew. Where it is standing is where it walked to,
  // which is the same bargain `begin` strikes at the end of the opening: the
  // body you were watching is the body that carries on.
  const had = new Set(S.workers);
  S.crew++;
  rebalance();
  syncWorkers();
  const fresh = S.workers.find(w => !had.has(w));
  if (fresh) { fresh.x = b.x; fresh.y = walkY(b.x + WORKER / 2); }
  for (const w of S.workers) { w.met = false; w.say = null; }
  S.pair = [];
  S.intro = null;
  S.dirty = true;
}

// Together, and the yard celebrating it. Nothing here is scripted people: the
// crew do their own five-second dance -- the one they already do when a rock is
// finished -- and the two of them are the buried square, which is drawn anyway,
// and whoever is nearest to it.
function meet(t) {
  // Held to the end of the meeting, and said once rather than a frame at a time.
  // The dance reads this to know when the yard stops watching -- a body only
  // leaves the ground if it can be back down by then -- and a horizon re-armed
  // four hundred milliseconds ahead every frame is not one anybody can plan a
  // hop against: the whole crew stayed on the floor for the whole scene. The
  // meeting has a length, so the hold is that length.
  S.danceUntil = S.introAt + MEET_MS;
  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    S.buriedSay = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
    // and the same back, from whoever walked over
    const who = S.workers.find(w => w.met);
    if (who && !who.walking) who.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  if (t - S.introAt < MEET_MS) return;

  // and the sky opens again
  S.intro = 'part';
  S.introAt = t;
  S.buriedSay = null;
  for (const w of S.workers) { w.met = false; w.say = null; }
  S.danceUntil = 0;
  S.boulderNo++;                               // the next one, and bigger, like any other
  makeBoulder(true);
  S.dirty = true;
}

// It lands on them again, the crew scatter out from under it the way they always
// do, and the view lets go. From here on nothing ever stops for a rock.
function part(t) {
  if (t - S.introAt < PART_MS) return;
  S.intro = null;
  S.reunionDone = true;
  S.camLockY = null;
  setZoom(1);
  S.danceUntil = 0;
  S.dirty = true;
}

const ease = k => 1 - Math.pow(1 - k, 3);

// The view, for as long as the opening owns it: right in on the pair, and easing
// back out over the last stretch. Nothing else in this game moves the zoom -- a
// cell is a cell whatever you are looking at it on -- and this is the exception
// that earns it.
function hold(t) {
  // The last stretch is not held at all: the view is back to its own size and
  // walking with whoever is doing the showing. See `show`.
  //
  // Nor is the rescue. It happens in a working yard, and pulling the camera in
  // on it would say "watch this" -- the whole point of the beat is that it
  // happens where everything else in this game happens, at the same size.
  if (S.intro === 'show' || S.intro === 'rescue') return;

  // How far out the view is, nought being right in on them. The opening pulls
  // out at the end of it; the second act pulls back *in* and then out again.
  const k0 = (t - S.introAt);
  const out = S.intro === 'up' ? ease(Math.min(1, k0 / INTRO_UP_MS))
            : S.intro === 'meet' ? 1 - ease(Math.min(1, k0 / MEET_IN_MS))
            : S.intro === 'part' ? ease(Math.min(1, k0 / PART_MS))
            : 0;
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
      : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
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
  // stood down and a rockhand made from nothing, which put a fresh square on top of
  // the rock in the same frame the one you had been watching disappeared.
  const from = S.pair[0] ? S.pair[0].x : S.cx;

  S.intro = 'show';
  S.introAt = t;
  S.pair = [];
  S.crew = 1;
  S.rockhands = 1;                                // on the rock, or on its way
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

// It knocks a couple of cells off, comes down off the rock, and throws one into
// the hole.
//
// It used to *carry* it there: down tools, pick the dust up, and walk the length
// of the yard with the camera trailing behind, twice, before you were allowed to
// touch anything. Which is a correct demonstration of where dust goes and a
// dreadful thing to sit through -- the first half-minute of the game spent
// watching somebody walk. The hole is six hundred pixels from the rock and a
// grain thrown properly carries further than that, so it throws.
//
// What is being shown is unchanged: dust comes off the rock and dust goes in the
// hole. It is shown in one gesture instead of one errand.
function show(t) {
  const w = S.workers[0];
  if (!w) { finish(); return; }

  // Watching whatever there is to watch: the body while it is working, and the
  // grain once it is in the air, because the grain is the thing being explained
  // and it is going somewhere the body is not.
  const chip = S.chips.find(c => c.intro);
  const eye = chip ? chip.x : w.x + WORKER / 2;
  S.camX += ((eye - S.viewW / 2) - S.camX) * 0.06;
  S.camTo = null;
  clampCam();

  // Enough off the rock, and it throws one of them into the hole.
  //
  // From where it is standing -- up on the crest, which is where the work is and
  // the best place in the yard to throw from. It stays a rockhand while it does it:
  // handing the body to the hauling rules mid-scene means the scene is at the
  // mercy of whatever a hauler decides to do next, and what it decides is to go
  // and fetch something, which is the walk this is here to be rid of.
  if (S.floorGrains >= INTRO_SHOW_DUST && !S.introThrew) {
    const fx = w.x + WORKER / 2, fy = w.y + P * 2;
    // Well inside the mouth rather than just over the lip. A throw is an arc and
    // an arc has a spread; aimed at the edge, half of them come down short of it
    // and lie on the ground, which demonstrates nothing.
    const into = pit.x + P * 24;
    const v = aim(fx, fy, into, P);
    spawnChip(fx, fy, v.vx, v.vy, 4);
    const thrown = S.chips[S.chips.length - 1];
    if (thrown) thrown.intro = true;
    w.lunge = 1;                                      // it puts its back into it
    S.introThrew = t;
    S.dirty = true;
  }

  // It is over when the grain is in the hole -- or when it has plainly missed,
  // which is a thing that can happen to a throw and is not worth waiting on.
  if (S.stored >= 1) { finish(); return; }
  if (S.introThrew && t - S.introThrew > 6000) { finish(); return; }
  if (t - S.introAt >= INTRO_SHOW_MAX) finish();
}

// And it goes back to the rock. It is digging its mate out -- that is the whole
// of why any of this is happening -- so leaving it stood at the lip when the
// demonstration is over is leaving it doing the one thing the story says it
// would not. The trip to the hole was a thing it went and did; the rock is where
// it lives.
function toWork() {
  if (S.crew > 0 && !S.rockhands) assign(JOB.ROCK, 1);
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
// Visible while there is no rock on the spot -- and while there is one still on
// its way down, which is the whole of the beat. A rock exists the instant it is
// made, several seconds before it arrives, so going by "is there a rock" made
// the square wink out while the next one was still up in the air and you never
// saw it happen. It goes when the rock lands on it.
export const buriedVisible = () =>
  S.buried && (S.rockFall > 0 || !S.boulder.some(row => row.some(v => v)));

// Where the square lives: the middle of the yard, the spot every rock lands on.
const buriedHome = () => Math.round((S.cx - WORKER / 2) / P) * P;

// Where it is right now -- home, unless the core errand has walked it somewhere
// (wave7-sky, A4). The drawing reads this, so the walk is the picture.
export function buriedAt() {
  const x = S.buriedX ?? buriedHome();
  return { x, y: walkY(x + WORKER / 2) };
}

// and every so often, while it is in sight, it says something
export function stepBuried(t) {
  if (!buriedVisible()) {
    // Out of sight, so the errand ends. If the rock came down mid-hold the core
    // in its arms goes back on the ground where it stood -- a core is never
    // lost -- and if that ground is under the new rock, core.js's own re-launch
    // throws it clear, which is exactly what that rule is for.
    if (S.buriedErrand && S.buriedErrand.phase === 'hold' && !S.coreItem) {
      const at = buriedAt();
      S.coreItem = { x: at.x + WORKER / 2 - CORE_SIZE / 2, y: at.y, vx: 0, vy: 0, rest: false };
    }
    S.buriedSay = null; S.buriedErrand = null; S.buriedX = null;
    return;
  }
  stepBuriedToss(t);
  if (S.buriedSay && t < S.buriedSay.until) return;
  S.buriedSay = t < (S.buriedSayAt || 0) ? null
    : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
  if (S.buriedSay) S.buriedSayAt = t + INTRO_BEAT * 1.6;
}

// --- the square and a stray core (wave7-sky, A4) --------------------------------
// The one under the rock helps the only way it can: a core that comes to rest
// near its spot gets carried toward the hole. It walks over -- it is a position,
// never a pop -- picks the thing up, holds it a beat, and tosses it into the
// pit's mouth on the same arc everything else thrown in this yard flies. If the
// pit is full, `bankCore` refuses, core.js throws the core back out by the lip
// -- well past this square's reach -- and the `tossed` mark keeps the square
// from fetching the same core twice, so a full pit is one throw and done, not a
// loop of two systems lobbing one core at each other.

// One step of a walk, at the duck's pace: true while it is still moving.
function walkBuried(to) {
  const at = S.buriedX ?? buriedHome();
  const d = to - at;
  const step = DUCK_PACE * frames();
  if (Math.abs(d) <= step) { S.buriedX = to; return false; }
  S.buriedX = at + Math.sign(d) * step;
  return true;
}

function stepBuriedToss(t) {
  // Not during any scene: while the opening or the reunion owns the yard the
  // square is part of the story, not on an errand.
  if (S.intro) return;
  const k = S.coreItem;
  const e = S.buriedErrand;

  if (!e) {
    // Nothing to do: drift home, if an interrupted errand left it out.
    if (S.buriedX != null && !walkBuried(buriedHome())) S.buriedX = null;
    if (S.coreBuried || S.boulderNo <= 1) return;
    // Only a RESTING core. One still flying belongs to its arc, and one the
    // rock's own re-launch (core.js) is about to move is not at rest either --
    // reacting to `rest` alone is what keeps the two systems out of each
    // other's hands.
    if (!k || !k.rest || k.tossed) return;
    // Within reach -- measured past the rock's own footprint, not from the
    // square itself. A core is always thrown clear of the footprint when it
    // drops (`dropCore`), and the footprint alone is wider than any bare
    // distance a square would sensibly walk, so "near the square" means "just
    // past the edge of where the rock stood": the ground a dropped core
    // actually comes to rest on.
    const at = buriedAt();
    const half = (S.gw * P) / 2;
    if (Math.abs(k.x + CORE_SIZE / 2 - (at.x + WORKER / 2)) - half > BURIED_REACH) return;
    S.buriedErrand = { phase: 'walk' };
    return;
  }

  if (e.phase === 'walk') {
    // Gone mid-walk -- picked up by the player, re-launched clear of the rock,
    // rolled off. The errand is over; home is the errand now.
    if (!k || !k.rest) { S.buriedErrand = null; return; }
    if (walkBuried(k.x + CORE_SIZE / 2 - WORKER / 2)) return;
    // Arrived: pick it up. The core leaves the world for the length of the
    // hold -- it is in the square's arms -- and the throw puts it back.
    S.coreItem = null;
    e.phase = 'hold';
    e.until = t + BURIED_HOLD_MS;
    S.buriedSay = { mark: 'heart', until: t + BURIED_HOLD_MS + INTRO_BEAT };
    S.buriedSayAt = t + BURIED_HOLD_MS + INTRO_BEAT * 1.6;
    S.dirty = true;
    return;
  }

  if (e.phase === 'hold') {
    if (t < e.until) return;
    // The toss: from its hands, into the mouth of the pit -- well inside the
    // lip, the way the opening's own demonstration throws (see `show`), so the
    // arc's spread still lands it in the hole. Landing in the pit banks it
    // through the same physics every core lands by (`stepCore`).
    const at = buriedAt();
    const fx = at.x + WORKER / 2, fy = at.y;
    const v = aim(fx, fy, pit.x + P * BURIED_TOSS_IN, CORE_SIZE);
    S.coreItem = { x: fx - CORE_SIZE / 2, y: fy, vx: v.vx, vy: v.vy, rest: false, tossed: true };
    e.phase = 'home';
    S.dirty = true;
    return;
  }

  // and back to its spot, which is where it lives
  if (!walkBuried(buriedHome())) { S.buriedX = null; S.buriedErrand = null; }
}
