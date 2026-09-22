// The opening, and the reason any of this is happening.
//
// Two squares walk out of the house and stand talking, close in, and a
// boulder comes down out of the sky on one of them. The one left standing
// gets up and starts digging; everything after is one body trying to get its
// mate out. **The one underneath is still alive**, lodged in the ground under
// every rock, dug up a little between rocks and driven back in by the next;
// only a rock held overhead gives the digging the time it needs. The reunion
// after the first rock and the rescue under the dome are the same scene
// machinery. See DESIGN.md, "The opening".
//
// Which beat is playing, and when, is the table in beats.js; this file is the
// bodies: what each beat does to the pair, the crew and the view for as long
// as it has the yard. Every phase function here is a declaration, not a
// const, because beats.js reads them at load and imports this file in a ring.

import { P, WORKER, GRAV, INTRO_ZOOM, INTRO_LEAD, INTRO_CHAT_MS, INTRO_HEART_MS, INTRO_DOWN_MS,
         INTRO_UP_MS, INTRO_BEAT, INTRO_APART, INTRO_HURL,
         INTRO_SHOW_DUST, INTRO_SHOW_MAX,
         MEET_IN_MS, MEET_MS, PART_MS,
         COMMUTE_PACE, ROCK_CLEAR,
         BURIED_DIG_S, BURIED_DIG_BEAT_MS, BURIED_DIG_LONE, BURIED_DIG_LEAD_MS, DUCK_PACE } from './config.js';
import { S, pit } from './state.js';
import { now, frames } from './clock.js';
import { makeBoulder, dropZone } from './rock.js';
import { spawnChip, spawnSpoil, aim } from './dust.js';
import { shadeNear } from './grid.js';
import { walkY, setZoom, clampCam, lookAt, openingCamX } from './world.js';
import { rebalance } from './staffing.js';
import { syncWorkers } from './crew.js';
import { wayAt, ways, feetOn, climbTo } from './route.js';
import { stopJig, MOVE_KEYS } from './crew/dance.js';
import { rand } from './rng.js';
import { reducedMotion } from './prefs.js';
import { doorAt } from './house.js';
import { beatDone, beatRunning, ownsYard, markDone, startBeat } from './beats.js';

// Where the two of them stand: either side of the spot the rock lands on.
// The one on the left is the one it lands on.
const pairX = i => Math.round((S.cx + (i ? INTRO_APART : -INTRO_APART) - WORKER / 2) / P) * P;

// The opening's six beats, in the order they play; skipping any of them is
// skipping all of them.
export const OPENING = ['leave', 'chat', 'fall', 'down', 'up', 'show'];

// The opening and the rescue, on the save (persist.js, `SAVERS`): who is
// under the rock and whether they are out. Last on the list, because a yard
// that has not seen the opening through is stood at the door before the
// first frame is drawn, after everything else is back.
export const SAVE = {
  fields: ['buried', 'rescued'],
  write(out) {
    out.buried = S.buried;
    out.rescued = S.rescued;
  },
  read(s) {
    S.camLockY = null;
    S.pair = [];
    S.buried = !!s.buried;
    S.rescued = !!s.rescued;
    if (S.rescued) S.buried = false;
    if (!S.beatsDone.includes('show')) startBeat('leave');
  },
  blank() {
    S.rescued = false;
    // The opening's pair, stood at the door: a new game, and a game never
    // played, are the same yard.
    startBeat('leave');
  }
};

// The pair's word balloons, and the view, for one frame of any beat the
// opening has. Every phase's step goes through here first.
function frame(t, key) {
  hold(t, key);
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;
}

// A fresh game, and nothing has happened yet.
export function startIntro() {
  if (beatDone('show')) return;
  // A second playing in one process (a reset, or the checks) would otherwise
  // find the throw mark from the first still set and never throw.
  S.introThrew = 0;
  S.introCut = false;
  // They come out of the house: the house draws its first two rooms before
  // anybody is hired (house.js, `roomsToday`) so that there is a door.
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
  clampCam();       // and written through to the page's scroller, or the next frame reads the old seat back
}

