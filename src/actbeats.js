// Acts 3 and 4's beats, played (DESIGN.md, "Acts 3 and 4", "The story, beat
// by beat", and "The portals and the mansion"). The rows -- the order, the
// owner, the chains -- are BEATS' (beats.js); this file is what each one
// does and what sets it off, and owns `S.acts`, the connective facts the two
// acts' own modules (src/after/, src/hell/) do not: whether the player has
// said go on, whether the house stands, the portals, the pair on the road,
// the mansion, the end.
//
// Every beat is a placeholder cutscene on the cutscene system's own terms --
// the letterbox, the camera glided to what it is about, a line in the band
// that is a plain label until the owner writes it -- built as phases: each
// names a frame (a box in the world: a spot, or the pair as they walk, a
// body's height round it at least), holds for a few seconds or until a fact
// lands, and may start something on the way in. The shot frames the box
// (shot.js): glided to and held, or followed as it moves. What the frame is
// on decides the place the camera is in: when the pair walk out of one place
// into the next, the camera follows by the ripple through the portal between
// (view.js, `travel`), landed on the frame they will have over there, never
// a cut; through heaven's gates the ripple plays out of the gateway they
// walk into. The pair themselves only ever walk (ghosts.js). A click or the held space bar
// hurries a beat ACT_HURRY times; nothing in it is cut.
//
// Who a beat holds (the scaffold's open note): every act beat owns the
// camera alone, so the yard, the deep and both acts' places keep running
// under it (call 1). The pair are held by the beat's own facts instead --
// the house's fall walks them indoors before the rock comes down and keeps
// them there (`S.retired`), and from then on they are `S.acts.pair`, whom
// nothing but this file and ghosts.js moves.
//
// The two acts' tracks (after/, hell/) are written beside this one, so every
// call into them is guarded: a beat calls its act's own story body on the way
// in (`AFTER_STORY`, `HELL_STORY`) so facts the track lands there land, and
// reads the track's triggers by name when they exist (`axeDue`,
// `takeCarry`, `cageBroken`), falling back to the scaffold's own facts (the
// gate reached, each barrier's blows) and to `__actOwe`.

import { S } from './state.js';
import { P, WORKER, FINALE_HOUSE_W, AFTER_GATES, HELL_TIERS, ACT_HURRY, ACT_CAPTION_S, ACT_CAPTION_FADE_S,
         ACT_ROCK_FALL_S, ACT_ROCK_DUST_S, ACT_SOUL_LIFT_S, ACT_RIM_PIECES, ACT_RIM_STEP_S,
         ACT_CALL_K, ACT_GOON_WAIT_S, ACT_GOON_FADE_S, MANSION_FILE_AT, MANSION_FILE_W,
         ACT_PEDESTAL_FADE_S, AFTER_SIGN_BEAT, AFTER_SIGN_BEAT_WAIT } from './config.js';
import { frameMs } from './clock.js';
import { afterlifeOn, hellOn, owed } from './acts.js';
import { play, stepShot, release, addScene } from './cutscene.js';
import { travel, gliding, setView, goDeep, goUp, canGoDown } from './view.js';
import { beatDone } from './beats.js';
import { openPortal, freePortal, portalEnd, portalBetween, stepPortals } from './portals.js';
import { sendPair, stepPair, pairAt, placeFor, placeAt, ruinX, yardFeet, cageX, takeLoad, LOOP_CAGE, ghostPace,
         tear, seenAt, atGates, STAIR_POINTS } from './ghosts.js';
import { beginMansion, mansionDone, mansionX, MANSION_W, beginGathering, gathered, stepMansion, stepGathering,
         forgetMansionHands } from './mansion.js';
