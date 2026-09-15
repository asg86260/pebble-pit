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
// underneath is still alive.** The first rock drove them into the ground to
// their middle, and there they are lodged: every time the last of a rock goes
// you can see them down there, somebody runs over and digs, they come up a
// little -- and every time, before they are out, the next one lands and drives
// them back in. The game does not end and neither does that. Only a rock held
// overhead gives the digging the time it needs, and that is what the shields
// are for.
//
// It costs the game one thing: you start with a body rather than buying the
// first with a core. That is what the story costs and it is worth paying.

import { P, WORKER, GRAV, INTRO_ZOOM, INTRO_CHAT_MS, INTRO_HEART_MS, INTRO_DOWN_MS,
         INTRO_UP_MS, INTRO_BEAT, INTRO_APART, INTRO_HURL,
         INTRO_SHOW_DUST, INTRO_SHOW_MAX,
         MEET_IN_MS, MEET_MS, PART_MS,
         COMMUTE_PACE, ROCK_CLEAR,
         BURIED_DIG_S, BURIED_DIG_BEAT_MS, BURIED_DIG_LONE, BURIED_DIG_LEAD_MS, DUCK_PACE } from './config.js';
import { S, pit } from './state.js';
import { now, frames } from './clock.js';
import { makeBoulder, boulderAlive, dropZone } from './rock.js';
import { spawnChip, spawnSpoil, aim } from './dust.js';
import { shadeNear } from './grid.js';
import { walkY, setZoom, clampCam, lookAt, openingCamX } from './world.js';
import { rebalance } from './upgrades.js';
import { buildShop } from './shop.js';
import { syncWorkers } from './crew.js';
import { wayAt, ways, feetOn, climbTo } from './route.js';
import { stopJig, MOVE_KEYS } from './crew/dance.js';
import { rand } from './rng.js';
import { reducedMotion } from './prefs.js';
import { doorAt } from './house.js';

// Where the two of them stand: either side of the spot the rock is about to
// land on, which is the middle of the yard and the middle of the game. The one
// on the left is the one it lands on.
const pairX = i => Math.round((S.cx + (i ? INTRO_APART : -INTRO_APART) - WORKER / 2) / P) * P;

export const introRunning = () => !!S.intro;
// The phases that own the yard: nothing rolls in on its own while one of these
// is running, because the rock arriving is a thing the scene does itself.
export const introHolds = () =>
  S.intro === 'leave' || S.intro === 'chat' || S.intro === 'meet' || S.intro === 'part' ||
  S.intro === 'rescue';

// A fresh game, and nothing has happened yet.
export function startIntro() {
  if (S.introDone) return;
  // A fresh opening has not thrown anything yet. Without this a second playing
  // -- a reset, or the checks running it twice in one process -- finds the mark
  // from the first still set, never throws, and stands there until the timeout
  // takes pity on it.
  S.introThrew = 0;
  S.introCut = false;
  // They come out of the house. Nobody in this game arrives from nowhere, and
  // for a long while these two did: stood at the spot from the first frame,
  // the one pair of bodies in the yard with no door behind them. The house
  // draws its first two rooms before anybody is hired (house.js, `roomsToday`)
  // so that there is a door, and the pair step out of it one behind the other
  // and walk to the spot the way anybody crosses the yard.
  S.intro = 'leave';
  S.introAt = now();
  S.introSaid = 0;
  S.introHeart = 0;
  const door = Math.round((doorAt().x - WORKER / 2) / P) * P;
  S.pair = [0, 1].map(i => ({ x: door - (i ? 0 : WORKER * 1.3), y: 0, vx: 0, vy: 0,
                              say: null, turn: i === 0 }));
  for (const b of S.pair) b.y = walkY(b.x + WORKER / 2);
  // and the view is on the door before the first frame, so the walk out is
  // watched from the house rather than glided to from wherever the seat was
  setZoom(INTRO_ZOOM);
  S.camX = door + WORKER / 2 - S.viewW / 2;
  S.camTo = null;
}