// Straight to the yard as it stands after all of it, for the dev hooks and
// the checks. The player's own skip (skip.js) comes through with `played`
// off and keeps the one difference: the body that carries on is the one they
// were watching, stood where it stood.
export function skipIntro(played = true) {
  if (beatDone('show')) return;
  // The survivor: the one on the right until the rock comes, and first from
  // then (`crush`), so it is the last that is not marked as under it.
  const stood = S.pair.filter(b => !b.under);
  const from = played || !stood.length ? null : stood[stood.length - 1].x;
  if (beatRunning('leave')) arriveChat();
  if (beatRunning('leave') || beatRunning('chat')) crush();
  S.pair = [];
  S.crew = 1;
  S.rockhands = 1;
  // A yard that skips the opening has been played from, so the rows gated on
  // a first drag are open; a player who skipped has not dragged yet.
  if (played) S.seenDrag = true;
  finish();
  const w = S.workers[0];
  if (from != null && w) { w.x = from; w.y = walkY(from + WORKER / 2); }
  S.shopStale = true;              // the rows that flag opens are on the board from the first frame
}

// The player's skip of any of the opening's beats: the same yard, the body
// where they were watching it.
export function cutOpening() { skipIntro(false); }

// --- the second act -----------------------------------------------------------
// After the first rock, once: somebody runs over and digs at the one in the
// ground, they come up a little, and the next rock comes down on them.
export function startMeet(t) {
  S.introAt = t;
  S.introSaid = 0;
  S.introHeart = 0;
  S.introCut = false;

  // Not scripted people: one of the crew, on the roster's own walk, swinging
  // at the ground the way it swings at everything (`sendDigger`).
  sendDigger();
}

// --- and, once, somebody gets out ---------------------------------------------
// The dome holds a rock overhead, somebody digs with no rock coming to stop
// them, and the one underneath walks clear and joins the crew.
export function startRescue(t) {
  S.introAt = t;
  S.introSaid = 0;
  S.introCut = false;
  S.rescueTo = 0;                              // nobody walks anywhere until it is dug out
  sendDigger();
}

// Dug out, and up out of the ground: the walk out from under, and the two of
// them.
function getOut(t) {
  const at = buriedAt();
  S.introAt = t;
  S.introSaid = 0;
  // Clear of the footprint the rock is going to be set down on, toward the
  // pit, which is where the crew are.
  const half = Math.round((S.gw / 2) * P);
  S.rescueTo = at.x + half + ROCK_CLEAR + WORKER;
  // The dome's first hold is a cutscene (cutscene.js) that overrules this pan
  // while it runs; the pan is kept for a hold with no scene on it (a skipped
  // one, or an older save).
  lookAt(S.rescueTo + WORKER / 2);
  // It stops being buried the moment it starts walking, marked now rather
  // than at the end so a save mid-walk cannot play the beat a second time.
  S.buried = false;
  S.buriedSay = null;
  S.rescued = true;
  S.pair = [{ x: at.x, y: at.y, say: null }];

  // Whoever dug them out goes with them, or if nobody could come, whoever is
  // nearest comes to meet them.
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
}

// The player's skip. The rescue finishes its dig and keeps its walk: a square
// under the rock one frame and stood clear the next is the one thing this
// game never shows, so the beat carries on (false) until the walk is walked.
export function cutRescue(t) {
  if (S.introCut) return false;
  S.introCut = true;
  if (S.buried) { S.buriedDug = 1; getOut(t); }
  return false;
}