import { houseX, IN_DONE_S } from './home.js';
import { afterFloor, signFetchX, soulX, soulY } from './after/place.js';
import { godFront, walkSeen } from './after/sky.js';
import { hellFloor } from './hell/place.js';
import * as AFTER from './after/index.js';
import * as REBEL from './after/rebel.js';
import * as STRIKE from './after/strike.js';
import * as HELLPLACE from './hell/place.js';
import * as HELL from './hell/index.js';
import * as BARRIERS from './hell/barriers.js';
import { AFTER_STORY } from './after/story.js';
import { HELL_STORY } from './hell/story.js';

// --- the facts ---------------------------------------------------------------------
export const blankActs = () => ({
  goOn: false,              // the player said go on (call 7)
  house: 'standing',        // 'standing', 'fallen' (the rock on its ruin), 'mansion'
  struck: false,            // the strike has played: its trigger is spent
  road: false,              // the cloud stair is down (`ghost-road`)
  wentDown: false,          // the first descent has played
  portals: { heaven: { k: 0, free: false, down: false, round: false, hand: 1 },
             hell: { k: 0, free: false, down: false, round: false, hand: 1 } },
  pair: null,               // the two of them on the road (ghosts.js)
  carried: 0,               // dust carried down the road, all told
  purse: 0,                 // ...and kept here until hell's mine takes it (`takeCarry`)
  mansion: null,            // the ending's build (mansion.js)
  ended: false              // the gathering done: the end sheet is due
});
export function ensureActs() {
  if (!S.acts) S.acts = blankActs();
  return S.acts;
}
const A = () => S.acts;
const pair = () => (S.acts ? S.acts.pair : null);

// The pair, made where they are: two souls rising out of the ruin.
function makePair() {
  const acts = ensureActs();
  if (acts.pair) return acts.pair;
  const x = ruinX();
  acts.pair = { x, y: yardFeet(x), route: null, leg: 0, hold: null, carry: 0, mode: 'soul', rims: 0, face: 1, lift: 0, inside: 0, at: null };
  return acts.pair;
}
// A pair stood up for a beat owed with no story behind it (a check, a
// scene): put on the act-4 road at the ruin. A played game never needs it.
function pairForAct4(there = null) {
  const p = makePair();
  if (p.mode === 'soul') { p.mode = 'ghost'; p.lift = 1; }
  // still up in the cloud, or on the stair: down the road first, walking
  // (from the stair, down from the step they were making for: `down`'s stair
  // legs from its third on are the climb's run back)
  if (p.at === 'climb' || (p.route === 'climb' && p.leg > 0)) {
    sendPair('down', p.at === 'climb' ? 2 : STAIR_POINTS - p.leg + 1); p.then = 'loop'; return p;
  }
  if (p.y < tear().y - WORKER) { if (p.route !== 'down') { sendPair('down'); p.then = 'loop'; } return p; }
  // on the loop unless already where the beat wants them
  if (!p.route && p.at !== there) sendPair('loop');
  return p;
}

// --- the go-on prompt (call 7) -----------------------------------------------------
// After the finale's sheet is down, the house standing, the pair at home: a
// card over the house, faded in after ACT_GOON_WAIT_S. Pressing it is the
// player's say that act 3 begins.
let goOnFor = 0;
export const goOnDue = () => afterlifeOn() && !!S.retired && beatDone('freedsheet') && !(S.acts && S.acts.goOn)
  && !S.beat.sheet && !S.beat.camera && !S.beat.yard;
export const goOnAlpha = () => Math.max(0, Math.min(1, (goOnFor - ACT_GOON_WAIT_S) / ACT_GOON_FADE_S));
export function sayGoOn() {
  if (!goOnDue() || goOnAlpha() < 1) return false;
  ensureActs().goOn = true;
  return true;
}

