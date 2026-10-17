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
// looks at something (a spot, or the pair as they walk), holds for a few
// seconds or until a fact lands, and may start something on the way in.
// What a phase looks at decides the place the camera is in: when the pair
// walk out of one place into the next, the camera follows by the ripple
// through the portal between (view.js, `travel`), never a cut. The pair
// themselves only ever walk (ghosts.js). A click or the held space bar
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
         ACT_ROCK_FALL_S, ACT_ROCK_DUST_S, ACT_SOUL_LIFT_S, ACT_SOUL_PX_S, ACT_RIM_PIECES, ACT_RIM_STEP_S,
         ACT_CALL_K, ACT_GOON_WAIT_S, ACT_GOON_FADE_S, MANSION_FILE_AT, MANSION_FILE_W } from './config.js';
import { frameMs } from './clock.js';
import { afterlifeOn, hellOn, owed } from './acts.js';
import { play, stepShot, release, addScene } from './cutscene.js';
import { travel, gliding, setView, goDeep, goUp, canGoDown } from './view.js';
import { beatDone } from './beats.js';
import { openPortal, freePortal, portalEnd, portalBetween, stepPortals } from './portals.js';
import { sendPair, stepPair, pairAt, placeFor, placeAt, ruinX, yardFeet, cageX, takeLoad, LOOP_CAGE, ghostPace, tear } from './ghosts.js';
import { beginMansion, mansionDone, mansionX, MANSION_W, beginGathering, gathered, stepMansion, stepGathering,
         forgetMansionHands } from './mansion.js';
import { houseX, IN_DONE_S } from './home.js';
import { afterX1, afterFloor } from './after/place.js';
import { hellFloor } from './hell/place.js';
import * as AFTER from './after/index.js';
import * as FAITH from './after/faith.js';
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
function pairForAct4() {
  const p = makePair();
  if (p.mode === 'soul') { p.mode = 'ghost'; p.lift = 1; }
  // still up in the cloud: down the road first, walking
  if (p.y < tear().y - WORKER) { if (p.route !== 'down') { sendPair('down'); p.then = 'loop'; } return p; }
  if (!p.route && p.at !== 'cage' && p.at !== 'home') sendPair('loop');
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
  'axe': () => beatDone('refuse') && typeof FAITH.axeDue === 'function' && !!FAITH.axeDue(),
  'strike': () => beatDone('refuse') && !(A() && A().struck)
    && (typeof STRIKE.strikeDue === 'function' ? !!STRIKE.strikeDue() : !!S.after && S.after.gate >= AFTER_GATES.length),
  'haunt': () => beatDone('ghost-road') && !!pair() && pair().mode === 'soul',
  'descend': () => beatDone('haunt') && !!A() && !A().wentDown && !!pair() && pair().route === 'loop' && pair().leg >= 1,
  'unchain': () => beatDone('descend') && cageDown()
};
for (let i = 0; i < lastWall; i++) TRIGGERS[`wall-${i + 1}`] = () => beatDone('wall-first') && wallDue(i);
export const actDue = key => !!(TRIGGERS[key] && TRIGGERS[key]());

// --- the phases' marks ------------------------------------------------------------------
const houseSpot = () => ({ x: houseX() + FINALE_HOUSE_W * P / 2, y: S.groundY - WORKER });
const throne = () => ({ x: afterX1() - P * 60, y: afterFloor() - WORKER });
const onPair = () => { const p = pair(); return p ? { x: p.x + WORKER / 2, y: p.y } : houseSpot(); };
const tearAbove = () => { const e = portalEnd('heaven', 'after'); return { x: e.x, y: afterFloor() - WORKER }; };
// Hell's chambers, where the camera holds each (hell/place.js).
const chamber = i => () => ({ x: typeof HELLPLACE.chamberFocusX === 'function' ? HELLPLACE.chamberFocusX(i) : cageX(),
                                y: hellFloor() - WORKER });
const mansionMid = () => ({ x: mansionX() + MANSION_W * P / 2, y: S.groundY - WORKER });
const files = () => ({ x: (MANSION_FILE_AT + MANSION_FILE_W * 2) * P, y: S.groundY - WORKER });
const storyOf = key => (key in AFTER_STORY ? AFTER_STORY : HELL_STORY);

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