// Straight to the yard as it stands after all of it, for the dev hooks and the
// checks: nothing in the suite is about the opening except the one check that
// is, and twenty seconds of it in front of every other one is twenty seconds of
// nothing being tested. The player's own skip (skip.js) comes through here too,
// with `played` off: the yard is the same yard, but the one difference between
// the two is kept -- the body. The checks want the yard as it stands after all
// of it; the player was watching a square, and the square that carries on is
// the one they were watching, stood where it stood, the bargain `begin`
// strikes at the end of the opening played out.
export function skipIntro(played = true) {
  if (!introRunning()) return;
  const from = played || !S.pair.length ? null : S.pair[S.pair.length - 1].x;
  if (S.intro === 'leave') arrive();
  if (S.intro === 'chat') crush();
  S.pair = [];
  S.crew = 1;
  S.rockhands = 1;
  // A yard that skips the opening is a yard that has been played from: the
  // rows gated on a player's own first act (the bench's 'strength' row waits
  // for a drag) are open on it, the way they are on any save. A player who
  // skipped has not dragged yet, and the row waits for them as it would.
  if (played) S.seenDrag = true;
  finish();
  const w = S.workers[0];
  if (from != null && w) { w.x = from; w.y = walkY(from + WORKER / 2); }
  buildShop();                     // the rows that flag opens are on the board from the first frame
}

// The player's skip, whichever scene has the yard: the opening goes straight
// to the yard; the reunion goes straight to the rock coming down again, which
// is where it was going; the rescue finishes its dig and keeps its walk -- a
// body walks out from under the rock at its own pace whatever the player
// holds, because a square that is under the rock one frame and stood clear
// the next is the one thing this game never shows. What is cut from it is the
// ceremony, the hearts, and the hold the yard is under for them. True if there
// was a scene to cut.
export function cutIntro(t) {
  if (!introRunning() || S.introCut) return false;
  if (S.intro === 'meet') { parted(t); letGo(); return true; }
  if (S.intro === 'part') { letGo(); return true; }
  if (S.intro === 'rescue') {
    S.introCut = true;
    if (S.buried) { S.buriedDug = 1; getOut(t); }
    return true;
  }
  skipIntro(false);
  return true;
}

// --- one frame of it ----------------------------------------------------------

export function stepIntro(t) {
  // The ground under the rock is only somewhere to get out of once something is
  // actually coming down on it -- see `dropZone`.
  S.sceneHolds = introHolds() && !S.rockFall;
  if (!S.intro) return;
  hold(t);
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;

  if (S.intro === 'leave') return leaving(t);
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
// The first rock comes off and, for a moment, you can see them: the one
// underneath is there in the ground, the one who has been digging runs over and
// digs at them, and whoever else you have hired stands and watches. They come
// up a little. Then the next rock comes down and it was all for nothing, which
// is the game.
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
  S.introCut = false;

  // and whoever has been digging goes over and digs. It is not scripted people:
  // it is one of the crew, sent on the same walk the roster sends anybody on,
  // stopping beside the one in the ground rather than on top of them, and
  // swinging at the ground the way it swings at everything -- see `sendDigger`.
  sendDigger();
  S.dirty = true;
}

// --- and, once, somebody gets out ---------------------------------------------
// The beat the whole game has been owed, and the only one that ever pays the
// opening back. The dome catches a rock and holds it there -- and while it is
// held, for the first time, there is time: somebody runs in under the shadow of
// it and digs, the way somebody has dug at every gap all game, and this time no
// rock comes to stop them. The one who has been in the ground under every rock
// in this yard climbs out and walks clear.
//
// It is the opening played back the right way round. There, two squares stood
// talking and a rock came down on one of them; here a rock comes down and does
// not, and the two of them stand talking again. Nothing about it is new
// vocabulary: the same square, the same dig, the same dots, the same heart.
//
// They do not vanish into a cutscene afterwards -- they join the crew, because
// what this game is about is the people in the yard and there is one more of
// them now. That is the whole of the reward, and it is a better one than a
// number: every rock after this is dug out by somebody who was under one.
export function startRescue(t) {
  if (S.rescued || !S.buried) return;
  S.intro = 'rescue';
  S.introAt = t;
  S.introSaid = 0;
  S.introCut = false;
  S.rescueTo = 0;                              // nobody walks anywhere until it is dug out
  sendDigger();
  S.dirty = true;
}