// --- the triggers ---------------------------------------------------------------------
// Each act beat's own trigger beside `__actOwe` (beats.js asks `actDue`). A
// chain's first beat reads a fact its chain lands, so a save read back mid-
// chain (which plays the chain again from the beat it was in) never starts
// the chain over.
const lastWall = HELL_TIERS.length - 1;
// Hell's walls (Track B, hell/index.js): the first fallen barrier the story
// has not told (`hellWallDue`, -1 for none) and the cage's fall
// (`cageBroken`); the scaffold's blows count if the track is not there.
const down = i => (typeof BARRIERS.barrierDown === 'function' ? BARRIERS.barrierDown(i) : 0);
const wallDue = i => (typeof HELL.hellWallDue === 'function' ? HELL.hellWallDue() === i : down(i) >= 1);
const cageDown = () => (typeof HELL.cageBroken === 'function' ? !!HELL.cageBroken() : down(lastWall) >= 1);
const TRIGGERS = {
  'house-fall': () => !!A() && A().goOn && !!S.retired && A().house === 'standing',
  'axe': () => beatDone('refuse') && typeof REBEL.axeDue === 'function' && !!REBEL.axeDue(),
  'strike': () => beatDone('refuse') && !(A() && A().struck)
    && (typeof STRIKE.strikeDue === 'function' ? !!STRIKE.strikeDue() : !!S.after && S.after.gate >= AFTER_GATES.length),
  'haunt': () => beatDone('ghost-road') && !!pair() && pair().mode === 'soul',
  'descend': () => beatDone('haunt') && !!A() && !A().wentDown && !!pair() && pair().route === 'loop' && pair().leg >= 1,
  'unchain': () => beatDone('descend') && cageDown(),
  // The first sign (config, AFTER_SIGN_BEAT): finished, and none planted yet.
  'first-sign': () => AFTER_SIGN_BEAT === 1 && beatDone('refuse') && !!S.after && S.after.signs.length === 0
    && (S.after.stock.signs > 0 || S.after.bodies.some(b => b.load === 'sign'))
};
for (let i = 0; i < lastWall; i++) TRIGGERS[`wall-${i + 1}`] = () => beatDone('wall-first') && wallDue(i);
export const actDue = key => !!(TRIGGERS[key] && TRIGGERS[key]());

// --- the phases' frames ------------------------------------------------------------------
// Each mark is a spot -- across, the middle of what is watched; down, the top
// of a body standing there -- and the frame round it is a body's height over
// it and the ground under it, so the floor a beat plays on is never under the
// foot band. The place a frame is in is read off its spot (ghosts.js,
// `placeFor`).
const around = s => ({ x: s.x - WORKER * 2, y: s.y - WORKER, w: WORKER * 4, h: WORKER * 2 + P, place: placeFor(s.y) });
const spotted = spot => () => around(spot());
const houseSpot = () => ({ x: houseX() + FINALE_HOUSE_W * P / 2, y: S.groundY - WORKER });
// God, as the camera frames him: his stage square under him.
const throne = () => ({ x: godFront(), y: afterFloor() - WORKER });
// The pair where they are seen: where they walk, or, crossing between two
// places, where they come out (ghosts.js, `seenAt`).
const pairSpot = () => { const s = seenAt(); return s ? { x: s.x + WORKER / 2, y: s.y } : houseSpot(); };
const onPair = spotted(pairSpot);
const tearAbove = () => { const e = portalEnd('heaven', 'after'); return { x: e.x, y: afterFloor() - WORKER }; };
// Hell's chambers, where the camera holds each (hell/place.js).
const chamber = i => spotted(() => ({ x: typeof HELLPLACE.chamberFocusX === 'function' ? HELLPLACE.chamberFocusX(i) : cageX(),
                                       y: hellFloor() - WORKER }));
const mansionMid = () => ({ x: mansionX() + MANSION_W * P / 2, y: S.groundY - WORKER });
const files = () => ({ x: (MANSION_FILE_AT + MANSION_FILE_W * 2) * P, y: S.groundY - WORKER });
const atHouse = spotted(houseSpot), atThrone = spotted(throne), atTear = spotted(tearAbove),
      atMansion = spotted(mansionMid), atFiles = spotted(files);
const storyOf = key => (key in AFTER_STORY ? AFTER_STORY : HELL_STORY);