// One frame of it: the digging, the walk out, then the two of them, then back
// to work. True while there is more of it.
export function stepRescue(t) {
  frame(t, 'rescue');
  // Still in the ground, and the rock waits overhead while somebody digs. If
  // nobody can come (the whole crew aloft, or through a door) it works
  // itself loose, slower, rather than hanging the rock there forever.
  if (S.buried) {
    if (!sendDigger())
      S.buriedDug = Math.min(1, buriedOut() + (frames() / 60) * BURIED_DIG_LONE / BURIED_DIG_S);
    if (buriedOut() < 1) { S.introAt = t; return true; }
    getOut(t);
    return true;
  }
  const b = S.pair[0];
  if (!b) return false;
  const d = S.rescueTo - b.x;
  if (Math.abs(d) > 1) {
    // its own legs, at the pace anybody crosses the yard at
    b.x += Math.sign(d) * Math.min(COMMUTE_PACE * frames(), Math.abs(d));
    b.y = walkY(b.x + WORKER / 2);
    S.introAt = t;                             // the beat starts when it arrives
    return true;
  }
  b.y = walkY(b.x + WORKER / 2);
  if (!S.introCut && t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    b.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
    const who = S.workers.find(w => w.met);
    if (who && !who.walking) who.say = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  if (!S.introCut && t - S.introAt < MEET_MS) return true;

  // And then it is one of the crew, standing where it walked to: the body you
  // were watching is the body that carries on.
  const had = new Set(S.workers);
  S.crew++;
  rebalance();
  syncWorkers();
  const fresh = S.workers.find(w => !had.has(w));
  if (fresh) { fresh.x = b.x; fresh.y = walkY(b.x + WORKER / 2); }
  for (const w of S.workers) { w.met = false; w.say = null; }
  S.pair = [];
  return false;
}

// Together, and digging: the square in the ground, and whoever was nearest
// digging at it (`stepDig`); the rest of the crew step clear and watch. True
// while they are.
export function stepMeet(t) {
  frame(t, 'meet');
  // Held to the end of the meeting, said once rather than a frame at a time:
  // the dance reads this to know when the yard stops watching, and a horizon
  // re-armed every frame is not one a hop can be planned against.
  S.danceUntil = S.introAt + MEET_MS;
  // The one in the ground says the other thing; the one digging has its
  // hands full.
  if (t >= (S.introSaid || 0)) {
    S.introSaid = t + INTRO_BEAT * 1.4;
    S.buriedSay = { mark: 'heart', until: t + INTRO_BEAT * 1.3 };
  }
  return t - S.introAt < MEET_MS;
}

// The player's skip of the meeting: the rock comes down and the view lets go.
export function cutMeet(t) { parted(t); letGo(); }

// and the sky opens again, on somebody half dug out
export function parted(t) {
  S.introAt = t;
  S.buriedSay = null;
  for (const w of S.workers) { w.met = false; w.say = null; }
  S.danceUntil = 0;
  S.boulderNo++;                               // the next one, and bigger, like any other
  makeBoulder(true);
}

// It lands on them again, the crew scatter, and the view lets go. From here
// on nothing ever stops for a rock.
export function stepPart(t) {
  frame(t, 'part');
  if (t - S.introAt < PART_MS) return true;
  letGo();
  return false;
}

export function letGo() {
  S.camLockY = null;
  setZoom(1);
  S.danceUntil = 0;
}

const ease = k => 1 - Math.pow(1 - k, 3);

// The view, for as long as the opening owns it: right in on the pair, and
// easing back out over the last stretch. Nothing else in this game moves the
// zoom but the cutscenes.
function hold(t, key) {
  // The show walks the view with the body at the yard's own size. The rescue
  // happens in a working yard, and whether it is pulled in on is the shield
  // cutscene's call.
  if (key === 'show' || key === 'rescue') return;

  // The walk out: the seat starts on the door and eases after the pair's
  // midpoint, stopping at the spot where the chat holds it. Under reduced
  // motion every beat is watched from where it ends.
  if (key === 'leave') {
    setZoom(INTRO_ZOOM);
    S.camLockY = S.groundY - S.viewH * 0.66;
    const mid = reducedMotion() || !S.pair.length ? S.cx
              : S.pair.reduce((a, b) => a + b.x + WORKER / 2, 0) / S.pair.length;
    const want = Math.min(mid, S.cx) - S.viewW / 2;
    // ...and never so far behind that they leave the frame: the lag is a
    // distance, and a phone's frame is not wide enough to hold it.
    S.camX = reducedMotion() ? want
           : Math.max(S.camX + (want - S.camX) * 0.06, want - S.viewW * INTRO_LEAD);
    S.camTo = null;
    clampCam();
    return;
  }

  // How far out the view is, nought being right in on them. The opening pulls
  // out at the end; the second act pulls back in and then out again. Under
  // reduced motion the easing goes and the view changes only where one beat
  // hands over to the next.
  const k0 = reducedMotion() ? Infinity : (t - S.introAt);
  const out = key === 'up' ? ease(Math.min(1, k0 / INTRO_UP_MS))
            : key === 'meet' ? 1 - ease(Math.min(1, k0 / MEET_IN_MS))
            : key === 'part' ? ease(Math.min(1, k0 / PART_MS))
            : 0;
  const k = INTRO_ZOOM + (1 - INTRO_ZOOM) * out;

  // The ground line sits low in the frame, and is walked back to the yard's
  // own height over the same stretch the zoom is: dropping forty pixels in
  // one frame at the end is a hitch you feel.
  S.camLockY = null;
  setZoom(k);
  const close = S.groundY - S.viewH * 0.66;
  const rest = S.worldH - S.viewH;
  S.camLockY = close + (rest - close) * out;
  S.camX = S.cx - S.viewW / 2;
  S.camTo = null;
  clampCam();
}

// Out of the door and over to the spot, talking as they go, at the pace
// anybody crosses the yard at. The chat starts when the second of them is
// stood at the spot: true while either is still walking.
export function stepLeave(t) {
  frame(t, 'leave');
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
  return !there;
}

// Stood at the spot, and the chat begins on its own clock from here.
export function arriveChat() {
  for (const [i, b] of S.pair.entries()) { b.x = pairX(i); b.y = walkY(b.x + WORKER / 2); }
  S.introAt = now();
}

// Talking, and every so often one of them says the other thing; true until
// the chat has had its time.
export function stepChat(t) {
  frame(t, 'chat');
  for (const b of S.pair) b.y = walkY(b.x + WORKER / 2);
  say(t);
  return t - S.introAt < INTRO_CHAT_MS;
}

// One of them says something, in turn. The walk and the chat share it.
function say(t) {
  if (t < (S.introSaid || 0)) return;
  S.introSaid = t + INTRO_BEAT;
  const who = S.pair.find(b => b.turn) || S.pair[0];
  if (!who) return;
  // A heart now and then rather than every time: something said every
  // second is a label.
  const heart = t - (S.introHeart || 0) > INTRO_HEART_MS;
  if (heart) S.introHeart = t;
  who.say = heart
    ? { mark: 'heart', until: t + INTRO_BEAT * 1.6 }
    : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
  for (const b of S.pair) b.turn = b !== who;
}

// And it comes down. The one on the left is under it; the one on the right
// is thrown clear. Nobody is hired here: the first body in this game is
// somebody who was already standing there.
export function crush() {
  const b = S.pair[1];                         // the one on the right
  const u = S.pair[0];                         // the one on the left, under it
  // The left-hand one is still standing there while the rock is on its way
  // down, and goes into the ground on the frame it lands (`stepFall`); the
  // flung one stays first, which is where every later beat looks for it.
  if (u) { u.say = null; u.under = true; }
  S.pair = [b, u].filter(Boolean);
  S.buried = true;
  S.introAt = now();
  makeBoulder(true);                           // out of the sky, on to the spot

  // Thrown clear as it comes, not after the rock lands: they stand a good
  // deal closer together than the rock is wide, so it is already flying
  // while the rock is in the air and comes down outside the footprint.
  if (b) {
    const clear = S.cx + (S.gw * P) / 2 + P * 5 - b.x;
    b.vy = -INTRO_HURL;
    b.vx = clear / ((2 * INTRO_HURL) / FALL_G);   // there in the time the lob takes
    b.say = null;
    b.flung = true;
  }
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

// While the rock is in the air, nothing else happens: true until it has
// landed and the one thrown clear is on its back.
export function stepFall(t) {
  frame(t, 'fall');
  const b = S.pair[0];
  fly(b);
  // Landed: the one it came down on is under it now, and drawn as the
  // lodged square from here (`buriedVisible`) rather than as a body.
  if (!(S.rockFall > 0)) S.pair = S.pair.filter(p => !p.under);
  return S.rockFall > 0 || !(b && b.down);
}

// Landed, and lying there for a moment doing nothing at all.
export function startDown(t) { S.introAt = t; }
export function stepDown(t) {
  frame(t, 'down');
  fly(S.pair[0]);
  return t - S.introAt < INTRO_DOWN_MS;
}

// Up, staring at it, while the view pulls back out.
export function startUp(t) {
  const b = S.pair[0];
  if (b) {
    b.down = false;
    b.flung = false;
    b.say = { mark: 'bang', until: t + INTRO_UP_MS * 0.7 };
  }
  S.introAt = t;
}
export function stepUp(t) {
  frame(t, 'up');
  const b = S.pair[0];
  if (b) b.y = walkY(b.x + WORKER / 2);
  return t - S.introAt < INTRO_UP_MS;
}

// --- and then it shows you ----------------------------------------------------
// The loop played through once with the real crew: a body goes at the rock,
// pixels come off, and one is thrown into the hole. It *is* the game; the
// opening only decides when to change the body's mind and where to point the
// camera.
export function begin(t) {
  // The body that walks to the rock is *this* body: a rockhand made from
  // nothing put a fresh square on the rock in the frame the watched one
  // disappeared.
  const from = S.pair[0] ? S.pair[0].x : S.cx;
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
}

// It knocks a couple of cells off and throws one into the hole. Thrown, not
// carried: a grain thrown properly carries the six hundred pixels, and the
// first half-minute of the game spent watching somebody walk is dreadful.
// True while it is still being shown.
export function stepShow(t) {
  frame(t, 'show');
  const w = S.workers[0];
  if (!w) { finish(); return false; }

  // Watching the body while it works and the grain once it is in the air.
  // Under reduced motion the view sits halfway between the rock and the
  // mouth, the same target the throw is aimed at.
  //
  // Well inside the mouth rather than just over the lip: an arc has a
  // spread, and aimed at the edge half of them come down short.
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

  // Enough off the rock, and it throws one from up on the crest. It stays a
  // rockhand while it does it: handed to the hauling rules mid-scene, it
  // would go and fetch something, which is the walk this is here to be rid
  // of.
  if (S.floorGrains >= INTRO_SHOW_DUST && !S.introThrew) {
    const fx = w.x + WORKER / 2, fy = w.y + P * 2;
    const v = aim(fx, fy, into, P);
    spawnChip(fx, fy, v.vx, v.vy, 4);
    const thrown = S.chips[S.chips.length - 1];
    if (thrown) thrown.intro = true;
    w.lunge = 1;                                      // it puts its back into it
    S.introThrew = t;
  }

  // Over when the grain is in the hole, or when it has plainly missed.
  if (S.stored >= 1 || (S.introThrew && t - S.introThrew > 6000) || t - S.introAt >= INTRO_SHOW_MAX) {
    finish();
    return false;
  }
  return true;
}

// And it is left carrying (DESIGN.md, "The opening"): a one-body yard with
// that body on the rock is a yard where nothing is carried, the counter sits
// at 1, and no row ever lights. A body on no roster job is a hauler.
function finish() {
  markDone(...OPENING);
  S.buried = true;
  S.pair = [];
  S.crew = Math.max(1, S.crew);
  // The show's body is retasked here, not remade, so it stands where it
  // stood and walks from there.
  S.rockhands = 0;
  rebalance();
  syncWorkers();
  S.camLockY = null;               // the yard has its own view back
  setZoom(1);
  // Back to the opening seat: the show walked the view out to the hole, and
  // the call to build the bench, the first thing the player is asked to
  // press, was being pressed with the bench out of shot.
  lookAt(openingCamX() + S.viewW / 2);
}

// --- the one underneath -------------------------------------------------------
// Visible while there is no rock on the spot, including while one is still
// on its way down: a rock exists the instant it is made, seconds before it
// arrives, and going by "is there a rock" made the square wink out while the
// next was still in the air.
// The first rock is the one exception: while it is in the air, the one it is
// coming down on is still stood there as a body (`crush`), so the lodged
// square is not drawn until it lands.
export const buriedVisible = () =>
  S.buried && !beatRunning('fall') &&
  (S.rockFall > 0 || !S.boulder.some(row => row.some(v => v)));

// Where the square lives: the spot every rock lands on. It cannot move.
export function buriedAt() {
  const x = Math.round((S.cx - WORKER / 2) / P) * P;
  return { x, y: walkY(x + WORKER / 2) };
}

// How far out of the ground it is: nought is packed in to its middle, one is
// stood on the ground.
export const buriedOut = () => Math.max(0, Math.min(1, S.buriedDug || 0));

// Somebody goes to dig: the nearest free body on the ground, marked `dig`,
// which is the stage in crew/step.js that has it swing at the ground once
// it is there. True if somebody is on it, already or from now.
export function sendDigger() {
  if (S.workers.some(w => w.dig)) return true;
  const at = buriedAt();
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft || w.walking) continue;
    // On the floor of the yard: under the dome the rockhands stand on the
    // rock it is holding, and a body that came down off that would climb
    // through the air under a hill for as long as the climb took.
    if (wayAt(w.x, w.y).key !== 'yard') continue;
    const d = Math.abs(w.x - at.x);
    if (d < near) { near = d; who = w; }
  }
  if (!who) return false;
  // Its own short walk along the floor, not a commute: a commute routes a
  // body to a spot under the hill's footprint *over the hill*, and under the
  // dome the hill is a rock held up in the sky.
  who.digTo = at.x + (who.x > at.x ? WORKER * 1.7 : -WORKER * 1.7);
  who.met = true;
  who.dig = true;
  who.digAt = 0;
  return true;
}