// Dug out, and up out of the ground. What used to be the whole of the rescue
// -- the walk out from under, and the two of them -- starts here, once the
// digging is done.
function getOut(t) {
  const at = buriedAt();
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
  // reach, and a beat played off the side of the window is a beat nobody sees.
  // The dome's first hold is a cutscene now (cutscene.js), pulled in on the
  // span with the rest of the shields' answers, and that overrules this pan
  // while it runs; the pan is kept for a hold with no scene on it -- a skipped
  // one, or a save from before the scenes -- and it is the same gentle pan a
  // purchase gets, not a cut and not a zoom.
  lookAt(S.rescueTo + WORKER / 2);
  // It stops being buried the moment it starts walking: from here it is a
  // square on the ground like any other, and `S.pair` is where the scenes keep
  // those. Marked now rather than at the end, so a save in the middle of the
  // walk cannot play the beat a second time.
  S.buried = false;
  S.buriedSay = null;
  S.rescued = true;
  S.pair = [{ x: at.x, y: at.y, say: null }];

  // and whoever dug them out goes with them -- or, if nobody could come and
  // they got themselves loose, whoever is nearest comes to meet them, the same
  // way somebody did after the first rock: an ordinary walk, stopping beside
  let who = S.workers.find(w => w.met) || null;
  if (!who) {
    let near = Infinity;
    for (const w of S.workers) {
      if (w.inside || w.inPit || w.aloft || w.walking) continue;
      const d = Math.abs(w.x - S.rescueTo);
      if (d < near) { near = d; who = w; }
    }
  }
  if (who) {
    who.dig = false;
    who.lunge = 0;
    who.walkTo = S.rescueTo - WORKER * 1.7;
    who.leg = 'back';                          // it never left its job
    who.walking = true;
    who.met = true;
  }
  S.dirty = true;
}