// --- the first sign, followed (config, AFTER_SIGN_BEAT) -----------------------------------
// What the beat has landed is the act's, saved (`S.after.firstSign`): the
// carrier taking the first sign out, the sign it planted, the walk-outs
// there were then, and the first soul since. A reload plays the beat again
// from its first phase, and each phase skips what has landed. Where the
// camera last saw who it follows, and when each wait began, are this
// session's.
const fs = () => (S.after.firstSign ??= { carrier: null, planted: null, outs: null, soul: null });
const bodyById = id => (S.after && id != null ? S.after.bodies.find(b => b.id === id) || null : null);
// A body or a sign where it is drawn: on the main plane, or out on God's
// stage (after/sky.js, `walkSeen`); a spot is its top's middle.
const seenSpot = (x, y) => { const v = walkSeen(x, y, S.camX + S.viewW / 2); return { x: v.x, y: v.y - WORKER }; };
const look = { last: null, since: 0 };
const waitFrom = () => { look.since = S.after ? S.after.t : 0; };
const waited = () => !!S.after && S.after.t - look.since > AFTER_SIGN_BEAT_WAIT;
const atRack = spotted(() => ({ x: signFetchX(), y: afterFloor() - WORKER }));
const plantedSpot = () => { const q = S.after.signs.find(o => o.id === fs().planted); return q ? seenSpot(soulX(q.f) + P / 2, soulY(q.r) + P * 2) : null; };
const onSeen = spotted(() => look.last || plantedSpot() || { x: signFetchX(), y: afterFloor() - WORKER });
// Held while it is followed: read where it is drawn.
const watch = id => { const w = bodyById(id); if (w) look.last = seenSpot(w.x, w.y); return w; };

// The house's fall: the two of them walked indoors first (nothing teleports),
// then held there; the rock, then the house gone under it.
function walkThemIn() {
  const r = S.retired;
  if (!r) return;
  r.left = 1e12;
  if (r.mode !== 'in') { r.mode = 'in'; r.u = 0; }
}
const indoors = () => !S.retired || (S.retired.mode === 'in' && (S.retired.u || 0) >= IN_DONE_S);
function houseFalls() {
  ensureActs().house = 'fallen';
}
const fallen = () => !!A() && A().house !== 'standing';

const beginAct3 = () => { if (typeof AFTER.beginAfter === 'function') AFTER.beginAfter(); };
const beginAct4 = () => { if (typeof HELL.beginHell === 'function') HELL.beginHell(); };

// The pair up on the pedestal, and on their way down off it to the road.
const onPedestal = () => pairAt('pedestal');
function leavePedestal() {
  const p = makePair();
  if (pairAt('down') || p.route === 'down' || (p.route === 'off' && p.then === 'down')) return;
  if (pairAt('pedestal') || p.route === 'pedestal') { sendPair('off'); p.then = 'down'; }
  else sendPair('down');
}