// Whether there is still time to dig. The next rock comes when the dance ends
// and falls far faster than a body walks out of a footprint, so the digger
// digs while what is left of the dance covers its walk to the nearer edge,
// and downs tools then. A scene holds the rock itself; a held rock is not
// coming.
function timeToDig(x, t, zone = dropZone()) {
  if (ownsYard()) return true;
  if (!zone) return t < S.danceUntil;
  const out = Math.min(x + WORKER - zone.from, zone.to - x) + WORKER;
  const need = (out / DUCK_PACE) * (1000 / 60) + BURIED_DIG_LEAD_MS;
  return S.danceUntil - t > need;
}

// One frame of somebody digging: true while it is the whole of the body's
// frame. It stops when a rock is coming down on the ground it is digging in,
// and then the body is the crew's again.
export function stepDig(w, c) {
  if (!w.dig) return false;
  const coming = S.rockFall > 0 && !(S.rockHeld && beatRunning('rescue'));
  if (coming || !buriedVisible() || buriedOut() >= 1 || !timeToDig(w.x, c.now, c.zone)) {
    w.dig = false;
    w.lunge = 0;
    // and it is nobody's digger any more, unless the rescue is about to walk
    // it out with the one it dug up -- that one is found by this mark
    if (buriedOut() < 1) w.met = false;
    return false;
  }
  // On its feet, on the floor of the yard, by name: a digger picked out of a
  // dance mid-hop under a held rock reads as being on the hill, whose surface
  // is the crest of that rock up in the sky, and `stand` would carry it there.
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
    // Thrown along the heap like every other spoil: dropped here it would
    // lie in the footprint under the next rock.
    spawnSpoil(at.x + rand() * WORKER, at.y + WORKER - P, shadeNear(3), 'rock');
  }
  S.buriedDug = Math.min(1, buriedOut() + c.dt / 1000 / BURIED_DIG_S);
  return true;
}