// The phases of each beat. `at` is what the camera looks at (and so the place
// it stands in); `s` a hold in seconds, or `until` a fact; `say` the band's
// line; `enter`, `step` and `end` what it does on the way.
const BODIES = {
  'house-fall': [
    { at: houseSpot, enter: walkThemIn, until: indoors, skipIf: fallen },
    { at: houseSpot, s: ACT_ROCK_FALL_S, skipIf: fallen, end: houseFalls },
    { at: houseSpot, s: ACT_ROCK_DUST_S, enter: () => openPortal('heaven'), say: 'act-house-fall', skipIf: () => !!pair() },
    { at: onPair, s: ACT_SOUL_LIFT_S, enter: makePair, step: u => { pair().lift = Math.min(1, u / ACT_SOUL_LIFT_S); }, skipIf: () => !!pair() && pair().lift >= 1 },
    { at: onPair, enter: () => { makePair().lift = 1; if (!pairAt('rise')) sendPair('rise'); }, until: () => pairAt('rise') }
  ],
  'arrive': [{ at: onPair, s: ACT_CAPTION_S, enter: beginAct3, say: 'act-arrive' }],
  'meet-god': [{ at: throne, s: ACT_CAPTION_S + 1, say: 'act-meet-god' }],
  'refuse': [
    { at: onPair, enter: () => sendPair('camp'), until: () => pairAt('camp'), say: 'act-refuse' },
    { at: onPair, s: 1.5 }
  ],
  'axe': [{ at: onPair, s: ACT_CAPTION_S, say: 'act-axe' }],
  'strike': [{ at: throne, s: ACT_CAPTION_S + 1, enter: () => { ensureActs().struck = true; }, say: 'act-strike' }],
  'unmask': [{ at: throne, s: ACT_CAPTION_S + 1, enter: () => openPortal('hell'), say: 'act-unmask' }],
  'hell-told': [{ at: throne, s: ACT_CAPTION_S + 1, say: 'act-hell-told' }],
  'ghost-road': [{ at: tearAbove, s: ACT_CAPTION_S, enter: () => { ensureActs().road = true; freePortal('heaven'); }, say: 'act-ghost-road' }],
  'haunt': [
    { at: onPair, enter: () => { makePair(); if (!pairAt('down')) sendPair('down'); }, until: () => pairAt('down'), say: 'act-haunt' },
    { at: onPair, s: 1.5, end: () => { const p = pair(); p.mode = 'ghost'; freePortal('hell'); sendPair('loop'); takeLoad(p); } }
  ],
  'descend': [
    { at: onPair, enter: () => { ensureActs().wentDown = true; pairForAct4(); }, until: () => placeAt(pair().y) === 'hell' },
    { at: onPair, s: ACT_CAPTION_S, enter: beginAct4, say: 'act-descend' }
  ],
  'wall-first': [{ at: chamber(0), s: ACT_CAPTION_S, say: 'act-wall-first' }],
  'unchain': [
    { at: onPair, enter: () => { beginMansion(); const p = pairForAct4(); p.hold = 'cage'; }, until: () => pairAt('cage') },
    { at: onPair, s: ACT_CAPTION_S, say: 'act-unchain' }
  ],
  'alive': [{ at: onPair, s: ACT_RIM_PIECES * ACT_RIM_STEP_S + 1, say: 'act-alive',
              step: u => { const p = pair(); p.rims = Math.max(p.rims || 0, Math.min(ACT_RIM_PIECES, Math.floor(u / ACT_RIM_STEP_S))); },
              end: () => { const p = pair(); p.rims = ACT_RIM_PIECES; p.mode = 'alive'; } }],
  'home-again': [
    { at: onPair, say: 'act-home-again',
      enter: () => {
        beginMansion();
        const p = pairForAct4();
        p.hold = 'home';
        if (p.at === 'cage') { p.route = 'loop'; p.leg = LOOP_CAGE + 1; p.at = null; }
      },
      until: () => pairAt('home') },
    { at: mansionMid, until: mansionDone },
    { at: onPair, enter: () => { if (!pairAt('door')) sendPair('door'); }, until: () => pairAt('door') },
    { at: onPair, s: 2, step: u => { pair().inside = Math.min(1, u / 2); }, end: () => { pair().inside = 1; A().house = 'mansion'; } },
    { at: files, enter: beginGathering, until: gathered, say: 'act-mansion', end: () => { A().ended = true; } }
  ]
};
// A wall down: the story told it (`tellWall`), and the camera glides from the
// chamber it closed to the one it opened (Track B's ask), the line over that.
for (let i = 0; i < lastWall; i++) {
  BODIES[`wall-${i + 1}`] = [
    { at: chamber(i), s: 1, enter: () => { if (typeof HELL.tellWall === 'function') HELL.tellWall(i); } },
    { at: chamber(i + 1), s: ACT_CAPTION_S, say: 'act-wall', args: { n: i + 1 } }
  ];
}
export const ACT_BEAT_KEYS = Object.keys(BODIES);

// --- the runner ----------------------------------------------------------------------
// The beat playing: its key, phase, seconds into it, how hurried, the place
// its scene was last framed in, and whether it is on its way out. This
// session's: a reload plays the beat again from its first phase, and the
// phases skip what has landed.
let run = null;
let spot = 0;
let caption = null;
export const actCaption = () => caption;
const registered = new Set();
function scene(key) {
  if (registered.has(key)) return;
  registered.add(key);
  addScene(key, { s: 1e9, spot: () => spot,
                  front: ['acts-yard', 'acts-bodies', 'acts-after', 'acts-after-bodies', 'acts-hell', 'acts-hell-bodies',
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
function hop(place) {
  const next = HOPS[S.view] && HOPS[S.view][place];
  if (!next || (next === 'deep' && !canGoDown())) { setView(place); return; }
  const key = portalBetween(S.view, next);
  if (key) { if (!travel(next, key)) setView(next); return; }
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
    const at = ph.at();
    // A place the camera cannot stand in (the deep before the wizards'
    // portal, in a yard stood up for a check) is watched from where it is.
    const want = placeFor(at.y);
    const place = want === 'deep' && !canGoDown() ? S.view : want;
    if (S.view !== place) {
      if (!gliding()) hop(place);
      run.framed = null;
      return true;
    }
    if (gliding()) return true;
    spot = at.x;
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
  stepPortals(c);
  const p = pair();
  if (p && p.route) {
    const base = p.route === 'rise' ? ACT_SOUL_PX_S : ghostPace();
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