// The phases of each beat. `frame` is what the camera frames (and so the
// place it stands in), and `move` 'follow' for a frame that walks; `s` a hold
// in seconds, or `until` a fact; `say` the band's line; `enter`, `step` and
// `end` what it does on the way.
const BODIES = {
  'house-fall': [
    { frame: atHouse, enter: walkThemIn, until: indoors, skipIf: fallen },
    { frame: atHouse, s: ACT_ROCK_FALL_S, skipIf: fallen, end: houseFalls },
    { frame: atHouse, s: ACT_ROCK_DUST_S, enter: () => openPortal('heaven'), say: 'act-house-fall', skipIf: () => !!pair() },
    { frame: onPair, s: ACT_SOUL_LIFT_S, enter: makePair, step: u => { pair().lift = Math.min(1, u / ACT_SOUL_LIFT_S); }, skipIf: () => !!pair() && pair().lift >= 1 },
    // up the cloud stair to the gates, followed; they stand open as the two come to them
    { frame: onPair, move: 'follow', enter: () => { makePair().lift = 1; if (!pairAt('climb')) sendPair('climb'); }, until: () => pairAt('climb'),
      skipIf: () => !!pair() && (pairAt('rise') || pair().route === 'rise' || placeAt(pair().y) !== 'yard') },
    // through the open gates, the camera after them by the ripple, and out
    // of heaven's onto the cloud floor
    { frame: onPair, move: 'follow', enter: () => { makePair().lift = 1; if (!pairAt('rise')) sendPair('rise'); },
      until: () => pairAt('rise') && S.view === 'after' && !gliding() }
  ],
  'arrive': [{ frame: onPair, s: ACT_CAPTION_S, enter: beginAct3, say: 'act-arrive' }],
  'meet-god': [{ frame: atThrone, s: ACT_CAPTION_S + 1, say: 'act-meet-god' }],
  // To the camp, then up onto the pedestal, where the speech is theirs from
  // then on (after/bubbles.js reads `at === 'pedestal'`).
  'refuse': [
    { frame: onPair, move: 'follow', enter: () => sendPair('camp'), until: () => pairAt('camp'), say: 'act-refuse',
      skipIf: () => onPedestal() || (!!pair() && pair().route === 'pedestal') },
    { frame: onPair, move: 'follow', enter: () => { if (!onPedestal()) sendPair('pedestal'); }, until: () => onPedestal() && pair().top >= 1 },
    { frame: onPair, s: 1.5 }
  ],
  'axe': [{ frame: onPair, s: ACT_CAPTION_S, say: 'act-axe' }],
  // The first sign, followed (config, AFTER_SIGN_BEAT): at the workshop's
  // rack until a carrier takes it up; after it across the camp and out to
  // God's crowd until it is planted; held on it; then after the first soul
  // it wins, walking back to the union. No words.
  'first-sign': [
    { frame: atRack, enter: () => { look.last = null; waitFrom(); }, skipIf: () => fs().carrier != null || fs().planted != null,
      until: () => { const c = S.after.bodies.find(b => b.load === 'sign'); if (c) fs().carrier = c.id; return !!c || waited(); } },
    { frame: onSeen, move: 'follow', enter: waitFrom, skipIf: () => fs().carrier == null || fs().planted != null,
      until: () => {
        const c = watch(fs().carrier), done = !c || c.load !== 'sign';
        if (done && S.after.signs.length) fs().planted = S.after.signs[S.after.signs.length - 1].id;
        return done || waited();
      } },
    { frame: onSeen, s: 2.5, enter: () => { look.last = plantedSpot() || look.last; }, skipIf: () => fs().outs != null,
      end: () => { fs().outs = S.after.bodies.filter(b => b.state === 'out').map(b => b.id); } },
    { frame: onSeen, move: 'follow', enter: waitFrom,
      until: () => {
        const f = fs();
        if (f.soul == null) {
          const w = S.after.bodies.find(b => b.state === 'out' && !(f.outs || []).includes(b.id));
          if (w) f.soul = w.id;
          return waited();
        }
        const w = watch(f.soul);
        return !w || w.state !== 'out' || waited();
      } }
  ],
  'strike': [{ frame: atThrone, s: ACT_CAPTION_S + 1, enter: () => { ensureActs().struck = true; }, say: 'act-strike' }],
  'unmask': [{ frame: atThrone, s: ACT_CAPTION_S + 1, enter: () => openPortal('hell'), say: 'act-unmask' }],
  'hell-told': [{ frame: atThrone, s: ACT_CAPTION_S + 1, say: 'act-hell-told' }],
  'ghost-road': [{ frame: atTear, s: ACT_CAPTION_S, enter: () => { ensureActs().road = true; freePortal('heaven'); }, say: 'act-ghost-road' }],
  'haunt': [
    // Off the pedestal first: the road's drawing faded back on over the
    // pedestal's, then down its face and away to the tear.
    { frame: onPair, move: 'follow', enter: () => { pair().off = true; }, until: () => !(pair().top > 0), skipIf: () => !onPedestal() },
    { frame: onPair, move: 'follow', enter: leavePedestal, until: () => pairAt('down'), say: 'act-haunt' },
    { frame: onPair, s: 1.5, end: () => { const p = pair(); p.mode = 'ghost'; freePortal('hell'); sendPair('loop'); takeLoad(p); } }
  ],
  'descend': [
    { frame: onPair, move: 'follow', enter: () => { ensureActs().wentDown = true; pairForAct4('none'); }, until: () => placeAt(pair().y) === 'hell' },
    { frame: onPair, s: ACT_CAPTION_S, enter: beginAct4, say: 'act-descend' }
  ],
  'wall-first': [{ frame: chamber(0), s: ACT_CAPTION_S, say: 'act-wall-first' }],
  'unchain': [
    { frame: onPair, move: 'follow', enter: () => { beginMansion(); const p = pairForAct4('cage'); p.hold = 'cage'; }, until: () => pairAt('cage') },
    { frame: onPair, s: ACT_CAPTION_S, say: 'act-unchain' }
  ],
  'alive': [{ frame: onPair, s: ACT_RIM_PIECES * ACT_RIM_STEP_S + 1, say: 'act-alive',
              step: u => { const p = pair(); p.rims = Math.max(p.rims || 0, Math.min(ACT_RIM_PIECES, Math.floor(u / ACT_RIM_STEP_S))); },
              end: () => { const p = pair(); p.rims = ACT_RIM_PIECES; p.mode = 'alive'; } }],
  'home-again': [
    { frame: onPair, move: 'follow', say: 'act-home-again', skipIf: () => pairAt('home') || pairAt('door') || A().house === 'mansion',
      enter: () => {
        beginMansion();
        const p = pairForAct4(pair() && pair().at === 'cage' ? 'cage' : 'home');
        p.hold = 'home';
        if (p.at === 'cage') { p.route = 'loop'; p.leg = LOOP_CAGE + 1; p.at = null; }
      },
      until: () => pairAt('home') },
    { frame: atMansion, until: mansionDone },
    { frame: onPair, move: 'follow', enter: () => { if (!pairAt('door')) sendPair('door'); }, until: () => pairAt('door'), skipIf: () => A().house === 'mansion' },
    { frame: onPair, s: 2, skipIf: () => A().house === 'mansion', step: u => { pair().inside = Math.min(1, u / 2); }, end: () => { pair().inside = 1; A().house = 'mansion'; } },
    { frame: atFiles, enter: beginGathering, until: gathered, say: 'act-mansion', end: () => { A().ended = true; } }
  ]
};
// A wall down: the story told it (`tellWall`), and the camera glides from the
// chamber it closed to the one it opened (Track B's ask), the line over that.
for (let i = 0; i < lastWall; i++) {
  BODIES[`wall-${i + 1}`] = [
    { frame: chamber(i), s: 1, enter: () => { if (typeof HELL.tellWall === 'function') HELL.tellWall(i); } },
    { frame: chamber(i + 1), s: ACT_CAPTION_S, say: 'act-wall', args: { n: i + 1 } }
  ];
}
export const ACT_BEAT_KEYS = Object.keys(BODIES);