// One frame longer under there. The clock runs from the rock that put them
// there until `getOut` clears `buried`, seen or not, because a rock on top
// of them is part of how long the rescue took. On the frame's `dt`, not the
// wall: a held yard is not time they spent waiting.
export function stepUnder(dt) {
  if (!S.buried) return;
  S.buriedMs += dt;
}

// and every so often, while it is in sight, it says something -- and somebody
// comes to dig
export function stepBuried(t) {
  if (!buriedVisible()) {
    // A rock landing on it drives it back in as far as it ever was.
    S.buriedDug = 0;
    S.buriedSay = null;
    return;
  }
  // Whoever is nearest goes to dig in every ordinary gap between rocks, not
  // only the scenes' (`startMeet`, `startRescue`), so the yard is seen
  // trying all game. Only while the dance has the dig's walk out left in it:
  // with nobody dancing the next rock is made the moment the ground is
  // clear, and a body sent then walks into a footprint with a rock on its
  // way down.
  if (!ownsYard() && !S.rockFall && timeToDig(buriedAt().x, t)) sendDigger();
  if (S.buriedSay && t < S.buriedSay.until) return;
  S.buriedSay = t < (S.buriedSayAt || 0) ? null
    : { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: t + INTRO_BEAT * 0.9 };
  if (S.buriedSay) S.buriedSayAt = t + INTRO_BEAT * 1.6;
}