// One frame of it: the digging, the walk out, then the two of them, then back
// to work.
function rescue(t) {
  // Still in the ground, and the rock waits overhead while somebody digs. If
  // nobody can come -- the whole crew aloft, or through a door -- it works
  // itself loose, slower, rather than hanging the rock there forever.
  if (S.buried) {
    if (!sendDigger())
      S.buriedDug = Math.min(1, buriedOut() + (frames() / 60) * BURIED_DIG_LONE / BURIED_DIG_S);
    if (buriedOut() < 1) { S.introAt = t; return; }
    getOut(t);
    return;
  }
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
  if (!S.introCut && t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    b.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
    const who = S.workers.find(w => w.met);
    if (who && !who.walking) who.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  if (!S.introCut && t - S.introAt < MEET_MS) return;

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

// Together, and digging. Nothing here is scripted people: the two of them are
// the square in the ground, which is drawn anyway, and whoever was nearest to
// it, digging the way it digs at anything (`stepDig`); the rest of the crew
// step clear and watch.
function meet(t) {
  // Held to the end of the meeting, and said once rather than a frame at a time.
  // The dance reads this to know when the yard stops watching -- a body only
  // leaves the ground if it can be back down by then -- and a horizon re-armed
  // four hundred milliseconds ahead every frame is not one anybody can plan a
  // hop against: the whole crew stayed on the floor for the whole scene. The
  // meeting has a length, so the hold is that length.
  S.danceUntil = S.introAt + MEET_MS;
  // The one in the ground says the other thing; the one digging has its hands
  // full and says nothing, which is the whole of what it has to say.
  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    S.buriedSay = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  if (t - S.introAt < MEET_MS) return;
  parted(t);
}

// and the sky opens again, on somebody half dug out
function parted(t) {
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
  letGo();
}

function letGo() {
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
  // Nor is the rescue. It happens in a working yard, and whether it is pulled
  // in on is the shield cutscene's call (cutscene.js), not this one's: the
  // dome's first hold is a scene like every other shield's answer, and this
  // yields to it.
  if (S.intro === 'show' || S.intro === 'rescue') return;

  // The walk out: pulled right in, and walking with the two of them. The seat
  // starts on the door and eases after their midpoint at the same lag the
  // show's grain is chased with, so the house is still in the picture while
  // they walk out of it and the view catches them up on the way; it stops at
  // the spot, which is where the chat holds it. Under reduced motion the seat
  // is the arrival's from the first frame, and the pair walk into a still shot
  // -- every reduced-motion beat is watched from where it ends.
  if (S.intro === 'leave') {
    setZoom(INTRO_ZOOM);
    S.camLockY = S.groundY - S.viewH * 0.66;
    const mid = reducedMotion() || !S.pair.length ? S.cx
              : S.pair.reduce((a, b) => a + b.x + WORKER / 2, 0) / S.pair.length;
    const want = Math.min(mid, S.cx) - S.viewW / 2;
    S.camX = reducedMotion() ? want : S.camX + (want - S.camX) * 0.06;
    S.camTo = null;
    clampCam();
    return;
  }

  // How far out the view is, nought being right in on them. The opening pulls
  // out at the end of it; the second act pulls back *in* and then out again.
  //
  // Under reduced motion each beat is watched from where it ends: the pull-out
  // is the wide framing from the first frame of getting up, the second act is
  // close from the first frame of the meeting and wide again from the first
  // frame of the parting. Every beat and every body is still there for the
  // same length of time -- what goes is the easing between framings, so the
  // view changes only where one beat hands over to the next.
  const k0 = reducedMotion() ? Infinity : (t - S.introAt);
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

// Out of the door and over to the spot, talking as they go. Their own legs, at
// the pace anybody crosses the yard at: a story pace would be the one walk in
// the game that is not like the others. The chat starts when the second of
// them is stood where the chat has always stood them.
function leaving(t) {
  let there = true;
  for (const [i, b] of S.pair.entries()) {
    const d = pairX(i) - b.x;
    if (Math.abs(d) > 1) {
      b.x += Math.sign(d) * Math.min(COMMUTE_PACE * frames(), Math.abs(d));
      there = false;
    }
    b.y = walkY(b.x + WORKER / 2);
  }
  say(t);
  if (there) arrive();
}

// Stood at the spot, and the chat begins on its own clock from here.
function arrive() {
  for (const [i, b] of S.pair.entries()) { b.x = pairX(i); b.y = walkY(b.x + WORKER / 2); }
  S.intro = 'chat';
  S.introAt = now();
}

// Talking, and every so often one of them says the other thing.
function talking(t) {
  for (const b of S.pair) b.y = walkY(b.x + WORKER / 2);
  say(t);
  if (t - S.introAt < INTRO_CHAT_MS) return;
  crush();
}

// One of them says something, in turn. The walk and the chat share it: they
// are the same two people talking, before the spot and at it.
function say(t) {
  if (t < (S.introSaid || 0)) return;
  S.introSaid = t + INTRO_BEAT;
  const who = S.pair.find(b => b.turn) || S.pair[0];
  if (!who) return;
  // A heart now and then rather than every time: it is a thing being said,
  // not a label stuck over them, and something said every second is a label.
  const heart = t - (S.introHeart || 0) > INTRO_HEART_MS;
  if (heart) S.introHeart = t;
  who.say = heart
    ? { mark: 'heart', until: t + INTRO_BEAT * 1.6 }
    : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
  for (const b of S.pair) b.turn = b !== who;
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
  //
  // Under reduced motion the view does not chase anything: it sits, for the
  // whole of the beat, halfway between the rock the grain comes off and the
  // mouth it is thrown into -- one framing that holds both ends of the throw
  // where the window is wide enough, and the ground between them where it is
  // not. The same target the throw below is aimed at, so the two cannot drift.
  //
  // Well inside the mouth rather than just over the lip. A throw is an arc and
  // an arc has a spread; aimed at the edge, half of them come down short of it
  // and lie on the ground, which demonstrates nothing.
  const into = pit.x + P * 24;
  if (reducedMotion()) {
    S.camX = (S.cx + into) / 2 - S.viewW / 2;
  } else {
    const chip = S.chips.find(c => c.intro);
    const eye = chip ? chip.x : w.x + WORKER / 2;
    S.camX += ((eye - S.viewW / 2) - S.camX) * 0.06;
  }
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

// And it is left carrying. The demonstration just taught "you dig, it carries",
// and the yard is handed over in that shape -- DESIGN.md, "The opening". It
// used to be put back on the rock here, on the argument that digging its mate
// out is the whole story; but a one-body yard with that body on the rock is a
// yard where nothing is carried, so the counter sat at 1 for ten minutes, no
// row ever lit, and the only way out was a roster button nothing explains.
// The newcomer critic quit inside two minutes on exactly that
// (docs/critics-2026-09-10.md, A2). A body on no roster job is a hauler, which
// is what the demonstration's own body was.
function finish() {
  S.intro = null;
  S.introDone = true;
  S.buried = true;
  S.pair = [];
  S.crew = Math.max(1, S.crew);
  // The show made it a rockhand so the swing and the throw were the crew's own
  // code (see `show`); the body it made is retasked here, not remade, so it
  // stands where it stood and walks from there.
  S.rockhands = 0;
  rebalance();
  syncWorkers();
  S.camLockY = null;               // the yard has its own view back
  setZoom(1);
  // and back to the opening seat: the show walked the view out to the hole,
  // and the bench and the house are off the left of it from there. The call to
  // build the bench is the first thing the player is asked to press, and it
  // was being pressed clamped to the window's edge over a hole, with the bench
  // itself out of shot.
  lookAt(openingCamX() + S.viewW / 2);
  S.dirty = true;
}

// --- the one underneath -------------------------------------------------------
// Whenever the rock is off the ground -- the moment the last of it goes, right
// through the crew's five seconds on the bare ground -- they are down there, and
// you can see them: lodged in the ground to their middle, where the first rock
// drove them, and not going anywhere on their own. Then the next one lands on
// them.
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
// It does not move -- it cannot -- so this is the whole of where it is.
export function buriedAt() {
  const x = Math.round((S.cx - WORKER / 2) / P) * P;
  return { x, y: walkY(x + WORKER / 2) };
}

// How far out of the ground it is: nought is packed in to its middle, one is
// stood on the ground. Dug up a little between rocks by whoever gets there,
// and driven all the way back in by the next rock landing on it.
export const buriedOut = () => Math.max(0, Math.min(1, S.buriedDug || 0));

// Somebody goes to dig. The nearest free body on the ground, sent on the same
// walk the roster sends anybody on, stopping beside the square rather than on
// top of it -- and marked `dig`, which is the stage in crew/step.js that has it
// swing at the ground once it is there. Nothing scripted: it is one of the
// crew, and it goes back to its job when the rock takes the ground away. True
// if somebody is on it, already or from now.
export function sendDigger() {
  if (S.workers.some(w => w.dig)) return true;
  const at = buriedAt();
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft || w.walking || w.craft) continue;
    // ...and on the floor of the yard. Under the dome the rockhands are stood on
    // the rock it is holding, and a body that came down off that to dig would be
    // climbing through the air under a hill for as long as the climb took: the
    // digger is somebody with the ground under it already.
    if (wayAt(w.x, w.y).key !== 'yard') continue;
    const d = Math.abs(w.x - at.x);
    if (d < near) { near = d; who = w; }
  }
  if (!who) return false;
  // Its own short walk along the floor, not a commute. A commute routes a body
  // to a spot under the hill's footprint *over the hill* -- and under the dome
  // the hill is a rock held up in the sky, so the digger climbed that and came
  // down three hundred pixels through the air to the spot. The spot is on the
  // yard and so is the digger; `stepDig` walks it there at the commute's pace.
  who.digTo = at.x + (who.x > at.x ? WORKER * 1.7 : -WORKER * 1.7);
  who.met = true;
  who.dig = true;
  who.digAt = 0;
  S.dirty = true;
  return true;
}

// Whether there is still time to dig. The next rock comes when the dance ends,
// and it falls in a fraction of a second -- far faster than a body walks out of
// a footprint -- so a digger that waited for the rock to exist would be under
// it. The yard is told the footprint for the whole of the dance (`dropZone`);
// the digger digs while what is left of the dance is more than its walk to the
// nearer edge needs, and downs tools then. A scene has no dance and holds the
// rock itself; a held rock is not coming.
function timeToDig(x, t, zone = dropZone()) {
  if (S.intro) return true;
  if (!zone) return t < S.danceUntil;
  const out = Math.min(x + WORKER - zone.from, zone.to - x) + WORKER;
  const need = (out / DUCK_PACE) * (1000 / 60) + BURIED_DIG_LEAD_MS;
  return S.danceUntil - t > need;
}

// One frame of somebody digging: true while it is the whole of the body's
// frame. It swings at the ground beside the square on a beat, the way a shovel
// does; a cell of the ground goes out along the heap with every swing, the way
// every spoil in this yard goes; and the square comes up a little. It stops
// when a rock is coming down on the ground it is digging in -- which is what
// ends every dig in this game but one -- and then the body is the crew's
// again: it ducks with everybody else, and goes back to work.
export function stepDig(w, c) {
  if (!w.dig) return false;
  const coming = S.rockFall > 0 && !(S.rockHeld && S.intro === 'rescue');
  if (coming || !buriedVisible() || buriedOut() >= 1 || !timeToDig(w.x, c.now, c.zone)) {
    w.dig = false;
    w.lunge = 0;
    // and it is nobody's digger any more, unless the rescue is about to walk
    // it out with the one it dug up -- that one is found by this mark
    if (buriedOut() < 1) w.met = false;
    return false;
  }
  // On its feet, on the floor of the yard -- asked for by name. A digger is
  // picked out of a dance, and a body mid-hop under the span of a held rock
  // reads as being on the hill, whose surface is the crest of that rock up in
  // the sky: `stand` would have carried it up there. The dance is put away and
  // the feet keep to the ground at the pace any body takes a slope.
  if (w.jigAt != null && MOVE_KEYS.includes(w.move)) stopJig(w);
  w.y = climbTo(w, feetOn(ways().yard, w.x));
  // Getting there: its own legs, at the pace anybody crosses the yard at.
  const d = w.digTo - w.x;
  if (Math.abs(d) > 1) {
    w.x += Math.sign(d) * Math.min(COMMUTE_PACE * frames(), Math.abs(d));
    w.face = Math.sign(d);
    return true;
  }
  const at = buriedAt();
  w.face = w.x > at.x ? -1 : 1;
  if (c.now >= (w.digAt || 0)) {
    w.digAt = c.now + BURIED_DIG_BEAT_MS;
    w.lunge = 1;                               // it puts its back into it
    // Thrown along the heap like every other spoil, never dropped where it is:
    // dropped here it would lie in the footprint under the next rock.
    spawnSpoil(at.x + rand() * WORKER, at.y + WORKER - P, shadeNear(3), 'rock');
  }
  S.buriedDug = Math.min(1, buriedOut() + c.dt / 1000 / BURIED_DIG_S);
  S.dirty = true;
  return true;
}

// and every so often, while it is in sight, it says something -- and somebody
// comes to dig
export function stepBuried(t) {
  if (!buriedVisible()) {
    // Out of sight is under a rock, and a rock landing on it drives it back in
    // as far as it ever was. Whatever was dug between rocks is undone by the
    // rock, which is the whole of why nobody has got it out.
    S.buriedDug = 0;
    S.buriedSay = null;
    return;
  }
  // Whoever is nearest goes to dig, every time, not only the once the reunion
  // makes a scene of. The scenes send their own (`maybeReunion`, `startRescue`);
  // this covers every ordinary gap between one rock and the next, so the yard
  // is seen trying, and seen failing, all game. While there is a dance to dig
  // in, and while the dance has the dig's walk out left in it (`timeToDig`):
  // with nobody dancing the next rock is made the moment the ground is clear,
  // and a body sent then would be walking into a footprint with a rock already
  // on its way down on it.
  if (!S.intro && !S.rockFall && timeToDig(buriedAt().x, t)) sendDigger();
  if (S.buriedSay && t < S.buriedSay.until) return;
  S.buriedSay = t < (S.buriedSayAt || 0) ? null
    : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
  if (S.buriedSay) S.buriedSayAt = t + INTRO_BEAT * 1.6;
}