// --- the runner ----------------------------------------------------------------------
// The beat playing: its key, phase, seconds into it, how hurried, the place
// its scene was last framed in, and whether it is on its way out. This
// session's: a reload plays the beat again from its first phase, and the
// phases skip what has landed.
let run = null;
let box = null, moving = 'glide';
let caption = null;
export const actCaption = () => caption;
// The beat playing and its phase, for the readout (`__shot`): null with none.
export const actPhase = () => (run && !run.out ? run.i : null);
const registered = new Set();
function scene(key) {
  if (registered.has(key)) return;
  registered.add(key);
  // The phase's frame, as the runner last read it, and how it moves.
  addScene(key, { s: 1e9, frame: () => box, move: () => moving,
                  front: ['acts-yard', 'acts-bodies', 'acts-road-bodies', 'acts-gates', 'acts-after', 'acts-after-bodies', 'acts-hell', 'acts-hell-bodies',
                          'acts-deep', 'acts-deep-bodies', 'mansion', 'home', 'workers'] });
}

function begin(key, t) {
  ensureActs();
  run = { key, i: 0, u: 0, hurry: 1, framed: null, out: false };
  const story = storyOf(key);
  if (story[key] && typeof story[key].enter === 'function') story[key].enter(t);
  enterPhase(BODIES[key]);
}
function enterPhase(phases) {
  for (;;) {
    const ph = phases[run.i];
    if (!ph) return;
    if (ph.skipIf && ph.skipIf()) { run.i++; continue; }
    if (ph.enter) ph.enter();
    return;
  }
}

// Through the next portal toward `place`: the nearer places in between are
// each a ripple of their own. A way that cannot be taken (no wizards'
// portal in a yard stood up for a check) is a straight cut.
const HOPS = { yard: { after: 'after', deep: 'deep', hell: 'deep' }, after: { yard: 'yard', deep: 'yard', hell: 'yard' },
               deep: { yard: 'yard', after: 'yard', hell: 'hell' }, hell: { deep: 'deep', yard: 'deep', after: 'deep' } };
// The last hop lands on `x`, the frame's own middle over there (shot.js,
// rule 5), so the shot has nothing to move once the ripple has landed.
function hop(place, x = null) {
  const next = HOPS[S.view] && HOPS[S.view][place];
  if (!next || (next === 'deep' && !canGoDown())) { setView(place); return; }
  const key = portalBetween(S.view, next);
  if (key) { if (!travel(next, key, next === place ? x : null)) setView(next); return; }
  if (S.view === 'yard' && canGoDown()) goDeep();
  else if (S.view === 'deep') goUp();
  if (!gliding()) setView(next);
}

function step(key, next, t) {
  if (!run || run.key !== key) begin(key, t);
  if (run.out) { caption = null; return stepShot(t); }
  const phases = BODIES[key];
  const ph = phases[run.i];
  if (ph) {
    const fr = ph.frame();
    box = fr; moving = ph.move || 'glide';
    // A place the camera cannot stand in (the deep before the wizards'
    // portal, in a yard stood up for a check) is watched from where it is.
    const want = fr.place;
    const place = want === 'deep' && !canGoDown() ? S.view : want;
    if (S.view !== place) {
      if (!gliding()) hop(place, fr.x + fr.w / 2);
      run.framed = null;
      return true;
    }
    if (gliding()) return true;
    if (run.framed !== place) { scene(key); play(key); run.framed = place; }
    stepShot(t);
    const dt = frameMs() / 1000 * run.hurry;
    run.u += dt;
    if (ph.step) ph.step(run.u, dt);
    const hold = ph.s ?? ACT_CAPTION_S;
    caption = ph.say ? { id: ph.say, args: ph.args || null, a: captionAlpha(run.u, ph.until ? Infinity : hold) } : null;
    const done = ph.until ? ph.until() : run.u >= hold;
    if (!done) return true;
    if (ph.end) ph.end();
    // the next phase glides the camera from here to what it looks at
    run.i++; run.u = 0; run.framed = null;
    enterPhase(phases);
    if (run.i < phases.length) return true;
  }
  // Played through. A beat a chain carries on from hands its scene straight
  // to the next, the bands staying up; the last lets go.
  caption = null;
  if (next && !beatDone(next)) { run = null; return false; }
  run.out = true;
  release();
  return stepShot(t);
}
// The house's fall as the drawing reads it: how far the rock has come down
// (0..1) and how far its dust has gone (0..1), while the beat plays them;
// null otherwise (render/portals.js draws the rock at rest off `S.acts.house`).
export function fallNow() {
  if (!run || run.key !== 'house-fall' || run.out) return null;
  if (run.i === 1) return { rock: Math.min(1, run.u / ACT_ROCK_FALL_S), dust: 0 };
  if (run.i === 2) return { rock: 1, dust: Math.min(1, run.u / ACT_ROCK_DUST_S) };
  if (run.i === 0) return { rock: -1, dust: 0 };
  return null;
}
const captionAlpha = (u, hold) => Math.max(0, Math.min(1, u / ACT_CAPTION_FADE_S, (hold - u) / ACT_CAPTION_FADE_S));

// A beat's body for its row in BEATS: entered, stepped, hurried.
export function actBody(key, next) {
  return {
    enter: t => begin(key, t),
    step: t => step(key, next, t),
    // A click or the held space bar: faster, never cut (the walk still has
    // to be walked). False: the beat carries on.
    skip: () => { if (run && run.key === key) run.hurry = ACT_HURRY; return false; }
  };
}

// --- the frame --------------------------------------------------------------------------
// One frame of the connective tissue, on screen or not (game.js, `STEPS`):
// the go-on card's clock, the portals opening, the pair walking, the
// mansion's job and its gathering.
export function stepActs(c) {
  goOnFor = goOnDue() ? goOnFor + c.dt / 1000 : 0;
  if (!S.acts || !afterlifeOn()) return;
  // Heaven's gates are a way back down from the arrival on, at any time (the
  // owner, 2026-10-19), and so for a save made up there before they were.
  if (beatDone('arrive') && !S.acts.portals.heaven.free) freePortal('heaven');
  stepPortals(c, atGates());
  const p = pair();
  // The road's drawing of the two of them over the pedestal's: faded off
  // once they stand on it, back on when they are to climb down.
  if (p) {
    const want = p.at === 'pedestal' && !p.off ? 1 : 0, was = p.top || 0;
    if (was !== want) p.top = want > was ? Math.min(1, was + c.dt / 1000 / ACT_PEDESTAL_FADE_S) : Math.max(0, was - c.dt / 1000 / ACT_PEDESTAL_FADE_S);
    if (p.off && p.at !== 'pedestal' && p.route !== 'pedestal') p.off = false;
  }
  if (p && p.route) {
    const base = ghostPace();
    const k = (p.hold ? ACT_CALL_K : 1) * (run ? run.hurry : 1);
    stepPair(base * k * c.dt / 1000);
  }
  // The mansion is a standing job from the start of the cage's barrier
  // (the coordinator's ask, 2026-10-17): the last wall told, the cage the
  // one left, so it goes up through a real stretch of play.
  if (hellOn() && !A().mansion && beatDone(`wall-${lastWall}`)) beginMansion();
  if (hellOn()) { stepMansion(c); stepGathering(c); }
}

// The yard's boards in act 3 (call 5): shut from the house's fall until the
// pair come back down as ghosts; open again in act 4.
export const boardsShut = () => afterlifeOn() && fallen() && !beatDone('haunt');

// --- the save ---------------------------------------------------------------------------
// `S.acts` written whole, null until the player says go on; read over a
// blank, so a field added later comes back empty. The beat's run and the
// builders' hands are this session's (`forgetActs`).
export const SAVE = {
  fields: ['acts'],
  write(out) { out.acts = S.acts ? JSON.parse(JSON.stringify(S.acts)) : null; },
  read(s) {
    const a = s.acts;
    if (!a || typeof a !== 'object') { S.acts = null; }
    else {
      const b = blankActs();
      S.acts = { ...b, ...a, portals: { heaven: { ...b.portals.heaven, ...(a.portals?.heaven || {}) },
                                        hell: { ...b.portals.hell, ...(a.portals?.hell || {}) } } };
    }
    forgetActs();
  },
  blank() { S.acts = null; forgetActs(); goOnFor = 0; }
};
export function forgetActs() {
  run = null; caption = null;
  forgetMansionHands();
}
